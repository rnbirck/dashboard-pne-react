import { useMemo, useState } from 'react'
import { isMissing, normalizeYearSeries } from '../utils/educationFormatters'
import { closeChartTooltipOnEscape, resolveChartColor } from '../utils/chartVisuals'
import { ChartEmptyState, ChartTooltip } from './ChartPrimitives'

const CHART_WIDTH = 760
const CHART_HEIGHT = 300
const PADDING = { top: 34, right: 36, bottom: 42, left: 62 }

export function EducationLineChart({
  series,
  title,
  color = '#16713a',
  formatLabel = (v) => String(v),
  scaleType = 'count',
  showPointLabels = false,
}) {
  const [activePoint, setActivePoint] = useState(null)
  const chart = useMemo(() => buildChart(series, scaleType), [scaleType, series])
  const resolvedColor = resolveChartColor(color)

  if (!chart || chart.points.length < 2) {
    return (
      <ChartEmptyState message="Histórico não disponível." />
    )
  }

  return (
    <div className="education-chart">
      {title && <h4 className="education-chart__title">{title}</h4>}
      <div className="education-chart__canvas">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={title || 'Gráfico de linha'}>
          <g className="chart-grid">
            {chart.yTicks.map((tick, i) => (
              <g key={`y-${i}`}>
                <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={tick.y} y2={tick.y} stroke="var(--chart-grid)" strokeWidth="1" />
                <text x={PADDING.left - 10} y={tick.y + 4} textAnchor="end" className="chart-axis-label">{tick.label}</text>
              </g>
            ))}
          </g>
          <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={CHART_HEIGHT - PADDING.bottom} y2={CHART_HEIGHT - PADDING.bottom} stroke="var(--chart-axis)" strokeWidth="1" />
          <line x1={PADDING.left} x2={PADDING.left} y1={PADDING.top} y2={CHART_HEIGHT - PADDING.bottom} stroke="var(--chart-axis)" strokeWidth="1" />
          <path d={chart.linePath} fill="none" stroke={resolvedColor} strokeWidth="2.25" strokeLinejoin="round" />
          <path d={chart.areaPath} fill={resolvedColor} fillOpacity="0.08" />
          {chart.points.map((point, i) => (
            <g key={`pt-${i}`}>
              <circle
                aria-label={`${title || 'Município'}, ${point.year}: ${formatLabel(point.value)}`}
                className={`chart-mark${point.isLast ? ' is-last' : ''}`}
                cx={point.x} cy={point.y} r={activePoint?.year === point.year ? 5 : 3.5}
                fill={resolvedColor}
                onBlur={() => setActivePoint(null)}
                onFocus={() => setActivePoint(point)}
                onKeyDown={(event) => closeChartTooltipOnEscape(event, () => setActivePoint(null))}
                onMouseEnter={() => setActivePoint(point)}
                onMouseLeave={() => setActivePoint(null)}
                tabIndex="0"
                style={{ cursor: 'pointer' }}
              >
                <title>{`${title || 'Município'}, ${point.year}: ${formatLabel(point.value)}`}</title>
              </circle>
              {showPointLabels && point.showLabel ? (
                <text
                  x={point.x}
                  y={point.y < PADDING.top + 18 ? point.y + 18 : point.y - 10}
                  textAnchor="middle"
                  className={point.isLast ? 'chart-point-label is-last' : 'chart-point-label'}
                >
                  {formatLabel(point.value)}
                </text>
              ) : null}
              <text x={point.x} y={CHART_HEIGHT - 14} textAnchor="middle" className="chart-x-label">{point.year}</text>
            </g>
          ))}
        </svg>
        {activePoint && (
          <ChartTooltip
            className="education-chart__tooltip"
            label={activePoint.year}
            series={title || 'Município'}
            value={formatLabel(activePoint.value)}
            style={{ left: `${Math.min(90, Math.max(10, (activePoint.x / CHART_WIDTH) * 100))}%`, top: `${(activePoint.y / CHART_HEIGHT) * 100}%` }}
          />
        )}
      </div>
    </div>
  )
}

