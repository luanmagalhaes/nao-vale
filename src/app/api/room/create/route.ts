import { handle, lerCorpo } from "@/app/api/_shared";
import { criarSala } from "@/lib/game/service";
import type { DeckMode } from "@/types/game";

interface Corpo {
  name?: string;
  deckMode?: DeckMode;
}

export async function POST(request: Request) {
  return handle(async () => {
    const corpo = await lerCorpo<Corpo>(request);

    return criarSala(corpo.name ?? "", corpo.deckMode ?? "suave");
  });
}
