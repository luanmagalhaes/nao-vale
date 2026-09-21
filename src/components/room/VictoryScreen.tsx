"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Scoreboard } from "@/components/room/Scoreboard";
import { api, type EstadoDaSala } from "@/lib/api/client";
import { vencedor } from "@/lib/game/rules";
import { tocar } from "@/lib/sound";
import type { Team } from "@/types/game";

const coresDoConfete = [
  "var(--color-fogo)",
  "var(--color-ceu)",
  "var(--color-creme)",
  "var(--color-tangerina)",
  "var(--color-tinta)",
];

const confetes = Array.from({ length: 34 }, (_, indice) => ({
  esquerda: `${(indice * 37) % 100}%`,
  atraso: `${(indice % 12) * 0.22}s`,
  duracao: `${2.4 + ((indice * 7) % 18) / 10}s`,
  cor: coresDoConfete[indice % coresDoConfete.length],
  largura: indice % 3 === 0 ? 14 : 9,
  altura: indice % 4 === 0 ? 9 : 16,
}));

const nomesDeTime: Record<Team, string> = {
  vermelho: "Time vermelho",
  azul: "Time azul",
};

function Trofeu() {
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
  estado,
  token,
}: {
  estado: EstadoDaSala;
  token: string;
}) {
  const [erro, setErro] = useState("");
  const campeao = vencedor(estado.score);

  useEffect(() => {
    tocar("win");
  }, []);

  return (
    <main className="bolinhas bg-banana relative flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden px-5 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(2rem+var(--safe-top))]">
      {confetes.map((confete, indice) => (
        <span
          key={indice}
          className="absolute top-0 rounded-sm"
          style={{
            left: confete.esquerda,
            width: confete.largura,
            height: confete.altura,
            backgroundColor: confete.cor,
            animation: `confete-cai ${confete.duracao} ${confete.atraso} linear infinite`,
          }}
        />
      ))}

      <div
        className="relative z-10 flex flex-col items-center"
        style={{ animation: "troféu-entra 0.7s both" }}
      >
        <Trofeu />
        <h1 className="font-display text-creme contorno mt-2 text-center text-5xl uppercase leading-none">
          {campeao === "empate" ? "Deu empate" : nomesDeTime[campeao]}
        </h1>
        {campeao === "empate" ? null : (
          <p className="font-display bg-tinta text-banana traco-fino sombra-dura mt-3 -rotate-2 rounded-xl px-4 py-1 text-lg uppercase">
            Ganhou essa
          </p>
        )}
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-3">
        <Scoreboard score={estado.score} destaque={campeao === "empate" ? null : campeao} />

        {estado.me.is_host ? (
          <Button
            cor="fogo"
            onClick={async () => {
              try {
                await api.reiniciar(estado.room.code, token);
              } catch (falha) {
                setErro(
                  falha instanceof Error
                    ? falha.message
                    : "Deu ruim aqui. Tente de novo.",
                );
              }
            }}
          >
            Jogar de novo
          </Button>
        ) : (
          <p className="font-display bg-creme traco sombra-dura w-full rounded-2xl px-4 py-3 text-center text-lg uppercase">
            Esperando o dono da sala
          </p>
        )}

        {erro ? (
          <p className="bg-fogo text-creme traco-fino font-display w-full rounded-xl px-4 py-2 text-center uppercase">
            {erro}
          </p>
        ) : null}
      </div>
    </main>
  );
}
