import {
  cleanInterpretationText,
  detectIndicatorUnit,
  formatIndicatorValue,
  getDisplayValue,
  getIndicatorTitle,
} from '../utils/format'
import { clampMarkerPosition, getStableVisualDomain, projectValueToPercent } from '../utils/visualDomain'
import { IndicatorHistoryChart } from './IndicatorHistoryChart'
import { MetricCard } from './MetricCard'
import { StatusBadge } from './StatusBadge'

export function IndicatorDetail({ item, result }) {
  if (!item || !result) {
    return (
      <section className="detail-panel empty-panel">
        <p>Selecione um indicador para ver os detalhes.</p>
      </section>
    )
  }

  const status = getDisplayValue(result.display, 'status')
  const normalizedStatus = String(status).toLocaleLowerCase('pt-BR')
  const isInformative =
    normalizedStatus.includes('visualiza') || normalizedStatus.includes('informativo')
  const tone = isInformative
    ? 'muted'
    : result.atingida
      ? 'success'
      : result.available
        ? 'warning'
        : 'muted'
  const isComparable = isComparableIndicator(result)
  const startYear = getBoundaryYear(result, 'start')
  const endYear = getBoundaryYear(result, 'end')
  const distanceTone = getDistanceTone(result, isComparable)
  const unit = detectIndicatorUnit(item, result)
  const formattedStart = formatIndicatorValue(result.start_value, unit)
  const formattedEnd = formatIndicatorValue(result.end_value, unit)
  const variation = getDisplayValue(result.display, 'variation')

  return (
    <section className="detail-panel">
      <div className="detail-heading">
        <div>
          <span className="eyebrow">Indicador selecionado</span>
          <h3>{getIndicatorTitle(item, result)}</h3>
          {item.sub && <p>{item.sub}</p>}
          {item.desc && <p>{item.desc}</p>}
        </div>
        <StatusBadge status={status} tone={tone} />
      </div>

      {isComparable ? (
        <div className="metric-grid">
          <MetricCard label={`Valor em ${startYear}`} value={formattedStart} />
          <MetricCard label={`Valor em ${endYear}`} value={formattedEnd} />
          <MetricCard label="Variação" value={variation} />
          <MetricCard
            label={result.meta_label ?? 'Meta'}
            value={formatMetaValue(result, unit)}
          />
          <MetricCard
            label="Distância da meta"
            value={getDisplayValue(result.display, 'distance')}
            tone={distanceTone}
          />
        </div>
      ) : (
        <div className="metric-grid metric-grid--four">
          <MetricCard label={`Valor em ${startYear}`} value={formattedStart} />
          <MetricCard label={`Valor em ${endYear}`} value={formattedEnd} />
          <MetricCard label="Variação" value={variation} />
          <MetricCard label="Tipo" value="Informativo" tone="muted" />
        </div>
      )}

      {isComparable && (
        <GoalProgress
          distanceTone={distanceTone}
          result={result}
          unit={unit}
        />
      )}

      {result.display?.interpretation && (
        <div className="interpretation-box">
          <span>Interpretação</span>
          <p>{cleanInterpretationText(result.display.interpretation)}</p>
        </div>
      )}

      <IndicatorHistoryChart
        display={result.display}
        endYear={result.end_year}
        item={item}
        meta={isComparable ? result.meta : null}
        result={result}
        series={result.series}
        startYear={result.start_year}
        title={getIndicatorTitle(item, result)}
        showMetaLine={isComparable}
        unit={unit}
      />
    </section>
  )
}

function GoalProgress({ distanceTone, result, unit }) {
  const endValue = formatIndicatorValue(result.end_value, unit)
  const metaMarkerLabel = formatMetaValue(result, unit)
  const distance = getDisplayValue(result.display, 'distance')
  const progress = calculateGoalProgress(result, unit)

  return (
    <section
      className="goal-progress"
      aria-label="Acompanhamento da meta"
    >
      <div className="goal-progress__heading">
        <span>Acompanhamento da meta</span>
        <strong className={`goal-progress__distance goal-progress__distance--${distanceTone}`}>
          {distance}
        </strong>
      </div>
      <div className="goal-progress__rail">
        <span
          className="goal-progress__fill"
          style={{ width: `${progress.fill}%` }}
        />
        <span
          className="goal-progress__marker goal-progress__marker--current"
          style={{ left: `${progress.current}%` }}
        >
          <em>{endValue}</em>
        </span>
        <span
          className="goal-progress__marker goal-progress__marker--meta"
          style={{ left: `${progress.meta}%` }}
        >
          <small className="goal-progress__meta-label">Meta {metaMarkerLabel}</small>
        </span>
      </div>
    </section>
  )
}

export function isComparableIndicator(result) {
  const meta = Number(result?.meta)
  const status = String(result?.display?.status ?? '').toLocaleLowerCase('pt-BR')
  return Boolean(result) &&
    result.available !== false &&
    Number.isFinite(meta) &&
    !status.includes('visualiza') &&
    !status.includes('informativo') &&
    !status.includes('indispon') &&
    !status.includes('sem dados') &&
    !status.includes('sem variação') &&
    !status.includes('sem variacao')
}

function calculateGoalProgress(result, unit) {
  const start = Number(result?.start_value)
  const current = Number(result?.end_value)
  const meta = Number(result?.meta)

  if (!Number.isFinite(current) || !Number.isFinite(meta)) {
    return { fill: 0, current: 0, meta: 0 }
  }

  const seriesValues = (result?.series ?? [])
    .map((point) => Number(point?.valor))
    .filter(Number.isFinite)
  const allValues = [...seriesValues, current, start].filter(Number.isFinite)
  const isPercent = unit === 'percent'

  const domain = getStableVisualDomain({
    values: allValues,
    meta,
    isPercent,
  })

  const fill = clampMarkerPosition(projectValueToPercent(current, domain))
  const metaPosition = clampMarkerPosition(projectValueToPercent(meta, domain))

  return {
    current: fill,
    fill,
    meta: metaPosition,
  }
}

function formatMetaValue(result, unit) {
  const raw = formatRaw(result?.meta)
  if (raw === '-') return raw
  if (unit === 'percent') return `${raw}%`
  return raw
}

function getBoundaryYear(result, boundary) {
  const directYear = Number(boundary === 'start' ? result?.start_year : result?.end_year)
  if (Number.isFinite(directYear)) return directYear
  const years = (result?.series ?? [])
    .map((point) => Number(point?.ano))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  if (!years.length) return '-'
  return boundary === 'start' ? years[0] : years[years.length - 1]
}

function getDistanceTone(result, isComparable) {
  if (!isComparable) return 'muted'
  if (result?.atingida === true) return 'success'
  if (result?.atingida === false) return 'warning'
  return 'muted'
}

function formatRaw(value) {
  if (value === null || value === undefined) {
    return '-'
  }
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  }
  return String(value)
}
