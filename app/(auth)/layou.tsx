// app/layout.tsx  (ROOT)
import "@/styles/globals.css"; // <- precisa existir e conter @tailwind base/components/utilities
import type { Metadata } from "next";

export const metadata: Metadata = { title: "MarketIC" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-neutral-100 text-neutral-900">{children}</body>
    </html>
  );
}
