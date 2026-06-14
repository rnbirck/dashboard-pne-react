import { useMemo, useState } from 'react'
import {
  getStableVisualDomain,
  stableAbsoluteTicks,
  stableIndexTicks,
  stablePercentTicks,
} from '../utils/visualDomain'
import { formatIndicatorValue, resolveIndicatorUnit } from '../utils/format'

const CHART_WIDTH = 820
const CHART_HEIGHT = 260
const PADDING = { bottom: 36, left: 56, right: 72, top: 28 }

export function IndicatorHistoryChart({
  display,
  endYear,
  item,
  meta,
  result,
  series,
  showMetaLine = true,
  startYear,
  title = 'Histórico do indicador',
  unit: unitProp,
}) {
  const [activePoint, setActivePoint] = useState(null)
  const resolvedUnit = unitProp || resolveIndicatorUnit(item, result)
  const chart = useMemo(
    () =>
      buildChartModel({
        display,
        endYear,
        meta,
        resolvedUnit,
        result,
        series,
        showMetaLine,
        startYear,
      }),
    [display, endYear, meta, resolvedUnit, result, series, showMetaLine, startYear],
  )

  if (chart.points.length < 2) {
    return null
  }

  return (
    <section className="history-chart">
      <div className="history-chart__heading">
        <div>
          <span className="eyebrow">Evolução do indicador</span>
          <h4>{title}</h4>
        </div>
      </div>

      <div className="history-chart__canvas">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label={`${title}: linha histórica por ano`}
        >
          <g className="chart-grid">
            {chart.yTicks.map((tick, index) => (
              <g key={`${tick.value}-${index}`}>
                <line
                  x1={PADDING.left}
                  x2={CHART_WIDTH - PADDING.right}
                  y1={tick.y}
                  y2={tick.y}
                />
                <text x={PADDING.left - 12} y={tick.y + 4}>
                  {chart.formatValue(tick.value)}
                </text>
              </g>
            ))}
          </g>

          {chart.metaLine && (
            <g className="chart-meta-line">
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={chart.metaLine.y}
                y2={chart.metaLine.y}
              />
              <text
                className="chart-meta-line__label"
                x={CHART_WIDTH - PADDING.right - 2}
                y={Math.max(PADDING.top + 12, chart.metaLine.y - 8)}
              >
                {`Meta ${chart.formatValue(chart.metaLine.value)}`}
              </text>
            </g>
          )}

          <g className="chart-axis">
            <line
              x1={PADDING.left}
              x2={CHART_WIDTH - PADDING.right}
              y1={CHART_HEIGHT - PADDING.bottom}
              y2={CHART_HEIGHT - PADDING.bottom}
            />
            <line
              x1={PADDING.left}
              x2={PADDING.left}
              y1={PADDING.top}
              y2={CHART_HEIGHT - PADDING.bottom}
            />
          </g>

          <g className="chart-year-markers">
            {chart.yearMarkers.map((marker) => (
              <line
                key={marker.year}
                x1={marker.x}
                x2={marker.x}
                y1={PADDING.top}
                y2={CHART_HEIGHT - PADDING.bottom}
              />
            ))}
          </g>

          <path className="chart-area" d={chart.areaPath} />
          <path className="chart-line" d={chart.linePath} />

          <g className="chart-points">
            {chart.points.map((point) => (
              <circle
                cx={point.x}
                cy={point.y}
                key={point.year}
                r={activePoint?.year === point.year ? 5.5 : 4.2}
                onBlur={() => setActivePoint(null)}
                onFocus={() => setActivePoint(point)}
                onMouseEnter={() => setActivePoint(point)}
                onMouseLeave={() => setActivePoint(null)}
                tabIndex="0"
              >
                <title>{`${point.year}: ${chart.formatValue(point.value)}`}</title>
              </circle>
            ))}
          </g>

          <g className="chart-data-labels">
            {chart.dataLabels.map((label) => (
              <text
                key={label.year}
                x={label.x}
                y={label.y}
                textAnchor={label.anchor}
                className={label.isLast ? 'chart-label--last' : 'chart-label'}
              >
                {chart.formatValue(label.value)}
              </text>
            ))}
          </g>

          <g className="chart-x-labels">
            {chart.xTicks.map((tick) => (
              <text key={tick.year} x={tick.x} y={CHART_HEIGHT - 14}>
                {tick.year}
              </text>
            ))}
          </g>
        </svg>

        {activePoint && (
          <div
            className="history-chart__tooltip"
            style={{
              left: `${Math.min(92, Math.max(10, (activePoint.x / CHART_WIDTH) * 100))}%`,
              top: `${(activePoint.y / CHART_HEIGHT) * 100}%`,
              transform:
                activePoint.y < PADDING.top + 38
                  ? 'translate(-50%, 12px)'
                  : 'translate(-50%, calc(-100% - 12px))',
            }}
          >
            <strong>{activePoint.year}</strong>
            <span>{chart.formatValue(activePoint.value)}</span>
          </div>
        )}
      </div>
    </section>
  )
}

