import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Não Vale",
    short_name: "Não Vale",
    description:
      "Faça seu team adivinhar a palavra sem escorregar nas proibidas.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffc316",
    theme_color: "#ffc316",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
