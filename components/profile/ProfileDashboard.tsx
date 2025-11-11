"use client"

import { useEffect, useState } from "react"

import { AdGridPager } from "@/components/AdCard"

import type { ProfileAdItem, ProfilePageData } from "@/types/profile"

import ProfileCard from "./PerfilCard"
import { ProfileAdGridPager } from "./ProfileAdGridPager"

export default function ProfileDashboard({
  user,
  activeAds,
  historyAds,
  acquiredItems,
  courses,
  reviews,
}: ProfilePageData) {
  const [activeItems, setActiveItems] = useState(activeAds)
  const [historyItems, setHistoryItems] = useState(historyAds)

  useEffect(() => {
    setActiveItems(activeAds)
  }, [activeAds])

  useEffect(() => {
    setHistoryItems(historyAds)
  }, [historyAds])

  const handleDelete = (itemId: string) => {
    setActiveItems((prev) => prev.filter((item) => item.id !== itemId))
    setHistoryItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const handleStatusChange = (updatedItem: ProfileAdItem) => {
    setActiveItems((prev) => prev.filter((item) => item.id !== updatedItem.id))
    setHistoryItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-10">
        <ProfileCard user={user} courses={courses} reviews={reviews} />
      </div>

      <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-10">
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Anúncios Ativos</h2>
          {activeItems.length > 0 ? (
            <ProfileAdGridPager
              items={activeItems}
              maxPerPage={4}
              gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
              showStatusActions
              onItemDelete={handleDelete}
              onItemStatusChange={handleStatusChange}
            />
          ) : (
            <p className="text-xl text-muted-foreground">
              Você não possui anúncios ativos
            </p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Itens sob interesse</h2>
          {acquiredItems.length > 0 ? (
            <AdGridPager
              items={acquiredItems}
              maxPerPage={4}
              gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            />
          ) : (
            <p className="text-xl text-muted-foreground">
              Nenhum item sob interesse no momento
            </p>
          )}
        </section>
      </div>

      <section className="col-span-12">
        <h2 className="text-2xl font-semibold mb-4">Histórico de Anúncios</h2>
        {historyItems.length > 0 ? (
          <ProfileAdGridPager
            items={historyItems}
            maxPerPage={5}
            gridClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            onItemDelete={handleDelete}
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
