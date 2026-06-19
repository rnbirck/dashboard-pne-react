import { isMissing } from '../utils/educationFormatters'

export function EducationSummaryCard({ label, value, year, detail, tone = 'default' }) {
  const displayValue = isMissing(value) ? '\u2014' : value
  const toneClass = tone !== 'default' ? `education-card--${tone}` : ''
  return (
    <div className={`education-card ${toneClass}`}>
      <span className="education-card__label">{label}</span>
      <strong className="education-card__value">{displayValue}</strong>
      {year !== undefined && year !== null && (
        <small className="education-card__year">{year}</small>
      )}
      {detail !== undefined && detail !== null && (
        <small className="education-card__detail">{detail}</small>
      )}
    </div>
  )
}
