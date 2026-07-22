import { useEffect, useMemo, useState } from 'react'
import { DataSourceNote } from './DataSourceNote'
import { FinancialIndicatorDisclosures } from './FinancialIndicatorMetadata'
import { ContentState } from './ContentState'
import {
  FinancialChartFrame,
  FinancialDetailHeader,
  FinancialDetailNavigation,
  FinancialMetricGrid,
  FinancialQuickReading,
  FinancialPrimaryAnalysis,
  FinancialSourcesFooter,
} from './FinancialIndicatorPrimitives'
import { IndicatorHistoryChart } from './IndicatorHistoryChart'
import {
  getSiopeOfficialGroup,
  loadSiopeDashboardData,
  SIOPE_DASHBOARD_YEARS,
  SIOPE_INDICATOR_READING_GUIDES,
} from '../data/siopeIndicators'
import { municipalFinanceLoader } from '../data/municipalFinance'
import { FINANCIAL_PAGE_KEYS } from '../data/financialPageKeys'
import { getFinancialIndicatorMetadata } from '../data/financialIndicatorMetadata'
import { useAsyncData } from '../utils/useAsyncData'
import { isPublishableFinancialIndicator, isPublishableFinancialValue } from '../utils/financialPresentation'
import { resolveDetailSequence, useDetailViewNavigation } from '../hooks/useDetailViewNavigation'

const EM = '\u2014'
const SIOPE_SOURCE = 'SIOPE / FNDE'
const MUNICIPALITY_2025_MISSING_NOTE =
  'As informações de 2025 podem estar incompletas; os cartões usam o ano mais recente informado.'
const APPLICATION_PRIMARY_KEYS = [
  'aplicacao_mde_percentual',
  'valor_aplicado_mde_reais',
  'despesas_educacao_total_percentual',
  'investimento_aluno_basica_reais',
]
const APPLICATION_SECONDARY_KEYS = [
  'investimento_aluno_infantil_reais',
  'investimento_aluno_fundamental_reais',
  'despesa_professores_aluno_basica_reais',
  'receitas_impostos_total_percentual',
]
const FUNDEB_KEYS = new Set([
  'fundeb_remuneracao_profissionais_percentual',
  'fundeb_nao_aplicado_percentual',
  'fundeb_educacao_infantil_percentual',
  'fundeb_ensino_fundamental_percentual',
  'saldo_financeiro_fundeb_reais',
])
const PUBLIC_LABELS = {
  aplicacao_mde_percentual: 'Aplicação em manutenção e desenvolvimento do ensino',
  valor_aplicado_mde_reais: 'Valor declarado como aplicado em educação',
  despesas_educacao_total_percentual: 'Participação da educação nas despesas municipais',
  investimento_aluno_basica_reais: 'Gasto médio por estudante da educação básica',
  investimento_aluno_infantil_reais: 'Gasto médio por estudante da educação infantil',
  investimento_aluno_fundamental_reais: 'Gasto médio por estudante do ensino fundamental',
  despesa_professores_aluno_basica_reais: 'Despesa média com professores por estudante',
  receitas_impostos_total_percentual: 'Participação dos impostos na receita municipal',
  resultado_financeiro_exercicio_reais: 'Resultado financeiro do exercício',
}

