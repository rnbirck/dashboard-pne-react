import { useEffect, useMemo, useRef, useState } from 'react'
import { CategoryTabs } from '../components/CategoryTabs'
import { DataSourceNote } from '../components/DataSourceNote'
import { IndicatorDetail } from '../components/IndicatorDetail'
import { MetaCard } from '../components/MetaCard'
import { PNE_2026_INDICATOR_GOAL_REFS } from '../data/pne2026IndicatorGoalRefs'
import { PNE_2014_INDICATOR_GOAL_REFS } from '../data/pne2014IndicatorGoalRefs'
import { buildThematicGroups } from '../data/thematicGroups'
import { normalizePopulationPercentResults } from '../utils/indicatorValues'

const CYCLE_SOURCE_NOTE = 'INEP, Censo Escolar, SAEB, IBGE e bases oficiais consolidadas no painel.'

export function CyclePage({ cycle, indicadores, municipioData, selectedMunicipio, title }) {
  const categories = useMemo(
    () => enrichGoalRefs(indicadores?.cycles?.[cycle]?.categories ?? [], cycle),
    [indicadores, cycle],
  )
  const thematicGroups = useMemo(
    () => buildThematicGroups(categories),
    [categories],
  )
  const [selectedGroupKey, setSelectedGroupKey] = useState('')
  const [selectedBasicEducationFilterKey, setSelectedBasicEducationFilterKey] = useState('todos')
  const [selectedIndicatorKey, setSelectedIndicatorKey] = useState('')
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const detailViewRef = useRef(null)
  const gridScrollYRef = useRef(0)
  const shouldScrollToDetailTopRef = useRef(false)

  const selectedGroup = useMemo(() => {
    if (!thematicGroups.length) return null
    return (
      thematicGroups.find((group) => group.key === selectedGroupKey) ??
      thematicGroups[0]
    )
  }, [thematicGroups, selectedGroupKey])

  const selectedBasicEducationFilter = useMemo(() => {
    const filters = selectedGroup?.filters ?? []
    if (!filters.length) return null
    return (
      filters.find((filter) => filter.key === selectedBasicEducationFilterKey) ??
      filters[0]
    )
  }, [selectedGroup, selectedBasicEducationFilterKey])
  const visibleGroupItems = useMemo(
    () => selectedBasicEducationFilter?.items ?? selectedGroup?.items ?? [],
    [selectedBasicEducationFilter, selectedGroup],
  )
  const municipioResults = municipioData?.[cycle]?.indicadores ?? null
  const allCycleItems = useMemo(
    () => categories.flatMap((category) => category.items ?? []),
    [categories],
  )
  const normalizedMunicipioResults = useMemo(
    () => normalizePopulationPercentResults(municipioResults, allCycleItems),
    [municipioResults, allCycleItems],
  )
  const filteredGroupItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR')
    if (!query) return visibleGroupItems
    return visibleGroupItems.filter((item) => item.label.toLocaleLowerCase('pt-BR').includes(query))
  }, [visibleGroupItems, searchQuery])
  const activeIndicatorKey = useMemo(
    () => filteredGroupItems.some((item) => item.key === selectedIndicatorKey)
      ? selectedIndicatorKey
      : '',
    [filteredGroupItems, selectedIndicatorKey],
  )
  const activeItem = useMemo(
    () => filteredGroupItems.find((item) => item.key === activeIndicatorKey) ?? null,
    [activeIndicatorKey, filteredGroupItems],
  )
  const activeResult = activeItem ? normalizedMunicipioResults?.[activeItem.key] : null
  const activeIndex = activeItem
    ? filteredGroupItems.findIndex((item) => item.key === activeItem.key)
    : -1
  const previousItem = activeIndex > 0 ? filteredGroupItems[activeIndex - 1] : null
  const nextItem = activeIndex >= 0 && activeIndex < filteredGroupItems.length - 1
    ? filteredGroupItems[activeIndex + 1]
    : null
  const cycleManagementStats = useMemo(
    () => buildCycleManagementStats(categories, normalizedMunicipioResults),
    [categories, normalizedMunicipioResults],
  )
  const isShowingDetail = Boolean(isDetailOpen && activeItem)

  useEffect(() => {
    if (!isShowingDetail || !shouldScrollToDetailTopRef.current) return

    shouldScrollToDetailTopRef.current = false
    window.requestAnimationFrame(() => {
      detailViewRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
    })
  }, [activeItem?.key, isShowingDetail])

  function handleGroupSelect(groupKey) {
    setSelectedGroupKey(groupKey)
    setSelectedBasicEducationFilterKey('todos')
    setSelectedIndicatorKey('')
    setIsDetailOpen(false)
    setSearchQuery('')
  }

  function handleBasicEducationFilterSelect(filterKey) {
    setSelectedBasicEducationFilterKey(filterKey)
    setSelectedIndicatorKey('')
    setIsDetailOpen(false)
    setSearchQuery('')
  }

  function handleCardSelect(itemKey) {
    gridScrollYRef.current = window.scrollY
    shouldScrollToDetailTopRef.current = true
    setSelectedIndicatorKey(itemKey)
    setIsDetailOpen(true)
  }

  function handleBackToGrid() {
    setIsDetailOpen(false)
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: gridScrollYRef.current, behavior: 'auto' })
    })
  }

  function handleAdjacentMeta(itemKey) {
    shouldScrollToDetailTopRef.current = true
    setSelectedIndicatorKey(itemKey)
    setIsDetailOpen(true)
  }

  return (
    <div className="page-stack cycle-page">
      <section className="page-card cycle-hero">
        <div>
          <span className="eyebrow">Ciclo de monitoramento</span>
          <h1>{title}</h1>
          <p>
            Município em foco:{' '}
            <strong style={{ color: 'var(--text-strong)' }}>{selectedMunicipio}</strong>
          </p>
        </div>
        <div className="cycle-hero-meta-group">
          <ManagementMetricCard
            detail="denominador para atingidas e atenção"
            label="Indicadores com meta"
            tone="info"
            value={cycleManagementStats.monitorableTotal}
          />
          <ManagementMetricCard
            detail={cycleManagementStats.monitorableTotal
              ? `${cycleManagementStats.achievedPercent}% dentro dos indicadores com meta`
              : 'sem indicadores com meta'}
            label="Metas atingidas"
            tone="success"
            value={cycleManagementStats.monitorableTotal
              ? cycleManagementStats.achieved
              : '-'}
          />
          <ManagementMetricCard
            detail={cycleManagementStats.monitorableTotal
              ? `${cycleManagementStats.attentionPercent}% dentro dos indicadores com meta`
              : 'sem indicadores com meta'}
            label="Exigem atenção"
            tone="attention"
            value={cycleManagementStats.monitorableTotal
              ? cycleManagementStats.attention
              : '-'}
          />
          <ManagementMetricCard
            detail="fora do denominador dos indicadores com meta"
            label="Indicadores sem meta"
            tone="neutral"
            value={cycleManagementStats.noComparison}
          />
        </div>
      </section>

      <section className="cycle-workspace cycle-card-workspace">
        {isShowingDetail ? (
          <div className="cycle-detail-view" ref={detailViewRef}>
            <div className="cycle-detail-nav">
              <button className="cycle-back-button" type="button" onClick={handleBackToGrid}>
                &larr; Voltar para metas
              </button>
              <div className="cycle-detail-nav__sequence" aria-label="Navegar entre metas filtradas">
                <button
                  className="cycle-step-button"
                  type="button"
                  onClick={() => previousItem && handleAdjacentMeta(previousItem.key)}
                  disabled={!previousItem}
                >
                  <span>&lsaquo;</span>
                  Meta anterior
                </button>
                <span className="cycle-detail-nav__position">
                  {activeIndex + 1} de {filteredGroupItems.length}
                </span>
                <button
                  className="cycle-step-button"
                  type="button"
                  onClick={() => nextItem && handleAdjacentMeta(nextItem.key)}
                  disabled={!nextItem}
                >
                  Próxima meta
                  <span>&rsaquo;</span>
                </button>
              </div>
            </div>
            <IndicatorDetail
              cycle={cycle}
              item={activeItem}
              municipioData={municipioData}
              result={activeResult}
            />
            <div className="cycle-detail-nav cycle-detail-nav--bottom">
              <button className="cycle-back-button" type="button" onClick={handleBackToGrid}>
                &larr; Voltar para metas
              </button>
              <div className="cycle-detail-nav__sequence" aria-label="Navegar entre metas filtradas">
                <button
                  className="cycle-step-button"
                  type="button"
                  onClick={() => previousItem && handleAdjacentMeta(previousItem.key)}
                  disabled={!previousItem}
                >
                  <span>&lsaquo;</span>
                  Meta anterior
                </button>
                <span className="cycle-detail-nav__position">
                  {activeIndex + 1} de {filteredGroupItems.length}
                </span>
                <button
                  className="cycle-step-button"
                  type="button"
                  onClick={() => nextItem && handleAdjacentMeta(nextItem.key)}
                  disabled={!nextItem}
                >
                  Pr&oacute;xima meta
                  <span>&rsaquo;</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="cycle-filter-panel">
              <div className="cycle-filter-panel__heading">
                <div>
                  <span className="eyebrow">Temas das metas</span>
                  <h2>{selectedGroup?.label ?? 'Metas do ciclo'}</h2>
                </div>
                <label className="cycle-search">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="m16 16 4 4" />
                  </svg>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Buscar meta..."
                    aria-label="Buscar meta"
                  />
                </label>
              </div>

              <CategoryTabs
                categories={thematicGroups}
                selectedCategory={selectedGroup?.key}
                onSelectCategory={handleGroupSelect}
                ariaLabel="Temas"
              />

              {selectedGroup?.filters?.length ? (
                <div className="basic-education-filter-wrap">
                  <div className="basic-education-filter-wrap__header">
                    <span>Etapa</span>
                  </div>
                  <BasicEducationFilter
                    filters={selectedGroup.filters}
                    selectedFilter={selectedBasicEducationFilter?.key}
                    onSelectFilter={handleBasicEducationFilterSelect}
                  />
                </div>
              ) : null}
            </div>

            <div className="meta-grid-header">
              <span>{filteredGroupItems.length} metas/indicadores</span>
              <p>{selectedMunicipio} · {title}</p>
            </div>

            {filteredGroupItems.length === 0 ? (
              <div className="meta-grid-empty">
                <p>Nenhum indicador disponível para este município neste tema.</p>
              </div>
            ) : (
              <div className="meta-card-grid">
                {filteredGroupItems.map((item) => (
                  <MetaCard
                    cycle={cycle}
                    isSelected={item.key === selectedIndicatorKey}
                    item={item}
                    key={item.key}
                    onSelect={() => handleCardSelect(item.key)}
                    result={normalizedMunicipioResults?.[item.key]}
                    stageLabel={
                      selectedGroup?.key === 'educacao_basica'
                        ? getStageTagLabel(item.key, selectedGroup.filters)
                        : null
                    }
                  />
                ))}
              </div>
            )}

            <DataSourceNote className="cycle-source-line" source={CYCLE_SOURCE_NOTE} />
          </>
        )}
      </section>
    </div>
  )
}

