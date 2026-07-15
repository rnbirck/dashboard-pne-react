import { useState } from 'react'
import { ContentState } from '../../components/ContentState.jsx'
import { ErrorState } from '../../components/ErrorState.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { StatusBadge } from '../../components/StatusBadge.jsx'
import { ScenarioGrid, ScenarioItem } from '../components/ScenarioPrimitives'
import type { CatalogScenario } from '../types'

function ExpandableState() {
  const [open, setOpen] = useState(true)
  return (
    <details className="page-card pne-expandable" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{open ? 'Conteúdo expandido' : 'Conteúdo recolhido'}</summary>
      <p>Texto controlado para validar a leitura progressiva e o foco do controle de expansão.</p>
    </details>
  )
}

export const stateScenarios: readonly CatalogScenario[] = [
  {
    id: 'states-system-feedback',
    category: 'Estados da interface',
    title: 'Feedback do sistema',
    description: 'Estados compartilhados de loading, erro, vazio e indisponibilidade.',
    objective: 'Validar anúncio semântico, contraste, linguagem simples e distinção entre cada condição.',
    states: ['normal', 'loading', 'erro', 'vazio', 'sem resultados', 'indisponível', 'cobertura parcial'],
    visual: { enabled: true, viewports: ['desktop', 'mobile'] },
    render: () => (
      <ScenarioGrid>
        <ScenarioItem label="Normal"><div className="page-card dev-ui-state-card"><StatusBadge displayStatus={undefined} marker={undefined} status="Com dados" title="Com dados" tone="success" /><p>Conteúdo disponível para leitura.</p></div></ScenarioItem>
        <ScenarioItem label="Loading"><LoadingState message="Carregando dados controlados..." /></ScenarioItem>
        <ScenarioItem label="Erro"><ErrorState message="A fixture de erro foi ativada deliberadamente." /></ScenarioItem>
        <ScenarioItem label="Vazio"><ContentState className="state-box" kind="empty"><strong>Nenhum item disponível.</strong><span>Altere o filtro para ampliar o resultado.</span></ContentState></ScenarioItem>
        <ScenarioItem label="Sem resultados"><ContentState className="platform-data-state" kind="noResults"><strong>Nenhuma correspondência.</strong><span>A busca “indicador inexistente” não encontrou itens.</span></ContentState></ScenarioItem>
        <ScenarioItem label="Indisponível"><ContentState className="state-box" kind="unavailable"><strong>Comparação indisponível.</strong><span>O denominador necessário não foi informado.</span></ContentState></ScenarioItem>
        <ScenarioItem label="Cobertura parcial"><p className="platform-coverage-note" role="note"><strong>Período parcial:</strong> a fonte publicou somente parte da série municipal.</p></ScenarioItem>
      </ScenarioGrid>
    ),
  },
  {
    id: 'states-interaction',
    category: 'Estados da interface',
    title: 'Seleção e expansão',
    description: 'Estados selecionado, expandido e recolhido com controles operáveis.',
    objective: 'Verificar foco visível, persistência da seleção e leitura progressiva.',
    states: ['selecionado', 'expandido', 'recolhido'],
    render: () => (
      <ScenarioGrid>
        <ScenarioItem label="Badge selecionado"><StatusBadge displayStatus="Selecionado" marker={undefined} status="Selecionado" title="Selecionado" tone="info" /></ScenarioItem>
        <ScenarioItem label="Expansão interativa"><ExpandableState /></ScenarioItem>
      </ScenarioGrid>
    ),
  },
]
