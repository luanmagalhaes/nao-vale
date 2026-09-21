import type { Score, Team } from "@/types/game";

const labels: Record<Team, { title: string; background: string }> = {
  red: { title: "Vermelho", background: "bg-team-red" },
  blue: { title: "Azul", background: "bg-team-blue" },
};

export function Scoreboard({
  score,
  highlight,
  pulsing,
}: {
  score: Score;
  highlight?: Team | null;
  pulsing?: Team | null;
}) {
  return (
    <div className="flex w-full max-w-sm items-stretch gap-2">
      {(["red", "blue"] as const).map((team) => (
        <div
          key={team}
          className={`stroke-hard hard-shadow flex flex-1 flex-col items-center rounded-2xl py-2 ${
            labels[team].background
          } ${highlight === team ? "scale-105" : "opacity-90"}`}
        >
          <span className="font-display text-cream text-xs uppercase tracking-wider">
            {labels[team].title}
          </span>
          <span
            className="font-display text-cream outline-text-thin text-4xl leading-none"
            style={
              pulsing === team
                ? { animation: "score-pop 0.5s ease-out" }
                : undefined
            }
          >
            {score[team]}
          </span>
        </div>
      ))}
    </div>
  );
}
