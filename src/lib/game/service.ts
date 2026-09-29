import { randomUUID } from "node:crypto";
import { ServiceError, messageFor } from "@/lib/messages";
import { serverClient } from "@/lib/supabase/server";
import { cardById, deckFor } from "@/data/deck";
import {
  assignTeams,
  shuffle,
  makeCode,
  isGameOver,
  scoreFrom,
  canStart,
  nextTurn,
  scoringTeam,
  winnerOf,
} from "@/lib/game/rules";
import type {
  Card,
  DeckMode,
  Outcome,
  PlayerRow,
  ResultRow,
  RoomRow,
  Team,
  TurnRow,
} from "@/types/game";

function failure(status: number): never {
  throw new ServiceError(status, messageFor(status));
}

const recycleAfterHours = 24;

async function recycleStaleRooms() {
  const limit = new Date(
    Date.now() - recycleAfterHours * 60 * 60 * 1000,
  ).toISOString();

  await serverClient().from("nv_rooms").delete().lt("updated_at", limit);
}

async function freeCode(): Promise<string> {
  await recycleStaleRooms();

  for (let round = 0; round < 2; round += 1) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const code = makeCode();
      const { data } = await serverClient()
        .from("nv_rooms")
        .select("id")
        .eq("code", code)
        .maybeSingle();

      if (!data) {
        return code;
      }
    }

    await recycleStaleRooms();
  }

  throw new ServiceError(
    409,
    "Todas as salas estão ocupadas now. Espera alguém terminar.",
  );
}

async function createSecret(playerId: string): Promise<string> {
  const secret = randomUUID();

  await serverClient()
    .from("nv_player_secrets")
    .insert({ player_id: playerId, secret });

  return secret;
}

export async function createRoom(
  rawName: string,
  deckMode: DeckMode,
  isTest = false,
) {
  const name = rawName.trim();

  if (name.length < 2) {
    failure(400);
  }

  const code = await freeCode();

  const { data: room } = await serverClient()
    .from("nv_rooms")
    .insert({ code, deck_mode: deckMode, is_test: isTest })
    .select("*")
    .single();

  if (!room) {
    failure(500);
  }

  const { data: player } = await serverClient()
    .from("nv_players")
    .insert({
      room_id: (room as RoomRow).id,
      name: name,
      team: null,
      is_host: true,
      seat: 0,
    })
    .select("*")
    .single();

  if (!player) {
    failure(500);
  }

  const token = await createSecret((player as PlayerRow).id);

  await serverClient()
    .from("nv_rooms")
    .update({ host_id: (player as PlayerRow).id })
    .eq("id", (room as RoomRow).id);

  return { code, token, playerId: (player as PlayerRow).id };
}

