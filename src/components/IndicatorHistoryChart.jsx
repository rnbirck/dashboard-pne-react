import { useMemo, useState } from 'react'

const CHART_WIDTH = 820
const CHART_HEIGHT = 320
const PADDING = { bottom: 52, left: 78, right: 92, top: 64 }

export function IndicatorHistoryChart({
  display,
  endYear,
  meta,
  series,
  startYear,
  title = 'Histórico do indicador',
}) {
  const [activePoint, setActivePoint] = useState(null)
  const chart = useMemo(
    () => buildChartModel({ display, endYear, meta, series, startYear }),
    [display, endYear, meta, series, startYear],
  )

  if (chart.points.length < 2) {
    return (
      <section className="history-chart history-chart--empty-state">
        <div className="history-chart__heading">
          <div>
            <span className="eyebrow">Série histórica</span>
            <h4>{title}</h4>
          </div>
        </div>
        <div className="history-chart__empty">
          Série histórica insuficiente para gráfico.
        </div>
      </section>
    )
  }

  return (
    <section className="history-chart">
      <div className="history-chart__heading">
        <div>
          <span className="eyebrow">Série histórica</span>
          <h4>{title}</h4>
        </div>
        <span>{chart.points.length} pontos</span>
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
                <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={tick.y} y2={tick.y} />
                <text x={PADDING.left - 12} y={tick.y + 4}>{chart.formatValue(tick.value)}</text>
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
              <text x={CHART_WIDTH - PADDING.right - 2} y={chart.metaLine.labelY}>
                Meta {chart.formatValue(chart.metaLine.value)}
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
            <line x1={PADDING.left} x2={PADDING.left} y1={PADDING.top} y2={CHART_HEIGHT - PADDING.bottom} />
          </g>

          <g className="chart-year-markers">
            {chart.yearMarkers.map((marker) => (
              <line key={marker.year} x1={marker.x} x2={marker.x} y1={PADDING.top} y2={CHART_HEIGHT - PADDING.bottom} />
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

          <g className="chart-x-labels">
            {chart.xTicks.map((tick) => (
              <text key={tick.year} x={tick.x} y={CHART_HEIGHT - 14}>{tick.year}</text>
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

function buildChartModel({ display, endYear, meta, series, startYear }) {
  const points = normalizeSeries(series)
  const unit = inferUnit(display, points, meta)
  const rawMetaValue = meta === null || meta === undefined || meta === '' ? Number.NaN : Number(meta)
  const metaValue = Number.isFinite(rawMetaValue) ? rawMetaValue : null

  if (points.length < 2) {
    return { points }
  }

  const values = points.map((point) => point.value)
  if (metaValue !== null) values.push(metaValue)

  const isPercent = unit === '%'
  const domain = buildDomain(values, isPercent)
  const years = points.map((point) => point.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const xScale = (year) => {
    if (maxYear === minYear) return PADDING.left + plotWidth / 2
    return PADDING.left + ((year - minYear) / (maxYear - minYear)) * plotWidth
  }
  const yScale = (value) =>
    PADDING.top + ((domain.max - value) / (domain.max - domain.min)) * plotHeight

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

  let metaLabelY = PADDING.top + 16
  if (metaValue !== null) {
    const rawY = yScale(metaValue)
    metaLabelY = Math.max(PADDING.top + 14, Math.min(rawY - 10, CHART_HEIGHT - PADDING.bottom - 18))
  }

  return {
    areaPath,
    formatValue: (value) => formatChartValue(value, unit),
    linePath,
    metaLine:
      metaValue === null
        ? null
        : {
            labelY: metaLabelY,
            value: metaValue,
            y: Math.max(PADDING.top, Math.min(yScale(metaValue), CHART_HEIGHT - PADDING.bottom)),
          },
    points: scaledPoints,
    xTicks: pickYearTicks(scaledPoints),
    yTicks: buildYTicks(domain.min, domain.max, isPercent).map((value) => ({ value, y: yScale(value) })),
    yearMarkers: [startYear, endYear]
      .map((year) => Number(year))
      .filter((year, index, arr) => Number.isFinite(year) && year >= minYear && year <= maxYear && arr.indexOf(year) === index)
      .map((year) => ({ year, x: xScale(year) })),
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

function inferUnit(display, points, meta) {
  const displayText = Object.values(display ?? {}).join(' ')
  if (displayText.includes('%')) return '%'
  const metaValue = meta === null || meta === undefined || meta === '' ? Number.NaN : Number(meta)
  const values = [...points.map((point) => point.value), metaValue].filter(Number.isFinite)
  if (values.length && values.every((value) => value >= 0 && value <= 100)) return '%'
  return ''
}

function formatChartValue(value, unit) {
  const formatted = Number(value).toLocaleString('pt-BR', {
    maximumFractionDigits: Number.isInteger(value) || Math.abs(value) >= 10 ? 0 : 1,
  })
  return unit ? `${formatted}${unit}` : formatted
}

function buildDomain(values, isPercent) {
  let min = Math.min(...values)
  let max = Math.max(...values)
  let span = max - min

  if (span < 0.01) {
    const base = Math.max(Math.abs(max), 1)
    min -= base * 0.16
    max += base * 0.16
    span = max - min
  }

  const padding = span * 0.16
  min -= padding
  max += padding

  if (isPercent && min > 0) {
    min = Math.max(0, min)
  }

  return {
    max: niceCeil(max),
    min: niceFloor(min),
  }
}

function buildYTicks(min, max, isPercent) {
  const ticks = []
  const steps = 4
  for (let index = 0; index <= steps; index += 1) {
    const value = min + ((max - min) / steps) * index
    ticks.push(isPercent ? Math.round(value) : niceTickValue(value))
  }
  return ticks
}

function niceFloor(value) {
  if (value === 0) return 0
  const step = niceStep(value)
  return Math.floor(value / step) * step
}

function niceCeil(value) {
  if (value === 0) return 1
  const step = niceStep(value)
  return Math.ceil(value / step) * step
}

function niceStep(value) {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(Math.abs(value), 1)))
  return magnitude >= 10 ? magnitude / 2 : 1
}

function niceTickValue(value) {
  return Math.abs(value) >= 10 ? Math.round(value) : Number(value.toFixed(1))
}

function pickYearTicks(points) {
  if (points.length <= 6) return points
  const first = points[0]
  const last = points[points.length - 1]
  const middle = points[Math.floor(points.length / 2)]
  return [first, middle, last]
}
