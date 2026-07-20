import fs from 'node:fs'
import path from 'node:path'


const root = path.resolve(import.meta.dirname, '..')
const educationRoot = path.join(root, 'public', 'data', 'educacao', 'municipios')
const diagnosticRoot = path.join(root, 'public', 'data', 'municipios')
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'diagnostic', 'indicatorCatalog.json'), 'utf8'))
const titles = new Map(catalog.indicators.map((indicator) => [indicator.indicatorId, indicator.name]))
const educationPayloads = fs.readdirSync(educationRoot)
  .filter((name) => /^\d{7}\.json$/.test(name))
  .sort()
  .map((name) => JSON.parse(fs.readFileSync(path.join(educationRoot, name), 'utf8')))
const diagnosticContracts = fs.readdirSync(diagnosticRoot)
  .filter((name) => /^\d{7}$/.test(name))
  .sort()
  .map((name) => JSON.parse(fs.readFileSync(path.join(diagnosticRoot, name, 'diagnostico.json'), 'utf8')))

if (educationPayloads.length !== 497 || diagnosticContracts.length !== 497) {
  throw new Error(`Cobertura inesperada: educação=${educationPayloads.length}, diagnóstico=${diagnosticContracts.length}`)
}

function getPath(object, dottedPath) {
  return dottedPath.split('.').reduce((value, key) => value?.[key], object)
}

function coverageFor(candidate) {
  const minimumOf = (values) => values.reduce((minimum, value) => minimum === null || value < minimum ? value : minimum, null)
  if (candidate.coverageSource === 'diagnostic_exposure') {
    const indicators = diagnosticContracts
      .map((contract) => contract.indicators.find((item) => item.indicatorId === candidate.indicatorId))
      .filter(Boolean)
    const available = indicators.filter((indicator) => indicator.municipalExposure?.status === 'available')
    const sizes = available.flatMap((indicator) => [
      indicator.municipalExposure.municipalDenominator,
      indicator.municipalExposure.totalDenominator,
    ]).filter(Number.isFinite)
    const years = [...new Set(available.map((indicator) => indicator.municipalExposure.year).filter(Number.isFinite))].sort()
    return {
      municipalities: available.length,
      years,
      minimum: minimumOf(sizes),
      minimumPositive: minimumOf(sizes.filter((value) => value > 0)),
      zeroCells: sizes.filter((value) => value === 0).length,
    }
  }
  if (!candidate.dataPath) {
    return { municipalities: null, years: [], minimum: null, minimumPositive: null, zeroCells: null }
  }
  let municipalities = 0
  const years = new Set()
  const sizes = []
  for (const payload of educationPayloads) {
    const records = getPath(payload, candidate.dataPath)
    if (!Array.isArray(records)) continue
    const matching = records.filter((record) => candidate.valueFields.some((field) => record[field] !== null && record[field] !== undefined))
    if (matching.length) municipalities += 1
    for (const record of matching) {
      if (Number.isFinite(record.ano)) years.add(record.ano)
      const size = candidate.sizeFields.map((field) => record[field]).find(Number.isFinite)
      if (Number.isFinite(size)) sizes.push(size)
    }
  }
  const positives = sizes.filter((value) => value > 0)
  return {
    municipalities,
    years: [...years].sort((a, b) => a - b),
    minimum: minimumOf(sizes),
    minimumPositive: minimumOf(positives),
    zeroCells: sizes.filter((value) => value === 0).length,
  }
}

const educationSource = 'INEP — Censo Escolar / Sinopse Estatística; painel educacional municipal já exportado'
const missingRule = 'null permanece ausente; grupos ausentes não são convertidos em zero; zeros explícitos são preservados como publicados pela fonte'
const riskSmall = 'agregado municipal, sem identificador individual; alta instabilidade e possível exposição de escola única quando a célula é pequena'
const riskCounts = 'agregado municipal, sem identificador individual; células pequenas e muitos zeros exigem supressão e aviso de instabilidade'

const candidates = []
const add = (indicatorId, recorte, options) => candidates.push({ indicatorId, recorte, ...options })

