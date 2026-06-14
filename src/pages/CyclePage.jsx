import { useMemo, useState } from 'react'
import { CategoryTabs } from '../components/CategoryTabs'
import { IndicatorDetail } from '../components/IndicatorDetail'
import { IndicatorList } from '../components/IndicatorList'
import { RankingBlock } from '../components/RankingBlock'

export function CyclePage({ cycle, indicadores, municipioData, selectedMunicipio, title }) {
  const categories = useMemo(
    () => indicadores?.cycles?.[cycle]?.categories ?? [],
    [indicadores, cycle],
  )
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('')
  const [selectedIndicatorKey, setSelectedIndicatorKey] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const selectedCategory = useMemo(() => {
    if (!categories.length) return null
    return (
      categories.find((category) => category.key === selectedCategoryKey) ??
      categories[0]
    )
  }, [categories, selectedCategoryKey])

  const categoryItems = useMemo(
    () => selectedCategory?.items ?? [],
    [selectedCategory],
  )
  const filteredCategoryItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR')
    if (!query) return categoryItems
    return categoryItems.filter((item) => item.label.toLocaleLowerCase('pt-BR').includes(query))
  }, [categoryItems, searchQuery])
  const municipioResults = municipioData?.[cycle]?.indicadores ?? null
  const municipioRankings = municipioData?.[cycle]?.rankings ?? null
  const activeIndicatorKey = useMemo(() => {
    if (!categoryItems.length) return ''
    if (categoryItems.some((item) => item.key === selectedIndicatorKey)) {
      return selectedIndicatorKey
    }
    return categoryItems[0].key
  }, [categoryItems, selectedIndicatorKey])
  const activeItem = useMemo(
    () => categoryItems.find((item) => item.key === activeIndicatorKey) ?? categoryItems[0],
    [activeIndicatorKey, categoryItems],
  )
  const activeResult = activeItem ? municipioResults?.[activeItem.key] : null
  const activeRanking = municipioRankings?.[selectedCategory?.key]
  const cycleManagementStats = useMemo(
    () => buildCycleManagementStats(categories, municipioResults),
    [categories, municipioResults],
  )

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

        <div className="cycle-layout">
          <aside className="indicator-sidebar">
            <div className="indicator-sidebar__heading">
              <h3>Indicadores</h3>
              <span>{categoryItems.length}</span>
            </div>
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
          </aside>

          <IndicatorDetail item={activeItem} result={activeResult} />
        </div>
      </section>

      <section className="ranking-grid">
        <RankingBlock title="Maiores avanços" items={activeRanking?.top_avancos} />
        <RankingBlock title="Exigem atenção" items={activeRanking?.top_atencao} />
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
