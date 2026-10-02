import type { Metadata, Viewport } from "next";
import "./globals.css";
import StorageMissing from "@/components/StorageMissing";
import { usingPostgres } from "@/lib/db";

export const metadata: Metadata = {
  title: { default: "Clean Limpeza CRM", template: "%s | Clean Limpeza CRM" },
  description: "CRM de agendamento e acompanhamento de visitas comerciais — Clean Limpeza.",
};

export const viewport: Viewport = {
  themeColor: "#335ea2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">{process.env.VERCEL && !usingPostgres() ? <StorageMissing /> : children}</body>
    </html>
  );
}
