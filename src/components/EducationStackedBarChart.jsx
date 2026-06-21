import { useMemo, useState } from 'react'
import { isMissing } from '../utils/educationFormatters'

const CHART_WIDTH = 760
const CHART_HEIGHT = 380
const PADDING = { top: 28, right: 32, bottom: 52, left: 72 }
const BAR_GAP = 8

export function EducationStackedBarChart({
  categories,
  data,
  title,
  formatLabel = (v) => String(v),
}) {
  const [activeSegment, setActiveSegment] = useState(null)
  const chart = useMemo(() => buildStackedChart(data, categories), [categories, data])

  if (!chart || chart.rows.length === 0 || chart.categories.length === 0) {
    return (
      <div className="education-chart-empty">
        <p>Não há dados suficientes para exibir o gráfico.</p>
      </div>
    )
  }

  return (
    <div className="education-chart education-chart--stacked">
      {title && <h4 className="education-chart__title">{title}</h4>}
      <div className="education-stacked-legend" aria-hidden="true">
        {chart.categories.map((category) => (
          <span key={category.key}>
            <i style={{ background: category.color }} />
            {category.label}
          </span>
        ))}
      </div>
      <div className="education-chart__canvas">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={title || 'Gráfico de barras empilhadas'}>
          <g className="chart-grid">
            {chart.yTicks.map((tick, i) => (
              <g key={`y-${i}`}>
                <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={tick.y} y2={tick.y} stroke="#e8ede4" strokeWidth="1" />
                <text x={PADDING.left - 10} y={tick.y + 4} textAnchor="end" className="chart-axis-label">{tick.label}</text>
              </g>
            ))}
          </g>
          <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={CHART_HEIGHT - PADDING.bottom} y2={CHART_HEIGHT - PADDING.bottom} stroke="#c4ccc0" strokeWidth="1" />
          <line x1={PADDING.left} x2={PADDING.left} y1={PADDING.top} y2={CHART_HEIGHT - PADDING.bottom} stroke="#c4ccc0" strokeWidth="1" />
          {chart.rows.map((row) => (
            <g key={row.year}>
              {row.segments.map((segment) => (
                <rect
                  key={`${row.year}-${segment.key}`}
                  x={segment.x}
                  y={segment.y}
                  width={segment.width}
                  height={segment.height}
                  fill={segment.color}
                  fillOpacity={activeSegment?.year === row.year && activeSegment?.key === segment.key ? '1' : '0.86'}
                  rx="3"
                  onMouseEnter={() => setActiveSegment(segment)}
                  onMouseLeave={() => setActiveSegment(null)}
                  style={{ cursor: 'pointer', transition: 'fill-opacity 0.12s' }}
                />
              ))}
              <text x={row.x + row.width / 2} y={CHART_HEIGHT - 16} textAnchor="middle" className="chart-x-label">{row.year}</text>
            </g>
          ))}
        </svg>
        {activeSegment && (
          <div
            className="education-chart__tooltip education-chart__tooltip--bar"
            style={{
              left: `${Math.min(90, Math.max(10, (activeSegment.x / CHART_WIDTH) * 100))}%`,
              top: `${Math.min(82, Math.max(12, (activeSegment.y / CHART_HEIGHT) * 100))}%`,
            }}
          >
            <strong>{activeSegment.label} · {activeSegment.year}</strong>
            <span>{formatLabel(activeSegment.value)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function buildStackedChart(data, categories) {
  if (!Array.isArray(data) || !Array.isArray(categories) || !data.length || !categories.length) return null

  const visibleCategories = categories.filter((category) => (
    data.some((row) => !isMissing(row.values?.[category.key]))
  ))
  if (!visibleCategories.length) return null

  const normalizedRows = data
    .map((row) => {
      const values = Object.fromEntries(
        visibleCategories
          .map((category) => [category.key, row.values?.[category.key]])
          .filter(([, value]) => !isMissing(value)),
      )
      const total = Object.values(values).reduce((sum, value) => sum + Number(value), 0)
      return { year: Number(row.year), values, total }
    })
    .filter((row) => Number.isFinite(row.year) && row.total > 0)
    .sort((a, b) => a.year - b.year)

  if (!normalizedRows.length) return null

  const maxTotal = Math.max(...normalizedRows.map((row) => row.total), 1)
  const domainMax = niceMax(maxTotal)
  const plotW = CHART_WIDTH - PADDING.left - PADDING.right
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom
  const slotWidth = plotW / normalizedRows.length
  const barWidth = Math.max(26, Math.min(58, slotWidth * 0.58 - BAR_GAP))
  const yScale = (value) => PADDING.top + ((domainMax - value) / domainMax) * plotH

  const rows = normalizedRows.map((row, rowIndex) => {
    const x = PADDING.left + rowIndex * slotWidth + (slotWidth - barWidth) / 2
    let accumulated = 0
    const segments = visibleCategories.flatMap((category) => {
      const value = Number(row.values[category.key])
      if (!Number.isFinite(value) || value <= 0) return []
      const yTop = yScale(accumulated + value)
      const yBottom = yScale(accumulated)
      accumulated += value
      return [{
        key: category.key,
        label: category.label,
        color: category.color,
        value,
        year: row.year,
        x,
        y: yTop,
        width: barWidth,
        height: Math.max(1, yBottom - yTop),
      }]
    })
    return { year: row.year, x, width: barWidth, segments }
  })

  const yTicksRaw = [0, domainMax * 0.25, domainMax * 0.5, domainMax * 0.75, domainMax]
  const yTicks = yTicksRaw.map((value) => ({
    label: Math.round(value).toLocaleString('pt-BR'),
    y: yScale(value),
  }))

  return { categories: visibleCategories, rows, yTicks }
}

function niceMax(value) {
  if (!Number.isFinite(value) || value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const scaled = value / power
  if (scaled <= 1) return power
  if (scaled <= 2) return 2 * power
  if (scaled <= 5) return 5 * power
  return 10 * power
}
