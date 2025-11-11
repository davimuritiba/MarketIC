"use client"

import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { type ElementType, type ReactNode, useEffect, useState } from "react"
import { Gift, Repeat2, ShoppingBag, ChevronLeft, ChevronRight, Star, } from "lucide-react"

export interface AdItem {
  id: string
  href: string
  title: string
  type: "Venda" | "Empréstimo" | "Doação"
  price?: string
  days?: number
  condition?: "Novo" | "Seminovo" | "Usado"
  rating?: number
  reviews?: number
  image?: string
  categoryId?: string
  categoryName?: string
  sellerName?: string
  sellerRating?: number
  sellerReviews?: number
}

const typeConfig: Record<AdItem["type"], { icon: ElementType; color: string }> = {
  Venda: { icon: ShoppingBag, color: "#EC221F" },
  Empréstimo: { icon: Repeat2, color: "#0A5C0A" },
  Doação: { icon: Gift, color: "#0B0B64" },
}

/** === Card individual === */
export default function AdCard({
  item,
  actions,
}: {
  item: AdItem
  actions?: ReactNode
}) {
  const { icon: Icon, color } = typeConfig[item.type]
  const reviewCount = item.reviews ?? 0
  const hasReviews = typeof item.rating === "number" && reviewCount > 0
  return (
    <Card
      className="relative border p-3"
      style={{ borderColor: color }}
    >
      {actions ? <div className="absolute right-2 top-2 z-20">{actions}</div> : null}
      <Link href={item.href} className="block">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="mb-2 aspect-square w-full rounded-md object-cover"
          />
        ) : (
          <div className="mb-2 aspect-square w-full rounded-md bg-muted" />
        )}
        <CardContent className="space-y-1 p-0">
          <div className="flex items-center gap-2" style={{ color }}>
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{item.type}</span>
          </div>
          <h3 className="text-m font-medium">{item.title}</h3>
          <div className="flex items-center justify-between text-xs">
            <p className="text-muted-foreground">
              {item.type === "Venda"
                ? item.price ?? "Preço não informado"
                : item.type === "Empréstimo"
                ? item.days
                  ? `${item.days} dias`
                  : "Prazo não informado"
                : item.type === "Doação"
                ? "Não possui classificação"
                : "Proposta de troca"}
            </p>
            {item.type !== "Doação" && item.condition && (
              <span className="font-bold text-sm">{item.condition}</span>
            )}
          </div>
          {hasReviews ? (
            <div className="mt-1 flex items-center gap-1 text-xs">
              <div className="flex text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < Math.round(item.rating ?? 0) ? "fill-current" : ""}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                {reviewCount} {reviewCount === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Não possui avaliações</p>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}

/** === Grade paginada com setas === */
export function AdGridPager({
  items,
  maxPerPage,
  gridClass,
  renderActions,
}: {
  items: AdItem[]
  maxPerPage: number // 4 (Ativos) | 5 (Histórico)
  gridClass: string  // colunas responsivas
  renderActions?: (item: AdItem) => React.ReactNode
}) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(items.length / maxPerPage))
  const canPaginate = items.length > maxPerPage

  useEffect(() => {
    const updatedTotalPages = Math.max(1, Math.ceil(items.length / maxPerPage))
    if (page > updatedTotalPages - 1) {
      setPage(updatedTotalPages - 1)
    }
  }, [items.length, maxPerPage, page])

  const start = page * maxPerPage
  const visible = items.slice(start, start + maxPerPage)

  const goTo = (p: number) => setPage(Math.min(Math.max(p, 0), totalPages - 1))

  return (
    <div className="relative">
      {/* grade */}
      <div className={`grid gap-4 ${gridClass}`}>
        {visible.map((item) => (
          <AdCard
            key={item.id}
            item={item}
            actions={renderActions ? renderActions(item) : undefined}
          />
        ))}
      </div>

      {/* controles */}
      {canPaginate && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 0}
            className="cursor-pointer rounded-md px-3 py-1 border text-sm bg-white disabled:opacity-40"
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`cursor-pointer rounded-md px-3 py-1 border text-sm ${
                page === i ? "bg-neutral-200" : "bg-white"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages - 1}
            className="cursor-pointer rounded-md px-3 py-1 border text-sm bg-white disabled:opacity-40"
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  )
}