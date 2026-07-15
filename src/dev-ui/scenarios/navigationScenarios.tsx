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
  { key: 'indisponivel', label: 'Recorte temporariamente indisponível', count: 0, disabled: true },
]

function SearchControls() {
  const [value, setValue] = useState('atendimento escolar')
  return (
    <div className="dev-ui-control-stack content-area">
      <SearchField ariaLabel="Busca vazia" className="cycle-search platform-search-field" onChange={() => undefined} onClear={undefined} placeholder="Buscar indicador..." value="" />
      <SearchField ariaLabel="Busca preenchida" className="cycle-search platform-search-field" onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value)} onClear={() => setValue('')} placeholder="Buscar indicador..." value={value} />
      <SearchField ariaLabel="Busca desabilitada" className="cycle-search platform-search-field" disabled onChange={() => undefined} onClear={undefined} placeholder="Busca indisponível" value="" />
    </div>
  )
}

function TabsAndFilters() {
  const [category, setCategory] = useState('geral')
  const [period, setPeriod] = useState('atual')
  return (
    <div className="dev-ui-control-stack content-area">
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

function ExplorationToolbar() {
  const [query, setQuery] = useState('abandono escolar')
  const [scope, setScope] = useState('todos')

  return (
    <div className="dev-ui-control-stack content-area">
      <div className="platform-exploration-toolbar dev-ui-exploration-toolbar">
        <SearchField
          ariaLabel="Buscar na toolbar"
          className="platform-search-field"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          onClear={() => setQuery('')}
          placeholder="Buscar indicador..."
          value={query}
        />
        <SegmentedControl
          ariaLabel="Recorte dos resultados"
          className="platform-segmented-control platform-segmented-control--scrollable"
          optionClassName="platform-segmented-option"
          onSelect={setScope}
          options={[
            { key: 'todos', label: 'Todos os indicadores' },
            { key: 'prioritarios', label: 'Indicadores prioritários' },
            { key: 'serie', label: 'Com série histórica completa' },
          ]}
          selectedKey={scope}
        />
      </div>
      <div className="platform-results-summary" aria-live="polite">
        <strong>18 resultados</strong>
        <span>Atendimento e trajetória · busca e recorte ativos</span>
      </div>
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
    title: 'Busca, filtros e toolbar',
    description: 'Controles reais em estados vazios, preenchidos, selecionados e desabilitados, além da composição completa de exploração.',
    objective: 'Validar foco, limpeza, rótulos longos, seleção exclusiva, distribuição da toolbar e alvos mínimos de interação.',
    states: ['busca vazia', 'busca preenchida', 'selecionado', 'desabilitado', 'rótulo longo', 'toolbar completa', 'contador'],
    visual: { enabled: true, viewports: ['desktop', 'notebook', 'mobile'] },
    render: () => (
      <ScenarioGrid columns="single">
        <ScenarioGrid>
          <ScenarioItem label="Campos de busca"><SearchControls /></ScenarioItem>
          <ScenarioItem label="Filtros e segmentos"><TabsAndFilters /></ScenarioItem>
        </ScenarioGrid>
        <ScenarioItem label="Toolbar com muitos controles" description="Busca preenchida, recorte exclusivo, contador e contexto do resultado."><ExplorationToolbar /></ScenarioItem>
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
    visual: { enabled: true, viewports: ['notebook'] },
    render: () => <ScenarioItem label="Grupo financeiro"><NavigationFixture /></ScenarioItem>,
  },
]
