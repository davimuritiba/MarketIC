import { notFound } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeReviewPermissions } from "@/lib/review-permissions";

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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();

  const item = await prisma.item.findUnique({
    where: { id },
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
          email_institucional: true,
          telefone: true,
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
        orderBy: { data: "desc" },
      },
    },
  });

  if (!item) {
    notFound();
  }

  const viewerUserId = session?.usuario_id ?? null;
  const viewerIsOwner = viewerUserId === item.usuario_id;

  if (item.status !== "PUBLICADO" && !viewerIsOwner) {
    notFound();
  }

  const isSale = item.tipo_transacao === "VENDA";
  const isDonation = item.tipo_transacao === "DOACAO";
  const formattedPrice = isSale
    ? item.preco_formatado ??
      (item.preco_centavos != null
        ? formatCurrency(item.preco_centavos)
        : null)
    : null;

  const [favoriteRecord, cartRecord, interestRecord] = viewerUserId
    ? await Promise.all([
        prisma.favorito.findUnique({
          where: {
            usuario_id_anuncio_id: {
              usuario_id: viewerUserId,
              anuncio_id: item.id,
            },
          },
          select: { id: true },
        }),
        prisma.carrinhoItem.findUnique({
          where: {
            usuario_id_anuncio_id: {
              usuario_id: viewerUserId,
              anuncio_id: item.id,
            },
          },
          select: { id: true },
        }),
        prisma.interesse.findUnique({
          where: {
            usuario_id_anuncio_id: {
              usuario_id: viewerUserId,
              anuncio_id: item.id,
            },
          },
          select: {
            id: true,
            status: true,
            share_email: true,
            share_phone: true,
          },
        }),
      ])
    : [null, null, null];

  const productReviews = item.avaliacoes ?? [];
  const productRatingCount = productReviews.length;
  const productRating = productRatingCount
    ? productReviews.reduce((total, review) => total + review.nota, 0) /
      productRatingCount
    : 0;

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
    loanDays:
      item.tipo_transacao === "EMPRESTIMO" ? item.prazo_dias ?? null : null,
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
    reviews: productReviews.map((review) => {
      const permissions = computeReviewPermissions({
        viewerId: viewerUserId,
        authorId: review.usuario_id,
        createdAt: review.data,
      });

      return {
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
        canEdit: permissions.canEdit,
        canDelete: permissions.canDelete,
      };
    }),
    viewerCanReview:
      Boolean(viewerUserId) && !viewerIsOwner && !viewerHasReview && !isDonation,
    viewerHasReview: viewerHasReview,
    viewerIsOwner,
    isInCart: Boolean(cartRecord),
    viewerCanAddToCart: Boolean(viewerUserId) && !viewerIsOwner,
    viewerIsAuthenticated: Boolean(viewerUserId),
    viewerHasInterest: Boolean(interestRecord),
    viewerInterestStatus: interestRecord?.status ?? null,
    viewerSharedContact: (() => {
      if (
        !interestRecord ||
        interestRecord.status !== "ACEITO" ||
        (!interestRecord.share_email && !interestRecord.share_phone)
      ) {
        return null;
      }

      return {
        email: interestRecord.share_email
          ? item.usuario.email_institucional
          : null,
        phone: interestRecord.share_phone ? item.usuario.telefone : null,
      };
    })(),
  };

  return <ProdutoPageClient product={product} />;
}
