"use client";

import { useEffect, useState } from "react";
import { Splash } from "@/components/layout/Splash";
import { HomeScreen } from "@/components/home/HomeScreen";

type Fase = "splash" | "saindo" | "home";

export default function Page() {
  const [fase, setFase] = useState<Fase>("splash");

  useEffect(() => {
    const paraSaida = setTimeout(() => setFase("saindo"), 2100);
    const paraHome = setTimeout(() => setFase("home"), 2600);
    return () => {
      clearTimeout(paraSaida);
      clearTimeout(paraHome);
    };
  }, []);

  return (
    <>
      {fase === "home" ? null : <Splash saindo={fase === "saindo"} />}
      <HomeScreen />
    </>
  );
}
