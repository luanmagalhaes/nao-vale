import { copy } from "@/data/copy";

type Size = "lg" | "md" | "sm";

const scales: Record<Size, { row: string; badge: string; tagline: string }> = {
  lg: {
    row: "text-[19vw] leading-[0.82] sm:text-[7rem]",
    badge: "text-base px-4 py-1.5",
    tagline: "text-sm",
  },
  md: {
    row: "text-[13vw] leading-[0.82] sm:text-[4.5rem]",
    badge: "text-sm px-3 py-1",
    tagline: "text-xs",
  },
  sm: {
    row: "text-[8vw] leading-[0.85] sm:text-3xl",
    badge: "text-[10px] px-2 py-0.5",
    tagline: "text-[10px]",
  },
};

export function Wordmark({
  size = "lg",
  withTagline = true,
}: {
  size?: Size;
  withTagline?: boolean;
}) {
  const scale = scales[size];

  return (
    <div className="flex flex-col items-center select-none">
      <span
        className={`font-display text-cream outline-text ${scale.row} -rotate-3`}
      >
        {copy.brand.firstLine}
      </span>
      <span
        className={`font-display text-fire outline-text ${scale.row} rotate-2 -mt-[0.12em]`}
      >
        {copy.brand.secondLine}
      </span>
      {withTagline ? (
        <span
          className={`font-display bg-ink text-yellow stroke-thin hard-shadow mt-3 -rotate-1 rounded-xl uppercase tracking-wide ${scale.badge}`}
        >
          {copy.brand.tagline}
        </span>
      ) : null}
    </div>
  );
}