add('basico_integral', 'dependencia_administrativa', {
  source: educationSource,
  table: 'censo; matriculas_basico_integral_por_dependencia.sql',
  dataPath: 'blocos.matriculas.detalhamentos.tempo_integral_por_rede',
  publishedPath: '/data/educacao/municipios/{id}.json#blocos.matriculas.detalhamentos.tempo_integral_por_rede',
  fields: 'ano, dependencia, matriculas_integral, matriculas_total, percentual_integral', valueFields: ['percentual_integral'], sizeFields: ['matriculas_total'],
  unit: 'percentual', numerator: 'matriculas_integral', denominator: 'matriculas_total', compatibility: 'compatível após filtrar federal/estadual/municipal e excluir privada e o agregado publica para evitar dupla contagem',
  stateBenchmark: 'calculável por soma dos numeradores e denominadores no mesmo ano e recorte', peers: 'calculável com a mesma fórmula, ano e dependência', risk: riskCounts, use: 'decomposição de responsabilidade de rede; não comparar células abaixo do limiar', p4b: 'eligible_after_cell_threshold',
  useCategory: 'governabilidade',
})
add('basico_integral', 'urbano_rural', {
  source: educationSource,
  table: 'censo', dataPath: 'blocos.matriculas.detalhamentos.por_rede_localizacao',
  publishedPath: '/data/educacao/municipios/{id}.json#blocos.matriculas.detalhamentos.por_rede_localizacao',
  fields: 'ano, dependencia, localizacao, matriculas_integral, matriculas, percentual_integral', valueFields: ['percentual_integral'], sizeFields: ['matriculas'],
  unit: 'percentual', numerator: 'soma de matriculas_integral nas dependências públicas', denominator: 'soma de matriculas nas dependências públicas', compatibility: 'compatível com o indicador principal quando o filtro público e a agregação por localização são aplicados no mesmo ano',
  stateBenchmark: 'calculável por soma dos componentes no mesmo ano e localização', peers: 'calculável com fórmula, ano, rede pública e localização idênticos', risk: riskCounts, use: 'piloto estreito de desigualdade territorial urbano/rural, com supressão de células pequenas', p4b: 'recommended_pilot',
  useCategory: 'desigualdade',
})
add('basico_integral', 'etapa', {
  source: educationSource,
  table: 'censo', dataPath: 'blocos.matriculas.detalhamentos.tempo_integral_por_etapa_rede',
  publishedPath: '/data/educacao/municipios/{id}.json#blocos.matriculas.detalhamentos.tempo_integral_por_etapa_rede',
  fields: 'ano, etapa_ensino, dependencia, matriculas_integral, matriculas_total, percentual_integral', valueFields: ['percentual_integral'], sizeFields: ['matriculas_total'],
  unit: 'percentual', numerator: 'matriculas_integral', denominator: 'matriculas_total', compatibility: 'compatível após filtrar e agregar apenas as dependências públicas no mesmo ano e etapa',
  stateBenchmark: 'calculável por soma dos componentes', peers: 'calculável com mesma etapa, fórmula e ano', risk: riskCounts, use: 'diagnóstico por etapa após controle de células pequenas', p4b: 'eligible_after_cell_threshold',
  useCategory: 'desigualdade',
})

for (const indicatorId of ['creche', 'pre_escola', 'basico_6_17', 'basico_15_17']) {
  add(indicatorId, 'dependencia_administrativa', {
    source: 'INEP — Censo Escolar + população municipal por idade; contrato diagnóstico P3-C',
    table: `censo; matriculas_${indicatorId}_por_dependencia.sql`, coverageSource: 'diagnostic_exposure',
    publishedPath: '/data/municipios/{id}/diagnostico.json#indicators[].municipalExposure',
    fields: 'ano, dependencia, numerador de matrículas; denominador populacional municipal sem dependência', valueFields: [], sizeFields: [],
    unit: 'percentual/contribuição', numerator: 'matrículas por dependência', denominator: 'população residente total da faixa etária',
    compatibility: 'parcial: o numerador é decomponível, mas o denominador populacional não pertence a uma dependência; não interpretar cada parcela como taxa de cobertura da rede',
    stateBenchmark: 'não comparável como taxa por dependência sem definição de contribuição', peers: 'somente como participação do numerador, nunca como cobertura por rede', risk: riskCounts,
    use: 'contexto de exposição/governabilidade; não usar como desigualdade de atendimento', p4b: 'not_recommended',
    useCategory: 'governabilidade',
  })
}

