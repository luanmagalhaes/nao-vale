"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type EstadoDaSala } from "@/lib/api/client";
import { browserClient } from "@/lib/supabase/browser";

const intervaloDeSeguranca = 3000;

export function useRoom(code: string | null, token: string | null) {
  const [estado, setEstado] = useState<EstadoDaSala | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);

  const atualizar = useCallback(async () => {
    if (!code || !token) {
      return;
    }

    try {
      const proximo = await api.estado(code, token);
      roomIdRef.current = proximo.room.id;
      setEstado(proximo);
      setErro(null);
    } catch (falha) {
      setErro(
        falha instanceof Error ? falha.message : "Deu ruim aqui. Tente de novo.",
      );
    }
  }, [code, token]);

  useEffect(() => {
    const imediato = setTimeout(() => void atualizar(), 0);

    const relogio = setInterval(() => {
      void atualizar();
    }, intervaloDeSeguranca);

    return () => {
      clearTimeout(imediato);
      clearInterval(relogio);
    };
  }, [atualizar]);

  useEffect(() => {
    const roomId = estado?.room.id;

    if (!roomId) {
      return;
    }

    const cliente = browserClient();
    const canal = cliente
      .channel(`sala-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nv_rooms",
          filter: `id=eq.${roomId}`,
        },
        () => void atualizar(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nv_players",
          filter: `room_id=eq.${roomId}`,
        },
        () => void atualizar(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nv_turns",
          filter: `room_id=eq.${roomId}`,
        },
        () => void atualizar(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "nv_results",
          filter: `room_id=eq.${roomId}`,
        },
        () => void atualizar(),
      )
      .subscribe();

    return () => {
      void cliente.removeChannel(canal);
    };
  }, [estado?.room.id, atualizar]);

  return { estado, erro, carregando: estado === null && erro === null, atualizar };
}
