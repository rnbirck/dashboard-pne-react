import { useMemo } from 'react'

const CHART_WIDTH = 600
const CHART_HEIGHT = 240
const PADDING = { top: 24, right: 24, bottom: 60, left: 64 }

const DEPENDENCY_KEYS = [
  { key: 'municipal', label: 'Municipal', color: '#2563eb' },
  { key: 'estadual', label: 'Estadual', color: '#7c3aed' },
  { key: 'privada', label: 'Privada', color: '#db2777' },
  { key: 'federal', label: 'Federal', color: '#ea580c' },
]

function formatNumber(value) {
  if (!Number.isFinite(value)) return '-'
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function shouldShowYearLabel(index, total) {
  const lastIndex = total - 1
  if (index === 0 || index === lastIndex) return true
  if (total <= 8) return true
  return index % 2 === 0 && index < lastIndex - 1
}

export function AdministrativeDependencyChart({ series, title = 'Por dependência administrativa' }) {
  const rows = useMemo(() => {
    return (series ?? [])
      .map((p) => ({
        year: Number(p?.ano),
        municipal: Number(p?.municipal) || 0,
        estadual: Number(p?.estadual) || 0,
        privada: Number(p?.privada) || 0,
        federal: Number(p?.federal) || 0,
      }))
      .filter((p) => Number.isFinite(p.year))
      .sort((a, b) => a.year - b.year)
  }, [series])

  if (rows.length === 0) return null

  const totals = rows.map((r) => r.municipal + r.estadual + r.privada + r.federal)
  const maxTotal = Math.max(...totals)

  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
  const barSlot = plotWidth / (rows.length || 1)
  const barWidth = Math.min(barSlot * 0.6, 48)

  return (
    <section className="complementary-chart">
      <div className="complementary-chart__heading">
        <span className="eyebrow">{title}</span>
      </div>
      <div className="complementary-chart__canvas">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${title}: evolução por dependência administrativa`}>
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
            {formatNumber(maxTotal)}
          </text>
          <text x={PADDING.left - 10} y={CHART_HEIGHT - PADDING.bottom} textAnchor="end" className="complementary-chart__tick">
            0
          </text>

          {rows.map((row, index) => {
            const x = PADDING.left + index * barSlot + (barSlot - barWidth) / 2
            let y = CHART_HEIGHT - PADDING.bottom
            return (
              <g key={row.year}>
                {DEPENDENCY_KEYS.map((dep) => {
                  const value = row[dep.key]
                  const barHeight = (value / Math.max(maxTotal, 1)) * plotHeight
                  const segmentY = y - barHeight
                  const segment = (
                    <rect
                      key={dep.key}
                      x={x}
                      y={segmentY}
                      width={barWidth}
                      height={barHeight}
                      fill={dep.color}
                      rx={2}
                    >
                      <title>{`${dep.label} ${row.year}: ${formatNumber(value)}`}</title>
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
          })}
        </svg>
      </div>
      <div className="complementary-chart__legend">
        {DEPENDENCY_KEYS.map((dep) => (
          <span key={dep.key} className="complementary-chart__legend-item">
            <span className="complementary-chart__legend-swatch" style={{ backgroundColor: dep.color }} />
            {dep.label}
          </span>
        ))}
      </div>
    </section>
  )
}
