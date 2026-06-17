import { useMemo } from 'react'

const CHART_WIDTH = 600
const CHART_HEIGHT = 240
const PADDING = { top: 24, right: 24, bottom: 44, left: 64 }

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

export function ComplementaryEnrollmentChart({ series, title = 'Matrículas em creche', unit = 'Matrículas' }) {
  const points = useMemo(() => {
    return (series ?? [])
      .map((p) => ({ year: Number(p?.ano), value: Number(p?.valor) }))
      .filter((p) => Number.isFinite(p.year) && Number.isFinite(p.value))
      .sort((a, b) => a.year - b.year)
  }, [series])

  if (points.length === 0) return null

  const values = points.map((p) => p.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueSpan = maxValue - minValue || 1

  const minYear = points[0].year
  const maxYear = points[points.length - 1].year
  const yearSpan = Math.max(maxYear - minYear, 1)

  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const xScale = (year) => PADDING.left + ((year - minYear) / yearSpan) * plotWidth
  const yScale = (value) =>
    PADDING.top + plotHeight - ((value - minValue) / valueSpan) * plotHeight

  const baselineY = CHART_HEIGHT - PADDING.bottom

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.year).toFixed(1)} ${yScale(p.value).toFixed(1)}`)
    .join(' ')

  const areaD = `${pathD} L${xScale(maxYear).toFixed(1)} ${baselineY.toFixed(1)} L${xScale(minYear).toFixed(1)} ${baselineY.toFixed(1)} Z`

  return (
    <section className="complementary-chart">
      <div className="complementary-chart__heading">
        <span className="eyebrow">{title}</span>
        <small>{unit}</small>
      </div>
      <div className="complementary-chart__canvas">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${title}: evolução por ano`}>
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
            {formatNumber(maxValue)}
          </text>
          <text x={PADDING.left - 10} y={CHART_HEIGHT - PADDING.bottom} textAnchor="end" className="complementary-chart__tick">
            {formatNumber(minValue)}
          </text>

          <path d={areaD} className="complementary-chart__area" />
          <path d={pathD} className="complementary-chart__line" />

          {points.map((p) => (
            <g key={p.year}>
              <circle
                cx={xScale(p.year)}
                cy={yScale(p.value)}
                r={4}
                className="complementary-chart__point"
              />
              <title>{`${p.year}: ${formatNumber(p.value)}`}</title>
            </g>
          ))}

          {points.map((p, i) => {
            if (!shouldShowYearLabel(i, points.length)) return null
            const x = xScale(p.year)
            const anchor = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'
            const dx = i === 0 ? 6 : i === points.length - 1 ? -6 : 0
            return (
              <text
                key={`label-${p.year}`}
                x={x + dx}
                y={CHART_HEIGHT - 16}
                textAnchor={anchor}
                className="complementary-chart__x-label"
              >
                {p.year}
              </text>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
