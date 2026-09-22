"use client";

import { useEffect, useRef, useState } from "react";
import { CardView } from "@/components/game/CardView";
import { Scoreboard } from "@/components/room/Scoreboard";
import { Button } from "@/components/ui/Button";
import { api, type RoomState } from "@/lib/api/client";
import { useNow } from "@/hooks/useNow";
import { rivalOf } from "@/lib/game/rules";
import { playSound } from "@/lib/sound";
import type { Card, Outcome, Team } from "@/types/game";

const genericError = "Deu ruim aqui. Tente de novo.";

function nameOf(state: RoomState, id: string | null | undefined) {
  return state.players.find((player) => player.id === id)?.name ?? "alguém";
}

export function TurnScreen({
  state,
  token,
  onRefresh,
}: {
  state: RoomState;
  token: string;
  onRefresh: () => void;
}) {
  const [leaving, setLeaving] = useState<Team | null>(null);
  const [localCard, setLocalCard] = useState<{
    card: Card;
    seq: number;
  } | null>(null);
  const [showStamp, setShowStamp] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lastOutcomeId = useRef<string | null>(null);
  const ending = useRef(false);

  const { turn, room, me, card, score } = state;
  const running = turn?.status === "running";
  const now = useNow(Boolean(running));

  const isSpeaker = turn?.speaker_id === me.id;
  const isJudge = turn?.judge_id === me.id;
  const turnTeam = (turn?.team ?? "red") as Team;

  const localAhead =
    localCard !== null && turn !== null && localCard.seq >= turn.card_seq;
  const activeCard = localAhead && localCard ? localCard.card : card;
  const activeSeq =
    localAhead && localCard ? localCard.seq : (turn?.card_seq ?? 0);

  const endsAt = turn?.ends_at ? new Date(turn.ends_at).getTime() : 0;
  const secondsLeft = running
    ? Math.max(0, Math.ceil((endsAt - now) / 1000))
    : room.turn_seconds;
  const remaining = Math.min(secondsLeft, room.turn_seconds);
  const warmingUp = running && secondsLeft > room.turn_seconds;
  const timeUp = running && secondsLeft <= 0;

  useEffect(() => {
    const last = state.results.at(-1);

    if (!last || last.id === lastOutcomeId.current) {
      return;
    }

    const firstRead = lastOutcomeId.current === null;
    lastOutcomeId.current = last.id;

    if (firstRead || last.undone) {
      return;
    }

    const isAuthor =
      last.outcome === "burn"
        ? turn?.judge_id === me.id
        : turn?.speaker_id === me.id;

    if (!isAuthor) {
      playSound(
        last.outcome === "hit"
          ? "right"
          : last.outcome === "burn"
            ? "buzz"
            : "skip",
      );
    }

    if (last.outcome === "burn") {
      const show = setTimeout(() => setShowStamp(true), 0);
      const hide = setTimeout(() => setShowStamp(false), 1300);

      return () => {
        clearTimeout(show);
        clearTimeout(hide);
      };
    }
  }, [state.results, turn?.judge_id, turn?.speaker_id, me.id]);

  useEffect(() => {
    if (!running || activeSeq <= 0) {
      return;
    }

    playSound("card");
  }, [activeSeq, running]);

  useEffect(() => {
    if (!running || warmingUp || remaining > 10 || remaining <= 0) {
      return;
    }

    playSound("tick");
  }, [remaining, running, warmingUp]);

  useEffect(() => {
    if (!timeUp) {
      return;
    }

    playSound("timeup");
  }, [timeUp]);

  useEffect(() => {
    if (!timeUp || ending.current) {
      return;
    }

    const delay = isSpeaker ? 0 : 2500;
    const timer = setTimeout(() => {
      ending.current = true;
      void api
        .endTurn(room.code, token)
        .then(onRefresh)
        .finally(() => {
          ending.current = false;
        });
    }, delay);

    return () => clearTimeout(timer);
  }, [timeUp, isSpeaker, room.code, token, onRefresh]);

  async function dispatch(run: () => Promise<unknown>) {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      setError("");
      await run();
      onRefresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : genericError);
    } finally {
      setBusy(false);
    }
  }

  async function record(outcome: Outcome) {
    if (busy) {
      return;
    }

    const target =
      outcome === "hit"
        ? turnTeam
        : outcome === "burn"
          ? rivalOf(turnTeam)
          : null;

    setLeaving(target);
    setBusy(true);
    playSound(
      outcome === "hit" ? "right" : outcome === "burn" ? "buzz" : "skip",
    );

    try {
      setError("");

      const [next] = await Promise.all([
        api.play(room.code, token, outcome),
        new Promise((resolve) => setTimeout(resolve, 190)),
      ]);

      setLocalCard(next.card ? { card: next.card, seq: next.cardSeq } : null);
      setLeaving(null);
      onRefresh();
    } catch (failure) {
      setLeaving(null);
      setError(failure instanceof Error ? failure.message : genericError);
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      setError("");
      const previous = await api.undo(room.code, token);
      setLocalCard(
        previous.card ? { card: previous.card, seq: previous.cardSeq } : null,
      );
      onRefresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : genericError);
    } finally {
      setBusy(false);
    }
  }

  if (!turn) {
    return null;
  }

  return (
    <main className="dots bg-yellow flex min-h-dvh flex-col items-center gap-3 px-4 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1rem+var(--safe-top))]">
      <Scoreboard score={score} highlight={turnTeam} />

      <div className="flex items-center gap-3">
        <div
          className={`stroke-hard hard-shadow font-display flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
            warmingUp
              ? "bg-hit text-cream"
              : remaining <= 10 && running
                ? "bg-fire text-cream"
                : "bg-cream text-ink"
          }`}
          style={
            remaining <= 10 && running && !warmingUp
              ? { animation: "shake 0.5s infinite" }
              : undefined
          }
        >
          {remaining}
        </div>
        <p className="font-display text-ink max-w-[11rem] text-sm uppercase leading-tight">
          {warmingUp
            ? "Leia a carta, o tempo ainda não começou"
            : `${nameOf(state, turn.speaker_id)} explica · juiz ${nameOf(state, turn.judge_id)}`}
        </p>
      </div>

      {turn.status === "ready" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="font-display text-ink text-center text-xl uppercase">
            {isSpeaker
              ? "A vez é sua"
              : `Aguardando ${nameOf(state, turn.speaker_id)}`}
          </p>
          {isSpeaker ? (
            <Button
              color="fire"
              disabled={busy}
              onClick={() => dispatch(() => api.startTurn(room.code, token))}
            >
              Puxar a primeira carta
            </Button>
          ) : null}
        </div>
      ) : null}

      {running ? (
        <div className="relative flex flex-1 flex-col items-center justify-center gap-4">
          {activeCard ? (
            <CardView card={activeCard} seq={activeSeq} leaving={leaving} />
          ) : (
            <div className="bg-cream stroke-hard hard-shadow-lg flex h-72 w-full max-w-xs items-center justify-center rounded-3xl px-6">
              <p className="font-display text-ink text-center text-xl uppercase leading-tight">
                {isSpeaker || isJudge
                  ? "Puxando carta"
                  : "Só quem explica e o juiz veem a carta"}
              </p>
            </div>
          )}

          {showStamp ? (
            <span
              className="font-display text-fire outline-text absolute text-6xl uppercase"
              style={{ animation: "burn-alert 1.3s ease-out forwards" }}
            >
              Não vale!
            </span>
          ) : null}
        </div>
      ) : null}

      {running ? (
        <div className="flex w-full max-w-sm flex-col gap-2">
          {isSpeaker ? (
            <div className="flex gap-2">
              <Button
                color="cream"
                disabled={busy}
                className="!bg-hit !text-cream"
                onClick={() => record("hit")}
              >
                Acertou
              </Button>
              <Button color="cream" disabled={busy} onClick={() => record("skip")}>
                Pular
              </Button>
            </div>
          ) : null}

          {isJudge ? (
            <Button
              color="fire"
              disabled={busy}
              className="!text-4xl"
              onClick={() => record("burn")}
            >
              Não vale!
            </Button>
          ) : null}

          {isSpeaker || isJudge ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void undo()}
              className="font-display bg-ink text-yellow stroke-thin rounded-xl px-4 py-2 text-base uppercase disabled:opacity-50"
            >
              Desfazer última jogada
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p
          className="bg-fire text-cream stroke-thin font-display w-full max-w-sm rounded-xl px-4 py-2 text-center text-base uppercase"
          style={{ animation: "shake 0.4s both" }}
        >
          {error}
        </p>
      ) : null}
    </main>
  );
}
