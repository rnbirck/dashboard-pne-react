export function SourceLine({ children, className = '' }) {
  return (
    <p className={`source-line${className ? ` ${className}` : ''}`}>
      <span className="source-line__label">Fontes:</span>{' '}
      <span>{children}</span>
    </p>
  )
}
