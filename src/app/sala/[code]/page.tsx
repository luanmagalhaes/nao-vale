"use client";

import { useParams } from "next/navigation";
import { RoomApp } from "@/components/room/RoomApp";

export default function Page() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();

  return <RoomApp code={code} />;
}
