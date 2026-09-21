import { handle, readBody } from "@/app/api/_shared";
import { createRoom } from "@/lib/game/service";
import type { DeckMode } from "@/types/game";

interface Corpo {
  name?: string;
  deckMode?: DeckMode;
}

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readBody<Corpo>(request);

    return createRoom(body.name ?? "", body.deckMode ?? "mild");
  });
}
