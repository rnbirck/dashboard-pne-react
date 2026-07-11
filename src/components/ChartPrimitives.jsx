export function ChartTooltip({ className = '', label, series, style, value }) {
  return (
    <div
      aria-label={[label, series, value].filter(Boolean).join(', ')}
      className={`chart-tooltip${className ? ` ${className}` : ''}`}
      role="tooltip"
      style={style}
    >
      {label ? <strong className="chart-tooltip__label">{label}</strong> : null}
      <span className="chart-tooltip__reading">
        {series ? <span className="chart-tooltip__series">{series}</span> : null}
        <b>{value}</b>
      </span>
    </div>
  )
}

export function ChartLegend({ className = '', items }) {
  if (!items?.length) return null

  return (
    <div className={`chart-legend${className ? ` ${className}` : ''}`} aria-label="Legenda do gráfico">
      {items.map((item) => (
        <span className="chart-legend__item" key={item.key ?? item.label}>
          <span
            aria-hidden="true"
            className={`chart-legend__marker${item.dashed ? ' chart-legend__marker--dashed' : ''}`}
            style={{
              '--chart-legend-color': item.color,
              opacity: item.opacity ?? 1,
            }}
          />
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  )
}

export function ChartEmptyState({ message = 'Dados não disponíveis para este recorte.' }) {
  return (
    <div className="chart-empty-state" role="status">
      <p>{message}</p>
    </div>
  )
}
