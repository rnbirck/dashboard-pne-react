const MISSING_POLICY = 'null-is-missing-zero-is-value'

export const EDUCATION_SECTION_KEYS = Object.freeze({
  overview: 'visao-geral',
  attendance: 'atendimento',
  trajectory: 'trajetoria',
  professionals: 'profissionais',
  infrastructure: 'infraestrutura',
  modalities: 'modalidades',
  demand: 'demanda',
  methodology: 'metodologia',
})

export const EDUCATION_SECTION_LABELS = Object.freeze({
  [EDUCATION_SECTION_KEYS.overview]: 'Visão geral',
  [EDUCATION_SECTION_KEYS.attendance]: 'Atendimento e oferta',
  [EDUCATION_SECTION_KEYS.trajectory]: 'Trajetória escolar e aprendizagem',
  [EDUCATION_SECTION_KEYS.professionals]: 'Profissionais da educação',
  [EDUCATION_SECTION_KEYS.infrastructure]: 'Infraestrutura e condições de oferta',
  [EDUCATION_SECTION_KEYS.modalities]: 'Modalidades, inclusão e territórios',
  [EDUCATION_SECTION_KEYS.demand]: 'Cenários de atendimento escolar',
  [EDUCATION_SECTION_KEYS.methodology]: 'Metodologia e fontes',
})

const EDUCATION_SECTION_DESCRIPTIONS = Object.freeze({
  [EDUCATION_SECTION_KEYS.overview]: 'Síntese dos principais dados disponíveis para o município.',
  [EDUCATION_SECTION_KEYS.attendance]: 'Matrículas, escolas e atendimento por etapa e rede.',
  [EDUCATION_SECTION_KEYS.trajectory]: 'Fluxo escolar, aprendizagem e contexto educacional.',
  [EDUCATION_SECTION_KEYS.professionals]: 'Docentes vinculados às diferentes etapas e modalidades.',
  [EDUCATION_SECTION_KEYS.infrastructure]: 'Condições físicas, conectividade e recursos de oferta.',
  [EDUCATION_SECTION_KEYS.modalities]: 'EJA, educação profissional, inclusão e recortes territoriais.',
  [EDUCATION_SECTION_KEYS.demand]: 'Evolução observada e trajetórias futuras calculadas para indicadores de cobertura e tempo integral.',
  [EDUCATION_SECTION_KEYS.methodology]: 'Fontes, períodos, recortes e limitações dos indicadores.',
})

const overview = EDUCATION_SECTION_KEYS.overview
const attendance = EDUCATION_SECTION_KEYS.attendance
const trajectory = EDUCATION_SECTION_KEYS.trajectory
const professionals = EDUCATION_SECTION_KEYS.professionals
const infrastructure = EDUCATION_SECTION_KEYS.infrastructure
const modalities = EDUCATION_SECTION_KEYS.modalities

const EDUCATION_DEMAND_INDICATOR_CATALOG = Object.freeze([
  {
    key: 'creche',
    title: 'Atendimento em creche',
    ageRange: '0 a 3 anos',
    populationLabel: 'População de 0 a 3 anos',
    source: 'Censo Escolar — INEP; Estimativas Populacionais — IBGE',
  },
  {
    key: 'pre_escola',
    title: 'Atendimento na pré-escola',
    ageRange: '4 a 5 anos',
    populationLabel: 'População de 4 a 5 anos',
    source: 'Censo Escolar — INEP; Estimativas Populacionais — IBGE',
  },
  {
    key: 'basico_6_17',
    title: 'Atendimento na educação básica',
    ageRange: '6 a 17 anos',
    populationLabel: 'População de 6 a 17 anos',
    source: 'Censo Escolar — INEP; Estimativas Populacionais — IBGE',
  },
  {
    key: 'basico_15_17',
    title: 'Atendimento de adolescentes na educação básica',
    ageRange: '15 a 17 anos',
    populationLabel: 'População de 15 a 17 anos',
    source: 'Censo Escolar — INEP; Estimativas Populacionais — IBGE',
  },
])

