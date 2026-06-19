import { useMemo, useState } from 'react'
import { EducationBarChart } from '../components/EducationBarChart'
import { EducationLineChart } from '../components/EducationLineChart'
import { EducationSection } from '../components/EducationSection'
import { EducationSummaryCard } from '../components/EducationSummaryCard'
import { EducationTable } from '../components/EducationTable'
import { loadEducationMunicipio, loadEducationMunicipiosIndex } from '../data/educationData'
import { useAsyncData } from '../utils/useAsyncData'
import {
  buildEvolutionText,
  depLabel,
  etapaLabel,
  filterOptionsFromMap,
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

  if (!selectedMunicipio) {
    return (
      <div className="page-stack educacao-page">
        <section className="page-card educacao-hero">
          <div>
            <span className="eyebrow">Indicadores da Educação</span>
            <h1>Indicadores da Educação</h1>
            <p>Matrículas, rede escolar, docentes, fluxo, aprendizagem e oferta técnica dos municípios do Rio Grande do Sul.</p>
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

  const blocos = dados.blocos ?? {}
  const mat = blocos.matriculas ?? {}
  const rede = blocos.rede_escolar ?? {}
  const turmas = blocos.turmas_docentes ?? {}
  const fluxo = blocos.fluxo ?? {}
  const aprend = blocos.aprendizagem ?? {}
  const oferta = blocos.oferta_tecnica ?? {}

  const r = (b) => b.resumo_ultimo_ano ?? {}
  const a = (b) => b.ultimo_ano
  const idebOverview = getPreferredIdeb(r(aprend))

  return (
    <div className="page-stack educacao-page">
      <section className="page-card educacao-hero">
        <div>
          <span className="eyebrow">Indicadores da Educação</span>
          <h1>Indicadores da Educação</h1>
          <p>Matrículas, rede escolar, docentes, fluxo, aprendizagem e oferta técnica de <strong>{selectedMunicipio}</strong>.</p>
        </div>
      </section>

      <section className="page-card educacao-overview">
        <div className="educacao-overview__heading">
          <h2>Visão geral</h2>
          <p>Últimos dados disponíveis por bloco, com o ano de referência em cada indicador.</p>
        </div>
        <div className="educacao-overview-grid">
          <EducationSummaryCard label="Matrículas" value={formatNumber(r(mat).total_matriculas)} year={a(mat)} />
          <EducationSummaryCard label="Escolas" value={formatNumber(r(rede).total_escolas)} year={a(rede)} />
          <EducationSummaryCard label="Turmas" value={formatNumber(r(turmas).turmas)} year={a(turmas)} />
          <EducationSummaryCard label="Alunos por turma" value={formatRatio(r(turmas).alunos_por_turma)} year={a(turmas)} />
          <EducationSummaryCard label="Aprovação" value={formatPercent(r(fluxo).taxa_aprovacao)} year={a(fluxo)} tone="success" />
          <EducationSummaryCard label="IDEB" value={idebOverview ? formatValue(idebOverview.ideb) : EM} year={idebOverview?.ano} />
          <EducationSummaryCard label="Oferta técnica" value={formatNumber(r(oferta).total_matriculas_tecnicas)} year={a(oferta)} />
        </div>
      </section>

      <MatriculasSection mat={mat} />
      <RedeEscolarSection rede={rede} />
      <TurmasDocentesSection turmas={turmas} />
      <FluxoSection fluxo={fluxo} />
      <AprendizagemSection aprend={aprend} />
      <OfertaTecnicaSection oferta={oferta} />
    </div>
  )
}

function FilterBar({ options, selected, onChange, label }) {
  if (!options || options.length === 0) return null
  return (
    <div className="education-filter-bar">
      <span className="education-filter-bar__label">{label}</span>
      <button className={`education-filter-chip${selected === null ? ' is-active' : ''}`} onClick={() => onChange(null)}>Total</button>
      {options.map(({ key, label: lbl }) => (
        <button key={key} className={`education-filter-chip${selected === key ? ' is-active' : ''}`} onClick={() => onChange(selected === key ? null : key)}>{lbl}</button>
      ))}
    </div>
  )
}

function getSeriesTotal(series, filterEtapa, filterDep, filterLoc, allSeries) {
  if (filterEtapa && allSeries?.por_etapa?.[filterEtapa]) return allSeries.por_etapa[filterEtapa]
  if (filterDep && allSeries?.por_dependencia?.[filterDep]) return allSeries.por_dependencia[filterDep]
  if (filterLoc && allSeries?.por_localizacao?.[filterLoc]) return allSeries.por_localizacao[filterLoc]
  return series
}

function asValueSeries(series, valueKey) {
  return normalizeYearSeries(
    Array.isArray(series) ? series.map((p) => ({ ano: p.ano, valor: p[valueKey] })) : [],
  )
}

function latestByYear(series, valueKey) {
  return asValueSeries(series, valueKey).at(-1) ?? null
}

function getPreferredIdeb(resumo) {
  return ['fundamental_anos_finais', 'fundamental_anos_iniciais', 'medio']
    .map((etapa) => ({
      etapa,
      ideb: resumo[`ideb_${etapa}`],
      ano: resumo[`ano_ideb_${etapa}`],
    }))
    .filter((row) => !isMissing(row.ideb))
    .sort((a, b) => Number(b.ano ?? 0) - Number(a.ano ?? 0))[0] ?? null
}

function MatriculasSection({ mat }) {
  const series = mat.series ?? {}
  const [fEtapa, setFEtapa] = useState(null)
  const [fDep, setFDep] = useState(null)
  const [fLoc, setFLoc] = useState(null)
  const displaySeries = getSeriesTotal(series.total, fEtapa, fDep, fLoc, series)
  const r = mat.resumo_ultimo_ano ?? {}
  const etapaBars = Object.entries(r.por_etapa ?? {}).map(([k, v]) => ({ label: etapaLabel(k), value: v }))
  const depRows = Object.entries(series.por_dependencia ?? {}).map(([k, s]) => ({ label: depLabel(k), value: s?.[s.length - 1]?.valor ?? null }))
  const locRows = Object.entries(series.por_localizacao ?? {}).map(([k, s]) => ({ label: locLabel(k), value: s?.[s.length - 1]?.valor ?? null }))
  const evol = buildEvolutionText(series.total, 'as matrículas')
  return (
    <EducationSection id="matriculas" title="Matrículas" description="Volume de matrículas por rede, etapa e localização no município.">
      <div className="education-subgrid">
        <EducationSummaryCard label="Total" value={formatNumber(r.total_matriculas)} year={mat.ultimo_ano} />
        <EducationSummaryCard label="Rede pública" value={formatNumber(r.matriculas_publica)} year={mat.ultimo_ano} />
        <EducationSummaryCard label="Rede privada" value={formatNumber(r.matriculas_privada)} year={mat.ultimo_ano} />
        <EducationSummaryCard label="Tempo integral" value={formatPercent(r.percentual_integral)} year={mat.ultimo_ano} />
      </div>
      <div className="education-filter-panel">
        <FilterBar label="Etapa" options={filterOptionsFromMap(series.por_etapa, etapaLabel)} selected={fEtapa} onChange={(value) => { setFEtapa(value); setFDep(null); setFLoc(null) }} />
        <FilterBar label="Dependência" options={filterOptionsFromMap(series.por_dependencia, depLabel)} selected={fDep} onChange={(value) => { setFDep(value); setFEtapa(null); setFLoc(null) }} />
        <FilterBar label="Localização" options={filterOptionsFromMap(series.por_localizacao, locLabel)} selected={fLoc} onChange={(value) => { setFLoc(value); setFEtapa(null); setFDep(null) }} />
      </div>
      {evol && <p className="education-evolution">{evol}</p>}
      {displaySeries && normalizeYearSeries(displaySeries).length > 1 ? (
        <EducationLineChart series={displaySeries} title="Evolução de matrículas" formatLabel={(v) => formatNumber(v)} />
      ) : <p className="education-chart-empty">Nenhum dado para o filtro selecionado.</p>}
      {!fEtapa && !fDep && !fLoc && etapaBars.length > 0 && <EducationBarChart data={etapaBars} title="Matrículas por etapa" color="#16713a" formatLabel={(v) => formatNumber(v)} />}
      {!fEtapa && !fDep && !fLoc && <div className="education-two-col">
        {depRows.length > 0 && <EducationTable columns={[{key:'label',label:'Dependência'},{key:'value',label:'Matrículas',format:formatNumber}]} rows={depRows} />}
        {locRows.length > 0 && <EducationTable columns={[{key:'label',label:'Localização'},{key:'value',label:'Matrículas',format:formatNumber}]} rows={locRows} />}
      </div>}
    </EducationSection>
  )
}

function RedeEscolarSection({ rede }) {
  const series = rede.series ?? {}
  const [fDep, setFDep] = useState(null)
  const [fLoc, setFLoc] = useState(null)
  const displaySeries = getSeriesTotal(series.total, null, fDep, fLoc, { por_dependencia: series.por_dependencia, por_localizacao: series.por_localizacao })
  const r = rede.resumo_ultimo_ano ?? {}
  const evol = buildEvolutionText(series.total, 'o número de escolas')
  return (
    <EducationSection id="rede-escolar" title="Rede escolar" description="Quantidade de escolas e infraestrutura básica disponível.">
      <div className="education-subgrid">
        <EducationSummaryCard label="Total de escolas" value={formatNumber(r.total_escolas)} year={rede.ultimo_ano} />
        <EducationSummaryCard label="Urbanas" value={formatNumber(r.escolas_urbana)} year={rede.ultimo_ano} />
        <EducationSummaryCard label="Rurais" value={formatNumber(r.escolas_rural)} year={rede.ultimo_ano} />
        <EducationSummaryCard label="Públicas" value={formatNumber(r.escolas_publica)} year={rede.ultimo_ano} />
        <EducationSummaryCard label="Com internet" value={formatPercent(r.perc_internet)} year={rede.ultimo_ano} />
        <EducationSummaryCard label="Com banda larga" value={formatPercent(r.perc_banda_larga)} year={rede.ultimo_ano} />
      </div>
      <div className="education-filter-panel">
        <FilterBar label="Dependência" options={filterOptionsFromMap(series.por_dependencia, depLabel)} selected={fDep} onChange={(value) => { setFDep(value); setFLoc(null) }} />
        <FilterBar label="Localização" options={filterOptionsFromMap(series.por_localizacao, locLabel)} selected={fLoc} onChange={(value) => { setFLoc(value); setFDep(null) }} />
      </div>
      {evol && <p className="education-evolution">{evol}</p>}
      {displaySeries && normalizeYearSeries(displaySeries).length > 1
        ? <EducationLineChart series={displaySeries} title="Evolução de escolas" color="#2563eb" formatLabel={(v) => formatNumber(v)} />
        : <p className="education-chart-empty">Nenhum dado para o filtro selecionado.</p>}
    </EducationSection>
  )
}

function TurmasDocentesSection({ turmas }) {
  const series = turmas.series ?? {}
  const [fEtapa, setFEtapa] = useState(null)
  const displaySeries = fEtapa && series.por_etapa?.[fEtapa] ? series.por_etapa[fEtapa] : series.total
  const chartSeries = asValueSeries(displaySeries, 'turmas')
  const r = turmas.resumo_ultimo_ano ?? {}
  const avisos = turmas.avisos ?? []
  const evol = buildEvolutionText(asValueSeries(series.total, 'turmas'), 'as turmas')
  return (
    <EducationSection id="turmas-docentes" title="Turmas e docentes" description="Dimensão das turmas e relação entre alunos, turmas e docentes." avisos={avisos}>
      <div className="education-subgrid">
        <EducationSummaryCard label="Turmas" value={formatNumber(r.turmas)} year={turmas.ultimo_ano} />
        <EducationSummaryCard label="Docentes" value={formatNumber(r.docentes)} year={turmas.ultimo_ano} />
        <EducationSummaryCard label="Alunos por turma" value={formatRatio(r.alunos_por_turma)} year={turmas.ultimo_ano} />
        <EducationSummaryCard label="Alunos por docente" value={formatRatio(r.alunos_por_docente)} year={turmas.ultimo_ano} />
      </div>
      <div className="education-filter-panel">
        <FilterBar label="Etapa" options={filterOptionsFromMap(series.por_etapa, etapaLabel)} selected={fEtapa} onChange={setFEtapa} />
      </div>
      {evol && <p className="education-evolution">{evol}</p>}
      {chartSeries.length > 1
        ? <EducationLineChart series={chartSeries} title="Evolução de turmas" formatLabel={(v) => formatNumber(v)} />
        : <p className="education-chart-empty">Nenhum dado para o filtro selecionado.</p>}
    </EducationSection>
  )
}

function FluxoSection({ fluxo }) {
  const series = fluxo.series ?? {}
  const [fEtapa, setFEtapa] = useState(null)
  const [fDep, setFDep] = useState(null)
  const r = fluxo.resumo_ultimo_ano ?? {}
  const avisos = fluxo.avisos ?? []
  const defaultSeries = series.por_etapa?.fundamental ?? []
  const displaySeries = fEtapa && series.por_etapa?.[fEtapa] ? series.por_etapa[fEtapa]
    : fDep && series.por_dependencia?.[fDep] ? series.por_dependencia[fDep]
    : defaultSeries
  const chartSeries = asValueSeries(displaySeries, 'taxa_aprovacao')
  const evol = buildEvolutionText(asValueSeries(defaultSeries, 'taxa_aprovacao'), 'a taxa de aprovação', 'percent')

  return (
    <EducationSection id="fluxo" title="Fluxo escolar" description="Taxas de aprovação, reprovação, abandono e distorção idade-série." avisos={avisos}>
      <div className="education-subgrid">
        <EducationSummaryCard label="Aprovação" value={formatPercent(r.taxa_aprovacao)} year={fluxo.ultimo_ano} tone="success" />
        <EducationSummaryCard label="Reprovação" value={formatPercent(r.taxa_reprovacao)} year={fluxo.ultimo_ano} tone="warning" />
        <EducationSummaryCard label="Abandono" value={formatPercent(r.taxa_abandono)} year={fluxo.ultimo_ano} tone="warning" />
        <EducationSummaryCard label="Distorção idade-série" value={formatPercent(r.taxa_distorcao)} year={fluxo.ultimo_ano} />
      </div>
      <div className="education-filter-panel">
        <FilterBar label="Etapa" options={filterOptionsFromMap(series.por_etapa, etapaLabel)} selected={fEtapa} onChange={(value) => { setFEtapa(value); setFDep(null) }} />
        <FilterBar label="Dependência" options={filterOptionsFromMap(series.por_dependencia, depLabel)} selected={fDep} onChange={(value) => { setFDep(value); setFEtapa(null) }} />
      </div>
      {evol && <p className="education-evolution">{evol}</p>}
      {chartSeries.length > 1
        ? <EducationLineChart series={chartSeries} title="Aprovação no ensino fundamental" color="#16713a" formatLabel={(v) => formatPercent(v)} />
        : <p className="education-chart-empty">Nenhum dado para o filtro selecionado.</p>}
    </EducationSection>
  )
}

function AprendizagemSection({ aprend }) {
  const series = aprend.series ?? {}
  const avisos = aprend.avisos ?? []
  const alfSeries = asValueSeries(series.alfabetizacao, 'taxa_alfabetizacao')
  const inseSeries = asValueSeries(series.inse, 'media_inse')
  const r = aprend.resumo_ultimo_ano ?? {}
  const anos = aprend.ultimo_ano ?? {}
  const preferredIdeb = getPreferredIdeb(r)
  const preferredIdebSeries = preferredIdeb?.etapa ? series.ideb?.[preferredIdeb.etapa] : null
  const idebSeries = asValueSeries(preferredIdebSeries, 'ideb')
  const latestSaebLp = latestByYear(preferredIdebSeries, 'saeb_lp')
  const latestSaebMt = latestByYear(preferredIdebSeries, 'saeb_mt')

  const idebRows = Object.entries(r).filter(([k]) => k.startsWith('ideb_')).map(([k, v]) => {
    const etapa = k.replace('ideb_', '')
    return {
      etapa: etapaLabel(etapa),
      ideb: isMissing(v) ? null : formatValue(v),
      saeb_lp: formatValue(r[`saeb_lp_${etapa}`]),
      saeb_mt: formatValue(r[`saeb_mt_${etapa}`]),
      ano: formatYear(r[`ano_ideb_${etapa}`]),
    }
  })

  const temDados = idebRows.length > 0 || alfSeries.length > 0 || inseSeries.length > 0

  return (
    <EducationSection id="aprendizagem" title="Aprendizagem" description="Indicadores com anos de referência diferentes, apresentados sem conectar séries incompatíveis." avisos={avisos}>
      {temDados ? <>
        <div className="education-subgrid education-subgrid--learning">
          <EducationSummaryCard label={`IDEB ${preferredIdeb ? etapaLabel(preferredIdeb.etapa) : ''}`.trim()} value={preferredIdeb ? formatValue(preferredIdeb.ideb) : EM} year={preferredIdeb?.ano ?? anos.ideb} />
          <EducationSummaryCard label="SAEB Língua Portuguesa" value={latestSaebLp ? formatValue(latestSaebLp.valor) : EM} year={latestSaebLp?.ano ?? anos.ideb} />
          <EducationSummaryCard label="SAEB Matemática" value={latestSaebMt ? formatValue(latestSaebMt.valor) : EM} year={latestSaebMt?.ano ?? anos.ideb} />
          <EducationSummaryCard label="Alfabetização" value={formatPercent(r.taxa_alfabetizacao)} year={anos.alfabetizacao ? formatYear(anos.alfabetizacao) : null} />
          <EducationSummaryCard label="INSE" value={isMissing(r.media_inse) ? EM : formatValue(r.media_inse)} year={anos.inse ? formatYear(anos.inse) : null} />
        </div>
        {idebRows.length > 0 && <EducationTable columns={[{key:'etapa',label:'Etapa'},{key:'ideb',label:'IDEB'},{key:'saeb_lp',label:'SAEB LP'},{key:'saeb_mt',label:'SAEB MT'},{key:'ano',label:'Ano'}]} rows={idebRows} />}
        <div className="education-chart-grid">
          {idebSeries.length > 1 && <EducationLineChart series={idebSeries} title={`IDEB - ${etapaLabel(preferredIdeb.etapa)}`} color="#16713a" formatLabel={(v) => formatValue(v)} />}
          {alfSeries.length > 1 && <EducationLineChart series={alfSeries} title="Taxa de alfabetização" color="#2563eb" formatLabel={(v) => formatPercent(v)} />}
          {inseSeries.length > 1 && <EducationLineChart series={inseSeries} title="INSE - nível socioeconômico" color="#7c3aed" formatLabel={(v) => formatValue(v)} />}
        </div>
      </> : <p className="education-table-empty">Não há dados de aprendizagem disponíveis para este município.</p>}
    </EducationSection>
  )
}

function OfertaTecnicaSection({ oferta }) {
  const series = oferta.series ?? {}
  const avisos = oferta.avisos ?? []
  const [fMod, setFMod] = useState(null)
  const displaySeries = fMod && series.por_modalidade?.[fMod] ? series.por_modalidade[fMod] : series.total
  const r = oferta.resumo_ultimo_ano ?? {}
  const totalTec = r.total_matriculas_tecnicas
  const semDado = isMissing(totalTec)
  const semOferta = !semDado && Number(totalTec) === 0
  const modRows = Object.entries(series.por_modalidade ?? {}).map(([k, s]) => ({
    modalidade: modLabel(k),
    matriculas: s?.[s.length - 1]?.valor ?? null,
  })).filter((row) => !isMissing(row.matriculas))
  const evol = buildEvolutionText(series.total, 'as matrículas técnicas')

  return (
    <EducationSection id="oferta-tecnica" title="Oferta técnica/profissional" description="Matrículas registradas em cursos técnicos e profissionais por modalidade." avisos={avisos}>
      <div className="education-subgrid">
        <EducationSummaryCard label="Matrículas técnicas" value={semDado ? EM : formatNumber(totalTec)} year={oferta.ultimo_ano} />
      </div>
      {semOferta && <p className="education-table-empty">Não há matrículas em oferta técnica/profissional registradas para este município no último ano disponível.</p>}
      {!semOferta && !semDado && <div className="education-filter-panel">
        <FilterBar label="Modalidade" options={filterOptionsFromMap(series.por_modalidade, modLabel)} selected={fMod} onChange={setFMod} />
      </div>}
      {evol && !semOferta && <p className="education-evolution">{evol}</p>}
      {displaySeries && normalizeYearSeries(displaySeries).length > 1 && !semOferta
        ? <EducationLineChart series={displaySeries} title="Evolução de matrículas técnicas" color="#7c3aed" formatLabel={(v) => formatNumber(v)} />
        : null}
      {modRows.length > 0 && !semOferta && <EducationTable columns={[{key:'modalidade',label:'Modalidade'},{key:'matriculas',label:'Matrículas',format:formatNumber}]} rows={modRows} />}
    </EducationSection>
  )
}