function enrichGoalRefs(categories, cycle) {
  const refMap = cycle === 'pne_2026_2036'
    ? PNE_2026_INDICATOR_GOAL_REFS
    : cycle === 'pne_2014_2024'
      ? PNE_2014_INDICATOR_GOAL_REFS
      : null

  if (!refMap) return categories

  return categories.map((category) => ({
    ...category,
    items: (category.items ?? []).map((item) => ({
      ...item,
      ...(refMap[item.key]
        ? { metaRef: refMap[item.key] }
        : {}),
    })),
  }))
}

function ManagementMetricCard({ detail, label, tone, value }) {
  return (
    <div className={`cycle-hero-meta cycle-hero-meta--${tone}`}>
      <small>{label}</small>
      <span>{value}</span>
      <em>{detail}</em>
    </div>
  )
}

function BasicEducationFilter({ filters, selectedFilter, onSelectFilter }) {
  return (
    <div className="basic-education-filter" role="tablist" aria-label="Etapas da Educação Básica">
      {filters.map((filter) => (
        <button
          className={
            filter.key === selectedFilter
              ? 'basic-education-filter__chip is-active'
              : 'basic-education-filter__chip'
          }
          key={filter.key}
          type="button"
          onClick={() => onSelectFilter(filter.key)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

function getStageTagLabel(itemKey, stageFilters = []) {
  const stages = stageFilters
    .filter((filter) => filter.key !== 'todos' && filterIncludesItem(filter, itemKey))
    .map((filter) => filter.key)

  if (!stages.length) return null
  if (stages.length >= 3) return 'Todas as etapas'

  if (stages.length === 1) {
    return STAGE_LABELS[stages[0]] ?? null
  }

  return stages
    .map((stageKey) => STAGE_COMPACT_LABELS[stageKey])
    .filter(Boolean)
    .join(' + ')
}

function filterIncludesItem(filter, itemKey) {
  return (
    filter.indicatorKeys?.includes(itemKey) ||
    filter.items?.some((item) => item.key === itemKey)
  )
}

const STAGE_LABELS = {
  educacao_infantil: 'Educação Infantil',
  ensino_fundamental: 'Ensino Fundamental',
  ensino_medio: 'Ensino Médio',
}

const STAGE_COMPACT_LABELS = {
  educacao_infantil: 'Infantil',
  ensino_fundamental: 'Fundamental',
  ensino_medio: 'Médio',
}

function buildCycleManagementStats(categories, municipioResults) {
  const stats = {
    achieved: 0,
    achievedPercent: 0,
    attention: 0,
    monitorableTotal: 0,
    noComparison: 0,
  }

  const allCycleItems = categories.flatMap((category) => category.items ?? [])

  allCycleItems.forEach((item) => {
    const result = municipioResults?.[item.key]
    const statusText = String(result?.display?.status ?? '').toLocaleLowerCase('pt-BR')
    const isNoComparison =
      !result ||
      result.available === false ||
      statusText.includes('visualiza') ||
      statusText.includes('indispon') ||
      statusText.includes('sem dados') ||
      statusText.includes('sem variação') ||
      statusText.includes('sem variacao')

    if (isNoComparison) {
      stats.noComparison += 1
      return
    }

    stats.monitorableTotal += 1
    if (result.atingida === true) {
      stats.achieved += 1
    } else {
      stats.attention += 1
    }
  })

  stats.achievedPercent = stats.monitorableTotal
    ? Math.round((stats.achieved / stats.monitorableTotal) * 100)
    : 0

  stats.attentionPercent = stats.monitorableTotal
    ? Math.round((stats.attention / stats.monitorableTotal) * 100)
    : 0

  return stats
}
