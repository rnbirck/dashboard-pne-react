import { useEffect, useMemo, useState } from 'react'
import { EditorialExpandableGrid } from '../components/EditorialExpandableGrid'
import { ErrorState } from '../components/ErrorState'
import { FinancialSectionHeader } from '../components/FinancialIndicatorPrimitives'
import { FinancialCompactModuleSelector } from '../components/FinancialCompactModuleSelector'
import { NavigationEntryCard } from '../components/NavigationEntryCard'
import { FundebPanel } from '../components/FundebPanel'
import { LoadingState } from '../components/LoadingState'
import { PageHeadingText } from '../components/HeadingText'
import { PnatePanel } from '../components/PnatePanel'
import { SiopeIndicatorsPanel } from '../components/SiopeIndicatorsPanel'
import { VaarPanel } from '../components/VaarPanel'
import { EducationCompactHeader } from '../features/education/components/EducationCompactHeader'
import { loadEducationMunicipio, loadEducationMunicipiosIndex } from '../data/educationData'
import {
  FINANCIAL_MODULES,
  FINANCIAL_OVERVIEW_COPY,
  FINANCIAL_PAGE_COPY,
  FINANCIAL_PAGE_KEYS,
  getFinancialModuleByPageKey,
} from '../data/financialModules'
import { useAsyncData } from '../utils/useAsyncData'
import { getHashContext, setHashContext } from '../utils/hashNavigation'
import '../styles/education-pages.css'

export function FinancialPage({
  municipioData,
  municipioError,
  municipioLoading,
  pageKey,
  selectedMunicipio,
}) {
  const module = getFinancialModuleByPageKey(pageKey)
  const isOverview = pageKey === FINANCIAL_PAGE_KEYS.overview
  const usesEducationCatalogLayout = ['siope', 'fundeb', 'pnate'].includes(module?.panel)
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
    <div className={`page-stack financial-page financial-module-page${usesEducationCatalogLayout ? ' financial-page--education-catalog' : ''}${detailKey ? ' financial-page--detail' : ''}`}>
      {!detailKey ? (
        usesEducationCatalogLayout
          ? <FinancialCatalogHeader module={module} selectedMunicipio={selectedMunicipio} />
          : <FinancialPageHeader module={module} selectedMunicipio={selectedMunicipio} />
      ) : null}
      {!detailKey && !usesEducationCatalogLayout ? <FinancialCompactModuleSelector activePageKey={pageKey} /> : null}

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

function FinancialCatalogHeader({ module, selectedMunicipio }) {
  return (
    <EducationCompactHeader
      backLink={{ href: `#${FINANCIAL_PAGE_KEYS.overview}`, label: 'Voltar aos indicadores' }}
      className="financial-catalog-header"
      contextItems={[
        { icon: 'municipality', label: 'Município', value: selectedMunicipio ?? 'Não selecionado' },
        { icon: 'section', label: 'Seção', value: module.navLabel ?? module.title },
        { icon: 'scope', label: 'Escopo', value: module.count },
        { icon: 'source', label: 'Fonte', value: module.source },
      ]}
      description="Indicadores de receitas, aplicação, execução e programas de financiamento da educação municipal."
      eyebrow="Indicadores de financiamento"
      title="Indicadores Financeiros da Educação"
    />
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
        <FinancialSectionHeader eyebrow={resources.eyebrow} title={resources.title} description={resources.description} titleId="financial-resources-title" />
        <div className="pne-concept-grid financial-numbered-grid">
          {resources.cards.map((card) => (
            <article className="pne-concept-card financial-numbered-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pne-overview-section pne-overview-entries financial-editorial-section" aria-labelledby="financial-dashboard-title">
        <FinancialSectionHeader eyebrow={dashboard.eyebrow} title={dashboard.title} description={dashboard.description} titleId="financial-dashboard-title" />
        <div className="pne-entry-grid financial-module-entry-grid">
          {FINANCIAL_MODULES.map((module) => (
            <NavigationEntryCard
              ariaLabel={`Abrir ${module.title}`}
              bodyText={module.description}
              footerText={dashboard.actionLabel}
              href={`#${module.pageKey}`}
              indicator={module.count}
              key={module.key}
              title={module.title}
            />
          ))}
        </div>
      </section>

      <section className="page-card pne-overview-section pne-overview-section--guided financial-editorial-section" aria-labelledby="financial-concepts-title">
        <FinancialSectionHeader eyebrow={concepts.eyebrow} title={concepts.title} description={concepts.description} titleId="financial-concepts-title" />
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

function FinancialPageHeader({ module, selectedMunicipio }) {
  return (
    <section className={`page-card financial-hero financial-hero--module financial-hero--${module.panel}`}>
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
