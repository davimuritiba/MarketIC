import { prisma } from "@/lib/prisma"

export async function refreshExpiredItemsForUser(userId: string) {
  const now = new Date()

  await prisma.item.updateMany({
    where: {
      usuario_id: userId,
      status: "PUBLICADO",
      expira_em: {
        not: null,
        lte: now,
      },
    },
    data: {
      status: "EXPIRADO",
    },
  })
}
