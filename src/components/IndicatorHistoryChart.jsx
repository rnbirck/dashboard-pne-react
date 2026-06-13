import { useMemo, useState } from 'react'

const CHART_WIDTH = 760
const CHART_HEIGHT = 300
const PADDING = { bottom: 46, left: 62, right: 44, top: 52 }

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
      <section className="history-chart">
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
            {chart.yTicks.map((tick) => (
              <g key={tick.value}>
                <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={tick.y} y2={tick.y} />
                <text x={PADDING.left - 10} y={tick.y + 4}>{chart.formatValue(tick.value)}</text>
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
              <text x={CHART_WIDTH - PADDING.right} y={chart.metaLine.labelY}>
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
              left: `${Math.min(94, Math.max(8, (activePoint.x / CHART_WIDTH) * 100))}%`,
              top: `${(activePoint.y / CHART_HEIGHT) * 100}%`,
              transform:
                activePoint.y < PADDING.top + 36
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
  const metaValue = Number.isFinite(Number(meta)) ? Number(meta) : null

  if (points.length < 2) {
    return { points }
  }

  const values = points.map((point) => point.value)
  if (metaValue !== null) values.push(metaValue)

  const minRaw = Math.min(...values)
  const maxRaw = Math.max(...values)
  const span = maxRaw - minRaw || Math.abs(maxRaw) || 1

  const isPercent = unit === '%'
  const allValuesWithinPercent = isPercent && values.every((v) => v >= 0 && v <= 100)

  let minValue, maxValue
  if (isPercent && allValuesWithinPercent) {
    minValue = Math.max(0, minRaw - span * 0.12)
    maxValue = Math.min(100, maxRaw + span * 0.12)
  } else {
    minValue = minRaw - span * 0.12
    maxValue = maxRaw + span * 0.12
  }

  // Domínio mínimo para evitar gráfico achatado
  if (Math.abs(maxValue - minValue) < 0.01) {
    const minDomain = Math.abs(minValue) < 0.01 ? 1 : minValue * 0.1
    minValue = minValue - minDomain
    maxValue = maxValue + minDomain
  }

  // Margem extra no topo para labels de meta não saírem do SVG
  const safeMax = maxValue + span * 0.08
  const safeMin = minValue - span * 0.02

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
    PADDING.top + ((safeMax - value) / (safeMax - safeMin)) * plotHeight

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

  // Calcula posição segura da label da meta
  let metaLabelY = PADDING.top + 16
  if (metaValue !== null) {
    const rawY = yScale(metaValue)
    metaLabelY = Math.max(PADDING.top + 16, Math.min(rawY - 10, CHART_HEIGHT - PADDING.bottom - 16))
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
    yTicks: buildYTicks(safeMin, safeMax).map((value) => ({ value, y: yScale(value) })),
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
  const values = [...points.map((point) => point.value), Number(meta)].filter(Number.isFinite)
  if (values.length && values.every((value) => value >= 0 && value <= 100)) return '%'
  return ''
}

function formatChartValue(value, unit) {
  const formatted = Number(value).toLocaleString('pt-BR', {
    maximumFractionDigits: Math.abs(value) < 10 ? 1 : 0,
  })
  return unit ? `${formatted}${unit}` : formatted
}

function buildYTicks(min, max) {
  const ticks = []
  const steps = 4
  for (let index = 0; index <= steps; index += 1) {
    ticks.push(min + ((max - min) / steps) * index)
  }
  return ticks
}

function pickYearTicks(points) {
  if (points.length <= 6) return points
  const first = points[0]
  const last = points[points.length - 1]
  const middle = points[Math.floor(points.length / 2)]
  return [first, middle, last]
}
