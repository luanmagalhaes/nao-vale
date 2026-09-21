import type { Score, Team } from "@/types/game";

const rotulos: Record<Team, { nome: string; fundo: string }> = {
  vermelho: { nome: "Vermelho", fundo: "bg-time-vermelho" },
  azul: { nome: "Azul", fundo: "bg-time-azul" },
};

export function Scoreboard({
  score,
  destaque,
  pulsando,
}: {
  score: Score;
  destaque?: Team | null;
  pulsando?: Team | null;
}) {
  return (
    <div className="flex w-full max-w-sm items-stretch gap-2">
      {(["vermelho", "azul"] as const).map((time) => (
        <div
          key={time}
          className={`traco sombra-dura flex flex-1 flex-col items-center rounded-2xl py-2 ${
            rotulos[time].fundo
          } ${destaque === time ? "scale-105" : "opacity-90"}`}
        >
          <span className="font-display text-creme text-xs uppercase tracking-wider">
            {rotulos[time].nome}
          </span>
          <span
            className="font-display text-creme contorno-fino text-4xl leading-none"
            style={
              pulsando === time
                ? { animation: "placar-pulsa 0.5s ease-out" }
                : undefined
            }
          >
            {score[time]}
          </span>
        </div>
      ))}
    </div>
  );
}
