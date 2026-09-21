"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { tocar } from "@/lib/sound";
import type { PlayerRow, Team } from "@/types/game";

const nomesDeTime: Record<Team, string> = {
  vermelho: "Time vermelho",
  azul: "Time azul",
};

const fundos: Record<Team, string> = {
  vermelho: "bg-time-vermelho",
  azul: "bg-time-azul",
};

export function TeamDraw({
  players,
  onFechar,
}: {
  players: PlayerRow[];
  onFechar: () => void;
}) {
  const [fase, setFase] = useState<"girando" | "revelando">("girando");

  useEffect(() => {
    tocar("draw");

    const relogio = setTimeout(() => setFase("revelando"), 1700);

    return () => clearTimeout(relogio);
  }, []);

  const porTime = (time: Team) =>
    players.filter((jogador) => jogador.team === time);

  return (
    <div className="bg-tinta/85 fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 px-5">
      <h2
        className="font-display text-creme contorno text-center text-4xl uppercase leading-none"
        style={{ animation: "carimbo 0.5s both" }}
      >
        {fase === "girando" ? "Sorteando" : "Deu nisso aí"}
      </h2>

      {fase === "girando" ? (
        <div className="flex max-w-sm flex-wrap justify-center gap-2">
          {players.map((jogador, indice) => (
            <span
              key={jogador.id}
              className="font-display text-creme traco rounded-xl px-3 py-2 text-lg uppercase"
              style={{
                animation: `pisca-time 0.42s ${indice * 0.07}s infinite`,
              }}
            >
              {jogador.name}
            </span>
          ))}
        </div>
      ) : (
        <div className="grid w-full max-w-sm grid-cols-2 items-stretch gap-2">
          {(["vermelho", "azul"] as const).map((time, coluna) => (
            <div
              key={time}
              className={`traco sombra-dura flex flex-col gap-2 rounded-2xl p-2 ${fundos[time]}`}
              style={{ animation: `coluna-entra 0.45s ${coluna * 0.12}s both` }}
            >
              <div className="text-center">
                <p className="font-display text-creme text-sm uppercase leading-none">
                  {nomesDeTime[time]}
                </p>
                <p className="font-display text-creme contorno-fino text-3xl leading-none">
                  {porTime(time).length}
                </p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {porTime(time).map((jogador, indice) => (
                  <li
                    key={jogador.id}
                    className="bg-creme traco-fino font-display rounded-lg px-2 py-1.5 text-center text-sm uppercase leading-none"
                    style={{
                      animation: `nome-revela 0.35s ${0.25 + indice * 0.1}s both`,
                    }}
                  >
                    {jogador.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {fase === "revelando" ? (
        <div
          className="w-full max-w-sm"
          style={{ animation: "sobe-suave 0.4s 0.6s both" }}
        >
          <Button cor="banana" onClick={onFechar}>
            Fechar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
