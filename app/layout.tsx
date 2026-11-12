import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suporte Allegro - 5àsec",
  description: "Assistente virtual interno para operadores de caixa da 5àsec Pedro Leopoldo - Suporte ERP Allegro.NET",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full bg-slate-50 font-sans text-slate-900 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
