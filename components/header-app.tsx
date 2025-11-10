"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Grid2X2, Heart, Mail, Plus, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";

type HeaderUser = {
  name: string | null;
  avatarUrl: string | null;
};

type HeaderAppProps = {
  user?: HeaderUser | null;
};

export function HeaderApp({ user }: HeaderAppProps) {
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false); 
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleCloseDropdown = useCallback(() => {
    const details = detailsRef.current;
    if (details) {
      details.removeAttribute("open");
    }
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      document.cookie = "session_token=; Max-Age=0; path=/";
    } catch (error) {
      console.error("Erro ao encerrar sessão", error);
    } finally {
      setIsLogoutModalOpen(false);
      handleCloseDropdown();
      router.push("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  }, [handleCloseDropdown, isLoggingOut, router]);

  const handleOpenLogoutModal = useCallback(() => {
    handleCloseDropdown();
    setIsLogoutModalOpen(true);
  }, [handleCloseDropdown]);

  const handleCloseLogoutModal = useCallback(() => {
    if (isLoggingOut) return;
    setIsLogoutModalOpen(false);
  }, [isLoggingOut]);

  const initials = user?.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto w-full max-w-screen-2xl px-4 h-auto min-h-14 flex flex-wrap items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-2">
          <div className="w-9 h-9 rounded-full bg-neutral-100 grid place-items-center overflow-hidden">
            <Image
              src="/images/marketic avatar logo.png"
              alt="MarketIC"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="font-semibold">MarketIC</span>
        </Link>

        {/* Busca */}
        <form action="/buscar" className="order-last w-full md:order-none md:flex-1 md:max-w-3xl">
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
            href="/favoritos"
            className="flex items-center justify-center rounded-full border border-neutral-300 w-9 h-9 hover:bg-neutral-50"
            title="Favoritos"
          >
            <Heart size={18} />
          </Link>

          <Link
            href="/mensagens"
            className="flex items-center justify-center rounded-full border border-neutral-300 w-9 h-9 hover:bg-neutral-50"
            title="Mensagens"
          >
            <Mail size={18} />
          </Link>

          <details ref={detailsRef} className="relative z-10">
            <summary
              className="flex items-center justify-center rounded-full bg-neutral-200 w-9 h-9 cursor-pointer overflow-hidden [&::-webkit-details-marker]:hidden"
              title="Perfil"
              aria-haspopup="menu"
            >
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name ?? "Perfil"}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-300 text-xs font-semibold uppercase text-neutral-700">
                  {initials || "US"}
                </span>
              )}
            </summary>
            <div className="absolute right-0 mt-2 w-40 rounded-md border border-neutral-200 bg-white shadow-md flex flex-col">
              <Link
                href="/perfil"
                className="px-4 py-2 text-sm hover:bg-neutral-100"
                onClick={handleCloseDropdown}
                role="menuitem"
              >
                Meu perfil
              </Link>
              <Link
                href="/meus-anuncios"
                className="px-4 py-2 text-sm hover:bg-neutral-100"
                onClick={handleCloseDropdown}
                role="menuitem"
              >
                Meus Anúncios
              </Link>
              <Link
                href="/carrinho"
                className="px-4 py-2 text-sm hover:bg-neutral-100"
                onClick={handleCloseDropdown}
                role="menuitem"
              >
                Meu carrinho
              </Link>
              <Link
                href="/mensagens"
                className="px-4 py-2 text-sm hover:bg-neutral-100"
                onClick={handleCloseDropdown}
                role="menuitem"
              >
                Mensagens
              </Link>
              <button
                type="button"
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer text-left"
                onClick={handleOpenLogoutModal}
                role="menuitem"
              >
                Sair da conta
              </button>
            </div>
          </details>
        </nav>
        <Dialog
          open={isLogoutModalOpen}
          onOpenChange={(open) => {
            if (isLoggingOut) return;
            setIsLogoutModalOpen(open);
          }}
        >
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Encerrar sessão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja encerrar sua sessão?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                onClick={handleCloseLogoutModal}
                disabled={isLoggingOut}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                Encerrar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
