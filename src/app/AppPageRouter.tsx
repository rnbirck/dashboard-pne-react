import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import type { ComponentType } from 'react'
import { useMunicipality } from '../context/MunicipalityContext'
import { useMunicipioData } from '../hooks/useMunicipioData'
import { CyclePage } from '../pages/CyclePage'
import { Diagnostico } from '../pages/Diagnostico'
import { EducationPage } from '../features/education/EducationPage'
import { FinancialPage } from '../pages/FinancialPage'
import { Home } from '../pages/Home'
import { PneLegalGoalsPage } from '../pages/PneLegalGoalsPage'
import { PneOverviewPage } from '../pages/PneOverviewPage'
import type { AppPageKey } from '../types/app'
import type { IndicadoresPayload, MunicipioIndexEntry, MunicipioName } from '../types/data'
import type { Navigate, ParsedAppLocation } from '../types/navigation'
import { isFinancialPage } from './appRoutes'
import { EmptyMunicipioState } from './EmptyMunicipioState'

interface AppPageRouterProps {
  activePage: AppPageKey
  indicadores: IndicadoresPayload
  municipios: MunicipioName[]
  municipiosIndex: MunicipioIndexEntry[]
  navigationContext: ParsedAppLocation
  onNavigate: Navigate
}

type PneLegalGoalsPageProps = {
  indicadores: IndicadoresPayload
  municipioData?: unknown
  municipios?: MunicipioName[]
  onMunicipioChange: (value: MunicipioName | null) => void
  onNavigate: Navigate
  selectedMunicipio: MunicipioName | null
}

const TypedPneLegalGoalsPage = PneLegalGoalsPage as ComponentType<PneLegalGoalsPageProps>

export function AppPageRouter({
  activePage,
  indicadores,
  municipios,
  municipiosIndex,
  navigationContext,
  onNavigate,
}: AppPageRouterProps) {
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
      <TypedPneLegalGoalsPage
        indicadores={indicadores}
        municipios={municipios}
        onMunicipioChange={setSelectedMunicipio}
        onNavigate={onNavigate}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (isFinancialPage(activePage)) {
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
      <TypedPneLegalGoalsPage
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
      <EducationPage
        indicadores={indicadores}
        municipioData={municipioData}
        navigationContext={navigationContext}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  return null
}
