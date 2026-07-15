import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import {
  baselineName,
  parseVisualArguments,
  persistBaseline,
  selectVisualCases,
  validateCatalogManifest,
} from './dev-ui-visual-core.mjs'

const require = createRequire(import.meta.url)
const {
  DEFAULT_CHANNEL_TOLERANCE,
  DEFAULT_MAX_DIFFERENT_PIXEL_RATIO,
  comparePng,
  writeComparisonArtifacts,
} = require('./visual-comparison.cjs')

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
const BASE_URL = 'http://127.0.0.1:4175/'
const ARTIFACT_ROOT = path.join(ROOT, 'tests', 'dev-ui-visual')
const BASELINE_DIR = path.join(ARTIFACT_ROOT, 'baselines')
const RESULT_DIR = path.join(ARTIFACT_ROOT, 'results')
const DIFF_DIR = path.join(ARTIFACT_ROOT, 'diffs')

function elapsed(startedAt) {
  return Math.round(performance.now() - startedAt)
}

function startCatalogServer() {
  const logs = []
  const child = spawn(process.execPath, [
    VITE_BIN,
    '--config',
    'vite.dev-ui.config.ts',
    '--host',
    '127.0.0.1',
    '--port',
    '4175',
    '--strictPort',
  ], {
    cwd: ROOT,
    env: { ...process.env, DEV_UI_VISUAL: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', (chunk) => {
      logs.push(String(chunk))
      if (logs.length > 40) logs.shift()
    })
  }
  return { child, logs }
}

async function waitForServer(child, logs, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Servidor do catálogo encerrou com código ${child.exitCode}.\n${logs.join('')}`)
    }
    try {
      const response = await fetch(BASE_URL)
      if (response.ok) return
    } catch {
      // O Vite ainda está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Servidor do catálogo não respondeu em ${BASE_URL}.\n${logs.join('')}`)
}

function isMunicipalDataRequest(url) {
  const pathname = new URL(url).pathname
  return /\/data\/.*\.json$/i.test(pathname)
}

async function readManifest(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  const manifestNode = page.locator('[data-testid="catalog-manifest"]')
  await manifestNode.waitFor({ state: 'attached' })
  const text = await manifestNode.textContent()
  if (!text) throw new Error('O catálogo não expôs seu manifesto visual.')
  return validateCatalogManifest(JSON.parse(text))
}

function selectedUpdateCommand(testCase) {
  return `npm run test:dev-ui:visual:update -- --scenario ${testCase.id} --viewport ${testCase.viewport}`
}

