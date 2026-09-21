import { handle, readBody } from "@/app/api/_shared";
import { createRoom } from "@/lib/game/service";
import { looksLikeRobot } from "@/lib/game/testDetection";
import type { DeckMode } from "@/types/game";

interface Body {
  name?: string;
  deckMode?: DeckMode;
}

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readBody<Body>(request);

    return createRoom(
      body.name ?? "",
      body.deckMode ?? "mild",
      looksLikeRobot(request),
    );
  });
}
