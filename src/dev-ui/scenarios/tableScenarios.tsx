import { EducationTable } from '../../components/EducationTable.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { ScenarioGrid, ScenarioItem } from '../components/ScenarioPrimitives'
import { tableColumns, tableRows } from '../fixtures/catalogFixtures'
import type { CatalogScenario } from '../types'

export const tableScenarios: readonly CatalogScenario[] = [
  {
    id: 'tables-content-overflow',
    category: 'Tabelas',
    title: 'Conteúdo, colunas e overflow',
    description: 'Tabela real com cabeçalhos longos, extremos extensos, ausências e valores grandes.',
    objective: 'Verificar caption, alinhamento, rolagem horizontal explícita e preservação de todas as colunas.',
    states: ['poucas linhas', 'muitas colunas', 'valor ausente', 'valor grande', 'positivo', 'negativo', 'overflow'],
    visual: { enabled: true, viewports: ['notebook', 'mobile'] },
    render: () => (
      <ScenarioGrid columns="single">
        <ScenarioItem label="Tabela educacional">
          <EducationTable caption="Indicadores educacionais por território e dependência administrativa" columns={tableColumns} rows={tableRows} />
        </ScenarioItem>
      </ScenarioGrid>
    ),
  },
  {
    id: 'tables-states',
    category: 'Tabelas',
    title: 'Estados da tabela',
    description: 'Mesma região em estado vazio e loading previsível.',
    objective: 'Distinguir claramente ausência de linhas de carregamento em andamento.',
    states: ['vazio', 'loading'],
    visual: { enabled: true, viewports: ['desktop'] },
    render: () => (
      <ScenarioGrid>
        <ScenarioItem label="Estado vazio"><EducationTable caption="Tabela vazia" columns={tableColumns} rows={[]} /></ScenarioItem>
        <ScenarioItem label="Estado de loading"><div className="dev-ui-table-loading"><LoadingState message="Carregando linhas da tabela..." /></div></ScenarioItem>
      </ScenarioGrid>
    ),
  },
]