for (const indicatorId of ['creche', 'pre_escola']) {
  add(indicatorId, 'urbano_rural', {
    source: educationSource, table: 'censo', dataPath: 'blocos.matriculas.detalhamentos.por_etapa_localizacao',
    publishedPath: '/data/educacao/municipios/{id}.json#blocos.matriculas.detalhamentos.por_etapa_localizacao',
    fields: 'ano, etapa_ensino, localizacao, matriculas', valueFields: ['matriculas'], sizeFields: ['matriculas'],
    unit: 'matrículas', numerator: 'matrículas por etapa e localização da escola', denominator: 'indisponível: população residente por faixa etária e localização',
    compatibility: 'incompatível como taxa principal: localização da escola não substitui localização de residência e falta o denominador populacional equivalente',
    stateBenchmark: 'somente contagem de matrículas, não taxa comparável', peers: 'não recomendado sem denominador residente urbano/rural', risk: riskCounts,
    use: 'contexto de oferta; não calcular lacuna ou cobertura', p4b: 'not_recommended',
    useCategory: 'contexto',
  })
  add(indicatorId, 'raca_cor', {
    source: educationSource, table: 'censo', dataPath: 'blocos.matriculas.detalhamentos.por_etapa_cor_raca',
    publishedPath: '/data/educacao/municipios/{id}.json#blocos.matriculas.detalhamentos.por_etapa_cor_raca',
    fields: 'ano, etapa_ensino, cor_raca, matriculas', valueFields: ['matriculas'], sizeFields: ['matriculas'],
    unit: 'matrículas', numerator: 'matrículas por etapa e raça/cor declarada', denominator: 'indisponível: população residente da mesma idade e raça/cor',
    compatibility: 'incompatível como taxa principal; há apenas o numerador escolar e categoria não declarada deve permanecer explícita',
    stateBenchmark: 'somente distribuição de matrículas', peers: 'não recomendado sem denominador compatível e limiar de célula', risk: riskCounts,
    use: 'auditoria de completude da declaração e composição das matrículas', p4b: 'not_recommended',
    useCategory: 'contexto',
  })
}

add('escolas_integral', 'dependencia_administrativa', {
  source: 'INEP — Censo Escolar; contrato diagnóstico P3-C', table: 'censo_escolas; escolas_integral_por_dependencia.sql', coverageSource: 'diagnostic_exposure',
  publishedPath: '/data/municipios/{id}/diagnostico.json#indicators[].municipalExposure',
  fields: 'ano, dependencia, escolas_publicas_com_integral, escolas_publicas_total', valueFields: [], sizeFields: [],
  unit: 'percentual', numerator: 'escolas públicas com pelo menos 25% das matrículas em tempo integral', denominator: 'escolas públicas com matrícula básica e dado de integral',
  compatibility: 'compatível por dependência pública; o agregado pública não deve ser somado novamente aos componentes', stateBenchmark: 'calculável por soma dos componentes', peers: 'calculável com mesma regra de 25%, ano e dependência', risk: riskSmall,
  use: 'decomposição por rede com limiar mínimo de escolas', p4b: 'eligible_after_cell_threshold',
  useCategory: 'governabilidade',
})

