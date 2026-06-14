export function getDisplayValue(display, key, fallback = '-') {
  return display?.[key] ?? fallback
}

export function getCategoryItems(indicadores, cycle, categoryKey) {
  const categories = indicadores?.cycles?.[cycle]?.categories ?? []
  return categories.find((category) => category.key === categoryKey)?.items ?? []
}

export function getCycleCategories(indicadores, cycle) {
  return indicadores?.cycles?.[cycle]?.categories ?? []
}

export function findFirstAvailableCategory(categories) {
  return categories[0]?.key ?? ''
}

export function getIndicatorTitle(item, result) {
  return item?.label || result?.label || 'Indicador'
}

export function cleanInterpretationText(text) {
  if (typeof text !== 'string' || !text.length) return text
  let cleaned = text.replace(/\bp\.p\.\.+/g, 'p.p.')
  cleaned = cleaned.replace(/\.+\s*$/, '.')
  cleaned = cleaned.replace(/(\b\w)\.([a-zÀ-ÿ])/g, '$1. $2')
  return cleaned.trimEnd()
}

const ABSOLUTE_HINTS = [
  'número absoluto',
  'numero absoluto',
  'número de',
  'numero de',
  'matrículas',
  'matriculas',
  'escolas',
  'docentes',
  'salas',
  'oferta',
  'alunos',
  'estudantes',
  'turmas',
]

const PERCENT_HINTS = [
  'percentual',
  'proporção',
  'proporcao',
  'taxa',
  'participação',
  'participacao',
  'razão',
  'razao',
  'ideb',
]

export function detectIndicatorUnit(item, result) {
  const itemText = [item?.label, item?.sub, item?.desc, result?.label]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('pt-BR')

  const displayText = Object.values(result?.display ?? {}).join(' ').toLocaleLowerCase('pt-BR')

  const hasAbsoluteHint = ABSOLUTE_HINTS.some((hint) => itemText.includes(hint))
  const hasPercentHint =
    PERCENT_HINTS.some((hint) => itemText.includes(hint)) || displayText.includes('%')

  if (hasAbsoluteHint) return 'absolute'
  if (hasPercentHint) return 'percent'

  const allValues = [
    Number(result?.start_value),
    Number(result?.end_value),
    Number(result?.meta),
    ...((result?.series ?? []).map((point) => Number(point?.valor))),
  ].filter(Number.isFinite)
  if (allValues.length && allValues.every((value) => value >= 0 && value <= 100)) return 'percent'
  return 'absolute'
}

export function formatIndicatorValue(value, unit) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  const isIntegerLike = Math.abs(numeric) >= 10 || Number.isInteger(numeric)
  const formatted = numeric.toLocaleString('pt-BR', {
    maximumFractionDigits: isIntegerLike ? 0 : 1,
  })
  if (unit === 'percent') return `${formatted}%`
  return formatted
}
