import { DEFAULT_SPARKLINE_GEOMETRY, buildSparklineModel } from '../utils/sparkline'

export function Sparkline({
  series,
  classNames,
  geometry = DEFAULT_SPARKLINE_GEOMETRY,
  pointRadius = 3.4,
}) {
  const sparkline = buildSparklineModel(series, geometry)
  const {
    width = DEFAULT_SPARKLINE_GEOMETRY.width,
    height = DEFAULT_SPARKLINE_GEOMETRY.height,
  } = geometry

  if (!sparkline) {
    return (
      <span className={`${classNames.root} ${classNames.empty}`}>
        Histórico não disponível.
      </span>
    )
  }

  return (
    <span className={classNames.root} aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`}>
        <path className={classNames.area} d={sparkline.areaPath} />
        <path className={classNames.line} d={sparkline.linePath} />
        <circle
          className={classNames.end}
          cx={sparkline.lastPoint.x}
          cy={sparkline.lastPoint.y}
          r={pointRadius}
        />
      </svg>
      <span className={classNames.period}>
        {sparkline.firstYear}–{sparkline.lastYear}
      </span>
    </span>
  )
}
