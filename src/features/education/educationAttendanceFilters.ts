import { isDisplayableProjection } from './educationAttendancePresentation.js'
import type {
  EducationAttendanceIndicatorKey,
  EducationAttendancePayload,
  EducationProjectedIndicator,
} from './educationAttendanceTypes'

export type IndicatorTypeKey = 'coverage' | 'integral'
export type CutKey = 'all' | 'infantil' | 'fundamental' | 'medio' | 'combined' | 'overall'

export interface DisplayableAttendanceItem {
  cut: Exclude<CutKey, 'all'>
  indicator: EducationProjectedIndicator
  type: IndicatorTypeKey
}

export const TYPE_LABELS: Record<IndicatorTypeKey, string> = {
  coverage: 'Cobertura',
  integral: 'Tempo integral',
}

export const CUT_LABELS: Record<Exclude<CutKey, 'all'>, string> = {
  infantil: 'Educação Infantil',
  fundamental: 'Ensino Fundamental',
  medio: 'Ensino Médio',
  combined: 'Faixas combinadas',
  overall: 'Educação básica',
}

const TYPE_ORDER: IndicatorTypeKey[] = ['coverage', 'integral']
const CUT_ORDER: Array<Exclude<CutKey, 'all'>> = ['infantil', 'fundamental', 'medio', 'combined', 'overall']

const AGE_CUTS: Record<EducationAttendanceIndicatorKey, Exclude<CutKey, 'all'>> = {
  creche: 'infantil',
  pre_escola: 'infantil',
  infantil_0_5: 'infantil',
  escolar_6_14: 'fundamental',
  basico_15_17: 'medio',
  basico_6_17: 'combined',
  obrigatoria_4_17: 'combined',
}

export function getDisplayableAttendanceItems(
  payload: EducationAttendancePayload | null | undefined,
): DisplayableAttendanceItem[] {
  if (!payload) return []
  const coverage = Object.values(payload.ageCoverage ?? {})
    .filter(isDisplayableProjection)
    .map((indicator) => ({
      cut: AGE_CUTS[indicator.indicatorKey],
      indicator,
      type: 'coverage' as const,
    }))
  const overall = payload.integral?.overall
  const integral = overall && isDisplayableProjection(overall)
    ? [{ cut: 'overall' as const, indicator: overall, type: 'integral' as const }]
    : []
  return [...coverage, ...integral]
}

export function getAvailableIndicatorTypes(items: DisplayableAttendanceItem[]): IndicatorTypeKey[] {
  return TYPE_ORDER.filter((type) => items.some((item) => item.type === type))
}

export function getAvailableCuts(
  items: DisplayableAttendanceItem[],
  type: IndicatorTypeKey | undefined,
): CutKey[] {
  if (!type) return []
  const available = CUT_ORDER.filter((cut) => items.some((item) => item.type === type && item.cut === cut))
  return available.length > 1 ? ['all', ...available] : available
}

export function getVisibleAttendanceItems(
  items: DisplayableAttendanceItem[],
  type: IndicatorTypeKey | undefined,
  cut: CutKey | undefined,
): DisplayableAttendanceItem[] {
  return items.filter((item) => item.type === type && (cut === 'all' || item.cut === cut))
}

export function getMetricGridClass(cardCount: number): string {
  const columns = Math.max(1, Math.min(4, Math.trunc(cardCount)))
  return `metric-grid--${['one', 'two', 'three', 'four'][columns - 1]}`
}
