import type { IndicadoresPayload, MunicipioData, MunicipioName } from '../../types/data'
import type { ParsedAppLocation } from '../../types/navigation'
import type { PlanningScenarios } from '../../data/planningScenarios'
import type { EducationAttendancePayload } from './educationAttendanceTypes'

export type EducationSectionKey = string
export type EducationIndicatorKey = string
export type EducationThemeKey = string

export interface EducationIndicatorCatalogItem {
  key: EducationIndicatorKey
  section?: EducationSectionKey
  sections?: EducationSectionKey[]
  label?: string
  description?: string
  themeKey?: EducationThemeKey
}

export interface EducationIndicatorResult {
  key: EducationIndicatorKey
  label: string
  description?: string
  themeLabel?: string
  categoryLabel?: string
  searchText?: string
  [property: string]: unknown
}

export interface EducationSection {
  key: EducationSectionKey
  label?: string
  description?: string
  indicatorKeys?: EducationIndicatorKey[]
}

export interface EducationSectionGroup {
  key?: string
  label?: string
  description?: string
  indicatorKeys: EducationIndicatorKey[]
  [property: string]: unknown
}

export interface EducationNavigationState {
  panoramaTheme: EducationThemeKey
  section: EducationSectionKey
  detailKey: EducationIndicatorKey
  shouldApplyTheme: boolean
}

export interface EducationPneContext {
  cenarios_planejamento?: PlanningScenarios
  indicadores?: Record<string, unknown>
  projecoes?: Record<string, unknown>
}

export interface EducationMunicipioData extends MunicipioData {
  educacao?: {
    atendimento_cenarios?: EducationAttendancePayload
  }
  pne_2026_2036?: EducationPneContext
}

export interface EducationPageProps {
  indicadores: IndicadoresPayload
  municipioData?: EducationMunicipioData | null
  municipalitySlug?: string | null
  navigationContext: ParsedAppLocation
  selectedMunicipio: MunicipioName | null
}
