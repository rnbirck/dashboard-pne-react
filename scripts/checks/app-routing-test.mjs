import assert from 'node:assert/strict'
import test from 'node:test'
import { FINANCIAL_PAGE_KEYS } from '../../src/data/financialPageKeys.js'
import {
  buildAppHash,
  mergeHashAndSearchParams,
  normalizeRouteValue,
  parseAppHash,
  parseAppLocation,
} from '../../src/app/appHash.js'
import {
  getActivePageFromLocation,
  getNavigationContextFromLocation,
  resolveActivePage,
  resolveActivePageFromHash,
} from '../../src/app/appRoutes.js'
import { resolveEducationNavigation } from '../../src/data/educationIndicatorCatalog.js'
import { getHashContext, setHashContext } from '../../src/utils/hashNavigation.js'

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

test('resolve todas as rotas e aliases vigentes', () => {
  for (const [hash, expectedPage] of ROUTE_CASES) {
    assert.equal(resolveActivePageFromHash(hash), expectedPage, hash || '(hash vazio)')
  }
})

test('normaliza letras, acentos e caracteres especiais', () => {
  assert.equal(normalizeRouteValue('Aplicação de Recursos'), 'aplicacaoderecursos')
  assert.equal(resolveActivePageFromHash('#/FINANCEIROS—FUNDEB'), FINANCIAL_PAGE_KEYS.fundeb)
  assert.deepEqual(
    {
      route: parseAppHash('#/Educação?secao=trajetoria').route,
      section: parseAppHash('#/Educação?secao=trajetoria').params.get('secao'),
    },
    { route: 'educacao', section: 'trajetoria' },
  )
})

test('resolve módulos financeiros no hash', () => {
  for (const [hash, expectedPage] of [
    ['#financeiros?modulo=fundeb', FINANCIAL_PAGE_KEYS.fundeb],
    ['#financeiros?module=pnate', FINANCIAL_PAGE_KEYS.pnate],
    ['#financeiros?modulo=vaar', FINANCIAL_PAGE_KEYS.vaar],
    ['#financeiros?modulo=complementacao-vaar', FINANCIAL_PAGE_KEYS.vaar],
    ['#financeiros?module=siope', FINANCIAL_PAGE_KEYS.application],
    ['#financeiros?modulo=siope', FINANCIAL_PAGE_KEYS.application],
    ['#financeiros?module=aplicacao-recursos', FINANCIAL_PAGE_KEYS.application],
    ['#financeiros?modulo=FUNDEB', FINANCIAL_PAGE_KEYS.fundeb],
    ['#financeiros?modulo=desconhecido', FINANCIAL_PAGE_KEYS.overview],
  ]) {
    assert.equal(resolveActivePageFromHash(hash), expectedPage, hash)
  }
})

test('combina parâmetros com prioridade do hash e constrói hashes sem vazios', () => {
  const location = { hash: '#educacao?secao=trajetoria&tema=fluxo', search: '?secao=oferta&detalhe=indicador-a&module=fundeb' }
  const context = getNavigationContextFromLocation(location)
  assert.equal(context.params.get('secao'), 'trajetoria')
  assert.equal(context.params.get('tema'), 'fluxo')
  assert.equal(context.params.get('detalhe'), 'indicador-a')
  assert.equal(context.params.get('module'), 'fundeb')
  assert.equal(resolveActivePage(context), 'educacao')
  assert.equal(buildAppHash('educacao', { detalhe: '', secao: 'trajetoria', tema: null, theme: 'fluxo' }), '#educacao?secao=trajetoria&theme=fluxo')
  assert.deepEqual(
    [...mergeHashAndSearchParams('secao=trajetoria', 'secao=oferta&detalhe=x').entries()],
    [['secao', 'trajetoria'], ['detalhe', 'x']],
  )
})

test('mantém parse → build → parse e o adaptador compatível', () => {
  const built = buildAppHash('financeiros', { detalhe: 'receitas', modulo: 'fundeb' })
  const parsed = parseAppHash(built)
  assert.equal(parsed.route, 'financeiros')
  assert.equal(parsed.params.get('modulo'), 'fundeb')
  assert.equal(parsed.params.get('detalhe'), 'receitas')

  const fakeLocation = { hash: '#educacao?tema=matriculas', search: '?secao=oferta' }
  const legacyContext = getHashContext(fakeLocation)
  assert.equal(legacyContext.route, 'educacao')
  assert.equal(legacyContext.params.get('tema'), 'matriculas')
  assert.equal(legacyContext.params.get('secao'), 'oferta')
  setHashContext('educacao', { detalhe: '', secao: 'trajetoria', tema: 'fluxo' }, fakeLocation)
  assert.equal(fakeLocation.hash, '#educacao?secao=trajetoria&tema=fluxo')
})

test('resolve Educação sem acesso a window', () => {
  const education = resolveEducationNavigation({
    route: 'educacao',
    hashParams: new URLSearchParams('detalhe=taxa_aprovacao&secao=oferta&tema=aprendizagem'),
    searchParams: new URLSearchParams('detalhe=matriculas&secao=trajetoria&theme=fluxo'),
  })
  assert.equal(education.detailKey, 'taxa_aprovacao')
  assert.equal(education.section, 'modalidades')
  assert.equal(education.requestedTheme, 'aprendizagem')

  const systems = resolveEducationNavigation({ route: 'escolas-sistemas' })
  assert.equal(systems.section, 'modalidades')
  assert.equal(systems.hasSystemTheme, true)
  assert.equal(resolveEducationNavigation({ route: 'pne2014' }), null)
})

test('adapta location e mantém o fallback da página inicial', () => {
  assert.equal(getActivePageFromLocation({ hash: '#pne2026' }), 'pne2026')
  assert.equal(getActivePageFromLocation(null), 'home')
  assert.deepEqual(parseAppLocation(), {
    hashParams: new URLSearchParams(),
    params: new URLSearchParams(),
    rawRoute: '',
    route: '',
    searchParams: new URLSearchParams(),
  })
})
