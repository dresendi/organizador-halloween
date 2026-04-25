import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Halloween Alzare 2026",
  description: "Croquis, noticias y reglas del Halloween Alzare 2026."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
