"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { playSound } from "@/lib/sound";
import { copy } from "@/data/copy";
import type { MatchRow, Team } from "@/types/game";

const backgrounds: Record<Team, string> = {
  red: "bg-team-red",
  blue: "bg-team-blue",
};

const deckNames: Record<string, string> = {
  suave: "De boa",
  apimentado: "Picante + extra",
  misto: "Misto",
};

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MatchSheet({
  match,
  onClose,
}: {
  match: MatchRow;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[68] flex items-end justify-center p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Partida da room ${match.room_code}`}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => {
          playSound("tap");
          onClose();
        }}
        className="bg-ink/80 absolute inset-0 cursor-default"
      />

      <div
        className="bg-cream stroke-hard relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-3xl shadow-[0_12px_0_var(--color-ink)]"
        style={{ animation: "bounce-in 0.4s both" }}
      >
        <div className="bg-yellow dots shrink-0 border-b-4 border-ink px-4 py-3 text-center">
          <p className="font-display text-xs uppercase tracking-[0.2em] opacity-70">
            room {match.room_code} · {deckNames[match.deck_mode] ?? match.deck_mode}
          </p>
          <h2 className="font-display text-2xl uppercase leading-tight">
            {match.winner === "tie"
              ? "Deu empate"
              : `Venceu o ${copy.teams[match.winner ?? "tie"]}`}
          </h2>
          <p className="text-xs font-bold opacity-70">
            {longDate(match.finished_at)}
          </p>
        </div>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <div className="grid grid-cols-2 items-stretch gap-2">
            {(["red", "blue"] as const).map((team) => {
              const people = match.players.filter(
                (person) => person.team === team,
              );
              const pontos =
                team === "red"
                  ? match.score_red
                  : match.score_blue;

              return (
                <div
                  key={team}
                  className={`stroke-hard flex flex-col gap-2 rounded-2xl p-2 ${backgrounds[team]} ${
                    match.winner === team ? "" : "opacity-80"
                  }`}
                >
                  <div className="text-center">
                    <p className="font-display text-cream text-xs uppercase leading-none">
                      Time {copy.teams[team]}
                    </p>
                    <p className="font-display text-cream outline-text-thin text-3xl leading-none">
                      {pontos}
                    </p>
                    <p className="text-cream text-[10px] font-bold uppercase opacity-80">
                      {people.length} {people.length === 1 ? "pessoa" : "pessoas"}
                    </p>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {people.length === 0 ? (
                      <li className="border-cream/50 font-display text-cream/70 rounded-lg border-2 border-dashed px-2 py-1.5 text-center text-xs uppercase leading-none">
                        vazio
                      </li>
                    ) : (
                      people.map((person) => (
                        <li
                          key={person.name}
                          className="bg-cream stroke-thin font-display rounded-lg px-2 py-1.5 text-center text-sm uppercase leading-none break-words"
                        >
                          {person.name}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className="font-display mt-3 text-center text-xs uppercase opacity-70">
            {match.cards_played} cartas na mesa
          </p>
        </div>

        <div className="border-ink/10 shrink-0 border-t-2 p-3">
          <Button cor="tinta" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
