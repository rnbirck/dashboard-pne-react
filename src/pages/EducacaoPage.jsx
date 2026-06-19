import { useMemo } from 'react'
import { EducationBarChart } from '../components/EducationBarChart'
import { EducationLineChart } from '../components/EducationLineChart'
import { EducationSection } from '../components/EducationSection'
import { EducationSummaryCard } from '../components/EducationSummaryCard'
import { EducationTable } from '../components/EducationTable'
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
} from '../utils/educationFormatters'

const EM = '\u2014'

export function EducacaoPage({ selectedMunicipio }) {
  const eduIndexState = useAsyncData(() => loadEducationMunicipiosIndex(), [])

  const eduMunMap = useMemo(() => {
    const list = eduIndexState.data?.municipios ?? []
    return new Map(list.map((m) => [m.nome, m.id_municipio]))
  }, [eduIndexState.data])

  const selectedId = eduMunMap.get(selectedMunicipio) ?? null

  const munDataState = useAsyncData(
    async () => {
      if (!selectedId) return null
      return loadEducationMunicipio(selectedId)
    },
    [selectedId],
  )

  if (!selectedMunicipio) {
    return (
      <div className="page-stack educacao-page">
        <section className="page-card educacao-hero">
          <div>
            <span className="eyebrow">Indicadores da Educação</span>
            <h1>Indicadores da Educação</h1>
            <p>
              Matrículas, rede escolar, docentes, fluxo, aprendizagem e oferta técnica
              dos municípios do Rio Grande do Sul.
            </p>
          </div>
        </section>
        <section className="empty-state">
          <div className="empty-state__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10L12 5 2 10l10 5 10-5z" />
              <path d="M6 12v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5" />
            </svg>
          </div>
          <h2>Selecione um município</h2>
          <p>
            Os indicadores educacionais são carregados após a seleção do município.
            Use o seletor no topo da página.
          </p>
        </section>
      </div>
    )
  }

  if (eduIndexState.loading) {
    return <div className="page-stack"><p className="state-box state-box--loading">Carregando índice...</p></div>
  }

  if (munDataState.loading) {
    return <div className="page-stack"><p className="state-box state-box--loading">Carregando dados de {selectedMunicipio}...</p></div>
  }

  if (munDataState.error) {
    return (
      <div className="page-stack">
        <div className="state-box state-box--error">
          <strong>Erro ao carregar dados educacionais</strong>
          <span>{munDataState.error}</span>
        </div>
      </div>
    )
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

  const matResumo = mat.resumo_ultimo_ano ?? {}
  const redeResumo = rede.resumo_ultimo_ano ?? {}
  const turmasResumo = turmas.resumo_ultimo_ano ?? {}
  const fluxoResumo = fluxo.resumo_ultimo_ano ?? {}
  const aprendResumo = aprend.resumo_ultimo_ano ?? {}
  const ofertaResumo = oferta.resumo_ultimo_ano ?? {}

  const matAno = mat.ultimo_ano
  const redeAno = rede.ultimo_ano
  const turmasAno = turmas.ultimo_ano
  const fluxoAno = fluxo.ultimo_ano
  const aprendAnos = aprend.ultimo_ano ?? {}
  const ofertaAno = oferta.ultimo_ano

  const ultimoIdeb = aprendResumo.ano_ideb_fundamental_anos_finais
    ?? aprendResumo.ano_ideb_fundamental_anos_iniciais
    ?? aprendResumo.ano_ideb_medio
  const valorIdeb = aprendResumo.ideb_fundamental_anos_finais
    ?? aprendResumo.ideb_fundamental_anos_iniciais
    ?? aprendResumo.ideb_medio

  return (
    <div className="page-stack educacao-page">
      <section className="page-card educacao-hero">
        <div>
          <span className="eyebrow">Indicadores da Educação</span>
          <h1>Indicadores da Educação</h1>
          <p>
            Matrículas, rede escolar, docentes, fluxo, aprendizagem e oferta técnica
            de <strong>{selectedMunicipio}</strong>.
          </p>
        </div>
      </section>

      <section className="page-card educacao-overview">
        <div className="education-overview-grid">
          <EducationSummaryCard
            label="Matrículas"
            value={formatNumber(matResumo.total_matriculas)}
            year={matAno ? `${matAno}` : null}
          />
          <EducationSummaryCard
            label="Escolas"
            value={formatNumber(redeResumo.total_escolas)}
            year={redeAno ? `${redeAno}` : null}
          />
          <EducationSummaryCard
            label="Turmas"
            value={formatNumber(turmasResumo.turmas)}
            year={turmasAno ? `${turmasAno}` : null}
          />
          <EducationSummaryCard
            label="Alunos por turma"
            value={formatRatio(turmasResumo.alunos_por_turma)}
            year={turmasAno ? `${turmasAno}` : null}
          />
          <EducationSummaryCard
            label="Taxa de aprovação"
            value={formatPercent(fluxoResumo.taxa_aprovacao)}
            year={fluxoAno ? `${fluxoAno}` : null}
            tone="success"
          />
          <EducationSummaryCard
            label="IDEB"
            value={isMissing(valorIdeb) ? EM : formatValue(valorIdeb)}
            year={ultimoIdeb ? `${ultimoIdeb}` : null}
          />
          <EducationSummaryCard
            label="Oferta técnica"
            value={formatNumber(ofertaResumo.total_matriculas_tecnicas)}
            year={ofertaAno ? `${ofertaAno}` : null}
          />
        </div>
      </section>

      <MatriculasSection mat={mat} matResumo={matResumo} matAno={matAno} />
      <RedeEscolarSection rede={rede} redeResumo={redeResumo} redeAno={redeAno} />
      <TurmasDocentesSection turmas={turmas} turmasResumo={turmasResumo} turmasAno={turmasAno} />
      <FluxoSection fluxo={fluxo} fluxoResumo={fluxoResumo} fluxoAno={fluxoAno} />
      <AprendizagemSection aprend={aprend} aprendResumo={aprendResumo} aprendAnos={aprendAnos} />
      <OfertaTecnicaSection oferta={oferta} ofertaResumo={ofertaResumo} ofertaAno={ofertaAno} />
    </div>
  )
}

function MatriculasSection({ mat, matResumo, matAno }) {
  const series = mat.series ?? {}
  const porEtapa = matResumo.por_etapa ?? {}
  const etapaBars = Object.entries(porEtapa).map(([key, val]) => ({
    label: etapaLabel(key),
    value: val,
  }))

  const depData = Object.entries(series.por_dependencia ?? {}).map(([key, serie]) => {
    const latest = serie[serie.length - 1]
    return { label: depLabel(key), value: latest ? latest.valor : null }
  })

  const locData = Object.entries(series.por_localizacao ?? {}).map(([key, serie]) => {
    const latest = serie[serie.length - 1]
    return { label: locLabel(key), value: latest ? latest.valor : null }
  })

  const temDados = Boolean(series.total?.length) || etapaBars.length > 0

  return (
    <EducationSection id="matriculas" title="Matrículas">
      {temDados ? (
        <>
          <div className="education-subgrid">
            <EducationSummaryCard
              label="Total de matrículas"
              value={formatNumber(matResumo.total_matriculas)}
              year={matAno}
            />
            <EducationSummaryCard
              label="Rede pública"
              value={formatNumber(matResumo.matriculas_publica)}
              year={matAno}
            />
            <EducationSummaryCard
              label="Rede privada"
              value={formatNumber(matResumo.matriculas_privada)}
              year={matAno}
            />
            <EducationSummaryCard
              label="Tempo integral"
              value={formatPercent(matResumo.percentual_integral)}
              year={matAno}
            />
          </div>
          {series.total && series.total.length > 1 && (
            <EducationLineChart series={series.total} title="Evolução de matrículas" />
          )}
          {etapaBars.length > 0 && (
            <EducationBarChart data={etapaBars} title="Matrículas por etapa" color="#16713a" />
          )}
          <div className="education-two-col">
            {depData.length > 0 && (
              <EducationTable
                columns={[
                  { key: 'label', label: 'Dependência' },
                  { key: 'value', label: 'Matrículas', format: (v) => formatNumber(v) },
                ]}
                rows={depData}
              />
            )}
            {locData.length > 0 && (
              <EducationTable
                columns={[
                  { key: 'label', label: 'Localização' },
                  { key: 'value', label: 'Matrículas', format: (v) => formatNumber(v) },
                ]}
                rows={locData}
              />
            )}
          </div>
        </>
      ) : (
        <p className="education-table-empty">Não há dados de matrículas disponíveis para este município.</p>
      )}
    </EducationSection>
  )
}

function RedeEscolarSection({ rede, redeResumo, redeAno }) {
  const series = rede.series ?? {}
  const temDados = Boolean(series.total?.length) || !isMissing(redeResumo.total_escolas)

  return (
    <EducationSection id="rede-escolar" title="Rede escolar">
      {temDados ? (
        <>
          <div className="education-subgrid">
            <EducationSummaryCard
              label="Total de escolas"
              value={formatNumber(redeResumo.total_escolas)}
              year={redeAno}
            />
            <EducationSummaryCard
              label="Escolas urbanas"
              value={formatNumber(redeResumo.escolas_urbana)}
              year={redeAno}
            />
            <EducationSummaryCard
              label="Escolas rurais"
              value={formatNumber(redeResumo.escolas_rural)}
              year={redeAno}
            />
            <EducationSummaryCard
              label="Escolas públicas"
              value={formatNumber(redeResumo.escolas_publica)}
              year={redeAno}
            />
            <EducationSummaryCard
              label="Com internet"
              value={formatPercent(redeResumo.perc_internet)}
              year={redeAno}
            />
            <EducationSummaryCard
              label="Com banda larga"
              value={formatPercent(redeResumo.perc_banda_larga)}
              year={redeAno}
            />
          </div>
          {series.total && series.total.length > 1 && (
            <EducationLineChart series={series.total} title="Evolução de escolas" color="#2563eb" />
          )}
        </>
      ) : (
        <p className="education-table-empty">Não há dados de rede escolar disponíveis para este município.</p>
      )}
    </EducationSection>
  )
}

function TurmasDocentesSection({ turmas, turmasResumo, turmasAno }) {
  const series = turmas.series ?? {}
  const avisos = turmas.avisos ?? []
  const temDados = Boolean(series.total?.length) || !isMissing(turmasResumo.turmas)

  return (
    <EducationSection id="turmas-docentes" title="Turmas e docentes" avisos={avisos}>
      {temDados ? (
        <>
          <div className="education-subgrid">
            <EducationSummaryCard
              label="Turmas"
              value={formatNumber(turmasResumo.turmas)}
              year={turmasAno}
            />
            <EducationSummaryCard
              label="Docentes"
              value={formatNumber(turmasResumo.docentes)}
              year={turmasAno}
            />
            <EducationSummaryCard
              label="Alunos por turma"
              value={formatRatio(turmasResumo.alunos_por_turma)}
              year={turmasAno}
            />
            <EducationSummaryCard
              label="Alunos por docente"
              value={formatRatio(turmasResumo.alunos_por_docente)}
              year={turmasAno}
            />
          </div>
          {series.total && series.total.length > 1 && (
            <EducationLineChart series={series.total.map((p) => ({ ano: p.ano, valor: p.turmas }))} title="Evolução de turmas" />
          )}
        </>
      ) : (
        <p className="education-table-empty">Não há dados de turmas e docentes disponíveis para este município.</p>
      )}
    </EducationSection>
  )
}

function FluxoSection({ fluxo, fluxoResumo, fluxoAno }) {
  const series = fluxo.series ?? {}
  const avisos = fluxo.avisos ?? []
  const porEtapa = series.por_etapa ?? {}
  const fundSeries = porEtapa.fundamental ?? []
  const temDados = !isMissing(fluxoResumo.taxa_aprovacao) || fundSeries.length > 0

  return (
    <EducationSection id="fluxo" title="Fluxo escolar" avisos={avisos}>
      {temDados ? (
        <>
          <div className="education-subgrid">
            <EducationSummaryCard
              label="Taxa de aprovação"
              value={formatPercent(fluxoResumo.taxa_aprovacao)}
              year={fluxoAno}
              tone="success"
            />
            <EducationSummaryCard
              label="Taxa de reprovação"
              value={formatPercent(fluxoResumo.taxa_reprovacao)}
              year={fluxoAno}
              tone="warning"
            />
            <EducationSummaryCard
              label="Taxa de abandono"
              value={formatPercent(fluxoResumo.taxa_abandono)}
              year={fluxoAno}
              tone="warning"
            />
            <EducationSummaryCard
              label="Distorção idade-série"
              value={formatPercent(fluxoResumo.taxa_distorcao)}
              year={fluxoAno}
            />
          </div>
          {fundSeries.length > 1 && (
            <EducationLineChart
              series={fundSeries.map((p) => ({ ano: p.ano, valor: p.taxa_aprovacao }))}
              title="Aprovação no ensino fundamental"
              color="#16713a"
            />
          )}
        </>
      ) : (
        <p className="education-table-empty">Não há dados de fluxo escolar disponíveis para este município.</p>
      )}
    </EducationSection>
  )
}

function AprendizagemSection({ aprend, aprendResumo, aprendAnos }) {
  const series = aprend.series ?? {}
  const avisos = aprend.avisos ?? []
  const alfSeries = series.alfabetizacao ?? []
  const inseSeries = series.inse ?? []

  const idebRows = Object.entries(aprendResumo)
    .filter(([k]) => k.startsWith('ideb_'))
    .map(([k, v]) => {
      const etapa = k.replace('ideb_', '')
      return {
        etapa: etapaLabel(etapa),
        ideb: isMissing(v) ? null : formatValue(v),
        saeb_lp: formatValue(aprendResumo[`saeb_lp_${etapa}`]),
        saeb_mt: formatValue(aprendResumo[`saeb_mt_${etapa}`]),
        ano: formatYear(aprendResumo[`ano_ideb_${etapa}`]),
      }
    })

  const temDados = idebRows.length > 0 || alfSeries.length > 0 || inseSeries.length > 0

  return (
    <EducationSection id="aprendizagem" title="Aprendizagem" avisos={avisos}>
      {temDados ? (
        <>
          <div className="education-subgrid">
            {idebRows.length > 0 && (
              <EducationSummaryCard
                label={`IDEB ${idebRows[0].etapa}`}
                value={idebRows[0].ideb}
                year={idebRows[0].ano}
              />
            )}
            <EducationSummaryCard
              label="Alfabetização"
              value={formatPercent(aprendResumo.taxa_alfabetizacao)}
              year={aprendAnos.alfabetizacao ? formatYear(aprendAnos.alfabetizacao) : null}
            />
            <EducationSummaryCard
              label="INSE"
              value={isMissing(aprendResumo.media_inse) ? EM : formatValue(aprendResumo.media_inse)}
              year={aprendAnos.inse ? formatYear(aprendAnos.inse) : null}
            />
          </div>
          {idebRows.length > 0 && (
            <EducationTable
              columns={[
                { key: 'etapa', label: 'Etapa' },
                { key: 'ideb', label: 'IDEB' },
                { key: 'saeb_lp', label: 'SAEB LP' },
                { key: 'saeb_mt', label: 'SAEB MT' },
                { key: 'ano', label: 'Ano' },
              ]}
              rows={idebRows}
            />
          )}
          {alfSeries.length > 1 && (
            <EducationLineChart
              series={alfSeries.map((p) => ({ ano: p.ano, valor: p.taxa_alfabetizacao }))}
              title="Taxa de alfabetização"
              color="#2563eb"
            />
          )}
          {inseSeries.length > 1 && (
            <EducationLineChart
              series={inseSeries.map((p) => ({ ano: p.ano, valor: p.media_inse }))}
              title="INSE — Média do nível socioeconômico"
              color="#7c3aed"
            />
          )}
        </>
      ) : (
        <p className="education-table-empty">Não há dados de aprendizagem disponíveis para este município.</p>
      )}
    </EducationSection>
  )
}

function OfertaTecnicaSection({ oferta, ofertaResumo, ofertaAno }) {
  const series = oferta.series ?? {}
  const avisos = oferta.avisos ?? []
  const porModalidade = series.por_modalidade ?? {}
  const modRows = Object.entries(porModalidade).map(([key, serie]) => {
    const latest = serie[serie.length - 1]
    return {
      modalidade: modLabel(key),
      matriculas: latest ? latest.valor : null,
    }
  }).filter((r) => !isMissing(r.matriculas))

  const totalTec = ofertaResumo.total_matriculas_tecnicas
  const semOferta = isMissing(totalTec) || totalTec === 0

  return (
    <EducationSection id="oferta-tecnica" title="Oferta técnica/profissional" avisos={avisos}>
      <div className="education-subgrid">
        <EducationSummaryCard
          label="Matrículas técnicas"
          value={formatNumber(totalTec)}
          year={ofertaAno}
        />
      </div>
      {semOferta && (
        <p className="education-table-empty">
          Este município não possui oferta de educação profissional registrada.
        </p>
      )}
      {modRows.length > 0 && (
        <EducationTable
          columns={[
            { key: 'modalidade', label: 'Modalidade' },
            { key: 'matriculas', label: 'Matrículas', format: (v) => formatNumber(v) },
          ]}
          rows={modRows}
        />
      )}
      {series.total && series.total.length > 1 && (
        <EducationLineChart series={series.total} title="Evolução de matrículas técnicas" color="#7c3aed" />
      )}
    </EducationSection>
  )
}
