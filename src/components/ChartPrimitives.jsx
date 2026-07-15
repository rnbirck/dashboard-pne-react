export function ChartTooltip({ className = '', items, label, series, style, value }) {
  const readings = items?.length
    ? items
    : [{ key: series ?? 'value', label: series, value }]
  const accessibleReadings = readings
    .map((item) => [item.label, item.value].filter((part) => part !== null && part !== undefined && part !== '').join(': '))
    .filter(Boolean)

  return (
    <div
      aria-label={[label, ...accessibleReadings].filter(Boolean).join(', ')}
      className={`chart-tooltip${className ? ` ${className}` : ''}`}
      role="tooltip"
      style={style}
    >
      {label ? <strong className="chart-tooltip__label">{label}</strong> : null}
      <span className="chart-tooltip__readings">
        {readings.map((item) => (
          <span className="chart-tooltip__reading" key={item.key ?? item.label ?? item.value}>
            {item.color ? (
              <span
                aria-hidden="true"
                className={`chart-tooltip__marker${item.dashed ? ' chart-tooltip__marker--dashed' : ''}`}
                style={{ '--chart-tooltip-marker-color': item.color }}
              />
            ) : null}
            {item.label ? <span className="chart-tooltip__series">{item.label}</span> : null}
            <b>{item.value}</b>
          </span>
        ))}
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
