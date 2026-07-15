/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// The page is migrated incrementally: contracts and pure boundaries are typed
// locally while the established JSX renderers stay behaviorally unchanged.
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { CategoryTabs } from '../../components/CategoryTabs'
import { SistemaSPanel } from '../../components/SistemaSPanel'
import { EducationBarChart } from '../../components/EducationBarChart'
import { EducationIndicatorCard } from '../../components/EducationIndicatorCard'
import { DetailNavigation } from '../../components/DetailNavigation'
import { DetailHeadingText, PageHeadingText } from '../../components/HeadingText'
import { IndicatorChartHeader } from '../../components/IndicatorChartHeader'
import { EducationLineChart } from '../../components/EducationLineChart'
import { EducationStackedBarChart } from '../../components/EducationStackedBarChart'
import { EducationSummaryCard } from '../../components/EducationSummaryCard'
import { EducationTable } from '../../components/EducationTable'
import { DataSourceNote } from '../../components/DataSourceNote'
import { ContentState } from '../../components/ContentState'
import { ErrorState } from '../../components/ErrorState'
import { MethodNote } from '../../components/MethodNote'
import { MetricCard } from '../../components/MetricCard'
import { SearchField } from '../../components/SearchField'
import { SegmentedControl } from '../../components/SegmentedControl'
import { StatusBadge } from '../../components/StatusBadge'
import { ChartEmptyState, ChartLegend, ChartTooltip } from '../../components/ChartPrimitives'
import { IndicatorProjectionPanel } from '../../components/IndicatorProjectionPanel'
import { loadEducationMunicipio, loadEducationMunicipiosIndex } from '../../data/educationData'
import { getDataSourceParts } from '../../utils/dataSourceNotes'
import { PNE_CONTEXT_PROXY_INDICATOR_KEYS } from '../../utils/pneDisplayRules'
import { useAsyncData } from '../../utils/useAsyncData'
import { resolveDetailSequence } from '../../hooks/useDetailViewNavigation'
import { chartSeriesColor, closeChartTooltipOnEscape } from '../../utils/chartVisuals'
import { setHashContext } from '../../utils/hashNavigation'
import '../../styles/education-pages.css'
import { useEducationPageState } from './hooks/useEducationPageState'
import { filterEducationIndicators, getInitialEducationNavigation, selectActiveEducationIndicator, selectEducationSectionItems, selectEducationVisibleGroups } from './educationSelectors'
import { buildEducationPageViewModel } from './educationViewModels'
import {
  EDUCATION_COMPLEMENTARY_INDICATOR_CATALOG,
  EDUCATION_DEMAND_GROUP_CATALOG,
  EDUCATION_DEMAND_INDICATOR_CATALOG,
  EDUCATION_INDICATOR_CATALOG,
  EDUCATION_SOURCE_CATALOG,
  EDUCATION_SECTION_GROUPS,
  EDUCATION_SECTION_CATALOG,
  EDUCATION_SECTION_KEYS,
  getEducationIndicatorCatalogItem,
  getEducationThemeForSection,
  resolveEducationSection,
} from '../../data/educationIndicatorCatalog'
import {
  depLabel,
  etapaLabel,
  formatNumber,
  formatPercent,
  formatRatio,
  formatValue,
  isMissing,
  locLabel,
  modLabel,
  normalizeYearSeries,
} from '../../utils/educationFormatters'

const EM = '\u2014'

const FILTER_KEYS = {
  todos: 'todos',
  infantil: 'educacao_infantil',
  fundamental: 'ensino_fundamental',
  medio: 'ensino_medio',
  eja: 'eja',
  profissional: 'educacao_profissional',
}

const CATEGORY_LABELS = {
  [FILTER_KEYS.todos]: 'Geral',
  [FILTER_KEYS.infantil]: 'Educação Infantil',
  [FILTER_KEYS.fundamental]: 'Ensino Fundamental',
  [FILTER_KEYS.medio]: 'Ensino Médio',
  [FILTER_KEYS.eja]: 'Educação de Jovens e Adultos',
  [FILTER_KEYS.profissional]: 'Educação Profissional e Tecnológica',
}

const DEPENDENCY_COLORS = {
  publica: '#0f766e',
  federal: '#2563eb',
  estadual: '#16a34a',
  municipal: '#f59e0b',
  privada: '#7c3aed',
}

const LOCATION_COLORS = {
  urbana: '#16713a',
  rural: '#2563eb',
}

