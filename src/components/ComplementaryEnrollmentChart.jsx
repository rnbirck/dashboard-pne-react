import { useMemo, useState } from 'react'
import { closeChartTooltipOnEscape } from '../utils/chartVisuals'
import {
  buildPneAbsoluteScale,
  PNE_CHART_GEOMETRY,
  resolvePneAuxiliaryYearTickLimit,
  selectPneYearTicks,
} from '../utils/pneChartSystem'
import { useChartViewport } from '../hooks/useChartViewport'
import { ChartTooltip } from './ChartPrimitives'

const FALLBACK_CHART_WIDTH = 420

function formatNumber(value) {
  if (!Number.isFinite(value)) return '-'
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function shouldShowValueLabel(point, index, points, maxValue) {
  if (index === 0 || index === points.length - 1) return true
  return point.value === maxValue && points.length > 4
}

export function ComplementaryEnrollmentChart({
  series,
  showHeading = true,
  title = 'Matrículas em creche',
  unit = 'Matrículas',
  valueMode = 'legacy',
  valueFormatter,
  maxYearTicks = 6,
}) {
  const [activePoint, setActivePoint] = useState(null)
  const { containerRef, width: chartWidth } = useChartViewport(FALLBACK_CHART_WIDTH)
  const chartHeight = chartWidth < 300
    ? PNE_CHART_GEOMETRY.auxiliary.mobileHeight
    : PNE_CHART_GEOMETRY.auxiliary.desktopHeight
  const padding = PNE_CHART_GEOMETRY.auxiliary.padding
  const formatValue = typeof valueFormatter === 'function' ? valueFormatter : formatNumber
  const displayUnit = valueMode === 'count' ? 'Matrículas' : unit
  const rawPoints = useMemo(() => {
    return (series ?? [])
      .map((p) => ({ year: Number(p?.ano), value: Number(p?.valor) }))
      .filter((p) => Number.isFinite(p.year))
      .sort((a, b) => a.year - b.year)
  }, [series])

  const points = (rawPoints ?? []).filter((p) => Number.isFinite(p.value))

  const allYears = rawPoints.map((p) => p.year)
  const values = points.map((p) => p.value)
  const minValue = 0
  const maxValue = values.length > 0 ? Math.max(...values) : 0
  const yScaleModel = buildPneAbsoluteScale(values)
  const yMax = yScaleModel.domain.max
  const valueSpan = yMax - minValue || 1

  const minYear = allYears.length > 0 ? Math.min(...allYears) : 0
  const maxYear = allYears.length > 0 ? Math.max(...allYears) : 0
  const yearSpan = Math.max(maxYear - minYear, 1)

  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom

  const xScale = (year) => padding.left + ((year - minYear) / yearSpan) * plotWidth
  const yScale = (value) =>
    padding.top + plotHeight - ((value - minValue) / valueSpan) * plotHeight

  const baselineY = chartHeight - padding.bottom

  if (rawPoints.length === 0) return null
  if (points.length === 0) return null

  const segments = buildSegments(rawPoints, xScale, yScale)

  const linePaths = segments.map((seg) =>
    seg
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ')
  )

  const areaPaths = segments
    .filter((seg) => seg.length > 0)
    .map((seg) => {
      const first = seg[0]
      const last = seg[seg.length - 1]
      const path = seg
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' ')
      return `${path} L${last.x.toFixed(1)} ${baselineY.toFixed(1)} L${first.x.toFixed(1)} ${baselineY.toFixed(1)} Z`
    })

  const scaledPoints = rawPoints
    .filter((p) => Number.isFinite(p.value))
    .map((point) => ({
      ...point,
      x: xScale(point.year),
      y: yScale(point.value),
    }))
  const maxPointIndex = scaledPoints.findIndex((point) => point.value === maxValue)
  const lastPointIndex = scaledPoints.length - 1
  const maxPoint = scaledPoints[maxPointIndex]
  const lastPoint = scaledPoints[lastPointIndex]
  const crowdedFinalLabels = maxPointIndex !== lastPointIndex
    && Math.abs((maxPoint?.x ?? 0) - (lastPoint?.x ?? 0)) < 60
    && Math.abs((maxPoint?.y ?? 0) - (lastPoint?.y ?? 0)) < 32

  return (
    <section className="complementary-chart">
      {showHeading ? (
        <div className="complementary-chart__heading">
          <span className="eyebrow">{title}</span>
        </div>
      ) : null}
      <div className="complementary-chart__canvas" ref={containerRef}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`${title}: histórico por ano`}>
          {yScaleModel.ticks.map((value) => {
            const y = yScale(value)
            return (
              <g key={value}>
                <line
                  className="complementary-chart__gridline"
                  x1={padding.left}
                  x2={chartWidth - padding.right}
                  y1={y}
                  y2={y}
                />
                <text x={padding.left - 10} y={y + 4} textAnchor="end" className="complementary-chart__tick">
                  {formatValue(value)}
                </text>
              </g>
            )
          })}
          <line
            x1={padding.left}
            x2={chartWidth - padding.right}
            y1={chartHeight - padding.bottom}
            y2={chartHeight - padding.bottom}
            className="complementary-chart__axis complementary-chart__axis--x"
          />
          <line
            x1={padding.left}
            x2={padding.left}
            y1={padding.top}
            y2={chartHeight - padding.bottom}
            className="complementary-chart__axis complementary-chart__axis--y"
          />

          {activePoint ? (
            <line
              className="complementary-chart__hover-line"
              x1={activePoint.x}
              x2={activePoint.x}
              y1={padding.top}
              y2={chartHeight - padding.bottom}
            />
          ) : null}

          {areaPaths.map((d, i) => (
            <path key={`area-${i}`} d={d} className="complementary-chart__area" />
          ))}
          {linePaths.map((d, i) => (
            <path key={`line-${i}`} d={d} className="complementary-chart__line" />
          ))}

          {scaledPoints.map((p, index) => (
            <circle
              aria-label={`${p.year}: ${formatValue(p.value)} ${displayUnit}`}
              className={`chart-mark complementary-chart__point${activePoint?.year === p.year ? ' is-active' : ''}${index === scaledPoints.length - 1 ? ' is-last' : ''}`}
              cx={p.x}
              cy={p.y}
              key={p.year}
              onBlur={() => setActivePoint(null)}
              onFocus={() => setActivePoint(p)}
              onMouseEnter={() => setActivePoint(p)}
              onMouseLeave={() => setActivePoint(null)}
              onKeyDown={(event) => closeChartTooltipOnEscape(event, () => setActivePoint(null))}
              r={activePoint?.year === p.year ? 5 : 4}
              tabIndex="0"
            />
          ))}

          {scaledPoints.map((p, i) => {
            if (!shouldShowValueLabel(p, i, scaledPoints, maxValue)) return null
            const y = crowdedFinalLabels && i === lastPointIndex
              ? Math.min(p.y + 18, baselineY - 8)
              : Math.max(p.y - 10, padding.top + 10)
            const anchor = i === 0 ? 'start' : i === scaledPoints.length - 1 ? 'end' : 'middle'
            return (
              <text
                className="complementary-chart__value-label"
                key={`value-${p.year}`}
                textAnchor={anchor}
                x={p.x}
                y={y}
              >
                {formatValue(p.value)}
              </text>
            )
          })}

          {selectPneYearTicks(
            rawPoints,
            resolvePneAuxiliaryYearTickLimit(chartWidth, maxYearTicks),
          ).map((p, i, arr) => {
            const x = xScale(p.year)
            const anchor = i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'
            const dx = i === 0 ? 6 : i === arr.length - 1 ? -6 : 0
            return (
              <text
                key={`label-${p.year}`}
                x={x + dx}
                y={chartHeight - 14}
                textAnchor={anchor}
                className="complementary-chart__x-label"
              >
                {p.year}
              </text>
            )
          })}
        </svg>
        {activePoint ? (
          <ChartTooltip
            className="complementary-chart__tooltip"
            label={activePoint.year}
            series={title}
            value={`${formatValue(activePoint.value)} ${displayUnit.toLocaleLowerCase('pt-BR')}`}
            style={{
              left: `${Math.min(92, Math.max(10, (activePoint.x / chartWidth) * 100))}%`,
              top: `${(activePoint.y / chartHeight) * 100}%`,
              transform:
                activePoint.y < padding.top + 38
                  ? 'translate(-50%, 12px)'
                  : 'translate(-50%, calc(-100% - 12px))',
            }}
          />
        ) : null}
      </div>
    </section>
  )
}

function buildSegments(rawPoints, xScale, yScale) {
  const segs = []
  let current = []
  for (const p of rawPoints) {
    if (!Number.isFinite(p.value)) {
      if (current.length > 0) {
        segs.push(current)
        current = []
      }
      continue
    }
    current.push({ ...p, x: xScale(p.year), y: yScale(p.value) })
  }
  if (current.length > 0) segs.push(current)
  return segs
}
