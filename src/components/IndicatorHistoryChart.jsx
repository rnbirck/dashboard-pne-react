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
const CHART_HEIGHT_INFORMATIVE = 260
const CHART_HEIGHT_NORMAL = 280
const CHART_HEIGHT_NEGATIVE = 330
const PADDING = { bottom: 40, left: 72, right: 60, top: 36 }

export function IndicatorHistoryChart({
  display,
  endYear,
  item,
  meta,
  result,
  series,
  showMetaLine = true,
  startYear,
  title = 'Histórico do indicador',
  unit: unitProp,
}) {
  const [activePoint, setActivePoint] = useState(null)
  const rawClipId = useId()
  const clipId = `history-chart-clip-${rawClipId.replace(/:/g, '')}`
  const resolvedUnit = unitProp || resolveIndicatorUnit(item, result)
  const chart = useMemo(
    () =>
      buildChartModel({
        display,
        endYear,
        meta,
        resolvedUnit,
        result,
        series,
        showMetaLine,
        startYear,
      }),
    [display, endYear, meta, resolvedUnit, result, series, showMetaLine, startYear],
  )

  if (chart.points.length < 2) {
    return null
  }

  return (
    <section className={`history-chart${chart.hasNegativeValues ? ' history-chart--with-negatives' : ''}${chart.isInformative ? ' history-chart--informative' : ''}`}>
      <div className="history-chart__heading">
        <div>
          <span className="eyebrow">Evolução do indicador</span>
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
                  {chart.formatValue(tick.value)}
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

            <g className="chart-points">
              {chart.points.map((point) => (
                <circle
                  cx={point.x}
                  cy={point.y}
                  key={point.year}
                  r={activePoint?.year === point.year ? 5.5 : 4.2}
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
          </g>

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
                {label.isMeta ? `Meta ${chart.formatValue(label.value)}` : chart.formatValue(label.value)}
              </text>
            ))}
          </g>

          <g className="chart-x-labels">
            {chart.xTicks.map((tick) => (
              <text key={tick.year} x={tick.x} y={chart.height - 14}>
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
            <span>{chart.formatValue(activePoint.value)}</span>
          </div>
        )}
      </div>
    </section>
  )
}

function buildChartModel({
  display,
  endYear,
  meta,
  resolvedUnit,
  result,
  series,
  showMetaLine,
  startYear,
}) {
  const points = normalizeSeries(series)
  const rawMetaValue =
    meta === null || meta === undefined || meta === '' ? Number.NaN : Number(meta)
  const metaValue = Number.isFinite(rawMetaValue) ? rawMetaValue : null

  if (points.length < 2) {
    return {
      formatValue: (value) => formatIndicatorValue(value, resolvedUnit),
      hasNegativeValues: false,
      height: showMetaLine ? CHART_HEIGHT_NORMAL : CHART_HEIGHT_INFORMATIVE,
      isInformative: !showMetaLine,
      points,
    }
  }

  const values = points.map((point) => point.value)
  const hasNegativeValues = values.some((value) => value < 0)
  const chartHeight = hasNegativeValues
    ? CHART_HEIGHT_NEGATIVE
    : showMetaLine
      ? CHART_HEIGHT_NORMAL
      : CHART_HEIGHT_INFORMATIVE
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
  const years = points.map((point) => point.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)
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
    y: yScale(point.value),
  }))
  const linePath = scaledPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')
  const last = scaledPoints[scaledPoints.length - 1]
  const first = scaledPoints[0]
  const zeroY = domain.min < 0 && domain.max > 0
    ? yScale(0)
    : chartHeight - PADDING.bottom
  const areaPath = hasNegativeValues
    ? null
    : `${linePath} L${last.x.toFixed(1)} ${zeroY.toFixed(1)} L${first.x.toFixed(1)} ${zeroY.toFixed(1)} Z`

  const yTicksRaw = isPercent
    ? stablePercentTicks(domain) ?? [domain.min, domain.max]
    : isIndex
      ? stableIndexTicks(domain) ?? [domain.min, domain.max]
      : isYears
        ? stableYearsTicks(domain) ?? [domain.min, domain.max]
        : stableAbsoluteTicks(domain) ?? [domain.min, domain.max]
  const yTicks = yTicksRaw
    .filter((value) => value >= domain.min - 0.0001 && value <= domain.max + 0.0001)
    .map((value) => ({ value, y: yScale(value) }))

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
  const dataLabels = computeDataLabels(scaledPoints, metaLine, formatValue, chartHeight)

  return {
    areaPath,
    dataLabels,
    formatValue,
    hasNegativeValues,
    height: chartHeight,
    isInformative: !showMetaLine,
    linePath,
    metaLine,
    points: scaledPoints,
    xTicks: pickYearTicks(scaledPoints),
    yTicks,
    yearMarkers,
    zeroLine,
  }
}

