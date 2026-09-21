"use client";

import { Wordmark } from "@/components/ui/Wordmark";

const floatingCards = [
  { left: "8%", top: "16%", tilt: "-18deg", delay: "0.15s" },
  { left: "72%", top: "12%", tilt: "14deg", delay: "0.3s" },
  { left: "16%", top: "68%", tilt: "11deg", delay: "0.45s" },
  { left: "76%", top: "72%", tilt: "-13deg", delay: "0.6s" },
];

export function Splash({ leaving }: { leaving: boolean }) {
  return (
    <div
      className="dots bg-yellow fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={
        leaving
          ? { animation: "splash-out 0.5s ease-in forwards" }
          : undefined
      }
    >
      <div
        className="bg-honey absolute h-[160vmax] w-[160vmax] opacity-40"
        style={{
          animation: "shine-spin 18s linear infinite",
          background:
            "conic-gradient(from 0deg, transparent 0deg 18deg, var(--color-honey) 18deg 36deg)",
        }}
      />

      {floatingCards.map((card) => (
        <div
          key={`${card.left}-${card.top}`}
          className="bg-cream stroke-hard hard-shadow absolute h-24 w-16 rounded-xl"
          style={{
            left: card.left,
            top: card.top,
            transform: `rotate(${card.tilt})`,
            animation: `bounce-in 0.8s ${card.delay} both, float-soft 3.4s ${card.delay} ease-in-out infinite 0.9s`,
          }}
        >
          <div className="bg-sky stroke-thin m-1.5 h-4 rounded" />
          <div className="bg-yellow stroke-thin mx-1.5 mt-1.5 h-2.5 rounded" />
          <div className="bg-yellow stroke-thin mx-1.5 mt-1 h-2.5 rounded" />
          <div className="bg-yellow stroke-thin mx-1.5 mt-1 h-2.5 rounded" />
        </div>
      ))}

      <div
        className="relative z-10"
        style={{ animation: "bounce-in 0.9s 0.1s both" }}
      >
        <Wordmark size="lg" />
      </div>
    </div>
  );
}
