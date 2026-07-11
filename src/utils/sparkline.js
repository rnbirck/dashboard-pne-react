export const DEFAULT_SPARKLINE_GEOMETRY = Object.freeze({
  width: 320,
  height: 56,
  insetX: 2,
  insetY: 7,
  baselineOffset: 4,
})

export function buildSparklineModel(
  series = [],
  {
    width = DEFAULT_SPARKLINE_GEOMETRY.width,
    height = DEFAULT_SPARKLINE_GEOMETRY.height,
    insetX = DEFAULT_SPARKLINE_GEOMETRY.insetX,
    insetY = DEFAULT_SPARKLINE_GEOMETRY.insetY,
    baselineOffset = DEFAULT_SPARKLINE_GEOMETRY.baselineOffset,
  } = {},
) {
  const points = series
    .map((point) => ({
      value: Number(point?.valor),
      year: Number(point?.ano),
    }))
    .filter((point) => Number.isFinite(point.value) && Number.isFinite(point.year))
    .sort((a, b) => a.year - b.year)

  if (points.length < 3) return null

  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const baseline = height - baselineOffset
  const step = (width - insetX * 2) / (points.length - 1)

  const scaledPoints = points.map((point, index) => {
    const x = insetX + index * step
    const y = range === 0
      ? height / 2
      : baseline - ((point.value - min) / range) * (height - insetY * 2)

    return { x, y }
  })

  const linePath = scaledPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')
  const firstPoint = scaledPoints[0]
  const lastPoint = scaledPoints[scaledPoints.length - 1]
  const areaPath = `${linePath} L${lastPoint.x.toFixed(1)} ${baseline.toFixed(1)} L${firstPoint.x.toFixed(1)} ${baseline.toFixed(1)} Z`

  return {
    areaPath,
    firstYear: points[0].year,
    lastPoint,
    lastYear: points[points.length - 1].year,
    linePath,
  }
}
