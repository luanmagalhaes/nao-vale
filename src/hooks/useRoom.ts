"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type RoomState } from "@/lib/api/client";
import { browserClient } from "@/lib/supabase/browser";

const fallbackIntervalMs = 3000;

export function useRoom(code: string | null, token: string | null) {
  const [state, setEstado] = useState<RoomState | null>(null);
  const [error, setErro] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!code || !token) {
      return;
    }

    try {
      const proximo = await api.state(code, token);
      roomIdRef.current = proximo.room.id;
      setEstado(proximo);
      setErro(null);
    } catch (failure) {
      setErro(
        failure instanceof Error ? failure.message : "Deu ruim aqui. Tente de novo.",
      );
    }
  }, [code, token]);

  useEffect(() => {
    const firstLoad = setTimeout(() => void refresh(), 0);

    const timer = setInterval(() => {
      void refresh();
    }, fallbackIntervalMs);

    return () => {
      clearTimeout(firstLoad);
      clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    const roomId = state?.room.id;

    if (!roomId) {
      return;
    }

    const client = browserClient();
    const channel = client
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nv_rooms",
          filter: `id=eq.${roomId}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nv_players",
          filter: `room_id=eq.${roomId}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nv_turns",
          filter: `room_id=eq.${roomId}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nv_results",
          filter: `room_id=eq.${roomId}`,
        },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [state?.room.id, refresh]);

  return { state, error, loading: state === null && error === null, refresh };
}
