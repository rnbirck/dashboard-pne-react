import { useMemo, useState } from 'react'
import { closeChartTooltipOnEscape } from '../utils/chartVisuals'
import { ChartLegend, ChartTooltip } from './ChartPrimitives'

const CHART_WIDTH = 980
const CHART_HEIGHT = 260
const PADDING = { top: 28, right: 28, bottom: 58, left: 64 }

const ALL_DEPENDENCY_KEYS = [
  { key: 'federal', label: 'Federal', color: 'var(--chart-series-1)', opacity: 1 },
  { key: 'estadual', label: 'Estadual', color: 'var(--chart-series-2)', opacity: 1 },
  { key: 'municipal', label: 'Municipal', color: 'var(--chart-series-3)', opacity: 1 },
  { key: 'privada', label: 'Privada', color: 'var(--chart-series-4)', opacity: 1 },
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
  const step = magnitude >= 1000
    ? magnitude / 10
    : magnitude >= 100
      ? 50
      : magnitude >= 10
        ? 5
        : 1
  return Math.ceil(value / step) * step
}

function shouldShowYearLabel(index, total) {
  const lastIndex = total - 1
  if (index === 0 || index === lastIndex) return true
  if (total <= 8) return true
  return index % 2 === 0 && index < lastIndex - 1
}

