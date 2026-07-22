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
    navLabel: 'Aplicação e execução',
    title: 'Aplicação e execução da educação',
    description: 'Veja quanto o município aplicou em educação e quanto das despesas avançou até o pagamento.',
    relevance: 'Acompanhar a execução declarada dos recursos educacionais e as referências legais aplicáveis ao município.',
    source: 'SIOPE/FNDE e declarações do município.',
    count: `${SIOPE_SELECTED_INDICATORS_COUNT} indicadores`,
    overview: {
      description: 'Veja quanto foi aplicado em educação e quanto das despesas avançou até o pagamento.',
      icon: 'application',
      title: 'Aplicação e execução',
    },
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
    overview: {
      description: 'Consulte os recursos declarados, sua utilização, a remuneração dos profissionais e os saldos.',
      icon: 'fundeb',
      title: 'Fundeb',
    },
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
    overview: {
      description: 'Consulte a habilitação do município e os resultados dos componentes de Aprendizagem e Atendimento.',
      icon: 'vaar',
      title: 'Complementação VAAR',
    },
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
    overview: {
      description: 'Veja os valores do programa de transporte escolar rural e os estudantes considerados.',
      icon: 'pnate',
      title: 'PNATE',
    },
  },
])

export const FINANCIAL_NAV_ITEMS = Object.freeze([
  {
    key: 'overview',
    pageKey: FINANCIAL_PAGE_KEYS.overview,
    label: FINANCIAL_OVERVIEW_LABEL,
  },
  {
    key: 'panorama',
    pageKey: FINANCIAL_PAGE_KEYS.panorama,
    label: 'Panorama financeiro',
  },
  ...FINANCIAL_MODULES.map(({ key, navLabel, pageKey, title }) => ({
    key,
    pageKey,
    label: navLabel ?? title,
  })),
])

export const FINANCIAL_OVERVIEW_COPY = Object.freeze({
  eyebrow: 'Financiamento da educação',
  overviewLabel: FINANCIAL_OVERVIEW_LABEL,
  hero: {
    title: 'Como a educação municipal é financiada',
    description: 'Conheça os principais recursos, sua aplicação e os programas relacionados à educação municipal.',
  },
  panorama: {
    eyebrow: 'Entrada recomendada',
    title: 'Panorama financeiro',
    description: 'Síntese dos principais recursos, da aplicação constitucional e da execução das despesas do município.',
    actionLabel: 'Abrir Panorama financeiro',
  },
  resources: {
    eyebrow: 'Como o financiamento se organiza',
    title: 'Como o financiamento se organiza',
    cards: [
      {
        title: 'Recursos vinculados',
        body: 'Parte das receitas de impostos e transferências é destinada à educação. Para os municípios, a aplicação mínima em MDE é de 25% da receita considerada.',
      },
      {
        title: 'Redistribuição pelo FUNDEB',
        body: 'O Fundeb reúne e redistribui recursos conforme as matrículas e as características das redes de ensino.',
      },
      {
        title: 'Programas e complementações',
        body: 'Complementações da União e programas como o PNATE apoiam finalidades específicas da educação.',
      },
    ],
  },
  dashboard: {
    eyebrow: 'Caminhos para aprofundar',
    title: 'Aprofunde a leitura financeira',
    description: 'Escolha uma área para consultar informações específicas do município.',
    actionLabel: 'Abrir página',
  },
  concepts: {
    eyebrow: 'Conceitos essenciais',
    title: 'Conceitos essenciais',
    description: 'Definições de medidas, unidades e fontes utilizadas nas páginas financeiras.',
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
    title: 'Fontes e metodologia',
    description: null,
    references: [
      { label: 'Constituição Federal', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' },
      { label: 'Legislação educacional', url: 'https://www.planalto.gov.br/ccivil_03/leis/l9394.htm' },
      { label: 'FNDE', url: 'https://www.gov.br/fnde/pt-br' },
      { label: 'SIOPE', url: 'https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope' },
      { label: 'Fundeb', url: 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/fundeb-home/' },
      { label: 'PNATE', url: 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnate' },
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
  if (pageKey === FINANCIAL_PAGE_KEYS.panorama) return { pageKey, key: 'panorama', title: 'Panorama financeiro' }
  const module = getFinancialModuleByPageKey(pageKey)
  return module ? { ...module, title: module.title } : null
}
