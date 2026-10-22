create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists google_connections (
  user_id uuid primary key references users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  scope text,
  updated_at timestamptz not null default now()
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  account_name text not null,
  location_name text not null,
  title text not null,
  created_at timestamptz not null default now(),
  unique (user_id, location_name)
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  review_name text not null,
  reviewer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  create_time timestamptz not null,
  reply_comment text,
  reply_time timestamptz,
  ai_draft text,
  synced_at timestamptz not null default now(),
  unique (user_id, review_name)
);

create index if not exists reviews_location_time_idx on reviews (location_id, create_time desc);

-- Only the server (service key) touches these tables.
alter table users enable row level security;
alter table google_connections enable row level security;
alter table locations enable row level security;
alter table reviews enable row level security;