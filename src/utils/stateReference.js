const COMPARABLE_STATUS = 'comparable'

export function getStateReferenceComparison(stateReference, indicatorKey, result, unit) {
  if (!stateReference || !indicatorKey || !result) return null
  if (unit !== 'percent') return null

  const indicator = stateReference.indicators?.[indicatorKey]
    ?? stateReference.registry?.[indicatorKey]
  if (!indicator || indicator.comparison_status !== COMPARABLE_STATUS) return null

  const municipalityYear = Number(result.end_year)
  const municipalityValue = Number(result.end_value)
  if (!Number.isFinite(municipalityYear) || !Number.isFinite(municipalityValue)) return null

  const series = Array.isArray(stateReference.indicators?.[indicatorKey]?.series)
    ? stateReference.indicators[indicatorKey].series
    : []
  const statePoint = series.find((point) => Number(point?.year ?? point?.ano) === municipalityYear)
  const stateValue = Number(statePoint?.value)
  if (
    !statePoint
    || statePoint.comparison_status !== COMPARABLE_STATUS
    || !Number.isFinite(stateValue)
  ) {
    return null
  }

  return {
    difference: municipalityValue - stateValue,
    municipalityValue,
    stateValue,
    year: municipalityYear,
  }
}

export function formatPpDifference(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  const sign = numeric > 0 ? '+' : ''
  return `${sign}${numeric.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })} p.p.`
}
