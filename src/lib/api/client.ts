import type {
  Card,
  DeckMode,
  Outcome,
  PlayerRow,
  ResultRow,
  RoomRow,
  Score,
  Team,
  TurnRow,
} from "@/types/game";

export interface EstadoDaSala {
  room: RoomRow;
  players: PlayerRow[];
  turn: TurnRow | null;
  card: Card | null;
  me: PlayerRow;
  score: Score;
  results: ResultRow[];
  now: string;
}

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });

  const corpo = (await resposta.json()) as T & { error?: string };

  if (!resposta.ok) {
    throw new Error(corpo.error ?? "Deu ruim aqui. Tenta de novo.");
  }

  return corpo;
}

export const api = {
  criarSala(name: string, deckMode: DeckMode) {
    return pedir<{ code: string; token: string; playerId: string }>(
      "/api/room/create",
      { method: "POST", body: JSON.stringify({ name, deckMode }) },
    );
  },

  entrar(code: string, name: string) {
    return pedir<{ code: string; token: string; playerId: string }>(
      "/api/room/join",
      { method: "POST", body: JSON.stringify({ code, name }) },
    );
  },

  estado(code: string, token: string) {
    return pedir<EstadoDaSala>(
      `/api/room/state?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`,
    );
  },

  trocarTime(code: string, token: string, team: Team) {
    return pedir("/api/room/lobby", {
      method: "POST",
      body: JSON.stringify({ code, token, action: "time", team }),
    });
  },

  trocarBaralho(code: string, token: string, deckMode: DeckMode) {
    return pedir("/api/room/lobby", {
      method: "POST",
      body: JSON.stringify({ code, token, action: "baralho", deckMode }),
    });
  },

  sortearTimes(code: string, token: string) {
    return pedir("/api/room/lobby", {
      method: "POST",
      body: JSON.stringify({ code, token, action: "sortear" }),
    });
  },

  comecarJogo(code: string, token: string) {
    return pedir("/api/room/lobby", {
      method: "POST",
      body: JSON.stringify({ code, token, action: "comecar" }),
    });
  },

  reiniciar(code: string, token: string) {
    return pedir("/api/room/lobby", {
      method: "POST",
      body: JSON.stringify({ code, token, action: "reiniciar" }),
    });
  },

  comecarTurno(code: string, token: string) {
    return pedir("/api/room/turn", {
      method: "POST",
      body: JSON.stringify({ code, token, action: "comecar" }),
    });
  },

  resultado(code: string, token: string, outcome: Outcome) {
    return pedir("/api/room/turn", {
      method: "POST",
      body: JSON.stringify({ code, token, action: "resultado", outcome }),
    });
  },

  desfazer(code: string, token: string) {
    return pedir("/api/room/turn", {
      method: "POST",
      body: JSON.stringify({ code, token, action: "desfazer" }),
    });
  },

  encerrarTurno(code: string, token: string) {
    return pedir("/api/room/turn", {
      method: "POST",
      body: JSON.stringify({ code, token, action: "encerrar" }),
    });
  },
};
