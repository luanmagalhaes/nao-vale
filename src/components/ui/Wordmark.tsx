import { copy } from "@/data/copy";

type Tamanho = "grande" | "medio" | "pequeno";

const escalas: Record<Tamanho, { linha: string; selo: string; tagline: string }> = {
  grande: {
    linha: "text-[19vw] leading-[0.82] sm:text-[7rem]",
    selo: "text-base px-4 py-1.5",
    tagline: "text-sm",
  },
  medio: {
    linha: "text-[13vw] leading-[0.82] sm:text-[4.5rem]",
    selo: "text-sm px-3 py-1",
    tagline: "text-xs",
  },
  pequeno: {
    linha: "text-[8vw] leading-[0.85] sm:text-3xl",
    selo: "text-[10px] px-2 py-0.5",
    tagline: "text-[10px]",
  },
};

export function Wordmark({
  tamanho = "grande",
  comTagline = true,
}: {
  tamanho?: Tamanho;
  comTagline?: boolean;
}) {
  const escala = escalas[tamanho];

  return (
    <div className="flex flex-col items-center select-none">
      <span
        className={`font-display text-creme contorno ${escala.linha} -rotate-3`}
      >
        {copy.marca.linha1}
      </span>
      <span
        className={`font-display text-fogo contorno ${escala.linha} rotate-2 -mt-[0.12em]`}
      >
        {copy.marca.linha2}
      </span>
      {comTagline ? (
        <span
          className={`font-display bg-tinta text-banana traco-fino sombra-dura mt-3 -rotate-1 rounded-xl uppercase tracking-wide ${escala.selo}`}
        >
          {copy.marca.tagline}
        </span>
      ) : null}
    </div>
  );
}
