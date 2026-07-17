/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// JSX renderers are preserved byte-for-byte in structure while the raw payload
// adapters continue their incremental TypeScript migration.
import { useEffect, useMemo, useState } from 'react'
import { EducationBarChart } from '../../../components/EducationBarChart.jsx'
import { DataSourceNote } from '../../../components/DataSourceNote.jsx'
import { DetailHeadingText } from '../../../components/HeadingText.jsx'
import { IndicatorChartHeader } from '../../../components/IndicatorChartHeader.jsx'
import { EducationLineChart } from '../../../components/EducationLineChart.jsx'
import { EducationStackedBarChart } from '../../../components/EducationStackedBarChart.jsx'
import { EducationTable } from '../../../components/EducationTable.jsx'
import { MethodNote } from '../../../components/MethodNote.jsx'
import { MetricCard } from '../../../components/MetricCard.jsx'
import { QuickReadingHeading } from '../../../components/QuickReadingHeading.jsx'
import { SegmentedControl } from '../../../components/SegmentedControl.jsx'
import { ChartEmptyState, ChartLegend, ChartTooltip } from '../../../components/ChartPrimitives.jsx'
import { useChartViewport } from '../../../hooks/useChartViewport.js'
import { getDataSourceParts } from '../../../utils/dataSourceNotes.js'
import { closeChartTooltipOnEscape } from '../../../utils/chartVisuals.js'
import {
  etapaLabel,
  formatNumber,
  formatPercent,
  formatRatio,
  isMissing,
  modLabel,
  normalizeYearSeries,
} from '../../../utils/educationFormatters.js'
import { normalizeEducationIndicatorLabel } from '../educationFormatters'
import {
  INFRA_METRIC_LABELS,
  ageRangeCategoryDefinitions,
  ageRangeComparisonRows,
  ageRangeHistorySeries,
  ageRangeOptions,
  buildAgeRangeComparisonChart,
  buildTurmasExplore,
  calculateVariation,
  categoryComparisonRows,
  categoryHistorySeries,
  comparisonYearsForRows,
  comparisonYearsWithRecentTail,
  corRacaLabel,
  corRacaOptions,
  filterRenderableExplore,
  formatYearList,
  modalityOptions,
  safeValueSeries,
} from '../educationViewModels'