const SECTION_GROUP_DEFINITIONS = Object.freeze({
  [attendance]: [
    { key: 'matriculas-atendimento', label: 'Matrículas e atendimento', description: 'Matrículas observadas, tempo integral e redes de atendimento.' },
    {
      key: 'oferta-etapa',
      label: 'Oferta por etapa',
      description: 'Escolas e matrículas organizadas por etapa e modalidade da educação básica.',
      indicatorKeys: Object.freeze([
        'mat-infantil',
        'mat-fundamental',
        'mat-medio',
        'mat-eja',
        'mat-profissional',
        'rede-infantil',
        'rede-fundamental',
        'rede-medio',
        'rede-eja',
        'rede-profissional',
      ]),
    },
    { key: 'redes-ensino', label: 'Redes de ensino', description: 'Distribuição da oferta entre dependências administrativas.' },
  ],
  [trajectory]: [
    { key: 'fluxo-escolar', label: 'Fluxo escolar', description: 'Aprovação, reprovação, abandono e distorção idade-série.' },
    { key: 'aprendizagem', label: 'Aprendizagem', description: 'IDEB, SAEB e alfabetização.' },
    { key: 'contexto-educacional', label: 'Contexto educacional', description: 'Indicadores de contexto socioeconômico.' },
  ],
  [professionals]: [
    { key: 'docentes', label: 'Docentes', description: 'Docentes registrados por etapa e modalidade.' },
    { key: 'organizacao-turmas', label: 'Organização das turmas', description: 'Média de alunos por turma e série.' },
  ],
  [infrastructure]: [
    { key: 'rede-escolar', label: 'Rede escolar', description: 'Condições gerais das escolas e da oferta.' },
    { key: 'infraestrutura-fisica', label: 'Infraestrutura física', description: 'Ambiente físico e condições estruturais das escolas.' },
    { key: 'conectividade', label: 'Conectividade', description: 'Internet, redes locais e acesso para aprendizagem.' },
    { key: 'equipamentos-recursos', label: 'Equipamentos e recursos pedagógicos', description: 'Dispositivos e recursos disponíveis para os alunos.' },
  ],
  [modalities]: [
    { key: 'eja', label: 'Educação de Jovens e Adultos', description: 'Matrículas e escolas da EJA e sua integração profissional.' },
    { key: 'profissional-tecnologica', label: 'Educação profissional e tecnológica', description: 'Oferta técnica, profissional e suas matrículas.' },
    { key: 'inclusao', label: 'Inclusão', description: 'Atendimento educacional especializado e salas de recursos.' },
    { key: 'territorios', label: 'Territórios', description: 'Recortes territoriais disponíveis nos dados educacionais.' },
    { key: 'sistema-s', label: 'Sistema S', description: 'Oferta do Sistema S quando houver dados disponíveis.', special: 'sistemaS' },
  ],
})

const INDICATOR_GROUP_KEYS = Object.freeze({
  'mat-total': 'matriculas-atendimento',
  'mat-infantil': 'oferta-etapa',
  'mat-fundamental': 'oferta-etapa',
  'mat-medio': 'oferta-etapa',
  'mat-eja': 'eja',
  'mat-profissional': 'profissional-tecnologica',
  'mat-integral': 'matriculas-atendimento',
  'mat-rural': 'territorios',
  'mat-publica': 'redes-ensino',
  'mat-privada': 'redes-ensino',
  'rede-total': 'redes-ensino',
  'rede-infantil': 'oferta-etapa',
  'rede-fundamental': 'oferta-etapa',
  'rede-medio': 'oferta-etapa',
  'rede-eja': 'eja',
  'rede-profissional': 'profissional-tecnologica',
  'rede-infraestrutura': 'rede-escolar',
  'alunos-turma-infantil': 'organizacao-turmas',
  'alunos-turma-fundamental': 'organizacao-turmas',
  'alunos-turma-medio': 'organizacao-turmas',
  'docentes-total': 'docentes',
  'docentes-infantil': 'docentes',
  'docentes-fundamental': 'docentes',
  'docentes-medio': 'docentes',
  'docentes-eja': 'docentes',
  'docentes-profissional': 'docentes',
  'fluxo-aprovacao': 'fluxo-escolar',
  'fluxo-aprovacao-medio': 'fluxo-escolar',
  'fluxo-reprovacao': 'fluxo-escolar',
  'fluxo-abandono': 'fluxo-escolar',
  'fluxo-distorcao': 'fluxo-escolar',
  'apr-ideb': 'aprendizagem',
  'apr-saeb-lp': 'aprendizagem',
  'apr-saeb-mt': 'aprendizagem',
  'apr-alfabetizacao': 'aprendizagem',
  'apr-inse': 'contexto-educacional',
  'oferta-total': 'profissional-tecnologica',
  aee: 'inclusao',
  eja_integrada_educacao_profissional: 'eja',
  internet: 'conectividade',
  internet_alunos: 'conectividade',
  internet_aprendizagem: 'conectividade',
  internet_comunidade: 'conectividade',
  acesso_internet_computador: 'conectividade',
  acesso_internet_disp_pessoais: 'conectividade',
  rede_local: 'conectividade',
  rede_wireless: 'conectividade',
  banda_larga: 'conectividade',
  proposta_pedagogica: 'equipamentos-recursos',
  desktop_aluno: 'equipamentos-recursos',
  comp_portatil_aluno: 'equipamentos-recursos',
  tablet_aluno: 'equipamentos-recursos',
})

