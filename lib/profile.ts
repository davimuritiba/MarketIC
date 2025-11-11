import { mapItemToAd, type PrismaItemWithRelations } from "@/lib/ad-mapper"
import { buildCourseOptionsFromCodes } from "@/lib/course"
import { resolveItemStatus, type StatusSource } from "@/lib/item-status"
import { prisma } from "@/lib/prisma"
import { refreshExpiredItemsForUser } from "@/lib/status-service"
import { computeReviewPermissions } from "@/lib/review-permissions"

import type {
  ProfileAdItem,
  ProfilePageData,
  PublicProfilePageData,
  UserReview,
} from "@/types/profile"

const MAX_ACTIVE_AND_ACQUIRED = 12
type ProfileItem = PrismaItemWithRelations & StatusSource

function mapItemToProfileAd(item: ProfileItem): ProfileAdItem {
  const base = mapItemToAd(item)
  const statusInfo = resolveItemStatus(item)

  return {
    ...base,
    statusCode: statusInfo.statusCode,
    statusLabel: statusInfo.statusLabel,
    publishedAt: statusInfo.publishedAt.toISOString(),
    expiresAt: statusInfo.expiresAt ? statusInfo.expiresAt.toISOString() : null,
  }
}

export async function getProfilePageData(userId: string): Promise<ProfilePageData> {
  await refreshExpiredItemsForUser(userId)

  const [usuario, allAds, acquiredInterests, courseRecords, userReviews] =
    await prisma.$transaction([
      prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nome: true,
          email_institucional: true,
          telefone: true,
          curso: true,
          data_nascimento: true,
          foto_documento_url: true,
          reputacao_media: true,
          reputacao_count: true,
          CPF: true,
          RG: true,
        },
      }),
      prisma.item.findMany({
        where: {
          usuario_id: userId,
        },
        include: {
          imagens: {
            orderBy: { ordem: "asc" },
            take: 1,
          },
          avaliacoes: {
            select: { nota: true },
          },
        },
        orderBy: [{ created_at: "desc" }, { titulo: "asc" }],
      }),
      prisma.interesse.findMany({
        where: {
          usuario_id: userId,
          status: "ACEITO",
        },
        include: {
          item: {
            include: {
              imagens: {
                orderBy: { ordem: "asc" },
                take: 1,
              },
              avaliacoes: {
                select: { nota: true },
              },
            },
          },
        },
        take: MAX_ACTIVE_AND_ACQUIRED,
        orderBy: { created_at: "desc" },
      }),
      prisma.usuario.findMany({
        select: { curso: true },
        distinct: ["curso"],
      }),
      prisma.avaliacaoUsuario.findMany({
        where: { avaliado_id: userId },
        include: {
          avaliador: {
            select: {
              id: true,
              nome: true,
              foto_documento_url: true,
            },
          },
        },
        orderBy: { data: "desc" },
      }),
    ])

  if (!usuario) {
    throw new Error("Usuário não encontrado")
  }

  const courseOptions = buildCourseOptionsFromCodes(
    courseRecords
      .map((course) => course.curso)
      .filter((curso): curso is string => Boolean(curso)),
  )

  const profileAds = (allAds as ProfileItem[]).map(mapItemToProfileAd)

  const activeAdsItems = profileAds.filter(
    (item) => item.statusCode === "PUBLICADO",
  )

  const acquiredItemsMap = new Map<string, PrismaItemWithRelations["id"]>()
  const acquiredItems = Array.from(
    acquiredInterests
      .map((interest) => interest.item)
      .filter((item): item is PrismaItemWithRelations => Boolean(item)),
  ).filter((item) => {
    if (acquiredItemsMap.has(item.id)) {
      return false
    }
    acquiredItemsMap.set(item.id, item.id)
    return true
  })

  return {
    user: {
      id: usuario.id,
      nome: usuario.nome,
      emailInstitucional: usuario.email_institucional,
      telefone: usuario.telefone ?? null,
      curso: usuario.curso ?? null,
      dataNascimento: usuario.data_nascimento
        ? usuario.data_nascimento.toISOString()
        : null,
      fotoDocumentoUrl: usuario.foto_documento_url ?? null,
      reputacaoMedia: usuario.reputacao_media ?? null,
      reputacaoCount: usuario.reputacao_count ?? 0,
      cpf: usuario.CPF,
      rg: usuario.RG,
    },
    activeAds: activeAdsItems
      .slice(0, MAX_ACTIVE_AND_ACQUIRED)
      .map((item) => ({ ...item })),
    historyAds: profileAds,
    acquiredItems: acquiredItems.map(mapItemToAd),
    courses: courseOptions,
    reviews: (userReviews ?? []).map((review) => {
      const permissions = computeReviewPermissions({
        viewerId: userId,
        authorId: review.avaliador_id,
        createdAt: review.data,
      })

      return {
        id: review.id,
        rating: review.nota,
        title: review.titulo ?? null,
        comment: review.comentario ?? null,
        createdAt: review.data.toISOString(),
        reviewer: {
          id: review.avaliador.id,
          name: review.avaliador.nome,
          avatarUrl: review.avaliador.foto_documento_url ?? null,
        },
        canEdit: permissions.canEdit,
        canDelete: permissions.canDelete,
      }
    }),
  }
}

