import type {
  DisplayPercentage,
  EducationAttendancePoint,
  EducationProjectedIndicator,
} from './educationAttendanceTypes'

export interface EducationProjectionViewContract {
  available: boolean
  displayWasCapped: boolean
  distance_to_target_2036?: number | null
  historical_display: DisplayPercentage[]
  historical_percent: Array<number | null>
  historical_years: number[]
  projected_2036: number | null
  projected_display: DisplayPercentage[]
  projected_end_year: number | null
  projected_percent: Array<number | null>
  raw_historical_percent: Array<number | null>
  raw_projected_2036: number | null
  raw_projected_percent: Array<number | null>
  target_label?: string
  target_percent?: number | null
  target_year?: number | null
  warnings: string[]
  years: number[]
}

const EXCLUDED_PROJECTION_IDENTIFIERS = new Set([
  'constant',
  'last_components',
  'last_value',
  'maintenance',
  'persistence',
])

function finiteRawValue(point: EducationAttendancePoint | undefined): number | null {
  return point?.rawValue != null && Number.isFinite(point.rawValue) ? point.rawValue : null
}

function referenceTrajectory(indicator: EducationProjectedIndicator): EducationAttendancePoint[] {
  if (indicator.kind !== 'integral_coverage') return []
  return (indicator.reference.trajectory ?? []).map((point) => ({
    denominator: point.denominator ?? null,
    numerator: point.numerator ?? null,
    rawValue: point.rawValue ?? point.value ?? null,
    year: point.year,
  }))
}

export function getProjectionPoints(indicator: EducationProjectedIndicator): EducationAttendancePoint[] {
  const configuredTrajectory = referenceTrajectory(indicator)
  return configuredTrajectory.length > 0 ? configuredTrajectory : indicator.scenario?.projected ?? []
}

/**
 * Regra única para publicação na página. Metadados semânticos são avaliados
 * primeiro; a comparação numérica usa os valores brutos, sem arredondamento.
 */
export function isDisplayableProjection(indicator: EducationProjectedIndicator | null | undefined): boolean {
  if (!indicator) return false

  const historical = indicator.historical
    .filter((point) => Number.isFinite(point.year) && finiteRawValue(point) != null)
    .sort((left, right) => left.year - right.year)
  const lastObserved = historical[historical.length - 1]
  const lastObservedValue = finiteRawValue(lastObserved)
  if (!lastObserved || lastObservedValue == null) return false

  const future = getProjectionPoints(indicator)
    .filter((point) => point.year > lastObserved.year && finiteRawValue(point) != null)
    .sort((left, right) => left.year - right.year)
  const finalPoint = future[future.length - 1]
  if (!finalPoint || finiteRawValue(finalPoint) == null) return false

  const isPlanningTrajectory = indicator.kind === 'integral_coverage'
    && (referenceTrajectory(indicator).length > 0 || indicator.scenario?.type === 'pne_reference_trajectory')
  if (isPlanningTrajectory) return true

  if (!indicator.scenario || indicator.scenario.status !== 'available') return false

  const semanticIdentifiers = [
    indicator.scenario.type,
    indicator.scenario.model,
    indicator.scenario.method,
  ]
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toLowerCase())

  if (semanticIdentifiers.some((value) => EXCLUDED_PROJECTION_IDENTIFIERS.has(value))) {
    return false
  }

  return !future.every((point) => finiteRawValue(point) === lastObservedValue)
}

export function toDisplayPercentage(rawValue: number | null | undefined): DisplayPercentage {
  if (rawValue == null || !Number.isFinite(rawValue)) {
    return { displayValue: null, displayWasCapped: false, rawValue: null }
  }

  return {
    displayValue: Math.min(Math.max(rawValue, 0), 100),
    displayWasCapped: rawValue > 100,
    rawValue,
  }
}

function targetFor(indicator: EducationProjectedIndicator, finalYear: number | null) {
  if (indicator.kind === 'age_coverage') return indicator.reference
  const targets = indicator.reference.targets
  return targets.find((target) => target.year === finalYear) ?? targets[targets.length - 1] ?? null
}

export function toProjectionView(indicator: EducationProjectedIndicator): EducationProjectionViewContract {
  const projected = getProjectionPoints(indicator)
    .filter((point) => point.year > (indicator.observed?.year ?? -Infinity))
    .sort((left, right) => left.year - right.year)
  const historicalDisplay = indicator.historical.map((point) => toDisplayPercentage(point.rawValue))
  const projectedDisplay = projected.map((point) => toDisplayPercentage(point.rawValue))
  const finalPoint = projected[projected.length - 1]
  const finalRawValue = finiteRawValue(finalPoint)
  const finalDisplayValue = toDisplayPercentage(finalRawValue).displayValue
  const finalYear = finalPoint?.year ?? null
  const target = targetFor(indicator, finalYear)
  const comparableTarget = target && target.year === finalYear ? target : null

  return {
    available: isDisplayableProjection(indicator),
    displayWasCapped: [...historicalDisplay, ...projectedDisplay].some((point) => point.displayWasCapped),
    distance_to_target_2036: comparableTarget && finalDisplayValue != null
      ? finalDisplayValue - comparableTarget.value
      : null,
    historical_display: historicalDisplay,
    historical_percent: historicalDisplay.map((point) => point.displayValue),
    historical_years: indicator.historical.map((point) => point.year),
    projected_2036: finalDisplayValue,
    projected_display: projectedDisplay,
    projected_end_year: finalYear,
    projected_percent: projectedDisplay.map((point) => point.displayValue),
    raw_historical_percent: indicator.historical.map((point) => point.rawValue),
    raw_projected_2036: finalRawValue,
    raw_projected_percent: projected.map((point) => point.rawValue),
    target_label: target ? 'Meta do PNE' : undefined,
    target_percent: target?.value ?? null,
    target_year: target?.year ?? null,
    warnings: indicator.diagnostics.warnings,
    years: projected.map((point) => point.year),
  }
}
