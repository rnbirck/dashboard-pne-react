import { useEffect, useMemo, useState } from 'react'
import { EditorialExpandableGrid } from '../components/EditorialExpandableGrid'
import { ErrorState } from '../components/ErrorState'
import { FundebPanel } from '../components/FundebPanel'
import { LoadingState } from '../components/LoadingState'
import { PageHeadingText } from '../components/HeadingText'
import { PnatePanel } from '../components/PnatePanel'
import { SiopeIndicatorsPanel } from '../components/SiopeIndicatorsPanel'
import { VaarPanel } from '../components/VaarPanel'
import { loadEducationMunicipio, loadEducationMunicipiosIndex } from '../data/educationData'
import {
  FINANCIAL_MODULES,
  FINANCIAL_NAV_ITEMS,
  FINANCIAL_OVERVIEW_COPY,
  FINANCIAL_PAGE_COPY,
  FINANCIAL_PAGE_KEYS,
  getFinancialModuleByPageKey,
} from '../data/financialModules'
import { useAsyncData } from '../utils/useAsyncData'
import { getHashContext, setHashContext } from '../utils/hashNavigation'

export function FinancialPage({
  municipioData,
  municipioError,
  municipioLoading,
  pageKey,
  selectedMunicipio,
}) {
  const module = getFinancialModuleByPageKey(pageKey)
  const isOverview = pageKey === FINANCIAL_PAGE_KEYS.overview
  const [detailKey, setDetailKey] = useState(() => getHashContext().params.get('detalhe') ?? '')

  const educationIndexState = useAsyncData(
    () => (module && selectedMunicipio ? loadEducationMunicipiosIndex() : null),
    [module?.pageKey, selectedMunicipio],
  )
  const selectedId = useMemo(() => {
    const list = educationIndexState.data?.municipios ?? []
    return list.find((item) => item.municipio === selectedMunicipio)?.id_municipio ?? null
  }, [educationIndexState.data, selectedMunicipio])
  const educationMunicipioState = useAsyncData(
    () => (module && selectedMunicipio && selectedId ? loadEducationMunicipio(selectedId) : null),
    [module?.pageKey, selectedId, selectedMunicipio],
  )

  useEffect(() => {
    if (!module) return

    const { params, route } = getHashContext()
    const nextDetailKey = params.get('detalhe') ?? ''
    setDetailKey(nextDetailKey)

    if (route !== module.pageKey || params.has('modulo') || params.has('module')) {
      setHashContext(module.pageKey, { detalhe: nextDetailKey })
    }
  }, [module])

  if (isOverview) return <FinancialOverviewPage />
  if (!module) return null

  return (
    <div className="page-stack financial-page financial-module-page">
      <FinancialPageHeader module={module} selectedMunicipio={selectedMunicipio} />
      <FinancialCompactModuleSelector activePageKey={pageKey} />

      {!selectedMunicipio ? (
        <FinancialModuleEmpty module={module} />
      ) : municipioLoading ? (
        <LoadingState message={FINANCIAL_PAGE_COPY.module.municipalityLoading(selectedMunicipio)} />
      ) : municipioError ? (
        <ErrorState title={FINANCIAL_PAGE_COPY.module.municipalityErrorTitle} message={municipioError} />
      ) : (
        <FinancialModulePanel
          detailKey={detailKey}
          educationIndexState={educationIndexState}
          educationMunicipioState={educationMunicipioState}
          module={module}
          municipioData={municipioData}
          onDetailChange={(nextDetailKey) => {
            setDetailKey(nextDetailKey)
            setHashContext(module.pageKey, { detalhe: nextDetailKey })
          }}
          selectedId={selectedId}
          selectedMunicipio={selectedMunicipio}
        />
      )}
    </div>
  )
}

