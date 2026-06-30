import { useState } from 'react'
import { EducationLineChart } from './EducationLineChart'
import { MetricCard } from './MetricCard'
import { formatNumber, isMissing } from '../utils/educationFormatters'

const EM = '\u2014'

const EAD_KEYWORDS = ['EAD', 'ADMINISTRACAO REGIONAL', 'ADMINISTRAÇÃO REGIONAL', ' REGIONAL ']

const PRESERVE_ACRONYMS = new Set(['SENAI', 'SENAC', 'SESC', 'SESI', 'SENAR', 'SEST', 'SENAT', 'EAD', 'RS', 'CNPJ', 'IES'])

const LOWER_WORDS = new Set(['do', 'da', 'de', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'a', 'o', 'ao', 'aos'])

const INDICATOR_CONFIG = [
  { key: 'total_escolas', label: 'Escolas do Sistema S', shortLabel: 'Escolas', description: 'Total de escolas mantidas pelo Sistema S no município.', color: '#0f766e' },
  { key: 'matriculas', label: 'Matrículas nas escolas do Sistema S', shortLabel: 'Matrículas', description: 'Total de matrículas nas escolas do Sistema S.', color: '#16713a' },
  { key: 'turmas', label: 'Turmas nas escolas do Sistema S', shortLabel: 'Turmas', description: 'Total de turmas nas escolas do Sistema S.', color: '#2563eb' },
  { key: 'docentes', label: 'Docentes nas escolas do Sistema S', shortLabel: 'Docentes', description: 'Total de docentes nas escolas do Sistema S.', color: '#7c3aed' },
]

function formatSchoolName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      const upper = word.toUpperCase()
      if (PRESERVE_ACRONYMS.has(upper)) return upper
      if (LOWER_WORDS.has(word) && i > 0) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

function detectEadRegional(nome) {
  const upper = (nome ?? '').toUpperCase()
  if (upper.includes('EAD')) return 'EAD'
  if (EAD_KEYWORDS.some((kw) => kw !== 'EAD' && upper.includes(kw.toUpperCase()))) return 'Regional'
  return null
}

function calcDiferenca(initialValue, currentValue) {
  if (isMissing(initialValue) || isMissing(currentValue)) return { display: EM, pctDisplay: null, tone: 'muted' }
  const diff = Number(currentValue) - Number(initialValue)
  let display, tone
  if (diff > 0) { display = `+${formatNumber(diff)}`; tone = 'success' }
  else if (diff < 0) { display = formatNumber(diff); tone = 'warning' }
  else { display = '0'; tone = 'muted' }
  let pctDisplay = null
  const init = Number(initialValue)
  if (init !== 0 && Number.isFinite(init)) {
    const pct = (diff / Math.abs(init)) * 100
    const sign = pct > 0 ? '+' : ''
    pctDisplay = `${sign}${pct.toFixed(1)}%`
  }
  return { display, pctDisplay, tone }
}

function maiorEtapa(distribuicao) {
  if (!distribuicao.length) return null
  return distribuicao.reduce((a, b) => ((a.matriculas ?? 0) > (b.matriculas ?? 0) ? a : b))
}

function quickReading(activeKey, currentDisplay, currentYear, hasDistribuicao) {
  if (isMissing(currentYear) || isMissing(currentDisplay)) return null
  if (activeKey === 'total_escolas') {
    return `Em ${currentYear}, o município possui ${currentDisplay} escolas do Sistema S com atendimento registrado no município.`
  }
  if (activeKey === 'matriculas') {
    if (hasDistribuicao) {
      const maior = maiorEtapa(hasDistribuicao)
      return maior
        ? `Em ${currentYear}, o município registra ${currentDisplay} matrículas em escolas do Sistema S, com maior concentração em ${maior.etapa}.`
        : `Em ${currentYear}, o município registra ${currentDisplay} matrículas em escolas do Sistema S.`
    }
    return `Em ${currentYear}, o município registra ${currentDisplay} matrículas em escolas do Sistema S.`
  }
  if (activeKey === 'turmas') {
    return `Em ${currentYear}, o município registra ${currentDisplay} turmas em escolas do Sistema S.`
  }
  if (activeKey === 'docentes') {
    return `Em ${currentYear}, o município registra ${currentDisplay} docentes vinculados às escolas do Sistema S.`
  }
  return null
}

function temEadOuRegional(escolas) {
  if (!escolas.length) return false
  return escolas.some((e) => detectEadRegional(e.nome_escola))
}

const ETAPA_PALETTE = ['#16713a', '#2d7d4a', '#5a9a6f', '#88b79a', '#b5d4c2']

