import { PNE_2026_GOAL_TEXTS } from './pne2026GoalTexts.js'

const NO_MUNICIPAL_INDICATOR_REASON =
  'Sem indicador municipal disponível atualmente na plataforma.'

const OFFICIAL_LAW_URL =
  'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15388.htm'

export const PNE_2026_LEGAL_GOAL_MAPPING_METADATA = {
  law: 'Lei nº 15.388/2026',
  officialLawUrl: OFFICIAL_LAW_URL,
  totalLegalGoals: 73,
  validatedAgainstOfficialLaw: false,
  validationNote:
    'A estrutura local possui 73 metas com originalText, mas a comparacao linha a linha com a fonte oficial ainda precisa de revisao humana.',
}

const indicator = (
  indicatorId,
  coverage,
  relationNote,
  {
    hasMunicipalResult = true,
    hasDistance = true,
    hasProjection2036 = false,
  } = {},
) => ({
  indicatorId,
  coverage,
  relationNote,
  hasMunicipalResult,
  hasDistance,
  hasProjection2036,
})

const LEGAL_GOAL_RELATIONS = {
  '1.a': {
    relatedIndicators: [
      indicator(
        'creche',
        'parcial',
        'Acompanha a cobertura da populacao de 0 a 3 anos que frequenta escola/creche; nao mede demanda manifesta por vaga em creche.',
        { hasProjection2036: true },
      ),
    ],
  },
  '1.c': {
    relatedIndicators: [
      indicator(
        'pre_escola',
        'direta',
        'Acompanha a populacao de 4 a 5 anos que frequenta escola/creche, alinhada a universalizacao da pre-escola.',
        { hasProjection2036: true },
      ),
    ],
  },
  '3.a': {
    relatedIndicators: [
      indicator(
        'alfabetizacao',
        'direta',
        'Acompanha estudantes alfabetizados na rede publica, usado como referencia municipal para alfabetizacao.',
      ),
    ],
  },
  '4.a': {
    relatedIndicators: [
      indicator(
        'basico_6_17',
        'direta',
        'Acompanha a frequencia a educacao basica da populacao de 6 a 17 anos.',
        { hasProjection2036: true },
      ),
      indicator(
        'basico_15_17',
        'parcial',
        'Acompanha apenas o recorte de 15 a 17 anos, com frequencia escolar ou conclusao da educacao basica.',
        { hasProjection2036: true },
      ),
    ],
  },
  '4.b': {
    relatedIndicators: [
      indicator(
        'idade_regular_quinto',
        'direta',
        'Acompanha a conclusao dos anos iniciais do ensino fundamental na idade regular.',
      ),
    ],
  },
  '4.c': {
    relatedIndicators: [
      indicator(
        'idade_regular_nono',
        'direta',
        'Acompanha a conclusao dos anos finais do ensino fundamental na idade regular.',
      ),
    ],
  },
  '4.d': {
    relatedIndicators: [
      indicator(
        'idade_regular_medio',
        'direta',
        'Acompanha a conclusao do ensino medio na idade regular.',
      ),
    ],
  },
  '5.a': {
    relatedIndicators: [
      indicator(
        'saeb_matematica_anos_iniciais',
        'parcial',
        'Acompanha aprendizagem em Matematica nos anos iniciais; nao cobre sozinho todas as dimensoes da meta.',
      ),
      indicator(
        'saeb_portugues_anos_iniciais',
        'parcial',
        'Acompanha aprendizagem em Portugues nos anos iniciais; nao cobre sozinho todas as dimensoes da meta.',
      ),
    ],
  },
  '5.b': {
    relatedIndicators: [
      indicator(
        'saeb_matematica_anos_finais',
        'parcial',
        'Acompanha aprendizagem em Matematica nos anos finais; nao cobre sozinho todas as dimensoes da meta.',
      ),
      indicator(
        'saeb_portugues_anos_finais',
        'parcial',
        'Acompanha aprendizagem em Portugues nos anos finais; nao cobre sozinho todas as dimensoes da meta.',
      ),
    ],
  },
  '5.d': {
    relatedIndicators: [
      indicator(
        'saeb_matematica_ensino_medio',
        'parcial',
        'Acompanha aprendizagem em Matematica no ensino medio; nao cobre sozinho todas as dimensoes da meta.',
      ),
      indicator(
        'saeb_portugues_ensino_medio',
        'parcial',
        'Acompanha aprendizagem em Portugues no ensino medio; nao cobre sozinho todas as dimensoes da meta.',
      ),
    ],
  },
  '6.a': {
    relatedIndicators: [
      indicator(
        'basico_integral',
        'parcial',
        'Acompanha a parcela de estudantes da educacao basica publica em jornada integral.',
      ),
      indicator(
        'escolas_integral',
        'parcial',
        'Acompanha a parcela de escolas publicas com alunos em jornada de tempo integral.',
      ),
    ],
  },
  '7.a': {
    relatedIndicators: [
      indicator(
        'internet',
        'aproximada',
        'Indica acesso a internet nas escolas, mas nao mede alta velocidade, uso pedagogico ou redes internas wi-fi.',
        { hasDistance: false },
      ),
      indicator(
        'internet_alunos',
        'aproximada',
        'Indica disponibilidade de internet para alunos, mas nao mede alta velocidade ou adequacao pedagogica.',
        { hasDistance: false },
      ),
      indicator(
        'internet_aprendizagem',
        'parcial',
        'Acompanha uso da internet em processos de ensino e aprendizagem, uma parte da meta de conectividade pedagogica.',
        { hasDistance: false },
      ),
      indicator(
        'rede_local',
        'aproximada',
        'Indica existencia de rede local de computadores, mas nao mede rede interna wi-fi nem qualidade da conectividade.',
        { hasDistance: false },
      ),
      indicator(
        'rede_wireless',
        'parcial',
        'Acompanha rede local sem fio, componente da meta de redes internas wi-fi.',
      ),
      indicator(
        'banda_larga',
        'parcial',
        'Acompanha oferta de internet banda larga, componente da conectividade de alta velocidade.',
      ),
    ],
  },
  '8.b': {
    relatedIndicators: [
      indicator(
        'salas_climatizadas',
        'parcial',
        'Acompanha salas de aula climatizadas; nao mede integralmente conforto termico de todos os estabelecimentos.',
      ),
    ],
  },
  '8.c': {
    relatedIndicators: [
      indicator(
        'educacao_ambiental',
        'direta',
        'Acompanha escolas que promovem educacao ambiental.',
      ),
    ],
  },
  '10.b': {
    relatedIndicators: [
      indicator(
        'aee',
        'parcial',
        'Acompanha oferta de AEE e salas de recursos em relacao ao total da educacao especial; nao mede todo o publico do AEE.',
      ),
    ],
  },
  '11.a': {
    relatedIndicators: [
      indicator(
        'alfabetizacao_pop_15_mais',
        'direta',
        'Acompanha a taxa de alfabetizacao da populacao de 15 anos ou mais.',
      ),
    ],
  },
  '11.b': {
    relatedIndicators: [
      indicator(
        'fundamental_concluido_18_mais',
        'parcial',
        'Acompanha populacao de 18 anos ou mais com ensino fundamental concluido; a meta legal usa populacao de 15 anos ou mais.',
      ),
      indicator(
        'fundamental_concluido_15_29',
        'direta',
        'Acompanha a conclusao do ensino fundamental na populacao de 15 a 29 anos.',
      ),
    ],
  },
  '11.c': {
    relatedIndicators: [
      indicator(
        'medio_concluido_18_mais',
        'direta',
        'Acompanha a populacao de 18 anos ou mais com ensino medio concluido.',
      ),
      indicator(
        'medio_concluido_18_29',
        'direta',
        'Acompanha a conclusao do ensino medio na populacao de 18 a 29 anos.',
      ),
    ],
  },
  '12.a': {
    relatedIndicators: [
      indicator(
        'medio_tecnico',
        'parcial',
        'Acompanha a participacao de matriculas do ensino medio articuladas a educacao profissional tecnica; nao mede qualidade nem permanencia.',
      ),
      indicator(
        'medio_tecnico_participacao_publica',
        'parcial',
        'Acompanha a participacao publica na expansao da EPT de nivel medio, uma parte da meta legal.',
      ),
    ],
  },
  '12.b': {
    relatedIndicators: [
      indicator(
        'subsequente_expansao',
        'parcial',
        'Acompanha expansao acumulada dos cursos tecnicos subsequentes; nao mede qualidade nem permanencia.',
      ),
    ],
  },
  '12.c': {
    relatedIndicators: [
      indicator(
        'eja_integrada_educacao_profissional',
        'aproximada',
        'Mostra o numero de matriculas da EJA integrada a educacao profissional, mas nao calcula a proporcao exigida pela meta.',
        { hasDistance: false },
      ),
    ],
  },
  '17.a': {
    relatedIndicators: [
      indicator(
        'adequacao_ai',
        'parcial',
        'Acompanha formacao adequada nos anos iniciais; cobre apenas um recorte da meta de formacao docente.',
      ),
      indicator(
        'adequacao_af',
        'parcial',
        'Acompanha formacao adequada nos anos finais; cobre apenas um recorte da meta de formacao docente.',
      ),
      indicator(
        'adequacao_em',
        'parcial',
        'Acompanha formacao adequada no ensino medio; cobre apenas um recorte da meta de formacao docente.',
      ),
    ],
  },
  '17.b': {
    relatedIndicators: [
      indicator(
        'rendimento_magisterio',
        'parcial',
        'Acompanha a relacao remuneratoria do magisterio frente a outros profissionais com nivel superior, sem detalhar cada etapa da educacao basica.',
      ),
    ],
  },
  '17.d': {
    relatedIndicators: [
      indicator(
        'temporarios',
        'direta',
        'Acompanha o percentual de docentes da rede publica com vinculo temporario, com meta maxima de 30%.',
      ),
    ],
  },
  '17.f': {
    relatedIndicators: [
      indicator(
        'pos_graduacao',
        'direta',
        'Acompanha docentes da educacao basica com pos-graduacao.',
      ),
    ],
  },
  '18.b': {
    relatedIndicators: [
      indicator(
        'conselho_escolar',
        'direta',
        'Acompanha escolas publicas da educacao basica com conselho escolar instituido e em funcionamento.',
      ),
    ],
  },
  '19.c': {
    relatedIndicators: [
      indicator(
        'salas_acessiveis',
        'parcial',
        'Acompanha acessibilidade em salas de aula, apenas uma dimensao das condicoes minimas de infraestrutura.',
      ),
    ],
  },
}

