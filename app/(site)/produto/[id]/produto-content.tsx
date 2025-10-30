"use client";

import { useMemo, useState, useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import { Star, ShoppingBag, Heart, Gift, Repeat2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type TransactionType = "VENDA" | "EMPRESTIMO" | "DOACAO";
export type ConditionType = "NOVO" | "SEMINOVO" | "USADO";

interface ProductImage {
  id: string;
  url: string;
}

export interface ProductData {
  id: string;
  title: string;
  description?: string | null;
  transactionType: TransactionType;
  condition: ConditionType;
  isSale: boolean;
  price?: string | null;
  quantity: number;
  images: ProductImage[];
  categoryName?: string | null;
  seller: {
    id: string;
    name: string;
    avatarUrl: string | null;
    rating: number;
    ratingCount: number;
  };
  isFavorited: boolean;
  viewerCanFavorite: boolean;
}

interface ProdutoPageClientProps {
  product: ProductData;
}

const transactionTypeConfig: Record<
  TransactionType,
  { label: string; icon: LucideIcon; colorClass: string }
> = {
  VENDA: {
    label: "Venda",
    icon: ShoppingBag,
    colorClass: "text-[#EC221F]",
  },
  EMPRESTIMO: {
    label: "Empréstimo",
    icon: Repeat2,
    colorClass: "text-[#0A5C0A]",
  },
  DOACAO: {
    label: "Doação",
    icon: Gift,
    colorClass: "text-[#0B0B64]",
  }
};

const conditionLabels: Record<ConditionType, string> = {
  NOVO: "Novo",
  SEMINOVO: "Seminovo",
  USADO: "Usado",
};

export default function ProdutoPageClient({ product }: ProdutoPageClientProps) {
  const [interested, setInterested] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [favorited, setFavorited] = useState(product.isFavorited);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [isTogglingFavorite, startToggleFavorite] = useTransition();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const stars = useMemo(() => Array.from({ length: 5 }), []);

  const images = product.images;
  const hasImages = images.length > 0;

  const safeIndex = hasImages && currentImageIndex >= 0 && currentImageIndex < images.length ? currentImageIndex : 0;
  const mainImage = hasImages ? images[safeIndex] : null;

  const typeConfig = transactionTypeConfig[product.transactionType] ?? {
      label: product.transactionType,
      icon: ShoppingBag as LucideIcon,
      colorClass: "text-gray-500",
    };
  const TypeIcon = typeConfig.icon;
  const conditionLabel = conditionLabels[product.condition] ?? product.condition;

  const sellerRating = Math.min(Math.max(product.seller.rating ?? 0, 0), 5);
  const sellerRatingRounded = Math.round(sellerRating);
  const sellerReviewCount = Math.max(product.seller.ratingCount ?? 0, 0);

  const description = product.description?.trim() ? product.description : "Descrição não disponível.";

  const handleToggleFavorite = () => {
    if (isTogglingFavorite) {
      return;
    }

    startToggleFavorite(async () => {
      try {
        setFavoriteError(null);

        if (!product.viewerCanFavorite && !favorited) {
          setFavoriteError("É necessário estar logado com outra conta para favoritar este anúncio.");
          return;
        }

        const response = await fetch(`/api/items/${product.id}/favorite`, {
          method: favorited ? "DELETE" : "POST",
        });

        if (!response.ok) {
          if (response.status === 401) {
            setFavoriteError("É necessário estar logado para gerenciar favoritos.");
            return;
          }

          const payload = await response.json().catch(() => null);
          const message = payload?.error ?? "Não foi possível atualizar o favorito.";
          setFavoriteError(message);
          return;
        }

        const payload = await response.json().catch(() => null);
        const nextState = payload?.favorited ?? !favorited;
        setFavorited(Boolean(nextState));
      } catch (error) {
        console.error("Erro ao alternar favorito", error);
        setFavoriteError("Erro inesperado ao alternar favorito. Tente novamente.");
      }
    });
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-8 md:grid-cols-2 bg-white p-6 rounded-md">
        <div>
          {mainImage ? (
            <img
              src={mainImage.url}
              alt={`Imagem principal de ${product.title}`}
              className="w-full aspect-square object-cover rounded-md"
            />
          ) : (
            <div className="w-full aspect-square flex items-center justify-center rounded-md border border-dashed border-muted-foreground/40 text-muted-foreground">
              Nenhuma foto disponível
            </div>
          )}
          {hasImages ? (
            <div className="flex gap-2 mt-2">
              {images.map((image, index) => (
                <button
                  key={image.id ?? `${image.url}-${index}`}
                  type="button"
                  onClick={() => setCurrentImageIndex(index)}
                  className={`rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
                    index === safeIndex
                      ? "ring-2 ring-blue-500"
                      : "ring-1 ring-transparent"
                  }`}
                >
                  <img
                    src={image.url}
                    alt={`Miniatura ${index + 1} de ${product.title}`}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              O vendedor ainda não adicionou fotos para este anúncio.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={product.seller.avatarUrl ?? undefined} alt={`Avatar de ${product.seller.name}`} />
              <AvatarFallback>
                {product.seller.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{product.seller.name}</h2>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-500">
                      {stars.map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < sellerRatingRounded ? "fill-current" : ""}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {sellerRating.toFixed(1)} de 5
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {sellerReviewCount === 1
                      ? "1 avaliação"
                      : `${sellerReviewCount} avaliações`}
                  </span>
                </div>
                <div className={`flex items-center gap-1 ${typeConfig.colorClass}`}>
                  <TypeIcon className="w-5 h-5" />
                  <span className="text-base font-medium">
                    {typeConfig.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-px bg-black" />
          <div className="flex justify-between items-baseline">
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium">{conditionLabel}</p>
              <button
                aria-label="Adicionar aos favoritos"
                type="button"
                className={`hover:text-red-500 ${
                  favorited ? "text-red-500" : "text-gray-400"
                } ${isTogglingFavorite ? "opacity-60" : ""}`}
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
              >
                <Heart
                  className="w-5 h-5"
                  fill={favorited ? "currentColor" : "none"}
                />
              </button>
            </div>
          </div>
          {favoriteError ? (
            <p className="text-sm text-red-600">{favoriteError}</p>
          ) : null}
          <p className="text-sm text-muted-foreground -mt-3">
            {product.quantity} itens
          </p>
          {product.isSale && product.price ? (
            <p className="text-2xl font-bold mt-3">{product.price}</p>
          ) : null}
          <div>
            <h3 className="text-xl font-semibold mb-1">Descrição</h3>
            <p className="text-base text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="cursor-pointer flex-1 bg-[#1500FF] hover:bg-[#1200d6]"
              onClick={() => setInterested((prev) => !prev)}
            >
              {interested ? "Interesse demonstrado" : "Mostrar interesse"}
            </Button>
            <Button
              className="cursor-pointer flex-1 bg-blue-400 hover:bg-blue-500 text-white"
              disabled={inCart}
              onClick={() => setInCart(true)}
            >
              {inCart ? "Adicionado" : "Adicionar ao carrinho"}
            </Button>
          </div>
        </div>
      </section>

      <div className="h-px bg-black" />

      <section className="bg-white p-6 rounded-md space-y-12">
        <div>
          <h3 className="text-2xl font-semibold">Informações Adicionais</h3>
          <p className="text-base text-muted-foreground">
            {product.categoryName
              ? `Categoria: ${product.categoryName}`
              : "\"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\""}
          </p>
        </div>
        <div>
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            Opiniões do produto
            <span className="text-base text-muted-foreground">
              ({sellerReviewCount})
            </span>
          </h3>
          <div className="flex items-center gap-1 text-yellow-500 mt-1">
            {stars.map((_, i) => (
              <Star
                key={i}
                size={20}
                className={i < sellerRatingRounded ? "fill-current" : ""}
              />
            ))}
            <span className="text-base text-muted-foreground">
              {sellerRating.toFixed(1)} de 5
            </span>
          </div>
          <div className="mt-4 space-y-4">
            <p className="text-base text-muted-foreground">
              {sellerReviewCount > 0
                ? "As avaliações detalhadas deste produto estarão disponíveis em breve."
                : "Este produto ainda não possui avaliações."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
