import { AdministrativeDependencyChart } from './AdministrativeDependencyChart'
import { ComplementaryEnrollmentChart } from './ComplementaryEnrollmentChart'

export function IndicatorComplementaryData({ indicatorKey, municipioData }) {
  const details = municipioData?.indicator_details?.[indicatorKey]

  if (!details) {
    return null
  }

  const hasTotal = Array.isArray(details.series_total) && details.series_total.length > 0
  const hasDependencia =
    Array.isArray(details.series_dependencia) && details.series_dependencia.length > 0

  if (!hasTotal && !hasDependencia) {
    return null
  }

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
    </section>
  )
}
