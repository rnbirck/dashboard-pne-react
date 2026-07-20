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
  const exploratorySummary = indicator.exploratorySummary ?? {}
  const contextLabel = indicator.themeShortLabel ?? indicator.themeLabel ?? (isExploratory ? 'Escolas' : 'Indicador')
  const currentDisplay = indicator.currentDisplay ?? EM
  const currentYear = isExploratory ? exploratorySummary.latestYear : indicator.currentYear
  const hasCurrentValue = Number.isFinite(Number(indicator.currentValue)) && currentDisplay !== EM && currentDisplay !== ''
  const comparison = !isExploratory && hasCurrentValue
    ? getPreviousComparablePoint(indicator, currentYear)
    : null
  const variationDisplay = comparison ? formatCardVariation(indicator, comparison.value) : null
  const seriesPeriod = isExploratory ? null : getCardSeriesPeriod(indicator.series, currentYear)
  const hasSeries = Boolean(seriesPeriod)
  const direction = getCardDirection({
    comparison,
    hasCurrentValue,
    isExploratory,
  })
  const reading = getCardReading({
    comparison,
    direction,
    hasCurrentValue,
    initialYear: seriesPeriod?.initialYear,
    isExploratory,
  })
  const statusLabel = comparison ? getDirectionLabel(direction) : null
  const statusTone = getDirectionTone(direction)
  const unitLabel = getCardUnitLabel(indicator)
  const footerLabel = isExploratory
    ? 'Abrir panorama'
    : hasSeries
      ? 'Ver série histórica'
      : 'Abrir detalhes'
  const footerContext = indicator.stageLabel
    ?? indicator.mainCutLabel
    ?? indicator.recortePrincipal
    ?? indicator.categoryLabel
    ?? contextLabel
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
        variationDisplay ? `Variação em relação a ${comparison.year}: ${variationDisplay}.` : '',
        description ? `Descrição: ${description}.` : '',
      ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()

  const viewModel = {
    anatomy: 'education',
    ariaLabel,
    contextLabel,
    description: indicator.description,
    footer: {
      icon: null,
      primary: isExploratory ? footerLabel : footerContext,
      actionLabel: footerLabel,
    },
    hideStatus: !comparison,
    insight: {
      context: null,
      direction,
      emphasis: reading,
      marker: null,
      reading,
      period: null,
    },
    metadata: {
      year: currentYear ?? 'Indisponível',
      variation: comparison
        ? {
            label: `Var. desde ${comparison.year}`,
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

function getCardDirection({ comparison, hasCurrentValue, isExploratory }) {
  if (!hasCurrentValue) return 'missing'
  if (isExploratory || !comparison) return 'data'
  if (comparison.difference > 0) return 'up'
  if (comparison.difference < 0) return 'down'
  return 'stable'
}

function getDirectionLabel(direction) {
  if (direction === 'up') return 'Alta'
  if (direction === 'down') return 'Queda'
  if (direction === 'stable') return 'Estável'
  return null
}

function getDirectionTone(direction) {
  if (direction === 'up') return 'success'
  if (direction === 'down') return 'warning'
  if (direction === 'stable') return 'muted'
  return 'default'
}

function getDirectionMarker(direction) {
  if (direction === 'up') return '\u2197'
  if (direction === 'stable') return '\u2192'
  if (direction === 'down') return '\u2198'
  return ''
}

function getCardReading({ comparison, direction, hasCurrentValue, initialYear, isExploratory }) {
  if (isExploratory) return 'Panorama disponível por dimensão'
  if (!hasCurrentValue) return 'Leitura recente indisponível'
  if (!comparison) return initialYear ? `Série disponível a partir de ${initialYear}` : 'Sem ano anterior comparável'
  if (direction === 'up') return 'Crescimento recente'
  if (direction === 'down') return 'Redução recente'
  return 'Estabilidade recente'
}

function getCardUnitLabel(indicator) {
  const unit = String(indicator.unit ?? '').trim()
  if (!unit || indicator.formatType === 'percent' || unit.toLocaleLowerCase('pt-BR') === 'percentual') return null
  return unit
}

function getPreviousComparablePoint(indicator, currentYear) {
  const currentValue = Number(indicator.currentValue)
  if (!Number.isFinite(currentValue)) return null

  const points = (Array.isArray(indicator.series) ? indicator.series : [])
    .map((point) => ({ year: Number(point?.ano), value: Number(point?.valor) }))
    .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.value))
    .sort((a, b) => a.year - b.year)
  const numericCurrentYear = Number(currentYear)
  const candidates = Number.isFinite(numericCurrentYear)
    ? points.filter((point) => point.year < numericCurrentYear)
    : points.slice(0, -1)
  const previous = candidates.at(-1)

  return previous
    ? { ...previous, difference: currentValue - previous.value }
    : null
}

function getCardSeriesPeriod(series, currentYear) {
  const years = (Array.isArray(series) ? series : [])
    .map((point) => Number(point?.ano))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  if (!years.length) return null

  const numericCurrentYear = Number(currentYear)
  const initialYear = years[0]
  const finalYear = Number.isFinite(numericCurrentYear) ? numericCurrentYear : years.at(-1) ?? null

  if (!initialYear || !finalYear) return null
  return {
    initialYear,
    label: initialYear === finalYear ? `Desde ${initialYear}` : `${initialYear}\u2013${finalYear}`,
  }
}

function formatCardVariation(indicator, comparisonValue) {
  const previousValue = Number(comparisonValue)
  const currentValue = Number(indicator.currentValue)
  if (!Number.isFinite(previousValue) || !Number.isFinite(currentValue)) return null

  const difference = currentValue - previousValue
  const format = typeof indicator.formatValue === 'function'
    ? indicator.formatValue
    : (value) => Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  const formattedDifference = indicator.formatType === 'percent'
    ? Math.abs(difference).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
    : String(format(Math.abs(difference))).replace(/^[+\-−]\s*/, '')
  const signedDifference = difference > 0
    ? `+${formattedDifference}`
    : difference < 0
      ? `−${formattedDifference}`
      : formattedDifference

  if (indicator.formatType === 'percent') return `${signedDifference} p.p.`
  const unit = getCardUnitLabel(indicator)
  return unit ? `${signedDifference} ${unit}` : signedDifference
}
