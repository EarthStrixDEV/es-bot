-- ES Bot phase 1 schema for Supabase Postgres (Data Model section of the system design).
-- One database, Row Level Security by account_id. Snapshots and files live in object storage.

create extension if not exists vector;

create table accounts (
  id uuid primary key default gen_random_uuid(),
  plan text not null default 'free',
  settings jsonb not null default '{}'
);

create table bots (
  id text primary key,
  account_id uuid not null references accounts(id),
  name text not null,
  avatar text,
  job text,
  status text not null default 'active' check (status in ('active', 'archived')),
  archived_at timestamptz
);

-- 1:1 with bots, every version kept.
create table passports (
  bot_id text not null references bots(id),
  version int not null,
  account_id uuid not null references accounts(id),
  sandbox jsonb not null,
  trust jsonb not null,
  budget jsonb not null,
  created_at timestamptz not null default now(),
  primary key (bot_id, version)
);

create table connectors (
  id text primary key,
  account_id uuid not null references accounts(id),
  url text not null,
  transport text not null,
  auth_kind text not null check (auth_kind in ('oauth', 'api_key', 'none')),
  secret_ref text, -- Vault reference; the secret itself never lives here
  status text not null default 'connected'
);

create table grants (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id),
  bot_id text not null references bots(id),
  connector_id text not null references connectors(id),
  scope text not null check (scope in ('read', 'draft', 'write', 'send', 'pay', 'destroy')),
  resources text[] not null default '{}',
  level text check (level in ('L0', 'L1', 'L2', 'L3')),
  revoked_at timestamptz
);

create table tools (
  id text primary key, -- connector_id.name
  account_id uuid not null references accounts(id),
  connector_id text not null references connectors(id),
  name text not null,
  schema jsonb not null,
  effect text not null check (effect in ('read', 'draft', 'write', 'send', 'pay', 'destroy')),
  reversible text not null check (reversible in ('yes', 'no', 'partial')),
  blast jsonb not null,
  task_class text not null,
  enabled boolean not null default false, -- every tool starts off
  desc_hash text not null,
  flagged text
);

create table threads (
  id text primary key,
  account_id uuid not null references accounts(id),
  bot_id text references bots(id),
  group_id text,
  kind text not null check (kind in ('main', 'side', 'group')),
  ephemeral boolean not null default false,
  check (bot_id is not null or group_id is not null)
);

create table messages (
  id text primary key,
  account_id uuid not null references accounts(id),
  thread_id text not null references threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  parts jsonb,
  created_at timestamptz not null default now()
);
create index on messages (thread_id, created_at);

create table runs (
  id text primary key,
  account_id uuid not null references accounts(id),
  bot_id text not null references bots(id),
  thread_id text not null references threads(id),
  parent_run_id text references runs(id),       -- Fork makes runs a tree
  fork_checkpoint_id text,
  status text not null,
  plan jsonb,
  cursor int not null default 0,
  budget_cap numeric not null,
  stop_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table steps (
  id text primary key,
  account_id uuid not null references accounts(id),
  run_id text not null references runs(id),
  idx int not null,
  kind text not null,
  title text not null,
  model text,
  tool_id text references tools(id),
  args jsonb,
  args_hash text,
  decision text check (decision in ('allow', 'allow_and_report', 'ask', 'deny')),
  level text,
  reason text,
  cost numeric not null default 0,
  status text not null,
  output jsonb,
  unique (run_id, idx)
);

create table checkpoints (
  id text primary key,
  account_id uuid not null references accounts(id),
  run_id text not null references runs(id),
  step_id text not null references steps(id),
  message_id text references messages(id),
  snapshot_ref text, -- phase 2: sandbox snapshot
  created_at timestamptz not null default now()
);
alter table runs add foreign key (fork_checkpoint_id) references checkpoints(id);

create table approvals (
  id text primary key,
  account_id uuid not null references accounts(id),
  run_id text not null references runs(id),
  step_id text references steps(id), -- null = plan approval
  title text not null,
  task_class text,
  preview text[],
  payload_hash text not null,        -- edits after approval need a new request
  state text not null check (state in ('pending', 'escalated', 'paused', 'approved', 'approved_canary', 'rejected')),
  reversible text not null,
  estimate numeric not null,
  created_at timestamptz not null default now(),
  escalated_at timestamptz,
  paused_at timestamptz,
  decided_at timestamptz,
  decided_by text
);
create index on approvals (state) where state in ('pending', 'escalated', 'paused');

create table usage_ledger (
  id text primary key,
  account_id uuid not null references accounts(id),
  run_id text not null references runs(id),
  step_id text not null references steps(id),
  reserved numeric not null,
  committed numeric not null default 0,
  unit text not null default 'THB',
  state text not null check (state in ('reserved', 'committed', 'released'))
);

create table audit_events (
  id text primary key,
  account_id uuid not null references accounts(id),
  actor text not null,
  action text not null,
  target text not null,
  decision text,
  payload_hash text,
  cost numeric,
  meta jsonb,
  at timestamptz not null default now()
);
create index on audit_events (account_id, at);

-- Append-only: no UPDATE or DELETE, for anyone.
create function forbid_audit_change() returns trigger language plpgsql as $$
begin
  raise exception 'audit_events is append-only';
end $$;
create trigger audit_events_append_only before update or delete on audit_events
  for each row execute function forbid_audit_change();

-- Phase 4 tables, created now so foreign keys stay stable.
create table memories (
  id text primary key,
  account_id uuid not null references accounts(id),
  bot_id text not null references bots(id),
  text text not null,
  embedding vector(1536),
  source_message_id text references messages(id)
);

-- Row Level Security: a user only sees rows of the account in their JWT.
do $$
declare t text;
begin
  foreach t in array array[
    'bots', 'passports', 'connectors', 'grants', 'tools', 'threads', 'messages', 'runs', 'steps',
    'checkpoints', 'approvals', 'usage_ledger', 'audit_events', 'memories'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I using (account_id = (auth.jwt() ->> ''account_id'')::uuid)',
      t || '_account_isolation', t
    );
  end loop;
end $$;

-- Clients may read the audit log but only the service role writes it.
revoke insert, update, delete on audit_events from authenticated, anon;
