-- SPOT FITNESS - Final production schema
-- Consolidated migration script

create extension if not exists "pgcrypto";

-- ENUMS
create type public.user_role as enum ('superadmin', 'member');
create type public.subscription_status as enum ('active', 'expired', 'blocked', 'pending_payment');
create type public.subscription_plan_type as enum ('monthly', 'semester', 'yearly');

-- TABLES
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  phone text,
  role public.user_role not null default 'member',
  qr_code text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent integer not null check (discount_percent between 0 and 100),
  valid_until date not null,
  is_active boolean not null default true
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status public.subscription_status not null default 'pending_payment',
  plan_type public.subscription_plan_type not null,
  amount_paid numeric(10, 2) not null default 0 check (amount_paid >= 0),
  remaining_balance numeric(10, 2) not null default 0 check (remaining_balance >= 0),
  promo_code_id uuid references public.promotions(id) on delete set null,
  payment_date timestamptz,
  payment_request_date timestamptz default timezone('utc', now()),
  receipt_number text unique,
  constraint subscription_dates_valid check (end_date >= start_date)
);

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  check_in_date date not null default current_date,
  validated_by uuid references public.users(id) on delete set null,
  unique (user_id, check_in_date)
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  payment_date timestamptz not null default timezone('utc', now()),
  receipt_number text not null unique,
  notes text,
  validated_by uuid references public.users(id) on delete set null
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- INDEXES
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_qr_code on public.users(qr_code);
create index if not exists idx_subscriptions_status on public.subscriptions(status);
create index if not exists idx_attendances_check_in_date on public.attendances(check_in_date);

-- FUNCTIONS
create or replace function public.is_superadmin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'superadmin'
  );
$$;

create sequence if not exists public.receipt_seq start 1;

create or replace function public.generate_receipt_number()
returns text
language plpgsql
as $$
declare
  seq_num bigint;
begin
  seq_num := nextval('public.receipt_seq');
  return format('REC-%s-%s', to_char(current_date, 'YYYY'), lpad(seq_num::text, 5, '0'));
end;
$$;

create or replace function public.set_receipt_number_if_missing()
returns trigger
language plpgsql
as $$
begin
  if new.receipt_number is null or btrim(new.receipt_number) = '' then
    new.receipt_number := public.generate_receipt_number();
  end if;

  return new;
end;
$$;

create or replace function public.subscription_remaining_days(p_subscription_id uuid)
returns integer
language sql
stable
as $$
  select greatest((s.end_date - current_date), 0)::int
  from public.subscriptions s
  where s.id = p_subscription_id;
$$;

create or replace function public.sync_subscription_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'blocked' then
    return new;
  end if;

  if new.end_date < current_date then
    new.status := 'expired';
  elsif new.payment_date is null then
    new.status := 'pending_payment';
  elsif new.start_date <= current_date and new.end_date >= current_date then
    new.status := 'active';
  end if;

  return new;
end;
$$;

create or replace function public.refresh_expired_subscriptions()
returns integer
language plpgsql
as $$
declare
  updated_count integer;
begin
  update public.subscriptions
  set status = 'expired'
  where status <> 'blocked'
    and end_date < current_date;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- TRIGGERS
create trigger trg_subscriptions_set_receipt
before insert on public.subscriptions
for each row
execute function public.set_receipt_number_if_missing();

create trigger trg_transactions_set_receipt
before insert on public.payment_transactions
for each row
execute function public.set_receipt_number_if_missing();

create trigger trg_subscriptions_sync_status
before insert or update on public.subscriptions
for each row
execute function public.sync_subscription_status();

-- RLS
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.attendances enable row level security;
alter table public.promotions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.audit_log enable row level security;

create policy "users superadmin all"
  on public.users
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "users member select self"
  on public.users
  for select
  using (id = auth.uid());

create policy "subscriptions superadmin all"
  on public.subscriptions
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "subscriptions member select own"
  on public.subscriptions
  for select
  using (user_id = auth.uid());

create policy "attendances superadmin all"
  on public.attendances
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "attendances member select own"
  on public.attendances
  for select
  using (user_id = auth.uid());

create policy "promotions superadmin all"
  on public.promotions
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "promotions member select"
  on public.promotions
  for select
  using (auth.uid() is not null);

create policy "transactions superadmin all"
  on public.payment_transactions
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "transactions member select own"
  on public.payment_transactions
  for select
  using (user_id = auth.uid());

create policy "audit_log superadmin all"
  on public.audit_log
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());
