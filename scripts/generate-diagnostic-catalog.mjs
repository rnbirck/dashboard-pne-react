import fs from 'node:fs'

import { PNE_2026_LEGAL_GOAL_INDICATOR_MAP as legalMap } from '../src/data/pne2026LegalGoalIndicatorMap.js'

const outputPath = new URL('../src/data/diagnostic/indicatorCatalog.json', import.meta.url)
const basePath = new URL('../public/data/indicadores.json', import.meta.url)
const categories = JSON.parse(fs.readFileSync(basePath, 'utf8')).cycles.pne_2026_2036.categories

const relationsByIndicator = new Map()
for (const goal of legalMap) {
  for (const relation of goal.relatedIndicators) {
    const relations = relationsByIndicator.get(relation.indicatorId) ?? []
    relations.push({ legalGoalRef: goal.legalGoalId, ...relation })
    relationsByIndicator.set(relation.indicatorId, relations)
  }
}

const target = (legalGoalRef, value, year, direction = 'at_least', dimension = 'overall') => ({
  dimension,
  direction,
  legalGoalRef,
  validationStatus: 'official_law',
  value,
  year,
})

const saebTargets = (legalGoalRef, intermediateAdequate, finalAdequate) => [
  target(legalGoalRef, 100, 2031, 'at_least', 'basic_or_higher'),
  target(legalGoalRef, intermediateAdequate, 2031, 'at_least', 'adequate_or_higher'),
  target(legalGoalRef, 100, 2036, 'at_least', 'basic_or_higher'),
  target(legalGoalRef, finalAdequate, 2036, 'at_least', 'adequate_or_higher'),
]

const targets = {
  creche: [target('1.a', 60, 2036)],
  pre_escola: [target('1.c', 100, 2028)],
  alfabetizacao: [target('3.a', 80, 2031), target('3.a', 100, 2036)],
  basico_6_17: [target('4.a', 100, 2029)],
  basico_15_17: [target('4.a', 100, 2029)],
  idade_regular_quinto: [target('4.b', 100, 2036)],
  idade_regular_nono: [target('4.c', 95, 2036)],
  idade_regular_medio: [target('4.d', 90, 2036)],
  saeb_matematica_anos_iniciais: saebTargets('5.a', 70, 90),
  saeb_portugues_anos_iniciais: saebTargets('5.a', 70, 90),
  saeb_matematica_anos_finais: saebTargets('5.b', 60, 85),
  saeb_portugues_anos_finais: saebTargets('5.b', 60, 85),
  saeb_matematica_ensino_medio: saebTargets('5.d', 50, 80),
  saeb_portugues_ensino_medio: saebTargets('5.d', 50, 80),
  basico_integral: [target('6.a', 35, 2031), target('6.a', 50, 2036)],
  escolas_integral: [target('6.a', 50, 2031), target('6.a', 65, 2036)],
  educacao_ambiental: [target('8.c', 100, 2036)],
  aee: [target('10.b', 80, 2031), target('10.b', 100, 2036)],
  alfabetizacao_pop_15_mais: [target('11.a', 97, 2031), target('11.a', 100, 2036)],
  fundamental_concluido_18_mais: [target('11.b', 85, 2036)],
  fundamental_concluido_15_29: [target('11.b', 100, 2036)],
  medio_concluido_18_mais: [target('11.c', 75, 2036)],
  medio_concluido_18_29: [target('11.c', 100, 2036)],
  medio_tecnico_articulado_percentual: [target('12.a', 50, 2036)],
  medio_tecnico_participacao_publica: [target('12.a', 50, 2036)],
  subsequente_expansao: [target('12.b', 60, 2036)],
  eja_integrada_educacao_profissional_percentual: [target('12.c', 25, 2031), target('12.c', 50, 2036)],
  adequacao_ai: [target('17.a', 100, 2031)],
  adequacao_af: [target('17.a', 100, 2031)],
  adequacao_em: [target('17.a', 100, 2031)],
  rendimento_magisterio: [target('17.b', 100, 2036)],
  temporarios: [target('17.d', 30, 2031, 'at_most')],
  pos_graduacao: [target('17.f', 70, 2036)],
  conselho_escolar: [target('18.b', 100, 2036)],
  salas_acessiveis: [target('19.c', 100, 2029)],
  salas_climatizadas: [target('8.b', 100, 2036)],
}

const ratio = (numerator, denominator, territorialCut) => ({
  denominator,
  formula: `100 * sum(${numerator}) / denominator_aggregate(${denominator})`,
  numerator,
  territorialCut,
})

const attendanceTerritory = {
  denominator: 'população residente municipal',
  numerator: 'município da escola',
}

