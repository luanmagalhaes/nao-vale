"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { playSound } from "@/lib/sound";

type Cor = "banana" | "tangerina" | "fogo" | "ceu" | "creme" | "tinta";

const cores: Record<Cor, string> = {
  banana: "bg-yellow text-ink",
  tangerina: "bg-orange text-cream",
  fogo: "bg-fire text-cream",
  ceu: "bg-sky text-cream",
  creme: "bg-cream text-ink",
  tinta: "bg-ink text-yellow",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  cor?: Cor;
  width?: "cheia" | "auto";
};

export function Button({
  cor = "creme",
  width = "cheia",
  className = "",
  children,
  onClick,
  ...resto
}: Props) {
  function aoClicar(event: MouseEvent<HTMLButtonElement>) {
    playSound("tap");
    onClick?.(event);
  }

  return (
    <button
      onClick={aoClicar}
      className={`font-display stroke-hard hard-shadow rounded-2xl px-6 py-4 text-2xl uppercase tracking-wide transition-transform duration-100 active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_var(--color-ink)] disabled:opacity-50 ${
        cores[cor]
      } ${width === "cheia" ? "w-full" : ""} ${className}`}
      {...resto}
    >
      {children}
    </button>
  );
}
