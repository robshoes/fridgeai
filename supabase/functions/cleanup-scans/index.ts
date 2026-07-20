import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';

// PRD §Privacy: original photos are deleted after 30 days; inventory,
// AI results and technical metadata (the scan row itself) are kept.
const RETENTION_DAYS = 30;

export default {
  fetch: withSupabase({ auth: 'secret' }, async (_req, ctx) => {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // image_path is nulled out below once processed, so this query only
    // ever sees scans that still have a file to delete — keeps the daily
    // job cheap indefinitely instead of re-scanning all-time history.
    const { data: expiredScans, error: selectError } = await ctx.supabaseAdmin
      .from('scans')
      .select('id, image_path')
      .not('image_path', 'is', null)
      .lt('created_at', cutoff);

    if (selectError) {
      return Response.json({ error: selectError.message }, { status: 500 });
    }

    if (!expiredScans || expiredScans.length === 0) {
      return Response.json({ deleted: 0 });
    }

    const paths = expiredScans.map((scan) => scan.image_path as string);

    // Storage API, not a raw SQL delete on storage.objects: that would
    // only remove the metadata row and orphan the actual file.
    const { error: removeError } = await ctx.supabaseAdmin.storage
      .from('fridge-scans')
      .remove(paths);

    if (removeError) {
      return Response.json({ error: removeError.message }, { status: 500 });
    }

    const { error: updateError } = await ctx.supabaseAdmin
      .from('scans')
      .update({ image_path: null })
      .in(
        'id',
        expiredScans.map((scan) => scan.id),
      );

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    return Response.json({ deleted: paths.length });
  }),
};
