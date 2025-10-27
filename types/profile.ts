export type TransactionLabel = "Venda" | "Empréstimo" | "Doação" | "Troca"

export type ConditionLabel = "Novo" | "Seminovo" | "Usado"

export interface CourseOption {
  value: string
  label: string
}

export interface AdItem {
  id: string
  href: string
  title: string
  type: "Venda" | "Empréstimo" | "Doação" | "Troca"
  price?: string
  days?: number
  condition?: "Novo" | "Seminovo" | "Usado"
  rating?: number
  reviews?: number
  image?: string
}


export interface ProfileAdItem extends AdItem {}

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
  acquiredItems: ProfileAdItem[]
}
