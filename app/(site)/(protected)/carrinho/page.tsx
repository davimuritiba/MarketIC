"use client";

import { useEffect, useState, type ElementType } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, ShoppingBag, Repeat2, Gift, Star, Plus, Minus, } from "lucide-react";

interface Item {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "Venda" | "Empréstimo" | "Doação";
  estado: "Novo" | "Seminovo" | "Usado";
  preco?: string;
  dias?: number;
  interested?: boolean;
  quantidade: number;
  quantidadeDisponivel: number;
  rating?: number;
  reviews?: number;
  imagem?: string;
}

const typeConfig: Record<Item["tipo"], { icon: ElementType; color: string }> = {
  Venda: { icon: ShoppingBag, color: "#EC221F" },
  "Empréstimo": { icon: Repeat2, color: "#0A5C0A" },
  Doação: { icon: Gift, color: "#0B0B64" },
};

function QuantitySelect({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}) {
  const maxValue = max ?? Number.POSITIVE_INFINITY;
  const canIncrement = value < maxValue;

  return (
    <div className="flex w-full sm:w-auto items-center border rounded-md">
      <Button
        variant="ghost"
        size="icon"
        className="text-blue-600 hover:text-blue-700 flex-shrink-0"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus className="w-4 h-4" />
      </Button>
      <Input
        data-testid="quantity-input"
        type="number"
        value={value}
        min={1}
        max={Number.isFinite(maxValue) ? maxValue : undefined}
        onChange={(e) => {
          const nextValue = Number(e.target.value);
          if (!Number.isFinite(nextValue)) {
            onChange(1);
            return;
          }

          onChange(Math.min(maxValue, Math.max(1, nextValue)));
        }}
        className="flex-1 w-full sm:w-12 text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <Button
        variant="ghost"
        size="icon"
        className="text-blue-600 hover:text-blue-700 flex-shrink-0"
        onClick={() => onChange(Math.min(maxValue, value + 1))}
        disabled={!canIncrement}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function CarrinhoPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [interestLoadingId, setInterestLoadingId] = useState<string | null>(null);
  const [isBulkInterestLoading, setIsBulkInterestLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCart = async () => {
      try {
        setError(null);

        const response = await fetch("/api/cart", {
          method: "GET",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sessão inválida ou expirada. Faça login novamente.");
          }

          const payload = await response.json().catch(() => null);
          const message = payload?.error ?? "Não foi possível carregar o carrinho.";
          throw new Error(message);
        }

        const payload = (await response.json().catch(() => null)) as
          | { items?: Item[] }
          | null;

        if (!isMounted) {
          return;
        }

        setItems(payload?.items ?? []);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        console.error("Erro ao carregar carrinho", err);
        setError(
          err instanceof Error ? err.message : "Erro inesperado ao carregar o carrinho.",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCart();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemove = async (id: string) => {
    setActionError(null);
    setRemovingId(id);

    try {
      const response = await fetch(`/api/items/${id}/cart`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sessão inválida ou expirada. Faça login novamente.");
        }

        const payload = await response.json().catch(() => null);
        const message = payload?.error ?? "Não foi possível remover o item do carrinho.";
        throw new Error(message);
      }

      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Erro ao remover item do carrinho", err);
      setActionError(
        err instanceof Error ? err.message : "Erro inesperado ao remover item do carrinho.",
      );
    } finally {
      setRemovingId(null);
    }
  };

  const handleInterest = async (id: string) => {
    const currentItem = items.find((item) => item.id === id);

    if (!currentItem || currentItem.interested) {
      return;
    }

    setActionError(null);
    setInterestLoadingId(id);

    try {
      const response = await fetch(`/api/items/${id}/interest`, {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sessão inválida ou expirada. Faça login novamente.");
        }

        const payload = await response.json().catch(() => null);
        const message =
          payload?.error ?? "Não foi possível demonstrar interesse neste item.";
        throw new Error(message);
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, interested: true } : item,
        ),
      );
    } catch (err) {
      console.error("Erro ao demonstrar interesse", err);
      setActionError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao demonstrar interesse.",
      );
    } finally {
      setInterestLoadingId(null);
    }
  };

  const handleInterestAll = async () => {
    const targets = items.filter((item) => !item.interested);

    if (targets.length === 0) {
      return;
    }

    setActionError(null);
    setInterestLoadingId(null);
    setIsBulkInterestLoading(true);

    const successIds: string[] = [];

    try {
      for (const target of targets) {
        const response = await fetch(`/api/items/${target.id}/interest`, {
          method: "POST",
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Sessão inválida ou expirada. Faça login novamente.",
            );
          }

          const payload = await response.json().catch(() => null);
          const message =
            payload?.error ??
            "Não foi possível demonstrar interesse em todos os itens.";
          throw new Error(message);
        }

        successIds.push(target.id);
      }

      if (successIds.length > 0) {
        const successSet = new Set(successIds);
        setItems((prev) =>
          prev.map((item) =>
            successSet.has(item.id) ? { ...item, interested: true } : item,
          ),
        );
      }
    } catch (err) {
      console.error("Erro ao demonstrar interesse em todos os itens", err);
      setActionError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao demonstrar interesse em todos os itens.",
      );
    } finally {
      setIsBulkInterestLoading(false);
    }
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) {
          return i;
        }

        const maxQuantidade = Math.max(1, i.quantidadeDisponivel);
        const normalized = Math.min(maxQuantidade, Math.max(1, quantity));

        return { ...i, quantidade: normalized };
      })
    );
  };

  const allInterested = items.every((i) => i.interested);

  return (
    <div className="max-w-screen-lg w-full px-4 md:px-8 mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Meu Carrinho</h1>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">
          Carregando itens do carrinho...
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-20">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          Seu carrinho está vazio.
        </div>
      ) : null}

      {items.map((item) => {
        const { icon: Icon, color } = typeConfig[item.tipo];
        const isItemLoading = interestLoadingId === item.id;
        const interestDisabled =
          Boolean(item.interested) || isItemLoading || isBulkInterestLoading;
        return (
          <Card key={item.id} className="bg-white">
            <div className="flex flex-col sm:flex-row gap-4 p-6 items-start">
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div
                  className="flex items-center gap-1 text-lg font-medium"
                  style={{ color }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.tipo}</span>
                </div>
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-md border bg-neutral-100 overflow-hidden flex items-center justify-center">
                  {item.imagem ? (
                    <img
                      src={item.imagem}
                      alt={`Imagem de ${item.titulo}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-16 h-16 sm:w-20 sm:h-20 text-neutral-400" />
                  )}
                </div>
              </div>
              <div className="flex-1 w-full">
                <h3 className="text-2xl font-semibold leading-tight">
                  <Link
                    href={`/produto/${item.id}`}
                    className="text-inherit hover:underline cursor-pointer"
                  >
                    {item.titulo}
                  </Link>
                </h3>
                <p className="text-lg text-muted-foreground">{item.descricao}</p>
                <p className="text-xl font-bold mt-2">{item.estado}</p>
                {item.tipo === "Venda" && item.preco && (
                  <>
                    <p className="text-xl mt-2 font-medium">
                      Preço: {item.preco}
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 text-yellow-400 ${
                              item.rating && i < Math.round(item.rating) ? "fill-yellow-400" : ""
                            }`}
                          />
                        ))}
                        {item.rating ? (
                          <span className="text-base font-medium ml-1">
                            {item.rating.toFixed(1)} de 5
                          </span>
                        ) : null}
                      </div>
                      {item.reviews ? (
                        <p className="text-sm text-muted-foreground">
                          {item.reviews} avaliações
                        </p>
                      ) : null}
                    </div>
                  </>
                )}
                {item.tipo === "Empréstimo" && item.dias && (
                  <>
                    <p className="text-xl mt-2 font-medium">
                      Dias: {item.dias}
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 text-yellow-400 ${
                              item.rating && i < Math.round(item.rating) ? "fill-yellow-400" : ""
                            }`}
                          />
                        ))}
                        {item.rating ? (
                          <span className="text-base font-medium ml-1">
                            {item.rating.toFixed(1)} de 5
                          </span>
                        ) : null}
                      </div>
                      {item.reviews ? (
                        <p className="text-sm text-muted-foreground">
                          {item.reviews} avaliações
                        </p>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col sm:ml-4 gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full">
                  <div className="sm:w-40 w-full">
                    <QuantitySelect
                      value={item.quantidade}
                      max={item.quantidadeDisponivel}
                      onChange={(q) => handleQuantityChange(item.id, q)}
                    />
                  </div>
                  <Button
                    size="lg"
                    className="cursor-pointer flex-1 w-full sm:w-auto text-base"
                    variant="destructive"
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                  >
                    {removingId === item.id ? "Removendo..." : "Remover"}
                  </Button>
                </div>
                <Button
                  size="lg"
                  className="cursor-pointer w-full sm:w-auto bg-[#1500FF] hover:bg-[#1200d6] text-base"
                  disabled={interestDisabled}
                  onClick={() => handleInterest(item.id)}
                >
                  {isItemLoading
                    ? "Enviando interesse..."
                    : item.interested
                      ? "Interesse demonstrado"
                      : "Demonstrar interesse"}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}

      {items.length > 0 && (
        <div className="pt-4 border-t">
          <Button
            className="cursor-pointer w-full bg-[#1500FF] hover:bg-[#1200d6]"
            disabled={allInterested || isBulkInterestLoading}
            onClick={handleInterestAll}
          >
            {isBulkInterestLoading
              ? "Enviando interesses..."
              : "Demonstrar interesse em todos"}
          </Button>
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