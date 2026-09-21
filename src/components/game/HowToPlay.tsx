"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CardView } from "@/components/game/CardView";
import { ThumbArt } from "@/components/game/ThumbArt";
import { deckSizes } from "@/data/deck";
import { minPlayers } from "@/lib/game/rules";
import type { Card } from "@/types/game";

const cartaExemplo: Card = {
  id: "exemplo",
  word: "Praia",
  forbidden: ["MAR", "AREIA", "SOL", "VERÃO", "BIQUÍNI"],
  heat: "suave",
};

function Bom({ children }: { children: ReactNode }) {
  return <strong className="font-display text-acerto font-normal">{children}</strong>;
}

function Ruim({ children }: { children: ReactNode }) {
  return <strong className="font-display text-fogo font-normal">{children}</strong>;
}

interface Slide {
  titulo: string;
  tom: string;
  arte: ReactNode;
  corpo: ReactNode;
}

const slides: Slide[] = [
  {
    titulo: "O jogo em uma frase",
    tom: "bg-ceu text-creme",
    arte: (
      <div className="flex items-center justify-center gap-2">
        <ThumbArt direcao="cima" className="h-14 w-14" />
        <ThumbArt direcao="baixo" className="h-14 w-14" />
      </div>
    ),
    corpo: (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-base font-bold leading-snug">
          Você faz o seu time adivinhar a palavra da carta{" "}
          <Ruim>sem falar nenhuma das cinco proibidas</Ruim>.
        </p>
        <div className="bg-banana traco rounded-2xl p-3">
          <p className="font-display text-xl uppercase leading-tight">
            Explicar &quot;praia&quot;
          </p>
          <p className="mt-1 text-xs font-bold">
            sem dizer mar, areia, sol, verão nem biquíni
          </p>
        </div>
        <p className="text-sm font-bold leading-snug opacity-80">
          Dá pra apontar, fazer careta e falar o quanto quiser. Só não pode
          soletrar, nem falar em outra língua, nem dizer a palavra derivada.
        </p>
      </div>
    ),
  },
  {
    titulo: "Assim é a carta",
    tom: "bg-banana text-tinta",
    arte: (
      <div className="flex scale-90 justify-center">
        <CardView card={cartaExemplo} chave={0} saindo={null} />
      </div>
    ),
    corpo: (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm font-bold leading-snug">
          A <Bom>joinha pra cima</Bom> mostra a palavra que o seu time precisa
          acertar.
        </p>
        <p className="text-sm font-bold leading-snug">
          A <Ruim>joinha pra baixo</Ruim> lista as cinco que você não pode
          deixar escapar.
        </p>
      </div>
    ),
  },
  {
    titulo: "O juiz é do outro time",
    tom: "bg-time-azul text-creme",
    arte: (
      <div className="flex items-end justify-center gap-2">
        <div className="bg-creme traco h-20 w-12 rounded-lg" />
        <span className="font-display text-3xl">=</span>
        <div className="bg-creme traco h-20 w-12 rounded-lg" />
      </div>
    ),
    corpo: (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-base font-bold leading-snug">
          Enquanto você explica, <Ruim>uma pessoa do time adversário</Ruim> vê a
          mesma carta no celular dela.
        </p>
        <div className="bg-fogo text-creme traco rounded-2xl p-3">
          <p className="font-display text-2xl uppercase leading-none">
            Falou proibida?
          </p>
          <p className="mt-1 text-xs font-bold">
            O juiz aperta NÃO VALE e o ponto vai pro time dele.
          </p>
        </div>
        <p className="text-sm font-bold leading-snug opacity-80">
          Vale também pra palavra derivada: se a proibida é MAR, você não pode
          dizer MARÍTIMO.
        </p>
        <p className="text-sm font-bold leading-snug opacity-80">
          O juiz muda a cada rodada, então todo mundo fiscaliza uma vez.
        </p>
      </div>
    ),
  },
  {
    titulo: "Os botões da rodada",
    tom: "bg-tangerina text-creme",
    arte: (
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="font-display bg-acerto text-creme traco rounded-lg px-2 py-1 text-xs uppercase">
          Acertou
        </span>
        <span className="font-display bg-creme text-tinta traco rounded-lg px-2 py-1 text-xs uppercase">
          Pular
        </span>
        <span className="font-display bg-fogo text-creme traco rounded-lg px-2 py-1 text-xs uppercase">
          Não vale
        </span>
      </div>
    ),
    corpo: (
      <div className="flex flex-col gap-2.5">
        <div className="bg-creme traco rounded-2xl p-3">
          <p className="font-display text-acerto text-lg uppercase">Acertou</p>
          <p className="text-xs font-bold">
            Quem explica aperta quando o time acerta. A carta voa pro seu lado e
            vale <Bom>um ponto</Bom>.
          </p>
        </div>
        <div className="bg-creme traco rounded-2xl p-3">
          <p className="font-display text-lg uppercase">Pular</p>
          <p className="text-xs font-bold">
            Carta difícil volta pro fim do baralho e{" "}
            <strong>ninguém pontua</strong>. Serve pra não travar a rodada.
          </p>
        </div>
        <div className="bg-creme traco rounded-2xl p-3">
          <p className="font-display text-fogo text-lg uppercase">Não vale</p>
          <p className="text-xs font-bold">
            Só o juiz tem esse botão. A carta vai pro{" "}
            <Ruim>time adversário</Ruim>.
          </p>
        </div>
        <div className="border-tinta/40 rounded-2xl border-2 border-dashed p-3">
          <p className="text-xs font-bold">
            Apertou errado? Tem <strong>Desfazer última jogada</strong>. O ponto
            volta e a carta também.
          </p>
        </div>
      </div>
    ),
  },
  {
    titulo: "Como termina",
    tom: "bg-time-vermelho text-creme",
    arte: (
      <div className="flex items-center justify-center gap-2">
        {["60", "s"].map((pedaco) => (
          <span
            key={pedaco}
            className="font-display bg-creme text-tinta traco flex h-14 w-12 items-center justify-center rounded-xl text-2xl"
          >
            {pedaco}
          </span>
        ))}
      </div>
    ),
    corpo: (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-base font-bold leading-snug">
          Cada pessoa tem <Bom>60 segundos</Bom> explicando, e passa a vez entre
          os times.
        </p>
        <div className="bg-banana traco text-tinta rounded-2xl p-3">
          <p className="font-display text-lg uppercase leading-tight">
            O jogo acaba quando todo mundo explicou uma vez
          </p>
          <p className="mt-1 text-xs font-bold">
            Ganha o time com mais cartas no fim.
          </p>
        </div>
        <p className="text-sm font-bold leading-snug opacity-90">
          Dá pra jogar a partir de {minPlayers} pessoas, com pelo menos duas de
          cada lado.
        </p>
      </div>
    ),
  },
  {
    titulo: "Escolha o baralho",
    tom: "bg-extra text-creme",
    arte: (
      <div className="flex items-center justify-center gap-1.5">
        <span className="font-display bg-creme text-tinta traco rounded-lg px-2 py-1 text-xs uppercase">
          De boa
        </span>
        <span className="font-display bg-picante text-creme traco rounded-lg px-2 py-1 text-xs uppercase">
          Picante
        </span>
        <span className="font-display bg-extra text-creme traco rounded-lg px-2 py-1 text-xs uppercase">
          Extra
        </span>
      </div>
    ),
    corpo: (
      <div className="flex flex-col gap-2.5 text-center">
        <div className="bg-creme text-tinta traco rounded-2xl p-3">
          <p className="font-display text-lg uppercase">De boa</p>
          <p className="text-xs font-bold">
            {deckSizes.suave} cartas sem malícia nenhuma. Pode jogar com
            criança na mesa.
          </p>
        </div>
        <div className="bg-creme text-tinta traco rounded-2xl p-3">
          <p className="font-display text-picante text-lg uppercase">
            Picante + extra
          </p>
          <p className="text-xs font-bold">
            {deckSizes.apimentado} cartas adultas. Só entre gente grande.
          </p>
        </div>
        <div className="bg-creme text-tinta traco rounded-2xl p-3">
          <p className="font-display text-lg uppercase">Misto</p>
          <p className="text-xs font-bold">
            As {deckSizes.misto} cartas embaralhadas. A picante aparece sem
            avisar.
          </p>
        </div>
      </div>
    ),
  },
];

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const [passo, setPasso] = useState(0);
  const slide = slides[passo];
  const ultimo = passo === slides.length - 1;

  return (
    <div className="bg-tinta/80 fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center">
      <div
        className="bg-creme traco flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-3xl shadow-[0_12px_0_var(--color-tinta)]"
        style={{ animation: "pulo-entrada 0.45s both" }}
      >
        <div className={`shrink-0 px-4 pb-4 pt-5 text-center ${slide.tom}`}>
          {slide.arte}
          <h2 className="font-display mt-3 text-2xl uppercase leading-tight">
            {slide.titulo}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {slide.corpo}
        </div>

        <div className="border-tinta/10 shrink-0 border-t-2 px-4 pb-4 pt-3">
          <div className="mb-3 flex items-center justify-center gap-1.5">
            {slides.map((item, indice) => (
              <button
                key={item.titulo}
                type="button"
                onClick={() => setPasso(indice)}
                aria-label={`Ir para a parte ${indice + 1}: ${item.titulo}`}
                aria-current={indice === passo}
                className={`font-display traco-fino flex h-7 w-6 items-center justify-center rounded-md text-xs transition-transform duration-200 ${
                  indice === passo
                    ? "bg-fogo text-creme scale-110"
                    : "bg-creme text-tinta/40"
                }`}
              >
                {indice + 1}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {passo > 0 ? (
              <Button cor="creme" onClick={() => setPasso(passo - 1)}>
                Voltar
              </Button>
            ) : null}
            <Button
              cor={ultimo ? "fogo" : "tinta"}
              onClick={() => (ultimo ? onClose() : setPasso(passo + 1))}
            >
              {ultimo ? "Bora jogar" : "Saquei"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