const infrastructureFields = {
  internet: 'perc_internet', internet_alunos: 'perc_internet_alunos', internet_aprendizagem: 'perc_internet_aprendizagem',
  internet_comunidade: 'perc_internet_comunidade', acesso_internet_computador: 'perc_acesso_internet_computador',
  acesso_internet_disp_pessoais: 'perc_acesso_internet_disp_pessoais', rede_local: 'perc_rede_local', rede_wireless: 'perc_rede_wireless',
  banda_larga: 'perc_banda_larga', desktop_aluno: 'perc_desktop_aluno', comp_portatil_aluno: 'perc_comp_portatil_aluno',
  tablet_aluno: 'perc_tablet_aluno', salas_climatizadas: 'perc_salas_climatizadas', salas_acessiveis: 'perc_salas_acessiveis',
}
for (const [indicatorId, valueField] of Object.entries(infrastructureFields)) {
  for (const [recorte, dataKey, groupField] of [['dependencia_administrativa', 'por_rede', 'dependencia'], ['urbano_rural', 'por_localizacao', 'localizacao']]) {
    const roomIndicator = indicatorId.startsWith('salas_')
    add(indicatorId, recorte, {
      source: educationSource, table: 'censo; infraestrutura_escolar_por_dependencia.sql / agregação por localização',
      dataPath: `blocos.rede_escolar.infraestrutura.${dataKey}`,
      publishedPath: `/data/educacao/municipios/{id}.json#blocos.rede_escolar.infraestrutura.${dataKey}`,
      fields: `ano, ${groupField}, escolas, ${valueField}`, valueFields: [valueField], sizeFields: ['escolas'], unit: 'percentual',
      numerator: roomIndicator ? 'salas utilizadas com a característica; não publicado no JSON segmentado' : 'escolas com a característica; não publicado no JSON segmentado',
      denominator: roomIndicator ? 'salas utilizadas; não publicado no JSON segmentado' : 'escolas no grupo',
      compatibility: roomIndicator ? 'parcial: percentual disponível, mas o denominador de salas e o numerador bruto não estão no artefato segmentado' : 'compatível em definição; o percentual publicado é arredondado e deve ser recalculado com contagens brutas para benchmark',
      stateBenchmark: 'não agregar percentuais arredondados; recalcular nas tabelas de origem com numerador e denominador', peers: 'possível após materializar contagens brutas, mesmo ano e recorte', risk: riskSmall,
      use: 'exploração descritiva; sem ação, ranking ou comparação até aplicar contagens brutas e limiar', p4b: 'not_recommended',
      useCategory: 'investigação',
    })
  }
}

const saebIds = [
  'saeb_matematica_anos_iniciais', 'saeb_matematica_anos_finais', 'saeb_matematica_ensino_medio',
  'saeb_portugues_anos_iniciais', 'saeb_portugues_anos_finais', 'saeb_portugues_ensino_medio',
]
for (const indicatorId of saebIds) {
  for (const recorte of ['dependencia_administrativa', 'urbano_rural']) {
    add(indicatorId, recorte, {
      source: 'INEP — SAEB; tabela local saeb_proficiencia', table: 'saeb_proficiencia; saeb_matematica.sql; saeb_proficiencia_niveis.sql',
      publishedPath: 'data_pipeline/queries/saeb_proficiencia_niveis.sql (o SQL atual força dependencia=total e localizacao=total)',
      fields: 'ano, id_municipio, dependencia, localizacao, etapa_codigo, materia, nivel, valor', valueFields: [], sizeFields: [],
      unit: 'percentual de estudantes por nível', numerator: 'soma das parcelas no nível adequado ou superior', denominator: 'estudantes participantes do SAEB no mesmo recorte',
      compatibility: 'potencialmente compatível, mas ainda não materializado: é necessário retirar o filtro total preservando os mesmos limiares e validar denominador e supressões do SAEB',
      stateBenchmark: 'não aferido; recalcular com microagregados oficiais e mesma regra', peers: 'não aferido; exigir mesmo ano, etapa, disciplina, dependência/localização e regra de divulgação',
      risk: 'agregado municipal; risco alto de instabilidade/supressão em redes e localidades pequenas', use: 'não usar até validar cobertura oficial e regras de divulgação', p4b: 'not_recommended',
      useCategory: 'investigação',
    })
  }
  add(indicatorId, 'nivel_socioeconomico', {
    source: 'INEP — INSE; painel educacional municipal já exportado', table: 'inse', dataPath: 'blocos.aprendizagem.series.inse',
    publishedPath: '/data/educacao/municipios/{id}.json#blocos.aprendizagem.series.inse', fields: 'ano, media_inse, qtd_alunos_inse', valueFields: ['media_inse'], sizeFields: ['qtd_alunos_inse'],
    unit: 'média INSE', numerator: 'não aplicável', denominator: 'qtd_alunos_inse apenas como cobertura do INSE',
    compatibility: 'não é recorte do indicador: há uma média contextual de INSE, não resultados SAEB por grupos de NSE', stateBenchmark: 'média ponderada é possível como contexto, não como desigualdade', peers: 'pode ajustar coorte futura, mas não comparar grupos de NSE', risk: riskCounts,
    use: 'covariável contextual; vedado apresentar como desigualdade por NSE', p4b: 'not_recommended',
    useCategory: 'contexto',
  })
}

