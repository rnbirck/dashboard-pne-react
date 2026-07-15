import { useEffect, useMemo, useState } from 'react'
import { CategoryTabs } from './CategoryTabs'
import { DataSourceNote } from './DataSourceNote'
import { FinancialIndicatorMetadata } from './FinancialIndicatorMetadata'
import { MethodNote } from './MethodNote'
import { ContentState } from './ContentState'
import {
  FinancialChartFrame,
  FinancialDetailHeader,
  FinancialDetailNavigation,
  FinancialIndicatorCard,
  FinancialSection,
  FinancialMetricStrip,
  FinancialMetricGrid,
  FinancialQuickReading,
} from './FinancialIndicatorPrimitives'
import { IndicatorHistoryChart } from './IndicatorHistoryChart'
import { ChartEmptyState } from './ChartPrimitives'
import {
  getSiopeOfficialGroup,
  loadSiopeDashboardData,
  SIOPE_DASHBOARD_YEARS,
  SIOPE_INDICATOR_READING_GUIDES,
} from '../data/siopeIndicators'
import { getFinancialIndicatorMetadata } from '../data/financialIndicatorMetadata'
import { useAsyncData } from '../utils/useAsyncData'
import { resolveDetailSequence, useDetailViewNavigation } from '../hooks/useDetailViewNavigation'

const EM = '\u2014'
const SIOPE_SOURCE = 'SIOPE / FNDE'
const SIOPE_METHODOLOGY = 'Para cada ano, foi considerado o dado declarado no 6º bimestre.'
const MUNICIPALITY_2025_MISSING_NOTE =
  'Este município ainda não possui dados de 2025 no SIOPE. Exibindo o último ano disponível.'
const MISSING_VALUE_NOTE = 'Este município não possui dado para este indicador neste ano.'
const SIOPE_SECTION_SUBTITLE =
  'Receitas, despesas, mínimos legais, gasto por estudante e saldos declarados ao SIOPE/FNDE.'

const SIOPE_LEGAL_STATUS_RULES = {
  aplicacao_mde_percentual: {
    limit: 25,
    passLabel: 'Cumpriu mínimo',
    failLabel: 'Abaixo do mínimo',
    type: 'min',
  },
  fundeb_remuneracao_profissionais_percentual: {
    limit: 70,
    passLabel: 'Cumpriu mínimo',
    failLabel: 'Abaixo do mínimo',
    type: 'min',
  },
  fundeb_nao_aplicado_percentual: {
    limit: 10,
    passLabel: 'Dentro do limite',
    failLabel: 'Acima do limite',
    type: 'max',
  },
}

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

function firstAvailable(series) {
  return [...series]
    .filter((point) => hasNumber(point.valor))
    .sort((a, b) => Number(a.ano) - Number(b.ano))[0] ?? null
}

