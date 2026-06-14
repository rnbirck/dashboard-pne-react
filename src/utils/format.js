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
  let cleaned = text.replace(/\bp\.p\.\..+/g, 'p.p.')
  cleaned = cleaned.replace(/\.\+\s*$/, '.')
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
  'razão percentual',
  'razao percentual',
]

const INDEX_HINTS = ['ideb']

export function resolveIndicatorUnit(item, result) {
  const itemText = [item?.label, item?.sub, item?.desc, result?.label]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('pt-BR')

  const displayText = Object.values(result?.display ?? {})
    .join(' ')
    .toLocaleLowerCase('pt-BR')

  const hasIndexHint = INDEX_HINTS.some((hint) => itemText.includes(hint))
  const hasAbsoluteHint = ABSOLUTE_HINTS.some((hint) => itemText.includes(hint))
  const hasPercentHint =
    PERCENT_HINTS.some((hint) => itemText.includes(hint)) || displayText.includes('%')

  if (hasIndexHint) return 'index'
  if (hasAbsoluteHint) return 'absolute'
  if (hasPercentHint) return 'percent'
  return 'absolute'
}

export function formatIndicatorValue(value, unit) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value)

  if (unit === 'index') {
    return numeric.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  }

  const isIntegerLike = Math.abs(numeric) >= 10 || Number.isInteger(numeric)
  const formatted = numeric.toLocaleString('pt-BR', {
    maximumFractionDigits: isIntegerLike ? 0 : 1,
  })
  if (unit === 'percent') return `${formatted}%`
  return formatted
}

export function formatMetaValue(result, unit) {
  const raw = result?.meta
  if (raw === null || raw === undefined || raw === '') return '-'
  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return String(raw)
  if (unit === 'index') {
    return numeric.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  }
  if (unit === 'percent') {
    return `${numeric.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
  }
  return numeric.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

export function isSingleYearIndicator(result) {
  const series = result?.series ?? []
  const validYears = series
    .map((point) => Number(point?.ano))
    .filter(Number.isFinite)
  const startYear = Number(result?.start_year)
  const endYear = Number(result?.end_year)
  if (validYears.length === 1) return true
  if (Number.isFinite(startYear) && Number.isFinite(endYear) && startYear === endYear) return true
  return false
}

export function formatRankingValue(display, unit, mode = 'variation') {
  const raw =
    mode === 'distance'
      ? (display?.distance ?? display?.variation ?? '-')
      : (display?.variation ?? display?.distance ?? '-')
  if (typeof raw !== 'string') return String(raw)

  if (unit === 'index') {
    // Remove "p.p." e "p.p" para IDEB
    let cleaned = raw.replace(/\bp\.p\.?\b/gi, '').trim()
    // Remove espaços duplos
    cleaned = cleaned.replace(/\s{2,}/g, ' ')
    // Se ficar "Alta de  " com espaço no final, limpar
    cleaned = cleaned.trim()
    return cleaned
  }

  return raw
}

export function detectIndicatorUnit(item, result) {
  // deprecated alias for compatibility
  return resolveIndicatorUnit(item, result)
}
