"use client";

export type Som =
  | "tap"
  | "card"
  | "right"
  | "skip"
  | "buzz"
  | "tick"
  | "timeup"
  | "draw"
  | "win";

const nomes: Som[] = [
  "tap",
  "card",
  "right",
  "skip",
  "buzz",
  "tick",
  "timeup",
  "draw",
  "win",
];

const volumes: Record<Som, number> = {
  tap: 0.35,
  card: 0.5,
  right: 0.6,
  skip: 0.45,
  buzz: 0.7,
  tick: 0.4,
  timeup: 0.65,
  draw: 0.6,
  win: 0.7,
};

const chaveMudo = "nao-vale:mudo";

const ouvintes = new Set<() => void>();
const elementos = new Map<Som, HTMLAudioElement>();

function avisar() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function inscreverMudo(ouvinte: () => void) {
  ouvintes.add(ouvinte);

  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function lerMudo(): boolean {
  return window.localStorage.getItem(chaveMudo) === "1";
}

export function mudoDoServidor(): boolean {
  return false;
}

export function alternarMudo() {
  const proximo = !lerMudo();

  window.localStorage.setItem(chaveMudo, proximo ? "1" : "0");
  avisar();
}

function elementoDe(nome: Som): HTMLAudioElement | null {
  if (typeof window === "undefined") {
    return null;
  }

  const existente = elementos.get(nome);

  if (existente) {
    return existente;
  }

  const audio = new Audio(`/sounds/${nome}.wav`);

  audio.preload = "auto";
  audio.volume = volumes[nome];
  elementos.set(nome, audio);

  return audio;
}

export function prepararSons() {
  nomes.forEach((nome) => {
    const audio = elementoDe(nome);

    audio?.load();
  });
}

export function tocar(nome: Som) {
  if (typeof window === "undefined" || lerMudo()) {
    return;
  }

  const audio = elementoDe(nome);

  if (!audio) {
    return;
  }

  try {
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  } catch {
    return;
  }
}
