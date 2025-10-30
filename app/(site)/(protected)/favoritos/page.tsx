"use client";

import { useEffect, useState } from "react";
import AdCard from "@/components/AdCard";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type AdItem = React.ComponentProps<typeof AdCard>["item"];

interface FavoritesResponse {
  favorites?: AdItem[];
  error?: string;
}

export default function FavoritasPage() {
  const [items, setItems] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFavorites = async () => {
      try {
        setError(null);

        const response = await fetch("/api/favorites", {
          method: "GET",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sessão inválida ou expirada. Faça login novamente.");
          }

          const payload = (await response.json().catch(() => null)) as
            | FavoritesResponse
            | null;
          throw new Error(payload?.error ?? "Não foi possível carregar os favoritos.");
        }

        const payload = (await response.json()) as FavoritesResponse;
        if (!isMounted) {
          return;
        }

        setItems(payload.favorites ?? []);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        console.error("Erro ao carregar favoritos", err);
        setError(err instanceof Error ? err.message : "Erro inesperado ao carregar favoritos.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFavorites();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemove = async (id: string) => {
    setActionError(null);
    setRemovingId(id);

    try {
      const response = await fetch(`/api/items/${id}/favorite`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sessão inválida ou expirada. Faça login novamente.");
        }

        const payload = (await response.json().catch(() => null)) as
          | FavoritesResponse
          | null;
        throw new Error(payload?.error ?? "Não foi possível remover o favorito.");
      }

      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Erro ao remover favorito", err);
      setActionError(err instanceof Error ? err.message : "Erro inesperado ao remover favorito.");
    } finally {
      setRemovingId(null);
    }
  };

  const hasItems = items.length > 0;

  return (
    <div className="max-w-screen-lg w-full px-4 md:px-8 mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Favoritos</h1>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">
          Carregando favoritos...
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-20">{error}</div>
      ) : hasItems ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <AdCard item={item} />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 w-6 h-6 p-0"
                onClick={() => handleRemove(item.id)}
                disabled={removingId === item.id}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-20">
          Você ainda não possui favoritos.
        </div>
      )}

      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}
    </div>
  );
}