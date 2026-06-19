import { StatusBadge } from './StatusBadge'

export function IndicatorList({ items, selectedIndicator, onSelectIndicator, results, stageFilters }) {
  return (
    <div className="indicator-list">
      {items.map((item) => {
        const result = results?.[item.key]
        const statusLabel = result?.available
          ? result?.display?.status ?? (result?.atingida ? 'Meta atingida' : 'Meta não atingida')
          : 'Informativo'
        const normalizedStatus = String(statusLabel).toLocaleLowerCase('pt-BR')
        const tone = normalizedStatus.includes('visualiza') || normalizedStatus.includes('informativo')
          ? 'info'
          : result?.atingida
            ? 'success'
            : result?.available
              ? 'warning'
              : 'muted'
        const compactStatus = getCompactStatusLabel(statusLabel)
        const stageLabel = getStageTagLabel(item.key, stageFilters)
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
            <span className="indicator-row__badges">
              <StatusBadge
                className="indicator-status"
                displayStatus={compactStatus}
                status={statusLabel}
                title={statusLabel}
                tone={tone}
              />
              {stageLabel ? (
                <span className="indicator-stage-badge" title={`Etapa: ${stageLabel}`}>
                  {stageLabel}
                </span>
              ) : null}
            </span>
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

function getStageTagLabel(itemKey, stageFilters) {
  const stages = (stageFilters ?? [])
    .filter((filter) => filter.key !== 'todos' && filterIncludesItem(filter, itemKey))
    .map((filter) => filter.key)

  if (!stages.length) return null
  if (stages.length >= 3) return 'Todas as etapas'

  if (stages.length === 1) {
    return STAGE_LABELS[stages[0]] ?? null
  }

  return stages
    .map((stageKey) => STAGE_COMPACT_LABELS[stageKey])
    .filter(Boolean)
    .join(' + ')
}

function filterIncludesItem(filter, itemKey) {
  return (
    filter.indicatorKeys?.includes(itemKey) ||
    filter.items?.some((item) => item.key === itemKey)
  )
}

const STAGE_LABELS = {
  educacao_infantil: 'Educação Infantil',
  ensino_fundamental: 'Ensino Fundamental',
  ensino_medio: 'Ensino Médio',
}

const STAGE_COMPACT_LABELS = {
  educacao_infantil: 'Infantil',
  ensino_fundamental: 'Fundamental',
  ensino_medio: 'Médio',
}
