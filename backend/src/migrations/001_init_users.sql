create table if not exists users (
  id uuid primary key,
  email text,
  plan_id text default 'free',
  status text default 'active',
  created_at timestamp default now()
);