-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type user_role as enum ('superadmin', 'abonne');
create type subscription_status as enum ('actif', 'expire', 'bloque', 'en_attente');
create type plan_type as enum ('mensuel', 'semestriel', 'annuel');

-- Tables
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  phone text,
  role user_role not null default 'abonne',
  qr_code text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent integer not null check (discount_percent between 1 and 100),
  valid_until date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status subscription_status not null default 'en_attente',
  plan_type plan_type not null,
  amount_paid numeric(10, 2) not null check (amount_paid >= 0),
  promo_code_id uuid references public.promotions(id),
  payment_date timestamptz,
  receipt_number text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint subscription_dates_valid check (end_date >= start_date)
);

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  check_in_date date not null default current_date,
  validated_by uuid not null references public.users(id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, check_in_date)
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  payment_date timestamptz not null default timezone('utc', now()),
  receipt_number text not null unique,
  validated_by uuid not null references public.users(id),
  created_at timestamptz not null default timezone('utc', now())
);

-- Indexes
create index if not exists idx_subscriptions_user_status on public.subscriptions(user_id, status);
create index if not exists idx_subscriptions_end_date on public.subscriptions(end_date);
create index if not exists idx_attendances_check_in_date on public.attendances(check_in_date);

-- Helpers
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

create sequence if not exists public.receipt_seq start 1000;

create or replace function public.generate_receipt_number(prefix text default 'REC')
returns text
language plpgsql
as $$
declare
  seq_num bigint;
begin
  seq_num := nextval('public.receipt_seq');
  return format('%s-%s-%s', prefix, to_char(current_date, 'YYYYMMDD'), lpad(seq_num::text, 6, '0'));
end;
$$;

create or replace function public.calculate_subscription_amount(p_plan plan_type, p_promo uuid default null)
returns numeric
language plpgsql
stable
as $$
declare
  base_amount numeric;
  discount integer;
begin
  base_amount := case p_plan
    when 'mensuel' then 50
    when 'semestriel' then 250
    when 'annuel' then 450
  end;

  if p_promo is null then
    return base_amount;
  end if;

  select discount_percent
  into discount
  from public.promotions
  where id = p_promo
    and is_active = true
    and valid_until >= current_date;

  if discount is null then
    return base_amount;
  end if;

  return round(base_amount * (1 - (discount::numeric / 100)), 2);
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger trg_subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- RLS
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.attendances enable row level security;
alter table public.promotions enable row level security;
alter table public.payment_transactions enable row level security;

create policy "users self read"
  on public.users
  for select
  using (id = auth.uid() or public.is_superadmin());

create policy "users superadmin manage"
  on public.users
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "subscriptions self read"
  on public.subscriptions
  for select
  using (user_id = auth.uid() or public.is_superadmin());

create policy "subscriptions superadmin manage"
  on public.subscriptions
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "attendances self read"
  on public.attendances
  for select
  using (user_id = auth.uid() or public.is_superadmin());

create policy "attendances superadmin insert"
  on public.attendances
  for insert
  with check (public.is_superadmin());

create policy "attendances superadmin update_delete"
  on public.attendances
  for update
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "promotions authenticated read"
  on public.promotions
  for select
  using (auth.uid() is not null);

create policy "promotions superadmin manage"
  on public.promotions
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "transactions self read"
  on public.payment_transactions
  for select
  using (user_id = auth.uid() or public.is_superadmin());

create policy "transactions superadmin manage"
  on public.payment_transactions
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- Seed promotion example
insert into public.promotions (code, discount_percent, valid_until, is_active)
values ('WELCOME20', 20, current_date + interval '60 day', true)
on conflict (code) do nothing;
