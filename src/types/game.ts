export type Heat = "suave" | "picante" | "extra";

export type DeckMode = "suave" | "apimentado" | "misto";

export type Team = "vermelho" | "azul";

export type Outcome = "acerto" | "pulo" | "queima";

export type RoomStatus = "lobby" | "jogando" | "fim";

export type TurnStatus = "ready" | "running" | "done";

export interface Card {
  id: string;
  word: string;
  forbidden: readonly [string, string, string, string, string];
  heat: Heat;
}

export interface PlayerRow {
  id: string;
  room_id: string;
  name: string;
  team: Team | null;
  is_host: boolean;
  has_spoken: boolean;
  judged_count: number;
  seat: number;
}

export interface RoomRow {
  id: string;
  code: string;
  host_id: string | null;
  deck_mode: DeckMode;
  turn_seconds: number;
  status: RoomStatus;
  current_turn_id: string | null;
  round_number: number;
}

export interface TurnRow {
  id: string;
  room_id: string;
  speaker_id: string;
  judge_id: string | null;
  team: Team;
  status: TurnStatus;
  card_seq: number;
  started_at: string | null;
  ends_at: string | null;
}

export interface ResultRow {
  id: string;
  room_id: string;
  turn_id: string;
  card_id: string;
  outcome: Outcome;
  scoring_team: Team | null;
  undone: boolean;
  created_at: string;
}

export interface Score {
  vermelho: number;
  azul: number;
}
