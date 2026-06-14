import { cleanInterpretationText, getDisplayValue, getIndicatorTitle } from '../utils/format'
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
          <p>{cleanInterpretationText(result.display.interpretation)}</p>
        </div>
      )}

      <IndicatorHistoryChart
        display={result.display}
        endYear={result.end_year}
        meta={isComparable ? result.meta : null}
        series={result.series}
        startYear={result.start_year}
        title={getIndicatorTitle(item, result)}
        showMetaLine={isComparable}
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

  const seriesValues = (result?.series ?? [])
    .map((point) => Number(point?.valor))
    .filter(Number.isFinite)
  const allValues = [...seriesValues, current, start].filter(Number.isFinite)
  const isPercent = detectPercentUnit(result)

  const domain = getStableVisualDomain({
    values: allValues,
    meta,
    isPercent,
  })

  const fill = clampMarkerPosition(projectValueToPercent(current, domain))
  const metaPosition = clampMarkerPosition(projectValueToPercent(meta, domain))

  return {
    available: true,
    current: fill,
    fill,
    meta: metaPosition,
  }
}

function detectPercentUnit(result) {
  const displayText = Object.values(result?.display ?? {}).join(' ')
  if (displayText.includes('%')) return true
  const allValues = [
    Number(result?.start_value),
    Number(result?.end_value),
    Number(result?.meta),
    ...((result?.series ?? []).map((point) => Number(point?.valor))),
  ].filter(Number.isFinite)
  if (allValues.length && allValues.every((value) => value >= 0 && value <= 100)) return true
  return false
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
