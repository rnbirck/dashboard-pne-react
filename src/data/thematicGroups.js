export const THEMATIC_GROUPS = [
  {
    key: 'educacao_infantil',
    label: 'Educação Infantil',
    icon: 'EI',
    accent: '#f97316',
    indicatorKeys: ['creche', 'pre_escola'],
  },
  {
    key: 'ensino_fundamental',
    label: 'Ensino Fundamental',
    icon: 'EF',
    accent: '#2563eb',
    indicatorKeys: [
      'basico_6_17',
      'alfabetizacao',
      'ideb_anos_iniciais',
      'ideb_anos_finais',
      'saeb_matematica_anos_iniciais',
      'saeb_matematica_anos_finais',
      'saeb_portugues_anos_iniciais',
      'saeb_portugues_anos_finais',
      'idade_regular_quinto',
      'idade_regular_nono',
      'adequacao_ai',
      'adequacao_af',
      'ensino_fundamental_ou_completo_pop_6_14',
      'fundamental_concluido_18_mais',
      'fundamental_concluido_15_29',
    ],
  },
  {
    key: 'ensino_medio',
    label: 'Ensino Médio',
    icon: 'EM',
    accent: '#7c3aed',
    indicatorKeys: [
      'basico_15_17',
      'ensino_medio_ou_basica_completa_pop_15_17',
      'ideb_ensino_medio',
      'saeb_matematica_ensino_medio',
      'saeb_portugues_ensino_medio',
      'idade_regular_medio',
      'adequacao_em',
      'medio_tecnico_total',
      'medio_tecnico',
      'medio_tecnico_participacao_publica',
      'subsequente_expansao',
      'medio_concluido_18_mais',
      'medio_concluido_18_29',
    ],
  },
  {
    key: 'educacao_integral',
    label: 'Educação Integral',
    icon: 'IN',
    accent: '#16a34a',
    indicatorKeys: ['basico_integral', 'escolas_integral'],
  },
  {
    key: 'eja_educacao_profissional',
    label: 'EJA e Educação Profissional',
    icon: 'EP',
    accent: '#0891b2',
    indicatorKeys: [
      'eja_integrada_educacao_profissional',
      'medio_tecnico_total',
      'medio_tecnico',
      'medio_tecnico_participacao_publica',
      'subsequente_expansao',
      'alfabetizacao_pop_15_mais',
    ],
  },
  {
    key: 'educacao_especial',
    label: 'Educação Especial',
    icon: 'EE',
    accent: '#db2777',
    indicatorKeys: ['aee', 'salas_acessiveis'],
  },
  {
    key: 'ideb_saeb_fluxo',
    label: 'IDEB / SAEB e Fluxo Escolar',
    icon: 'IS',
    accent: '#4f46e5',
    indicatorKeys: [
      'alfabetizacao',
      'ideb_anos_iniciais',
      'ideb_anos_finais',
      'ideb_ensino_medio',
      'saeb_matematica_anos_iniciais',
      'saeb_matematica_anos_finais',
      'saeb_matematica_ensino_medio',
      'saeb_portugues_anos_iniciais',
      'saeb_portugues_anos_finais',
      'saeb_portugues_ensino_medio',
      'idade_regular_quinto',
      'idade_regular_nono',
      'idade_regular_medio',
    ],
  },
  {
    key: 'corpo_docente',
    label: 'Corpo Docente',
    icon: 'CD',
    accent: '#ca8a04',
    indicatorKeys: [
      'adequacao_ai',
      'adequacao_af',
      'adequacao_em',
      'pos_graduacao',
      'rendimento_magisterio',
      'temporarios',
    ],
  },
  {
    key: 'infraestrutura_tecnologia',
    label: 'Infraestrutura e Tecnologia',
    icon: 'IT',
    accent: '#059669',
    indicatorKeys: [
      'internet',
      'internet_alunos',
      'internet_aprendizagem',
      'internet_comunidade',
      'acesso_internet_computador',
      'acesso_internet_disp_pessoais',
      'rede_local',
      'rede_wireless',
      'banda_larga',
      'salas_climatizadas',
      'salas_acessiveis',
      'desktop_aluno',
      'comp_portatil_aluno',
      'tablet_aluno',
    ],
  },
  {
    key: 'gestao_ambiental',
    label: 'Gestão Escolar e Educação Ambiental',
    icon: 'GA',
    accent: '#65a30d',
    indicatorKeys: ['conselho_escolar', 'proposta_pedagogica', 'educacao_ambiental'],
  },
  {
    key: 'escolaridade_populacao',
    label: 'Escolaridade da População',
    icon: 'EP',
    accent: '#0f766e',
    indicatorKeys: [
      'alfabetizacao_pop_15_mais',
      'ensino_medio_ou_basica_completa_pop_15_17',
      'ensino_fundamental_ou_completo_pop_6_14',
      'escolaridade_media_18_29',
      'razao_escolaridade_racial_18_29',
      'fundamental_concluido_18_mais',
      'fundamental_concluido_15_29',
      'medio_concluido_18_mais',
      'medio_concluido_18_29',
    ],
  },
]

export function buildThematicGroups(categories) {
  const indicatorByKey = new Map()

  categories.forEach((category) => {
    ;(category.items ?? []).forEach((item) => {
      if (!indicatorByKey.has(item.key)) {
        indicatorByKey.set(item.key, item)
      }
    })
  })

  return THEMATIC_GROUPS.map((group) => ({
    ...group,
    items: group.indicatorKeys
      .map((indicatorKey) => indicatorByKey.get(indicatorKey))
      .filter(Boolean),
  })).filter((group) => group.items.length > 0)
}
