"use client"

import { AdGridPager } from "@/components/AdCard"

import type { PublicProfilePageData } from "@/types/profile"

import PublicProfileCard from "./PublicProfileCard"

export default function PublicProfileDashboard({
  user,
  activeAds,
}: PublicProfilePageData) {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-10">
        <PublicProfileCard user={user} />
      </div>

      <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-10">
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Anúncios Ativos</h2>
          {activeAds.length > 0 ? (
            <AdGridPager
              items={activeAds}
              maxPerPage={4}
              gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            />
          ) : (
            <p className="text-xl text-muted-foreground">
              Este usuário não possui anúncios ativos
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