function buildChartModel({
  display,
  endYear,
  meta,
  resolvedUnit,
  result,
  series,
  showMetaLine,
  startYear,
}) {
  const points = normalizeSeries(series)
  const rawMetaValue =
    meta === null || meta === undefined || meta === '' ? Number.NaN : Number(meta)
  const metaValue = Number.isFinite(rawMetaValue) ? rawMetaValue : null

  if (points.length < 2) {
    return {
      formatValue: (value) => formatIndicatorValue(value, resolvedUnit),
      points,
    }
  }

  const values = points.map((point) => point.value)
  const isPercent = resolvedUnit === 'percent'
  const isIndex = resolvedUnit === 'index'
  const domain = getStableVisualDomain({
    values: metaValue !== null ? [...values, metaValue] : values,
    meta: metaValue,
    isPercent,
    isIndex,
  })
  const years = points.map((point) => point.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const xScale = (year) => {
    if (maxYear === minYear) return PADDING.left + plotWidth / 2
    return PADDING.left + ((year - minYear) / (maxYear - minYear)) * plotWidth
  }
  const yScale = (value) => {
    if (domain.max === domain.min) return PADDING.top + plotHeight / 2
    return PADDING.top + ((domain.max - value) / (domain.max - domain.min)) * plotHeight
  }

  const scaledPoints = points.map((point) => ({
    ...point,
    x: xScale(point.year),
    y: yScale(point.value),
  }))
  const linePath = scaledPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')
  const last = scaledPoints[scaledPoints.length - 1]
  const first = scaledPoints[0]
  const areaPath = `${linePath} L${last.x.toFixed(1)} ${(CHART_HEIGHT - PADDING.bottom).toFixed(1)} L${first.x.toFixed(1)} ${(CHART_HEIGHT - PADDING.bottom).toFixed(1)} Z`

  const yTicksRaw = isPercent
    ? stablePercentTicks(domain) ?? [domain.min, domain.max]
    : isIndex
      ? stableIndexTicks(domain) ?? [domain.min, domain.max]
      : stableAbsoluteTicks(domain) ?? [domain.min, domain.max]
  const yTicks = yTicksRaw
    .filter((value) => value >= domain.min - 0.0001 && value <= domain.max + 0.0001)
    .map((value) => ({ value, y: yScale(value) }))

  const shouldShowMeta = showMetaLine && metaValue !== null && Number.isFinite(metaValue)
  let metaLine = null
  if (shouldShowMeta) {
    const baseY = yScale(metaValue)
    metaLine = {
      value: metaValue,
      y: Math.max(PADDING.top, Math.min(baseY, CHART_HEIGHT - PADDING.bottom)),
    }
  }

  const candidateMarkerYears = [startYear, endYear]
    .map((year) => Number(year))
    .filter((year) => Number.isFinite(year) && year > 0)

  const fallbackMarkerYears = [minYear, maxYear]

  const finalMarkerYears = candidateMarkerYears.length
    ? candidateMarkerYears
    : fallbackMarkerYears

  const yearMarkers = finalMarkerYears
    .filter((year) => year >= minYear && year <= maxYear)
    .filter((year, index, arr) => arr.indexOf(year) === index)
    .map((year) => ({ year, x: xScale(year) }))

  const formatValue = (value) => formatIndicatorValue(value, resolvedUnit)
  const dataLabels = computeDataLabels(scaledPoints, metaLine, formatValue)

  return {
    areaPath,
    dataLabels,
    formatValue,
    linePath,
    metaLine,
    points: scaledPoints,
    xTicks: pickYearTicks(scaledPoints),
    yTicks,
    yearMarkers,
  }
}

function normalizeSeries(series = []) {
  return series
    .map((point) => ({
      value: Number(point?.valor),
      year: Number(point?.ano),
    }))
    .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.value))
    .sort((a, b) => a.year - b.year)
}

