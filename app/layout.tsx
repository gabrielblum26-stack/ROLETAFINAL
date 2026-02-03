import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "./state/AuthProvider";

export const metadata: Metadata = {
  title: "Roleta — Análise ao Vivo",
  description: "Webapp de análise visual para roleta europeia (sem apostas).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