const formulas = {
  creche: ratio('mat_basico_0_3', 'pop_0_3', attendanceTerritory),
  pre_escola: ratio('mat_infantil_pre', 'pop_4_5', attendanceTerritory),
  basico_6_17: ratio('mat_basico_6_17', 'pop_6_17', attendanceTerritory),
  basico_15_17: ratio('mat_basico_15_17', 'pop_15_17', attendanceTerritory),
  basico_integral: ratio('mat_basico_integral', 'mat_basico'),
  escolas_integral: ratio('escolas_publicas_com_integral', 'escolas_publicas_total'),
  aee: ratio('quantidade_aee', 'total_turmas_educacao_especial'),
  eja_integrada_educacao_profissional_percentual: ratio('matrículas EJA articuladas à educação profissional', 'matrículas EJA elegíveis'),
  medio_tecnico_articulado_percentual: ratio('mat_integrado_total', 'mat_medio'),
  medio_tecnico_participacao_publica: {
    denominator: 'expansões anuais públicas e privadas positivas acumuladas',
    formula: '100 * expansão_pública_positiva_acumulada / expansão_total_positiva_acumulada',
    numerator: 'expansões anuais públicas positivas acumuladas',
  },
  subsequente_expansao: {
    denominator: 'matrículas subsequentes em 2015',
    formula: '100 * (matrículas_ano / matrículas_2015 - 1)',
    numerator: 'matrículas subsequentes no ano - matrículas no ano-base 2015',
  },
  alfabetizacao: {
    denominator: null,
    formula: 'média municipal de taxa_alfabetizacao da rede pública',
    numerator: null,
  },
  pos_graduacao: ratio('docentes_pos_graduacao', 'total_docentes'),
  temporarios: ratio('docentes_temporarios', 'total_docentes'),
  rendimento_magisterio: {
    denominator: 'rendimento bruto médio mensal de outros assalariados com nível superior',
    formula: '100 * rendimento_magistério / rendimento_outros',
    numerator: 'rendimento bruto médio mensal do magistério com nível superior',
  },
  alfabetizacao_pop_15_mais: ratio('alfabetizadas_15_mais', 'total_15_mais'),
  fundamental_concluido_18_mais: ratio('populacao_18_mais_ensino_fundamental_concluido', 'populacao_18_mais_total'),
  fundamental_concluido_15_29: ratio('populacao_15_29_ensino_fundamental_concluido', 'populacao_15_29_total'),
  medio_concluido_18_mais: ratio('populacao_18_mais_ensino_medio_concluido', 'populacao_18_mais_total'),
  medio_concluido_18_29: ratio('populacao_18_29_ensino_medio_concluido', 'populacao_18_29_total'),
}

const stageIndicators = {
  idade_regular_quinto: ['taxa_idade_regular', 'quinto_ano'],
  idade_regular_nono: ['taxa_idade_regular', 'nono_ano'],
  idade_regular_medio: ['taxa_idade_regular', 'ensino_medio'],
  adequacao_ai: ['percentual_adequacao', 'anos_iniciais'],
  adequacao_af: ['percentual_adequacao', 'anos_finais'],
  adequacao_em: ['percentual_adequacao', 'ensino_medio'],
}
for (const [indicatorId, [field, stage]] of Object.entries(stageIndicators)) {
  formulas[indicatorId] = { denominator: null, formula: `média municipal de ${field} para ${stage}`, numerator: null }
}

const saebIds = [
  'saeb_matematica_anos_iniciais', 'saeb_matematica_anos_finais', 'saeb_matematica_ensino_medio',
  'saeb_portugues_anos_iniciais', 'saeb_portugues_anos_finais', 'saeb_portugues_ensino_medio',
]
for (const indicatorId of saebIds) {
  formulas[indicatorId] = {
    denominator: 'estudantes participantes do SAEB no recorte',
    formula: 'soma das parcelas de proficiência classificadas no nível adequado ou superior',
    numerator: 'estudantes nos níveis adequado ou superior',
  }
}

