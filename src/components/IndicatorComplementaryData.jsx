import { AdministrativeDependencyChart } from './AdministrativeDependencyChart'
import { ComplementaryEnrollmentChart } from './ComplementaryEnrollmentChart'

const numberFormatter = new Intl.NumberFormat('pt-BR')
const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

export function IndicatorComplementaryData({ indicatorKey, municipioData }) {
  const details = municipioData?.indicator_details?.[indicatorKey]

  if (!details) {
    return null
  }

  const hasTotal = Array.isArray(details.series_total) && details.series_total.length > 0
  const hasDependencia =
    Array.isArray(details.series_dependencia) && details.series_dependencia.length > 0
  const hasComponents =
    Array.isArray(details.series_components) && details.series_components.length > 0

  if (!hasTotal && !hasDependencia && !hasComponents) {
    return null
  }

  const numeratorLabel = details.calculation?.numerator_label || 'Numerador'
  const denominatorLabel = details.calculation?.denominator_label || 'Denominador'

  return (
    <section className="complementary-data" aria-label="Dados complementares">
      <div className="complementary-data__heading">
        <span className="eyebrow">Dados complementares</span>
        <h4>{details.title || 'Dados complementares'}</h4>
        {details.subtitle ? <p>{details.subtitle}</p> : null}
      </div>
      <div className="complementary-data__grid">
        {hasTotal ? (
          <ComplementaryEnrollmentChart
            series={details.series_total}
            title={details.title || 'Matrículas em creche'}
            unit={details.unit || 'Matrículas'}
          />
        ) : null}
        {hasDependencia ? (
          <AdministrativeDependencyChart
            series={details.series_dependencia}
            title="Por dependência administrativa"
          />
        ) : null}
      </div>
      {hasComponents ? (
        <div className="complementary-components">
          <h5>Números usados no cálculo</h5>
          <div className="complementary-components__table-wrap">
            <table className="complementary-components__table">
              <thead>
                <tr>
                  <th>Ano</th>
                  <th>{numeratorLabel}</th>
                  <th>{denominatorLabel}</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                {details.series_components.map((row) => (
                  <tr key={row.ano}>
                    <td>{row.ano}</td>
                    <td>{numberFormatter.format(row.numerador)}</td>
                    <td>{numberFormatter.format(row.denominador)}</td>
                    <td>{percentFormatter.format(row.percentual)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  )
}
