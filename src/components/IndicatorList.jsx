import { StatusBadge } from './StatusBadge'

export function IndicatorList({ items, selectedIndicator, onSelectIndicator, results }) {
  return (
    <div className="indicator-list">
      {items.map((item) => {
        const result = results?.[item.key]
        const statusLabel = result?.available
          ? result?.display?.status ?? (result?.atingida ? 'Meta atingida' : 'Meta não atingida')
          : 'Indisponível'
        const normalizedStatus = String(statusLabel).toLocaleLowerCase('pt-BR')
        const tone = normalizedStatus.includes('visualiza')
          ? 'info'
          : result?.atingida
            ? 'success'
            : result?.available
              ? 'warning'
              : 'muted'
        const compactStatus = getCompactStatusLabel(statusLabel)
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
            <span className="indicator-row__label">{item.label}</span>
            <StatusBadge
              className="indicator-status"
              displayStatus={compactStatus}
              status={statusLabel}
              title={statusLabel}
              tone={tone}
            />
          </button>
        )
      })}
    </div>
  )
}

function getCompactStatusLabel(statusLabel) {
  const normalizedStatus = String(statusLabel).toLocaleLowerCase('pt-BR')
  if (normalizedStatus.includes('visualiza') || normalizedStatus.includes('informativo')) {
    return 'Informativo'
  }
  if (normalizedStatus.includes('não atingida') || normalizedStatus.includes('nao atingida')) {
    return 'Não atingida'
  }
  if (normalizedStatus.includes('meta atingida')) {
    return 'Atingida'
  }
  return statusLabel
}
