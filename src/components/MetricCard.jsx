export function MetricCard({ accessibleValue = undefined, label, value, detail, icon = null, tone = 'default', size = 'normal' }) {
  const toneClass = tone !== 'default' ? `metric-card--${tone}` : ''
  const sizeClass = size === 'large' ? 'metric-card--large' : ''
  return (
    <div className={`metric-card interaction-card--informative ${toneClass} ${sizeClass}${icon ? ' metric-card--with-icon' : ''}`}>
      {icon ? <MetricIcon name={icon} /> : null}
      <span className="metric-card__label">{label}</span>
      <strong aria-label={accessibleValue} className="metric-card__value">{value ?? '-'}</strong>
      {detail !== undefined && <small className="metric-card__detail">{detail}</small>}
    </div>
  )
}

function MetricIcon({ name }) {
  const commonProps = {
    'aria-hidden': true,
    className: 'metric-card__icon',
    fill: 'none',
    viewBox: '0 0 24 24',
  }

  const paths = {
    current: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /><path d="M9 14h6" /></>,
    distance: <><path d="M4 18 18 4" /><path d="M5 7v11h11" /><path d="M14 4h4v4" /><path d="M9 16h.01M13 12h.01" /></>,
    start: <><path d="M5 21V4" /><path d="m6 5 12 3-12 3" /></>,
    status: <><circle cx="12" cy="12" r="8" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /></>,
    type: <><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" /><path d="m4 7 8 4 8-4M12 11v10" /></>,
    variation: <><path d="M5 16 10 11l3 3 6-7" /><path d="M15 7h4v4" /></>,
    variationDown: <><path d="M5 8 10 13l3-3 6 7" /><path d="M15 17h4v-4" /></>,
  }

  return <svg {...commonProps}>{paths[name] ?? paths.status}</svg>
}
