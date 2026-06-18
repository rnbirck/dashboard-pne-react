import { useMemo, useRef, useState } from 'react'
import { CategoryTabs } from '../components/CategoryTabs'
import { IndicatorDetail, isAvailableIndicator, isComparableIndicator } from '../components/IndicatorDetail'
import { IndicatorList } from '../components/IndicatorList'
import { RankingBlock } from '../components/RankingBlock'
import { buildThematicGroups } from '../data/thematicGroups'
import { isAccumulativeExpansionIndicator, resolveIndicatorUnit } from '../utils/format'
import { normalizePopulationPercentResults } from '../utils/indicatorValues'

export function CyclePage({ cycle, indicadores, municipioData, selectedMunicipio, title }) {
  const categories = useMemo(
    () => indicadores?.cycles?.[cycle]?.categories ?? [],
    [indicadores, cycle],
  )
  const thematicGroups = useMemo(
    () => buildThematicGroups(categories),
    [categories],
  )
  const [selectedGroupKey, setSelectedGroupKey] = useState('')
  const [selectedBasicEducationFilterKey, setSelectedBasicEducationFilterKey] = useState('todos')
  const [selectedIndicatorKey, setSelectedIndicatorKey] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const detailPanelRef = useRef(null)

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
  const municipioRankings = municipioData?.[cycle]?.rankings ?? null
  const availableGroupItems = useMemo(
    () => visibleGroupItems.filter((item) => isAvailableIndicator(normalizedMunicipioResults?.[item.key])),
    [visibleGroupItems, normalizedMunicipioResults],
  )
  const filteredGroupItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR')
    if (!query) return availableGroupItems
    return availableGroupItems.filter((item) => item.label.toLocaleLowerCase('pt-BR').includes(query))
  }, [availableGroupItems, searchQuery])
  const activeIndicatorKey = useMemo(() => {
    if (!availableGroupItems.length) return ''
    if (availableGroupItems.some((item) => item.key === selectedIndicatorKey)) {
      return selectedIndicatorKey
    }
    return availableGroupItems[0].key
  }, [availableGroupItems, selectedIndicatorKey])
  const activeItem = useMemo(
    () => availableGroupItems.find((item) => item.key === activeIndicatorKey) ?? availableGroupItems[0],
    [activeIndicatorKey, availableGroupItems],
  )
  const activeResult = activeItem ? normalizedMunicipioResults?.[activeItem.key] : null
  const normalizedRanking = useMemo(
    () => normalizeRankings(municipioRankings, visibleGroupItems, normalizedMunicipioResults),
    [municipioRankings, visibleGroupItems, normalizedMunicipioResults],
  )
  const cycleManagementStats = useMemo(
    () => buildCycleManagementStats(categories, normalizedMunicipioResults),
    [categories, normalizedMunicipioResults],
  )

  function handleGroupSelect(groupKey) {
    setSelectedGroupKey(groupKey)
    setSelectedBasicEducationFilterKey('todos')
    setSelectedIndicatorKey('')
    setSearchQuery('')
  }

  function handleBasicEducationFilterSelect(filterKey) {
    setSelectedBasicEducationFilterKey(filterKey)
    setSelectedIndicatorKey('')
    setSearchQuery('')
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
            detail={cycleManagementStats.monitorableTotal
              ? `${cycleManagementStats.achievedPercent}% dos indicadores com meta`
              : 'sem indicadores comparáveis'}
            label="Metas atingidas"
            tone="success"
            value={cycleManagementStats.monitorableTotal
              ? `${cycleManagementStats.achieved}/${cycleManagementStats.monitorableTotal}`
              : '-'}
          />
          <ManagementMetricCard
            detail="abaixo da referência"
            label="Exigem atenção"
            tone="attention"
            value={cycleManagementStats.attention}
          />
          <ManagementMetricCard
            detail="informativos ou sem dado"
            label="Sem comparação"
            tone="neutral"
            value={cycleManagementStats.noComparison}
          />
        </div>
      </section>

      <section className="cycle-workspace">
        <div className="cycle-category-bar">
          <span className="eyebrow">Temas de análise</span>
          <div className="cycle-category-bar__controls">
            <CategoryTabs
              categories={thematicGroups}
              selectedCategory={selectedGroup?.key}
              onSelectCategory={handleGroupSelect}
              ariaLabel="Temas"
            />
            {selectedGroup?.filters?.length ? (
              <div className="basic-education-filter-wrap">
                <div className="basic-education-filter-wrap__header">
                  <span>Etapa da Educação Básica</span>
                  <small>Selecione quais indicadores deseja visualizar</small>
                </div>
                <BasicEducationFilter
                  filters={selectedGroup.filters}
                  selectedFilter={selectedBasicEducationFilter?.key}
                  onSelectFilter={handleBasicEducationFilterSelect}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="cycle-layout">
          <aside className="indicator-sidebar">
            <div className="indicator-sidebar__heading">
              <h3>Indicadores</h3>
              <span>{availableGroupItems.length}</span>
            </div>
            {availableGroupItems.length === 0 ? (
              <div className="indicator-sidebar__empty" style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: '1.4' }}>
                <p>Nenhum indicador disponível para este município neste tema.</p>
              </div>
            ) : (
              <>
                <label className="indicator-search">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="m16 16 4 4" />
                  </svg>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Buscar indicador..."
                    aria-label="Buscar indicador"
                  />
                </label>
                <IndicatorList
                  items={filteredGroupItems}
                  results={normalizedMunicipioResults}
                  selectedIndicator={activeItem?.key}
                  onSelectIndicator={setSelectedIndicatorKey}
                />
              </>
            )}
          </aside>

          <IndicatorDetail cycle={cycle} item={activeItem} municipioData={municipioData} ref={detailPanelRef} result={activeResult} />
        </div>
      </section>

      <section className="ranking-grid">
        <RankingBlock
          title="Avanços no período"
          items={normalizedRanking.topAvancos}
          emptyMessage="Nenhum avanço relevante neste tema."
          unit={normalizedRanking.topAvancos?.[0]?.unit}
          tone="success"
        />
        <RankingBlock
          title="Pontos de atenção"
          items={normalizedRanking.topAtencao}
          emptyMessage="Nenhum indicador crítico neste tema."
          valueMode="distance"
          unit={normalizedRanking.topAtencao?.[0]?.unit}
          tone="warning"
        />
      </section>
    </div>
  )
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

  return stats
}