function formatVariationDisplay(raw, unidade) {
  if (!hasNumber(raw)) return EM
  const numeric = Number(raw)
  const sign = numeric > 0 ? '+' : ''
  if (unidade === 'percentual') {
    return `${sign}${numeric.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p.`
  }
  return `${sign}${numeric.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

function calculateSiopeVariation(first, latest, unidade) {
  if (!hasNumber(first?.valor) || !hasNumber(latest?.valor)) {
    return { display: EM, raw: null, tone: 'muted' }
  }

  const diff = Number(latest.valor) - Number(first.valor)
  const raw = unidade === 'percentual'
    ? diff
    : Number(first.valor) === 0
      ? null
      : (diff / Math.abs(Number(first.valor))) * 100

  return {
    display: raw === null ? EM : formatVariationDisplay(raw, unidade),
    raw,
    tone: raw === null ? 'muted' : raw > 0 ? 'success' : raw < 0 ? 'warning' : 'muted',
  }
}

function getLegalStatus(indicator, latest) {
  const rule = SIOPE_LEGAL_STATUS_RULES[indicator?.slug]
  if (!rule || !hasNumber(latest?.valor)) return null

  const value = Number(latest.valor)
  const isCompliant = rule.type === 'min'
    ? value >= rule.limit
    : value <= rule.limit

  return {
    label: isCompliant ? rule.passLabel : rule.failLabel,
    tone: isCompliant ? 'success' : 'warning',
  }
}

function getFinancialStatus(latest, variation, indicator) {
  if (!hasNumber(latest?.valor)) return { label: 'Sem dados', tone: 'muted' }
  const legalStatus = getLegalStatus(indicator, latest)
  if (legalStatus) return legalStatus
  if (variation.raw === null) return { label: 'Com dados', tone: 'info' }
  if (variation.raw > 0) return { label: 'Aumentou', tone: 'info' }
  if (variation.raw < 0) return { label: 'Reduziu', tone: 'info' }
  return { label: 'Estável', tone: 'muted' }
}

function buildHistorySummary(model) {
  if (!model.initialYear || !model.currentYear || model.initialYear === model.currentYear) return ''
  return `Série de ${model.initialYear} a ${model.currentYear}: ${model.initialDisplay} no início e ${model.currentDisplay} no dado mais recente.`
}

function buildQuickReading(model) {
  if (!model.currentYear || model.currentDisplay === EM) {
    return 'O município não possui dado disponível para este indicador no período carregado.'
  }
  if (model.variationDisplay === EM) {
    return `O indicador mais recente disponível é de ${model.currentYear}.`
  }
  const movement = model.variationTone === 'success'
    ? 'aumento'
    : model.variationTone === 'warning'
      ? 'redução'
      : 'estabilidade'
  return `O indicador mais recente disponível é de ${model.currentYear}; a série aponta ${movement} no período observado.`
}

function buildSiopeIndicatorModel(indicator, municipality, activeGroup) {
  const series = buildIndicatorSeries(municipality, indicator)
  const latest = latestAvailable(series)
  const first = firstAvailable(series)
  const variation = calculateSiopeVariation(first, latest, indicator.unidade)
  const status = getFinancialStatus(latest, variation, indicator)
  const readingGuide = SIOPE_INDICATOR_READING_GUIDES[indicator.slug] ?? {}
  const model = {
    description: indicator.descricao_curta,
    initialDisplay: first ? formatSiopeValue(first.valor, indicator.unidade) : EM,
    initialYear: first?.ano ?? null,
    key: indicator.slug,
    label: indicator.nome_dashboard,
    moduleLabel: 'SIOPE / FNDE',
    currentDisplay: latest ? formatSiopeValue(latest.valor, indicator.unidade) : EM,
    currentDisplayCompact: latest ? formatCompactDataLabel(latest.valor, indicator.unidade) : EM,
    currentYear: latest?.ano ?? null,
    sourceLabel: latest?.ano ? `SIOPE/FNDE ${latest.ano}` : 'SIOPE/FNDE',
    statusLabel: status.label,
    statusTone: status.tone,
    unitLabel: getIndicatorTypeLabel(indicator),
    variationDisplay: variation.display,
    variationLabel: first?.ano ? `Variação desde ${first.ano}` : 'Variação no período',
    variationTone: variation.tone,
    series: series.map((point) => ({ ano: point.ano, valor: point.valor })),
    raw: indicator,
    readingGuide,
    groupLabel: activeGroup?.label,
  }

  return {
    ...model,
    historySummary: buildHistorySummary(model),
    quickReading: buildQuickReading(model),
  }
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
    <article className="education-card interaction-card--informative siope-summary-card">
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
    <ContentState kind="empty" className="siope-empty">
      <p>{children}</p>
    </ContentState>
  )
}

function SiopeReadingGuide({ fallback, guide }) {
  const items = [
    { label: 'O que mede', text: guide?.oQueMede ?? fallback },
    { label: 'Como interpretar', text: guide?.comoInterpretar },
    { label: 'Atenção na leitura', text: guide?.atencaoLeitura },
  ].filter((item) => item.text)

  if (!items.length) return null

  return (
    <div className="educacao-indicator-reference financial-indicator-reference siope-reading-guide">
      {items.map((item) => (
        <div className="siope-reading-guide__item" key={item.label}>
          <span>{item.label}</span>
          <p>{item.text}</p>
        </div>
      ))}
    </div>
  )
}

function SiopeHistoricalData({ children }) {
  if (!children) return null

  return (
    <section className="educacao-explore education-support-data financial-support-data siope-history-table-section">
      <div className="educacao-explore__heading">
        <div>
          <span className="educacao-explore__eyebrow">Série histórica em tabela</span>
          <h3>Dados históricos</h3>
          <p>Série anual declarada no SIOPE para o indicador selecionado.</p>
        </div>
      </div>
      <div className="educacao-explore__panel siope-history-table-panel">
        {children}
      </div>
    </section>
  )
}

export function SiopeIndicatorsPanel({ idMunicipio, selectedMunicipio, detailKey = '', onDetailChange }) {
  const state = useAsyncData(() => loadSiopeDashboardData(), [])
  const [selectedGroupKey, setSelectedGroupKey] = useState('')
  const [selectedIndicatorKey, setSelectedIndicatorKey] = useState(detailKey)
  const [isDetailOpen, setIsDetailOpen] = useState(Boolean(detailKey))
  const detailNavigation = useDetailViewNavigation({
    activeKey: selectedIndicatorKey,
    isOpen: isDetailOpen,
  })

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

  useEffect(() => {
    if (!detailKey) return setIsDetailOpen(false)
    if (model.groups.some((group) => group.items?.some((indicator) => indicator.slug === detailKey))) {
      setSelectedIndicatorKey(detailKey)
      setIsDetailOpen(true)
    } else if (!state.loading) {
      setIsDetailOpen(false)
      onDetailChange?.('')
    }
  }, [detailKey, model.groups, onDetailChange, state.loading])

  if (!selectedMunicipio) {
    return <SiopeEmpty>Selecione um município para consultar os dados declarados ao SIOPE/FNDE.</SiopeEmpty>
  }

  if (state.loading) {
    return <div className="page-stack"><ContentState as="p" kind="loading" className="state-box state-box--loading">Carregando dados do SIOPE/FNDE...</ContentState></div>
  }

  if (state.error) {
    return (
      <div className="page-stack">
        <div className="state-box state-box--error">
          <strong>Erro ao carregar SIOPE/FNDE</strong>
          <span>{state.error}</span>
        </div>
      </div>
    )
  }

  if (!model.municipality) {
    return <SiopeEmpty>Dados do SIOPE/FNDE não disponíveis para este município.</SiopeEmpty>
  }

  const detailGroup = model.groups.find((group) => group.items?.some((item) => item.slug === detailKey))
  const activeGroupKey = detailGroup?.key ?? (model.groups.some((group) => group.key === selectedGroupKey)
    ? selectedGroupKey
    : model.groups[0]?.key)
  const activeGroup = model.groups.find((group) => group.key === activeGroupKey) ?? model.groups[0]
  const activeIndicators = activeGroup?.items ?? []
  const indicatorModels = activeIndicators.map((indicator) => buildSiopeIndicatorModel(indicator, model.municipality, activeGroup))
  const selectedIndicatorModel = indicatorModels.find((indicator) => indicator.key === selectedIndicatorKey) ?? indicatorModels[0]
  const selectedIndicator = selectedIndicatorModel?.raw
  const series = selectedIndicator
    ? buildIndicatorSeries(model.municipality, selectedIndicator)
    : []
  const validSeries = series.filter((point) => hasNumber(point.valor))
  const chartSeries = series.map((point) => ({ ano: point.ano, valor: point.valor }))
  const summaryCards = buildSummaryCards(model.catalogIndicators, model.municipality)
  const municipalityMissing2025 = !hasMunicipalityDataForYear(model.municipality, 2025)
  const selectedIndicatorHasMissingValues = series.some((point) => !point.hasValue)
  const { activeIndex: selectedIndex, previousItem: previousIndicator, nextItem: nextIndicator } = resolveDetailSequence(indicatorModels, selectedIndicatorModel?.key)

  function handleGroupSelect(groupKey) {
    setSelectedGroupKey(groupKey)
    setSelectedIndicatorKey('')
    setIsDetailOpen(false)
  }

  function handleIndicatorSelect(indicatorKey) {
    detailNavigation.prepareDetail(indicatorKey, {
      captureGridPosition: !isDetailOpen,
    })
    setSelectedIndicatorKey(indicatorKey)
    setIsDetailOpen(true)
    onDetailChange?.(indicatorKey)
  }

  function handleBackToGrid() {
    const returnKey = selectedIndicatorKey
    setIsDetailOpen(false)
    setSelectedIndicatorKey('')
    onDetailChange?.('')
    detailNavigation.restoreGrid(returnKey)
  }

  return (
    <div className="siope-panel">
      <section className="page-card siope-info-box financial-technical-note" aria-labelledby="siope-title">
        <div className="financial-technical-note__content">
          <span className="eyebrow">Leitura técnica do SIOPE</span>
          <h2 id="siope-title">Base de dados e metodologia</h2>
          <p>{SIOPE_SECTION_SUBTITLE}</p>
          <div className="financial-technical-note__meta">
            <DataSourceNote source={SIOPE_SOURCE} />
            <MethodNote className="data-source-note">
              <strong className="data-source-note__label">Nota metodológica:</strong>{' '}
              <span className="data-source-note__text">{SIOPE_METHODOLOGY}</span>
            </MethodNote>
          </div>
        </div>
      </section>

      <FinancialSection
        className="fundeb-summary siope-summary financial-metric-strip"
        eyebrow="Resumo financeiro"
        meta={`Valores mais recentes disponíveis para ${model.municipality.municipio}.`}
        title="Visão geral"
        titleId="siope-summary-title"
      >
        {municipalityMissing2025 ? (
          <p className="siope-municipality-note">{MUNICIPALITY_2025_MISSING_NOTE}</p>
        ) : null}
        <FinancialMetricStrip className="siope-summary-grid">
          {summaryCards.map((card) => (
            <SiopeSummaryCard card={card} key={card.indicator.slug} />
          ))}
        </FinancialMetricStrip>
      </FinancialSection>

      <FinancialSection
        className="financial-indicator-section financial-axis-section"
        eyebrow="Seção de indicadores"
        meta={`${activeIndicators.length} indicadores`}
        title="Eixos de análise"
        titleId="siope-axis-title"
      >
          <div className="financial-axis-tabs">
            <CategoryTabs
            ariaLabel="Eixos de análise dos recursos da educação"
            categories={model.groups}
            selectedCategory={activeGroupKey}
            onSelectCategory={handleGroupSelect}
          />
        </div>
        <div className="financial-axis-context platform-results-summary">
          <span>{activeGroup?.label ?? 'Eixo de análise'}</span>
          <span>{model.municipality.municipio}</span>
        </div>
        {!isDetailOpen ? (
          indicatorModels.length ? (
            <div className="financial-indicator-card-grid">
              {indicatorModels.map((indicator) => (
                <FinancialIndicatorCard
                  buttonRef={(node) => detailNavigation.registerCard(indicator.key, node)}
                  indicator={indicator}
                  isSelected={isDetailOpen && indicator.key === selectedIndicatorKey}
                  key={indicator.key}
                  onSelect={() => handleIndicatorSelect(indicator.key)}
                />
              ))}
            </div>
          ) : (
            <SiopeEmpty>Nenhum indicador disponível neste eixo.</SiopeEmpty>
          )
        ) : null}
      </FinancialSection>

      {isDetailOpen && selectedIndicatorModel && selectedIndicator ? (
        <div className="financial-detail-view education-detail-view" ref={detailNavigation.detailViewRef}>
          <FinancialDetailNavigation
            activeIndex={selectedIndex}
            nextIndicator={nextIndicator}
            onBack={handleBackToGrid}
            onNext={handleIndicatorSelect}
            onPrevious={handleIndicatorSelect}
            previousIndicator={previousIndicator}
            total={indicatorModels.length}
          />
          <section className="detail-panel educacao-detail-panel financial-detail-panel siope-detail">
            <FinancialDetailHeader indicator={selectedIndicatorModel} />
            <SiopeReadingGuide
              fallback={selectedIndicatorModel.description}
              guide={selectedIndicatorModel.readingGuide}
            />
            <FinancialMetricGrid indicator={selectedIndicatorModel} />
            <FinancialQuickReading text={selectedIndicatorModel.quickReading} tone={selectedIndicatorModel.statusTone} />
            <FinancialIndicatorMetadata metadata={getFinancialIndicatorMetadata('siope', selectedIndicatorModel.key)} />

            {selectedIndicatorHasMissingValues ? (
              <p className="fundeb-indicator-note siope-register-alert">
                <strong>Registro:</strong> {MISSING_VALUE_NOTE}
              </p>
            ) : null}

            <FinancialChartFrame
              subtitle={`${selectedIndicatorModel.label} · ${selectedIndicatorModel.groupLabel}`}
              summary={selectedIndicatorModel.historySummary}
              source={<DataSourceNote className="fundeb-data-source siope-chart-source" source={SIOPE_SOURCE} />}
            >
              {validSeries.length >= 2 ? (
                <IndicatorHistoryChart
                  chartHeight={validSeries.length <= 5 ? 300 : 320}
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
                <ChartEmptyState message="Histórico não disponível." />
              )}
            </FinancialChartFrame>

            <SiopeHistoricalData>
              <div className="fundeb-table-card financial-support-table">
                <div className="fundeb-table-card__header siope-table-card__header">
                  <div>
                    <h4>Valores por ano</h4>
                  </div>
                </div>
                <div className="fundeb-table-wrap" role="region" aria-label="Série histórica do indicador do SIOPE" tabIndex={0}>
                  <table className="fundeb-table">
                    <caption className="u-sr-only">Série histórica do indicador do SIOPE</caption>
                    <thead>
                      <tr>
                        <th scope="col">Ano</th>
                        <th scope="col">Valor</th>
                        <th scope="col">Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {series.map((point) => (
                        <tr key={point.ano}>
                          <td>{point.ano}</td>
                          <td>{formatSiopeValue(point.valor, selectedIndicator.unidade)}</td>
                          <td>{point.hasValue ? 'Com dados' : EM}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <DataSourceNote className="fundeb-data-source" source={SIOPE_SOURCE} />
              </div>
            </SiopeHistoricalData>
          </section>
          <FinancialDetailNavigation
            activeIndex={selectedIndex}
            isBottom
            nextIndicator={nextIndicator}
            onBack={handleBackToGrid}
            onNext={handleIndicatorSelect}
            onPrevious={handleIndicatorSelect}
            previousIndicator={previousIndicator}
            total={indicatorModels.length}
          />
        </div>
      ) : null}
    </div>
  )
}
