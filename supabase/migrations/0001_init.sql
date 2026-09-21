create table if not exists nv_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid,
  deck_mode text not null default 'suave',
  turn_seconds int not null default 60,
  status text not null default 'lobby',
  current_turn_id uuid,
  round_number int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists nv_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references nv_rooms(id) on delete cascade,
  name text not null,
  team text,
  is_host boolean not null default false,
  has_spoken boolean not null default false,
  judged_count int not null default 0,
  seat int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists nv_player_secrets (
  player_id uuid primary key references nv_players(id) on delete cascade,
  secret text not null
);

create table if not exists nv_turns (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references nv_rooms(id) on delete cascade,
  speaker_id uuid not null references nv_players(id) on delete cascade,
  judge_id uuid references nv_players(id) on delete set null,
  team text not null,
  status text not null default 'ready',
  card_seq int not null default 0,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists nv_turn_state (
  turn_id uuid primary key references nv_turns(id) on delete cascade,
  card_id text
);

create table if not exists nv_draw_pile (
  room_id uuid not null references nv_rooms(id) on delete cascade,
  card_id text not null,
  position int not null,
  primary key (room_id, card_id)
);

create table if not exists nv_results (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references nv_rooms(id) on delete cascade,
  turn_id uuid not null references nv_turns(id) on delete cascade,
  card_id text not null,
  outcome text not null,
  scoring_team text,
  undone boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists nv_players_room_idx on nv_players(room_id, seat);
create index if not exists nv_turns_room_idx on nv_turns(room_id, created_at desc);
create index if not exists nv_results_room_idx on nv_results(room_id, created_at desc);
create index if not exists nv_draw_pile_room_idx on nv_draw_pile(room_id, position);

alter table nv_rooms enable row level security;
alter table nv_players enable row level security;
alter table nv_player_secrets enable row level security;
alter table nv_turns enable row level security;
alter table nv_turn_state enable row level security;
alter table nv_draw_pile enable row level security;
alter table nv_results enable row level security;

drop policy if exists nv_rooms_public_read on nv_rooms;
create policy nv_rooms_public_read on nv_rooms for select to anon, authenticated using (true);

drop policy if exists nv_players_public_read on nv_players;
create policy nv_players_public_read on nv_players for select to anon, authenticated using (true);

drop policy if exists nv_turns_public_read on nv_turns;
create policy nv_turns_public_read on nv_turns for select to anon, authenticated using (true);

drop policy if exists nv_results_public_read on nv_results;
create policy nv_results_public_read on nv_results for select to anon, authenticated using (true);

alter publication supabase_realtime add table nv_rooms;
alter publication supabase_realtime add table nv_players;
alter publication supabase_realtime add table nv_turns;
alter publication supabase_realtime add table nv_results;
