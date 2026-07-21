import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

import {
  buildPublicDiagnosticCopy,
  buildPublicSummaryText,
  selectMunicipalDiagnosticContract,
} from '../../src/features/diagnostic/diagnosticPresentation.js'

const PUBLIC_VERSION = 'pne2026-public-diagnostic-v1'
const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const vite = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  root: projectRoot,
  server: { middlewareMode: true },
})
const { DiagnosticPanel } = await vite.ssrLoadModule('/src/components/DiagnosticPanel.jsx')

test.after(async () => {
  await vite.close()
})

async function readContract(slug) {
  return JSON.parse(await readFile(
    new URL(`../../public/data/municipios/${slug}/diagnostico.json`, import.meta.url),
    'utf8',
  ))
}

function renderDiagnostic(contract, municipio = 'Município de teste') {
  return renderToStaticMarkup(createElement(DiagnosticPanel, {
    contractStatus: 'ready',
    data: contract,
    municipio,
  }))
}

function visibleText(markup) {
  return markup
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

test('selection accepts only the supported technical and public versions', () => {
  assert.equal(selectMunicipalDiagnosticContract(null).status, 'missing')
  assert.equal(selectMunicipalDiagnosticContract({ schemaVersion: 'future' }).status, 'incompatible_version')
  assert.equal(selectMunicipalDiagnosticContract({ schemaVersion: 'municipal-diagnostic-v2' }).status, 'incompatible_version')
  assert.equal(selectMunicipalDiagnosticContract({
    schemaVersion: 'municipal-diagnostic-v2',
    pne2026PublicDiagnostic: { version: PUBLIC_VERSION },
  }).status, 'ready')
})

test('summary uses only the five public counters and omits zero clauses', () => {
  assert.equal(
    buildPublicSummaryText({
      displayedResultsCount: 18,
      reachedResultsCount: 0,
      advanceResultsCount: 18,
      stateAboveOrNearCount: 1,
      stateBelowCount: 11,
    }),
    'O diagnóstico apresenta 18 resultados. Destes, 18 ainda podem avançar. Em 1 resultado, o município está acima ou próximo do Rio Grande do Sul. Em 11, há espaço para avançar em relação ao estado.',
  )
})

test('page renders the public layer in canonical goal and result order', async () => {
  const contract = await readContract('bento-goncalves')
  const publicDiagnostic = contract.pne2026PublicDiagnostic
  const markup = renderDiagnostic(contract, 'Bento Gonçalves')
  const text = visibleText(markup)

  assert.match(text, /Plano Nacional de Educação \(PNE\) 2026–2036/)
  assert.match(text, /Diagnóstico educacional de Bento Gonçalves/)
  assert.match(text, /Resumo do diagnóstico/)
  assert.match(text, /Metas e resultados/)
  assert.match(text, /Fontes das informações/)
  assert.equal((markup.match(/<h1/g) ?? []).length, 1)
  assert.equal((markup.match(/class="pne-diagnostic-result"/g) ?? []).length, 20)
  assert.equal(
    (markup.match(/aria-label="Acessar fonte oficial: /g) ?? []).length,
    publicDiagnostic.sources.length,
  )

  let previousGoalIndex = -1
  for (const goal of publicDiagnostic.goals) {
    const goalIndex = text.indexOf(`Meta ${goal.goalId}`)
    assert.ok(goalIndex > previousGoalIndex, goal.goalId)
    previousGoalIndex = goalIndex
    let previousResultIndex = goalIndex
    for (const result of goal.results) {
      const resultIndex = text.indexOf(result.publicName, previousResultIndex)
      assert.ok(resultIndex >= previousResultIndex, result.publicName)
      previousResultIndex = resultIndex
    }
  }
})

test('direct and partial results keep their public semantics without aggregate goal status', async () => {
  const contract = await readContract('restinga-seca')
  const markup = renderDiagnostic(contract, 'Restinga Seca')
  const text = visibleText(markup)

  assert.match(text, /Este é um dos resultados acompanhados nesta meta\./)
  assert.match(text, /Ponto para avançar/)
  assert.match(text, /Resultado a manter/)
  assert.doesNotMatch(text, /componente parcial|meta parcialmente avaliada|meta alcançada|meta não alcançada/i)
  assert.equal((markup.match(/<article class="pne-diagnostic-goal"/g) ?? []).length, contract.pne2026PublicDiagnostic.goals.length)
})

test('supporting disclosure appears only when the public result has comparison or trajectory', async () => {
  const contract = await readContract('acegua')
  const markup = renderDiagnostic(contract, 'Aceguá')
  const disclosureCount = (markup.match(/Ver comparação e evolução/g) ?? []).length
  const expected = contract.pne2026PublicDiagnostic.goals
    .flatMap((goal) => goal.results)
    .filter((result) => (
      result.stateComparison
      || result.statewidePosition
      || result.similarMunicipalities
      || result.trajectory
    )).length

  assert.equal(disclosureCount, expected)
  assert.match(visibleText(markup), /Faltam 20 pontos percentuais para reduzir o resultado/)
})

test('copy uses only the public layer, all public readings, and official sources', async () => {
  const contract = await readContract('restinga-seca')
  const text = buildPublicDiagnosticCopy(contract.pne2026PublicDiagnostic, 'Restinga Seca')

  assert.match(text, /Diagnóstico educacional de Restinga Seca/)
  assert.match(text, /Pontos para avançar/)
  assert.match(text, /Resultados a manter/)
  assert.match(text, /Fontes das informações/)
  assert.match(text, /Censo Escolar da Educação Básica/)
  assert.doesNotMatch(text, /decisionSummary|indicatorId|sourceIds|financiamento|programas que podem apoiar/i)
})

test('missing or incompatible public data renders only the operational error', () => {
  const text = visibleText(renderToStaticMarkup(createElement(DiagnosticPanel, {
    contractStatus: 'incompatible_version',
    data: { schemaVersion: 'municipal-diagnostic-v2' },
    municipio: 'Teste',
  })))

  assert.equal(text, 'Não foi possível abrir o diagnóstico agora. Tente novamente.')
  assert.doesNotMatch(text, /versão|propriedade|JSON|schema|pipeline|arquivo|API|técnico/i)
})

test('route and presentation do not consume legacy collections or rebuild public rules', async () => {
  const [panelSource, presentationSource, pageSource] = await Promise.all([
    readFile(new URL('../../src/components/DiagnosticPanel.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../src/features/diagnostic/diagnosticPresentation.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/pages/Diagnostico.jsx', import.meta.url), 'utf8'),
  ])
  const combined = `${panelSource}\n${presentationSource}\n${pageSource}`

  assert.match(panelSource, /data\?\.pne2026PublicDiagnostic/)
  assert.match(panelSource, /publicDiagnostic\?\.themes/)
  assert.match(panelSource, /publicDiagnostic\?\.goals/)
  assert.doesNotMatch(combined, /decisionSummary|analysis\.indicators|attentionItems|preservedItems|investigationItems|municipalActionItems|coordinationItems/)
  assert.doesNotMatch(combined, /DiagnosticFinancingSection|buildPublicFinancingItems|collectPublicFinancingSources/)
  assert.doesNotMatch(presentationSource, /goalAttained|favorableDifference\s*[+-]|remainingGap\s*=|performancePercentile|\.sort\s*\(/)
})

test('rendered public route excludes removed and prohibited language', async () => {
  const contract = await readContract('bento-goncalves')
  const text = visibleText(renderDiagnostic(contract, 'Bento Gonçalves'))
    .replace(/contrato temporário/gi, 'vínculo temporário')
  const prohibited = [
    'investigação', 'evidência', 'governabilidade', 'pactuação', 'articulação',
    'coorte', 'proxy', 'benchmark', 'percentil', 'quartil', 'ranking', 'score',
    'prioridade', 'contrato', 'schema', 'pipeline', 'gate', 'null', 'indisponível',
    'pendente', 'a verificar', 'não localizado', 'fonte ausente', 'aguardando',
    'cobertura', 'limitações', 'programas que podem apoiar', 'financiamento',
    'recurso disponível', 'elegibilidade',
  ]
  for (const term of prohibited) assert.doesNotMatch(text, new RegExp(term, 'i'), term)
})

test('DGP3 read-only audit reproduces all 497 public contracts and selects inspection cases', async (t) => {
  const index = JSON.parse(await readFile(
    new URL('../../public/data/municipios_index.json', import.meta.url),
    'utf8',
  ))
  const metrics = {
    contracts: 0,
    results: 0,
    maintain: 0,
    advance: 0,
    state: 0,
    statewide: 0,
    similar: 0,
    trajectory: 0,
    estimatedYears: 0,
    duplicates: 0,
    emptyGoals: 0,
    outsideAllowlist: 0,
    missingSources: 0,
    financingItems: 0,
  }
  const rows = []

  for (const municipality of index.municipios) {
    const contract = await readContract(municipality.slug)
    const diagnostic = contract.pne2026PublicDiagnostic
    assert.equal(diagnostic?.version, PUBLIC_VERSION, municipality.slug)
    const results = diagnostic.goals.flatMap((goal) => goal.results)
    const ids = results.map((result) => result.indicatorId)
    const allowed = new Set(diagnostic.scope.allowedIndicatorIds)
    const sources = new Set(diagnostic.sources.map((source) => source.id))
    const serialized = JSON.stringify(diagnostic)

    metrics.contracts += 1
    metrics.results += results.length
    metrics.maintain += results.filter((result) => result.classification === 'maintain').length
    metrics.advance += results.filter((result) => result.classification === 'advance').length
    metrics.state += results.filter((result) => result.stateComparison).length
    metrics.statewide += results.filter((result) => result.statewidePosition).length
    metrics.similar += results.filter((result) => result.similarMunicipalities).length
    metrics.trajectory += results.filter((result) => result.trajectory).length
    metrics.estimatedYears += results.filter((result) => result.trajectory?.estimatedAchievementYear).length
    metrics.duplicates += ids.length - new Set(ids).size
    metrics.emptyGoals += diagnostic.goals.filter((goal) => !goal.results.length).length
    metrics.outsideAllowlist += results.filter((result) => !allowed.has(result.indicatorId)).length
    metrics.missingSources += results.filter((result) => (
      !result.sourceIds.length || result.sourceIds.some((sourceId) => !sources.has(sourceId))
    )).length
    metrics.financingItems += /financiamento|programas que podem apoiar|recurso disponível|elegibilidade/i.test(serialized) ? 1 : 0

    rows.push({
      slug: municipality.slug,
      resultCount: results.length,
      maintainCount: results.filter((result) => result.classification === 'maintain').length,
      hasAtMost: results.some((result) => result.target.direction === 'at_most'),
      hasPartialComponent: results.some((result) => result.relationship === 'partial_component'),
      hasDirectResult: results.some((result) => result.relationship === 'direct'),
      hasAchievementReading: results.some((result) => result.trajectory?.achievementReading),
      hasValueAboveOneHundred: results.some((result) => result.current.displayValue > 100),
      hasMultiple: diagnostic.goals.some((goal) => goal.results.length > 1),
      hasState: results.some((result) => result.stateComparison),
      lacksState: results.some((result) => !result.stateComparison),
      hasTrajectory: results.some((result) => result.trajectory),
      lacksTrajectory: results.some((result) => !result.trajectory),
      longestSourceLabel: Math.max(...diagnostic.sources.map(
        (source) => `${source.publicTitle} ${source.period}`.length,
      )),
    })
  }

  assert.deepEqual(metrics, {
    contracts: 497,
    results: 9119,
    maintain: 1360,
    advance: 7759,
    state: 6148,
    statewide: 5964,
    similar: 6086,
    trajectory: 1982,
    estimatedYears: 583,
    duplicates: 0,
    emptyGoals: 0,
    outsideAllowlist: 0,
    missingSources: 0,
    financingItems: 0,
  })
  assert.equal(Math.min(...rows.map((row) => row.resultCount)), 15)
  assert.equal(Math.max(...rows.map((row) => row.resultCount)), 20)

  const cases = {
    fifteen: rows.find((row) => row.resultCount === 15)?.slug,
    twenty: rows.find((row) => row.resultCount === 20)?.slug,
    mostMaintain: rows.toSorted((a, b) => b.maintainCount - a.maintainCount)[0]?.slug,
    noMaintain: rows.find((row) => row.maintainCount === 0)?.slug,
    atMost: rows.find((row) => row.hasAtMost)?.slug,
    partialComponent: rows.find((row) => row.hasPartialComponent)?.slug,
    directResult: rows.find((row) => row.hasDirectResult)?.slug,
    achievementReading: rows.find((row) => row.hasAchievementReading)?.slug,
    valueAboveOneHundred: rows.find((row) => row.hasValueAboveOneHundred)?.slug,
    multipleResults: rows.find((row) => row.hasMultiple)?.slug,
    withState: rows.find((row) => row.hasState)?.slug,
    withoutState: rows.find((row) => row.lacksState)?.slug,
    withTrajectory: rows.find((row) => row.hasTrajectory)?.slug,
    withoutTrajectory: rows.find((row) => row.lacksTrajectory)?.slug,
    longestSourceLabel: rows.toSorted(
      (a, b) => b.longestSourceLabel - a.longestSourceLabel,
    )[0]?.slug,
  }
  const { valueAboveOneHundred, ...requiredCases } = cases
  assert.ok(Object.values(requiredCases).every(Boolean))
  assert.equal(valueAboveOneHundred, undefined)
  t.diagnostic(`inspection-cases=${JSON.stringify(cases)}`)
})

test('diagnostic remains lazy and outside the initial payload', async () => {
  const [initialPayload, staticDataSource, pageSource, routerSource] = await Promise.all([
    readFile(new URL('../../public/data/municipios/agudo/index.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../../src/data/staticData.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/pages/Diagnostico.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../src/app/AppPageRouter.tsx', import.meta.url), 'utf8'),
  ])
  assert.equal('diagnostico_v2' in initialPayload.pne_2026_2036, false)
  assert.match(staticDataSource, /\/diagnostico\.json/)
  assert.match(pageSource, /useMunicipioDiagnostic\(slug\)/)
  assert.match(routerSource, /const LazyDiagnostico = lazy/)
})
