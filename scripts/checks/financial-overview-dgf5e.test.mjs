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

const [{ FinancialPage }, { NavigationEntryCard }] = await Promise.all([
  server.ssrLoadModule('/src/pages/FinancialPage.jsx'),
  server.ssrLoadModule('/src/components/NavigationEntryCard.jsx'),
])

function renderOverview() {
  return renderToStaticMarkup(React.createElement(FinancialPage, {
    municipioData: null,
    municipioError: null,
    municipioLoading: false,
    pageKey: 'financeiros',
    selectedMunicipio: null,
  }))
}

test('a visão geral prioriza o Panorama e preserva a sequência editorial DGF5-E', () => {
  const markup = renderOverview()
  const labelsInOrder = [
    'Como a educação municipal é financiada',
    'Panorama financeiro',
    'Aplicação e execução',
    'Como o financiamento se organiza',
    'Conceitos essenciais',
    'Fontes e metodologia',
  ]

  let cursor = -1
  labelsInOrder.forEach((label) => {
    const next = markup.indexOf(label, cursor + 1)
    assert.ok(next > cursor, `ordem esperada para ${label}`)
    cursor = next
  })

  assert.match(markup, /href="#financeiros-panorama"[^>]*>\s*<span>Abrir Panorama financeiro<\/span>/)
  assert.equal((markup.match(/>Abrir página<\/span>/g) ?? []).length, 4)
  assert.match(markup, /<details class="financial-overview-concepts">/)
  assert.doesNotMatch(markup, /(?:14|13|10) indicadores|2023–2026|>01</)
})

test('o card de navegação compartilhado aceita os ícones usados nos aprofundamentos', () => {
  function FixtureIcon() {
    return React.createElement('svg', { viewBox: '0 0 24 24' }, React.createElement('path', { d: 'M4 12h16' }))
  }

  const markup = renderToStaticMarkup(React.createElement(NavigationEntryCard, {
    bodyText: 'Descrição do destino.',
    footerText: 'Abrir página',
    href: '#financeiros-fundeb',
    icon: FixtureIcon,
    title: 'Fundeb',
  }))

  assert.match(markup, /platform-entry-card__icon/)
  assert.doesNotMatch(markup, /platform-entry-card__indicator/)
  assert.match(markup, /Abrir página/)
})

test('a folha financeira registra os reflows do acesso e dos mecanismos', async () => {
  const styleSource = await readText('src/styles/financial-pages.css')

  assert.match(styleSource, /\.financial-module-entry-grid\s*\{\s*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(styleSource, /\.financial-module-directory \.home-entry-card::before\s*\{\s*content: none/)
  assert.match(styleSource, /\.financial-mechanisms__grid\s*\{\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)/)
  assert.match(styleSource, /@media screen and \(max-width: 620px\)[\s\S]*?\.financial-mechanisms__grid\s*\{\s*grid-template-columns: 1fr/)
})
