import { notFound } from "next/navigation"

import PublicProfileDashboard from "@/components/profile/PublicProfileDashboard"
import { getSession } from "@/lib/auth"
import { getPublicProfilePageData } from "@/lib/profile"

interface PublicProfilePageProps {
  params: { id: string }
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const session = await getSession()
  const data = await getPublicProfilePageData(
    params.id,
    session?.usuario_id ?? null,
  )

  if (!data) {
    notFound()
  }

  return <PublicProfileDashboard {...data} />
}
