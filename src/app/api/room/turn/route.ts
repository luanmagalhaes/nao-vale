import {
  handle,
  jogadorPorToken,
  lerCorpo,
  salaPorCodigo,
} from "@/app/api/_shared";
import { ServiceError, mensagemPara } from "@/lib/messages";
import {
  comecarTurno,
  desfazerUltima,
  encerrarTurno,
  registrarResultado,
} from "@/lib/game/service";
import type { Outcome } from "@/types/game";

interface Corpo {
  code?: string;
  token?: string;
  action?: "comecar" | "resultado" | "desfazer" | "encerrar";
  outcome?: Outcome;
}

export async function POST(request: Request) {
  return handle(async () => {
    const corpo = await lerCorpo<Corpo>(request);

    if (!corpo.code || !corpo.token || !corpo.action) {
      throw new ServiceError(400, mensagemPara(400));
    }

    const sala = await salaPorCodigo(corpo.code);
    const eu = await jogadorPorToken(sala.id, corpo.token);

    if (corpo.action === "comecar") {
      await comecarTurno(sala, eu);
      return { ok: true };
    }

    if (corpo.action === "resultado" && corpo.outcome) {
      await registrarResultado(sala, eu, corpo.outcome);
      return { ok: true };
    }

    if (corpo.action === "desfazer") {
      await desfazerUltima(sala, eu);
      return { ok: true };
    }

    if (corpo.action === "encerrar") {
      await encerrarTurno(sala);
      return { ok: true };
    }

    throw new ServiceError(400, mensagemPara(400));
  });
}
