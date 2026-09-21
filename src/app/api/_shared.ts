import { NextResponse } from "next/server";
import { ServiceError, mensagemPara } from "@/lib/messages";
import { serverClient } from "@/lib/supabase/server";
import type { PlayerRow, RoomRow, TurnRow } from "@/types/game";

export async function handle<T>(acao: () => Promise<T>): Promise<NextResponse> {
  try {
    const resultado = await acao();

    return NextResponse.json(resultado ?? { ok: true });
  } catch (erro) {
    if (erro instanceof ServiceError) {
      return NextResponse.json(
        { error: erro.message },
        { status: erro.status },
      );
    }

    return NextResponse.json({ error: mensagemPara(500) }, { status: 500 });
  }
}

export function exigir<T>(valor: T | null | undefined, status: number): T {
  if (valor === null || valor === undefined) {
    throw new ServiceError(status, mensagemPara(status));
  }

  return valor;
}

export async function lerCorpo<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ServiceError(400, mensagemPara(400));
  }
}

export async function salaPorCodigo(code: string): Promise<RoomRow> {
  const { data } = await serverClient()
    .from("nv_rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  return exigir(data as RoomRow | null, 404);
}

export async function jogadorPorToken(
  roomId: string,
  token: string,
): Promise<PlayerRow> {
  const { data } = await serverClient()
    .from("nv_player_secrets")
    .select("player_id, nv_players!inner(*)")
    .eq("secret", token)
    .eq("nv_players.room_id", roomId)
    .maybeSingle();

  const linha = data as { nv_players: PlayerRow } | null;

  return exigir(linha?.nv_players ?? null, 401);
}

export async function jogadoresDaSala(roomId: string): Promise<PlayerRow[]> {
  const { data } = await serverClient()
    .from("nv_players")
    .select("*")
    .eq("room_id", roomId)
    .order("seat", { ascending: true });

  return (data as PlayerRow[] | null) ?? [];
}

export async function turnoAtual(sala: RoomRow): Promise<TurnRow | null> {
  if (!sala.current_turn_id) {
    return null;
  }

  const { data } = await serverClient()
    .from("nv_turns")
    .select("*")
    .eq("id", sala.current_turn_id)
    .maybeSingle();

  return (data as TurnRow | null) ?? null;
}
