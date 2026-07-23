import { useEffect, useMemo, useRef, useState } from 'react'
import { ContentState } from '../../components/ContentState.jsx'
import { ErrorState } from '../../components/ErrorState.jsx'
import { loadEducationMunicipio, loadEducationMunicipiosIndex } from '../../data/educationData.js'
import {
  EDUCATION_INDICATOR_CATALOG,
  EDUCATION_SECTION_CATALOG,
  EDUCATION_SECTION_KEYS,
  getEducationThemeForSection,
  resolveEducationSection,
} from '../../data/educationIndicatorCatalog.js'
import { mergeHashContext } from '../../utils/hashNavigation'
import { useAsyncData } from '../../utils/useAsyncData.js'
import '../../styles/education-pages.css'
import { EducationCompactHeader } from './components/EducationCompactHeader'
import { EducationDemandSection } from './components/EducationDemandSection'
import { EducationIndicatorsSection } from './components/EducationIndicatorsSection'
import { EducationMethodologySection } from './components/EducationMethodologySection'
import { MunicipalEducationOverviewPrintReport } from './components/MunicipalEducationOverviewPrintReport'
import { EducationOverviewSection } from './components/EducationOverviewSection'
import {
  filterEducationIndicators,
  getInitialEducationNavigation,
  selectActiveEducationIndicator,
  selectEducationDetailSequence,
  selectEducationSectionItems,
} from './educationSelectors'
import {
  buildEducationModel,
  buildEducationPageViewModel,
  buildPneComplementaryTheme,
} from './educationViewModels'
import { useEducationPageState } from './hooks/useEducationPageState'
import {
  useMunicipalEducationOverview,
  type MunicipalEducationOverviewState,
} from './hooks/useMunicipalEducationOverview'
import { normalizeEducationIndicatorLabel } from './educationFormatters'
import type { EducationIndicatorKey, EducationPageProps } from './educationTypes'

const PANORAMA_THEME_KEYS = {
  matriculas: 'matriculas',
  escolasSistemaS: 'escolasSistemaS',
}

const EDUCATION_PAGE_COPY = {
  description: 'Indicadores de atendimento, trajetória escolar, profissionais, infraestrutura, modalidades e condições da oferta educacional no município.',
  emptyDescription: 'Os indicadores educacionais são carregados após a seleção do município. Use o seletor no topo da página.',
  eyebrow: 'Indicadores de Educação',
  title: 'Indicadores de Educação',
}

const printDateFormatter = new Intl.DateTimeFormat('pt-BR')

function latestEducationYear(items: ReadonlyArray<Record<string, unknown>>) {
  const years = items
    .map((item) => Number(item.currentYear ?? item.year))
    .filter((year) => Number.isFinite(year) && year > 0)
  return years.length ? Math.max(...years) : null
}

