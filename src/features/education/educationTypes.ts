import type { IndicadoresPayload, MunicipioData, MunicipioName } from '../../types/data'
import type { ParsedAppLocation } from '../../types/navigation'

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
  indicatorKeys: EducationIndicatorKey[]
  [property: string]: unknown
}

export interface EducationNavigationState {
  panoramaTheme: EducationThemeKey
  section: EducationSectionKey
  detailKey: EducationIndicatorKey
  shouldApplyTheme: boolean
}

export interface EducationPageProps {
  indicadores: IndicadoresPayload
  municipioData?: MunicipioData
  navigationContext: ParsedAppLocation
  selectedMunicipio: MunicipioName | null
}
