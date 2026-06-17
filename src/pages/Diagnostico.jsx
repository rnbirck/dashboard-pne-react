import { useMemo } from 'react'
import { DiagnosticPanel } from '../components/DiagnosticPanel'
import { normalizePopulationPercentResults } from '../utils/indicatorValues'

export function Diagnostico({ indicadores, municipioData, selectedMunicipio }) {
  const diagnostico = municipioData?.pne_2026_2036?.diagnostico
  const cycleCategories = useMemo(
    () => indicadores?.cycles?.pne_2026_2036?.categories ?? [],
    [indicadores],
  )
  const cycleResults = useMemo(
    () => municipioData?.pne_2026_2036?.indicadores ?? {},
    [municipioData],
  )
  const cycleItems = useMemo(
    () => cycleCategories.flatMap((category) => category.items ?? []),
    [cycleCategories],
  )
  const normalizedCycleResults = useMemo(
    () => normalizePopulationPercentResults(cycleResults, cycleItems),
    [cycleResults, cycleItems],
  )

  return (
    <DiagnosticPanel
      categories={cycleCategories}
      data={diagnostico}
      municipio={selectedMunicipio}
      results={normalizedCycleResults}
    />
  )
}
