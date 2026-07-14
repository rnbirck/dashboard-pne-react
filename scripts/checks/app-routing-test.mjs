import assert from 'node:assert/strict'
import { FINANCIAL_PAGE_KEYS } from '../../src/data/financialPageKeys.js'
import {
  getActivePageFromLocation,
  normalizeRouteValue,
  parseAppHash,
  resolveActivePageFromHash,
} from '../../src/app/appRoutes.js'

const ROUTE_CASES = [
  ['', 'home'],
  ['#home', 'home'],
  ['#/Home', 'home'],
  ['#pne-overview', 'pne-overview'],
  ['#pneoverview', 'pne-overview'],
  ['#pne-legal-goals', 'pne-legal-goals'],
  ['#pnelegalgoals', 'pne-legal-goals'],
  ['#metas-legais', 'pne-legal-goals'],
  ['#pne2014', 'pne2014'],
  ['#pne2024', 'pne2014'],
  ['#/PNE-2024', 'pne2014'],
  ['#pne2026', 'pne2026'],
  ['#diagnostico', 'diagnostico'],
  ['#educacao', 'educacao'],
  ['#financeiros', FINANCIAL_PAGE_KEYS.overview],
  ['#financeiros-aplicacao-recursos', FINANCIAL_PAGE_KEYS.application],
  ['#financeiros-fundeb', FINANCIAL_PAGE_KEYS.fundeb],
  ['#financeiros-pnate', FINANCIAL_PAGE_KEYS.pnate],
  ['#financeiros-vaar', FINANCIAL_PAGE_KEYS.vaar],
  ['#fundeb', FINANCIAL_PAGE_KEYS.fundeb],
  ['#pnate', FINANCIAL_PAGE_KEYS.pnate],
  ['#siope', FINANCIAL_PAGE_KEYS.application],
  ['#vaar', FINANCIAL_PAGE_KEYS.vaar],
  ['#sistemas', 'educacao'],
  ['#escolas-sistemas', 'educacao'],
  ['#rota-inexistente', 'home'],
]

const FINANCIAL_PARAMETER_CASES = [
  ['#financeiros?modulo=fundeb', FINANCIAL_PAGE_KEYS.fundeb],
  ['#financeiros?module=pnate', FINANCIAL_PAGE_KEYS.pnate],
  ['#financeiros?modulo=vaar', FINANCIAL_PAGE_KEYS.vaar],
  ['#financeiros?modulo=complementacao-vaar', FINANCIAL_PAGE_KEYS.vaar],
  ['#financeiros?modulo=siope', FINANCIAL_PAGE_KEYS.application],
  ['#financeiros?module=aplicacao-recursos', FINANCIAL_PAGE_KEYS.application],
  ['#financeiros?modulo=FUNDEB', FINANCIAL_PAGE_KEYS.fundeb],
  ['#financeiros?modulo=desconhecido', FINANCIAL_PAGE_KEYS.overview],
]

for (const [hash, expectedPage] of [...ROUTE_CASES, ...FINANCIAL_PARAMETER_CASES]) {
  assert.equal(resolveActivePageFromHash(hash), expectedPage, hash || '(hash vazio)')
}

assert.equal(normalizeRouteValue('Aplicação de Recursos'), 'aplicacaoderecursos')
assert.deepEqual(
  {
    route: parseAppHash('#/Educação?secao=trajetoria').route,
    section: parseAppHash('#/Educação?secao=trajetoria').params.get('secao'),
  },
  { route: 'educacao', section: 'trajetoria' },
)
assert.equal(getActivePageFromLocation({ hash: '#pne2026' }), 'pne2026')
assert.equal(getActivePageFromLocation(null), 'home')

console.log(`${ROUTE_CASES.length + FINANCIAL_PARAMETER_CASES.length} casos de rotas e aliases passaram.`)
