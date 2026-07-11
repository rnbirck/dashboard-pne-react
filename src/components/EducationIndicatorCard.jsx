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
  const statusTone = indicator.statusTone ?? 'default'
  const periodLabel = indicator.initialYear && indicator.currentYear
    ? `desde ${indicator.initialYear}`
    : 'no período'
  const viewModel = {
    ariaLabel: `Abrir detalhe do indicador ${indicator.label}`,
    contextLabel: indicator.themeShortLabel ?? indicator.themeLabel ?? 'Indicador',
    description: indicator.description,
    footer: {
      primary: indicator.categoryLabel ?? 'Geral',
      secondary: indicator.mainCutLabel,
    },
    sparklineSeries: indicator.series,
    status: {
      label: indicator.statusLabel,
      tone: statusTone,
    },
    support: {
      label: `Variação ${periodLabel}`,
      value: indicator.variationDisplay ?? EM,
    },
    title: indicator.label,
    value: {
      display: indicator.currentDisplay ?? EM,
      metaLabel: indicator.currentYear ? `Ano ${indicator.currentYear}` : 'Ano indisponível',
    },
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
