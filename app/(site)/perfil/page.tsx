import ProfileCard from "@/components/profile/PerfilCard"

export default function PerfilPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
      {/* Coluna esquerda */}
      <div className="col-span-12 md:col-span-4 lg:col-span-3">
        <ProfileCard />
      </div>

      {/* Conteúdo direito */}
      <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-10">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Anúncios Ativos</h2>
          {/* Aqui entram cards de anúncios */}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Itens adquiridos</h2>
          <p className="text-sm text-muted-foreground">
            Nenhum item adquirido ainda
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Histórico de Anúncios</h2>
          {/* grid com cards */}
        </section>
      </div>
    </div>
  )
}
