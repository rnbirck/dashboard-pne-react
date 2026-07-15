import { useMemo, useState } from 'react'
import { CATALOG_CATEGORIES, PREVIEW_WIDTHS } from './types'
import type { CatalogCategory, PreviewWidth } from './types'
import { catalogScenarios } from './scenarios'

export function ComponentCatalog() {
  const [category, setCategory] = useState<CatalogCategory>('Fundamentos')
  const categoryScenarios = useMemo(
    () => catalogScenarios.filter((scenario) => scenario.category === category),
    [category],
  )
  const [scenarioId, setScenarioId] = useState(catalogScenarios[0].id)
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>('fluid')
  const currentScenario = categoryScenarios.find((scenario) => scenario.id === scenarioId) ?? categoryScenarios[0]
  const currentWidth = PREVIEW_WIDTHS.find((option) => option.key === previewWidth) ?? PREVIEW_WIDTHS[3]

  function selectCategory(nextCategory: CatalogCategory) {
    const firstScenario = catalogScenarios.find((scenario) => scenario.category === nextCategory)
    setCategory(nextCategory)
    if (firstScenario) setScenarioId(firstScenario.id)
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
              {CATALOG_CATEGORIES.map((item) => {
                const count = catalogScenarios.filter((scenario) => scenario.category === item).length
                return (
                  <li key={item}>
                    <button
                      aria-current={item === category ? 'page' : undefined}
                      data-category={item}
                      className={item === category ? 'is-active' : ''}
                      onClick={() => selectCategory(item)}
                      type="button"
                    >
                      <span>{item}</span>
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
                onClick={() => setScenarioId(scenario.id)}
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
                    onClick={() => setPreviewWidth(option.key)}
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
              <div className="dev-ui-preview-content">{currentScenario.render()}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
