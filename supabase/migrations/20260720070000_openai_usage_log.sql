-- Fase 8: token-usage visibility per OpenAI call, to validate that the
-- rate limits + recipe caching in PRD §Controllo dei costi AI are actually
-- keeping usage bounded. Written only by Edge Functions (service role),
-- never read by the client — RLS enabled with zero policies, same pattern
-- as recipe_cache.
create table public.openai_usage_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  function_name text not null,
  user_id uuid references auth.users (id) on delete set null,
  model text not null,
  prompt_tokens integer not null,
  completion_tokens integer not null,
  total_tokens integer not null
);

alter table public.openai_usage_log enable row level security;

-- Daily rollup per function/model, queryable directly in Supabase Studio's
-- SQL editor as the Fase 8 cost-monitoring "dashboard" — no separate BI
-- tool needed for an MVP with a single-digit number of Edge Functions.
-- security_invoker so the view is subject to the base table's RLS (default
-- deny for anon/authenticated) instead of running as the view owner.
create view public.openai_usage_daily
  with (security_invoker = true)
  as
  select
    date_trunc('day', created_at) as day,
    function_name,
    model,
    count(*) as calls,
    sum(prompt_tokens) as prompt_tokens,
    sum(completion_tokens) as completion_tokens,
    sum(total_tokens) as total_tokens
  from public.openai_usage_log
  group by 1, 2, 3
  order by 1 desc, 2, 3;
