"use client"

import Link from "next/link"

import AdCard, { AdGridPager } from "@/components/AdCard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { DashboardAdItem, MyAdsData } from "@/types/my-ads"

interface MyAdsDashboardProps {
  data: MyAdsData
}

const STATUS_BADGE_COLORS: Record<DashboardAdItem["statusLabel"], string> = {
  Publicado: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Finalizado: "bg-slate-100 text-slate-700 border-slate-200",
  Inativo: "bg-amber-100 text-amber-700 border-amber-200",
  Expirado: "bg-red-100 text-red-700 border-red-200",
}

export default function MyAdsDashboard({ data }: MyAdsDashboardProps) {
  const counts = {
    publicados: data.publicados.length,
    finalizados: data.finalizados.length,
    inativos: data.inativos.length,
    expirados: data.expirados.length,
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">Meus Anúncios</h1>

      <Tabs defaultValue="publicados" className="w-full">
        <TabsList className="flex h-auto w-full overflow-x-auto whitespace-nowrap justify-between sm:justify-center gap-4 sm:gap-8 bg-transparent p-0 border-b border-neutral-300">
          <TabItem value="publicados" label="Publicados" count={counts.publicados} />
          <TabItem value="finalizados" label="Finalizados" count={counts.finalizados} />
          <TabItem value="inativos" label="Inativos" count={counts.inativos} />
          <TabItem value="expirados" label="Expirados" count={counts.expirados} />
        </TabsList>

        <TabsContent value="publicados" className="mt-10">
          {counts.publicados === 0 ? (
            <EmptyState />
          ) : (
            <AdGridPager
              items={data.publicados}
              maxPerPage={4}
              gridClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              renderActions={(item) => (
                <StatusBadge status={(item as DashboardAdItem).statusLabel} />
              )}
            />
          )}
        </TabsContent>

        <TabsContent value="finalizados" className="mt-10">
          {counts.finalizados === 0 ? (
            <EmptyState subtitle="Sem anúncios finalizados no momento." />
          ) : (
            <AdGridPager
              items={data.finalizados}
              maxPerPage={4}
              gridClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              renderActions={(item) => (
                <StatusBadge status={(item as DashboardAdItem).statusLabel} />
              )}
            />
          )}
        </TabsContent>

        <TabsContent value="inativos" className="mt-10">
          {counts.inativos === 0 ? (
            <EmptyState subtitle="Você pode inativar anúncios que não deseja exibir temporariamente." />
          ) : (
            <AdGridPager
              items={data.inativos}
              maxPerPage={4}
              gridClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              renderActions={(item) => (
                <StatusBadge status={(item as DashboardAdItem).statusLabel} />
              )}
            />
          )}
        </TabsContent>

        <TabsContent value="expirados" className="mt-10">
          {counts.expirados === 0 ? (
            <EmptyState subtitle="Sem anúncios expirados no momento." />
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-neutral-600">
                Anúncios expirados permanentemente são totalmente excluídos do sistema.
              </p>
              <Button className="bg-[#1500FF] hover:bg-[#1200d6] px-12 h-10 sm:h-10 text-sm sm:text-base cursor-pointer">
                Renovar
              </Button>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {data.expirados.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <AdCard
                      item={item}
                      actions={<StatusBadge status={item.statusLabel} />}
                    />
                    {item.removalCountdown ? (
                      <p className="text-sm text-neutral-600">
                        O anúncio "{item.title}" {item.removalCountdown}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TabItem({
  value,
  label,
  count,
}: {
  value: string
  label: string
  count: number
}) {
  return (
    <TabsTrigger
      value={value}
      className={[
        "relative rounded-none bg-transparent px-0 pb-3 text-sm sm:text-base cursor-pointer",
        "data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:hover:bg-transparent",
        "after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[2px] after:bg-blue-600",
        "after:scale-x-0 data-[state=active]:after:scale-x-100 after:origin-left after:transition-transform",
      ].join(" ")}
    >
      <span className="underline underline-offset-4">{label}</span>
      <span className="ml-2 text-neutral-600">({count})</span>
    </TabsTrigger>
  )
}

function StatusBadge({ status }: { status: DashboardAdItem["statusLabel"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_BADGE_COLORS[status]}`}
    >
      {status}
    </span>
  )
}

function EmptyState({
  title = "Você ainda não possui anúncios",
  subtitle = "Comece agora, sem perder mais tempo",
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <section className="min-h-[48vh] grid place-items-center">
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-24 h-24 rounded-full bg-neutral-200 grid place-items-center overflow-hidden">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/images/marketic avatar logo.png" alt="MarketIC" />
            <AvatarFallback>MK</AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="text-lg text-neutral-700">{subtitle}</p>
        </div>

        <Button asChild size="lg" className="bg-[#1500FF] hover:bg-[#1200d6] px-8 h-12 text-lg">
          <Link href="/anunciar/novo">Novo Anúncio</Link>
        </Button>
      </div>
    </section>
  )
}
