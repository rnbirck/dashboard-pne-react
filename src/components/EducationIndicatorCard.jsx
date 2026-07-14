import { ExplorableIndicatorCardFrame } from './ExplorableIndicatorCardFrame'

const EM = '\u2014'
const EDUCATION_CARD_CLASS_CONTRACT = Object.freeze({
  root: 'education-indicator-card',
  statusModifier: (tone) => `education-indicator-card--${tone}`,
  topline: 'education-indicator-card__topline',
  context: 'education-indicator-card__theme',
  title: 'education-indicator-card__title',
  description: 'education-indicator-card__description',
  valueRow: 'education-indicator-card__value-row',
  metadata: 'education-indicator-card__metadata',
  metadataItem: 'education-indicator-card__metadata-item',
  metadataLabel: 'education-indicator-card__metadata-label',
  metadataValue: 'education-indicator-card__metadata-value',
  divider: 'education-indicator-card__divider',
  insight: 'education-indicator-card__insight',
  insightItem: 'education-indicator-card__insight-item',
  insightLabel: 'education-indicator-card__insight-label',
  insightValue: 'education-indicator-card__insight-value',
  footer: 'education-indicator-card__footer',
  action: 'education-indicator-card__action',
})

export function EducationIndicatorCard({ buttonRef, indicator, isSelected = false, onSelect }) {
  const isExploratory = indicator.cardVariant === 'exploratory'
  const statusTone = isExploratory ? 'info' : indicator.statusTone ?? 'default'
  const exploratorySummary = indicator.exploratorySummary ?? {}
  const contextLabel = indicator.themeShortLabel ?? indicator.themeLabel ?? (isExploratory ? 'Escolas' : 'Indicador')
  const normalizedContext = String(contextLabel).trim().toLocaleLowerCase('pt-BR')
  const normalizedCategory = String(indicator.categoryLabel ?? '').trim().toLocaleLowerCase('pt-BR')
  const mainCutLabel = String(indicator.mainCutLabel ?? '').trim()
  const normalizedMainCut = mainCutLabel.toLocaleLowerCase('pt-BR')
  const footerMainCut = normalizedMainCut && normalizedMainCut !== normalizedContext && normalizedMainCut !== normalizedCategory
    ? mainCutLabel
    : null
  const currentDisplay = indicator.currentDisplay ?? EM
  const currentYear = isExploratory ? exploratorySummary.latestYear : indicator.currentYear
  const hasCurrentValue = currentDisplay !== EM && currentDisplay !== ''
  const hasComparison = !isExploratory
    && Array.isArray(indicator.series)
    && indicator.series.length >= 2
    && indicator.initialYear !== null
    && indicator.initialYear !== undefined
    && indicator.currentYear !== null
    && indicator.currentYear !== undefined
    && indicator.variationRaw !== null
    && indicator.variationRaw !== undefined
    && Number.isFinite(Number(indicator.variationRaw))
  const variationDisplay = hasComparison ? formatCardVariation(indicator) : null
  const reading = getCardReading({
    hasComparison,
    hasCurrentValue,
    hasSeries: Array.isArray(indicator.series) && indicator.series.length > 0,
    isExploratory,
    variationRaw: indicator.variationRaw,
  })
  const direction = getCardDirection({
    hasComparison,
    hasCurrentValue,
    isExploratory,
    variationRaw: indicator.variationRaw,
  })
  const period = hasComparison ? `${indicator.initialYear}\u2013${indicator.currentYear}` : null
  const unitLabel = getCardUnitLabel(indicator)
  const statusLabel = isExploratory ? 'Com dados' : indicator.statusLabel
  const footerLabel = footerMainCut || mainCutLabel || contextLabel
  const title = isExploratory ? indicator.cardTitle : indicator.label
  const description = String(indicator.description ?? '').trim()
  const value = isExploratory
    ? {
        display: exploratorySummary.count ?? EM,
        metaLabel: exploratorySummary.label ?? 'dimensões',
      }
    : {
        display: currentDisplay,
        metaLabel: unitLabel,
      }
  const ariaLabel = isExploratory
    ? [
        `Abrir panorama da infraestrutura escolar. ${title}.`,
        `${exploratorySummary.count ?? EM} ${exploratorySummary.label ?? 'dimensões'}, ano ${exploratorySummary.latestYear ?? 'indisponível'}.`,
        description ? `Descrição: ${description}.` : '',
      ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
    : [
        `Abrir detalhe do indicador ${indicator.label}.`,
        `Valor ${currentDisplay},`,
        currentYear ? `ano ${currentYear}.` : 'ano indisponível.',
        statusLabel ? `${statusLabel}.` : '',
        variationDisplay ? `Variação desde ${indicator.initialYear}: ${variationDisplay}.` : '',
        description ? `Descrição: ${description}.` : '',
      ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()

  const viewModel = {
    anatomy: 'education',
    ariaLabel,
    contextLabel,
    description: indicator.description,
    footer: {
      primary: footerLabel,
      actionLabel: isExploratory ? 'Abrir panorama' : 'Abrir detalhes',
    },
    insight: {
      reading,
      period,
    },
    metadata: {
      year: currentYear ?? 'Indisponível',
      variation: variationDisplay
        ? {
            label: `Variação desde ${indicator.initialYear}`,
            direction,
            value: variationDisplay,
          }
        : null,
    },
    status: {
      direction,
      label: statusLabel,
      marker: getDirectionMarker(direction),
      tone: statusTone,
    },
    title,
    value,
    variant: indicator.cardVariant,
  }

  return (
    <ExplorableIndicatorCardFrame
      buttonRef={buttonRef}
      classContract={EDUCATION_CARD_CLASS_CONTRACT}
      isSelected={isSelected}
      onSelect={onSelect}
      viewModel={viewModel}
    />
  )
}

function getCardDirection({ hasComparison, hasCurrentValue, isExploratory, variationRaw }) {
  if (!hasCurrentValue) return 'missing'
  if (isExploratory || !hasComparison) return 'data'
  if (Number(variationRaw) > 0) return 'up'
  if (Number(variationRaw) < 0) return 'down'
  return 'stable'
}

function getDirectionMarker(direction) {
  if (direction === 'up') return '\u2197'
  if (direction === 'stable') return '\u2192'
  if (direction === 'down') return '\u2198'
  return ''
}

function getCardReading({ hasComparison, hasCurrentValue, hasSeries, isExploratory, variationRaw }) {
  if (isExploratory) return 'Série disponível'
  if (!hasCurrentValue) return 'Leitura recente indisponível'
  if (!hasComparison) return hasSeries ? 'Série disponível' : 'Leitura recente indisponível'
  if (Number(variationRaw) > 0) return 'Crescimento recente'
  if (Number(variationRaw) < 0) return 'Redução recente'
  return 'Estabilidade recente'
}

function getCardUnitLabel(indicator) {
  const unit = String(indicator.unit ?? '').trim()
  if (!unit || indicator.formatType === 'percent' || unit.toLocaleLowerCase('pt-BR') === 'percentual') return null
  return unit
}

function formatCardVariation(indicator) {
  const initialValue = Number(indicator.initialValue)
  const currentValue = Number(indicator.currentValue)
  if (!Number.isFinite(initialValue) || !Number.isFinite(currentValue)) return null

  const difference = currentValue - initialValue
  const format = typeof indicator.formatValue === 'function'
    ? indicator.formatValue
    : (value) => Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  const formattedDifference = format(difference)
  const signedDifference = difference > 0 ? `+${formattedDifference}` : formattedDifference

  if (indicator.formatType === 'percent') return `${signedDifference} p.p.`
  const unit = getCardUnitLabel(indicator)
  return unit ? `${signedDifference} ${unit}` : signedDifference
}
