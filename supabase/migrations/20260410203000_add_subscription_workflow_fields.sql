alter table public.subscriptions
  add column if not exists remaining_balance numeric(10, 2) not null default 0 check (remaining_balance >= 0);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.audit_log enable row level security;

create policy "audit_log superadmin all"
  on public.audit_log
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());
