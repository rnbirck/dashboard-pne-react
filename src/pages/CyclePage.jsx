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
  const totalIndicators = useMemo(
    () => categories.reduce((total, category) => total + (category.items?.length ?? 0), 0),
    [categories],
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
          <SummaryMetric label="categorias" value={categories.length} />
          <SummaryMetric label="indicadores" value={totalIndicators} />
          <SummaryMetric label="na categoria" value={categoryItems.length} />
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

function SummaryMetric({ label, value }) {
  return (
    <div className="cycle-hero-meta">
      <span>{value}</span>
      <small>{label}</small>
    </div>
  )
}
