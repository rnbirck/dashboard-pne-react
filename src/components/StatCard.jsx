export function StatCard({ detail, eyebrow, onClick, title }) {
  const Component = onClick ? 'button' : 'article'

  return (
    <Component
      className={`stat-card ${onClick ? 'stat-card--action interaction-card--navigation' : 'interaction-card--informative'}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {eyebrow ? <span className="stat-card__eyebrow">{eyebrow}</span> : null}
      <strong className="stat-card__title">{title}</strong>
      {detail ? <span className="stat-card__detail">{detail}</span> : null}
    </Component>
  )
}
