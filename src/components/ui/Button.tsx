"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { tocar } from "@/lib/sound";

type Cor = "banana" | "tangerina" | "fogo" | "ceu" | "creme" | "tinta";

const cores: Record<Cor, string> = {
  banana: "bg-banana text-tinta",
  tangerina: "bg-tangerina text-creme",
  fogo: "bg-fogo text-creme",
  ceu: "bg-ceu text-creme",
  creme: "bg-creme text-tinta",
  tinta: "bg-tinta text-banana",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  cor?: Cor;
  largura?: "cheia" | "auto";
};

export function Button({
  cor = "creme",
  largura = "cheia",
  className = "",
  children,
  onClick,
  ...resto
}: Props) {
  function aoClicar(evento: MouseEvent<HTMLButtonElement>) {
    tocar("tap");
    onClick?.(evento);
  }

  return (
    <button
      onClick={aoClicar}
      className={`font-display traco sombra-dura rounded-2xl px-6 py-4 text-2xl uppercase tracking-wide transition-transform duration-100 active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_var(--color-tinta)] disabled:opacity-50 ${
        cores[cor]
      } ${largura === "cheia" ? "w-full" : ""} ${className}`}
      {...resto}
    >
      {children}
    </button>
  );
}
