import { NextResponse } from "next/server";
import { ServiceError, messageFor } from "@/lib/messages";
import { serverClient } from "@/lib/supabase/server";
import type { PlayerRow, RoomRow, TurnRow } from "@/types/game";

export async function handle<T>(run: () => Promise<T>): Promise<NextResponse> {
  try {
    const outcomeCall = await run();

    return NextResponse.json(outcomeCall ?? { ok: true });
  } catch (error) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json({ error: messageFor(500) }, { status: 500 });
  }
}

export function demand<T>(valor: T | null | undefined, status: number): T {
  if (valor === null || valor === undefined) {
    throw new ServiceError(status, messageFor(status));
  }

  return valor;
}

export async function readBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ServiceError(400, messageFor(400));
  }
}

export async function roomByCode(code: string): Promise<RoomRow> {
  const { data } = await serverClient()
    .from("nv_rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  return demand(data as RoomRow | null, 404);
}

export async function playerByToken(
  roomId: string,
  token: string,
): Promise<PlayerRow> {
  const { data } = await serverClient()
    .from("nv_player_secrets")
    .select("player_id, nv_players!inner(*)")
    .eq("secret", token)
    .eq("nv_players.room_id", roomId)
    .maybeSingle();

  const row = data as { nv_players: PlayerRow } | null;

  return demand(row?.nv_players ?? null, 401);
}

export async function roomPlayers(roomId: string): Promise<PlayerRow[]> {
  const { data } = await serverClient()
    .from("nv_players")
    .select("*")
    .eq("room_id", roomId)
    .order("seat", { ascending: true });

  return (data as PlayerRow[] | null) ?? [];
}

export async function activeTurn(room: RoomRow): Promise<TurnRow | null> {
  if (!room.current_turn_id) {
    return null;
  }

  const { data } = await serverClient()
    .from("nv_turns")
    .select("*")
    .eq("id", room.current_turn_id)
    .maybeSingle();

  return (data as TurnRow | null) ?? null;
}