const BASE_INDICATORS = [
  {
    key: 'mat-total',
    label: 'Total de matrículas',
    description: 'Total de matrículas registradas na educação básica do município.',
    section: attendance,
    sections: [overview, attendance],
    themeKey: 'matriculas',
    dataBlock: 'matriculas',
    seriesPath: 'series.total',
    unit: 'alunos',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'mat-infantil',
    label: 'Matrículas na educação infantil',
    description: 'Matrículas registradas na educação infantil.',
    section: attendance,
    themeKey: 'matriculas',
    dataBlock: 'matriculas',
    seriesPath: 'series.por_etapa.infantil',
    unit: 'alunos',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'mat-fundamental',
    label: 'Matrículas no ensino fundamental',
    description: 'Matrículas registradas no ensino fundamental.',
    section: attendance,
    themeKey: 'matriculas',
    dataBlock: 'matriculas',
    seriesPath: 'series.por_etapa.fundamental',
    unit: 'alunos',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'mat-medio',
    label: 'Matrículas no ensino médio',
    description: 'Matrículas registradas no ensino médio.',
    section: attendance,
    themeKey: 'matriculas',
    dataBlock: 'matriculas',
    seriesPath: 'series.por_etapa.medio',
    unit: 'alunos',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'mat-eja',
    label: 'Matrículas na EJA',
    description: 'Matrículas registradas na educação de jovens e adultos.',
    section: modalities,
    sections: [attendance, modalities],
    themeKey: 'matriculas',
    dataBlock: 'matriculas',
    seriesPath: 'series.por_etapa.eja',
    unit: 'alunos',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'mat-profissional',
    label: 'Matrículas na educação profissional — Censo Escolar',
    description: 'Matrículas registradas na educação profissional/técnica no Censo Escolar, por etapa de ensino.',
    section: modalities,
    sections: [attendance, modalities],
    themeKey: 'matriculas',
    dataBlock: 'matriculas',
    seriesPath: 'series.por_etapa.profissional',
    unit: 'alunos',
    formatType: 'number',
    source: 'INEP Censo Escolar',
    comparisonGroup: 'educacao-profissional',
  },
  {
    key: 'mat-integral',
    label: 'Matrículas em tempo integral',
    description: 'Percentual total de matrículas em tempo integral no município.',
    section: attendance,
    themeKey: 'matriculas',
    dataBlock: 'matriculas',
    seriesPath: 'series.integral[].percentual',
    unit: 'percentual',
    formatType: 'percent',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'mat-rural',
    label: 'Matrículas em zona rural',
    description: 'Matrículas vinculadas à localização rural.',
    section: modalities,
    themeKey: 'matriculas',
    dataBlock: 'matriculas',
    seriesPath: 'series.por_localizacao.rural',
    unit: 'alunos',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'mat-publica',
    label: 'Matrículas na rede pública',
    description: 'Matrículas na rede pública municipal, estadual e federal.',
    section: attendance,
    themeKey: 'matriculas',
    dataBlock: 'matriculas',
    seriesPath: 'series.por_dependencia.publica',
    unit: 'alunos',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'mat-privada',
    label: 'Matrículas na rede privada',
    description: 'Matrículas na rede privada.',
    section: attendance,
    themeKey: 'matriculas',
    dataBlock: 'matriculas',
    seriesPath: 'series.por_dependencia.privada',
    unit: 'alunos',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'rede-total',
    label: 'Total de escolas',
    description: 'Total de escolas registradas no município.',
    section: attendance,
    sections: [overview, attendance],
    themeKey: 'rede',
    dataBlock: 'rede_escolar',
    seriesPath: 'series.total',
    unit: 'escolas',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'rede-infantil',
    label: 'Educação Infantil',
    description: 'Escolas que ofertam educação infantil.',
    section: attendance,
    themeKey: 'rede',
    dataBlock: 'rede_escolar',
    seriesPath: 'series.por_etapa.infantil',
    unit: 'escolas',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'rede-fundamental',
    label: 'Ensino Fundamental',
    description: 'Escolas que ofertam ensino fundamental.',
    section: attendance,
    themeKey: 'rede',
    dataBlock: 'rede_escolar',
    seriesPath: 'series.por_etapa.fundamental',
    unit: 'escolas',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'rede-medio',
    label: 'Ensino Médio',
    description: 'Escolas que ofertam ensino médio.',
    section: attendance,
    themeKey: 'rede',
    dataBlock: 'rede_escolar',
    seriesPath: 'series.por_etapa.medio',
    unit: 'escolas',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'rede-eja',
    label: 'EJA',
    description: 'Escolas que ofertam EJA.',
    section: modalities,
    sections: [attendance, modalities],
    themeKey: 'rede',
    dataBlock: 'rede_escolar',
    seriesPath: 'series.por_etapa.eja',
    unit: 'escolas',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'rede-profissional',
    label: 'Educação Profissional',
    description: 'Escolas que ofertam educação profissional.',
    section: modalities,
    sections: [attendance, modalities],
    themeKey: 'rede',
    dataBlock: 'rede_escolar',
    seriesPath: 'series.por_etapa.profissional',
    unit: 'escolas',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'rede-infraestrutura',
    label: 'Infraestrutura',
    description: 'Acesso à internet e banda larga nas escolas.',
    section: infrastructure,
    themeKey: 'rede',
    dataBlock: 'rede_escolar',
    seriesPath: 'series.internet[].perc_internet',
    unit: 'percentual',
    formatType: 'percent',
    source: 'INEP Censo Escolar',
    renderer: 'InfraDetailPanel',
  },
  {
    key: 'alunos-turma-infantil',
    label: 'Alunos por turma - Educação Infantil',
    description: 'Média oficial de alunos por turma em educação infantil.',
    section: professionals,
    themeKey: 'turmas',
    dataBlock: 'alunos_turma',
    seriesPath: 'series.por_serie.infantil_total',
    unit: 'alunos por turma',
    formatType: 'ratio',
    source: 'INEP Média de Alunos por Turma (ATU)',
  },
  {
    key: 'alunos-turma-fundamental',
    label: 'Alunos por turma - Ensino Fundamental',
    description: 'Média oficial de alunos por turma em ensino fundamental.',
    section: professionals,
    sections: [overview, professionals],
    themeKey: 'turmas',
    dataBlock: 'alunos_turma',
    seriesPath: 'series.por_serie.fundamental_total',
    unit: 'alunos por turma',
    formatType: 'ratio',
    source: 'INEP Média de Alunos por Turma (ATU)',
  },
  {
    key: 'alunos-turma-medio',
    label: 'Alunos por turma - Ensino Médio',
    description: 'Média oficial de alunos por turma em ensino médio.',
    section: professionals,
    themeKey: 'turmas',
    dataBlock: 'alunos_turma',
    seriesPath: 'series.por_serie.medio_total',
    unit: 'alunos por turma',
    formatType: 'ratio',
    source: 'INEP Média de Alunos por Turma (ATU)',
  },
  {
    key: 'docentes-total',
    label: 'Total de docentes',
    description: 'Total de docentes registrados no município.',
    section: professionals,
    sections: [overview, professionals],
    themeKey: 'docentes',
    dataBlock: 'turmas_docentes',
    seriesPath: 'series.total.docentes',
    unit: 'docentes',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'docentes-infantil',
    label: 'Docentes - Educação Infantil',
    description: 'Total de docentes vinculados a educação infantil.',
    section: professionals,
    themeKey: 'docentes',
    dataBlock: 'turmas_docentes',
    seriesPath: 'series.por_etapa.infantil.docentes',
    unit: 'docentes',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'docentes-fundamental',
    label: 'Docentes - Ensino Fundamental',
    description: 'Total de docentes vinculados a ensino fundamental.',
    section: professionals,
    themeKey: 'docentes',
    dataBlock: 'turmas_docentes',
    seriesPath: 'series.por_etapa.fundamental.docentes',
    unit: 'docentes',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'docentes-medio',
    label: 'Docentes - Ensino Médio',
    description: 'Total de docentes vinculados a ensino médio.',
    section: professionals,
    themeKey: 'docentes',
    dataBlock: 'turmas_docentes',
    seriesPath: 'series.por_etapa.medio.docentes',
    unit: 'docentes',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'docentes-eja',
    label: 'Docentes - EJA',
    description: 'Total de docentes vinculados a EJA.',
    section: professionals,
    themeKey: 'docentes',
    dataBlock: 'turmas_docentes',
    seriesPath: 'series.por_etapa.eja.docentes',
    unit: 'docentes',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'docentes-profissional',
    label: 'Docentes - Educação Profissional',
    description: 'Total de docentes vinculados a educação profissional.',
    section: professionals,
    themeKey: 'docentes',
    dataBlock: 'turmas_docentes',
    seriesPath: 'series.por_etapa.profissional.docentes',
    unit: 'docentes',
    formatType: 'number',
    source: 'INEP Censo Escolar',
  },
  {
    key: 'fluxo-aprovacao',
    label: 'Taxa de aprovação',
    description: 'Percentual de aprovação no fluxo escolar.',
    section: trajectory,
    sections: [overview, trajectory],
    themeKey: 'fluxo',
    dataBlock: 'fluxo',
    seriesPath: 'series.por_etapa.fundamental.taxa_aprovacao',
    unit: 'percentual',
    formatType: 'percent',
    source: 'INEP Taxas de Rendimento Escolar',
  },
  {
    key: 'fluxo-aprovacao-medio',
    label: 'Taxa de aprovação no ensino médio',
    description: 'Percentual de aprovação no ensino médio.',
    section: trajectory,
    themeKey: 'fluxo',
    dataBlock: 'fluxo',
    seriesPath: 'series.por_etapa.medio.taxa_aprovacao',
    unit: 'percentual',
    formatType: 'percent',
    source: 'INEP Taxas de Rendimento Escolar',
  },
  {
    key: 'fluxo-reprovacao',
    label: 'Taxa de reprovação',
    description: 'Percentual de reprovação no fluxo escolar.',
    section: trajectory,
    themeKey: 'fluxo',
    dataBlock: 'fluxo',
    seriesPath: 'series.por_etapa.fundamental.taxa_reprovacao',
    unit: 'percentual',
    formatType: 'percent',
    source: 'INEP Taxas de Rendimento Escolar',
  },
  {
    key: 'fluxo-abandono',
    label: 'Taxa de abandono',
    description: 'Percentual de abandono no fluxo escolar.',
    section: trajectory,
    themeKey: 'fluxo',
    dataBlock: 'fluxo',
    seriesPath: 'series.por_etapa.fundamental.taxa_abandono',
    unit: 'percentual',
    formatType: 'percent',
    source: 'INEP Taxas de Rendimento Escolar',
  },
  {
    key: 'fluxo-distorcao',
    label: 'Distorção idade-série',
    description: 'Percentual de estudantes com distorção idade-série.',
    section: trajectory,
    themeKey: 'fluxo',
    dataBlock: 'fluxo',
    seriesPath: 'series.por_etapa.fundamental.taxa_distorcao',
    unit: 'percentual',
    formatType: 'percent',
    source: 'INEP Distorção Idade-Série',
  },
  {
    key: 'apr-ideb',
    label: 'IDEB',
    description: 'Último IDEB disponível para o recorte principal.',
    section: trajectory,
    sections: [overview, trajectory],
    themeKey: 'aprendizagem',
    dataBlock: 'aprendizagem',
    seriesPath: 'series.ideb.<etapa>',
    unit: 'índice',
    formatType: 'value',
    source: 'INEP SAEB/IDEB',
  },
  {
    key: 'apr-saeb-lp',
    label: 'SAEB Língua Portuguesa',
    description: 'Resultado de Língua Portuguesa no SAEB.',
    section: trajectory,
    themeKey: 'aprendizagem',
    dataBlock: 'aprendizagem',
    seriesPath: 'series.ideb.<etapa>.saeb_lp',
    unit: 'pontos',
    formatType: 'value',
    source: 'INEP SAEB/IDEB',
  },
  {
    key: 'apr-saeb-mt',
    label: 'SAEB Matemática',
    description: 'Resultado de Matemática no SAEB.',
    section: trajectory,
    themeKey: 'aprendizagem',
    dataBlock: 'aprendizagem',
    seriesPath: 'series.ideb.<etapa>.saeb_mt',
    unit: 'pontos',
    formatType: 'value',
    source: 'INEP SAEB/IDEB',
  },
  {
    key: 'apr-alfabetizacao',
    label: 'Alfabetização',
    description: 'Taxa de alfabetização disponível para os anos recentes.',
    section: trajectory,
    themeKey: 'aprendizagem',
    dataBlock: 'aprendizagem',
    seriesPath: 'series.alfabetizacao[].taxa_alfabetizacao',
    unit: 'percentual',
    formatType: 'percent',
    source: 'INEP Alfabetização',
  },
  {
    key: 'apr-inse',
    label: 'INSE',
    description: 'Média do indicador de nível socioeconômico.',
    section: trajectory,
    themeKey: 'aprendizagem',
    dataBlock: 'aprendizagem',
    seriesPath: 'series.inse[].media_inse',
    unit: 'índice',
    formatType: 'value',
    source: 'INEP INSE',
  },
  {
    key: 'oferta-total',
    label: 'Matrículas técnicas — Sinopse Estatística',
    description: 'Total de matrículas em cursos técnicos e profissionais segundo a Sinopse Estatística do Censo Escolar.',
    section: modalities,
    sections: [overview, modalities],
    themeKey: 'oferta',
    dataBlock: 'oferta_tecnica',
    seriesPath: 'series.total',
    unit: 'alunos',
    formatType: 'number',
    source: 'INEP Sinopse Estatística do Censo Escolar',
    comparisonGroup: 'educacao-profissional',
  },
]

