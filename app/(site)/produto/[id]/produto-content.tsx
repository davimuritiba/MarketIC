"use client";

import { useMemo, useState, useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import { Star, ShoppingBag, Heart, Gift, Repeat2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage, } from "@/components/ui/avatar";

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
  productRating: number;
  productRatingCount: number;
  reviews: ProductReview[];
  viewerCanReview: boolean;
  viewerHasReview: boolean;
  viewerIsOwner: boolean;
  isInCart: boolean;
  viewerCanAddToCart: boolean;
  viewerIsAuthenticated: boolean;
}

export interface ProductReview {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
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
  const [inCart, setInCart] = useState(product.isInCart);
  const [favorited, setFavorited] = useState(product.isFavorited);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const [isTogglingFavorite, startToggleFavorite] = useTransition();
  const [isUpdatingCart, startUpdateCart] = useTransition();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<ProductReview[]>(product.reviews);
  const [canReview, setCanReview] = useState(product.viewerCanReview);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(
    product.viewerHasReview,
  );
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSubmittingReview, startSubmitReview] = useTransition();

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

  const productReviewStats = useMemo(() => {
    if (!reviews.length) {
      return { average: 0, rounded: 0 };
    }

    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    const average = sum / reviews.length;

    return {
      average: Math.min(Math.max(average, 0), 5),
      rounded: Math.round(average),
    };
  }, [reviews]);

  const productRating = productReviewStats.average;
  const productReviewCount = reviews.length;

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

  const handleAddToCart = () => {
    if (isUpdatingCart || inCart) {
      return;
    }

    startUpdateCart(async () => {
      try {
        setCartError(null);

        if (!product.viewerIsAuthenticated) {
          setCartError("É necessário estar logado para gerenciar o carrinho.");
          return;
        }

        if (product.viewerIsOwner || !product.viewerCanAddToCart) {
          setCartError("Você não pode adicionar o próprio anúncio ao carrinho.");
          return;
        }

        const response = await fetch(`/api/items/${product.id}/cart`, {
          method: "POST",
        });

        if (!response.ok) {
          if (response.status === 401) {
            setCartError("É necessário estar logado para gerenciar o carrinho.");
            return;
          }

          const payload = await response.json().catch(() => null);
          const message = payload?.error ?? "Não foi possível adicionar o item ao carrinho.";
          setCartError(message);
          return;
        }

        const payload = await response.json().catch(() => null);
        const nextState = payload?.inCart ?? true;
        setInCart(Boolean(nextState));
      } catch (error) {
        console.error("Erro ao adicionar item ao carrinho", error);
        setCartError("Erro inesperado ao adicionar item ao carrinho. Tente novamente.");
      }
    });
  };

  const handleRemoveFromCart = () => {
    if (isUpdatingCart || !inCart) {
      return;
    }

    startUpdateCart(async () => {
      try {
        setCartError(null);

        if (!product.viewerIsAuthenticated) {
          setCartError("É necessário estar logado para gerenciar o carrinho.");
          return;
        }

        const response = await fetch(`/api/items/${product.id}/cart`, {
          method: "DELETE",
        });

        if (!response.ok) {
          if (response.status === 401) {
            setCartError("É necessário estar logado para gerenciar o carrinho.");
            return;
          }

          const payload = await response.json().catch(() => null);
          const message = payload?.error ?? "Não foi possível remover o item do carrinho.";
          setCartError(message);
          return;
        }

        setInCart(false);
      } catch (error) {
        console.error("Erro ao remover item do carrinho", error);
        setCartError("Erro inesperado ao remover item do carrinho. Tente novamente.");
      }
    });
  };

  const resetReviewForm = () => {
    setSelectedRating(null);
    setReviewTitle("");
    setReviewComment("");
    setReviewError(null);
  };

  const handleReviewDialogChange = (open: boolean) => {
    if (!open && !isSubmittingReview) {
      resetReviewForm();
    }
    setIsReviewDialogOpen(open);
  };

  const handleSubmitReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedRating) {
      setReviewError("Selecione uma nota para o produto.");
      return;
    }

    startSubmitReview(async () => {
      try {
        setReviewError(null);

        const response = await fetch(`/api/items/${product.id}/reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: selectedRating,
            title: reviewTitle.trim() ? reviewTitle.trim() : undefined,
            comment: reviewComment.trim() ? reviewComment.trim() : undefined,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message = payload?.error ?? "Não foi possível enviar sua avaliação.";
          setReviewError(message);
          return;
        }

        const payload = await response.json().catch(() => null);
        const createdReview: ProductReview | undefined = payload?.review;

        if (!createdReview) {
          setReviewError("Resposta inesperada do servidor.");
          return;
        }

        setReviews((previous) => [createdReview, ...previous]);
        setCanReview(false);
        setHasSubmittedReview(true);
        resetReviewForm();
        setIsReviewDialogOpen(false);
      } catch (error) {
        console.error("Erro ao enviar avaliação", error);
        setReviewError("Erro inesperado ao enviar avaliação. Tente novamente.");
      }
    });
  };

  const renderReviewStars = (
    value: number,
    options?: {
      size?: number;
      showValue?: boolean;
    },
  ) => {
    const size = options?.size ?? 16;
    const showValue = options?.showValue ?? true;
    const safeValue = Number.isFinite(value) ? value : 0;
    const normalizedValue = Math.min(Math.max(safeValue, 0), 5);

    return (
      <div className="flex items-center gap-1 text-yellow-500">
        {stars.map((_, index) => (
          <Star
            key={index}
            size={size}
            className={index < Math.round(normalizedValue) ? "fill-current" : ""}
          />
        ))}
        {showValue ? (
          <span className="text-sm text-muted-foreground">
            {normalizedValue.toFixed(1)} de 5
          </span>
        ) : null}
      </div>
    );
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
          {cartError ? <p className="text-sm text-red-600">{cartError}</p> : null}
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
              {interested ? "Interesse demonstrado" : "Demonstrar interesse"}
            </Button>
            {!inCart ? (
              <Button
                className="cursor-pointer flex-1 bg-blue-400 hover:bg-blue-500 text-white"
                disabled={isUpdatingCart || inCart}
                onClick={handleAddToCart}
              >
                {isUpdatingCart ? "Adicionando..." : "Adicionar ao carrinho"}
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <Button
                  className="cursor-default flex-1 bg-blue-400 hover:bg-blue-400 text-white"
                  disabled
                >
                  Adicionado
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={handleRemoveFromCart}
                  disabled={isUpdatingCart}
                >
                  Remover do carrinho
                </Button>
              </div>
            )}
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
              ({productReviewCount})
            </span>
          </h3>
          <div className="mt-1">
            {renderReviewStars(productRating, { size: 20 })}
          </div>
          {canReview ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setIsReviewDialogOpen(true)}
            >
              Avaliar produto
            </Button>
          ) : null}
          {product.viewerIsOwner ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Você é o proprietário deste produto e não pode avaliá-lo.
            </p>
          ) : null}
          {!product.viewerIsOwner && hasSubmittedReview ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Você já enviou uma avaliação para este produto.
            </p>
          ) : null}
          <div className="mt-4 space-y-4">
            {reviews.length ? (
              reviews.map((review) => (
                <div key={review.id} className="rounded-md border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={review.reviewer.avatarUrl ?? undefined}
                        alt={`Avatar de ${review.reviewer.name}`}
                      />
                      <AvatarFallback>
                        {review.reviewer.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-base font-semibold">{review.reviewer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {renderReviewStars(review.rating)}
                  {review.title ? (
                    <h4 className="text-base font-medium">{review.title}</h4>
                  ) : null}
                  {review.comment ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {review.comment}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-base text-muted-foreground">
                Este produto ainda não possui avaliações.
              </p>
            )}
          </div>
        </div>
      </section>

      <Dialog open={isReviewDialogOpen} onOpenChange={handleReviewDialogChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Avaliar produto</DialogTitle>
            <DialogDescription>
              Compartilhe sua opinião com outros usuários da plataforma.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Nota do produto</p>
              <div className="flex gap-2 text-yellow-500">
                {stars.map((_, index) => {
                  const value = index + 1;
                  const isActive = selectedRating != null && value <= selectedRating;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedRating(value)}
                      className={`transition-colors ${isActive ? "text-yellow-500" : "text-gray-300"}`}
                      aria-label={`Selecionar nota ${value}`}
                    >
                      <Star size={24} className={isActive ? "fill-current" : ""} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="review-title">
                Título (opcional)
              </label>
              <Input
                id="review-title"
                placeholder="Resumo da sua experiência"
                value={reviewTitle}
                onChange={(event) => setReviewTitle(event.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="review-comment">
                Comentário (opcional)
              </label>
              <Textarea
                id="review-comment"
                placeholder="Conte mais sobre o produto"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                rows={4}
                maxLength={1000}
              />
            </div>
            {reviewError ? (
              <p className="text-sm text-red-600">{reviewError}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleReviewDialogChange(false)}
                disabled={isSubmittingReview}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmittingReview} className="bg-[#1500FF] hover:bg-[#1200d6]">
                {isSubmittingReview ? "Enviando..." : "Enviar avaliação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
