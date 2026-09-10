create table if not exists profiles (
  user_id text primary key,
  handle text,
  follow_status text not null default 'none',
  follow_attested_at timestamptz,
  follow_verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists entitlements (
  id serial primary key,
  user_id text not null,
  tier text not null,
  credits_remaining integer not null default 0,
  credits_daily_reset date,
  daily_spent integer not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  source text not null default 'free'
);
create index if not exists entitlements_user_id_idx on entitlements (user_id);

create table if not exists credit_ledger (
  id serial primary key,
  user_id text not null,
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_user_id_idx on credit_ledger (user_id);

create table if not exists hitl_queue (
  id serial primary key,
  user_id text not null,
  kind text not null,
  rail text not null,
  amount_label text,
  payload jsonb not null default '{}',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists hitl_queue_user_id_idx on hitl_queue (user_id);

create table if not exists paper_cycles (
  id serial primary key,
  user_id text not null,
  pot_id text not null,
  market text not null,
  p numeric not null,
  b numeric not null,
  kelly_full numeric not null,
  kelly_quarter numeric not null,
  sized numeric not null,
  bankroll numeric not null,
  result text,
  created_at timestamptz not null default now()
);
create index if not exists paper_cycles_user_id_idx on paper_cycles (user_id);

create table if not exists mba_stamps (
  id serial primary key,
  user_id text not null,
  territory text not null,
  offer text not null,
  gate text not null,
  radar text not null,
  thursday_draft text not null,
  air_gap text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists mba_stamps_user_id_idx on mba_stamps (user_id);

create table if not exists stripe_events (
  id text primary key,
  session_id text,
  processed_at timestamptz not null default now()
);
