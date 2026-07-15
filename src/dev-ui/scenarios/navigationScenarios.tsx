import { useState } from 'react'
import { CategoryTabs } from '../../components/CategoryTabs.jsx'
import { SearchField } from '../../components/SearchField.jsx'
import { SegmentedControl } from '../../components/SegmentedControl.jsx'
import { SidebarAccordionGroup } from '../../components/SidebarAccordionGroup.jsx'
import { DisabledFixture, ScenarioGrid, ScenarioItem } from '../components/ScenarioPrimitives'
import type { CatalogScenario } from '../types'

const categories = [
  { key: 'geral', label: 'Visão geral', count: 12 },
  { key: 'trajetoria', label: 'Trajetória escolar e aprendizagem ao longo do período', shortLabel: 'Trajetória e aprendizagem', count: 8 },
  { key: 'infraestrutura', label: 'Infraestrutura', count: 16 },
]

function SearchControls() {
  const [value, setValue] = useState('atendimento escolar')
  return (
    <div className="dev-ui-control-stack">
      <SearchField ariaLabel="Busca vazia" className="cycle-search platform-search-field" onChange={() => undefined} onClear={undefined} placeholder="Buscar indicador..." value="" />
      <SearchField ariaLabel="Busca preenchida" className="cycle-search platform-search-field" onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value)} onClear={() => setValue('')} placeholder="Buscar indicador..." value={value} />
    </div>
  )
}

function TabsAndFilters() {
  const [category, setCategory] = useState('geral')
  const [period, setPeriod] = useState('atual')
  return (
    <div className="dev-ui-control-stack">
      <CategoryTabs categories={categories} onSelectCategory={setCategory} selectedCategory={category} />
      <SegmentedControl
        ariaLabel="Período analisado"
        className="indicator-stage-segmented platform-segmented-control"
        optionClassName="indicator-stage-segmented__button platform-segmented-option"
        onSelect={setPeriod}
        options={[{ key: 'atual', label: 'Período atual' }, { key: 'historico', label: 'Série histórica completa' }]}
        selectedKey={period}
      />
      <DisabledFixture label="Filtro desabilitado">
        <SegmentedControl
          ariaLabel="Filtro desabilitado"
          className="indicator-stage-segmented platform-segmented-control"
          optionClassName="indicator-stage-segmented__button platform-segmented-option"
          onSelect={() => undefined}
          options={[{ key: 'indisponivel', label: 'Comparação indisponível' }]}
          selectedKey="indisponivel"
        />
      </DisabledFixture>
    </div>
  )
}

function CatalogIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 9h8M8 13h6" /></svg>
}

function NavigationFixture() {
  const [isOpen, setIsOpen] = useState(true)
  const [activeItem, setActiveItem] = useState('fundeb')
  return (
    <div className="dev-ui-navigation-demo">
      <SidebarAccordionGroup
        activeItemKey={activeItem}
        icon={CatalogIcon}
        id="financeiro"
        isOpen={isOpen}
        items={[
          { key: 'fundeb', label: 'FUNDEB', target: 'fundeb' },
          { key: 'siope', label: 'SIOPE e indicadores de aplicação em educação', target: 'siope' },
          { key: 'pnate', label: 'PNATE', target: 'pnate' },
        ]}
        label="Financiamento da educação"
        onNavigate={setActiveItem}
        onToggle={() => setIsOpen((current) => !current)}
      />
    </div>
  )
}

export const navigationScenarios: readonly CatalogScenario[] = [
  {
    id: 'navigation-search-filters',
    category: 'Filtros e navegação',
    title: 'Busca, filtros e abas',
    description: 'Controles reais em estados vazios, preenchidos, selecionados e desabilitados.',
    objective: 'Validar foco, limpeza, labels longos, seleção exclusiva e alvos mínimos de interação.',
    states: ['busca vazia', 'busca preenchida', 'selecionado', 'desabilitado', 'rótulo longo'],
    render: () => (
      <ScenarioGrid>
        <ScenarioItem label="Campos de busca"><SearchControls /></ScenarioItem>
        <ScenarioItem label="Abas e filtros"><TabsAndFilters /></ScenarioItem>
      </ScenarioGrid>
    ),
  },
  {
    id: 'navigation-submenu',
    category: 'Filtros e navegação',
    title: 'Navegação com submenu',
    description: 'Grupo de navegação real com item ativo, inativo, expandido e recolhido.',
    objective: 'Inspecionar duas linhas, aria-expanded, aria-current e navegação por teclado.',
    states: ['submenu', 'ativo', 'inativo', 'expandido', 'recolhido', 'duas linhas'],
    render: () => <ScenarioItem label="Grupo financeiro"><NavigationFixture /></ScenarioItem>,
  },
]
