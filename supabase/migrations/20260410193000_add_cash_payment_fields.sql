alter table public.subscriptions
  add column if not exists payment_request_date timestamptz default timezone('utc', now());

alter table public.payment_transactions
  add column if not exists notes text;
