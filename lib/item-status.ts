import type { StatusAnuncio } from "@prisma/client"

import type { DashboardStatusLabel } from "@/types/my-ads"

export const DEFAULT_EXPIRATION_MONTHS = 2
export const REMOVAL_GRACE_PERIOD_MONTHS = 1

export const STATUS_LABEL: Record<StatusAnuncio, DashboardStatusLabel> = {
  PUBLICADO: "Publicado",
  INATIVO: "Inativo",
  FINALIZADO: "Finalizado",
  EXPIRADO: "Expirado",
}

export interface StatusSource {
  status: StatusAnuncio
  created_at: Date
  publicado_em: Date | null
  expira_em: Date | null
}

export interface StatusInfo {
  statusCode: StatusAnuncio
  statusLabel: DashboardStatusLabel
  publishedAt: Date
  expiresAt: Date | null
}

function addMonths(date: Date, months: number) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function resolveItemStatus(source: StatusSource): StatusInfo {
  const publishedAt = source.publicado_em ?? source.created_at
  const expiresAt =
    source.expira_em ??
    (publishedAt ? addMonths(publishedAt, DEFAULT_EXPIRATION_MONTHS) : null)

  let statusCode = source.status
  if (
    statusCode === "PUBLICADO" &&
    expiresAt &&
    expiresAt.getTime() <= Date.now()
  ) {
    statusCode = "EXPIRADO"
  }

  return {
    statusCode,
    statusLabel: STATUS_LABEL[statusCode],
    publishedAt,
    expiresAt,
  }
}

export function computeRemovalInfo(expiresAt: Date | null) {
  if (!expiresAt) {
    return { removalDate: null, removalCountdown: null }
  }

  const removalDate = addMonths(expiresAt, REMOVAL_GRACE_PERIOD_MONTHS)
  return {
    removalDate,
    removalCountdown: formatRemovalCountdown(removalDate),
  }
}

export function formatRemovalCountdown(removalDate: Date | null) {
  if (!removalDate) {
    return null
  }

  const diff = removalDate.getTime() - Date.now()

  if (diff <= 0) {
    return "Será removido em menos de 24 horas."
  }

  const MS_IN_DAY = 86_400_000
  const MS_IN_HOUR = 3_600_000

  const days = Math.floor(diff / MS_IN_DAY)
  if (days > 0) {
    return `Será removido em ${days} dia${days > 1 ? "s" : ""}.`
  }

  const hours = Math.floor((diff % MS_IN_DAY) / MS_IN_HOUR)
  if (hours > 0) {
    return `Será removido em ${hours} hora${hours > 1 ? "s" : ""}.`
  }

  const minutes = Math.max(1, Math.floor((diff % MS_IN_HOUR) / 60000))
  return `Será removido em ${minutes} minuto${minutes > 1 ? "s" : ""}.`
}
