import { FUNDEB_INDICATORS } from './fundebIndicators'
import { PNATE_INDICATORS } from './pnateIndicators'
import { SIOPE_SELECTED_INDICATORS_COUNT } from './siopeIndicators'
import { FINANCIAL_PAGE_KEYS } from './financialPageKeys'

export { FINANCIAL_PAGE_KEYS } from './financialPageKeys'

const FINANCIAL_PARENT_LABEL = 'Indicadores Financeiros da Educação'
const FINANCIAL_OVERVIEW_LABEL = 'Visão geral'

export const FINANCIAL_MODULES = Object.freeze([
  {
    key: 'siope',
    pageKey: FINANCIAL_PAGE_KEYS.application,
    panel: 'siope',
    navLabel: 'Financiamento e Execução',
    title: 'Financiamento e Execução dos Recursos da Educação',
    description: 'Receitas, despesas, mínimos legais, gasto por estudante e saldos declarados ao SIOPE/FNDE.',
    relevance: 'Acompanhar a execução declarada dos recursos educacionais e as referências legais aplicáveis ao município.',
    source: 'SIOPE/FNDE e declarações do município.',
    count: `${SIOPE_SELECTED_INDICATORS_COUNT} indicadores`,
  },
  {
    key: 'fundeb',
    pageKey: FINANCIAL_PAGE_KEYS.fundeb,
    panel: 'fundeb',
    title: 'FUNDEB',
    description: 'Receitas, despesas, remuneração e saldos do fundo.',
    relevance: 'Acompanhar os recursos redistribuídos pelo fundo e sua execução no município.',
    source: 'FNDE/FUNDEB e dados financeiros municipais.',
    count: `${FUNDEB_INDICATORS.length} indicadores`,
  },
  {
    key: 'vaar',
    pageKey: FINANCIAL_PAGE_KEYS.vaar,
    panel: 'vaar',
    title: 'Complementação VAAR',
    description: 'Condicionalidades e resultados de aprendizagem e atendimento.',
    relevance: 'Acompanhar elegibilidade, recebimento e componentes da complementação da União ao FUNDEB.',
    source: 'VAAR/FUNDEB, FNDE e bases educacionais relacionadas.',
    count: '2023–2026',
  },
  {
    key: 'pnate',
    pageKey: FINANCIAL_PAGE_KEYS.pnate,
    panel: 'pnate',
    title: 'PNATE',
    description: 'Transporte escolar rural, estudantes atendidos e repasses.',
    relevance: 'Acompanhar o apoio suplementar federal ao transporte escolar rural.',
    source: 'PNATE/FNDE e informações declaradas pelo município.',
    count: `${PNATE_INDICATORS.length} indicadores`,
  },
])

export const FINANCIAL_NAV_ITEMS = Object.freeze([
  {
    key: 'overview',
    pageKey: FINANCIAL_PAGE_KEYS.overview,
    label: FINANCIAL_OVERVIEW_LABEL,
  },
  ...FINANCIAL_MODULES.map(({ key, navLabel, pageKey, title }) => ({
    key,
    pageKey,
    label: navLabel ?? title,
  })),
])

