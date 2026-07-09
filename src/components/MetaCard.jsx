import { isComparableIndicator } from './IndicatorDetail'
import { StatusBadge } from './StatusBadge'
import { PNE_2026_GOAL_TEXTS } from '../data/pne2026GoalTexts'
import { PNE_2014_GOAL_TEXTS } from '../data/pne2014GoalTexts'
import {
  formatIndicatorValue,
  formatMetaValue,
  getIndicatorTitle,
  resolveIndicatorUnit,
  roundPpString,
} from '../utils/format'

const SPARKLINE_WIDTH = 320
const SPARKLINE_HEIGHT = 48

export function MetaCard({
  cycle,
  isSelected = false,
  item,
  onSelect,
  result,
  stageLabel,
}) {
  const unit = resolveIndicatorUnit(item, result)
  const comparable = isComparableIndicator(result)
  const status = getMetaCardStatus(result, comparable)
  const currentValue = result ? formatIndicatorValue(result.end_value, unit) : '—'
  const metaValue = comparable ? formatMetaValue(result, unit) : 'Sem meta'
  const progress = comparable ? getProgressPercent(result) : null
  const sparkline = getSparkline(result?.series)
  const supportValue = comparable
    ? roundPpString(result?.display?.distance ?? '—')
    : roundPpString(result?.display?.variation ?? '—')
  const supportLabel = comparable ? 'Distância' : 'Variação'
  const quickReading = getQuickReading(result, status)
  const identifier = item?.metaRef ? `Meta ${item.metaRef}` : 'Indicador'
  const title = getIndicatorTitle(item, result)
  const goalReference = getGoalReference(cycle, item)
  const isNextCycle = cycle === 'pne_2026_2036'

  return (
    <button
      className={`meta-card meta-card--${status.state}${isNextCycle ? ' meta-card--next-cycle' : ''}${isSelected ? ' is-selected' : ''}`}
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      title={title}
    >
      <span className="meta-card__topline">
        <span className="meta-card__identifier">{identifier}</span>
        <StatusBadge displayStatus={status.label} status={status.rawStatus} tone={status.tone} />
      </span>

      <span className="meta-card__title">{title}</span>
      {goalReference ? (
        <span className={`meta-card__pne-reference${isNextCycle ? ' meta-card__pne-reference--full' : ''}`}>
          <strong>{identifier}</strong>{' '}
          <span>— {goalReference}</span>
        </span>
      ) : null}

      <span className="meta-card__value-row">
        <strong>{currentValue}</strong>
        <span>{metaValue === 'Sem meta' ? 'sem meta' : `meta ${metaValue}`}</span>
      </span>

      {progress !== null ? (
        <span className="meta-card__progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </span>
      ) : (
        <span className="meta-card__no-progress">Sem meta comparável</span>
      )}

      <span className="meta-card__support">
        <span>{supportLabel}</span>
        <strong>{supportValue}</strong>
      </span>

      {sparkline ? (
        <span className="meta-card__sparkline" aria-hidden="true">
          <svg viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}>
            <path className="meta-card__sparkline-area" d={sparkline.areaPath} />
            <path className="meta-card__sparkline-line" d={sparkline.linePath} />
            <circle
              className="meta-card__sparkline-end"
              cx={sparkline.lastPoint.x}
              cy={sparkline.lastPoint.y}
              r="3.2"
            />
          </svg>
        </span>
      ) : (
        <span className="meta-card__sparkline meta-card__sparkline--empty" aria-hidden="true" />
      )}

      <span className="meta-card__reading">{quickReading}</span>

      <span className="meta-card__footer">
        {stageLabel ? <span>{stageLabel}</span> : null}
      </span>
    </button>
  )
}

