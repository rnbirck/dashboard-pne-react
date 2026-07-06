import { useMemo, useState } from 'react'
import { CategoryTabs } from './CategoryTabs'
import { DataSourceNote } from './DataSourceNote'
import { IndicatorHistoryChart } from './IndicatorHistoryChart'
import { getSiopeOfficialGroup, loadSiopeDashboardData, SIOPE_DASHBOARD_YEARS } from '../data/siopeIndicators'
import { useAsyncData } from '../utils/useAsyncData'

const EM = '\u2014'
const SIOPE_SOURCE_NOTE = 'SIOPE / FNDE. Para cada ano, foi considerado o dado declarado no 6º bimestre.'
const MUNICIPALITY_2025_MISSING_NOTE =
  'Este município ainda não possui dados de 2025 no SIOPE. Exibindo o último ano disponível.'
const MISSING_VALUE_NOTE = 'Este município não possui dado para este indicador neste ano.'

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value))
}

function normalizeName(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

function formatSiopeValue(value, unidade, compact = false) {
  if (!hasNumber(value)) return EM
  const numeric = Number(value)

  if (unidade === 'percentual') {
    return `${numeric.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`
  }

  if (unidade === 'reais') {
    return numeric.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: compact ? 0 : 2,
    })
  }

  return numeric.toLocaleString('pt-BR', {
    maximumFractionDigits: compact ? 0 : 2,
  })
}

