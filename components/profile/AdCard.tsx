"use client"

import { Card, CardContent } from "@/components/ui/card"
import { type ElementType, useState } from "react"
import { Gift, Repeat2, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react"

interface AdItem {
  title: string
  type: "Venda" | "Empréstimo" | "Doação"
  price?: string
  days?: number
  /** Estado de conservação. Ausente em anúncios de doação */
  condition?: "Novo" | "Seminovo" | "Usado"
}

const typeConfig: Record<AdItem["type"], { icon: ElementType; color: string }> = {
  Venda: { icon: ShoppingBag, color: "#EC221F" },
  Empréstimo: { icon: Repeat2, color: "#0A5C0A" },
  Doação: { icon: Gift, color: "#0B0B64" },
}

/** === Card individual (inalterado) === */
export default function AdCard({ item }: { item: AdItem }) {
  const { icon: Icon, color } = typeConfig[item.type]
  return (
    <Card className="p-4 border-2" style={{ borderColor: color }}>
      <div className="mb-4 aspect-square w-full rounded-md bg-muted" />
      <CardContent className="p-0 space-y-2">
        <div className="flex items-center gap-2" style={{ color }}>
          <Icon className="w-4 h-4" />
          <span className="font-medium">{item.type}</span>
        </div>
        <h3 className="font-medium">{item.title}</h3>
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {item.type === "Venda"
              ? item.price
              : item.type === "Empréstimo"
              ? `${item.days} dias`
              : "Não possui classificação"}
          </p>
          {item.type !== "Doação" && item.condition && (
            <span className="font-bold text-sm sm:text-base">{item.condition}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/** === Grade paginada com setas ===
 * Use:
 *  <AdGridPager items={activeAds} maxPerPage={4}
 *    gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4" />
 *
 *  <AdGridPager items={historyAds} maxPerPage={5}
 *    gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" />
 */
export function AdGridPager({
  items,
  maxPerPage,
  gridClass,
}: {
  items: AdItem[]
  maxPerPage: number // 4 (Ativos) | 5 (Histórico)
  gridClass: string  // defina as colunas responsivas
}) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(items.length / maxPerPage))
  const canPaginate = items.length > maxPerPage

  const start = page * maxPerPage
  const visible = items.slice(start, start + maxPerPage)

  const prev = () => setPage(p => Math.max(0, p - 1))
  const next = () => setPage(p => Math.min(totalPages - 1, p + 1))

  return (
    <div className="relative">
      {/* grade */}
      <div className={`grid gap-4 ${gridClass}`}>
        {visible.map((item, i) => (
          <AdCard key={`${item.title}-${start + i}`} item={item} />
        ))}
      </div>

      {/* controles */}
      {canPaginate && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={prev}
            disabled={page === 0}
            className="cursor-pointer rounded-full p-2 border disabled:opacity-40"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            disabled={page >= totalPages - 1}
            className="cursor-pointer rounded-full p-2 border disabled:opacity-40"
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
