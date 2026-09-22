export type Heat = "mild" | "spicy" | "extra";

export type DeckMode = "mild" | "hot" | "mixed";

export type Team = "red" | "blue";

export type Outcome = "hit" | "skip" | "burn";

export type RoomStatus = "lobby" | "playing" | "done";

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
  spoke_count: number;
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
  is_test: boolean;
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
  red: number;
  blue: number;
}

export interface MatchPlayer {
  name: string;
  team: Team;
}

export interface MatchRow {
  id: string;
  room_code: string;
  deck_mode: DeckMode;
  score_red: number;
  score_blue: number;
  winner: Team | "tie" | null;
  players: MatchPlayer[];
  cards_played: number;
  finished_at: string;
}

export interface RankingRow {
  name: string;
  wins: number;
  matches: number;
  cards: number;
}
