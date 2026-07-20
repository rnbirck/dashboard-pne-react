import { isMissing } from '../utils/educationFormatters'

export function EducationSummaryCard({ accessibleValue, icon, label, value, year, detail, tone = 'default', valueSize = 'default' }) {
  const displayValue = isMissing(value) ? '\u2014' : value
  const toneClass = tone !== 'default' ? `education-card--${tone}` : ''
  const valueSizeClass = valueSize !== 'default' ? ` education-card__value--${valueSize}` : ''
  return (
    <div className={`education-card interaction-card--informative ${toneClass}`}>
      {icon ? <span className="education-card__icon" aria-hidden="true">{icon}</span> : null}
      <span className="education-card__label">{label}</span>
      <strong aria-label={accessibleValue ? `Valor exato: ${accessibleValue}` : undefined} className={`education-card__value${valueSizeClass}`}>{displayValue}</strong>
      {year !== undefined && year !== null && (
        <small className="education-card__year">{year}</small>
      )}
      {detail !== undefined && detail !== null && (
        <small className="education-card__detail">{detail}</small>
      )}
    </div>
  )
}