export async function joinRoom(code: string, rawName: string) {
  const name = rawName.trim();

  if (name.length < 2) {
    failure(400);
  }

  const { data } = await serverClient()
    .from("nv_rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  const room = data as RoomRow | null;

  if (!room) {
    failure(404);
  }

  if (room.status !== "lobby") {
    failure(409);
  }

  const { count } = await serverClient()
    .from("nv_players")
    .select("id", { count: "exact", head: true })
    .eq("room_id", room.id);

  const seat = count ?? 0;

  const { data: player } = await serverClient()
    .from("nv_players")
    .insert({
      room_id: room.id,
      name: name,
      team: null,
      seat,
    })
    .select("*")
    .single();

  if (!player) {
    failure(500);
  }

  const token = await createSecret((player as PlayerRow).id);

  return { code: room.code, token, playerId: (player as PlayerRow).id };
}

async function roomResults(roomId: string): Promise<ResultRow[]> {
  const { data } = await serverClient()
    .from("nv_results")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  return (data as ResultRow[] | null) ?? [];
}

async function turnCard(turnId: string): Promise<Card | null> {
  const { data } = await serverClient()
    .from("nv_turn_state")
    .select("card_id")
    .eq("turn_id", turnId)
    .maybeSingle();

  const row = data as { card_id: string | null } | null;

  if (!row?.card_id) {
    return null;
  }

  return cardById(row.card_id);
}

export async function roomState(room: RoomRow, eu: PlayerRow) {
  const client = serverClient();

  const [{ data: players }, results] = await Promise.all([
    client
      .from("nv_players")
      .select("*")
      .eq("room_id", room.id)
      .order("seat", { ascending: true }),
    roomResults(room.id),
  ]);

  let turn: TurnRow | null = null;

  if (room.current_turn_id) {
    const { data } = await client
      .from("nv_turns")
      .select("*")
      .eq("id", room.current_turn_id)
      .maybeSingle();

    turn = (data as TurnRow | null) ?? null;
  }

  const isSpeaker = turn?.speaker_id === eu.id;
  const isJudge = turn?.judge_id === eu.id;
  const podeVerCarta = Boolean(turn && turn.status === "running") &&
    (isSpeaker || isJudge);

  const card = podeVerCarta && turn ? await turnCard(turn.id) : null;

  return {
    room: room,
    players: (players as PlayerRow[] | null) ?? [],
    turn: turn,
    card: card,
    me: eu,
    score: scoreFrom(results),
    results: results.slice(-12),
    now: new Date().toISOString(),
  };
}

export async function setTeam(room: RoomRow, eu: PlayerRow, team: Team) {
  if (room.status !== "lobby") {
    failure(409);
  }

  await serverClient()
    .from("nv_players")
    .update({ team })
    .eq("id", eu.id);
}

export async function setDeck(
  room: RoomRow,
  eu: PlayerRow,
  deckMode: DeckMode,
) {
  if (!eu.is_host) {
    failure(403);
  }

  await serverClient()
    .from("nv_rooms")
    .update({ deck_mode: deckMode, updated_at: new Date().toISOString() })
    .eq("id", room.id);
}

async function buildPile(room: RoomRow) {
  const cardList = shuffle(deckFor(room.deck_mode));

  await serverClient().from("nv_draw_pile").delete().eq("room_id", room.id);

  await serverClient().from("nv_draw_pile").insert(
    cardList.map((card, index) => ({
      room_id: room.id,
      card_id: card.id,
      position: index,
    })),
  );
}

async function drawCard(room: RoomRow): Promise<string> {
  const client = serverClient();

  const { data } = await client
    .from("nv_draw_pile")
    .select("card_id, position")
    .eq("room_id", room.id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  const top = data as { card_id: string; position: number } | null;

  if (!top) {
    await buildPile(room);

    const { data: novo } = await client
      .from("nv_draw_pile")
      .select("card_id")
      .eq("room_id", room.id)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    const recarregado = novo as { card_id: string } | null;

    if (!recarregado) {
      failure(500);
    }

    await client
      .from("nv_draw_pile")
      .delete()
      .eq("room_id", room.id)
      .eq("card_id", recarregado.card_id);

    return recarregado.card_id;
  }

  await client
    .from("nv_draw_pile")
    .delete()
    .eq("room_id", room.id)
    .eq("card_id", top.card_id);

  return top.card_id;
}

async function sendToBottom(room: RoomRow, cardId: string) {
  const { data } = await serverClient()
    .from("nv_draw_pile")
    .select("position")
    .eq("room_id", room.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ultima = data as { position: number } | null;

  await serverClient()
    .from("nv_draw_pile")
    .upsert({
      room_id: room.id,
      card_id: cardId,
      position: (ultima?.position ?? 0) + 1,
    });
}

async function createTurn(
  room: RoomRow,
  players: PlayerRow[],
  timeAnterior: Team | null,
): Promise<TurnRow | null> {
  const plan = nextTurn(players, timeAnterior);

  if (!plan) {
    return null;
  }

  const { data } = await serverClient()
    .from("nv_turns")
    .insert({
      room_id: room.id,
      speaker_id: plan.speakerId,
      judge_id: plan.judgeId,
      team: plan.team,
    })
    .select("*")
    .single();

  const turn = data as TurnRow | null;

  if (!turn) {
    failure(500);
  }

  await serverClient()
    .from("nv_turn_state")
    .upsert({ turn_id: turn.id, card_id: null });

  return turn;
}

export async function startGame(room: RoomRow, eu: PlayerRow) {
  if (!eu.is_host) {
    failure(403);
  }

  if (room.status !== "lobby") {
    failure(409);
  }

  const { data } = await serverClient()
    .from("nv_players")
    .select("*")
    .eq("room_id", room.id)
    .order("seat", { ascending: true });

  const players = (data as PlayerRow[] | null) ?? [];

  if (!canStart(players)) {
    throw new ServiceError(
      400,
      "Precisa de pelo menos 4 pessoas, com 2 em cada team.",
    );
  }

  await buildPile(room);

  const turn = await createTurn(room, players, null);

  if (!turn) {
    failure(500);
  }

  await serverClient()
    .from("nv_rooms")
    .update({
      status: "playing",
      current_turn_id: turn.id,
      round_number: 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id);
}

const databaseErrors: Record<string, { status: number; text: string }> = {
  room: { status: 404, text: "Essa sala não existe." },
  player: { status: 401, text: "Você não está nessa sala." },
  turn: { status: 409, text: "A rodada mudou. Recarregue a página." },
  forbidden: { status: 403, text: "Essa jogada não é sua." },
  card: { status: 409, text: "Nenhuma carta em jogo agora." },
  empty: { status: 409, text: "Não tem jogada para desfazer neste turno." },
};

interface CardResponse {
  cardId?: string | null;
  cardSeq?: number;
  error?: string;
}

async function callPlay(
  funcao: string,
  args: Record<string, string>,
): Promise<{ card: Card | null; cardSeq: number }> {
  const { data, error } = await serverClient().rpc(funcao, args);

  if (error) {
    failure(500);
  }

  const response = data as CardResponse;

  if (response?.error) {
    const known = databaseErrors[response.error];

    throw new ServiceError(
      known?.status ?? 409,
      known?.text ?? messageFor(409),
    );
  }

  return {
    card: response.cardId ? cardById(response.cardId) : null,
    cardSeq: response.cardSeq ?? 0,
  };
}

export function startTurn(code: string, token: string) {
  return callPlay("nv_start_turn", { p_code: code, p_secret: token });
}

export function playCard(code: string, token: string, outcome: Outcome) {
  return callPlay("nv_play", {
    p_code: code,
    p_secret: token,
    p_outcome: outcome,
  });
}

export function undoPlay(code: string, token: string) {
  return callPlay("nv_undo", { p_code: code, p_secret: token });
}

async function currentTurn(room: RoomRow): Promise<TurnRow> {
  if (!room.current_turn_id) {
    failure(409);
  }

  const { data } = await serverClient()
    .from("nv_turns")
    .select("*")
    .eq("id", room.current_turn_id)
    .maybeSingle();

  const turn = data as TurnRow | null;

  if (!turn) {
    failure(409);
  }

  return turn;
}

export async function registerOutcome(
  room: RoomRow,
  eu: PlayerRow,
  outcome: Outcome,
) {
  const turn = await currentTurn(room);

  if (turn.status !== "running") {
    failure(409);
  }

  const ehFalante = turn.speaker_id === eu.id;
  const ehJuiz = turn.judge_id === eu.id;

  if (outcome === "burn" ? !ehJuiz : !ehFalante) {
    failure(403);
  }

  const { data } = await serverClient()
    .from("nv_turn_state")
    .select("card_id")
    .eq("turn_id", turn.id)
    .maybeSingle();

  const current = data as { card_id: string | null } | null;

  if (!current?.card_id) {
    failure(409);
  }

  await serverClient().from("nv_results").insert({
    room_id: room.id,
    turn_id: turn.id,
    card_id: current.card_id,
    outcome,
    scoring_team: scoringTeam(outcome, turn.team),
  });

  if (outcome === "skip") {
    await sendToBottom(room, current.card_id);
  }

  const nextCardId = await drawCard(room);
  const seq = turn.card_seq + 1;

  await serverClient()
    .from("nv_turn_state")
    .upsert({ turn_id: turn.id, card_id: nextCardId });

  await serverClient()
    .from("nv_turns")
    .update({ card_seq: seq })
    .eq("id", turn.id);

  return { card: cardById(nextCardId), cardSeq: seq };
}

export async function undoLast(room: RoomRow, eu: PlayerRow) {
  const turn = await currentTurn(room);

  if (turn.speaker_id !== eu.id && turn.judge_id !== eu.id) {
    failure(403);
  }

  const { data } = await serverClient()
    .from("nv_results")
    .select("*")
    .eq("turn_id", turn.id)
    .eq("undone", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isLast = data as ResultRow | null;

  if (!isLast) {
    throw new ServiceError(409, "Não tem jogada para desfazer neste turno.");
  }

  await serverClient()
    .from("nv_results")
    .update({ undone: true })
    .eq("id", isLast.id);

  const { data: estadoAtual } = await serverClient()
    .from("nv_turn_state")
    .select("card_id")
    .eq("turn_id", turn.id)
    .maybeSingle();

  const current = estadoAtual as { card_id: string | null } | null;

  if (current?.card_id) {
    await sendToBottom(room, current.card_id);
  }

  const seq = turn.card_seq + 1;

  await serverClient()
    .from("nv_turn_state")
    .upsert({ turn_id: turn.id, card_id: isLast.card_id });

  await serverClient()
    .from("nv_turns")
    .update({ card_seq: seq })
    .eq("id", turn.id);

  return { card: cardById(isLast.card_id), cardSeq: seq };
}

export async function endTurn(room: RoomRow) {
  const turn = await currentTurn(room);

  if (turn.status === "done") {
    return;
  }

  const ranOut = turn.ends_at
    ? Date.parse(turn.ends_at) <= Date.now() + 1500
    : false;

  if (!ranOut) {
    failure(409);
  }

  const { data: claimed } = await serverClient()
    .from("nv_turns")
    .update({ status: "done" })
    .eq("id", turn.id)
    .neq("status", "done")
    .select("id");

  if (((claimed as { id: string }[] | null) ?? []).length === 0) {
    return;
  }

  const { data: speakerRow } = await serverClient()
    .from("nv_players")
    .select("spoke_count")
    .eq("id", turn.speaker_id)
    .maybeSingle();

  await serverClient()
    .from("nv_players")
    .update({
      has_spoken: true,
      spoke_count: ((speakerRow as { spoke_count: number } | null)?.spoke_count ?? 0) + 1,
    })
    .eq("id", turn.speaker_id);

  if (turn.judge_id) {
    const { data } = await serverClient()
      .from("nv_players")
      .select("judged_count")
      .eq("id", turn.judge_id)
      .maybeSingle();

    const judge = data as { judged_count: number } | null;

    await serverClient()
      .from("nv_players")
      .update({ judged_count: (judge?.judged_count ?? 0) + 1 })
      .eq("id", turn.judge_id);
  }

  const { data: linhas } = await serverClient()
    .from("nv_players")
    .select("*")
    .eq("room_id", room.id)
    .order("seat", { ascending: true });

  const players = (linhas as PlayerRow[] | null) ?? [];

  if (isGameOver(players)) {
    await saveMatch(room, players);

    await serverClient()
      .from("nv_rooms")
      .update({
        status: "done",
        current_turn_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id);

    return;
  }

  const proximo = await createTurn(room, players, turn.team);

  if (!proximo) {
    await serverClient()
      .from("nv_rooms")
      .update({ status: "done", current_turn_id: null })
      .eq("id", room.id);

    return;
  }

  await serverClient()
    .from("nv_rooms")
    .update({
      current_turn_id: proximo.id,
      round_number: room.round_number + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id);
}

async function saveMatch(room: RoomRow, players: PlayerRow[]) {
  if (room.is_test) {
    return;
  }

  const results = await roomResults(room.id);
  const score = scoreFrom(results);

  await serverClient().from("nv_matches").insert({
    room_code: room.code,
    deck_mode: room.deck_mode,
    score_red: score.red,
    score_blue: score.blue,
    winner: winnerOf(score),
    cards_played: results.filter((row) => !row.undone).length,
    players: players
      .filter((player) => player.team !== null)
      .map((player) => ({ name: player.name, team: player.team })),
  });
}

export async function restartMatch(room: RoomRow, eu: PlayerRow) {
  if (!eu.is_host) {
    failure(403);
  }

  const client = serverClient();

  await client.from("nv_results").delete().eq("room_id", room.id);
  await client.from("nv_turns").delete().eq("room_id", room.id);
  await client
    .from("nv_players")
    .update({ has_spoken: false, spoke_count: 0, judged_count: 0 })
    .eq("room_id", room.id);

  await client
    .from("nv_rooms")
    .update({
      status: "lobby",
      current_turn_id: null,
      round_number: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", room.id);
}

export async function shuffleTeams(room: RoomRow, eu: PlayerRow) {
  if (!eu.is_host) {
    failure(403);
  }

  const { data } = await serverClient()
    .from("nv_players")
    .select("*")
    .eq("room_id", room.id)
    .order("seat", { ascending: true });

  const players = (data as PlayerRow[] | null) ?? [];
  const map = assignTeams(players);

  await Promise.all(
    [...map.entries()].map(([playerId, team]) =>
      serverClient().from("nv_players").update({ team }).eq("id", playerId),
    ),
  );
}
