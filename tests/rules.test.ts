import { describe, expect, it } from "vitest";
import {
  jogoAcabou,
  placar,
  podeComecar,
  proximoTurno,
  scoringTeam,
  timeAdversario,
  vencedor,
} from "@/lib/game/rules";
import { deckFor, deckSizes } from "@/data/deck";
import type { PlayerRow, ResultRow } from "@/types/game";

function jogador(parcial: Partial<PlayerRow> & { id: string }): PlayerRow {
  return {
    room_id: "sala",
    name: parcial.id,
    team: "vermelho",
    is_host: false,
    has_spoken: false,
    judged_count: 0,
    seat: 0,
    ...parcial,
  };
}

function resultado(parcial: Partial<ResultRow>): ResultRow {
  return {
    id: crypto.randomUUID(),
    room_id: "sala",
    turn_id: "turno",
    card_id: "s001",
    outcome: "acerto",
    scoring_team: "vermelho",
    undone: false,
    created_at: new Date().toISOString(),
    ...parcial,
  };
}

describe("pontuação", () => {
  it("dá o ponto ao time do falante quando acerta", () => {
    expect(scoringTeam("acerto", "vermelho")).toBe("vermelho");
  });

  it("dá o ponto ao adversário quando o juiz queima a carta", () => {
    expect(scoringTeam("queima", "vermelho")).toBe("azul");
  });

  it("não dá ponto a ninguém quando o falante pula", () => {
    expect(scoringTeam("pulo", "vermelho")).toBeNull();
  });

  it("ignora jogada desfeita no placar", () => {
    const placarFinal = placar([
      resultado({ scoring_team: "vermelho" }),
      resultado({ scoring_team: "vermelho", undone: true }),
      resultado({ scoring_team: "azul" }),
    ]);

    expect(placarFinal).toEqual({ vermelho: 1, azul: 1 });
  });

  it("aponta empate quando os dois times têm o mesmo total", () => {
    expect(vencedor({ vermelho: 3, azul: 3 })).toBe("empate");
  });
});

describe("ordem dos turnos", () => {
  const mesa = [
    jogador({ id: "a", team: "vermelho", seat: 0 }),
    jogador({ id: "b", team: "azul", seat: 1 }),
    jogador({ id: "c", team: "vermelho", seat: 2 }),
    jogador({ id: "d", team: "azul", seat: 3 }),
  ];

  it("começa pelo time vermelho", () => {
    expect(proximoTurno(mesa, null)?.team).toBe("vermelho");
  });

  it("alterna o time a cada turno", () => {
    expect(proximoTurno(mesa, "vermelho")?.team).toBe("azul");
  });

  it("escolhe como juiz quem menos julgou no time adversário", () => {
    const comHistorico = [
      jogador({ id: "a", team: "vermelho", seat: 0 }),
      jogador({ id: "b", team: "azul", seat: 1, judged_count: 2 }),
      jogador({ id: "c", team: "vermelho", seat: 2 }),
      jogador({ id: "d", team: "azul", seat: 3, judged_count: 0 }),
    ];

    expect(proximoTurno(comHistorico, null)?.judgeId).toBe("d");
  });

  it("volta ao time que ainda tem gente quando o outro já falou", () => {
    const quaseFim = [
      jogador({ id: "a", team: "vermelho", seat: 0, has_spoken: true }),
      jogador({ id: "b", team: "azul", seat: 1, has_spoken: true }),
      jogador({ id: "c", team: "vermelho", seat: 2 }),
      jogador({ id: "d", team: "azul", seat: 3, has_spoken: true }),
    ];

    expect(proximoTurno(quaseFim, "vermelho")?.team).toBe("vermelho");
  });

  it("encerra quando todo mundo já falou uma vez", () => {
    const todosFalaram = mesa.map((pessoa) => ({ ...pessoa, has_spoken: true }));

    expect(proximoTurno(todosFalaram, "azul")).toBeNull();
    expect(jogoAcabou(todosFalaram)).toBe(true);
  });
});

describe("abertura da sala", () => {
  it("exige quatro pessoas com dois de cada lado", () => {
    const trio = [
      jogador({ id: "a", team: "vermelho", seat: 0 }),
      jogador({ id: "b", team: "azul", seat: 1 }),
      jogador({ id: "c", team: "vermelho", seat: 2 }),
    ];

    expect(podeComecar(trio)).toBe(false);
  });
});

describe("baralho", () => {
  it("separa o modo suave do apimentado", () => {
    expect(deckFor("suave").every((carta) => carta.heat === "suave")).toBe(true);
    expect(deckFor("apimentado").some((carta) => carta.heat === "extra")).toBe(
      true,
    );
  });

  it("junta tudo no modo misto", () => {
    expect(deckFor("misto").length).toBe(deckSizes.misto);
  });

  it("dá cinco palavras proibidas em toda carta", () => {
    expect(
      deckFor("misto").every((carta) => carta.forbidden.length === 5),
    ).toBe(true);
  });

  it("não repete id entre as cartas", () => {
    const ids = deckFor("misto").map((carta) => carta.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("times", () => {
  it("sabe quem é o adversário", () => {
    expect(timeAdversario("vermelho")).toBe("azul");
    expect(timeAdversario("azul")).toBe("vermelho");
  });
});
