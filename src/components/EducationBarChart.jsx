import { useMemo, useState } from 'react'
import { isMissing } from '../utils/educationFormatters'

const CHART_WIDTH = 820
const BAR_GAP = 12
const BAR_ROW_HEIGHT = 36
const PADDING = { top: 18, right: 120, bottom: 28, left: 220 }

export function EducationBarChart({
  data,
  title,
  color = '#2563eb',
  formatLabel = (v) => String(v),
  preserveOrder = false,
}) {
  const [activeBar, setActiveBar] = useState(null)
  const chart = useMemo(
    () => buildBars(data, formatLabel, preserveOrder),
    [data, formatLabel, preserveOrder],
  )

  if (!chart || chart.bars.length === 0) {
    return (
      <div className="education-chart-empty">
        <p>Não há dados suficientes para exibir o gráfico.</p>
      </div>
    )
  }

  const chartHeight = PADDING.top + PADDING.bottom + chart.bars.length * BAR_ROW_HEIGHT

  return (
    <div className="education-chart education-chart--bar">
      {title && <h4 className="education-chart__title">{title}</h4>}
      <div className="education-chart__canvas">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${chartHeight}`} role="img" aria-label={title || 'Gráfico de barras'}>
          <g className="chart-grid">
            {chart.xTicks.map((tick, i) => (
              <g key={`x-${i}`}>
                <line x1={tick.x} x2={tick.x} y1={PADDING.top - 4} y2={chartHeight - PADDING.bottom + 4} stroke="#e8ede4" strokeWidth="1" />
                <text x={tick.x} y={chartHeight - 3} textAnchor="middle" className="chart-axis-label">{tick.label}</text>
              </g>
            ))}
          </g>
          {chart.bars.map((bar, i) => (
            <g key={`bar-${i}`}>
              <text x={PADDING.left - 12} y={bar.y + 15} textAnchor="end" className="chart-bar-cat">{bar.category}</text>
              <rect
                x={PADDING.left}
                y={bar.y}
                width={bar.width}
                height={BAR_ROW_HEIGHT - BAR_GAP}
                fill={color}
                fillOpacity={activeBar?.index === i ? '1' : '0.86'}
                rx="4"
                onMouseEnter={() => setActiveBar(bar)}
                onMouseLeave={() => setActiveBar(null)}
                style={{ cursor: 'pointer', transition: 'fill-opacity 0.12s' }}
              />
              <text x={PADDING.left + bar.width + 8} y={bar.y + 15} textAnchor="start" className="chart-bar-label">{bar.label}</text>
            </g>
          ))}
          <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={chartHeight - PADDING.bottom} y2={chartHeight - PADDING.bottom} stroke="#c4ccc0" strokeWidth="1" />
        </svg>
        {activeBar && (
          <div
            className="education-chart__tooltip education-chart__tooltip--bar"
            style={{
              left: `${Math.min(88, Math.max(18, ((PADDING.left + activeBar.width) / CHART_WIDTH) * 100))}%`,
              top: `${Math.min(82, Math.max(14, ((activeBar.y + 8) / chartHeight) * 100))}%`,
            }}
          >
            <strong>{activeBar.fullCategory}</strong>
            <span>{formatLabel(activeBar.rawValue)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function buildBars(data, formatLabel, preserveOrder) {
  if (!Array.isArray(data) || data.length === 0) return null
  const filteredData = data
    .filter((d) => !isMissing(d.value) && Number(d.value) >= 0)
  const filtered = preserveOrder
    ? filteredData
    : filteredData.sort((a, b) => Number(b.value) - Number(a.value))
  if (filtered.length === 0) return null

  const maxVal = Math.max(...filtered.map((d) => Number(d.value)), 1)
  const plotW = CHART_WIDTH - PADDING.left - PADDING.right
  const bars = filtered.map((d, i) => {
    const value = Number(d.value)
    return {
      index: i,
      y: PADDING.top + i * BAR_ROW_HEIGHT,
      width: (value / maxVal) * plotW,
      category: shortenLabel(d.label),
      fullCategory: d.label,
      label: formatLabel(value),
      rawValue: value,
    }
  })
  const xTicksRaw = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal]
  const xTicks = xTicksRaw.map((val) => ({
    label: Math.round(val).toLocaleString('pt-BR'),
    x: PADDING.left + (val / maxVal) * plotW,
  }))
  return { bars, xTicks }
}

function shortenLabel(label) {
  if (!label || label.length <= 34) return label
  return `${label.slice(0, 31)}...`
}
