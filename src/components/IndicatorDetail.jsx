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
        <MetricCard label="Meta" value={result.meta_label ?? '-'} detail={formatRaw(result.meta)} />
        <MetricCard label="Distância da meta" value={getDisplayValue(result.display, 'distance')} />
      </div>

      <GoalProgress result={result} />

      {result.display?.interpretation && (
        <div className="interpretation-box">
          <span>Interpretação</span>
          <p>{result.display.interpretation}</p>
        </div>
      )}

      <IndicatorHistoryChart
        display={result.display}
        endYear={result.end_year}
        meta={result.meta}
        series={result.series}
        startYear={result.start_year}
        title={getIndicatorTitle(item, result)}
      />
    </section>
  )
}

function GoalProgress({ result }) {
  const startValue = getDisplayValue(result.display, 'start_value')
  const endValue = getDisplayValue(result.display, 'end_value')
  const metaValue = formatRaw(result.meta)
  const metaLabel = result.meta_label ?? 'Meta'
  const distance = getDisplayValue(result.display, 'distance')
  const progress = calculateGoalProgress(result)

  return (
    <section className="goal-progress" aria-label="Acompanhamento da meta">
      <div className="goal-progress__heading">
        <span>Acompanhamento da meta</span>
        <strong>{distance}</strong>
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
        />
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
    </section>
  )
}

function calculateGoalProgress(result) {
  const start = Number(result?.start_value)
  const current = Number(result?.end_value)
  const meta = Number(result?.meta)

  if (!Number.isFinite(current) || !Number.isFinite(meta) || meta === 0) {
    return { current: 50, fill: 50, meta: 100 }
  }

  const values = [0, current, meta]
  if (Number.isFinite(start)) values.push(start)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || Math.abs(max) || 1
  const toPercent = (value) => Math.max(0, Math.min(100, ((value - min) / span) * 100))
  const currentPosition = toPercent(current)

  return {
    current: currentPosition,
    fill: currentPosition,
    meta: toPercent(meta),
  }
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
