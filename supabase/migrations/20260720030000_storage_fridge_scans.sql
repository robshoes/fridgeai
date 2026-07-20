-- Private bucket for fridge photos (PRD §Privacy: never public, originals
-- deleted after 30 days by a scheduled job added in Fase 6).
insert into storage.buckets (id, name, public)
values ('fridge-scans', 'fridge-scans', false)
on conflict (id) do nothing;

-- Path convention: {user_id}/{scan_id}.jpg — enforced by checking the
-- first path segment against auth.uid().
create policy "fridge_scans_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'fridge-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "fridge_scans_select_own"
  on storage.objects for select
  using (
    bucket_id = 'fridge-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "fridge_scans_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'fridge-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
