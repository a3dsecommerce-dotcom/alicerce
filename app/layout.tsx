import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";

export const metadata: Metadata = {
  title: "Alicerce CRM | Gestão de Serviços",
  description: "Sistema de Gestão Operacional — Alicerce Construtora e Serviços Ltda",
  manifest: "/manifest.json",
  themeColor: "#E8621A",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Alicerce",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: 'var(--bg-base)', transition: 'background-color 0.3s, color 0.3s' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
