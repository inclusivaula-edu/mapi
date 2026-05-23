-- =========================
-- USERS PLAN
-- =========================
create table if not exists users_plan (
  id uuid default gen_random_uuid(),
  user_id uuid unique,
  plan text default 'free',
  created_at timestamp default now()
);

-- =========================
-- REQUESTS (USAGE TRACKING)
-- =========================
create table if not exists requests (
  id uuid default gen_random_uuid(),
  user_id uuid,
  endpoint text,
  created_at timestamp default now()
);

create index if not exists idx_requests_user_id on requests(user_id);

-- =========================
-- SUBSCRIPTIONS
-- =========================
create table if not exists subscriptions (
  id uuid default gen_random_uuid(),
  user_id uuid unique,
  plan_id text,
  status text,
  created_at timestamp default now()
);