const COMPLEMENTARY_INDICATORS = [
  ['aee', 'Oferta de AEE e salas de recursos na educação especial', 'Participação das turmas ou salas de AEE em relação ao total da educação especial no município.', modalities, 'percent'],
  ['eja_integrada_educacao_profissional', 'Matrículas do EJA integradas à educação profissional', 'Número de matrículas do EJA na forma integrada à educação profissional no município.', modalities, 'number'],
  ['internet', 'Escolas da educação básica com acesso à internet', 'Percentual de escolas da educação básica com acesso à internet.', infrastructure, 'percent'],
  ['internet_alunos', 'Escolas com internet disponível para os alunos', 'Percentual de escolas com internet disponível para uso dos alunos.', infrastructure, 'percent'],
  ['internet_aprendizagem', 'Escolas com internet usada na aprendizagem', 'Percentual de escolas com internet aplicada aos processos de ensino e aprendizagem.', infrastructure, 'percent'],
  ['internet_comunidade', 'Escolas com internet aberta à comunidade', 'Percentual de escolas com internet aberta ao uso da comunidade.', infrastructure, 'percent'],
  ['acesso_internet_computador', 'Escolas com acesso dos alunos à internet por computador', 'Percentual de escolas em que os alunos acessam a internet por computadores da escola.', infrastructure, 'percent'],
  ['acesso_internet_disp_pessoais', 'Escolas com acesso dos alunos à internet por dispositivos pessoais', 'Percentual de escolas em que os alunos acessam a internet por dispositivos pessoais.', infrastructure, 'percent'],
  ['rede_local', 'Escolas com rede local de computadores', 'Percentual de escolas com rede local de interligação de computadores.', infrastructure, 'percent'],
  ['rede_wireless', 'Escolas com rede local sem fio', 'Percentual de escolas com rede local wireless.', infrastructure, 'percent'],
  ['banda_larga', 'Escolas com internet banda larga', 'Percentual de escolas com oferta de internet banda larga.', infrastructure, 'percent'],
  ['proposta_pedagogica', 'Escolas públicas com projeto político pedagógico', 'Percentual de escolas públicas da educação básica que possuem projeto político pedagógico ou proposta pedagógica.', infrastructure, 'percent'],
  ['desktop_aluno', 'Escolas com computadores de mesa para alunos', 'Percentual de escolas com computadores de mesa disponíveis para os alunos.', infrastructure, 'percent'],
  ['comp_portatil_aluno', 'Escolas com computadores portáteis para alunos', 'Percentual de escolas com computadores portáteis disponíveis para os alunos.', infrastructure, 'percent'],
  ['tablet_aluno', 'Escolas com tablets para alunos', 'Percentual de escolas com tablets disponíveis para os alunos.', infrastructure, 'percent'],
].map(([key, label, description, section, formatType]) => ({
  key,
  label,
  description,
  type: 'complementary',
  section,
  groupKey: INDICATOR_GROUP_KEYS[key] ?? null,
  sections: [section],
  themeKey: 'pne_complementares',
  dataBlock: 'pne_2026_2036.indicadores',
  seriesPath: `indicadores.${key}.series`,
  unit: formatType === 'percent' ? 'percentual' : 'alunos',
  formatType,
  source: 'INEP Censo Escolar · contexto complementar do PNE',
  renderer: 'EducationIndicatorDetail',
  missingPolicy: MISSING_POLICY,
}))

