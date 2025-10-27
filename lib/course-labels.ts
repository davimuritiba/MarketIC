const BASE_COURSE_LABELS: Record<string, string> = {
  cc: "Ciência da Computação",
  ec: "Engenharia da Computação",
}

export function normalizeCourseValue(value: string) {
  return value.trim().toLowerCase()
}

export function resolveCourseLabel(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const normalized = normalizeCourseValue(value)
  return BASE_COURSE_LABELS[normalized] ?? value
}

export function getBaseCourseLabels() {
  return { ...BASE_COURSE_LABELS }
}
