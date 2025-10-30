import type { AvaliacaoItem, EstadoConservacao, ImagemAnuncio, Item, TipoTransacao, } from "@prisma/client"

import type { AdItem } from "@/components/AdCard"
import type { ConditionLabel, TransactionLabel } from "@/types/profile"

const TRANSACTION_LABEL: Record<TipoTransacao, TransactionLabel> = {
  VENDA: "Venda",
  EMPRESTIMO: "Empréstimo",
  DOACAO: "Doação",
}

const CONDITION_LABEL: Record<EstadoConservacao, ConditionLabel> = {
  NOVO: "Novo",
  SEMINOVO: "Seminovo",
  USADO: "Usado",
}

export interface PrismaItemWithRelations extends Item {
  imagens: ImagemAnuncio[]
  avaliacoes: Pick<AvaliacaoItem, "nota">[]
}

export function formatPrice(
  precoCentavos?: number | null,
  precoFormatado?: string | null,
) {
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

export function mapItemToAd(item: PrismaItemWithRelations): AdItem {
  const type = TRANSACTION_LABEL[item.tipo_transacao] ?? "Doação"
  const condition = CONDITION_LABEL[item.estado_conservacao]
  const ratingValues = (item.avaliacoes ?? []).map((avaliacao) =>
    Number(avaliacao.nota),
  )

  const averageRating = ratingValues.length
    ? ratingValues.reduce((sum, nota) => sum + nota, 0) / ratingValues.length
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
