const SOURCE_CENSO_ESCOLAR = 'Censo Escolar / Sinopse Estatística da Educação Básica — INEP'
const SOURCE_POPULATION_ATTENDANCE = 'Censo Escolar — INEP; Estimativas Populacionais — IBGE'
const SOURCE_EDUCATIONAL_INDICATORS = 'Indicadores Educacionais — INEP'
const SOURCE_IDEB_SAEB = 'IDEB / SAEB — INEP'
const SOURCE_FUNDEB = 'SIOPE / FNDE'
const SOURCE_CENSO_DEMOGRAFICO = 'Censo Demográfico — IBGE'

const EDUCATION_THEME_SOURCES = {
  aprendizagem: SOURCE_IDEB_SAEB,
  fluxo: SOURCE_EDUCATIONAL_INDICATORS,
  matriculas: SOURCE_CENSO_ESCOLAR,
  oferta: SOURCE_CENSO_ESCOLAR,
  rede: SOURCE_CENSO_ESCOLAR,
  sistema_s: SOURCE_CENSO_ESCOLAR,
  turmas: SOURCE_CENSO_ESCOLAR,
}

const POPULATION_ATTENDANCE_KEYS = new Set([
  'basico_15_17',
  'basico_6_17',
  'creche',
  'pre_escola',
])

const CENSO_ESCOLAR_KEYS = new Set([
  'aee',
  'adequacao_af',
  'adequacao_ai',
  'adequacao_em',
  'basico_integral',
  'conselho_escolar',
  'desktop_aluno',
  'eja_integrada_educacao_profissional',
  'escolas_integral',
  'internet',
  'internet_alunos',
  'internet_aprendizagem',
  'medio_tecnico',
  'medio_tecnico_participacao_publica',
  'medio_tecnico_total',
  'pos_graduacao',
  'proposta_pedagogica',
  'rede_local',
  'rede_wireless',
  'salas_acessiveis',
  'salas_climatizadas',
  'subsequente_expansao',
  'tablet_aluno',
  'temporarios',
])

export function getDataSourceNote(context = {}) {
  const block = normalize(context.block ?? context.bloco)
  const theme = normalize(context.themeKey ?? context.theme ?? context.section ?? context.tema)
  const indicatorKey = normalize(context.indicatorKey ?? context.key)
  const detailType = normalize(context.detailType ?? context.type)
  const text = normalize([
    context.indicatorName,
    context.label,
    context.title,
    context.description,
    context.subtitle,
    context.item?.label,
    context.item?.desc,
    context.item?.sub,
    context.details?.title,
    context.details?.subtitle,
    context.details?.source,
    context.details?.fonte,
    context.details?.methodology,
    context.details?.description,
    context.details?.calculation?.source,
    context.result?.source,
    context.result?.fonte,
    context.source,
    context.fonte,
    detailType,
  ].filter(Boolean).join(' '))

  if (block === 'fundeb' || theme === 'fundeb') {
    return SOURCE_FUNDEB
  }

  if (POPULATION_ATTENDANCE_KEYS.has(indicatorKey)) {
    return SOURCE_POPULATION_ATTENDANCE
  }

  if (isCensoDemografico(indicatorKey, text)) {
    return SOURCE_CENSO_DEMOGRAFICO
  }

  if (isIdebSaeb(indicatorKey, text)) {
    return SOURCE_IDEB_SAEB
  }

  if (isEducationalIndicators(indicatorKey, text)) {
    return SOURCE_EDUCATIONAL_INDICATORS
  }

  if (CENSO_ESCOLAR_KEYS.has(indicatorKey) || isCensoEscolarText(text)) {
    return SOURCE_CENSO_ESCOLAR
  }

  const declaredSource = sourceFromDeclaredMetadata(context, text)
  if (declaredSource) return declaredSource

  if (block === 'educacao' && EDUCATION_THEME_SOURCES[theme]) {
    return EDUCATION_THEME_SOURCES[theme]
  }

  return ''
}

function sourceFromDeclaredMetadata(context, normalizedText) {
  const fontes = Array.isArray(context.fontes) ? context.fontes : []
  const sourceNames = fontes
    .map((fonte) => normalize(fonte?.nome ?? fonte))
    .filter(Boolean)

  const combined = [normalizedText, ...sourceNames].join(' ')

  if (combined.includes('siope') || combined.includes('fnde')) {
    return SOURCE_FUNDEB
  }
  if (combined.includes('saeb') || combined.includes('ideb')) {
    return SOURCE_IDEB_SAEB
  }
  if (
    combined.includes('taxas de rendimento') ||
    combined.includes('rendimento escolar') ||
    combined.includes('distorcao idade serie') ||
    combined.includes('distorcao idade-serie') ||
    combined.includes('indicadores educacionais')
  ) {
    return SOURCE_EDUCATIONAL_INDICATORS
  }
  if (combined.includes('censo escolar') || combined.includes('sinopse estatistica')) {
    return SOURCE_CENSO_ESCOLAR
  }

  return ''
}

function isIdebSaeb(indicatorKey, text) {
  return (
    indicatorKey.includes('ideb') ||
    indicatorKey.includes('saeb') ||
    text.includes('ideb') ||
    text.includes('saeb') ||
    text.includes('aprendizagem')
  )
}

function isEducationalIndicators(indicatorKey, text) {
  return (
    indicatorKey.includes('aprovacao') ||
    indicatorKey.includes('reprovacao') ||
    indicatorKey.includes('abandono') ||
    indicatorKey.includes('distorcao') ||
    indicatorKey.includes('fluxo') ||
    indicatorKey.includes('idade_regular') ||
    text.includes('aprovacao') ||
    text.includes('reprovacao') ||
    text.includes('abandono') ||
    text.includes('distorcao idade') ||
    text.includes('fluxo escolar')
  )
}

function isCensoEscolarText(text) {
  return (
    text.includes('matricula') ||
    text.includes('escola') ||
    text.includes('turma') ||
    text.includes('docente') ||
    text.includes('etapa') ||
    text.includes('rede') ||
    text.includes('localizacao') ||
    text.includes('tempo integral') ||
    text.includes('zona rural') ||
    text.includes('oferta tecnica') ||
    text.includes('educacao profissional') ||
    text.includes('censo escolar') ||
    text.includes('sinopse estatistica')
  )
}

function isCensoDemografico(indicatorKey, text) {
  const CENSO_DEMOGRAFICO_KEYS = new Set([
    'alfabetizacao_pop_15_mais',
    'fundamental_concluido_18_mais',
    'fundamental_concluido_15_29',
    'medio_concluido_18_mais',
    'medio_concluido_18_29',
    'escolaridade_media_18_29',
    'razao_escolaridade_racial_18_29',
    'ensino_medio_ou_basica_completa_pop_15_17',
    'ensino_fundamental_ou_completo_pop_6_14',
  ])

  if (CENSO_DEMOGRAFICO_KEYS.has(indicatorKey)) return true

  return (
    text.includes('censo demografico') ||
    text.includes('censos demograficos') ||
    text.includes('populacao de 18 anos ou mais') ||
    text.includes('populacao de 15 a 29 anos') ||
    text.includes('ensino medio concluido') ||
    text.includes('ensino fundamental concluido')
  )
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}
