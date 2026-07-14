import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { AppPageRouter } from './AppPageRouter'

export function AppContent({ activePage, initialData, onNavigate }) {
  if (initialData.loading) {
    return <LoadingState message="Carregando base do dashboard..." />
  }

  if (initialData.error) {
    return <ErrorState title="Erro ao carregar dados iniciais" message={initialData.error} />
  }

  if (!initialData.indicadores) {
    return <LoadingState message="Preparando município..." />
  }

  return (
    <AppPageRouter
      activePage={activePage}
      indicadores={initialData.indicadores}
      municipios={initialData.municipios}
      municipiosIndex={initialData.municipiosIndex}
      onNavigate={onNavigate}
    />
  )
}
