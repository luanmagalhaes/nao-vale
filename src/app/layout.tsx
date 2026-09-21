import type { Metadata, Viewport } from "next";
import { Luckiest_Guy, Nunito } from "next/font/google";
import "./globals.css";

const cartoon = Luckiest_Guy({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-cartoon",
  display: "swap",
});

const body = Nunito({
  weight: ["400", "700", "900"],
  subsets: ["latin"],
  variable: "--font-corpo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Não Vale",
  description: "Faça seu team adivinhar a palavra sem escorregar nas proibidas.",
  applicationName: "Não Vale",
  appleWebApp: {
    capable: true,
    title: "Não Vale",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffc316",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${cartoon.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