async function stabilizePage(page, testCase) {
  const preview = page.locator('[data-testid="catalog-preview"]')
  const catalogError = page.locator('[data-catalog-error="true"]')
  await Promise.race([
    preview.waitFor({ state: 'visible', timeout: 15000 }),
    catalogError.waitFor({ state: 'visible', timeout: 15000 }).then(async () => {
      throw new Error(await catalogError.innerText())
    }),
  ])
  await preview.locator('xpath=self::*[@data-catalog-ready="true"]').waitFor({ state: 'attached', timeout: 15000 })
  const measurements = await page.evaluate(async ({ expectedScenario, expectedViewport }) => {
    await document.fonts?.ready
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const target = document.querySelector('[data-testid="catalog-preview"]')
    const rect = target?.getBoundingClientRect()
    const incompleteImages = [...document.images].filter((image) => !image.complete).length
    const tableRegion = document.querySelector('.platform-data-table-region, .education-table-wrap, .fundeb-table-wrap')
    let tableOverflow = null
    if (tableRegion instanceof HTMLElement) {
      const initialScrollLeft = tableRegion.scrollLeft
      tableRegion.scrollLeft = 24
      tableOverflow = {
        clientWidth: tableRegion.clientWidth,
        documentFitsViewport: document.documentElement.scrollWidth <= window.innerWidth,
        moved: tableRegion.scrollLeft > initialScrollLeft,
        overflowX: getComputedStyle(tableRegion).overflowX,
        scrollWidth: tableRegion.scrollWidth,
      }
      tableRegion.scrollLeft = initialScrollLeft
    }
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    return {
      fontStatus: document.fonts?.status ?? 'unsupported',
      height: rect?.height ?? 0,
      incompleteImages,
      ready: target?.getAttribute('data-catalog-ready'),
      scenario: target?.getAttribute('data-scenario-id'),
      viewport: target?.getAttribute('data-viewport'),
      width: rect?.width ?? 0,
      matchesScenario: target?.getAttribute('data-scenario-id') === expectedScenario,
      matchesViewport: target?.getAttribute('data-viewport') === expectedViewport,
      tableOverflow,
    }
  }, { expectedScenario: testCase.id, expectedViewport: testCase.viewport })
  if (measurements.fontStatus !== 'loaded') throw new Error(`${testCase.id}: fontes não terminaram de carregar.`)
  if (measurements.incompleteImages !== 0) throw new Error(`${testCase.id}: existem imagens internas ainda carregando.`)
  if (measurements.ready !== 'true') throw new Error(`${testCase.id}: React não sinalizou renderização final.`)
  if (!measurements.matchesScenario || !measurements.matchesViewport) {
    throw new Error(`${testCase.id}: o catálogo abriu scenario=${measurements.scenario} viewport=${measurements.viewport}.`)
  }
  if (testCase.id === 'tables-content-overflow' && testCase.viewport === 'mobile') {
    if (!measurements.tableOverflow) throw new Error(`${testCase.id}: região tabular não encontrada.`)
    if (measurements.tableOverflow.overflowX !== 'auto') throw new Error(`${testCase.id}: overflow horizontal local não está automático.`)
    if (measurements.tableOverflow.scrollWidth <= measurements.tableOverflow.clientWidth || !measurements.tableOverflow.moved) {
      throw new Error(`${testCase.id}: todas as colunas não permanecem alcançáveis por rolagem local.`)
    }
    if (!measurements.tableOverflow.documentFitsViewport) throw new Error(`${testCase.id}: tabela expandiu o documento no mobile.`)
  }
  if (testCase.id === 'charts-line-series') {
    const segmentCounts = await page.locator('[data-series-segments]').evaluateAll((elements) => (
      elements.map((element) => Number(element.getAttribute('data-series-segments')))
    ))
    if (!segmentCounts.some((count) => count > 1)) {
      throw new Error(`${testCase.id}: a série parcial foi conectada através de um valor nulo.`)
    }
    const globalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    if (globalOverflow) throw new Error(`${testCase.id}: gráficos expandiram o documento.`)
  }
  if (testCase.id === 'charts-types-scale') {
    const stackedMark = page.locator('.education-chart--stacked .chart-mark').first()
    await stackedMark.focus()
    const tooltip = page.locator('.education-chart--stacked .chart-tooltip')
    await tooltip.waitFor({ state: 'visible' })
    const tooltipReadings = await tooltip.locator('.chart-tooltip__reading').count()
    if (tooltipReadings < 2) throw new Error(`${testCase.id}: tooltip empilhado não expôs as múltiplas séries.`)
    const tooltipFits = await tooltip.evaluate((element) => {
      const tooltipRect = element.getBoundingClientRect()
      const previewRect = document.querySelector('[data-testid="catalog-preview"]')?.getBoundingClientRect()
      return Boolean(previewRect) && tooltipRect.left >= previewRect.left && tooltipRect.right <= previewRect.right
    })
    if (!tooltipFits) throw new Error(`${testCase.id}: tooltip ultrapassou a largura do preview.`)
    await stackedMark.press('Escape')
    await tooltip.waitFor({ state: 'hidden' })
  }
  return measurements
}

