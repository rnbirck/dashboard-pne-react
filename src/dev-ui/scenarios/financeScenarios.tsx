import { FinancialIndicatorCard, FinancialMetricStrip } from '../../components/FinancialIndicatorPrimitives.jsx'
import { MetricCard } from '../../components/MetricCard.jsx'
import { DisabledFixture, ScenarioGrid, ScenarioItem } from '../components/ScenarioPrimitives'
import { financialIndicators } from '../fixtures/catalogFixtures'
import type { CatalogScenario } from '../types'

export const financeScenarios: readonly CatalogScenario[] = [
  {
    id: 'finance-module-cards',
    category: 'Financiamento',
    title: 'FUNDEB, VAAR, SIOPE e PNATE',
    description: 'A família real de cards financeiros com fixtures específicas por módulo.',
    objective: 'Validar moeda, percentual, zero, ausência, variação positiva ou negativa e unidade extensa.',
    states: ['FUNDEB', 'VAAR', 'SIOPE', 'PNATE', 'zero', 'ausente', 'positivo', 'negativo'],
    render: () => (
      <ScenarioGrid>
        {financialIndicators.map((fixture) => (
          <ScenarioItem description={fixture.description} key={fixture.id} label={fixture.id.toLocaleUpperCase('pt-BR')}>
            <FinancialIndicatorCard buttonRef={undefined} indicator={fixture.value} onSelect={() => undefined} />
          </ScenarioItem>
        ))}
      </ScenarioGrid>
    ),
  },
  {
    id: 'finance-summary-states',
    category: 'Financiamento',
    title: 'Faixa de métricas e interação',
    description: 'Primitivas financeiras em composição de síntese, seleção e desabilitação.',
    objective: 'Verificar alinhamento de valores grandes e estados funcionais sem carregar painéis municipais completos.',
    states: ['síntese', 'valor grande', 'selecionado', 'desabilitado'],
    render: () => (
      <ScenarioGrid columns="single">
        <ScenarioItem label="Faixa de resumo">
          <FinancialMetricStrip>
            <MetricCard label="Receita" value="R$ 18,5 mi" detail="2024" size="large" />
            <MetricCard label="Aplicação" value="24,7%" detail="SIOPE" />
            <MetricCard label="VAAR" value="R$ 0" detail="Zero informado" />
            <MetricCard label="Comparação" value="—" detail="Indisponível" />
          </FinancialMetricStrip>
        </ScenarioItem>
        <ScenarioItem label="Card selecionado"><FinancialIndicatorCard buttonRef={undefined} indicator={financialIndicators[0].value} isSelected onSelect={() => undefined} /></ScenarioItem>
        <ScenarioItem label="Card desabilitado"><DisabledFixture label="Indicador financeiro desabilitado"><FinancialIndicatorCard buttonRef={undefined} indicator={financialIndicators[3].value} onSelect={() => undefined} /></DisabledFixture></ScenarioItem>
      </ScenarioGrid>
    ),
  },
]
