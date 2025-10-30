import ProfileDashboard from "@/components/profile/ProfileDashboard"

import { getSession } from "@/lib/auth"
import { getProfilePageData } from "@/lib/profile"

export default async function PerfilPage() {
  const session = await getSession()

  if (!session) {
    return null
  }

  const data = await getProfilePageData(session.usuario_id)

  return <ProfileDashboard {...data} />
}
