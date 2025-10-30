import { mapItemToAd, type PrismaItemWithRelations } from "@/lib/ad-mapper"
import { buildCourseOptionsFromCodes } from "@/lib/course"
import { resolveItemStatus, type StatusSource } from "@/lib/item-status"
import { prisma } from "@/lib/prisma"
import { refreshExpiredItemsForUser } from "@/lib/status-service"

import type { ProfileAdItem, ProfilePageData } from "@/types/profile"

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

  const [usuario, allAds, acquiredInterests, courseRecords] =
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
  }
}
