import { DiagnosticPanel } from '../components/DiagnosticPanel'

export function Diagnostico({ indicadores, municipioData, selectedMunicipio }) {
  const diagnostico = municipioData?.pne_2026_2036?.diagnostico
  const cycleCategories = indicadores?.cycles?.pne_2026_2036?.categories ?? []
  const cycleResults = municipioData?.pne_2026_2036?.indicadores ?? {}

  return (
    <DiagnosticPanel
      categories={cycleCategories}
      data={diagnostico}
      municipio={selectedMunicipio}
      results={cycleResults}
    />
  )
}
