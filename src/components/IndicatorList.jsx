export function IndicatorList({ items, selectedIndicator, onSelectIndicator, results }) {
  return (
    <div className="indicator-list">
      {items.map((item) => {
        const result = results?.[item.key]
        const statusClass = result?.atingida ? 'ok' : result?.available ? 'attention' : 'muted'
        const statusLabel = result?.available
          ? result?.display?.status ?? (result?.atingida ? 'Meta atingida' : 'Meta não atingida')
          : 'Indisponível'
        return (
          <button
            className={
              item.key === selectedIndicator ? 'indicator-row is-active' : 'indicator-row'
            }
            key={item.key}
            type="button"
            onClick={() => onSelectIndicator(item.key)}
          >
            <span>{item.label}</span>
            <small className={`inline-status inline-status--${statusClass}`}>
              {statusLabel}
            </small>
          </button>
        )
      })}
    </div>
  )
}
