import { prisma } from "@/lib/prisma"
import { getBaseCourseLabels, normalizeCourseValue, resolveCourseLabel,} from "@/lib/course-labels"

export interface CourseOption {
  value: string
  label: string
}

function buildCourseMapFromCodes(codes: (string | null | undefined)[]) {
  const baseLabels = getBaseCourseLabels()
  const map = new Map<string, string>(Object.entries(baseLabels))

  for (const code of codes) {
    if (!code) {
      continue
    }

    const normalized = normalizeCourseValue(code)
    if (!normalized) {
      continue
    }

    const label = resolveCourseLabel(normalized)
    map.set(normalized, label ?? normalized.toUpperCase())
  }

  return map
}

export function buildCourseOptionsFromCodes(
  codes: (string | null | undefined)[],
): CourseOption[] {
  const map = buildCourseMapFromCodes(codes)

  return Array.from(map.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
}

export async function getCourseOptions(): Promise<CourseOption[]> {
  const records = await prisma.usuario.findMany({
    select: { curso: true },
    distinct: ["curso"],
  })

  return buildCourseOptionsFromCodes(records.map((record) => record.curso))
}
