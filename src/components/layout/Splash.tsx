"use client";

import { Wordmark } from "@/components/ui/Wordmark";

const cartasDecorativas = [
  { esquerda: "8%", topo: "16%", giro: "-18deg", atraso: "0.15s" },
  { esquerda: "72%", topo: "12%", giro: "14deg", atraso: "0.3s" },
  { esquerda: "16%", topo: "68%", giro: "11deg", atraso: "0.45s" },
  { esquerda: "76%", topo: "72%", giro: "-13deg", atraso: "0.6s" },
];

export function Splash({ saindo }: { saindo: boolean }) {
  return (
    <div
      className="bolinhas bg-banana fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={
        saindo
          ? { animation: "saida-splash 0.5s ease-in forwards" }
          : undefined
      }
    >
      <div
        className="bg-mel absolute h-[160vmax] w-[160vmax] opacity-40"
        style={{
          animation: "brilho-girando 18s linear infinite",
          background:
            "conic-gradient(from 0deg, transparent 0deg 18deg, var(--color-mel) 18deg 36deg)",
        }}
      />

      {cartasDecorativas.map((carta) => (
        <div
          key={`${carta.esquerda}-${carta.topo}`}
          className="bg-creme traco sombra-dura absolute h-24 w-16 rounded-xl"
          style={{
            left: carta.esquerda,
            top: carta.topo,
            transform: `rotate(${carta.giro})`,
            animation: `pulo-entrada 0.8s ${carta.atraso} both, flutua 3.4s ${carta.atraso} ease-in-out infinite 0.9s`,
          }}
        >
          <div className="bg-ceu traco-fino m-1.5 h-4 rounded" />
          <div className="bg-banana traco-fino mx-1.5 mt-1.5 h-2.5 rounded" />
          <div className="bg-banana traco-fino mx-1.5 mt-1 h-2.5 rounded" />
          <div className="bg-banana traco-fino mx-1.5 mt-1 h-2.5 rounded" />
        </div>
      ))}

      <div
        className="relative z-10"
        style={{ animation: "pulo-entrada 0.9s 0.1s both" }}
      >
        <Wordmark tamanho="grande" />
      </div>
    </div>
  );
}
