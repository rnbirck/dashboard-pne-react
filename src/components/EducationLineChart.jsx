import { useMemo } from 'react'
import { isMissing } from '../utils/educationFormatters'

const CHART_WIDTH = 760
const CHART_HEIGHT = 240
const PADDING = { top: 20, right: 20, bottom: 36, left: 56 }

export function EducationLineChart({ series, title, color = '#16713a' }) {
  const chart = useMemo(
    () => buildChart(series),
    [series],
  )

  if (!chart || chart.points.length < 2) {
    return (
      <div className="education-chart-empty">
        <p>Não há dados suficientes para exibir o gráfico.</p>
      </div>
    )
  }

  return (
    <div className="education-chart">
      {title && <h4 className="education-chart__title">{title}</h4>}
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={title || 'Gráfico de linha'}>
        <g className="chart-grid">
          {chart.yTicks.map((tick, i) => (
            <g key={`y-${i}`}>
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={tick.y}
                y2={tick.y}
                stroke="#e8ede4"
                strokeWidth="1"
              />
              <text x={PADDING.left - 10} y={tick.y + 4} textAnchor="end" className="chart-axis-label">
                {tick.label}
              </text>
            </g>
          ))}
        </g>
        <line
          x1={PADDING.left}
          x2={CHART_WIDTH - PADDING.right}
          y1={CHART_HEIGHT - PADDING.bottom}
          y2={CHART_HEIGHT - PADDING.bottom}
          stroke="#c4ccc0"
          strokeWidth="1"
        />
        <line
          x1={PADDING.left}
          x2={PADDING.left}
          y1={PADDING.top}
          y2={CHART_HEIGHT - PADDING.bottom}
          stroke="#c4ccc0"
          strokeWidth="1"
        />
        <path d={chart.linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        <path d={chart.areaPath} fill={color} fillOpacity="0.08" />
        {chart.points.map((point, i) => (
          <g key={`pt-${i}`}>
            <circle cx={point.x} cy={point.y} r="3.5" fill={color} />
            <text x={point.x} y={CHART_HEIGHT - 14} textAnchor="middle" className="chart-x-label">
              {point.year}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function buildChart(series) {
  if (!Array.isArray(series) || series.length < 2) return null

  const points = series
    .filter((p) => !isMissing(p.valor) && p.ano)
    .map((p) => ({ year: Number(p.ano), value: Number(p.valor) }))
    .sort((a, b) => a.year - b.year)

  if (points.length < 2) return null

  const values = points.map((p) => p.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1
  const domain = { min: Math.max(0, minVal - range * 0.1), max: maxVal + range * 0.1 }

  const years = points.map((p) => p.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
  const yearRange = maxYear - minYear || 1

  const plotW = CHART_WIDTH - PADDING.left - PADDING.right
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const xScale = (year) => PADDING.left + ((year - minYear) / yearRange) * plotW
  const yScale = (val) => PADDING.top + ((domain.max - val) / (domain.max - domain.min || 1)) * plotH

  const scaled = points.map((p) => ({ ...p, x: xScale(p.year), y: yScale(p.value) }))

  const linePath = scaled
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const baselineY = yScale(domain.min)
  const areaPath = `${linePath} L${scaled[scaled.length - 1].x.toFixed(1)} ${baselineY.toFixed(1)} L${scaled[0].x.toFixed(1)} ${baselineY.toFixed(1)} Z`

  const yTicksRaw = [domain.min, domain.min + range * 0.25, domain.min + range * 0.5, domain.min + range * 0.75, domain.max]
  const yTicks = yTicksRaw.map((val) => ({
    label: Math.round(val).toLocaleString('pt-BR'),
    y: yScale(val),
  }))

  return { points: scaled, linePath, areaPath, yTicks }
}
