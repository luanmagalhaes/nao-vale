create or replace function nv_start_turn(p_code text, p_secret text)
returns json
language plpgsql
as $$
declare
  v_room nv_rooms%rowtype;
  v_player nv_players%rowtype;
  v_turn nv_turns%rowtype;
  v_next text;
  v_grace_seconds constant int := 10;
begin
  select * into v_room from nv_rooms where code = p_code;

  if not found then
    return json_build_object('error', 'room');
  end if;

  select p.* into v_player
  from nv_players p
  join nv_player_secrets s on s.player_id = p.id
  where s.secret = p_secret and p.room_id = v_room.id;

  if not found then
    return json_build_object('error', 'player');
  end if;

  select * into v_turn from nv_turns where id = v_room.current_turn_id;

  if not found or v_turn.speaker_id <> v_player.id or v_turn.status <> 'ready' then
    return json_build_object('error', 'turn');
  end if;

  v_next := nv_next_card(v_room.id);

  insert into nv_turn_state (turn_id, card_id)
  values (v_turn.id, v_next)
  on conflict (turn_id) do update set card_id = excluded.card_id;

  update nv_turns
  set status = 'running',
      started_at = now(),
      ends_at = now() + make_interval(secs => v_room.turn_seconds + v_grace_seconds),
      card_seq = card_seq + 1
  where id = v_turn.id;

  return json_build_object('cardId', v_next, 'cardSeq', v_turn.card_seq + 1);
end;
$$;
