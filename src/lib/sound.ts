"use client";

export type SoundName =
  | "tap"
  | "card"
  | "right"
  | "skip"
  | "buzz"
  | "tick"
  | "timeup"
  | "draw"
  | "win";

const names: SoundName[] = [
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

const volumes: Record<SoundName, number> = {
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

const mutedKey = "nao-vale:mudo";

const listeners = new Set<() => void>();
const elementos = new Map<SoundName, HTMLAudioElement>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeMuted(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function readMuted(): boolean {
  return window.localStorage.getItem(mutedKey) === "1";
}

export function mutedOnServer(): boolean {
  return false;
}

export function toggleMuted() {
  const proximo = !readMuted();

  window.localStorage.setItem(mutedKey, proximo ? "1" : "0");
  notify();
}

function elementFor(name: SoundName): HTMLAudioElement | null {
  if (typeof window === "undefined") {
    return null;
  }

  const existente = elementos.get(name);

  if (existente) {
    return existente;
  }

  const audio = new Audio(`/sounds/${name}.wav`);

  audio.preload = "auto";
  audio.volume = volumes[name];
  elementos.set(name, audio);

  return audio;
}

export function preloadSounds() {
  names.forEach((name) => {
    const audio = elementFor(name);

    audio?.load();
  });
}

export function playSound(name: SoundName) {
  if (typeof window === "undefined" || readMuted()) {
    return;
  }

  const audio = elementFor(name);

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
