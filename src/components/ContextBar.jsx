import { MunicipalitySelector } from './MunicipalitySelector'

const PAGE_CRUMBS = {
  diagnostico: 'Metas do PNE / Situação do município',
  educacao: 'Indicadores de Educação',
  financeiros: 'Indicadores Financeiros da Educação',
  home: 'Home',
  pne2014: 'Metas do PNE / Ciclo anterior',
  pne2026: 'Metas do PNE / Próximo ciclo',
}

export function ContextBar({
  activePage,
  municipios,
  onMunicipioChange,
  selectedMunicipio,
}) {
  const crumb = PAGE_CRUMBS[activePage] ?? 'Dashboard PNE'

  return (
    <div className="context-bar">
      <div className="context-bar__selector">
        <MunicipalitySelector
          municipios={municipios}
          selectedMunicipio={selectedMunicipio}
          onChange={onMunicipioChange}
          placeholder="Buscar município"
        />
      </div>

      <div className="context-bar__crumb" aria-label="Localização atual">
        {crumb}
      </div>

      <div className="context-bar__meta">Dados oficiais do painel</div>
    </div>
  )
}
