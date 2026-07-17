import { useId, useMemo, useState } from 'react'
import { closeChartTooltipOnEscape } from '../utils/chartVisuals'
import { ChartLegend, ChartTooltip } from './ChartPrimitives'

const CHART_WIDTH = 980
const CHART_HEIGHT = 224
const PADDING = { bottom: 34, left: 68, right: 54, top: 18 }
const COUNT_TICK_COUNT = 4

const countFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
})

const legendItems = [
  { color: 'var(--chart-series-1)', key: 'enrolled', label: 'Matrículas' },
  { color: 'var(--chart-series-2)', key: 'unattended', label: 'População não atendida', opacity: 0.34 },
  { color: 'var(--surface-ink)', dashed: true, key: 'percent', label: 'Atendimento (%)' },
  { color: 'var(--chart-series-3)', dashed: true, key: 'target', label: 'Meta' },
]

export function PopulationCoverageChart({
  denominatorLabel = 'População de referência',
  meta,
  referenceLabel = 'Meta',
  series,
  title = 'Matrículas, população e atendimento',
}) {
  const [activePoint, setActivePoint] = useState(null)
  const rawDescriptionId = useId()
  const descriptionId = `population-coverage-description-${rawDescriptionId.replace(/:/g, '')}`
  const chart = useMemo(() => buildChartModel(series, meta), [meta, series])

  if (!chart) return null

  const description = [
    'Colunas empilhadas anuais com matrículas e população não atendida.',
    `A altura completa representa ${lowercaseFirst(denominatorLabel)}.`,
    'A linha pontilhada representa o percentual de atendimento.',
    chart.metaLine ? `A linha horizontal representa ${referenceLabel.toLocaleLowerCase('pt-BR')} de ${formatPercent(chart.metaLine.value)}.` : null,
  ].filter(Boolean).join(' ')

  return (
    <section className="history-chart population-coverage-chart">
      <div className="history-chart__heading population-coverage-chart__heading">
        <div>
          <span className="eyebrow">Composição do atendimento</span>
          <h4>{title}</h4>
          <p className="history-chart__subtitle">
            A coluna completa representa a população de referência; a linha mostra o percentual atendido.
          </p>
        </div>
      </div>

      <ChartLegend className="population-coverage-chart__legend" items={legendItems} />

      <div
        aria-label="Gráfico com rolagem horizontal em telas estreitas"
        className="history-chart__canvas population-coverage-chart__canvas"
        role="region"
        tabIndex="0"
      >
        <div className="population-coverage-chart__stage">
          <svg
            aria-describedby={descriptionId}
            aria-label={`${title}: matrículas, população não atendida e percentual por ano`}
            role="img"
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          >
            <desc id={descriptionId}>{description}</desc>

            <g className="chart-grid population-coverage-chart__count-grid">
              {chart.countTicks.map((tick) => (
                <g key={tick.value}>
                  <line
                    x1={PADDING.left}
                    x2={CHART_WIDTH - PADDING.right}
                    y1={tick.y}
                    y2={tick.y}
                  />
                  <text x={PADDING.left - 12} y={tick.y + 4}>
                    {formatCompactCount(tick.value)}
                  </text>
                </g>
              ))}
            </g>

            <g className="population-coverage-chart__percent-axis">
              {chart.percentTicks.map((tick) => (
                <text
                  key={tick.value}
                  textAnchor="start"
                  x={CHART_WIDTH - PADDING.right + 10}
                  y={tick.y + 4}
                >
                  {tick.value}%
                </text>
              ))}
            </g>

            <g className="chart-axis">
              <line
                className="chart-axis__x"
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={CHART_HEIGHT - PADDING.bottom}
                y2={CHART_HEIGHT - PADDING.bottom}
              />
            </g>

            <g className="population-coverage-chart__axis-units" aria-hidden="true">
              <text x={PADDING.left} y={12}>Pessoas</text>
              <text textAnchor="end" x={CHART_WIDTH - PADDING.right + 32} y={12}>%</text>
            </g>

            <g className="population-coverage-chart__bars">
              {chart.points.map((point) => (
                <g className={activePoint?.year === point.year ? 'is-active' : undefined} key={point.year}>
                  <rect
                    className="population-coverage-chart__bar population-coverage-chart__bar--enrolled"
                    height={point.enrolledHeight}
                    width={chart.barWidth}
                    x={point.x - chart.barWidth / 2}
                    y={point.enrolledY}
                  />
                  <rect
                    className="population-coverage-chart__bar population-coverage-chart__bar--unattended"
                    height={point.unattendedHeight}
                    width={chart.barWidth}
                    x={point.x - chart.barWidth / 2}
                    y={point.populationY}
                  />
                </g>
              ))}
            </g>

            {chart.metaLine ? (
              <g className="population-coverage-chart__meta-line">
                <line
                  x1={PADDING.left}
                  x2={CHART_WIDTH - PADDING.right}
                  y1={chart.metaLine.y}
                  y2={chart.metaLine.y}
                />
                <text
                  textAnchor="end"
                  x={CHART_WIDTH - PADDING.right - 6}
                  y={chart.metaLine.labelY}
                >
                  {referenceLabel} {formatPercent(chart.metaLine.value)}
                </text>
              </g>
            ) : null}

            <path className="population-coverage-chart__percent-line" d={chart.percentPath} />

            <g className="population-coverage-chart__percent-points">
              {chart.points.map((point) => (
                <circle
                  className={activePoint?.year === point.year ? 'is-active' : undefined}
                  cx={point.x}
                  cy={point.percentY}
                  key={point.year}
                  r={activePoint?.year === point.year ? 4.5 : 3.5}
                />
              ))}
            </g>

            <text
              className="population-coverage-chart__latest-percent"
              textAnchor="end"
              x={chart.latestLabel.x}
              y={chart.latestLabel.y}
            >
              {formatPercent(chart.latestLabel.value)}
            </text>

            <g className="chart-x-labels">
              {chart.yearTicks.map((tick) => (
                <text key={tick.year} textAnchor="middle" x={tick.x} y={CHART_HEIGHT - 10}>
                  {tick.year}
                </text>
              ))}
            </g>

            <g className="population-coverage-chart__hit-areas">
              {chart.points.map((point) => (
                <rect
                  aria-label={`${point.year}: ${formatCount(point.enrolled)} matrículas; ${formatCount(point.unattended)} pessoas não atendidas; população total de ${formatCount(point.population)}; ${formatPercent(point.percent)} de atendimento.`}
                  className="population-coverage-chart__hit-area"
                  height={chart.plotHeight}
                  key={point.year}
                  onBlur={() => setActivePoint(null)}
                  onFocus={() => setActivePoint(point)}
                  onKeyDown={(event) => closeChartTooltipOnEscape(event, () => setActivePoint(null))}
                  onMouseEnter={() => setActivePoint(point)}
                  onMouseLeave={() => setActivePoint(null)}
                  tabIndex="0"
                  width={chart.bandWidth}
                  x={point.x - chart.bandWidth / 2}
                  y={PADDING.top}
                />
              ))}
            </g>
          </svg>

          {activePoint ? (
            <ChartTooltip
              className="population-coverage-chart__tooltip"
              items={[
                { color: 'var(--chart-series-1)', key: 'enrolled', label: 'Matrículas', value: formatCount(activePoint.enrolled) },
                { color: 'var(--chart-series-2)', key: 'unattended', label: 'Não atendida', value: formatCount(activePoint.unattended) },
                { key: 'population', label: 'População total', value: formatCount(activePoint.population) },
                { color: 'var(--surface-ink)', dashed: true, key: 'percent', label: 'Atendimento', value: formatPercent(activePoint.percent) },
              ]}
              label={activePoint.year}
              style={{
                left: `${Math.min(92, Math.max(8, (activePoint.x / CHART_WIDTH) * 100))}%`,
                top: `${Math.min(activePoint.populationY, activePoint.percentY) / CHART_HEIGHT * 100}%`,
                transform: Math.min(activePoint.populationY, activePoint.percentY) < 92
                  ? 'translate(-50%, 12px)'
                  : 'translate(-50%, calc(-100% - 12px))',
              }}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function buildChartModel(series, meta) {
  if (!Array.isArray(series) || series.length < 2) return null

  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
  const bandWidth = plotWidth / series.length
  const barWidth = Math.min(44, Math.max(18, bandWidth * 0.58))
  const countMaximum = niceMaximum(Math.max(...series.map((point) => point.population)))
  const countScale = (value) => PADDING.top + (1 - value / countMaximum) * plotHeight
  const percentScale = (value) => PADDING.top + (1 - value / 100) * plotHeight

  const points = series.map((point, index) => {
    const x = PADDING.left + bandWidth * (index + 0.5)
    const enrolledY = countScale(point.enrolled)
    const populationY = countScale(point.population)

    return {
      ...point,
      enrolledHeight: CHART_HEIGHT - PADDING.bottom - enrolledY,
      enrolledY,
      percentY: percentScale(point.percent),
      populationY,
      unattendedHeight: enrolledY - populationY,
      x,
    }
  })

  const numericMeta = Number(meta)
  const hasMeta = meta !== null && meta !== undefined && meta !== '' && Number.isFinite(numericMeta) && numericMeta >= 0 && numericMeta <= 100
  const metaY = hasMeta ? percentScale(numericMeta) : null
  const latestPoint = points.at(-1)
  const latestLabelY = metaY !== null && Math.abs(metaY - latestPoint.percentY) < 16
    ? Math.min(CHART_HEIGHT - PADDING.bottom - 8, latestPoint.percentY + 16)
    : Math.max(PADDING.top + 12, latestPoint.percentY - 8)

  return {
    bandWidth,
    barWidth,
    countTicks: Array.from({ length: COUNT_TICK_COUNT }, (_, index) => {
      const value = countMaximum * index / (COUNT_TICK_COUNT - 1)
      return { value, y: countScale(value) }
    }),
    latestLabel: { value: latestPoint.percent, x: latestPoint.x - 8, y: latestLabelY },
    metaLine: hasMeta
      ? {
          labelY: Math.max(PADDING.top + 11, metaY - 6),
          value: numericMeta,
          y: metaY,
        }
      : null,
    percentPath: points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.percentY.toFixed(1)}`)
      .join(' '),
    percentTicks: [0, 50, 100].map((value) => ({ value, y: percentScale(value) })),
    plotHeight,
    points,
    yearTicks: selectYearTicks(points),
  }
}

function selectYearTicks(points) {
  if (points.length <= 8) return points
  return points.filter((point, index) => index % 2 === 0 || index === points.length - 1)
}

function niceMaximum(value) {
  if (!Number.isFinite(value) || value <= 0) return 1
  const roughStep = value / (COUNT_TICK_COUNT - 1)
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const residual = roughStep / magnitude
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10
  return niceResidual * magnitude * (COUNT_TICK_COUNT - 1)
}

function lowercaseFirst(value) {
  if (!value) return 'a população de referência'
  return `${value.charAt(0).toLocaleLowerCase('pt-BR')}${value.slice(1)}`
}

function formatCompactCount(value) {
  const absolute = Math.abs(value)
  if (absolute >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  }
  if (absolute >= 1_000) {
    return `${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  }
  return countFormatter.format(value)
}

function formatCount(value) {
  return countFormatter.format(value)
}

function formatPercent(value) {
  return `${percentFormatter.format(value)}%`
}

