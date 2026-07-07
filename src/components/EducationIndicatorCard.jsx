import { StatusBadge } from './StatusBadge'
import { isMissing } from '../utils/educationFormatters'

const EM = '\u2014'
const SPARKLINE_WIDTH = 320
const SPARKLINE_HEIGHT = 56

export function EducationIndicatorCard({ indicator, isSelected = false, onSelect }) {
  const sparkline = getSparkline(indicator.series)
  const statusTone = indicator.statusTone ?? 'default'
  const periodLabel = indicator.initialYear && indicator.currentYear
    ? `desde ${indicator.initialYear}`
    : 'no período'

  return (
    <button
      className={`education-indicator-card education-indicator-card--${statusTone}${isSelected ? ' is-selected' : ''}`}
      type="button"
      onClick={onSelect}
      aria-label={`Abrir detalhe do indicador ${indicator.label}`}
      title={indicator.label}
    >
      <span className="education-indicator-card__topline">
        <span className="education-indicator-card__theme">
          {indicator.themeShortLabel ?? indicator.themeLabel ?? 'Indicador'}
        </span>
        <StatusBadge status={indicator.statusLabel} tone={statusTone} />
      </span>

      <span className="education-indicator-card__title">{indicator.label}</span>
      <span className="education-indicator-card__description">{indicator.description}</span>

      <span className="education-indicator-card__value-row">
        <strong>{indicator.currentDisplay ?? EM}</strong>
        <span>{indicator.currentYear ? `Ano ${indicator.currentYear}` : 'Ano indisponível'}</span>
      </span>

      <span className="education-indicator-card__support">
        <span>Variação {periodLabel}</span>
        <strong>{indicator.variationDisplay ?? EM}</strong>
      </span>

      {sparkline ? (
        <span className="education-indicator-card__sparkline" aria-hidden="true">
          <svg viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}>
            <path className="education-indicator-card__sparkline-area" d={sparkline.areaPath} />
            <path className="education-indicator-card__sparkline-line" d={sparkline.linePath} />
            <circle
              className="education-indicator-card__sparkline-end"
              cx={sparkline.lastPoint.x}
              cy={sparkline.lastPoint.y}
              r="3.4"
            />
          </svg>
        </span>
      ) : (
        <span className="education-indicator-card__sparkline education-indicator-card__sparkline--empty">
          Sem histórico suficiente
        </span>
      )}

      <span className="education-indicator-card__footer">
        <span>{indicator.categoryLabel ?? 'Geral'}</span>
        {indicator.mainCutLabel ? <span>{indicator.mainCutLabel}</span> : null}
      </span>
    </button>
  )
}

function getSparkline(series = []) {
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
  const insetX = 2
  const insetY = 7
  const baseline = SPARKLINE_HEIGHT - 4
  const step = (SPARKLINE_WIDTH - insetX * 2) / (points.length - 1)

  const scaledPoints = points.map((point, index) => {
    const x = insetX + index * step
    const y = range === 0
      ? SPARKLINE_HEIGHT / 2
      : baseline - ((point.value - min) / range) * (SPARKLINE_HEIGHT - insetY * 2)

    return { x, y }
  })

  const linePath = scaledPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')
  const firstPoint = scaledPoints[0]
  const lastPoint = scaledPoints[scaledPoints.length - 1]
  const areaPath = `${linePath} L${lastPoint.x.toFixed(1)} ${baseline.toFixed(1)} L${firstPoint.x.toFixed(1)} ${baseline.toFixed(1)} Z`

  return isMissing(min) || isMissing(max) ? null : { areaPath, linePath, lastPoint }
}
