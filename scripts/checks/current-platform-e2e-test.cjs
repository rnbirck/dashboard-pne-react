const assert = require('node:assert/strict')
const { chromium } = require('playwright')

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5173'
const MUNICIPALITY = 'Agudo'
const MUNICIPALITY_SLUG = 'agudo'
const VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 390, height: 844 },
]

async function selectMunicipality(page) {
  const input = page.locator('input[role="combobox"]:visible').first()
  await input.fill(MUNICIPALITY)
  await page.getByRole('option', { name: MUNICIPALITY, exact: true }).first().click()
  await page.getByRole('button', { name: 'Limpar seleção' }).first().waitFor({ state: 'visible' })
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

async function verifyViewport(browser, viewport) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const label = `${viewport.width}x${viewport.height}`
  const browserErrors = []
  const financeRequests = []

  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`))
  page.on('request', (request) => {
    if (/\/data\/municipios\/[^/]+\/financeiro\.json$/.test(new URL(request.url()).pathname)) {
      financeRequests.push(request.url())
    }
  })

  try {
    await page.goto(`${BASE_URL}/#home`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' })
    await selectMunicipality(page)
    await assertNoHorizontalOverflow(page, `Home ${label}`)

    await page.goto(`${BASE_URL}/#educacao?secao=visao-geral`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { level: 1, name: 'Visão geral municipal da educação' }).first().waitFor({ state: 'visible' })
    await page.getByText(MUNICIPALITY, { exact: true }).first().waitFor({ state: 'visible' })
    await assertNoHorizontalOverflow(page, `Educação ${label}`)

    await page.goto(`${BASE_URL}/#diagnostico?municipio=${MUNICIPALITY_SLUG}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', {
      level: 1,
      name: `Diagnóstico educacional de ${MUNICIPALITY}`,
    }).waitFor({ state: 'visible' })
    await page.getByRole('heading', { name: 'Resultados por tema' }).waitFor({ state: 'visible' })
    assert.equal(financeRequests.length, 0, `${label}: financeiro permanece lazy fora da rota`)
    await assertNoHorizontalOverflow(page, `Diagnóstico ${label}`)

    await page.goto(`${BASE_URL}/#financeiros-panorama?municipio=${MUNICIPALITY_SLUG}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { level: 1, name: 'Panorama financeiro' }).waitFor({ state: 'visible' })
    await page.getByRole('heading', { name: 'Fundeb e complementações' }).waitFor({ state: 'visible' })
    await page.getByRole('heading', { name: 'QSE — Quota Salário Educação' }).waitFor({ state: 'visible' })
    assert.ok(financeRequests.some((url) => url.includes(`/${MUNICIPALITY_SLUG}/financeiro.json`)))
    await assertNoHorizontalOverflow(page, `Panorama financeiro ${label}`)

    assert.deepEqual(browserErrors, [], `${label}: erros no navegador`)
  } finally {
    await context.close()
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
    for (const viewport of VIEWPORTS) await verifyViewport(browser, viewport)
  } finally {
    await browser.close()
  }
  console.log(`Plataforma atual validada em ${VIEWPORTS.length} viewports.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
