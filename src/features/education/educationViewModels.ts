import type { EducationSectionKey } from './educationTypes'

export interface EducationPageViewModel {
  contextScope: string
  isDemandSection: boolean
  isMethodologySection: boolean
  isOverviewSection: boolean
}

export function formatEducationIndicatorCount(count: number): string {
  return `${count} indicador${count === 1 ? '' : 'es'}`
}

export function buildEducationPageViewModel({
  sectionItemCount,
  selectedSectionKey,
  sectionKeys,
}: {
  sectionItemCount: number
  selectedSectionKey: EducationSectionKey
  sectionKeys: { demand: EducationSectionKey; methodology: EducationSectionKey; overview: EducationSectionKey }
}): EducationPageViewModel {
  const isOverviewSection = selectedSectionKey === sectionKeys.overview
  const isDemandSection = selectedSectionKey === sectionKeys.demand
  const isMethodologySection = selectedSectionKey === sectionKeys.methodology
  const contextScope = sectionItemCount > 0
    ? formatEducationIndicatorCount(sectionItemCount)
    : isOverviewSection
      ? 'Síntese municipal'
      : isDemandSection
        ? 'Demanda e projeções'
        : 'Fontes e critérios'

  return { contextScope, isDemandSection, isMethodologySection, isOverviewSection }
}
