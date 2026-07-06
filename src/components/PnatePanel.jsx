import { useMemo, useState } from 'react'
import { PNATE_INDICATORS, formatPnateValue } from '../data/pnateIndicators'
import { DataSourceNote } from './DataSourceNote'
import { IndicatorHistoryChart } from '../components/IndicatorHistoryChart'
import { EducationSummaryCard } from './EducationSummaryCard'

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

function PnateInfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 16V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V16" />
      <path d="M4 16h16v2H4z" />
      <path d="M8 18v1.5m8-1.5v1.5M8 10h8M8 13h3m2 0h3" />
    </svg>
  )
}

export function PnatePanel({ pnateData, selectedMunicipio }) {
  const hasPnateData = Boolean(pnateData?.historico?.length)
  const [selectedKey, setSelectedKey] = useState(PNATE_INDICATORS[0].key)
  const [searchQuery, setSearchQuery] = useState('')

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
      <section className="page-card fundeb-info-box" aria-labelledby="pnate-info-title">
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

      <section className="page-card education-summary-section fundeb-summary">
        <div className="education-summary-header fundeb-summary__heading">
          <h2 className="education-summary-title">Visão geral</h2>
          <small className="education-summary-note">
            Município em foco: {selectedMunicipio}. Dados do ano de referência: {ultimo_ano}.
          </small>
        </div>
        <div className="education-summary-grid fundeb-summary-grid">
          <EducationSummaryCard label="Repasse total" value={formatPnateValue(resumo_ultimo_ano?.repasse_total, 'financeiro')} year={ultimo_ano} valueSize="compact" />
          <EducationSummaryCard label="Repasse autorizado após desconto" value={formatPnateValue(resumo_ultimo_ano?.repasse_autorizado_apos_desconto, 'financeiro')} year={ultimo_ano} valueSize="compact" />
          <EducationSummaryCard label="Estudantes atendidos" value={formatPnateValue(resumo_ultimo_ano?.total_alunos, 'numero')} year={ultimo_ano} />
          <EducationSummaryCard label="Valor per capita" value={formatPnateValue(resumo_ultimo_ano?.resultado_per_capita, 'financeiro')} year={ultimo_ano} />
          <EducationSummaryCard label="Redes consideradas" value={`${formatPnateValue(resumo_ultimo_ano?.total_alunos_rede_municipal, 'numero')} mun. / ${formatPnateValue(resumo_ultimo_ano?.total_alunos_rede_estadual, 'numero')} est.`} year={ultimo_ano} valueSize="compact" />
        </div>
      </section>

      {avisos.length > 0 && (
        <p className="fundeb-indicator-note">
          <strong>Nota metodológica:</strong> {avisos[0]}
        </p>
      )}

      <section className="page-card fundeb-workspace">
        <div className="fundeb-workspace-layout educacao-analysis-layout">
          <aside className="indicator-sidebar">
            <div className="indicator-sidebar__heading">
              <h3>Indicadores</h3>
              <span>{PNATE_INDICATORS.length}</span>
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
              {filteredItems.map((indicator) => (
                <button
                  key={indicator.key}
                  type="button"
                  className={indicator.key === selectedKey ? 'indicator-row is-active' : 'indicator-row'}
                  onClick={() => setSelectedKey(indicator.key)}
                >
                  <span className="indicator-row__label">{indicator.label}</span>
                  <span className="indicator-row__description">{indicator.description}</span>
                  <span className="indicator-row__badges">
                    <span className="indicator-stage-badge">
                      {indicator.tipo === 'numero' ? 'Contagem' : 'Financeiro'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <div className="fundeb-detail">
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
                      chartHeight={340}
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
                  <div className="fundeb-empty fundeb-empty--chart">
                    <p>Apenas um ano com dado disponível. Consulte a tabela ao lado.</p>
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
                                      ? 'fundeb-variation-neutral'
                                      : vari > 0
                                        ? 'fundeb-variation-positive'
                                        : vari < 0
                                          ? 'fundeb-variation-negative'
                                          : 'fundeb-variation-neutral'
                                  }>{index === 0 ? '—' : formatVariation(vari, selectedIndicator.tipo)}</span></td>
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
        </div>
      </section>
    </div>
  )
}
