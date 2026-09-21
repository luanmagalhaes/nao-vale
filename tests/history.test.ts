import { describe, expect, it } from "vitest";
import {
  monthOf,
  availableMonths,
  monthLabel,
  matchesInMonth,
  ranking,
} from "@/lib/game/history";
import type { MatchRow } from "@/types/game";

function match(parcial: Partial<MatchRow>): MatchRow {
  return {
    id: crypto.randomUUID(),
    room_code: "10",
    deck_mode: "mild",
    score_red: 3,
    score_blue: 1,
    winner: "red",
    players: [
      { name: "Ana", team: "red" },
      { name: "Bruno", team: "blue" },
    ],
    cards_played: 4,
    finished_at: "2026-09-21T20:00:00.000Z",
    ...parcial,
  };
}

describe("ranking do mês", () => {
  it("conta vitória para quem estava no team winnerOf", () => {
    const table = ranking([match({})]);

    expect(table[0]).toMatchObject({ name: "Ana", wins: 1, matches: 1 });
    expect(table[1]).toMatchObject({ name: "Bruno", wins: 0, matches: 1 });
  });

  it("não dá vitória a ninguém quando empata", () => {
    const table = ranking([
      match({ winner: "tie", score_red: 2, score_blue: 2 }),
    ]);

    expect(table.every((row) => row.wins === 0)).toBe(true);
    expect(table.every((row) => row.matches === 1)).toBe(true);
  });

  it("soma as cardList do team da person", () => {
    const table = ranking([
      match({ score_red: 5, score_blue: 2 }),
      match({ score_red: 1, score_blue: 4, winner: "blue" }),
    ]);

    expect(table.find((row) => row.name === "Ana")?.cards).toBe(6);
    expect(table.find((row) => row.name === "Bruno")?.cards).toBe(6);
  });

  it("junta a mesma person escrita com outra caixa", () => {
    const table = ranking([
      match({ players: [{ name: "Ana", team: "red" }] }),
      match({ players: [{ name: "ANA", team: "red" }] }),
    ]);

    expect(table).toHaveLength(1);
    expect(table[0].matches).toBe(2);
  });

  it("ordena por vitórias e desempata por cardList", () => {
    const table = ranking([
      match({
        players: [
          { name: "Ana", team: "red" },
          { name: "Bruno", team: "red" },
        ],
        score_red: 4,
      }),
      match({
        players: [{ name: "Bruno", team: "red" }],
        score_red: 9,
      }),
    ]);

    expect(table[0].name).toBe("Bruno");
  });
});

describe("recorte por mês", () => {
  const lista = [
    match({ finished_at: "2026-09-21T20:00:00.000Z" }),
    match({ finished_at: "2026-08-02T20:00:00.000Z" }),
    match({ finished_at: "2026-09-01T20:00:00.000Z" }),
  ];

  it("separa as partidas do mês pedido", () => {
    expect(matchesInMonth(lista, "2026-09")).toHaveLength(2);
    expect(matchesInMonth(lista, "2026-08")).toHaveLength(1);
  });

  it("lista os months do mais novo para o mais velho", () => {
    expect(availableMonths(lista)).toEqual(["2026-09", "2026-08"]);
  });

  it("extrai o mês da data", () => {
    expect(monthOf("2026-09-21T20:00:00.000Z")).toBe("2026-09");
  });

  it("escreve o mês por extenso em português", () => {
    expect(monthLabel("2026-09")).toBe("setembro de 2026");
  });
});
