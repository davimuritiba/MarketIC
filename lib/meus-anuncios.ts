import { mapItemToAd, type PrismaItemWithRelations } from "@/lib/ad-mapper"
import { computeRemovalInfo, resolveItemStatus, type StatusSource, } from "@/lib/item-status"
import { prisma } from "@/lib/prisma"
import { refreshExpiredItemsForUser } from "@/lib/status-service"

import type { DashboardAdItem, MyAdsData } from "@/types/meus-anuncios"

type DashboardItem = PrismaItemWithRelations & StatusSource

function mapItemToDashboardAd(item: DashboardItem): DashboardAdItem {
  const base = mapItemToAd(item)
  const statusInfo = resolveItemStatus(item)
  const removalInfo = computeRemovalInfo(statusInfo.expiresAt)

  return {
    ...base,
    statusCode: statusInfo.statusCode,
    statusLabel: statusInfo.statusLabel,
    publishedAt: statusInfo.publishedAt.toISOString(),
    expiresAt: statusInfo.expiresAt ? statusInfo.expiresAt.toISOString() : null,
    removalDate: removalInfo.removalDate
      ? removalInfo.removalDate.toISOString()
      : null,
    removalCountdown: removalInfo.removalCountdown,
  }
}

export async function getMyAdsDashboardData(
  userId: string,
): Promise<MyAdsData> {
  await refreshExpiredItemsForUser(userId)

  const items = await prisma.item.findMany({
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
  })

  const ads = (items as DashboardItem[]).map(mapItemToDashboardAd)

  return {
    publicados: ads.filter((item) => item.statusCode === "PUBLICADO"),
    finalizados: ads.filter((item) => item.statusCode === "FINALIZADO"),
    inativos: ads.filter((item) => item.statusCode === "INATIVO"),
    expirados: ads.filter((item) => item.statusCode === "EXPIRADO"),
  }
}
