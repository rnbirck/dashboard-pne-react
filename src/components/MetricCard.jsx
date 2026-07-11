export function MetricCard({ label, value, detail, tone = 'default', size = 'normal' }) {
  const toneClass = tone !== 'default' ? `metric-card--${tone}` : ''
  const sizeClass = size === 'large' ? 'metric-card--large' : ''
  return (
    <div className={`metric-card interaction-card--informative ${toneClass} ${sizeClass}`}>
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value ?? '-'}</strong>
      {detail !== undefined && <small className="metric-card__detail">{detail}</small>}
    </div>
  )
}
