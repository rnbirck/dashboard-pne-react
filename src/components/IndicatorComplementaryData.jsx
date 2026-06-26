import { useEffect, useMemo, useState } from 'react'

import { loadIndicatorDetail } from '../data/staticData'
import { isDemographicCensusIndicator } from '../utils/indicatorSeries'
import { AdministrativeDependencyChart } from './AdministrativeDependencyChart'
import { ComplementaryEnrollmentChart } from './ComplementaryEnrollmentChart'
import { IndicatorProjectionPanel } from './IndicatorProjectionPanel'

const numberFormatter = new Intl.NumberFormat('pt-BR')
const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

export function IndicatorComplementaryData({ cycle, indicatorKey, municipioData, result }) {
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

  const cycleRange = useMemo(
    () => resolveCycleRange(cycle, result, details),
    [cycle, result, details],
  )
  const calculationComponents =
    details?.series_components_by_cycle?.[cycle] ?? details?.series_components
  const isCensusIndicator = useMemo(
    () => isDemographicCensusIndicator({ indicatorKey, item: null, details }),
    [indicatorKey, details],
  )
  const filteredTotal = useMemo(
    () => {
      if (isCensusIndicator) return filterRealRows(details?.series_total)
      return normalizeCycleSeries(filterRowsByCycle(details?.series_total, cycleRange), cycleRange)
    },
    [details?.series_total, cycleRange, isCensusIndicator],
  )
  const filteredDependencia = useMemo(
    () => {
      if (isCensusIndicator) return []
      return normalizeCycleSeries(filterRowsByCycle(details?.series_dependencia, cycleRange), cycleRange)
    },
    [details?.series_dependencia, cycleRange, isCensusIndicator],
  )
  const filteredComponents = useMemo(
    () => {
      const rows = isCensusIndicator
        ? filterRealRows(calculationComponents)
        : filterRowsByCycle(calculationComponents, cycleRange)
      return rows
        .slice()
        .sort((a, b) => Number(b?.ano) - Number(a?.ano))
    },
    [calculationComponents, cycleRange, isCensusIndicator],
  )

  const hasTotal = isCensusIndicator
    ? countRowsWithValue(filteredTotal, 'valor') >= 2
    : filteredTotal.length > 0
  const hasDependencia = filteredDependencia.length > 0
  const hasComponents = filteredComponents.length > 0
  const numeratorLabel = details?.calculation?.numerator_label || 'Numerador'
  const denominatorLabel = details?.calculation?.denominator_label || 'Denominador'

  const projection = municipioData?.[cycle]?.projecoes?.[indicatorKey]
  const hasProjection = cycle === 'pne_2026_2036' && projection?.available === true

  const options = useMemo(() => {
    const availableOptions = []

    if (details) {
      if (hasTotal) {
        availableOptions.push({
          key: 'enrollment-history',
          label: isCensusIndicator ? 'Histórico' : 'Histórico de matrículas',
          content: (
            <ComplementaryEnrollmentChart
              series={filteredTotal}
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
              series={filteredDependencia}
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
              rows={filteredComponents}
            />
          ),
        })
      }
    }

    if (hasProjection) {
      availableOptions.push({
        key: 'trend-projection',
        label: 'Projeção tendencial',
        content: <IndicatorProjectionPanel projection={projection} />,
      })
    }

    return availableOptions
  }, [
    denominatorLabel,
    details,
    filteredComponents,
    filteredDependencia,
    filteredTotal,
    hasComponents,
    hasDependencia,
    hasTotal,
    isCensusIndicator,
    numeratorLabel,
    hasProjection,
    projection,
  ])

  useEffect(() => {
    setIsOpen(false)
    setActiveTab(options[0]?.key ?? '')
  }, [indicatorKey, options])

  if (options.length === 0) {
    return null
  }

  const activeOption = options.find((option) => option.key === activeTab) ?? options[0]
  const contentId = `indicator-explore-more-${indicatorKey || 'detail'}`
  const optionsDescription = buildOptionsDescription(options)

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
            {optionsDescription}
          </span>
          <span className="complementary-data__action">
            Clique para explorar dados complementares
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

function filterRowsByCycle(rows, range) {
  if (!Array.isArray(rows)) return []
  return rows.filter((row) => {
    const year = Number(row?.ano)
    if (!Number.isFinite(year)) return false
    if (Number.isFinite(range?.min) && year < range.min) return false
    if (Number.isFinite(range?.max) && year > range.max) return false
    return true
  })
}

function filterRealRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows.filter((row) => Number.isFinite(Number(row?.ano)) && rowHasRealValue(row))
}

function rowHasRealValue(row) {
  if (!row) return false
  return Object.entries(row).some(([key, value]) => {
    if (key === 'ano') return false
    const numeric = Number(value)
    return Number.isFinite(numeric)
  })
}

function countRowsWithValue(rows, key) {
  if (!Array.isArray(rows)) return 0
  return rows.filter((row) => Number.isFinite(Number(row?.[key]))).length
}

function buildOptionsDescription(options) {
  const labels = options.map((option) => option.label.toLocaleLowerCase('pt-BR'))
  if (labels.length === 0) return 'Dados complementares disponíveis'
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} e ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')} e ${labels[labels.length - 1]}`
}

function resolveCycleRange(cycle, result, details) {
  const resultYears = collectYears(result?.series)
  const detailYears = [
    ...collectYears(details?.series_total),
    ...collectYears(details?.series_dependencia),
    ...collectYears(details?.series_components_by_cycle?.[cycle] ?? details?.series_components),
  ]

  if (cycle === 'pne_2014_2024') {
    return {
      min: 2014,
      max: 2024,
    }
  }

  if (cycle === 'pne_2026_2036') {
    const availableYears = resultYears.length ? resultYears : detailYears
    return {
      min: availableYears.length ? Math.min(...availableYears) : 2026,
      max: availableYears.length ? Math.min(Math.max(...availableYears), 2036) : 2036,
    }
  }

  const fallbackYears = resultYears.length ? resultYears : detailYears
  return fallbackYears.length
    ? { min: Math.min(...fallbackYears), max: Math.max(...fallbackYears) }
    : { min: Number.NaN, max: Number.NaN }
}

function collectYears(rows) {
  if (!Array.isArray(rows)) return []
  return rows
    .map((row) => Number(row?.ano))
    .filter((year) => Number.isFinite(year))
}

function normalizeCycleSeries(rows, range) {
  if (!Array.isArray(rows) || !Number.isFinite(range?.min) || !Number.isFinite(range?.max)) {
    return rows ?? []
  }
  const existing = new Map()
  for (const row of rows) {
    const year = Number(row?.ano)
    if (Number.isFinite(year)) {
      existing.set(year, row)
    }
  }
  const hasDependencyFields = rows.some(
    (r) => r && ('federal' in r || 'estadual' in r || 'municipal' in r || 'privada' in r)
  )
  const result = []
  for (let year = range.min; year <= range.max; year++) {
    const row = existing.get(year)
    if (row) {
      result.push(row)
    } else if (hasDependencyFields) {
      result.push({ ano: year, federal: null, estadual: null, municipal: null, privada: null })
    } else {
      result.push({ ano: year, valor: null })
    }
  }
  return result
}
