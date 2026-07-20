import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';

// PRD §Generazione delle ricette: TTL 24-48h, 36h picked as the midpoint.
const CACHE_TTL_HOURS = 36;
const MODEL = 'gpt-5.6-luna';

const RECIPE_CATEGORIES = [
  'primo',
  'secondo',
  'contorno',
  'insalata',
  'zuppa',
  'dolce',
  'colazione',
  'altro',
] as const;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    recipes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          category: { type: 'string', enum: RECIPE_CATEGORIES },
          prep_time_minutes: { type: 'number' },
          difficulty: { type: 'string', enum: ['facile', 'media', 'difficile'] },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                note: { type: 'string', description: 'e.g. quantity/preparation note' },
                have: {
                  type: 'boolean',
                  description: "true if already present in the user's inventory",
                },
              },
              required: ['name', 'note', 'have'],
              additionalProperties: false,
            },
          },
          steps: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'category', 'prep_time_minutes', 'difficulty', 'ingredients', 'steps'],
        additionalProperties: false,
      },
    },
  },
  required: ['recipes'],
  additionalProperties: false,
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const userId = ctx.jwtClaims?.sub;
    if (!userId) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }

    // RLS-scoped: only ever returns this caller's own rows.
    const { data: inventory, error: inventoryError } = await ctx.supabase
      .from('inventory_items')
      .select('name, category_id');

    if (inventoryError) {
      return Response.json({ error: inventoryError.message }, { status: 500 });
    }

    if (!inventory || inventory.length === 0) {
      return Response.json({ recipes: [] });
    }

    const normalized = inventory
      .map((item) => ({
        name: item.name.trim().toLowerCase(),
        categoryId: item.category_id ?? 'none',
      }))
      .sort((a, b) => (a.categoryId + a.name).localeCompare(b.categoryId + b.name));

    const ingredientsHash = await sha256Hex(
      normalized.map((item) => `${item.categoryId}:${item.name}`).join('|'),
    );

    const { data: cached } = await ctx.supabaseAdmin
      .from('recipe_cache')
      .select('response, expires_at')
      .eq('ingredients_hash', ingredientsHash)
      .maybeSingle();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return Response.json(cached.response);
    }

    const ingredientNames = [...new Set(normalized.map((item) => item.name))];

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content:
              'Suggerisci 3-5 ricette realizzabili prevalentemente con questi ingredienti disponibili: ' +
              `${ingredientNames.join(', ')}. ` +
              'Per ogni ricetta elenca tutti gli ingredienti necessari (anche quelli mancanti), ' +
              "indicando per ciascuno se è già disponibile nell'elenco fornito (have: true) oppure no " +
              '(have: false). Fornisci anche i passaggi di preparazione in italiano.',
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'recipes', strict: true, schema: RESPONSE_SCHEMA },
        },
      }),
    });

    if (!openAiResponse.ok) {
      return Response.json(
        { error: `OpenAI request failed: ${await openAiResponse.text()}` },
        { status: 500 },
      );
    }

    const openAiJson = await openAiResponse.json();
    const result = JSON.parse(openAiJson.choices[0].message.content);

    // Best-effort: a logging failure must not block returning the recipes
    // that were already successfully generated (see Fase 8 §Dashboard/alert
    // costi AI).
    try {
      await ctx.supabaseAdmin.from('openai_usage_log').insert({
        function_name: 'generate-recipes',
        user_id: userId,
        model: MODEL,
        prompt_tokens: openAiJson.usage?.prompt_tokens ?? 0,
        completion_tokens: openAiJson.usage?.completion_tokens ?? 0,
        total_tokens: openAiJson.usage?.total_tokens ?? 0,
      });
    } catch {
      // Ignored — see comment above.
    }

    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
    await ctx.supabaseAdmin
      .from('recipe_cache')
      .upsert(
        { ingredients_hash: ingredientsHash, response: result, expires_at: expiresAt },
        { onConflict: 'ingredients_hash' },
      );

    return Response.json(result);
  }),
};
