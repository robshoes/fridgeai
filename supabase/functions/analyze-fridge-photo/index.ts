import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';
import { encodeBase64 } from '@std/encoding/base64';

// PRD §Controllo dei costi AI: flat 10 scans/day per user, no bonus mechanism.
const BASE_DAILY_LIMIT = 10;
// PRD §Gestione errori AI: items below this confidence are flagged for
// manual review instead of silently trusted.
const CONFIDENCE_THRESHOLD = 0.7;
const MODEL = 'gpt-5.6-luna';

type ScanRow = {
  id: string;
  user_id: string;
  image_path: string;
  status: string;
};

type DetectedItem = {
  name: string;
  category: string | null;
  quantity: number;
  unit_family: 'weight' | 'volume' | 'count';
  confidence: number;
};

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: {
            type: ['string', 'null'],
            description:
              'Best-matching category name from the provided list, or null if none fits.',
          },
          quantity: { type: 'number' },
          unit_family: { type: 'string', enum: ['weight', 'volume', 'count'] },
          confidence: { type: 'number', description: '0 to 1' },
        },
        required: ['name', 'category', 'quantity', 'unit_family', 'confidence'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
};

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const userId = ctx.jwtClaims?.sub;
    if (!userId) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { scan_id } = await req.json();
    if (!scan_id) {
      return Response.json({ error: 'scan_id is required' }, { status: 400 });
    }

    const { data: scan, error: scanError } = await ctx.supabaseAdmin
      .from('scans')
      .select('id, user_id, image_path, status')
      .eq('id', scan_id)
      .single<ScanRow>();

    if (scanError || !scan || scan.user_id !== userId) {
      return Response.json({ error: 'scan not found' }, { status: 404 });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayStartIso = todayStart.toISOString();

    const { count: scansToday } = await ctx.supabaseAdmin
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStartIso);

    const dailyLimit = BASE_DAILY_LIMIT;

    if ((scansToday ?? 0) > dailyLimit) {
      await ctx.supabaseAdmin.from('scans').update({ status: 'failed' }).eq('id', scan_id);
      return Response.json({ error: 'rate_limited', remaining: 0, dailyLimit }, { status: 429 });
    }

    await ctx.supabaseAdmin.from('scans').update({ status: 'processing' }).eq('id', scan_id);

    const { data: categories } = await ctx.supabaseAdmin
      .from('categories')
      .select('id, name, unit_family');

    try {
      const { data: imageBlob, error: downloadError } = await ctx.supabaseAdmin.storage
        .from('fridge-scans')
        .download(scan.image_path);

      if (downloadError || !imageBlob) {
        throw new Error(downloadError?.message ?? 'could not download image');
      }

      const imageBase64 = encodeBase64(await imageBlob.arrayBuffer());
      const categoryNames = (categories ?? []).map((category) => category.name);

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
              content: [
                {
                  type: 'text',
                  text:
                    'Riconosci gli alimenti visibili in questa foto di un frigorifero/dispensa. ' +
                    `Per la categoria usa uno di questi nomi esatti, se pertinente: ${categoryNames.join(', ')}. ` +
                    'Se un alimento non corrisponde a nessuna di queste categorie, usa null. ' +
                    "Stima la quantità nell'unità base della famiglia (grammi per weight, millilitri per volume, pezzi per count).",
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
                },
              ],
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'fridge_items', strict: true, schema: RESPONSE_SCHEMA },
          },
        }),
      });

      if (!openAiResponse.ok) {
        throw new Error(`OpenAI request failed: ${await openAiResponse.text()}`);
      }

      const openAiJson = await openAiResponse.json();
      const content = JSON.parse(openAiJson.choices[0].message.content) as {
        items: DetectedItem[];
      };

      const categoryIdByName = new Map((categories ?? []).map((c) => [c.name, c.id]));

      const scanItemsToInsert = content.items.map((item) => ({
        scan_id,
        detected_name: item.name,
        category_id: item.category ? (categoryIdByName.get(item.category) ?? null) : null,
        quantity_estimate: item.quantity,
        unit_family: item.unit_family,
        confidence: item.confidence,
        status: 'pending' as const,
      }));

      if (scanItemsToInsert.length > 0) {
        const { error: insertError } = await ctx.supabaseAdmin
          .from('scan_items')
          .insert(scanItemsToInsert);
        if (insertError) throw new Error(insertError.message);
      }

      await ctx.supabaseAdmin
        .from('scans')
        .update({ status: 'completed', raw_ai_response: openAiJson })
        .eq('id', scan_id);

      // Best-effort: a logging failure must not turn an otherwise-successful
      // scan into a reported failure (see Fase 8 §Dashboard/alert costi AI).
      try {
        await ctx.supabaseAdmin.from('openai_usage_log').insert({
          function_name: 'analyze-fridge-photo',
          user_id: userId,
          model: MODEL,
          prompt_tokens: openAiJson.usage?.prompt_tokens ?? 0,
          completion_tokens: openAiJson.usage?.completion_tokens ?? 0,
          total_tokens: openAiJson.usage?.total_tokens ?? 0,
        });
      } catch {
        // Ignored — see comment above.
      }

      return Response.json({
        items: scanItemsToInsert,
        lowConfidenceThreshold: CONFIDENCE_THRESHOLD,
      });
    } catch (error) {
      await ctx.supabaseAdmin.from('scans').update({ status: 'failed' }).eq('id', scan_id);
      return Response.json(
        { error: error instanceof Error ? error.message : 'unknown error' },
        { status: 500 },
      );
    }
  }),
};
