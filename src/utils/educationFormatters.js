const EM_DASH = '\u2014'

export function isMissing(value) {
  return value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value))
}

export function formatNumber(value) {
  if (isMissing(value)) return EM_DASH
  return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

export function formatPercent(value) {
  if (isMissing(value)) return EM_DASH
  return `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

export function formatRatio(value) {
  if (isMissing(value)) return EM_DASH
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function formatValue(value, suffix = '') {
  if (isMissing(value)) return EM_DASH
  const formatted = Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return suffix ? `${formatted}${suffix}` : formatted
}

export function formatYear(value) {
  if (isMissing(value)) return EM_DASH
  return String(value)
}

export function getLatestFromSeries(series) {
  if (!Array.isArray(series) || series.length === 0) return null
  const valid = series
    .filter((p) => p && !isMissing(p.ano))
    .sort((a, b) => Number(a.ano) - Number(b.ano))
  return valid[valid.length - 1] ?? series[series.length - 1]
}

export function getLatestValue(series, key = 'valor') {
  const latest = getLatestFromSeries(series)
  if (!latest) return null
  return isMissing(latest[key]) ? null : latest[key]
}

export function getLatestYear(series) {
  const latest = getLatestFromSeries(series)
  if (!latest) return null
  return latest.ano ?? null
}

const ETAPA_LABELS = {
  infantil: 'Educação Infantil',
  creche: 'Creche',
  pre_escola: 'Pré-Escola',
  fundamental: 'Ensino Fundamental',
  fundamental_anos_iniciais: 'Anos Iniciais',
  fundamental_anos_finais: 'Anos Finais',
  medio: 'Ensino Médio',
  eja: 'EJA',
  profissional: 'Educação Profissional',
}

export function etapaLabel(key) {
  return ETAPA_LABELS[key] ?? key
}

const DEP_LABELS = {
  federal: 'Federal',
  estadual: 'Estadual',
  municipal: 'Municipal',
  privada: 'Privada',
  publica: 'Pública',
  total: 'Total',
}

export function depLabel(key) {
  return DEP_LABELS[key] ?? key
}

const LOC_LABELS = {
  urbana: 'Urbana',
  rural: 'Rural',
  total: 'Total',
}

export function locLabel(key) {
  return LOC_LABELS[key] ?? key
}

const MOD_LABELS = {
  integrado: 'Integrado',
  concomitante: 'Concomitante',
  subsequente: 'Subsequente',
  magisterio: 'Magistério',
  integradora_eja: 'EJA Integrada',
}

export function modLabel(key) {
  return MOD_LABELS[key] ?? key
}

export function buildEvolutionText(series, label, formato = 'number') {
  const cleanSeries = normalizeYearSeries(series)
  if (!Array.isArray(cleanSeries) || cleanSeries.length < 2) return null
  const first = cleanSeries[0]
  const last = cleanSeries[cleanSeries.length - 1]
  const v1 = first.valor
  const v2 = last.valor
  if (isMissing(v1) || isMissing(v2)) return null
  const fmt = (v) => {
    if (formato === 'percent') return formatPercent(v)
    if (formato === 'ratio') return formatRatio(v)
    return formatNumber(v)
  }
  const a1 = first.ano
  const a2 = last.ano
  const diff = v2 - v1
  const direcao = diff > 0 ? 'aumentou' : diff < 0 ? 'reduziu' : 'manteve-se'
  const absDiff = Math.abs(diff)
  let texto = `Entre ${a1} e ${a2}, ${label} ${direcao} de ${fmt(v1)} para ${fmt(v2)}`
  if (diff !== 0) {
    if (formato === 'percent') {
      texto += ` (variação de ${formatValue(absDiff)} p.p.)`
    } else {
      texto += ` (${diff > 0 ? '+' : '-'}${formatNumber(absDiff)})`
    }
  }
  return texto
}

export function filterOptionsFromMap(map, labelFn = (k) => k) {
  if (!map || typeof map !== 'object') return []
  return Object.keys(map)
    .filter((key) => key !== 'total')
    .filter((key) => hasSeriesData(map[key]))
    .sort((a, b) => labelFn(a).localeCompare(labelFn(b), 'pt-BR'))
    .map((key) => ({ key, label: labelFn(key) }))
}

export function normalizeYearSeries(series, valueKey = 'valor') {
  if (!Array.isArray(series)) return []
  const byYear = new Map()
  series.forEach((point) => {
    if (!point || isMissing(point.ano) || isMissing(point[valueKey])) return
    const year = Number(point.ano)
    byYear.set(year, { ...point, ano: year, [valueKey]: point[valueKey] })
  })
  return Array.from(byYear.values()).sort((a, b) => Number(a.ano) - Number(b.ano))
}

function hasSeriesData(series) {
  if (!Array.isArray(series)) return Boolean(series)
  return series.some((point) => {
    if (!point || isMissing(point.ano)) return false
    return Object.entries(point).some(([field, value]) => field !== 'ano' && !isMissing(value))
  })
}
