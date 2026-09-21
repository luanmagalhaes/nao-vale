"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TeamDraw } from "@/components/room/TeamDraw";
import { api, type EstadoDaSala } from "@/lib/api/client";
import { deckSizes } from "@/data/deck";
import { minPlayers, podeComecar, semTime } from "@/lib/game/rules";
import type { DeckMode, Team } from "@/types/game";

const baralhos: {
  modo: DeckMode;
  nome: string;
  descricao: string;
  total: number;
}[] = [
  {
    modo: "suave",
    nome: "De boa",
    descricao: "Sem picante. Serve pra jogar com a família toda.",
    total: deckSizes.suave,
  },
  {
    modo: "apimentado",
    nome: "Picante + extra",
    descricao: "Só carta adulta. Não jogue com a sua avó.",
    total: deckSizes.apimentado,
  },
  {
    modo: "misto",
    nome: "Misto",
    descricao: "Tudo junto. A carta picante vem sem avisar.",
    total: deckSizes.misto,
  },
];

const coresDeTime: Record<Team, string> = {
  vermelho: "bg-time-vermelho",
  azul: "bg-time-azul",
};

export function LobbyScreen({
  estado,
  token,
  onTutorial,
}: {
  estado: EstadoDaSala;
  token: string;
  onTutorial: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState("");
  const [sorteando, setSorteando] = useState(false);
  const [mostrarSorteio, setMostrarSorteio] = useState(false);
  const semTimeAntes = useRef<number | null>(null);

  const { room, players, me } = estado;
  const pronto = podeComecar(players);
  const aguardando = semTime(players);
  const jaSorteado = aguardando.length === 0 && players.length > 0;

  useEffect(() => {
    const antes = semTimeAntes.current;
    semTimeAntes.current = aguardando.length;

    if (antes === null || antes === 0 || aguardando.length > 0) {
      return;
    }

    const abrir = setTimeout(() => setMostrarSorteio(true), 0);

    return () => clearTimeout(abrir);
  }, [aguardando.length]);

  async function acao(executar: () => Promise<unknown>) {
    try {
      setErro("");
      await executar();
    } catch (falha) {
      setErro(
        falha instanceof Error ? falha.message : "Deu ruim aqui. Tente de novo.",
      );
    }
  }

  async function sortear() {
    setSorteando(true);

    try {
      setErro("");
      await api.sortearTimes(room.code, token);
    } catch (falha) {
      setErro(
        falha instanceof Error ? falha.message : "Deu ruim aqui. Tente de novo.",
      );
    } finally {
      setSorteando(false);
    }
  }

  async function copiarCodigo() {
    await navigator.clipboard.writeText(room.code);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1600);
  }

  return (
    <main className="bolinhas bg-banana flex min-h-dvh flex-col items-center gap-5 px-5 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))]">
      <button
        type="button"
        onClick={copiarCodigo}
        className="bg-tinta traco sombra-dura-g flex w-full max-w-sm flex-col items-center rounded-3xl py-4"
        style={{ animation: "sobe-suave 0.4s both" }}
      >
        <span className="font-display text-banana text-xs uppercase tracking-[0.3em]">
          {copiado ? "Copiado!" : "Código da sala"}
        </span>
        <span className="font-display text-creme text-6xl leading-none tracking-[0.2em]">
          {room.code}
        </span>
      </button>

      {jaSorteado ? (
        <section className="w-full max-w-sm">
          <h2 className="font-display text-tinta mb-2 text-lg uppercase">
            Os times
          </h2>
          <div className="grid grid-cols-2 items-stretch gap-2">
            {(["vermelho", "azul"] as const).map((time) => {
              const doTime = players.filter(
                (jogador) => jogador.team === time,
              );

              return (
                <div
                  key={time}
                  className={`traco sombra-dura flex flex-col gap-2 rounded-2xl p-2 ${coresDeTime[time]}`}
                >
                  <div className="text-center">
                    <p className="font-display text-creme text-xs uppercase leading-none">
                      Time {time}
                    </p>
                    <p className="font-display text-creme contorno-fino text-3xl leading-none">
                      {doTime.length}
                    </p>
                  </div>
                  <ul className="flex flex-1 flex-col gap-1.5">
                    {doTime.length === 0 ? (
                      <li className="border-creme/50 font-display text-creme/70 rounded-lg border-2 border-dashed px-2 py-1.5 text-center text-xs uppercase leading-none">
                        vazio
                      </li>
                    ) : (
                      doTime.map((jogador) => (
                        <li
                          key={jogador.id}
                          className="bg-creme traco-fino font-display rounded-lg px-2 py-1.5 text-center text-sm uppercase leading-none"
                        >
                          {jogador.name}
                          {jogador.is_host ? " ★" : ""}
                        </li>
                      ))
                    )}
                  </ul>
                  {me.team === time ? null : (
                    <button
                      type="button"
                      onClick={() =>
                        acao(() => api.trocarTime(room.code, token, time))
                      }
                      className="font-display bg-creme text-tinta traco-fino mt-auto rounded-lg px-2 py-1 text-xs uppercase"
                    >
                      Passar pra cá
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="w-full max-w-sm">
          <h2 className="font-display text-tinta mb-2 text-lg uppercase">
            Na mesa ({players.length})
          </h2>
          <div className="bg-creme traco sombra-dura rounded-2xl p-3">
            <ul className="flex flex-wrap justify-center gap-1.5">
              {players.map((jogador) => (
                <li
                  key={jogador.id}
                  className="bg-banana traco-fino font-display rounded-lg px-2 py-1 text-sm uppercase"
                  style={{ animation: "sobe-suave 0.35s both" }}
                >
                  {jogador.name}
                  {jogador.is_host ? " ★" : ""}
                </li>
              ))}
            </ul>
            <p className="font-display text-tinta mt-3 text-center text-xs uppercase opacity-70">
              Ninguém tem time ainda. O sorteio decide.
            </p>
          </div>
        </section>
      )}

      <section className="w-full max-w-sm">
        <h2 className="font-display text-tinta mb-2 text-lg uppercase">
          Baralho
        </h2>
        <div className="flex flex-col gap-2">
          {baralhos.map((baralho) => {
            const ativo = room.deck_mode === baralho.modo;

            return (
              <button
                key={baralho.modo}
                type="button"
                disabled={!me.is_host}
                onClick={() =>
                  acao(() => api.trocarBaralho(room.code, token, baralho.modo))
                }
                className={`traco sombra-dura rounded-2xl px-3 py-2 text-left disabled:opacity-60 ${
                  ativo ? "bg-fogo text-creme" : "bg-creme text-tinta"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg uppercase">
                    {baralho.nome}
                  </span>
                  <span className="font-display text-xs uppercase opacity-80">
                    {baralho.total} cartas
                  </span>
                </div>
                <p className="text-xs font-bold opacity-90">
                  {baralho.descricao}
                </p>
              </button>
            );
          })}
        </div>
        {me.is_host ? null : (
          <p className="font-display text-tinta mt-2 text-center text-xs uppercase opacity-70">
            Só quem criou a sala escolhe o baralho
          </p>
        )}
      </section>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {me.is_host ? (
          <>
            <Button
              cor="tinta"
              disabled={sorteando || players.length < minPlayers}
              onClick={sortear}
            >
              {sorteando
                ? "Sorteando..."
                : jaSorteado
                  ? "Sortear de novo"
                  : "Sortear times"}
            </Button>
            <Button
              cor="fogo"
              disabled={!pronto}
              onClick={() => acao(() => api.comecarJogo(room.code, token))}
            >
              Começar o jogo
            </Button>
          </>
        ) : (
          <p className="font-display bg-creme traco sombra-dura rounded-2xl px-4 py-3 text-center text-lg uppercase">
            {jaSorteado
              ? "Esperando o dono da sala começar"
              : "Esperando o sorteio dos times"}
          </p>
        )}

        <Button cor="ceu" onClick={onTutorial}>
          Como se joga
        </Button>

        {players.length < minPlayers ? (
          <p className="font-display text-tinta text-center text-xs uppercase opacity-80">
            Precisa de {minPlayers} pessoas na mesa pra sortear
          </p>
        ) : null}

        {erro ? (
          <p
            className="bg-fogo text-creme traco-fino font-display rounded-xl px-4 py-2 text-center text-base uppercase"
            style={{ animation: "tremor 0.4s both" }}
          >
            {erro}
          </p>
        ) : null}
      </div>

      {mostrarSorteio ? (
        <TeamDraw
          players={players}
          onFechar={() => setMostrarSorteio(false)}
        />
      ) : null}
    </main>
  );
}
