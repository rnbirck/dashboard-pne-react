import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test, { after } from 'node:test'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const repoRoot = new URL('../../', import.meta.url)
const readText = (path) => readFile(new URL(path, repoRoot), 'utf8')
const server = await createServer({ root: fileURLToPath(repoRoot), server: { middlewareMode: true }, appType: 'custom' })

after(() => server.close())

const [{ FinancialPage }, { FinancialIndicatorDisclosures }] = await Promise.all([
  server.ssrLoadModule('/src/pages/FinancialPage.jsx'),
  server.ssrLoadModule('/src/components/FinancialIndicatorMetadata.jsx'),
])

function renderModule(pageKey) {
  return renderToStaticMarkup(React.createElement(FinancialPage, {
    municipioData: null,
    municipioError: null,
    municipioLoading: false,
    pageKey,
    selectedMunicipio: null,
  }))
}

test('os cabeçalhos financeiros usam o mesmo retorno público e não repetem o município', () => {
  ['financeiros-aplicacao-recursos', 'financeiros-fundeb', 'financeiros-vaar', 'financeiros-pnate'].forEach((pageKey) => {
    const markup = renderModule(pageKey)
    assert.match(markup, /financial-page-header/)
    assert.match(markup, /Financiamento da educação/)
    assert.match(markup, /Voltar à visão geral de financiamento/)
    assert.doesNotMatch(markup, /Município em foco|Contexto desta página/)
  })
})

test('o disclosure compartilhado reúne dados, conceito e fontes sem exposição técnica', () => {
  const markup = renderToStaticMarkup(React.createElement(FinancialIndicatorDisclosures, {
    formatValue: (value) => `R$ ${value}`,
    indicator: { currentYear: 2025, label: 'Receita declarada', unitLabel: 'Reais' },
    metadata: {
      calculation: 'Soma anual publicada pela fonte.',
      definition: 'Receita registrada no exercício.',
      financingSource: 'FNDE.',
      legalBasis: 'Lei aplicável.',
      methodNote: 'Anos ausentes não são preenchidos.',
      referenceRule: 'Não permite concluir qualidade isoladamente.',
      relevance: 'Ajuda a contextualizar a execução.',
    },
    series: [{ ano: 2024, valor: 0 }, { ano: 2025, valor: 10 }],
  }))

  assert.equal((markup.match(/<details/g) ?? []).length, 3)
  assert.match(markup, /Dados usados no cálculo/)
  assert.match(markup, /Conceito e interpretação/)
  assert.match(markup, /Fontes e metodologia/)
  assert.match(markup, /R\$ 0/)
  assert.doesNotMatch(markup, /Referência técnica|schema|parser|pipeline|reason code/i)
})

test('Fundeb e PNATE aplicam deduplicação por valor e exercício, mantendo o detalhe', async () => {
  const [fundebSource, pnateSource] = await Promise.all([
    readText('src/components/FundebPanel.jsx'),
    readText('src/components/PnatePanel.jsx'),
  ])

  assert.match(fundebSource, /function hasSameFundebSnapshot/)
  assert.match(fundebSource, /left\.currentYear !== right\.currentYear/)
  assert.match(fundebSource, /revenueAndInflowsMatch/)
  assert.match(fundebSource, /availabilityAndBalanceMatch/)
  assert.match(fundebSource, /Dados usados no cálculo/)
  assert.match(pnateSource, /function hasSamePnateValue/)
  assert.match(pnateSource, /left\.currentYear !== right\.currentYear/)
  assert.match(pnateSource, /reportedAndAuthorizedMatch/)
  assert.match(pnateSource, /autorizado permanece como linha secundária/i)
})

test('gráficos e detalhes seguem as regras compartilhadas de leitura e reflow', async () => {
  const [qseSource, fundebSource, pnateSource, siopeSource, styleSource] = await Promise.all([
    readText('src/features/municipal-finance/QseAnnualPanel.tsx'),
    readText('src/components/FundebPanel.jsx'),
    readText('src/components/PnatePanel.jsx'),
    readText('src/components/SiopeIndicatorsPanel.jsx'),
    readText('src/styles/financial-pages.css'),
  ])

  assert.match(qseSource, /chartType="bar"/)
  assert.match(fundebSource, /chartType=\{chartUnit === 'currency' && validSeries\.length <= 3 \? 'bar' : 'line'\}/)
  assert.match(siopeSource, /chartType=\{selectedIndicator\.unidade === 'reais' && validSeries\.length <= 3 \? 'bar' : 'line'\}/)
  assert.equal((fundebSource.match(/<FinancialDetailNavigation/g) ?? []).length, 1)
  assert.equal((pnateSource.match(/<FinancialDetailNavigation/g) ?? []).length, 1)
  assert.equal((siopeSource.match(/<FinancialDetailNavigation/g) ?? []).length, 1)
  assert.match(styleSource, /\.siope-public-summary__grid[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(styleSource, /@media screen and \(max-width: 1024px\)[\s\S]*?\.siope-public-summary__grid\s*\{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(styleSource, /@media screen and \(max-width: 720px\)[\s\S]*?\.siope-public-summary__grid[\s\S]*?grid-template-columns: 1fr/)
})
