create table if not exists nv_matches (
  id uuid primary key default gen_random_uuid(),
  room_code text not null,
  deck_mode text not null,
  score_vermelho int not null,
  score_azul int not null,
  winner text,
  players jsonb not null default '[]'::jsonb,
  cards_played int not null default 0,
  finished_at timestamptz not null default now()
);

create index if not exists nv_matches_finished_idx on nv_matches(finished_at desc);

alter table nv_matches enable row level security;

drop policy if exists nv_matches_public_read on nv_matches;
create policy nv_matches_public_read on nv_matches for select to anon, authenticated using (true);

alter publication supabase_realtime add table nv_matches;
