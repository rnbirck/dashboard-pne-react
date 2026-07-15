import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CATALOG_CATEGORY_OPTIONS,
  PREVIEW_WIDTHS,
} from './types'
import type { CatalogCategory, PreviewWidth } from './types'
import { catalogManifest, catalogScenarios } from './scenarios'

interface CatalogLocation {
  error: string | null
  previewWidth: PreviewWidth
  scenarioId: string
  visualMode: boolean
}

const validScenarioIds = catalogScenarios.map((scenario) => scenario.id)
const validPreviewWidths = PREVIEW_WIDTHS.map((viewport) => viewport.key)

function readCatalogLocation(): CatalogLocation {
  const params = new URLSearchParams(window.location.search)
  const scenarioId = params.get('scenario') ?? catalogScenarios[0].id
  const viewport = params.get('viewport') ?? 'fluid'
  const visualMode = params.get('visual') === '1'

  if (!validScenarioIds.includes(scenarioId)) {
    return {
      error: `Cenário inválido: ${scenarioId}.`,
      previewWidth: 'fluid',
      scenarioId: catalogScenarios[0].id,
      visualMode,
    }
  }

  if (!validPreviewWidths.includes(viewport as PreviewWidth)) {
    return {
      error: `Viewport inválido: ${viewport}.`,
      previewWidth: 'fluid',
      scenarioId,
      visualMode,
    }
  }

  if (visualMode && viewport === 'fluid') {
    return {
      error: 'O modo de regressão visual exige desktop, notebook ou mobile.',
      previewWidth: 'fluid',
      scenarioId,
      visualMode,
    }
  }

  return {
    error: null,
    previewWidth: viewport as PreviewWidth,
    scenarioId,
    visualMode,
  }
}

function replaceCatalogQuery(scenarioId: string, previewWidth: PreviewWidth) {
  const url = new URL(window.location.href)
  url.searchParams.set('scenario', scenarioId)
  url.searchParams.set('viewport', previewWidth)
  window.history.replaceState(null, '', url)
}

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

async function waitForImages(root: HTMLElement) {
  const pendingImages = Array.from(root.querySelectorAll('img')).filter((image) => !image.complete)
  await Promise.all(pendingImages.map((image) => new Promise<void>((resolve) => {
    image.addEventListener('load', () => resolve(), { once: true })
    image.addEventListener('error', () => resolve(), { once: true })
  })))
}

function CatalogManifest() {
  return (
    <script data-testid="catalog-manifest" type="application/json">
      {JSON.stringify(catalogManifest)}
    </script>
  )
}

function CatalogError({ message }: { message: string }) {
  return (
    <main className="dev-ui-catalog-error" data-catalog-error="true">
      <h1>Não foi possível abrir o cenário do catálogo</h1>
      <p>{message}</p>
      <p><strong>Cenários válidos:</strong> {validScenarioIds.join(', ')}</p>
      <p><strong>Viewports válidos:</strong> {validPreviewWidths.join(', ')}</p>
      <CatalogManifest />
    </main>
  )
}

