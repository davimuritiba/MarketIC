import ProfileCard from "@/components/profile/PerfilCard"
import { AdGridPager } from "@/components/AdCard"

export default function PerfilPage() {
  const activeAds = [
    { title: "Livro X", type: "Venda" as const, price: "R$ 39,90", condition: "Novo" as "Novo" },
    { title: "Calculadora", type: "Empréstimo" as const, days: 7, condition: "Seminovo" as "Seminovo" },
    { title: "Memória RAM", type: "Doação" as const },
    { title: "Monitor", type: "Venda" as const, price: "R$ 499,90", condition: "Seminovo" as "Seminovo" },
    { title: "Teclado", type: "Empréstimo" as const, days: 10, condition: "Usado" as "Usado" },
  ]

  const historyAds = [
    { title: "Impressora HP", type: "Venda" as const, price: "R$ 299,00", condition: "Usado" as "Usado" },
    { title: "Xbox 360", type: "Empréstimo" as const, days: 30, condition: "Seminovo" as "Seminovo" },
    { title: "Fone de ouvido", type: "Doação" as const },
    { title: "Notebook", type: "Venda" as const, price: "R$ 1.000,00", condition: "Usado" as "Usado" },
    { title: "Câmera", type: "Empréstimo" as const, days: 14, condition: "Novo" as "Novo" },
    { title: "HD Externo", type: "Doação" as const },
  ]

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
      {/* Coluna esquerda */}
      <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-10">
        <ProfileCard />
      </div>

      {/* Coluna direita */}
      <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-10">
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Anúncios Ativos</h2>
          <AdGridPager
            items={activeAds}
            maxPerPage={4}
            gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Itens adquiridos</h2>
          <p className="text-xl text-muted-foreground">
            Nenhum item adquirido ainda
          </p>
        </section>
      </div>

      {/* Histórico ocupando toda a linha inferior */}
      <section className="col-span-12">
        <h2 className="text-2xl font-semibold mb-4">Histórico de Anúncios</h2>
        <AdGridPager
          items={historyAds}
          maxPerPage={5}
          gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        />
      </section>
    </div>
  )
}
