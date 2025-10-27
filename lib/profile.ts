import { prisma } from "@/lib/prisma"

import type {
  ConditionLabel,
  ProfileAdItem,
  ProfilePageData,
  ProfileUserData,
  TransactionLabel,
} from "@/types/profile"

const TRANSACTION_LABEL: Record<string, TransactionLabel> = {
  VENDA: "Venda",
  EMPRESTIMO: "Empréstimo",
  DOACAO: "Doação",
  TROCA: "Troca",
}

const CONDITION_LABEL: Record<string, ConditionLabel> = {
  NOVO: "Novo",
  SEMINOVO: "Seminovo",
  USADO: "Usado",
}

const MAX_ACTIVE_AND_ACQUIRED = 12
const MAX_HISTORY = 15

function formatPrice(precoCentavos?: number | null, precoFormatado?: string | null) {
  if (precoFormatado && precoFormatado.trim()) {
    return precoFormatado
  }

  if (precoCentavos == null) {
    return undefined
  }

  return (precoCentavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function mapItemToAd(item: any): ProfileAdItem {
  const type = TRANSACTION_LABEL[item.tipo_transacao] ?? "Doação"
  const condition = CONDITION_LABEL[item.estado_conservacao]
  const ratingValues = (item.avaliacoes ?? []).map((avaliacao: { nota: number }) =>
    Number(avaliacao.nota),
  )

  const averageRating = ratingValues.length
    ? ratingValues.reduce((sum: number, nota: number) => sum + nota, 0) /
      ratingValues.length
    : undefined

  return {
    id: item.id,
    href: `/produto/${item.id}`,
    title: item.titulo,
    type,
    price:
      type === "Venda"
        ? formatPrice(item.preco_centavos, item.preco_formatado)
        : undefined,
    days: type === "Empréstimo" ? item.prazo_dias ?? undefined : undefined,
    condition,
    rating: averageRating,
    reviews: ratingValues.length || undefined,
    image: item.imagens?.[0]?.url ?? undefined,
  }
}

export async function getProfilePageData(userId: string): Promise<ProfilePageData> {
  const [usuario, activeAds, historyAds, acquiredInterests] = await prisma.$transaction([
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
        quantidade_disponivel: { gt: 0 },
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
      take: MAX_ACTIVE_AND_ACQUIRED,
      orderBy: { titulo: "asc" },
    }),
    prisma.item.findMany({
      where: {
        usuario_id: userId,
        quantidade_disponivel: 0,
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
      take: MAX_HISTORY,
      orderBy: { titulo: "asc" },
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
  ])

  if (!usuario) {
    throw new Error("Usuário não encontrado")
  }

  const acquiredItemsMap = new Map<string, any>()
  for (const interest of acquiredInterests) {
    if (interest.item) {
      acquiredItemsMap.set(interest.item.id, interest.item)
    }
  }

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
    activeAds: activeAds.map(mapItemToAd),
    historyAds: historyAds.map(mapItemToAd),
    acquiredItems: Array.from(acquiredItemsMap.values()).map(mapItemToAd),
  }
}