add('medio_concluido_18_29', 'raca_cor', {
  source: 'IBGE — Censo Demográfico 2022; tabela racial já consultada pelo pipeline', table: 'censo_populacao_escolaridade_media_18_29_racial',
  publishedPath: 'data_pipeline/queries/censo_populacao_escolaridade_media_18_29_racial.sql',
  fields: 'ano, id_municipio, escolaridade_media_negros_18_29, escolaridade_media_nao_negros_18_29, razao_percentual_escolaridade_negros_nao_negros_18_29', valueFields: [], sizeFields: [],
  unit: 'anos médios/razão percentual', numerator: 'escolaridade média de negros 18–29', denominator: 'escolaridade média de não negros 18–29',
  compatibility: 'incompatível com o indicador principal, que mede conclusão do ensino médio; não usar como proxy da taxa de conclusão', stateBenchmark: 'fonte permite referência racial estadual, mas em outra métrica', peers: 'possível apenas para a métrica de escolaridade média, não para conclusão',
  risk: 'agregado censitário; cobertura e supressão municipal não aferidas com PostgreSQL indisponível', use: 'evidência contextual separada, com rótulo de métrica distinto', p4b: 'not_recommended',
  useCategory: 'não utilizável',
})

for (const indicatorId of ['medio_tecnico_articulado_percentual', 'medio_tecnico_participacao_publica', 'subsequente_expansao', 'eja_integrada_educacao_profissional_percentual']) {
  for (const [recorte, dataPath] of [['modalidade', 'blocos.oferta_tecnica.detalhamentos.por_modalidade'], ['dependencia_administrativa', 'blocos.oferta_tecnica.detalhamentos.por_modalidade_rede']]) {
    add(indicatorId, recorte, {
      source: 'INEP — Sinopse Estatística do Censo Escolar; painel educacional municipal já exportado', table: 'ept_nivel_medio; eja_integrada_educacao_profissional', dataPath,
      publishedPath: `/data/educacao/municipios/{id}.json#${dataPath}`, fields: recorte === 'modalidade' ? 'ano, modalidade, matriculas, perc_modalidade' : 'ano, modalidade, dependencia, matriculas, perc_modalidade',
      valueFields: ['matriculas'], sizeFields: ['matriculas'], unit: 'matrículas/percentual dentro da oferta técnica', numerator: 'matrículas da modalidade ou dependência selecionada',
      denominator: 'total da oferta técnica no artefato; não necessariamente o denominador legal do indicador principal',
      compatibility: 'parcial ou incompatível: os componentes existem, mas o denominador do artefato difere em pelo menos parte dos indicadores; EJA exige universo elegível e técnico articulado exige ensino médio',
      stateBenchmark: 'somente após reconstruir numerador e denominador legal no mesmo ano', peers: 'somente após fórmula e universo idênticos', risk: riskCounts,
      use: 'composição da oferta; não calcular distância à meta nem substituir o indicador principal', p4b: 'not_recommended',
      useCategory: 'contexto',
    })
  }
}

function formatMinimum(coverage) {
  if (coverage.minimum === null) return 'não aferido'
  const positive = coverage.minimumPositive === null ? 'nenhum positivo' : `mínimo positivo ${coverage.minimumPositive}`
  return `${coverage.minimum}; ${positive}; ${coverage.zeroCells} células com zero explícito`
}

