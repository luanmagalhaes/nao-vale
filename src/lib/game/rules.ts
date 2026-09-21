import type {
  Outcome,
  PlayerRow,
  ResultRow,
  Score,
  Team,
} from "@/types/game";

export const teams: readonly Team[] = ["red", "blue"];

export const minPlayers = 4;
export const maxPlayers = 16;
export const codeLength = 2;

export function rivalOf(team: Team): Team {
  return team === "red" ? "blue" : "red";
}

export function scoringTeam(outcome: Outcome, speakerTeam: Team): Team | null {
  if (outcome === "hit") {
    return speakerTeam;
  }

  if (outcome === "burn") {
    return rivalOf(speakerTeam);
  }

  return null;
}

export function scoreFrom(results: readonly ResultRow[]): Score {
  return results.reduce<Score>(
    (acc, result) => {
      if (result.undone || !result.scoring_team) {
        return acc;
      }

      return {
        ...acc,
        [result.scoring_team]: acc[result.scoring_team] + 1,
      };
    },
    { red: 0, blue: 0 },
  );
}

export function winnerOf(score: Score): Team | "tie" {
  if (score.red > score.blue) {
    return "red";
  }

  if (score.blue > score.red) {
    return "blue";
  }

  return "tie";
}

export function teamsBalanced(players: readonly PlayerRow[]): boolean {
  const red = players.filter((player) => player.team === "red").length;
  const blue = players.filter((player) => player.team === "blue").length;

  return red >= 2 && blue >= 2;
}

export function withoutTeam(players: readonly PlayerRow[]): PlayerRow[] {
  return players.filter((player) => player.team === null);
}

export function canStart(players: readonly PlayerRow[]): boolean {
  return (
    players.length >= minPlayers &&
    withoutTeam(players).length === 0 &&
    teamsBalanced(players)
  );
}

export interface TurnPlan {
  speakerId: string;
  judgeId: string;
  team: Team;
}

export function nextTurn(
  players: readonly PlayerRow[],
  previousTeam: Team | null,
): TurnPlan | null {
  const pending = players.filter(
    (player) => !player.has_spoken && player.team !== null,
  );

  if (pending.length === 0) {
    return null;
  }

  const preferred = previousTeam ? rivalOf(previousTeam) : "red";
  const hasPreferred = pending.some((player) => player.team === preferred);
  const team = hasPreferred ? preferred : rivalOf(preferred);

  const speaker = [...pending]
    .filter((player) => player.team === team)
    .sort((a, b) => a.seat - b.seat)[0];

  if (!speaker) {
    return null;
  }

  const rivals = players.filter((player) => player.team === rivalOf(team));

  const judge = [...rivals].sort(
    (a, b) => a.judged_count - b.judged_count || a.seat - b.seat,
  )[0];

  if (!judge) {
    return null;
  }

  return { speakerId: speaker.id, judgeId: judge.id, team };
}

export function isGameOver(players: readonly PlayerRow[]): boolean {
  const withTeam = players.filter((player) => player.team !== null);

  return withTeam.length > 0 && withTeam.every((player) => player.has_spoken);
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const picked = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[picked]] = [copy[picked], copy[index]];
  }

  return copy;
}

export function makeCode(): string {
  return String(10 + Math.floor(Math.random() * 90));
}

export function assignTeams(players: readonly PlayerRow[]): Map<string, Team> {
  const map = new Map<string, Team>();

  shuffle(players).forEach((player, index) => {
    map.set(player.id, index % 2 === 0 ? "red" : "blue");
  });

  return map;
}