const infrastructureColumns = {
  internet: ['escolas_com_internet', 'qntd_escolas'],
  internet_alunos: ['escolas_com_internet_alunos', 'qntd_escolas'],
  internet_aprendizagem: ['escolas_com_internet_aprendizagem', 'qntd_escolas'],
  internet_comunidade: ['escolas_com_internet_comunidade', 'qntd_escolas'],
  acesso_internet_computador: ['escolas_com_acesso_internet_computador', 'qntd_escolas'],
  acesso_internet_disp_pessoais: ['escolas_com_acesso_internet_disp_pessoais', 'qntd_escolas'],
  rede_local: ['escolas_com_rede_local', 'qntd_escolas'],
  rede_wireless: ['escolas_com_rede_wireless', 'qntd_escolas'],
  banda_larga: ['escolas_com_banda_larga', 'qntd_escolas'],
  educacao_ambiental: ['escolas_com_educacao_ambiental', 'qntd_escolas'],
  conselho_escolar: ['escolas_publicas_com_orgao_conselho_escolar', 'escolas_publicas_total'],
  proposta_pedagogica: ['escolas_publicas_com_proposta_pedagogica', 'escolas_publicas_total'],
  salas_climatizadas: ['qt_salas_utiliza_climatizadas', 'qt_salas_utilizadas'],
  salas_acessiveis: ['qt_salas_utilizadas_acessiveis', 'qt_salas_utilizadas'],
  desktop_aluno: ['escolas_com_desktop_aluno', 'qntd_escolas'],
  comp_portatil_aluno: ['escolas_com_comp_portatil_aluno', 'qntd_escolas'],
  tablet_aluno: ['escolas_com_tablet_aluno', 'qntd_escolas'],
}
for (const [indicatorId, [numerator, denominator]] of Object.entries(infrastructureColumns)) {
  formulas[indicatorId] = ratio(numerator, denominator)
}

const censusIds = new Set([
  'alfabetizacao_pop_15_mais', 'fundamental_concluido_18_mais', 'fundamental_concluido_15_29',
  'medio_concluido_18_mais', 'medio_concluido_18_29',
])
const informationalIds = new Set([
  'aee', 'internet', 'internet_alunos', 'internet_aprendizagem', 'internet_comunidade',
  'acesso_internet_computador', 'acesso_internet_disp_pessoais', 'rede_local', 'rede_wireless',
  'banda_larga', 'proposta_pedagogica', 'desktop_aluno', 'comp_portatil_aluno', 'tablet_aluno',
])
const publicIds = new Set(['basico_integral', 'escolas_integral', 'alfabetizacao', 'temporarios', 'conselho_escolar'])

function correspondence(indicatorId, relations) {
  if (indicatorId === 'medio_tecnico_articulado_percentual') return 'partial'
  if (relations.some((item) => item.coverage === 'direta')) return 'direct'
  if (relations.some((item) => item.coverage === 'parcial')) return 'partial'
  if (relations.length) return 'proxy'
  return 'informative'
}

function operationalizationStatus(indicatorId, legalCorrespondence) {
  if (indicatorId === 'basico_15_17') return 'methodologically_incompatible'
  if (indicatorId === 'alfabetizacao') return 'pending_official_definition'
  if (indicatorId === 'medio_tecnico_articulado_percentual') return 'partial'
  if (indicatorId === 'fundamental_concluido_18_mais' || indicatorId === 'aee') return 'proxy'
  if (saebIds.includes(indicatorId)) return 'partial'
  if (legalCorrespondence === 'informative') return 'informational'
  return legalCorrespondence
}

function valueDomainPolicy(indicatorId) {
  if (['creche', 'pre_escola', 'basico_6_17', 'basico_15_17'].includes(indicatorId)) {
    return 'allow_above_max_known_mixed_territorial_basis'
  }
  if (indicatorId === 'pos_graduacao') return 'unverifiable_above_max'
  return 'exclude_outside_declared_domain'
}

function sourceIds(indicatorId) {
  if (censusIds.has(indicatorId)) return ['ibge_censo_demografico_2010_2022']
  if (saebIds.includes(indicatorId)) return ['inep_saeb']
  if (indicatorId === 'rendimento_magisterio') return ['pipeline_rendimento_professores_provenance_pending']
  if (indicatorId === 'alfabetizacao') return ['pipeline_alfabetizacao_provenance_pending']
  if (['creche', 'pre_escola', 'basico_6_17', 'basico_15_17'].includes(indicatorId)) {
    return ['inep_censo_escolar', 'municipal_age_population_panel']
  }
  return ['inep_censo_escolar']
}

function limits(indicatorId, relations) {
  const values = relations.map((relation) => relation.relationNote).filter(Boolean)
  if (['creche', 'pre_escola', 'basico_6_17', 'basico_15_17'].includes(indicatorId)) {
    values.push('Indicador estimado com todas as matrículas localizadas no município e a população residente da faixa etária. Por mobilidade escolar e oferta regional, o resultado pode superar 100%.')
  }
  if (indicatorId === 'creche') values.push('Não mede demanda manifesta por vaga em creche.')
  if (indicatorId === 'basico_15_17') values.push('A implementação usa meta configurada de 85%, incompatível com a Meta 4.a vigente de universalização até o terceiro ano.')
  if (indicatorId === 'alfabetizacao') values.push('A implementação compara diretamente com 100% e omite o marco legal de 80% no quinto ano.')
  if (saebIds.includes(indicatorId)) values.push('A priorização usa apenas nível adequado e o marco intermediário; o nível básico e a meta final ficam fora do card principal.')
  if (indicatorId === 'aee') values.push('O denominador é total de turmas de educação especial, não o público do AEE; distância à meta está desabilitada.')
  if (indicatorId === 'medio_tecnico_articulado_percentual') values.push('O numerador principal contém somente matrículas integradas; concomitantes ficam como apoio, embora a Meta 12.a exija integrada ou concomitante.')
  if (indicatorId === 'fundamental_concluido_18_mais') values.push('Usa população de 18 anos ou mais; a Meta 11.b exige população de 15 anos ou mais.')
  if (Object.hasOwn(infrastructureColumns, indicatorId)) values.push('Resposta declaratória do Censo Escolar; não comprova qualidade, funcionamento ou suficiência.')
  if (!relations.length) values.push('Sem correspondência municipal explícita no mapa legal vigente da aplicação.')
  return [...new Set(values)]
}

