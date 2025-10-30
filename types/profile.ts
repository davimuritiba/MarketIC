import type { AdItem as CardAdItem } from "@/components/AdCard"
import type { DashboardStatusLabel } from "@/types/meus-anuncios"

export type TransactionLabel = "Venda" | "Empréstimo" | "Doação"
export type ConditionLabel = "Novo" | "Seminovo" | "Usado"

export interface CourseOption {
  value: string
  label: string
}

export interface ProfileAdItem extends CardAdItem {
  statusCode: "PUBLICADO" | "INATIVO" | "FINALIZADO" | "EXPIRADO"
  statusLabel: DashboardStatusLabel
  publishedAt: string
  expiresAt: string | null
}

export interface ProfileUserData {
  id: string
  nome: string
  emailInstitucional: string
  telefone: string | null
  curso: string | null
  dataNascimento: string | null
  fotoDocumentoUrl: string | null
  reputacaoMedia: number | null
  reputacaoCount: number
  cpf: string
  rg: string
}

export interface ProfilePageData {
  user: ProfileUserData
  activeAds: ProfileAdItem[]
  historyAds: ProfileAdItem[]
  acquiredItems: CardAdItem[]
  courses: CourseOption[]
}
