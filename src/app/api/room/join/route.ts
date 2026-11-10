import { handle, readBody } from "@/app/api/_shared";
import { closeStaleMatches } from "@/lib/game/service";
import { joinRoom } from "@/lib/game/service";

interface Corpo {
  code?: string;
  name?: string;
}

export async function POST(request: Request) {
  return handle(async () => {
    await closeStaleMatches();

    const body = await readBody<Corpo>(request);

    return joinRoom(body.code ?? "", body.name ?? "");
  });
}
