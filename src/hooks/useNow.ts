"use client";

import { useEffect, useState } from "react";

export function useNow(ativo: boolean) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!ativo) {
      return;
    }

    const relogio = setInterval(() => setAgora(Date.now()), 250);

    return () => clearInterval(relogio);
  }, [ativo]);

  return agora;
}
