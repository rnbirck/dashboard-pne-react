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
import { getPneCycleCopy, isClosedPneCycle } from '../utils/pneCycleCopy'
import { InteractionChevron } from './InteractionChevron'

const SPARKLINE_WIDTH = 320
const SPARKLINE_HEIGHT = 48

export function MetaCard({
  buttonRef,
  cycle,
  isSelected = false,
  item,
  onSelect,
  result,
  stageLabel,
}) {
  const cycleCopy = getPneCycleCopy(cycle)
  const unit = resolveIndicatorUnit(item, result)
  const comparable = isComparableIndicator(result)
  const status = getMetaCardStatus(result, comparable, cycleCopy)
  const currentValue = result ? formatIndicatorValue(result.end_value, unit) : '—'
  const metaValue = comparable ? formatMetaValue(result, unit) : 'Sem meta'
  const progress = comparable ? getProgressPercent(result) : null
  const sparkline = getSparkline(result?.series)
  const supportValue = comparable
    ? roundPpString(result?.display?.distance ?? '—')
    : roundPpString(result?.display?.variation ?? '—')
  const supportLabel = comparable ? 'Distância' : 'Variação'
  const quickReading = getQuickReading(result, status, cycle)
  const identifier = item?.metaRef ? `Meta ${item.metaRef}` : 'Indicador'
  const title = getIndicatorTitle(item, result)
  const goalReference = getGoalReference(cycle, item)
  const isNextCycle = cycle === 'pne_2026_2036'

  return (
    <button
      className={`meta-card interaction-card--explorable meta-card--${status.state}${isNextCycle ? ' meta-card--next-cycle' : ''}${isSelected ? ' is-selected' : ''}`}
      ref={buttonRef}
      type="button"
      onClick={onSelect}
      aria-label={`Abrir detalhe do indicador ${title}`}
      aria-pressed={isSelected}
      title={title}
    >
      <span className="meta-card__topline">
        <span className="meta-card__identifier">{identifier}</span>
        <StatusBadge
          displayStatus={status.label}
          status={status.rawStatus}
          title={status.label}
          tone={status.tone}
        />
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
        <span
          className="meta-card__sparkline"
          role="img"
          aria-label={`Série histórica de ${sparkline.firstYear} a ${sparkline.lastYear}`}
        >
          <svg aria-hidden="true" viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}>
            <path className="meta-card__sparkline-area" d={sparkline.areaPath} />
            <path className="meta-card__sparkline-line" d={sparkline.linePath} />
            <circle
              className="meta-card__sparkline-end"
              cx={sparkline.lastPoint.x}
              cy={sparkline.lastPoint.y}
              r="3.6"
            />
          </svg>
          <span className="meta-card__sparkline-period" aria-hidden="true">
            {sparkline.firstYear}–{sparkline.lastYear}
          </span>
        </span>
      ) : (
        <span className="meta-card__sparkline meta-card__sparkline--empty" aria-hidden="true">
          <span className="meta-card__sparkline-empty-label">Histórico não disponível.</span>
        </span>
      )}

      <span className="meta-card__reading">{quickReading}</span>

      <span className="meta-card__footer">
        {stageLabel ? <span>{stageLabel}</span> : null}
        <InteractionChevron />
      </span>
    </button>
  )
}

function getMetaCardStatus(result, comparable, cycleCopy) {
  const rawStatus = result?.display?.status ?? ''
  const normalized = String(rawStatus).toLocaleLowerCase('pt-BR')

  if (
    !result ||
    result.available === false ||
    normalized.includes('indispon') ||
    normalized.includes('sem dados')
  ) {
    return { label: cycleCopy.status.missing, rawStatus, state: 'missing', tone: 'muted' }
  }

  if (!comparable || normalized.includes('visualiza') || normalized.includes('informativo')) {
    return { label: 'Sem meta', rawStatus, state: 'no-goal', tone: 'muted' }
  }

  if (result.atingida === true) {
    return { label: cycleCopy.status.achieved, rawStatus, state: 'success', tone: 'success' }
  }

  const isDanger =
    normalized.includes('distante') ||
    normalized.includes('crítico') ||
    normalized.includes('critico') ||
    normalized.includes('não atingida') ||
    normalized.includes('nao atingida')

  if (result.atingida === false) {
    return {
      label: cycleCopy.status.below,
      rawStatus,
      state: isDanger ? 'danger' : 'warning',
      tone: isDanger ? 'danger' : 'warning',
    }
  }

  return { label: cycleCopy.status.missing, rawStatus, state: 'missing', tone: 'muted' }
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

  return {
    areaPath,
    firstYear: points[0].year,
    lastPoint,
    lastYear: points[points.length - 1].year,
    linePath,
  }
}

function getQuickReading(result, status, cycle) {
  const cycleCopy = getPneCycleCopy(cycle)
  const isClosedCycle = isClosedPneCycle(cycle)

  if (status.state === 'missing') return `${cycleCopy.status.missing}.`
  if (status.state === 'no-goal') return 'Indicador acompanhado como contexto, sem meta definida.'

  if (result?.atingida === true) {
    if (result?.direction === 'at_most') {
      return isClosedCycle
        ? 'Resultado consolidado dentro do limite definido para a meta.'
        : 'O valor mais recente está dentro do limite definido para a meta no momento.'
    }
    return isClosedCycle
      ? 'Resultado consolidado na referência definida para o ciclo.'
      : 'O valor mais recente atinge a referência no momento.'
  }

  if (result?.direction === 'at_most') {
    return isClosedCycle
      ? 'Resultado consolidado acima do limite definido para a meta.'
      : 'O valor mais recente ainda está acima do limite definido para a meta.'
  }

  return isClosedCycle
    ? 'Resultado consolidado abaixo da meta definida para o ciclo.'
    : 'O valor mais recente ainda não atinge a referência.'
}
