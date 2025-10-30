import type { AdItem } from "@/components/AdCard"

export type DashboardStatusLabel =
  | "Publicado"
  | "Finalizado"
  | "Inativo"
  | "Expirado"

export interface DashboardAdItem extends AdItem {
  statusCode: "PUBLICADO" | "FINALIZADO" | "INATIVO" | "EXPIRADO"
  statusLabel: DashboardStatusLabel
  publishedAt: string
  expiresAt: string | null
  removalDate: string | null
  removalCountdown: string | null
}

export interface MyAdsData {
  publicados: DashboardAdItem[]
  finalizados: DashboardAdItem[]
  inativos: DashboardAdItem[]
  expirados: DashboardAdItem[]
}
