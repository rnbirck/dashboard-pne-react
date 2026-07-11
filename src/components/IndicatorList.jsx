import { StatusBadge } from './StatusBadge'
import { getPneCycleCopy } from '../utils/pneCycleCopy'

export function IndicatorList({ cycle = 'pne_2026_2036', items, selectedIndicator, onSelectIndicator, results, stageFilters }) {
  const cycleCopy = getPneCycleCopy(cycle)
  return (
    <div className="indicator-list">
      {items.map((item) => {
        const result = results?.[item.key]
        const rawStatus = result?.display?.status ?? ''
        const normalizedStatus = String(rawStatus).toLocaleLowerCase('pt-BR')
        const isInformative = normalizedStatus.includes('visualiza') || normalizedStatus.includes('informativo')
        const statusLabel = isInformative
          ? 'Informativo'
          : result?.available === false || !result
            ? cycleCopy.status.missing
            : result?.atingida === true
              ? cycleCopy.status.achieved
              : result?.atingida === false
                ? cycleCopy.status.below
                : cycleCopy.status.missing
        const tone = normalizedStatus.includes('visualiza') || normalizedStatus.includes('informativo')
          ? 'info'
          : result?.atingida
            ? 'success'
            : result?.available
              ? 'warning'
              : 'muted'
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
                displayStatus={statusLabel}
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
