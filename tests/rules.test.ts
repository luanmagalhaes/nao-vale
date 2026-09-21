import { describe, expect, it } from "vitest";
import {
  assignTeams,
  isGameOver,
  scoreFrom,
  canStart,
  nextTurn,
  scoringTeam,
  withoutTeam,
  rivalOf,
  winnerOf,
} from "@/lib/game/rules";
import { deckFor, deckSizes } from "@/data/deck";
import type { PlayerRow, ResultRow } from "@/types/game";

function player(parcial: Partial<PlayerRow> & { id: string }): PlayerRow {
  return {
    room_id: "room",
    name: parcial.id,
    team: "red",
    is_host: false,
    has_spoken: false,
    judged_count: 0,
    seat: 0,
    ...parcial,
  };
}

function outcomeCall(parcial: Partial<ResultRow>): ResultRow {
  return {
    id: crypto.randomUUID(),
    room_id: "room",
    turn_id: "turn",
    card_id: "s001",
    outcome: "hit",
    scoring_team: "red",
    undone: false,
    created_at: new Date().toISOString(),
    ...parcial,
  };
}

describe("pontuação", () => {
  it("dá o ponto ao team do speaker quando acerta", () => {
    expect(scoringTeam("hit", "red")).toBe("red");
  });

  it("dá o ponto ao adversário quando o judge queima a card", () => {
    expect(scoringTeam("burn", "red")).toBe("blue");
  });

  it("não dá ponto a ninguém quando o speaker pula", () => {
    expect(scoringTeam("skip", "red")).toBeNull();
  });

  it("ignora jogada desfeita no scoreFrom", () => {
    const placarFinal = scoreFrom([
      outcomeCall({ scoring_team: "red" }),
      outcomeCall({ scoring_team: "red", undone: true }),
      outcomeCall({ scoring_team: "blue" }),
    ]);

    expect(placarFinal).toEqual({ red: 1, blue: 1 });
  });

  it("aponta empate quando os dois teamList têm o mesmo total", () => {
    expect(winnerOf({ red: 3, blue: 3 })).toBe("tie");
  });
});

describe("ordem dos turnos", () => {
  const mesa = [
    player({ id: "a", team: "red", seat: 0 }),
    player({ id: "b", team: "blue", seat: 1 }),
    player({ id: "c", team: "red", seat: 2 }),
    player({ id: "d", team: "blue", seat: 3 }),
  ];

  it("começa pelo team vermelho", () => {
    expect(nextTurn(mesa, null)?.team).toBe("red");
  });

  it("alterna o team a cada turn", () => {
    expect(nextTurn(mesa, "red")?.team).toBe("blue");
  });

  it("escolhe como judge quem menos julgou no team adversário", () => {
    const comHistorico = [
      player({ id: "a", team: "red", seat: 0 }),
      player({ id: "b", team: "blue", seat: 1, judged_count: 2 }),
      player({ id: "c", team: "red", seat: 2 }),
      player({ id: "d", team: "blue", seat: 3, judged_count: 0 }),
    ];

    expect(nextTurn(comHistorico, null)?.judgeId).toBe("d");
  });

  it("volta ao team que ainda tem people quando o outro já falou", () => {
    const quaseFim = [
      player({ id: "a", team: "red", seat: 0, has_spoken: true }),
      player({ id: "b", team: "blue", seat: 1, has_spoken: true }),
      player({ id: "c", team: "red", seat: 2 }),
      player({ id: "d", team: "blue", seat: 3, has_spoken: true }),
    ];

    expect(nextTurn(quaseFim, "red")?.team).toBe("red");
  });

  it("encerra quando todo mundo já falou uma vez", () => {
    const todosFalaram = mesa.map((person) => ({ ...person, has_spoken: true }));

    expect(nextTurn(todosFalaram, "blue")).toBeNull();
    expect(isGameOver(todosFalaram)).toBe(true);
  });
});

describe("abertura da room", () => {
  it("exige quatro pessoas com dois de cada lado", () => {
    const trio = [
      player({ id: "a", team: "red", seat: 0 }),
      player({ id: "b", team: "blue", seat: 1 }),
      player({ id: "c", team: "red", seat: 2 }),
    ];

    expect(canStart(trio)).toBe(false);
  });

  it("não deixa começar com people sem team", () => {
    const mesa = [
      player({ id: "a", team: "red", seat: 0 }),
      player({ id: "b", team: "blue", seat: 1 }),
      player({ id: "c", team: "red", seat: 2 }),
      player({ id: "d", team: "blue", seat: 3 }),
      player({ id: "e", team: null, seat: 4 }),
    ];

    expect(withoutTeam(mesa)).toHaveLength(1);
    expect(canStart(mesa)).toBe(false);
  });
});

describe("sorteio de teamList", () => {
  const mesa = Array.from({ length: 7 }, (_, index) =>
    player({ id: `p${index}`, team: null, seat: index }),
  );

  it("dá team para todo mundo", () => {
    const map = assignTeams(mesa);

    expect(map.size).toBe(mesa.length);
    expect([...map.values()].every((team) => team !== null)).toBe(true);
  });

  it("deixa no máximo uma person de diferença com número ímpar", () => {
    const map = assignTeams(mesa);
    const valores = [...map.values()];
    const vermelho = valores.filter((team) => team === "red").length;
    const azul = valores.filter((team) => team === "blue").length;

    expect(Math.abs(vermelho - azul)).toBe(1);
    expect(vermelho + azul).toBe(7);
  });

  it("não manda as mesmas pessoas para o mesmo team toda vez", () => {
    const rodadas = Array.from({ length: 24 }, () => {
      const map = assignTeams(mesa);

      return mesa.map((person) => map.get(person.id)).join(",");
    });

    expect(new Set(rodadas).size).toBeGreaterThan(1);
  });
});

describe("deck", () => {
  it("separa o mode suave do apimentado", () => {
    expect(deckFor("mild").every((card) => card.heat === "mild")).toBe(true);
    expect(deckFor("hot").some((card) => card.heat === "extra")).toBe(
      true,
    );
  });

  it("junta tudo no mode misto", () => {
    expect(deckFor("mixed").length).toBe(deckSizes.mixed);
  });

  it("dá cinco palavras proibidas em toda card", () => {
    expect(
      deckFor("mixed").every((card) => card.forbidden.length === 5),
    ).toBe(true);
  });

  it("não repete id entre as cardList", () => {
    const ids = deckFor("mixed").map((card) => card.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("teamList", () => {
  it("sabe quem é o adversário", () => {
    expect(rivalOf("red")).toBe("blue");
    expect(rivalOf("blue")).toBe("red");
  });
});
