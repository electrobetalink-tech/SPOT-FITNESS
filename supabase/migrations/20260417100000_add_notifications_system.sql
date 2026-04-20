create type public.notification_type as enum ('success', 'error', 'info', 'warning');

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  type public.notification_type not null default 'info',
  metadata jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_unread
  on public.notifications(is_read)
  where is_read = false;

alter table public.notifications enable row level security;

create policy "notifications superadmin all"
  on public.notifications
  for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "notifications member select own"
  on public.notifications
  for select
  using (user_id = auth.uid());
