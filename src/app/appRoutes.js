import { FINANCIAL_PAGE_KEYS } from '../data/financialPageKeys.js'
import { normalizeRouteValue, parseAppHash, parseAppLocation } from './appHash.js'

const HASH_PAGE_MAP = Object.freeze({
  home: 'home',
  pneoverview: 'pne-overview',
  pnelegalgoals: 'pne-legal-goals',
  metaslegais: 'pne-legal-goals',
  pne2014: 'pne2014',
  pne2024: 'pne2014',
  pne2026: 'pne2026',
  diagnostico: 'diagnostico',
  educacao: 'educacao',
  financeiros: 'financeiros',
  financeirosaplicacaorecursos: FINANCIAL_PAGE_KEYS.application,
  financeirosfundeb: FINANCIAL_PAGE_KEYS.fundeb,
  financeirospnate: FINANCIAL_PAGE_KEYS.pnate,
  financeirosvaar: FINANCIAL_PAGE_KEYS.vaar,
  fundeb: FINANCIAL_PAGE_KEYS.fundeb,
  pnate: FINANCIAL_PAGE_KEYS.pnate,
  siope: FINANCIAL_PAGE_KEYS.application,
  vaar: FINANCIAL_PAGE_KEYS.vaar,
  sistemas: 'educacao',
  escolassistemas: 'educacao',
})

export const FINANCIAL_PAGES = new Set(Object.values(FINANCIAL_PAGE_KEYS))

export { normalizeRouteValue, parseAppHash } from './appHash.js'

export function resolveActivePage({ params, route }) {

  if (route === 'financeiros') {
    const requestedModule = params.get('modulo') ?? params.get('module')
    const normalizedModule = normalizeRouteValue(requestedModule)

    if (normalizedModule === 'fundeb') return FINANCIAL_PAGE_KEYS.fundeb
    if (normalizedModule === 'pnate') return FINANCIAL_PAGE_KEYS.pnate
    if (normalizedModule === 'vaar' || normalizedModule === 'complementacaovaar') return FINANCIAL_PAGE_KEYS.vaar
    if (normalizedModule === 'siope' || normalizedModule === 'aplicacaorecursos') return FINANCIAL_PAGE_KEYS.application
  }

  return HASH_PAGE_MAP[route] ?? 'home'
}

export function resolveActivePageFromHash(hash) {
  return resolveActivePage(parseAppHash(hash))
}

export function getNavigationContextFromLocation(location = typeof window === 'undefined' ? null : window.location) {
  return parseAppLocation(location ?? {})
}

export function getActivePageFromLocation(location = typeof window === 'undefined' ? null : window.location) {
  return location ? resolveActivePage(getNavigationContextFromLocation(location)) : 'home'
}
