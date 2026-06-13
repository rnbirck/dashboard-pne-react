import { getDisplayValue, getIndicatorTitle } from '../utils/format'
import { IndicatorHistoryChart } from './IndicatorHistoryChart'

export function IndicatorDetail({ item, result }) {
  if (!item || !result) {
    return (
      <section className="detail-panel empty-panel">
        <p>Selecione um indicador para ver os detalhes.</p>
      </section>
    )
  }

  const statusClass = result.atingida ? 'ok' : result.available ? 'attention' : 'muted'

  return (
    <section className="detail-panel">
      <div className="detail-heading">
        <div>
          <span className="eyebrow">Indicador selecionado</span>
          <h3>{getIndicatorTitle(item, result)}</h3>
          {item.sub && <p>{item.sub}</p>}
          {item.desc && <p>{item.desc}</p>}
        </div>
        <span className={`status-pill ${statusClass}`}>
          {getDisplayValue(result.display, 'status')}
        </span>
      </div>

      <div className="metric-grid">
        <Metric label="Valor inicial" value={getDisplayValue(result.display, 'start_value')} />
        <Metric label="Valor final" value={getDisplayValue(result.display, 'end_value')} />
        <Metric label="Variação" value={getDisplayValue(result.display, 'variation')} />
        <Metric label="Meta" value={result.meta_label ?? '-'} detail={formatRaw(result.meta)} />
        <Metric label="Distância da meta" value={getDisplayValue(result.display, 'distance')} />
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

function Metric({ detail, label, value }) {
  return (
    <div className="metric-box">
      <span>{label}</span>
      <strong>{value ?? '-'}</strong>
      {detail !== undefined && <small>{detail}</small>}
    </div>
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
