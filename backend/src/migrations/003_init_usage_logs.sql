create table if not exists usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  model text,
  tokens_used int,
  created_at timestamp default now()
);