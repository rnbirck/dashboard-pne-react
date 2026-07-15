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
}

export interface CatalogScenario extends ScenarioMetadata {
  render: () => ReactNode
}

export const PREVIEW_WIDTHS = [
  { key: 'desktop', label: 'Desktop', detail: '1366 px', width: 1366 },
  { key: 'notebook', label: 'Notebook', detail: '1024 px', width: 1024 },
  { key: 'mobile', label: 'Mobile', detail: '390 px', width: 390 },
  { key: 'fluid', label: 'Fluido', detail: '100%', width: null },
] as const

export type PreviewWidth = (typeof PREVIEW_WIDTHS)[number]['key']

export interface PreviewWidthOption {
  detail: string
  key: PreviewWidth
  label: string
  width: number | null
}
