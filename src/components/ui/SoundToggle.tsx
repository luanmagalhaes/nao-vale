"use client";

import { useSyncExternalStore } from "react";
import {
  toggleMuted,
  subscribeMuted,
  readMuted,
  mutedOnServer,
  preloadSounds,
  playSound,
} from "@/lib/sound";

export function SoundToggle() {
  const mudo = useSyncExternalStore(subscribeMuted, readMuted, mutedOnServer);

  return (
    <button
      type="button"
      aria-label={mudo ? "Ligar o som" : "Desligar o som"}
      onClick={() => {
        toggleMuted();

        if (mudo) {
          preloadSounds();
          playSound("tap");
        }
      }}
      className="bg-cream stroke-hard hard-shadow fixed right-3 top-[calc(0.75rem+var(--safe-top))] z-50 flex h-11 w-11 items-center justify-center rounded-full"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path
          d="M4 9h3.5L12 5v14l-4.5-4H4z"
          fill="#000000"
          stroke="#000000"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {mudo ? (
          <g stroke="#f05400" strokeWidth="2.4" strokeLinecap="round">
            <path d="M16 9l5 6M21 9l-5 6" />
          </g>
        ) : (
          <g
            stroke="#000000"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
            <path d="M18 7a7 7 0 0 1 0 10" />
          </g>
        )}
      </svg>
    </button>
  );
}
