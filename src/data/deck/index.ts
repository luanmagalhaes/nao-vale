import type { Card, DeckMode, Heat } from "@/types/game";
import { suave } from "./suave";
import { picante } from "./picante";
import { extra } from "./extra";

function montar(
  linhas: readonly (readonly string[])[],
  heat: Heat,
  prefixo: string,
): Card[] {
  return linhas.map((linha, indice) => ({
    id: `${prefixo}${String(indice + 1).padStart(3, "0")}`,
    word: linha[0],
    forbidden: [linha[1], linha[2], linha[3], linha[4], linha[5]] as Card["forbidden"],
    heat,
  }));
}

export const cartasSuaves = montar(suave, "suave", "s");
export const cartasPicantes = montar(picante, "picante", "p");
export const cartasExtra = montar(extra, "extra", "x");

export const deck: Card[] = [...cartasSuaves, ...cartasPicantes, ...cartasExtra];

const porId = new Map(deck.map((carta) => [carta.id, carta]));

export function cardById(id: string): Card | null {
  return porId.get(id) ?? null;
}

export function deckFor(mode: DeckMode): Card[] {
  if (mode === "suave") {
    return cartasSuaves;
  }

  if (mode === "apimentado") {
    return [...cartasPicantes, ...cartasExtra];
  }

  return deck;
}

export const deckSizes = {
  suave: cartasSuaves.length,
  apimentado: cartasPicantes.length + cartasExtra.length,
  misto: deck.length,
} as const;