async function captureCase(page, testCase, update) {
  const startedAt = performance.now()
  await page.setViewportSize({ height: testCase.height, width: testCase.width })
  const url = new URL(BASE_URL)
  url.searchParams.set('scenario', testCase.id)
  url.searchParams.set('viewport', testCase.viewport)
  url.searchParams.set('visual', '1')
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' })
  const measurements = await stabilizePage(page, testCase)
  await page.mouse.move(0, 0)
  const selector = testCase.captureTarget === 'component'
    ? '[data-testid="catalog-component"]'
    : '[data-testid="catalog-preview"]'
  const actual = await page.locator(selector).screenshot({ animations: 'disabled' })
  const name = baselineName(testCase)
  const baselinePath = path.join(BASELINE_DIR, name)
  const resultPath = path.join(RESULT_DIR, name)
  fs.mkdirSync(RESULT_DIR, { recursive: true })
  fs.writeFileSync(resultPath, actual)
  const updateCommand = selectedUpdateCommand(testCase)
  const expected = persistBaseline({ actualBuffer: actual, baselinePath, update, updateCommand })

  if (update) {
    console.log(`[dev-ui-visual] scenario=${testCase.id} viewport=${testCase.viewport} status=updated dimensions=${measurements.width}x${measurements.height}px baseline=${baselinePath} durationMs=${elapsed(startedAt)}`)
    return
  }

  const comparison = comparePng(actual, expected, DEFAULT_CHANNEL_TOLERANCE)
  const maxDiffRatio = testCase.maxDiffRatio ?? DEFAULT_MAX_DIFFERENT_PIXEL_RATIO
  if (!comparison.sameDimensions || comparison.ratio > maxDiffRatio) {
    const artifacts = writeComparisonArtifacts(DIFF_DIR, name, comparison)
    const dimensions = `obtidas ${comparison.actual.width}x${comparison.actual.height}px; esperadas ${comparison.expected.width}x${comparison.expected.height}px`
    throw new Error([
      `${testCase.id} (${testCase.viewport}): regressão visual.`,
      `Dimensões: ${dimensions}.`,
      `Pixels divergentes: ${comparison.differentPixels}/${comparison.totalPixels} (${(comparison.ratio * 100).toFixed(3)}%; limite ${(maxDiffRatio * 100).toFixed(3)}%).`,
      `Atual: ${resultPath}. Esperado: ${artifacts.expected}. Diff: ${artifacts.diff}.`,
      `Atualize somente este baseline, se a mudança for intencional: ${updateCommand}`,
    ].join(' '))
  }

  console.log(`[dev-ui-visual] scenario=${testCase.id} viewport=${testCase.viewport} status=passed dimensions=${comparison.actual.width}x${comparison.actual.height}px differentPixels=${comparison.differentPixels} ratio=${(comparison.ratio * 100).toFixed(3)}% durationMs=${elapsed(startedAt)}`)
}

async function main() {
  const filters = parseVisualArguments(process.argv.slice(2))
  fs.mkdirSync(BASELINE_DIR, { recursive: true })
  fs.rmSync(RESULT_DIR, { force: true, recursive: true })
  fs.rmSync(DIFF_DIR, { force: true, recursive: true })
  const startupStartedAt = performance.now()
  const server = startCatalogServer()
  let browser
  try {
    await waitForServer(server.child, server.logs)
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({
      reducedMotion: 'reduce',
      viewport: { height: 900, width: 1366 },
    })
    const municipalRequests = []
    const consoleErrors = []
    page.on('request', (request) => {
      if (isMunicipalDataRequest(request.url())) municipalRequests.push(request.url())
    })
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    const manifest = await readManifest(page)
    const cases = selectVisualCases(manifest, filters)
    const startupMs = elapsed(startupStartedAt)
    const executionStartedAt = performance.now()
    const failures = []
    console.log(`[dev-ui-visual] server=${BASE_URL} startupMs=${startupMs} selected=${cases.length} update=${filters.update} filters=${JSON.stringify(filters)}`)
    for (const testCase of cases) {
      try {
        await captureCase(page, testCase, filters.update)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        failures.push(`${testCase.id}.${testCase.viewport}: ${message}`)
        console.error(`[dev-ui-visual] scenario=${testCase.id} viewport=${testCase.viewport} status=failed message=${message}`)
      }
    }
    if (municipalRequests.length) {
      failures.push(`Requisições municipais detectadas: ${[...new Set(municipalRequests)].join(', ')}`)
    }
    if (consoleErrors.length) failures.push(`Erros no console: ${consoleErrors.join(' | ')}`)
    const executionMs = elapsed(executionStartedAt)
    console.log(`[dev-ui-visual] summary total=${cases.length} passed=${cases.length - failures.length} failed=${failures.length} startupMs=${startupMs} executionMs=${executionMs} totalMs=${startupMs + executionMs} municipalRequests=${municipalRequests.length}`)
    if (failures.length) throw new Error(`Falhas na regressão visual do catálogo:\n- ${failures.join('\n- ')}`)
  } finally {
    if (browser) await browser.close()
    server.child.kill()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
