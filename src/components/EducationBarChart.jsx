import { useMemo, useState } from 'react'
import { useChartViewport } from '../hooks/useChartViewport'
import { isMissing } from '../utils/educationFormatters'
import { closeChartTooltipOnEscape, resolveChartColor } from '../utils/chartVisuals'
import { ChartEmptyState, ChartTooltip } from './ChartPrimitives'

const CHART_WIDTH = 820
const BAR_GAP = 12
const BAR_ROW_HEIGHT = 36
const PADDING = { top: 18, right: 120, bottom: 28, left: 220 }

export function EducationBarChart({
  data,
  title,
  color = '#2563eb',
  domainMax = /** @type {number | null} */ (null),
  formatLabel = (v) => String(v),
  orientation = 'horizontal',
  preserveOrder = false,
  size = 'default',
}) {
  const [activeBar, setActiveBar] = useState(null)
  const { containerRef, width: viewportWidth } = useChartViewport(CHART_WIDTH)
  const isLarge = size === 'large'
  const resolvedColor = resolveChartColor(color)
  const chart = useMemo(
    () => orientation === 'vertical'
      ? buildVerticalBars(data, formatLabel, preserveOrder)
      : buildBars(data, formatLabel, preserveOrder, isLarge ? viewportWidth : CHART_WIDTH, isLarge, domainMax),
    [data, domainMax, formatLabel, isLarge, orientation, preserveOrder, viewportWidth],
  )

  if (!chart || chart.bars.length === 0) {
    return (
      <ChartEmptyState />
    )
  }

  if (orientation === 'vertical') {
    return (
      <div className="education-chart education-chart--bar education-chart--column">
        {title && <h4 className="education-chart__title">{title}</h4>}
        <div className="education-chart__canvas">
          <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={title || 'Gráfico de colunas'}>
            <g className="chart-grid">
              {chart.yTicks.map((tick, i) => (
                <g key={`y-${i}`}>
                  <line x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={tick.y} y2={tick.y} stroke="var(--chart-grid)" strokeWidth="1" />
                  <text x={chart.padding.left - 10} y={tick.y + 4} textAnchor="end" className="chart-axis-label">{tick.label}</text>
                </g>
              ))}
            </g>
            <line x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={chart.height - chart.padding.bottom} y2={chart.height - chart.padding.bottom} stroke="var(--chart-axis)" strokeWidth="1" />
            <line x1={chart.padding.left} x2={chart.padding.left} y1={chart.padding.top} y2={chart.height - chart.padding.bottom} stroke="var(--chart-axis)" strokeWidth="1" />
            {chart.bars.map((bar, i) => (
              <g key={`bar-${i}`}>
                <rect
                  aria-label={`${bar.fullCategory}: ${formatLabel(bar.rawValue)}`}
                  className="chart-mark"
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height}
                  fill={resolvedColor}
                  fillOpacity={activeBar?.index === i ? '1' : '0.86'}
                  rx="4"
                  onBlur={() => setActiveBar(null)}
                  onFocus={() => setActiveBar(bar)}
                  onKeyDown={(event) => closeChartTooltipOnEscape(event, () => setActiveBar(null))}
                  onMouseEnter={() => setActiveBar(bar)}
                  onMouseLeave={() => setActiveBar(null)}
                  tabIndex="0"
                  style={{ cursor: 'pointer', transition: 'fill-opacity 0.12s' }}
                >
                  <title>{`${bar.fullCategory}: ${formatLabel(bar.rawValue)}`}</title>
                </rect>
                <text x={bar.x + bar.width / 2} y={bar.y - 6} textAnchor="middle" className="chart-bar-label">{bar.label}</text>
                <text
                  x={bar.x + bar.width / 2}
                  y={chart.height - chart.padding.bottom + 20}
                  textAnchor="end"
                  className="chart-x-label chart-x-label--angled"
                  transform={`rotate(-35 ${bar.x + bar.width / 2} ${chart.height - chart.padding.bottom + 20})`}
                >
                  {bar.category}
                </text>
              </g>
            ))}
          </svg>
          {activeBar && (
            <ChartTooltip
              className="education-chart__tooltip education-chart__tooltip--bar"
              label={activeBar.fullCategory}
              series={title}
              value={formatLabel(activeBar.rawValue)}
              style={{
                left: `${Math.min(86, Math.max(14, (activeBar.centerX / chart.width) * 100))}%`,
                top: `${Math.min(80, Math.max(12, (activeBar.y / chart.height) * 100))}%`,
                transform: activeBar.y < chart.padding.top + 46
                  ? 'translate(-50%, 12px)'
                  : 'translate(-50%, calc(-100% - 12px))',
              }}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`education-chart education-chart--bar${isLarge ? ' education-chart--bar-large' : ''}`}>
      {title && <h4 className="education-chart__title">{title}</h4>}
      <div className="education-chart__canvas" ref={containerRef}>
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={title || 'Gráfico de barras'}>
          <g className="chart-grid">
            {chart.xTicks.map((tick, i) => (
              <g key={`x-${i}`}>
                <line x1={tick.x} x2={tick.x} y1={chart.padding.top - 4} y2={chart.height - chart.padding.bottom + 4} stroke="var(--chart-grid)" strokeWidth="1" />
                <text x={tick.x} y={chart.height - 5} textAnchor="middle" className="chart-axis-label">{tick.label}</text>
              </g>
            ))}
          </g>
          {chart.bars.map((bar, i) => (
            <g key={`bar-${i}`}>
              <text
                x={chart.padding.left - 12}
                y={bar.y + chart.barHeight / 2 + 4 - ((bar.categoryLines.length - 1) * chart.categoryLineHeight) / 2}
                textAnchor="end"
                className="chart-bar-cat"
              >
                {bar.categoryLines.map((line, lineIndex) => (
                  <tspan
                    key={`${bar.index}-category-${lineIndex}`}
                    x={chart.padding.left - 12}
                    dy={lineIndex === 0 ? 0 : chart.categoryLineHeight}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
              <rect
                aria-label={`${bar.fullCategory}: ${formatLabel(bar.rawValue)}`}
                className="chart-mark"
                x={chart.padding.left}
                y={bar.y}
                width={bar.width}
                height={chart.barHeight}
                fill={resolvedColor}
                fillOpacity={activeBar?.index === i ? '1' : '0.86'}
                rx="4"
                onBlur={() => setActiveBar(null)}
                onFocus={() => setActiveBar(bar)}
                onKeyDown={(event) => closeChartTooltipOnEscape(event, () => setActiveBar(null))}
                onMouseEnter={() => setActiveBar(bar)}
                onMouseLeave={() => setActiveBar(null)}
                tabIndex="0"
                style={{ cursor: 'pointer', transition: 'fill-opacity 0.12s' }}
              >
                <title>{`${bar.fullCategory}: ${formatLabel(bar.rawValue)}`}</title>
              </rect>
              <text x={chart.padding.left + bar.width + 8} y={bar.y + chart.barHeight / 2 + 4} textAnchor="start" className="chart-bar-label">{bar.label}</text>
            </g>
          ))}
          <line x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={chart.height - chart.padding.bottom} y2={chart.height - chart.padding.bottom} stroke="var(--chart-axis)" strokeWidth="1" />
        </svg>
        {activeBar && (
          <ChartTooltip
            className="education-chart__tooltip education-chart__tooltip--bar"
            label={activeBar.fullCategory}
            series={title}
            value={formatLabel(activeBar.rawValue)}
            style={{
              left: `${Math.min(88, Math.max(18, ((chart.padding.left + activeBar.width) / chart.width) * 100))}%`,
              top: `${Math.min(82, Math.max(14, ((activeBar.y + chart.barHeight / 2) / chart.height) * 100))}%`,
              transform: activeBar.y < chart.padding.top + 46
                ? 'translate(-50%, 12px)'
                : 'translate(-50%, calc(-100% - 12px))',
            }}
          />
        )}
      </div>
    </div>
  )
}

function buildVerticalBars(data, formatLabel, preserveOrder) {
  if (!Array.isArray(data) || data.length === 0) return null
  const filteredData = data
    .filter((d) => !isMissing(d.value) && Number(d.value) >= 0)
  const filtered = preserveOrder
    ? filteredData
    : filteredData.sort((a, b) => Number(b.value) - Number(a.value))
  if (filtered.length === 0) return null

  const width = 920
  const height = 420
  const padding = { top: 30, right: 28, bottom: 112, left: 56 }
  const values = filtered.map((d) => Number(d.value))
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const rawRange = rawMax - rawMin
  const pad = rawRange > 0 ? Math.max(0.4, rawRange * 0.22) : Math.max(0.4, rawMax * 0.05)
  const minVal = rawMin > 0 ? Math.max(0, rawMin - pad) : 0
  const maxVal = Math.max(rawMax + pad, minVal + 1)
  const range = maxVal - minVal
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom
  const bandW = plotW / filtered.length
  const barW = Math.max(16, Math.min(42, bandW * 0.58))
  const bars = filtered.map((d, i) => {
    const value = Number(d.value)
    const barH = ((value - minVal) / range) * plotH
    const x = padding.left + i * bandW + (bandW - barW) / 2
    const y = padding.top + plotH - barH
    return {
      index: i,
      x,
      y,
      width: barW,
      height: barH,
      centerX: x + barW / 2,
      category: shortenLabel(d.label, 18),
      fullCategory: d.label,
      label: formatLabel(value),
      rawValue: value,
    }
  })
  const yTicksRaw = [minVal, minVal + range * 0.25, minVal + range * 0.5, minVal + range * 0.75, maxVal]
  const yTicks = yTicksRaw.map((val) => ({
    label: formatLabel(val),
    y: padding.top + plotH - ((val - minVal) / range) * plotH,
  }))
  return { bars, height, padding, width, yTicks }
}

function buildBars(data, formatLabel, preserveOrder, chartWidth = CHART_WIDTH, isLarge = false, domainMax = null) {
  if (!Array.isArray(data) || data.length === 0) return null
  const filteredData = data
    .filter((d) => !isMissing(d.value) && Number(d.value) >= 0)
  const filtered = preserveOrder
    ? filteredData
    : filteredData.sort((a, b) => Number(b.value) - Number(a.value))
  if (filtered.length === 0) return null

  const width = Math.max(isLarge ? 240 : 280, Number(chartWidth) || CHART_WIDTH)
  const compact = width < 720
  const narrow = width < 480
  const veryNarrow = width < 320
  const padding = isLarge
    ? narrow
      ? veryNarrow
        ? { top: 24, right: 42, bottom: 38, left: 100 }
        : { top: 24, right: 48, bottom: 38, left: 104 }
      : compact
        ? { top: 24, right: 92, bottom: 38, left: 196 }
        : { top: 24, right: 128, bottom: 36, left: 228 }
    : PADDING
  const labelLineLength = isLarge
    ? veryNarrow ? 12 : narrow ? 14 : compact ? 26 : 34
    : 34
  const categoryLines = filtered.map((d) => wrapLabel(d.label, labelLineLength))
  const categoryLineHeight = 14
  const maxCategoryLines = Math.max(...categoryLines.map((lines) => lines.length), 1)
  const baseRowHeight = isLarge
    ? Math.min(104, Math.max(52, Math.floor(208 / filtered.length)))
    : BAR_ROW_HEIGHT
  const rowHeight = Math.max(baseRowHeight, maxCategoryLines * categoryLineHeight + 18)
  const barGap = isLarge ? Math.max(18, rowHeight - 34) : BAR_GAP
  const barHeight = rowHeight - barGap
  const configuredMax = Number(domainMax)
  const maxVal = Number.isFinite(configuredMax) && configuredMax > 0
    ? configuredMax
    : Math.max(...filtered.map((d) => Number(d.value)), 1)
  const plotW = Math.max(24, width - padding.left - padding.right)
  const bars = filtered.map((d, i) => {
    const value = Number(d.value)
    return {
      index: i,
      y: padding.top + i * rowHeight + (rowHeight - barHeight) / 2,
      width: (value / maxVal) * plotW,
      categoryLines: categoryLines[i],
      fullCategory: d.label,
      label: formatLabel(value),
      rawValue: value,
    }
  })
  const xTicksRaw = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal]
  const xTicks = xTicksRaw.map((val) => ({
    label: Math.round(val).toLocaleString('pt-BR'),
    x: padding.left + (val / maxVal) * plotW,
  }))
  return {
    bars,
    barHeight,
    categoryLineHeight,
    height: padding.top + padding.bottom + filtered.length * rowHeight,
    padding,
    rowHeight,
    width,
    xTicks,
  }
}

function wrapLabel(label, maxLength = 34) {
  const words = String(label ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']

  const lines = []
  let currentLine = ''

  words.forEach((word) => {
    const pendingWords = word.length > maxLength
      ? word.match(new RegExp(`.{1,${maxLength}}`, 'g')) ?? [word]
      : [word]

    pendingWords.forEach((part) => {
      const candidate = currentLine ? `${currentLine} ${part}` : part
      if (candidate.length <= maxLength) {
        currentLine = candidate
        return
      }
      if (currentLine) lines.push(currentLine)
      currentLine = part
    })
  })

  if (currentLine) lines.push(currentLine)
  return lines
}

function shortenLabel(label, maxLength = 34) {
  if (!label || label.length <= maxLength) return label
  return `${label.slice(0, Math.max(1, maxLength - 3))}...`
}
