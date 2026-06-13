export function SectionCard({ children, className = '', title, subtitle, eyebrow, action, padding = 'normal' }) {
  const paddingClass = padding === 'large' ? 'section-card--large' : padding === 'small' ? 'section-card--small' : ''
  return (
    <section className={`section-card ${paddingClass} ${className}`}>
      {(eyebrow || title || subtitle || action) && (
        <div className="section-card__header">
          <div className="section-card__titles">
            {eyebrow && <span className="section-card__eyebrow">{eyebrow}</span>}
            {title && <h2 className="section-card__title">{title}</h2>}
            {subtitle && <p className="section-card__subtitle">{subtitle}</p>}
          </div>
          {action && <div className="section-card__action">{action}</div>}
        </div>
      )}
      <div className="section-card__body">{children}</div>
    </section>
  )
}
