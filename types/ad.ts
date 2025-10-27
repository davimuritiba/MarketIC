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
