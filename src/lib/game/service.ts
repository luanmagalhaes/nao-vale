import { randomUUID } from "node:crypto";
import { ServiceError, mensagemPara } from "@/lib/messages";
import { serverClient } from "@/lib/supabase/server";
import { cardById, deckFor } from "@/data/deck";
import {
  distribuirTimes,
  embaralhar,
  gerarCodigo,
  jogoAcabou,
  placar,
  podeComecar,
  proximoTurno,
  scoringTeam,
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

function falha(status: number): never {
  throw new ServiceError(status, mensagemPara(status));
}

const horasParaReciclar = 8;

async function reciclarSalasParadas() {
  const limite = new Date(
    Date.now() - horasParaReciclar * 60 * 60 * 1000,
  ).toISOString();

  await serverClient().from("nv_rooms").delete().lt("updated_at", limite);
}

async function codigoLivre(): Promise<string> {
  for (let rodada = 0; rodada < 2; rodada += 1) {
    for (let tentativa = 0; tentativa < 40; tentativa += 1) {
      const code = gerarCodigo();
      const { data } = await serverClient()
        .from("nv_rooms")
        .select("id")
        .eq("code", code)
        .maybeSingle();

      if (!data) {
        return code;
      }
    }

    await reciclarSalasParadas();
  }

  throw new ServiceError(
    409,
    "Todas as salas estão ocupadas agora. Espera alguém terminar.",
  );
}

async function criarSegredo(playerId: string): Promise<string> {
  const secret = randomUUID();

  await serverClient()
    .from("nv_player_secrets")
    .insert({ player_id: playerId, secret });

  return secret;
}

export async function criarSala(name: string, deckMode: DeckMode) {
  const nome = name.trim();

  if (nome.length < 2) {
    falha(400);
  }

  const code = await codigoLivre();

  const { data: sala } = await serverClient()
    .from("nv_rooms")
    .insert({ code, deck_mode: deckMode })
    .select("*")
    .single();

  if (!sala) {
    falha(500);
  }

  const { data: jogador } = await serverClient()
    .from("nv_players")
    .insert({
      room_id: (sala as RoomRow).id,
      name: nome,
      team: null,
      is_host: true,
      seat: 0,
    })
    .select("*")
    .single();

  if (!jogador) {
    falha(500);
  }

  const token = await criarSegredo((jogador as PlayerRow).id);

  await serverClient()
    .from("nv_rooms")
    .update({ host_id: (jogador as PlayerRow).id })
    .eq("id", (sala as RoomRow).id);

  return { code, token, playerId: (jogador as PlayerRow).id };
}

export async function entrarNaSala(code: string, name: string) {
  const nome = name.trim();

  if (nome.length < 2) {
    falha(400);
  }

  const { data } = await serverClient()
    .from("nv_rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  const sala = data as RoomRow | null;

  if (!sala) {
    falha(404);
  }

  if (sala.status !== "lobby") {
    falha(409);
  }

  const { count } = await serverClient()
    .from("nv_players")
    .select("id", { count: "exact", head: true })
    .eq("room_id", sala.id);

  const seat = count ?? 0;

  const { data: jogador } = await serverClient()
    .from("nv_players")
    .insert({
      room_id: sala.id,
      name: nome,
      team: null,
      seat,
    })
    .select("*")
    .single();

  if (!jogador) {
    falha(500);
  }

  const token = await criarSegredo((jogador as PlayerRow).id);

  return { code: sala.code, token, playerId: (jogador as PlayerRow).id };
}

async function resultadosDaSala(roomId: string): Promise<ResultRow[]> {
  const { data } = await serverClient()
    .from("nv_results")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  return (data as ResultRow[] | null) ?? [];
}

async function cartaDoTurno(turnId: string): Promise<Card | null> {
  const { data } = await serverClient()
    .from("nv_turn_state")
    .select("card_id")
    .eq("turn_id", turnId)
    .maybeSingle();

  const linha = data as { card_id: string | null } | null;

  if (!linha?.card_id) {
    return null;
  }

  return cardById(linha.card_id);
}

export async function estadoDaSala(sala: RoomRow, eu: PlayerRow) {
  const cliente = serverClient();

  const [{ data: jogadores }, resultados] = await Promise.all([
    cliente
      .from("nv_players")
      .select("*")
      .eq("room_id", sala.id)
      .order("seat", { ascending: true }),
    resultadosDaSala(sala.id),
  ]);

  let turno: TurnRow | null = null;

  if (sala.current_turn_id) {
    const { data } = await cliente
      .from("nv_turns")
      .select("*")
      .eq("id", sala.current_turn_id)
      .maybeSingle();

    turno = (data as TurnRow | null) ?? null;
  }

  const souFalante = turno?.speaker_id === eu.id;
  const souJuiz = turno?.judge_id === eu.id;
  const podeVerCarta = Boolean(turno && turno.status === "running") &&
    (souFalante || souJuiz);

  const carta = podeVerCarta && turno ? await cartaDoTurno(turno.id) : null;

  return {
    room: sala,
    players: (jogadores as PlayerRow[] | null) ?? [],
    turn: turno,
    card: carta,
    me: eu,
    score: placar(resultados),
    results: resultados.slice(-12),
    now: new Date().toISOString(),
  };
}

export async function definirTime(sala: RoomRow, eu: PlayerRow, team: Team) {
  if (sala.status !== "lobby") {
    falha(409);
  }

  await serverClient()
    .from("nv_players")
    .update({ team })
    .eq("id", eu.id);
}

export async function definirBaralho(
  sala: RoomRow,
  eu: PlayerRow,
  deckMode: DeckMode,
) {
  if (!eu.is_host) {
    falha(403);
  }

  await serverClient()
    .from("nv_rooms")
    .update({ deck_mode: deckMode, updated_at: new Date().toISOString() })
    .eq("id", sala.id);
}

async function montarPilha(sala: RoomRow) {
  const cartas = embaralhar(deckFor(sala.deck_mode));

  await serverClient().from("nv_draw_pile").delete().eq("room_id", sala.id);

  await serverClient().from("nv_draw_pile").insert(
    cartas.map((carta, indice) => ({
      room_id: sala.id,
      card_id: carta.id,
      position: indice,
    })),
  );
}

async function puxarCarta(sala: RoomRow): Promise<string> {
  const cliente = serverClient();

  const { data } = await cliente
    .from("nv_draw_pile")
    .select("card_id, position")
    .eq("room_id", sala.id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  const topo = data as { card_id: string; position: number } | null;

  if (!topo) {
    await montarPilha(sala);

    const { data: novo } = await cliente
      .from("nv_draw_pile")
      .select("card_id")
      .eq("room_id", sala.id)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    const recarregado = novo as { card_id: string } | null;

    if (!recarregado) {
      falha(500);
    }

    await cliente
      .from("nv_draw_pile")
      .delete()
      .eq("room_id", sala.id)
      .eq("card_id", recarregado.card_id);

    return recarregado.card_id;
  }

  await cliente
    .from("nv_draw_pile")
    .delete()
    .eq("room_id", sala.id)
    .eq("card_id", topo.card_id);

  return topo.card_id;
}

async function devolverAoFim(sala: RoomRow, cardId: string) {
  const { data } = await serverClient()
    .from("nv_draw_pile")
    .select("position")
    .eq("room_id", sala.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ultima = data as { position: number } | null;

  await serverClient()
    .from("nv_draw_pile")
    .upsert({
      room_id: sala.id,
      card_id: cardId,
      position: (ultima?.position ?? 0) + 1,
    });
}

async function criarTurno(
  sala: RoomRow,
  jogadores: PlayerRow[],
  timeAnterior: Team | null,
): Promise<TurnRow | null> {
  const plano = proximoTurno(jogadores, timeAnterior);

  if (!plano) {
    return null;
  }

  const { data } = await serverClient()
    .from("nv_turns")
    .insert({
      room_id: sala.id,
      speaker_id: plano.speakerId,
      judge_id: plano.judgeId,
      team: plano.team,
    })
    .select("*")
    .single();

  const turno = data as TurnRow | null;

  if (!turno) {
    falha(500);
  }

  await serverClient()
    .from("nv_turn_state")
    .upsert({ turn_id: turno.id, card_id: null });

  return turno;
}

export async function comecarJogo(sala: RoomRow, eu: PlayerRow) {
  if (!eu.is_host) {
    falha(403);
  }

  if (sala.status !== "lobby") {
    falha(409);
  }

  const { data } = await serverClient()
    .from("nv_players")
    .select("*")
    .eq("room_id", sala.id)
    .order("seat", { ascending: true });

  const jogadores = (data as PlayerRow[] | null) ?? [];

  if (!podeComecar(jogadores)) {
    throw new ServiceError(
      400,
      "Precisa de pelo menos 4 pessoas, com 2 em cada time.",
    );
  }

  await montarPilha(sala);

  const turno = await criarTurno(sala, jogadores, null);

  if (!turno) {
    falha(500);
  }

  await serverClient()
    .from("nv_rooms")
    .update({
      status: "jogando",
      current_turn_id: turno.id,
      round_number: 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sala.id);
}

const errosDoBanco: Record<string, { status: number; texto: string }> = {
  sala: { status: 404, texto: "Essa sala não existe." },
  jogador: { status: 401, texto: "Você não está nessa sala." },
  turno: { status: 409, texto: "A rodada mudou. Recarregue a página." },
  permissao: { status: 403, texto: "Essa jogada não é sua." },
  carta: { status: 409, texto: "Nenhuma carta em jogo agora." },
  vazio: { status: 409, texto: "Não tem jogada para desfazer neste turno." },
};

interface RespostaDeCarta {
  cardId?: string | null;
  cardSeq?: number;
  error?: string;
}

async function chamarJogada(
  funcao: string,
  argumentos: Record<string, string>,
): Promise<{ card: Card | null; cardSeq: number }> {
  const { data, error } = await serverClient().rpc(funcao, argumentos);

  if (error) {
    falha(500);
  }

  const resposta = data as RespostaDeCarta;

  if (resposta?.error) {
    const conhecido = errosDoBanco[resposta.error];

    throw new ServiceError(
      conhecido?.status ?? 409,
      conhecido?.texto ?? mensagemPara(409),
    );
  }

  return {
    card: resposta.cardId ? cardById(resposta.cardId) : null,
    cardSeq: resposta.cardSeq ?? 0,
  };
}

export function iniciarTurno(code: string, token: string) {
  return chamarJogada("nv_start_turn", { p_code: code, p_secret: token });
}

export function jogarCarta(code: string, token: string, outcome: Outcome) {
  return chamarJogada("nv_play", {
    p_code: code,
    p_secret: token,
    p_outcome: outcome,
  });
}

export function desfazerJogada(code: string, token: string) {
  return chamarJogada("nv_undo", { p_code: code, p_secret: token });
}

async function turnoDaSala(sala: RoomRow): Promise<TurnRow> {
  if (!sala.current_turn_id) {
    falha(409);
  }

  const { data } = await serverClient()
    .from("nv_turns")
    .select("*")
    .eq("id", sala.current_turn_id)
    .maybeSingle();

  const turno = data as TurnRow | null;

  if (!turno) {
    falha(409);
  }

  return turno;
}

export async function registrarResultado(
  sala: RoomRow,
  eu: PlayerRow,
  outcome: Outcome,
) {
  const turno = await turnoDaSala(sala);

  if (turno.status !== "running") {
    falha(409);
  }

  const ehFalante = turno.speaker_id === eu.id;
  const ehJuiz = turno.judge_id === eu.id;

  if (outcome === "queima" ? !ehJuiz : !ehFalante) {
    falha(403);
  }

  const { data } = await serverClient()
    .from("nv_turn_state")
    .select("card_id")
    .eq("turn_id", turno.id)
    .maybeSingle();

  const atual = data as { card_id: string | null } | null;

  if (!atual?.card_id) {
    falha(409);
  }

  await serverClient().from("nv_results").insert({
    room_id: sala.id,
    turn_id: turno.id,
    card_id: atual.card_id,
    outcome,
    scoring_team: scoringTeam(outcome, turno.team),
  });

  if (outcome === "pulo") {
    await devolverAoFim(sala, atual.card_id);
  }

  const proxima = await puxarCarta(sala);
  const seq = turno.card_seq + 1;

  await serverClient()
    .from("nv_turn_state")
    .upsert({ turn_id: turno.id, card_id: proxima });

  await serverClient()
    .from("nv_turns")
    .update({ card_seq: seq })
    .eq("id", turno.id);

  return { card: cardById(proxima), cardSeq: seq };
}

export async function desfazerUltima(sala: RoomRow, eu: PlayerRow) {
  const turno = await turnoDaSala(sala);

  if (turno.speaker_id !== eu.id && turno.judge_id !== eu.id) {
    falha(403);
  }

  const { data } = await serverClient()
    .from("nv_results")
    .select("*")
    .eq("turn_id", turno.id)
    .eq("undone", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const ultimo = data as ResultRow | null;

  if (!ultimo) {
    throw new ServiceError(409, "Não tem jogada para desfazer neste turno.");
  }

  await serverClient()
    .from("nv_results")
    .update({ undone: true })
    .eq("id", ultimo.id);

  const { data: estadoAtual } = await serverClient()
    .from("nv_turn_state")
    .select("card_id")
    .eq("turn_id", turno.id)
    .maybeSingle();

  const atual = estadoAtual as { card_id: string | null } | null;

  if (atual?.card_id) {
    await devolverAoFim(sala, atual.card_id);
  }

  const seq = turno.card_seq + 1;

  await serverClient()
    .from("nv_turn_state")
    .upsert({ turn_id: turno.id, card_id: ultimo.card_id });

  await serverClient()
    .from("nv_turns")
    .update({ card_seq: seq })
    .eq("id", turno.id);

  return { card: cardById(ultimo.card_id), cardSeq: seq };
}

export async function encerrarTurno(sala: RoomRow) {
  const turno = await turnoDaSala(sala);

  if (turno.status === "done") {
    return;
  }

  await serverClient()
    .from("nv_turns")
    .update({ status: "done" })
    .eq("id", turno.id);

  await serverClient()
    .from("nv_players")
    .update({ has_spoken: true })
    .eq("id", turno.speaker_id);

  if (turno.judge_id) {
    const { data } = await serverClient()
      .from("nv_players")
      .select("judged_count")
      .eq("id", turno.judge_id)
      .maybeSingle();

    const juiz = data as { judged_count: number } | null;

    await serverClient()
      .from("nv_players")
      .update({ judged_count: (juiz?.judged_count ?? 0) + 1 })
      .eq("id", turno.judge_id);
  }

  const { data: linhas } = await serverClient()
    .from("nv_players")
    .select("*")
    .eq("room_id", sala.id)
    .order("seat", { ascending: true });

  const jogadores = (linhas as PlayerRow[] | null) ?? [];

  if (jogoAcabou(jogadores)) {
    await serverClient()
      .from("nv_rooms")
      .update({
        status: "fim",
        current_turn_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sala.id);

    return;
  }

  const proximo = await criarTurno(sala, jogadores, turno.team);

  if (!proximo) {
    await serverClient()
      .from("nv_rooms")
      .update({ status: "fim", current_turn_id: null })
      .eq("id", sala.id);

    return;
  }

  await serverClient()
    .from("nv_rooms")
    .update({
      current_turn_id: proximo.id,
      round_number: sala.round_number + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sala.id);
}

export async function reiniciarPartida(sala: RoomRow, eu: PlayerRow) {
  if (!eu.is_host) {
    falha(403);
  }

  const cliente = serverClient();

  await cliente.from("nv_results").delete().eq("room_id", sala.id);
  await cliente.from("nv_turns").delete().eq("room_id", sala.id);
  await cliente
    .from("nv_players")
    .update({ has_spoken: false, judged_count: 0 })
    .eq("room_id", sala.id);

  await cliente
    .from("nv_rooms")
    .update({
      status: "lobby",
      current_turn_id: null,
      round_number: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sala.id);
}

export async function distribuirTimesAutomatico(sala: RoomRow, eu: PlayerRow) {
  if (!eu.is_host) {
    falha(403);
  }

  const { data } = await serverClient()
    .from("nv_players")
    .select("*")
    .eq("room_id", sala.id)
    .order("seat", { ascending: true });

  const jogadores = (data as PlayerRow[] | null) ?? [];
  const mapa = distribuirTimes(jogadores);

  await Promise.all(
    [...mapa.entries()].map(([playerId, team]) =>
      serverClient().from("nv_players").update({ team }).eq("id", playerId),
    ),
  );
}