const rows = candidates.map((candidate) => {
  const coverage = coverageFor(candidate)
  const years = coverage.years.length ? `${coverage.years[0]}–${coverage.years.at(-1)}` : 'não aferido; PostgreSQL local indisponível'
  const municipalities = coverage.municipalities === null ? 'não aferido' : String(coverage.municipalities)
  return {
    indicador_id: candidate.indicatorId,
    indicador: titles.get(candidate.indicatorId) ?? candidate.indicatorId,
    recorte: candidate.recorte,
    fonte: candidate.source,
    arquivo_tabela: candidate.table,
    caminho: candidate.publishedPath,
    campos: candidate.fields,
    ano_periodo: years,
    unidade: candidate.unit,
    numerador: candidate.numerator,
    denominador: candidate.denominator,
    cobertura_municipal: coverage.municipalities === null ? 'não aferida' : `${coverage.municipalities}/497`,
    municipios_com_dado: municipalities,
    tamanho_minimo_grupo: formatMinimum(coverage),
    tratamento_ausencia: missingRule,
    compatibilidade_indicador_principal: candidate.compatibility,
    benchmark_estadual: candidate.stateBenchmark,
    comparacao_pares: candidate.peers,
    risco_identificacao_instabilidade: candidate.risk,
    categoria_uso_recomendado: candidate.useCategory,
    uso_recomendado: candidate.use,
    status_p4b: candidate.p4b,
  }
})