function formatCompactCurrency(value) {
  if (!hasNumber(value)) return ''
  const num = Number(value)
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  if (abs >= 1e9) return `${sign}R$ ${(abs / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} bi`
  if (abs >= 1e6) return `${sign}R$ ${(abs / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (abs >= 1e3) return `${sign}R$ ${(abs / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  return formatSiopeValue(num, 'reais', true)
}

function formatCompactDataLabel(value, unidade) {
  if (!hasNumber(value)) return ''
  if (unidade === 'percentual') return `${Math.round(Number(value))}%`
  if (unidade === 'reais') return formatCompactCurrency(value)
  return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function getIndicatorUnit(indicator) {
  if (indicator?.unidade === 'percentual') return 'percent'
  if (indicator?.unidade === 'reais') return 'currency'
  return 'count'
}

function getIndicatorTypeLabel(indicator) {
  if (indicator?.unidade === 'percentual') return 'Percentual'
  if (indicator?.unidade === 'reais') return 'Financeiro'
  return 'Número'
}

function getIndicatorBadgeClass(indicator) {
  return indicator?.unidade === 'percentual'
    ? 'indicator-stage-badge indicator-stage-badge--pct'
    : 'indicator-stage-badge'
}

function getMunicipiosList(municipios) {
  if (Array.isArray(municipios)) return municipios
  return Object.values(municipios ?? {})
}

function getMunicipalityRecord(wide, idMunicipio, selectedMunicipio) {
  const municipios = wide?.municipios ?? {}
  const direct = idMunicipio ? municipios[String(idMunicipio)] : null
  if (direct) return direct

  const target = normalizeName(selectedMunicipio)
  if (!target) return null
  return getMunicipiosList(municipios).find((item) => normalizeName(item?.municipio) === target) ?? null
}

function buildGroups(indicators) {
  const groups = new Map()
  indicators.forEach((indicator) => {
    const officialGroup = getSiopeOfficialGroup(indicator.codigo_indicador)
    if (!officialGroup) return
    if (!groups.has(officialGroup.key)) {
      groups.set(officialGroup.key, {
        count: 0,
        items: [],
        key: officialGroup.key,
        label: officialGroup.label,
        order: officialGroup.order,
      })
    }
    const group = groups.get(officialGroup.key)
    group.items.push(indicator)
    group.count += 1
  })
  return Array.from(groups.values()).sort((a, b) => a.order - b.order)
}

function buildIndicatorSeries(municipality, indicator) {
  return SIOPE_DASHBOARD_YEARS.map((year) => {
    const yearData = municipality?.anos?.[String(year)]
    const indicatorData = yearData?.indicadores?.[indicator.slug]
    const value = hasNumber(indicatorData?.valor) ? Number(indicatorData.valor) : null
    const hasValue = hasNumber(value)

    return {
      ano: year,
      hasValue,
      valor: value,
    }
  })
}

function hasMunicipalityDataForYear(municipality, year) {
  const indicators = Object.values(municipality?.anos?.[String(year)]?.indicadores ?? {})
  return indicators.some((indicator) => hasNumber(indicator?.valor))
}

function latestAvailable(series) {
  return [...series]
    .filter((point) => hasNumber(point.valor))
    .sort((a, b) => Number(b.ano) - Number(a.ano))[0] ?? null
}

function buildSummaryCards(indicators, municipality) {
  return indicators
    .filter((indicator) => indicator.usar_no_resumo)
    .slice(0, 4)
    .map((indicator) => {
      const series = buildIndicatorSeries(municipality, indicator)
      const latest = latestAvailable(series)

      return {
        indicator,
        latest,
      }
    })
}

function SiopeSummaryCard({ card }) {
  const { indicator, latest } = card

  return (
    <article className="education-card siope-summary-card">
      <span className="education-card__label">{indicator.nome_dashboard}</span>
      <strong className="education-card__value education-card__value--compact">
        {formatSiopeValue(latest?.valor, indicator.unidade)}
      </strong>
      {latest?.ano ? <small className="education-card__year">{latest.ano}</small> : null}
      {indicator.interpretacao ? (
        <small className="education-card__detail">{indicator.interpretacao}</small>
      ) : null}
    </article>
  )
}

function SiopeEmpty({ children }) {
  return (
    <div className="siope-empty">
      <p>{children}</p>
    </div>
  )
}

export function SiopeIndicatorsPanel({ idMunicipio, selectedMunicipio }) {
  const state = useAsyncData(() => loadSiopeDashboardData(), [])
  const [selectedGroupKey, setSelectedGroupKey] = useState('')
  const [selectedIndicatorKey, setSelectedIndicatorKey] = useState('')

  const model = useMemo(() => {
    const catalogIndicators = state.data?.catalogo?.indicadores ?? []
    const groups = buildGroups(catalogIndicators)
    const municipality = getMunicipalityRecord(state.data?.wide, idMunicipio, selectedMunicipio)

    return {
      catalogIndicators,
      groups,
      municipality,
    }
  }, [idMunicipio, selectedMunicipio, state.data])

  if (!selectedMunicipio) {
    return <SiopeEmpty>Selecione um município para consultar os indicadores do SIOPE.</SiopeEmpty>
  }

  if (state.loading) {
    return <div className="page-stack"><p className="state-box state-box--loading">Carregando indicadores SIOPE...</p></div>
  }

  if (state.error) {
    return (
      <div className="page-stack">
        <div className="state-box state-box--error">
          <strong>Erro ao carregar SIOPE</strong>
          <span>{state.error}</span>
        </div>
      </div>
    )
  }

  if (!model.municipality) {
    return <SiopeEmpty>Dados do SIOPE não disponíveis para este município.</SiopeEmpty>
  }

  const activeGroupKey = model.groups.some((group) => group.key === selectedGroupKey)
    ? selectedGroupKey
    : model.groups[0]?.key
  const activeGroup = model.groups.find((group) => group.key === activeGroupKey) ?? model.groups[0]
  const activeIndicators = activeGroup?.items ?? []
  const selectedIndicator = activeIndicators.find((indicator) => indicator.slug === selectedIndicatorKey) ?? activeIndicators[0]
  const series = selectedIndicator
    ? buildIndicatorSeries(model.municipality, selectedIndicator)
    : []
  const validSeries = series.filter((point) => hasNumber(point.valor))
  const chartSeries = series.map((point) => ({ ano: point.ano, valor: point.valor }))
  const summaryCards = buildSummaryCards(model.catalogIndicators, model.municipality)
  const municipalityMissing2025 = !hasMunicipalityDataForYear(model.municipality, 2025)
  const selectedIndicatorHasMissingValues = series.some((point) => !point.hasValue)

  function handleGroupSelect(groupKey) {
    setSelectedGroupKey(groupKey)
    setSelectedIndicatorKey('')
  }

  return (
    <div className="siope-panel">
      <section className="page-card siope-info-box" aria-labelledby="siope-title">
        <div className="siope-info-box__header">
          <span className="eyebrow">SIOPE</span>
          <h2 id="siope-title">Indicadores Financeiros e Educacionais do SIOPE</h2>
          <p>
            Acompanhamento dos principais indicadores declarados ao SIOPE no 6º bimestre de cada ano, com foco em
            aplicação mínima, FUNDEB, gasto por aluno, receitas e resultado financeiro.
          </p>
          <DataSourceNote source={SIOPE_SOURCE_NOTE} />
        </div>
      </section>

      <section className="page-card education-summary-section fundeb-summary siope-summary">
        <div className="education-summary-header fundeb-summary__heading">
          <h2 className="education-summary-title">Visão geral</h2>
          <small className="education-summary-note">
            Valores mais recentes disponíveis para {model.municipality.municipio}.
          </small>
        </div>
        {municipalityMissing2025 ? (
          <p className="siope-municipality-note">{MUNICIPALITY_2025_MISSING_NOTE}</p>
        ) : null}
        <div className="education-summary-grid siope-summary-grid">
          {summaryCards.map((card) => (
            <SiopeSummaryCard card={card} key={card.indicator.slug} />
          ))}
        </div>
      </section>

      <section className="page-card siope-group-selector">
        <div className="cycle-category-bar">
          <span className="eyebrow">Grupos SIOPE</span>
          <div className="cycle-category-bar__controls">
            <CategoryTabs
              ariaLabel="Grupos de indicadores SIOPE"
              categories={model.groups}
              selectedCategory={activeGroupKey}
              onSelectCategory={handleGroupSelect}
            />
          </div>
        </div>
      </section>

      <section className="page-card fundeb-workspace siope-workspace">
        <div className="fundeb-workspace-layout educacao-analysis-layout">
          <aside className="indicator-sidebar">
            <div className="indicator-sidebar__heading">
              <h3>Indicadores</h3>
              <span>{activeIndicators.length}</span>
            </div>
            <div className="indicator-list">
              {activeIndicators.map((indicator) => (
                <button
                  className={indicator.slug === selectedIndicator?.slug ? 'indicator-row is-active' : 'indicator-row'}
                  key={indicator.slug}
                  type="button"
                  onClick={() => setSelectedIndicatorKey(indicator.slug)}
                >
                  <span className="indicator-row__label">{indicator.nome_dashboard}</span>
                  <span className="indicator-row__description">{indicator.descricao_curta}</span>
                  <span className="indicator-row__badges">
                    <span className={getIndicatorBadgeClass(indicator)}>
                      {getIndicatorTypeLabel(indicator)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div className="fundeb-detail siope-detail">
            {selectedIndicator ? (
              <>
                <div className="fundeb-detail-header">
                  <div>
                    <span className="eyebrow">Indicador selecionado</span>
                    <h3>{selectedIndicator.nome_dashboard}</h3>
                    <p className="fundeb-indicator-description">{selectedIndicator.descricao_curta}</p>
                  </div>
                  <span className={getIndicatorBadgeClass(selectedIndicator)}>
                    {getIndicatorTypeLabel(selectedIndicator)}
                  </span>
                </div>

                {selectedIndicator.interpretacao ? (
                  <p className="fundeb-indicator-note siope-indicator-note">
                    <strong>Leitura:</strong> {selectedIndicator.interpretacao}
                  </p>
                ) : null}

                {selectedIndicatorHasMissingValues ? (
                  <p className="fundeb-indicator-note siope-register-alert">
                    <strong>Registro:</strong> {MISSING_VALUE_NOTE}
                  </p>
                ) : null}

                <div className="fundeb-visual-grid">
                  <div className="fundeb-chart-card siope-chart-card">
                    {validSeries.length >= 2 ? (
                      <IndicatorHistoryChart
                        chartHeight={340}
                        endYear={2025}
                        formatDataLabel={(value) => formatCompactDataLabel(value, selectedIndicator.unidade)}
                        formatYAxis={selectedIndicator.unidade === 'reais' ? formatCompactCurrency : undefined}
                        item={{ label: selectedIndicator.nome_dashboard }}
                        labelMode="all"
                        missingLabel={EM}
                        result={null}
                        series={chartSeries}
                        showMetaLine={false}
                        showMissingPoints={true}
                        startYear={2021}
                        title={selectedIndicator.nome_dashboard}
                        unit={getIndicatorUnit(selectedIndicator)}
                        yTickCount={5}
                      />
                    ) : (
                      <div className="fundeb-empty fundeb-empty--chart">
                        <p>Não há pontos suficientes para exibir o gráfico deste indicador.</p>
                      </div>
                    )}
                    <DataSourceNote
                      className="fundeb-data-source siope-chart-source"
                      source={SIOPE_SOURCE_NOTE}
                    />
                  </div>
                </div>
              </>
            ) : (
              <SiopeEmpty>Nenhum indicador disponível neste grupo.</SiopeEmpty>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
