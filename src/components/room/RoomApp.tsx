"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HowToPlay } from "@/components/game/HowToPlay";
import { LobbyScreen } from "@/components/room/LobbyScreen";
import { TurnScreen } from "@/components/room/TurnScreen";
import { VictoryScreen } from "@/components/room/VictoryScreen";
import { Button } from "@/components/ui/Button";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { Wordmark } from "@/components/ui/Wordmark";
import { useRoom } from "@/hooks/useRoom";
import {
  saveSession,
  subscribe,
  readSession,
  clearSession,
  sessionOnServer,
} from "@/lib/session";

export function RoomApp({ code }: { code: string }) {
  const router = useRouter();
  const parametros = useSearchParams();
  const convite = parametros.get("t");
  const [tutorial, setTutorial] = useState(false);
  const sessao = useSyncExternalStore(subscribe, readSession, sessionOnServer);
  const token = sessao?.code === code ? sessao.token : convite;

  useEffect(() => {
    if (!convite) {
      return;
    }

    const aplicar = setTimeout(() => {
      saveSession({ code, token: convite, playerId: "" }, true);
      router.replace(`/room/${code}`);
    }, 0);

    return () => clearTimeout(aplicar);
  }, [convite, code, router]);
  const { state, error, loading, refresh } = useRoom(code, token);

  if (!token) {
    return (
      <main className="dots bg-yellow flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
        <Wordmark size="md" withTagline={false} />
        <p className="font-display text-ink text-center text-xl uppercase">
          Você ainda não entrou nessa room
        </p>
        <Button color="fire" onClick={() => router.push("/")}>
          Ir para o começo
        </Button>
      </main>
    );
  }

  if (loading && !state) {
    return (
      <main className="dots bg-yellow flex min-h-dvh items-center justify-center">
        <div style={{ animation: "float-soft 1.6s ease-in-out infinite" }}>
          <Wordmark size="md" withTagline={false} />
        </div>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="dots bg-yellow flex min-h-dvh flex-col items-center justify-center gap-5 px-6">
        <p className="font-display bg-fire text-cream stroke-hard hard-shadow rounded-2xl px-4 py-3 text-center text-lg uppercase">
          {error ?? "Não achei essa sala"}
        </p>
        <Button
          color="cream"
          onClick={() => {
            clearSession();
            router.push("/");
          }}
        >
          Voltar ao começo
        </Button>
      </main>
    );
  }

  return (
    <>
      <SoundToggle />

      {state.room.status === "lobby" ? (
        <LobbyScreen
          state={state}
          token={token}
          onHelp={() => setTutorial(true)}
        />
      ) : null}

      {state.room.status === "playing" ? (
        <TurnScreen state={state} token={token} onRefresh={refresh} />
      ) : null}

      {state.room.status === "done" ? (
        <VictoryScreen state={state} token={token} />
      ) : null}

      {tutorial ? <HowToPlay onClose={() => setTutorial(false)} /> : null}
    </>
  );
}
