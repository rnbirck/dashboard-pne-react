import { useMemo } from 'react'

const CHART_WIDTH = 600
const CHART_HEIGHT = 300
const PADDING = { top: 28, right: 28, bottom: 58, left: 64 }

const ALL_DEPENDENCY_KEYS = [
  { key: 'federal', label: 'Federal', color: '#ea580c' },
  { key: 'estadual', label: 'Estadual', color: '#7c3aed' },
  { key: 'municipal', label: 'Municipal', color: '#2563eb' },
  { key: 'privada', label: 'Privada', color: '#db2777' },
]

function formatNumber(value, unit) {
  if (!Number.isFinite(value)) return '-'
  if (unit === '%') {
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
  }
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function roundUp(value) {
  if (!Number.isFinite(value) || value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

function shouldShowYearLabel(index, total) {
  const lastIndex = total - 1
  if (index === 0 || index === lastIndex) return true
  if (total <= 8) return true
  return index % 2 === 0 && index < lastIndex - 1
}

export function AdministrativeDependencyChart({
  series,
  title = 'Por dependência administrativa',
  unit = '',
  valueType,
}) {
  const isPercent = valueType === 'percent' || unit === '%'

  const activeKeys = useMemo(() => {
    if (!series || series.length === 0) return []
    return ALL_DEPENDENCY_KEYS.filter((dep) =>
      series.some((p) => Number(p?.[dep.key]) > 0)
    )
  }, [series])

  const rows = useMemo(() => {
    if (activeKeys.length === 0) return []
    return (series ?? [])
      .map((p) => {
        const row = { year: Number(p?.ano) }
        for (const dep of activeKeys) {
          row[dep.key] = Number(p?.[dep.key]) || 0
        }
        return row
      })
      .filter((p) => Number.isFinite(p.year))
      .sort((a, b) => a.year - b.year)
  }, [series, activeKeys])

  if (rows.length === 0 || activeKeys.length === 0) return null

  const totals = rows.map((r) => activeKeys.reduce((sum, dep) => sum + r[dep.key], 0))
  const values = rows.flatMap((row) => activeKeys.map((dep) => row[dep.key]))
  const maxValue = isPercent ? Math.max(...values, 1) : roundUp(Math.max(...totals, 1) * 1.1)

  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
  const barSlot = plotWidth / (rows.length || 1)
  const barWidth = Math.min(barSlot * 0.58, 42)
  const minYear = rows[0].year
  const maxYear = rows[rows.length - 1].year
  const yearSpan = Math.max(maxYear - minYear, 1)
  const xScale = (year) => PADDING.left + ((year - minYear) / yearSpan) * plotWidth
  const yScale = (value) =>
    PADDING.top + plotHeight - (value / Math.max(maxValue, 1)) * plotHeight

  return (
    <section className="complementary-chart complementary-chart--dependency">
      <div className="complementary-chart__heading">
        <span className="eyebrow">{title}</span>
        {unit ? <small>{unit}</small> : null}
      </div>
      <div className="complementary-chart__legend complementary-chart__legend--top">
        {activeKeys.map((dep) => (
          <span key={dep.key} className="complementary-chart__legend-item">
            <span className="complementary-chart__legend-swatch" style={{ backgroundColor: dep.color }} />
            {dep.label}
          </span>
        ))}
      </div>
      <div className="complementary-chart__canvas">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${title}: evolução por dependência administrativa`}>
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = PADDING.top + plotHeight * ratio
            return (
              <line
                className="complementary-chart__gridline"
                key={ratio}
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={y}
                y2={y}
              />
            )
          })}
          <line
            x1={PADDING.left}
            x2={CHART_WIDTH - PADDING.right}
            y1={CHART_HEIGHT - PADDING.bottom}
            y2={CHART_HEIGHT - PADDING.bottom}
            className="complementary-chart__axis"
          />
          <line
            x1={PADDING.left}
            x2={PADDING.left}
            y1={PADDING.top}
            y2={CHART_HEIGHT - PADDING.bottom}
            className="complementary-chart__axis"
          />

          <text x={PADDING.left - 10} y={PADDING.top + 6} textAnchor="end" className="complementary-chart__tick">
            {formatNumber(maxValue, unit)}
          </text>
          <text x={PADDING.left - 10} y={CHART_HEIGHT - PADDING.bottom} textAnchor="end" className="complementary-chart__tick">
            0
          </text>

          {isPercent ? (
            <>
              {activeKeys.map((dep) => {
                const points = rows
                  .filter((row) => row[dep.key] > 0)
                  .map((row) => ({
                    year: row.year,
                    x: xScale(row.year),
                    y: yScale(row[dep.key]),
                    value: row[dep.key],
                  }))
                if (points.length === 0) return null
                const pathD = points
                  .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                  .join(' ')
                return (
                  <g key={dep.key}>
                    <path d={pathD} fill="none" stroke={dep.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                    {points.map((point) => (
                      <circle key={`${dep.key}-${point.year}`} cx={point.x} cy={point.y} r={3.8} fill={dep.color} stroke="#ffffff" strokeWidth="1.5">
                        <title>{`${dep.label} ${point.year}: ${formatNumber(point.value, unit)}`}</title>
                      </circle>
                    ))}
                  </g>
                )
              })}
              {rows.map((row, index) => {
                if (!shouldShowYearLabel(index, rows.length)) return null
                const x = xScale(row.year)
                const anchor = index === 0 ? 'start' : index === rows.length - 1 ? 'end' : 'middle'
                const dx = index === 0 ? 6 : index === rows.length - 1 ? -6 : 0
                return (
                  <text
                    key={row.year}
                    x={x + dx}
                    y={CHART_HEIGHT - PADDING.bottom + 18}
                    textAnchor={anchor}
                    className="complementary-chart__x-label"
                  >
                    {row.year}
                  </text>
                )
              })}
            </>
          ) : (
            rows.map((row, index) => {
              const x = PADDING.left + index * barSlot + (barSlot - barWidth) / 2
              let y = CHART_HEIGHT - PADDING.bottom
              return (
                <g key={row.year}>
                  {activeKeys.map((dep) => {
                    const value = row[dep.key]
                    if (value <= 0) return null
                    const rawBarHeight = (value / Math.max(maxValue, 1)) * plotHeight
                    const barHeight = Math.max(rawBarHeight, 3)
                    const segmentY = y - barHeight
                    const segment = (
                      <rect
                        key={dep.key}
                        x={x}
                        y={segmentY}
                        width={barWidth}
                        height={barHeight}
                        fill={dep.color}
                        opacity={rawBarHeight < 3 ? 0.82 : 1}
                        rx={3}
                      >
                        <title>{`${dep.label} ${row.year}: ${formatNumber(value, unit)}`}</title>
                      </rect>
                    )
                    y = segmentY
                    return segment
                  })}
                  {shouldShowYearLabel(index, rows.length) ? (
                    <text
                      x={x + barWidth / 2}
                      y={CHART_HEIGHT - PADDING.bottom + 18}
                      textAnchor="middle"
                      className="complementary-chart__x-label"
                    >
                      {row.year}
                    </text>
                  ) : null}
                </g>
              )
            })
          )}
        </svg>
      </div>
    </section>
  )
}
