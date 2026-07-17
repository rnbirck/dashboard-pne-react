import { useEffect, useMemo, useRef } from 'react'
import { ContentState } from '../../components/ContentState.jsx'
import { ErrorState } from '../../components/ErrorState.jsx'
import { PageHeadingText } from '../../components/HeadingText.jsx'
import { loadEducationMunicipio, loadEducationMunicipiosIndex } from '../../data/educationData.js'
import {
  EDUCATION_INDICATOR_CATALOG,
  EDUCATION_SECTION_CATALOG,
  EDUCATION_SECTION_KEYS,
  getEducationThemeForSection,
  resolveEducationSection,
} from '../../data/educationIndicatorCatalog.js'
import { setHashContext } from '../../utils/hashNavigation'
import { useAsyncData } from '../../utils/useAsyncData.js'
import '../../styles/education-pages.css'
import { EducationDemandSection } from './components/EducationDemandSection'
import { EducationIndicatorsSection } from './components/EducationIndicatorsSection'
import { EducationMethodologySection } from './components/EducationMethodologySection'
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

export function EducationPage({ indicadores, municipioData, navigationContext, selectedMunicipio }: EducationPageProps) {
  const pageCopy = EDUCATION_PAGE_COPY
  const eduIndexState = useAsyncData(() => loadEducationMunicipiosIndex(), [])
  const eduMunMap = useMemo(() => {
    const list = eduIndexState.data?.municipios ?? []
    return new Map(list.map((m: { municipio: string; id_municipio: string | number }) => [m.municipio, m.id_municipio]))
  }, [eduIndexState.data])
  const selectedId = eduMunMap.get(selectedMunicipio) ?? null
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
        <section className="page-card educacao-hero">
          <div>
            <PageHeadingText eyebrow={pageCopy.eyebrow} title={pageCopy.title} description={pageCopy.description} />
          </div>
        </section>
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

  function handleIndicatorCardSelect(indicatorKey: EducationIndicatorKey) {
    detailNavigation.prepareDetail(indicatorKey, { captureGridPosition: true })
    setSelectedIndicatorKey(indicatorKey)
    setIsDetailOpen(true)
    const params = navigationContext?.params ?? new URLSearchParams()
    setHashContext(navigationContext?.rawRoute || 'educacao', {
      tema: params.get('tema'),
      secao: params.get('secao') ?? resolveEducationSection({ detailKey: indicatorKey }),
      modulo: params.get('modulo'),
      detalhe: indicatorKey,
    })
  }

  function handleBackToIndicators() {
    const returnKey = selectedIndicatorKey
    setIsDetailOpen(false)
    setSelectedIndicatorKey('')
    const params = navigationContext?.params ?? new URLSearchParams()
    setHashContext(navigationContext?.rawRoute || 'educacao', {
      tema: params.get('tema'),
      secao: params.get('secao') ?? selectedSectionKey,
      modulo: params.get('modulo'),
    })
    detailNavigation.restoreGrid(returnKey)
  }

  function handleAdjacentIndicator(indicatorKey: EducationIndicatorKey) {
    detailNavigation.prepareDetail(indicatorKey)
    setSelectedIndicatorKey(indicatorKey)
    setIsDetailOpen(true)
    const params = navigationContext?.params ?? new URLSearchParams()
    setHashContext(navigationContext?.rawRoute || 'educacao', {
      tema: params.get('tema'),
      secao: params.get('secao') ?? resolveEducationSection({ detailKey: indicatorKey }),
      modulo: params.get('modulo'),
      detalhe: indicatorKey,
    })
  }

  return (
    <div className={`page-stack educacao-page educacao-page--${selectedSectionKey}${isShowingIndicatorDetail ? ' educacao-page--detail' : ''}`}>
      {isShowingIndicatorDetail ? <h1 className="u-sr-only">{pageCopy.title}</h1> : null}
      {!isShowingIndicatorDetail ? <section className="page-card educacao-hero">
        <div className="educacao-hero__intro">
          <PageHeadingText eyebrow={pageCopy.eyebrow} title={pageCopy.title} description={pageCopy.description} />
          <aside className="educacao-hero__meta" aria-label="Contexto desta página">
            <span className="educacao-hero__meta-label">Contexto desta página</span>
            <strong className="educacao-hero__municipality">{selectedMunicipio}</strong>
            <dl className="educacao-hero__meta-details">
              <div>
                <dt>Seção atual</dt>
                <dd>{section?.label ?? 'Visão geral'}</dd>
              </div>
              <div>
                <dt>Escopo</dt>
                <dd>{contextScope}</dd>
              </div>
            </dl>
          </aside>
        </div>

      </section> : null}

      {isOverviewSection && !isSistemaSTheme ? (
        <EducationOverviewSection overview={model.overview} sections={EDUCATION_SECTION_CATALOG} />
      ) : isDemandSection && !isSistemaSTheme ? (
        <EducationDemandSection municipioData={municipioData} />
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
    </div>
  )
}
