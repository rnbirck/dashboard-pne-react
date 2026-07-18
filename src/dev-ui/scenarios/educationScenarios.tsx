import { useMemo, useState } from 'react'
import { EducationIndicatorCard } from '../../components/EducationIndicatorCard.jsx'
import { MethodNote } from '../../components/MethodNote.jsx'
import { SearchField } from '../../components/SearchField.jsx'
import { EducationDemandSection } from '../../features/education/components/EducationDemandSection'
import { EducationIndicatorDetailView } from '../../features/education/components/EducationIndicatorDetailView'
import { EducationMethodologySection } from '../../features/education/components/EducationMethodologySection'
import type { EducationMunicipioData } from '../../features/education/educationTypes'
import '../../styles/education-pages.css'
import { ScenarioGrid, ScenarioItem } from '../components/ScenarioPrimitives'
import {
  educationIndicators,
  educationMunicipioFixture,
  educationMunicipioWithoutProjectionsFixture,
} from '../fixtures/catalogFixtures'
import type { EducationIndicatorFixture } from '../fixtures/catalogFixtures'
import type { CatalogScenario } from '../types'

function EducationSearchFixture({ initialValue = '' }: { initialValue?: string }) {
  const [query, setQuery] = useState(initialValue)
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR')
    if (!normalized) return educationIndicators
    return educationIndicators.filter((fixture) => (
      `${fixture.value.label} ${fixture.value.description}`.toLocaleLowerCase('pt-BR').includes(normalized)
    ))
  }, [query])

  return (
    <div className="dev-ui-control-stack content-area">
      <SearchField
        ariaLabel="Buscar indicador educacional"
        className="cycle-search platform-search-field"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
        placeholder="Buscar indicador..."
        value={query}
      />
      {results.length ? (
        <div className="education-indicator-card-grid">
          {results.map((fixture) => <EducationIndicatorCard buttonRef={undefined} indicator={fixture.value} key={fixture.id} onSelect={() => undefined} />)}
        </div>
      ) : (
        <div className="meta-grid-empty education-indicator-grid-empty" role="status">
          Nenhum indicador encontrado para “{query}”.
        </div>
      )}
    </div>
  )
}

function detailFixture(overrides: Partial<EducationIndicatorFixture> = {}) {
  return { ...educationIndicators[0].value, ...overrides }
}