export function ComponentCatalog() {
  const initialLocation = useMemo(() => readCatalogLocation(), [])
  const initialScenario = catalogScenarios.find((scenario) => scenario.id === initialLocation.scenarioId)
    ?? catalogScenarios[0]
  const [category, setCategory] = useState<CatalogCategory>(initialScenario.category)
  const [scenarioId, setScenarioId] = useState(initialScenario.id)
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>(initialLocation.previewWidth)
  const [catalogReady, setCatalogReady] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const categoryScenarios = useMemo(
    () => catalogScenarios.filter((scenario) => scenario.category === category),
    [category],
  )
  const currentScenario = catalogScenarios.find((scenario) => scenario.id === scenarioId) ?? initialScenario
  const currentWidth = PREVIEW_WIDTHS.find((option) => option.key === previewWidth) ?? PREVIEW_WIDTHS[3]

  useEffect(() => {
    let cancelled = false
    setCatalogReady(false)

    async function stabilizePreview() {
      await document.fonts?.ready
      const preview = previewRef.current
      if (!preview) return
      await waitForImages(preview)

      let previousSignature = ''
      let stableFrames = 0
      for (let frame = 0; frame < 60 && stableFrames < 3; frame += 1) {
        await waitForAnimationFrame()
        const rect = preview.getBoundingClientRect()
        const signature = `${rect.width.toFixed(2)}x${rect.height.toFixed(2)}:${preview.childElementCount}`
        stableFrames = signature === previousSignature ? stableFrames + 1 : 0
        previousSignature = signature
      }

      if (!cancelled && stableFrames >= 3) setCatalogReady(true)
    }

    void stabilizePreview()
    return () => {
      cancelled = true
    }
  }, [previewWidth, scenarioId])

  if (initialLocation.error) return <CatalogError message={initialLocation.error} />

  function selectCategory(nextCategory: CatalogCategory) {
    const firstScenario = catalogScenarios.find((scenario) => scenario.category === nextCategory)
    setCategory(nextCategory)
    if (firstScenario) {
      setScenarioId(firstScenario.id)
      replaceCatalogQuery(firstScenario.id, previewWidth)
    }
  }

  function selectScenario(nextScenarioId: string) {
    setScenarioId(nextScenarioId)
    replaceCatalogQuery(nextScenarioId, previewWidth)
  }

  function selectPreviewWidth(nextPreviewWidth: PreviewWidth) {
    setPreviewWidth(nextPreviewWidth)
    replaceCatalogQuery(scenarioId, nextPreviewWidth)
  }

  const preview = (
    <div
      className="dev-ui-preview-content"
      data-catalog-ready={catalogReady ? 'true' : 'false'}
      data-scenario-id={currentScenario.id}
      data-testid="catalog-preview"
      data-viewport={previewWidth}
      ref={previewRef}
    >
      <div data-testid="catalog-component">{currentScenario.render()}</div>
    </div>
  )

  if (initialLocation.visualMode) {
    return (
      <>
        <main
          className="dev-ui-visual-stage"
          data-preview-width={previewWidth}
          data-visual-test="true"
          data-viewport={previewWidth}
        >
          {preview}
        </main>
        <CatalogManifest />
      </>
    )
  }

  return (
    <main className="dev-ui-catalog">
      <header className="dev-ui-header">
        <div>
          <span className="dev-ui-eyebrow">Dashboard PNE · ambiente isolado</span>
          <h1>Catálogo visual de desenvolvimento</h1>
          <p>Componentes reais, fixtures determinísticas e estados controlados sem carregamento municipal.</p>
        </div>
        <span className="dev-ui-environment-badge">Somente desenvolvimento</span>
      </header>

      <div className="dev-ui-layout">
        <aside className="dev-ui-sidebar" aria-label="Navegação do catálogo">
          <nav aria-label="Categorias de componentes">
            <h2>Categorias</h2>
            <ul>
              {CATALOG_CATEGORY_OPTIONS.map((item) => {
                const count = catalogScenarios.filter((scenario) => scenario.category === item.label).length
                return (
                  <li key={item.id}>
                    <button
                      aria-current={item.label === category ? 'page' : undefined}
                      data-category={item.label}
                      data-category-id={item.id}
                      className={item.label === category ? 'is-active' : ''}
                      onClick={() => selectCategory(item.label)}
                      type="button"
                    >
                      <span>{item.label}</span>
                      <small>{count}</small>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="dev-ui-scenario-nav">
            <h2>Cenários</h2>
            {categoryScenarios.map((scenario) => (
              <button
                aria-pressed={scenario.id === currentScenario.id}
                className={scenario.id === currentScenario.id ? 'is-active' : ''}
                data-scenario={scenario.id}
                key={scenario.id}
                onClick={() => selectScenario(scenario.id)}
                type="button"
              >
                {scenario.title}
              </button>
            ))}
          </div>
        </aside>

        <section className="dev-ui-workbench" aria-labelledby="dev-ui-current-scenario">
          <div className="dev-ui-toolbar">
            <div className="dev-ui-scenario-copy">
              <span>{currentScenario.category}</span>
              <h2 id="dev-ui-current-scenario">{currentScenario.title}</h2>
              <p>{currentScenario.description}</p>
              <small><strong>Objetivo:</strong> {currentScenario.objective}</small>
            </div>

            <fieldset className="dev-ui-width-selector">
              <legend>Largura da visualização</legend>
              <div>
                {PREVIEW_WIDTHS.map((option) => (
                  <button
                    aria-pressed={previewWidth === option.key}
                    className={previewWidth === option.key ? 'is-active' : ''}
                    data-preview-option={option.key}
                    key={option.key}
                    onClick={() => selectPreviewWidth(option.key)}
                    type="button"
                  >
                    <span>{option.label}</span>
                    <small>{option.detail}</small>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="dev-ui-state-list" aria-label="Estados cobertos">
            {currentScenario.states.map((state) => <span key={state}>{state}</span>)}
          </div>

          <div className="dev-ui-preview-viewport" data-preview-width={previewWidth}>
            <div
              className="dev-ui-preview-canvas"
              style={currentWidth.width
                ? { maxWidth: `${currentWidth.width}px`, minWidth: `${currentWidth.width}px`, width: `${currentWidth.width}px` }
                : { maxWidth: 'none', minWidth: '320px', width: '100%' }}
            >
              <div className="dev-ui-preview-ruler" aria-hidden="true">
                <span>{currentWidth.label}</span>
                <span>{currentWidth.detail}</span>
              </div>
              {preview}
            </div>
          </div>
        </section>
      </div>
      <CatalogManifest />
    </main>
  )
}
