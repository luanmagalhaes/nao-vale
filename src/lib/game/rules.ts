import type {
  Outcome,
  PlayerRow,
  ResultRow,
  Score,
  Team,
} from "@/types/game";

export const times: readonly Team[] = ["vermelho", "azul"];

export const minPlayers = 4;
export const maxPlayers = 16;

export function timeAdversario(time: Team): Team {
  return time === "vermelho" ? "azul" : "vermelho";
}

export function scoringTeam(outcome: Outcome, timeDoFalante: Team): Team | null {
  if (outcome === "acerto") {
    return timeDoFalante;
  }

  if (outcome === "queima") {
    return timeAdversario(timeDoFalante);
  }

  return null;
}

export function placar(results: readonly ResultRow[]): Score {
  return results.reduce<Score>(
    (acumulado, resultado) => {
      if (resultado.undone || !resultado.scoring_team) {
        return acumulado;
      }

      return {
        ...acumulado,
        [resultado.scoring_team]: acumulado[resultado.scoring_team] + 1,
      };
    },
    { vermelho: 0, azul: 0 },
  );
}

export function vencedor(score: Score): Team | "empate" {
  if (score.vermelho > score.azul) {
    return "vermelho";
  }

  if (score.azul > score.vermelho) {
    return "azul";
  }

  return "empate";
}

export function timesEquilibrados(players: readonly PlayerRow[]): boolean {
  const vermelho = players.filter((jogador) => jogador.team === "vermelho").length;
  const azul = players.filter((jogador) => jogador.team === "azul").length;

  return vermelho >= 2 && azul >= 2;
}

export function podeComecar(players: readonly PlayerRow[]): boolean {
  return players.length >= minPlayers && timesEquilibrados(players);
}

export interface PlanoDeTurno {
  speakerId: string;
  judgeId: string;
  team: Team;
}

export function proximoTurno(
  players: readonly PlayerRow[],
  timeAnterior: Team | null,
): PlanoDeTurno | null {
  const pendentes = players.filter(
    (jogador) => !jogador.has_spoken && jogador.team !== null,
  );

  if (pendentes.length === 0) {
    return null;
  }

  const preferido = timeAnterior ? timeAdversario(timeAnterior) : "vermelho";
  const temPreferido = pendentes.some((jogador) => jogador.team === preferido);
  const time = temPreferido ? preferido : timeAdversario(preferido);

  const falante = [...pendentes]
    .filter((jogador) => jogador.team === time)
    .sort((a, b) => a.seat - b.seat)[0];

  if (!falante) {
    return null;
  }

  const adversarios = players.filter(
    (jogador) => jogador.team === timeAdversario(time),
  );

  const juiz = [...adversarios].sort(
    (a, b) => a.judged_count - b.judged_count || a.seat - b.seat,
  )[0];

  if (!juiz) {
    return null;
  }

  return { speakerId: falante.id, judgeId: juiz.id, team: time };
}

export function jogoAcabou(players: readonly PlayerRow[]): boolean {
  const comTime = players.filter((jogador) => jogador.team !== null);

  return (
    comTime.length > 0 && comTime.every((jogador) => jogador.has_spoken)
  );
}

export function embaralhar<T>(itens: readonly T[]): T[] {
  const copia = [...itens];

  for (let indice = copia.length - 1; indice > 0; indice -= 1) {
    const sorteado = Math.floor(Math.random() * (indice + 1));
    [copia[indice], copia[sorteado]] = [copia[sorteado], copia[indice]];
  }

  return copia;
}

export function gerarCodigo(): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";

  return Array.from(
    { length: 4 },
    () => letras[Math.floor(Math.random() * letras.length)],
  ).join("");
}

export function distribuirTimes(players: readonly PlayerRow[]): Map<string, Team> {
  const mapa = new Map<string, Team>();

  [...players]
    .sort((a, b) => a.seat - b.seat)
    .forEach((jogador, indice) => {
      mapa.set(jogador.id, indice % 2 === 0 ? "vermelho" : "azul");
    });

  return mapa;
}
