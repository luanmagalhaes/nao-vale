import { handle, lerCorpo } from "@/app/api/_shared";
import { entrarNaSala } from "@/lib/game/service";

interface Corpo {
  code?: string;
  name?: string;
}

export async function POST(request: Request) {
  return handle(async () => {
    const corpo = await lerCorpo<Corpo>(request);

    return entrarNaSala(corpo.code ?? "", corpo.name ?? "");
  });
}
