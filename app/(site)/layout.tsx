// app/layout.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Mail, User, Plus, Grid2X2 } from "lucide-react";
import "@/styles/globals.css"; 

export const metadata: Metadata = {
  title: "MarketIC",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderApp />
      <main className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </>
  );
}

function HeaderApp() {
  return (
    <header className="w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto w-full max-w-screen-2xl px-4 h-auto min-h-14 flex flex-wrap items-center gap-3">
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
          className="order-last w-full md:order-none md:flex-1 md:max-w-3xl"
        >
          <label className="w-full">
            <div className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 h-9">
              <input
                name="q"
                placeholder="Buscar produtos, marcas e muito mais..."
                className="flex-1 outline-none text-sm bg-transparent"
              />
              <button type="submit" className="text-neutral-500 text-sm">
                ⌕
              </button>
            </div>
          </label>
        </form>

        {/* Ações à direita */}
        <nav className="ml-auto flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <Link
            href="/meus-anuncios"
            className="flex items-center gap-2 text-sm hover:opacity-80"
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

          <details className="relative">
            <summary className="flex items-center justify-center rounded-full bg-neutral-200 w-9 h-9 cursor-pointer [&::-webkit-details-marker]:hidden" title="Perfil">
              <User size={18} />
            </summary>
            <div className="absolute right-0 mt-2 w-40 rounded-md border border-neutral-200 bg-white shadow-md flex flex-col">
              <Link
                href="/perfil"
                className="px-4 py-2 text-sm hover:bg-neutral-100"
              >
                Meu perfil
              </Link>
              <Link
                href="/meus-anuncios"
                className="px-4 py-2 text-sm hover:bg-neutral-100"
              >
                Meus Anúncios
              </Link>
              <Link
                href="/carrinho"
                className="px-4 py-2 text-sm hover:bg-neutral-100"
              >
                Meu carrinho
              </Link>
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}