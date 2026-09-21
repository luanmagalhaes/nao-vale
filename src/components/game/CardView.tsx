import type { Card, Team } from "@/types/game";
import { ThumbArt } from "@/components/game/ThumbArt";

const badges: Record<Card["heat"], { text: string; cssClass: string } | null> = {
  mild: null,
  spicy: { text: "picante", cssClass: "bg-spicy text-cream" },
  extra: { text: "extra picante", cssClass: "bg-extra text-cream" },
};

export function CardView({
  card,
  seq,
  leaving,
}: {
  card: Card;
  seq: number;
  leaving: Team | null;
}) {
  const badge = badges[card.heat];

  const animation = leaving
    ? `card-fly-${leaving} 0.22s ease-in forwards`
    : "card-in 0.18s cubic-bezier(0.2, 1.3, 0.5, 1) both";

  return (
    <div
      key={seq}
      className="dots bg-yellow stroke-hard hard-shadow-lg relative w-full max-w-xs rounded-3xl p-3"
      style={{ animation }}
    >
      {badge ? (
        <span
          className={`font-display stroke-thin absolute -top-3 right-3 rounded-full px-3 py-0.5 text-xs uppercase ${badge.cssClass}`}
        >
          {badge.text}
        </span>
      ) : null}

      <div className="flex items-center gap-2">
        <ThumbArt direction="up" className="h-11 w-11 shrink-0 drop-shadow" />
        <div className="bg-sky stroke-hard flex min-h-14 flex-1 items-center justify-center rounded-xl px-2">
          <span className="font-display text-cream outline-text-thin text-center text-2xl leading-tight uppercase">
            {card.word}
          </span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <ThumbArt
          direction="down"
          className="mt-1 h-10 w-10 shrink-0 drop-shadow"
        />
        <ul className="flex flex-1 flex-col gap-1.5">
          {card.forbidden.map((word) => (
            <li
              key={word}
              className="bg-cream rounded-lg border-[3px] border-fire px-2 py-1.5 text-center"
            >
              <span className="font-display text-ink text-base leading-none uppercase">
                {word}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
