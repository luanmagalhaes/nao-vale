import {
  handle,
  playerByToken,
  readBody,
  roomByCode,
} from "@/app/api/_shared";
import { ServiceError, messageFor } from "@/lib/messages";
import {
  restartMatch,
  setDeck,
  setTeam,
  shuffleTeams,
  startGame,
} from "@/lib/game/service";
import type { DeckMode, Team } from "@/types/game";

interface Body {
  code?: string;
  token?: string;
  action?: "team" | "deck" | "draw" | "start" | "restart";
  team?: Team;
  deckMode?: DeckMode;
}

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readBody<Body>(request);

    if (!body.code || !body.token || !body.action) {
      throw new ServiceError(400, messageFor(400));
    }

    const room = await roomByCode(body.code);
    const me = await playerByToken(room.id, body.token);

    if (body.action === "team" && body.team) {
      await setTeam(room, me, body.team);
      return { ok: true };
    }

    if (body.action === "deck" && body.deckMode) {
      await setDeck(room, me, body.deckMode);
      return { ok: true };
    }

    if (body.action === "draw") {
      await shuffleTeams(room, me);
      return { ok: true };
    }

    if (body.action === "start") {
      await startGame(room, me);
      return { ok: true };
    }

    if (body.action === "restart") {
      await restartMatch(room, me);
      return { ok: true };
    }

    throw new ServiceError(400, messageFor(400));
  });
}
