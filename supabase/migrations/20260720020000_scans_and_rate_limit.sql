create type public.scan_status as enum ('pending', 'processing', 'completed', 'failed');
create type public.scan_item_status as enum ('pending', 'confirmed', 'edited', 'rejected');

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_path text not null,
  status public.scan_status not null default 'pending',
  raw_ai_response jsonb,
  created_at timestamptz not null default now()
);

alter table public.scans enable row level security;

create policy "scans_select_own"
  on public.scans for select
  using (user_id = auth.uid());

create policy "scans_insert_own"
  on public.scans for insert
  with check (user_id = auth.uid());

-- No update/delete policy for the client: only the analyze-fridge-photo
-- Edge Function (service role, bypasses RLS) transitions scan status.

create table public.scan_items (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans (id) on delete cascade,
  detected_name text not null,
  category_id uuid references public.categories (id),
  quantity_estimate numeric not null,
  unit_family public.unit_family not null,
  confidence numeric not null,
  status public.scan_item_status not null default 'pending'
);

alter table public.scan_items enable row level security;

create policy "scan_items_select_own"
  on public.scan_items for select
  using (exists (
    select 1 from public.scans
    where scans.id = scan_items.scan_id and scans.user_id = auth.uid()
  ));

-- The client is only ever allowed to move status pending -> confirmed /
-- edited / rejected (see PRD §Gestione errori AI); detected_name/quantity
-- stay as the AI's raw output so accuracy can be measured over time.
create policy "scan_items_update_own_status"
  on public.scan_items for update
  using (exists (
    select 1 from public.scans
    where scans.id = scan_items.scan_id and scans.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.scans
    where scans.id = scan_items.scan_id and scans.user_id = auth.uid()
  ));

-- Bonus scans granted by watching a rewarded ad (PRD §Monetizzazione
-- pubblicitaria: +5 scans per ad, max 2/day). The insert policy enforces
-- the daily cap at the database level so a client can't grant itself more.
create table public.scan_bonus_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount int not null default 5,
  granted_at timestamptz not null default now()
);

alter table public.scan_bonus_grants enable row level security;

create policy "scan_bonus_grants_select_own"
  on public.scan_bonus_grants for select
  using (user_id = auth.uid());

create policy "scan_bonus_grants_insert_own_capped"
  on public.scan_bonus_grants for insert
  with check (
    user_id = auth.uid()
    and (
      select count(*) from public.scan_bonus_grants
      where user_id = auth.uid() and granted_at >= date_trunc('day', now())
    ) < 2
  );

-- Deferred from the Fase 2 migration: scans didn't exist yet.
alter table public.inventory_items
  add column source_scan_id uuid references public.scans (id);
