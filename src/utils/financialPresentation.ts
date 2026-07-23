const EMPTY_DISPLAY_VALUES = new Set(['', '—'])

export function isPublishableFinancialValue(input: unknown): boolean {
  const value = input && typeof input === 'object' && 'value' in input
    ? (input as { value?: unknown }).value
    : input

  return typeof value === 'number' && Number.isFinite(value)
}

export function isPublishableFinancialDisplay(input: unknown): boolean {
  if (input === null || input === undefined) return false
  if (typeof input === 'number') return Number.isFinite(input)
  return !EMPTY_DISPLAY_VALUES.has(String(input).trim())
}

function hasPublishableFinancialSeries(
  series: readonly unknown[] | null | undefined,
  valueKey = 'valor',
): boolean {
  return Array.isArray(series) && series.some((point) => {
    if (!point || typeof point !== 'object') return false
    return isPublishableFinancialValue((point as Record<string, unknown>)[valueKey])
  })
}

export function isPublishableFinancialIndicator(indicator: {
  currentDisplay?: unknown
  series?: readonly unknown[] | null
} | null | undefined): boolean {
  if (!indicator) return false
  return isPublishableFinancialDisplay(indicator.currentDisplay)
    && hasPublishableFinancialSeries(indicator.series)
}
