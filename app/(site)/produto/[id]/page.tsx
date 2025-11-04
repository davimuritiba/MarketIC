import { notFound } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import ProdutoPageClient, {
  type ProductData,
  type TransactionType,
  type ConditionType,
} from "./produto-content";

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export default async function ProdutoPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  const item = await prisma.item.findUnique({
    where: { id: params.id },
    include: {
      categoria: true,
      imagens: {
        orderBy: { ordem: "asc" },
      },
      usuario: {
        select: {
          id: true,
          nome: true,
          foto_documento_url: true,
          reputacao_media: true,
          reputacao_count: true,
        },
      },
      avaliacoes: {
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              foto_documento_url: true,
            },
          },
        },
        orderBy: {
          data: "desc",
        },
      },
    },
  });

  if (!item) {
    notFound();
  }

  const isSale = item.tipo_transacao === "VENDA";
  const formattedPrice = isSale
    ? item.preco_formatado ??
      (item.preco_centavos != null
        ? formatCurrency(item.preco_centavos)
        : null)
    : null;

  const viewerUserId = session?.usuario_id ?? null;
  const favoriteRecord = viewerUserId
    ? await prisma.favorito.findUnique({
        where: {
          usuario_id_anuncio_id: {
            usuario_id: viewerUserId,
            anuncio_id: item.id,
          },
        },
        select: { id: true },
      })
    : null;

  const cartRecord = viewerUserId
    ? await prisma.carrinhoItem.findUnique({
        where: {
          usuario_id_anuncio_id: {
            usuario_id: viewerUserId,
            anuncio_id: item.id,
          },
        },
        select: { id: true },
      })
    : null;

  const interestRecord = viewerUserId
    ? await prisma.interesse.findUnique({
        where: {
          usuario_id_anuncio_id: {
            usuario_id: viewerUserId,
            anuncio_id: item.id,
          },
        },
        select: { id: true },
      })
    : null;

  const productReviews = item.avaliacoes ?? [];
  const productRatingCount = productReviews.length;
  const productRating = productRatingCount
    ? productReviews.reduce((total, review) => total + review.nota, 0) /
      productRatingCount
    : 0;

  const viewerIsOwner = viewerUserId === item.usuario_id;
  const viewerHasReview = viewerUserId
    ? productReviews.some((review) => review.usuario_id === viewerUserId)
    : false;

  const product: ProductData = {
    id: item.id,
    title: item.titulo,
    description: item.descricao,
    transactionType: item.tipo_transacao as TransactionType,
    condition: item.estado_conservacao as ConditionType,
    isSale,
    price: formattedPrice,
    quantity: item.quantidade_disponivel,
    images: (item.imagens || []).map((image) => ({
      id: image.id,
      url: image.url,
    })),
    categoryName: item.categoria?.nome ?? null,
    seller: {
      id: item.usuario.id,
      name: item.usuario.nome,
      avatarUrl: item.usuario.foto_documento_url ?? null,
      rating: item.usuario.reputacao_media ?? 0,
      ratingCount: item.usuario.reputacao_count ?? 0,
    },
    isFavorited: Boolean(favoriteRecord),
    viewerCanFavorite:
      Boolean(viewerUserId) && item.usuario_id !== viewerUserId,
    productRating,
    productRatingCount,
    reviews: productReviews.map((review) => ({
      id: review.id,
      rating: review.nota,
      title: review.titulo,
      comment: review.comentario,
      createdAt: review.data.toISOString(),
      reviewer: {
        id: review.usuario.id,
        name: review.usuario.nome,
        avatarUrl: review.usuario.foto_documento_url ?? null,
      },
    })),
    viewerCanReview:
      Boolean(viewerUserId) && !viewerIsOwner && !viewerHasReview,
    viewerHasReview: viewerHasReview,
    viewerIsOwner,
    isInCart: Boolean(cartRecord),
    viewerCanAddToCart: Boolean(viewerUserId) && !viewerIsOwner,
    viewerIsAuthenticated: Boolean(viewerUserId),
    viewerHasInterest: Boolean(interestRecord),
  };

  return <ProdutoPageClient product={product} />;
}
