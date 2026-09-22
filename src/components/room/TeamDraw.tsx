"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { playSound } from "@/lib/sound";
import type { PlayerRow, Team } from "@/types/game";

const teamNames: Record<Team, string> = {
  red: "Time vermelho",
  blue: "Time azul",
};

const backgrounds: Record<Team, string> = {
  red: "bg-team-red",
  blue: "bg-team-blue",
};

export function TeamDraw({
  players,
  onClose,
}: {
  players: PlayerRow[];
  onClose: () => void;
}) {
  const [phase, setFase] = useState<"spinning" | "revealing">("spinning");

  useEffect(() => {
    playSound("draw");

    const timer = setTimeout(() => setFase("revealing"), 1700);

    return () => clearTimeout(timer);
  }, []);

  const byTeam = (team: Team) =>
    players.filter((player) => player.team === team);

  return (
    <div className="bg-ink/85 fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 px-5">
      <h2
        className="font-display text-cream outline-text text-center text-4xl uppercase leading-none"
        style={{ animation: "stamp-in 0.5s both" }}
      >
        {phase === "spinning" ? "Sorteando" : "Deu nisso aí"}
      </h2>

      {phase === "spinning" ? (
        <div className="flex max-w-sm flex-wrap justify-center gap-2">
          {players.map((player, index) => (
            <span
              key={player.id}
              className="font-display text-cream stroke-hard rounded-xl px-3 py-2 text-lg uppercase"
              style={{
                animation: `team-flash 0.42s ${index * 0.07}s infinite`,
              }}
            >
              {player.name}
            </span>
          ))}
        </div>
      ) : (
        <div className="grid w-full max-w-sm grid-cols-2 items-stretch gap-2">
          {(["red", "blue"] as const).map((team, coluna) => (
            <div
              key={team}
              className={`stroke-hard hard-shadow flex flex-col gap-2 rounded-2xl p-2 ${backgrounds[team]}`}
              style={{ animation: `column-in 0.45s ${coluna * 0.12}s both` }}
            >
              <div className="text-center">
                <p className="font-display text-cream pb-1 text-sm uppercase leading-none">
                  {teamNames[team]}
                </p>
                <p className="font-display text-cream outline-text-thin pb-1 text-3xl leading-tight">
                  {byTeam(team).length}
                </p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {byTeam(team).map((player, index) => (
                  <li
                    key={player.id}
                    className="bg-cream stroke-thin font-display rounded-lg px-2 py-1.5 text-center text-sm uppercase leading-none"
                    style={{
                      animation: `name-reveal 0.35s ${0.25 + index * 0.1}s both`,
                    }}
                  >
                    {player.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {phase === "revealing" ? (
        <div
          className="w-full max-w-sm"
          style={{ animation: "rise-in 0.4s 0.6s both" }}
        >
          <Button color="yellow" onClick={onClose}>
            Fechar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
