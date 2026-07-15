const ANNOUNCEMENT_ROLE = Object.freeze({
  loading: 'status',
  error: 'alert',
  empty: 'status',
  noResults: 'status',
  unavailable: 'status',
})

export function ContentState({ as: Element = 'div', children, kind, className = '' }) {
  const classes = ['content-state', `content-state--${kind}`, className].filter(Boolean).join(' ')

  return (
    <Element
      className={classes}
      role={ANNOUNCEMENT_ROLE[kind]}
      aria-busy={kind === 'loading' || undefined}
      aria-live={kind === 'error' ? 'assertive' : 'polite'}
    >
      {children}
    </Element>
  )
}