export function AdministrativeDependencyChart({
  series,
  showHeading = true,
  title = 'Por dependência administrativa',
  unit = '',
  valueType,
}) {
  const [activePoint, setActivePoint] = useState(null)
  const isPercent = valueType === 'percent' || unit === '%'

  const activeKeys = useMemo(() => {
    if (!series || series.length === 0) return []
    return ALL_DEPENDENCY_KEYS.filter((dep) =>
      series.some((p) => {
        const v = p?.[dep.key]
        return v !== null && v !== undefined && Number(v) > 0
      })
    )
  }, [series])

  const rawRows = useMemo(() => {
    if (activeKeys.length === 0) return []
    return (series ?? [])
      .map((p) => {
        const row = { year: Number(p?.ano) }
        for (const dep of activeKeys) {
          row[dep.key] = p?.[dep.key] !== null && p?.[dep.key] !== undefined ? Number(p[dep.key]) : null
        }
        return row
      })
      .filter((p) => Number.isFinite(p.year))
      .sort((a, b) => a.year - b.year)
  }, [series, activeKeys])

  if (rawRows.length === 0 || activeKeys.length === 0) return null

  const rows = rawRows
  const allHaveAnyValue = rows.some((r) => activeKeys.some((dep) => Number.isFinite(r[dep.key])))
  if (!allHaveAnyValue) return null

  const totals = rows.map((r) => activeKeys.reduce((sum, dep) => sum + (Number.isFinite(r[dep.key]) ? r[dep.key] : 0), 0))
  const values = rows.flatMap((row) => activeKeys.map((dep) => Number.isFinite(row[dep.key]) ? row[dep.key] : 0))
  const maxValue = isPercent
    ? Math.min(100, roundUp(Math.max(...values, 1) * 1.1))
    : roundUp(Math.max(...totals, 1) * 1.1)

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

  const clearActive = () => setActivePoint(null)
  const formatTooltipValue = (value) => {
    const formatted = formatNumber(value, unit)
    if (!unit || unit === '%') return formatted
    return `${formatted} ${unit.toLocaleLowerCase('pt-BR')}`
  }

  return (
    <section className="complementary-chart complementary-chart--dependency">
      {showHeading ? (
        <div className="complementary-chart__heading">
          <span className="eyebrow">{title}</span>
        </div>
      ) : null}
      {activeKeys.length > 1 ? (
        <ChartLegend className="complementary-chart__legend complementary-chart__legend--top" items={activeKeys} />
      ) : null}
      <div className="complementary-chart__canvas">
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${title}: histórico do indicador por dependência administrativa`}>
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
            className="complementary-chart__axis complementary-chart__axis--x"
          />
          <line
            x1={PADDING.left}
            x2={PADDING.left}
            y1={PADDING.top}
            y2={CHART_HEIGHT - PADDING.bottom}
            className="complementary-chart__axis complementary-chart__axis--y"
          />

          <text x={PADDING.left - 10} y={PADDING.top + 6} textAnchor="end" className="complementary-chart__tick">
            {formatNumber(maxValue, unit)}
          </text>
          <text x={PADDING.left - 10} y={CHART_HEIGHT - PADDING.bottom} textAnchor="end" className="complementary-chart__tick">
            0
          </text>

          {activePoint ? (
            <line
              className="complementary-chart__hover-line"
              x1={activePoint.x}
              x2={activePoint.x}
              y1={PADDING.top}
              y2={CHART_HEIGHT - PADDING.bottom}
            />
          ) : null}

          {isPercent ? (
            <>
              {activeKeys.map((dep) => {
                const allPoints = rows
                  .map((row) => ({
                    color: dep.color,
                    dependency: dep.label,
                    value: row[dep.key],
                    year: row.year,
                    x: xScale(row.year),
                    y: Number.isFinite(row[dep.key]) ? yScale(row[dep.key]) : null,
                  }))
                const segments = []
                let current = []
                for (const p of allPoints) {
                  if (!Number.isFinite(p.value)) {
                    if (current.length > 0) {
                      segments.push(current)
                      current = []
                    }
                    continue
                  }
                  current.push(p)
                }
                if (current.length > 0) segments.push(current)
                if (segments.length === 0) return null
                return (
                  <g key={dep.key}>
                    {segments.map((seg, si) => {
                      const pathD = seg
                        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                        .join(' ')
                      return (
                        <path key={si} d={pathD} fill="none" stroke={dep.color} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={dep.opacity} strokeWidth="2.5" />
                      )
                    })}
                    {allPoints.filter((p) => Number.isFinite(p.value)).map((point) => (
                      <circle
                        aria-label={`${point.dependency} ${point.year}: ${formatTooltipValue(point.value)}`}
                        className={`chart-mark complementary-chart__dependency-point${activePoint?.dependency === point.dependency && activePoint?.year === point.year ? ' is-active' : ''}${point.year === maxYear ? ' is-last' : ''}`}
                        cx={point.x}
                        cy={point.y}
                        fill={point.color}
                        key={`${dep.key}-${point.year}`}
                        opacity={activePoint?.dependency === point.dependency && activePoint?.year === point.year ? 1 : dep.opacity}
                        onBlur={clearActive}
                        onFocus={() => setActivePoint(point)}
                        onMouseEnter={() => setActivePoint(point)}
                        onMouseLeave={clearActive}
                        onKeyDown={(event) => closeChartTooltipOnEscape(event, clearActive)}
                        r={activePoint?.dependency === point.dependency && activePoint?.year === point.year ? 5 : point.year === maxYear ? 4.3 : 3.8}
                        tabIndex="0"
                      />
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
                    if (!Number.isFinite(value) || value <= 0) return null
                    const rawBarHeight = (value / Math.max(maxValue, 1)) * plotHeight
                    const barHeight = Math.max(rawBarHeight, 3)
                    const segmentY = y - barHeight
                    const point = {
                      color: dep.color,
                      dependency: dep.label,
                      value,
                      year: row.year,
                      x: x + barWidth / 2,
                      y: segmentY + barHeight / 2,
                    }
                    const isActive =
                      activePoint?.dependency === point.dependency &&
                      activePoint?.year === point.year
                    const segment = (
                      <rect
                        aria-label={`${dep.label} ${row.year}: ${formatTooltipValue(value)}`}
                        className={`chart-mark complementary-chart__bar-segment${isActive ? ' is-active' : ''}`}
                        fill={dep.color}
                        height={barHeight}
                        key={dep.key}
                        onBlur={clearActive}
                        onFocus={() => setActivePoint(point)}
                        onMouseEnter={() => setActivePoint(point)}
                        onMouseLeave={clearActive}
                        onKeyDown={(event) => closeChartTooltipOnEscape(event, clearActive)}
                        opacity={isActive ? 1 : Math.max(dep.opacity, rawBarHeight < 3 ? 0.55 : dep.opacity)}
                        rx={3}
                        tabIndex="0"
                        width={barWidth}
                        x={x}
                        y={segmentY}
                      />
                    )
                    y = segmentY
                    return segment
                  })}
                  {shouldShowYearLabel(index, rows.length) ? (
                    <text
                      key={`label-${row.year}`}
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
        {activePoint ? (
          <ChartTooltip
            className="complementary-chart__tooltip"
            label={activePoint.year}
            series={activePoint.dependency}
            value={formatTooltipValue(activePoint.value)}
            style={{
              left: `${Math.min(92, Math.max(10, (activePoint.x / CHART_WIDTH) * 100))}%`,
              top: `${(activePoint.y / CHART_HEIGHT) * 100}%`,
              transform:
                activePoint.y < PADDING.top + 38
                  ? 'translate(-50%, 12px)'
                  : 'translate(-50%, calc(-100% - 12px))',
            }}
          />
        ) : null}
      </div>
    </section>
  )
}