const withDefaults = (indicator) => ({
  type: 'base',
  renderer: 'EducationIndicatorDetail',
  missingPolicy: MISSING_POLICY,
  groupKey: INDICATOR_GROUP_KEYS[indicator.key] ?? null,
  sections: indicator.sections ?? [indicator.section],
  ...indicator,
})

const EDUCATION_BASE_INDICATOR_CATALOG = Object.freeze(BASE_INDICATORS.map(withDefaults))
export const EDUCATION_COMPLEMENTARY_INDICATOR_CATALOG = Object.freeze(COMPLEMENTARY_INDICATORS)
export const EDUCATION_INDICATOR_CATALOG = Object.freeze([
  ...EDUCATION_BASE_INDICATOR_CATALOG,
  ...EDUCATION_COMPLEMENTARY_INDICATOR_CATALOG,
])

export const EDUCATION_SOURCE_CATALOG = Object.freeze([
  {
    key: 'INEP Censo Escolar',
    officialName: 'Censo Escolar da Educação Básica — INEP',
    periodicity: 'Anual',
  },
  {
    key: 'INEP Média de Alunos por Turma (ATU)',
    officialName: 'Média de Alunos por Turma (ATU) — INEP',
    periodicity: 'Anual',
  },
  {
    key: 'INEP Taxas de Rendimento Escolar',
    officialName: 'Taxas de Rendimento Escolar — INEP',
    periodicity: 'Anual',
  },
  {
    key: 'INEP Distorção Idade-Série',
    officialName: 'Distorção Idade-Série — INEP',
    periodicity: 'Anual',
  },
  {
    key: 'INEP SAEB/IDEB',
    officialName: 'Sistema de Avaliação da Educação Básica (SAEB) e IDEB — INEP',
    periodicity: 'Bienal',
  },
  {
    key: 'INEP Alfabetização',
    officialName: 'Indicador de Alfabetização — INEP',
    periodicity: 'Anual',
  },
  {
    key: 'INEP INSE',
    officialName: 'Indicador de Nível Socioeconômico (INSE) — INEP',
    periodicity: 'Bienal',
  },
  {
    key: 'INEP Sinopse Estatística do Censo Escolar',
    officialName: 'Sinopse Estatística do Censo Escolar — INEP',
    periodicity: 'Anual',
  },
  {
    key: 'INEP Censo Escolar · contexto complementar do PNE',
    officialName: 'Censo Escolar — contexto complementar do PNE',
    periodicity: 'Anual',
  },
])