const EM = '\u2014'
const CATEGORY_COMPARISON_COLORS = ['#0f766e', '#2563eb', '#f59e0b', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#9333ea']

function IndicatorSegmentedControl({ options, selectedKey, onSelect, ariaLabel, scrollable = false }) {
  return (
    <SegmentedControl
      ariaLabel={ariaLabel}
      className={`indicator-stage-segmented platform-segmented-control${scrollable ? ' platform-segmented-control--scrollable' : ''}`}
      optionClassName="indicator-stage-segmented__button platform-segmented-option"
      onSelect={onSelect}
      options={options.map(({ key, label }) => ({ key, label }))}
      selectedKey={selectedKey}
    />
  )
}


function EducationDetailHeader({ indicator }) {
  return (
    <div className="detail-heading educacao-detail-heading">
      <DetailHeadingText eyebrow="Indicador selecionado" level={2} title={normalizeEducationIndicatorLabel(indicator.label)} />
      <div className="educacao-detail-heading__badges">
        <span className="indicator-stage-badge">{indicator.themeShortLabel ?? indicator.themeLabel}</span>
      </div>
    </div>
  )
}

function EducationQuickReading({ description, text, tone = 'default', cutLabel }) {
  if (!text && !description) return null

  return (
    <aside className={`interpretation-box education-quick-reading education-quick-reading--${tone}`} aria-label="Leitura rápida">
      <QuickReadingHeading />
      <ul className="education-quick-reading__list">
        {text ? (
          <li>
            <EducationInsightIcon name="trend" />
            <div>
              <span>Evolução observada</span>
              <p>{text}</p>
            </div>
          </li>
        ) : null}
        {description ? (
          <li>
            <EducationInsightIcon name="measure" />
            <div>
              <span>O que o indicador mede</span>
              <p>{description}</p>
            </div>
          </li>
        ) : null}
        {cutLabel ? (
          <li>
            <EducationInsightIcon name="cut" />
            <div>
              <span>Recorte exibido</span>
              <p><strong>{cutLabel}</strong></p>
            </div>
          </li>
        ) : null}
      </ul>
    </aside>
  )
}

function EducationInsightIcon({ name }) {
  const paths = {
    trend: <><path d="M5 16 10 11l3 3 6-7" /><path d="M15 7h4v4" /></>,
    measure: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
    cut: <><path d="M5 6h14M8 12h8M10 18h4" /></>,
  }

  return (
    <svg aria-hidden="true" className="education-quick-reading__icon" fill="none" viewBox="0 0 24 24">
      {paths[name] ?? paths.measure}
    </svg>
  )
}

function variationStatusLabel(variation) {
  if (variation?.raw === null || variation?.raw === undefined) return 'Sem série'
  if (variation.raw > 0) return 'Alta'
  if (variation.raw < 0) return 'Queda'
  return 'Estável'
}

function EducationMetricSummary({
  currentValue,
  currentYear,
  initialValue,
  initialYear,
  statusLabel,
  statusTone,
  variation,
}) {
  const period = initialYear && currentYear ? `${initialYear} a ${currentYear}` : 'Período indisponível'

  return (
    <div className="metric-grid metric-grid--four education-metric-summary">
      <MetricCard
        icon="start"
        label={initialYear ? `Valor inicial (${initialYear})` : 'Valor inicial'}
        value={initialValue}
        detail="Início da série histórica"
      />
      <MetricCard
        icon="current"
        label={currentYear ? `Valor mais recente (${currentYear})` : 'Valor mais recente'}
        value={currentValue}
        detail="Último dado disponível"
        size="large"
      />
      <MetricCard
        icon={variation?.raw < 0 ? 'variationDown' : 'variation'}
        label="Variação no período"
        value={variation?.display ?? EM}
        detail={period}
        tone={variation?.tone}
      />
      <MetricCard
        icon="status"
        label="Tendência observada"
        value={statusLabel ?? variationStatusLabel(variation)}
        detail="Leitura descritiva da série"
        tone={statusTone ?? variation?.tone}
      />
    </div>
  )
}


export function EducationIndicatorDetailView({ indicator, blocos }) {
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
  const stageFilterLabel = indicator.stageFilterLabel ?? 'Etapa exibida'
  return (
    <section className="detail-panel educacao-detail-panel educacao-detail-panel--organized">
      <EducationDetailHeader indicator={indicator} description={indicator.description} />

      <EducationMetricSummary
        currentValue={indicator.currentDisplay}
        currentYear={indicator.currentYear}
        initialValue={indicator.initialDisplay}
        initialYear={indicator.initialYear}
        statusLabel={indicator.statusLabel}
        statusTone={indicator.statusTone}
        variation={{ display: indicator.variationDisplay, raw: indicator.variationRaw, tone: indicator.variationTone }}
      />

      <div className="education-primary-analysis">
        <div className="indicator-chart-card educacao-main-chart-card">
          <IndicatorChartHeader
            title="Evolução do indicador"
            subtitle={`${displayIndicator.label} · Recorte exibido: ${displayIndicator.mainCutLabel}`}
            hasWideSegmented={showStageFilter}
          >
            {showStageFilter ? (
              <div className="indicator-stage-select-wrap">
                <label className="educacao-age-detail__control indicator-stage-select">
                  <span>{stageFilterLabel}</span>
                  <select
                    aria-label="Recorte do histórico do indicador"
                    value={selectedStageOption?.key ?? ''}
                    onChange={(event) => setSelectedStageKey(event.target.value)}
                  >
                    {stageOptions.map((option) => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </select>
                </label>
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

        <EducationQuickReading
          cutLabel={displayIndicator.mainCutLabel}
          description={indicator.description}
          text={indicator.quickReading}
          tone={indicator.statusTone}
        />
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
    <section className="detail-panel educacao-detail-panel educacao-detail-panel--organized">
      <EducationDetailHeader indicator={indicator} description={detailDescription} />

      <EducationQuickReading description={detailDescription} tone={indicator.statusTone} />

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
        <details className="indicator-chart-card infra-evolution-table-wrap platform-support-disclosure">
          <summary className="education-chart-heading platform-support-disclosure__summary">
            <div>
              <span>Histórico dos principais indicadores de infraestrutura</span>
              <p>Percentual por ano — {tableLabel}</p>
            </div>
          </summary>
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
        </details>
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

  if (!detailItems.length) return null

  const supportId = `education-support-${String(indicator.key ?? 'detail').replace(/[^a-z0-9_-]/gi, '-')}`
  const profileItems = detailItems.filter(isEducationSupportProfileItem)
  const hasProfilePair = profileItems.length === 2
  const compactItems = detailItems.filter((item) => !isEducationSupportWideItem(item) && !isEducationSupportProfileItem(item))
  const lastCompactItem = compactItems.at(-1)
  const hasOddCompactRow = compactItems.length % 2 === 1

  return (
    <section className="educacao-explore education-support-data education-support-data--organized" aria-labelledby={`${supportId}-title`}>
      <header className="education-support-data__header">
        <EducationSupportDataIcon />
        <div className="education-support-data__summary">
          <span className="educacao-explore__eyebrow">Aprofundamento</span>
          <h3 id={`${supportId}-title`}>Dados de apoio do indicador</h3>
          <p>Recortes por etapa, rede, localização ou perfil, quando disponíveis na estrutura atual.</p>
        </div>
      </header>

      <div className="education-support-data__body">
        <div className="education-support-data__grid">
          {detailItems.map((item) => {
            const wide = isEducationSupportWideItem(item)
            const paired = hasProfilePair && isEducationSupportProfileItem(item)
            const fullRow = wide || (!paired && isEducationSupportProfileItem(item)) || (hasOddCompactRow && item === lastCompactItem)

            return (
              <EducationSupportDataItem
                fullRow={fullRow}
                item={item}
                key={item.key}
                paired={paired}
                supportId={supportId}
                wide={wide}
              />
            )
          })}
        </div>
      </div>

      <footer className="education-support-data__footer" aria-label="Fonte consolidada dos dados de apoio">
        <EducationSourceNotes context={dataSourceContextForEducation(indicator)} />
      </footer>
    </section>
  )
}

function EducationSupportDataIcon() {
  return (
    <svg aria-hidden="true" className="education-support-data__icon" fill="none" viewBox="0 0 24 24">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <rect height="5" rx="1" width="3" x="7" y="12" />
      <rect height="9" rx="1" width="3" x="12" y="8" />
      <rect height="12" rx="1" width="3" x="17" y="5" />
    </svg>
  )
}

function EducationSupportDataItem({ fullRow, item, paired, supportId, wide }) {
  const itemId = `${supportId}-${String(item.key ?? 'item').replace(/[^a-z0-9_-]/gi, '-')}`
  const contextLabel = getDetailTabLabel(item)
  const title = item.title ?? contextLabel

  return (
    <section
      aria-labelledby={`${itemId}-title`}
      className={`education-support-data__item${wide ? ' education-support-data__item--wide' : ''}${paired ? ' education-support-data__item--paired' : ''}${fullRow ? ' education-support-data__item--full-row' : ''}`}
    >
      <header className="education-support-data__item-heading">
        <div>
          <span>{contextLabel}</span>
          <h4 id={`${itemId}-title`}>{title}</h4>
          <p>{getEducationSupportDescription(item)}</p>
        </div>
      </header>
      <div className="education-support-data__item-content">
        <ExploreItem item={item} />
      </div>
    </section>
  )
}

function isEducationSupportWideItem(item) {
  return ['modality-range', 'stage-detail', 'table'].includes(item.type)
}

function isEducationSupportProfileItem(item) {
  return ['age-range', 'color-race'].includes(item.type)
}

function getEducationSupportDescription(item) {
  if (item.type === 'stacked') return 'Distribuição histórica do indicador no recorte selecionado.'
  if (item.type === 'bar') return 'Comparação dos valores mais recentes entre as categorias disponíveis.'
  if (item.type === 'line') return 'Evolução anual da série complementar usada nesta leitura.'
  if (item.type === 'table') return 'Valores detalhados que complementam a leitura do indicador.'
  if (item.type === 'stage-detail') return 'Panorama, distribuição e evolução do recorte por etapa.'
  if (item.type === 'stage-context') return 'Síntese dos valores mais recentes para o recorte selecionado.'
  return 'Recorte complementar para interpretar o indicador com mais contexto.'
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
  return (
    <section className="detail-panel educacao-detail-panel educacao-detail-panel--organized">
      <EducationDetailHeader indicator={indicator} description={indicator.description} />

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

      <EducationMetricSummary
        currentValue={!isMissing(currentValue) ? activeMetric.formatLabel(currentValue) : EM}
        currentYear={currentYear}
        initialValue={!isMissing(initialValue) ? activeMetric.formatLabel(initialValue) : EM}
        initialYear={firstPoint?.ano}
        variation={variation}
      />

      <div className="education-primary-analysis">
        <div className="indicator-chart-card educacao-main-chart-card">
          <IndicatorChartHeader
            title="Evolução do indicador"
            subtitle={`${activeMetric.label} · Recorte exibido: ${cutLabel}`}
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

        <EducationQuickReading
          cutLabel={cutLabel}
          description={indicator.description}
          text={quickReading}
          tone={indicator.statusTone}
        />
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

function ExploreItem({ item }) {
  const isSchoolStageMethodology = item.key === 'rede-etapa' && Boolean(item.note)
  const noteEl = isSchoolStageMethodology ? (
    <MethodNote className="educacao-explore__note">{item.note}</MethodNote>
  ) : item.note ? (
    <p className="educacao-explore__note">{item.note}</p>
  ) : null
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
    if (item.presentation === 'compact-comparison') {
      return (
        <>
          <EducationCompactComparison data={item.data} formatLabel={item.formatLabel} title={item.title} />
          {noteEl}
        </>
      )
    }
    return (
      <>
        <EducationBarChart color={item.color} data={item.data} formatLabel={item.formatLabel} orientation={item.orientation} preserveOrder={item.preserveOrder} title={item.title} />
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
          </div>
        ) : null}
        <EducationBarChart
          color={item.distributionColor ?? '#16713a'}
          data={item.distributionData}
          formatLabel={item.formatLabel}
          title={item.distributionTitle}
        />
        {item.historyCategories && item.historyData && item.historyData.length >= 2 ? (
          <div className="educacao-explore-block--spaced">
            <EducationStackedBarChart
              categories={item.historyCategories}
              data={item.historyData}
              formatLabel={item.formatLabel}
              title={item.historyTitle}
            />
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
    return <AgeRangeDetail key={item.key} item={item} />
  }
  if (item.type === 'color-race') {
    return <ColorRaceDetail key={item.key} item={item} />
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

function EducationCompactComparison({ data, formatLabel = String, title }) {
  const rows = (Array.isArray(data) ? data : [])
    .filter((row) => !isMissing(row?.value) && Number(row.value) >= 0)
    .map((row) => ({ ...row, value: Number(row.value) }))
    .sort((a, b) => b.value - a.value)

  if (!rows.length) return <ChartEmptyState />

  const maxValue = Math.max(...rows.map((row) => row.value), 1)

  return (
    <dl className="education-compact-comparison" aria-label={title}>
      {rows.map((row) => (
        <div className="education-compact-comparison__item" key={row.label}>
          <dt>{row.label}</dt>
          <dd>
            <strong>{formatLabel(row.value)}</strong>
            <progress aria-label={`${row.label}: ${formatLabel(row.value)}`} max={maxValue} value={row.value} />
          </dd>
        </div>
      ))}
    </dl>
  )
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
  const comparisonTitle = `${comparisonTitlePrefix} — ${activeStageLabel}`
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
  const { containerRef, width: chartWidth } = useChartViewport(1000)
  const chartHeight = chartWidth < 420 ? 280 : chartWidth < 900 ? 300 : 320
  const chart = buildAgeRangeComparisonChart(data, categories, years, formatLabel, chartWidth, chartHeight)

  if (!chart || !chart.rows.length || !chart.categories.length) {
    return <ChartEmptyState />
  }

  return (
    <div className="education-chart education-age-comparison-chart">
      <h4 className="education-chart__title">{title}</h4>
      {chart.categories.length > 1 ? (
        <ChartLegend className="education-stacked-legend" items={chart.categories} />
      ) : null}
      <div className="education-chart__canvas" ref={containerRef}>
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
              <text
                x={row.x + row.width / 2}
                y={chart.height - chart.padding.bottom + 24}
                textAnchor="middle"
                className="chart-x-label"
              >
                {row.year}
              </text>
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
              transform: activeBar.y < chart.padding.top + 46
                ? 'translate(-50%, 12px)'
                : 'translate(-50%, calc(-100% - 12px))',
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
  const comparisonTitle = `${comparisonTitlePrefix} — ${activeStageLabel}`
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
