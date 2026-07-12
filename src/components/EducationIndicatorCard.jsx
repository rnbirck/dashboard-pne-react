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
  support: 'education-indicator-card__support',
  footer: 'education-indicator-card__footer',
  sparkline: Object.freeze({
    root: 'education-indicator-card__sparkline',
    area: 'education-indicator-card__sparkline-area',
    line: 'education-indicator-card__sparkline-line',
    end: 'education-indicator-card__sparkline-end',
    period: 'education-indicator-card__sparkline-period',
    empty: 'education-indicator-card__sparkline--empty',
  }),
})

export function EducationIndicatorCard({ buttonRef, indicator, isSelected = false, onSelect }) {
  const isExploratory = indicator.cardVariant === 'exploratory'
  const statusTone = indicator.statusTone ?? 'default'
  const periodLabel = indicator.initialYear && indicator.currentYear
    ? `desde ${indicator.initialYear}`
    : 'no período'
  const exploratorySummary = indicator.exploratorySummary ?? {}
  const contextLabel = isExploratory
    ? 'Infraestrutura escolar'
    : indicator.themeShortLabel ?? indicator.themeLabel ?? 'Indicador'
  const normalizedContext = String(contextLabel).trim().toLocaleLowerCase('pt-BR')
  const normalizedCategory = String(indicator.categoryLabel ?? '').trim().toLocaleLowerCase('pt-BR')
  const mainCutLabel = String(indicator.mainCutLabel ?? '').trim()
  const normalizedMainCut = mainCutLabel.toLocaleLowerCase('pt-BR')
  const footerMainCut = normalizedMainCut && normalizedMainCut !== normalizedContext && normalizedMainCut !== normalizedCategory
    ? mainCutLabel
    : null
  const viewModel = {
    ariaLabel: isExploratory
      ? `Abrir panorama da infraestrutura escolar. ${exploratorySummary.count ?? EM} ${exploratorySummary.label ?? 'dimensões'}, ano ${exploratorySummary.latestYear ?? 'indisponível'}.`
      : `Abrir detalhe do indicador ${indicator.label}. Valor ${indicator.currentDisplay ?? EM}, ${indicator.currentYear ? `ano ${indicator.currentYear}` : 'ano indisponível'}. ${indicator.statusLabel ?? ''}. Variação ${periodLabel}: ${indicator.variationDisplay ?? EM}`.replace(/\.{2,}/g, '.').replace(/\s+/g, ' ').trim(),
    contextLabel,
    description: indicator.description,
    footer: {
      primary: isExploratory ? 'Abrir panorama' : footerMainCut,
      secondary: isExploratory
        ? exploratorySummary.groupCount ? `${exploratorySummary.groupCount} grupos` : null
        : null,
    },
    hideSparkline: isExploratory,
    hideStatus: isExploratory,
    status: {
      label: indicator.statusLabel,
      tone: statusTone,
    },
    support: isExploratory
      ? {
          label: 'Último ano',
          value: exploratorySummary.latestYear ?? EM,
        }
      : {
          label: `Variação ${periodLabel}`,
          value: indicator.variationDisplay ?? EM,
        },
    title: isExploratory ? indicator.cardTitle : indicator.label,
    value: isExploratory
      ? {
          display: exploratorySummary.count ?? EM,
          metaLabel: exploratorySummary.label ?? 'dimensões',
        }
      : {
          display: indicator.currentDisplay ?? EM,
          metaLabel: indicator.currentYear ? `Ano ${indicator.currentYear}` : 'Ano indisponível',
        },
    variant: indicator.cardVariant,
    sparklineSeries: isExploratory ? null : indicator.series,
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