const STAGE_FILTER_ORDER = ['total', 'infantil', 'fundamental', 'fundamental_anos_iniciais', 'fundamental_anos_finais', 'medio', 'eja', 'profissional']
const ALUNOS_TURMA_STAGE_ORDER = ['infantil', 'fundamental', 'medio']
const ATU_TOTAL_SERIE_BY_STAGE = {
  infantil: 'infantil_total',
  fundamental: 'fundamental_total',
  medio: 'medio_total',
}
const ALUNOS_TURMA_SERIE_LABELS = {
  infantil_total: 'Total — Educação Infantil',
  creche: 'Creche',
  pre_escola: 'Pré-Escola',
  fundamental_total: 'Total — Ensino Fundamental',
  fundamental_anos_iniciais: 'Anos Iniciais',
  fundamental_anos_finais: 'Anos Finais',
  fundamental_1_ano: '1º ano',
  fundamental_2_ano: '2º ano',
  fundamental_3_ano: '3º ano',
  fundamental_4_ano: '4º ano',
  fundamental_5_ano: '5º ano',
  fundamental_6_ano: '6º ano',
  fundamental_7_ano: '7º ano',
  fundamental_8_ano: '8º ano',
  fundamental_9_ano: '9º ano',
  fundamental_multietapa: 'Multietapa, multi ou correção de fluxo',
  medio_total: 'Total — Ensino Médio',
  medio_1_serie: '1ª série',
  medio_2_serie: '2ª série',
  medio_3_serie: '3ª série',
  medio_4_serie: '4ª série',
  medio_nao_seriado: 'Não-seriado',
}
const FUNDAMENTAL_FAIXA_STAGES = ['fundamental_anos_iniciais', 'fundamental_anos_finais']
const EJA_VALID_AGE_RANGES = [
  'Até 14 anos',
  '15 a 17 anos',
  '18 a 19 anos',
  '20 a 24 anos',
  '25 a 29 anos',
  '30 a 34 anos',
  '35 a 39 anos',
  '40 anos ou mais',
]
const CATEGORY_COMPARISON_COLORS = ['#0f766e', '#2563eb', '#f59e0b', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#9333ea']
const COR_RACA_ORDER = ['Branca', 'Parda', 'Preta', 'Amarela', 'Indígena', 'Não Declarada']

const PANORAMA_THEME_KEYS = {
  complementaresPne: 'pne_complementares',
  matriculas: 'matriculas',
  escolasSistemaS: 'escolasSistemaS',
}

const EDUCATION_PAGE_COPY = {
  description: 'Indicadores de atendimento, trajetória escolar, profissionais, infraestrutura, modalidades e condições da oferta educacional no município.',
  emptyDescription: 'Os indicadores educacionais são carregados após a seleção do município. Use o seletor no topo da página.',
  eyebrow: 'Indicadores de Educação',
  title: 'Indicadores de Educação',
}

export function EducationPage({ indicadores, municipioData, navigationContext, selectedMunicipio }) {
  const pageCopy = EDUCATION_PAGE_COPY
  const eduIndexState = useAsyncData(() => loadEducationMunicipiosIndex(), [])
  const eduMunMap = useMemo(() => {
    const list = eduIndexState.data?.municipios ?? []
    return new Map(list.map((m) => [m.municipio, m.id_municipio]))
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
    setSelectedSectionKey,
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
  const themes = pneComplementaryTheme
    ? [...model.themes, pneComplementaryTheme]
    : model.themes
  const selectedTheme = themes.find((theme) => theme.key === selectedThemeKey) ?? themes[0]
  const isSistemaSTheme = selectedThemeKey === PANORAMA_THEME_KEYS.escolasSistemaS && hasSistemaS
  const filteredItems = filterEducationIndicators(sectionItems, searchQuery)
  const activeIndicator = selectActiveEducationIndicator(filteredItems, selectedIndicatorKey)
  const { activeIndex: activeIndicatorIndex, previousItem: previousIndicator, nextItem: nextIndicator } = resolveDetailSequence(filteredItems, activeIndicator?.key)
  const isShowingIndicatorDetail = Boolean(isDetailOpen && activeIndicator)
  const isPneComplementaryTheme = selectedTheme?.key === PANORAMA_THEME_KEYS.complementaresPne
  let isOverviewSection = selectedSectionKey === EDUCATION_SECTION_KEYS.overview
  let isDemandSection = selectedSectionKey === EDUCATION_SECTION_KEYS.demand
  let isMethodologySection = selectedSectionKey === EDUCATION_SECTION_KEYS.methodology
  let contextScope = sectionItems.length > 0
    ? formatIndicatorCount(sectionItems.length)
    : isOverviewSection
      ? 'Síntese municipal'
      : isDemandSection
        ? 'Demanda e projeções'
        : 'Fontes e critérios'

  const educationPageViewModel = buildEducationPageViewModel({
    sectionItemCount: sectionItems.length,
    selectedSectionKey,
    sectionKeys: EDUCATION_SECTION_KEYS,
  })
  void isMethodologySection
  void contextScope
  isOverviewSection = educationPageViewModel.isOverviewSection
  isDemandSection = educationPageViewModel.isDemandSection
  isMethodologySection = educationPageViewModel.isMethodologySection
  contextScope = educationPageViewModel.contextScope

  function handleThemeSelect(themeKey) {
    setSelectedSectionKey(resolveEducationSection({ requestedTheme: themeKey }))
    setSelectedThemeKey(themeKey)
    setSelectedIndicatorKey('')
    setIsDetailOpen(false)
    setSearchQuery('')
    setHashContext('educacao', { tema: themeKey })
  }

  function handleIndicatorCardSelect(indicatorKey) {
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

  function handleAdjacentIndicator(indicatorKey) {
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

  function renderEducationSectionScope() {
    const groups = EDUCATION_SECTION_GROUPS[selectedSectionKey] ?? []
    const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase('pt-BR')
    const visibleGroups = selectEducationVisibleGroups(groups, filteredItems)
    const showSistemaSGroup =
      selectedSectionKey === EDUCATION_SECTION_KEYS.modalities &&
      hasSistemaS &&
      (!normalizedSearchQuery || 'sistema s oferta profissional'.includes(normalizedSearchQuery))

    if (isSistemaSTheme) {
      return (
        <>
          <section className="page-card education-thematic-heading" aria-labelledby="education-thematic-title">
            <span className="eyebrow">{'Seção de indicadores'}</span>
            <h2 id="education-thematic-title">{section?.label}</h2>
            <p>{section?.description}</p>
          </section>
          <section className="education-special-group" aria-labelledby="education-special-group-title">
            <div className="education-indicator-group__heading">
              <div>
                <span className="eyebrow">{section?.label}</span>
                <h3 id="education-special-group-title">Sistema S</h3>
              </div>
            </div>
            <SistemaSPanel blocos={dados.blocos} />
          </section>
        </>
      )
    }

    if (isShowingIndicatorDetail) {
      return (
        <div className="education-detail-view" ref={detailNavigation.detailViewRef}>
          <EducationDetailNavigation
            activeIndex={activeIndicatorIndex}
            nextIndicator={nextIndicator}
            onBack={handleBackToIndicators}
            onNext={handleAdjacentIndicator}
            onPrevious={handleAdjacentIndicator}
            previousIndicator={previousIndicator}
            total={filteredItems.length}
          />
          <EducationIndicatorDetail indicator={activeIndicator} blocos={dados.blocos} />
          <EducationDetailNavigation
            activeIndex={activeIndicatorIndex}
            isBottom
            nextIndicator={nextIndicator}
            onBack={handleBackToIndicators}
            onNext={handleAdjacentIndicator}
            onPrevious={handleAdjacentIndicator}
            previousIndicator={previousIndicator}
            total={filteredItems.length}
          />
        </div>
      )
    }

    return (
      <>
        <section className="cycle-filter-panel educacao-filter-panel platform-filter-panel education-section-filter-panel" aria-labelledby="education-thematic-title">
          <div className="education-section-filter-panel__identity">
            <span className="eyebrow">{'Seção de indicadores'}</span>
            <h2 id="education-thematic-title">{section?.label}</h2>
            <p>{section?.description}</p>
          </div>
          <div className="cycle-filter-panel__heading">
            <div>
              <span className="eyebrow">{'Indicadores da seção'}</span>
              <strong className="education-section-filter-count">{formatIndicatorCount(filteredItems.length)}</strong>
            </div>
            <SearchField
              ariaLabel="Buscar indicador"
              className="cycle-search platform-search-field"
              onChange={(event) => setSearchQuery(event.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Buscar indicador..."
              value={searchQuery}
            />
          </div>
        </section>

        {filteredItems.length === 0 && !showSistemaSGroup ? (
          <div className="meta-grid-empty education-indicator-grid-empty">
            <ContentState as="p" kind="noResults">
              {searchQuery.trim()
                ? `Nenhum indicador encontrado para “${searchQuery.trim()}” nesta seção.`
                : 'Nenhum indicador disponível para esta seção.'}
            </ContentState>
          </div>
        ) : (
          <div className="education-indicator-groups">
            {visibleGroups.map((group) => (
              <section className="education-indicator-group" key={group.key} aria-labelledby={`education-group-${group.key}`}>
                <div className="education-indicator-group__heading">
                  <div>
                    <span className="eyebrow">Indicadores relacionados</span>
                    <h3 id={`education-group-${group.key}`}>{group.label}</h3>
                  </div>
                  <span>{formatIndicatorCount(group.items.length)}</span>
                </div>
                <p className="education-indicator-group__description">{group.description}</p>
                <div className="education-indicator-card-grid">
                  {group.items.map((item) => (
                    <EducationIndicatorCard
                      buttonRef={(node) => detailNavigation.registerCard(item.key, node)}
                      indicator={item}
                      isSelected={isDetailOpen && item.key === selectedIndicatorKey}
                      key={item.key}
                      onSelect={() => handleIndicatorCardSelect(item.key)}
                    />
                  ))}
                </div>
              </section>
            ))}
            {showSistemaSGroup ? (
              <section className="education-special-group" aria-labelledby="education-section-sistema-s-title">
                <div className="education-indicator-group__heading">
                  <div>
                    <span className="eyebrow">{section?.label}</span>
                    <h3 id="education-section-sistema-s-title">Sistema S</h3>
                  </div>
                </div>
                <SistemaSPanel blocos={dados.blocos} />
              </section>
            ) : null}
          </div>
        )}
      </>
    )
  }

  // Legacy renderer retained for the compatibility helpers above; thematic sections use renderEducationSectionScope.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function renderLegacyPanoramaScope() {
    return (
      <>
        {!isShowingIndicatorDetail ? (
          <div className="cycle-filter-panel educacao-filter-panel platform-filter-panel">
            <div className="cycle-filter-panel__heading">
              <div>
                <span className="eyebrow">Temas de análise</span>
                <h2>{selectedTheme?.label ?? 'Indicadores de educação'}</h2>
              </div>
              <SearchField
                ariaLabel="Buscar indicador"
                className="cycle-search platform-search-field"
                onChange={(event) => setSearchQuery(event.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Buscar indicador..."
                value={searchQuery}
              />
            </div>

            <CategoryTabs
              ariaLabel="Temas da educação"
              categories={themes}
              selectedCategory={selectedTheme?.key}
              onSelectCategory={handleThemeSelect}
            />
          </div>
        ) : null}
        {isSistemaSTheme ? (
          <SistemaSPanel blocos={dados.blocos} />
        ) : isShowingIndicatorDetail ? (
          <div className="education-detail-view" ref={detailNavigation.detailViewRef}>
            <EducationDetailNavigation
              activeIndex={activeIndicatorIndex}
              nextIndicator={nextIndicator}
              onBack={handleBackToIndicators}
              onNext={handleAdjacentIndicator}
              onPrevious={handleAdjacentIndicator}
              previousIndicator={previousIndicator}
              total={filteredItems.length}
            />
            <EducationIndicatorDetail indicator={activeIndicator} blocos={dados.blocos} />
            <EducationDetailNavigation
              activeIndex={activeIndicatorIndex}
              isBottom
              nextIndicator={nextIndicator}
              onBack={handleBackToIndicators}
              onNext={handleAdjacentIndicator}
              onPrevious={handleAdjacentIndicator}
              previousIndicator={previousIndicator}
              total={filteredItems.length}
            />
          </div>
        ) : (
          <div className="education-indicator-grid-shell">
            <div className="meta-grid-header education-indicator-grid-header">
              <span>{formatIndicatorCount(filteredItems.length)}</span>
              <p>{selectedMunicipio} · {selectedTheme?.shortLabel ?? selectedTheme?.label}</p>
            </div>

            {filteredItems.length === 0 ? (
              <div className="meta-grid-empty education-indicator-grid-empty">
                <ContentState as="p" kind="noResults">Nenhum indicador disponível para este tema ou busca.</ContentState>
              </div>
            ) : isPneComplementaryTheme ? (
              <PneComplementaryGroupedGrid
                items={filteredItems}
                onSelect={handleIndicatorCardSelect}
                registerCard={detailNavigation.registerCard}
                selectedIndicatorKey={selectedIndicatorKey}
              />
            ) : (
              <div className="education-indicator-card-grid">
                {filteredItems.map((item) => (
                  <EducationIndicatorCard
                    buttonRef={(node) => detailNavigation.registerCard(item.key, node)}
                    indicator={item}
                    isSelected={isDetailOpen && item.key === selectedIndicatorKey}
                    key={item.key}
                    onSelect={() => handleIndicatorCardSelect(item.key)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  return (
    <div className={`page-stack educacao-page educacao-page--${selectedSectionKey}`}>
      <section className="page-card educacao-hero">
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

      </section>

      {isOverviewSection && !isSistemaSTheme ? (
        <EducationOverviewPage overview={model.overview} sections={EDUCATION_SECTION_CATALOG} />
      ) : isDemandSection && !isSistemaSTheme ? (
        <EducationDemandPage municipioData={municipioData} />
      ) : isMethodologySection && !isSistemaSTheme ? (
        <EducationMethodologyPage catalog={EDUCATION_INDICATOR_CATALOG} items={allEducationItems} />
      ) : (
        <section className="cycle-workspace educacao-workspace">
          {renderEducationSectionScope()}
        </section>
      )}
    </div>
  )
}

function EducationOverviewCards({ overview }) {
  return (
    <section className="page-card education-summary-section educacao-overview">
      <div className="education-summary-header educacao-overview__heading">
        <h2 className="education-summary-title">Visão geral</h2>
        <p className="education-summary-note">Últimos dados disponíveis por bloco, com o ano de referência em cada indicador.</p>
      </div>
      <div className="education-summary-grid educacao-overview-grid">
        {overview.map((card) => (
          <EducationSummaryCard key={card.label} label={card.label} value={card.value} year={card.year} tone={card.tone} />
        ))}
      </div>
    </section>
  )
}

function EducationDetailNavigation({
  activeIndex,
  isBottom = false,
  nextIndicator,
  onBack,
  onNext,
  onPrevious,
  previousIndicator,
  total,
}) {
  return (
    <DetailNavigation
      activeIndex={activeIndex}
      className={`education-detail-nav${isBottom ? ' education-detail-nav--bottom' : ''}`}
      isBottom={isBottom}
      nextItem={nextIndicator}
      onBack={onBack}
      onNext={onNext}
      onPrevious={onPrevious}
      previousItem={previousIndicator}
      total={total}
    />
  )
}

function IndicatorSegmentedControl({ options, selectedKey, onSelect, ariaLabel }) {
  return (
    <SegmentedControl
      ariaLabel={ariaLabel}
      className="indicator-stage-segmented platform-segmented-control"
      optionClassName="indicator-stage-segmented__button platform-segmented-option"
      onSelect={onSelect}
      options={options.map(({ key, label }) => ({ key, label }))}
      selectedKey={selectedKey}
    />
  )
}

function EducationOverviewPage({ overview, sections }) {
  const methodology = sections.find((section) => section.key === EDUCATION_SECTION_KEYS.methodology)
  const navigableSections = sections.filter((section) => (
    section.key !== EDUCATION_SECTION_KEYS.overview
    && section.key !== EDUCATION_SECTION_KEYS.methodology
  ))

  return (
    <div className="education-overview-page">
      <EducationOverviewCards overview={overview} />

      <section className="page-card education-section-navigation" aria-labelledby="education-section-navigation-title">
        <div className="education-section-navigation__heading">
          <div>
            <span className="eyebrow">Áreas de análise</span>
            <h2 id="education-section-navigation-title">Explore os indicadores por seção</h2>
          </div>
          <p>{'Escolha uma se\u00e7\u00e3o para consultar seus indicadores e detalhamentos.'}</p>
        </div>

        <nav className="education-section-link-grid" aria-label="Seções de indicadores da educação">
          {navigableSections.map((section) => (
            <a className="education-section-link" href={`#educacao?secao=${section.key}`} key={section.key}>
              <span className="education-section-link__title">{section.label}</span>
              <span className="education-section-link__description">{section.description}</span>
              {section.indicatorKeys.length > 0 ? (
                <span className="education-section-link__meta">{formatIndicatorCount(section.indicatorKeys.length)}</span>
              ) : null}
            </a>
          ))}
        </nav>

        {methodology ? (
          <a className="education-section-link education-section-link--secondary" href={`#educacao?secao=${methodology.key}`}>
            <span className="education-section-link__title">{methodology.label}</span>
            <span className="education-section-link__description">{methodology.description}</span>
          </a>
        ) : null}
      </section>
    </div>
  )
}

function EducationDemandPage({ municipioData }) {
  const projections = municipioData?.pne_2026_2036?.projecoes ?? {}

  return (
    <div className="education-demand-page">
      <section className="page-card education-thematic-heading" aria-labelledby="education-demand-title">
        <span className="eyebrow">Seção de indicadores</span>
        <h2 id="education-demand-title">Demanda e projeções</h2>
        <p>Cenários estimados de atendimento a partir do histórico municipal disponível e da população de referência por faixa etária. Cada indicador separa o observado de um cenário estimado até 2036; a projeção apoia o planejamento, mas não é uma previsão oficial.</p>
      </section>

      <details className="page-card education-demand-note">
        <summary>Nota metodológica</summary>
        <p>Os indicadores consideram os dados disponíveis para o município. Matrículas localizadas no território não representam necessariamente a residência dos estudantes. As projeções são cenários estimados e não constituem previsão oficial nem cálculo direto de déficit de vagas.</p>
      </details>

      {EDUCATION_DEMAND_GROUP_CATALOG.map((group) => (
        <section className="education-indicator-group education-demand-group" key={group.key} aria-labelledby={`education-demand-group-${group.key}`}>
          <div className="education-indicator-group__heading">
            <div>
              <span className="eyebrow">Demanda e projeções</span>
              <h3 id={`education-demand-group-${group.key}`}>{group.label}</h3>
            </div>
            <span>{formatIndicatorCount(group.indicatorKeys.length)}</span>
          </div>
          <p className="education-indicator-group__description">{group.description}</p>
          <div className="education-demand-indicator-grid">
            {group.indicatorKeys.map((indicatorKey) => {
              const indicator = EDUCATION_DEMAND_INDICATOR_CATALOG.find((item) => item.key === indicatorKey)
              return indicator ? (
                <EducationDemandIndicator
                  indicator={indicator}
                  key={indicator.key}
                  projection={projections[indicator.key]}
                />
              ) : null
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function EducationDemandIndicator({ indicator, projection }) {
  const history = buildProjectionHistory(projection)
  const latest = history.at(-1)
  const firstYear = history[0]?.year
  const lastYear = latest?.year
  const historyLabel = history.length > 1 && firstYear && lastYear
    ? `${firstYear}–${lastYear} · ${history.length} anos`
    : history.length === 1 && firstYear
      ? `${firstYear} · 1 ano`
      : 'Não disponível para o município'
  const population = latest?.population

  return (
    <article className="page-card education-demand-indicator" aria-labelledby={`education-demand-indicator-${indicator.key}`}>
      <div className="education-demand-indicator__heading">
        <div>
          <span className="eyebrow">{indicator.populationLabel}</span>
          <h4 id={`education-demand-indicator-${indicator.key}`}>{indicator.title}</h4>
        </div>
        <span className="education-demand-indicator__age">Faixa etária: {indicator.ageRange}</span>
      </div>

      <dl className="education-demand-indicator__metadata">
        <div>
          <dt>Último valor observado</dt>
          <dd>{latest ? `${formatPercent(latest.value)} · ${latest.year}` : '—'}</dd>
        </div>
        <div>
          <dt>Histórico disponível</dt>
          <dd>{historyLabel}</dd>
        </div>
        <div>
          <dt>População de referência</dt>
          <dd>{population == null ? '—' : `${formatNumber(population)} pessoas · ${lastYear}`}</dd>
        </div>
      </dl>

      <IndicatorProjectionPanel chartLabel={indicator.title} contextOnly projection={projection} />
      <p className="education-demand-indicator__source"><strong>Fonte:</strong> {indicator.source}</p>
    </article>
  )
}

function buildProjectionHistory(projection) {
  if (!projection) return []

  return (projection.historical_years ?? [])
    .map((year, index) => ({
      year,
      value: projection.historical_percent?.[index],
      population: projection.historical_population?.[index],
    }))
    .filter((point) => Number.isFinite(Number(point.year)) && Number.isFinite(Number(point.value)))
}

function EducationMethodologyPage({ catalog, items }) {
  const itemByKey = new Map(items.map((item) => [item.key, item]))
  const sourceGroups = EDUCATION_SOURCE_CATALOG
    .map((source) => {
      const indicators = catalog.filter((indicator) => indicator.source === source.key)
      const years = indicators.flatMap((indicator) => getIndicatorYears(itemByKey.get(indicator.key)))
      return {
        ...source,
        indicators,
        years: [...new Set(years)].sort((a, b) => a - b),
      }
    })
    .filter((source) => source.indicators.length > 0)

  return (
    <div className="education-methodology-page">
      <section className="page-card education-thematic-heading" aria-labelledby="education-methodology-title">
        <span className="eyebrow">Seção de indicadores</span>
        <h2 id="education-methodology-title">Metodologia e fontes</h2>
        <p>Como os indicadores são organizados, quais fontes os sustentam e quais cuidados orientam sua leitura no diagnóstico municipal.</p>
      </section>

      <MethodologyTextSection title="Escopo do diagnóstico" variant="scope">
        <p>O diagnóstico considera instituições de ensino localizadas no município. Quando disponíveis, os dados distinguem diferentes dependências administrativas e recortes da oferta educacional.</p>
        <p>Os indicadores apoiam a leitura do território, mas não substituem levantamentos complementares realizados pelo município.</p>
      </MethodologyTextSection>

      <section className="page-card education-methodology-sources" aria-labelledby="education-methodology-sources-title">
        <div className="education-methodology-section-heading">
          <div>
            <span className="eyebrow">Relação derivada do catálogo</span>
            <h3 id="education-methodology-sources-title">Fontes e periodicidade</h3>
          </div>
          <span>{formatIndicatorCount(catalog.length)} catalogados</span>
        </div>
        <p className="education-methodology-lead">A relação abaixo é montada a partir das fontes declaradas no catálogo central, com a cobertura observada para o município selecionado.</p>
        <div className="education-methodology-source-grid">
          {sourceGroups.map((source) => (
            <article className="education-methodology-source" key={source.key}>
              <div className="education-methodology-source__heading">
                <h4>{source.officialName}</h4>
                <span>{formatIndicatorCount(source.indicators.length)}</span>
              </div>
              <dl className="education-methodology-source__metadata">
                <div>
                  <dt>Periodicidade</dt>
                  <dd>{source.periodicity}</dd>
                </div>
                <div>
                  <dt>Último ano / intervalo</dt>
                  <dd>{formatSourceYears(source.years)}</dd>
                </div>
              </dl>
              <details className="education-methodology-source__indicators">
                <summary>Indicadores relacionados</summary>
                <p>{source.indicators.map((indicator) => normalizeEducationIndicatorLabel(indicator.label)).join('; ')}</p>
              </details>
            </article>
          ))}
        </div>
      </section>

      <MethodologyTextSection title="Como interpretar" variant="interpretation">
        <ul>
          <li>Cada card mantém seu próprio ano de referência; os anos podem variar entre indicadores.</li>
          <li>Zero é um valor válido quando informado pela fonte. Ausência de dado não deve ser interpretada como zero.</li>
          <li>Variações entre o primeiro e o último ponto válido consideram apenas os anos com dado disponível.</li>
          <li>Fontes distintas podem apresentar valores diferentes por adotarem recortes, definições e coberturas próprias.</li>
          <li>Alertas de cobertura parcial permanecem associados ao indicador e devem ser considerados na leitura.</li>
        </ul>
      </MethodologyTextSection>

      <MethodologyTextSection title="Limitações" variant="limitations">
        <ul>
          <li>Escolas localizadas no território não representam necessariamente a residência dos estudantes.</li>
          <li>Os dados atuais não identificam todas as pessoas que estão fora da escola.</li>
          <li>Os indicadores não calculam automaticamente déficit de vagas.</li>
          <li>As projeções são cenários estimados e não constituem previsão oficial.</li>
          <li>Periodicidade, cobertura e disponibilidade variam entre fontes e municípios.</li>
          <li>Um diagnóstico para o PME pode exigir dados complementares produzidos pelo município.</li>
        </ul>
      </MethodologyTextSection>

      <section className="page-card education-methodology-links" aria-labelledby="education-methodology-links-title">
        <span className="eyebrow">Leituras relacionadas</span>
        <h3 id="education-methodology-links-title">Consulte também</h3>
        <p>As páginas relacionadas preservam seus próprios indicadores e critérios.</p>
        <div className="education-methodology-links__list">
          <a href="#pne-overview">Metas e resultados do PNE</a>
          <a href="#financeiros">Indicadores Financeiros da Educação</a>
        </div>
      </section>
    </div>
  )
}

function MethodologyTextSection({ children, title, variant }) {
  const variantClass = variant ? ` education-methodology-text--${variant}` : ''
  return (
    <section className={`page-card education-methodology-text${variantClass}`} aria-labelledby={`education-methodology-${normalizeMethodologyId(title)}`}>
      <span className="eyebrow">Metodologia</span>
      <h3 id={`education-methodology-${normalizeMethodologyId(title)}`}>{title}</h3>
      {children}
    </section>
  )
}

function normalizeMethodologyId(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-')
}

function getIndicatorYears(item) {
  return normalizeYearSeries(item?.series ?? [])
    .map((point) => Number(point.ano))
    .filter((year) => Number.isFinite(year))
}

function formatSourceYears(years) {
  if (!years.length) return 'Não disponível para o município'
  if (years.length === 1) return String(years[0])
  return `${years[0]}–${years.at(-1)}`
}

function formatIndicatorCount(count) {
  return `${count} ${count === 1 ? 'indicador' : 'indicadores'}`
}

function normalizeEducationIndicatorLabel(label) {
  const normalized = String(label ?? '')
    .replace(/^Alunos por turma - /, 'Alunos por turma — ')
    .replace(/^Docentes - /, 'Docentes — ')

  const replacements = {
    'EJA': 'Educação de Jovens e Adultos',
    'Docentes — EJA': 'Docentes — Educação de Jovens e Adultos',
    'Docentes — Educação Profissional': 'Docentes — Educação Profissional e Tecnológica',
    'Matrículas na EJA': 'Matrículas na Educação de Jovens e Adultos',
    'Matrículas na educação profissional — Censo Escolar': 'Matrículas na Educação Profissional e Tecnológica — Censo Escolar',
    'Matrículas técnicas — Sinopse Estatística': 'Matrículas técnicas — Sinopse Estatística do Censo Escolar',
    'SAEB Língua Portuguesa': 'SAEB — Língua Portuguesa',
    'SAEB Matemática': 'SAEB — Matemática',
    'Educação Profissional': 'Educação Profissional e Tecnológica',
  }

  return replacements[normalized] ?? normalized
}

function EducationDetailHeader({ indicator, description }) {
  return (
    <div className="detail-heading educacao-detail-heading">
      <DetailHeadingText eyebrow="Indicador selecionado" level={2} title={normalizeEducationIndicatorLabel(indicator.label)} description={description} />
      <div className="educacao-detail-heading__badges">
        <span className="indicator-stage-badge">{indicator.themeShortLabel ?? indicator.themeLabel}</span>
        <StatusBadge status={indicator.statusLabel} tone={indicator.statusTone} />
      </div>
    </div>
  )
}

function IndicatorReferenceBox({ description }) {
  if (!description) return null

  return (
    <div className="educacao-indicator-reference">
      <span>O que este indicador mede</span>
      <p>{description}</p>
    </div>
  )
}

function EducationQuickReading({ text, tone = 'default' }) {
  if (!text) return null

  return (
    <div className={`interpretation-box education-quick-reading education-quick-reading--${tone}`}>
      <span>Leitura rápida</span>
      <p>{text}</p>
    </div>
  )
}

function PneComplementaryGroupedGrid({ items, onSelect, registerCard, selectedIndicatorKey }) {
  const groups = Object.values(EDUCATION_SECTION_GROUPS)
    .flat()
    .filter((group) => group.indicatorKeys.some((indicatorKey) => items.some((item) => item.key === indicatorKey)))
    .map((group) => ({
      ...group,
      items: items.filter((item) => item.groupKey === group.key),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="pne-complementary-groups">
      <p className="pne-complementary-groups__note">
        Indicadores contextuais relacionados ao PNE. Eles não exibem distância,
        status de meta ou projeção, e não representam cumprimento de meta legal.
      </p>
      {groups.map((group) => (
        <section className="pne-complementary-group" key={group.key}>
          <div className="pne-complementary-group__heading">
            <h3>{group.label}</h3>
            <span>{formatIndicatorCount(group.items.length)}</span>
          </div>
          <div className="education-indicator-card-grid">
            {group.items.map((item) => (
              <EducationIndicatorCard
                buttonRef={(node) => registerCard(item.key, node)}
                indicator={item}
                isSelected={item.key === selectedIndicatorKey}
                key={item.key}
                onSelect={() => onSelect(item.key)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function buildHistorySummary(series, formatLabel = (value) => String(value)) {
  const points = normalizeYearSeries(series ?? [])
    .filter((point) => !isMissing(point.valor) && point.ano)
    .sort((a, b) => Number(a.ano) - Number(b.ano))

  if (points.length < 2) return ''

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]

  return `Série de ${firstPoint.ano} a ${lastPoint.ano}: ${formatLabel(firstPoint.valor)} no início e ${formatLabel(lastPoint.valor)} no dado mais recente.`
}

function EducationIndicatorDetail({ indicator, blocos }) {
  const [selectedStageKey, setSelectedStageKey] = useState('')

  useEffect(() => {
    setSelectedStageKey('')
  }, [indicator?.key])

  if (!indicator) {
    return (
      <section className="detail-panel empty-panel">
        <p>Selecione um indicador para ver os detalhes.</p>
      </section>
    )
  }

  // Painel proprio para infraestrutura (sem grafico, com cards + tabela)
  if (indicator.key === 'rede-infraestrutura') {
    return <InfraDetailPanel indicator={indicator} blocos={blocos} />
  }

  if (indicator.key.startsWith('turmas-')) {
    return <TurmasPanoramaPanel indicator={indicator} blocos={blocos} />
  }

  const stageOptions = indicator.stageFilterOptions ?? []
  const selectedStageOption = stageOptions.find((option) => option.key === selectedStageKey) ?? stageOptions[0] ?? null
  const displayIndicator = applyStageOption(indicator, selectedStageOption)
  const hasMainSeries = displayIndicator.series.length >= 2
  const showStageFilter = stageOptions.length > 1
  const hasManyStageOptions = stageOptions.length > 4
  const stageFilterLabel = indicator.stageFilterLabel ?? 'Etapa exibida'
  const chartSummary = buildHistorySummary(displayIndicator.series, displayIndicator.formatValue)

  return (
    <section className="detail-panel educacao-detail-panel">
      <EducationDetailHeader indicator={indicator} description={indicator.description} />

      <IndicatorReferenceBox description={indicator.description} />

      <div className="metric-grid metric-grid--three">
        <MetricCard label="Valor inicial" value={indicator.initialDisplay} detail={indicator.initialYear ? `Ano ${indicator.initialYear}` : null} />
        <MetricCard label="Valor atual" value={indicator.currentDisplay} detail={indicator.currentYear ? `Ano ${indicator.currentYear}` : null} size="large" />
        <MetricCard label="Variação" value={indicator.variationDisplay} tone={indicator.variationTone} />
      </div>

      <EducationQuickReading text={indicator.quickReading} tone={indicator.statusTone} />

      <div className="indicator-chart-card educacao-main-chart-card">
        <IndicatorChartHeader
          title="Histórico do indicador"
          subtitle={`${displayIndicator.label} · Recorte exibido: ${displayIndicator.mainCutLabel}`}
          summary={chartSummary}
          hasWideSegmented={hasManyStageOptions}
        >
          {showStageFilter ? (
            <div className="indicator-stage-segmented-wrap">
              <span className="indicator-stage-segmented-label">{stageFilterLabel}</span>

              <IndicatorSegmentedControl
                options={stageOptions}
                selectedKey={selectedStageOption?.key}
                onSelect={setSelectedStageKey}
                ariaLabel="Recorte do histórico do indicador"
              />
            </div>
          ) : null}
        </IndicatorChartHeader>
        {hasMainSeries ? (
          <>
            <EducationLineChart
              color={displayIndicator.chartColor}
              formatLabel={displayIndicator.formatValue}
              scaleType={displayIndicator.scaleType}
              series={displayIndicator.series}
              showPointLabels={displayIndicator.showPointLabels}
              title={null}
            />
            <EducationSourceNotes context={dataSourceContextForEducation(displayIndicator)} />
          </>
        ) : (
          <ChartEmptyState message="Histórico não disponível." />
        )}
      </div>

      {displayIndicator.explore.length ? (
        <EducationIndicatorBreakdown indicator={displayIndicator} />
      ) : null}
    </section>
  )
}

const INFRA_EVOLUTION_KEYS = [
  'salas_climatizadas', 'salas_acessiveis',
  'internet', 'internet_alunos', 'internet_aprendizagem',
  'banda_larga', 'rede_wireless', 'comp_portatil_aluno', 'tablet_aluno',
]

function InfraBar({ value }) {
  const pct = !isMissing(value) ? Math.min(Math.max(Number(value), 0), 100) : 0
  return (
    <span className="infra-bar">
      <span className="infra-bar__fill" style={{ width: `${pct}%` }} />
    </span>
  )
}

const DEP_LABELS = {
  total: 'Total',
  publica: 'Pública',
  municipal: 'Municipal',
  estadual: 'Estadual',
  privada: 'Privada',
  federal: 'Federal',
}

function extractDepData(por_rede, dep) {
  const rows = por_rede.filter((r) => r.dependencia === dep)
  if (!rows.length) return { resumo: {}, series: {}, ultimoAno: null }
  const anos = [...new Set(rows.map((r) => r.ano))].sort((a, b) => a - b)
  const ultimoAno = anos[anos.length - 1]

  // Build resumo: latest year values for all perc_* columns
  const latest = rows.find((r) => r.ano === ultimoAno) || rows[rows.length - 1]
  const allMetricKeys = new Set()
  const resumo = {}
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      if (k.startsWith('perc_')) allMetricKeys.add(k)
    }
  }
  for (const pk of allMetricKeys) {
    const v = latest[pk]
    if (!isMissing(v)) resumo[pk] = v
  }

  // Build series: per metric key from perc_* columns
  const series = {}
  for (const pk of allMetricKeys) {
    const pts = rows
      .filter((r) => !isMissing(r[pk]))
      .map((r) => ({ ano: r.ano, valor: r[pk] }))
      .sort((a, b) => a.ano - b.ano)
    if (pts.length) series[pk.replace('perc_', '')] = pts
  }

  return { resumo, series, ultimoAno }
}

function InfraDetailPanel({ indicator, blocos }) {
  const detailDescription = indicator.description || 'Condições de conectividade, tecnologia e ambiente físico das escolas.'
  const redeBloco = blocos?.rede_escolar ?? {}
  const infra = redeBloco.infraestrutura ?? {}
  const infraResumo = infra.resumo_ultimo_ano ?? {}
  const infraSeries = infra.series ?? {}
  const grupos = infra.grupos ?? null
  const ultimoAno = infra.ultimo_ano
  const por_rede = infra.por_rede ?? []

  // ── Filtro por rede ──────────────────────────────────────────────────
  const availableDeps = ['total', ...new Set((por_rede || []).map((r) => r.dependencia).filter(Boolean))]
  const [selectedDep, setSelectedDep] = useState('total')
  // Reset to total when municipality changes
  useEffect(() => { setSelectedDep('total') }, [blocos?.rede_escolar])

  const isFiltered = selectedDep !== 'total'
  const depData = isFiltered ? extractDepData(por_rede, selectedDep) : null
  const activeResumo = depData ? depData.resumo : infraResumo
  const activeUltimoAno = depData ? depData.ultimoAno : ultimoAno
  const hasDepSeries = isFiltered && depData && Object.keys(depData.series).length > 0

  const GROUP_ORDER = ['ambiente_escolar', 'conectividade', 'rede_e_dispositivos']

  // ── Grupos com metricas ──────────────────────────────────────────────
  const cardGroups = []
  if (grupos) {
    for (const gk of GROUP_ORDER) {
      const grupo = grupos[gk]
      if (!grupo) continue
      const metrics = (grupo.metricas ?? [])
        .map((mk) => {
          const val = isFiltered ? activeResumo[`perc_${mk}`] : activeResumo[mk]
          return {
            key: mk,
            label: INFRA_METRIC_LABELS[mk] ?? mk,
            value: val,
            year: activeUltimoAno,
            isSala: mk.startsWith('salas_'),
          }
        })
        .filter((m) => !isMissing(m.value))
      if (metrics.length) {
        cardGroups.push({ groupKey: gk, groupLabel: grupo.label, metrics })
      }
    }
  }

  // ── Tabela de evolucao ──────────────────────────────────────────────
  const sourceSeries = isFiltered && hasDepSeries ? depData.series : infraSeries
  const tableLabel = isFiltered && !hasDepSeries ? 'total do município' : (DEP_LABELS[selectedDep] || selectedDep).toLowerCase()

  const yearSet = new Set()
  for (const mk of INFRA_EVOLUTION_KEYS) {
    for (const pt of sourceSeries[mk] ?? []) {
      if (!isMissing(pt.valor)) yearSet.add(pt.ano)
    }
  }
  let years = [...yearSet].sort((a, b) => a - b)
  const minTableYear = 2019
  years = years.filter((y) => y >= minTableYear)
  if (!years.length) years = [...yearSet].sort((a, b) => a - b)

  const evolutionColumns = [
    { key: 'indicador', label: 'Indicador' },
    ...years.map((y) => ({
      key: String(y),
      label: String(y),
      format: formatPercent,
      className: y === Math.max(...years) ? 'col-latest' : '',
    })),
  ]
  const evolutionRows = INFRA_EVOLUTION_KEYS
    .map((mk) => {
      const serie = sourceSeries[mk] ?? []
      const yearMap = {}
      for (const pt of serie) {
        if (!isMissing(pt.valor)) yearMap[String(pt.ano)] = pt.valor
      }
      const row = { indicador: INFRA_METRIC_LABELS[mk] ?? mk }
      for (const y of years) {
        row[String(y)] = yearMap[String(y)] ?? null
      }
      return row
    })
    .filter((row) => years.some((y) => row[String(y)] !== null))

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <section className="detail-panel educacao-detail-panel">
      <EducationDetailHeader indicator={indicator} description={detailDescription} />

      <IndicatorReferenceBox description={detailDescription} />

      <div className="infra-panorama-card">
        <span className="infra-panorama-title">
          Panorama da infraestrutura escolar{activeUltimoAno ? ` — ${activeUltimoAno}` : ''}
        </span>

        {availableDeps.length > 1 && (
          <div className="infra-dep-band">
            <div className="infra-dep-band__head">
              <span className="infra-dep-band__title">Rede exibida</span>
              <span className="infra-dep-band__hint">
                Os indicadores abaixo são recalculados conforme a rede selecionada.
              </span>
            </div>
            <SegmentedControl
              ariaLabel="Rede exibida"
              className="infra-dep-band__pills platform-segmented-control"
              optionClassName="infra-dep-pill platform-segmented-option"
              onSelect={setSelectedDep}
              options={availableDeps.map((dep) => ({ key: dep, label: DEP_LABELS[dep] || dep }))}
              selectedKey={selectedDep}
            />
          </div>
        )}

        <div className="infra-panorama-grid">
          {cardGroups.map((g) => {
            const refText = g.groupKey === 'ambiente_escolar' ? '% de salas' : '% de escolas'
            const isFirst = g.groupKey === 'ambiente_escolar'
            return (
              <div key={g.groupKey} className={`infra-panel-group${isFirst ? ' is-primary' : ''}`}>
                <div className="infra-panel-group__head">
                  <span className="infra-panel-group__title">{g.groupLabel}</span>
                  <span className="infra-panel-group__ref">{refText}</span>
                </div>
                <div className="infra-panel-group__body">
                  {g.metrics.map((m) => (
                    <div key={m.key} className="infra-row">
                      <span className="infra-row__label">{m.label}</span>
                      <div className="infra-row__meta">
                        <span className="infra-row__value">{formatPercent(m.value)}</span>
                        <span className="infra-row__bar">
                          <InfraBar value={m.value} />
                        </span>
                        <span className="infra-row__year">{m.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {evolutionRows.length > 0 && years.length > 0 ? (
        <div className="indicator-chart-card infra-evolution-table-wrap">
          <div className="education-chart-heading">
            <div>
              <span>Histórico dos principais indicadores de infraestrutura</span>
              <p>Percentual por ano — {tableLabel}</p>
            </div>
          </div>
          <div className="infra-table-scroll">
            <EducationTable
              caption="Histórico dos principais indicadores de infraestrutura"
              columns={evolutionColumns}
              rows={evolutionRows}
            />
          </div>
          <EducationSourceNotes
            context={dataSourceContextForEducation(indicator, {
              detailType: 'table',
              title: 'Histórico dos principais indicadores de infraestrutura',
            })}
          />
        </div>
      ) : null}
    </section>
  )
}

function applyStageOption(indicator, option) {
  if (!indicator || !option) return indicator
  return {
    ...indicator,
    explore: filterRenderableExplore(option.explore ?? indicator.explore),
    mainCutLabel: option.mainCutLabel ?? indicator.mainCutLabel,
    scaleType: option.scaleType ?? indicator.scaleType,
    series: normalizeYearSeries(option.series ?? indicator.series),
    showPointLabels: option.showPointLabels ?? indicator.showPointLabels,
  }
}

function EducationIndicatorBreakdown({ indicator }) {
  const detailItems = sortDetailItems(indicator.explore ?? [])
  const [selectedDetailKey, setSelectedDetailKey] = useState('')
  const tabSetId = useId().replace(/:/g, '')
  const tabRefs = useRef([])
  const activeItem = detailItems.find((item) => item.key === selectedDetailKey) ?? detailItems[0] ?? null
  const hasTabs = detailItems.length > 1

  function selectTab(index) {
    const item = detailItems[index]
    if (!item) return
    setSelectedDetailKey(item.key)
    tabRefs.current[index]?.focus()
  }

  function handleTabKeyDown(event, index) {
    let nextIndex = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % detailItems.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + detailItems.length) % detailItems.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = detailItems.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    selectTab(nextIndex)
  }

  if (!detailItems.length) return null

  return (
    <section className="educacao-explore education-support-data">
      <div className="educacao-explore__heading">
        <div>
          <span className="educacao-explore__eyebrow">Aprofundamento</span>
          <h3>Dados de apoio do indicador</h3>
          <p>Recortes por etapa, rede, localização ou perfil, quando disponíveis na estrutura atual.</p>
        </div>
      </div>

      {hasTabs ? (
        <div className="educacao-detail-tabs platform-tab-list" role="tablist" aria-label="Detalhamentos do indicador">
          {detailItems.map((item, index) => (
            <button
              ref={(element) => { tabRefs.current[index] = element }}
              className={`educacao-detail-tab platform-tab${activeItem?.key === item.key ? ' is-active' : ''}`}
              key={item.key}
              id={`education-detail-tab-${tabSetId}-${item.key}`}
              role="tab"
              aria-selected={activeItem?.key === item.key}
              aria-controls={`education-detail-panel-${tabSetId}`}
              tabIndex={activeItem?.key === item.key ? 0 : -1}
              type="button"
              onClick={() => setSelectedDetailKey(item.key)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {getDetailTabLabel(item)}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="educacao-explore__panel"
        id={`education-detail-panel-${tabSetId}`}
        role="tabpanel"
        aria-labelledby={hasTabs ? `education-detail-tab-${tabSetId}-${activeItem.key}` : undefined}
      >
        <ExploreItem indicator={indicator} item={activeItem} />
      </div>
    </section>
  )
}

function TurmasPanoramaPanel({ indicator, blocos }) {
  const turmas = useMemo(() => blocos?.turmas_docentes ?? {}, [blocos])
  const turmasSeries = useMemo(() => turmas.series ?? {}, [turmas])

  const isTotalMode = indicator.key === 'turmas-total'
  const stageKey = isTotalMode ? null : indicator.key.replace('turmas-', '')

  const METRIC_OPTIONS = [
    { key: 'turmas', label: 'Turmas', formatLabel: formatNumber },
    { key: 'alunos_por_turma', label: 'Média de alunos por turma', formatLabel: formatRatio },
    { key: 'docentes', label: 'Docentes', formatLabel: formatNumber },
    { key: 'alunos_por_docente', label: 'Alunos por docente', formatLabel: formatRatio },
  ]

  const [selectedMetricKey, setSelectedMetricKey] = useState('turmas')

  const activeMetric = METRIC_OPTIONS.find((m) => m.key === selectedMetricKey) ?? METRIC_OPTIONS[0]

  const cutLabel = isTotalMode ? 'Total do município' : etapaLabel(stageKey)

  const metricFormat = selectedMetricKey === 'turmas' || selectedMetricKey === 'docentes' ? formatNumber : formatRatio

  const displaySeries = safeValueSeries(
    isTotalMode ? turmasSeries.total : turmasSeries.por_etapa?.[stageKey],
    selectedMetricKey,
  )

  const cut = { cutLabel, metricKey: selectedMetricKey, formatLabel: metricFormat }
  if (stageKey) cut.stageKey = stageKey

  const displayExplore = filterRenderableExplore(buildTurmasExplore(turmas, cut))

  const lastPoint = displaySeries.at(-1) ?? null
  const firstPoint = displaySeries[0] ?? null
  const currentValue = lastPoint?.valor ?? null
  const initialValue = firstPoint?.valor ?? null
  const currentYear = lastPoint?.ano ?? null
  const variation = calculateVariation(initialValue, currentValue, selectedMetricKey === 'turmas' || selectedMetricKey === 'docentes' ? 'number' : 'ratio')
  const hasMainSeries = displaySeries.length >= 2
  const quickReading = `Em ${currentYear ?? '—'}, o município registra ${!isMissing(currentValue) ? activeMetric.formatLabel(currentValue) : EM} em ${activeMetric.label.toLowerCase()} no recorte ${cutLabel}.`
  const chartSummary = buildHistorySummary(displaySeries, activeMetric.formatLabel)

  return (
    <section className="detail-panel educacao-detail-panel">
      <EducationDetailHeader indicator={indicator} description={indicator.description} />

      <IndicatorReferenceBox description={indicator.description} />

      <div className="indicator-control-bar platform-control-bar">
        <div className="indicator-control-bar__copy">
          <span className="indicator-control-bar__label">Métrica analisada</span>
          <span className="indicator-control-bar__hint">Atualiza os valores, o histórico do indicador e o detalhamento.</span>
        </div>
        <IndicatorSegmentedControl
          options={METRIC_OPTIONS}
          selectedKey={selectedMetricKey}
          onSelect={setSelectedMetricKey}
          ariaLabel="Métrica analisada"
        />
      </div>

      <div className="metric-grid metric-grid--three">
        <MetricCard label="Valor inicial" value={!isMissing(initialValue) ? activeMetric.formatLabel(initialValue) : EM} detail={firstPoint?.ano ? `Ano ${firstPoint.ano}` : null} />
        <MetricCard label="Valor atual" value={!isMissing(currentValue) ? activeMetric.formatLabel(currentValue) : EM} detail={currentYear ? `Ano ${currentYear}` : null} size="large" />
        <MetricCard label="Variação" value={variation.display} tone={variation.tone} />
      </div>

      <EducationQuickReading text={quickReading} tone={indicator.statusTone} />

      <div className="indicator-chart-card educacao-main-chart-card">
        <IndicatorChartHeader
          title="Histórico do indicador"
          subtitle={`${activeMetric.label} · Recorte exibido: ${cutLabel}`}
          summary={chartSummary}
        />
        {hasMainSeries ? (
          <>
            <EducationLineChart
              color="#16713a"
              formatLabel={activeMetric.formatLabel}
              scaleType={selectedMetricKey === 'turmas' || selectedMetricKey === 'docentes' ? 'count' : 'dynamic'}
              series={displaySeries}
              showPointLabels
            />
            <EducationSourceNotes
              context={dataSourceContextForEducation(indicator, {
                detailType: selectedMetricKey,
                title: activeMetric.label,
              })}
            />
          </>
        ) : (
          <ChartEmptyState message="Histórico não disponível." />
        )}
      </div>

      {displayExplore.length ? (
        <EducationIndicatorBreakdown indicator={{ ...indicator, explore: displayExplore }} />
      ) : null}
    </section>
  )
}

function sortDetailItems(items) {
  return [...items].sort((a, b) => detailTabPriority(a) - detailTabPriority(b))
}

function dataSourceContextForEducation(indicator, extra = {}) {
  return {
    block: 'educacao',
    description: indicator?.description,
    indicatorKey: indicator?.key,
    indicatorName: indicator?.label,
    section: indicator?.themeLabel,
    themeKey: indicator?.themeKey ?? indicator?.tema,
    title: indicator?.label,
    ...extra,
  }
}

function EducationSourceNotes({ context }) {
  const { methodology, source } = getDataSourceParts(context)

  return (
    <>
      {source ? <DataSourceNote source={source} /> : null}
      {methodology ? (
        <MethodNote className="data-source-note">Nota metodológica: {methodology}</MethodNote>
      ) : null}
    </>
  )
}

function detailTabPriority(item) {
  if (Number.isFinite(item.tabPriority)) return item.tabPriority
  const label = getDetailTabLabel(item)
  if (label === 'Por rede') return 1
  if (label === 'Por localização') return 2
  if (label === 'Por etapa') return 3
  if (label === 'Por faixa etária') return 4
  if (label === 'Por cor/raça') return 5
  if (label === 'Por modalidade') return 6
  if (label === 'Histórico do indicador') return 7
  if (label === 'Infraestrutura') return 8
  return 10
}

function getDetailTabLabel(item) {
  if (item.tabLabel) return item.tabLabel
  const title = String(item.title ?? '').toLocaleLowerCase('pt-BR')
  if (item.type === 'age-range') return 'Por faixa etária'
  if (item.type === 'color-race') return 'Por cor/raça'
  if (title.includes('faixa et')) return 'Por faixa etária'
  if (title.includes('cor/ra') || title.includes('raça')) return 'Por cor/raça'
  if (title.includes('etapa')) return 'Por etapa'
  if (title.includes('localiza')) return 'Por localização'
  if (title.includes('rede') || title.includes('depend')) return 'Por rede'
  if (title.includes('modalidade')) return 'Por modalidade'
  if (title.includes('infraestrutura')) return 'Infraestrutura'
  if (title.includes('evolu') || title.includes('histórico')) return 'Histórico do indicador'
  if (item.type === 'table') return 'Tabela'
  return item.title ?? 'Detalhamento'
}

function ExploreItem({ indicator, item }) {
  const sourceContext = dataSourceContextForEducation(indicator, {
    detailType: item.type,
    title: item.title ?? item.tabLabel,
  })
  const isSchoolStageMethodology = item.key === 'rede-etapa' && Boolean(item.note)
  const sourceParts = isSchoolStageMethodology ? getDataSourceParts(sourceContext) : null
  const noteEl = isSchoolStageMethodology ? (
    <MethodNote className="educacao-explore__note">{item.note}</MethodNote>
  ) : item.note ? (
    <p className="educacao-explore__note">{item.note}</p>
  ) : null
  const sourceNote = sourceParts ? (
    <DataSourceNote source={sourceParts.source} />
  ) : (
    <EducationSourceNotes context={sourceContext} />
  )

  if (item.type === 'stacked') {
    return (
      <>
        <EducationStackedBarChart
          categories={item.categories}
          data={item.data}
          formatLabel={item.formatLabel}
          title={item.title}
        />
        {sourceNote}
        {noteEl}
      </>
    )
  }

  if (item.type === 'bar') {
    return (
      <>
        <EducationBarChart color={item.color} data={item.data} formatLabel={item.formatLabel} orientation={item.orientation} preserveOrder={item.preserveOrder} title={item.title} />
        {sourceNote}
        {noteEl}
      </>
    )
  }
  if (item.type === 'stage-detail') {
    return (
      <>
        {item.panoramaRows && item.panoramaRows.length ? (
          <div className="educacao-explore-table educacao-explore-table--spaced">
            <h4>{item.panoramaTitle}</h4>
            <EducationTable columns={item.panoramaColumns} rows={item.panoramaRows} />
            {sourceNote}
          </div>
        ) : null}
        <EducationBarChart
          color={item.distributionColor ?? '#16713a'}
          data={item.distributionData}
          formatLabel={item.formatLabel}
          title={item.distributionTitle}
        />
        {sourceNote}
        {item.historyCategories && item.historyData && item.historyData.length >= 2 ? (
          <div className="educacao-explore-block--spaced">
            <EducationStackedBarChart
              categories={item.historyCategories}
              data={item.historyData}
              formatLabel={item.formatLabel}
              title={item.historyTitle}
            />
            {sourceNote}
          </div>
        ) : item.note ? (
          <p className="educacao-explore__note">{item.note}</p>
        ) : null}
      </>
    )
  }
  if (item.type === 'stage-context') {
    const format = item.formatLabel ?? formatNumber
    const primaryValue = item.value ?? item.turmas
    const primaryLabel = item.valueLabel ?? 'Turmas'
    return (
      <div className="educacao-stage-context">
        <span>Resumo{item.ano ? ` — ${item.ano}` : ''}</span>
        <div className="educacao-stage-context__grid">
          <div className="educacao-stage-context__card">
            <span className="educacao-stage-context__value">{!isMissing(primaryValue) ? format(primaryValue) : EM}</span>
            <span className="educacao-stage-context__label">{primaryLabel}</span>
          </div>
          <div className="educacao-stage-context__card">
            <span className="educacao-stage-context__value">{!isMissing(item.alunosPorTurma) ? formatRatio(item.alunosPorTurma) : EM}</span>
            <span className="educacao-stage-context__label">Média de alunos por turma</span>
          </div>
          <div className="educacao-stage-context__card">
            <span className="educacao-stage-context__value">{!isMissing(item.docentes) ? formatNumber(item.docentes) : EM}</span>
            <span className="educacao-stage-context__label">Docentes</span>
          </div>
        </div>
      </div>
    )
  }
  if (item.type === 'age-range') {
    return (
      <>
        <AgeRangeDetail key={item.key} item={item} />
        {sourceNote}
      </>
    )
  }
  if (item.type === 'color-race') {
    return (
      <>
        <ColorRaceDetail key={item.key} item={item} />
        {sourceNote}
      </>
    )
  }
  if (item.type === 'modality-range') {
    return (
      <>
        <ModalityDetail key={item.key} item={item} />
        {sourceNote}
      </>
    )
  }
  if (item.type === 'line') {
    return item.series.length >= 2
      ? (
        <>
          <EducationLineChart color={item.color} formatLabel={item.formatLabel} scaleType={item.scaleType} series={item.series} title={item.title} />
          {sourceNote}
        </>
      )
      : <div className="education-chart-empty"><p>Não há dados suficientes para exibir o gráfico.</p></div>
  }
  if (item.type === 'table') {
    return (
      <div className="educacao-explore-table">
        <h4>{item.title}</h4>
        <EducationTable columns={item.columns} rows={item.rows} />
        {sourceNote}
        {noteEl}
      </div>
    )
  }
  return null
}

function AgeRangeDetail({ item }) {
  const stageOptions = item.stageOptions ?? []
  const defaultStage = stageOptions[0]?.key ?? null
  const [viewMode, setViewMode] = useState('comparison')
  const [selectedStageKey, setSelectedStageKey] = useState(defaultStage ?? '')
  const activeStageKey = stageOptions.some((stage) => stage.key === selectedStageKey)
    ? selectedStageKey
    : defaultStage
  const activeStage = stageOptions.find((stage) => stage.key === activeStageKey) ?? null
  const activeStageLabel = activeStage?.label ?? item.stageLabel
  const scopedRows = activeStageKey
    ? item.rows.filter((row) => row[activeStage?.field ?? 'etapa_ensino'] === activeStageKey)
    : item.rows
  const faixaOptions = ageRangeOptions(scopedRows)
  const [selectedFaixa, setSelectedFaixa] = useState('')
  const activeFaixa = faixaOptions.includes(selectedFaixa) ? selectedFaixa : faixaOptions[0]
  const comparisonYears = comparisonYearsWithRecentTail(scopedRows)
  const comparisonRows = ageRangeComparisonRows(scopedRows, comparisonYears, faixaOptions)
  const ageCategories = ageRangeCategoryDefinitions(faixaOptions)
  const historySeries = ageRangeHistorySeries(scopedRows, activeFaixa)
  const period = historySeries.length
    ? `${historySeries[0].ano}-${historySeries[historySeries.length - 1].ano}`
    : ''
  const comparisonTitlePrefix = item.comparisonTitlePrefix ?? 'Matrículas por faixa etária'
  const historyStageLabel = item.historyStageLabel ?? activeStageLabel
  const comparisonTitle = comparisonYears.length
    ? `${comparisonTitlePrefix} — ${activeStageLabel} — ${formatYearList(comparisonYears)}`
    : `${comparisonTitlePrefix} — ${activeStageLabel} — comparação entre anos`
  const historyTitle = period
    ? `Histórico — ${historyStageLabel} — ${activeFaixa} — ${period}`
    : `Histórico — ${historyStageLabel} — ${activeFaixa}`

  if (!comparisonRows.length || !ageCategories.length) {
    return <div className="education-chart-empty"><p>Não há dados suficientes para exibir o gráfico.</p></div>
  }

  return (
    <div className="educacao-age-detail">
      <div className="educacao-age-detail__controls">
        <label className="educacao-age-detail__control">
          <span>Visualização</span>
          <select value={viewMode} onChange={(event) => setViewMode(event.target.value)}>
            <option value="comparison">Comparação por ano</option>
            <option value="history">Histórico de uma faixa</option>
          </select>
        </label>
        {stageOptions.length ? (
          <label className="educacao-age-detail__control">
            <span>Etapa</span>
            <select value={activeStageKey ?? ''} onChange={(event) => setSelectedStageKey(event.target.value)}>
              {stageOptions.map((stage) => (
                <option key={stage.key} value={stage.key}>{stage.label}</option>
              ))}
            </select>
          </label>
        ) : null}
        {viewMode === 'history' ? (
          <label className="educacao-age-detail__control">
            <span>Faixa etária</span>
            <select value={activeFaixa ?? ''} onChange={(event) => setSelectedFaixa(event.target.value)}>
              {faixaOptions.map((faixa) => (
                <option key={faixa} value={faixa}>{faixa}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {viewMode === 'comparison' ? (
        <AgeRangeComparisonChart
          categories={ageCategories}
          data={comparisonRows}
          formatLabel={item.formatLabel}
          title={comparisonTitle}
          years={comparisonYears}
        />
      ) : (
        <EducationLineChart
          color={item.historyColor}
          formatLabel={item.formatLabel}
          scaleType="count"
          series={historySeries}
          showPointLabels
          title={historyTitle}
        />
      )}
    </div>
  )
}

function AgeRangeComparisonChart({ categories, data, years, title, formatLabel }) {
  const [activeBar, setActiveBar] = useState(null)
  const chart = buildAgeRangeComparisonChart(data, categories, years, formatLabel)

  if (!chart || !chart.rows.length || !chart.categories.length) {
    return <ChartEmptyState />
  }

  return (
    <div className="education-chart education-age-comparison-chart">
      <h4 className="education-chart__title">{title}</h4>
      {chart.categories.length > 1 ? (
        <ChartLegend className="education-stacked-legend" items={chart.categories} />
      ) : null}
      <div className="education-chart__canvas">
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={title}>
          <g className="chart-grid">
            {chart.yTicks.map((tick, i) => (
              <g key={`y-${i}`}>
                <line x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={tick.y} y2={tick.y} stroke="var(--chart-grid)" strokeWidth="1" />
                <text x={chart.padding.left - 10} y={tick.y + 4} textAnchor="end" className="chart-axis-label">{tick.label}</text>
              </g>
            ))}
          </g>
          <line x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={chart.height - chart.padding.bottom} y2={chart.height - chart.padding.bottom} stroke="var(--chart-axis)" strokeWidth="1" />
          <line x1={chart.padding.left} x2={chart.padding.left} y1={chart.padding.top} y2={chart.height - chart.padding.bottom} stroke="var(--chart-axis)" strokeWidth="1" />
          {chart.rows.map((row) => (
            <g key={row.year}>
              {row.bars.map((bar) => (
                <g key={`${row.year}-${bar.key}`}>
                  {!isMissing(bar.value) ? (
                    <>
                      <rect
                        aria-label={`${bar.category}, ${bar.year}: ${bar.label}`}
                        className="chart-mark"
                        x={bar.x}
                        y={bar.y}
                        width={bar.width}
                        height={bar.height}
                        fill={bar.color}
                        fillOpacity={activeBar?.key === bar.key && activeBar?.year === bar.year ? '1' : '0.86'}
                        onBlur={() => setActiveBar(null)}
                        onFocus={() => setActiveBar(bar)}
                        onKeyDown={(event) => closeChartTooltipOnEscape(event, () => setActiveBar(null))}
                        onMouseEnter={() => setActiveBar(bar)}
                        onMouseLeave={() => setActiveBar(null)}
                        rx="3"
                        tabIndex="0"
                      >
                        <title>{`${bar.category}, ${bar.year}: ${bar.label}`}</title>
                      </rect>
                      <text
                        x={bar.labelX}
                        y={bar.labelY}
                        textAnchor="middle"
                        className="chart-bar-value"
                      >
                        {bar.label}
                      </text>
                    </>
                  ) : null}
                </g>
              ))}
              <text x={row.x + row.width / 2} y={chart.height - 18} textAnchor="middle" className="chart-x-label">{row.year}</text>
            </g>
          ))}
        </svg>
        {activeBar ? (
          <ChartTooltip
            className="education-chart__tooltip education-chart__tooltip--bar"
            label={activeBar.year}
            series={activeBar.category}
            value={activeBar.label}
            style={{
              left: `${Math.min(90, Math.max(10, ((activeBar.x + activeBar.width / 2) / chart.width) * 100))}%`,
              top: `${Math.min(82, Math.max(12, (activeBar.y / chart.height) * 100))}%`,
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

function ModalityDetail({ item }) {
  const modalidadeOptions = modalityOptions(item.rows)
  const [viewMode, setViewMode] = useState('comparison')
  const [selectedModalidade, setSelectedModalidade] = useState('')
  const activeModalidade = modalidadeOptions.some((option) => option.key === selectedModalidade)
    ? selectedModalidade
    : modalidadeOptions[0]?.key
  const comparisonYears = comparisonYearsForRows(item.rows)
  const comparisonRows = categoryComparisonRows(item.rows, comparisonYears, modalidadeOptions, 'modalidade')
  const categories = modalidadeOptions.map((option, index) => ({
    key: option.key,
    label: option.label,
    color: CATEGORY_COMPARISON_COLORS[index % CATEGORY_COMPARISON_COLORS.length],
  }))
  const historySeries = categoryHistorySeries(item.rows, activeModalidade, 'modalidade')
  const period = historySeries.length
    ? `${historySeries[0].ano}-${historySeries[historySeries.length - 1].ano}`
    : ''
  const comparisonTitle = comparisonYears.length
    ? `Matrículas por modalidade — ${formatYearList(comparisonYears)}`
    : 'Matrículas por modalidade — comparação entre anos'
  const historyTitle = period
    ? `Histórico — ${modLabel(activeModalidade)} — ${period}`
    : `Histórico — ${modLabel(activeModalidade)}`

  if (!comparisonRows.length || !categories.length) {
    return <div className="education-chart-empty"><p>Não há dados suficientes para exibir o gráfico.</p></div>
  }

  return (
    <div className="educacao-age-detail">
      <div className="educacao-age-detail__controls">
        <label className="educacao-age-detail__control">
          <span>Visualização</span>
          <select value={viewMode} onChange={(event) => setViewMode(event.target.value)}>
            <option value="comparison">Comparação por ano</option>
            <option value="history">Histórico de uma modalidade</option>
          </select>
        </label>
        {viewMode === 'history' ? (
          <label className="educacao-age-detail__control">
            <span>Modalidade</span>
            <select value={activeModalidade ?? ''} onChange={(event) => setSelectedModalidade(event.target.value)}>
              {modalidadeOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {viewMode === 'comparison' ? (
        <AgeRangeComparisonChart
          categories={categories}
          data={comparisonRows}
          formatLabel={item.formatLabel}
          title={comparisonTitle}
          years={comparisonYears}
        />
      ) : (
        <EducationLineChart
          color={item.historyColor}
          formatLabel={item.formatLabel}
          scaleType="count"
          series={historySeries}
          showPointLabels
          title={historyTitle}
        />
      )}
    </div>
  )
}

function ColorRaceDetail({ item }) {
  const stageOptions = item.stageOptions ?? []
  const defaultStage = stageOptions[0]?.key ?? null
  const [viewMode, setViewMode] = useState('comparison')
  const [selectedStageKey, setSelectedStageKey] = useState(defaultStage ?? '')
  const activeStageKey = stageOptions.some((stage) => stage.key === selectedStageKey)
    ? selectedStageKey
    : defaultStage
  const activeStage = stageOptions.find((stage) => stage.key === activeStageKey) ?? null
  const activeStageLabel = activeStage?.label ?? item.stageLabel
  const scopedRows = activeStageKey
    ? item.rows.filter((row) => row[activeStage?.field ?? 'etapa_ensino'] === activeStageKey)
    : item.rows
  const corOptions = corRacaOptions(scopedRows)
  const [selectedCorRaca, setSelectedCorRaca] = useState('')
  const activeCorRaca = corOptions.some((option) => option.key === selectedCorRaca)
    ? selectedCorRaca
    : corOptions[0]?.key
  const comparisonYears = comparisonYearsWithRecentTail(scopedRows, { minYear: 2019 })
  const comparisonRows = categoryComparisonRows(scopedRows, comparisonYears, corOptions, 'cor_raca')
  const categories = corOptions.map((option, index) => ({
    key: option.key,
    label: option.label,
    color: CATEGORY_COMPARISON_COLORS[index % CATEGORY_COMPARISON_COLORS.length],
  }))
  const historySeries = categoryHistorySeries(scopedRows, activeCorRaca, 'cor_raca')
  const period = historySeries.length
    ? `${historySeries[0].ano}-${historySeries[historySeries.length - 1].ano}`
    : ''
  const comparisonTitlePrefix = item.comparisonTitlePrefix ?? 'Matrículas por cor/raça'
  const historyStageLabel = item.historyStageLabel ?? activeStageLabel
  const comparisonTitle = comparisonYears.length
    ? `${comparisonTitlePrefix} — ${activeStageLabel} — ${formatYearList(comparisonYears)}`
    : `${comparisonTitlePrefix} — ${activeStageLabel} — comparação entre anos`
  const historyTitle = period
    ? `Histórico — ${historyStageLabel} — ${corRacaLabel(activeCorRaca)} — ${period}`
    : `Histórico — ${historyStageLabel} — ${corRacaLabel(activeCorRaca)}`

  if (!comparisonRows.length || !categories.length) {
    return <div className="education-chart-empty"><p>Não há dados suficientes para exibir o gráfico.</p></div>
  }

  return (
    <div className="educacao-age-detail">
      <div className="educacao-age-detail__controls">
        <label className="educacao-age-detail__control">
          <span>Visualização</span>
          <select value={viewMode} onChange={(event) => setViewMode(event.target.value)}>
            <option value="comparison">Comparação por ano</option>
            <option value="history">Histórico de uma cor/raça</option>
          </select>
        </label>
        {stageOptions.length ? (
          <label className="educacao-age-detail__control">
            <span>Etapa</span>
            <select value={activeStageKey ?? ''} onChange={(event) => setSelectedStageKey(event.target.value)}>
              {stageOptions.map((stage) => (
                <option key={stage.key} value={stage.key}>{stage.label}</option>
              ))}
            </select>
          </label>
        ) : null}
        {viewMode === 'history' ? (
          <label className="educacao-age-detail__control">
            <span>Cor/raça</span>
            <select value={activeCorRaca ?? ''} onChange={(event) => setSelectedCorRaca(event.target.value)}>
              {corOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {viewMode === 'comparison' ? (
        <AgeRangeComparisonChart
          categories={categories}
          data={comparisonRows}
          formatLabel={item.formatLabel}
          title={comparisonTitle}
          years={comparisonYears}
        />
      ) : (
        <EducationLineChart
          color={item.historyColor}
          formatLabel={item.formatLabel}
          scaleType="count"
          series={historySeries}
          showPointLabels
          title={historyTitle}
        />
      )}
    </div>
  )
}

function buildPneComplementaryTheme({ indicadores, results }) {
  if (!results) return null

  const itemByKey = buildPneCatalogItemMap(indicadores)
  const groupByIndicatorKey = new Map(
    Object.values(EDUCATION_SECTION_GROUPS)
      .flat()
      .flatMap((group) => group.indicatorKeys.map((indicatorKey) => [indicatorKey, group])),
  )
  const items = EDUCATION_COMPLEMENTARY_INDICATOR_CATALOG.map((catalogEntry) => {
      const indicatorKey = catalogEntry.key
      const group = groupByIndicatorKey.get(indicatorKey)
      const result = results?.[indicatorKey]
      const catalogItem = itemByKey.get(indicatorKey)

      if (!PNE_CONTEXT_PROXY_INDICATOR_KEYS.has(indicatorKey)) return null
      if (!hasPneComplementaryResult(result)) return null

      const formatType = inferPneComplementaryFormatType(catalogItem, result)
      const formatValueForType = getFormatter(formatType)
      const currentDisplay = result.display?.end_value ?? formatValueForType(result.end_value)
      const currentYear = result.end_year ?? getLatestSeriesYear(result.series)

      return createIndicator({
        key: indicatorKey,
        label: catalogItem?.label ?? catalogEntry.label ?? INFRA_METRIC_LABELS[indicatorKey] ?? indicatorKey,
        description: catalogItem?.desc ?? catalogEntry.description ?? 'Indicador contextual relacionado ao PNE.',
        themeKey: PANORAMA_THEME_KEYS.complementaresPne,
        themeLabel: group?.label ?? catalogEntry.section,
        themeShortLabel: group?.label ?? 'Indicador contextual',
        categoryLabel: group?.label ?? catalogEntry.section,
        categories: [FILTER_KEYS.todos],
        series: result.series ?? [],
        currentValue: result.end_value,
        currentYear,
        formatType,
        mainCutLabel: group?.label ?? catalogEntry.section,
        groupKey: catalogEntry.groupKey,
        pneComplementaryGroupKey: catalogEntry.groupKey,
        quickReading: `Indicador contextual do PNE: ${currentDisplay} em ${currentYear ?? 'ano indisponível'}. Não representa cumprimento da meta legal.`,
        searchText: [
          indicatorKey,
          group?.label,
          catalogItem?.sub,
          catalogItem?.categoryLabel,
          'contexto proxy complementar PNE',
        ].filter(Boolean).join(' '),
        statusLabel: 'Contexto',
        statusTone: 'muted',
      })
  }).filter(Boolean)

  if (!items.length) return null

  return {
    key: PANORAMA_THEME_KEYS.complementaresPne,
    label: 'Contexto complementar',
    shortLabel: 'Contexto complementar',
    items,
  }
}

function buildPneCatalogItemMap(indicadores) {
  const categories = indicadores?.cycles?.pne_2026_2036?.categories ?? []
  const entries = categories.flatMap((category) =>
    (category.items ?? []).map((item) => [
      item.key,
      {
        ...item,
        categoryLabel: category.label,
      },
    ]),
  )

  return new Map(entries)
}

function hasPneComplementaryResult(result) {
  if (!result || result.available === false) return false
  if (Number.isFinite(Number(result.end_value))) return true
  return (result.series ?? []).some((point) => Number.isFinite(Number(point?.valor)))
}

function inferPneComplementaryFormatType(catalogItem, result) {
  const valueMode = catalogItem?.value_mode ?? result?.value_mode
  if (valueMode === 'count' || valueMode === 'absolute') return 'number'
  if (valueMode === 'ratio_percent' || valueMode === 'percent') return 'percent'
  if (String(result?.display?.end_value ?? '').includes('%')) return 'percent'
  return 'number'
}

function getLatestSeriesYear(series = []) {
  return normalizeYearSeries(series).at(-1)?.ano ?? null
}

function buildEducationModel(blocos) {
  const mat = blocos.matriculas ?? {}
  const rede = blocos.rede_escolar ?? {}
  const alunosTurma = blocos.alunos_turma ?? {}
  const turmas = blocos.turmas_docentes ?? {}
  const fluxo = blocos.fluxo ?? {}
  const aprend = blocos.aprendizagem ?? {}
  const oferta = blocos.oferta_tecnica ?? {}
  const matResumo = mat.resumo_ultimo_ano ?? {}
  const redeResumo = rede.resumo_ultimo_ano ?? {}
  const alunosTurmaResumo = alunosTurma.resumo_ultimo_ano ?? {}
  const turmasResumo = turmas.resumo_ultimo_ano ?? {}
  const fluxoResumo = fluxo.resumo_ultimo_ano ?? {}
  const aprendResumo = aprend.resumo_ultimo_ano ?? {}
  const ofertaResumo = oferta.resumo_ultimo_ano ?? {}
  const preferredIdeb = getPreferredIdeb(aprendResumo)

  const items = [
    ...buildMatriculasIndicators(mat),
    ...buildRedeIndicators(rede),
    ...buildAlunosTurmaIndicators(alunosTurma),
    ...buildDocentesIndicators(turmas),
    ...buildFluxoIndicators(fluxo),
    ...buildAprendizagemIndicators(aprend),
    ...buildOfertaIndicators(oferta),
  ]

  const themes = [
    makeTheme('matriculas', 'Matrículas e atendimento', 'Matrículas', items),
    makeTheme('rede', 'Escolas', 'Escolas', items),
    makeTheme('turmas', 'Alunos por turma', 'Alunos por turma', items),
    makeTheme('docentes', 'Docentes', 'Docentes', items),
    makeTheme('fluxo', 'Fluxo escolar', 'Fluxo', items),
    makeTheme('aprendizagem', 'Aprendizagem', 'Aprendizagem', items),
    makeTheme('oferta', 'Matrículas técnicas · Sinopse Estatística', 'Sinopse Estatística', items),
  ]

  return {
    overview: [
      { label: 'Matrículas', value: formatNumber(matResumo.total_matriculas), year: mat.ultimo_ano },
      { label: 'Escolas', value: formatNumber(redeResumo.total_escolas), year: rede.ultimo_ano },
      { label: 'Docentes', value: formatNumber(turmasResumo.docentes), year: turmas.ultimo_ano },
      { label: 'Alunos/turma (fund.)', value: formatRatio(alunosTurmaResumo.alunos_por_turma_fundamental), year: alunosTurma.ultimo_ano },
      { label: 'Aprovação', value: formatPercent(fluxoResumo.taxa_aprovacao), year: fluxo.ultimo_ano, tone: 'success' },
      { label: 'IDEB', value: preferredIdeb ? formatValue(preferredIdeb.ideb) : EM, year: preferredIdeb?.ano },
      { label: 'Matrículas técnicas', value: formatNumber(ofertaResumo.total_matriculas_tecnicas), year: oferta.ultimo_ano },
    ],
    items,
    themes,
  }
}

function makeTheme(key, label, shortLabel, items) {
  const themeItems = items.filter((item) => item.themeKey === key)
  return { key, label, shortLabel, items: themeItems }
}

function buildMatriculasIndicators(mat) {
  const series = mat.series ?? {}
  const resumo = mat.resumo_ultimo_ano ?? {}
  const byEtapa = resumo.por_etapa ?? {}
  const latestYear = mat.ultimo_ano

  return [
    createIndicator({ key: 'mat-total', label: 'Total de matrículas', description: 'Total de matrículas registradas na educação básica do município.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.todos], isGeral: true, series: normalizeYearSeries(series.total), currentValue: resumo.total_matriculas, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Total do município', explore: buildMatriculasExplore(mat, { cutKey: 'total', cutLabel: 'Total do município' }), stageFilterOptions: buildMatriculasStageOptions(mat) }),
    createIndicator({ key: 'mat-infantil', label: 'Matrículas na educação infantil', description: 'Matrículas registradas na educação infantil.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.infantil], stageLabel: 'Educação Infantil', series: normalizeYearSeries(series.por_etapa?.infantil), currentValue: byEtapa.infantil, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Educação Infantil', explore: buildMatriculasExplore(mat, { cutKey: 'infantil', cutLabel: 'Educação Infantil', stageKey: 'infantil' }) }),
    createIndicator({ key: 'mat-fundamental', label: 'Matrículas no ensino fundamental', description: 'Matrículas registradas no ensino fundamental.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.fundamental], stageLabel: 'Ensino Fundamental', series: normalizeYearSeries(series.por_etapa?.fundamental), currentValue: byEtapa.fundamental, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Ensino Fundamental', explore: buildMatriculasExplore(mat, { cutKey: 'fundamental', cutLabel: 'Ensino Fundamental', stageKey: 'fundamental' }) }),
    createIndicator({ key: 'mat-medio', label: 'Matrículas no ensino médio', description: 'Matrículas registradas no ensino médio.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.medio], stageLabel: 'Ensino Médio', series: normalizeYearSeries(series.por_etapa?.medio), currentValue: byEtapa.medio, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Ensino Médio', explore: buildMatriculasExplore(mat, { cutKey: 'medio', cutLabel: 'Ensino Médio', stageKey: 'medio' }) }),
    createIndicator({ key: 'mat-eja', label: 'Matrículas na EJA', description: 'Matrículas registradas na educação de jovens e adultos.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.eja], stageLabel: 'EJA', series: normalizeYearSeries(series.por_etapa?.eja), currentValue: byEtapa.eja, currentYear: latestYear, formatType: 'number', mainCutLabel: 'EJA', explore: buildMatriculasExplore(mat, { cutKey: 'eja', cutLabel: 'EJA', stageKey: 'eja' }) }),
    createIndicator({ key: 'mat-profissional', label: 'Matrículas na educação profissional — Censo Escolar', description: 'Matrículas registradas na educação profissional/técnica no Censo Escolar, por etapa de ensino.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Censo Escolar', categories: [FILTER_KEYS.profissional], stageLabel: 'Educação Profissional', series: normalizeYearSeries(series.por_etapa?.profissional), currentValue: byEtapa.profissional, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Educação Profissional · Censo Escolar', explore: buildMatriculasExplore(mat, { cutKey: 'profissional', cutLabel: 'Educação Profissional', stageKey: 'profissional' }) }),
    createIndicator({ key: 'mat-integral', label: 'Matrículas em tempo integral', description: 'Percentual total de matrículas em tempo integral no município.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.todos], isGeral: true, series: valueSeries(series.integral, 'percentual'), currentValue: resumo.percentual_integral, currentYear: latestYear, formatType: 'percent', mainCutLabel: 'Tempo integral no total do município', explore: buildMatriculasIntegralExplore(mat) }),
    createIndicator({ key: 'mat-rural', label: 'Matrículas em zona rural', description: 'Matrículas vinculadas à localização rural.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.todos], isGeral: true, series: normalizeYearSeries(series.por_localizacao?.rural), currentValue: resumo.matriculas_rural, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Zona rural', explore: buildMatriculasExplore(mat, { cutKey: 'rural', cutLabel: 'Zona rural', locationKey: 'rural' }) }),
    createIndicator({ key: 'mat-publica', label: 'Matrículas na rede pública', description: 'Matrículas na rede pública municipal, estadual e federal.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.todos], isGeral: true, series: normalizeYearSeries(series.por_dependencia?.publica), currentValue: resumo.matriculas_publica, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Rede pública', explore: buildMatriculasExplore(mat, { cutKey: 'publica', cutLabel: 'Rede pública', dependencyKey: 'publica' }) }),
    createIndicator({ key: 'mat-privada', label: 'Matrículas na rede privada', description: 'Matrículas na rede privada.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.todos], isGeral: true, series: normalizeYearSeries(series.por_dependencia?.privada), currentValue: resumo.matriculas_privada, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Rede privada', explore: buildMatriculasExplore(mat, { cutKey: 'privada', cutLabel: 'Rede privada', dependencyKey: 'privada' }) }),
  ]
}

function buildRedeIndicators(rede) {
  const series = rede.series ?? {}
  const resumo = rede.resumo_ultimo_ano ?? {}
  const porEtapa = resumo.por_etapa ?? {}
  const latestYear = rede.ultimo_ano
  const infra = rede.infraestrutura ?? {}
  const infraGroups = Object.values(infra.grupos ?? {})
  const infraDimensionCount = infraGroups.reduce((total, group) => total + (group.metricas?.length ?? 0), 0)
  const infraLatestYear = infra.ultimo_ano ?? latestYear
  const stageOrder = ['infantil', 'fundamental', 'medio', 'eja', 'profissional']
  const base = { themeKey: 'rede', themeLabel: 'Escolas', themeShortLabel: 'Escolas', categories: [FILTER_KEYS.todos], isGeral: true, currentYear: latestYear }

  const etapaIndicators = stageOrder.map((stageKey) => createIndicator({
    ...base,
    key: `rede-${stageKey}`,
    label: etapaLabel(stageKey),
    description: `Escolas que ofertam ${etapaLabel(stageKey).toLowerCase()}.`,
    categories: [FILTER_KEYS.todos],
    isGeral: true,
    series: normalizeYearSeries(series.por_etapa?.[stageKey]),
    currentValue: porEtapa[stageKey],
    formatType: 'number',
    mainCutLabel: etapaLabel(stageKey),
    explore: buildRedeExplore(rede, { cutKey: stageKey, cutLabel: etapaLabel(stageKey), stageKey }),
  }))

  return [
    createIndicator({ ...base, key: 'rede-total', label: 'Total de escolas', description: 'Total de escolas registradas no município.', series: normalizeYearSeries(series.total), currentValue: resumo.total_escolas, formatType: 'number', mainCutLabel: 'Total do município', explore: buildRedeExplore(rede, { cutKey: 'total', cutLabel: 'Total do município' }) }),
    ...etapaIndicators,
    createIndicator({
      ...base,
      key: 'rede-infraestrutura',
      label: 'Infraestrutura',
      cardTitle: 'Panorama da infraestrutura escolar',
      cardVariant: 'exploratory',
      description: 'Explore as dimensões de ambiente escolar, conectividade e equipamentos disponíveis nas escolas.',
      series: valueSeries(series.internet, 'perc_internet'),
      currentValue: resumo.perc_internet,
      formatType: 'percent',
      mainCutLabel: 'Escolas com internet',
      explore: buildRedeInfraExplore(rede),
      exploratorySummary: {
        count: infraDimensionCount,
        groupCount: infraGroups.length,
        label: 'dimensões',
        latestYear: infraLatestYear,
      },
    }),
  ]
}

function buildAlunosTurmaIndicators(alunosTurma) {
  const series = alunosTurma.series ?? {}
  const resumo = alunosTurma.resumo_ultimo_ano ?? {}
  const latestYear = alunosTurma.ultimo_ano
  const base = {
    themeKey: 'turmas',
    themeLabel: 'Alunos por turma',
    themeShortLabel: 'Alunos por turma',
    currentYear: latestYear,
    formatType: 'ratio',
    scaleType: 'dynamic',
    notices: alunosTurma.avisos ?? [],
  }

  const options = (alunosTurma.series_options ?? [])
    .filter((option) => ALUNOS_TURMA_STAGE_ORDER.includes(option.etapa_ensino))
    .filter((option) => hasSeriesData(series.por_serie?.[option.key]))
    .sort((a, b) => {
      const stageDiff = ALUNOS_TURMA_STAGE_ORDER.indexOf(a.etapa_ensino) - ALUNOS_TURMA_STAGE_ORDER.indexOf(b.etapa_ensino)
      if (stageDiff !== 0) return stageDiff
      return Number(a.ordem ?? 999) - Number(b.ordem ?? 999)
    })

  return ALUNOS_TURMA_STAGE_ORDER.map((stageKey) => {
    const stageOptions = options.filter((option) => option.etapa_ensino === stageKey)
    const totalSerieKey = ATU_TOTAL_SERIE_BY_STAGE[stageKey] ?? stageOptions[0]?.key
    const mainOption = stageOptions.find((option) => option.key === totalSerieKey) ?? stageOptions[0]
    if (!mainOption) return null

    const serieKey = mainOption.key
    const serieLabel = alunosTurmaSerieLabel(serieKey, mainOption.label)
    const serie = normalizeYearSeries(series.por_serie?.[serieKey])
    if (serie.length < 2) return null
    const searchText = stageOptions
      .map((option) => alunosTurmaSerieLabel(option.key, option.label))
      .join(' ')

    return createIndicator({
      ...base,
      key: `alunos-turma-${stageKey}`,
      label: `Alunos por turma — ${etapaLabel(stageKey)}`,
      description: `Média oficial de alunos por turma em ${etapaLabel(stageKey).toLocaleLowerCase('pt-BR')}. Use o filtro para trocar total, ano ou série.`,
      categories: [FILTER_KEYS[stageKey] ?? FILTER_KEYS.todos],
      stageKey,
      stageLabel: etapaLabel(stageKey),
      series: serie,
      currentValue: resumo.por_etapa?.[stageKey] ?? serie.at(-1)?.valor,
      mainCutLabel: serieLabel,
      searchText,
      explore: buildAlunosTurmaExplore(alunosTurma, {
        stageKey,
        serieKey,
        serieLabel,
      }),
      stageFilterLabel: 'Série exibida',
      stageFilterOptions: buildAlunosTurmaSerieOptions(alunosTurma, stageOptions),
    })
  }).filter(Boolean)
}

function buildDocentesIndicators(turmas) {
  const series = turmas.series ?? {}
  const resumo = turmas.resumo_ultimo_ano ?? {}
  const latestYear = turmas.ultimo_ano
  const base = { themeKey: 'docentes', themeLabel: 'Docentes', themeShortLabel: 'Docentes', categories: [FILTER_KEYS.todos], isGeral: true, currentYear: latestYear, notices: turmas.avisos ?? [] }
  const stageOrder = ['infantil', 'fundamental', 'medio', 'eja', 'profissional']

  const etapaIndicators = stageOrder.map((stageKey) => {
    const stageSeries = valueSeries(series.por_etapa?.[stageKey], 'docentes')
    if (stageSeries.length < 2) return null
    return createIndicator({
      ...base,
      key: `docentes-${stageKey}`,
      label: `Docentes — ${etapaLabel(stageKey)}`,
      description: `Total de docentes vinculados a ${etapaLabel(stageKey).toLowerCase()}.`,
      categories: [FILTER_KEYS[stageKey] ?? FILTER_KEYS.todos],
      isGeral: false,
      stageLabel: etapaLabel(stageKey),
      series: stageSeries,
      currentValue: latestValue(series.por_etapa?.[stageKey], 'docentes'),
      formatType: 'number',
      mainCutLabel: etapaLabel(stageKey),
      explore: buildTurmasExplore(turmas, {
        cutLabel: etapaLabel(stageKey),
        formatLabel: formatNumber,
        metricKey: 'docentes',
        stageKey,
      }),
    })
  }).filter(Boolean)

  return [
    createIndicator({
      ...base,
      key: 'docentes-total',
      label: 'Total de docentes',
      description: 'Total de docentes registrados no município.',
      series: valueSeries(series.total, 'docentes'),
      currentValue: resumo.docentes,
      formatType: 'number',
      mainCutLabel: 'Total do município',
      explore: buildTurmasExplore(turmas, {
        cutLabel: 'Total do município',
        formatLabel: formatNumber,
        metricKey: 'docentes',
      }),
      stageFilterOptions: buildTurmasStageOptions(turmas, {
        formatLabel: formatNumber,
        metricKey: 'docentes',
      }),
    }),
    ...etapaIndicators,
  ]
}

function buildFluxoIndicators(fluxo) {
  const series = fluxo.series ?? {}
  const resumo = fluxo.resumo_ultimo_ano ?? {}
  const latestYear = fluxo.ultimo_ano
  const defaultSeries = series.por_etapa?.fundamental ?? []
  const medioSeries = series.por_etapa?.medio ?? []
  const base = { themeKey: 'fluxo', themeLabel: 'Fluxo escolar', themeShortLabel: 'Fluxo', categories: [FILTER_KEYS.fundamental], stageLabel: 'Ensino Fundamental', currentYear: latestYear, formatType: 'percent', notices: fluxo.avisos ?? [] }
  return [
    createIndicator({ ...base, key: 'fluxo-aprovacao', label: 'Taxa de aprovação', description: 'Percentual de aprovação no fluxo escolar.', series: valueSeries(defaultSeries, 'taxa_aprovacao'), currentValue: resumo.taxa_aprovacao, mainCutLabel: 'Ensino Fundamental', explore: buildFluxoExplore(fluxo, { cutLabel: 'Ensino Fundamental', stageKey: 'fundamental', metricKey: 'taxa_aprovacao' }), stageFilterOptions: buildFluxoStageOptions(fluxo, { metricKey: 'taxa_aprovacao' }) }),
    createIndicator({ ...base, key: 'fluxo-aprovacao-medio', label: 'Taxa de aprovação no ensino médio', description: 'Percentual de aprovação no ensino médio.', series: valueSeries(medioSeries, 'taxa_aprovacao'), currentValue: latestValue(medioSeries, 'taxa_aprovacao'), mainCutLabel: 'Ensino Médio', stageLabel: 'Ensino Médio', categories: [FILTER_KEYS.medio], explore: buildFluxoExplore(fluxo, { cutLabel: 'Ensino Médio', stageKey: 'medio', metricKey: 'taxa_aprovacao' }) }),
    createIndicator({ ...base, key: 'fluxo-reprovacao', label: 'Taxa de reprovação', description: 'Percentual de reprovação no fluxo escolar.', series: valueSeries(defaultSeries, 'taxa_reprovacao'), currentValue: resumo.taxa_reprovacao, mainCutLabel: 'Ensino Fundamental', explore: buildFluxoExplore(fluxo, { cutLabel: 'Ensino Fundamental', stageKey: 'fundamental', metricKey: 'taxa_reprovacao' }), stageFilterOptions: buildFluxoStageOptions(fluxo, { metricKey: 'taxa_reprovacao' }) }),
    createIndicator({ ...base, key: 'fluxo-abandono', label: 'Taxa de abandono', description: 'Percentual de abandono no fluxo escolar.', series: valueSeries(defaultSeries, 'taxa_abandono'), currentValue: resumo.taxa_abandono, mainCutLabel: 'Ensino Fundamental', explore: buildFluxoExplore(fluxo, { cutLabel: 'Ensino Fundamental', stageKey: 'fundamental', metricKey: 'taxa_abandono' }), stageFilterOptions: buildFluxoStageOptions(fluxo, { metricKey: 'taxa_abandono' }) }),
    createIndicator({ ...base, key: 'fluxo-distorcao', label: 'Distorção idade-série', description: 'Percentual de estudantes com distorção idade-série.', series: valueSeries(defaultSeries, 'taxa_distorcao'), currentValue: resumo.taxa_distorcao, mainCutLabel: 'Ensino Fundamental', explore: buildFluxoExplore(fluxo, { cutLabel: 'Ensino Fundamental', stageKey: 'fundamental', metricKey: 'taxa_distorcao', noLocation: true }), stageFilterOptions: buildFluxoStageOptions(fluxo, { metricKey: 'taxa_distorcao', noLocation: true }) }),
  ]
}

function buildAprendizagemIndicators(aprend) {
  const series = aprend.series ?? {}
  const resumo = aprend.resumo_ultimo_ano ?? {}
  const preferredIdeb = getPreferredIdeb(resumo)
  const preferredSeries = preferredIdeb?.etapa ? series.ideb?.[preferredIdeb.etapa] : []
  const base = { themeKey: 'aprendizagem', themeLabel: 'Aprendizagem', themeShortLabel: 'Aprendizagem', categories: [FILTER_KEYS.todos], isGeral: true, currentYear: preferredIdeb?.ano ?? aprend.ultimo_ano?.ideb, notices: aprend.avisos ?? [] }
  return [
    createIndicator({ ...base, key: 'apr-ideb', label: 'IDEB', description: 'Último IDEB disponível para o recorte principal.', series: valueSeries(preferredSeries, 'ideb'), currentValue: preferredIdeb?.ideb, formatType: 'value', mainCutLabel: preferredIdeb ? etapaLabel(preferredIdeb.etapa) : 'IDEB', explore: buildAprendizagemExplore(aprend, { metricKey: 'ideb', metricLabel: 'IDEB', formatLabel: formatValue }), stageFilterOptions: buildAprendizagemStageOptions(aprend, { metricKey: 'ideb', metricLabel: 'IDEB', formatLabel: formatValue }) }),
    createIndicator({ ...base, key: 'apr-saeb-lp', label: 'SAEB Língua Portuguesa', description: 'Resultado de Língua Portuguesa no SAEB.', series: valueSeries(preferredSeries, 'saeb_lp'), currentValue: latestValue(preferredSeries, 'saeb_lp'), formatType: 'value', mainCutLabel: preferredIdeb ? etapaLabel(preferredIdeb.etapa) : 'SAEB LP', explore: buildAprendizagemExplore(aprend, { metricKey: 'saeb_lp', metricLabel: 'SAEB LP', formatLabel: formatValue }), stageFilterOptions: buildAprendizagemStageOptions(aprend, { metricKey: 'saeb_lp', metricLabel: 'SAEB LP', formatLabel: formatValue }) }),
    createIndicator({ ...base, key: 'apr-saeb-mt', label: 'SAEB Matemática', description: 'Resultado de Matemática no SAEB.', series: valueSeries(preferredSeries, 'saeb_mt'), currentValue: latestValue(preferredSeries, 'saeb_mt'), formatType: 'value', mainCutLabel: preferredIdeb ? etapaLabel(preferredIdeb.etapa) : 'SAEB MT', explore: buildAprendizagemExplore(aprend, { metricKey: 'saeb_mt', metricLabel: 'SAEB Matemática', formatLabel: formatValue }), stageFilterOptions: buildAprendizagemStageOptions(aprend, { metricKey: 'saeb_mt', metricLabel: 'SAEB Matemática', formatLabel: formatValue }) }),
    createIndicator({ ...base, key: 'apr-alfabetizacao', label: 'Alfabetização', description: 'Taxa de alfabetização disponível para os anos recentes.', categories: [FILTER_KEYS.fundamental], isGeral: false, stageLabel: 'Ensino Fundamental', series: valueSeries(series.alfabetizacao, 'taxa_alfabetizacao'), currentValue: resumo.taxa_alfabetizacao, currentYear: aprend.ultimo_ano?.alfabetizacao, formatType: 'percent', mainCutLabel: 'Alfabetização', explore: buildAprendizagemExplore(aprend, { metricKey: 'taxa_alfabetizacao', metricLabel: 'Alfabetização', formatLabel: formatPercent }) }),
    createIndicator({ ...base, key: 'apr-inse', label: 'INSE', description: 'Média do indicador de nível socioeconômico.', series: valueSeries(series.inse, 'media_inse'), currentValue: resumo.media_inse, currentYear: aprend.ultimo_ano?.inse, formatType: 'value', mainCutLabel: 'Nível socioeconômico', explore: buildAprendizagemExplore(aprend, { metricKey: 'media_inse', metricLabel: 'INSE', formatLabel: formatValue }) }),
  ]
}

function buildOfertaIndicators(oferta) {
  const series = oferta.series ?? {}
  const resumo = oferta.resumo_ultimo_ano ?? {}
  const latestYear = oferta.ultimo_ano
  const explore = buildOfertaExplore(oferta)
  return [
    createIndicator({ key: 'oferta-total', label: 'Matrículas técnicas — Sinopse Estatística', description: 'Total de matrículas em cursos técnicos e profissionais segundo a Sinopse Estatística do Censo Escolar.', themeKey: 'oferta', themeLabel: 'Matrículas técnicas · Sinopse Estatística', themeShortLabel: 'Sinopse Estatística', categories: [FILTER_KEYS.profissional], stageLabel: 'Educação Profissional', series: normalizeYearSeries(series.total), currentValue: resumo.total_matriculas_tecnicas, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Matrículas técnicas · Sinopse Estatística', explore, notices: oferta.avisos ?? [] }),
  ]
}

function createIndicator(config) {
  const catalogItem = getEducationIndicatorCatalogItem(config.key)
  const displayLabel = normalizeEducationIndicatorLabel(config.label)
  const series = normalizeYearSeries(config.series)
  const categories = normalizeIndicatorCategories(config)
  const isGeral = config.isGeral ?? (categories.length === 1 && categories[0] === FILTER_KEYS.todos)
  const first = series[0] ?? null
  const latest = series.at(-1) ?? null
  const currentValue = isMissing(config.currentValue) ? latest?.valor : config.currentValue
  const currentYear = config.currentYear ?? latest?.ano ?? null
  const initialValue = first?.valor
  const initialYear = first?.ano ?? null
  const formatValueForType = getFormatter(config.formatType)
  const variation = calculateVariation(initialValue, currentValue, config.formatType)
  const status = getIndicatorStatus(currentValue, series, variation)

  return {
    ...config,
    label: displayLabel,
    id: config.id ?? config.key,
    catalogKey: catalogItem?.key ?? config.key,
    catalogType: catalogItem?.type ?? 'base',
    section: config.section ?? catalogItem?.section ?? null,
    sections: config.sections ?? catalogItem?.sections ?? [],
    groupKey: config.groupKey ?? catalogItem?.groupKey ?? null,
    renderer: config.renderer ?? catalogItem?.renderer ?? 'EducationIndicatorDetail',
    missingPolicy: config.missingPolicy ?? catalogItem?.missingPolicy ?? null,
    tema: config.tema ?? config.themeKey,
    categorias: categories,
    categories,
    recortePrincipal: config.recortePrincipal ?? config.mainCutLabel,
    isGeral,
    categoryLabel: config.categoryLabel ?? getCategoryLabel(categories),
    showPointLabels: config.showPointLabels ?? true,
    series,
    chartColor: config.chartColor ?? '#16713a',
    currentDisplay: formatValueForType(currentValue),
    currentValue,
    currentYear,
    formatValue: formatValueForType,
    initialDisplay: formatValueForType(initialValue),
    initialValue,
    initialYear,
    formatType: config.formatType ?? 'number',
    unit: config.unit ?? catalogItem?.unit ?? null,
    notices: config.notices ?? [],
    explore: filterRenderableExplore(config.explore),
    stageFilterOptions: filterStageFilterOptions(config.stageFilterOptions),
    quickReading: config.quickReading ?? buildQuickReading({ currentDisplay: formatValueForType(currentValue), currentValue, currentYear, formatType: config.formatType, initialValue, initialYear, label: displayLabel, variation }),
    scaleType: config.scaleType ?? inferScaleType(config),
    statusLabel: config.statusLabel ?? status.label,
    statusTone: config.statusTone ?? status.tone,
    variationDisplay: variation.display,
    variationRaw: variation.raw,
    variationTone: variation.tone,
  }
}

function normalizeIndicatorCategories(config) {
  const categories = config.categories ?? config.stageKeys ?? ['todos']
  const normalized = categories.filter(Boolean)
  return normalized.length ? normalized : ['todos']
}

function getCategoryLabel(categories) {
  if (!categories.length) return CATEGORY_LABELS[FILTER_KEYS.todos]
  if (categories.length === 1) return CATEGORY_LABELS[categories[0]] ?? categories[0]
  return categories.map((category) => CATEGORY_LABELS[category] ?? category).join(', ')
}

function filterRenderableExplore(explore) {
  if (!Array.isArray(explore)) return []
  return explore.filter((item) => hasExploreData(item))
}

function filterStageFilterOptions(options) {
  if (!Array.isArray(options)) return []
  return options
    .map((option) => ({
      ...option,
      explore: filterRenderableExplore(option.explore),
      series: normalizeYearSeries(option.series),
    }))
    .filter((option) => option.series.length >= 2)
}

function hasExploreData(item) {
  if (!item) return false
  if (item.type === 'stacked') {
    return Array.isArray(item.categories)
      && item.categories.length > 0
      && Array.isArray(item.data)
      && item.data.some((row) => Object.values(row.values ?? {}).some((value) => !isMissing(value)))
  }
  if (item.type === 'bar') {
    return Array.isArray(item.data) && item.data.some((row) => !isMissing(row.value))
  }
  if (item.type === 'line') {
    return Array.isArray(item.series) && item.series.length >= 2
  }
  if (item.type === 'age-range') {
    return Array.isArray(item.rows) && item.rows.some((row) => !isMissing(detailRowValue(row, 'matriculas')))
  }
  if (item.type === 'color-race') {
    return Array.isArray(item.rows) && item.rows.some((row) => !isMissing(detailRowValue(row, 'matriculas')))
  }
  if (item.type === 'modality-range') {
    return Array.isArray(item.rows) && item.rows.some((row) => !isMissing(detailRowValue(row, 'matriculas')))
  }
  if (item.type === 'stage-detail') {
    return Array.isArray(item.distributionData) && item.distributionData.some((row) => !isMissing(row.value))
  }
  if (item.type === 'stage-context') {
    return !isMissing(item.value ?? item.turmas)
  }
  if (item.type === 'table') {
    return Array.isArray(item.rows) && item.rows.length > 0
  }
  return true
}

function buildMatriculasStageOptions(mat) {
  const series = mat.series ?? {}
  const options = [
    makeStageOption({
      key: 'total',
      label: 'Total',
      mainCutLabel: 'Total do município',
      series: series.total,
      explore: buildMatriculasExplore(mat, { cutKey: 'total', cutLabel: 'Total do município' }),
    }),
    ...orderedStageKeys(series.por_etapa).map((key) => makeStageOption({
      key,
      label: etapaLabel(key),
      mainCutLabel: etapaLabel(key),
      series: series.por_etapa?.[key],
      explore: buildMatriculasExplore(mat, { cutKey: key, cutLabel: etapaLabel(key), stageKey: key }),
    })),
  ]
  return options.filter(Boolean)
}

function buildAlunosTurmaSerieOptions(alunosTurma, options) {
  const series = alunosTurma.series ?? {}
  return options
    .map((option) => {
      const serieKey = option.key
      const serieLabel = alunosTurmaSerieLabel(serieKey, option.label)
      return makeStageOption({
        key: serieKey,
        label: serieLabel,
        mainCutLabel: serieLabel,
        series: series.por_serie?.[serieKey],
        explore: buildAlunosTurmaExplore(alunosTurma, {
          stageKey: option.etapa_ensino,
          serieKey,
          serieLabel,
        }),
      })
    })
    .filter(Boolean)
}

function buildTurmasStageOptions(turmas, metric) {
  const series = turmas.series ?? {}
  const metricLabel = turmasMetricLabel(metric.metricKey)
  const options = [
    makeStageOption({
      key: 'total',
      label: 'Total',
      mainCutLabel: 'Total do município',
      series: valueSeries(series.total, metric.metricKey),
      explore: buildTurmasExplore(turmas, {
        cutLabel: 'Total do município',
        formatLabel: metric.formatLabel,
        metricKey: metric.metricKey,
      }),
    }),
    ...orderedStageKeys(series.por_etapa, metric.metricKey).map((key) => makeStageOption({
      key,
      label: etapaLabel(key),
      mainCutLabel: etapaLabel(key),
      series: valueSeries(series.por_etapa?.[key], metric.metricKey),
      explore: buildTurmasExplore(turmas, {
        cutLabel: etapaLabel(key),
        formatLabel: metric.formatLabel,
        metricKey: metric.metricKey,
        stageKey: key,
      }),
    })),
  ]
  return options
    .filter(Boolean)
    .map((option) => ({ ...option, label: option.key === 'total' ? `Total de ${metricLabel.toLowerCase()}` : option.label }))
}

function buildFluxoStageOptions(fluxo, metric) {
  const series = fluxo.series ?? {}
  return orderedStageKeys(series.por_etapa, metric.metricKey)
    .map((key) => makeStageOption({
      key,
      label: etapaLabel(key),
      mainCutLabel: etapaLabel(key),
      series: valueSeries(series.por_etapa?.[key], metric.metricKey),
      explore: buildFluxoExplore(fluxo, { ...metric, cutLabel: etapaLabel(key), stageKey: key }),
    }))
    .filter(Boolean)
}

function buildAprendizagemStageOptions(aprend, metric) {
  const stageSeries = aprendizStageSeries(aprend, metric.metricKey)
  const preferredStage = getPreferredIdeb(aprend.resumo_ultimo_ano ?? {})?.etapa
  return orderPreferredStageFirst(orderedStageKeys(stageSeries, metric.metricKey), preferredStage)
    .map((key) => makeStageOption({
      key,
      label: etapaLabel(key),
      mainCutLabel: etapaLabel(key),
      series: valueSeries(stageSeries?.[key], metric.metricKey),
      explore: buildAprendizagemExplore(aprend, { ...metric, stageKey: key, cutLabel: etapaLabel(key) }),
    }))
    .filter(Boolean)
}

function makeStageOption(option) {
  const series = normalizeYearSeries(option.series)
  if (series.length < 2) return null
  return { ...option, series }
}

function orderedStageKeys(source, valueKey = 'valor') {
  const keys = Object.keys(source ?? {}).filter((key) => hasSeriesData(source?.[key], valueKey))
  return STAGE_FILTER_ORDER.filter((key) => key !== 'total' && keys.includes(key))
}

function orderPreferredStageFirst(keys, preferredStage) {
  if (!preferredStage || !keys.includes(preferredStage)) return keys
  return [preferredStage, ...keys.filter((key) => key !== preferredStage)]
}

function aprendizStageSeries(aprend, metricKey) {
  const series = aprend.series ?? {}
  if (metricKey === 'taxa_alfabetizacao') return { fundamental: series.alfabetizacao }
  if (metricKey === 'media_inse') return series.inse_por_etapa ?? {}
  return series.ideb ?? {}
}

function buildMatriculasExplore(mat, cut = { cutKey: 'total', cutLabel: 'Total do município' }) {
  const series = mat.series ?? {}
  const resumo = mat.resumo_ultimo_ano ?? {}
  const detalhamentos = mat.detalhamentos ?? {}
  const dependencyKeys = dependencyCategoryKeys(series.por_dependencia)
  const titleSuffix = ` — ${cut.cutLabel}`
  const latestYear = mat.ultimo_ano ? ` — ${mat.ultimo_ano}` : ''

  if (cut.cutKey === 'total') {
    return [
      { key: 'mat-etapa', type: 'bar', title: `Composição por etapa${latestYear}${titleSuffix}`, color: '#16713a', data: entriesToRows(resumo.por_etapa, etapaLabel), formatLabel: formatNumber },
      { key: 'mat-dep', type: 'stacked', title: `Composição por rede${titleSuffix}`, categories: categoryDefinitions(dependencyKeys, depLabel, DEPENDENCY_COLORS), data: seriesMapToStackedRows(series.por_dependencia, dependencyKeys), formatLabel: formatNumber },
      { key: 'mat-loc', type: 'stacked', title: `Composição por localização${titleSuffix}`, categories: categoryDefinitions(['urbana', 'rural'], locLabel, LOCATION_COLORS), data: seriesMapToStackedRows(series.por_localizacao, ['urbana', 'rural']), formatLabel: formatNumber },
    ]
  }

  if (cut.stageKey) {
    const etapaItems = []
    if (cut.stageKey === 'fundamental') {
      etapaItems.push({
        key: 'mat-fundamental-subetapas',
        type: 'bar',
        title: `Composição por etapa${latestYear}${titleSuffix}`,
        color: '#16713a',
        data: entriesToRows({
          fundamental_anos_iniciais: resumo.por_etapa?.fundamental_anos_iniciais,
          fundamental_anos_finais: resumo.por_etapa?.fundamental_anos_finais,
        }, etapaLabel),
        formatLabel: formatNumber,
      })
    }

    const stageDependencyRows = detailRowsFor(detalhamentos.por_etapa_rede, { etapa_ensino: cut.stageKey })
    const stageDependencyKeys = dependencyKeysFromDetailRows(stageDependencyRows)
    const stageLocationRows = detailRowsFor(detalhamentos.por_etapa_localizacao, { etapa_ensino: cut.stageKey })
    const stageLocationKeys = detailKeys(stageLocationRows, 'localizacao', ['urbana', 'rural'])
    const faixaEtariaItem = buildMatriculasFaixaEtariaItem(detalhamentos, cut)
    const corRacaItem = buildMatriculasCorRacaItem(detalhamentos, cut)

    return [
      ...etapaItems,
      ...(faixaEtariaItem ? [faixaEtariaItem] : []),
      ...(corRacaItem ? [corRacaItem] : []),
      {
        key: `mat-${cut.stageKey}-dep`,
        type: 'stacked',
        title: `Composição por rede${titleSuffix}`,
        categories: categoryDefinitions(stageDependencyKeys, depLabel, DEPENDENCY_COLORS),
        data: detailRowsToStackedRows(stageDependencyRows, 'dependencia', stageDependencyKeys),
        formatLabel: formatNumber,
      },
      {
        key: `mat-${cut.stageKey}-loc`,
        type: 'stacked',
        title: `Composição por localização${titleSuffix}`,
        categories: categoryDefinitions(stageLocationKeys, locLabel, LOCATION_COLORS),
        data: detailRowsToStackedRows(stageLocationRows, 'localizacao', stageLocationKeys),
        formatLabel: formatNumber,
      },
    ]
  }

  if (cut.locationKey) {
    const etapaRows = detailRowsFor(detalhamentos.por_etapa_localizacao, { localizacao: cut.locationKey })
    const dependencyRows = detailRowsFor(detalhamentos.por_rede_localizacao, { localizacao: cut.locationKey })
    const locationDependencyKeys = dependencyKeysFromDetailRows(dependencyRows)
    return [
      { key: `mat-${cut.locationKey}-etapa`, type: 'bar', title: titleWithYear(`Composição por etapa${titleSuffix}`, detailRowsToLatestRows(etapaRows, 'etapa_ensino', etapaLabel)), color: '#16713a', data: detailRowsToLatestRows(etapaRows, 'etapa_ensino', etapaLabel), formatLabel: formatNumber },
      {
        key: `mat-${cut.locationKey}-dep`,
        type: 'stacked',
        title: `Composição por rede${titleSuffix}`,
        categories: categoryDefinitions(locationDependencyKeys, depLabel, DEPENDENCY_COLORS),
        data: detailRowsToStackedRows(dependencyRows, 'dependencia', locationDependencyKeys),
        formatLabel: formatNumber,
      },
    ]
  }

  if (cut.dependencyKey) {
    const etapaRows = detailRowsFor(detalhamentos.por_etapa_rede, { dependencia: cut.dependencyKey })
    const locationRows = detailRowsFor(detalhamentos.por_rede_localizacao, { dependencia: cut.dependencyKey })
    const dependencyLocationKeys = detailKeys(locationRows, 'localizacao', ['urbana', 'rural'])
    return [
      { key: `mat-${cut.dependencyKey}-etapa`, type: 'bar', title: titleWithYear(`Composição por etapa${titleSuffix}`, detailRowsToLatestRows(etapaRows, 'etapa_ensino', etapaLabel)), color: '#16713a', data: detailRowsToLatestRows(etapaRows, 'etapa_ensino', etapaLabel), formatLabel: formatNumber },
      {
        key: `mat-${cut.dependencyKey}-loc`,
        type: 'stacked',
        title: `Composição por localização${titleSuffix}`,
        categories: categoryDefinitions(dependencyLocationKeys, locLabel, LOCATION_COLORS),
        data: detailRowsToStackedRows(locationRows, 'localizacao', dependencyLocationKeys),
        formatLabel: formatNumber,
      },
    ]
  }

  return []
}

function buildMatriculasFaixaEtariaItem(detalhamentos, cut) {
  const fonte = detalhamentos.por_etapa_faixa_etaria ?? []
  const fonteSecao = detalhamentos.por_etapa_secao_faixa_etaria ?? []
  let rows = []
  let stageLabel = cut.cutLabel
  let stageOptions = []

  if (cut.stageKey === 'infantil') {
    rows = detailRowsFor(fonteSecao, { etapa_ensino: 'infantil' })
      .filter((row) => ['creche', 'pre_escola'].includes(row?.secao_sinopse))
    stageLabel = 'Creche'
    stageOptions = [
      { key: 'creche', label: 'Creche', field: 'secao_sinopse' },
      { key: 'pre_escola', label: 'Pré-escola', field: 'secao_sinopse' },
    ].filter((option) => rows.some((row) => row.secao_sinopse === option.key))
  } else if (cut.stageKey === 'fundamental') {
    rows = fonte.filter((row) => FUNDAMENTAL_FAIXA_STAGES.includes(row?.etapa_ensino))
    stageLabel = etapaLabel(FUNDAMENTAL_FAIXA_STAGES[0])
    stageOptions = FUNDAMENTAL_FAIXA_STAGES
      .filter((stageKey) => rows.some((row) => row.etapa_ensino === stageKey))
      .map((stageKey) => ({ key: stageKey, label: etapaLabel(stageKey), field: 'etapa_ensino' }))
  } else if (cut.stageKey === 'eja') {
    rows = filterEjaAgeRangeRows(detailRowsFor(fonte, { etapa_ensino: cut.stageKey }))
  } else if (cut.stageKey) {
    rows = detailRowsFor(fonte, { etapa_ensino: cut.stageKey })
  }

  if (!ageRangeLatestRows(rows).length) return null

  return {
    key: `mat-${cut.stageKey}-faixa-etaria`,
    type: 'age-range',
    title: 'Matrículas por faixa etária',
    color: '#0f766e',
    historyColor: '#2563eb',
    rows,
    stageLabel,
    stageOptions,
    formatLabel: formatNumber,
  }
}

function buildMatriculasCorRacaItem(detalhamentos, cut) {
  const fonte = detalhamentos.por_etapa_cor_raca ?? []
  const fonteSecao = detalhamentos.por_etapa_secao_cor_raca ?? []
  let rows = []
  let stageLabel = cut.cutLabel
  let stageOptions = []

  if (cut.stageKey === 'infantil') {
    rows = detailRowsFor(fonteSecao, { etapa_ensino: 'infantil' })
      .filter((row) => ['creche', 'pre_escola'].includes(row?.secao_sinopse))
    stageLabel = 'Creche'
    stageOptions = [
      { key: 'creche', label: 'Creche', field: 'secao_sinopse' },
      { key: 'pre_escola', label: 'Pré-escola', field: 'secao_sinopse' },
    ].filter((option) => rows.some((row) => row.secao_sinopse === option.key))
  } else if (cut.stageKey === 'fundamental') {
    rows = fonte.filter((row) => FUNDAMENTAL_FAIXA_STAGES.includes(row?.etapa_ensino))
    stageLabel = etapaLabel(FUNDAMENTAL_FAIXA_STAGES[0])
    stageOptions = FUNDAMENTAL_FAIXA_STAGES
      .filter((stageKey) => rows.some((row) => row.etapa_ensino === stageKey))
      .map((stageKey) => ({ key: stageKey, label: etapaLabel(stageKey), field: 'etapa_ensino' }))
  } else if (cut.stageKey) {
    rows = detailRowsFor(fonte, { etapa_ensino: cut.stageKey })
  }

  if (!corRacaOptions(rows).length) return null

  return {
    key: `mat-${cut.stageKey}-cor-raca`,
    type: 'color-race',
    title: 'Matrículas por cor/raça',
    rows,
    stageLabel,
    stageOptions,
    historyColor: '#7c3aed',
    formatLabel: formatNumber,
  }
}

function filterEjaAgeRangeRows(rows) {
  return (Array.isArray(rows) ? rows : []).filter((row) => (
    EJA_VALID_AGE_RANGES.includes(row?.faixa_etaria)
  ))
}

function buildMatriculasIntegralExplore(mat) {
  const detalhamentos = mat.detalhamentos ?? {}
  const etapaRows = detailRowsToLatestRows(detalhamentos.tempo_integral_por_etapa, 'etapa_ensino', etapaLabel, 'matriculas_integral')
  const dependencyRows = detalhamentos.tempo_integral_por_rede ?? []
  const dependencyKeys = dependencyKeysFromDetailRows(dependencyRows, 'matriculas_integral')
  const locationRows = detalhamentos.tempo_integral_por_localizacao ?? []
  const locationKeys = detailKeys(locationRows, 'localizacao', ['urbana', 'rural'], 'matriculas_integral')

  return [
    {
      key: 'mat-integral-etapa',
      type: 'bar',
      title: titleWithYear('Matrículas em tempo integral por etapa', etapaRows),
      color: '#16713a',
      data: etapaRows,
      formatLabel: formatNumber,
    },
    {
      key: 'mat-integral-rede',
      type: 'stacked',
      title: 'Matrículas em tempo integral por rede — histórico',
      categories: categoryDefinitions(dependencyKeys, depLabel, DEPENDENCY_COLORS),
      data: detailRowsToStackedRows(dependencyRows, 'dependencia', dependencyKeys, 'matriculas_integral'),
      formatLabel: formatNumber,
    },
    {
      key: 'mat-integral-localizacao',
      type: 'stacked',
      title: 'Matrículas em tempo integral por localização — histórico',
      categories: categoryDefinitions(locationKeys, locLabel, LOCATION_COLORS),
      data: detailRowsToStackedRows(locationRows, 'localizacao', locationKeys, 'matriculas_integral'),
      formatLabel: formatNumber,
    },
  ]
}

function detailRowsFor(rows, filters) {
  if (!Array.isArray(rows)) return []
  return rows.filter((row) => (
    Object.entries(filters).every(([field, value]) => row?.[field] === value)
  ))
}

function detailKeys(rows, field, preferredOrder, valueKey = 'valor') {
  const keys = new Set()
  rows.forEach((row) => {
    if (!isMissing(row?.[field]) && !isMissing(detailRowValue(row, valueKey))) keys.add(row[field])
  })
  return preferredOrder.filter((key) => keys.has(key))
}

function dependencyKeysFromDetailRows(rows, valueKey = 'valor') {
  const detailed = detailKeys(rows, 'dependencia', ['federal', 'estadual', 'municipal', 'privada'], valueKey)
  if (detailed.length) return detailed
  return detailKeys(rows, 'dependencia', ['publica', 'privada'], valueKey)
}

function detailRowsToStackedRows(rows, dimension, keys, valueKey = 'valor') {
  const years = new Set()
  rows.forEach((row) => {
    if (!isMissing(row?.ano) && keys.includes(row?.[dimension]) && !isMissing(detailRowValue(row, valueKey))) {
      years.add(Number(row.ano))
    }
  })

  return [...years].sort((a, b) => a - b).map((year) => {
    const values = {}
    keys.forEach((key) => {
      const point = rows.find((row) => Number(row.ano) === year && row[dimension] === key)
      const value = detailRowValue(point, valueKey)
      if (!isMissing(value)) values[key] = value
    })
    return { year, values }
  })
}

function detailRowsToLatestRows(rows, dimension, labelFn, valueKey = 'valor') {
  const latestByKey = new Map()
  rows.forEach((row) => {
    const key = row?.[dimension]
    const value = detailRowValue(row, valueKey)
    if (isMissing(key) || isMissing(row?.ano) || isMissing(value)) return
    const current = latestByKey.get(key)
    if (!current || Number(row.ano) > Number(current.ano)) {
      latestByKey.set(key, { ano: Number(row.ano), value })
    }
  })

  return [...latestByKey.entries()]
    .map(([key, point]) => ({ label: labelFn(key), value: point.value, year: point.ano }))
}

function ageRangeOptions(rows) {
  return [...new Set((Array.isArray(rows) ? rows : [])
    .map((row) => row?.faixa_etaria)
    .filter((faixa) => !isMissing(faixa)))]
    .sort((a, b) => faixaEtariaSortValue(a) - faixaEtariaSortValue(b))
}

function ageRangeLatestRows(rows) {
  return detailRowsToLatestRowsByLabel(
    rows,
    (row) => row.faixa_etaria,
    'matriculas',
    (row) => faixaEtariaSortValue(row.faixa_etaria),
  )
}

function comparisonYearsForRows(rows) {
  const years = [...new Set((Array.isArray(rows) ? rows : [])
    .map((row) => Number(row?.ano))
    .filter((year) => Number.isFinite(year)))]
    .sort((a, b) => a - b)
  if (years.length <= 3) return years
  const middleIndex = Math.floor((years.length - 1) / 2)
  return [...new Set([years[0], years[middleIndex], years[years.length - 1]])]
}

function comparisonYearsWithRecentTail(rows, options = {}) {
  const { minYear, maxYears = 5, recentCount = 3 } = options

  const years = [...new Set((Array.isArray(rows) ? rows : [])
    .map((row) => Number(row?.ano))
    .filter((year) => Number.isFinite(year)))]
    .sort((a, b) => a - b)

  let available = years
  if (minYear !== undefined) {
    available = years.filter((year) => year >= minYear)
  }

  if (available.length === 0) {
    available = years
  }

  if (available.length <= maxYears) return available

  const result = [available[0]]
  const tail = available.slice(-recentCount)
  const middleCandidates = available.filter((y) => y > result[0] && y < tail[0])

  if (middleCandidates.length > 0) {
    const midIndex = Math.round((middleCandidates.length - 1) / 2)
    result.push(middleCandidates[midIndex])
  }

  result.push(...tail)
  return result
}

function ageRangeComparisonRows(rows, years, faixas) {
  return years.map((year) => {
    const values = {}
    faixas.forEach((faixa) => {
      const row = rows.find((item) => item?.faixa_etaria === faixa && Number(item?.ano) === year)
      const value = row ? detailRowValue(row, 'matriculas') : null
      if (!isMissing(value)) values[faixa] = value
    })
    return { year, values }
  }).filter((row) => Object.values(row.values).some((value) => !isMissing(value)))
}

function ageRangeCategoryDefinitions(faixas) {
  return faixas.map((faixa, index) => ({
    key: faixa,
    label: faixa,
    color: CATEGORY_COMPARISON_COLORS[index % CATEGORY_COMPARISON_COLORS.length],
  }))
}

function modalityOptions(rows) {
  return [...new Set((Array.isArray(rows) ? rows : [])
    .map((row) => row?.modalidade)
    .filter((modalidade) => !isMissing(modalidade)))]
    .sort((a, b) => modLabel(a).localeCompare(modLabel(b), 'pt-BR'))
    .map((key) => ({ key, label: modLabel(key) }))
}

function corRacaLabel(key) {
  return key ?? EM
}

function corRacaOptions(rows) {
  return [...new Set((Array.isArray(rows) ? rows : [])
    .map((row) => row?.cor_raca)
    .filter((corRaca) => !isMissing(corRaca)))]
    .sort((a, b) => {
      const ai = COR_RACA_ORDER.indexOf(a)
      const bi = COR_RACA_ORDER.indexOf(b)
      if (ai >= 0 && bi >= 0) return ai - bi
      if (ai >= 0) return -1
      if (bi >= 0) return 1
      return String(a).localeCompare(String(b), 'pt-BR')
    })
    .map((key) => ({ key, label: corRacaLabel(key) }))
}

function categoryComparisonRows(rows, years, options, field) {
  return years.map((year) => {
    const values = {}
    options.forEach((option) => {
      const row = rows.find((item) => item?.[field] === option.key && Number(item?.ano) === year)
      const value = row ? detailRowValue(row, 'matriculas') : null
      if (!isMissing(value)) values[option.key] = value
    })
    return { year, values }
  }).filter((row) => Object.values(row.values).some((value) => !isMissing(value)))
}

function categoryHistorySeries(rows, key, field) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.[field] === key)
    .map((row) => ({
      ano: Number(row.ano),
      valor: detailRowValue(row, 'matriculas'),
    }))
    .filter((row) => Number.isFinite(row.ano) && !isMissing(row.valor))
    .sort((a, b) => a.ano - b.ano)
}

function buildAgeRangeComparisonChart(data, categories, years, formatLabel) {
  if (!Array.isArray(data) || !data.length || !Array.isArray(categories) || !categories.length || !Array.isArray(years) || !years.length) return null

  const width = 960
  const height = 430
  const padding = { top: 44, right: 36, bottom: 58, left: 78 }
  const visibleCategories = categories
    .filter((category) => data.some((row) => !isMissing(row.values?.[category.key])))
    .map((category, index) => ({ ...category, color: chartSeriesColor(index) }))
  if (!visibleCategories.length) return null

  const values = data.flatMap((row) => visibleCategories.map((category) => row.values?.[category.key]))
    .filter((value) => !isMissing(value))
    .map((value) => Number(value))
  const maxVal = Math.max(...values, 1)
  const domainMax = niceChartMax(maxVal)
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom
  const slotWidth = plotW / years.length
  const groupWidth = Math.min(slotWidth * 0.88, 240)
  const gap = visibleCategories.length > 4 ? 4 : 7
  const barWidth = Math.max(8, Math.min(30, (groupWidth - gap * (visibleCategories.length - 1)) / visibleCategories.length))
  const yScale = (value) => padding.top + ((domainMax - value) / domainMax) * plotH

  const rows = data.map((row, rowIndex) => {
    const xBase = padding.left + rowIndex * slotWidth + (slotWidth - groupWidth) / 2
    return {
      year: row.year,
      x: xBase,
      width: groupWidth,
      bars: visibleCategories.map((category, categoryIndex) => {
        const value = row.values?.[category.key]
        const numeric = Number(value)
        const y = !isMissing(value) ? yScale(numeric) : yScale(0)
        const height = !isMissing(value) ? Math.max(1, yScale(0) - y) : 0
        return {
          key: category.key,
          category: category.label,
          color: category.color,
          year: row.year,
          value,
          x: xBase + categoryIndex * (barWidth + gap),
          y,
          width: barWidth,
          height,
          label: isMissing(value) ? EM : formatLabel(value),
          labelX: xBase + categoryIndex * (barWidth + gap) + barWidth / 2,
          labelY: Math.max(padding.top + 12, y - 7),
        }
      }),
    }
  })

  const yTicksRaw = [0, domainMax * 0.2, domainMax * 0.4, domainMax * 0.6, domainMax * 0.8, domainMax]
  const yTicks = yTicksRaw.map((value) => ({
    label: Math.round(value).toLocaleString('pt-BR'),
    y: yScale(value),
  }))

  return { categories: visibleCategories, height, padding, rows, width, yTicks }
}

function niceChartMax(value) {
  if (!Number.isFinite(value) || value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const scaled = value / power
  if (scaled <= 1) return power
  if (scaled <= 2) return 2 * power
  if (scaled <= 5) return 5 * power
  return 10 * power
}

function ageRangeHistorySeries(rows, faixaEtaria) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.faixa_etaria === faixaEtaria)
    .map((row) => ({
      ano: Number(row.ano),
      valor: detailRowValue(row, 'matriculas'),
    }))
    .filter((row) => Number.isFinite(row.ano) && !isMissing(row.valor))
    .sort((a, b) => a.ano - b.ano)
}

function formatYearList(years) {
  if (!years.length) return ''
  if (years.length === 1) return String(years[0])
  if (years.length === 2) return `${years[0]} e ${years[1]}`
  return `${years.slice(0, -1).join(', ')} e ${years.at(-1)}`
}

function detailRowsToLatestRowsByLabel(rows, labelFn, valueKey = 'valor', sortFn = null) {
  const latestByLabel = new Map()
  rows.forEach((row) => {
    const label = labelFn(row)
    const value = detailRowValue(row, valueKey)
    if (isMissing(label) || isMissing(row?.ano) || isMissing(value)) return
    const current = latestByLabel.get(label)
    if (!current || Number(row.ano) > Number(current.ano)) {
      latestByLabel.set(label, {
        ano: Number(row.ano),
        sortKey: typeof sortFn === 'function' ? sortFn(row) : null,
        value,
      })
    }
  })

  return [...latestByLabel.entries()]
    .map(([label, point]) => ({ label, value: point.value, year: point.ano, sortKey: point.sortKey }))
    .sort((a, b) => {
      if (Number.isFinite(a.sortKey) && Number.isFinite(b.sortKey)) return a.sortKey - b.sortKey
      return String(a.label).localeCompare(String(b.label), 'pt-BR')
    })
}

function faixaEtariaSortValue(label) {
  const text = String(label ?? '').toLocaleLowerCase('pt-BR')
  if (text.includes('menos')) return -1
  const match = text.match(/\d+/)
  const base = match ? Number(match[0]) : 999
  return text.includes('mais') ? base + 0.5 : base
}

function latestYearFromRows(rows) {
  const years = (Array.isArray(rows) ? rows : [])
    .map((row) => Number(row?.year ?? row?.ano))
    .filter((year) => Number.isFinite(year))
  return years.length ? Math.max(...years) : null
}

function titleWithYear(title, rows) {
  const year = latestYearFromRows(rows)
  return year ? `${title} — ${year}` : title
}

function detailRowValue(row, valueKey = 'valor') {
  return detailMetricValue(row, valueKey)
}

function detailMetricValue(row, valueKey = 'valor') {
  if (!row) return null
  return isMissing(row[valueKey]) ? row.valor : row[valueKey]
}

function buildRedeExplore(rede, cut = { cutKey: 'total', cutLabel: 'Total do município' }) {
  const series = rede.series ?? {}
  const resumo = rede.resumo_ultimo_ano ?? {}
  const detalhamentos = rede.detalhamentos ?? {}
  const dependencyKeys = dependencyCategoryKeys(series.por_dependencia)
  const titleSuffix = ` — ${cut.cutLabel}`

  if (cut.stageKey) {
    const dependencyRows = detailRowsFor(detalhamentos.por_etapa_rede, { etapa_ensino: cut.stageKey })
    const locationRows = detailRowsFor(detalhamentos.por_etapa_localizacao, { etapa_ensino: cut.stageKey })
    const dependencyKeys = dependencyKeysFromDetailRows(dependencyRows, 'escolas')
    const locationKeys = detailKeys(locationRows, 'localizacao', ['urbana', 'rural'], 'escolas')
    return [
      {
        key: `rede-${cut.stageKey}-dep`,
        type: 'stacked',
        title: `Escolas por rede${titleSuffix}`,
        categories: categoryDefinitions(dependencyKeys, depLabel, DEPENDENCY_COLORS),
        data: detailRowsToStackedRows(dependencyRows, 'dependencia', dependencyKeys, 'escolas'),
        formatLabel: formatNumber,
      },
      {
        key: `rede-${cut.stageKey}-loc`,
        type: 'stacked',
        title: `Escolas por localização${titleSuffix}`,
        categories: categoryDefinitions(locationKeys, locLabel, LOCATION_COLORS),
        data: detailRowsToStackedRows(locationRows, 'localizacao', locationKeys, 'escolas'),
        formatLabel: formatNumber,
      },
    ]
  }

  if (cut.metricKey) {
    const depRows = detailRowsToLatestRows(detalhamentos.infraestrutura_por_rede, 'dependencia', depLabel, cut.metricKey)
    const locRows = detailRowsToLatestRows(detalhamentos.infraestrutura_por_localizacao, 'localizacao', locLabel, cut.metricKey)
    return [
      { key: 'rede-infra-dep', type: 'bar', title: titleWithYear(`Infraestrutura por rede${titleSuffix}`, depRows), color: '#16713a', formatLabel: cut.metricFormat, data: depRows },
      { key: 'rede-infra-loc', type: 'bar', title: titleWithYear(`Infraestrutura por localização${titleSuffix}`, locRows), color: '#2563eb', formatLabel: cut.metricFormat, data: locRows },
    ]
  }

  if (cut.locationKey) {
    const rows = detailRowsFor(detalhamentos.por_rede_localizacao, { localizacao: cut.locationKey })
    const keys = dependencyKeysFromDetailRows(rows, 'escolas')
    return [
      { key: `rede-${cut.locationKey}-dep`, type: 'stacked', title: `Composição por rede${titleSuffix}`, categories: categoryDefinitions(keys, depLabel, DEPENDENCY_COLORS), data: detailRowsToStackedRows(rows, 'dependencia', keys, 'escolas'), formatLabel: formatNumber },
    ]
  }

  if (cut.dependencyKey) {
    const rows = detailRowsFor(detalhamentos.por_rede_localizacao, { dependencia: cut.dependencyKey })
    const keys = detailKeys(rows, 'localizacao', ['urbana', 'rural'], 'escolas')
    return [
      { key: `rede-${cut.dependencyKey}-loc`, type: 'stacked', title: `Composição por localização${titleSuffix}`, categories: categoryDefinitions(keys, locLabel, LOCATION_COLORS), data: detailRowsToStackedRows(rows, 'localizacao', keys, 'escolas'), formatLabel: formatNumber },
    ]
  }

  const etapaRows = detailRowsToLatestRows(detalhamentos.por_etapa, 'etapa_ensino', etapaLabel, 'escolas')
  const etapaFallback = !etapaRows.length && resumo.por_etapa ? entriesToRows(resumo.por_etapa, etapaLabel) : []
  const etapaData = etapaRows.length ? etapaRows : etapaFallback
  const etapaItem = etapaData.length ? {
    key: 'rede-etapa',
    type: 'bar',
    title: titleWithYear(`Escolas por etapa de ensino${titleSuffix}`, etapaRows),
    color: '#16713a',
    formatLabel: formatNumber,
    data: etapaData,
    note: 'Uma mesma escola pode ofertar mais de uma etapa; por isso, a soma por etapa pode ser maior que o total de escolas.',
  } : null

  return [
    ...(etapaItem ? [etapaItem] : []),
    { key: 'rede-dep', type: 'stacked', title: `Composição por rede${titleSuffix}`, categories: categoryDefinitions(dependencyKeys, depLabel, DEPENDENCY_COLORS), data: seriesMapToStackedRows(series.por_dependencia, dependencyKeys), formatLabel: formatNumber },
    { key: 'rede-loc', type: 'stacked', title: `Composição por localização${titleSuffix}`, categories: categoryDefinitions(['urbana', 'rural'], locLabel, LOCATION_COLORS), data: seriesMapToStackedRows(series.por_localizacao, ['urbana', 'rural']), formatLabel: formatNumber },
  ]
}

const INFRA_METRIC_LABELS = {
  internet: 'Escolas com internet',
  internet_alunos: 'Internet disponível para alunos',
  internet_aprendizagem: 'Internet usada na aprendizagem',
  internet_comunidade: 'Internet aberta à comunidade',
  banda_larga: 'Internet banda larga',
  acesso_internet_computador: 'Acesso à internet por computador',
  acesso_internet_disp_pessoais: 'Acesso à internet por dispositivos pessoais',
  rede_local: 'Rede local de computadores',
  rede_wireless: 'Rede local sem fio',
  desktop_aluno: 'Computadores de mesa para alunos',
  comp_portatil_aluno: 'Computadores portáteis para alunos',
  tablet_aluno: 'Tablets para alunos',
  salas_climatizadas: 'Salas de aula climatizadas',
  salas_acessiveis: 'Salas de aula com acessibilidade',
}

function buildRedeInfraExplore(rede) {
  const infra = rede.infraestrutura ?? {}
  const detalhamentos = rede.detalhamentos ?? {}

  const infraPorRede = infra.por_rede ?? detalhamentos.infraestrutura_por_rede ?? []
  const redeTab = buildInfraDimensionTab(
    infraPorRede, 'dependencia', depLabel,
    'rede-infra-por-rede', 'Indicadores de infraestrutura por dependência administrativa',
    'Por rede', 0,
  )

  const infraPorLoc = infra.por_localizacao ?? detalhamentos.infraestrutura_por_localizacao ?? []
  const locTab = buildInfraDimensionTab(
    infraPorLoc, 'localizacao', locLabel,
    'rede-infra-por-localizacao', 'Indicadores de infraestrutura por localização',
    'Por localização', 1,
  )

  return [redeTab, locTab].filter(Boolean)
}

function buildInfraDimensionTab(rawRows, dimKey, dimLabelFn, itemKey, title, tabLabel, tabPriority) {
  if (!Array.isArray(rawRows) || !rawRows.length) return null

  const dims = [...new Set(rawRows.map((r) => r[dimKey]).filter(Boolean))]
  if (!dims.length) return null

  // Metricas disponiveis: tentar as mais comuns primeiro
  const metricCandidates = ['perc_internet', 'perc_banda_larga', 'perc_rede_local',
    'perc_rede_wireless', 'perc_desktop_aluno', 'perc_comp_portatil_aluno',
    'perc_tablet_aluno', 'perc_internet_alunos', 'perc_internet_aprendizagem',
    'perc_internet_comunidade', 'perc_acesso_internet_computador',
    'perc_acesso_internet_disp_pessoais', 'perc_salas_climatizadas', 'perc_salas_acessiveis']
  const availableMetrics = metricCandidates.filter((mk) =>
    rawRows.some((r) => !isMissing(r[mk]))
  )
  if (!availableMetrics.length) return null

  const metricLabels = {
    perc_internet: 'Internet', perc_banda_larga: 'Banda larga',
    perc_rede_local: 'Rede local', perc_rede_wireless: 'Rede sem fio',
    perc_desktop_aluno: 'Desktop', perc_comp_portatil_aluno: 'Portátil',
    perc_tablet_aluno: 'Tablet', perc_internet_alunos: 'Internet (alunos)',
    perc_internet_aprendizagem: 'Internet (aprendizagem)',
    perc_internet_comunidade: 'Internet (comunidade)',
    perc_acesso_internet_computador: 'Acesso por computador',
    perc_acesso_internet_disp_pessoais: 'Acesso por disp. pessoais',
    perc_salas_climatizadas: 'Salas climatizadas',
    perc_salas_acessiveis: 'Salas acessíveis',
  }

  const columns = [
    { key: 'dimensao', label: dimKey === 'dependencia' ? 'Rede' : 'Localização' },
    ...availableMetrics.map((mk) => ({ key: mk, label: metricLabels[mk] ?? mk, format: formatPercent })),
  ]

  const rows = dims.map((dim) => {
    const dimRows = rawRows.filter((r) => r[dimKey] === dim)
    const latest = dimRows.reduce((a, b) => Number(a.ano) > Number(b.ano) ? a : b, dimRows[0])
    const row = { dimensao: dimLabelFn(dim) }
    for (const mk of availableMetrics) {
      row[mk] = !isMissing(latest[mk]) ? latest[mk] : null
    }
    return row
  })

  return {
    key: itemKey,
    type: 'table',
    title,
    tabLabel,
    tabPriority,
    columns,
    rows,
  }
}

function alunosTurmaSerieLabel(key, fallback) {
  return ALUNOS_TURMA_SERIE_LABELS[key] ?? fallback ?? key
}

function alunosTurmaLatestSerieRows(rows) {
  const latestBySerie = new Map()
  rows.forEach((row) => {
    const key = row?.serie
    const value = detailRowValue(row, 'alunos_por_turma')
    if (isMissing(key) || isMissing(row?.ano) || isMissing(value)) return
    const current = latestBySerie.get(key)
    if (!current || Number(row.ano) > Number(current.ano)) {
      latestBySerie.set(key, {
        ano: Number(row.ano),
        label: alunosTurmaSerieLabel(key, row.serie_label),
        order: Number(row.serie_ordem ?? 999),
        value,
      })
    }
  })

  return [...latestBySerie.values()]
    .sort((a, b) => a.order - b.order)
    .map((row) => ({ label: row.label, value: row.value, year: row.ano }))
}

function buildAlunosTurmaExplore(alunosTurma, cut = { stageKey: 'fundamental', serieKey: 'fundamental_total', serieLabel: 'Total - Ensino Fundamental' }) {
  const detalhamentos = alunosTurma.detalhamentos ?? {}
  const titleSuffix = ` — ${cut.serieLabel}`
  const serieRows = alunosTurmaLatestSerieRows(
    detailRowsFor(detalhamentos.por_serie, { etapa_ensino: cut.stageKey }),
  )
  const dependencyRows = detailRowsFor(detalhamentos.por_serie_rede, { serie: cut.serieKey })
    .filter((row) => row.dependencia !== 'total')
  const locationRows = detailRowsFor(detalhamentos.por_serie_localizacao, { serie: cut.serieKey })
    .filter((row) => row.localizacao !== 'total')
  const dependencyLatest = detailRowsToLatestRows(dependencyRows, 'dependencia', depLabel, 'alunos_por_turma')
  const locationLatest = detailRowsToLatestRows(locationRows, 'localizacao', locLabel, 'alunos_por_turma')

  return [
    serieRows.length ? {
      key: 'alunos-turma-series',
      type: 'bar',
      title: titleWithYear(`Média de alunos por turma por série — ${etapaLabel(cut.stageKey)}`, serieRows),
      color: '#16713a',
      formatLabel: formatRatio,
      orientation: 'vertical',
      preserveOrder: true,
      data: serieRows,
      tabLabel: 'Por série',
      tabPriority: 1,
    } : null,
    dependencyLatest.length ? {
      key: 'alunos-turma-rede',
      type: 'bar',
      title: titleWithYear(`Média de alunos por turma por rede${titleSuffix}`, dependencyLatest),
      color: '#2563eb',
      formatLabel: formatRatio,
      data: dependencyLatest,
      tabLabel: 'Por rede',
      tabPriority: 2,
    } : null,
    locationLatest.length ? {
      key: 'alunos-turma-localizacao',
      type: 'bar',
      title: titleWithYear(`Média de alunos por turma por localização${titleSuffix}`, locationLatest),
      color: '#7c3aed',
      formatLabel: formatRatio,
      data: locationLatest,
      tabLabel: 'Por localização',
      tabPriority: 3,
    } : null,
  ].filter(Boolean)
}

function buildTurmasExplore(turmas, cut = { cutLabel: 'Total do município', metricKey: 'turmas', formatLabel: formatNumber }) {
  const detalhamentos = turmas.detalhamentos ?? {}
  const series = turmas.series ?? {}
  const isCountMetric = ['turmas', 'docentes', 'matriculas'].includes(cut.metricKey)
  const titleBase = turmasMetricLabel(cut.metricKey)
  const titleSuffix = ` — ${cut.cutLabel}`

  if (cut.stageKey) {
    const dependencyRows = detailRowsFor(detalhamentos.por_etapa_rede, { etapa_ensino: cut.stageKey })
    const locationRows = detailRowsFor(detalhamentos.por_etapa_localizacao, { etapa_ensino: cut.stageKey })
    const dependencyKeys = dependencyKeysFromDetailRows(dependencyRows, cut.metricKey)
    const locationKeys = detailKeys(locationRows, 'localizacao', ['urbana', 'rural'], cut.metricKey)

    const stageLast = normalizeYearSeries(series.por_etapa?.[cut.stageKey]).at(-1)
    const contextItem = cut.metricKey === 'turmas' && stageLast ? {
      key: `turmas-${cut.stageKey}-context`,
      type: 'stage-context',
      tabLabel: 'Resumo',
      tabPriority: 0,
      value: stageLast[cut.metricKey],
      valueLabel: titleBase,
      alunosPorTurma: stageLast.alunos_por_turma,
      docentes: stageLast.docentes,
      ano: stageLast.ano,
      formatLabel: cut.formatLabel,
    } : null

    if (isCountMetric) {
      return [
        ...(contextItem ? [contextItem] : []),
        ...(dependencyKeys.length ? [{ key: `turmas-${cut.stageKey}-rede`, type: 'stacked', title: `${titleBase} por rede${titleSuffix}`, categories: categoryDefinitions(dependencyKeys, depLabel, DEPENDENCY_COLORS), data: detailRowsToStackedRows(dependencyRows, 'dependencia', dependencyKeys, cut.metricKey), formatLabel: cut.formatLabel }] : []),
        ...(locationKeys.length ? [{ key: `turmas-${cut.stageKey}-localizacao`, type: 'stacked', title: `${titleBase} por localização${titleSuffix}`, categories: categoryDefinitions(locationKeys, locLabel, LOCATION_COLORS), data: detailRowsToStackedRows(locationRows, 'localizacao', locationKeys, cut.metricKey), formatLabel: cut.formatLabel }] : []),
      ]
    }
    const dependencyLatest = detailRowsToLatestRows(dependencyRows, 'dependencia', depLabel, cut.metricKey)
    const locationLatest = detailRowsToLatestRows(locationRows, 'localizacao', locLabel, cut.metricKey)
    return [
      ...(contextItem ? [contextItem] : []),
      ...(dependencyLatest.length ? [{ key: `turmas-${cut.stageKey}-rede`, type: 'bar', title: titleWithYear(`${titleBase} por rede${titleSuffix}`, dependencyLatest), color: '#2563eb', formatLabel: cut.formatLabel, data: dependencyLatest }] : []),
      ...(locationLatest.length ? [{ key: `turmas-${cut.stageKey}-localizacao`, type: 'bar', title: titleWithYear(`${titleBase} por localização${titleSuffix}`, locationLatest), color: '#7c3aed', formatLabel: cut.formatLabel, data: locationLatest }] : []),
    ]
  }

  const etapaFromDetalhamento = detailRowsToLatestRows(detalhamentos.por_etapa, 'etapa_ensino', etapaLabel, cut.metricKey)
  const etapaFromSeries = seriesPorEtapaToLatestRows(series.por_etapa, cut.metricKey)
  const etapaBarData = etapaFromDetalhamento.length ? etapaFromDetalhamento : etapaFromSeries

  const panorama = isCountMetric ? buildEtapaPanorama(series.por_etapa, cut.metricKey, turmas.ultimo_ano) : null

  const etapaStacked = seriesPorEtapaToStackedRows(series.por_etapa, cut.metricKey)
  const hasEtapaHistory = !!etapaStacked && etapaStacked.data.length >= 2

  const etapaItem = etapaBarData.length ? {
    key: 'turmas-etapa',
    type: isCountMetric ? 'stage-detail' : 'bar',
    title: titleWithYear(`${titleBase} por etapa de ensino${titleSuffix}`, etapaBarData),
    ...(isCountMetric ? {
      distributionData: etapaBarData,
      distributionColor: '#16713a',
      formatLabel: cut.formatLabel,
      ...(hasEtapaHistory ? {
        historyCategories: etapaStacked.categories,
        historyData: etapaStacked.data,
        historyTitle: `Histórico do indicador — ${titleBase} por etapa${titleSuffix}`,
      } : {}),
      panoramaColumns: panorama?.columns,
      panoramaRows: panorama?.rows,
      panoramaTitle: panorama?.title,
    } : {
      color: '#16713a',
      formatLabel: cut.formatLabel,
      data: etapaBarData,
    }),
  } : null

  const dependencyKeys = dependencyKeysFromDetailRows(detalhamentos.por_rede, cut.metricKey)
  const locationKeys = detailKeys(detalhamentos.por_localizacao, 'localizacao', ['urbana', 'rural'], cut.metricKey)

  if (isCountMetric) {
    return [
      ...(etapaItem ? [etapaItem] : []),
      ...(dependencyKeys.length ? [{ key: 'turmas-rede', type: 'stacked', title: `${titleBase} por rede${titleSuffix}`, categories: categoryDefinitions(dependencyKeys, depLabel, DEPENDENCY_COLORS), data: detailRowsToStackedRows(detalhamentos.por_rede, 'dependencia', dependencyKeys, cut.metricKey), formatLabel: cut.formatLabel }] : []),
      ...(locationKeys.length ? [{ key: 'turmas-localizacao', type: 'stacked', title: `${titleBase} por localização${titleSuffix}`, categories: categoryDefinitions(locationKeys, locLabel, LOCATION_COLORS), data: detailRowsToStackedRows(detalhamentos.por_localizacao, 'localizacao', locationKeys, cut.metricKey), formatLabel: cut.formatLabel }] : []),
    ]
  }

  const dependencyLatest = detailRowsToLatestRows(detalhamentos.por_rede, 'dependencia', depLabel, cut.metricKey)
  const locationLatest = detailRowsToLatestRows(detalhamentos.por_localizacao, 'localizacao', locLabel, cut.metricKey)
  return [
    ...(etapaItem ? [etapaItem] : []),
    ...(dependencyLatest.length ? [{ key: 'turmas-rede', type: 'bar', title: titleWithYear(`${titleBase} por rede${titleSuffix}`, dependencyLatest), color: '#2563eb', formatLabel: cut.formatLabel, data: dependencyLatest }] : []),
    ...(locationLatest.length ? [{ key: 'turmas-localizacao', type: 'bar', title: titleWithYear(`${titleBase} por localização${titleSuffix}`, locationLatest), color: '#7c3aed', formatLabel: cut.formatLabel, data: locationLatest }] : []),
  ]
}

function turmasMetricLabel(metricKey) {
  if (metricKey === 'docentes') return 'Docentes'
  if (metricKey === 'alunos_por_turma') return 'Média de alunos por turma'
  if (metricKey === 'alunos_por_docente') return 'Alunos por docente'
  return 'Turmas'
}

function buildFluxoExplore(fluxo, cut = { cutLabel: 'Ensino Fundamental', stageKey: 'fundamental', metricKey: 'taxa_aprovacao' }) {
  const detalhamentos = fluxo.detalhamentos ?? {}
  const stageRows = detailRowsFor(detalhamentos.por_etapa_rede, { etapa_ensino: cut.stageKey })
  const locationRows = detailRowsFor(detalhamentos.por_etapa_localizacao, { etapa_ensino: cut.stageKey })
  const locKeys = detailKeys(locationRows, 'localizacao', ['urbana', 'rural'], cut.metricKey)
  const titleSuffix = ` — ${cut.cutLabel}`
  const dependencyLatest = detailRowsToLatestRows(stageRows, 'dependencia', depLabel, cut.metricKey)
  const etapaLatest = detailRowsToLatestRows(detalhamentos.por_etapa, 'etapa_ensino', etapaLabel, cut.metricKey)
  const items = [
    { key: 'fluxo-dep', type: 'bar', title: titleWithYear(`Taxa por rede${titleSuffix}`, dependencyLatest), color: '#2563eb', formatLabel: formatPercent, data: dependencyLatest },
  ]
  if (!cut.noLocation) {
    const locationLatest = detailRowsToLatestRows(locationRows.filter((row) => locKeys.includes(row.localizacao)), 'localizacao', locLabel, cut.metricKey)
    items.push({ key: 'fluxo-loc', type: 'bar', title: titleWithYear(`Taxa por localização${titleSuffix}`, locationLatest), color: '#7c3aed', formatLabel: formatPercent, data: locationLatest })
  }
  if (etapaLatest.length) {
    items.push({ key: 'fluxo-etapa', type: 'bar', title: titleWithYear(`Taxa por etapa`, etapaLatest), color: '#16713a', formatLabel: formatPercent, data: etapaLatest })
  }
  return [
    ...items,
  ]
}

function buildAprendizagemExplore(aprend, metric) {
  const detalhamentos = aprend.detalhamentos ?? {}
  if (metric.stageKey) {
    const dependencyRows = detailRowsFor(detalhamentos.por_etapa_rede, { etapa_ensino: metric.stageKey })
    const dependencyLatest = detailRowsToLatestRows(dependencyRows, 'dependencia', depLabel, metric.metricKey)
    return [
      { key: `apr-${metric.metricKey}-${metric.stageKey}-rede`, type: 'bar', title: titleWithYear(`${metric.metricLabel} por rede — ${metric.cutLabel}`, dependencyLatest), data: dependencyLatest, color: '#2563eb', formatLabel: metric.formatLabel },
    ]
  }
  const etapaRows = detailRowsToLatestRows(detalhamentos.por_etapa, 'etapa_ensino', etapaLabel, metric.metricKey)
  const redeRows = detailRowsToLatestRows(detalhamentos.por_rede, 'dependencia', depLabel, metric.metricKey)
  return [
    { key: `apr-${metric.metricKey}-etapa`, type: 'bar', title: titleWithYear(`${metric.metricLabel} por etapa`, etapaRows), data: etapaRows, color: '#16713a', formatLabel: metric.formatLabel },
    { key: `apr-${metric.metricKey}-rede`, type: 'bar', title: titleWithYear(`${metric.metricLabel} por rede`, redeRows), data: redeRows, color: '#2563eb', formatLabel: metric.formatLabel },
  ]
}

function buildOfertaExplore(oferta) {
  const detalhamentos = oferta.detalhamentos ?? {}
  const redeRows = detalhamentos.por_rede ?? []
  const redeKeys = dependencyKeysFromDetailRows(redeRows, 'matriculas')
  const modalidadeRows = detalhamentos.por_modalidade ?? []
  const faixaRows = detalhamentos.por_faixa_etaria ?? []
  const redeTitle = redeKeys.length === 1 && redeKeys[0] === 'publica'
    ? 'Matrículas técnicas por rede — histórico (recorte disponível: Pública)'
    : 'Matrículas técnicas por rede — histórico'
  return [
    redeKeys.length ? {
      key: 'oferta-rede',
      type: 'stacked',
      title: redeTitle,
      categories: categoryDefinitions(redeKeys, depLabel, DEPENDENCY_COLORS),
      data: detailRowsToStackedRows(redeRows, 'dependencia', redeKeys, 'matriculas'),
      formatLabel: formatNumber,
      tabPriority: 1,
    } : null,
    {
      key: 'oferta-mod',
      type: 'modality-range',
      title: 'Matrículas por modalidade',
      rows: modalidadeRows,
      historyColor: '#7c3aed',
      formatLabel: formatNumber,
      tabPriority: 2,
    },
    {
      key: 'oferta-faixa',
      type: 'age-range',
      title: 'Matrículas técnicas por faixa etária',
      rows: faixaRows,
      stageLabel: 'Educação técnica/profissional',
      historyStageLabel: 'Educação técnica/profissional',
      comparisonTitlePrefix: 'Matrículas técnicas por faixa etária',
      historyColor: '#2563eb',
      formatLabel: formatNumber,
      tabPriority: 3,
    },
  ].filter(Boolean)
}

function valueSeries(series, key) {
  return normalizeYearSeries(Array.isArray(series) ? series.map((point) => ({ ano: point.ano, valor: point[key] })) : [])
}

function safeValueSeries(raw, metricKey) {
  if (!Array.isArray(raw)) return []
  if (metricKey === 'alunos_por_docente') {
    const points = raw.map((point) => {
      if (!isMissing(point.alunos_por_docente)) {
        return { ano: point.ano, valor: point.alunos_por_docente }
      }
      const turmas = point.turmas
      const alunosPorTurma = point.alunos_por_turma
      const docentes = point.docentes
      if (!isMissing(turmas) && !isMissing(alunosPorTurma) && !isMissing(docentes) && Number(docentes) > 0) {
        return { ano: point.ano, valor: (Number(turmas) * Number(alunosPorTurma)) / Number(docentes) }
      }
      return null
    }).filter(Boolean)
    return normalizeYearSeries(points)
  }
  return valueSeries(raw, metricKey)
}

function latestValue(series, key) {
  return valueSeries(series, key).at(-1)?.valor ?? null
}

function entriesToRows(source, labelFn) {
  return Object.entries(source ?? {}).map(([key, value]) => ({ label: labelFn(key), value })).filter((row) => !isMissing(row.value))
}

function dependencyCategoryKeys(source) {
  const detailedKeys = ['federal', 'estadual', 'municipal', 'privada']
    .filter((key) => hasSeriesData(source?.[key]))
  if (detailedKeys.length) return detailedKeys
  return ['publica', 'privada'].filter((key) => hasSeriesData(source?.[key]))
}

function hasSeriesData(series, valueKey = 'valor') {
  return normalizeYearSeries(series, valueKey).some((point) => !isMissing(point[valueKey]))
}

function categoryDefinitions(keys, labelFn, colors) {
  return keys.map((key) => ({ key, label: labelFn(key), color: colors[key] ?? '#16713a' }))
}

function seriesMapToStackedRows(source, keys, valueKey = 'valor') {
  const years = new Set()
  keys.forEach((key) => {
    normalizeYearSeries(source?.[key]).forEach((point) => {
      if (!isMissing(point[valueKey]) && point.ano) years.add(Number(point.ano))
    })
  })
  return [...years].sort((a, b) => a - b).map((year) => {
    const values = {}
    keys.forEach((key) => {
      const point = normalizeYearSeries(source?.[key]).find((item) => Number(item.ano) === year)
      if (point && !isMissing(point[valueKey])) values[key] = point[valueKey]
    })
    return { year, values }
  })
}

function seriesPorEtapaToLatestRows(source, metricKey) {
  const keys = Object.keys(source ?? {})
  return keys
    .map((key) => {
      const s = normalizeYearSeries(source[key], metricKey)
      const last = s.at(-1)
      if (!last || isMissing(last[metricKey])) return null
      return { label: etapaLabel(key), value: last[metricKey], year: last.ano }
    })
    .filter(Boolean)
}

function seriesPorEtapaToStackedRows(source, metricKey) {
  const keys = orderedStageKeys(source, metricKey)
  if (!keys.length) return null
  return {
    categories: categoryDefinitions(keys, etapaLabel, CATEGORY_COMPARISON_COLORS),
    data: seriesMapToStackedRows(source, keys, metricKey),
  }
}

function buildEtapaPanorama(porEtapa, metricKey, ultimoAno) {
  const stages = orderedStageKeys(porEtapa, metricKey)
  if (!stages.length) return null
  const metricLabel = turmasMetricLabel(metricKey)

  const rows = stages.map((key) => {
    const s = normalizeYearSeries(porEtapa[key])
    const last = s.at(-1)
    if (!last || isMissing(last[metricKey])) return null
    const first = s[0]
    const currentTurmas = last[metricKey]
    let variacao = EM
    if (first && !isMissing(first[metricKey]) && Number(first[metricKey]) !== 0) {
      const diff = Number(currentTurmas) - Number(first[metricKey])
      const pct = (diff / Math.abs(Number(first[metricKey]))) * 100
      variacao = `${pct >= 0 ? '+' : ''}${formatPercent(pct)}`
    }
    return {
      etapa: etapaLabel(key),
      valor: formatNumber(currentTurmas),
      alunos_por_turma: !isMissing(last.alunos_por_turma) ? formatRatio(last.alunos_por_turma) : EM,
      variacao,
    }
  }).filter(Boolean)

  if (!rows.length) return null

  return {
    columns: [
      { key: 'etapa', label: 'Etapa' },
      { key: 'valor', label: metricLabel },
      { key: 'alunos_por_turma', label: 'Média de alunos por turma' },
      { key: 'variacao', label: 'Variação' },
    ],
    rows,
    title: `Panorama por etapa de ensino${ultimoAno ? ` — ${ultimoAno}` : ''}`,
  }
}

function inferScaleType(config) {
  if (config.scaleType) return config.scaleType
  if (config.formatType === 'percent') return 'percent'
  if (config.key?.includes('ideb')) return 'ideb'
  if (config.key?.includes('saeb')) return 'saeb'
  if (config.key?.includes('inse')) return 'inse'
  if (config.formatType === 'ratio' || config.formatType === 'value') return 'dynamic'
  return 'count'
}

function getFormatter(formatType) {
  if (formatType === 'percent') return formatPercent
  if (formatType === 'ratio') return formatRatio
  if (formatType === 'value') return formatValue
  return formatNumber
}

function calculateVariation(initialValue, currentValue, formatType) {
  if (isMissing(initialValue) || isMissing(currentValue)) return { display: EM, tone: 'muted', raw: null }
  const diff = Number(currentValue) - Number(initialValue)
  if (formatType === 'percent') return { display: `${diff > 0 ? '+' : ''}${formatValue(diff)} p.p.`, tone: diff > 0 ? 'success' : diff < 0 ? 'warning' : 'muted', raw: diff }
  if (Number(initialValue) === 0) return { display: diff === 0 ? '0' : `${diff > 0 ? '+' : ''}${getFormatter(formatType)(diff)}`, tone: diff > 0 ? 'success' : diff < 0 ? 'warning' : 'muted', raw: diff }
  const percent = (diff / Math.abs(Number(initialValue))) * 100
  return { display: `${percent > 0 ? '+' : ''}${formatPercent(percent)}`, tone: diff > 0 ? 'success' : diff < 0 ? 'warning' : 'muted', raw: percent }
}

function getIndicatorStatus(currentValue, series, variation) {
  if (isMissing(currentValue)) return { label: 'Sem dados', tone: 'muted' }
  if (series.length < 2 || variation?.raw === null) return { label: 'Com dados', tone: 'info' }
  if (variation.raw > 0) return { label: 'Alta', tone: 'success' }
  if (variation.raw < 0) return { label: 'Queda', tone: 'warning' }
  return { label: 'Estável', tone: 'muted' }
}

function buildQuickReading({ currentDisplay, currentValue, currentYear, formatType, initialValue, initialYear, label, variation }) {
  if (isMissing(currentValue)) return `Não há dado recente disponível para ${label.toLocaleLowerCase('pt-BR')}.`
  if (isMissing(initialValue) || !initialYear || !currentYear || variation.raw === null) return 'Não há série histórica suficiente para exibir o histórico do indicador.'
  const movement = variation.raw > 0 ? 'aumento' : variation.raw < 0 ? 'redução' : 'estabilidade'
  const variationText = formatType === 'percent' ? variation.display : variation.display.replace('+', '')
  return `Em ${currentYear}, o município registra ${currentDisplay}. Em relação a ${initialYear}, houve ${movement} de ${variationText}.`
}

function getPreferredIdeb(resumo) {
  return Object.entries(resumo)
    .filter(([key, value]) => key.startsWith('ideb_') && !isMissing(value))
    .map(([key, ideb]) => {
      const etapa = key.replace('ideb_', '')
      return { etapa, ideb, ano: resumo[`ano_ideb_${etapa}`], saeb_lp: resumo[`saeb_lp_${etapa}`], saeb_mt: resumo[`saeb_mt_${etapa}`] }
    })
    .sort((a, b) => Number(b.ano ?? 0) - Number(a.ano ?? 0))[0] ?? null
}
