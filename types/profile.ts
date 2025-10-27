export type TransactionLabel = "Venda" | "Empréstimo" | "Doação" | "Troca"

export type ConditionLabel = "Novo" | "Seminovo" | "Usado"

import type { AdItem } from "@/types/ad"

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
