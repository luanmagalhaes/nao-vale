import { describe, expect, it } from "vitest";
import {
  turnsTaken,
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
    spoke_count: 0,
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
  it("dá o ponto ao time de quem explica quando acerta", () => {
    expect(scoringTeam("hit", "red")).toBe("red");
  });

  it("dá o ponto ao adversário quando o juiz queima a carta", () => {
    expect(scoringTeam("burn", "red")).toBe("blue");
  });

  it("não dá ponto a ninguém quando quem explica pula", () => {
    expect(scoringTeam("skip", "red")).toBeNull();
  });

  it("ignora jogada desfeita no placar", () => {
    const placarFinal = scoreFrom([
      outcomeCall({ scoring_team: "red" }),
      outcomeCall({ scoring_team: "red", undone: true }),
      outcomeCall({ scoring_team: "blue" }),
    ]);

    expect(placarFinal).toEqual({ red: 1, blue: 1 });
  });

  it("aponta empate quando os dois times têm o mesmo total", () => {
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

  it("começa pelo time vermelho", () => {
    expect(nextTurn(mesa, null)?.team).toBe("red");
  });

  it("alterna o time a cada turno", () => {
    expect(nextTurn(mesa, "red")?.team).toBe("blue");
  });

  it("escolhe como juiz quem menos julgou no time adversário", () => {
    const comHistorico = [
      player({ id: "a", team: "red", seat: 0 }),
      player({ id: "b", team: "blue", seat: 1, judged_count: 2 }),
      player({ id: "c", team: "red", seat: 2 }),
      player({ id: "d", team: "blue", seat: 3, judged_count: 0 }),
    ];

    expect(nextTurn(comHistorico, null)?.judgeId).toBe("d");
  });

  it("volta ao time que ainda tem gente quando o outro já falou", () => {
    const quaseFim = [
      player({ id: "a", team: "red", seat: 0, spoke_count: 1 }),
      player({ id: "b", team: "blue", seat: 1, spoke_count: 1 }),
      player({ id: "c", team: "red", seat: 2 }),
      player({ id: "d", team: "blue", seat: 3, spoke_count: 1 }),
    ];

    expect(nextTurn(quaseFim, "red")?.team).toBe("red");
  });

  it("encerra quando todo mundo falou e os times jogaram o mesmo tanto", () => {
    const todosFalaram = mesa.map((person) => ({
      ...person,
      has_spoken: true,
      spoke_count: 1,
    }));

    expect(nextTurn(todosFalaram, "blue")).toBeNull();
    expect(isGameOver(todosFalaram)).toBe(true);
  });
});

describe("time ímpar joga o mesmo tanto", () => {
  const mesaImpar = [
    player({ id: "a", team: "red", seat: 0, spoke_count: 1 }),
    player({ id: "b", team: "red", seat: 1, spoke_count: 1 }),
    player({ id: "c", team: "red", seat: 2, spoke_count: 1 }),
    player({ id: "d", team: "blue", seat: 3, spoke_count: 1 }),
    player({ id: "e", team: "blue", seat: 4, spoke_count: 1 }),
  ];

  it("não encerra com o time menor devendo um turno", () => {
    expect(turnsTaken(mesaImpar, "red")).toBe(3);
    expect(turnsTaken(mesaImpar, "blue")).toBe(2);
    expect(isGameOver(mesaImpar)).toBe(false);
  });

  it("dá o turno extra para o time que jogou menos", () => {
    expect(nextTurn(mesaImpar, "red")?.team).toBe("blue");
  });

  it("sorteia o turno extra entre quem falou menos vezes", () => {
    const comRepetido = [
      player({ id: "a", team: "red", seat: 0, spoke_count: 2 }),
      player({ id: "b", team: "red", seat: 1, spoke_count: 1 }),
      player({ id: "c", team: "red", seat: 2, spoke_count: 1 }),
      player({ id: "d", team: "blue", seat: 3, spoke_count: 2 }),
      player({ id: "e", team: "blue", seat: 4, spoke_count: 1 }),
    ];

    expect(turnsTaken(comRepetido, "red")).toBe(4);
    expect(turnsTaken(comRepetido, "blue")).toBe(3);
    expect(nextTurn(comRepetido, "red")?.speakerId).toBe("e");
  });

  it("encerra quando o time menor empata os turnos", () => {
    const empatado = mesaImpar.map((person) =>
      person.id === "d" ? { ...person, spoke_count: 2 } : person,
    );

    expect(turnsTaken(empatado, "blue")).toBe(3);
    expect(isGameOver(empatado)).toBe(true);
    expect(nextTurn(empatado, "blue")).toBeNull();
  });
});

describe("abertura da sala", () => {
  it("exige quatro pessoas com dois de cada lado", () => {
    const trio = [
      player({ id: "a", team: "red", seat: 0 }),
      player({ id: "b", team: "blue", seat: 1 }),
      player({ id: "c", team: "red", seat: 2 }),
    ];

    expect(canStart(trio)).toBe(false);
  });

  it("não deixa começar com gente sem time", () => {
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

describe("sorteio de times", () => {
  const mesa = Array.from({ length: 7 }, (_, index) =>
    player({ id: `p${index}`, team: null, seat: index }),
  );

  it("dá time para todo mundo", () => {
    const map = assignTeams(mesa);

    expect(map.size).toBe(mesa.length);
    expect([...map.values()].every((team) => team !== null)).toBe(true);
  });

  it("deixa no máximo uma pessoa de diferença com número ímpar", () => {
    const map = assignTeams(mesa);
    const valores = [...map.values()];
    const vermelho = valores.filter((team) => team === "red").length;
    const azul = valores.filter((team) => team === "blue").length;

    expect(Math.abs(vermelho - azul)).toBe(1);
    expect(vermelho + azul).toBe(7);
  });

  it("não manda as mesmas pessoas para o mesmo time toda vez", () => {
    const rodadas = Array.from({ length: 24 }, () => {
      const map = assignTeams(mesa);

      return mesa.map((person) => map.get(person.id)).join(",");
    });

    expect(new Set(rodadas).size).toBeGreaterThan(1);
  });
});

describe("baralho", () => {
  it("separa o baralho suave do apimentado", () => {
    expect(deckFor("mild").every((card) => card.heat === "mild")).toBe(true);
    expect(deckFor("hot").some((card) => card.heat === "extra")).toBe(
      true,
    );
  });

  it("junta tudo no modo misto", () => {
    expect(deckFor("mixed").length).toBe(deckSizes.mixed);
  });

  it("dá cinco palavras proibidas em toda carta", () => {
    expect(
      deckFor("mixed").every((card) => card.forbidden.length === 5),
    ).toBe(true);
  });

  it("não repete id entre as cartas", () => {
    const ids = deckFor("mixed").map((card) => card.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("times", () => {
  it("sabe quem é o adversário", () => {
    expect(rivalOf("red")).toBe("blue");
    expect(rivalOf("blue")).toBe("red");
  });
});
