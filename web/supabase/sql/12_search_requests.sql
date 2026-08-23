create table if not exists public.search_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  request_type text not null default 'pedido_personalizado',
  category text not null default '',
  operation text not null default '',
  budget_currency text not null default 'USD',
  budget_min numeric,
  budget_max numeric,
  zones text not null default '',
  details text not null default '',
  contact_name text not null default '',
  contact_phone text not null default '',
  contact_email text not null default '',
  status text not null default 'nuevo',
  source text not null default 'web',
  ip_hash text,
  user_agent text
);

alter table public.search_requests enable row level security;

revoke all on table public.search_requests from anon;
revoke all on table public.search_requests from authenticated;

drop policy if exists "search_requests_no_public_select" on public.search_requests;
drop policy if exists "search_requests_no_public_insert" on public.search_requests;
drop policy if exists "search_requests_no_public_update" on public.search_requests;
drop policy if exists "search_requests_no_public_delete" on public.search_requests;

create policy "search_requests_no_public_select"
  on public.search_requests for select
  using (false);

create policy "search_requests_no_public_insert"
  on public.search_requests for insert
  with check (false);

create policy "search_requests_no_public_update"
  on public.search_requests for update
  using (false)
  with check (false);

create policy "search_requests_no_public_delete"
  on public.search_requests for delete
  using (false);

create index if not exists search_requests_created_at_idx
  on public.search_requests (created_at desc);

create index if not exists search_requests_status_idx
  on public.search_requests (status);

create index if not exists search_requests_category_idx
  on public.search_requests (category);
