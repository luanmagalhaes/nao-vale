import type {
  Card,
  DeckMode,
  MatchRow,
  Outcome,
  PlayerRow,
  ResultRow,
  RoomRow,
  Score,
  Team,
  TurnRow,
} from "@/types/game";

export interface NextCard {
  card: Card | null;
  cardSeq: number;
}

export interface RoomState {
  room: RoomRow;
  players: PlayerRow[];
  turn: TurnRow | null;
  card: Card | null;
  me: PlayerRow;
  score: Score;
  results: ResultRow[];
  now: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });

  const body = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? "Deu ruim aqui. Tente de novo.");
  }

  return body;
}

function lobby(code: string, token: string, action: string, extra = {}) {
  return request("/api/room/lobby", {
    method: "POST",
    body: JSON.stringify({ code, token, action, ...extra }),
  });
}

function turn(code: string, token: string, action: string, extra = {}) {
  return request<NextCard>("/api/room/turn", {
    method: "POST",
    body: JSON.stringify({ code, token, action, ...extra }),
  });
}

export const api = {
  history() {
    return request<{ matches: MatchRow[] }>("/api/history");
  },

  createRoom(name: string, deckMode: DeckMode) {
    return request<{ code: string; token: string; playerId: string }>(
      "/api/room/create",
      { method: "POST", body: JSON.stringify({ name, deckMode }) },
    );
  },

  joinRoom(code: string, name: string) {
    return request<{ code: string; token: string; playerId: string }>(
      "/api/room/join",
      { method: "POST", body: JSON.stringify({ code, name }) },
    );
  },

  state(code: string, token: string) {
    return request<RoomState>(
      `/api/room/state?code=${encodeURIComponent(code)}&token=${encodeURIComponent(token)}`,
    );
  },

  changeTeam(code: string, token: string, team: Team) {
    return lobby(code, token, "team", { team });
  },

  changeDeck(code: string, token: string, deckMode: DeckMode) {
    return lobby(code, token, "deck", { deckMode });
  },

  drawTeams(code: string, token: string) {
    return lobby(code, token, "draw");
  },

  startGame(code: string, token: string) {
    return lobby(code, token, "start");
  },

  restart(code: string, token: string) {
    return lobby(code, token, "restart");
  },

  startTurn(code: string, token: string) {
    return turn(code, token, "start");
  },

  play(code: string, token: string, outcome: Outcome) {
    return turn(code, token, "play", { outcome });
  },

  undo(code: string, token: string) {
    return turn(code, token, "undo");
  },

  endTurn(code: string, token: string) {
    return turn(code, token, "end");
  },
};