function buildChart(series, scaleType) {
  if (!Array.isArray(series) || series.length < 2) return null
  const points = normalizeYearSeries(series)
    .filter((p) => !isMissing(p.valor) && p.ano)
    .map((p) => ({ year: Number(p.ano), value: Number(p.valor) }))
    .sort((a, b) => a.year - b.year)
  if (points.length < 2) return null
  const values = points.map((p) => p.value)
  const domain = getYAxisDomain(values, scaleType)
  const range = domain.max - domain.min || 1
  const years = points.map((p) => p.year)
  const minYear = Math.min(...years); const maxYear = Math.max(...years)
  const yearRange = maxYear - minYear || 1
  const plotW = CHART_WIDTH - PADDING.left - PADDING.right
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom
  const xScale = (year) => PADDING.left + ((year - minYear) / yearRange) * plotW
  const yScale = (val) => PADDING.top + ((domain.max - val) / (domain.max - domain.min || 1)) * plotH
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const firstYear = points[0].year
  const lastYear = points[points.length - 1].year
  const scaled = points.map((p) => ({
    ...p,
    x: xScale(p.year),
    y: yScale(p.value),
    isLast: p.year === lastYear,
    showLabel: shouldShowPointLabel(p, points.length, { firstYear, lastYear, minValue, maxValue }),
  }))
  const linePath = scaled.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const baselineY = yScale(domain.min)
  const areaPath = `${linePath} L${scaled[scaled.length - 1].x.toFixed(1)} ${baselineY.toFixed(1)} L${scaled[0].x.toFixed(1)} ${baselineY.toFixed(1)} Z`
  const yTicksRaw = [domain.min, domain.min + range * 0.25, domain.min + range * 0.5, domain.min + range * 0.75, domain.max]
  const yTicks = yTicksRaw.map((val) => ({ label: formatAxisTick(val, scaleType), y: yScale(val) }))
  return { points: scaled, linePath, areaPath, yTicks }
}

function shouldShowPointLabel(point, pointCount, { firstYear, lastYear, minValue, maxValue }) {
  if (pointCount <= 7) return true
  return (
    point.year === firstYear ||
    point.year === lastYear ||
    point.value === minValue ||
    point.value === maxValue
  )
}

function getYAxisDomain(values, scaleType) {
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const rawRange = maxVal - minVal

  if (scaleType === 'percent') return { min: 0, max: 100 }
  if (scaleType === 'ideb') return { min: 0, max: 10 }
  if (scaleType === 'inse') return { min: 0, max: 10 }

  if (scaleType === 'saeb') {
    const margin = Math.max(rawRange * 0.45, 20)
    return niceDomain(Math.max(0, minVal - margin), maxVal + margin)
  }

  if (scaleType === 'count') {
    if (maxVal <= 0) return niceDomain(minVal, maxVal)
    const relativeRange = rawRange / maxVal
    if (relativeRange > 0.35 || minVal < maxVal * 0.35) {
      return niceDomain(0, maxVal * 1.08)
    }
    const margin = Math.max(rawRange * 1.2, maxVal * 0.12, 1)
    return niceDomain(Math.max(0, minVal - margin), maxVal + margin)
  }

  const margin = Math.max(rawRange * 0.6, Math.abs(maxVal) * 0.1, 1)
  return niceDomain(Math.max(0, minVal - margin), maxVal + margin)
}

function niceDomain(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1 }
  if (min === max) {
    const margin = Math.max(Math.abs(max) * 0.15, 1)
    return { min: Math.max(0, min - margin), max: max + margin }
  }
  const span = max - min
  const step = niceStep(span / 4)
  return {
    min: Math.floor(min / step) * step,
    max: Math.ceil(max / step) * step,
  }
}

function niceStep(value) {
  if (!Number.isFinite(value) || value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const scaled = value / power
  if (scaled <= 1) return power
  if (scaled <= 2) return 2 * power
  if (scaled <= 5) return 5 * power
  return 10 * power
}

function formatAxisTick(value, scaleType) {
  const digits = scaleType === 'ideb' || scaleType === 'inse' ? 1 : 0
  return value.toLocaleString('pt-BR', { maximumFractionDigits: digits })
}
