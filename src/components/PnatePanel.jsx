import { useEffect, useMemo, useState } from 'react'
import { resolveDetailSequence, useDetailViewNavigation } from '../hooks/useDetailViewNavigation'
import { PNATE_INDICATORS, formatPnateValue } from '../data/pnateIndicators'
import { getFinancialIndicatorMetadata } from '../data/financialIndicatorMetadata'
import { DataSourceNote } from './DataSourceNote'
import { FinancialIndicatorMetadata } from './FinancialIndicatorMetadata'
import { ContentState } from './ContentState'
import { IndicatorHistoryChart } from '../components/IndicatorHistoryChart'
import { ChartEmptyState } from './ChartPrimitives'
import { EducationSummaryCard } from './EducationSummaryCard'
import { SearchField } from './SearchField'
import {
  FinancialChartFrame,
  FinancialDetailHeader,
  FinancialDetailNavigation,
  FinancialIndicatorCard,
  FinancialSection,
  FinancialMetricStrip,
  FinancialMetricGrid,
  FinancialQuickReading,
  FinancialMethodologyDisclosure,
  FinancialSupportData,
} from './FinancialIndicatorPrimitives'

const PNATE_READING_CARDS = [
  {
    title: 'Transporte escolar rural',
    text: 'Apoio suplementar ao transporte de estudantes da educação básica pública residentes em áreas rurais.',
  },
  {
    title: 'Base de atendimento',
    text: 'Acompanhe estudantes considerados por rede e etapa de ensino no cálculo anual.',
  },
  {
    title: 'Repasse financeiro',
    text: 'Consulte valores totais, descontos, saldo e parcelas informadas pelo FNDE.',
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

function formatCompactNumber(value) {
  if (!Number.isFinite(Number(value))) return ''
  return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function formatCompactDataLabel(value, tipo) {
  if (!Number.isFinite(Number(value))) return ''
  if (tipo === 'numero') return formatCompactNumber(value)
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
  if (tipo === 'numero') {
    return `${signal}${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
  }
  return `${signal}${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

function calcVariation(current, previous) {
  if (current == null || previous == null) return null
  const cur = Number(current)
  const prev = Number(previous)
  if (!Number.isFinite(cur) || !Number.isFinite(prev) || prev === 0) return null
  return ((cur - prev) / Math.abs(prev)) * 100
}

function findUltimoRegistro(historico, ultimoAno) {
  const ano = Number(ultimoAno)
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
  return (historico ?? [])
    .filter((entry) => entry.ano != null)
    .map((entry) => ({ ano: entry.ano, valor: entry[indicator.key] ?? null }))
}

function getPnateStatus(latest, variation) {
  if (latest?.valor === null || latest?.valor === undefined || !Number.isFinite(Number(latest.valor))) {
    return { label: 'Sem dados', tone: 'muted' }
  }
  if (variation === null) return { label: 'Com dados', tone: 'info' }
  if (variation > 0) return { label: 'Alta', tone: 'success' }
  if (variation < 0) return { label: 'Queda', tone: 'warning' }
  return { label: 'Estável', tone: 'muted' }
}

function buildPnateHistorySummary(model) {
  if (!model.initialYear || !model.currentYear || model.initialYear === model.currentYear) return ''
  return `Série de ${model.initialYear} a ${model.currentYear}: ${model.initialDisplay} no início e ${model.currentDisplay} no dado mais recente.`
}

function buildPnateQuickReading(model) {
  if (!model.currentYear || model.currentDisplay === '—') {
    return 'O município não possui dado disponível para este indicador no período carregado.'
  }
  if (model.variationDisplay === '—') return `O indicador mais recente disponível é de ${model.currentYear}.`
  const movement = model.variationTone === 'success'
    ? 'alta'
    : model.variationTone === 'warning'
      ? 'queda'
      : 'estabilidade'
  return `O indicador mais recente disponível é de ${model.currentYear}; a série aponta ${movement} no período observado.`
}

function buildPnateIndicatorModel(indicator, historico) {
  const series = buildSeriesForIndicator(historico, indicator)
  const first = firstAvailable(series)
  const latest = latestAvailable(series)
  const variation = calcVariation(latest?.valor, first?.valor)
  const status = getPnateStatus(latest, variation)
  const model = {
    description: indicator.description,
    initialDisplay: first ? formatPnateValue(first.valor, indicator.tipo) : '—',
    initialDisplayCompact: first ? formatCompactDataLabel(first.valor, indicator.tipo) : '—',
    initialYear: first?.ano ?? null,
    key: indicator.key,
    label: indicator.label,
    moduleLabel: 'PNATE',
    currentDisplay: latest ? formatPnateValue(latest.valor, indicator.tipo) : '—',
    currentDisplayCompact: latest ? formatCompactDataLabel(latest.valor, indicator.tipo) : '—',
    currentYear: latest?.ano ?? null,
    sourceLabel: latest?.ano ? `PNATE ${latest.ano}` : 'PNATE',
    statusLabel: status.label,
    statusTone: status.tone,
    unitLabel: indicator.tipo === 'numero' ? 'Contagem' : 'Financeiro',
    variationDisplay: variation === null ? '—' : formatVariation(variation, indicator.tipo),
    variationLabel: first?.ano ? `Variação desde ${first.ano}` : 'Variação no período',
    variationTone: variation === null ? 'muted' : variation > 0 ? 'success' : variation < 0 ? 'warning' : 'muted',
    series,
    raw: indicator,
  }

  return {
    ...model,
    historySummary: buildPnateHistorySummary(model),
    quickReading: buildPnateQuickReading(model),
  }
}

function PnateInfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 16V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V16" />
      <path d="M4 16h16v2H4z" />
      <path d="M8 18v1.5m8-1.5v1.5M8 10h8M8 13h3m2 0h3" />
    </svg>
  )
}

export function PnatePanel({ pnateData, selectedMunicipio, detailKey = '', onDetailChange }) {
  const hasPnateData = Boolean(pnateData?.historico?.length)
  const [selectedKey, setSelectedKey] = useState(detailKey || PNATE_INDICATORS[0].key)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDetailOpen, setIsDetailOpen] = useState(Boolean(detailKey))
  const detailNavigation = useDetailViewNavigation({
    activeKey: selectedKey,
    isOpen: isDetailOpen,
  })

  const selectedIndicator = useMemo(
    () => PNATE_INDICATORS.find((ind) => ind.key === selectedKey) ?? PNATE_INDICATORS[0],
    [selectedKey],
  )

  const { resumo_ultimo_ano, ultimo_ano, historico = [], avisos = [] } = pnateData ?? {}
  const ultimoRegistro = useMemo(
    () => findUltimoRegistro(historico, ultimo_ano),
    [historico, ultimo_ano],
  )

  const series = useMemo(() => {
    if (!selectedIndicator) return []
    return historico
      .filter((h) => h.ano != null)
      .map((h) => ({ ano: h.ano, valor: h[selectedIndicator.key] ?? null }))
  }, [selectedIndicator, historico])

  const validSeries = useMemo(() => series.filter((s) => s.valor !== null), [series])
  const chartUnit = selectedIndicator?.tipo === 'numero' ? 'count' : 'currency'

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR')
    if (!query) return PNATE_INDICATORS
    return PNATE_INDICATORS.filter((ind) => {
      const text = `${ind.label} ${ind.description ?? ''}`.toLocaleLowerCase('pt-BR')
      return text.includes(query)
    })
  }, [searchQuery])
  const indicatorModels = useMemo(
    () => filteredItems.map((indicator) => buildPnateIndicatorModel(indicator, historico)),
    [filteredItems, historico],
  )
  const selectedIndicatorModel = indicatorModels.find((indicator) => indicator.key === selectedKey) ?? indicatorModels[0] ?? null
  const { activeIndex: selectedIndex, previousItem: previousIndicator, nextItem: nextIndicator } = resolveDetailSequence(indicatorModels, selectedIndicatorModel?.key)

  useEffect(() => {
    if (!detailKey) return setIsDetailOpen(false)
    if (indicatorModels.some((indicator) => indicator.key === detailKey)) {
      setSelectedKey(detailKey)
      setIsDetailOpen(true)
    } else if (indicatorModels.length) {
      setIsDetailOpen(false)
      onDetailChange?.('')
    }
  }, [detailKey, indicatorModels, onDetailChange])

  function handleIndicatorSelect(indicatorKey) {
    detailNavigation.prepareDetail(indicatorKey, {
      captureGridPosition: !isDetailOpen,
    })
    setSelectedKey(indicatorKey)
    setIsDetailOpen(true)
    onDetailChange?.(indicatorKey)
  }

  function handleBackToGrid() {
    const returnKey = selectedKey
    setIsDetailOpen(false)
    setSelectedKey('')
    onDetailChange?.('')
    detailNavigation.restoreGrid(returnKey)
  }

  if (!hasPnateData) {
    return (
      <div className="fundeb-panel-embedded">
        <div className="fundeb-empty">
          <p>Dados do PNATE não disponíveis para este município.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fundeb-panel-embedded">
      <section className="page-card fundeb-info-box financial-intro-panel" aria-labelledby="pnate-info-title">
        <div className="fundeb-info-box__header">
          <h2 id="pnate-info-title">O que é o PNATE</h2>
          <p>
            O PNATE apoia o transporte dos estudantes das redes públicas de educação básica
            residentes em áreas rurais, por meio de assistência técnica e financeira
            suplementar a estados e municípios.
          </p>
        </div>
        <div className="fundeb-info-box__cards" aria-label="Eixos de leitura do PNATE">
          {PNATE_READING_CARDS.map((card) => (
            <article className="fundeb-info-card" key={card.title}>
              <span className="fundeb-info-card__icon">
                <PnateInfoIcon />
              </span>
              <div>
                <strong>{card.title}</strong>
                <p>{card.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <FinancialSection
        className="fundeb-summary financial-metric-strip"
        eyebrow="Resumo financeiro"
        meta={`Município em foco: ${selectedMunicipio}. Dados do ano de referência: ${ultimo_ano}.`}
        title="Visão geral"
        titleId="pnate-summary-title"
      >
        <FinancialMetricStrip className="pnate-summary-grid">
          <EducationSummaryCard label="Repasse total" value={formatPnateValue(resumo_ultimo_ano?.repasse_total, 'financeiro')} year={ultimo_ano} valueSize="compact" />
          <EducationSummaryCard label="Repasse autorizado após desconto" value={formatPnateValue(resumo_ultimo_ano?.repasse_autorizado_apos_desconto, 'financeiro')} year={ultimo_ano} valueSize="compact" />
          <EducationSummaryCard label="Estudantes atendidos" value={formatPnateValue(resumo_ultimo_ano?.total_alunos, 'numero')} year={ultimo_ano} />
          <EducationSummaryCard label="Valor per capita" value={formatPnateValue(resumo_ultimo_ano?.resultado_per_capita, 'financeiro')} year={ultimo_ano} />
          <EducationSummaryCard label="Redes consideradas" value={`${formatPnateValue(resumo_ultimo_ano?.total_alunos_rede_municipal, 'numero')} mun. / ${formatPnateValue(resumo_ultimo_ano?.total_alunos_rede_estadual, 'numero')} est.`} year={ultimo_ano} valueSize="compact" />
        </FinancialMetricStrip>
      </FinancialSection>

      {avisos.length > 0 && (
        <aside className="financial-methodology-note" aria-label="Nota metodológica do PNATE">
          <span className="eyebrow">Nota metodológica</span>
          <p>{avisos[0]}</p>
        </aside>
      )}

      {isDetailOpen && selectedIndicatorModel ? (
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
          <section className="detail-panel educacao-detail-panel financial-detail-panel fundeb-detail pnate-detail">
            <FinancialDetailHeader indicator={selectedIndicatorModel} />
            <FinancialMetricGrid indicator={selectedIndicatorModel} />
            <div className="financial-primary-analysis">
              <FinancialChartFrame
                subtitle={`${selectedIndicator.label} · PNATE`}
                summary={selectedIndicatorModel.historySummary}
                source={(
                  <DataSourceNote
                    className="fundeb-data-source"
                    context={{
                      block: 'pnate',
                      detailType: 'chart',
                      indicatorKey: selectedIndicator?.key,
                      indicatorName: selectedIndicator?.label,
                    }}
                  />
                )}
              >
                {validSeries.length >= 2 ? (
                  <IndicatorHistoryChart
                    chartHeight={300}
                    endYear={series[series.length - 1].ano}
                    essentialLabels
                    formatDataLabel={(v) => formatCompactDataLabel(v, selectedIndicator.tipo)}
                    formatYAxis={selectedIndicator.tipo === 'numero' ? formatCompactNumber : formatCompactCurrency}
                    item={{ label: selectedIndicator.label }}
                    missingLabel="—"
                    responsiveLayout
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
                  <ChartEmptyState message="Histórico não disponível." />
                )}
              </FinancialChartFrame>

              <FinancialQuickReading
                description={selectedIndicatorModel.description}
                indicator={selectedIndicatorModel}
                text={selectedIndicatorModel.quickReading}
                tone={selectedIndicatorModel.statusTone}
              />
            </div>

            <FinancialMethodologyDisclosure>
              <FinancialIndicatorMetadata metadata={getFinancialIndicatorMetadata('pnate', selectedIndicatorModel.key)} />
            </FinancialMethodologyDisclosure>

            {series.length >= 1 ? (
              <FinancialSupportData subtitle="Tabela anual do PNATE para o indicador selecionado.">
                <div className="fundeb-table-card financial-support-table">
                  <div className="fundeb-table-card__header">
                    <div>
                      <h4>Histórico do indicador</h4>
                    </div>
                  </div>
                  <div className="fundeb-table-wrap" role="region" aria-label="Série histórica do indicador do PNATE. Role horizontalmente para consultar todas as colunas quando necessário." tabIndex={0}>
                    <table className="fundeb-table">
                      <caption className="u-sr-only">Série histórica do indicador do PNATE</caption>
                      <thead>
                        <tr>
                          <th scope="col">Ano</th>
                          <th scope="col">Valor</th>
                          <th scope="col">Variação anual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historico
                          .filter((h) => h.ano != null)
                          .map((entry, index) => {
                            const prev = index > 0 ? historico[index - 1] : null
                            const currentVal = entry[selectedIndicator.key]
                            const prevVal = prev?.[selectedIndicator.key]
                            const vari = prev != null ? calcVariation(currentVal, prevVal) : null
                            return (
                              <tr key={entry.ano}>
                                <td>{entry.ano}</td>
                                <td>{formatPnateValue(currentVal, selectedIndicator.tipo)}</td>
                                <td><span className={
                                  index === 0 || vari == null
                                    ? 'fundeb-variation-missing'
                                    : vari > 0
                                      ? 'fundeb-variation-positive'
                                      : vari < 0
                                        ? 'fundeb-variation-negative'
                                        : 'fundeb-variation-neutral'
                                } aria-label={index === 0 || vari == null ? 'Variação indisponível' : undefined}>{index === 0 ? '—' : formatVariation(vari, selectedIndicator.tipo)}</span></td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                  <DataSourceNote
                    className="fundeb-data-source"
                    context={{
                      block: 'pnate',
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

            {ultimoRegistro?.repasse_autorizado === false && (
              <p className="fundeb-indicator-note">
                <strong>Atenção:</strong> o último registro indica repasse não autorizado para este município.
              </p>
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
            statusLabel={selectedIndicatorModel.statusLabel}
            statusTone={selectedIndicatorModel.statusTone}
            total={indicatorModels.length}
          />
        </div>
      ) : (
      <FinancialSection
        className="financial-indicator-section fundeb-workspace financial-grid-workspace"
        eyebrow="Seção de indicadores"
        meta={`${indicatorModels.length} indicadores`}
        title="Indicadores do PNATE"
        titleId="pnate-indicators-title"
      >
            <div className="financial-indicator-filters financial-indicator-filters--single platform-exploration-toolbar platform-exploration-toolbar--single">
              <SearchField
                ariaLabel="Buscar indicador"
                className="platform-search-field"
                onChange={(event) => setSearchQuery(event.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder="Buscar indicador..."
                value={searchQuery}
              />
            </div>
            <div className="indicator-list financial-indicator-card-grid">
              {indicatorModels.length === 0 ? (
                <div className="financial-indicator-grid-empty">
                  <ContentState as="p" kind="noResults">Nenhum indicador encontrado.</ContentState>
                </div>
              ) : (
                indicatorModels.map((indicator) => (
                  <FinancialIndicatorCard
                    buttonRef={(node) => detailNavigation.registerCard(indicator.key, node)}
                    indicator={indicator}
                    isSelected={isDetailOpen && indicator.key === selectedKey}
                    key={indicator.key}
                    onSelect={() => handleIndicatorSelect(indicator.key)}
                  />
                ))
              )}
            </div>

          <div className="fundeb-detail fundeb-detail--legacy">
            <div className="fundeb-detail-header">
              <div>
                <span className="eyebrow">Indicador selecionado</span>
                <h3>{selectedIndicator.label}</h3>
                <p className="fundeb-indicator-description">{selectedIndicator.description}</p>
              </div>
              <span className="indicator-stage-badge">
                {selectedIndicator.tipo === 'numero' ? 'Contagem' : 'Financeiro'}
              </span>
            </div>

            {(validSeries.length >= 2 || series.length >= 1) && (
              <div className="fundeb-visual-grid">
                {validSeries.length >= 2 && (
                  <div className="fundeb-chart-card">
                    <IndicatorHistoryChart
                      chartHeight={224}
                      endYear={series[series.length - 1].ano}
                      formatDataLabel={(v) => formatCompactDataLabel(v, selectedIndicator.tipo)}
                      formatYAxis={selectedIndicator.tipo === 'numero' ? formatCompactNumber : formatCompactCurrency}
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
                  <ChartEmptyState message="Histórico não disponível." />
                )}

                {series.length >= 1 && (
                  <div className="fundeb-table-card">
                    <div className="fundeb-table-card__header">
                      <div>
                        <h4>Histórico do indicador</h4>
                      </div>
                    </div>
                    <div className="fundeb-table-wrap" role="region" aria-label="Série histórica do indicador do PNATE. Role horizontalmente para consultar todas as colunas quando necessário." tabIndex={0}>
                      <table className="fundeb-table">
                        <caption className="u-sr-only">Série histórica do indicador do PNATE</caption>
                        <thead>
                          <tr>
                            <th scope="col">Ano</th>
                            <th scope="col">Valor</th>
                            <th scope="col">Variação anual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historico
                            .filter((h) => h.ano != null)
                            .map((entry, index) => {
                              const prev = index > 0 ? historico[index - 1] : null
                              const currentVal = entry[selectedIndicator.key]
                              const prevVal = prev?.[selectedIndicator.key]
                              const vari = prev != null ? calcVariation(currentVal, prevVal) : null
                              return (
                                <tr key={entry.ano}>
                                  <td>{entry.ano}</td>
                                  <td>{formatPnateValue(currentVal, selectedIndicator.tipo)}</td>
                                  <td><span className={
                                    index === 0 || vari == null
                                      ? 'fundeb-variation-missing'
                                      : vari > 0
                                        ? 'fundeb-variation-positive'
                                        : vari < 0
                                          ? 'fundeb-variation-negative'
                                          : 'fundeb-variation-neutral'
                                  } aria-label={index === 0 || vari == null ? 'Variação indisponível' : undefined}>{index === 0 ? '—' : formatVariation(vari, selectedIndicator.tipo)}</span></td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                    <DataSourceNote
                      className="fundeb-data-source"
                      context={{
                        block: 'pnate',
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

            {ultimoRegistro?.repasse_autorizado === false && (
              <p className="fundeb-indicator-note">
                <strong>Atenção:</strong> o último registro indica repasse não autorizado para este município.
              </p>
            )}
          </div>
      </FinancialSection>
      )}
    </div>
  )
}