const EDUCATION_INDICATOR_CATALOG_BY_KEY = new Map(
  EDUCATION_INDICATOR_CATALOG.map((indicator) => [indicator.key, indicator]),
)

export const EDUCATION_SECTION_GROUPS = Object.freeze(
  Object.fromEntries(
    Object.entries(SECTION_GROUP_DEFINITIONS).map(([sectionKey, groups]) => [
      sectionKey,
      groups.map((group) => ({
        ...group,
        indicatorKeys: group.indicatorKeys ?? EDUCATION_INDICATOR_CATALOG
          .filter((indicator) => indicator.section === sectionKey && indicator.groupKey === group.key)
          .map((indicator) => indicator.key),
      })),
    ]),
  ),
)

export const EDUCATION_SECTION_CATALOG = Object.freeze([
  {
    key: overview,
    label: EDUCATION_SECTION_LABELS[overview],
    description: EDUCATION_SECTION_DESCRIPTIONS[overview],
    indicatorKeys: EDUCATION_INDICATOR_CATALOG.filter((item) => item.sections.includes(overview)).map((item) => item.key),
    status: 'curated-from-existing-summary',
  },
  ...[attendance, trajectory, professionals, infrastructure, modalities].map((key) => ({
    key,
    label: EDUCATION_SECTION_LABELS[key],
    description: EDUCATION_SECTION_DESCRIPTIONS[key],
    indicatorKeys: EDUCATION_INDICATOR_CATALOG.filter((item) => item.sections.includes(key)).map((item) => item.key),
    groups: EDUCATION_SECTION_GROUPS[key],
    status: 'available-in-existing-data',
  })),
  {
    key: EDUCATION_SECTION_KEYS.demand,
    label: EDUCATION_SECTION_LABELS[EDUCATION_SECTION_KEYS.demand],
    description: EDUCATION_SECTION_DESCRIPTIONS[EDUCATION_SECTION_KEYS.demand],
    indicatorKeys: EDUCATION_DEMAND_INDICATOR_CATALOG.map((indicator) => indicator.key),
    groups: [],
    status: 'projection-context-only',
  },
  {
    key: EDUCATION_SECTION_KEYS.methodology,
    label: EDUCATION_SECTION_LABELS[EDUCATION_SECTION_KEYS.methodology],
    description: EDUCATION_SECTION_DESCRIPTIONS[EDUCATION_SECTION_KEYS.methodology],
    indicatorKeys: [],
    groups: [],
    status: 'metadata-and-sources-only',
  },
])

