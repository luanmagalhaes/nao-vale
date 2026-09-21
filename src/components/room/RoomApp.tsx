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
  guardarSessao,
  inscrever,
  lerSessao,
  limparSessao,
  sessaoDoServidor,
} from "@/lib/session";

export function RoomApp({ code }: { code: string }) {
  const router = useRouter();
  const parametros = useSearchParams();
  const convite = parametros.get("t");
  const [tutorial, setTutorial] = useState(false);
  const sessao = useSyncExternalStore(inscrever, lerSessao, sessaoDoServidor);
  const token = sessao?.code === code ? sessao.token : convite;

  useEffect(() => {
    if (!convite) {
      return;
    }

    const aplicar = setTimeout(() => {
      guardarSessao({ code, token: convite, playerId: "" }, true);
      router.replace(`/sala/${code}`);
    }, 0);

    return () => clearTimeout(aplicar);
  }, [convite, code, router]);
  const { estado, erro, carregando, atualizar } = useRoom(code, token);

  if (!token) {
    return (
      <main className="bolinhas bg-banana flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
        <Wordmark tamanho="medio" comTagline={false} />
        <p className="font-display text-tinta text-center text-xl uppercase">
          Você ainda não entrou nessa sala
        </p>
        <Button cor="fogo" onClick={() => router.push("/")}>
          Ir para o começo
        </Button>
      </main>
    );
  }

  if (carregando && !estado) {
    return (
      <main className="bolinhas bg-banana flex min-h-dvh items-center justify-center">
        <div style={{ animation: "flutua 1.6s ease-in-out infinite" }}>
          <Wordmark tamanho="medio" comTagline={false} />
        </div>
      </main>
    );
  }

  if (!estado) {
    return (
      <main className="bolinhas bg-banana flex min-h-dvh flex-col items-center justify-center gap-5 px-6">
        <p className="font-display bg-fogo text-creme traco sombra-dura rounded-2xl px-4 py-3 text-center text-lg uppercase">
          {erro ?? "Não achei essa sala"}
        </p>
        <Button
          cor="creme"
          onClick={() => {
            limparSessao();
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

      {estado.room.status === "lobby" ? (
        <LobbyScreen
          estado={estado}
          token={token}
          onTutorial={() => setTutorial(true)}
        />
      ) : null}

      {estado.room.status === "jogando" ? (
        <TurnScreen estado={estado} token={token} onAtualizar={atualizar} />
      ) : null}

      {estado.room.status === "fim" ? (
        <VictoryScreen estado={estado} token={token} />
      ) : null}

      {tutorial ? <HowToPlay onClose={() => setTutorial(false)} /> : null}
    </>
  );
}
