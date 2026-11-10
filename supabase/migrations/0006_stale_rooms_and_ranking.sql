alter table nv_rooms
  add column if not exists started_at timestamptz;

alter table nv_matches
  add column if not exists closed_by text not null default 'target';

update nv_rooms set started_at = created_at where started_at is null and status = 'playing';

create index if not exists nv_rooms_started_idx on nv_rooms(status, started_at);