function pickYearTicks(points) {
  if (points.length <= 6) return points
  const first = points[0]
  const last = points[points.length - 1]
  const middle = points[Math.floor(points.length / 2)]
  return [first, middle, last]
}

function computeDataLabels(points, metaLine, formatValue) {
  if (points.length === 0) return []

  const labels = []
  const LABEL_OFFSET_Y = 14
  const MIN_DISTANCE_Y = 18
  const MIN_DISTANCE_X = 28

  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]

  // Sempre mostrar último ponto
  labels.push({
    anchor: 'start',
    isLast: true,
    priority: 1,
    value: lastPoint.value,
    x: lastPoint.x + 8,
    y: lastPoint.y - LABEL_OFFSET_Y,
    year: lastPoint.year,
  })

  // Se até 8 pontos, mostrar todos
  if (points.length <= 8) {
    for (let i = 0; i < points.length - 1; i++) {
      const p = points[i]
      labels.push({
        anchor: 'middle',
        isLast: false,
        priority: 5,
        value: p.value,
        x: p.x,
        y: p.y - LABEL_OFFSET_Y,
        year: p.year,
      })
    }
  } else {
    // Mais de 8 pontos: mostrar primeiro, maior, menor, cruzamentos
    const maxPoint = points.reduce((max, p) => (p.value > max.value ? p : max), points[0])
    const minPoint = points.reduce((min, p) => (p.value < min.value ? p : min), points[0])

    const seen = new Set([firstPoint.year])
    const addPoint = (p, priority) => {
      if (!p || seen.has(p.year)) return
      seen.add(p.year)
      labels.push({
        anchor: 'middle',
        isLast: false,
        priority,
        value: p.value,
        x: p.x,
        y: p.y - LABEL_OFFSET_Y,
        year: p.year,
      })
    }

    addPoint(firstPoint, 4)
    addPoint(maxPoint, 3)
    addPoint(minPoint, 3)

    // Pontos que cruzam a meta
    if (metaLine && Number.isFinite(metaLine.value)) {
      const metaVal = metaLine.value
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const crossedUp = prev.value < metaVal && curr.value >= metaVal
        const crossedDown = prev.value > metaVal && curr.value <= metaVal
        if (crossedUp || crossedDown) {
          addPoint(curr, 2)
        }
      }
    }
  }

  // Meta label
  if (metaLine) {
    labels.push({
      anchor: 'end',
      isLast: false,
      priority: 0,
      value: metaLine.value,
      x: CHART_WIDTH - PADDING.right - 2,
      y: Math.max(PADDING.top + 12, metaLine.y - 8),
      year: 'meta',
    })
  }

  // Remover labels muito próximos, priorizando por priority (menor número = maior prioridade)
  labels.sort((a, b) => a.priority - b.priority)

  const filtered = []
  for (const label of labels) {
    const tooClose = filtered.some((existing) => {
      const dy = Math.abs(existing.y - label.y)
      const dx = Math.abs(existing.x - label.x)
      return dy < MIN_DISTANCE_Y && dx < MIN_DISTANCE_X
    })
    if (!tooClose) filtered.push(label)
  }

  return filtered
}
