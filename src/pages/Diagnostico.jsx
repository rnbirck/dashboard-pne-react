import { DiagnosticPanel } from '../components/DiagnosticPanel'

export function Diagnostico({ municipioData, selectedMunicipio }) {
  const diagnostico = municipioData?.pne_2026_2036?.diagnostico

  return <DiagnosticPanel data={diagnostico} municipio={selectedMunicipio} />
}
