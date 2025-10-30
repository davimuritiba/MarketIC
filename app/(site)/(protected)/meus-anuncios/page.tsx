// app/(site)/meus-anuncios/page.tsx
"use client";

import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdCard, { AdGridPager, type AdItem } from "@/components/AdCard";

export default function MeusAnunciosPage() {
  const ads: DashboardAd[] = baseAds.map(enrichAdWithStatus);

  const publicados = ads.filter((ad) => ad.status === "Publicado");
  const finalizados = ads.filter((ad) => ad.status === "Finalizado");
  const inativos = ads.filter((ad) => ad.status === "Inativo");
  const expirados = ads.filter((ad) => ad.status === "Expirado");

  const counts = {
    publicados: publicados.length,
    finalizados: finalizados.length,
    inativos: inativos.length,
    expirados: expirados.length,
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">Meus Anúncios</h1>

      <Tabs defaultValue="publicados" className="w-full">
        {/* Abas */}
        <TabsList
          className="flex h-auto w-full overflow-x-auto whitespace-nowrap justify-between sm:justify-center gap-4 sm:gap-8 bg-transparent p-0 border-b border-neutral-300"
        >
          <TabItem value="publicados" label="Publicados" count={counts.publicados} />
          <TabItem value="finalizados" label="Finalizados" count={counts.finalizados} />
          <TabItem value="inativos" label="Inativos" count={counts.inativos} />
          <TabItem value="expirados" label="Expirados" count={counts.expirados} />
        </TabsList>

        {/* Conteúdo das abas */}
        <TabsContent value="publicados" className="mt-10">
          {counts.publicados === 0 ? (
            <EmptyState />
          ) : (
            <AdGridPager
              items={publicados}
              maxPerPage={4}
              gridClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              renderActions={(item) => (
                <StatusBadge status={(item as DashboardAd).status} />
              )}
            />
          )}
        </TabsContent>

        <TabsContent value="finalizados" className="mt-10">
          {counts.finalizados === 0 ? (
            <EmptyState subtitle="Sem anúncios finalizados no momento." />
          ) : (
            <AdGridPager
              items={finalizados}
              maxPerPage={4}
              gridClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              renderActions={(item) => (
                <StatusBadge status={(item as DashboardAd).status} />
              )}
            />
          )}
        </TabsContent>

        <TabsContent value="inativos" className="mt-10">
          {counts.inativos === 0 ? (
            <EmptyState subtitle="Você pode inativar anúncios que não deseja exibir temporariamente." />
          ) : (
            <AdGridPager
              items={inativos}
              maxPerPage={4}
              gridClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              renderActions={(item) => (
                <StatusBadge status={(item as DashboardAd).status} />
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
                {expirados.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <AdCard item={item} actions={<StatusBadge status={item.status} />} />
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
  );
}

function TabItem({
  value,
  label,
  count,
}: {
  value: string;
  label: string;
  count: number;
}) {
  // Trigger com “underline” animado e contador
  return (
    <TabsTrigger
      value={value}
      className={[
        "relative rounded-none bg-transparent px-0 pb-3 text-sm sm:text-base cursor-pointer",
        "data-[state=active]:text-blue-700 data-[state=active]:bg-transparent data-[state=active]:hover:bg-transparent",
        // underline
        "after:absolute after:left-0 after:right-0 after:-bottom-[1px] after:h-[2px] after:bg-blue-600",
        "after:scale-x-0 data-[state=active]:after:scale-x-100 after:origin-left after:transition-transform",
      ].join(" ")}
    >
      <span className="underline underline-offset-4">{label}</span>
      <span className="ml-2 text-neutral-600">({count})</span>
    </TabsTrigger>
  );
}

type AdStatus = "Publicado" | "Finalizado" | "Inativo" | "Expirado";

type BaseAd = AdItem & {
  postedAt: string;
  finalizedAt?: string;
  inactivatedAt?: string;
  expiredAt?: string;
};

type DashboardAd = ReturnType<typeof enrichAdWithStatus>;

const baseAds: BaseAd[] = [
  {
    id: "anuncio-1",
    href: "/produto/anuncio-1",
    title: "Câmera DSLR Canon",
    type: "Venda" as const,
    price: "R$ 2.400,00",
    condition: "Seminovo" as const,
    postedAt: monthsAgo(1),
  },
  {
    id: "anuncio-2",
    href: "/produto/anuncio-2",
    title: "Furadeira Profissional",
    type: "Empréstimo" as const,
    days: 5,
    condition: "Usado" as const,
    postedAt: monthsAgo(1.8),
  },
  {
    id: "anuncio-3",
    href: "/produto/anuncio-3",
    title: "Coleção de Livros Clássicos",
    type: "Doação" as const,
    postedAt: monthsAgo(5),
    finalizedAt: monthsAgo(1),
  },
  {
    id: "anuncio-4",
    href: "/produto/anuncio-4",
    title: "Notebook Gamer",
    type: "Venda" as const,
    price: "R$ 6.800,00",
    condition: "Novo" as const,
    postedAt: monthsAgo(2),
    inactivatedAt: weeksAgo(2),
  },
  {
    id: "anuncio-5",
    href: "/produto/anuncio-5",
    title: "Violão Acústico",
    type: "Venda" as const,
    price: "R$ 450,00",
    condition: "Seminovo" as const,
    postedAt: monthsAgo(4),
    finalizedAt: monthsAgo(2),
  },
  {
    id: "anuncio-6",
    href: "/produto/anuncio-6",
    title: "Bicicleta Urbana",
    type: "Empréstimo" as const,
    days: 10,
    condition: "Seminovo" as const,
    postedAt: monthsAgo(0.5),
  },
  {
    id: "anuncio-7",
    href: "/produto/anuncio-7",
    title: "Kit de Ferramentas",
    type: "Empréstimo" as const,
    days: 7,
    condition: "Usado" as const,
    postedAt: monthsAgo(6),
    expiredAt: weeksAgo(3),
  },
  {
    id: "anuncio-8",
    href: "/produto/anuncio-8",
    title: "Impressora Multifuncional",
    type: "Venda" as const,
    price: "R$ 320,00",
    condition: "Usado" as const,
    postedAt: monthsAgo(2.6),
  },
];

function enrichAdWithStatus(ad: (typeof baseAds)[number]) {
  const postedAt = new Date(ad.postedAt);
  const expirationDate = ad.expiredAt
    ? new Date(ad.expiredAt)
    : addMonths(postedAt, 2);
  const removalDate = addMonths(expirationDate, 1);
  const status = determineStatus({ ...ad, postedAt, expirationDate });

  return {
    ...ad,
    postedAt,
    status,
    expirationDate,
    removalDate,
    removalCountdown:
      status === "Expirado" ? formatRemovalCountdown(removalDate) : "",
  } satisfies AdItem & {
    status: AdStatus;
    postedAt: Date;
    expirationDate: Date;
    removalDate: Date;
    removalCountdown: string;
  };
}

function determineStatus(ad: {
  postedAt: Date;
  expirationDate: Date;
  finalizedAt?: string;
  inactivatedAt?: string;
}) {
  if (ad.finalizedAt) {
    return "Finalizado" as const;
  }

  if (ad.inactivatedAt) {
    return "Inativo" as const;
  }

  const now = new Date();
  if (now >= ad.expirationDate) {
    return "Expirado" as const;
  }

  return "Publicado" as const;
}

function StatusBadge({ status }: { status: AdStatus }) {
  const colors: Record<AdStatus, string> = {
    Publicado: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Finalizado: "bg-slate-100 text-slate-700 border-slate-200",
    Inativo: "bg-amber-100 text-amber-700 border-amber-200",
    Expirado: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${colors[status]}`}
    >
      {status}
    </span>
  );
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function monthsAgo(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - Math.floor(months));
  const fractional = months - Math.floor(months);
  if (fractional > 0) {
    const days = Math.round(fractional * 30);
    date.setDate(date.getDate() - days);
  }
  return date.toISOString();
}

function weeksAgo(weeks: number) {
  const date = new Date();
  date.setDate(date.getDate() - weeks * 7);
  return date.toISOString();
}

function formatRemovalCountdown(removalDate: Date) {
  const now = new Date();
  const diff = removalDate.getTime() - now.getTime();

  if (diff <= 0) {
    return "Será removido em menos de 24 horas.";
  }

  const MS_IN_DAY = 1000 * 60 * 60 * 24;
  const MS_IN_HOUR = 1000 * 60 * 60;
  const days = Math.floor(diff / MS_IN_DAY);

  if (days > 0) {
    return `Será removido em ${days} dia${days > 1 ? "s" : ""}.`;
  }

  const hours = Math.floor((diff % MS_IN_DAY) / MS_IN_HOUR);
  if (hours > 0) {
    return `Será removido em ${hours} hora${hours > 1 ? "s" : ""}.`;
  }

  const minutes = Math.max(1, Math.floor((diff % MS_IN_HOUR) / (1000 * 60)));
  return `Será removido em ${minutes} minuto${minutes > 1 ? "s" : ""}.`;
}

function EmptyState({
  title = "Você ainda não possui anúncios",
  subtitle = "Comece agora, sem perder mais tempo",
}: {
  title?: string;
  subtitle?: string;
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
  );
}
