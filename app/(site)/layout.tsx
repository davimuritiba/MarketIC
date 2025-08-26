// app/layout.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Mail, User, Plus, Grid2X2 } from "lucide-react";
import "@/styles/globals.css"; // <- precisa existir e conter @tailwind base/components/utilities

export const metadata: Metadata = {
  title: "MarketIC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-neutral-100 text-neutral-900">
        <HeaderApp />
        <main className="mx-auto w-full max-w-screen-2xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

/** Header das páginas (exceto /login) — inspirado no seu print */
function HeaderApp() {
  return (
    <header className="w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto w-full max-w-screen-2xl px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-2">
          <div className="w-9 h-9 rounded-full bg-neutral-100 grid place-items-center overflow-hidden">
            <Image
              src="/images/marketic avatar logo.png" // ajuste o path do seu logo
              alt="MarketIC"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="font-semibold">MarketIC</span>
        </Link>

        {/* Busca */}
        <form
          action="/buscar"
          className="flex-1 max-w-3xl"
        >
          <label className="w-full">
            <div className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 h-9">
              <input
                name="q"
                placeholder="Buscar produtos, marcas e muito mais..."
                className="flex-1 outline-none text-sm bg-transparent"
              />
              {/* botão submit minimalista */}
              <button type="submit" className="text-neutral-500 text-sm">
                ⌕
              </button>
            </div>
          </label>
        </form>

        {/* Ações à direita */}
        <nav className="ml-2 flex items-center gap-4">
          <Link
            href="/meus-anuncios"
            className="hidden sm:flex items-center gap-2 text-sm hover:opacity-80"
            title="Meus anúncios"
          >
            <Grid2X2 size={18} />
            <span className="hidden md:inline">Meus Anúncios</span>
          </Link>

          <Link
            href="/anunciar/novo"
            className="flex items-center justify-center rounded-full border border-neutral-300 w-9 h-9 hover:bg-neutral-50"
            title="Novo anúncio"
          >
            <Plus size={18} />
          </Link>

          <Link
            href="/carrinho"
            className="flex items-center justify-center rounded-full border border-neutral-300 w-9 h-9 hover:bg-neutral-50"
            title="Carrinho"
          >
            <ShoppingCart size={18} />
          </Link>

          <Link
            href="/mensagens"
            className="flex items-center justify-center rounded-full border border-neutral-300 w-9 h-9 hover:bg-neutral-50"
            title="Mensagens"
          >
            <Mail size={18} />
          </Link>

          <Link
            href="/perfil"
            className="flex items-center justify-center rounded-full bg-neutral-200 w-9 h-9"
            title="Perfil"
          >
            <User size={18} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
