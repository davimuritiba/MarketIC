// app/layout.tsx
import type { Metadata } from "next";
import { HeaderApp } from "@/components/header-app";
import { getSession } from "@/lib/auth";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "MarketIC",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const headerUser = session
    ? {
        name: session.usuario.nome,
        avatarUrl: session.usuario.foto_documento_url ?? null,
      }
    : null;

  return (
    <>
      <HeaderApp user={headerUser} />
      <main className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </>
  );
}