function normalizeRankings(rankingsByCategory, categoryItems, municipioResults) {
  const itemByKey = new Map(categoryItems.map((item) => [item.key, item]))
  const activeRanking = mergeRankingsByIndicator(rankingsByCategory, itemByKey)
  const seenAdvanceKeys = new Set()
  const topAvancos = buildTopAvancos(activeRanking, categoryItems, itemByKey, municipioResults, seenAdvanceKeys)

  const advanceKeys = new Set(topAvancos.map((item) => item.indicator_key))
  const explicitAttention = (activeRanking?.top_atencao ?? [])
    .map((item) => normalizeRankingItem(item, itemByKey, municipioResults))
    .filter((item) => item && itemByKey.has(item.indicator_key))
  const categoryAttention = categoryItems.map((item) => normalizeRankingItem({
    indicator_key: item.key,
    label: item.label,
    sub: item.sub,
  }, itemByKey, municipioResults))

  const seenAttentionKeys = new Set()
  const topAtencao = [...explicitAttention, ...categoryAttention]
    .filter((item) => {
      if (!item?.indicator_key || seenAttentionKeys.has(item.indicator_key)) return false
      seenAttentionKeys.add(item.indicator_key)
      return !advanceKeys.has(item.indicator_key) && isCriticalRankingItem(item, municipioResults?.[item.indicator_key])
    })
    .sort(compareCriticalRankingItems)
    .slice(0, 3)

  return { topAvancos, topAtencao }
}

