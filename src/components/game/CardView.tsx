import type { Card } from "@/types/game";
import { ThumbArt } from "@/components/game/ThumbArt";

const selos: Record<Card["heat"], { texto: string; classe: string } | null> = {
  suave: null,
  picante: { texto: "picante", classe: "bg-picante text-creme" },
  extra: { texto: "extra picante", classe: "bg-extra text-creme" },
};

export function CardView({
  card,
  chave,
  saindo,
}: {
  card: Card;
  chave: number;
  saindo: "vermelho" | "azul" | null;
}) {
  const selo = selos[card.heat];

  const animacao = saindo
    ? `carta-voa-${saindo} 0.55s ease-in forwards`
    : "carta-entra 0.45s cubic-bezier(0.2, 1.4, 0.5, 1) both";

  return (
    <div
      key={chave}
      className="bolinhas bg-banana traco sombra-dura-g relative w-full max-w-xs rounded-3xl p-3"
      style={{ animation: animacao }}
    >
      {selo ? (
        <span
          className={`font-display traco-fino absolute -top-3 right-3 rounded-full px-3 py-0.5 text-xs uppercase ${selo.classe}`}
        >
          {selo.texto}
        </span>
      ) : null}

      <div className="flex items-center gap-2">
        <ThumbArt direcao="cima" className="h-11 w-11 shrink-0 drop-shadow" />
        <div className="bg-ceu traco flex min-h-14 flex-1 items-center justify-center rounded-xl px-2">
          <span className="font-display text-creme contorno-fino text-center text-2xl leading-tight uppercase">
            {card.word}
          </span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <ThumbArt
          direcao="baixo"
          className="mt-1 h-10 w-10 shrink-0 drop-shadow"
        />
        <ul className="flex flex-1 flex-col gap-1.5">
          {card.forbidden.map((palavra) => (
            <li
              key={palavra}
              className="bg-creme rounded-lg border-[3px] border-fogo px-2 py-1.5 text-center"
            >
              <span className="font-display text-tinta text-base leading-none uppercase">
                {palavra}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
