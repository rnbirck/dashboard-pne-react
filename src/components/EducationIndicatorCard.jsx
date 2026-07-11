import { StatusBadge } from './StatusBadge'
import { InteractionChevron } from './InteractionChevron'
import { Sparkline } from './Sparkline'

const EM = '\u2014'
const SPARKLINE_CLASS_NAMES = Object.freeze({
  root: 'education-indicator-card__sparkline',
  area: 'education-indicator-card__sparkline-area',
  line: 'education-indicator-card__sparkline-line',
  end: 'education-indicator-card__sparkline-end',
  period: 'education-indicator-card__sparkline-period',
  empty: 'education-indicator-card__sparkline--empty',
})

export function EducationIndicatorCard({ buttonRef, indicator, isSelected = false, onSelect }) {
  const statusTone = indicator.statusTone ?? 'default'
  const periodLabel = indicator.initialYear && indicator.currentYear
    ? `desde ${indicator.initialYear}`
    : 'no período'

  return (
    <button
      className={`education-indicator-card interaction-card--explorable education-indicator-card--${statusTone}${isSelected ? ' is-selected' : ''}`}
      ref={buttonRef}
      type="button"
      onClick={onSelect}
      aria-label={`Abrir detalhe do indicador ${indicator.label}`}
      aria-pressed={isSelected}
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

      <Sparkline series={indicator.series} classNames={SPARKLINE_CLASS_NAMES} />

      <span className="education-indicator-card__footer">
        <span>{indicator.categoryLabel ?? 'Geral'}</span>
        {indicator.mainCutLabel ? <span>{indicator.mainCutLabel}</span> : null}
        <InteractionChevron />
      </span>
    </button>
  )
}