const columns = Object.keys(rows[0])
const csvCell = (value) => {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\n')
fs.writeFileSync(path.join(root, 'docs', 'data', 'diagnostico_desigualdades_cobertura.csv'), `\ufeff${csv}\n`, 'utf8')

function association(sourceIndicatorId, targetIndicatorId, rationale) {
  const pairsByYear = new Map()
  for (const contract of diagnosticContracts) {
    const source = contract.indicators.find((indicator) => indicator.indicatorId === sourceIndicatorId)
    const target = contract.indicators.find((indicator) => indicator.indicatorId === targetIndicatorId)
    if (!Number.isFinite(source?.rawValue) || !Number.isFinite(target?.rawValue) || source.currentYear !== target.currentYear) continue
    const pairs = pairsByYear.get(source.currentYear) ?? []
    pairs.push([source.rawValue, target.rawValue])
    pairsByYear.set(source.currentYear, pairs)
  }
  const selected = [...pairsByYear.entries()]
    .sort((left, right) => right[1].length - left[1].length || right[0] - left[0])[0]
  const [selectedYear, pairs] = selected ?? [null, []]
  if (pairs.length < 20) return null
  const meanX = pairs.reduce((sum, pair) => sum + pair[0], 0) / pairs.length
  const meanY = pairs.reduce((sum, pair) => sum + pair[1], 0) / pairs.length
  const numerator = pairs.reduce((sum, pair) => sum + (pair[0] - meanX) * (pair[1] - meanY), 0)
  const denominator = Math.sqrt(
    pairs.reduce((sum, pair) => sum + (pair[0] - meanX) ** 2, 0)
    * pairs.reduce((sum, pair) => sum + (pair[1] - meanY) ** 2, 0),
  )
  const coefficient = denominator ? numerator / denominator : 0
  const absolute = Math.abs(coefficient)
  return {
    relationId: `${sourceIndicatorId}__${targetIndicatorId}__association`, sourceIndicatorId, targetIndicatorId,
    relationType: 'association', direction: coefficient < 0 ? 'negative' : 'positive', strength: absolute >= 0.7 ? 'strong' : absolute >= 0.4 ? 'moderate' : 'weak',
    evidence: { design: 'cross_sectional_municipal_pearson', coefficient: Number(coefficient.toFixed(4)), municipalityCount: pairs.length, year: selectedYear, generatedFrom: '/data/municipios/{id}/diagnostico.json' },
    basis: rationale,
    limits: 'Associação ecológica descritiva, sem ajuste de confundidores, sem temporalidade e sem interpretação causal; somente pares com o mesmo ano corrente foram usados.',
  }
}

const supported = [
  ['internet_alunos', 'internet', 'Acesso para alunos pressupõe escola declarada com internet.'],
  ['internet_aprendizagem', 'internet', 'Uso para aprendizagem pressupõe escola declarada com internet.'],
  ['internet_comunidade', 'internet', 'Oferta à comunidade pressupõe escola declarada com internet.'],
  ['acesso_internet_computador', 'internet', 'Acesso por computador pressupõe escola declarada com internet.'],
  ['acesso_internet_disp_pessoais', 'internet', 'Acesso por dispositivo pessoal pressupõe escola declarada com internet.'],
  ['rede_wireless', 'rede_local', 'Rede wireless é uma modalidade de rede local na operacionalização do Censo Escolar.'],
].map(([sourceIndicatorId, targetIndicatorId, basis]) => ({
  relationId: `${sourceIndicatorId}__${targetIndicatorId}__supported`, sourceIndicatorId, targetIndicatorId,
  relationType: 'supported', direction: 'positive_prerequisite', strength: 'definitional', basis,
  evidence: { design: 'shared_source_field_semantics', source: 'INEP — Censo Escolar', yearCompatibility: 'same_year_required' },
  limits: 'Relação de definição/pré-requisito no registro escolar; não prova efeito sobre aprendizagem ou atendimento.',
}))

const empirical = [
  association('internet', 'banda_larga', 'Coocorrência municipal entre disponibilidade de internet e banda larga.'),
  association('rede_local', 'banda_larga', 'Coocorrência municipal entre rede local e banda larga.'),
  association('desktop_aluno', 'comp_portatil_aluno', 'Composição municipal de equipamentos para estudantes.'),
  association('basico_integral', 'escolas_integral', 'Duas unidades distintas de oferta em tempo integral: matrículas e escolas.'),
  association('saeb_portugues_anos_iniciais', 'saeb_matematica_anos_iniciais', 'Resultados contemporâneos de duas disciplinas na mesma etapa.'),
  association('saeb_portugues_anos_finais', 'saeb_matematica_anos_finais', 'Resultados contemporâneos de duas disciplinas na mesma etapa.'),
  association('saeb_portugues_ensino_medio', 'saeb_matematica_ensino_medio', 'Resultados contemporâneos de duas disciplinas na mesma etapa.'),
  association('salas_acessiveis', 'salas_climatizadas', 'Duas dimensões contemporâneas da infraestrutura física municipal.'),
].filter(Boolean)

const hypotheses = [
  ['pos_graduacao', 'adequacao_ai', 'positive', 'Maior formação pós-graduada pode coexistir com melhor adequação docente, mas as definições não são equivalentes.'],
  ['pos_graduacao', 'adequacao_af', 'positive', 'Maior formação pós-graduada pode coexistir com melhor adequação docente, mas as definições não são equivalentes.'],
  ['temporarios', 'adequacao_ai', 'negative_or_ambiguous', 'Rotatividade contratual pode dificultar adequação, mas seleção e oferta local confundem a relação.'],
  ['temporarios', 'adequacao_af', 'negative_or_ambiguous', 'Rotatividade contratual pode dificultar adequação, mas seleção e oferta local confundem a relação.'],
  ['salas_acessiveis', 'aee', 'positive_or_ambiguous', 'Acessibilidade física e oferta de AEE podem refletir políticas inclusivas comuns, sem equivalência de público ou denominador.'],
  ['basico_integral', 'idade_regular_quinto', 'positive_or_ambiguous', 'Jornada integral pode estar associada à trajetória, mas seleção de alunos e contexto municipal impedem inferência causal.'],
  ['escolas_integral', 'idade_regular_nono', 'positive_or_ambiguous', 'Oferta escolar integral pode estar associada à trajetória, mas a unidade escola difere da unidade estudante.'],
  ['internet_aprendizagem', 'saeb_portugues_anos_iniciais', 'positive_or_ambiguous', 'Uso pedagógico de internet pode acompanhar capacidade escolar, sem evidência causal no painel atual.'],
  ['internet_aprendizagem', 'saeb_matematica_anos_iniciais', 'positive_or_ambiguous', 'Uso pedagógico de internet pode acompanhar capacidade escolar, sem evidência causal no painel atual.'],
  ['creche', 'pre_escola', 'positive_or_ambiguous', 'Capacidade local de oferta na educação infantil pode aparecer nas duas faixas, com denominadores populacionais distintos.'],
].map(([sourceIndicatorId, targetIndicatorId, direction, basis]) => ({
  relationId: `${sourceIndicatorId}__${targetIndicatorId}__hypothesis`, sourceIndicatorId, targetIndicatorId,
  relationType: 'hypothesis', direction, strength: 'not_estimated', basis,
  evidence: { design: 'conceptual_only', status: 'requires_pre_registered_analysis' },
  limits: 'Hipótese não testada; não usar para recomendação causal, prioridade, elegibilidade financeira ou alteração do P3-C.',
}))

const inputIndicators = new Set([
  'internet', 'internet_alunos', 'internet_aprendizagem', 'internet_comunidade', 'acesso_internet_computador',
  'acesso_internet_disp_pessoais', 'rede_local', 'rede_wireless', 'banda_larga', 'desktop_aluno',
  'comp_portatil_aluno', 'tablet_aluno', 'salas_climatizadas', 'salas_acessiveis', 'pos_graduacao', 'temporarios',
])
const capacityIndicators = new Set(['basico_integral', 'escolas_integral', 'aee', 'adequacao_ai', 'adequacao_af', 'adequacao_em'])
const coverageIndicators = new Set(['creche', 'pre_escola', 'basico_6_17'])
const indicatorStage = (indicatorId) => inputIndicators.has(indicatorId)
  ? 'input'
  : capacityIndicators.has(indicatorId)
    ? 'capacity_activity'
    : coverageIndicators.has(indicatorId)
      ? 'process_coverage'
      : 'result'
const normalizedRelations = [...supported, ...empirical, ...hypotheses].map((relation) => ({
  relationId: relation.relationId,
  sourceIndicatorId: relation.sourceIndicatorId,
  targetIndicatorId: relation.targetIndicatorId,
  sourceStage: indicatorStage(relation.sourceIndicatorId),
  targetStage: indicatorStage(relation.targetIndicatorId),
  relationType: relation.relationType,
  direction: relation.direction,
  strength: relation.strength,
  rationale: relation.basis,
  evidenceSource: relation.evidence.source ?? relation.evidence.generatedFrom ?? 'catálogo e fórmulas versionadas do diagnóstico municipal',
  evidenceDesign: relation.evidence.design,
  evidence: relation.evidence,
  applicableUniverses: relation.relationType === 'association'
    ? `municípios do RS com ambos os indicadores no ano ${relation.evidence.year}`
    : 'mesmo município, ano, universo e definição operacional declarada para ambos os indicadores',
  limitations: relation.limits,
  requiredData: relation.relationType === 'association'
    ? 'rawValue e currentYear dos dois indicadores; no mínimo 20 pares no mesmo ano; numeradores e denominadores para análise posterior'
    : relation.relationType === 'supported'
      ? 'campos brutos do Censo Escolar que sustentam a relação de definição, no mesmo ano e universo'
      : 'séries históricas, numeradores, denominadores, confundidores e desenho analítico pré-registrado em universos compatíveis',
  methodologyVersion: 'municipal-indicator-relations-p4a-v1',
}))

const relationCatalog = {
  catalogVersion: 'municipal-indicator-relations-p4a-v1',
  generatedAt: '2026-07-20',
  status: 'audit_only_not_consumed_by_p3c',
  semantics: {
    hypothesis: 'Relação plausível ainda não testada no painel.',
    association: 'Co-variação municipal descritiva no mesmo ano, sem inferência causal.',
    supported: 'Relação de definição ou pré-requisito sustentada pelos campos da fonte; não implica efeito causal.',
  },
  causalUseAllowed: false,
  relations: normalizedRelations,
}
fs.writeFileSync(path.join(root, 'src', 'data', 'diagnostic', 'indicatorRelations.json'), `${JSON.stringify(relationCatalog, null, 2)}\n`, 'utf8')

console.log(`[p4a] ${rows.length} combinações indicador × recorte; ${relationCatalog.relations.length} relações.`)
