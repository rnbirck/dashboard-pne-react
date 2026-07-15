import { useId, useMemo, useRef, useState } from 'react'
import { ChartEmptyState, ChartLegend, ChartTooltip } from './ChartPrimitives'
import { closeChartTooltipOnEscape } from '../utils/chartVisuals'

const CHART_WIDTH = 980
const CHART_HEIGHT = 260
const PADDING = { bottom: 44, left: 64, right: 68, top: 38 }

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
})

export function IndicatorProjectionPanel({ chartLabel, projection, showTitle = true, contextOnly = false }) {
  const [activePoint, setActivePoint] = useState(null)
  const [tabStopYear, setTabStopYear] = useState(null)
  const pointRefs = useRef([])
  const chartId = useId().replace(/:/g, '')

  const chart = useMemo(
    () => buildProjectionChart(projection, {
      chartMinYear: contextOnly ? projection?.historical_years?.[0] : undefined,
      showGoalContext: !contextOnly,
    }),
    [contextOnly, projection],
  )
  const lastChartPointYear = chart.points.filter((point) => point.valid !== false).slice(-1)[0]?.year
  const transitionYear = chart.points.filter((point) => point.valid !== false && !point.isProjected).slice(-1)[0]?.year
  const latestHistoricalPoint = chart.points.filter((point) => point.valid !== false && !point.isProjected).slice(-1)[0]
  const accessibleChartLabel = chartLabel
    ? `${contextOnly ? 'Gráfico de cenário estimado' : 'Gráfico de projeção tendencial'}: ${chartLabel}`
    : contextOnly ? 'Gráfico de cenário estimado' : 'Gráfico de projeção tendencial'
  const focusablePoints = chart.points.filter((point) => point.valid !== false)
  const resolvedTabStopYear = focusablePoints.some((point) => point.year === tabStopYear)
    ? tabStopYear
    : focusablePoints[0]?.year

  function focusPoint(index) {
    const point = focusablePoints[index]
    if (!point) return
    setTabStopYear(point.year)
    pointRefs.current[index]?.focus()
  }

  function handlePointKeyDown(event, index) {
    if (event.key === 'Escape') {
      closeChartTooltipOnEscape(event, () => setActivePoint(null))
      return
    }

    let nextIndex = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % focusablePoints.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + focusablePoints.length) % focusablePoints.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = focusablePoints.length - 1
    if (nextIndex === null) return

    event.preventDefault()
    focusPoint(nextIndex)
  }

  if (!projection?.available) {
    return (
      <div className="complementary-projection">
        <ChartEmptyState message="Não há valores para o período selecionado." />
      </div>
    )
  }

  const projected2036 = projection.projected_2036
  const target = contextOnly ? null : projection.target_percent
  const distance = contextOnly ? null : projection.distance_to_target_2036
  const lastHistoricalPct = latestHistoricalPoint?.value ?? null
  const status = projection.status_2036
  const tendeAtingir = status === 'tende_a_atingir'

  return (
    <div className={`complementary-projection${contextOnly ? ' complementary-projection--context' : ''}`}>
      <div className="complementary-projection__header">
        {showTitle ? <h5>{contextOnly ? 'Cenário estimado até 2036' : 'Projeção tendencial até 2036'}</h5> : null}
        {!contextOnly ? (
          <p className="complementary-projection__method">
            Este cenário estima como o indicador pode evoluir até 2036, considerando o
            comportamento recente das matrículas e a tendência populacional projetada para
            a faixa etária no RS. O resultado serve como referência de planejamento e não
            representa uma previsão oficial.
          </p>
        ) : null}
      </div>

      <div className="complementary-projection__cards">
        <div className="complementary-projection__card">
          <span className="complementary-projection__card-label">{contextOnly ? 'Último valor observado' : 'Valor atual'}</span>
          <span className="complementary-projection__card-value">
            {lastHistoricalPct != null
              ? `${percentFormatter.format(lastHistoricalPct)}%${contextOnly && latestHistoricalPoint?.year ? ` (${latestHistoricalPoint.year})` : ''}`
              : '—'}
          </span>
        </div>
        <div className="complementary-projection__card">
          <span className="complementary-projection__card-label">{contextOnly ? 'Cenário estimado em 2036' : 'Projetado em 2036'}</span>
          <span className="complementary-projection__card-value">
            {projected2036 != null ? `${percentFormatter.format(projected2036)}%` : '—'}
          </span>
        </div>
        {!contextOnly ? (
          <>
            <div className="complementary-projection__card">
              <span className="complementary-projection__card-label">Meta PNE 2036</span>
              <span className="complementary-projection__card-value">
                {target != null ? `${percentFormatter.format(target)}%` : '—'}
              </span>
            </div>
            <div className="complementary-projection__card">
              <span className="complementary-projection__card-label">Distância estimada da meta</span>
              <span className={`complementary-projection__card-value ${tendeAtingir ? 'complementary-projection__value--positive' : 'complementary-projection__value--negative'}`}>
                {distance != null ? `${distance >= 0 ? '+' : ''}${percentFormatter.format(distance)} p.p.` : '—'}
              </span>
            </div>
          </>
        ) : null}
      </div>

      {chart.points.length > 0 ? (
        <>
          <ChartLegend
            className="complementary-projection__legend"
            items={[
              { key: 'observed', label: transitionYear ? `Observado até ${transitionYear}` : 'Observado', color: 'var(--chart-primary)' },
              { key: 'projected', label: 'Projetado até 2036', color: contextOnly ? 'var(--chart-series-2)' : 'var(--chart-primary)', dashed: true },
              ...(target != null ? [{ key: 'target', label: 'Meta PNE 2036', color: 'var(--chart-series-3)', dashed: true }] : []),
            ]}
          />
          <div
            className="history-chart__canvas complementary-projection__chart"
            role="region"
            aria-label={chartLabel ? `Área rolável do gráfico: ${chartLabel}` : 'Área rolável do gráfico'}
            tabIndex={0}
          >
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            role="group"
            aria-label={accessibleChartLabel}
          >
            <defs>
              <clipPath id={`proj-clip-${chartId}`}>
                <rect
                  x={PADDING.left}
                  y={PADDING.top}
                  width={CHART_WIDTH - PADDING.left - PADDING.right}
                  height={CHART_HEIGHT - PADDING.top - PADDING.bottom}
                />
              </clipPath>
            </defs>

            <g className="chart-grid" aria-hidden="true">
              {chart.yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={PADDING.left} x2={CHART_WIDTH - PADDING.right}
                    y1={tick.y} y2={tick.y}
                  />
                  <text x={PADDING.left - 12} y={tick.y + 4} textAnchor="end">
                    {tick.label}
                  </text>
                </g>
              ))}
            </g>

            {chart.metaLine && (
              <g className="chart-meta-line" aria-hidden="true">
                <line
                  x1={PADDING.left} x2={CHART_WIDTH - PADDING.right}
                  y1={chart.metaLine.y} y2={chart.metaLine.y}
                />
                <text
                  x={CHART_WIDTH - PADDING.right - 6} y={chart.metaLine.labelY}
                  textAnchor="end" className="chart-meta-label"
                >
                  Meta {percentFormatter.format(target)}%
                </text>
              </g>
            )}

            <g className="chart-axis" aria-hidden="true">
              <line className="chart-axis__x" x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={CHART_HEIGHT - PADDING.bottom} y2={CHART_HEIGHT - PADDING.bottom} />
              <line className="chart-axis__y" x1={PADDING.left} x2={PADDING.left} y1={PADDING.top} y2={CHART_HEIGHT - PADDING.bottom} />
            </g>

            <g clipPath={`url(#proj-clip-${chartId})`} aria-hidden="true">
              {chart.areaPath && <path className="chart-area projection-area" d={chart.areaPath} />}
              {chart.historicalPaths.map((path, index) => (
                <path className="chart-line projection-line" d={path} key={`historical-${index}`} />
              ))}
              {chart.projectionPaths.map((path, index) => (
                <path className="chart-line projection-line--dashed" d={path} key={`projection-${index}`} />
              ))}
            </g>

            <g className="chart-points">
              {focusablePoints.map((point, index) => (
                <circle
                  ref={(element) => { pointRefs.current[index] = element }}
                  key={point.year}
                  role="img"
                  aria-label={`${point.isProjected ? 'Projetado' : 'Observado'} ${point.year}: ${percentFormatter.format(point.value)}%`}
                  aria-keyshortcuts="ArrowLeft ArrowRight Home End"
                  className={`chart-mark${point.year === transitionYear ? ' is-transition' : ''}${point.year === lastChartPointYear ? ' is-last' : ''}`}
                  cx={point.x} cy={point.y}
                  r={activePoint?.year === point.year ? 5.5 : point.year === transitionYear ? 5 : point.year === lastChartPointYear ? 4.5 : 3.5}
                  onMouseEnter={() => setActivePoint(point)}
                  onMouseLeave={() => setActivePoint(null)}
                  onFocus={() => {
                    setTabStopYear(point.year)
                    setActivePoint(point)
                  }}
                  onBlur={() => setActivePoint(null)}
                  onKeyDown={(event) => handlePointKeyDown(event, index)}
                  tabIndex={point.year === resolvedTabStopYear ? 0 : -1}
                >
                  <title>{`${point.year}: ${percentFormatter.format(point.value)}%`}</title>
                </circle>
              ))}
            </g>

            <g className="chart-x-labels" aria-hidden="true">
              {chart.xTicks.map((tick, i, arr) => (
                <text
                  key={tick.year}
                  x={i === 0 ? tick.x + 4 : i === arr.length - 1 ? tick.x - 4 : tick.x}
                  y={CHART_HEIGHT - 12}
                  textAnchor={i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'}
                >
                  {tick.year}
                </text>
              ))}
            </g>
          </svg>

          {activePoint && (
            <ChartTooltip
              className="history-chart__tooltip"
              label={activePoint.year}
              series={activePoint.isProjected ? 'Projetado' : 'Observado'}
              value={activePoint.valid === false ? '—' : `${percentFormatter.format(activePoint.value)}%`}
              style={{
                left: `${Math.min(92, Math.max(10, (activePoint.x / CHART_WIDTH) * 100))}%`,
                top: `${(activePoint.y / CHART_HEIGHT) * 100}%`,
                transform: activePoint.y < PADDING.top + 38
                  ? 'translate(-50%, 12px)'
                  : 'translate(-50%, calc(-100% - 12px))',
              }}
            />
          )}
          </div>
        </>
      ) : (
        <ChartEmptyState message="Série histórica insuficiente para exibir o gráfico." />
      )}

      {contextOnly ? (
        projection.quality || projection.warnings?.length ? (
          <div className="education-projection-alerts platform-coverage-note" role="note">
            {projection.quality ? <p><strong>Qualidade do cenário:</strong> {formatProjectionQuality(projection.quality)}.</p> : null}
            {projection.warnings?.length ? (
              <details className="education-projection-alerts__details">
                <summary>Alertas do cenário ({projection.warnings.length})</summary>
                <ul>
                  {projection.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null
      ) : (
        <div className="complementary-projection__reading">
          <p>
            {tendeAtingir
              ? 'Se a trajetória atual for mantida, o município tende a atingir a meta em 2036.'
              : 'Se a trajetória atual for mantida, o município apresenta risco de não atingir a meta em 2036.'}
          </p>
        </div>
      )}
    </div>
  )
}

function formatProjectionQuality(quality) {
  const labels = { alta: 'alta', media: 'média', baixa: 'baixa' }
  return labels[quality] ?? quality
}

function buildProjectionChart(projection, { chartMinYear, showGoalContext = true } = {}) {
  if (!projection?.available) {
    return { points: [], yTicks: [], metaLine: null, areaPath: null, historicalPaths: [], projectionPaths: [], xTicks: [] }
  }

  const CHART_MIN_YEAR = chartMinYear ?? 2016
  const CHART_MAX_YEAR = 2036

  const historicalPct = projection.historical_percent || []
  const historicalYears = projection.historical_years || []
  const histPoints = historicalYears
    .map((y, i) => ({
      year: y,
      value: historicalPct[i],
      valid: historicalPct[i] != null && isFinite(historicalPct[i]) && y >= CHART_MIN_YEAR,
      isProjected: false,
    }))
    .filter((point) => point.year >= CHART_MIN_YEAR)

  const projPct = projection.projected_percent || []
  const projYears = projection.years || []
  const projPoints = projYears
    .map((y, i) => ({
      year: y,
      value: projPct[i],
      valid: projPct[i] != null && isFinite(projPct[i]),
      isProjected: true,
    }))

  const validPoints = [...histPoints, ...projPoints].filter((point) => point.valid)
  if (validPoints.length < 1) {
    return { points: [], yTicks: [], metaLine: null, areaPath: null, historicalPaths: [], projectionPaths: [], xTicks: [] }
  }

  const allPoints = [...histPoints, ...projPoints]

  const target = showGoalContext ? projection.target_percent : null
  const values = validPoints.map(p => p.value)
  if (target != null) values.push(target)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const domainMin = minVal >= 0 ? 0 : Math.floor(minVal / 10) * 10
  const domainMax = Math.min(100, Math.max(10, Math.ceil((maxVal * 1.1) / 10) * 10))

  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const minYear = CHART_MIN_YEAR
  const maxYear = CHART_MAX_YEAR

  const xScale = (year) => PADDING.left + ((year - minYear) / (maxYear - minYear)) * plotWidth
  const yScale = (value) => PADDING.top + ((domainMax - value) / (domainMax - domainMin)) * plotHeight

  const scaledPoints = allPoints.map(p => ({
    ...p,
    x: xScale(p.year),
    y: p.valid ? yScale(p.value) : PADDING.top + plotHeight / 2,
  }))

  const histScaled = scaledPoints.filter((point) => !point.isProjected)
  const projScaled = scaledPoints.filter((point) => point.isProjected)
  const historicalSegments = buildProjectionSegments(histScaled)
  const projectionSegments = buildProjectionSegments(projScaled)
  const lastHist = histScaled.filter((point) => point.valid).slice(-1)[0]
  if (lastHist && projectionSegments[0]?.[0]?.year === projScaled[0]?.year) {
    projectionSegments[0] = [lastHist, ...projectionSegments[0]]
  }
  const historicalPaths = historicalSegments.map(buildProjectionPath)
  const projectionPaths = projectionSegments.map(buildProjectionPath)

  const allScaledValid = scaledPoints.filter(p => p.valid)
  const firstPt = allScaledValid[0]
  const lastPt = allScaledValid[allScaledValid.length - 1]
  const zeroY = CHART_HEIGHT - PADDING.bottom

  const fullLinePath = allScaledValid.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = allScaledValid.length > 1 && allPoints.every((point) => point.valid)
    ? `${fullLinePath} L${lastPt.x.toFixed(1)} ${zeroY.toFixed(1)} L${firstPt.x.toFixed(1)} ${zeroY.toFixed(1)} Z`
    : ''

  const yStep = pickProjectionTickStep(domainMax - domainMin)
  const yTicks = []
  for (let v = Math.max(0, Math.floor(domainMin / yStep) * yStep); v <= domainMax; v += yStep) {
    yTicks.push({ value: v, y: yScale(v), label: `${v}%` })
  }

  const metaLine = target != null
    ? buildProjectionMetaLine({
        points: allScaledValid,
        value: target,
        y: Math.max(PADDING.top, Math.min(yScale(target), CHART_HEIGHT - PADDING.bottom)),
      })
    : null

  const yearStep = Math.max(1, Math.floor((maxYear - minYear) / 8))
  const xTicks = []
  for (let y = minYear; y <= maxYear; y += yearStep) {
    const p = allScaledValid.find(pt => pt.year === y)
    if (p) {
      xTicks.push({ year: y, x: p.x })
    }
  }
  if ((xTicks.length === 0 || xTicks[xTicks.length - 1].year !== maxYear) && lastPt) {
    xTicks.push({ year: lastPt.year, x: lastPt.x })
  }

  return {
    points: scaledPoints,
    yTicks,
    metaLine,
    areaPath,
    historicalPaths,
    projectionPaths,
    xTicks,
  }
}

function buildProjectionSegments(points) {
  const segments = []
  let current = []

  points.forEach((point) => {
    if (!point.valid) {
      if (current.length) segments.push(current)
      current = []
      return
    }
    current.push(point)
  })

  if (current.length) segments.push(current)
  return segments
}

function buildProjectionPath(points) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')
}

function pickProjectionTickStep(span) {
  if (span <= 20) return 5
  if (span <= 50) return 10
  if (span <= 80) return 20
  return 25
}

function buildProjectionMetaLine({ points, value, y }) {
  const plotTop = PADDING.top
  const plotBottom = CHART_HEIGHT - PADDING.bottom
  const labelX = CHART_WIDTH - PADDING.right - 6
  let labelY = y - 12

  if (y < plotTop + 24) {
    labelY = y + 20
  } else if (y > plotBottom - 18) {
    labelY = y - 14
  }

  const rightSideCollision = points.some((point) => (
    point.valid !== false &&
    Math.abs(point.x - labelX) < 132 &&
    Math.abs(point.y - labelY) < 22
  ))

  if (rightSideCollision) {
    const hasRoomAbove = y - 28 > plotTop
    labelY = hasRoomAbove ? y - 28 : y + 28
  }

  return {
    labelY: Math.max(plotTop + 14, Math.min(labelY, plotBottom - 12)),
    value,
    y,
  }
}
