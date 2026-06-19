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
  return series[series.length - 1]
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
