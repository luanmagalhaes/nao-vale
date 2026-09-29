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

export function leftMsFor(
  endsAt: string | null | undefined,
  clockOffset: number,
  now: number,
) {
  if (!endsAt) {
    return 0;
  }

  return Date.parse(endsAt) - (now + clockOffset);
}
