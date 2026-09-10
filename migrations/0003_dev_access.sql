create table if not exists dev_access_keys (
  id serial primary key,
  user_id text not null,
  token_hash text not null unique,
  kind text not null default 'login_credential',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists dev_access_keys_user_id_idx on dev_access_keys (user_id);
create index if not exists dev_access_keys_ends_at_idx on dev_access_keys (ends_at);
