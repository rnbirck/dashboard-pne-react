const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const MUNICIPALITY = 'Agudo'
const MUNICIPALITY_SLUG = 'agudo'
const ROUTE = '#financeiros-panorama?municipio=agudo&indicatorId=creche%2Calfabetizacao&programId=salario_educacao_qsem%2Cfundeb_vaar'
const VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]
const ARTIFACT_DIR = path.resolve('artifacts/municipal-finance-p5c1-1-2026-07-20')

async function seedMunicipality(page) {
  await page.addInitScript(({ municipality }) => {
    localStorage.setItem('pne_dashboard_municipio', municipality)
  }, { municipality: MUNICIPALITY })
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  assert.ok(
    dimensions.scrollWidth <= dimensions.clientWidth,
    `${label}: overflow horizontal (${dimensions.scrollWidth} > ${dimensions.clientWidth})`,
  )
}

async function gridColumnCount(locator) {
  return locator.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length)
}

async function verifyPanorama(page, viewport, navigateFromDiagnostic) {
  const label = `${viewport.width}x${viewport.height}`
  const financeRequests = []
  page.on('request', (request) => {
    if (/\/data\/municipios\/[^/]+\/financeiro\.json$/.test(new URL(request.url()).pathname)) {
      financeRequests.push(request.url())
    }
  })

  if (navigateFromDiagnostic) {
    await page.goto(`${BASE_URL}/#diagnostico`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { level: 1, name: new RegExp(`^${MUNICIPALITY}:`) }).waitFor()
    assert.equal(financeRequests.length, 0, `${label}: financeiro não carrega no Diagnóstico`)
    await page.getByRole('link', { name: 'Abrir panorama financeiro do município' }).click()
  } else {
    await page.goto(`${BASE_URL}/${ROUTE}`, { waitUntil: 'domcontentloaded' })
  }

  await page.getByRole('heading', {
    level: 1,
    name: `${MUNICIPALITY}: panorama financeiro da educação`,
  }).waitFor({ state: 'visible' })
  await page.getByRole('heading', { name: 'Fundeb e complementações — previsão 2026' }).waitFor()

  assert.ok(financeRequests.length >= 1, `${label}: contrato financeiro carregado na rota`)
  assert.ok(financeRequests.every((url) => url.includes(`/${MUNICIPALITY_SLUG}/financeiro.json`)))
  assert.match(page.url(), /#financeiros-panorama\?/) 
  const hashParams = new URLSearchParams(page.url().split('?')[1])
  assert.equal(hashParams.get('municipio'), MUNICIPALITY_SLUG)
  assert.ok(hashParams.get('indicatorId'))
  assert.ok(hashParams.get('programId'))

  const panorama = page.locator('.municipal-finance-panorama')
  const summary = panorama.locator('.municipal-finance-summary-grid').first()
  assert.equal(await summary.locator('.municipal-finance-summary-card').count(), 4, `${label}: quatro cards principais`)
  const expectedSummaryColumns = viewport.width > 1180 ? 4 : viewport.width > 620 ? 2 : 1
  assert.equal(await gridColumnCount(summary), expectedSummaryColumns, `${label}: grade principal responsiva`)

  const primaryGrid = panorama.locator('.municipal-finance-primary-grid').first()
  const primaryDisplay = await primaryGrid.evaluate((element) => getComputedStyle(element).display)
  if (viewport.width > 1024) {
    assert.equal(primaryDisplay, 'grid', `${label}: duas pilhas independentes no desktop`)
    assert.equal(await gridColumnCount(primaryGrid), 2, `${label}: grade superior em duas colunas`)
  } else {
    assert.equal(primaryDisplay, 'flex', `${label}: blocos empilhados até 1024 px`)
  }
  assert.equal(await panorama.locator('.municipal-finance-fundeb-list > li').count(), 4, `${label}: quatro linhas de Fundeb`)
  assert.equal(await panorama.locator('.municipal-finance-execution-flow li').count(), 3, `${label}: três estágios de execução`)
  assert.equal(await panorama.locator('.municipal-finance-qse-groups > article').count(), 3, `${label}: três grupos de QSE`)
  assert.equal(await panorama.locator('.municipal-finance-coverage-grid--highlights > div').count(), 3, `${label}: três dimensões em destaque`)
  assert.equal(await panorama.locator('.municipal-finance-coverage-disclosure .municipal-finance-coverage-grid > div').count(), 7, `${label}: sete dimensões no detalhe`)
  assert.equal(await panorama.locator('table').count(), 0, `${label}: sem tabelas largas`)

  const executionBox = await panorama.locator('.municipal-finance-execution').boundingBox()
  const fundebBox = await panorama.locator('.municipal-finance-fundeb').boundingBox()
  const qseBox = await panorama.locator('.municipal-finance-qse').boundingBox()
  assert.ok(executionBox && fundebBox && qseBox, `${label}: blocos principais visíveis`)
  if (viewport.width > 1024) {
    assert.ok(executionBox.x < fundebBox.x, `${label}: execução na coluna esquerda`)
    assert.ok(Math.abs(executionBox.x - qseBox.x) < 2, `${label}: QSE na mesma pilha da execução`)
    assert.ok(qseBox.y - (executionBox.y + executionBox.height) <= 24, `${label}: sem vazio relevante sob execução`)
    assert.ok(qseBox.y < fundebBox.y + fundebBox.height, `${label}: QSE começa antes do fim do Fundeb`)
  } else {
    assert.ok(executionBox.y < fundebBox.y && fundebBox.y < qseBox.y, `${label}: ordem Execução, Fundeb e QSE`)
  }

  assert.equal(await panorama.locator('.municipal-finance-coverage-disclosure').evaluate((element) => element.open), false)
  assert.equal(await panorama.locator('.municipal-finance-sources__disclosure').evaluate((element) => element.open), false)
  assert.equal(await panorama.locator('.municipal-finance-fundeb-disclosure').evaluate((element) => element.open), false)

  await panorama.getByText('R$ 1,05 mi', { exact: true }).first().waitFor()
  const qseValue = summary.locator('.municipal-finance-summary-card').filter({ hasText: 'QSE distribuída' }).locator('.municipal-finance-value')
  assert.match(await qseValue.getAttribute('title'), /R\$\s*1\.045\.009,11/)
  assert.equal(await panorama.getByText('Mapeamento pendente', { exact: true }).count() >= 3, true)
  assert.equal(
    await panorama.getByText(
      'Os valores da DCA ainda não foram reconciliados com o SIOPE para o mesmo exercício.',
      { exact: true },
    ).count(),
    1,
  )

  const backLink = panorama.getByRole('link', { name: 'Voltar ao Diagnóstico municipal' })
  const backHref = await backLink.getAttribute('href')
  assert.match(backHref, /^#diagnostico\?/)
  const backParams = new URLSearchParams(backHref.split('?')[1])
  assert.equal(backParams.get('municipio'), MUNICIPALITY_SLUG)
  assert.ok(backParams.get('indicatorId'))
  assert.ok(backParams.get('programId'))

  const prohibited = /capacidade financeira|recursos disponíveis|saúde financeira|eficiência financeira|ranking|recomendação automática/i
  assert.doesNotMatch(await panorama.innerText(), prohibited, `${label}: linguagem proibida ausente`)
  const internalOverflow = await panorama.locator('.municipal-finance-section').evaluateAll((elements) => (
    elements.map((element) => ({ x: getComputedStyle(element).overflowX, y: getComputedStyle(element).overflowY }))
  ))
  assert.ok(internalOverflow.every(({ x, y }) => !['auto', 'scroll'].includes(x) && !['auto', 'scroll'].includes(y)))
  await assertNoHorizontalOverflow(page, `Panorama financeiro ${label}`)

  if (viewport.width === 1366 || viewport.width === 390) {
    await page.screenshot({
      fullPage: true,
      path: path.join(ARTIFACT_DIR, `agudo-${label}.png`),
    })
  }
}

async function verifyLoadingState(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  await seedMunicipality(page)
  let release
  await page.route('**/data/municipios/agudo/financeiro.json', async (route) => {
    await new Promise((resolve) => { release = resolve })
    await route.continue()
  })
  await page.goto(`${BASE_URL}/${ROUTE}`, { waitUntil: 'domcontentloaded' })
  await page.locator('.municipal-finance-skeleton').waitFor()
  assert.equal(await page.locator('.municipal-finance-summary-card.state-skeleton').count(), 4)
  release()
  await page.getByRole('heading', { name: 'Fundeb e complementações — previsão 2026' }).waitFor()
  await context.close()
}

async function verifyTerminalState(browser, status, expectedText) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  await seedMunicipality(page)
  await page.route('**/data/municipios/agudo/financeiro.json', async (route) => {
    if (status === 'absent') {
      await route.fulfill({ status: 404, body: '' })
    } else if (status === 'incompatible') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ schemaVersion: 'municipal-finance-v2' }),
      })
    } else {
      await route.fulfill({ status: 503, body: '' })
    }
  })
  await page.goto(`${BASE_URL}/${ROUTE}`, { waitUntil: 'domcontentloaded' })
  await page.getByText(expectedText, { exact: true }).waitFor()
  await assertNoHorizontalOverflow(page, `Estado ${status}`)
  await context.close()
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const errors = []
  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({ viewport })
      const page = await context.newPage()
      await seedMunicipality(page)
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`${viewport.width}x${viewport.height}: ${message.text()}`)
      })
      page.on('pageerror', (error) => errors.push(`${viewport.width}x${viewport.height}: ${error.message}`))
      await verifyPanorama(page, viewport, viewport.width === 1366)
      await context.close()
    }

    await verifyLoadingState(browser)
    await verifyTerminalState(browser, 'absent', 'Panorama financeiro ainda não disponível para este município.')
    await verifyTerminalState(browser, 'incompatible', 'Os dados financeiros precisam ser atualizados antes da apresentação.')
    await verifyTerminalState(browser, 'error', 'Não foi possível carregar os dados financeiros.')
    assert.deepEqual(errors, [], `Erros no console: ${errors.join('\n')}`)
  } finally {
    await browser.close()
  }
  console.log(`Panorama financeiro P5-C1.1 validado em ${VIEWPORTS.length} viewports.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
