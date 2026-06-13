export function EmptyState({ title, message, actionLabel, onAction, showIcon = true }) {
  return (
    <section className="empty-state">
      {showIcon && (
        <div className="empty-state__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z" />
            <circle cx="12" cy="9" r="2.4" />
          </svg>
        </div>
      )}
      <h1>{title}</h1>
      <p>{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="primary-button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  )
}
