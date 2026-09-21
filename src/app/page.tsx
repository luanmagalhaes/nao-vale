"use client";

import { useEffect, useState } from "react";
import { Splash } from "@/components/layout/Splash";
import { HomeScreen } from "@/components/home/HomeScreen";

type Fase = "splash" | "leaving" | "home";

export default function Page() {
  const [phase, setFase] = useState<Fase>("splash");

  useEffect(() => {
    const paraSaida = setTimeout(() => setFase("leaving"), 2100);
    const paraHome = setTimeout(() => setFase("home"), 2600);
    return () => {
      clearTimeout(paraSaida);
      clearTimeout(paraHome);
    };
  }, []);

  return (
    <>
      {phase === "home" ? null : <Splash leaving={phase === "leaving"} />}
      <HomeScreen />
    </>
  );
}
