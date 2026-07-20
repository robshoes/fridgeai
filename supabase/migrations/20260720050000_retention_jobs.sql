-- Allows clearing the image reference once the underlying file is
-- purged by the retention job below, without losing the rest of the
-- scan record (PRD §Privacy: keep inventory/AI results/metadata, drop
-- the photo itself after 30 days). Also makes the retention job
-- idempotent: a cleared image_path means "already processed."
alter table public.scans alter column image_path drop not null;

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- recipe_cache is a plain table with no external storage attached, so a
-- direct SQL delete is correct and sufficient here (unlike fridge-scans
-- below, which needs the Storage API — see cleanup-scans Edge Function).
select cron.schedule(
  'cleanup-expired-recipe-cache',
  '0 3 * * *',
  $$ delete from public.recipe_cache where expires_at < now(); $$
);

-- Deleting rows from storage.objects directly would only remove the
-- metadata and orphan the actual file in the storage backend, so image
-- retention has to go through the Storage API via the cleanup-scans
-- Edge Function instead of a plain SQL delete. The secret key and
-- project URL live in Supabase Vault (created out-of-band via
-- `supabase db query --linked`, never committed to this repo).
select cron.schedule(
  'cleanup-old-fridge-scans',
  '0 3 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/cleanup-scans',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cleanup_secret_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