export const PNE_2026_LEGAL_GOAL_INDICATOR_MAP = Object.entries(PNE_2026_GOAL_TEXTS).map(
  ([legalGoalId, goal]) => {
    const relation = LEGAL_GOAL_RELATIONS[legalGoalId] ?? {}

    return {
      legalGoalId,
      objectiveId: extractObjectiveId(goal.objective),
      legalText: goal.originalText,
      relatedIndicators: relation.relatedIndicators ?? [],
      noMunicipalIndicatorReason:
        relation.relatedIndicators?.length > 0
          ? null
          : relation.noMunicipalIndicatorReason ?? NO_MUNICIPAL_INDICATOR_REASON,
    }
  },
)

export function getPne2026LegalGoalById(legalGoalId) {
  return (
    PNE_2026_LEGAL_GOAL_INDICATOR_MAP.find((goal) => goal.legalGoalId === legalGoalId) ??
    null
  )
}

export function getPne2026LegalGoalsByIndicatorId(indicatorId) {
  return PNE_2026_LEGAL_GOAL_INDICATOR_MAP.filter((goal) =>
    goal.relatedIndicators.some((indicatorItem) => indicatorItem.indicatorId === indicatorId),
  )
}

export function getPne2026LegalGoalCoverageSummary(goals = PNE_2026_LEGAL_GOAL_INDICATOR_MAP) {
  return goals.reduce(
    (summary, goal) => {
      const coverageTypes = new Set(
        goal.relatedIndicators.map((indicatorItem) => indicatorItem.coverage),
      )

      summary.total += 1

      if (coverageTypes.has('direta')) {
        summary.withDirectIndicator += 1
      } else if (coverageTypes.has('parcial') || coverageTypes.has('aproximada')) {
        summary.withPartialOrApproximateIndicator += 1
      } else {
        summary.withoutMunicipalIndicator += 1
      }

      return summary
    },
    {
      total: 0,
      withDirectIndicator: 0,
      withPartialOrApproximateIndicator: 0,
      withoutMunicipalIndicator: 0,
    },
  )
}

function extractObjectiveId(objective) {
  const match = String(objective ?? '').match(/\d+/)
  return match ? match[0] : ''
}
