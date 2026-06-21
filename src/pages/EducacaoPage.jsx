import { useMemo, useState } from 'react'
import { CategoryTabs } from '../components/CategoryTabs'
import { EducationBarChart } from '../components/EducationBarChart'
import { EducationLineChart } from '../components/EducationLineChart'
import { EducationStackedBarChart } from '../components/EducationStackedBarChart'
import { EducationSummaryCard } from '../components/EducationSummaryCard'
import { EducationTable } from '../components/EducationTable'
import { MetricCard } from '../components/MetricCard'
import { StatusBadge } from '../components/StatusBadge'
import { loadEducationMunicipio, loadEducationMunicipiosIndex } from '../data/educationData'
import { useAsyncData } from '../utils/useAsyncData'
import {
  depLabel,
  etapaLabel,
  formatNumber,
  formatPercent,
  formatRatio,
  formatValue,
  formatYear,
  isMissing,
  locLabel,
  modLabel,
  normalizeYearSeries,
} from '../utils/educationFormatters'

const EM = '\u2014'

const FILTER_KEYS = {
  todos: 'todos',
  infantil: 'educacao_infantil',
  fundamental: 'ensino_fundamental',
  medio: 'ensino_medio',
  eja: 'eja',
  profissional: 'educacao_profissional',
}

const CATEGORY_LABELS = {
  [FILTER_KEYS.todos]: 'Geral',
  [FILTER_KEYS.infantil]: 'Educação Infantil',
  [FILTER_KEYS.fundamental]: 'Ensino Fundamental',
  [FILTER_KEYS.medio]: 'Ensino Médio',
  [FILTER_KEYS.eja]: 'EJA',
  [FILTER_KEYS.profissional]: 'Educação Profissional',
}

const DEPENDENCY_COLORS = {
  federal: '#2563eb',
  estadual: '#16a34a',
  municipal: '#f59e0b',
  privada: '#7c3aed',
  publica: '#16713a',
}

const LOCATION_COLORS = {
  urbana: '#16713a',
  rural: '#2563eb',
}

export function EducacaoPage({ selectedMunicipio }) {
  const eduIndexState = useAsyncData(() => loadEducationMunicipiosIndex(), [])
  const eduMunMap = useMemo(() => {
    const list = eduIndexState.data?.municipios ?? []
    return new Map(list.map((m) => [m.municipio, m.id_municipio]))
  }, [eduIndexState.data])
  const selectedId = eduMunMap.get(selectedMunicipio) ?? null
  const munDataState = useAsyncData(async () => {
    if (!selectedId) return null
    return loadEducationMunicipio(selectedId)
  }, [selectedId])

  const [selectedThemeKey, setSelectedThemeKey] = useState('matriculas')
  const [selectedIndicatorKey, setSelectedIndicatorKey] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  if (!selectedMunicipio) {
    return (
      <div className="page-stack educacao-page">
        <section className="page-card educacao-hero">
          <div>
            <span className="eyebrow">Indicadores da Educação</span>
            <h1>Indicadores da Educação</h1>
            <p>Matrículas, rede escolar, docentes, fluxo, aprendizagem e oferta técnica do município.</p>
          </div>
        </section>
        <section className="empty-state">
          <div className="empty-state__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5" />
            </svg>
          </div>
          <h2>Selecione um município</h2>
          <p>Os indicadores educacionais são carregados após a seleção do município. Use o seletor no topo da página.</p>
        </section>
      </div>
    )
  }

  if (eduIndexState.loading || munDataState.loading) {
    return <div className="page-stack"><p className="state-box state-box--loading">Carregando dados...</p></div>
  }

  if (munDataState.error) {
    return <div className="page-stack"><div className="state-box state-box--error"><strong>Erro ao carregar dados</strong><span>{munDataState.error}</span></div></div>
  }

  const dados = munDataState.data
  if (!dados) return null

  const model = buildEducationModel(dados.blocos ?? {})
  const themes = model.themes
  const selectedTheme = themes.find((theme) => theme.key === selectedThemeKey) ?? themes[0]
  const themeItems = selectedTheme?.items ?? []
  const filteredItems = themeItems.filter((item) => {
    const query = searchQuery.trim().toLocaleLowerCase('pt-BR')
    const queryMatches = !query || `${item.label} ${item.description} ${item.themeLabel}`.toLocaleLowerCase('pt-BR').includes(query)
    return queryMatches
  })
  const activeIndicator = filteredItems.length
    ? (filteredItems.find((item) => item.key === selectedIndicatorKey) ?? filteredItems[0])
    : null

  function handleThemeSelect(themeKey) {
    setSelectedThemeKey(themeKey)
    setSelectedIndicatorKey('')
    setSearchQuery('')
  }

  return (
    <div className="page-stack educacao-page">
      <section className="page-card educacao-hero">
        <div>
          <span className="eyebrow">Indicadores da Educação</span>
          <h1>Indicadores da Educação</h1>
          <p>Matrículas, rede escolar, docentes, fluxo, aprendizagem e oferta técnica do município.</p>
          <p>Município em foco: <strong>{selectedMunicipio}</strong></p>
        </div>
      </section>

      <EducationOverviewCards overview={model.overview} />

      <section className="cycle-workspace educacao-workspace">
        <div className="cycle-category-bar">
          <span className="eyebrow">Temas de análise</span>
          <div className="cycle-category-bar__controls">
            <CategoryTabs
              ariaLabel="Temas da educação"
              categories={themes}
              selectedCategory={selectedTheme?.key}
              onSelectCategory={handleThemeSelect}
            />
          </div>
        </div>

        <div className="cycle-layout educacao-analysis-layout">
          <aside className="indicator-sidebar">
            <div className="indicator-sidebar__heading">
              <h3>Indicadores</h3>
              <span>{filteredItems.length}</span>
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
            <EducationIndicatorList
              items={filteredItems}
              selectedIndicator={activeIndicator?.key}
              onSelectIndicator={setSelectedIndicatorKey}
            />
          </aside>

          <EducationIndicatorDetail indicator={activeIndicator} />
        </div>
      </section>
    </div>
  )
}

