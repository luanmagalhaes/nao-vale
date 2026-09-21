"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Scoreboard } from "@/components/room/Scoreboard";
import { api, type RoomState } from "@/lib/api/client";
import { winnerOf } from "@/lib/game/rules";
import { playSound } from "@/lib/sound";
import type { Team } from "@/types/game";

const confettiColors = [
  "var(--color-fire)",
  "var(--color-sky)",
  "var(--color-cream)",
  "var(--color-orange)",
  "var(--color-ink)",
];

const confetti = Array.from({ length: 34 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  delay: `${(index % 12) * 0.22}s`,
  duration: `${2.4 + ((index * 7) % 18) / 10}s`,
  cor: confettiColors[index % confettiColors.length],
  width: index % 3 === 0 ? 14 : 9,
  height: index % 4 === 0 ? 9 : 16,
}));

const teamNames: Record<Team, string> = {
  red: "Time vermelho",
  blue: "Time azul",
};

function Trophy() {
  return (
    <svg viewBox="0 0 80 80" className="h-32 w-32" aria-hidden="true">
      <g stroke="#000000" strokeWidth="3.5" strokeLinejoin="round">
        <path d="M22 12h36v14a18 18 0 0 1-36 0z" fill="#ffc316" />
        <path d="M22 16h-8v6a10 10 0 0 0 10 10" fill="none" />
        <path d="M58 16h8v6a10 10 0 0 1-10 10" fill="none" />
        <path d="M34 44h12v10H34z" fill="#f58024" />
        <path d="M26 54h28v8H26z" fill="#f05400" />
        <path d="M20 62h40v8H20z" fill="#fbf5f4" />
      </g>
      <g fill="#fbf5f4" stroke="#000000" strokeWidth="2">
        <path d="M40 20l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" />
      </g>
    </svg>
  );
}

export function VictoryScreen({
  state,
  token,
}: {
  state: RoomState;
  token: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const champion = winnerOf(state.score);

  useEffect(() => {
    playSound("win");
  }, []);

  return (
    <main className="dots bg-yellow relative flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden px-5 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(2rem+var(--safe-top))]">
      {confetti.map((confettoStyle, index) => (
        <span
          key={index}
          className="absolute top-0 rounded-sm"
          style={{
            left: confettoStyle.left,
            width: confettoStyle.width,
            height: confettoStyle.height,
            backgroundColor: confettoStyle.cor,
            animation: `confetti-fall ${confettoStyle.duration} ${confettoStyle.delay} linear infinite`,
          }}
        />
      ))}

      <div
        className="relative z-10 flex flex-col items-center"
        style={{ animation: "trophy-in 0.7s both" }}
      >
        <Trophy />
        <h1 className="font-display text-cream outline-text mt-2 text-center text-5xl uppercase leading-none">
          {champion === "tie" ? "Deu empate" : teamNames[champion]}
        </h1>
        {champion === "tie" ? null : (
          <p className="font-display bg-ink text-yellow stroke-thin hard-shadow mt-3 -rotate-2 rounded-xl px-4 py-1 text-lg uppercase">
            Ganhou essa
          </p>
        )}
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-3">
        <Scoreboard score={state.score} highlight={champion === "tie" ? null : champion} />

        {state.me.is_host ? (
          <Button
            cor="fogo"
            onClick={async () => {
              try {
                await api.restart(state.room.code, token);
              } catch (failure) {
                setError(
                  failure instanceof Error
                    ? failure.message
                    : "Deu ruim aqui. Tente de novo.",
                );
              }
            }}
          >
            Jogar de novo
          </Button>
        ) : (
          <p className="font-display bg-cream stroke-hard hard-shadow w-full rounded-2xl px-4 py-3 text-center text-lg uppercase">
            Esperando o dono da room
          </p>
        )}

        <Button cor="tinta" onClick={() => router.push("/history")}>
          Ver o histórico
        </Button>

        {error ? (
          <p className="bg-fire text-cream stroke-thin font-display w-full rounded-xl px-4 py-2 text-center uppercase">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