const EDUCATION_SECTION_THEME_KEYS = Object.freeze({
  [overview]: 'matriculas',
  [attendance]: 'matriculas',
  [trajectory]: 'fluxo',
  [professionals]: 'docentes',
  [infrastructure]: 'rede',
  [modalities]: 'oferta',
  [EDUCATION_SECTION_KEYS.demand]: 'matriculas',
  [EDUCATION_SECTION_KEYS.methodology]: 'matriculas',
})

const SECTION_ALIASES = new Map([
  ['visaogeral', overview],
  ['panorama', overview],
  ['panoramaeducacional', overview],
  ['atendimento', attendance],
  ['ofertaeducacional', attendance],
  ['trajetoria', trajectory],
  ['trajetoriaescolar', trajectory],
  ['aprendizagem', trajectory],
  ['profissionais', professionals],
  ['docentes', professionals],
  ['infraestrutura', infrastructure],
  ['condicoesdeoferta', infrastructure],
  ['modalidades', modalities],
  ['equidade', modalities],
  ['territorios', modalities],
  ['demanda', EDUCATION_SECTION_KEYS.demand],
  ['projecoes', EDUCATION_SECTION_KEYS.demand],
  ['metodologia', EDUCATION_SECTION_KEYS.methodology],
  ['fontes', EDUCATION_SECTION_KEYS.methodology],
])

