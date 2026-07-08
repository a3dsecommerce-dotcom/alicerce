import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#E8621A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://portal.alicerce.cloud"),
  title: "Alicerce Portal | Gestão Operacional de Serviços Terceirizados — Guarapari ES",
  description: "Portal de gestão operacional da Alicerce Construtora e Serviços Ltda. Sistema integrado de RH, controle de ponto, escalas, informativos, chat corporativo e muito mais. Acesso exclusivo para colaboradores.",
  keywords: ["Alicerce", "portal alicerce", "gestão operacional", "serviços terceirizados", "Guarapari", "RH", "controle de ponto", "CRM", "portal colaborador"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Alicerce",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://portal.alicerce.cloud",
    siteName: "Alicerce Portal",
    title: "Alicerce Portal | Gestão Operacional",
    description: "Portal de gestão integrada da Alicerce — RH, ponto, escalas, chat e mais. Acesso para colaboradores.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Alicerce Logo" }],
  },
  twitter: {
    card: "summary",
    title: "Alicerce Portal | Gestão Operacional",
    description: "Portal de gestão integrada da Alicerce — RH, ponto, escalas, chat e mais.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "https://portal.alicerce.cloud",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body style={{ margin: 0, background: 'var(--bg-base)', transition: 'background-color 0.3s, color 0.3s' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
