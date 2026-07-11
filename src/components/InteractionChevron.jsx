export function InteractionChevron({ className = '' }) {
  return (
    <span
      className={`interaction-chevron${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </span>
  )
}
