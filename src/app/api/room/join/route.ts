import { handle, readBody } from "@/app/api/_shared";
import { joinRoom } from "@/lib/game/service";

interface Corpo {
  code?: string;
  name?: string;
}

export async function POST(request: Request) {
  return handle(async () => {
    const body = await readBody<Corpo>(request);

    return joinRoom(body.code ?? "", body.name ?? "");
  });
}
