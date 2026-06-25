import { useEffect, useMemo, useState } from 'react'
import { CategoryTabs } from '../components/CategoryTabs'
import { FundebPanel } from '../components/FundebPanel'
import { FUNDEB_INDICATORS } from '../data/fundebIndicators'
import { EducationBarChart } from '../components/EducationBarChart'
import { EducationLineChart } from '../components/EducationLineChart'
import { EducationStackedBarChart } from '../components/EducationStackedBarChart'
import { EducationSummaryCard } from '../components/EducationSummaryCard'
import { EducationTable } from '../components/EducationTable'
import { MetricCard } from '../components/MetricCard'
import { StatusBadge } from '../components/StatusBadge'
import { loadEducationMunicipio, loadEducationMunicipiosIndex } from '../data/educationData'
import { useAsyncData } from '../utils/useAsyncData'
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
} from '../utils/educationFormatters'

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
  [FILTER_KEYS.eja]: 'EJA',
  [FILTER_KEYS.profissional]: 'Educação Profissional',
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
const FUNDAMENTAL_FAIXA_STAGES = ['fundamental_anos_iniciais', 'fundamental_anos_finais']
const CATEGORY_COMPARISON_COLORS = ['#0f766e', '#2563eb', '#f59e0b', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#9333ea']

export function EducacaoPage({ municipioData, selectedMunicipio }) {
  const eduIndexState = useAsyncData(() => loadEducationMunicipiosIndex(), [])
  const eduMunMap = useMemo(() => {
    const list = eduIndexState.data?.municipios ?? []
    return new Map(list.map((m) => [m.municipio, m.id_municipio]))
  }, [eduIndexState.data])
  const selectedId = eduMunMap.get(selectedMunicipio) ?? null
  const munDataState = useAsyncData(async () => {
    if (!selectedId) return null
    return loadEducationMunicipio(selectedId)
  }, [selectedId])

  const [selectedScope, setSelectedScope] = useState('panorama')
  const [selectedThemeKey, setSelectedThemeKey] = useState('matriculas')
  const [selectedIndicatorKey, setSelectedIndicatorKey] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  if (!selectedMunicipio) {
    return (
      <div className="page-stack educacao-page">
        <section className="page-card educacao-hero">
          <div>
            <span className="eyebrow">Indicadores da Educação</span>
            <h1>Indicadores da Educação</h1>
            <p>Matrículas, escolas, docentes, fluxo, aprendizagem e oferta técnica do município.</p>
          </div>
        </section>
        <section className="empty-state">
          <div className="empty-state__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5" />
            </svg>
          </div>
          <h2>Selecione um município</h2>
          <p>Os indicadores educacionais são carregados após a seleção do município. Use o seletor no topo da página.</p>
        </section>
      </div>
    )
  }

  if (eduIndexState.loading || munDataState.loading) {
    return <div className="page-stack"><p className="state-box state-box--loading">Carregando dados...</p></div>
  }

  if (munDataState.error) {
    return <div className="page-stack"><div className="state-box state-box--error"><strong>Erro ao carregar dados</strong><span>{munDataState.error}</span></div></div>
  }

  const dados = munDataState.data
  if (!dados) return null

  const model = buildEducationModel(dados.blocos ?? {})
  const themes = model.themes
  const selectedTheme = themes.find((theme) => theme.key === selectedThemeKey) ?? themes[0]
  const themeItems = selectedTheme?.items ?? []
  const filteredItems = themeItems.filter((item) => {
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR')
    const queryMatches = !query || `${item.label} ${item.description} ${item.themeLabel}`.toLocaleLowerCase('pt-BR').includes(query)
    return queryMatches
  })
  const activeIndicator = filteredItems.length
    ? (filteredItems.find((item) => item.key === selectedIndicatorKey) ?? filteredItems[0])
    : null

  function handleThemeSelect(themeKey) {
    setSelectedThemeKey(themeKey)
    setSelectedIndicatorKey('')
    setSearchQuery('')
  }

  function handleScopeSelect(scope) {
    if (scope === selectedScope) return
    setSelectedScope(scope)
    setSelectedIndicatorKey('')
    setSearchQuery('')
    if (scope === 'panorama') {
      const validKeys = model.themes.map((t) => t.key)
      if (!validKeys.includes(selectedThemeKey)) {
        setSelectedThemeKey('matriculas')
      }
    }
  }

  const panoramaCount = model.themes.reduce((sum, t) => sum + t.items.length, 0)

  return (
    <div className="page-stack educacao-page">
      <section className="page-card educacao-hero">
        <div>
          <span className="eyebrow">Indicadores da Educação</span>
          <h1>Indicadores da Educação</h1>
          <p>Matrículas, escolas, docentes, fluxo, aprendizagem e oferta técnica do município.</p>
          <p>Município em foco: <strong>{selectedMunicipio}</strong></p>
        </div>
      </section>

      <section className="educacao-scope-selector">
        <span className="eyebrow educacao-scope-selector__heading">Escolha o bloco de indicadores</span>
        <p className="educacao-scope-selector__subtitle">Alterne entre os indicadores gerais da educação e os dados financeiros do FUNDEB.</p>
        <div className="educacao-scope-selector__grid">
          <button
            className={'educacao-scope-card' + (selectedScope === 'panorama' ? ' is-active' : '')}
            type="button"
            aria-pressed={selectedScope === 'panorama'}
            onClick={() => handleScopeSelect('panorama')}
          >
            <span className="educacao-scope-card__title">Panorama Educacional</span>
            <span className="educacao-scope-card__description">
              Matrículas, escolas, turmas, fluxo, aprendizagem e oferta técnica.
            </span>
            <span className="educacao-scope-card__footer">
              <span className="educacao-scope-card__count">{panoramaCount} indicadores</span>
            </span>
          </button>
          <button
            className={'educacao-scope-card' + (selectedScope === 'fundeb' ? ' is-active' : '')}
            type="button"
            aria-pressed={selectedScope === 'fundeb'}
            onClick={() => handleScopeSelect('fundeb')}
          >
            <span className="educacao-scope-card__title">FUNDEB</span>
            <span className="educacao-scope-card__description">
              Receitas, despesas, remuneração e saldos do fundo.
            </span>
            <span className="educacao-scope-card__footer">
              <span className="educacao-scope-card__count">{FUNDEB_INDICATORS.length} indicadores</span>
            </span>
          </button>
        </div>
      </section>

      {selectedScope === 'panorama' && <EducationOverviewCards overview={model.overview} />}

      <section className="cycle-workspace educacao-workspace">
        {selectedScope === 'panorama' ? (
          <>
            <div className="cycle-category-bar">
              <span className="eyebrow">Temas de análise</span>
              <div className="cycle-category-bar__controls">
                <CategoryTabs
                  ariaLabel="Temas da educação"
                  categories={themes}
                  selectedCategory={selectedTheme?.key}
                  onSelectCategory={handleThemeSelect}
                />
              </div>
            </div>
            <div className="cycle-layout educacao-analysis-layout">
              <aside className="indicator-sidebar">
                <div className="indicator-sidebar__heading">
                  <h3>Indicadores</h3>
                  <span>{filteredItems.length}</span>
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
                <EducationIndicatorList
                  items={filteredItems}
                  selectedIndicator={activeIndicator?.key}
                  onSelectIndicator={setSelectedIndicatorKey}
                />
              </aside>
              <EducationIndicatorDetail indicator={activeIndicator} blocos={dados.blocos} />
            </div>
          </>
        ) : (
          <FundebPanel
            municipioData={municipioData}
            selectedMunicipio={selectedMunicipio}
            embedded={true}
          />
        )}
      </section>
    </div>
  )
}

function EducationOverviewCards({ overview }) {
  return (
    <section className="page-card educacao-overview">
      <div className="educacao-overview__heading">
        <h2>Visão geral</h2>
        <p>Últimos dados disponíveis por bloco, com o ano de referência em cada indicador.</p>
      </div>
      <div className="educacao-overview-grid">
        {overview.map((card) => (
          <EducationSummaryCard key={card.label} label={card.label} value={card.value} year={card.year} tone={card.tone} />
        ))}
      </div>
    </section>
  )
}

function EducationIndicatorList({ items, selectedIndicator, onSelectIndicator }) {
  if (!items.length) {
    return (
      <div className="indicator-sidebar__empty educacao-sidebar-empty">
        <p>Nenhum indicador disponível para este filtro.</p>
      </div>
    )
  }

  return (
    <div className="indicator-list">
      {items.map((item) => (
        <button
          className={item.key === selectedIndicator ? 'indicator-row is-active' : 'indicator-row'}
          key={item.key}
          type="button"
          onClick={() => onSelectIndicator(item.key)}
          title={item.label}
        >
          <span className="indicator-row__label">{item.label}</span>
          <span className="indicator-row__badges">
            {item.statusLabel !== 'Com dados' ? (
              <StatusBadge className="indicator-status" displayStatus={item.statusLabel} status={item.statusLabel} tone={item.statusTone} />
            ) : null}
            <span className="indicator-stage-badge">{item.categoryLabel}</span>
          </span>
        </button>
      ))}
    </div>
  )
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

  const stageOptions = indicator.stageFilterOptions ?? []
  const selectedStageOption = stageOptions.find((option) => option.key === selectedStageKey) ?? stageOptions[0] ?? null
  const displayIndicator = applyStageOption(indicator, selectedStageOption)
  const hasMainSeries = displayIndicator.series.length >= 2
  const showStageFilter = stageOptions.length > 1

  return (
    <section className="detail-panel educacao-detail-panel">
      <div className="detail-heading">
        <div className="detail-heading__copy">
          <span className="eyebrow">Indicador selecionado</span>
          <h3>{indicator.label}</h3>
          <p>{indicator.description}</p>
        </div>
        <StatusBadge status={indicator.statusLabel} tone={indicator.statusTone} />
      </div>

      <div className="metric-grid metric-grid--three">
        <MetricCard label="Valor inicial" value={indicator.initialDisplay} detail={indicator.initialYear ? `Ano ${indicator.initialYear}` : null} />
        <MetricCard label="Valor atual" value={indicator.currentDisplay} detail={indicator.currentYear ? `Ano ${indicator.currentYear}` : null} size="large" />
        <MetricCard label="Variação" value={indicator.variationDisplay} tone={indicator.variationTone} />
      </div>

      <div className="interpretation-box">
        <span>Leitura rápida</span>
        <p>{indicator.quickReading}</p>
      </div>

      <div className="indicator-chart-card educacao-main-chart-card">
        <div className="education-chart-heading">
          <div>
            <span>Evolução do indicador</span>
            <p>{displayIndicator.label} · Recorte: {displayIndicator.mainCutLabel}</p>
          </div>
          {showStageFilter ? (
            <label className="education-stage-filter">
              <span>Etapa exibida</span>
              <select value={selectedStageOption?.key ?? ''} onChange={(event) => setSelectedStageKey(event.target.value)}>
                {stageOptions.map((option) => (
                  <option key={option.key} value={option.key}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        {hasMainSeries ? (
          <EducationLineChart
            color={displayIndicator.chartColor}
            formatLabel={displayIndicator.formatValue}
            scaleType={displayIndicator.scaleType}
            series={displayIndicator.series}
            showPointLabels={displayIndicator.showPointLabels}
            title={null}
          />
        ) : (
          <div className="detail-empty-state">
            <p>Não há série histórica suficiente para calcular evolução.</p>
          </div>
        )}
      </div>

      <EducationIndicatorBreakdown indicator={displayIndicator} />
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
      <div className="detail-heading">
        <div className="detail-heading__copy">
          <span className="eyebrow">Indicador selecionado</span>
          <h3>{indicator.label}</h3>
          <p>Condições de conectividade, tecnologia e ambiente físico das escolas.</p>
        </div>
        <StatusBadge status={indicator.statusLabel} tone={indicator.statusTone} />
      </div>

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
            <div className="infra-dep-band__pills">
              {availableDeps.map((dep) => (
                <button
                  key={dep}
                  type="button"
                  className={`infra-dep-pill${dep === selectedDep ? ' is-active' : ''}`}
                  onClick={() => setSelectedDep(dep)}
                >
                  {DEP_LABELS[dep] || dep}
                </button>
              ))}
            </div>
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
              <span>Evolução dos principais indicadores de infraestrutura</span>
              <p>Percentual por ano — {tableLabel}</p>
            </div>
          </div>
          <div className="infra-table-scroll">
            <EducationTable columns={evolutionColumns} rows={evolutionRows} />
          </div>
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
  const activeItem = detailItems.find((item) => item.key === selectedDetailKey) ?? detailItems[0] ?? null
  const hasTabs = detailItems.length > 1

  return (
    <section className="educacao-explore">
      <div className="educacao-explore__heading">
        <span>Detalhamento do indicador</span>
        <p>Veja como o indicador se distribui por etapa, rede ou localização, quando esses recortes estiverem disponíveis.</p>
      </div>

      {hasTabs ? (
        <div className="educacao-detail-tabs" role="tablist" aria-label="Detalhamentos do indicador">
          {detailItems.map((item) => (
            <button
              className={`educacao-detail-tab${activeItem?.key === item.key ? ' is-active' : ''}`}
              key={item.key}
              type="button"
              onClick={() => setSelectedDetailKey(item.key)}
            >
              {getDetailTabLabel(item)}
            </button>
          ))}
        </div>
      ) : null}

      {activeItem ? (
        <div className="educacao-explore__panel">
          <ExploreItem item={activeItem} />
        </div>
      ) : (
        <div className="detail-empty-state">
          <p>Não há detalhamento adicional disponível para este indicador.</p>
        </div>
      )}
    </section>
  )
}

function sortDetailItems(items) {
  return [...items].sort((a, b) => detailTabPriority(a) - detailTabPriority(b))
}

function detailTabPriority(item) {
  if (Number.isFinite(item.tabPriority)) return item.tabPriority
  const label = getDetailTabLabel(item)
  if (label === 'Por rede') return 1
  if (label === 'Por localização') return 2
  if (label === 'Por etapa') return 3
  if (label === 'Por faixa etária') return 4
  if (label === 'Por modalidade') return 5
  if (label === 'Evolução') return 6
  if (label === 'Infraestrutura') return 7
  return 10
}

function getDetailTabLabel(item) {
  if (item.tabLabel) return item.tabLabel
  const title = String(item.title ?? '').toLocaleLowerCase('pt-BR')
  if (item.type === 'age-range') return 'Por faixa etária'
  if (title.includes('faixa et')) return 'Por faixa etária'
  if (title.includes('etapa')) return 'Por etapa'
  if (title.includes('localiza')) return 'Por localização'
  if (title.includes('rede') || title.includes('depend')) return 'Por rede'
  if (title.includes('modalidade')) return 'Por modalidade'
  if (title.includes('infraestrutura')) return 'Infraestrutura'
  if (title.includes('evolu')) return 'Evolução'
  if (item.type === 'table') return 'Tabela'
  return item.title ?? 'Detalhamento'
}

function ExploreItem({ item }) {
  const noteEl = item.note ? <p className="educacao-explore__note">{item.note}</p> : null

  if (item.type === 'stacked') {
    return (
      <>
        <EducationStackedBarChart
          categories={item.categories}
          data={item.data}
          formatLabel={item.formatLabel}
          title={item.title}
        />
        {noteEl}
      </>
    )
  }

  if (item.type === 'bar') {
    return (
      <>
        <EducationBarChart color={item.color} data={item.data} formatLabel={item.formatLabel} preserveOrder={item.preserveOrder} title={item.title} />
        {noteEl}
      </>
    )
  }
  if (item.type === 'age-range') {
    return <AgeRangeDetail key={item.key} item={item} />
  }
  if (item.type === 'modality-range') {
    return <ModalityDetail key={item.key} item={item} />
  }
  if (item.type === 'line') {
    return item.series.length >= 2
      ? <EducationLineChart color={item.color} formatLabel={item.formatLabel} scaleType={item.scaleType} series={item.series} title={item.title} />
      : <div className="education-chart-empty"><p>Não há dados suficientes para exibir o gráfico.</p></div>
  }
  if (item.type === 'table') {
    return (
      <div className="educacao-explore-table">
        <h4>{item.title}</h4>
        <EducationTable columns={item.columns} rows={item.rows} />
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
  const comparisonYears = comparisonYearsForRows(scopedRows)
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
  const chart = buildAgeRangeComparisonChart(data, categories, years, formatLabel)

  if (!chart || !chart.rows.length || !chart.categories.length) {
    return <div className="education-chart-empty"><p>Não há dados suficientes para exibir o gráfico.</p></div>
  }

  return (
    <div className="education-chart education-age-comparison-chart">
      <h4 className="education-chart__title">{title}</h4>
      <div className="education-stacked-legend">
        {chart.categories.map((category) => (
          <span key={category.key}>
            <i style={{ background: category.color }} />
            {category.label}
          </span>
        ))}
      </div>
      <div className="education-chart__canvas">
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={title}>
          <g className="chart-grid">
            {chart.yTicks.map((tick, i) => (
              <g key={`y-${i}`}>
                <line x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={tick.y} y2={tick.y} stroke="#e8ede4" strokeWidth="1" />
                <text x={chart.padding.left - 10} y={tick.y + 4} textAnchor="end" className="chart-axis-label">{tick.label}</text>
              </g>
            ))}
          </g>
          <line x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={chart.height - chart.padding.bottom} y2={chart.height - chart.padding.bottom} stroke="#c4ccc0" strokeWidth="1" />
          <line x1={chart.padding.left} x2={chart.padding.left} y1={chart.padding.top} y2={chart.height - chart.padding.bottom} stroke="#c4ccc0" strokeWidth="1" />
          {chart.rows.map((row) => (
            <g key={row.year}>
              {row.bars.map((bar) => (
                <g key={`${row.year}-${bar.key}`}>
                  {!isMissing(bar.value) ? (
                    <>
                      <rect
                        x={bar.x}
                        y={bar.y}
                        width={bar.width}
                        height={bar.height}
                        fill={bar.color}
                        fillOpacity="0.86"
                        rx="3"
                      />
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

function buildEducationModel(blocos) {
  const mat = blocos.matriculas ?? {}
  const rede = blocos.rede_escolar ?? {}
  const turmas = blocos.turmas_docentes ?? {}
  const fluxo = blocos.fluxo ?? {}
  const aprend = blocos.aprendizagem ?? {}
  const oferta = blocos.oferta_tecnica ?? {}
  const matResumo = mat.resumo_ultimo_ano ?? {}
  const redeResumo = rede.resumo_ultimo_ano ?? {}
  const turmasResumo = turmas.resumo_ultimo_ano ?? {}
  const fluxoResumo = fluxo.resumo_ultimo_ano ?? {}
  const aprendResumo = aprend.resumo_ultimo_ano ?? {}
  const ofertaResumo = oferta.resumo_ultimo_ano ?? {}
  const preferredIdeb = getPreferredIdeb(aprendResumo)

  const items = [
    ...buildMatriculasIndicators(mat),
    ...buildRedeIndicators(rede),
    ...buildTurmasIndicators(turmas),
    ...buildFluxoIndicators(fluxo),
    ...buildAprendizagemIndicators(aprend),
    ...buildOfertaIndicators(oferta),
  ]

  const themes = [
    makeTheme('matriculas', 'Matrículas e atendimento', 'Matrículas', items),
    makeTheme('rede', 'Escolas', 'Escolas', items),
    makeTheme('turmas', 'Turmas e docentes', 'Turmas', items),
    makeTheme('fluxo', 'Fluxo escolar', 'Fluxo', items),
    makeTheme('aprendizagem', 'Aprendizagem', 'Aprendizagem', items),
    makeTheme('oferta', 'Oferta técnica/profissional', 'Oferta técnica', items),
  ]

  return {
    overview: [
      { label: 'Matrículas', value: formatNumber(matResumo.total_matriculas), year: mat.ultimo_ano },
      { label: 'Escolas', value: formatNumber(redeResumo.total_escolas), year: rede.ultimo_ano },
      { label: 'Turmas', value: formatNumber(turmasResumo.turmas), year: turmas.ultimo_ano },
      { label: 'Alunos por turma', value: formatRatio(turmasResumo.alunos_por_turma), year: turmas.ultimo_ano },
      { label: 'Aprovação', value: formatPercent(fluxoResumo.taxa_aprovacao), year: fluxo.ultimo_ano, tone: 'success' },
      { label: 'IDEB', value: preferredIdeb ? formatValue(preferredIdeb.ideb) : EM, year: preferredIdeb?.ano },
      { label: 'Oferta técnica', value: formatNumber(ofertaResumo.total_matriculas_tecnicas), year: oferta.ultimo_ano },
    ],
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
    createIndicator({ key: 'mat-profissional', label: 'Matrículas na educação profissional', description: 'Matrículas registradas na educação profissional/técnica.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.profissional], stageLabel: 'Educação Profissional', series: normalizeYearSeries(series.por_etapa?.profissional), currentValue: byEtapa.profissional, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Educação Profissional', explore: buildMatriculasExplore(mat, { cutKey: 'profissional', cutLabel: 'Educação Profissional', stageKey: 'profissional' }) }),
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
      description: 'Acesso à internet e banda larga nas escolas.',
      series: valueSeries(series.internet, 'perc_internet'),
      currentValue: resumo.perc_internet,
      formatType: 'percent',
      mainCutLabel: 'Escolas com internet',
      explore: buildRedeInfraExplore(rede),
    }),
  ]
}

function buildTurmasIndicators(turmas) {
  const series = turmas.series ?? {}
  const resumo = turmas.resumo_ultimo_ano ?? {}
  const latestYear = turmas.ultimo_ano
  const base = { themeKey: 'turmas', themeLabel: 'Turmas e docentes', themeShortLabel: 'Turmas', categories: [FILTER_KEYS.todos], isGeral: true, currentYear: latestYear, notices: turmas.avisos ?? [] }
  return [
    createIndicator({ ...base, key: 'turmas-total', label: 'Total de turmas', description: 'Total de turmas registradas.', series: valueSeries(series.total, 'turmas'), currentValue: resumo.turmas, formatType: 'number', mainCutLabel: 'Total do município', explore: buildTurmasExplore(turmas, { cutLabel: 'Total do município', metricKey: 'turmas', formatLabel: formatNumber }), stageFilterOptions: buildTurmasStageOptions(turmas, { metricKey: 'turmas', formatLabel: formatNumber }) }),
    createIndicator({ ...base, key: 'docentes-total', label: 'Total de docentes', description: 'Total de docentes registrados.', series: valueSeries(series.total, 'docentes'), currentValue: resumo.docentes, formatType: 'number', mainCutLabel: 'Docentes', explore: buildTurmasExplore(turmas, { cutLabel: 'Total do município', metricKey: 'docentes', formatLabel: formatNumber }), stageFilterOptions: buildTurmasStageOptions(turmas, { metricKey: 'docentes', formatLabel: formatNumber }) }),
    createIndicator({ ...base, key: 'alunos-turma', label: 'Alunos por turma', description: 'Média de alunos por turma.', series: valueSeries(series.total, 'alunos_por_turma'), currentValue: resumo.alunos_por_turma, formatType: 'ratio', mainCutLabel: 'Relação aluno/turma', explore: buildTurmasExplore(turmas, { cutLabel: 'Total do município', metricKey: 'alunos_por_turma', formatLabel: formatRatio }), stageFilterOptions: buildTurmasStageOptions(turmas, { metricKey: 'alunos_por_turma', formatLabel: formatRatio }) }),
    createIndicator({ ...base, key: 'alunos-docente', label: 'Alunos por docente', description: 'Média de alunos por docente.', series: valueSeries(series.total, 'alunos_por_docente'), currentValue: resumo.alunos_por_docente, formatType: 'ratio', mainCutLabel: 'Relação aluno/docente', explore: buildTurmasExplore(turmas, { cutLabel: 'Total do município', metricKey: 'alunos_por_docente', formatLabel: formatRatio }), stageFilterOptions: buildTurmasStageOptions(turmas, { metricKey: 'alunos_por_docente', formatLabel: formatRatio }) }),
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
    createIndicator({ key: 'oferta-total', label: 'Matrículas em educação técnica/profissional', description: 'Total de matrículas em oferta técnica/profissional.', themeKey: 'oferta', themeLabel: 'Oferta técnica/profissional', themeShortLabel: 'Oferta', categories: [FILTER_KEYS.profissional], stageLabel: 'Educação Profissional', series: normalizeYearSeries(series.total), currentValue: resumo.total_matriculas_tecnicas, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Oferta técnica', explore, notices: oferta.avisos ?? [] }),
  ]
}

function createIndicator(config) {
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
  const status = getIndicatorStatus(currentValue, series)

  return {
    ...config,
    id: config.id ?? config.key,
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
    currentYear,
    formatValue: formatValueForType,
    initialDisplay: formatValueForType(initialValue),
    initialYear,
    notices: config.notices ?? [],
    explore: filterRenderableExplore(config.explore),
    stageFilterOptions: filterStageFilterOptions(config.stageFilterOptions),
    quickReading: buildQuickReading({ currentDisplay: formatValueForType(currentValue), currentValue, currentYear, formatType: config.formatType, initialValue, initialYear, label: config.label, variation }),
    scaleType: config.scaleType ?? inferScaleType(config),
    statusLabel: status.label,
    statusTone: status.tone,
    variationDisplay: variation.display,
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
  if (item.type === 'modality-range') {
    return Array.isArray(item.rows) && item.rows.some((row) => !isMissing(detailRowValue(row, 'matriculas')))
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

function buildTurmasStageOptions(turmas, metric) {
  const series = turmas.series ?? {}
  const options = [
    makeStageOption({
      key: 'total',
      label: 'Total',
      mainCutLabel: 'Total do município',
      series: valueSeries(series.total, metric.metricKey),
      explore: buildTurmasExplore(turmas, { ...metric, cutLabel: 'Total do município' }),
    }),
    ...orderedStageKeys(series.por_etapa, metric.metricKey).map((key) => makeStageOption({
      key,
      label: etapaLabel(key),
      mainCutLabel: etapaLabel(key),
      series: valueSeries(series.por_etapa?.[key], metric.metricKey),
      explore: buildTurmasExplore(turmas, { ...metric, cutLabel: etapaLabel(key), stageKey: key }),
    })),
  ]
  return options.filter(Boolean)
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

    return [
      ...etapaItems,
      ...(faixaEtariaItem ? [faixaEtariaItem] : []),
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
  const visibleCategories = categories.filter((category) => (
    data.some((row) => !isMissing(row.values?.[category.key]))
  ))
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
          color: category.color,
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

function buildTurmasExplore(turmas, cut = { cutLabel: 'Total do município', metricKey: 'turmas', formatLabel: formatNumber }) {
  const detalhamentos = turmas.detalhamentos ?? {}
  const isCountMetric = ['turmas', 'docentes', 'matriculas'].includes(cut.metricKey)
  const titleBase = turmasMetricLabel(cut.metricKey)
  const titleSuffix = ` — ${cut.cutLabel}`

  if (cut.stageKey) {
    const dependencyRows = detailRowsFor(detalhamentos.por_etapa_rede, { etapa_ensino: cut.stageKey })
    const locationRows = detailRowsFor(detalhamentos.por_etapa_localizacao, { etapa_ensino: cut.stageKey })
    const dependencyKeys = dependencyKeysFromDetailRows(dependencyRows, cut.metricKey)
    const locationKeys = detailKeys(locationRows, 'localizacao', ['urbana', 'rural'], cut.metricKey)
    if (isCountMetric) {
      return [
        { key: `turmas-${cut.stageKey}-rede`, type: 'stacked', title: `${titleBase} por rede${titleSuffix}`, categories: categoryDefinitions(dependencyKeys, depLabel, DEPENDENCY_COLORS), data: detailRowsToStackedRows(dependencyRows, 'dependencia', dependencyKeys, cut.metricKey), formatLabel: cut.formatLabel },
        { key: `turmas-${cut.stageKey}-localizacao`, type: 'stacked', title: `${titleBase} por localização${titleSuffix}`, categories: categoryDefinitions(locationKeys, locLabel, LOCATION_COLORS), data: detailRowsToStackedRows(locationRows, 'localizacao', locationKeys, cut.metricKey), formatLabel: cut.formatLabel },
      ]
    }
    const dependencyLatest = detailRowsToLatestRows(dependencyRows, 'dependencia', depLabel, cut.metricKey)
    const locationLatest = detailRowsToLatestRows(locationRows, 'localizacao', locLabel, cut.metricKey)
    return [
      { key: `turmas-${cut.stageKey}-rede`, type: 'bar', title: titleWithYear(`${titleBase} por rede${titleSuffix}`, dependencyLatest), color: '#2563eb', formatLabel: cut.formatLabel, data: dependencyLatest },
      { key: `turmas-${cut.stageKey}-localizacao`, type: 'bar', title: titleWithYear(`${titleBase} por localização${titleSuffix}`, locationLatest), color: '#7c3aed', formatLabel: cut.formatLabel, data: locationLatest },
    ]
  }

  const etapaRows = detailRowsToLatestRows(detalhamentos.por_etapa, 'etapa_ensino', etapaLabel, cut.metricKey)
  const dependencyKeys = dependencyKeysFromDetailRows(detalhamentos.por_rede, cut.metricKey)
  const locationKeys = detailKeys(detalhamentos.por_localizacao, 'localizacao', ['urbana', 'rural'], cut.metricKey)
  const dependencyLatest = detailRowsToLatestRows(detalhamentos.por_rede, 'dependencia', depLabel, cut.metricKey)
  const locationLatest = detailRowsToLatestRows(detalhamentos.por_localizacao, 'localizacao', locLabel, cut.metricKey)

  if (isCountMetric) {
    return [
      { key: 'turmas-etapa', type: 'bar', title: titleWithYear(`${titleBase} por etapa de ensino${titleSuffix}`, etapaRows), color: '#16713a', formatLabel: cut.formatLabel, data: etapaRows },
      { key: 'turmas-rede', type: 'stacked', title: `${titleBase} por rede${titleSuffix}`, categories: categoryDefinitions(dependencyKeys, depLabel, DEPENDENCY_COLORS), data: detailRowsToStackedRows(detalhamentos.por_rede, 'dependencia', dependencyKeys, cut.metricKey), formatLabel: cut.formatLabel },
      { key: 'turmas-localizacao', type: 'stacked', title: `${titleBase} por localização${titleSuffix}`, categories: categoryDefinitions(locationKeys, locLabel, LOCATION_COLORS), data: detailRowsToStackedRows(detalhamentos.por_localizacao, 'localizacao', locationKeys, cut.metricKey), formatLabel: cut.formatLabel },
    ]
  }

  return [
    { key: 'turmas-etapa', type: 'bar', title: titleWithYear(`${titleBase} por etapa de ensino${titleSuffix}`, etapaRows), color: '#16713a', formatLabel: cut.formatLabel, data: etapaRows },
    { key: 'turmas-rede', type: 'bar', title: titleWithYear(`${titleBase} por rede${titleSuffix}`, dependencyLatest), color: '#2563eb', formatLabel: cut.formatLabel, data: dependencyLatest },
    { key: 'turmas-localizacao', type: 'bar', title: titleWithYear(`${titleBase} por localização${titleSuffix}`, locationLatest), color: '#7c3aed', formatLabel: cut.formatLabel, data: locationLatest },
  ]
}

function turmasMetricLabel(metricKey) {
  if (metricKey === 'docentes') return 'Docentes'
  if (metricKey === 'alunos_por_turma') return 'Alunos por turma'
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
  const items = [
    { key: 'fluxo-dep', type: 'bar', title: titleWithYear(`Taxa por rede${titleSuffix}`, dependencyLatest), color: '#2563eb', formatLabel: formatPercent, data: dependencyLatest },
  ]
  if (!cut.noLocation) {
    const locationLatest = detailRowsToLatestRows(locationRows.filter((row) => locKeys.includes(row.localizacao)), 'localizacao', locLabel, cut.metricKey)
    items.push({ key: 'fluxo-loc', type: 'bar', title: titleWithYear(`Taxa por localização${titleSuffix}`, locationLatest), color: '#7c3aed', formatLabel: formatPercent, data: locationLatest })
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

function getIndicatorStatus(currentValue, series) {
  if (isMissing(currentValue)) return { label: 'Sem dado', tone: 'muted' }
  if (series.length < 2) return { label: 'Série parcial', tone: 'info' }
  return { label: 'Com dados', tone: 'success' }
}

function buildQuickReading({ currentDisplay, currentValue, currentYear, formatType, initialValue, initialYear, label, variation }) {
  if (isMissing(currentValue)) return `Não há dado recente disponível para ${label.toLocaleLowerCase('pt-BR')}.`
  if (isMissing(initialValue) || !initialYear || !currentYear || variation.raw === null) return 'Não há série histórica suficiente para calcular evolução.'
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
