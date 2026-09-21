import type { Card, DeckMode, Heat } from "@/types/game";
import { suave } from "./suave";
import { picante } from "./picante";
import { extra } from "./extra";

function build(
  rows: readonly (readonly string[])[],
  heat: Heat,
  prefix: string,
): Card[] {
  return rows.map((row, index) => ({
    id: `${prefix}${String(index + 1).padStart(3, "0")}`,
    word: row[0],
    forbidden: [row[1], row[2], row[3], row[4], row[5]] as Card["forbidden"],
    heat,
  }));
}

export const mildCards = build(suave, "mild", "s");
export const spicyCards = build(picante, "spicy", "p");
export const extraCards = build(extra, "extra", "x");

export const deck: Card[] = [...mildCards, ...spicyCards, ...extraCards];

const byId = new Map(deck.map((card) => [card.id, card]));

export function cardById(id: string): Card | null {
  return byId.get(id) ?? null;
}

export function deckFor(mode: DeckMode): Card[] {
  if (mode === "mild") {
    return mildCards;
  }

  if (mode === "hot") {
    return [...spicyCards, ...extraCards];
  }

  return deck;
}

export const deckSizes = {
  mild: mildCards.length,
  hot: spicyCards.length + extraCards.length,
  mixed: deck.length,
} as const;
