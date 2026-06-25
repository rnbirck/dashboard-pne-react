export function getDisplayValue(display, key, fallback = '-') {
  return display?.[key] ?? fallback
}

export function getIndicatorTitle(item, result) {
  return item?.label || result?.label || 'Indicador'
}

export function cleanInterpretationText(text, { keepOneDecimal = false } = {}) {
  if (typeof text !== 'string' || !text.length) return text
  let cleaned = text.replace(/\bp\.p\.\..+/g, 'p.p.')
  cleaned = cleaned.replace(/\.+\s*$/, '.')
  cleaned = cleaned.replace(/(\b\w)\.([a-zÀ-ÿ])/g, '$1. $2')
  cleaned = cleaned.replace(/(-?\d+),(\d+)/g, (_match, intPart, decPart) => {
    const num = Number(`${intPart}.${decPart}`)
    if (!Number.isFinite(num)) return _match
    if (keepOneDecimal) {
      return num.toLocaleString('pt-BR', {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      })
    }
    return String(Math.round(num))
  })
  return cleaned.trimEnd()
}

export function improveZeroValueInterpretation(text, { isAccumulativeExpansion = false } = {}) {
  if (typeof text !== 'string' || !text.length) return text
  let improved = text
  const verbPattern = /(chegou|alcançou|atingiu|chegando|alcançando|atingindo)/
  const valuePattern = /(\s+a\s+)?[+-]?\d+(?:[,.]\d+)?%?/
  const fullPattern = new RegExp(`${verbPattern.source}\\s+${valuePattern.source}`, 'gi')
  const replacement = isAccumulativeExpansion
    ? 'não registrou expansão acumulada no indicador; para acompanhamento da meta, o valor considerado é 0%'
    : 'não registrou resultado no indicador e permaneceu em 0%'
  improved = improved.replace(fullPattern, replacement)
  return improved
}

export function buildAccumulativeExpansionInterpretation({ endYear, metaValue, metaLabel, distance }) {
  const yearText = Number.isFinite(endYear) ? `Em ${endYear}, o município` : 'O município'
  const metaText = Number.isFinite(metaValue) ? `${metaValue}%` : `${metaLabel ?? 'a meta'}`
  const distanceText = Number.isFinite(distance)
    ? `${distance > 0 ? '+' : ''}${Math.round(distance).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} p.p.`
    : 'não calculada'
  return `${yearText} não registrou expansão acumulada neste indicador. Para acompanhamento da meta, o valor considerado é 0%, com distância de ${distanceText} em relação à meta de ${metaText}.`
}

const ABSOLUTE_HINTS = [
  'número absoluto',
  'numero absoluto',
  'número de matrículas',
  'numero de matriculas',
  'matrículas em número absoluto',
  'matriculas em numero absoluto',
  'quantidade',
  'total de matrículas',
  'total de matriculas',
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
const YEARS_HINTS = ['anos de estudo', 'escolaridade média']

const VALUE_MODE_ALIASES = {
  absolute: 'count',
  ratio_percent: 'percent',
  score: 'index',
}

export function resolveIndicatorUnit(item, result) {
  // 1. Prioridade máxima: value_mode explícito no metadado
  const rawVm = item?.value_mode ?? result?.value_mode
  if (rawVm) {
    const normalized = VALUE_MODE_ALIASES[rawVm] || rawVm
    if (['percent', 'count', 'index', 'years'].includes(normalized)) {
      return normalized
    }
  }

  // 2. Fallback por heurística
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
  const hasYearsHint = YEARS_HINTS.some((hint) => itemText.includes(hint))

  if (hasIndexHint) return 'index'
  if (hasAbsoluteHint) return 'count'
  if (hasPercentHint) return 'percent'
  if (hasYearsHint) return 'years'
  return 'count'
}

export function formatIndicatorValue(value, unit) {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'

  if (unit === 'index') {
    return numeric.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  }

  if (unit === 'years') {
    return numeric.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  }

  if (unit === 'count') {
    return numeric.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
  }

  if (unit === 'currency') {
    return numeric.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    })
  }

  // percent — sempre inteiro
  return `${Math.round(numeric).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`
}

export function formatMetaValue(result, unit) {
  const raw = result?.meta
  if (raw === null || raw === undefined || raw === '') return '-'
  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return String(raw)
  if (unit === 'index') {
    return numeric.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  }
  if (unit === 'years') {
    return numeric.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  }
  if (unit === 'percent') {
    return `${Math.round(numeric).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`
  }
  // count
  return numeric.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

export function roundPpString(value, { keepOneDecimal = false } = {}) {
  if (typeof value !== 'string') return value
  return value.replace(/(-?\d+),(\d+)/g, (_match, intPart, decPart) => {
    const num = Number(`${intPart}.${decPart}`)
    if (!Number.isFinite(num)) return _match
    if (keepOneDecimal) {
      return num.toLocaleString('pt-BR', {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      })
    }
    return String(Math.round(num))
  })
}

export function isIdebIndicator(item, result) {
  const text = [item?.label, item?.sub, item?.desc, result?.label]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('pt-BR')
  return text.includes('ideb')
}

export function isAccumulativeExpansionIndicator(item, result) {
  const text = [item?.label, item?.sub, item?.desc, result?.label]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('pt-BR')
  return text.includes('expansão acumulada')
}

export function floorValueForGoal(value, item, result) {
  if (!Number.isFinite(value)) return value
  if (!isAccumulativeExpansionIndicator(item, result)) return value
  return Math.max(0, value)
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
    let cleaned = raw.replace(/\bp\.p\.?\b/gi, '').trim()
    cleaned = cleaned.replace(/\s{2,}/g, ' ')
    return cleaned.trim()
  }

  if (unit === 'years') {
    let cleaned = raw.replace(/\bp\.p\.?\b/gi, '').trim()
    cleaned = cleaned.replace(/\s{2,}/g, ' ')
    return cleaned.trim()
  }

  return raw
}
