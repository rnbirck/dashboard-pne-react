import { useMemo, useState } from 'react'
import { FUNDEB_INDICATORS, formatFundebValue, getLimiteReferencia } from '../data/fundebIndicators'
import { DataSourceNote } from './DataSourceNote'
import { IndicatorHistoryChart } from '../components/IndicatorHistoryChart'
import { EducationSummaryCard } from './EducationSummaryCard'

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

export function FundebPanel({ municipioData, selectedMunicipio, embedded = false }) {
  const rawFundebData = municipioData?.blocos?.fundeb
  const hasFundebData = Boolean(rawFundebData?.historico?.length)
  const fundebData = rawFundebData ?? {}
  const [selectedKey, setSelectedKey] = useState(FUNDEB_INDICATORS[0].key)
  const [searchQuery, setSearchQuery] = useState('')

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

      <section className="fundeb-info-box">
        <p>
          O FUNDEB reúne recursos destinados à manutenção e desenvolvimento da educação básica.
          Os indicadores abaixo mostram a evolução das receitas, despesas e aplicação mínima em
          remuneração dos profissionais da educação no município selecionado.
        </p>
        <p>
          A regra de remuneração mudou em 2021: até 2020 o mínimo era 60%; desde 2021 é 70%.
        </p>
      </section>

      <section className="page-card fundeb-workspace">
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
              <div className="indicator-list">
                {filteredItems.length === 0 ? (
                  <div className="indicator-sidebar__empty">
                    <p>Nenhum indicador encontrado.</p>
                  </div>
                ) : (
                  filteredItems.map((indicator) => (
                    <button
                      key={indicator.key}
                      type="button"
                      className={
                        indicator.key === selectedKey
                          ? 'indicator-row is-active'
                          : 'indicator-row'
                      }
                      onClick={() => setSelectedKey(indicator.key)}
                    >
                      <span className="indicator-row__label">{indicator.label}</span>
                      <span className="indicator-row__badges">
                        <span className={
                          indicator.tipo === 'percentual'
                            ? 'indicator-stage-badge indicator-stage-badge--pct'
                            : 'indicator-stage-badge'
                        }>
                          {indicator.tipo === 'percentual' ? 'Percentual' : 'Financeiro'}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </aside>

          <div className="fundeb-detail">
            {selectedIndicator?.description && (
              <p className="fundeb-indicator-description">{selectedIndicator.description}</p>
            )}

            {(selectedKey === 'despesa_remuneracao_profissionais_creche' || selectedKey === 'despesa_remuneracao_profissionais_pre_escola') && (
              <p className="fundeb-indicator-note">Série exibida a partir de 2021 para manter comparabilidade com a estrutura do Novo FUNDEB.</p>
            )}

            {validSeries.length >= 2 && (
              <>
                <div className="fundeb-chart-card">
                  <IndicatorHistoryChart
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
                  <DataSourceNote
                    context={{
                      block: 'fundeb',
                      indicatorKey: selectedIndicator?.key,
                      indicatorName: selectedIndicator?.label,
                    }}
                  />
                </div>
              </>
            )}

            {validSeries.length <= 1 && series.length >= 2 && (
              <div className="fundeb-empty">
                <p>Apenas um ano com dado disponível — não há pontos suficientes para exibir o gráfico. Consulte a tabela abaixo.</p>
              </div>
            )}

            {series.length >= 1 && (
              <>
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
                context={{
                  block: 'fundeb',
                  detailType: 'table',
                  indicatorKey: selectedIndicator?.key,
                  indicatorName: selectedIndicator?.label,
                }}
              />
              </>
            )}

            {series.length === 0 && (
              <div className="fundeb-empty">
                <p>Este indicador não possui série histórica disponível para este município.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
