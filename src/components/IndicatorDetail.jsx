import { getDisplayValue, getIndicatorTitle } from '../utils/format'
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
  const tone = normalizedStatus.includes('visualiza')
    ? 'info'
    : result.atingida
      ? 'success'
      : result.available
        ? 'warning'
        : 'muted'
  const isComparable = isComparableIndicator(result)
  const comparisonType = getComparisonType(result)
  const startYear = getBoundaryYear(result, 'start')
  const endYear = getBoundaryYear(result, 'end')
  const distanceTone = getDistanceTone(result, isComparable)

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

      <div className="metric-grid">
        <MetricCard label={`Valor em ${startYear}`} value={getDisplayValue(result.display, 'start_value')} />
        <MetricCard label={`Valor em ${endYear}`} value={getDisplayValue(result.display, 'end_value')} />
        <MetricCard label="Variação" value={getDisplayValue(result.display, 'variation')} />
        <MetricCard
          label={isComparable ? (result.meta_label ?? 'Meta') : 'Meta'}
          value={isComparable ? formatMetaValue(result) : comparisonType}
          tone={isComparable ? 'default' : 'muted'}
        />
        <MetricCard
          label={isComparable ? 'Distância da meta' : 'Comparação'}
          value={isComparable ? getDisplayValue(result.display, 'distance') : '-'}
          tone={distanceTone}
        />
      </div>

      <GoalProgress
        distanceTone={distanceTone}
        result={result}
        isComparable={isComparable}
      />

      {result.display?.interpretation && (
        <div className="interpretation-box">
          <span>Interpretação</span>
          <p>{result.display.interpretation}</p>
        </div>
      )}

      <IndicatorHistoryChart
        display={result.display}
        endYear={result.end_year}
        meta={isComparable ? result.meta : null}
        series={result.series}
        startYear={result.start_year}
        title={getIndicatorTitle(item, result)}
      />
    </section>
  )
}

function GoalProgress({ distanceTone, result, isComparable }) {
  const endValue = getDisplayValue(result.display, 'end_value')
  const metaMarkerLabel = formatMetaMarker(result)
  const distance = getDisplayValue(result.display, 'distance')
  const progress = calculateGoalProgress(result, isComparable)
  const message = 'Indicador informativo, sem comparação direta com meta.'

  return (
    <section
      className={progress.available ? 'goal-progress' : 'goal-progress goal-progress--empty'}
      aria-label="Acompanhamento da meta"
    >
      <div className="goal-progress__heading">
        <span>Acompanhamento da meta</span>
        {progress.available && (
          <strong className={`goal-progress__distance goal-progress__distance--${distanceTone}`}>
            {distance}
          </strong>
        )}
      </div>
      {progress.available ? (
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
      ) : (
        <p>{message}</p>
      )}
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

function getComparisonType(result) {
  const status = String(result?.display?.status ?? '').toLocaleLowerCase('pt-BR')
  return status.includes('visualiza') || status.includes('informativo') ? 'Informativo' : 'Não se aplica'
}

function calculateGoalProgress(result, isComparable) {
  const start = Number(result?.start_value)
  const current = Number(result?.end_value)
  const meta = Number(result?.meta)

  if (!isComparable || !Number.isFinite(current) || !Number.isFinite(meta)) {
    return { available: false }
  }

  const values = [current, meta]
  if (Number.isFinite(start)) values.push(start)
  let min = Math.min(...values)
  let max = Math.max(...values)
  let span = max - min
  if (span < 0.01) {
    const base = Math.max(Math.abs(max), 1)
    min -= base * 0.12
    max += base * 0.12
    span = max - min
  } else {
    const pad = span * 0.14
    min -= pad
    max += pad
    span = max - min
  }
  const toPercent = (value) => Math.max(4, Math.min(96, ((value - min) / span) * 100))
  const currentPosition = toPercent(current)

  return {
    available: true,
    current: currentPosition,
    fill: currentPosition,
    meta: toPercent(meta),
  }
}

function formatMetaMarker(result) {
  return formatMetaValue(result)
}

function formatMetaValue(result) {
  const raw = formatRaw(result?.meta)
  if (raw === '-') return raw
  const displayText = Object.values(result?.display ?? {}).join(' ')
  return displayText.includes('%') ? `${raw}%` : raw
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
