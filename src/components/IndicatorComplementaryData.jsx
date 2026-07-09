import { useEffect, useMemo, useState } from 'react'

import { loadIndicatorDetail, loadMunicipioSharedInfo } from '../data/staticData'
import { isDemographicCensusIndicator } from '../utils/indicatorSeries'
import { AdministrativeDependencyChart } from './AdministrativeDependencyChart'
import { ComplementaryEnrollmentChart } from './ComplementaryEnrollmentChart'
import { DataSourceNote } from './DataSourceNote'
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
  const [activeTab, setActiveTab] = useState('')
  const [sharedPrivadas, setSharedPrivadas] = useState(null)

  useEffect(() => {
    loadMunicipioSharedInfo(slug, 'privadas_conveniadas').then((data) => {
      setSharedPrivadas(data)
    })
  }, [slug])

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

  const totalPrivadaRede = useMemo(() => {
    if (!Array.isArray(filteredDependencia)) return null
    const withPrivada = filteredDependencia
      .filter((row) => Number.isFinite(Number(row?.privada)))
      .sort((a, b) => Number(b.ano) - Number(a.ano))
    return withPrivada.length > 0 ? Number(withPrivada[0].privada) : null
  }, [filteredDependencia])

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
          description: 'Evolu\u00e7\u00e3o anual da s\u00e9rie complementar usada para contextualizar o indicador.',
          content: (
            <ComplementaryEnrollmentChart
              showHeading={false}
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
          description: 'Distribui\u00e7\u00e3o por rede ou depend\u00eancia administrativa ao longo do ciclo.',
          content: (
            <AdministrativeDependencyChart
              showHeading={false}
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
          label: 'Dados usados no cálculo',
          description: 'Numerador, denominador e percentual que comp\u00f5em o indicador selecionado.',
          content: (
            <CalculationComponentsTable
              denominatorLabel={denominatorLabel}
              numeratorLabel={numeratorLabel}
              rows={filteredComponents}
              showHeading={false}
            />
          ),
        })
      }
    }

    if (hasProjection) {
      availableOptions.push({
        key: 'trend-projection',
        label: 'Projeção tendencial',
        description: 'Cen\u00e1rio estimativo para planejamento, sem car\u00e1ter de previs\u00e3o oficial.',
        badge: 'Estimativa',
        content: <IndicatorProjectionPanel projection={projection} showTitle={false} />,
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
    setActiveTab(options[0]?.key ?? '')
  }, [indicatorKey, options])

  if (options.length === 0) {
    return null
  }

  const activeOption = options.find((option) => option.key === activeTab) ?? options[0]
  const contentId = `indicator-explore-more-${indicatorKey || 'detail'}`

  return (
    <section className="complementary-data is-open" aria-label="Dados de apoio da meta">
      <div className="complementary-data__trigger">
        <span className="complementary-data__summary">
          <span className="complementary-data__eyebrow">Aprofundamento</span>
          <span className="complementary-data__title">Dados de apoio da meta</span>
          <span className="complementary-data__description">
            Séries auxiliares, recortes e memória de cálculo para interpretar este indicador com mais contexto.
          </span>
        </span>
      </div>

      <div className="complementary-data__body" id={contentId}>
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
                  <span>{option.label}</span>
                  {option.badge ? (
                    <span className="complementary-data__tab-badge">{option.badge}</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
          <div className="complementary-data__panel" role="tabpanel">
            <div className="complementary-data__panel-heading">
              <h5>{activeOption?.label}</h5>
              {activeOption?.description ? <p>{activeOption.description}</p> : null}
            </div>
            {activeOption?.content}
            <DataSourceNote
              context={{
                block: 'pne',
                cycle,
                detailType: activeOption?.key,
                details,
                indicatorKey,
                result,
                title: activeOption?.label,
              }}
            />
          </div>
          <PrivadasConveniadasSection
            data={sharedPrivadas}
            numberFormatter={numberFormatter}
            indicatorKey={indicatorKey}
            activeTab={activeTab}
            totalPrivadaRede={totalPrivadaRede}
          />
      </div>
    </section>
  )
}

const INDICATOR_TO_SECAO = {
  creche: 'creche',
  pre_escola: 'pre_escola',
  ensino_fundamental_ou_completo_pop_6_14: 'ensino_fundamental',
  fundamental_concluido_18_mais: 'ensino_fundamental',
  fundamental_concluido_15_29: 'ensino_fundamental',
  idade_regular_quinto: 'anos_iniciais',
  idade_regular_nono: 'anos_finais',
  basico_15_17: 'ensino_medio',
  ensino_medio_ou_basica_completa_pop_15_17: 'ensino_medio',
  idade_regular_medio: 'ensino_medio',
  medio_concluido_18_mais: 'ensino_medio',
  medio_concluido_18_29: 'ensino_medio',
  medio_tecnico: 'educacao_profissional',
  medio_tecnico_total: 'educacao_profissional',
  medio_tecnico_participacao_publica: 'educacao_profissional',
  subsequente_expansao: 'educacao_profissional',
  eja_integrada_educacao_profissional: 'eja',
  aee: 'educacao_especial',
}

const SECAO_LABELS = {
  educacao_basica: 'Educação básica',
  educacao_infantil: 'Educação infantil',
  creche: 'Creche',
  pre_escola: 'Pré-escola',
  ensino_fundamental: 'Ensino fundamental',
  anos_iniciais: 'Anos iniciais',
  anos_finais: 'Anos finais',
  ensino_medio: 'Ensino médio',
  educacao_profissional: 'Educação profissional',
  eja: 'EJA',
  educacao_especial: 'Educação especial',
}

const SECAO_LABELS_LC = {
  educacao_basica: 'educação básica',
  educacao_infantil: 'educação infantil',
  creche: 'creche',
  pre_escola: 'pré-escola',
  ensino_fundamental: 'ensino fundamental',
  anos_iniciais: 'anos iniciais',
  anos_finais: 'anos finais',
  ensino_medio: 'ensino médio',
  educacao_profissional: 'educação profissional',
  eja: 'EJA',
  educacao_especial: 'educação especial',
}

function resolveSecaoFromIndicator(indicatorKey) {
  return INDICATOR_TO_SECAO[indicatorKey] ?? null
}

function findSecaoEntry(porSecao, secao) {
  if (!Array.isArray(porSecao)) return null
  return porSecao.find((entry) => entry.secao === secao) ?? null
}

function PrivadasConveniadasSection({ data, numberFormatter, indicatorKey, activeTab, totalPrivadaRede }) {
  if (!data) return null
  if (activeTab !== 'administrative-dependency') return null

  const secao = resolveSecaoFromIndicator(indicatorKey)
  if (!secao) return null

  const entry = findSecaoEntry(data.por_secao, secao)
  if (!entry) return null

  const values = entry
  const rotuloRecorte = SECAO_LABELS[secao] ?? secao
  const rotuloRecorteLc = SECAO_LABELS_LC[secao] ?? secao

  const calcPercent = (numerador, denominador) => {
    if (numerador == null || denominador == null || typeof denominador !== 'number' || denominador <= 0) return null
    if (!Number.isFinite(numerador) || !Number.isFinite(denominador)) return null
    return (numerador / denominador) * 100
  }

  const pctMunicipalTotal = calcPercent(values.municipal_total, totalPrivadaRede)

  const formatValue = (val) => {
    if (val == null || (typeof val === 'number' && !Number.isFinite(val))) return '—'
    return numberFormatter.format(val)
  }

  const formatPercent = (val) => {
    if (val == null || !Number.isFinite(val)) return null
    return `${val.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}% da rede privada`
  }

  const primaryHelper =
    totalPrivadaRede != null && Number.isFinite(totalPrivadaRede) && totalPrivadaRede > 0
      ? `${formatValue(values.municipal_total)} de ${formatValue(totalPrivadaRede)} matrículas privadas em ${rotuloRecorteLc}.`
      : null

  const pctLabel = pctMunicipalTotal != null ? formatPercent(pctMunicipalTotal) : null
  const barPct = pctMunicipalTotal != null ? Math.min(pctMunicipalTotal, 100) : 0
  const showBar = pctMunicipalTotal != null

  return (
    <div className="privadas-conveniadas">
      <div className="privadas-conveniadas__header">
        <h5 className="privadas-conveniadas__title">
          Rede privada conveniada sob responsabilidade municipal
        </h5>
        {rotuloRecorte ? (
          <span className="privadas-conveniadas__chip">{rotuloRecorte}</span>
        ) : null}
      </div>
      <p className="privadas-conveniadas__desc">
        Matrículas da rede privada conveniada cujo convênio é de responsabilidade do
        município, isoladamente ou em conjunto com o Estado.
      </p>
      <div className="privadas-conveniadas__body">
        <div className="privadas-conveniadas__primary">
          <div className="privadas-conveniadas__primary-inner">
            <span className="privadas-conveniadas__primary-label">
              Total com participação municipal
            </span>
            <strong className="privadas-conveniadas__primary-value">
              {formatValue(values.municipal_total)}
            </strong>
            {pctLabel ? (
              <span className="privadas-conveniadas__primary-pct">{pctLabel}</span>
            ) : null}
            {primaryHelper ? (
              <span className="privadas-conveniadas__primary-helper">{primaryHelper}</span>
            ) : null}
            {showBar ? (
              <div className="privadas-conveniadas__bar">
                <div
                  className="privadas-conveniadas__bar-fill"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            ) : null}
          </div>
        </div>
        <div className="privadas-conveniadas__secondary">
          <div className="privadas-conveniadas__sec-card">
            <span className="privadas-conveniadas__sec-label">Total conveniado</span>
            <strong className="privadas-conveniadas__sec-value">
              {formatValue(values.total_conveniado)}
            </strong>
          </div>
          <div className="privadas-conveniadas__sec-card">
            <span className="privadas-conveniadas__sec-label">Município</span>
            <strong className="privadas-conveniadas__sec-value">
              {formatValue(values.municipio)}
            </strong>
          </div>
          <div className="privadas-conveniadas__sec-card">
            <span className="privadas-conveniadas__sec-label">Estado e Município</span>
            <strong className="privadas-conveniadas__sec-value">
              {formatValue(values.estado_municipio)}
            </strong>
          </div>
        </div>
      </div>
      <p className="privadas-conveniadas__fonte">
        Dado disponível a partir de {data.disponivel_desde} na Sinopse Estatística do
        Censo Escolar.
      </p>
    </div>
  )
}

function CalculationComponentsTable({ denominatorLabel, numeratorLabel, rows, showHeading = true }) {
  return (
    <div className="complementary-components">
      {showHeading ? <h5>Dados usados no cálculo</h5> : null}
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
