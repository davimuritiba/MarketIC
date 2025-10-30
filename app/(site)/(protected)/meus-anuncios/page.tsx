import { redirect } from "next/navigation"

import MyAdsDashboard from "@/components/my-ads/MyAdsDashboard"
import { getSession } from "@/lib/auth"
import { getMyAdsDashboardData } from "@/lib/my-ads"

export default async function MeusAnunciosPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const data = await getMyAdsDashboardData(session.usuario_id)

  return <MyAdsDashboard data={data} />
}
