import { isComparableIndicator } from './IndicatorDetail'
import { StatusBadge } from './StatusBadge'
import {
  formatIndicatorValue,
  formatMetaValue,
  getIndicatorTitle,
  resolveIndicatorUnit,
  roundPpString,
} from '../utils/format'
import { formatPpDifference, getStateReferenceComparison } from '../utils/stateReference'
import { getPneCycleCopy } from '../utils/pneCycleCopy'
import { InteractionChevron } from './InteractionChevron'

const STATE_REFERENCE_EPSILON = 0.05
const TREND_PRESENTATIONS = Object.freeze({
  up: Object.freeze({ icon: '↗', label: 'Alta', ariaDirection: 'alta' }),
  stable: Object.freeze({ icon: '→', label: 'Estável', ariaDirection: 'estável' }),
  down: Object.freeze({ icon: '↘', label: 'Queda', ariaDirection: 'queda' }),
})

export function MetaCard({
  buttonRef,
  cycle,
  isSelected = false,
  item,
  onSelect,
  result,
  stateReference,
  stageLabel,
}) {
  const cycleCopy = getPneCycleCopy(cycle)
  const unit = resolveIndicatorUnit(item, result)
  const isApproximate = isApproximateIndicator(item, result)
  const comparable = isComparableIndicator(result)
  const status = getMetaCardStatus(result, comparable, cycleCopy, isApproximate)
  const isNextCycle = cycle === 'pne_2026_2036'
  const currentValue = result
    ? isApproximate
      ? formatApproximatePercent(result.end_value)
      : formatIndicatorValue(result.end_value, unit)
    : '—'
  const referenceValue = result?.reference_value ?? item?.reference_value
  const metaValue = comparable
    ? formatMetaValue(result, unit)
    : isApproximate
      ? formatIndicatorValue(referenceValue, unit)
      : 'Sem meta'
  const progress = comparable ? getProgressPercent(result) : null
  const supportValue = comparable
    ? roundPpString(result?.display?.distance ?? '—')
    : isApproximate
      ? formatApproximateDifference(result?.reference_difference)
      : roundPpString(result?.display?.variation ?? '—')
  const supportLabel = comparable
    ? 'Distância'
    : isApproximate
      ? 'Diferença'
      : 'Variação'
  const identifier = item?.metaRef ? `Meta ${item.metaRef}` : 'Indicador'
  const title = getIndicatorTitle(item, result)
  const stateComparison = getStateReferenceComparison(
    stateReference,
    item?.key,
    result,
    unit,
  )
  const stateComparisonTone = stateComparison
    ? getStateComparisonTone(stateComparison.difference)
    : null
  const trendPresentation = isNextCycle ? getTrendPresentation(result?.trend) : null
  const cardAriaLabel = trendPresentation
    ? `Abrir detalhe do indicador ${title}. Tendência: ${trendPresentation.ariaDirection}, de ${trendPresentation.startYear} a ${trendPresentation.endYear}.`
    : `Abrir detalhe do indicador ${title}`

  return (
    <button
      className={`meta-card meta-card--cycle interaction-card--explorable meta-card--${status.state}${isNextCycle ? ' meta-card--next-cycle' : ' meta-card--closed-cycle'}${trendPresentation ? ' meta-card--has-trend' : ''}${isSelected ? ' is-selected' : ''}`}
      ref={buttonRef}
      type="button"
      onClick={onSelect}
      aria-label={cardAriaLabel}
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

      <span className="meta-card__value-row">
        <span className="meta-card__metric meta-card__metric--current">
          <span>Município</span>
          <strong>{currentValue}</strong>
        </span>
        <span className="meta-card__metric meta-card__metric--target">
          <span>{isApproximate ? 'Ref.' : 'Meta PNE'}</span>
          <strong>{metaValue}</strong>
        </span>
        <span className="meta-card__metric meta-card__metric--distance">
          <span>{supportLabel}</span>
          <strong>{supportValue}</strong>
        </span>
        {trendPresentation ? (
          <span className="meta-card__metric meta-card__metric--trend">
            <span>Tendência</span>
            <strong className="meta-card__trend-value">
              <span aria-hidden="true" className="meta-card__trend-icon">
                {trendPresentation.icon}
              </span>
              <span>{trendPresentation.label}</span>
            </strong>
          </span>
        ) : null}
      </span>

      <span className="meta-card__progress-group">
        {progress !== null ? (
          <span
            className="meta-card__progress"
            aria-label={`Comparação do resultado municipal ${currentValue} com a meta ${metaValue}`}
          >
            <span style={{ width: `${progress}%` }} />
          </span>
        ) : (
          <span className="meta-card__no-progress">
            {isApproximate ? 'Referência legal final: 50% em 2036' : 'Sem meta comparável'}
          </span>
        )}
      </span>

      {stateComparison ? (
        <span
          className={`meta-card__state-reference meta-card__state-reference--${stateComparisonTone}`}
          aria-label={`Referência RS ${formatIndicatorValue(stateComparison.stateValue, unit)}; Município vs RS ${formatPpDifference(stateComparison.difference)}; ano ${stateComparison.year}`}
        >
          <span>
            <span>Referência RS</span>
            <strong>{formatIndicatorValue(stateComparison.stateValue, unit)}</strong>
          </span>
          <span>
            <span>Município vs RS</span>
            <strong>{formatPpDifference(stateComparison.difference)}</strong>
          </span>
        </span>
      ) : null}

      <span className="meta-card__footer">
        {stageLabel ? <span>{stageLabel}</span> : null}
        <InteractionChevron />
      </span>
    </button>
  )
}

function getTrendPresentation(trend) {
  const presentation = TREND_PRESENTATIONS[trend?.status]
  const startYear = Number(trend?.start_year)
  const endYear = Number(trend?.end_year)

  if (!presentation || !Number.isInteger(startYear) || !Number.isInteger(endYear)) {
    return null
  }

  return { ...presentation, startYear, endYear }
}

function getStateComparisonTone(difference) {
  const numeric = Number(difference)
  if (!Number.isFinite(numeric) || Math.abs(numeric) <= STATE_REFERENCE_EPSILON) {
    return 'neutral'
  }
  return numeric > 0 ? 'positive' : 'negative'
}

function getMetaCardStatus(result, comparable, cycleCopy, isApproximate) {
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

  if (isApproximate) {
    return { label: 'Indicador aproximado', rawStatus, state: 'no-goal', tone: 'info' }
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

function isApproximateIndicator(item, result) {
  return (
    item?.monitoring_mode === 'approximate_reference' ||
    result?.monitoring_mode === 'approximate_reference'
  )
}

function formatApproximatePercent(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return `${numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function formatApproximateDifference(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  const sign = numeric > 0 ? '+' : ''
  return `${sign}${numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} p.p.`
}

function getProgressPercent(result) {
  const current = Number(result?.end_value)
  const meta = Number(result?.meta)
  if (!Number.isFinite(current) || !Number.isFinite(meta) || meta <= 0 || current < 0) {
    return null
  }
  if (result?.direction === 'at_most') {
    if (current <= meta) return 100
    return Math.max(0, Math.min(100, (meta / current) * 100))
  }
  return Math.max(0, Math.min(100, (current / meta) * 100))
}
