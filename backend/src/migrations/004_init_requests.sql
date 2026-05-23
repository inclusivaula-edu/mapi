create table if not exists requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  endpoint text,
  created_at timestamp default now()
);