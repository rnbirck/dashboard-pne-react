const ANNOUNCEMENT_ROLE = Object.freeze({
  loading: 'status',
  error: 'alert',
  empty: 'status',
  noResults: 'status',
  unavailable: 'status',
})

export function ContentState({ as: Element = 'div', children, kind, className = '' }) {
  return (
    <Element className={className} role={ANNOUNCEMENT_ROLE[kind]} aria-live={kind === 'error' ? 'assertive' : 'polite'}>
      {children}
    </Element>
  )
}
