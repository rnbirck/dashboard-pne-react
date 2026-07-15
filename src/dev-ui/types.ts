import type { ReactNode } from 'react'

export const CATALOG_CATEGORIES = [
  'Fundamentos',
  'Cards',
  'Educação',
  'PNE',
  'Financiamento',
  'Filtros e navegação',
  'Tabelas',
  'Gráficos',
  'Estados da interface',
] as const

export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number]

export const CATALOG_CATEGORY_IDS = {
  'Fundamentos': 'foundations',
  'Cards': 'cards',
  'Educação': 'education',
  'PNE': 'pne',
  'Financiamento': 'finance',
  'Filtros e navegação': 'navigation',
  'Tabelas': 'tables',
  'Gráficos': 'charts',
  'Estados da interface': 'states',
} as const satisfies Record<CatalogCategory, string>

export type CatalogCategoryId = (typeof CATALOG_CATEGORY_IDS)[CatalogCategory]

export const CATALOG_CATEGORY_OPTIONS: readonly {
  id: CatalogCategoryId
  label: CatalogCategory
}[] = CATALOG_CATEGORIES.map((label) => ({
  id: CATALOG_CATEGORY_IDS[label],
  label,
}))

export interface Fixture<TValue> {
  description: string
  id: string
  value: TValue
}

export interface ScenarioMetadata {
  category: CatalogCategory
  description: string
  id: string
  objective: string
  states: readonly string[]
  title: string
  visual?: VisualScenarioConfig
}

export interface CatalogScenario extends ScenarioMetadata {
  render: () => ReactNode
}

export const PREVIEW_WIDTHS = [
  { key: 'desktop', label: 'Desktop', detail: '1366 px', height: 900, width: 1366 },
  { key: 'notebook', label: 'Notebook', detail: '1024 px', height: 900, width: 1024 },
  { key: 'mobile', label: 'Mobile', detail: '390 px', height: 844, width: 390 },
  { key: 'fluid', label: 'Fluido', detail: '100%', height: null, width: null },
] as const

export type PreviewWidth = (typeof PREVIEW_WIDTHS)[number]['key']
export type CatalogViewport = Exclude<PreviewWidth, 'fluid'>

export interface VisualScenarioConfig {
  captureTarget?: 'preview' | 'component'
  enabled: boolean
  maxDiffRatio?: number
  viewports: readonly CatalogViewport[]
}

export interface PreviewWidthOption {
  detail: string
  height: number | null
  key: PreviewWidth
  label: string
  width: number | null
}
