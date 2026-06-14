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
        <MetricCard label="Valor inicial" value={getDisplayValue(result.display, 'start_value')} />
        <MetricCard label="Valor final" value={getDisplayValue(result.display, 'end_value')} />
        <MetricCard label="Variação" value={getDisplayValue(result.display, 'variation')} />
        <MetricCard
          label={isComparable ? 'Meta' : 'Tipo'}
          value={isComparable ? (result.meta_label ?? '-') : comparisonType}
          detail={isComparable ? formatRaw(result.meta) : undefined}
        />
        <MetricCard
          label={isComparable ? 'Distância da meta' : 'Comparação'}
          value={isComparable ? getDisplayValue(result.display, 'distance') : 'Não se aplica'}
        />
      </div>

      <GoalProgress result={result} isComparable={isComparable} />

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

function GoalProgress({ result, isComparable }) {
  const startValue = getDisplayValue(result.display, 'start_value')
  const endValue = getDisplayValue(result.display, 'end_value')
  const metaValue = formatRaw(result.meta)
  const metaMarkerLabel = formatMetaMarker(result)
  const metaLabel = result.meta_label ?? 'Meta'
  const distance = getDisplayValue(result.display, 'distance')
  const progress = calculateGoalProgress(result, isComparable)
  const status = String(result?.display?.status ?? '').toLocaleLowerCase('pt-BR')
  const isInformative = status.includes('visualiza')
  const message = isInformative
    ? 'Indicador informativo, sem comparação direta com meta.'
    : 'Sem dados suficientes para acompanhar a meta deste indicador.'

  return (
    <section
      className={progress.available ? 'goal-progress' : 'goal-progress goal-progress--empty'}
      aria-label="Acompanhamento da meta"
    >
      <div className="goal-progress__heading">
        <span>Acompanhamento da meta</span>
        {progress.available && <strong>{distance}</strong>}
      </div>
      {progress.available ? (
        <>
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
          <div className="goal-progress__labels">
            <span>
              <strong>{startValue}</strong>
              <small>Valor inicial ({result.start_year ?? '-'})</small>
            </span>
            <span>
              <strong>{endValue}</strong>
              <small>Valor atual ({result.end_year ?? '-'})</small>
            </span>
            <span>
              <strong>{metaValue}</strong>
              <small>{metaLabel}</small>
            </span>
          </div>
        </>
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
    !status.includes('indispon') &&
    !status.includes('sem dados') &&
    !status.includes('sem variação') &&
    !status.includes('sem variacao')
}

function getComparisonType(result) {
  const status = String(result?.display?.status ?? '').toLocaleLowerCase('pt-BR')
  return status.includes('visualiza') ? 'Informativo' : 'Não se aplica'
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
  const raw = formatRaw(result?.meta)
  if (raw === '-') return raw
  const displayText = Object.values(result?.display ?? {}).join(' ')
  return displayText.includes('%') ? `${raw}%` : raw
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