const SIOPE_LEGAL_STATUS_RULES = {
  aplicacao_mde_percentual: {
    limit: 25,
    passLabel: 'Cumpriu mínimo',
    failLabel: 'Não cumpriu o mínimo',
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
  if (!hasNumber(latest?.valor)) return { label: null, tone: 'default' }
  const legalStatus = getLegalStatus(indicator, latest)
  if (legalStatus) return legalStatus
  return { label: null, tone: variation.raw === null ? 'default' : 'info' }
}

function buildHistorySummary(model) {
  if (!model.initialYear || !model.currentYear || model.initialYear === model.currentYear) return ''
  return `Série de ${model.initialYear} a ${model.currentYear}: ${model.initialDisplay} no início e ${model.currentDisplay} no dado mais recente.`
}

function buildQuickReading(model) {
  if (!model.currentYear || model.currentDisplay === EM) return ''
  if (model.variationDisplay === EM) {
    return `Valor informado em ${model.currentYear}.`
  }
  const variation = model.variationDisplay.replace(/^[+-]/, '')
  if (model.variationRaw > 0) return `Entre ${model.initialYear} e ${model.currentYear}, aumentou ${variation}.`
  if (model.variationRaw < 0) return `Entre ${model.initialYear} e ${model.currentYear}, reduziu ${variation}.`
  return `Entre ${model.initialYear} e ${model.currentYear}, o valor não variou.`
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
    moduleLabel: 'Aplicação e execução da educação',
    currentDisplay: latest ? formatSiopeValue(latest.valor, indicator.unidade) : EM,
    currentDisplayCompact: latest ? formatCompactDataLabel(latest.valor, indicator.unidade) : EM,
    currentYear: latest?.ano ?? null,
    sourceLabel: latest?.ano ? `SIOPE/FNDE ${latest.ano}` : 'SIOPE/FNDE',
    statusLabel: status.label,
    statusTone: status.tone,
    unitLabel: getIndicatorTypeLabel(indicator),
    variationDisplay: variation.display,
    variationRaw: variation.raw,
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

function PublicMetric({ label, model, onSelect, compact = false }) {
  return (
    <article className={`siope-public-metric${compact ? ' siope-public-metric--compact' : ''}`}>
      <div>
        <span>{label}</span>
        <strong>{model.currentDisplay}</strong>
        <small>{model.currentYear ? `Período: ${model.currentYear}` : 'Período não informado'}</small>
      </div>
      <button type="button" onClick={() => onSelect(model.key)}>Ver detalhe</button>
    </article>
  )
}

function SummaryMetric({ label, value, year }) {
  return (
    <article className="siope-public-summary__item">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{year ? `Período: ${year}` : 'Período não informado'}</small>
    </article>
  )
}

function FinancialAmount({ value }) {
  if (!isPublishableFinancialValue(value)) return EM
  return formatSiopeValue(value.value, 'reais')
}

function ExecutionSection({ execution }) {
  if (!execution) return (
    <section className="page-card siope-public-section siope-execution" aria-labelledby="siope-execution-title">
      <div className="siope-public-section-heading">
        <span className="eyebrow">Execução das despesas</span>
        <h2 id="siope-execution-title">Quanto das despesas avançou até o pagamento?</h2>
      </div>
      <p className="siope-execution__unavailable">Os valores de execução não estão disponíveis para este município.</p>
    </section>
  )

  const stages = [
    { key: 'committed', label: 'Valor comprometido no orçamento', value: execution.committed },
    { key: 'liquidated', label: 'Despesa reconhecida', value: execution.liquidated },
    { key: 'paid', label: 'Valor pago', value: execution.paid },
  ].filter((stage) => isPublishableFinancialValue(stage.value))
  const rates = [
    { key: 'liquidated', label: 'Do valor comprometido, quanto já foi reconhecido', value: execution.derivedRates.liquidatedToCommittedRate },
    { key: 'paidCommitted', label: 'Do valor comprometido, quanto já foi pago', value: execution.derivedRates.paidToCommittedRate },
    { key: 'paidLiquidated', label: 'Da despesa reconhecida, quanto já foi pago', value: execution.derivedRates.paidToLiquidatedRate },
  ].filter((rate) => hasNumber(rate.value?.value))
  const outstanding = [
    { key: 'processed', label: 'Obrigações já reconhecidas', value: execution.outstandingProcessed },
    { key: 'nonProcessed', label: 'Compromissos ainda não reconhecidos', value: execution.outstandingNonProcessed },
  ].filter((item) => isPublishableFinancialValue(item.value))

  return (
    <section className="page-card siope-public-section siope-execution" aria-labelledby="siope-execution-title">
      <div className="siope-public-section-heading">
        <span className="eyebrow">Execução das despesas</span>
        <h2 id="siope-execution-title">Quanto das despesas avançou até o pagamento?</h2>
        <p>As etapas mostram momentos da mesma despesa e não devem ser somadas.</p>
      </div>
      <div className="siope-execution__layout">
        <ol className="siope-execution__stages">
          {stages.map((stage, index) => (
            <li key={stage.key}>
              <span>{index + 1}</span>
              <div>
                <small>{stage.label}</small>
                <strong><FinancialAmount value={stage.value} /></strong>
                <b>Período: {stage.value.referenceYear}</b>
              </div>
            </li>
          ))}
        </ol>
        {rates.length ? (
          <aside className="siope-execution__rates" aria-label="Avanço entre as etapas">
            <h3>Avanço entre as etapas</h3>
            <ul>
              {rates.map((rate) => (
                <li key={rate.key}>
                  <strong>{formatSiopeValue(rate.value.value, 'percentual')}</strong>
                  <span>{rate.label}</span>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
      {outstanding.length ? (
        <div className="siope-execution__outstanding">
          <h3>Valores ainda a pagar</h3>
          <dl>
            {outstanding.map((item) => (
              <div key={item.key}>
                <dt>{item.label}</dt>
                <dd><FinancialAmount value={item.value} /></dd>
                <small>Período: {item.value.referenceYear}</small>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  )
}

function SiopeEmpty({ children }) {
  return (
    <ContentState kind="empty" className="siope-empty">
      <p>{children}</p>
    </ContentState>
  )
}

export function SiopeIndicatorsPanel({ idMunicipio, selectedMunicipio, detailKey = '', onDetailChange }) {
  const state = useAsyncData(() => loadSiopeDashboardData(), [])
  const financeState = useAsyncData(
    () => (idMunicipio ? municipalFinanceLoader.load(String(idMunicipio)) : null),
    [idMunicipio],
  )
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

  if (state.loading || financeState.loading) {
    return <div className="page-stack"><ContentState as="p" kind="loading" className="state-box state-box--loading">Carregando informações de aplicação e execução...</ContentState></div>
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
    return <SiopeEmpty>Não há informações financeiras do SIOPE/FNDE para este município.</SiopeEmpty>
  }

  const indicatorModels = model.catalogIndicators
    .map((indicator) => {
      const group = model.groups.find((item) => item.items?.some((candidate) => candidate.slug === indicator.slug))
      return buildSiopeIndicatorModel(indicator, model.municipality, group)
    })
    .filter(isPublishableFinancialIndicator)
  const selectedIndicatorModel = indicatorModels.find((indicator) => indicator.key === selectedIndicatorKey) ?? indicatorModels[0]
  const selectedMetadata = selectedIndicatorModel
    ? getFinancialIndicatorMetadata('siope', selectedIndicatorModel.key)
    : null
  const selectedIndicator = selectedIndicatorModel?.raw
  const series = selectedIndicator
    ? buildIndicatorSeries(model.municipality, selectedIndicator)
    : []
  const validSeries = series.filter((point) => hasNumber(point.valor))
  const chartSeries = validSeries.map((point) => ({ ano: point.ano, valor: point.valor }))
  const publicModelByKey = new Map(indicatorModels.map((indicator) => [indicator.key, indicator]))
  const applicationPrimary = APPLICATION_PRIMARY_KEYS.map((key) => publicModelByKey.get(key)).filter(Boolean)
  const applicationSecondary = APPLICATION_SECONDARY_KEYS.map((key) => publicModelByKey.get(key)).filter(Boolean)
  const catalogIndicators = indicatorModels.filter((indicator) => (
    !FUNDEB_KEYS.has(indicator.key)
    && !APPLICATION_PRIMARY_KEYS.includes(indicator.key)
    && !APPLICATION_SECONDARY_KEYS.includes(indicator.key)
  ))
  const hasOnlyFinancialResult = catalogIndicators.length === 1
    && catalogIndicators[0].key === 'resultado_financeiro_exercicio_reais'
  const execution = financeState.data?.execution?.dcaEducation ?? null
  const paidValue = execution && isPublishableFinancialValue(execution.paid) ? execution.paid : null
  const municipalityMissing2025 = !hasMunicipalityDataForYear(model.municipality, 2025)
  const { activeIndex: selectedIndex, previousItem: previousIndicator, nextItem: nextIndicator } = resolveDetailSequence(indicatorModels, selectedIndicatorModel?.key)

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
      {!isDetailOpen ? (
        <>
          <section className="page-card siope-public-summary" aria-labelledby="siope-summary-title">
            <div className="siope-public-section-heading">
              <span className="eyebrow">Resumo principal</span>
              <h2 id="siope-summary-title">Números mais recentes</h2>
            </div>
            <div className="siope-public-summary__grid">
              {publicModelByKey.get('aplicacao_mde_percentual') ? (
                <SummaryMetric
                  label={PUBLIC_LABELS.aplicacao_mde_percentual}
                  value={publicModelByKey.get('aplicacao_mde_percentual').currentDisplay}
                  year={publicModelByKey.get('aplicacao_mde_percentual').currentYear}
                />
              ) : null}
              {publicModelByKey.get('valor_aplicado_mde_reais') ? (
                <SummaryMetric
                  label={PUBLIC_LABELS.valor_aplicado_mde_reais}
                  value={publicModelByKey.get('valor_aplicado_mde_reais').currentDisplay}
                  year={publicModelByKey.get('valor_aplicado_mde_reais').currentYear}
                />
              ) : null}
              {paidValue ? (
                <SummaryMetric label="Valor pago em despesas de educação" value={<FinancialAmount value={paidValue} />} year={paidValue.referenceYear} />
              ) : null}
              {publicModelByKey.get('investimento_aluno_basica_reais') ? (
                <SummaryMetric
                  label={PUBLIC_LABELS.investimento_aluno_basica_reais}
                  value={publicModelByKey.get('investimento_aluno_basica_reais').currentDisplay}
                  year={publicModelByKey.get('investimento_aluno_basica_reais').currentYear}
                />
              ) : null}
            </div>
            {municipalityMissing2025 ? <p className="siope-public-period-note">{MUNICIPALITY_2025_MISSING_NOTE}</p> : null}
          </section>

          <section className="page-card siope-public-section siope-application" aria-labelledby="siope-application-title">
            <div className="siope-public-section-heading">
              <span className="eyebrow">Aplicação dos recursos</span>
              <h2 id="siope-application-title">Quanto o município aplicou em educação?</h2>
            </div>
            {applicationPrimary.length ? (
              <div className="siope-application__layout">
                {applicationPrimary[0] ? (
                  <article className="siope-application__lead">
                    <span>{PUBLIC_LABELS[applicationPrimary[0].key]}</span>
                    <strong>{applicationPrimary[0].currentDisplay}</strong>
                    <div>
                      <small>{applicationPrimary[0].currentYear ? `Período: ${applicationPrimary[0].currentYear}` : 'Período não informado'}</small>
                      {applicationPrimary[0].statusLabel ? <b>{applicationPrimary[0].statusLabel}</b> : null}
                    </div>
                    <button type="button" onClick={() => handleIndicatorSelect(applicationPrimary[0].key)}>Ver detalhe e evolução</button>
                  </article>
                ) : null}
                <div className="siope-application__primary-list">
                  {applicationPrimary.slice(1).map((indicator) => (
                    <PublicMetric
                      key={indicator.key}
                      label={PUBLIC_LABELS[indicator.key] ?? indicator.label}
                      model={indicator}
                      onSelect={handleIndicatorSelect}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {applicationSecondary.length ? (
              <div className="siope-application__secondary" aria-label="Outros indicadores de aplicação">
                {applicationSecondary.map((indicator) => (
                  <PublicMetric
                    compact
                    key={indicator.key}
                    label={PUBLIC_LABELS[indicator.key] ?? indicator.label}
                    model={indicator}
                    onSelect={handleIndicatorSelect}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <ExecutionSection execution={execution} />

          <aside className="page-card siope-fundeb-link" aria-label="Indicadores do Fundeb">
            <div>
              <span className="eyebrow">Fundeb</span>
              <strong>Veja recursos, aplicação e saldos do Fundeb.</strong>
            </div>
            <a className="platform-navigation-button" href={`#${FINANCIAL_PAGE_KEYS.fundeb}`}>Abrir página do Fundeb</a>
          </aside>

          {hasOnlyFinancialResult ? (
            <details className="platform-support-disclosure siope-secondary-result-disclosure">
              <summary className="platform-support-disclosure__summary">
                <div>
                  <h3>Resultado financeiro do exercício</h3>
                  <p>Indicador complementar do período publicado.</p>
                </div>
              </summary>
              <div className="platform-support-disclosure__body">
                <PublicMetric
                  compact
                  label={PUBLIC_LABELS[catalogIndicators[0].key] ?? catalogIndicators[0].label}
                  model={catalogIndicators[0]}
                  onSelect={handleIndicatorSelect}
                />
              </div>
            </details>
          ) : catalogIndicators.length ? (
            <section className="page-card siope-public-section siope-secondary-catalog" aria-labelledby="siope-secondary-title">
              <div className="siope-public-section-heading">
                <span className="eyebrow">Para aprofundar</span>
                <h2 id="siope-secondary-title">Indicadores secundários</h2>
              </div>
              <div className="siope-secondary-catalog__list">
                {catalogIndicators.map((indicator) => (
                  <PublicMetric
                    compact
                    key={indicator.key}
                    label={PUBLIC_LABELS[indicator.key] ?? indicator.label}
                    model={indicator}
                    onSelect={handleIndicatorSelect}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <FinancialSourcesFooter
            periods="Os períodos exibidos correspondem ao ano publicado em cada valor; execução das despesas usa o exercício informado."
            source="SIOPE/FNDE e SICONFI/DCA."
          >
            Valores declarados ao SIOPE/FNDE e valores de execução declarados no SICONFI/DCA são apresentados sem preenchimento de exercícios ausentes.
          </FinancialSourcesFooter>
        </>
      ) : null}

      {isDetailOpen && selectedIndicatorModel && selectedIndicator ? (
        <div className="financial-detail-view education-detail-view" ref={detailNavigation.detailViewRef}>
          <FinancialDetailNavigation
            activeIndex={selectedIndex}
            nextIndicator={nextIndicator}
            onBack={handleBackToGrid}
            onNext={handleIndicatorSelect}
            onPrevious={handleIndicatorSelect}
            previousIndicator={previousIndicator}
            statusLabel={selectedIndicatorModel.statusLabel}
            statusTone={selectedIndicatorModel.statusTone}
            total={indicatorModels.length}
          />
          <section className="detail-panel educacao-detail-panel financial-detail-panel siope-detail">
            <FinancialDetailHeader indicator={selectedIndicatorModel} />
            <FinancialMetricGrid indicator={selectedIndicatorModel} />

            <FinancialPrimaryAnalysis>
              {validSeries.length >= 2 ? (
              <FinancialChartFrame
                subtitle={selectedIndicatorModel.description}
                source={<DataSourceNote className="fundeb-data-source siope-chart-source" source={SIOPE_SOURCE} />}
              >
                <IndicatorHistoryChart
                    chartType={selectedIndicator.unidade === 'reais' && validSeries.length <= 3 ? 'bar' : 'line'}
                    chartHeight={300}
                    endYear={2025}
                    formatDataLabel={(value) => formatCompactDataLabel(value, selectedIndicator.unidade)}
                    formatYAxis={selectedIndicator.unidade === 'reais' ? formatCompactCurrency : undefined}
                    item={{ label: selectedIndicator.nome_dashboard }}
                    labelMode="all"
                    missingLabel={EM}
                    result={null}
                    series={chartSeries}
                    showMetaLine={false}
                    showMissingPoints={false}
                    startYear={2021}
                    title={selectedIndicator.nome_dashboard}
                    unit={getIndicatorUnit(selectedIndicator)}
                    yTickCount={5}
                  />
              </FinancialChartFrame>
              ) : null}
              <FinancialQuickReading
                description={selectedIndicatorModel.description}
                indicator={selectedIndicatorModel}
                metadata={selectedMetadata}
                readingGuide={selectedIndicatorModel.readingGuide}
                text={selectedIndicatorModel.quickReading}
              />
            </FinancialPrimaryAnalysis>

            <FinancialIndicatorDisclosures
              formatValue={(value) => formatSiopeValue(value, selectedIndicator?.unidade)}
              indicator={selectedIndicatorModel}
              metadata={selectedMetadata}
              series={chartSeries}
              source={SIOPE_SOURCE}
            />
          </section>
        </div>
      ) : null}
    </div>
  )
}
