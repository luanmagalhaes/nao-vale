import { handle, playerByToken, roomByCode } from "@/app/api/_shared";
import { ServiceError, messageFor } from "@/lib/messages";
import { roomState } from "@/lib/game/service";

export async function GET(request: Request) {
  return handle(async () => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const token = url.searchParams.get("token");

    if (!code || !token) {
      throw new ServiceError(400, messageFor(400));
    }

    const room = await roomByCode(code);
    const eu = await playerByToken(room.id, token);

    return roomState(room, eu);
  });
}
