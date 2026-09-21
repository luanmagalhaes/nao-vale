create or replace function nv_next_card(p_room uuid)
returns text
language plpgsql
as $$
declare
  v_card text;
begin
  delete from nv_draw_pile
  where ctid = (
    select ctid from nv_draw_pile
    where room_id = p_room
    order by position asc
    limit 1
  )
  returning card_id into v_card;

  return v_card;
end;
$$;

create or replace function nv_play(
  p_code text,
  p_secret text,
  p_outcome text
)
returns json
language plpgsql
as $$
declare
  v_room nv_rooms%rowtype;
  v_player nv_players%rowtype;
  v_turn nv_turns%rowtype;
  v_current text;
  v_next text;
  v_scoring text;
  v_max int;
begin
  select * into v_room from nv_rooms where code = p_code;

  if not found then
    return json_build_object('error', 'sala');
  end if;

  select p.* into v_player
  from nv_players p
  join nv_player_secrets s on s.player_id = p.id
  where s.secret = p_secret and p.room_id = v_room.id;

  if not found then
    return json_build_object('error', 'jogador');
  end if;

  select * into v_turn from nv_turns where id = v_room.current_turn_id;

  if not found or v_turn.status <> 'running' then
    return json_build_object('error', 'turno');
  end if;

  if p_outcome = 'queima' then
    if v_turn.judge_id is distinct from v_player.id then
      return json_build_object('error', 'permissao');
    end if;
  else
    if v_turn.speaker_id <> v_player.id then
      return json_build_object('error', 'permissao');
    end if;
  end if;

  select card_id into v_current from nv_turn_state where turn_id = v_turn.id;

  if v_current is null then
    return json_build_object('error', 'carta');
  end if;

  v_scoring := case
    when p_outcome = 'acerto' then v_turn.team
    when p_outcome = 'queima' then case when v_turn.team = 'vermelho' then 'azul' else 'vermelho' end
    else null
  end;

  insert into nv_results (room_id, turn_id, card_id, outcome, scoring_team)
  values (v_room.id, v_turn.id, v_current, p_outcome, v_scoring);

  if p_outcome = 'pulo' then
    select coalesce(max(position), 0) + 1 into v_max
    from nv_draw_pile where room_id = v_room.id;

    insert into nv_draw_pile (room_id, card_id, position)
    values (v_room.id, v_current, v_max)
    on conflict (room_id, card_id) do update set position = excluded.position;
  end if;

  v_next := nv_next_card(v_room.id);

  update nv_turn_state set card_id = v_next where turn_id = v_turn.id;
  update nv_turns set card_seq = card_seq + 1 where id = v_turn.id;

  return json_build_object('cardId', v_next, 'cardSeq', v_turn.card_seq + 1);
end;
$$;

create or replace function nv_undo(p_code text, p_secret text)
returns json
language plpgsql
as $$
declare
  v_room nv_rooms%rowtype;
  v_player nv_players%rowtype;
  v_turn nv_turns%rowtype;
  v_result nv_results%rowtype;
  v_current text;
  v_max int;
begin
  select * into v_room from nv_rooms where code = p_code;

  if not found then
    return json_build_object('error', 'sala');
  end if;

  select p.* into v_player
  from nv_players p
  join nv_player_secrets s on s.player_id = p.id
  where s.secret = p_secret and p.room_id = v_room.id;

  if not found then
    return json_build_object('error', 'jogador');
  end if;

  select * into v_turn from nv_turns where id = v_room.current_turn_id;

  if not found then
    return json_build_object('error', 'turno');
  end if;

  if v_turn.speaker_id <> v_player.id and v_turn.judge_id is distinct from v_player.id then
    return json_build_object('error', 'permissao');
  end if;

  select * into v_result
  from nv_results
  where turn_id = v_turn.id and undone = false
  order by created_at desc
  limit 1;

  if not found then
    return json_build_object('error', 'vazio');
  end if;

  update nv_results set undone = true where id = v_result.id;

  select card_id into v_current from nv_turn_state where turn_id = v_turn.id;

  if v_current is not null then
    select coalesce(max(position), 0) + 1 into v_max
    from nv_draw_pile where room_id = v_room.id;

    insert into nv_draw_pile (room_id, card_id, position)
    values (v_room.id, v_current, v_max)
    on conflict (room_id, card_id) do update set position = excluded.position;
  end if;

  update nv_turn_state set card_id = v_result.card_id where turn_id = v_turn.id;
  update nv_turns set card_seq = card_seq + 1 where id = v_turn.id;

  return json_build_object('cardId', v_result.card_id, 'cardSeq', v_turn.card_seq + 1);
end;
$$;

create or replace function nv_start_turn(p_code text, p_secret text)
returns json
language plpgsql
as $$
declare
  v_room nv_rooms%rowtype;
  v_player nv_players%rowtype;
  v_turn nv_turns%rowtype;
  v_next text;
begin
  select * into v_room from nv_rooms where code = p_code;

  if not found then
    return json_build_object('error', 'sala');
  end if;

  select p.* into v_player
  from nv_players p
  join nv_player_secrets s on s.player_id = p.id
  where s.secret = p_secret and p.room_id = v_room.id;

  if not found then
    return json_build_object('error', 'jogador');
  end if;

  select * into v_turn from nv_turns where id = v_room.current_turn_id;

  if not found or v_turn.speaker_id <> v_player.id or v_turn.status <> 'ready' then
    return json_build_object('error', 'turno');
  end if;

  v_next := nv_next_card(v_room.id);

  insert into nv_turn_state (turn_id, card_id)
  values (v_turn.id, v_next)
  on conflict (turn_id) do update set card_id = excluded.card_id;

  update nv_turns
  set status = 'running',
      started_at = now(),
      ends_at = now() + make_interval(secs => v_room.turn_seconds),
      card_seq = card_seq + 1
  where id = v_turn.id;

  return json_build_object('cardId', v_next, 'cardSeq', v_turn.card_seq + 1);
end;
$$;
