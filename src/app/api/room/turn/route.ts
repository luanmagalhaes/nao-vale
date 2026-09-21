import { handle, readBody, roomByCode } from "@/app/api/_shared";
import { ServiceError, messageFor } from "@/lib/messages";
import { endTurn, playCard, startTurn, undoPlay } from "@/lib/game/service";
import type { Outcome } from "@/types/game";

interface Body {
  code?: string;
  token?: string;
  action?: "start" | "play" | "undo" | "end";
  outcome?: Outcome;
}

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readBody<Body>(request);

    if (!body.code || !body.token || !body.action) {
      throw new ServiceError(400, messageFor(400));
    }

    if (body.action === "start") {
      return startTurn(body.code, body.token);
    }

    if (body.action === "play" && body.outcome) {
      return playCard(body.code, body.token, body.outcome);
    }

    if (body.action === "undo") {
      return undoPlay(body.code, body.token);
    }

    if (body.action === "end") {
      const room = await roomByCode(body.code);

      await endTurn(room);

      return { ok: true };
    }

    throw new ServiceError(400, messageFor(400));
  });
}
