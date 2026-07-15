import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DEV_UI_OUTPUT = path.join(ROOT, 'artifacts', 'dev-ui-build')
const PUBLIC_OUTPUT = path.join(ROOT, 'artifacts', 'public-build-check')
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
const TSC_BIN = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc')
const DEV_UI_URL = 'http://127.0.0.1:4174/'
const EXPECTED_CATEGORIES = [
  'Fundamentos',
  'Cards',
  'Educação',
  'PNE',
  'Financiamento',
  'Filtros e navegação',
  'Tabelas',
  'Gráficos',
  'Estados da interface',
]

function runNode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: ROOT, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Comando falhou com código ${code}: node ${args.join(' ')}`))
    })
  })
}

async function waitForServer(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // O preview ainda está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Preview do catálogo não respondeu em ${url}.`)
}

function readTextArtifacts(directory) {
  const textExtensions = new Set(['.css', '.html', '.js', '.map'])
  const contents = []
  const pending = [directory]
  while (pending.length) {
    const current = pending.pop()
    if (!current) continue
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) pending.push(fullPath)
      else if (textExtensions.has(path.extname(entry.name))) contents.push(fs.readFileSync(fullPath, 'utf8'))
    }
  }
  return contents.join('\n')
}

async function validateRenderedCatalog() {
  const preview = spawn(process.execPath, [
    VITE_BIN,
    'preview',
    '--config',
    'vite.dev-ui.config.ts',
    '--host',
    '127.0.0.1',
    '--strictPort',
  ], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })

  let previewOutput = ''
  preview.stdout.on('data', (chunk) => { previewOutput += chunk.toString() })
  preview.stderr.on('data', (chunk) => { previewOutput += chunk.toString() })

  try {
    await waitForServer(DEV_UI_URL)
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' })
      const municipalRequests = []
      const pageErrors = []
      page.on('request', (request) => {
        const pathname = new URL(request.url()).pathname
        if (pathname.startsWith('/data/') || pathname.includes('/public/data/')) municipalRequests.push(request.url())
      })
      page.on('pageerror', (error) => pageErrors.push(error.message))

      await page.goto(DEV_UI_URL, { waitUntil: 'networkidle' })
      await page.getByRole('heading', { level: 1, name: 'Catálogo visual de desenvolvimento' }).waitFor({ state: 'visible' })
      assert.equal(await page.locator('[data-category]').count(), EXPECTED_CATEGORIES.length, 'Quantidade inesperada de categorias.')
      const categoryIds = await page.locator('[data-category-id]').evaluateAll((elements) => elements.map((element) => element.getAttribute('data-category-id')))
      assert.equal(new Set(categoryIds).size, EXPECTED_CATEGORIES.length, 'IDs de categoria ausentes ou duplicados.')

      for (const category of EXPECTED_CATEGORIES) {
        const categoryButton = page.locator(`[data-category="${category}"]`)
        assert.equal(await categoryButton.count(), 1, `Categoria ausente ou duplicada: ${category}`)
        await categoryButton.click()
        assert.ok(await page.locator('[data-scenario]').count() >= 1, `Categoria sem cenário renderizado: ${category}`)
      }

      await page.locator('[data-preview-option="mobile"]').click()
      await page.waitForFunction(() => document.querySelector('.dev-ui-preview-viewport')?.getAttribute('data-preview-width') === 'mobile')
      const previewWidth = await page.locator('.dev-ui-preview-canvas').evaluate((element) => element.clientWidth)
      assert.equal(previewWidth, 390, 'O preview Mobile não aplicou 390 px.')

      await page.goto(`${DEV_UI_URL}?scenario=education-detail&viewport=notebook`, { waitUntil: 'domcontentloaded' })
      const directPreview = page.locator('[data-testid="catalog-preview"][data-scenario-id="education-detail"][data-viewport="notebook"]')
      await directPreview.waitFor({ state: 'visible' })
      await page.locator('[data-testid="catalog-preview"][data-catalog-ready="true"]').waitFor({ state: 'attached' })

      await page.goto(`${DEV_UI_URL}?scenario=cenario-inexistente&viewport=desktop`, { waitUntil: 'domcontentloaded' })
      const explicitError = page.locator('[data-catalog-error="true"]')
      await explicitError.waitFor({ state: 'visible' })
      assert.match(await explicitError.innerText(), /Cenário inválido: cenario-inexistente.*Cenários válidos:/s)
      assert.deepEqual(municipalRequests, [], `O catálogo tentou carregar dados municipais: ${municipalRequests.join(', ')}`)
      assert.deepEqual(pageErrors, [], `Erros de página no catálogo: ${pageErrors.join('; ')}`)
    } finally {
      await browser.close()
    }
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : String(error)}\nSaída do preview:\n${previewOutput}`)
  } finally {
    preview.kill()
  }
}

async function main() {
  fs.rmSync(DEV_UI_OUTPUT, { force: true, recursive: true })
  fs.rmSync(PUBLIC_OUTPUT, { force: true, recursive: true })

  try {
    await runNode([TSC_BIN, '--noEmit', '-p', 'tsconfig.dev-ui.json'])
    await runNode([VITE_BIN, 'build', '--config', 'vite.dev-ui.config.ts'])
    assert.ok(fs.existsSync(path.join(DEV_UI_OUTPUT, 'index.html')), 'A entrada isolada não foi compilada.')
    assert.equal(fs.existsSync(path.join(DEV_UI_OUTPUT, 'data')), false, 'O build isolado copiou dados públicos.')
    await validateRenderedCatalog()

    await runNode([VITE_BIN, 'build', '--outDir', 'artifacts/public-build-check', '--emptyOutDir'])
    const publicFiles = fs.readdirSync(PUBLIC_OUTPUT, { recursive: true }).map(String)
    assert.equal(publicFiles.some((file) => /(^|[\\/])dev-ui([\\/]|$)/i.test(file)), false, 'O build público emitiu caminho do catálogo.')
    const publicText = readTextArtifacts(PUBLIC_OUTPUT)
    assert.doesNotMatch(publicText, /src[\\/]dev-ui|Catálogo visual de desenvolvimento/i, 'O bundle público contém código do catálogo.')

    console.log(`Dev UI validation passed: ${EXPECTED_CATEGORIES.length} categorias, entrada renderizável, zero requisições municipais e build público isolado.`)
  } finally {
    fs.rmSync(DEV_UI_OUTPUT, { force: true, recursive: true })
    fs.rmSync(PUBLIC_OUTPUT, { force: true, recursive: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
