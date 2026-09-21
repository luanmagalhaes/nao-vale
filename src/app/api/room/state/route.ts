import { handle, jogadorPorToken, salaPorCodigo } from "@/app/api/_shared";
import { ServiceError, mensagemPara } from "@/lib/messages";
import { estadoDaSala } from "@/lib/game/service";

export async function GET(request: Request) {
  return handle(async () => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const token = url.searchParams.get("token");

    if (!code || !token) {
      throw new ServiceError(400, mensagemPara(400));
    }

    const sala = await salaPorCodigo(code);
    const eu = await jogadorPorToken(sala.id, token);

    return estadoDaSala(sala, eu);
  });
}
