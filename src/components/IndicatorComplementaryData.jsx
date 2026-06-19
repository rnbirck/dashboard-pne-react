import { useEffect, useMemo, useState } from 'react'

import { loadIndicatorDetail } from '../data/staticData'
import { AdministrativeDependencyChart } from './AdministrativeDependencyChart'
import { ComplementaryEnrollmentChart } from './ComplementaryEnrollmentChart'

const numberFormatter = new Intl.NumberFormat('pt-BR')
const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

export function IndicatorComplementaryData({ cycle, indicatorKey, municipioData }) {
  const slug = municipioData?.slug
  const fallbackDetails = municipioData?.indicator_details?.[indicatorKey] ?? null
  const [details, setDetails] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => {
    let isMounted = true

    if (!indicatorKey) {
      setDetails(null)
      return () => {
        isMounted = false
      }
    }

    if (!slug) {
      setDetails(fallbackDetails)
      return () => {
        isMounted = false
      }
    }

    setDetails(null)
    loadIndicatorDetail(slug, indicatorKey)
      .then((data) => {
        if (isMounted) {
          setDetails(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          setDetails(fallbackDetails)
        }
      })

    return () => {
      isMounted = false
    }
  }, [slug, indicatorKey, fallbackDetails])

  const calculationComponents =
    details?.series_components_by_cycle?.[cycle] ?? details?.series_components
  const hasTotal = Array.isArray(details?.series_total) && details.series_total.length > 0
  const hasDependencia =
    Array.isArray(details?.series_dependencia) && details.series_dependencia.length > 0
  const hasComponents =
    Array.isArray(calculationComponents) && calculationComponents.length > 0
  const numeratorLabel = details?.calculation?.numerator_label || 'Numerador'
  const denominatorLabel = details?.calculation?.denominator_label || 'Denominador'

  const options = useMemo(() => {
    if (!details) return []

    const availableOptions = []

    if (hasTotal) {
      availableOptions.push({
        key: 'enrollment-history',
        label: 'Histórico de matrículas',
        content: (
          <ComplementaryEnrollmentChart
            series={details.series_total}
            title={details.title || 'Matrículas em creche'}
            unit={details.unit || 'Matrículas'}
          />
        ),
      })
    }

    if (hasDependencia) {
      availableOptions.push({
        key: 'administrative-dependency',
        label: 'Dependência administrativa',
        content: (
          <AdministrativeDependencyChart
            series={details.series_dependencia}
            unit={details.dependency_unit || details.unit}
            valueType={details.dependency_value_type}
            title="Por dependência administrativa"
          />
        ),
      })
    }

    if (hasComponents) {
      availableOptions.push({
        key: 'calculation-numbers',
        label: 'Números usados no cálculo',
        content: (
          <CalculationComponentsTable
            denominatorLabel={denominatorLabel}
            numeratorLabel={numeratorLabel}
            rows={calculationComponents}
          />
        ),
      })
    }

    return availableOptions
  }, [
    calculationComponents,
    denominatorLabel,
    details,
    hasComponents,
    hasDependencia,
    hasTotal,
    numeratorLabel,
  ])

  useEffect(() => {
    setIsOpen(false)
    setActiveTab(options[0]?.key ?? '')
  }, [indicatorKey, options])

  if (!details || options.length === 0) {
    return null
  }

  const activeOption = options.find((option) => option.key === activeTab) ?? options[0]
  const contentId = `indicator-explore-more-${indicatorKey || 'detail'}`

  return (
    <section className={`complementary-data${isOpen ? ' is-open' : ''}`} aria-label="Explorar mais">
      <button
        type="button"
        className="complementary-data__trigger"
        aria-controls={contentId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="complementary-data__summary">
          <span className="complementary-data__title">Explorar mais</span>
          <span className="complementary-data__description">
            Histórico de matrículas, dependência administrativa e números usados no cálculo
          </span>
          <span className="complementary-data__chips" aria-hidden="true">
            {options.map((option) => (
              <span className="complementary-data__chip" key={option.key}>
                {option.label}
              </span>
            ))}
          </span>
        </span>
        <span className="complementary-data__chevron" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="complementary-data__body" id={contentId}>
          <div className="complementary-data__heading">
            <span className="eyebrow">{details.title || 'Dados complementares'}</span>
            {details.subtitle ? <p>{details.subtitle}</p> : null}
          </div>
          {options.length > 1 ? (
            <div className="complementary-data__tabs" role="tablist" aria-label="Opções de exploração">
              {options.map((option) => (
                <button
                  type="button"
                  className={`complementary-data__tab${activeOption?.key === option.key ? ' is-active' : ''}`}
                  key={option.key}
                  role="tab"
                  aria-selected={activeOption?.key === option.key}
                  onClick={() => setActiveTab(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="complementary-data__panel" role="tabpanel">
            {activeOption?.content}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function CalculationComponentsTable({ denominatorLabel, numeratorLabel, rows }) {
  return (
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
            {rows.map((row) => (
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
  )
}
