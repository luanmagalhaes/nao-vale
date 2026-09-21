"use client";

import { useEffect, useRef, useState } from "react";
import { CardView } from "@/components/game/CardView";
import { Scoreboard } from "@/components/room/Scoreboard";
import { Button } from "@/components/ui/Button";
import { api, type EstadoDaSala } from "@/lib/api/client";
import { useNow } from "@/hooks/useNow";
import { timeAdversario } from "@/lib/game/rules";
import type { Outcome, Team } from "@/types/game";

function nomeDe(estado: EstadoDaSala, id: string | null | undefined) {
  return estado.players.find((jogador) => jogador.id === id)?.name ?? "alguém";
}

export function TurnScreen({
  estado,
  token,
  onAtualizar,
}: {
  estado: EstadoDaSala;
  token: string;
  onAtualizar: () => void;
}) {
  const [saindo, setSaindo] = useState<Team | null>(null);
  const [carimbo, setCarimbo] = useState(false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const ultimoResultado = useRef<string | null>(null);
  const encerrando = useRef(false);

  const { turn, room, me, card, score } = estado;
  const rodando = turn?.status === "running";
  const agora = useNow(Boolean(rodando));

  const souFalante = turn?.speaker_id === me.id;
  const souJuiz = turn?.judge_id === me.id;
  const timeDoTurno = (turn?.team ?? "vermelho") as Team;

  const fim = turn?.ends_at ? new Date(turn.ends_at).getTime() : 0;
  const restante = rodando ? Math.max(0, Math.ceil((fim - agora) / 1000)) : room.turn_seconds;
  const acabou = rodando && restante <= 0;

  useEffect(() => {
    const ultimo = estado.results.at(-1);

    if (!ultimo || ultimo.id === ultimoResultado.current) {
      return;
    }

    const primeiraLeitura = ultimoResultado.current === null;
    ultimoResultado.current = ultimo.id;

    if (primeiraLeitura || ultimo.undone) {
      return;
    }

    if (ultimo.outcome === "queima") {
      const aparecer = setTimeout(() => setCarimbo(true), 0);
      const sumir = setTimeout(() => setCarimbo(false), 1300);

      return () => {
        clearTimeout(aparecer);
        clearTimeout(sumir);
      };
    }
  }, [estado.results]);

  useEffect(() => {
    if (!acabou || encerrando.current) {
      return;
    }

    const atraso = souFalante ? 0 : 2500;
    const relogio = setTimeout(() => {
      encerrando.current = true;
      void api
        .encerrarTurno(room.code, token)
        .then(onAtualizar)
        .finally(() => {
          encerrando.current = false;
        });
    }, atraso);

    return () => clearTimeout(relogio);
  }, [acabou, souFalante, room.code, token, onAtualizar]);

  async function despachar(executar: () => Promise<unknown>) {
    if (ocupado) {
      return;
    }

    setOcupado(true);

    try {
      setErro("");
      await executar();
      onAtualizar();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Deu ruim.");
    } finally {
      setOcupado(false);
    }
  }

  function registrar(outcome: Outcome) {
    const destino =
      outcome === "acerto"
        ? timeDoTurno
        : outcome === "queima"
          ? timeAdversario(timeDoTurno)
          : null;

    setSaindo(destino);
    setTimeout(() => setSaindo(null), 550);

    void despachar(() => api.resultado(room.code, token, outcome));
  }

  if (!turn) {
    return null;
  }

  return (
    <main className="bolinhas bg-banana flex min-h-dvh flex-col items-center gap-3 px-4 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1rem+var(--safe-top))]">
      <Scoreboard score={score} destaque={timeDoTurno} />

      <div className="flex items-center gap-3">
        <div
          className={`traco sombra-dura font-display flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
            restante <= 10 && rodando
              ? "bg-fogo text-creme"
              : "bg-creme text-tinta"
          }`}
          style={
            restante <= 10 && rodando
              ? { animation: "tremor 0.5s infinite" }
              : undefined
          }
        >
          {restante}
        </div>
        <p className="font-display text-tinta max-w-[11rem] text-sm uppercase leading-tight">
          {nomeDe(estado, turn.speaker_id)} explica · juiz{" "}
          {nomeDe(estado, turn.judge_id)}
        </p>
      </div>

      {turn.status === "ready" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="font-display text-tinta text-center text-xl uppercase">
            {souFalante
              ? "A vez é sua"
              : `Aguardando ${nomeDe(estado, turn.speaker_id)}`}
          </p>
          {souFalante ? (
            <Button
              cor="fogo"
              disabled={ocupado}
              onClick={() =>
                despachar(() => api.comecarTurno(room.code, token))
              }
            >
              Puxar a primeira carta
            </Button>
          ) : null}
        </div>
      ) : null}

      {rodando ? (
        <div className="relative flex flex-1 flex-col items-center justify-center gap-4">
          {card ? (
            <CardView card={card} chave={turn.card_seq} saindo={saindo} />
          ) : (
            <div className="bg-creme traco sombra-dura-g flex h-72 w-full max-w-xs items-center justify-center rounded-3xl px-6">
              <p className="font-display text-tinta text-center text-xl uppercase leading-tight">
                {souFalante || souJuiz
                  ? "Puxando carta"
                  : "Só o falante e o juiz veem a carta"}
              </p>
            </div>
          )}

          {carimbo ? (
            <span
              className="font-display text-fogo contorno absolute text-6xl uppercase"
              style={{ animation: "alerta-queima 1.3s ease-out forwards" }}
            >
              Não vale!
            </span>
          ) : null}
        </div>
      ) : null}

      {rodando ? (
        <div className="flex w-full max-w-sm flex-col gap-2">
          {souFalante ? (
            <div className="flex gap-2">
              <Button
                cor="creme"
                disabled={ocupado}
                className="!bg-acerto !text-creme"
                onClick={() => registrar("acerto")}
              >
                Acertou
              </Button>
              <Button
                cor="creme"
                disabled={ocupado}
                onClick={() => registrar("pulo")}
              >
                Pular
              </Button>
            </div>
          ) : null}

          {souJuiz ? (
            <Button
              cor="fogo"
              disabled={ocupado}
              className="!text-4xl"
              onClick={() => registrar("queima")}
            >
              Não vale!
            </Button>
          ) : null}

          {souFalante || souJuiz ? (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => despachar(() => api.desfazer(room.code, token))}
              className="font-display bg-tinta text-banana traco-fino rounded-xl px-4 py-2 text-base uppercase disabled:opacity-50"
            >
              Desfazer última jogada
            </button>
          ) : null}
        </div>
      ) : null}

      {erro ? (
        <p
          className="bg-fogo text-creme traco-fino font-display w-full max-w-sm rounded-xl px-4 py-2 text-center text-base uppercase"
          style={{ animation: "tremor 0.4s both" }}
        >
          {erro}
        </p>
      ) : null}
    </main>
  );
}
