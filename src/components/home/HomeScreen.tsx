"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { Wordmark } from "@/components/ui/Wordmark";
import { HowToPlay } from "@/components/game/HowToPlay";
import { api } from "@/lib/api/client";
import { copy } from "@/data/copy";
import { tamanhoDoCodigo } from "@/lib/game/rules";
import {
  guardarSessao,
  inscrever,
  lerTutorialVisto,
  marcarTutorialVisto,
  tutorialDoServidor,
} from "@/lib/session";

type Modo = "escolha" | "entrando";

export function HomeScreen() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("escolha");
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [tutorialAberto, setTutorialAberto] = useState(false);

  const tutorialVisto = useSyncExternalStore(
    inscrever,
    lerTutorialVisto,
    tutorialDoServidor,
  );

  const nomeValido = nome.trim().length > 1;
  const mostrarTutorial = tutorialAberto || !tutorialVisto;

  async function despachar(executar: () => Promise<{ code: string; token: string; playerId: string }>) {
    if (!nomeValido) {
      setErro(copy.erros.nomeVazio);
      return;
    }

    setOcupado(true);

    try {
      setErro("");
      const sessao = await executar();
      guardarSessao(sessao);
      router.push(`/sala/${sessao.code}`);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : copy.erros.semRede);
    } finally {
      setOcupado(false);
    }
  }

  function entrarNaSala() {
    if (codigo.trim().length !== tamanhoDoCodigo) {
      setErro(copy.erros.codigoCurto);
      return;
    }

    void despachar(() => api.entrar(codigo.trim(), nome.trim()));
  }

  return (
    <main className="bolinhas bg-banana flex min-h-dvh flex-col items-center px-6 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(2.5rem+var(--safe-top))]">
      <SoundToggle />

      <div style={{ animation: "sobe-suave 0.5s both" }}>
        <Wordmark tamanho="medio" />
      </div>

      <div
        className="mt-10 flex w-full max-w-sm flex-col gap-4"
        style={{ animation: "sobe-suave 0.5s 0.12s both" }}
      >
        <label className="font-display text-tinta text-lg uppercase tracking-wide">
          {copy.home.campoNome}
          <input
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder={copy.home.placeholderNome}
            maxLength={16}
            className="bg-creme traco sombra-dura font-sans mt-2 w-full rounded-2xl px-4 py-3 text-xl font-bold outline-none placeholder:opacity-40"
          />
        </label>

        {modo === "escolha" ? (
          <div className="flex flex-col gap-3">
            <Button
              cor="fogo"
              disabled={ocupado}
              onClick={() => despachar(() => api.criarSala(nome.trim(), "suave"))}
            >
              {copy.home.criar}
            </Button>
            <Button cor="ceu" onClick={() => setModo("entrando")}>
              {copy.home.entrar}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="font-display text-tinta text-lg uppercase tracking-wide">
              {copy.home.campoCodigo}
              <input
                value={codigo}
                onChange={(evento) =>
                  setCodigo(
                    evento.target.value
                      .replace(/\D/g, "")
                      .slice(0, tamanhoDoCodigo),
                  )
                }
                placeholder={copy.home.placeholderCodigo}
                inputMode="numeric"
                autoComplete="off"
                className="bg-creme traco sombra-dura font-display mt-2 w-full rounded-2xl px-4 py-3 text-center text-5xl tracking-[0.3em] outline-none placeholder:opacity-30"
              />
            </label>
            <Button cor="ceu" disabled={ocupado} onClick={entrarNaSala}>
              {copy.home.confirmarEntrada}
            </Button>
            <Button cor="creme" onClick={() => setModo("escolha")}>
              {copy.home.voltar}
            </Button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setTutorialAberto(true)}
          className="font-display text-tinta text-center text-base uppercase underline decoration-2 underline-offset-4"
        >
          {copy.home.regras}
        </button>

        {erro ? (
          <p
            className="bg-fogo text-creme traco-fino font-display rounded-xl px-4 py-2 text-center text-lg uppercase"
            style={{ animation: "tremor 0.4s both" }}
          >
            {erro}
          </p>
        ) : null}
      </div>

      {mostrarTutorial ? (
        <HowToPlay
          onClose={() => {
            marcarTutorialVisto();
            setTutorialAberto(false);
          }}
        />
      ) : null}
    </main>
  );
}
