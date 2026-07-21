import { DiagnosticPanel } from '../components/DiagnosticPanel'
import { ContentState } from '../components/ContentState'
import { LoadingState } from '../components/LoadingState'
import { selectMunicipalDiagnosticContract } from '../features/diagnostic/diagnosticPresentation'
import { useMunicipioDiagnostic } from '../hooks/useMunicipioDiagnostic'

export function Diagnostico({ municipioData, selectedMunicipio }) {
  const slug = municipioData?.slug
  const { data, error, loading } = useMunicipioDiagnostic(slug)

  if (loading) {
    return <LoadingState message={`Carregando o diagnóstico de ${selectedMunicipio}…`} />
  }

  if (error) {
    return (
      <ContentState kind="error" className="pne-diagnostic-error">
        <strong>Não foi possível abrir o diagnóstico agora. Tente novamente.</strong>
        <button type="button" onClick={() => globalThis.window?.location.reload()}>
          Tentar novamente
        </button>
      </ContentState>
    )
  }

  const { contract, status } = selectMunicipalDiagnosticContract(data)

  return (
    <DiagnosticPanel
      contractStatus={status}
      data={contract}
      municipio={selectedMunicipio}
    />
  )
}
