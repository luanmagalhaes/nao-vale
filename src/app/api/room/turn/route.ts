import { handle, lerCorpo, salaPorCodigo } from "@/app/api/_shared";
import { ServiceError, mensagemPara } from "@/lib/messages";
import {
  desfazerJogada,
  encerrarTurno,
  iniciarTurno,
  jogarCarta,
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

    if (corpo.action === "comecar") {
      return iniciarTurno(corpo.code, corpo.token);
    }

    if (corpo.action === "resultado" && corpo.outcome) {
      return jogarCarta(corpo.code, corpo.token, corpo.outcome);
    }

    if (corpo.action === "desfazer") {
      return desfazerJogada(corpo.code, corpo.token);
    }

    if (corpo.action === "encerrar") {
      const sala = await salaPorCodigo(corpo.code);

      await encerrarTurno(sala);

      return { ok: true };
    }

    throw new ServiceError(400, mensagemPara(400));
  });
}
