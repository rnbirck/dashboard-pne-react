import { StatusBadge } from './StatusBadge'

export function IndicatorList({ items, selectedIndicator, onSelectIndicator, results }) {
  return (
    <div className="indicator-list">
      {items.map((item) => {
        const result = results?.[item.key]
        const statusLabel = result?.available
          ? result?.display?.status ?? (result?.atingida ? 'Meta atingida' : 'Meta não atingida')
          : 'Indisponível'
        const tone = result?.atingida ? 'success' : result?.available ? 'warning' : 'muted'
        return (
          <button
            className={
              item.key === selectedIndicator ? 'indicator-row is-active' : 'indicator-row'
            }
            key={item.key}
            type="button"
            onClick={() => onSelectIndicator(item.key)}
            title={item.label}
          >
            <span>{item.label}</span>
            <StatusBadge status={statusLabel} tone={tone} />
          </button>
        )
      })}
    </div>
  )
}
