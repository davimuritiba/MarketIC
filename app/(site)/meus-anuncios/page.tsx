// app/(site)/meus-anuncios/page.tsx
"use client";

import Link from "next/link";
import { Tabs,TabsList, TabsTrigger, TabsContent, } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdGridPager } from "@/components/AdCard";

export default function MeusAnunciosPage() {
  const publicados: any[] = [];
  const aguardando: any[] = [];
  const inativos: any[] = [];

  const finalizados = [
    { title: "Produto A", type: "Venda" as "Venda", price: "R$ 100,00", condition: "Novo" as "Novo" },
    { title: "Produto B", type: "Empréstimo" as "Empréstimo", days: 7, condition: "Seminovo" as "Seminovo" },
    { title: "Produto C", type: "Doação" as "Doação" },
  ];

  const expirados = [
    { title: "Produto D", type: "Venda" as "Venda", price: "R$ 50,00", condition: "Usado" as "Usado" },
    { title: "Produto E", type: "Empréstimo" as "Empréstimo", days: 14, condition: "Seminovo" as "Seminovo" },
  ];

  const counts = {
    publicados: publicados.length,
    aguardando: aguardando.length,
    finalizados: finalizados.length,
    inativos: inativos.length,
    expirados: expirados.length,
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">Meu Anúncios</h1>

      <Tabs defaultValue="publicados" className="w-full">
        {/* Abas */}
        <TabsList
          className="flex h-auto w-full overflow-x-auto whitespace-nowrap justify-between sm:justify-center gap-4 sm:gap-8 bg-transparent p-0 border-b border-neutral-300"
        >
          <TabItem value="publicados" label="Publicados" count={counts.publicados} />
          <TabItem
            value="aguardando"
            label="Aguardando Publicação"
            count={counts.aguardando}
          />
          <TabItem value="finalizados" label="Finalizados" count={counts.finalizados} />
          <TabItem value="inativos" label="Inativos" count={counts.inativos} />
          <TabItem value="expirados" label="Expirados" count={counts.expirados} />
        </TabsList>

        {/* Conteúdo das abas */}
        <TabsContent value="publicados" className="mt-10">
          {counts.publicados === 0 ? (
            <EmptyState />
          ) : (
            <div> {/* tabela de anúncios publicados aqui */}</div>
          )}
        </TabsContent>

        <TabsContent value="aguardando" className="cursor-pointer mt-10">
          {counts.aguardando === 0 ? (
            <EmptyState subtitle="Quando seus anúncios forem aprovados, aparecerão aqui." />
          ) : (
            <div>{/* lista aguardando */}</div>
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
            />
          )}
        </TabsContent>

        <TabsContent value="inativos" className="mt-10">
          {counts.inativos === 0 ? (
            <EmptyState subtitle="Você pode inativar anúncios que não deseja exibir temporariamente." />
          ) : (
            <div>{/* inativos */}</div>
          )}
        </TabsContent>

        <TabsContent value="expirados" className="mt-10">
          {counts.expirados === 0 ? (
            <EmptyState subtitle="Sem anúncios expirados no momento." />
          ) : (
            <div className="space-y-4">
              <Button className="bg-[#1500FF] hover:bg-[#1200d6] px-6 h-10 sm:h-12 text-sm sm:text-base">Renovar</Button>
              <AdGridPager
                items={expirados}
                maxPerPage={4}
                gridClass="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              />
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
