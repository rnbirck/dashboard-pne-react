import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CategoryTabs } from '../components/CategoryTabs'
import { IndicatorDetail, isAvailableIndicator, isComparableIndicator } from '../components/IndicatorDetail'
import { IndicatorList } from '../components/IndicatorList'
import { RankingBlock } from '../components/RankingBlock'
import { resolveIndicatorUnit } from '../utils/format'

export function CyclePage({ cycle, indicadores, municipioData, selectedMunicipio, title }) {
  const categories = useMemo(
    () => indicadores?.cycles?.[cycle]?.categories ?? [],
    [indicadores, cycle],
  )
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('')
  const [selectedIndicatorKey, setSelectedIndicatorKey] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const cycleLayoutRef = useRef(null)
  const detailPanelRef = useRef(null)

  const selectedCategory = useMemo(() => {
    if (!categories.length) return null
    return (
      categories.find((category) => category.key === selectedCategoryKey) ??
      categories[0]
    )
  }, [categories, selectedCategoryKey])

  const allCategoryItems = useMemo(
    () => selectedCategory?.items ?? [],
    [selectedCategory],
  )
  const municipioResults = municipioData?.[cycle]?.indicadores ?? null
  const municipioRankings = municipioData?.[cycle]?.rankings ?? null
  const availableCategoryItems = useMemo(
    () => allCategoryItems.filter((item) => isAvailableIndicator(municipioResults?.[item.key])),
    [allCategoryItems, municipioResults],
  )
  const filteredCategoryItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR')
    if (!query) return availableCategoryItems
    return availableCategoryItems.filter((item) => item.label.toLocaleLowerCase('pt-BR').includes(query))
  }, [availableCategoryItems, searchQuery])
  const activeIndicatorKey = useMemo(() => {
    if (!availableCategoryItems.length) return ''
    if (availableCategoryItems.some((item) => item.key === selectedIndicatorKey)) {
      return selectedIndicatorKey
    }
    return availableCategoryItems[0].key
  }, [availableCategoryItems, selectedIndicatorKey])
  const activeItem = useMemo(
    () => availableCategoryItems.find((item) => item.key === activeIndicatorKey) ?? availableCategoryItems[0],
    [activeIndicatorKey, availableCategoryItems],
  )
  const activeResult = activeItem ? municipioResults?.[activeItem.key] : null
  const activeRanking = municipioRankings?.[selectedCategory?.key]
  const normalizedRanking = useMemo(
    () => normalizeRankings(activeRanking, allCategoryItems, municipioResults),
    [activeRanking, allCategoryItems, municipioResults],
  )
  const cycleManagementStats = useMemo(
    () => buildCycleManagementStats(categories, municipioResults),
    [categories, municipioResults],
  )

  useLayoutEffect(() => {
    const layout = cycleLayoutRef.current
    const detailPanel = detailPanelRef.current
    if (!layout || !detailPanel) return undefined

    let rafId = 0
    const updatePanelHeight = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const height = Math.ceil(detailPanel.getBoundingClientRect().height)
        if (height >= 480) {
          layout.style.setProperty('--cycle-detail-height', `${height}px`)
        } else {
          layout.style.removeProperty('--cycle-detail-height')
        }
      })
    }

    updatePanelHeight()

    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updatePanelHeight)
      : null

    observer?.observe(detailPanel)
    window.addEventListener('resize', updatePanelHeight)

    return () => {
      cancelAnimationFrame(rafId)
      observer?.disconnect()
      window.removeEventListener('resize', updatePanelHeight)
      layout.style.removeProperty('--cycle-detail-height')
    }
  }, [activeItem?.key, activeResult, selectedCategory?.key])

  function handleCategorySelect(categoryKey) {
    setSelectedCategoryKey(categoryKey)
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
          <span className="eyebrow">Categorias</span>
          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory?.key}
            onSelectCategory={handleCategorySelect}
          />
        </div>

        <div className="cycle-layout" ref={cycleLayoutRef}>
          <aside className="indicator-sidebar">
            <div className="indicator-sidebar__heading">
              <h3>Indicadores</h3>
              <span>{availableCategoryItems.length}</span>
            </div>
            {availableCategoryItems.length === 0 ? (
              <div className="indicator-sidebar__empty" style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: '1.4' }}>
                <p>Nenhum indicador disponível para este município nesta categoria.</p>
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
                  items={filteredCategoryItems}
                  results={municipioResults}
                  selectedIndicator={activeItem?.key}
                  onSelectIndicator={setSelectedIndicatorKey}
                />
              </>
            )}
          </aside>

          <IndicatorDetail item={activeItem} ref={detailPanelRef} result={activeResult} />
        </div>
      </section>

      <section className="ranking-grid">
        <RankingBlock
          title="Maiores avanços"
          items={normalizedRanking.topAvancos}
          unit={normalizedRanking.topAvancos?.[0]?.unit}
        />
        <RankingBlock
          title="Exigem atenção"
          items={normalizedRanking.topAtencao}
          emptyMessage="Nenhum indicador crítico nesta categoria."
          valueMode="distance"
          unit={normalizedRanking.topAtencao?.[0]?.unit}
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

function normalizeRankings(activeRanking, categoryItems, municipioResults) {
  const itemByKey = new Map(categoryItems.map((item) => [item.key, item]))
  const seenAdvanceKeys = new Set()
  const topAvancos = (activeRanking?.top_avancos ?? [])
    .map((item) => normalizeRankingItem(item, itemByKey, municipioResults))
    .filter((item) => {
      if (!item?.indicator_key || seenAdvanceKeys.has(item.indicator_key)) return false
      seenAdvanceKeys.add(item.indicator_key)
      return parsePpValue(item.display?.variation ?? item.display?.distance) > 0
    })
    .sort((a, b) => (
      parsePpValue(b.display?.variation ?? b.display?.distance) -
      parsePpValue(a.display?.variation ?? a.display?.distance)
    ))
    .slice(0, 3)

  const advanceKeys = new Set(topAvancos.map((item) => item.indicator_key))
  const explicitAttention = (activeRanking?.top_atencao ?? [])
    .map((item) => normalizeRankingItem(item, itemByKey, municipioResults))
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

function normalizeRankingItem(item, itemByKey, municipioResults) {
  if (!item) return null
  const key = item.indicator_key ?? item.key
  const categoryItem = itemByKey.get(key)
  const result = municipioResults?.[key]
  const unit = resolveIndicatorUnit(categoryItem, result)
  return {
    ...item,
    indicator_key: key,
    label: item.label ?? categoryItem?.label ?? key,
    sub: item.sub ?? categoryItem?.sub,
    unit,
    display: {
      ...result?.display,
      ...item.display,
    },
  }
}

function isCriticalRankingItem(item, result) {
  if (!result || !isComparableIndicator(result) || result.atingida === true) return false

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
