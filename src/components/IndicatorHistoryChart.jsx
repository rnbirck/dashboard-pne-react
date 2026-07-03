import { useId, useMemo, useState } from 'react'
import {
  getStableVisualDomain,
  stableAbsoluteTicks,
  stableIndexTicks,
  stablePercentTicks,
  stableYearsTicks,
} from '../utils/visualDomain'
import { formatIndicatorValue, resolveIndicatorUnit } from '../utils/format'

const CHART_WIDTH = 980
const CHART_HEIGHT_INFORMATIVE = 280
const CHART_HEIGHT_NORMAL = 300
const CHART_HEIGHT_NEGATIVE = 330
const PADDING = { bottom: 44, left: 64, right: 68, top: 38 }

export function IndicatorHistoryChart({
  chartHeight,
  endYear,
  formatDataLabel: formatDataLabelProp,
  formatYAxis: formatYAxisProp,
  item,
  labelMode,
  meta,
  missingLabel = '—',
  result,
  series,
  showMetaLine = true,
  showMissingPoints,
  startYear,
  title = 'Histórico do indicador',
  unit: unitProp,
  yTickCount,
  floorNegativeValues = false,
}) {
  const [activePoint, setActivePoint] = useState(null)
  const rawClipId = useId()
  const clipId = `history-chart-clip-${rawClipId.replace(/:/g, '')}`
  const resolvedUnit = unitProp || resolveIndicatorUnit(item, result)
  const chart = useMemo(
    () =>
      buildChartModel({
        endYear,
        formatDataLabel: formatDataLabelProp,
        formatYAxis: formatYAxisProp,
        labelMode,
        meta,
        missingLabel,
        resolvedUnit,
        series,
        showMetaLine,
        showMissingPoints,
        startYear,
        yTickCount,
        floorNegativeValues,
        chartHeightOverride: chartHeight,
      }),
    [chartHeight, endYear, formatDataLabelProp, formatYAxisProp, labelMode, meta, missingLabel, resolvedUnit, series, showMetaLine, showMissingPoints, startYear, yTickCount, floorNegativeValues],
  )

  const validCount = chart.points.filter(p => p.valid !== false).length
  if (validCount < 2 && !showMissingPoints) {
    return null
  }

  return (
    <section className={`history-chart${chart.hasNegativeValues ? ' history-chart--with-negatives' : ''}${chart.isInformative ? ' history-chart--informative' : ''}`}>
      <div className="history-chart__heading">
        <div>
          <span className="eyebrow">Histórico do indicador</span>
          <h4>{title}</h4>
        </div>
      </div>

      <div className="history-chart__canvas">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${chart.height}`}
          role="img"
          aria-label={`${title}: linha histórica por ano`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect
                x={PADDING.left}
                y={PADDING.top}
                width={CHART_WIDTH - PADDING.left - PADDING.right}
                height={chart.height - PADDING.top - PADDING.bottom}
              />
            </clipPath>
          </defs>
          <g className="chart-grid">
            {chart.yTicks.map((tick, index) => (
              <g key={`${tick.value}-${index}`}>
                <line
                  x1={PADDING.left}
                  x2={CHART_WIDTH - PADDING.right}
                  y1={tick.y}
                  y2={tick.y}
                />
                <text x={PADDING.left - 12} y={tick.y + 4}>
                  {chart.formatYAxis ? chart.formatYAxis(tick.value) : chart.formatValue(tick.value)}
                </text>
              </g>
            ))}
          </g>

          {chart.metaLine && (
            <g className="chart-meta-line">
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={chart.metaLine.y}
                y2={chart.metaLine.y}
              />
            </g>
          )}

          <g className="chart-axis">
            <line
              x1={PADDING.left}
              x2={CHART_WIDTH - PADDING.right}
              y1={chart.height - PADDING.bottom}
              y2={chart.height - PADDING.bottom}
            />
            <line
              x1={PADDING.left}
              x2={PADDING.left}
              y1={PADDING.top}
              y2={chart.height - PADDING.bottom}
            />
          </g>

          {chart.zeroLine && (
            <g className="chart-zero-line">
              <line
                x1={PADDING.left}
                x2={CHART_WIDTH - PADDING.right}
                y1={chart.zeroLine.y}
                y2={chart.zeroLine.y}
              />
            </g>
          )}

          <g className="chart-year-markers">
            {chart.yearMarkers.map((marker) => (
              <line
                key={marker.year}
                x1={marker.x}
                x2={marker.x}
                y1={PADDING.top}
                y2={chart.height - PADDING.bottom}
              />
            ))}
          </g>

          <g clipPath={`url(#${clipId})`}>
            {chart.areaPath ? <path className="chart-area" d={chart.areaPath} /> : null}
            <path className="chart-line" d={chart.linePath} />
          </g>

          <g className="chart-points">
            {chart.points.filter(p => p.valid !== false).map((point) => (
              <circle
                cx={point.x}
                cy={point.y}
                key={point.year}
                r={activePoint?.year === point.year ? 5 : 4}
                onBlur={() => setActivePoint(null)}
                onFocus={() => setActivePoint(point)}
                onMouseEnter={() => setActivePoint(point)}
                onMouseLeave={() => setActivePoint(null)}
                tabIndex="0"
              >
                <title>{`${point.year}: ${chart.formatValue(point.value)}`}</title>
              </circle>
            ))}
          </g>

          {showMissingPoints && chart.missingPointLabels && (
            <g className="chart-missing-labels">
              {chart.missingPointLabels.map((label) => (
                <text key={label.year} x={label.x} y={label.y} textAnchor="middle" className="chart-missing-label">
                  {missingLabel}
                </text>
              ))}
            </g>
          )}

          <g className="chart-data-labels">
            {chart.dataLabels.map((label) => (
              <text
                key={label.year}
                x={label.x}
                y={label.y}
                textAnchor={label.anchor}
                className={
                  label.isMeta
                    ? 'chart-meta-label'
                    : label.isLast
                      ? 'chart-point-label is-last'
                      : 'chart-point-label'
                }
              >
                {label.isMeta ? `Meta ${chart.formatValue(label.value)}` : (chart.formatDataLabel ? chart.formatDataLabel(label.value) : chart.formatValue(label.value))}
              </text>
            ))}
          </g>

          <g className="chart-x-labels">
            {chart.xTicks.map((tick, i, arr) => (
              <text
                key={tick.year}
                x={
                  i === 0
                    ? tick.x + 4
                    : i === arr.length - 1
                      ? tick.x - 4
                      : tick.x
                }
                y={chart.height - 12}
                textAnchor={
                  i === 0 ? 'start' : i === arr.length - 1 ? 'end' : 'middle'
                }
              >
                {tick.year}
              </text>
            ))}
          </g>
        </svg>

        {activePoint && (
          <div
            className="history-chart__tooltip"
            style={{
              left: `${Math.min(92, Math.max(10, (activePoint.x / CHART_WIDTH) * 100))}%`,
              top: `${(activePoint.y / chart.height) * 100}%`,
              transform:
                activePoint.y < PADDING.top + 38
                  ? 'translate(-50%, 12px)'
                  : 'translate(-50%, calc(-100% - 12px))',
            }}
          >
            <strong>{activePoint.year}</strong>
            <span>{activePoint.valid === false ? missingLabel : chart.formatValue(activePoint.value)}</span>
          </div>
        )}
      </div>
    </section>
  )
}

function buildChartModel({
  endYear,
  formatDataLabel,
  formatYAxis,
  labelMode,
  meta,
  missingLabel,
  resolvedUnit,
  series,
  showMetaLine,
  showMissingPoints,
  startYear,
  yTickCount,
  floorNegativeValues = false,
  chartHeightOverride,
}) {
  const rawPoints = normalizeSeries(series, floorNegativeValues, showMissingPoints)
  const validPoints = rawPoints.filter((p) => p.valid !== false)
  const points = showMissingPoints ? rawPoints : validPoints
  const rawMetaValue =
    meta === null || meta === undefined || meta === '' ? Number.NaN : Number(meta)
  const metaValue = Number.isFinite(rawMetaValue) ? rawMetaValue : null

  if (validPoints.length < 2) {
    const baseChartHeight = showMetaLine ? CHART_HEIGHT_NORMAL : CHART_HEIGHT_INFORMATIVE
    const chartHeight = resolveChartHeight(baseChartHeight, chartHeightOverride)
    return {
      formatDataLabel,
      formatValue: (value) => formatIndicatorValue(value, resolvedUnit),
      formatYAxis,
      hasNegativeValues: false,
      height: chartHeight,
      isInformative: !showMetaLine,
      missingPointLabels: showMissingPoints ? computeMissingLabels(points, chartHeight, missingLabel) : undefined,
      points,
    }
  }

  const values = validPoints.map((point) => point.value)
  const hasNegativeValues = values.some((value) => value < 0)
  const baseChartHeight = hasNegativeValues
    ? CHART_HEIGHT_NEGATIVE
    : showMetaLine
      ? CHART_HEIGHT_NORMAL
      : CHART_HEIGHT_INFORMATIVE
  const chartHeight = resolveChartHeight(baseChartHeight, chartHeightOverride)
  const isPercent = resolvedUnit === 'percent'
  const isIndex = resolvedUnit === 'index'
  const isYears = resolvedUnit === 'years'
  const domain = getStableVisualDomain({
    values: metaValue !== null ? [...values, metaValue] : values,
    meta: metaValue,
    isPercent,
    isIndex,
    isYears,
  })
  const allYears = points.map((point) => point.year)
  const minYear = Math.min(...allYears)
  const maxYear = Math.max(...allYears)
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const plotHeight = chartHeight - PADDING.top - PADDING.bottom

  const xScale = (year) => {
    if (maxYear === minYear) return PADDING.left + plotWidth / 2
    return PADDING.left + ((year - minYear) / (maxYear - minYear)) * plotWidth
  }
  const yScale = (value) => {
    if (domain.max === domain.min) return PADDING.top + plotHeight / 2
    return PADDING.top + ((domain.max - value) / (domain.max - domain.min)) * plotHeight
  }

  const scaledPoints = points.map((point) => ({
    ...point,
    x: xScale(point.year),
    y: point.valid !== false ? yScale(point.value) : PADDING.top + plotHeight / 2,
  }))
  const scaledValidPoints = scaledPoints.filter((p) => p.valid !== false)
  const linePath = showMissingPoints
    ? buildBrokenLinePath(scaledPoints)
    : scaledPoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
        .join(' ')
  const last = scaledValidPoints[scaledValidPoints.length - 1]
  const first = scaledValidPoints[0]
  const hasGaps = showMissingPoints && scaledPoints.some((p) => p.valid === false)
  const zeroY = domain.min < 0 && domain.max > 0
    ? yScale(0)
    : chartHeight - PADDING.bottom
  const areaPath = hasNegativeValues || hasGaps
    ? null
    : `${linePath} L${last.x.toFixed(1)} ${zeroY.toFixed(1)} L${first.x.toFixed(1)} ${zeroY.toFixed(1)} Z`

  const yTicksRaw = isPercent
    ? stablePercentTicks(domain) ?? [domain.min, domain.max]
    : isIndex
      ? stableIndexTicks(domain) ?? [domain.min, domain.max]
      : isYears
        ? stableYearsTicks(domain) ?? [domain.min, domain.max]
        : stableAbsoluteTicks(domain) ?? [domain.min, domain.max]
  let yTicks = yTicksRaw
    .filter((value) => value >= domain.min - 0.0001 && value <= domain.max + 0.0001)
    .map((value) => ({ value, y: yScale(value) }))

  if (yTickCount && yTicks.length > yTickCount) {
    const step = (yTicks.length - 1) / (yTickCount - 1)
    const thinned = []
    for (let i = 0; i < yTickCount; i++) {
      const idx = Math.round(i * step)
      thinned.push(yTicks[idx])
    }
    yTicks = thinned
  }

  const shouldShowMeta = showMetaLine && metaValue !== null && Number.isFinite(metaValue)
  let metaLine = null
  if (shouldShowMeta) {
    const baseY = yScale(metaValue)
    metaLine = {
      value: metaValue,
      y: Math.max(PADDING.top, Math.min(baseY, chartHeight - PADDING.bottom)),
    }
  }

  const zeroLine = domain.min < 0 && domain.max > 0
    ? { y: yScale(0) }
    : null

  const candidateMarkerYears = [startYear, endYear]
    .map((year) => Number(year))
    .filter((year) => Number.isFinite(year) && year > 0)

  const fallbackMarkerYears = [minYear, maxYear]

  const finalMarkerYears = candidateMarkerYears.length
    ? candidateMarkerYears
    : fallbackMarkerYears

  const yearMarkers = finalMarkerYears
    .filter((year) => year >= minYear && year <= maxYear)
    .filter((year, index, arr) => arr.indexOf(year) === index)
    .map((year) => ({ year, x: xScale(year) }))

  const formatValue = (value) => formatIndicatorValue(value, resolvedUnit)
  const formatLabel = formatDataLabel || formatValue
  const labelsForCompute = labelMode === 'all' ? scaledValidPoints : scaledPoints
  const dataLabels = computeDataLabels(labelsForCompute, metaLine, formatLabel, chartHeight, labelMode)

  const missingPointLabels = showMissingPoints
    ? scaledPoints.filter((p) => p.valid === false).map((p) => ({ year: p.year, x: p.x, y: chartHeight - PADDING.bottom + 18 }))
    : undefined

  return {
    areaPath,
    dataLabels,
    formatDataLabel,
    formatValue,
    formatYAxis,
    hasNegativeValues,
    height: chartHeight,
    isInformative: !showMetaLine,
    linePath,
    metaLine,
    missingPointLabels,
    points: scaledPoints,
    xTicks: showMissingPoints ? pickAllYearTicks(scaledPoints) : pickYearTicks(scaledPoints),
    yTicks,
    yearMarkers,
    zeroLine,
  }
}

function resolveChartHeight(baseHeight, override) {
  const numericOverride = Number(override)
  if (!Number.isFinite(numericOverride)) return baseHeight
  return Math.max(baseHeight, numericOverride)
}

function normalizeSeries(series = [], floorNegativeValues = false, showMissingPoints = false) {
  return series
    .map((point) => {
      const isMissing = showMissingPoints && (point?.valor === null || point?.valor === undefined)
      const rawValue = Number(point?.valor)
      const valid = !isMissing && Number.isFinite(rawValue) && Number.isFinite(Number(point?.ano))
      return {
        value: isMissing ? null : (floorNegativeValues && rawValue < 0 ? 0 : rawValue),
        year: Number(point?.ano),
        valid,
        missing: isMissing,
      }
    })
    .filter((point) => {
      if (showMissingPoints) return Number.isFinite(point.year)
      return Number.isFinite(point.year) && point.valid
    })
    .sort((a, b) => a.year - b.year)
}

function buildBrokenLinePath(scaledPoints) {
  let path = ''
  let inSegment = false
  for (const p of scaledPoints) {
    if (p.valid === false) {
      inSegment = false
      continue
    }
    if (!inSegment) {
      path += `${path ? ' ' : ''}M${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      inSegment = true
    } else {
      path += ` L${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    }
  }
  return path
}

function pickAllYearTicks(points) {
  const seen = new Set()
  const result = []
  for (const p of points) {
    if (!seen.has(p.year)) {
      seen.add(p.year)
      result.push(p)
    }
  }
  return result
}

function computeMissingLabels(points, chartHeight) {
  const y = chartHeight - 18
  return points
    .filter((p) => p.valid === false)
    .map((p) => ({ year: p.year, x: p.x, y }))
}

function pickYearTicks(points) {
  if (points.length <= 6) return points
  const first = points[0]
  const last = points[points.length - 1]
  const middle = points[Math.floor(points.length / 2)]
  return [first, middle, last]
}

function computeDataLabels(points, metaLine, formatValue, chartHeight, labelMode) {
  if (points.length === 0) return []

  const plotLeft = PADDING.left
  const plotRight = CHART_WIDTH - PADDING.right
  const plotTop = PADDING.top
  const plotBottom = chartHeight - PADDING.bottom

  const LABEL_OFFSET_Y = 14
  const MIN_DISTANCE_Y = 20
  const MIN_DISTANCE_X = 36

  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]

  const candidates = []

  // 1. Último ponto (prioridade 1 - mais alta)
  const lastNeedsEndAnchor = lastPoint.x > plotRight - 30
  candidates.push({
    anchor: lastNeedsEndAnchor ? 'end' : 'start',
    isLast: true,
    isMeta: false,
    priority: 1,
    type: 'last',
    value: lastPoint.value,
    x: lastNeedsEndAnchor ? lastPoint.x - 8 : lastPoint.x + 8,
    y: pickLabelY(lastPoint.y, plotTop, plotBottom, LABEL_OFFSET_Y),
    year: lastPoint.year,
  })

  // 2. Demais pontos
  if (points.length <= 6 || labelMode === 'all') {
    for (let i = 0; i < points.length - 1; i++) {
      const p = points[i]
      candidates.push({
        anchor: 'middle',
        isLast: false,
        isMeta: false,
        priority: 7,
        type: 'point',
        value: p.value,
        x: p.x,
        y: pickLabelY(p.y, plotTop, plotBottom, LABEL_OFFSET_Y),
        year: p.year,
      })
    }
  } else {
    const maxPoint = points.reduce((max, p) => (p.value > max.value ? p : max), points[0])
    const minPoint = points.reduce((min, p) => (p.value < min.value ? p : min), points[0])

    const seen = new Set([lastPoint.year])
    const addCandidate = (p, priority, type) => {
      if (!p || seen.has(p.year)) return
      seen.add(p.year)
      candidates.push({
        anchor: 'middle',
        isLast: false,
        isMeta: false,
        priority,
        type,
        value: p.value,
        x: p.x,
        y: pickLabelY(p.y, plotTop, plotBottom, LABEL_OFFSET_Y),
        year: p.year,
      })
    }

    // Cruzamentos (prioridade 3)
    if (metaLine && Number.isFinite(metaLine.value)) {
      const metaVal = metaLine.value
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const crossedUp = prev.value < metaVal && curr.value >= metaVal
        const crossedDown = prev.value > metaVal && curr.value <= metaVal
        if (crossedUp || crossedDown) {
          addCandidate(curr, 3, 'cross')
        }
      }
    }

    addCandidate(maxPoint, 5, 'max')
    addCandidate(minPoint, 5, 'min')
    addCandidate(firstPoint, 6, 'first')
  }

  // 3. Meta label (prioridade 8 - mais baixa que todos os pontos)
  if (metaLine) {
    const metaY = metaLine.y
    let metaLabelY
    if (metaY < plotTop + 30) {
      metaLabelY = metaY + 18
    } else if (metaY > plotBottom - 20) {
      metaLabelY = metaY - 10
    } else {
      metaLabelY = metaY - 8
    }
    metaLabelY = clampNumber(metaLabelY, plotTop + 14, plotBottom - 10)

    // Verificar se meta label ficará perto do último ponto
    const dyFromLast = Math.abs(metaLabelY - lastPoint.y)
    const dxFromLast = Math.abs(plotRight - 2 - lastPoint.x)
    if (dyFromLast < MIN_DISTANCE_Y && dxFromLast < 80) {
      // Último ponto está perto: deslocar meta label para o lado oposto
      if (lastPoint.y > plotTop + plotBottom / 2) {
        metaLabelY = plotTop + 18
      } else {
        metaLabelY = plotBottom - 12
      }
    }

    candidates.push({
      anchor: 'end',
      isLast: false,
      isMeta: true,
      priority: 8,
      type: 'meta',
      value: metaLine.value,
      x: plotRight - 2,
      y: metaLabelY,
      year: 'meta',
    })
  }

  // 4. Ajustar posições dos labels de pontos
  for (const label of candidates) {
    if (label.isMeta) continue
    label.y = clampNumber(label.y, plotTop + 14, plotBottom - 10)

    if (label.x < plotLeft + 14) {
      label.x = plotLeft + 14
    }
    if (label.x > plotRight - 14) {
      label.x = plotRight - 14
    }

    // Último ponto: refinamento de posição
    if (label.isLast) {
      if (isLastAtRightEdge(lastPoint.x, plotRight)) {
        label.anchor = 'end'
        label.x = lastPoint.x - 8
        if (label.x < plotLeft + 14) {
          label.x = plotLeft + 20
          label.anchor = 'start'
        }
      } else {
        label.anchor = 'start'
        label.x = lastPoint.x + 8
        if (label.x > plotRight - 6) {
          label.x = plotRight - 6
          label.anchor = 'end'
        }
      }
    }

    if (label.type === 'first' && firstPoint.x < plotLeft + 16) {
      label.hidden = true
    }
  }

  // 5. Filtrar ocultos e ordenar por prioridade
  let visible = candidates.filter((l) => !l.hidden)
  visible.sort((a, b) => a.priority - b.priority)

  // 6. Colisão final
  const filtered = []
  for (const label of visible) {
    const tooClose = filtered.some((existing) => {
      const dy = Math.abs(existing.y - label.y)
      const dx = Math.abs(existing.x - label.x)
      return dy < MIN_DISTANCE_Y && dx < MIN_DISTANCE_X
    })
    if (!tooClose) filtered.push(label)
  }

  // 7. Garantir que a meta não foi removida; se foi, tentar reinserir com posição alternativa
  const hasMeta = filtered.some((l) => l.isMeta)
  if (metaLine && !hasMeta) {
    const metaCandidate = visible.find((l) => l.isMeta)
    if (metaCandidate) {
      const altY = metaCandidate.y < plotTop + 40 ? plotBottom - 12 : plotTop + 18
      metaCandidate.y = altY
      const stillTooClose = filtered.some((existing) => {
        const dy = Math.abs(existing.y - metaCandidate.y)
        const dx = Math.abs(existing.x - metaCandidate.x)
        return dy < MIN_DISTANCE_Y && dx < MIN_DISTANCE_X
      })
      if (!stillTooClose) {
        filtered.push(metaCandidate)
      }
    }
  }

  return filtered
}

function isLastAtRightEdge(x, plotRight) {
  return x > plotRight - 30
}

function pickLabelY(pointY, plotTop, plotBottom, offset) {
  if (pointY < plotTop + 26) return pointY + offset + 6
  if (pointY > plotBottom - 20) return pointY - offset - 2
  return pointY - offset
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(value, max))
}
