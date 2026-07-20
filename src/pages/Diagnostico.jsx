import { DiagnosticPanel } from '../components/DiagnosticPanel'
import { ErrorState } from '../components/ErrorState'
import { LoadingState } from '../components/LoadingState'
import { selectMunicipalDiagnosticContract } from '../features/diagnostic/diagnosticPresentation'
import { useMunicipioDiagnostic } from '../hooks/useMunicipioDiagnostic'

export function Diagnostico({ municipioData, selectedMunicipio }) {
  const slug = municipioData?.slug
  const { data, error, loading } = useMunicipioDiagnostic(slug)

  if (loading) {
    return <LoadingState message={`Carregando diagnóstico de ${selectedMunicipio}...`} />
  }

  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar o diagnóstico"
        message={error}
      />
    )
  }

  const { contract, status } = selectMunicipalDiagnosticContract(data)

  return (
    <DiagnosticPanel
      contractStatus={status}
      data={contract}
      municipio={selectedMunicipio}
      municipioSlug={slug}
    />
  )
}