const indicators = categories.flatMap((category) => category.items.map((item) => {
  const indicatorId = item.key
  const relations = relationsByIndicator.get(indicatorId) ?? []
  const formula = formulas[indicatorId] ?? { denominator: null, formula: 'fórmula não localizada na auditoria', numerator: null }
  const mappedCorrespondence = correspondence(indicatorId, relations)
  const legalCorrespondence = mappedCorrespondence === 'informative'
    ? 'informational'
    : mappedCorrespondence
  return {
    administrativeDependence: [publicIds.has(indicatorId) ? 'public' : 'all'],
    category: category.key,
    correspondence: legalCorrespondence,
    legalCorrespondence,
    legalTextValidated: relations.length > 0,
    legalValidation: {
      validatedAt: '2026-07-19',
      lawVersion: 'Lei nº 15.388/2026 — texto vigente em 2026-07-19',
      source: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15388.htm',
      validationId: 'pne-law-15388-2026-validation-v1',
    },
    operationalizationStatus: operationalizationStatus(indicatorId, legalCorrespondence),
    currentImplementation: {
      legalTextCheckedAt: '2026-07-19',
      officialInepPerEntityDefinitionStatus: 'pending_within_180_day_legal_window',
      tracksGoal: Boolean(targets[indicatorId]?.length) && !informationalIds.has(indicatorId),
    },
    denominator: formula.denominator,
    direction: targets[indicatorId]?.[0]?.direction ?? null,
    finality: informationalIds.has(indicatorId) ? 'context' : 'goal_monitoring',
    formula: formula.formula,
    indicatorId,
    legalGoalRefs: [...new Set(relations.map((relation) => relation.legalGoalRef))],
    limits: limits(indicatorId, relations),
    name: item.label,
    numerator: formula.numerator,
    periodicity: censusIds.has(indicatorId) ? 'decenal/irregular' : saebIds.includes(indicatorId) ? 'bienal' : 'anual',
    sourceIds: sourceIds(indicatorId),
    targets: targets[indicatorId] ?? [],
    territorialCut: formula.territorialCut ?? {
      denominator: censusIds.has(indicatorId) ? 'população residente' : 'mesmo recorte declarado, salvo indicadores de atendimento',
      numerator: censusIds.has(indicatorId) ? 'população residente' : 'município da escola ou recorte municipal da fonte',
    },
    unit: 'percent',
    validRange: { maximum: indicatorId === 'medio_tecnico_articulado_percentual' ? null : 100, minimum: 0 },
    valueDomainPolicy: valueDomainPolicy(indicatorId),
    displayPolicy: ['creche', 'pre_escola', 'basico_6_17', 'basico_15_17'].includes(indicatorId)
      ? 'preserve_raw_value'
      : 'cap_to_declared_range_for_display_only',
    configuredReferenceRole: indicatorId === 'basico_15_17'
      ? 'legacy_reference_not_legal_target'
      : targets[indicatorId]?.length
        ? 'quantitative_reference'
        : 'not_applicable',
  }
}))

const catalog = {
  catalogVersion: 'municipal-diagnostic-indicators-v2',
  caveat: 'Catálogo canônico P0/P1. Não substitui os indicadores e projeções por ente que o Inep deve estabelecer nos 180 dias da Lei 15.388/2026.',
  generatedAt: '2026-07-19',
  generatedFrom: 'public/data/indicadores.json + regras P0/P1 do pipeline + Lei 15.388/2026',
  indicatorCount: indicators.length,
  legalTextValidation: {
    validatedGoalTexts: 73,
    totalGoalTexts: 73,
    validatedAt: '2026-07-19',
    lawVersion: 'Lei nº 15.388/2026 — texto vigente em 2026-07-19',
    source: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15388.htm',
    validationId: 'pne-law-15388-2026-validation-v1',
  },
  indicators,
}

fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