const supportGridFixture = [
  {
    key: 'fixture-rede',
    type: 'bar',
    tabLabel: 'Por rede',
    tabPriority: 1,
    title: 'Atendimento por rede',
    data: [
      { label: 'Municipal', value: 96.2 },
      { label: 'Estadual', value: 93.5 },
      { label: 'Privada', value: 91.8 },
    ],
    formatLabel: (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
  },
  {
    key: 'fixture-localizacao',
    type: 'bar',
    tabLabel: 'Por localização',
    tabPriority: 2,
    title: 'Atendimento por localização da escola',
    data: [
      { label: 'Urbana', value: 95.1 },
      { label: 'Rural', value: 88.7 },
    ],
    formatLabel: (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
  },
]

const methodologyCatalog = [
  { key: 'mat-total', label: 'Total de matrículas', source: 'INEP Censo Escolar' },
  { key: 'fluxo-aprovacao', label: 'Taxa de aprovação', source: 'INEP Taxas de Rendimento Escolar' },
  { key: 'apr-ideb', label: 'IDEB', source: 'INEP SAEB/IDEB' },
]

export const educationScenarios: readonly CatalogScenario[] = [
  {
    id: 'education-search',
    category: 'Educação',
    title: 'Busca e grupos de indicadores',
    description: 'Busca real sobre um conjunto determinístico de cards educacionais.',
    objective: 'Validar busca vazia, preenchida, com resultados, sem resultados e agrupamento denso.',
    states: ['busca vazia', 'busca preenchida', 'com resultados', 'sem resultados', 'muitos itens'],
    visual: { enabled: true, viewports: ['desktop'] },
    render: () => (
      <ScenarioGrid columns="single">
        <ScenarioItem label="Busca interativa" description="Experimente “abandono” ou um termo inexistente."><EducationSearchFixture /></ScenarioItem>
        <ScenarioItem label="Busca sem resultados"><EducationSearchFixture initialValue="indicador inexistente" /></ScenarioItem>
      </ScenarioGrid>
    ),
  },
  {
    id: 'education-detail',
    category: 'Educação',
    title: 'Detalhe e séries históricas',
    description: 'Detalhe real do indicador com série completa, parcial e ausente.',
    objective: 'Inspecionar métricas, leitura rápida, gráfico, fonte e ausência de histórico no componente final.',
    states: ['detalhe', 'série completa', 'série parcial', 'sem histórico', 'título longo', 'cards de apoio'],
    visual: { enabled: true, viewports: ['notebook'] },
    render: () => (
      <ScenarioGrid columns="single">
        <ScenarioItem label="Série completa e cards de apoio"><div className="content-area"><EducationIndicatorDetailView blocos={{}} indicator={detailFixture({ explore: supportGridFixture })} /></div></ScenarioItem>
        <ScenarioItem label="Série parcial">
          <div className="content-area">
            <EducationIndicatorDetailView blocos={{}} indicator={detailFixture({
              key: 'serie-parcial',
              label: 'Indicador educacional com série histórica parcial e interrupções entre os anos observados',
              series: [{ ano: 2020, valor: 78 }, { ano: 2021, valor: null }, { ano: 2022, valor: 81.4 }, { ano: 2023, valor: null }, { ano: 2024, valor: 84.2 }],
            })} />
          </div>
        </ScenarioItem>
        <ScenarioItem label="Sem histórico"><div className="content-area"><EducationIndicatorDetailView blocos={{}} indicator={detailFixture({ key: 'sem-historico', series: [] })} /></div></ScenarioItem>
      </ScenarioGrid>
    ),
  },
  {
    id: 'education-demand-methodology',
    category: 'Educação',
    title: 'Demanda, projeções e metodologia',
    description: 'Seções reais alimentadas por projeções e metadados locais controlados.',
    objective: 'Validar cenários completos, parciais, ausentes, notas longas e fontes extensas sem acessar JSON municipal.',
    states: ['projeção completa', 'projeção parcial', 'ausente', 'metodologia', 'nota longa'],
    visual: { enabled: true, viewports: ['mobile'] },
    render: () => (
      <ScenarioGrid columns="single">
        <ScenarioItem label="Cenários de atendimento escolar">
          <EducationDemandSection municipioData={educationMunicipioFixture as unknown as EducationMunicipioData} />
        </ScenarioItem>
        <ScenarioItem label="Metodologia e fontes">
          <EducationMethodologySection catalog={methodologyCatalog} items={educationIndicators.map((fixture) => fixture.value)} />
        </ScenarioItem>
        <ScenarioItem label="Nota metodológica extensa">
          <div className="dev-ui-method-note">
            <MethodNote>Os valores deste cenário são fixtures determinísticas. Eles verificam a apresentação de uma nota metodológica longa, com fonte extensa, limitações de cobertura e ressalva explícita de que ausência de dado não representa valor zero.</MethodNote>
          </div>
        </ScenarioItem>
      </ScenarioGrid>
    ),
  },
  {
    id: 'education-demand-empty',
    category: 'Educação',
    title: 'Atendimento escolar sem projeção',
    description: 'Estado compacto da página quando nenhum indicador possui trajetória futura publicável.',
    objective: 'Validar a ausência de filtros, cards e gráficos quando não há projeções.',
    states: ['sem projeção'],
    render: () => (
      <ScenarioGrid columns="single">
        <ScenarioItem label="Município sem projeções publicáveis">
          <EducationDemandSection municipioData={educationMunicipioWithoutProjectionsFixture as unknown as EducationMunicipioData} />
        </ScenarioItem>
      </ScenarioGrid>
    ),
  },
]