export const FINANCIAL_OVERVIEW_COPY = Object.freeze({
  eyebrow: FINANCIAL_PARENT_LABEL,
  overviewLabel: FINANCIAL_OVERVIEW_LABEL,
  hero: {
    title: 'Como a educação municipal é financiada',
    description: 'Recursos vinculados, redistribuição pelo FUNDEB e programas suplementares sustentam a educação municipal. O painel reúne indicadores para acompanhar a origem, a aplicação e a execução desses recursos.',
  },
  resources: {
    eyebrow: 'Como o financiamento se organiza',
    title: 'Três mecanismos estruturam os recursos da educação',
    description: 'A leitura combina receitas vinculadas, redistribuição entre redes e apoios para finalidades específicas.',
    cards: [
      {
        title: 'Recursos vinculados',
        body: 'Parte das receitas de impostos e transferências é reservada à educação. Para os municípios, a aplicação mínima em MDE é de 25%.',
      },
      {
        title: 'Redistribuição pelo FUNDEB',
        body: 'A parcela de 20% das receitas legalmente especificadas compõe os fundos e é redistribuída conforme as matrículas e as características da oferta.',
      },
      {
        title: 'Programas e complementações',
        body: 'Em 2026, a complementação mínima da União ao FUNDEB é de 23% do total dos fundos. Também há apoios suplementares, como o PNATE para o transporte escolar rural.',
      },
    ],
  },
  dashboard: {
    eyebrow: 'O que o painel acompanha',
    title: 'Quatro leituras para acompanhar o financiamento',
    description: 'Cada módulo apresenta uma dimensão do financiamento da educação, com indicadores, séries históricas, filtros e fontes específicas.',
    actionLabel: 'Abrir módulo',
  },
  concepts: {
    eyebrow: 'Conceitos essenciais',
    title: 'Conceitos para interpretação dos indicadores',
    description: 'Definições de medidas, unidades e fontes utilizadas nos painéis financeiros.',
    items: [
      { title: 'Receita de impostos e transferências', summary: 'Base utilizada para calcular a aplicação mínima constitucional em educação.' },
      { title: 'Aplicação em MDE', summary: 'Parcela destinada às despesas legalmente classificadas como manutenção e desenvolvimento do ensino; para os municípios, a aplicação mínima é de 25% da receita de impostos e transferências.' },
      { title: 'Receita e despesa do FUNDEB', summary: 'Recursos recebidos após a redistribuição do fundo, incluindo a parcela de 20% das receitas especificadas, e valores aplicados nas finalidades permitidas.' },
      { title: 'Gasto por estudante e valor per capita', summary: 'Valores médios calculados pela fonte a partir das despesas, estudantes ou regras de repasse.' },
      { title: 'Saldo e disponibilidade financeira', summary: 'Recursos disponíveis ou remanescentes no período, lidos junto de ingressos, pagamentos e data de referência.' },
      { title: 'Variação percentual e em pontos percentuais', summary: 'Variação percentual é proporcional; pontos percentuais são a diferença direta entre percentuais, como de 70% para 75%.' },
    ],
  },
  sources: {
    title: 'Fontes oficiais',
    description: 'Constituição, legislação educacional, SIOPE e FNDE.',
    references: [
      { label: 'Constituição Federal', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' },
      { label: 'Lei de Diretrizes e Bases', url: 'https://www.planalto.gov.br/ccivil_03/leis/l9394.htm' },
      { label: 'SIOPE / FNDE', url: 'https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope' },
      { label: 'FUNDEB / FNDE', url: 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/fundeb-home/' },
      { label: 'PNATE / FNDE', url: 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnate' },
      { label: 'Lei nº 14.113/2020', url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14113.htm' },
    ],
  },
})

export const FINANCIAL_PAGE_COPY = Object.freeze({
  parentLabel: FINANCIAL_PARENT_LABEL,
  module: Object.freeze({
    compactSelectorLabel: 'Módulo financeiro',
    compactSelectorPrompt: 'Escolha um módulo',
    objectiveAriaLabel: 'Objetivo do módulo',
    objectiveLabel: 'Objetivo do módulo',
    sourceLabel: 'Fonte de referência',
    municipalityFocusLabel: 'Município em foco:',
    emptyTitle: 'Selecione um município para consultar',
    emptyDescription: 'Use o seletor de município na barra de contexto. Depois, os painéis atuais e seus detalhes serão carregados nesta página.',
    municipalityLoading: (municipality) => `Carregando dados de ${municipality}...`,
    municipalityErrorTitle: 'Erro ao carregar dados do município',
    moduleLoading: (title) => `Carregando dados de ${title}...`,
    moduleErrorTitle: (title) => `Erro ao carregar dados de ${title}`,
  }),
})

export function getFinancialModuleByPageKey(pageKey) {
  return FINANCIAL_MODULES.find((module) => module.pageKey === pageKey) ?? null
}

export function getFinancialPageByKey(pageKey) {
  if (pageKey === FINANCIAL_PAGE_KEYS.overview) return { pageKey, key: 'overview', title: FINANCIAL_OVERVIEW_LABEL }
  const module = getFinancialModuleByPageKey(pageKey)
  return module ? { ...module, title: module.title } : null
}