function EducationOverviewCards({ overview }) {
  return (
    <section className="page-card educacao-overview">
      <div className="educacao-overview__heading">
        <h2>Visão geral</h2>
        <p>Últimos dados disponíveis por bloco, com o ano de referência em cada indicador.</p>
      </div>
      <div className="educacao-overview-grid">
        {overview.map((card) => (
          <EducationSummaryCard key={card.label} label={card.label} value={card.value} year={card.year} tone={card.tone} />
        ))}
      </div>
    </section>
  )
}

function EducationIndicatorList({ items, selectedIndicator, onSelectIndicator }) {
  if (!items.length) {
    return (
      <div className="indicator-sidebar__empty educacao-sidebar-empty">
        <p>Nenhum indicador disponível para este filtro.</p>
      </div>
    )
  }

  return (
    <div className="indicator-list">
      {items.map((item) => (
        <button
          className={item.key === selectedIndicator ? 'indicator-row is-active' : 'indicator-row'}
          key={item.key}
          type="button"
          onClick={() => onSelectIndicator(item.key)}
          title={item.label}
        >
          <span className="indicator-row__label">{item.label}</span>
          <span className="indicator-row__badges">
            <StatusBadge className="indicator-status" displayStatus={item.statusLabel} status={item.statusLabel} tone={item.statusTone} />
            <span className="indicator-stage-badge">{item.categoryLabel}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function EducationIndicatorDetail({ indicator }) {
  if (!indicator) {
    return (
      <section className="detail-panel empty-panel">
        <p>Selecione um indicador para ver os detalhes.</p>
      </section>
    )
  }

  const hasMainSeries = indicator.series.length >= 2

  return (
    <section className="detail-panel educacao-detail-panel">
      <div className="detail-heading">
        <div className="detail-heading__copy">
          <span className="eyebrow">Indicador selecionado</span>
          <h3>{indicator.label}</h3>
          <p>{indicator.description}</p>
        </div>
        <StatusBadge status={indicator.statusLabel} tone={indicator.statusTone} />
      </div>

      <div className="metric-grid metric-grid--four">
        <MetricCard label="Valor inicial" value={indicator.initialDisplay} detail={indicator.initialYear ? `Ano ${indicator.initialYear}` : null} />
        <MetricCard label="Valor atual" value={indicator.currentDisplay} detail={indicator.currentYear ? `Ano ${indicator.currentYear}` : null} size="large" />
        <MetricCard label="Variação" value={indicator.variationDisplay} tone={indicator.variationTone} />
        <MetricCard label="Recorte principal" value={indicator.mainCutLabel} detail={indicator.currentYear ? `Último ano: ${indicator.currentYear}` : 'Sem ano disponível'} />
      </div>

      <div className="interpretation-box">
        <span>Leitura rápida</span>
        <p>{indicator.quickReading}</p>
      </div>

      <div className="indicator-chart-card educacao-main-chart-card">
        <div className="education-chart-heading">
          <span>Evolução do indicador</span>
          <p>{indicator.label} · {indicator.mainCutLabel}</p>
        </div>
        {hasMainSeries ? (
          <EducationLineChart
            color={indicator.chartColor}
            formatLabel={indicator.formatValue}
            scaleType={indicator.scaleType}
            series={indicator.series}
            showPointLabels={indicator.showPointLabels}
            title={indicator.label}
          />
        ) : (
          <div className="detail-empty-state">
            <p>Não há série histórica suficiente para calcular evolução.</p>
          </div>
        )}
      </div>

      <EducationIndicatorBreakdown indicator={indicator} />
    </section>
  )
}

function EducationIndicatorBreakdown({ indicator }) {
  const detailItems = indicator.explore ?? []
  const [selectedDetailKey, setSelectedDetailKey] = useState('')
  const activeItem = detailItems.find((item) => item.key === selectedDetailKey) ?? detailItems[0] ?? null
  const hasTabs = detailItems.length > 1

  return (
    <section className="educacao-explore">
      <div className="educacao-explore__heading">
        <span>Detalhamento do indicador</span>
        <p>Veja como o indicador se distribui por etapa, rede ou localização, quando esses recortes estiverem disponíveis.</p>
      </div>

      {hasTabs ? (
        <div className="educacao-detail-tabs" role="tablist" aria-label="Detalhamentos do indicador">
          {detailItems.map((item) => (
            <button
              className={`educacao-detail-tab${activeItem?.key === item.key ? ' is-active' : ''}`}
              key={item.key}
              type="button"
              onClick={() => setSelectedDetailKey(item.key)}
            >
              {getDetailTabLabel(item)}
            </button>
          ))}
        </div>
      ) : null}

      {activeItem ? (
        <div className="educacao-explore__panel">
          <ExploreItem item={activeItem} />
        </div>
      ) : (
        <div className="detail-empty-state">
          <p>Não há detalhamento adicional disponível para este indicador.</p>
        </div>
      )}

      {indicator.notices.length ? (
        <div className="education-notice">
          {indicator.notices.map((notice, index) => <p key={index}>{notice}</p>)}
        </div>
      ) : null}
    </section>
  )
}

function getDetailTabLabel(item) {
  const title = String(item.title ?? '').toLocaleLowerCase('pt-BR')
  if (title.includes('etapa')) return 'Por etapa'
  if (title.includes('rede') || title.includes('depend')) return 'Por rede'
  if (title.includes('localiza')) return 'Por localização'
  if (title.includes('modalidade')) return 'Por modalidade'
  if (title.includes('infraestrutura')) return 'Infraestrutura'
  if (title.includes('evolu')) return 'Evolução'
  if (item.type === 'table') return 'Tabela'
  return item.title ?? 'Detalhamento'
}

function ExploreItem({ item }) {
  if (item.type === 'stacked') {
    return (
      <EducationStackedBarChart
        categories={item.categories}
        data={item.data}
        formatLabel={item.formatLabel}
        title={item.title}
      />
    )
  }

  if (item.type === 'bar') {
    return <EducationBarChart color={item.color} data={item.data} formatLabel={item.formatLabel} title={item.title} />
  }
  if (item.type === 'line') {
    return item.series.length >= 2
      ? <EducationLineChart color={item.color} formatLabel={item.formatLabel} scaleType={item.scaleType} series={item.series} title={item.title} />
      : <div className="education-chart-empty"><p>Não há dados suficientes para exibir o gráfico.</p></div>
  }
  if (item.type === 'table') {
    return (
      <div className="educacao-explore-table">
        <h4>{item.title}</h4>
        <EducationTable columns={item.columns} rows={item.rows} />
      </div>
    )
  }
  return null
}

function buildEducationModel(blocos) {
  const mat = blocos.matriculas ?? {}
  const rede = blocos.rede_escolar ?? {}
  const turmas = blocos.turmas_docentes ?? {}
  const fluxo = blocos.fluxo ?? {}
  const aprend = blocos.aprendizagem ?? {}
  const oferta = blocos.oferta_tecnica ?? {}
  const matResumo = mat.resumo_ultimo_ano ?? {}
  const redeResumo = rede.resumo_ultimo_ano ?? {}
  const turmasResumo = turmas.resumo_ultimo_ano ?? {}
  const fluxoResumo = fluxo.resumo_ultimo_ano ?? {}
  const aprendResumo = aprend.resumo_ultimo_ano ?? {}
  const ofertaResumo = oferta.resumo_ultimo_ano ?? {}
  const preferredIdeb = getPreferredIdeb(aprendResumo)

  const items = [
    ...buildMatriculasIndicators(mat),
    ...buildRedeIndicators(rede),
    ...buildTurmasIndicators(turmas),
    ...buildFluxoIndicators(fluxo),
    ...buildAprendizagemIndicators(aprend),
    ...buildOfertaIndicators(oferta),
  ]

  const themes = [
    makeTheme('matriculas', 'Matrículas e atendimento', 'Matrículas', items),
    makeTheme('rede', 'Rede escolar', 'Rede', items),
    makeTheme('turmas', 'Turmas e docentes', 'Turmas', items),
    makeTheme('fluxo', 'Fluxo escolar', 'Fluxo', items),
    makeTheme('aprendizagem', 'Aprendizagem', 'Aprendizagem', items),
    makeTheme('oferta', 'Oferta técnica/profissional', 'Oferta técnica', items),
  ]

  return {
    overview: [
      { label: 'Matrículas', value: formatNumber(matResumo.total_matriculas), year: mat.ultimo_ano },
      { label: 'Escolas', value: formatNumber(redeResumo.total_escolas), year: rede.ultimo_ano },
      { label: 'Turmas', value: formatNumber(turmasResumo.turmas), year: turmas.ultimo_ano },
      { label: 'Alunos por turma', value: formatRatio(turmasResumo.alunos_por_turma), year: turmas.ultimo_ano },
      { label: 'Aprovação', value: formatPercent(fluxoResumo.taxa_aprovacao), year: fluxo.ultimo_ano, tone: 'success' },
      { label: 'IDEB', value: preferredIdeb ? formatValue(preferredIdeb.ideb) : EM, year: preferredIdeb?.ano },
      { label: 'Oferta técnica', value: formatNumber(ofertaResumo.total_matriculas_tecnicas), year: oferta.ultimo_ano },
    ],
    themes,
  }
}

function makeTheme(key, label, shortLabel, items) {
  const themeItems = items.filter((item) => item.themeKey === key)
  return { key, label, shortLabel, items: themeItems }
}

function buildMatriculasIndicators(mat) {
  const series = mat.series ?? {}
  const resumo = mat.resumo_ultimo_ano ?? {}
  const byEtapa = resumo.por_etapa ?? {}
  const latestYear = mat.ultimo_ano
  const explore = buildMatriculasExplore(mat)

  return [
    createIndicator({ key: 'mat-total', label: 'Total de matrículas', description: 'Total de matrículas registradas na educação básica do município.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.todos], isGeral: true, series: normalizeYearSeries(series.total), currentValue: resumo.total_matriculas, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Total do município', explore }),
    createIndicator({ key: 'mat-infantil', label: 'Matrículas na educação infantil', description: 'Matrículas registradas na educação infantil.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.infantil], stageLabel: 'Educação Infantil', series: normalizeYearSeries(series.por_etapa?.infantil), currentValue: byEtapa.infantil, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Educação Infantil', explore }),
    createIndicator({ key: 'mat-fundamental', label: 'Matrículas no ensino fundamental', description: 'Matrículas registradas no ensino fundamental.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.fundamental], stageLabel: 'Ensino Fundamental', series: normalizeYearSeries(series.por_etapa?.fundamental), currentValue: byEtapa.fundamental, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Ensino Fundamental', explore }),
    createIndicator({ key: 'mat-medio', label: 'Matrículas no ensino médio', description: 'Matrículas registradas no ensino médio.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.medio], stageLabel: 'Ensino Médio', series: normalizeYearSeries(series.por_etapa?.medio), currentValue: byEtapa.medio, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Ensino Médio', explore }),
    createIndicator({ key: 'mat-eja', label: 'Matrículas na EJA', description: 'Matrículas registradas na educação de jovens e adultos.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.eja], stageLabel: 'EJA', series: normalizeYearSeries(series.por_etapa?.eja), currentValue: byEtapa.eja, currentYear: latestYear, formatType: 'number', mainCutLabel: 'EJA', explore }),
    createIndicator({ key: 'mat-profissional', label: 'Matrículas na educação profissional', description: 'Matrículas registradas na educação profissional/técnica.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.profissional], stageLabel: 'Educação Profissional', series: normalizeYearSeries(series.por_etapa?.profissional), currentValue: byEtapa.profissional, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Educação Profissional', explore }),
    createIndicator({ key: 'mat-integral', label: 'Matrículas em tempo integral', description: 'Percentual total de matrículas em tempo integral no município.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.todos], isGeral: true, series: valueSeries(series.integral, 'percentual'), currentValue: resumo.percentual_integral, currentYear: latestYear, formatType: 'percent', mainCutLabel: 'Tempo integral no total do município', explore }),
    createIndicator({ key: 'mat-rural', label: 'Matrículas em zona rural', description: 'Matrículas vinculadas à localização rural.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.todos], isGeral: true, series: normalizeYearSeries(series.por_localizacao?.rural), currentValue: resumo.matriculas_rural, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Zona rural', explore }),
    createIndicator({ key: 'mat-publica', label: 'Matrículas na rede pública', description: 'Matrículas na rede pública municipal, estadual e federal.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.todos], isGeral: true, series: normalizeYearSeries(series.por_dependencia?.publica), currentValue: resumo.matriculas_publica, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Rede pública', explore }),
    createIndicator({ key: 'mat-privada', label: 'Matrículas na rede privada', description: 'Matrículas na rede privada.', themeKey: 'matriculas', themeLabel: 'Matrículas e atendimento', themeShortLabel: 'Matrículas', categories: [FILTER_KEYS.todos], isGeral: true, series: normalizeYearSeries(series.por_dependencia?.privada), currentValue: resumo.matriculas_privada, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Rede privada', explore }),
  ]
}

function buildRedeIndicators(rede) {
  const series = rede.series ?? {}
  const resumo = rede.resumo_ultimo_ano ?? {}
  const latestYear = rede.ultimo_ano
  const explore = buildRedeExplore(rede)
  const base = { themeKey: 'rede', themeLabel: 'Rede escolar', themeShortLabel: 'Rede', categories: [FILTER_KEYS.todos], isGeral: true, currentYear: latestYear, explore }
  return [
    createIndicator({ ...base, key: 'rede-total', label: 'Total de escolas', description: 'Total de escolas registradas no município.', series: normalizeYearSeries(series.total), currentValue: resumo.total_escolas, formatType: 'number', mainCutLabel: 'Total do município' }),
    createIndicator({ ...base, key: 'rede-urbana', label: 'Escolas urbanas', description: 'Escolas localizadas em área urbana.', series: normalizeYearSeries(series.por_localizacao?.urbana), currentValue: resumo.escolas_urbana, formatType: 'number', mainCutLabel: 'Urbana' }),
    createIndicator({ ...base, key: 'rede-rural', label: 'Escolas rurais', description: 'Escolas localizadas em área rural.', series: normalizeYearSeries(series.por_localizacao?.rural), currentValue: resumo.escolas_rural, formatType: 'number', mainCutLabel: 'Rural' }),
    createIndicator({ ...base, key: 'rede-publica', label: 'Escolas públicas', description: 'Escolas da rede pública.', series: normalizeYearSeries(series.por_dependencia?.publica), currentValue: resumo.escolas_publica, formatType: 'number', mainCutLabel: 'Rede pública' }),
    createIndicator({ ...base, key: 'rede-privada', label: 'Escolas privadas', description: 'Escolas da rede privada.', series: normalizeYearSeries(series.por_dependencia?.privada), currentValue: resumo.escolas_privada, formatType: 'number', mainCutLabel: 'Rede privada' }),
    createIndicator({ ...base, key: 'rede-internet', label: 'Escolas com internet', description: 'Percentual de escolas com acesso à internet.', series: valueSeries(series.internet, 'perc_internet'), currentValue: resumo.perc_internet, formatType: 'percent', mainCutLabel: 'Infraestrutura' }),
    createIndicator({ ...base, key: 'rede-banda-larga', label: 'Escolas com banda larga', description: 'Percentual de escolas com banda larga.', series: valueSeries(series.internet, 'perc_banda_larga'), currentValue: resumo.perc_banda_larga, formatType: 'percent', mainCutLabel: 'Infraestrutura' }),
  ]
}

function buildTurmasIndicators(turmas) {
  const series = turmas.series ?? {}
  const resumo = turmas.resumo_ultimo_ano ?? {}
  const latestYear = turmas.ultimo_ano
  const explore = buildTurmasExplore(turmas)
  const base = { themeKey: 'turmas', themeLabel: 'Turmas e docentes', themeShortLabel: 'Turmas', categories: [FILTER_KEYS.todos], isGeral: true, currentYear: latestYear, explore, notices: turmas.avisos ?? [] }
  return [
    createIndicator({ ...base, key: 'turmas-total', label: 'Total de turmas', description: 'Total de turmas registradas.', series: valueSeries(series.total, 'turmas'), currentValue: resumo.turmas, formatType: 'number', mainCutLabel: 'Total do município' }),
    createIndicator({ ...base, key: 'docentes-total', label: 'Total de docentes', description: 'Total de docentes registrados.', series: valueSeries(series.total, 'docentes'), currentValue: resumo.docentes, formatType: 'number', mainCutLabel: 'Docentes' }),
    createIndicator({ ...base, key: 'alunos-turma', label: 'Alunos por turma', description: 'Média de alunos por turma.', series: valueSeries(series.total, 'alunos_por_turma'), currentValue: resumo.alunos_por_turma, formatType: 'ratio', mainCutLabel: 'Relação aluno/turma' }),
    createIndicator({ ...base, key: 'alunos-docente', label: 'Alunos por docente', description: 'Média de alunos por docente.', series: valueSeries(series.total, 'alunos_por_docente'), currentValue: resumo.alunos_por_docente, formatType: 'ratio', mainCutLabel: 'Relação aluno/docente' }),
  ]
}

function buildFluxoIndicators(fluxo) {
  const series = fluxo.series ?? {}
  const resumo = fluxo.resumo_ultimo_ano ?? {}
  const latestYear = fluxo.ultimo_ano
  const defaultSeries = series.por_etapa?.fundamental ?? []
  const explore = buildFluxoExplore(fluxo)
  const base = { themeKey: 'fluxo', themeLabel: 'Fluxo escolar', themeShortLabel: 'Fluxo', categories: [FILTER_KEYS.fundamental], stageLabel: 'Ensino Fundamental', currentYear: latestYear, formatType: 'percent', explore, notices: fluxo.avisos ?? [] }
  return [
    createIndicator({ ...base, key: 'fluxo-aprovacao', label: 'Taxa de aprovação', description: 'Percentual de aprovação no fluxo escolar.', series: valueSeries(defaultSeries, 'taxa_aprovacao'), currentValue: resumo.taxa_aprovacao, mainCutLabel: 'Ensino Fundamental' }),
    createIndicator({ ...base, key: 'fluxo-reprovacao', label: 'Taxa de reprovação', description: 'Percentual de reprovação no fluxo escolar.', series: valueSeries(defaultSeries, 'taxa_reprovacao'), currentValue: resumo.taxa_reprovacao, mainCutLabel: 'Ensino Fundamental' }),
    createIndicator({ ...base, key: 'fluxo-abandono', label: 'Taxa de abandono', description: 'Percentual de abandono no fluxo escolar.', series: valueSeries(defaultSeries, 'taxa_abandono'), currentValue: resumo.taxa_abandono, mainCutLabel: 'Ensino Fundamental' }),
    createIndicator({ ...base, key: 'fluxo-distorcao', label: 'Distorção idade-série', description: 'Percentual de estudantes com distorção idade-série.', series: valueSeries(defaultSeries, 'taxa_distorcao'), currentValue: resumo.taxa_distorcao, mainCutLabel: 'Ensino Fundamental' }),
  ]
}

function buildAprendizagemIndicators(aprend) {
  const series = aprend.series ?? {}
  const resumo = aprend.resumo_ultimo_ano ?? {}
  const preferredIdeb = getPreferredIdeb(resumo)
  const preferredSeries = preferredIdeb?.etapa ? series.ideb?.[preferredIdeb.etapa] : []
  const explore = buildAprendizagemExplore(aprend)
  const base = { themeKey: 'aprendizagem', themeLabel: 'Aprendizagem', themeShortLabel: 'Aprendizagem', categories: [FILTER_KEYS.todos], isGeral: true, currentYear: preferredIdeb?.ano ?? aprend.ultimo_ano?.ideb, explore, notices: aprend.avisos ?? [] }
  return [
    createIndicator({ ...base, key: 'apr-ideb', label: 'IDEB', description: 'Último IDEB disponível para o recorte principal.', series: valueSeries(preferredSeries, 'ideb'), currentValue: preferredIdeb?.ideb, formatType: 'value', mainCutLabel: preferredIdeb ? etapaLabel(preferredIdeb.etapa) : 'IDEB' }),
    createIndicator({ ...base, key: 'apr-saeb-lp', label: 'SAEB Língua Portuguesa', description: 'Resultado de Língua Portuguesa no SAEB.', series: valueSeries(preferredSeries, 'saeb_lp'), currentValue: latestValue(preferredSeries, 'saeb_lp'), formatType: 'value', mainCutLabel: preferredIdeb ? etapaLabel(preferredIdeb.etapa) : 'SAEB LP' }),
    createIndicator({ ...base, key: 'apr-saeb-mt', label: 'SAEB Matemática', description: 'Resultado de Matemática no SAEB.', series: valueSeries(preferredSeries, 'saeb_mt'), currentValue: latestValue(preferredSeries, 'saeb_mt'), formatType: 'value', mainCutLabel: preferredIdeb ? etapaLabel(preferredIdeb.etapa) : 'SAEB MT' }),
    createIndicator({ ...base, key: 'apr-alfabetizacao', label: 'Alfabetização', description: 'Taxa de alfabetização disponível para os anos recentes.', categories: [FILTER_KEYS.fundamental], isGeral: false, stageLabel: 'Ensino Fundamental', series: valueSeries(series.alfabetizacao, 'taxa_alfabetizacao'), currentValue: resumo.taxa_alfabetizacao, currentYear: aprend.ultimo_ano?.alfabetizacao, formatType: 'percent', mainCutLabel: 'Alfabetização' }),
    createIndicator({ ...base, key: 'apr-inse', label: 'INSE', description: 'Média do indicador de nível socioeconômico.', series: valueSeries(series.inse, 'media_inse'), currentValue: resumo.media_inse, currentYear: aprend.ultimo_ano?.inse, formatType: 'value', mainCutLabel: 'Nível socioeconômico' }),
  ]
}

function buildOfertaIndicators(oferta) {
  const series = oferta.series ?? {}
  const resumo = oferta.resumo_ultimo_ano ?? {}
  const latestYear = oferta.ultimo_ano
  const explore = buildOfertaExplore(oferta)
  const items = [
    createIndicator({ key: 'oferta-total', label: 'Matrículas em educação técnica/profissional', description: 'Total de matrículas em oferta técnica/profissional.', themeKey: 'oferta', themeLabel: 'Oferta técnica/profissional', themeShortLabel: 'Oferta', categories: [FILTER_KEYS.profissional], stageLabel: 'Educação Profissional', series: normalizeYearSeries(series.total), currentValue: resumo.total_matriculas_tecnicas, currentYear: latestYear, formatType: 'number', mainCutLabel: 'Oferta técnica', explore, notices: oferta.avisos ?? [] }),
  ]

  Object.entries(series.por_modalidade ?? {}).forEach(([key, modalitySeries]) => {
    const normalized = normalizeYearSeries(modalitySeries)
    if (!normalized.length) return
    items.push(createIndicator({ key: `oferta-${key}`, label: `Matrículas - ${modLabel(key)}`, description: `Matrículas técnicas na modalidade ${modLabel(key)}.`, themeKey: 'oferta', themeLabel: 'Oferta técnica/profissional', themeShortLabel: 'Oferta', categories: [FILTER_KEYS.profissional], stageLabel: 'Educação Profissional', series: normalized, currentValue: normalized.at(-1)?.valor, currentYear: normalized.at(-1)?.ano ?? latestYear, formatType: 'number', mainCutLabel: modLabel(key), explore, notices: oferta.avisos ?? [] }))
  })

  return items
}

function createIndicator(config) {
  const series = normalizeYearSeries(config.series)
  const categories = normalizeIndicatorCategories(config)
  const isGeral = config.isGeral ?? (categories.length === 1 && categories[0] === FILTER_KEYS.todos)
  const first = series[0] ?? null
  const latest = series.at(-1) ?? null
  const currentValue = isMissing(config.currentValue) ? latest?.valor : config.currentValue
  const currentYear = config.currentYear ?? latest?.ano ?? null
  const initialValue = first?.valor
  const initialYear = first?.ano ?? null
  const formatValueForType = getFormatter(config.formatType)
  const variation = calculateVariation(initialValue, currentValue, config.formatType)
  const status = getIndicatorStatus(currentValue, series)

  return {
    ...config,
    id: config.id ?? config.key,
    tema: config.tema ?? config.themeKey,
    categorias: categories,
    categories,
    recortePrincipal: config.recortePrincipal ?? config.mainCutLabel,
    isGeral,
    categoryLabel: config.categoryLabel ?? getCategoryLabel(categories),
    showPointLabels: config.showPointLabels ?? true,
    series,
    chartColor: config.chartColor ?? '#16713a',
    currentDisplay: formatValueForType(currentValue),
    currentYear,
    formatValue: formatValueForType,
    initialDisplay: formatValueForType(initialValue),
    initialYear,
    notices: config.notices ?? [],
    quickReading: buildQuickReading({ currentDisplay: formatValueForType(currentValue), currentValue, currentYear, formatType: config.formatType, initialValue, initialYear, label: config.label, variation }),
    scaleType: config.scaleType ?? inferScaleType(config),
    statusLabel: status.label,
    statusTone: status.tone,
    variationDisplay: variation.display,
    variationTone: variation.tone,
  }
}

function normalizeIndicatorCategories(config) {
  const categories = config.categories ?? config.stageKeys ?? ['todos']
  const normalized = categories.filter(Boolean)
  return normalized.length ? normalized : ['todos']
}

function getCategoryLabel(categories) {
  if (!categories.length) return CATEGORY_LABELS[FILTER_KEYS.todos]
  if (categories.length === 1) return CATEGORY_LABELS[categories[0]] ?? categories[0]
  return categories.map((category) => CATEGORY_LABELS[category] ?? category).join(', ')
}

function buildMatriculasExplore(mat) {
  const series = mat.series ?? {}
  const resumo = mat.resumo_ultimo_ano ?? {}
  const dependencyKeys = dependencyCategoryKeys(series.por_dependencia)
  return [
    { key: 'mat-etapa', type: 'bar', title: 'Composição por etapa', color: '#16713a', data: entriesToRows(resumo.por_etapa, etapaLabel), formatLabel: formatNumber },
    { key: 'mat-dep', type: 'stacked', title: 'Composição por rede', categories: categoryDefinitions(dependencyKeys, depLabel, DEPENDENCY_COLORS), data: seriesMapToStackedRows(series.por_dependencia, dependencyKeys), formatLabel: formatNumber },
    { key: 'mat-loc', type: 'stacked', title: 'Composição por localização', categories: categoryDefinitions(['urbana', 'rural'], locLabel, LOCATION_COLORS), data: seriesMapToStackedRows(series.por_localizacao, ['urbana', 'rural']), formatLabel: formatNumber },
  ]
}

function buildRedeExplore(rede) {
  const series = rede.series ?? {}
  const resumo = rede.resumo_ultimo_ano ?? {}
  const dependencyKeys = dependencyCategoryKeys(series.por_dependencia)
  return [
    { key: 'rede-dep', type: 'stacked', title: 'Composição por rede', categories: categoryDefinitions(dependencyKeys, depLabel, DEPENDENCY_COLORS), data: seriesMapToStackedRows(series.por_dependencia, dependencyKeys), formatLabel: formatNumber },
    { key: 'rede-loc', type: 'stacked', title: 'Composição por localização', categories: categoryDefinitions(['urbana', 'rural'], locLabel, LOCATION_COLORS), data: seriesMapToStackedRows(series.por_localizacao, ['urbana', 'rural']), formatLabel: formatNumber },
    { key: 'rede-infra', type: 'bar', title: 'Infraestrutura disponível', color: '#16713a', formatLabel: formatPercent, data: [{ label: 'Com internet', value: resumo.perc_internet }, { label: 'Com banda larga', value: resumo.perc_banda_larga }] },
  ]
}

function buildTurmasExplore(turmas) {
  const series = turmas.series ?? {}
  const resumo = turmas.resumo_ultimo_ano ?? {}
  return [
    { key: 'turmas-etapa', type: 'bar', title: 'Turmas por etapa', color: '#16713a', formatLabel: formatNumber, data: latestRowsByValueKey(series.por_etapa, etapaLabel, 'turmas') },
    { key: 'turmas-relacoes', type: 'bar', title: 'Relações de atendimento', color: '#2563eb', formatLabel: formatRatio, data: [{ label: 'Alunos por turma', value: resumo.alunos_por_turma }, { label: 'Alunos por docente', value: resumo.alunos_por_docente }] },
  ]
}

function buildFluxoExplore(fluxo) {
  const series = fluxo.series ?? {}
  const resumo = fluxo.resumo_ultimo_ano ?? {}
  return [
    { key: 'fluxo-etapa', type: 'bar', title: 'Aprovação por etapa', color: '#16713a', formatLabel: formatPercent, data: latestRowsByValueKey(series.por_etapa, etapaLabel, 'taxa_aprovacao') },
    { key: 'fluxo-dep', type: 'bar', title: 'Aprovação por rede', color: '#2563eb', formatLabel: formatPercent, data: latestRowsByValueKey(pickDependencySeries(series.por_dependencia), depLabel, 'taxa_aprovacao') },
    { key: 'fluxo-taxas', type: 'bar', title: 'Reprovação, abandono e distorção', color: '#d84b21', formatLabel: formatPercent, data: [{ label: 'Reprovação', value: resumo.taxa_reprovacao }, { label: 'Abandono', value: resumo.taxa_abandono }, { label: 'Distorção idade-série', value: resumo.taxa_distorcao }] },
  ]
}

function buildAprendizagemExplore(aprend) {
  const series = aprend.series ?? {}
  const resumo = aprend.resumo_ultimo_ano ?? {}
  const idebRows = Object.entries(resumo).filter(([key]) => key.startsWith('ideb_')).map(([key, value]) => {
    const etapa = key.replace('ideb_', '')
    return { label: `${etapaLabel(etapa)} (${formatYear(resumo[`ano_ideb_${etapa}`])})`, value }
  })
  return [
    { key: 'apr-ideb-bar', type: 'bar', title: 'IDEB por etapa', data: idebRows, color: '#16713a', formatLabel: formatValue },
    { key: 'apr-alf', type: 'line', title: 'Alfabetização', series: valueSeries(series.alfabetizacao, 'taxa_alfabetizacao'), color: '#2563eb', formatLabel: formatPercent, scaleType: 'percent' },
    { key: 'apr-inse', type: 'line', title: 'INSE', series: valueSeries(series.inse, 'media_inse'), color: '#7c3aed', formatLabel: formatValue, scaleType: 'inse' },
  ]
}

function buildOfertaExplore(oferta) {
  const series = oferta.series ?? {}
  return [
    { key: 'oferta-total', type: 'line', title: 'Evolução das matrículas técnicas', series: normalizeYearSeries(series.total), color: '#7c3aed', formatLabel: formatNumber, scaleType: 'count' },
    { key: 'oferta-mod', type: 'bar', title: 'Matrículas por modalidade', color: '#7c3aed', formatLabel: formatNumber, data: latestRows(series.por_modalidade, modLabel) },
  ]
}

function valueSeries(series, key) {
  return normalizeYearSeries(Array.isArray(series) ? series.map((point) => ({ ano: point.ano, valor: point[key] })) : [])
}

function latestValue(series, key) {
  return valueSeries(series, key).at(-1)?.valor ?? null
}

function entriesToRows(source, labelFn) {
  return Object.entries(source ?? {}).map(([key, value]) => ({ label: labelFn(key), value })).filter((row) => !isMissing(row.value))
}

function latestRows(source, labelFn) {
  return Object.entries(source ?? {}).map(([key, series]) => ({ label: labelFn(key), value: normalizeYearSeries(series).at(-1)?.valor ?? null })).filter((row) => !isMissing(row.value))
}

function latestRowsByValueKey(source, labelFn, valueKey) {
  return Object.entries(source ?? {}).map(([key, series]) => ({ label: labelFn(key), value: valueSeries(series, valueKey).at(-1)?.valor ?? null })).filter((row) => !isMissing(row.value))
}

function dependencyCategoryKeys(source) {
  const detailed = ['federal', 'estadual', 'municipal'].filter((key) => hasSeriesData(source?.[key]))
  const keys = detailed.length ? [...detailed, 'privada'] : ['publica', 'privada']
  return keys.filter((key) => hasSeriesData(source?.[key]))
}

function pickDependencySeries(source) {
  const keys = dependencyCategoryKeys(source)
  return Object.fromEntries(keys.map((key) => [key, source?.[key]]).filter(([, value]) => value))
}

function hasSeriesData(series, valueKey = 'valor') {
  return normalizeYearSeries(series).some((point) => !isMissing(point[valueKey]))
}

function categoryDefinitions(keys, labelFn, colors) {
  return keys.map((key) => ({ key, label: labelFn(key), color: colors[key] ?? '#16713a' }))
}

function seriesMapToStackedRows(source, keys, valueKey = 'valor') {
  const years = new Set()
  keys.forEach((key) => {
    normalizeYearSeries(source?.[key]).forEach((point) => {
      if (!isMissing(point[valueKey]) && point.ano) years.add(Number(point.ano))
    })
  })
  return [...years].sort((a, b) => a - b).map((year) => {
    const values = {}
    keys.forEach((key) => {
      const point = normalizeYearSeries(source?.[key]).find((item) => Number(item.ano) === year)
      if (point && !isMissing(point[valueKey])) values[key] = point[valueKey]
    })
    return { year, values }
  })
}

function inferScaleType(config) {
  if (config.scaleType) return config.scaleType
  if (config.formatType === 'percent') return 'percent'
  if (config.key?.includes('ideb')) return 'ideb'
  if (config.key?.includes('saeb')) return 'saeb'
  if (config.key?.includes('inse')) return 'inse'
  if (config.formatType === 'ratio' || config.formatType === 'value') return 'dynamic'
  return 'count'
}

function getFormatter(formatType) {
  if (formatType === 'percent') return formatPercent
  if (formatType === 'ratio') return formatRatio
  if (formatType === 'value') return formatValue
  return formatNumber
}

function calculateVariation(initialValue, currentValue, formatType) {
  if (isMissing(initialValue) || isMissing(currentValue)) return { display: EM, tone: 'muted', raw: null }
  const diff = Number(currentValue) - Number(initialValue)
  if (formatType === 'percent') return { display: `${diff > 0 ? '+' : ''}${formatValue(diff)} p.p.`, tone: diff > 0 ? 'success' : diff < 0 ? 'warning' : 'muted', raw: diff }
  if (Number(initialValue) === 0) return { display: diff === 0 ? '0' : `${diff > 0 ? '+' : ''}${getFormatter(formatType)(diff)}`, tone: diff > 0 ? 'success' : diff < 0 ? 'warning' : 'muted', raw: diff }
  const percent = (diff / Math.abs(Number(initialValue))) * 100
  return { display: `${percent > 0 ? '+' : ''}${formatPercent(percent)}`, tone: diff > 0 ? 'success' : diff < 0 ? 'warning' : 'muted', raw: percent }
}

function getIndicatorStatus(currentValue, series) {
  if (isMissing(currentValue)) return { label: 'Sem dado', tone: 'muted' }
  if (series.length < 2) return { label: 'Série parcial', tone: 'info' }
  return { label: 'Com dados', tone: 'success' }
}

function buildQuickReading({ currentDisplay, currentValue, currentYear, formatType, initialValue, initialYear, label, variation }) {
  if (isMissing(currentValue)) return `Não há dado recente disponível para ${label.toLocaleLowerCase('pt-BR')}.`
  if (isMissing(initialValue) || !initialYear || !currentYear || variation.raw === null) return 'Não há série histórica suficiente para calcular evolução.'
  const movement = variation.raw > 0 ? 'aumento' : variation.raw < 0 ? 'redução' : 'estabilidade'
  const variationText = formatType === 'percent' ? variation.display : variation.display.replace('+', '')
  return `Em ${currentYear}, o município registra ${currentDisplay}. Em relação a ${initialYear}, houve ${movement} de ${variationText}.`
}

function getPreferredIdeb(resumo) {
  return Object.entries(resumo)
    .filter(([key, value]) => key.startsWith('ideb_') && !isMissing(value))
    .map(([key, ideb]) => {
      const etapa = key.replace('ideb_', '')
      return { etapa, ideb, ano: resumo[`ano_ideb_${etapa}`], saeb_lp: resumo[`saeb_lp_${etapa}`], saeb_mt: resumo[`saeb_mt_${etapa}`] }
    })
    .sort((a, b) => Number(b.ano ?? 0) - Number(a.ano ?? 0))[0] ?? null
}
