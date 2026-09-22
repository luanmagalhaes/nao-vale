"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CardView } from "@/components/game/CardView";
import { ThumbArt } from "@/components/game/ThumbArt";
import { PhonesArt } from "@/components/game/PhonesArt";
import { deckSizes } from "@/data/deck";
import { minPlayers } from "@/lib/game/rules";
import type { Card } from "@/types/game";

const sampleCard: Card = {
  id: "exemplo",
  word: "Praia",
  forbidden: ["MAR", "AREIA", "SOL", "VERÃO", "BIQUÍNI"],
  heat: "mild",
};

function Good({ children }: { children: ReactNode }) {
  return <strong className="font-display text-hit font-normal">{children}</strong>;
}

function Bad({ children }: { children: ReactNode }) {
  return <strong className="font-display text-fire font-normal">{children}</strong>;
}

interface Slide {
  title: string;
  tone: string;
  art: ReactNode;
  body: ReactNode;
}

const slides: Slide[] = [
  {
    title: "Presta atenção, benção!",
    tone: "bg-sky text-cream",
    art: (
      <div className="flex items-center justify-center gap-2">
        <ThumbArt direction="up" className="h-14 w-14" />
        <ThumbArt direction="down" className="h-14 w-14" />
      </div>
    ),
    body: (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-base font-bold leading-snug">
          Você faz o seu time adivinhar a palavra da carta{" "}
          <Bad>sem falar nenhuma das cinco proibidas</Bad>.
        </p>
        <div className="bg-yellow stroke-hard rounded-2xl p-3">
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
    title: "Assim é a carta",
    tone: "bg-yellow text-ink",
    art: (
      <div className="flex scale-90 justify-center">
        <CardView card={sampleCard} seq={0} leaving={null} />
      </div>
    ),
    body: (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm font-bold leading-snug">
          A <Good>joinha pra cima</Good> mostra a palavra que o seu time precisa
          acertar.
        </p>
        <p className="text-sm font-bold leading-snug">
          A <Bad>joinha pra baixo</Bad> lista as cinco que você não pode
          deixar escapar.
        </p>
      </div>
    ),
  },
  {
    title: "O juiz é do outro team",
    tone: "bg-team-blue text-cream",
    art: <PhonesArt />,
    body: (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-base font-bold leading-snug">
          Enquanto você explica, <Bad>uma pessoa do time adversário</Bad> vê a
          mesma carta no celular dela.
        </p>
        <div className="bg-fire text-cream stroke-hard rounded-2xl p-3">
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
    title: "Os botões da rodada",
    tone: "bg-orange text-cream",
    art: (
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="font-display bg-hit text-cream stroke-hard rounded-lg px-2 py-1 text-xs uppercase">
          Acertou
        </span>
        <span className="font-display bg-cream text-ink stroke-hard rounded-lg px-2 py-1 text-xs uppercase">
          Pular
        </span>
        <span className="font-display bg-fire text-cream stroke-hard rounded-lg px-2 py-1 text-xs uppercase">
          Não vale
        </span>
      </div>
    ),
    body: (
      <div className="flex flex-col gap-2.5">
        <div className="bg-cream stroke-hard rounded-2xl p-3">
          <p className="font-display text-hit text-lg uppercase">Acertou</p>
          <p className="text-xs font-bold">
            Quem explica aperta quando o time acerta. A carta voa pro seu lado e
            vale <Good>um ponto</Good>.
          </p>
        </div>
        <div className="bg-cream stroke-hard rounded-2xl p-3">
          <p className="font-display text-lg uppercase">Pular</p>
          <p className="text-xs font-bold">
            Carta difícil volta pro fim do baralho e{" "}
            <strong>ninguém pontua</strong>. Serve pra não travar a round.
          </p>
        </div>
        <div className="bg-cream stroke-hard rounded-2xl p-3">
          <p className="font-display text-fire text-lg uppercase">Não vale</p>
          <p className="text-xs font-bold">
            Só o juiz tem esse botão. A carta vai pro{" "}
            <Bad>team adversário</Bad>.
          </p>
        </div>
        <div className="border-ink/40 rounded-2xl border-2 border-dashed p-3">
          <p className="text-xs font-bold">
            Apertou errado? Tem <strong>Desfazer última jogada</strong>. O ponto
            volta e a carta também.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Como termina",
    tone: "bg-team-red text-cream",
    art: (
      <div className="flex items-center justify-center gap-2">
        {["60", "s"].map((pedaco) => (
          <span
            key={pedaco}
            className="font-display bg-cream text-ink stroke-hard flex h-14 w-12 items-center justify-center rounded-xl text-2xl"
          >
            {pedaco}
          </span>
        ))}
      </div>
    ),
    body: (
      <div className="flex flex-col gap-3 text-center">
        <p className="text-base font-bold leading-snug">
          Cada person tem <Good>60 segundos</Good> explicando, e passa a vez entre
          os times.
        </p>
        <div className="bg-yellow stroke-hard text-ink rounded-2xl p-3">
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
    title: "Escolha o baralho",
    tone: "bg-extra text-cream",
    art: (
      <div className="flex items-center justify-center gap-1.5">
        <span className="font-display bg-cream text-ink stroke-hard rounded-lg px-2 py-1 text-xs uppercase">
          De boa
        </span>
        <span className="font-display bg-spicy text-cream stroke-hard rounded-lg px-2 py-1 text-xs uppercase">
          Picante
        </span>
        <span className="font-display bg-extra text-cream stroke-hard rounded-lg px-2 py-1 text-xs uppercase">
          Extra
        </span>
      </div>
    ),
    body: (
      <div className="flex flex-col gap-2.5 text-center">
        <div className="bg-cream text-ink stroke-hard rounded-2xl p-3">
          <p className="font-display text-lg uppercase">De boa</p>
          <p className="text-xs font-bold">
            {deckSizes.mild} cartas sem malícia nenhuma. Pode jogar com
            criança na mesa.
          </p>
        </div>
        <div className="bg-cream text-ink stroke-hard rounded-2xl p-3">
          <p className="font-display text-spicy text-lg uppercase">
            Picante + extra
          </p>
          <p className="text-xs font-bold">
            {deckSizes.hot} cartas adultas. Só entre gente grande.
          </p>
        </div>
        <div className="bg-cream text-ink stroke-hard rounded-2xl p-3">
          <p className="font-display text-lg uppercase">Misto</p>
          <p className="text-xs font-bold">
            As {deckSizes.mixed} cartas embaralhadas. A picante aparece sem
            notify.
          </p>
        </div>
      </div>
    ),
  },
];

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const [step, setPasso] = useState(0);
  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div className="bg-ink/80 fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center">
      <div
        className="bg-cream stroke-hard flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-3xl shadow-[0_12px_0_var(--color-ink)]"
        style={{ animation: "bounce-in 0.45s both" }}
      >
        <div className={`shrink-0 px-4 pb-4 pt-5 text-center ${slide.tone}`}>
          {slide.art}
          <h2 className="font-display mt-3 text-2xl uppercase leading-tight">
            {slide.title}
          </h2>
        </div>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {slide.body}
        </div>

        <div className="border-ink/10 shrink-0 border-t-2 px-4 pb-4 pt-3">
          <div className="mb-3 flex items-center justify-center gap-1.5">
            {slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setPasso(index)}
                aria-label={`Ir para a parte ${index + 1}: ${item.title}`}
                aria-current={index === step}
                className={`font-display stroke-thin flex h-7 w-6 items-center justify-center rounded-md text-xs transition-transform duration-200 ${
                  index === step
                    ? "bg-fire text-cream scale-110"
                    : "bg-cream text-ink/40"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 ? (
              <Button color="cream" onClick={() => setPasso(step - 1)}>
                Voltar
              </Button>
            ) : null}
            <Button
              color={isLast ? "fogo" : "tinta"}
              onClick={() => (isLast ? onClose() : setPasso(step + 1))}
            >
              {isLast ? "Valeu, pai. Entendido" : "Saquei"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
