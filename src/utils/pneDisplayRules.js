export const PNE_CONTEXT_PROXY_INDICATOR_KEYS = new Set([
  'aee',
  'eja_integrada_educacao_profissional',
  'internet',
  'internet_alunos',
  'internet_aprendizagem',
  'internet_comunidade',
  'acesso_internet_computador',
  'acesso_internet_disp_pessoais',
  'rede_local',
  'rede_wireless',
  'banda_larga',
  'proposta_pedagogica',
  'desktop_aluno',
  'comp_portatil_aluno',
  'tablet_aluno',
])

const PNE_GOAL_TRACKING_EXCEPTION_KEYS = new Set([
  'salas_climatizadas',
  'salas_acessiveis',
])

const PNE_APPROXIMATE_REFERENCE_KEYS = new Set()

function isPneContextProxyIndicatorKey(indicatorKey) {
  if (PNE_GOAL_TRACKING_EXCEPTION_KEYS.has(indicatorKey)) return false
  return PNE_CONTEXT_PROXY_INDICATOR_KEYS.has(indicatorKey)
}

export function isPneContextProxyRelation(indicatorRelation, result) {
  const indicatorId = indicatorRelation?.indicatorId ?? indicatorRelation?.key

  if (PNE_GOAL_TRACKING_EXCEPTION_KEYS.has(indicatorId)) return false
  if (PNE_CONTEXT_PROXY_INDICATOR_KEYS.has(indicatorId)) return true
  if (indicatorRelation?.hasDistance === false) return true
  if (indicatorRelation?.coverage === 'aproximada') return true
  if (result?.tracks_goal === false) return true
  return false
}

function isPneApproximateReferenceIndicator({ indicatorKey, item, result }) {
  return (
    item?.monitoring_mode === 'approximate_reference' ||
    result?.monitoring_mode === 'approximate_reference' ||
    PNE_APPROXIMATE_REFERENCE_KEYS.has(indicatorKey)
  )
}

function isPneVisibleIndicator({ indicatorKey, item, result }) {
  if (
    item?.show_in_cycle === true &&
    isPneApproximateReferenceIndicator({ indicatorKey, item, result })
  ) {
    return true
  }
  return isPneComparableIndicator({ indicatorKey, result })
}

export function isPneComparableIndicator({ indicatorKey, indicatorRelation, result }) {
  if (!result || result.available === false) return false
  if (isPneContextProxyIndicatorKey(indicatorKey)) return false
  if (isPneContextProxyRelation(indicatorRelation, result)) return false
  if (result.tracks_goal !== true) return false
  if (indicatorRelation?.hasDistance === false) return false

  const meta = Number(result.meta)
  const distance = Number(result.distance)
  const status = normalizeText(result.display?.status)

  return (
    Number.isFinite(meta) &&
    Number.isFinite(distance) &&
    typeof result.atingida === 'boolean' &&
    !status.includes('visualizacao') &&
    !status.includes('informativo') &&
    !status.includes('indispon') &&
    !status.includes('sem dados') &&
    !status.includes('sem variacao')
  )
}

export function filterPneComparableCategories(categories, results = {}) {
  return categories
    .map((category) => ({
      ...category,
      items: (category.items ?? []).filter((item) => (
        isPneVisibleIndicator({
          indicatorKey: item.key,
          item,
          result: results?.[item.key],
        })
      )),
    }))
    .filter((category) => category.items.length > 0)
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}
