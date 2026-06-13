import { getDisplayValue, getIndicatorTitle } from '../utils/format'
import { IndicatorHistoryChart } from './IndicatorHistoryChart'
import { MetricCard } from './MetricCard'
import { StatusBadge } from './StatusBadge'

export function IndicatorDetail({ item, result }) {
  if (!item || !result) {
    return (
      <section className="detail-panel empty-panel">
        <p>Selecione um indicador para ver os detalhes.</p>
      </section>
    )
  }

  const status = getDisplayValue(result.display, 'status')
  const tone = result.atingida ? 'success' : result.available ? 'warning' : 'muted'

  return (
    <section className="detail-panel">
      <div className="detail-heading">
        <div>
          <span className="eyebrow">Indicador selecionado</span>
          <h3>{getIndicatorTitle(item, result)}</h3>
          {item.sub && <p>{item.sub}</p>}
          {item.desc && <p>{item.desc}</p>}
        </div>
        <StatusBadge status={status} tone={tone} />
      </div>

      <div className="metric-grid">
        <MetricCard label="Valor inicial" value={getDisplayValue(result.display, 'start_value')} />
        <MetricCard label="Valor final" value={getDisplayValue(result.display, 'end_value')} />
        <MetricCard label="Variação" value={getDisplayValue(result.display, 'variation')} />
        <MetricCard label="Meta" value={result.meta_label ?? '-'} detail={formatRaw(result.meta)} />
        <MetricCard label="Distância da meta" value={getDisplayValue(result.display, 'distance')} />
      </div>

      {result.display?.interpretation && (
        <div className="interpretation-box">
          <span>Interpretação</span>
          <p>{result.display.interpretation}</p>
        </div>
      )}

      <IndicatorHistoryChart
        display={result.display}
        endYear={result.end_year}
        meta={result.meta}
        series={result.series}
        startYear={result.start_year}
        title={getIndicatorTitle(item, result)}
      />
    </section>
  )
}

function formatRaw(value) {
  if (value === null || value === undefined) {
    return '-'
  }
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  }
  return String(value)
}