export function SistemaSPanel({ blocos }) {
  const data = blocos?.sistema_s ?? {}
  const series = data.series ?? {}
  const resumo = data.resumo_ultimo_ano ?? {}
  const ultimo_ano = data.ultimo_ano
  const distribuicao = data.distribuicao_etapa ?? []
  const escolas = data.escolas ?? []
  const avisos = data.avisos ?? []
  const hasData = series.total_escolas?.length > 0
  const [activeKey, setActiveKey] = useState('total_escolas')

  if (!hasData) return null

  const activeConfig = INDICATOR_CONFIG.find((c) => c.key === activeKey) ?? INDICATOR_CONFIG[0]
  const activeSeries = series[activeKey] ?? []
  const firstPoint = activeSeries[0] ?? null
  const lastPoint = activeSeries.at(-1) ?? null
  const initialValue = firstPoint?.valor ?? null
  const currentValue = lastPoint?.valor ?? null
  const initialYear = firstPoint?.ano ?? null
  const currentYear = lastPoint?.ano ?? null
  const currentDisplay = !isMissing(currentValue) ? formatNumber(currentValue) : EM
  const diferenca = calcDiferenca(initialValue, currentValue)
  const hasSeries = activeSeries.length >= 2
  const reading = quickReading(activeKey, currentDisplay, currentYear, activeKey === 'matriculas' ? distribuicao : null)
  const mostraNotaEad = temEadOuRegional(escolas)

  const sidebarValues = {
    total_escolas: resumo.total_escolas,
    matriculas: resumo.total_matriculas,
    turmas: resumo.total_turmas,
    docentes: resumo.total_docentes,
  }

  const totalMatEtapa = distribuicao.reduce((sum, item) => sum + (item.matriculas ?? 0), 0)
  const sortedDist = [...distribuicao]
    .sort((a, b) => (b.matriculas ?? 0) - (a.matriculas ?? 0))
    .map((item, i) => ({
      ...item,
      pct: totalMatEtapa > 0 ? ((item.matriculas ?? 0) / totalMatEtapa * 100) : 0,
      color: i === 0 ? '#16713a' : ETAPA_PALETTE[i % ETAPA_PALETTE.length],
      isPrimary: i === 0,
    }))

  const detalheDiferenca = !isMissing(initialValue) && diferenca.pctDisplay
    ? `${diferenca.pctDisplay} desde ${initialYear}`
    : initialYear ? `Desde ${initialYear}` : null

  const anoResumo = ultimo_ano ?? 2025

  return (
    <div className="sistema-s-panel">
      <div className="sistema-s-summary">
        <span className="sistema-s-summary__eyebrow">Visão geral do Sistema S em {anoResumo}</span>
        <div className="sistema-s-summary-grid">
          <div className="sistema-s-summary-card">
            <span className="sistema-s-summary-card__title">Escolas</span>
            <span className="sistema-s-summary-card__value">{!isMissing(resumo.total_escolas) ? formatNumber(resumo.total_escolas) : EM}</span>
            <span className="sistema-s-summary-card__label">Escolas</span>
          </div>
          <div className="sistema-s-summary-card">
            <span className="sistema-s-summary-card__title">Matrículas</span>
            <span className="sistema-s-summary-card__value">{!isMissing(resumo.total_matriculas) ? formatNumber(resumo.total_matriculas) : EM}</span>
            <span className="sistema-s-summary-card__label">Matrículas</span>
          </div>
          <div className="sistema-s-summary-card">
            <span className="sistema-s-summary-card__title">Turmas</span>
            <span className="sistema-s-summary-card__value">{!isMissing(resumo.total_turmas) ? formatNumber(resumo.total_turmas) : EM}</span>
            <span className="sistema-s-summary-card__label">Turmas</span>
          </div>
          <div className="sistema-s-summary-card">
            <span className="sistema-s-summary-card__title">Docentes</span>
            <span className="sistema-s-summary-card__value">{!isMissing(resumo.total_docentes) ? formatNumber(resumo.total_docentes) : EM}</span>
            <span className="sistema-s-summary-card__label">Docentes</span>
          </div>
        </div>
      </div>

      <div className="cycle-layout educacao-analysis-layout">
        <aside className="indicator-sidebar">
          <div className="indicator-sidebar__heading">
            <h3>Indicadores</h3>
            <span>{INDICATOR_CONFIG.length}</span>
          </div>
          <div className="indicator-list">
            {INDICATOR_CONFIG.map((ind) => {
              const sv = sidebarValues[ind.key]
              const svDisplay = !isMissing(sv) ? formatNumber(sv) : EM
              return (
                <button
                  key={ind.key}
                  type="button"
                  className={'indicator-row' + (activeKey === ind.key ? ' is-active' : '')}
                  onClick={() => setActiveKey(ind.key)}
                >
                  <span className="indicator-row__label">{ind.shortLabel}</span>
                  <span className="indicator-row__badges">
                    <span className="indicator-stage-badge">{svDisplay}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="detail-panel educacao-detail-panel">
          <div className="detail-heading">
            <div className="detail-heading__copy">
              <span className="eyebrow">Indicador selecionado</span>
              <h3>{activeConfig.label}</h3>
              <p>{activeConfig.description}</p>
            </div>
          </div>

          <div className="metric-grid metric-grid--three">
            <MetricCard label="Valor inicial" value={!isMissing(initialValue) ? formatNumber(initialValue) : EM} detail={initialYear ? `Ano ${initialYear}` : null} />
            <MetricCard label="Valor atual" value={currentDisplay} detail={currentYear ? `Ano ${currentYear}` : null} size="large" />
            <MetricCard label="Diferença" value={diferenca.display} detail={detalheDiferenca} tone={diferenca.tone} />
          </div>

          {reading && (
            <div className="interpretation-box">
              <span>Leitura rápida</span>
              <p>{reading}</p>
            </div>
          )}

          <div className="indicator-chart-card sistema-s-chart">
            <div className="education-chart-heading">
              <div>
                <span>Evolução do indicador</span>
                <p>{activeConfig.label}</p>
              </div>
            </div>
            {hasSeries ? (
              <EducationLineChart
                color={activeConfig.color}
                formatLabel={formatNumber}
                scaleType="count"
                series={activeSeries}
                showPointLabels
                title={null}
              />
            ) : (
              <div className="detail-empty-state">
                <p>Não há série histórica suficiente para calcular evolução.</p>
              </div>
            )}
          </div>

          <div className="sistema-s-detail-stack">
            {sortedDist.length > 0 && (
              <div className="educacao-explore sistema-s-detail-card sistema-s-detail-card--etapas">
                <div className="educacao-explore__heading">
                  <span className="sistema-s-detail-title">Distribuição por etapa</span>
                  <p>Matrículas do Sistema S por etapa de ensino no último ano disponível.</p>
                </div>
                <div className="sistema-s-etapas">
                  {sortedDist.map((item) => (
                    <div key={item.etapa} className={'sistema-s-etapa-row' + (item.isPrimary ? ' is-primary' : '')}>
                      <span className="sistema-s-etapa-row__label">{item.etapa}</span>
                      <div className="sistema-s-etapa-row__bar-track">
                        <span
                          className="sistema-s-etapa-row__bar-fill"
                          style={{ width: `${item.pct}%`, background: item.color }}
                        />
                      </div>
                      <span className="sistema-s-etapa-row__value">{formatNumber(item.matriculas)}</span>
                      <span className="sistema-s-etapa-row__pct">{item.pct.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {escolas.length > 0 && (
              <div className="educacao-explore sistema-s-detail-card sistema-s-detail-card--escolas">
                <div className="educacao-explore__heading">
                  <span className="sistema-s-detail-title">Escolas do Sistema S</span>
                  <p>Lista de escolas do Sistema S no último ano disponível.</p>
                </div>
                <div className="sistema-s-table-wrap">
                  <table className="sistema-s-table">
                    <thead>
                      <tr>
                        <th>Escola</th>
                        <th>Matrículas</th>
                        <th>Turmas</th>
                        <th>Docentes</th>
                        <th>Etapas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {escolas.map((escola) => {
                        const chip = detectEadRegional(escola.nome_escola)
                        return (
                          <tr key={escola.cod_escola}>
                            <td title={escola.nome_escola}>
                              {formatSchoolName(escola.nome_escola)}
                              {chip && <span className="sistema-s-chip">{chip}</span>}
                            </td>
                            <td className="sistema-s-table__num">{!isMissing(escola.matriculas) ? formatNumber(escola.matriculas) : EM}</td>
                            <td className="sistema-s-table__num">{!isMissing(escola.turmas) ? formatNumber(escola.turmas) : EM}</td>
                            <td className="sistema-s-table__num">{!isMissing(escola.docentes) ? formatNumber(escola.docentes) : EM}</td>
                            <td>{escola.etapas?.join(', ') || EM}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {mostraNotaEad && (
                  <p className="sistema-ead-note">
                    Observação: parte das matrículas pode estar vinculada a unidades EAD ou sedes regionais declaradas no município.
                  </p>
                )}
              </div>
            )}
          </div>

          {avisos.length > 0 && (
            <div className="educacao-explore">
              {avisos.map((aviso, i) => (
                <p key={i} className="educacao-explore__note">{aviso}</p>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
