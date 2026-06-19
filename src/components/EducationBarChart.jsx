import { useMemo } from 'react'
import { isMissing } from '../utils/educationFormatters'

const BAR_HEIGHT = 200
const PADDING = { top: 16, right: 16, bottom: 40, left: 140 }

export function EducationBarChart({ data, title, color = '#2563eb' }) {
  const chart = useMemo(() => buildBars(data), [data])

  if (!chart || chart.bars.length === 0) {
    return (
      <div className="education-chart-empty">
        <p>Não há dados suficientes para exibir o gráfico.</p>
      </div>
    )
  }

  const totalWidth = PADDING.left + chart.bars.length * 80 + PADDING.right

  return (
    <div className="education-chart education-chart--bar">
      {title && <h4 className="education-chart__title">{title}</h4>}
      <svg viewBox={`0 0 ${totalWidth} ${BAR_HEIGHT}`} role="img" aria-label={title || 'Gráfico de barras'}>
        <g className="chart-grid">
          {chart.yTicks.map((tick, i) => (
            <g key={`y-${i}`}>
              <line
                x1={PADDING.left}
                x2={totalWidth - PADDING.right}
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
        {chart.bars.map((bar, i) => (
          <g key={`bar-${i}`}>
            <rect
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill={color}
              fillOpacity="0.85"
              rx="3"
            />
            <text x={bar.x + bar.width / 2} y={bar.y - 6} textAnchor="middle" className="chart-bar-label">
              {bar.label}
            </text>
            <text x={PADDING.left - 10} y={bar.y + bar.height / 2 + 4} textAnchor="end" className="chart-bar-cat">
              {bar.category}
            </text>
          </g>
        ))}
        <line
          x1={PADDING.left}
          x2={totalWidth - PADDING.right}
          y1={BAR_HEIGHT - PADDING.bottom}
          y2={BAR_HEIGHT - PADDING.bottom}
          stroke="#c4ccc0"
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

function buildBars(data) {
  if (!Array.isArray(data) || data.length === 0) return null

  const filtered = data.filter((d) => !isMissing(d.value) && d.value > 0)
  if (filtered.length === 0) return null

  const maxVal = Math.max(...filtered.map((d) => d.value))
  const plotH = BAR_HEIGHT - PADDING.top - PADDING.bottom

  const bars = filtered.map((d, i) => {
    const height = (d.value / maxVal) * plotH
    const barWidth = 50
    const x = PADDING.left + i * 80 + 15
    const y = BAR_HEIGHT - PADDING.bottom - height
    return {
      x,
      y,
      width: barWidth,
      height,
      category: d.label,
      label: d.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
    }
  })

  const yTicksRaw = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal]
  const yTicks = yTicksRaw.map((val) => ({
    label: Math.round(val).toLocaleString('pt-BR'),
    y: BAR_HEIGHT - PADDING.bottom - (val / maxVal) * plotH,
  }))

  return { bars, yTicks }
}