function FinancialOverviewPage() {
  const { hero, resources, dashboard, concepts, sources } = FINANCIAL_OVERVIEW_COPY

  return (
    <div className="page-stack financial-page financial-overview-page pne-overview-page">
      <section className="page-card pne-overview-hero financial-overview-hero">
        <div className="pne-overview-hero__copy">
          <span className="eyebrow">{FINANCIAL_OVERVIEW_COPY.eyebrow}</span>
          <h1>{hero.title}</h1>
          <p>{hero.description}</p>
        </div>
      </section>

      <FinancialCompactModuleSelector activePageKey={FINANCIAL_PAGE_KEYS.overview} />

      <section className="pne-overview-section financial-editorial-section" aria-labelledby="financial-resources-title">
        <FinancialEditorialHeading eyebrow={resources.eyebrow} title={resources.title} description={resources.description} titleId="financial-resources-title" />
        <div className="pne-concept-grid financial-numbered-grid">
          {resources.cards.map((card, index) => (
            <article className="pne-concept-card financial-numbered-card" key={card.title}>
              <span className="pne-concept-card__index">{String(index + 1).padStart(2, '0')}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pne-overview-section pne-overview-entries financial-editorial-section" aria-labelledby="financial-dashboard-title">
        <FinancialEditorialHeading eyebrow={dashboard.eyebrow} title={dashboard.title} description={dashboard.description} titleId="financial-dashboard-title" />
        <div className="pne-entry-grid financial-module-entry-grid">
          {FINANCIAL_MODULES.map((module) => (
            <a className="pne-entry-card interaction-card--navigation" href={`#${module.pageKey}`} key={module.key}>
              <span className="pne-entry-card__indicator">
                <span aria-hidden="true" />
                {module.count}
              </span>
              <span className="pne-entry-card__title">{module.title}</span>
              <p>{module.description}</p>
              <span className="pne-entry-card__footer">
                <strong>{dashboard.actionLabel}</strong>
                <span aria-hidden="true" className="interaction-chevron interaction-chevron--navigation">→</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="page-card pne-overview-section pne-overview-section--guided financial-editorial-section" aria-labelledby="financial-concepts-title">
        <FinancialEditorialHeading eyebrow={concepts.eyebrow} title={concepts.title} description={concepts.description} titleId="financial-concepts-title" />
        <EditorialExpandableGrid items={concepts.items} />
      </section>

      <footer className="financial-overview-source" aria-label={sources.title}>
        <div>
          <strong>{sources.title}</strong>
          <span>{sources.description}</span>
        </div>
        <ul>
          {sources.references.map((reference) => (
            <li key={reference.label}>
              <a href={reference.url} rel="noreferrer" target="_blank">{reference.label}</a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  )
}

function FinancialEditorialHeading({ description, eyebrow, title, titleId }) {
  return (
    <div className="pne-overview-section__heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={titleId}>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

function FinancialPageHeader({ module, selectedMunicipio }) {
  return (
    <section className="page-card financial-hero financial-hero--module">
      <div className="financial-hero__content">
        <PageHeadingText
          description={module.description}
          eyebrow={`${FINANCIAL_PAGE_COPY.parentLabel} · ${module.title}`}
          title={module.title}
        />
        {selectedMunicipio ? (
          <p className="financial-hero__municipality">{FINANCIAL_PAGE_COPY.module.municipalityFocusLabel} <strong>{selectedMunicipio}</strong></p>
        ) : null}
      </div>
      <aside className="financial-hero__aside" aria-label={FINANCIAL_PAGE_COPY.module.objectiveAriaLabel}>
        <span className="financial-hero__aside-label">{FINANCIAL_PAGE_COPY.module.objectiveLabel}</span>
        <strong>{module.relevance}</strong>
        <p>{FINANCIAL_PAGE_COPY.module.sourceLabel}: {module.source}</p>
      </aside>
    </section>
  )
}

function FinancialCompactModuleSelector({ activePageKey }) {
  return (
    <div className="financial-compact-module">
      <label htmlFor="financial-module-selector">{FINANCIAL_PAGE_COPY.module.compactSelectorLabel}</label>
      <select
        aria-label={FINANCIAL_PAGE_COPY.module.compactSelectorLabel}
        id="financial-module-selector"
        value={activePageKey}
        onChange={(event) => {
          window.location.hash = event.target.value
        }}
      >
        <option disabled value="">{FINANCIAL_PAGE_COPY.module.compactSelectorPrompt}</option>
        {FINANCIAL_NAV_ITEMS.map((item) => <option key={item.pageKey} value={item.pageKey}>{item.label}</option>)}
      </select>
    </div>
  )
}

function FinancialModuleEmpty({ module }) {
  return (
    <section className="empty-state financial-module-empty">
      <div className="empty-state__icon" aria-hidden="true"><FinanceIcon /></div>
      <h2>{FINANCIAL_PAGE_COPY.module.emptyTitle} {module.title}</h2>
      <p>{FINANCIAL_PAGE_COPY.module.emptyDescription}</p>
    </section>
  )
}

function FinancialModulePanel({
  detailKey,
  educationIndexState,
  educationMunicipioState,
  module,
  municipioData,
  onDetailChange,
  selectedId,
  selectedMunicipio,
}) {
  if (educationIndexState.loading || educationMunicipioState.loading) {
    return <LoadingState message={FINANCIAL_PAGE_COPY.module.moduleLoading(module.title)} />
  }

  if (educationIndexState.error || educationMunicipioState.error) {
    return (
      <ErrorState
        title={FINANCIAL_PAGE_COPY.module.moduleErrorTitle(module.title)}
        message={educationIndexState.error || educationMunicipioState.error}
      />
    )
  }

  const educationData = educationMunicipioState.data

  if (module.panel === 'siope') {
    return (
      <SiopeIndicatorsPanel
        detailKey={detailKey}
        idMunicipio={selectedId}
        onDetailChange={onDetailChange}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (module.panel === 'fundeb') {
    return (
      <FundebPanel
        detailKey={detailKey}
        embedded={true}
        municipioData={municipioData}
        onDetailChange={onDetailChange}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (module.panel === 'vaar') {
    return <VaarPanel vaarData={educationData?.blocos?.vaar} />
  }

  return (
    <PnatePanel
      detailKey={detailKey}
      onDetailChange={onDetailChange}
      pnateData={educationData?.blocos?.pnate ?? municipioData?.blocos?.pnate}
      selectedMunicipio={selectedMunicipio}
    />
  )
}

function FinanceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18h16" />
      <path d="M7 18V9h3v9M12 18V5h3v13M17 18v-6h3v6" />
      <path d="M4 6h3" />
    </svg>
  )
}
