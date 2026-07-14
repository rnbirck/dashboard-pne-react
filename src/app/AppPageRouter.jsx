import { useMunicipality } from '../context/MunicipalityContext'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { CyclePage } from '../pages/CyclePage'
import { Diagnostico } from '../pages/Diagnostico'
import { EducacaoPage } from '../pages/EducacaoPage'
import { FinancialPage } from '../pages/FinancialPage'
import { Home } from '../pages/Home'
import { PneLegalGoalsPage } from '../pages/PneLegalGoalsPage'
import { PneOverviewPage } from '../pages/PneOverviewPage'
import { useMunicipioData } from '../hooks/useMunicipioData'
import { FINANCIAL_PAGES } from './appRoutes'
import { EmptyMunicipioState } from './EmptyMunicipioState'

export function AppPageRouter({
  activePage,
  indicadores,
  municipios,
  municipiosIndex,
  onNavigate,
}) {
  const { selectedMunicipio, setSelectedMunicipio } = useMunicipality()
  const {
    data: municipioData,
    error: municipioError,
    loading: municipioLoading,
  } = useMunicipioData(municipiosIndex, selectedMunicipio)

  if (activePage === 'home') {
    return <Home onNavigate={onNavigate} selectedMunicipio={selectedMunicipio} />
  }

  if (activePage === 'pne-overview') {
    return <PneOverviewPage onNavigate={onNavigate} />
  }

  if (activePage === 'pne-legal-goals' && !selectedMunicipio) {
    return (
      <PneLegalGoalsPage
        indicadores={indicadores}
        municipios={municipios}
        onMunicipioChange={setSelectedMunicipio}
        onNavigate={onNavigate}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (FINANCIAL_PAGES.has(activePage)) {
    return (
      <FinancialPage
        municipioData={municipioData}
        municipioError={municipioError}
        municipioLoading={municipioLoading}
        pageKey={activePage}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (!selectedMunicipio) {
    return (
      <EmptyMunicipioState
        onNavigate={onNavigate}
        onMunicipioChange={setSelectedMunicipio}
        municipios={municipios}
      />
    )
  }

  if (municipioLoading) {
    return <LoadingState message={`Carregando dados de ${selectedMunicipio}...`} />
  }

  if (municipioError) {
    return (
      <ErrorState
        title="Erro ao carregar dados do município"
        message={municipioError}
      />
    )
  }

  if (activePage === 'pne2014') {
    return (
      <CyclePage
        cycle="pne_2014_2024"
        indicadores={indicadores}
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
        title="PNE 2014–2024"
      />
    )
  }

  if (activePage === 'pne2026') {
    return (
      <CyclePage
        cycle="pne_2026_2036"
        indicadores={indicadores}
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
        title="PNE 2026–2036"
      />
    )
  }

  if (activePage === 'pne-legal-goals') {
    return (
      <PneLegalGoalsPage
        indicadores={indicadores}
        municipioData={municipioData}
        municipios={municipios}
        onMunicipioChange={setSelectedMunicipio}
        onNavigate={onNavigate}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (activePage === 'diagnostico') {
    return (
      <Diagnostico
        indicadores={indicadores}
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (activePage === 'educacao') {
    return (
      <EducacaoPage
        indicadores={indicadores}
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  return null
}
