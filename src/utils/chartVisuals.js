const CHART_SERIES = [
  'var(--chart-series-1)',
  'var(--chart-series-2)',
  'var(--chart-series-3)',
  'var(--chart-series-4)',
  'var(--chart-series-5)',
  'var(--chart-series-6)',
]

const LEGACY_COLOR_MAP = new Map([
  ['#16713a', 'var(--chart-primary)'],
  ['#1f6f3a', 'var(--chart-primary)'],
  ['#3e7a5e', 'var(--chart-primary)'],
  ['#0f766e', 'var(--chart-series-1)'],
  ['#2563eb', 'var(--chart-series-2)'],
  ['#f59e0b', 'var(--chart-series-3)'],
  ['#7c3aed', 'var(--chart-series-4)'],
  ['#db2777', 'var(--chart-series-5)'],
  ['#65a30d', 'var(--chart-series-5)'],
  ['#0891b2', 'var(--chart-series-6)'],
  ['#9333ea', 'var(--chart-series-4)'],
])

export function chartSeriesColor(index = 0) {
  return CHART_SERIES[index % CHART_SERIES.length]
}

export function resolveChartColor(color, fallback = 'var(--chart-primary)') {
  if (!color) return fallback
  return LEGACY_COLOR_MAP.get(String(color).toLocaleLowerCase('pt-BR')) ?? color
}

export function closeChartTooltipOnEscape(event, clearActive) {
  if (event.key !== 'Escape') return
  clearActive()
  event.currentTarget.blur()
}