export function EducationPage({
  indicadores,
  municipioData,
  navigationContext,
  selectedMunicipio,
}: EducationPageProps) {
  const pageCopy = EDUCATION_PAGE_COPY
  const eduIndexState = useAsyncData(() => loadEducationMunicipiosIndex(), [])
  const eduMunMap = useMemo<Map<string, string>>(() => {
    const list = eduIndexState.data?.municipios ?? []
    return new Map(list.map((m: { municipio: string; id_municipio: string | number }) => [
      m.municipio,
      String(m.id_municipio),
    ]))
  }, [eduIndexState.data])
  const selectedId = selectedMunicipio ? eduMunMap.get(selectedMunicipio) ?? null : null
  const previousSelectedIdRef = useRef(selectedId)
  const munDataState = useAsyncData(async () => {
    if (!selectedId) return null
    return loadEducationMunicipio(selectedId)
  }, [selectedId])

  const currentNavigation = useMemo(
    () => getInitialEducationNavigation(navigationContext),
    [navigationContext],
  )
  const {
    detailNavigation,
    isDetailOpen,
    searchQuery,
    selectedIndicatorKey,
    selectedSectionKey,
    selectedThemeKey,
    setIsDetailOpen,
    setSearchQuery,
    setSelectedIndicatorKey,
    setSelectedThemeKey,
  } = useEducationPageState(currentNavigation)
  const isMunicipalOverviewRoute = selectedSectionKey === EDUCATION_SECTION_KEYS.overview
    && selectedThemeKey !== PANORAMA_THEME_KEYS.escolasSistemaS
  const loadedMunicipalityId = typeof municipioData?.id_municipio === 'string'
    ? municipioData.id_municipio
    : null
  const municipalOverviewState = useMunicipalEducationOverview(
    selectedId ?? loadedMunicipalityId,
    isMunicipalOverviewRoute,
  )
  const [printEmissionDate, setPrintEmissionDate] = useState(() => printDateFormatter.format(new Date()))
  const printButtonRef = useRef<HTMLButtonElement>(null)
  const dados = munDataState.data
  const sistemaS = dados?.blocos?.sistema_s ?? {}
  const hasSistemaS =
    Number(sistemaS.resumo_ultimo_ano?.total_escolas || 0) > 0 &&
    Number(sistemaS.ultimo_ano) === 2025
  const shouldKeepSistemaSTheme =
    eduIndexState.loading ||
    munDataState.loading ||
    previousSelectedIdRef.current !== selectedId

  useEffect(() => {
    if (
      !shouldKeepSistemaSTheme &&
      selectedThemeKey === PANORAMA_THEME_KEYS.escolasSistemaS &&
      !hasSistemaS
    ) {
      setSelectedThemeKey(getEducationThemeForSection(selectedSectionKey) ?? PANORAMA_THEME_KEYS.matriculas)
    }
  }, [hasSistemaS, selectedSectionKey, selectedThemeKey, setSelectedThemeKey, shouldKeepSistemaSTheme])

  useEffect(() => {
    previousSelectedIdRef.current = selectedId
  }, [selectedId])

  if (!selectedMunicipio) {
    return (
      <div className="page-stack educacao-page">
        <EducationCompactHeader
          description={pageCopy.description}
          eyebrow={pageCopy.eyebrow}
          title={pageCopy.title}
        />
        <section className="empty-state">
          <div className="empty-state__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5" />
            </svg>
          </div>
          <h2>Selecione um município</h2>
          <p>{pageCopy.emptyDescription}</p>
        </section>
      </div>
    )
  }

  if (eduIndexState.loading || munDataState.loading) {
    return <div className="page-stack"><ContentState as="p" kind="loading" className="state-box state-box--loading">Carregando dados...</ContentState></div>
  }

  if (eduIndexState.error) {
    return <div className="page-stack"><ErrorState title="Erro ao carregar o índice educacional" message={eduIndexState.error} /></div>
  }

  if (!selectedId) {
    return (
      <div className="page-stack">
        <ContentState kind="unavailable" className="state-box">
          <strong>Indicadores educacionais indisponíveis</strong>
          <span>Não foi encontrada uma correspondência de dados educacionais para {selectedMunicipio}.</span>
        </ContentState>
      </div>
    )
  }

  if (munDataState.error) {
    return <div className="page-stack"><ErrorState title="Erro ao carregar dados" message={munDataState.error} /></div>
  }

  if (!dados) {
    return (
      <div className="page-stack">
        <ContentState kind="unavailable" className="state-box">
          <strong>Indicadores educacionais indisponíveis</strong>
          <span>Os dados deste município não estão disponíveis no momento.</span>
        </ContentState>
      </div>
    )
  }

  const model = buildEducationModel(dados.blocos ?? {})
  const pneComplementaryTheme = buildPneComplementaryTheme({
    indicadores,
    rede: dados.blocos?.rede_escolar,
    results: municipioData?.pne_2026_2036?.indicadores,
  })
  const allEducationItems = [
    ...model.items,
    ...(pneComplementaryTheme?.items ?? []),
  ]
  const section = EDUCATION_SECTION_CATALOG.find((item) => item.key === selectedSectionKey)
  const sectionItems = selectEducationSectionItems(allEducationItems, section)
  const isSistemaSTheme = selectedThemeKey === PANORAMA_THEME_KEYS.escolasSistemaS && hasSistemaS
  const filteredItems = filterEducationIndicators(sectionItems, searchQuery)
  const activeIndicator = selectActiveEducationIndicator(filteredItems, selectedIndicatorKey)
  const { activeIndex: activeIndicatorIndex, previousItem: previousIndicator, nextItem: nextIndicator } = selectEducationDetailSequence(filteredItems, activeIndicator?.key)
  const isShowingIndicatorDetail = Boolean(isDetailOpen && activeIndicator)
  const {
    contextScope,
    isDemandSection,
    isMethodologySection,
    isOverviewSection,
  } = buildEducationPageViewModel({
    sectionItemCount: sectionItems.length,
    selectedSectionKey,
    sectionKeys: EDUCATION_SECTION_KEYS,
  })
  const isShowingCompactEducationPage = isShowingIndicatorDetail || isDemandSection
  const sectionLatestYear = latestEducationYear(sectionItems)
  const overviewLatestYear = latestEducationYear(model.overview)

  const standardHeader = isMunicipalOverviewRoute ? (
    <EducationCompactHeader
      action={municipalOverviewState.status === 'ready' && municipalOverviewState.data ? (
        <button
          className="platform-navigation-button municipal-education-print-action"
          onClick={handlePrintOverview}
          ref={printButtonRef}
          type="button"
        >
          Imprimir relatório
        </button>
      ) : undefined}
      contextItems={[
        { icon: 'municipality', label: 'Município', value: municipalOverviewState.data?.municipality.name ?? selectedMunicipio },
        { icon: 'period', label: 'Ano de referência', value: String(municipalOverviewState.data?.reference.year ?? 2025) },
      ]}
      description="Retrato das matrículas e da oferta educacional no município."
      eyebrow="Educação municipal"
      title="Visão geral municipal da educação"
      variant="section"
    />
  ) : isShowingIndicatorDetail && activeIndicator ? (
    <EducationCompactHeader
      backLink={{ onClick: handleBackToIndicators }}
      contextItems={[
        { icon: 'municipality', label: 'Município', value: selectedMunicipio },
        { icon: 'cut', label: 'Recorte', value: String(activeIndicator.mainCutLabel ?? activeIndicator.themeLabel ?? section?.label ?? 'Municipal') },
        { icon: 'period', label: 'Período', value: activeIndicator.currentYear ? String(activeIndicator.currentYear) : 'Último disponível' },
      ]}
      description={activeIndicator.description}
      eyebrow="Indicador educacional"
      title={normalizeEducationIndicatorLabel(activeIndicator.label)}
      variant="detail"
    />
  ) : isMethodologySection ? (
    <EducationCompactHeader
      backLink={{ onClick: handleBackToEducationOverview }}
      contextItems={[
        { icon: 'municipality', label: 'Município', value: selectedMunicipio },
        { icon: 'scope', label: 'Escopo', value: `${EDUCATION_INDICATOR_CATALOG.length} indicadores` },
        { icon: 'source', label: 'Referência', value: 'Fontes oficiais' },
      ]}
      description={section?.description}
      title={section?.label ?? 'Metodologia e fontes'}
      variant="methodology"
    />
  ) : (
    <EducationCompactHeader
      backLink={isOverviewSection ? undefined : { onClick: handleBackToEducationOverview }}
      contextItems={[
        { icon: 'municipality', label: 'Município', value: selectedMunicipio },
        { icon: 'section', label: 'Seção', value: section?.label ?? 'Visão geral' },
        { icon: 'scope', label: 'Escopo', value: isOverviewSection ? '7 destaques' : contextScope },
        ...((isOverviewSection ? overviewLatestYear : sectionLatestYear)
          ? [{ icon: 'period' as const, label: 'Atualização', value: String(isOverviewSection ? overviewLatestYear : sectionLatestYear) }]
          : []),
      ]}
      description={pageCopy.description}
      eyebrow={pageCopy.eyebrow}
      title={pageCopy.title}
      variant="section"
    />
  )

  function handleIndicatorCardSelect(indicatorKey: EducationIndicatorKey) {
    detailNavigation.prepareDetail(indicatorKey, { captureGridPosition: true })
    setSelectedIndicatorKey(indicatorKey)
    setIsDetailOpen(true)
    mergeHashContext(navigationContext?.rawRoute || 'educacao', {
      secao: navigationContext?.params.get('secao') ?? resolveEducationSection({ detailKey: indicatorKey }),
      detalhe: indicatorKey,
    })
  }

  function handleBackToIndicators() {
    const returnKey = selectedIndicatorKey
    setIsDetailOpen(false)
    setSelectedIndicatorKey('')
    mergeHashContext(navigationContext?.rawRoute || 'educacao', {
      secao: navigationContext?.params.get('secao') ?? selectedSectionKey,
      detalhe: null,
    })
    detailNavigation.restoreGrid(returnKey)
  }

  function handleAdjacentIndicator(indicatorKey: EducationIndicatorKey) {
    detailNavigation.prepareDetail(indicatorKey)
    setSelectedIndicatorKey(indicatorKey)
    setIsDetailOpen(true)
    mergeHashContext(navigationContext?.rawRoute || 'educacao', {
      secao: navigationContext?.params.get('secao') ?? resolveEducationSection({ detailKey: indicatorKey }),
      detalhe: indicatorKey,
    })
  }

  function handleBackToEducationOverview() {
    setSelectedIndicatorKey('')
    setIsDetailOpen(false)
    mergeHashContext(navigationContext?.rawRoute || 'educacao', {
      secao: EDUCATION_SECTION_KEYS.overview,
      tema: null,
      theme: null,
      detalhe: null,
      modulo: null,
    })
  }

  return (
    <div className={`page-stack educacao-page educacao-page--${selectedSectionKey}${isShowingCompactEducationPage ? ' educacao-page--detail' : ''}`}>
      {!isDemandSection ? standardHeader : null}

      {isMunicipalOverviewRoute ? (
        <MunicipalEducationOverviewContent state={municipalOverviewState} />
      ) : isDemandSection && !isSistemaSTheme ? (
        <EducationDemandSection
          municipioData={municipioData}
          onBackToIndicators={handleBackToEducationOverview}
          selectedMunicipio={selectedMunicipio}
        />
      ) : isMethodologySection && !isSistemaSTheme ? (
        <EducationMethodologySection catalog={EDUCATION_INDICATOR_CATALOG} items={allEducationItems} />
      ) : (
        <section className="cycle-workspace educacao-workspace">
          <EducationIndicatorsSection
            actions={{
              onAdjacentIndicator: handleAdjacentIndicator,
              onBackToIndicators: handleBackToIndicators,
              onIndicatorCardSelect: handleIndicatorCardSelect,
              onSearchChange: setSearchQuery,
            }}
            viewModel={{
              activeIndicator,
              activeIndicatorIndex,
              blocos: dados.blocos,
              detailNavigation,
              filteredItems,
              hasSistemaS,
              isDetailOpen,
              isShowingIndicatorDetail,
              isSistemaSTheme,
              nextIndicator,
              previousIndicator,
              searchQuery,
              section,
              selectedIndicatorKey,
              selectedSectionKey,
            }}
          />
        </section>
      )}

      {isMunicipalOverviewRoute && municipalOverviewState.status === 'ready' && municipalOverviewState.data ? (
        <MunicipalEducationOverviewPrintReport
          data={municipalOverviewState.data}
          emissionDate={printEmissionDate}
        />
      ) : null}
    </div>
  )

  function handlePrintOverview() {
    if (municipalOverviewState.status !== 'ready' || !municipalOverviewState.data || !globalThis.window) return

    const emissionDate = printDateFormatter.format(new Date())
    const originalTitle = document.title
    const temporaryTitle = `visao-geral-educacao-${municipalOverviewState.data.municipality.slug}-${municipalOverviewState.data.reference.year}`
    const restoreDocument = () => {
      document.title = originalTitle
      globalThis.window?.removeEventListener('afterprint', restoreDocument)
      globalThis.window?.requestAnimationFrame(() => printButtonRef.current?.focus())
    }

    setPrintEmissionDate(emissionDate)
    globalThis.window.addEventListener('afterprint', restoreDocument, { once: true })
    globalThis.window.setTimeout(() => {
      document.title = temporaryTitle
      try {
        globalThis.window?.print()
        globalThis.window?.setTimeout(restoreDocument, 1500)
      } catch {
        restoreDocument()
      }
    }, 0)
  }
}

function MunicipalEducationOverviewContent({
  state,
}: {
  state: MunicipalEducationOverviewState
}) {
  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <section className="municipal-education-overview-state">
        <ContentState kind="loading" className="state-box state-box--loading">
          <span className="state-box__loading-heading">
            <span className="state-spinner" aria-hidden="true" />
            <strong>Carregando a visão geral municipal...</strong>
          </span>
          <span className="state-skeleton" aria-hidden="true"><span /><span /><span /></span>
        </ContentState>
      </section>
    )
  }

  if (state.status === 'absent') {
    return (
      <section className="municipal-education-overview-state">
        <ContentState kind="unavailable" className="state-box">
          <strong>Visão geral municipal indisponível</strong>
          <span>As informações desta visão ainda não estão disponíveis para este município.</span>
        </ContentState>
      </section>
    )
  }

  if (state.status === 'error' || !state.data) {
    return (
      <section className="municipal-education-overview-state">
        <ErrorState
          title="Não foi possível carregar a visão geral municipal"
          message="Tente novamente em instantes. Os demais indicadores educacionais permanecem disponíveis."
        />
      </section>
    )
  }

  return <EducationOverviewSection data={state.data} />
}
