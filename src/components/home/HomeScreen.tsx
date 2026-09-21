"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { Wordmark } from "@/components/ui/Wordmark";
import { HowToPlay } from "@/components/game/HowToPlay";
import { api } from "@/lib/api/client";
import { copy } from "@/data/copy";
import { codeLength } from "@/lib/game/rules";
import {
  saveSession,
  subscribe,
  readTutorialSeen,
  markTutorialSeen,
  tutorialOnServer,
} from "@/lib/session";

type Modo = "escolha" | "entrando";

export function HomeScreen() {
  const router = useRouter();
  const [mode, setModo] = useState<Modo>("escolha");
  const [name, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tutorialAberto, setTutorialAberto] = useState(false);

  const tutorialVisto = useSyncExternalStore(
    subscribe,
    readTutorialSeen,
    tutorialOnServer,
  );

  const nomeValido = name.trim().length > 1;
  const mostrarTutorial = tutorialAberto || !tutorialVisto;

  async function dispatch(run: () => Promise<{ code: string; token: string; playerId: string }>) {
    if (!nomeValido) {
      setError(copy.errors.emptyName);
      return;
    }

    setBusy(true);

    try {
      setError("");
      const sessao = await run();
      saveSession(sessao);
      router.push(`/room/${sessao.code}`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : copy.errors.offline);
    } finally {
      setBusy(false);
    }
  }

  function joinRoom() {
    if (codigo.trim().length !== codeLength) {
      setError(copy.errors.shortCode);
      return;
    }

    void dispatch(() => api.joinRoom(codigo.trim(), name.trim()));
  }

  return (
    <main className="dots bg-yellow flex min-h-dvh flex-col items-center px-6 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(2.5rem+var(--safe-top))]">
      <SoundToggle />

      <div style={{ animation: "rise-in 0.5s both" }}>
        <Wordmark size="md" />
      </div>

      <div
        className="mt-10 flex w-full max-w-sm flex-col gap-4"
        style={{ animation: "rise-in 0.5s 0.12s both" }}
      >
        <label className="font-display text-ink text-lg uppercase tracking-wide">
          {copy.home.nameField}
          <input
            value={name}
            onChange={(event) => setNome(event.target.value)}
            placeholder={copy.home.namePlaceholder}
            maxLength={16}
            className="bg-cream stroke-hard hard-shadow font-sans mt-2 w-full rounded-2xl px-4 py-3 text-xl font-bold outline-none placeholder:opacity-40"
          />
        </label>

        {mode === "escolha" ? (
          <div className="flex flex-col gap-3">
            <Button
              cor="fogo"
              disabled={busy}
              onClick={() => dispatch(() => api.createRoom(name.trim(), "mild"))}
            >
              {copy.home.create}
            </Button>
            <Button cor="ceu" onClick={() => setModo("entrando")}>
              {copy.home.join}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="font-display text-ink text-lg uppercase tracking-wide">
              {copy.home.codeField}
              <input
                value={codigo}
                onChange={(event) =>
                  setCodigo(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, codeLength),
                  )
                }
                placeholder={copy.home.codePlaceholder}
                inputMode="numeric"
                autoComplete="off"
                className="bg-cream stroke-hard hard-shadow font-display mt-2 w-full rounded-2xl px-4 py-3 text-center text-5xl tracking-[0.3em] outline-none placeholder:opacity-30"
              />
            </label>
            <Button cor="ceu" disabled={busy} onClick={joinRoom}>
              {copy.home.confirmJoin}
            </Button>
            <Button cor="creme" onClick={() => setModo("escolha")}>
              {copy.home.back}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setTutorialAberto(true)}
            className="font-display text-ink text-base uppercase underline decoration-2 underline-offset-4"
          >
            {copy.home.rules}
          </button>
          <button
            type="button"
            onClick={() => router.push("/history")}
            className="font-display text-ink text-base uppercase underline decoration-2 underline-offset-4"
          >
            {copy.home.history}
          </button>
        </div>

        {error ? (
          <p
            className="bg-fire text-cream stroke-thin font-display rounded-xl px-4 py-2 text-center text-lg uppercase"
            style={{ animation: "shake 0.4s both" }}
          >
            {error}
          </p>
        ) : null}
      </div>

      {mostrarTutorial ? (
        <HowToPlay
          onClose={() => {
            markTutorialSeen();
            setTutorialAberto(false);
          }}
        />
      ) : null}
    </main>
  );
}