export async function getPublicProfilePageData(
  userId: string,
  viewerUserId?: string | null,
): Promise<PublicProfilePageData | null> {
  await refreshExpiredItemsForUser(userId)

  const [usuario, allAds, userReviews] = await prisma.$transaction([
    prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        curso: true,
        data_nascimento: true,
        foto_documento_url: true,
        reputacao_media: true,
        reputacao_count: true,
      },
    }),
    prisma.item.findMany({
      where: { usuario_id: userId },
      include: {
        imagens: {
          orderBy: { ordem: "asc" },
          take: 1,
        },
        avaliacoes: {
          select: { nota: true },
        },
      },
      orderBy: [{ created_at: "desc" }, { titulo: "asc" }],
    }),
    prisma.avaliacaoUsuario.findMany({
      where: { avaliado_id: userId },
      include: {
        avaliador: {
          select: {
            id: true,
            nome: true,
            foto_documento_url: true,
          },
        },
      },
      orderBy: { data: "desc" },
    }),
  ])

  if (!usuario) {
    return null
  }

  const profileAds = (allAds as ProfileItem[]).map(mapItemToProfileAd)

  const activeAdsItems = profileAds.filter(
    (item) => item.statusCode === "PUBLICADO",
  )

  let viewerHasReviewedUser = false

  if (viewerUserId && viewerUserId !== userId) {
    const existingReview = await prisma.avaliacaoUsuario.findUnique({
      where: {
        avaliador_id_avaliado_id: {
          avaliador_id: viewerUserId,
          avaliado_id: userId,
        },
      },
      select: { id: true },
    })

    viewerHasReviewedUser = Boolean(existingReview)
  }

  const viewerCanReviewUser =
    Boolean(viewerUserId) && viewerUserId !== userId && !viewerHasReviewedUser

  return {
    user: {
      id: usuario.id,
      nome: usuario.nome,
      curso: usuario.curso ?? null,
      dataNascimento: usuario.data_nascimento
        ? usuario.data_nascimento.toISOString()
        : null,
      avatarUrl: usuario.foto_documento_url ?? null,
      reputacaoMedia: usuario.reputacao_media ?? null,
      reputacaoCount: usuario.reputacao_count ?? 0,
    },
    activeAds: activeAdsItems.map((item) => ({ ...item })),
    viewerCanReviewUser,
    viewerHasReviewedUser,
    reviews: userReviews.map((review) => {
      const permissions = computeReviewPermissions({
        viewerId: viewerUserId ?? null,
        authorId: review.avaliador_id,
        createdAt: review.data,
      })

      return {
        id: review.id,
        rating: review.nota,
        title: review.titulo ?? null,
        comment: review.comentario ?? null,
        createdAt: review.data.toISOString(),
        reviewer: {
          id: review.avaliador.id,
          name: review.avaliador.nome,
          avatarUrl: review.avaliador.foto_documento_url ?? null,
        },
        canEdit: permissions.canEdit,
        canDelete: permissions.canDelete,
      } satisfies UserReview
    }),
  }
}
