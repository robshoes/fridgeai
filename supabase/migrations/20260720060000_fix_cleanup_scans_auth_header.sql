-- The previous migration sent the secret key via `Authorization: Bearer`,
-- but auth: 'secret' functions are gated by the API Gateway on the
-- `apikey` header instead (confirmed by a direct manual invocation --
-- `Authorization` alone returned 401 Invalid credentials, `apikey`
-- returned 200). Reschedule the job with the corrected header.
select cron.unschedule('cleanup-old-fridge-scans');

select cron.schedule(
  'cleanup-old-fridge-scans',
  '0 3 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/cleanup-scans',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'cleanup_secret_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
