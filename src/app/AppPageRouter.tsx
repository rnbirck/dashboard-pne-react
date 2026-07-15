import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { useMunicipality } from '../context/MunicipalityContext'
import { useMunicipioData } from '../hooks/useMunicipioData'
import { Home } from '../pages/Home'
import type { AppPageKey } from '../types/app'
import type { IndicadoresPayload, MunicipioIndexEntry, MunicipioName } from '../types/data'
import type { Navigate, ParsedAppLocation } from '../types/navigation'
import { isFinancialPage } from './appRoutes'
import { EmptyMunicipioState } from './EmptyMunicipioState'
import { PageLoadBoundary } from './PageLoadBoundary'

const LazyCyclePage = lazy(() => import('../pages/CyclePage').then((module) => ({ default: module.CyclePage })))
const LazyDiagnostico = lazy(() => import('../pages/Diagnostico').then((module) => ({ default: module.Diagnostico })))
const LazyEducationPage = lazy(() => import('../features/education/EducationPage').then((module) => ({ default: module.EducationPage })))
const LazyFinancialPage = lazy(() => import('../pages/FinancialPage').then((module) => ({ default: module.FinancialPage })))
const LazyPneLegalGoalsPage = lazy(() => import('../pages/PneLegalGoalsPage').then((module) => ({ default: module.PneLegalGoalsPage })))
const LazyPneOverviewPage = lazy(() => import('../pages/PneOverviewPage').then((module) => ({ default: module.PneOverviewPage })))

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

const TypedPneLegalGoalsPage = LazyPneLegalGoalsPage as ComponentType<PneLegalGoalsPageProps>

function LazyPageBoundary({ children, page }: { children: ReactNode; page: AppPageKey }) {
  return (
    <PageLoadBoundary key={page}>
      <Suspense fallback={<LoadingState message="Carregando página..." />}>
        {children}
      </Suspense>
    </PageLoadBoundary>
  )
}

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
    return (
      <LazyPageBoundary page={activePage}>
        <LazyPneOverviewPage onNavigate={onNavigate} />
      </LazyPageBoundary>
    )
  }

  if (activePage === 'pne-legal-goals' && !selectedMunicipio) {
    return (
      <LazyPageBoundary page={activePage}>
        <TypedPneLegalGoalsPage
          indicadores={indicadores}
          municipios={municipios}
          onMunicipioChange={setSelectedMunicipio}
          onNavigate={onNavigate}
          selectedMunicipio={selectedMunicipio}
        />
      </LazyPageBoundary>
    )
  }

  if (isFinancialPage(activePage)) {
    return (
      <LazyPageBoundary page={activePage}>
        <LazyFinancialPage
          municipioData={municipioData}
          municipioError={municipioError}
          municipioLoading={municipioLoading}
          pageKey={activePage}
          selectedMunicipio={selectedMunicipio}
        />
      </LazyPageBoundary>
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
      <LazyPageBoundary page={activePage}>
        <LazyCyclePage
        cycle="pne_2014_2024"
        indicadores={indicadores}
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
        title="PNE 2014–2024"
        />
      </LazyPageBoundary>
    )
  }

  if (activePage === 'pne2026') {
    return (
      <LazyPageBoundary page={activePage}>
        <LazyCyclePage
        cycle="pne_2026_2036"
        indicadores={indicadores}
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
        title="PNE 2026–2036"
        />
      </LazyPageBoundary>
    )
  }

  if (activePage === 'pne-legal-goals') {
    return (
      <LazyPageBoundary page={activePage}>
        <TypedPneLegalGoalsPage
          indicadores={indicadores}
          municipioData={municipioData}
          municipios={municipios}
          onMunicipioChange={setSelectedMunicipio}
          onNavigate={onNavigate}
          selectedMunicipio={selectedMunicipio}
        />
      </LazyPageBoundary>
    )
  }

  if (activePage === 'diagnostico') {
    return (
      <LazyPageBoundary page={activePage}>
        <LazyDiagnostico
          indicadores={indicadores}
          municipioData={municipioData}
          selectedMunicipio={selectedMunicipio}
        />
      </LazyPageBoundary>
    )
  }

  if (activePage === 'educacao') {
    return (
      <LazyPageBoundary page={activePage}>
        <LazyEducationPage
          indicadores={indicadores}
          municipioData={municipioData}
          navigationContext={navigationContext}
          selectedMunicipio={selectedMunicipio}
        />
      </LazyPageBoundary>
    )
  }

  return null
}