function buildTopAvancos(activeRanking, categoryItems, itemByKey, municipioResults, seenAdvanceKeys) {
  const fromJson = (activeRanking?.top_avancos ?? [])
    .map((item) => normalizeRankingItem(item, itemByKey, municipioResults))
    .filter((item) => item && itemByKey.has(item.indicator_key))

  const result = []
  const allAdvanceCandidates = [
    ...fromJson,
    ...categoryItems.map((item) =>
      normalizeRankingItem({ indicator_key: item.key, label: item.label, sub: item.sub }, itemByKey, municipioResults)
    ),
  ]
  const seen = new Set()
  for (const item of allAdvanceCandidates) {
    if (!item?.indicator_key || seen.has(item.indicator_key)) continue
    seen.add(item.indicator_key)
    const variation = parsePpValue(item.display?.variation ?? item.display?.distance)
    if (!Number.isFinite(variation) || variation <= 0) continue
    result.push(item)
  }
  result.sort((a, b) => (
    parsePpValue(b.display?.variation ?? b.display?.distance) -
    parsePpValue(a.display?.variation ?? a.display?.distance)
  ))
  const top3 = result.slice(0, 3)
  top3.forEach((item) => seenAdvanceKeys.add(item.indicator_key))
  return top3
}

function resolveRankingLabel(item, categoryItem, key) {
  const rawLabel = String(item?.label ?? '').trim()
  const looksLikeSlug = /^[a-z0-9_]+$/i.test(rawLabel)

  if (!rawLabel || rawLabel === key || rawLabel === item?.indicator_key || rawLabel === item?.key || looksLikeSlug) {
    return categoryItem.label
  }

  return rawLabel
}

function normalizeRankingItem(item, itemByKey, municipioResults) {
  if (!item) return null
  const key = item.indicator_key ?? item.key
  const categoryItem = itemByKey.get(key)
  if (!categoryItem) return null
  const result = municipioResults?.[key]
  const unit = resolveIndicatorUnit(categoryItem, result)
  return {
    ...item,
    indicator_key: key,
    label: resolveRankingLabel(item, categoryItem, key),
    sub: item.sub ?? categoryItem.sub,
    unit,
    display: {
      ...item.display,
      ...result?.display,
    },
  }
}

function mergeRankingsByIndicator(rankingsByCategory, itemByKey) {
  const merged = {
    top_avancos: [],
    top_atencao: [],
  }

  Object.values(rankingsByCategory ?? {}).forEach((categoryRanking) => {
    ;(categoryRanking?.top_avancos ?? []).forEach((item) => {
      const key = item?.indicator_key ?? item?.key
      if (itemByKey.has(key)) merged.top_avancos.push(item)
    })
    ;(categoryRanking?.top_atencao ?? []).forEach((item) => {
      const key = item?.indicator_key ?? item?.key
      if (itemByKey.has(key)) merged.top_atencao.push(item)
    })
  })

  return merged
}

function isCriticalRankingItem(item, result) {
  if (!result || !isComparableIndicator(result) || result.atingida === true) return false

  if (isAccumulativeExpansionIndicator({ label: item.label }, result)) return false

  const status = String(result.display?.status ?? item.display?.status ?? '').toLocaleLowerCase('pt-BR')
  if (status.includes('meta atingida')) return false

  const distance = parsePpValue(result.display?.distance ?? item.display?.distance)
  if (Number.isFinite(distance)) return distance < 0

  if (status.includes('não atingida') || status.includes('nao atingida')) return true

  const variation = parsePpValue(result.display?.variation ?? item.display?.variation)
  return Number.isFinite(variation) && variation < 0
}

function compareCriticalRankingItems(a, b) {
  const aDistance = parsePpValue(a.display?.distance)
  const bDistance = parsePpValue(b.display?.distance)
  if (Number.isFinite(aDistance) && Number.isFinite(bDistance)) return aDistance - bDistance
  if (Number.isFinite(aDistance)) return -1
  if (Number.isFinite(bDistance)) return 1
  return parsePpValue(a.display?.variation) - parsePpValue(b.display?.variation)
}

function parsePpValue(value) {
  const text = String(value ?? '').toLocaleLowerCase('pt-BR')
  const match = text.match(/[-+]?\d+(?:[,.]\d+)?/)
  if (!match) return Number.NaN
  const parsed = Number(match[0].replace(',', '.'))
  if (!Number.isFinite(parsed)) return Number.NaN
  if (text.includes('queda')) return -Math.abs(parsed)
  if (text.includes('alta')) return Math.abs(parsed)
  return parsed
}
