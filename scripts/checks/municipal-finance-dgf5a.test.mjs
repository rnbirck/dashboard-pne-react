import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test, { after } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'

const repoRoot = new URL('../../', import.meta.url)
const readText = (path) => readFile(new URL(path, repoRoot), 'utf8')
const readJson = (path) => readText(path).then(JSON.parse)

const server = await createServer({ root: fileURLToPath(repoRoot), server: { middlewareMode: true }, appType: 'custom' })
after(() => server.close())

const [presentation, catalog, programs, indicators, agudo, novaSantaRita] = await Promise.all([
  server.ssrLoadModule('/src/features/municipal-finance/municipalFinancePresentation.ts'),
  readJson('public/data/financeiro/catalogos.json'),
  readJson('src/data/diagnostic/financingPrograms.json'),
  readJson('src/data/diagnostic/indicatorCatalog.json'),
  readJson('public/data/municipios/agudo/financeiro.json'),
  readJson('public/data/municipios/nova-santa-rita/financeiro.json'),
])

const present = (document) => presentation.buildMunicipalFinancePresentation(
  document,
  catalog,
  programs,
  indicators,
  { indicatorIds: [], programIds: [] },
)

test('resumo mantém no máximo quatro valores centrais e omite nulos', () => {
  const agudoView = present(agudo)
  assert.ok(agudoView.summaryCards.length <= 4)
  assert.ok(agudoView.summaryCards.every((card) => typeof card.amount.value === 'number'))
  assert.equal(agudoView.summaryCards.some((card) => card.key === 'vaar'), false)
  assert.equal(present(novaSantaRita).summaryCards.some((card) => card.key === 'vaar'), true)
})

test('Fundeb publica somente total e complementações aplicáveis', () => {
  const agudoView = present(agudo)
  assert.deepEqual(agudoView.fundebComponents.map((component) => component.key), ['total'])
  assert.deepEqual(agudoView.fundebNonBeneficiaryLabels, ['VAAF', 'VAAT', 'VAAR'])
  const beneficiaryView = present(novaSantaRita)
  assert.ok(beneficiaryView.fundebComponents.some((component) => component.key === 'vaar'))
  assert.ok(beneficiaryView.fundebComponents.every((component) => component.key === 'total' || component.statusLabel === 'Beneficiário'))
})

test('primitivas financeiras renderizam cabeçalho, card e análise acessíveis', async () => {
  const components = await server.ssrLoadModule('/src/features/municipal-finance/FinancialPanoramaComponents.tsx')
  const markup = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(components.FinancialCompactHeader, {
      backHref: '#financeiros?municipio=agudo',
      description: 'Síntese municipal.',
    }),
    React.createElement(components.FinancialMetricCard, {
      icon: 'fundeb',
      label: 'Fundeb total previsto',
      meta: 'Previsão oficial · 2026',
      tone: 'forecast',
    }, 'R$ 21,73 mi'),
  ))
  assert.match(markup, /<h1[^>]*>Panorama financeiro<\/h1>/)
  assert.doesNotMatch(markup, /Município selecionado|>Agudo</)
  assert.match(markup, /municipal-finance-summary-card--forecast/)
  assert.match(markup, /Voltar à visão geral de financiamento/)
  assert.match(markup, /#financeiros\?municipio=agudo/)
})

test('refinamento limita a grade, preserva valores inteiros e diferencia estágios', async () => {
  const [pageSource, styleSource] = await Promise.all([
    readText('src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx'),
    readText('src/styles/financial-pages.css'),
  ])
  assert.match(pageSource, /Realizado · 2024/)
  assert.match(pageSource, /Previsto · 2026/)
  assert.match(pageSource, /FINANCIAL_PAGE_KEYS\.overview/)
  assert.match(pageSource, /Síntese dos principais recursos e da aplicação em educação no município\./)
  assert.match(styleSource, /\.municipal-finance-summary-grid[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(styleSource, /\.municipal-finance-summary-card__value[\s\S]*white-space: nowrap/)
})

test('Panorama segue a ordem homologada e não reintroduz seção técnica', async () => {
  const source = await readText('src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx')
  const orderedLabels = [
    'Resumo financeiro municipal',
    'ConstitutionalApplicationSection',
    'Do orçamento ao pagamento',
    'QseAnnualPanel',
    'Fundeb e complementações',
    'Fontes e metodologia',
  ]
  let cursor = -1
  orderedLabels.forEach((label) => {
    const next = source.indexOf(label, cursor + 1)
    assert.ok(next > cursor, label)
    cursor = next
  })
  assert.doesNotMatch(source, /Relação com os pontos de atenção|cobertura técnica|status de QA|reason codes/i)
})
