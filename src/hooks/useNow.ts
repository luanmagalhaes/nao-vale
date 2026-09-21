"use client";

import { useEffect, useState } from "react";

export function useNow(active: boolean) {
  const [now, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return;
    }

    const timer = setInterval(() => setAgora(Date.now()), 250);

    return () => clearInterval(timer);
  }, [active]);

  return now;
}
