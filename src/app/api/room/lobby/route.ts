import {
  handle,
  jogadorPorToken,
  lerCorpo,
  salaPorCodigo,
} from "@/app/api/_shared";
import { ServiceError, mensagemPara } from "@/lib/messages";
import {
  comecarJogo,
  definirBaralho,
  definirTime,
  distribuirTimesAutomatico,
  reiniciarPartida,
} from "@/lib/game/service";
import type { DeckMode, Team } from "@/types/game";

interface Corpo {
  code?: string;
  token?: string;
  action?: "time" | "baralho" | "comecar" | "sortear" | "reiniciar";
  team?: Team;
  deckMode?: DeckMode;
}

export async function POST(request: Request) {
  return handle(async () => {
    const corpo = await lerCorpo<Corpo>(request);

    if (!corpo.code || !corpo.token || !corpo.action) {
      throw new ServiceError(400, mensagemPara(400));
    }

    const sala = await salaPorCodigo(corpo.code);
    const eu = await jogadorPorToken(sala.id, corpo.token);

    if (corpo.action === "time" && corpo.team) {
      await definirTime(sala, eu, corpo.team);
      return { ok: true };
    }

    if (corpo.action === "baralho" && corpo.deckMode) {
      await definirBaralho(sala, eu, corpo.deckMode);
      return { ok: true };
    }

    if (corpo.action === "sortear") {
      await distribuirTimesAutomatico(sala, eu);
      return { ok: true };
    }

    if (corpo.action === "comecar") {
      await comecarJogo(sala, eu);
      return { ok: true };
    }

    if (corpo.action === "reiniciar") {
      await reiniciarPartida(sala, eu);
      return { ok: true };
    }

    throw new ServiceError(400, mensagemPara(400));
  });
}