function getMetaCardStatus(result, comparable) {
  const rawStatus = result?.display?.status ?? ''
  const normalized = String(rawStatus).toLocaleLowerCase('pt-BR')

  if (
    !result ||
    result.available === false ||
    normalized.includes('indispon') ||
    normalized.includes('sem dados')
  ) {
    return { label: 'Sem dados', rawStatus, state: 'missing', tone: 'muted' }
  }

  if (!comparable || normalized.includes('visualiza') || normalized.includes('informativo')) {
    return { label: 'Sem meta', rawStatus, state: 'no-goal', tone: 'muted' }
  }

  if (result.atingida === true) {
    if (result.direction === 'at_most') {
      return { label: 'Dentro do limite', rawStatus, state: 'success', tone: 'success' }
    }
    return { label: 'No ritmo', rawStatus, state: 'success', tone: 'success' }
  }

  if (
    normalized.includes('distante') ||
    normalized.includes('crítico') ||
    normalized.includes('critico') ||
    normalized.includes('não atingida') ||
    normalized.includes('nao atingida')
  ) {
    return {
      label: normalized.includes('não atingida') || normalized.includes('nao atingida')
        ? 'Não atingida'
        : 'Distante',
      rawStatus,
      state: 'danger',
      tone: 'danger',
    }
  }

  return { label: 'Atenção', rawStatus, state: 'warning', tone: 'warning' }
}

function getGoalReference(cycle, item) {
  const goalTexts = cycle === 'pne_2026_2036'
    ? PNE_2026_GOAL_TEXTS
    : cycle === 'pne_2014_2024'
      ? PNE_2014_GOAL_TEXTS
      : null
  const legalGoal = goalTexts && item?.metaRef
    ? goalTexts[item.metaRef]
    : null

  return legalGoal?.dashboardText || legalGoal?.displayText || legalGoal?.originalText || ''
}

function getProgressPercent(result) {
  const current = Number(result?.end_value)
  const meta = Number(result?.meta)
  if (!Number.isFinite(current) || !Number.isFinite(meta) || meta <= 0 || current < 0) {
    return null
  }
  if (result?.direction === 'at_most') {
    if (current <= meta) return 100
    if (current <= 0) return 100
    return Math.max(0, Math.min(100, (meta / current) * 100))
  }
  return Math.max(0, Math.min(100, (current / meta) * 100))
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
  const insetX = 1.5
  const insetY = 5
  const baseline = SPARKLINE_HEIGHT - 3
  const step = points.length > 1 ? (SPARKLINE_WIDTH - insetX * 2) / (points.length - 1) : 0

  const scaledPoints = points
    .map((point, index) => {
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

  return { areaPath, linePath, lastPoint }
}

function getQuickReading(result, status) {
  if (status.state === 'missing') return 'Sem dado disponível para este município.'
  if (status.state === 'no-goal') return 'Indicador acompanhado como contexto, sem meta definida.'
  if (status.state === 'success' && result?.direction === 'at_most') {
    return 'Resultado dentro do limite maximo definido para a meta.'
  }
  if (status.state === 'success') return 'Trajetória favorável para a referência acompanhada.'

  const variation = parseDisplayNumber(result?.display?.variation)
  if (status.state === 'danger') {
    if (result?.direction === 'at_most') {
      return 'Acima do limite maximo; requer reducao do indicador.'
    }
    return variation < 0
      ? 'Recuo no período e distância relevante da meta.'
      : 'Distância relevante da meta; requer ação prioritária.'
  }
  if (variation > 0) return 'Avança, mas o ritmo ainda exige atenção.'
  if (variation < 0) return 'Recuo no período; exige atenção para retomada.'
  return 'Ritmo insuficiente para aproximação da meta.'
}

function parseDisplayNumber(value) {
  const match = String(value ?? '').match(/[-+]?\d+(?:[,.]\d+)?/)
  if (!match) return Number.NaN
  const numeric = Number(match[0].replace(',', '.'))
  if (!Number.isFinite(numeric)) return Number.NaN
  const normalized = String(value ?? '').toLocaleLowerCase('pt-BR')
  if (normalized.includes('queda')) return -Math.abs(numeric)
  return numeric
}
