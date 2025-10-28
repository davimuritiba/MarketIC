import ProfileCard from "@/components/profile/PerfilCard"
import { AdGridPager } from "@/components/AdCard"
import { ProfileAdGridPager } from "@/components/profile/ProfileAdGridPager"

import { getSession } from "@/lib/auth"
import { getProfilePageData } from "@/lib/profile"

export default async function PerfilPage() {
  const session = await getSession()

  if (!session) {
    return null
  }

  const { user, activeAds, historyAds, acquiredItems, courses } =
    await getProfilePageData(
      session.usuario_id,
    )

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
      {/* Coluna esquerda */}
      <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-10">
        <ProfileCard user={user} courses={courses} />
      </div>

      {/* Coluna direita */}
      <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-10">
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Anúncios Ativos</h2>
          {activeAds.length > 0 ? (
            <ProfileAdGridPager
              items={activeAds}
              maxPerPage={4}
              gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            />
          ) : (
            <p className="text-xl text-muted-foreground">
              Você não possui anúncios ativos
            </p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Itens adquiridos</h2>
          {acquiredItems.length > 0 ? (
            <AdGridPager
              items={acquiredItems}
              maxPerPage={4}
              gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            />
          ) : (
            <p className="text-xl text-muted-foreground">
              Nenhum item adquirido ainda
            </p>
          )}
        </section>
      </div>

      {/* Histórico ocupando toda a linha inferior */}
      <section className="col-span-12">
        <h2 className="text-2xl font-semibold mb-4">Histórico de Anúncios</h2>
        {historyAds.length > 0 ? (
          <ProfileAdGridPager
            items={historyAds}
            maxPerPage={5}
            gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          />
        ) : (
          <p className="text-xl text-muted-foreground">
            Você ainda não criou nenhum anúncio
          </p>
        )}
      </section>
    </div>
  )
}
