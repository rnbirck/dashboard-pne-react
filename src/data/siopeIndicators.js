import { loadJson } from './staticData'

const SIOPE_BASE_PATH = '/data/educacao/siope'

export const SIOPE_DASHBOARD_YEARS = [2021, 2022, 2023, 2024, 2025]
export const SIOPE_SELECTED_INDICATORS_COUNT = 14
export const SIOPE_OFFICIAL_GROUPS = [
  { key: '1', label: 'Indicadores Legais', order: 1, prefix: '1' },
  { key: '2', label: 'Indicadores de Dispêndio Financeiro', order: 2, prefix: '2' },
  { key: '3', label: 'Indicadores de Dispêndio com Pessoal', order: 3, prefix: '3' },
  { key: '4', label: 'Indicadores de Investimento por Aluno', order: 4, prefix: '4' },
  { key: '5', label: 'Indicadores de Desenvolvimento Educacional', order: 5, prefix: '5' },
  { key: '6', label: 'Indicadores de Composição da Receita', order: 6, prefix: '6' },
  { key: '7', label: 'Resultado Financeiro do Exercício', order: 7, prefix: '7' },
  { key: '8', label: 'Aplicação da Receita de Impostos em MDE', order: 8, prefix: '8' },
]

export function getSiopeOfficialGroup(codigoIndicador) {
  const prefix = String(codigoIndicador ?? '').split('.')[0]
  return SIOPE_OFFICIAL_GROUPS.find((group) => group.prefix === prefix) ?? null
}

export function loadSiopeDashboardData() {
  return Promise.all([
    loadJson(`${SIOPE_BASE_PATH}/siope_indicadores_dashboard_wide.json`),
    loadJson(`${SIOPE_BASE_PATH}/siope_indicadores_dashboard_catalogo.json`),
  ]).then(([wide, catalogo]) => ({
    catalogo,
    wide,
  }))
}
