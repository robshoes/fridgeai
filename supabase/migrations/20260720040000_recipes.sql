-- Technical cache, never touched by the client directly (PRD §Generazione
-- delle ricette / §Controllo dei costi AI): RLS enabled with zero policies
-- means default-deny for every role except the Edge Function's service
-- role client, which bypasses RLS entirely.
create table public.recipe_cache (
  id uuid primary key default gen_random_uuid(),
  ingredients_hash text not null unique,
  response jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.recipe_cache enable row level security;

-- Fixes a gap in docs/03-architecture.md: the documented schema listed
-- only `user_id` as a composite PK, which would allow a single favorite
-- ever (each new favorite would overwrite the last one via PK conflict).
-- A dedicated id lets a user save more than one recipe.
create table public.user_recipe_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipe_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.user_recipe_favorites enable row level security;

create policy "user_recipe_favorites_select_own"
  on public.user_recipe_favorites for select
  using (user_id = auth.uid());

create policy "user_recipe_favorites_insert_own"
  on public.user_recipe_favorites for insert
  with check (user_id = auth.uid());

create policy "user_recipe_favorites_delete_own"
  on public.user_recipe_favorites for delete
  using (user_id = auth.uid());
