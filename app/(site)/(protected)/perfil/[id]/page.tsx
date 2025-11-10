import { notFound } from "next/navigation"

import PublicProfileDashboard from "@/components/profile/PublicProfileDashboard"
import { getPublicProfilePageData } from "@/lib/profile"

interface PublicProfilePageProps {
  params: { id: string }
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const data = await getPublicProfilePageData(params.id)

  if (!data) {
    notFound()
  }

  return <PublicProfileDashboard {...data} />
}