const THEME_SECTION_ALIASES = new Map([
  ['matriculas', attendance],
  ['rede', attendance],
  ['turmas', trajectory],
  ['fluxo', trajectory],
  ['aprendizagem', trajectory],
  ['docentes', professionals],
  ['oferta', modalities],
  ['sistemas', modalities],
  ['escolassistemas', modalities],
  ['pnecomplementares', infrastructure],
])

const normalizeCatalogValue = normalizeRouteValue

export function getEducationIndicatorCatalogItem(indicatorKey) {
  return EDUCATION_INDICATOR_CATALOG_BY_KEY.get(indicatorKey) ?? null
}

function normalizeEducationSection(value) {
  const normalized = normalizeCatalogValue(value)
  if (SECTION_ALIASES.has(normalized)) return SECTION_ALIASES.get(normalized)
  if (THEME_SECTION_ALIASES.has(normalized)) return THEME_SECTION_ALIASES.get(normalized)
  return Object.values(EDUCATION_SECTION_KEYS).find((key) => normalizeCatalogValue(key) === normalized) ?? null
}

function getEducationSectionForIndicator(indicatorKey) {
  return getEducationIndicatorCatalogItem(indicatorKey)?.section ?? null
}

export function getEducationThemeForIndicator(indicatorKey) {
  return getEducationIndicatorCatalogItem(indicatorKey)?.themeKey ?? null
}

export function getEducationThemeForSection(section) {
  const normalizedSection = normalizeEducationSection(section)
  return normalizedSection ? EDUCATION_SECTION_THEME_KEYS[normalizedSection] ?? null : null
}

export function resolveEducationSection({ detailKey, requestedSection, requestedTheme } = {}) {
  return getEducationSectionForIndicator(detailKey)
    ?? normalizeEducationSection(requestedSection)
    ?? normalizeEducationSection(requestedTheme)
    ?? EDUCATION_SECTION_KEYS.overview
}

export function resolveEducationNavigation({ route, hashParams, searchParams } = {}) {
  const normalizedRoute = normalizeCatalogValue(route)
  const hash = new URLSearchParams(hashParams ?? '')
  const search = new URLSearchParams(searchParams ?? '')
  const getParameter = (key) => hash.get(key) ?? search.get(key)

  if (!['educacao', 'sistemas', 'escolassistemas'].includes(normalizedRoute)) return null
  if (normalizedRoute === 'sistemas' || normalizedRoute === 'escolassistemas') {
    return {
      detailKey: getParameter('detalhe') ?? '',
      hasSystemTheme: true,
      requestedSection: getParameter('secao'),
      requestedTheme: getParameter('tema') ?? getParameter('theme'),
      section: EDUCATION_SECTION_KEYS.modalities,
    }
  }

  const detailKey = getParameter('detalhe') ?? ''
  const requestedSection = getParameter('secao')
  const requestedTheme = getParameter('tema') ?? getParameter('theme')

  return {
    detailKey,
    hasSystemTheme: false,
    requestedSection,
    requestedTheme,
    section: resolveEducationSection({ detailKey, requestedSection, requestedTheme }),
  }
}
import { normalizeRouteValue } from '../app/appHash.js'
