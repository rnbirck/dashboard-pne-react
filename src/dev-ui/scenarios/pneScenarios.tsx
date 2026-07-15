import { MetaCard } from '../../components/MetaCard.jsx'
import { ScenarioGrid, ScenarioItem } from '../components/ScenarioPrimitives'
import { pneItems } from '../fixtures/catalogFixtures'
import type { CatalogScenario } from '../types'

export const pneScenarios: readonly CatalogScenario[] = [
  {
    id: 'pne-cycle-cards',
    category: 'PNE',
    title: 'Cards dos ciclos do PNE',
    description: 'MetaCard real nos ciclos 2014–2024 e 2026–2036.',
    objective: 'Comparar status, meta, distância, tendência, título longo e seleção entre os dois ciclos.',
    states: ['ciclo encerrado', 'ciclo vigente', 'abaixo da meta', 'tendência positiva', 'selecionado'],
    visual: { enabled: true, viewports: ['desktop', 'mobile'] },
    render: () => (
      <ScenarioGrid>
        {pneItems.map((fixture, index) => (
          <ScenarioItem description={fixture.description} key={fixture.id} label={fixture.id === 'pne-2014' ? 'PNE 2014–2024' : 'PNE 2026–2036'}>
            <MetaCard
              buttonRef={undefined}
              cycle={fixture.value.cycle}
              isSelected={index === 1}
              item={fixture.value.item}
              onSelect={() => undefined}
              result={fixture.value.result}
              stateReference={undefined}
              stageLabel={index === 0 ? 'Ciclo encerrado' : 'Ciclo em acompanhamento'}
            />
          </ScenarioItem>
        ))}
      </ScenarioGrid>
    ),
  },
]
