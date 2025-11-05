const ONLY_DIGITS_REGEX = /\D+/g

export function extractDigits(value: string) {
  return value.replace(ONLY_DIGITS_REGEX, "")
}

export function normalizeBrazilianPhone(value: string) {
  return extractDigits(value).slice(0, 11)
}

export function isValidBrazilianPhone(value: string | null | undefined) {
  if (!value) {
    return false
  }

  const digits = extractDigits(value)

  if (digits.length !== 11) {
    return false
  }

  return digits[2] === "9"
}

export function formatBrazilianPhone(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const digits = extractDigits(value)

  if (digits.length !== 11) {
    return value
  }

  const ddd = digits.slice(0, 2)
  const firstPart = digits.slice(2, 7)
  const secondPart = digits.slice(7)

  return `(${ddd}) ${firstPart}-${secondPart}`
}
