create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  plan_id text,
  status text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);