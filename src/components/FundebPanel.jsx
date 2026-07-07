import { useMemo, useState } from 'react'
import { FUNDEB_INDICATORS, formatFundebValue, getLimiteReferencia } from '../data/fundebIndicators'
import { DataSourceNote } from './DataSourceNote'
import { IndicatorHistoryChart } from '../components/IndicatorHistoryChart'
import { EducationSummaryCard } from './EducationSummaryCard'
import {
  FinancialChartFrame,
  FinancialDetailHeader,
  FinancialDetailNavigation,
  FinancialIndicatorCard,
  FinancialMetricGrid,
  FinancialQuickReading,
  FinancialReferenceBox,
  FinancialSupportData,
} from './FinancialIndicatorPrimitives'

const FUNDEB_READING_CARDS = [
  {
    icon: 'receitas',
    title: 'Receitas e recursos',
    text: 'Acompanhe os recursos registrados para manutenção e desenvolvimento da educação básica.',
  },
  {
    icon: 'despesas',
    title: 'Despesas e remuneração',
    text: 'Veja despesas totais e aplicação na remuneração dos profissionais da educação.',
  },
  {
    icon: 'saldos',
    title: 'Saldos financeiros',
    text: 'Consulte saldos, disponibilidade financeira e valores conciliados no período.',
  },
]

