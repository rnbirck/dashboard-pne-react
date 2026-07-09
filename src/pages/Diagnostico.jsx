import { useMemo } from 'react'
import { DiagnosticPanel } from '../components/DiagnosticPanel'
import { buildThematicGroups } from '../data/thematicGroups'
import { normalizePopulationPercentResults } from '../utils/indicatorValues'
import { filterPneComparableCategories } from '../utils/pneDisplayRules'

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
  const comparableCycleCategories = useMemo(
    () => filterPneComparableCategories(cycleCategories, normalizedCycleResults),
    [cycleCategories, normalizedCycleResults],
  )
  const thematicCategories = useMemo(
    () => buildThematicGroups(comparableCycleCategories),
    [comparableCycleCategories],
  )

  return (
    <DiagnosticPanel
      categories={thematicCategories}
      data={diagnostico}
      municipio={selectedMunicipio}
      results={normalizedCycleResults}
    />
  )
}
