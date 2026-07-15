import { EducationIndicatorCard } from '../../components/EducationIndicatorCard.jsx'
import { EducationSummaryCard } from '../../components/EducationSummaryCard.jsx'
import { FinancialIndicatorCard } from '../../components/FinancialIndicatorPrimitives.jsx'
import { MetricCard } from '../../components/MetricCard.jsx'
import { StatCard } from '../../components/StatCard.jsx'
import { DisabledFixture, ScenarioGrid, ScenarioItem } from '../components/ScenarioPrimitives'
import { educationIndicators, financialIndicators } from '../fixtures/catalogFixtures'
import type { CatalogScenario } from '../types'

export const cardScenarios: readonly CatalogScenario[] = [
  {
    id: 'cards-summary-values',
    category: 'Cards',
    title: 'Cards de síntese e valores',
    description: 'Primitivas reais com zero, ausência, decimal, valor grande e textos extensos.',
    objective: 'Comparar densidade, alinhamento e comportamento de valor sem depender de um domínio completo.',
    states: ['comum', 'zero', 'ausente', 'decimal', 'muito grande', 'texto longo'],
    visual: { enabled: true, viewports: ['desktop', 'mobile'] },
    render: () => (
      <ScenarioGrid columns="compact">
        <ScenarioItem label="Valor comum"><MetricCard label="Matrículas" value="8.420" detail="Ano 2024" /></ScenarioItem>
        <ScenarioItem label="Valor zero"><EducationSummaryCard accessibleValue="zero por cento" label="Abandono" value="0%" year={2024} detail="Zero informado pela fonte" tone="positive" /></ScenarioItem>
        <ScenarioItem label="Dado ausente"><EducationSummaryCard accessibleValue={undefined} label="Comparação estadual" value={null} year={undefined} detail="Sem denominador comparável" /></ScenarioItem>
        <ScenarioItem label="Valor decimal"><MetricCard label="IDEB observado" value="6,4" detail="Índice de 0 a 10" size="large" /></ScenarioItem>
        <ScenarioItem label="Valor muito grande"><MetricCard label="Receita total" value="R$ 12.345.678.901,22" detail="Reais correntes" size="large" /></ScenarioItem>
        <ScenarioItem label="Rodapé longo"><StatCard eyebrow="Fonte extensa" title="Nota técnica e metodológica" detail="INEP Censo Escolar, estimativas populacionais e registros municipais consolidados para o período de referência." onClick={undefined} /></ScenarioItem>
      </ScenarioGrid>
    ),
  },
  {
    id: 'cards-explorable-states',
    category: 'Cards',
    title: 'Cards exploráveis e estados',
    description: 'Cards reais de Educação e Financiamento em estados comparáveis.',
    objective: 'Validar badges positivo, negativo e neutro, seleção, desabilitação e títulos de várias linhas.',
    states: ['badge positivo', 'badge negativo', 'badge neutro', 'selecionado', 'desabilitado'],
    visual: { enabled: true, viewports: ['notebook', 'mobile'] },
    render: () => (
      <ScenarioGrid>
        <ScenarioItem label="Educação · positivo"><EducationIndicatorCard buttonRef={undefined} indicator={educationIndicators[0].value} onSelect={() => undefined} /></ScenarioItem>
        <ScenarioItem label="Educação · negativo"><EducationIndicatorCard buttonRef={undefined} indicator={educationIndicators[1].value} onSelect={() => undefined} /></ScenarioItem>
        <ScenarioItem label="Educação · ausente"><EducationIndicatorCard buttonRef={undefined} indicator={educationIndicators[2].value} onSelect={() => undefined} /></ScenarioItem>
        <ScenarioItem label="Educação · valor grande"><EducationIndicatorCard buttonRef={undefined} indicator={educationIndicators[3].value} isSelected onSelect={() => undefined} /></ScenarioItem>
        <ScenarioItem label="Financiamento · selecionado"><FinancialIndicatorCard buttonRef={undefined} indicator={financialIndicators[0].value} isSelected onSelect={() => undefined} /></ScenarioItem>
        <ScenarioItem label="Financiamento · desabilitado">
          <DisabledFixture label="Card financeiro desabilitado"><FinancialIndicatorCard buttonRef={undefined} indicator={financialIndicators[2].value} onSelect={() => undefined} /></DisabledFixture>
        </ScenarioItem>
      </ScenarioGrid>
    ),
  },
]
