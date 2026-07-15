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

const ETAPA_LABELS = {
  infantil: 'Educação Infantil',
  creche: 'Creche',
  pre_escola: 'Pré-Escola',
  fundamental: 'Ensino Fundamental',
  fundamental_anos_iniciais: 'Anos Iniciais',
  fundamental_anos_finais: 'Anos Finais',
  medio: 'Ensino Médio',
  eja: 'Educação de Jovens e Adultos',
  profissional: 'Educação Profissional e Tecnológica',
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
  integradora_eja: 'Educação de Jovens e Adultos integrada',
}

export function modLabel(key) {
  return MOD_LABELS[key] ?? key
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