function formatCompactCurrency(value) {
  if (!Number.isFinite(Number(value))) return ''
  const num = Number(value)
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  if (abs >= 1e9) return `${sign}R$ ${(abs / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} bi`
  if (abs >= 1e6) return `${sign}R$ ${(abs / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mi`
  if (abs >= 1e3) return `${sign}R$ ${(abs / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatCompactDataLabel(value, tipo) {
  if (!Number.isFinite(Number(value))) return ''
  if (tipo === 'percentual') return `${Math.round(Number(value))}%`
  const num = Number(value)
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  if (abs >= 1e9) return `${sign}R$ ${(abs / 1e9).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} bi`
  if (abs >= 1e6) return `${sign}R$ ${(abs / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mi`
  if (abs >= 1e3) return `${sign}R$ ${(abs / 1e3).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mil`
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
}

function formatVariation(value, tipo) {
  if (value === null || value === undefined) return '—'
  const signal = value >= 0 ? '+' : ''
  if (tipo === 'percentual') {
    return `${signal}${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p.`
  }
  return `${signal}${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

function calcVariation(current, previous, tipo) {
  if (current == null || previous == null) return null
  const cur = Number(current)
  const prev = Number(previous)
  if (!Number.isFinite(cur) || !Number.isFinite(prev)) return null
  if (tipo === 'percentual') return cur - prev
  if (prev === 0) return null
  return ((cur - prev) / Math.abs(prev)) * 100
}

function filterCrechePreEscola(historico, indicatorKey) {
  if (
    indicatorKey === 'despesa_remuneracao_profissionais_creche' ||
    indicatorKey === 'despesa_remuneracao_profissionais_pre_escola'
  ) {
    return historico.filter((item) => Number(item.ano) >= 2021)
  }
  return historico
}

function findUltimoRegistro(historico, ultimo_ano) {
  const ano = Number(ultimo_ano)
  if (!Number.isFinite(ano)) return null
  const found = historico.find((item) => Number(item.ano) === ano)
  if (found) return found
  return historico
    .filter((item) => Number.isFinite(Number(item.ano)))
    .sort((a, b) => Number(b.ano) - Number(a.ano))[0] ?? null
}

function firstAvailable(series) {
  return [...series]
    .filter((point) => point.valor !== null && point.valor !== undefined && Number.isFinite(Number(point.valor)))
    .sort((a, b) => Number(a.ano) - Number(b.ano))[0] ?? null
}

function latestAvailable(series) {
  return [...series]
    .filter((point) => point.valor !== null && point.valor !== undefined && Number.isFinite(Number(point.valor)))
    .sort((a, b) => Number(b.ano) - Number(a.ano))[0] ?? null
}

function buildSeriesForIndicator(historico, indicator) {
  return filterCrechePreEscola(historico ?? [], indicator.key)
    .filter((entry) => entry.ano != null)
    .map((entry) => ({ ano: entry.ano, valor: entry[indicator.key] ?? null }))
}

function getFundebStatus(indicator, latest, variation) {
  if (latest?.valor === null || latest?.valor === undefined || !Number.isFinite(Number(latest.valor))) {
    return { label: 'Sem dados', tone: 'muted' }
  }

  if (indicator.key === 'percentual_minimo_remuneracao_profissionais') {
    const minimum = getLimiteReferencia(latest.ano)
    return Number(latest.valor) >= minimum
      ? { label: 'Acima do mínimo', tone: 'success' }
      : { label: 'Abaixo do mínimo', tone: 'warning' }
  }

  if (variation === null) return { label: 'Com dados', tone: 'info' }
  if (variation > 0) return { label: 'Alta', tone: 'success' }
  if (variation < 0) return { label: 'Queda', tone: 'warning' }
  return { label: 'Estável', tone: 'muted' }
}

function buildFundebHistorySummary(model) {
  if (!model.initialYear || !model.currentYear || model.initialYear === model.currentYear) return ''
  return `Série de ${model.initialYear} a ${model.currentYear}: ${model.initialDisplay} no início e ${model.currentDisplay} no dado mais recente.`
}

function buildFundebQuickReading(model) {
  if (!model.currentYear || model.currentDisplay === '—') {
    return 'O município não possui dado disponível para este indicador no período carregado.'
  }
  if (model.raw.key === 'percentual_minimo_remuneracao_profissionais') {
    return model.statusTone === 'success'
      ? `O município alcançou o mínimo de remuneração do FUNDEB no dado mais recente disponível.`
      : `O município ficou abaixo do mínimo de remuneração do FUNDEB no dado mais recente disponível.`
  }
  if (model.variationDisplay === '—') return `O indicador mais recente disponível é de ${model.currentYear}.`
  const movement = model.variationTone === 'success'
    ? 'alta'
    : model.variationTone === 'warning'
      ? 'queda'
      : 'estabilidade'
  return `O indicador mais recente disponível é de ${model.currentYear}; a série aponta ${movement} no período observado.`
}

function buildFundebIndicatorModel(indicator, historico) {
  const series = buildSeriesForIndicator(historico, indicator)
  const first = firstAvailable(series)
  const latest = latestAvailable(series)
  const variation = calcVariation(latest?.valor, first?.valor, indicator.tipo)
  const status = getFundebStatus(indicator, latest, variation)
  const model = {
    description: getIndicatorHelpText(indicator),
    initialDisplay: first ? formatFundebValue(first.valor, indicator.tipo) : '—',
    initialYear: first?.ano ?? null,
    key: indicator.key,
    label: indicator.label,
    moduleLabel: 'FUNDEB',
    currentDisplay: latest ? formatFundebValue(latest.valor, indicator.tipo) : '—',
    currentYear: latest?.ano ?? null,
    sourceLabel: latest?.ano ? `FUNDEB ${latest.ano}` : 'FUNDEB',
    statusLabel: status.label,
    statusTone: status.tone,
    unitLabel: indicator.tipo === 'percentual' ? 'Percentual' : 'Financeiro',
    variationDisplay: variation === null ? '—' : formatVariation(variation, indicator.tipo),
    variationLabel: first?.ano ? `Variação desde ${first.ano}` : 'Variação no período',
    variationTone: variation === null ? 'muted' : variation > 0 ? 'success' : variation < 0 ? 'warning' : 'muted',
    series,
    raw: indicator,
  }

  return {
    ...model,
    historySummary: buildFundebHistorySummary(model),
    quickReading: buildFundebQuickReading(model),
  }
}

function getIndicatorHelpText(indicator) {
  return indicator?.description || 'Acompanhe a evolução anual deste indicador.'
}

function FundebInfoIcon({ type }) {
  if (type === 'despesas') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M8 5V3m8 2V3M4 9h16" />
        <path d="M9 14h6m-3-3v6" />
      </svg>
    )
  }

  if (type === 'saldos') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12c1.8-3.2 4.4-4.8 8-4.8s6.2 1.6 8 4.8c-1.8 3.2-4.4 4.8-8 4.8S5.8 15.2 4 12Z" />
        <circle cx="12" cy="12" r="2.4" />
        <path d="M12 5.2V3.5m0 17v-1.7" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 9h5m-5 4h8m-8 4h4" />
      <path d="M16 8.5h2.5V11" />
    </svg>
  )
}

export function FundebPanel({ municipioData, selectedMunicipio, embedded = false }) {
  const rawFundebData = municipioData?.blocos?.fundeb
  const hasFundebData = Boolean(rawFundebData?.historico?.length)
  const fundebData = rawFundebData ?? {}
  const [selectedKey, setSelectedKey] = useState(FUNDEB_INDICATORS[0].key)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const selectedIndicator = useMemo(
    () => FUNDEB_INDICATORS.find((ind) => ind.key === selectedKey) ?? FUNDEB_INDICATORS[0],
    [selectedKey],
  )

  const { resumo_ultimo_ano, ultimo_ano, historico } = fundebData
  const historicoVisivel = useMemo(
    () => filterCrechePreEscola(historico ?? [], selectedIndicator?.key),
    [historico, selectedIndicator?.key],
  )
  const ultimoRegistro = useMemo(
    () => findUltimoRegistro(historico ?? [], ultimo_ano),
    [historico, ultimo_ano],
  )

  const isPercentual = selectedIndicator?.key === 'percentual_minimo_remuneracao_profissionais'

  const series = useMemo(() => {
    if (!selectedIndicator || !historicoVisivel) return []
    return historicoVisivel
      .filter((h) => h.ano != null)
      .map((h) => ({ ano: h.ano, valor: h[selectedIndicator.key] ?? null }))
  }, [selectedIndicator, historicoVisivel])

  const validSeries = useMemo(() => series.filter((s) => s.valor !== null), [series])

  const chartUnit = selectedIndicator?.tipo === 'percentual' ? 'percent' : 'currency'

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR')
    if (!query) return FUNDEB_INDICATORS
    return FUNDEB_INDICATORS.filter((ind) => {
      const text = `${ind.label} ${ind.description ?? ''}`.toLocaleLowerCase('pt-BR')
      return text.includes(query)
    })
  }, [searchQuery])
  const indicatorModels = useMemo(
    () => filteredItems.map((indicator) => buildFundebIndicatorModel(indicator, historico ?? [])),
    [filteredItems, historico],
  )
  const selectedIndicatorModel = indicatorModels.find((indicator) => indicator.key === selectedKey) ?? indicatorModels[0] ?? null
  const selectedIndex = selectedIndicatorModel
    ? indicatorModels.findIndex((indicator) => indicator.key === selectedIndicatorModel.key)
    : -1
  const previousIndicator = selectedIndex > 0 ? indicatorModels[selectedIndex - 1] : null
  const nextIndicator = selectedIndex >= 0 && selectedIndex < indicatorModels.length - 1
    ? indicatorModels[selectedIndex + 1]
    : null

  function handleIndicatorSelect(indicatorKey) {
    setSelectedKey(indicatorKey)
    setIsDetailOpen(true)
  }

  function handleBackToGrid() {
    setIsDetailOpen(false)
  }

  if (!hasFundebData) {
    return (
      <div className={embedded ? 'fundeb-panel-embedded' : 'page-stack fundeb-page'}>
        <div className="fundeb-empty">
          <p>Dados do FUNDEB não disponíveis para este município.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={embedded ? 'fundeb-panel-embedded' : 'page-stack fundeb-page'}>
      {!embedded && (
        <section className="page-card fundeb-hero">
          <div>
            <span className="eyebrow">FUNDEB</span>
            <h1>Fundo de Manutenção e Desenvolvimento da Educação Básica</h1>
            <p>Município em foco: <strong style={{ color: 'var(--text-strong)' }}>{selectedMunicipio}</strong></p>
          </div>
        </section>
      )}

      <section className="page-card fundeb-info-box" aria-labelledby="fundeb-info-title">
        <div className="fundeb-info-box__header">
          <h2 id="fundeb-info-title">O que é o FUNDEB</h2>
          <p>
            O FUNDEB reúne recursos destinados à manutenção e desenvolvimento da educação básica.
            Os indicadores mostram receitas, despesas, remuneração dos profissionais e saldos
            financeiros do município selecionado.
          </p>
        </div>
        <div className="fundeb-info-box__cards" aria-label="Eixos de leitura do FUNDEB">
          {FUNDEB_READING_CARDS.map((card) => (
            <article className="fundeb-info-card" key={card.title}>
              <span className="fundeb-info-card__icon">
                <FundebInfoIcon type={card.icon} />
              </span>
              <div>
                <strong>{card.title}</strong>
                <p>{card.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-card education-summary-section fundeb-summary">
        <div className="education-summary-header fundeb-summary__heading">
          <h2 className="education-summary-title">Visão geral</h2>
          {Number.isInteger(ultimo_ano) && ultimo_ano < 2025 && (
            <small className="education-summary-note fundeb-summary__note">
              Último dado disponível: {ultimo_ano}
            </small>
          )}
          {Number.isInteger(ultimo_ano) && ultimo_ano >= 2025 && (
            <small className="education-summary-note">Dados financeiros do ano de referência: {ultimo_ano}.</small>
          )}
        </div>
        <div className="education-summary-grid fundeb-summary-grid">
          <EducationSummaryCard label="Receitas do FUNDEB" value={formatFundebValue(resumo_ultimo_ano?.receitas, 'financeiro')} year={ultimo_ano} valueSize="compact" />
          <EducationSummaryCard label="Despesa total do FUNDEB" value={formatFundebValue(resumo_ultimo_ano?.despesa_total_fundeb, 'financeiro')} year={ultimo_ano} valueSize="compact" />
          <EducationSummaryCard label="Percentual aplicado em remuneração" value={formatFundebValue(resumo_ultimo_ano?.percentual_minimo_remuneracao_profissionais, 'percentual')} year={ultimo_ano} />
          <EducationSummaryCard label="Regra vigente" value={`Mínimo de ${resumo_ultimo_ano?.limite_remuneracao_referencia ?? getLimiteReferencia(ultimo_ano)}%`} year={ultimo_ano} valueSize="compact" />
          <EducationSummaryCard label="Disponibilidade financeira" value={formatFundebValue(ultimoRegistro?.disponibilidade_financeira_ate_bimestre, 'financeiro')} detail={`Saldo anterior: ${formatFundebValue(ultimoRegistro?.disponibilidade_financeira_ano_anterior, 'financeiro')}`} valueSize="compact" />
        </div>
      </section>

      {isDetailOpen && selectedIndicatorModel ? (
        <div className="financial-detail-view education-detail-view">
          <FinancialDetailNavigation
            activeIndex={selectedIndex}
            nextIndicator={nextIndicator}
            onBack={handleBackToGrid}
            onNext={handleIndicatorSelect}
            onPrevious={handleIndicatorSelect}
            previousIndicator={previousIndicator}
            total={indicatorModels.length}
          />
          <section className="detail-panel educacao-detail-panel financial-detail-panel fundeb-detail">
            <FinancialDetailHeader indicator={selectedIndicatorModel} />
            <FinancialReferenceBox>{selectedIndicatorModel.description}</FinancialReferenceBox>
            <FinancialMetricGrid indicator={selectedIndicatorModel} />
            <FinancialQuickReading text={selectedIndicatorModel.quickReading} tone={selectedIndicatorModel.statusTone} />

            {(selectedKey === 'despesa_remuneracao_profissionais_creche' || selectedKey === 'despesa_remuneracao_profissionais_pre_escola') && (
              <p className="fundeb-indicator-note"><strong>Nota metodológica:</strong> Série exibida a partir de 2021 para manter comparabilidade com a estrutura do Novo FUNDEB.</p>
            )}

            <FinancialChartFrame
              subtitle={`${selectedIndicator.label} · FUNDEB`}
              summary={selectedIndicatorModel.historySummary}
              source={(
                <DataSourceNote
                  className="fundeb-data-source"
                  context={{
                    block: 'fundeb',
                    detailType: 'chart',
                    indicatorKey: selectedIndicator?.key,
                    indicatorName: selectedIndicator?.label,
                  }}
                />
              )}
            >
              {validSeries.length >= 2 ? (
                <IndicatorHistoryChart
                  chartHeight={340}
                  endYear={series[series.length - 1].ano}
                  formatDataLabel={chartUnit === 'currency' ? (v) => formatCompactDataLabel(v, 'financeiro') : (v) => formatCompactDataLabel(v, 'percentual')}
                  formatYAxis={chartUnit === 'currency' ? formatCompactCurrency : undefined}
                  item={{ label: selectedIndicator.label }}
                  labelMode="all"
                  missingLabel="—"
                  result={null}
                  series={series}
                  showMetaLine={false}
                  showMissingPoints={true}
                  startYear={series[0].ano}
                  title={selectedIndicator.label}
                  unit={chartUnit}
                  yTickCount={5}
                />
              ) : (
                <div className="fundeb-empty fundeb-empty--chart">
                  <p>Não há pontos suficientes para exibir o gráfico deste indicador.</p>
                </div>
              )}
            </FinancialChartFrame>

            {series.length >= 1 ? (
              <FinancialSupportData subtitle="Tabela anual do demonstrativo do FUNDEB para o indicador selecionado.">
                <div className="fundeb-table-card financial-support-table">
                  <div className="fundeb-table-card__header">
                    <div>
                      <h4>Histórico do indicador</h4>
                    </div>
                  </div>
                  <div className="fundeb-table-wrap">
                    <table className="fundeb-table">
                      <thead>
                        <tr>
                          <th>Ano</th>
                          <th>Valor</th>
                          <th>Variação anual</th>
                          {isPercentual && <th>Mínimo exigido</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {historicoVisivel
                          .filter((h) => h.ano != null)
                          .map((entry, index) => {
                            const prev = index > 0 ? historicoVisivel[index - 1] : null
                            const currentVal = entry[selectedIndicator.key]
                            const prevVal = prev?.[selectedIndicator.key]
                            const vari = prev != null ? calcVariation(currentVal, prevVal, selectedIndicator.tipo) : null
                            return (
                              <tr key={entry.ano}>
                                <td>{entry.ano}</td>
                                <td>{formatFundebValue(currentVal, selectedIndicator.tipo)}</td>
                                <td><span className={
                                  index === 0 || vari == null
                                    ? 'fundeb-variation-neutral'
                                    : vari > 0
                                      ? 'fundeb-variation-positive'
                                      : vari < 0
                                        ? 'fundeb-variation-negative'
                                        : 'fundeb-variation-neutral'
                                }>{index === 0 ? '—' : formatVariation(vari, selectedIndicator.tipo)}</span></td>
                                {isPercentual && <td>{getLimiteReferencia(entry.ano)}%</td>}
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                  <DataSourceNote
                    className="fundeb-data-source"
                    context={{
                      block: 'fundeb',
                      detailType: 'table',
                      indicatorKey: selectedIndicator?.key,
                      indicatorName: selectedIndicator?.label,
                    }}
                  />
                </div>
              </FinancialSupportData>
            ) : (
              <div className="fundeb-empty">
                <p>Este indicador não possui série histórica disponível para este município.</p>
              </div>
            )}
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
      ) : (
      <section className="financial-indicator-section fundeb-workspace financial-grid-workspace">
        <div className="fundeb-workspace-layout educacao-analysis-layout">
            <aside className="indicator-sidebar">
              <div className="indicator-sidebar__heading">
                <h3>Indicadores</h3>
                <span>{FUNDEB_INDICATORS.length}</span>
              </div>
              <label className="indicator-search">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar indicador..."
                  aria-label="Buscar indicador"
                />
              </label>
              <div className="indicator-list financial-indicator-card-grid">
                {indicatorModels.length === 0 ? (
                  <div className="indicator-sidebar__empty">
                    <p>Nenhum indicador encontrado.</p>
                  </div>
                ) : (
                  indicatorModels.map((indicator) => (
                    <FinancialIndicatorCard
                      indicator={indicator}
                      isSelected={indicator.key === selectedKey}
                      key={indicator.key}
                      onSelect={() => handleIndicatorSelect(indicator.key)}
                    />
                  ))
                )}
              </div>
            </aside>

          <div className="fundeb-detail fundeb-detail--legacy">
            <div className="fundeb-detail-header">
              <div>
                <span className="eyebrow">Indicador selecionado</span>
                <h3>{selectedIndicator.label}</h3>
                {selectedIndicator?.description && (
                  <p className="fundeb-indicator-description">{selectedIndicator.description}</p>
                )}
              </div>
              <span className={
                selectedIndicator.tipo === 'percentual'
                  ? 'indicator-stage-badge indicator-stage-badge--pct'
                  : 'indicator-stage-badge'
              }>
                {selectedIndicator.tipo === 'percentual' ? 'Percentual' : 'Financeiro'}
              </span>
            </div>

            {(selectedKey === 'despesa_remuneracao_profissionais_creche' || selectedKey === 'despesa_remuneracao_profissionais_pre_escola') && (
              <p className="fundeb-indicator-note"><strong>Nota metodológica:</strong> Série exibida a partir de 2021 para manter comparabilidade com a estrutura do Novo FUNDEB.</p>
            )}

            {(validSeries.length >= 2 || series.length >= 1) && (
              <div className="fundeb-visual-grid">
                {validSeries.length >= 2 && (
                <div className="fundeb-chart-card">
                  <IndicatorHistoryChart
                    chartHeight={340}
                    endYear={series[series.length - 1].ano}
                    formatDataLabel={chartUnit === 'currency' ? (v) => formatCompactDataLabel(v, 'financeiro') : (v) => formatCompactDataLabel(v, 'percentual')}
                    formatYAxis={chartUnit === 'currency' ? formatCompactCurrency : undefined}
                    item={{ label: selectedIndicator.label }}
                    labelMode="all"
                    missingLabel="—"
                    result={null}
                    series={series}
                    showMetaLine={false}
                    showMissingPoints={true}
                    startYear={series[0].ano}
                    title={selectedIndicator.label}
                    unit={chartUnit}
                    yTickCount={5}
                  />
                </div>
                )}

                {validSeries.length <= 1 && series.length >= 2 && (
                  <div className="fundeb-empty fundeb-empty--chart">
                    <p>Apenas um ano com dado disponível — não há pontos suficientes para exibir o gráfico. Consulte a tabela ao lado.</p>
                  </div>
                )}

                {series.length >= 1 && (
                <div className="fundeb-table-card">
                <div className="fundeb-table-card__header">
                  <div>
                    <h4>Histórico do indicador</h4>
                  </div>
                </div>
                <div className="fundeb-table-wrap">
                  <table className="fundeb-table">
                    <thead>
                      <tr>
                        <th>Ano</th>
                        <th>Valor</th>
                        <th>Variação anual</th>
                        {isPercentual && <th>Mínimo exigido</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {historicoVisivel
                        .filter((h) => h.ano != null)
                        .map((entry, index) => {
                          const prev = index > 0 ? historicoVisivel[index - 1] : null
                          const currentVal = entry[selectedIndicator.key]
                          const prevVal = prev?.[selectedIndicator.key]
                          const vari = prev != null ? calcVariation(currentVal, prevVal, selectedIndicator.tipo) : null
                          return (
                            <tr key={entry.ano}>
                              <td>{entry.ano}</td>
                              <td>{formatFundebValue(currentVal, selectedIndicator.tipo)}</td>
                              <td><span className={
                                index === 0 || vari == null
                                  ? 'fundeb-variation-neutral'
                                  : vari > 0
                                    ? 'fundeb-variation-positive'
                                    : vari < 0
                                      ? 'fundeb-variation-negative'
                                      : 'fundeb-variation-neutral'
                              }>{index === 0 ? '—' : formatVariation(vari, selectedIndicator.tipo)}</span></td>
                              {isPercentual && <td>{getLimiteReferencia(entry.ano)}%</td>}
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
                <DataSourceNote
                  className="fundeb-data-source"
                  context={{
                    block: 'fundeb',
                    detailType: 'table',
                    indicatorKey: selectedIndicator?.key,
                    indicatorName: selectedIndicator?.label,
                  }}
                />
              </div>
                )}
              </div>
            )}

            {series.length === 0 && (
              <div className="fundeb-empty">
                <p>Este indicador não possui série histórica disponível para este município.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      )}
    </div>
  )
}
