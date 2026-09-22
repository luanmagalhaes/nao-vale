"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TeamDraw } from "@/components/room/TeamDraw";
import { api, type RoomState } from "@/lib/api/client";
import { deckSizes } from "@/data/deck";
import { copy } from "@/data/copy";
import { minPlayers, canStart, withoutTeam } from "@/lib/game/rules";
import type { DeckMode, Team } from "@/types/game";

const decks: {
  mode: DeckMode;
  name: string;
  description: string;
  total: number;
}[] = [
  {
    mode: "mild",
    name: "De boa",
    description: "Sem picante. Serve pra jogar com a família toda.",
    total: deckSizes.mild,
  },
  {
    mode: "hot",
    name: "Picante + extra",
    description: "Só carta adulta. Não jogue com a sua avó.",
    total: deckSizes.hot,
  },
  {
    mode: "mixed",
    name: "Misto",
    description: "Tudo junto. A carta picante vem sem avisar.",
    total: deckSizes.mixed,
  },
];

const teamColors: Record<Team, string> = {
  red: "bg-team-red",
  blue: "bg-team-blue",
};

export function LobbyScreen({
  state,
  token,
  onHelp,
}: {
  state: RoomState;
  token: string;
  onHelp: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const previousWithoutTeam = useRef<number | null>(null);

  const { room, players, me } = state;
  const ready = canStart(players);
  const waiting = withoutTeam(players);
  const alreadyDrawn = waiting.length === 0 && players.length > 0;

  useEffect(() => {
    const previous = previousWithoutTeam.current;
    previousWithoutTeam.current = waiting.length;

    if (previous === null || previous === 0 || waiting.length > 0) {
      return;
    }

    const open = setTimeout(() => setShowDraw(true), 0);

    return () => clearTimeout(open);
  }, [waiting.length]);

  async function run(run: () => Promise<unknown>) {
    try {
      setError("");
      await run();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Deu ruim aqui. Tente de novo.",
      );
    }
  }

  async function runDraw() {
    setDrawing(true);

    try {
      setError("");
      await api.drawTeams(room.code, token);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Deu ruim aqui. Tente de novo.",
      );
    } finally {
      setDrawing(false);
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="dots bg-yellow flex min-h-dvh flex-col items-center gap-5 px-5 pb-[calc(2rem+var(--safe-bottom))] pt-[calc(1.5rem+var(--safe-top))]">
      <button
        type="button"
        onClick={copyCode}
        className="bg-ink stroke-hard hard-shadow-lg flex w-full max-w-sm flex-col items-center rounded-3xl py-4"
        style={{ animation: "rise-in 0.4s both" }}
      >
        <span className="font-display text-yellow pb-2 text-xs uppercase tracking-[0.3em]">
          {copied ? "Copiado!" : "Código da sala"}
        </span>
        <span className="font-display text-cream pb-1 text-6xl leading-tight tracking-[0.2em]">
          {room.code}
        </span>
      </button>

      {alreadyDrawn ? (
        <section className="w-full max-w-sm">
          <h2 className="font-display text-ink mb-2 text-lg uppercase">
            Os times
          </h2>
          <div className="grid grid-cols-2 items-stretch gap-2">
            {(["red", "blue"] as const).map((team) => {
              const teamPlayers = players.filter(
                (player) => player.team === team,
              );

              return (
                <div
                  key={team}
                  className={`stroke-hard hard-shadow flex flex-col gap-2 rounded-2xl p-2 ${teamColors[team]}`}
                >
                  <div className="text-center">
                    <p className="font-display text-cream pb-1 text-xs uppercase leading-none">
                      Time {copy.teams[team]}
                    </p>
                    <p className="font-display text-cream outline-text-thin pb-1 text-3xl leading-tight">
                      {teamPlayers.length}
                    </p>
                  </div>
                  <ul className="flex flex-1 flex-col gap-1.5">
                    {teamPlayers.length === 0 ? (
                      <li className="border-cream/50 font-display text-cream/70 rounded-lg border-2 border-dashed px-2 py-1.5 text-center text-xs uppercase leading-none">
                        vazio
                      </li>
                    ) : (
                      teamPlayers.map((player) => (
                        <li
                          key={player.id}
                          className="bg-cream stroke-thin font-display rounded-lg px-2 py-1.5 text-center text-sm uppercase leading-none"
                        >
                          {player.name}
                          {player.is_host ? " ★" : ""}
                        </li>
                      ))
                    )}
                  </ul>
                  {me.team === team ? null : (
                    <button
                      type="button"
                      onClick={() =>
                        run(() => api.changeTeam(room.code, token, team))
                      }
                      className="font-display bg-cream text-ink stroke-thin mt-auto rounded-lg px-2 py-1 text-xs uppercase"
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
          <h2 className="font-display text-ink mb-2 text-lg uppercase">
            Na mesa ({players.length})
          </h2>
          <div className="bg-cream stroke-hard hard-shadow rounded-2xl p-3">
            <ul className="flex flex-wrap justify-center gap-1.5">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="bg-yellow stroke-thin font-display rounded-lg px-2 py-1 text-sm uppercase"
                  style={{ animation: "rise-in 0.35s both" }}
                >
                  {player.name}
                  {player.is_host ? " ★" : ""}
                </li>
              ))}
            </ul>
            <p className="font-display text-ink mt-3 text-center text-xs uppercase opacity-70">
              Ninguém tem time ainda. O sorteio decide.
            </p>
          </div>
        </section>
      )}

      <section className="w-full max-w-sm">
        <h2 className="font-display text-ink mb-2 text-lg uppercase">
          Baralho
        </h2>
        <div className="flex flex-col gap-2">
          {decks.map((deck) => {
            const active = room.deck_mode === deck.mode;

            return (
              <button
                key={deck.mode}
                type="button"
                disabled={!me.is_host}
                onClick={() =>
                  run(() => api.changeDeck(room.code, token, deck.mode))
                }
                className={`stroke-hard hard-shadow rounded-2xl px-3 py-2 text-left disabled:opacity-60 ${
                  active ? "bg-fire text-cream" : "bg-cream text-ink"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg uppercase">
                    {deck.name}
                  </span>
                  <span className="font-display text-xs uppercase opacity-80">
                    {deck.total} cartas
                  </span>
                </div>
                <p className="text-xs font-bold opacity-90">
                  {deck.description}
                </p>
              </button>
            );
          })}
        </div>
        {me.is_host ? null : (
          <p className="font-display text-ink mt-2 text-center text-xs uppercase opacity-70">
            Só quem criou a room escolhe o deck
          </p>
        )}
      </section>

      <div className="flex w-full max-w-sm flex-col gap-2">
        {me.is_host ? (
          <>
            <Button
              color="ink"
              disabled={drawing || players.length < minPlayers}
              onClick={runDraw}
            >
              {drawing
                ? "Sorteando..."
                : alreadyDrawn
                  ? "Sortear de novo"
                  : "Sortear times"}
            </Button>
            <Button
              color="fire"
              disabled={!ready}
              onClick={() => run(() => api.startGame(room.code, token))}
            >
              Começar o jogo
            </Button>
          </>
        ) : (
          <p className="font-display bg-cream stroke-hard hard-shadow rounded-2xl px-4 py-3 text-center text-lg uppercase">
            {alreadyDrawn
              ? "Esperando o dono da sala começar"
              : "Esperando o sorteio dos times"}
          </p>
        )}

        <Button color="sky" onClick={onHelp}>
          Como se joga
        </Button>

        {players.length < minPlayers ? (
          <p className="font-display text-ink text-center text-xs uppercase opacity-80">
            Precisa de {minPlayers} pessoas na mesa pra runDraw
          </p>
        ) : null}

        {error ? (
          <p
            className="bg-fire text-cream stroke-thin font-display rounded-xl px-4 py-2 text-center text-base uppercase"
            style={{ animation: "shake 0.4s both" }}
          >
            {error}
          </p>
        ) : null}
      </div>

      {showDraw ? (
        <TeamDraw
          players={players}
          onClose={() => setShowDraw(false)}
        />
      ) : null}
    </main>
  );
}
