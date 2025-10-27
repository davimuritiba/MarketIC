"use client"

import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { type ElementType, useState } from "react"
import { Gift, Repeat2, ShoppingBag, ChevronLeft, ChevronRight, Star, } from "lucide-react"

import type { AdItem } from "@/types/ad"

const typeConfig: Record<AdItem["type"], { icon: ElementType; color: string }> = {
  Venda: { icon: ShoppingBag, color: "#EC221F" },
  Empréstimo: { icon: Repeat2, color: "#0A5C0A" },
  Doação: { icon: Gift, color: "#0B0B64" },
  Troca: { icon: Repeat2, color: "#8A2BE2" },
}

/** === Card individual === */
export default function AdCard({ item }: { item: AdItem }) {
  const { icon: Icon, color } = typeConfig[item.type]
  return (
    <Link href={item.href} className="block">
      <Card className="p-3 border" style={{ borderColor: color }}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="mb-2 aspect-square w-full rounded-md object-cover"
          />
        ) : (
          <div className="mb-2 aspect-square w-full rounded-md bg-muted" />
        )}
        <CardContent className="p-0 space-y-1">
          <div className="flex items-center gap-2" style={{ color }}>
            <Icon className="w-4 h-4" />
            <span className="font-medium text-sm">{item.type}</span>
          </div>
          <h3 className="font-medium text-sm">{item.title}</h3>
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
              <span className="font-bold">{item.condition}</span>
            )}
          </div>
          {item.rating !== undefined && (
            <div className="flex items-center gap-1 mt-1 text-xs">
              <div className="flex text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < Math.round(item.rating ?? 0) ? "fill-current" : ""}
                  />
                ))}
              </div>
              {item.reviews !== undefined && (
                <span className="text-muted-foreground">{item.reviews} avaliações</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

/** === Grade paginada com setas === */
export function AdGridPager({
  items,
  maxPerPage,
  gridClass,
}: {
  items: AdItem[]
  maxPerPage: number // 4 (Ativos) | 5 (Histórico)
  gridClass: string  // colunas responsivas
}) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(items.length / maxPerPage))
  const canPaginate = items.length > maxPerPage

  const start = page * maxPerPage
  const visible = items.slice(start, start + maxPerPage)

  const goTo = (p: number) => setPage(Math.min(Math.max(p, 0), totalPages - 1))

  return (
    <div className="relative">
      {/* grade */}
      <div className={`grid gap-4 ${gridClass}`}>
        {visible.map((item) => (
          <AdCard key={item.id} item={item} />
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