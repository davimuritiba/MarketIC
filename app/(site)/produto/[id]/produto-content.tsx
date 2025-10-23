"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Star,
  ShoppingBag,
  RefreshCw,
  Heart,
  Gift,
  Repeat2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

const reviews = [
  {
    name: "João",
    rating: 5,
    title: "Livro muito bom",
    comment: "Uma boa leitura, recomendo",
    date: "14/02/2025",
  },
  {
    name: "Maria",
    rating: 2,
    title: "Poderia ser melhor",
    comment: "Gostei mas muito difícil",
    date: "10/10/2024",
  },
];

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
  const [favorited, setFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const stars = useMemo(() => Array.from({ length: 5 }), []);

  const images = product.images;
  const hasImages = images.length > 0;

  const safeIndex =
    hasImages && currentImageIndex >= 0 && currentImageIndex < images.length
      ? currentImageIndex
      : 0;
  const mainImage = hasImages ? images[safeIndex] : null;

  const typeConfig =
    transactionTypeConfig[product.transactionType] ?? {
      label: product.transactionType,
      icon: ShoppingBag as LucideIcon,
      colorClass: "text-gray-500",
    };
  const TypeIcon = typeConfig.icon;
  const conditionLabel =
    conditionLabels[product.condition] ?? product.condition;

  const avgRating =
    reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  const description = product.description?.trim()
    ? product.description
    : "Descrição não disponível.";

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
                  className={`rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
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
              <AvatarImage src="/images/user.jpg" alt="Avatar do vendedor" />
              <AvatarFallback>V</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Nome do vendedor</h2>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-500">
                      {stars.map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < 4 ? "fill-current" : ""}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {avgRating.toFixed(1)} de 5
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {reviews.length} avaliações
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
                className={`hover:text-red-500 ${
                  favorited ? "text-red-500" : "text-gray-400"
                }`}
                onClick={() => setFavorited((prev) => !prev)}
              >
                <Heart
                  className="w-5 h-5"
                  fill={favorited ? "currentColor" : "none"}
                />
              </button>
            </div>
          </div>
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
              ({reviews.length})
            </span>
          </h3>
          <div className="flex items-center gap-1 text-yellow-500 mt-1">
            {stars.map((_, i) => (
              <Star
                key={i}
                size={20}
                className={i < Math.round(avgRating) ? "fill-current" : ""}
              />
            ))}
            <span className="text-base text-muted-foreground">
              {avgRating.toFixed(1)} de 5
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="p-4 border border-black rounded-md space-y-2"
              >
                <div className="flex items-center gap-1 text-yellow-500">
                  {stars.map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      className={j < r.rating ? "fill-current" : ""}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground">
                    {r.rating} de 5
                  </span>
                </div>
                <h4 className="text-lg font-semibold">{r.title}</h4>
                <p className="text-base">{r.comment}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src="" alt={`Avatar de ${r.name}`} />
                    <AvatarFallback>{r.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-none">
                    <span className="font-semibold">{r.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {r.date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