function normalizeSeries(series = []) {
  return series
    .map((point) => ({
      value: Number(point?.valor),
      year: Number(point?.ano),
    }))
    .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.value))
    .sort((a, b) => a.year - b.year)
}

function pickYearTicks(points) {
  if (points.length <= 6) return points
  const first = points[0]
  const last = points[points.length - 1]
  const middle = points[Math.floor(points.length / 2)]
  return [first, middle, last]
}

function computeDataLabels(points, metaLine, formatValue, chartHeight) {
  if (points.length === 0) return []

  const plotLeft = PADDING.left
  const plotRight = CHART_WIDTH - PADDING.right
  const plotTop = PADDING.top
  const plotBottom = chartHeight - PADDING.bottom

  const LABEL_OFFSET_Y = 14
  const MIN_DISTANCE_Y = 18
  const MIN_DISTANCE_X = 30

  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]

  // Calcula candidatos conforme regra
  const candidates = []

  // 1. Último ponto (prioridade 1)
  candidates.push({
    anchor: 'start',
    isLast: true,
    isMeta: false,
    priority: 1,
    type: 'last',
    value: lastPoint.value,
    x: lastPoint.x + 8,
    y: pickLabelY(lastPoint.y, plotTop, plotBottom, LABEL_OFFSET_Y),
    year: lastPoint.year,
  })

  // 2. Demais pontos conforme regra de tamanho
  if (points.length <= 6) {
    // Até 6 pontos: mostrar todos
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
    // Mais de 6 pontos: mostrar primeiro, maior, menor, cruzamentos
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

    // Cruzamentos primeiro (maior prioridade)
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

  // 3. Meta label (prioridade 0, mais alta)
  if (metaLine) {
    candidates.push({
      anchor: 'end',
      isLast: false,
      isMeta: true,
      priority: 0,
      type: 'meta',
      value: metaLine.value,
      x: plotRight - 2,
      y: clampNumber(metaLine.y < plotTop + 22 ? metaLine.y + 16 : metaLine.y - 8, plotTop + 14, plotBottom - 10),
      year: 'meta',
    })
  }

  // 4. Ajustar posições dos labels de pontos
  for (const label of candidates) {
    label.y = clampNumber(label.y, plotTop + 12, plotBottom - 8)
    if (label.isMeta) continue
    // Não permitir x menor que plotLeft + 18
    if (label.x < plotLeft + 18) {
      label.x = plotLeft + 18
    }
    // Não permitir x maior que plotRight - 18
    if (label.x > plotRight - 18) {
      label.x = plotRight - 18
    }
    // Se for o último ponto, forçar anchor end para não estourar à direita
    if (label.isLast) {
      label.anchor = 'end'
      label.x = lastPoint.x + 4
      if (label.x > plotRight - 6) {
        label.x = plotRight - 6
      }
    }
    // Se for o primeiro ponto e estiver muito próximo do eixo Y, ocultar
    if (label.type === 'first' && firstPoint.x < plotLeft + 14) {
      label.hidden = true
    }
  }

  // 5. Se label do ponto estiver muito perto da linha de meta (em y),
  //    ajustar para evitar colisão
  if (metaLine) {
    for (const label of candidates) {
      if (label.isMeta || label.hidden) continue
      const dyFromMeta = Math.abs(label.y - metaLine.y)
      // Se está próximo verticalmente, ajustar y
      if (dyFromMeta < MIN_DISTANCE_Y) {
        if (label.isLast) {
          // Último ponto: mover para baixo
          label.y = label.y + LABEL_OFFSET_Y + 4
        } else {
          // Outros pontos: ocultar se colidir com meta
          label.hidden = true
        }
      }
    }
  }

  // 6. Filtrar labels ocultos
  const visible = candidates.filter((l) => !l.hidden)

  // 7. Ordenar por prioridade (menor = mais alta) e aplicar colisão
  visible.sort((a, b) => a.priority - b.priority)

  const filtered = []
  for (const label of visible) {
    const tooClose = filtered.some((existing) => {
      const dy = Math.abs(existing.y - label.y)
      const dx = Math.abs(existing.x - label.x)
      return dy < MIN_DISTANCE_Y && dx < MIN_DISTANCE_X
    })
    if (!tooClose) filtered.push(label)
  }

  return filtered
}

function pickLabelY(pointY, plotTop, plotBottom, offset) {
  if (pointY < plotTop + 24) return pointY + offset + 4
  if (pointY > plotBottom - 18) return pointY - offset
  return pointY - offset
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(value, max))
}
