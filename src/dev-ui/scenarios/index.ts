import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_IDS,
  CATALOG_CATEGORY_OPTIONS,
  PREVIEW_WIDTHS,
} from '../types'
import type { CatalogScenario } from '../types'
import { cardScenarios } from './cardScenarios'
import { chartScenarios } from './chartScenarios'
import { educationScenarios } from './educationScenarios'
import { financeScenarios } from './financeScenarios'
import { foundationScenarios } from './foundationScenarios'
import { navigationScenarios } from './navigationScenarios'
import { pneScenarios } from './pneScenarios'
import { stateScenarios } from './stateScenarios'
import { tableScenarios } from './tableScenarios'

export const catalogScenarios: readonly CatalogScenario[] = [
  ...foundationScenarios,
  ...cardScenarios,
  ...educationScenarios,
  ...pneScenarios,
  ...financeScenarios,
  ...navigationScenarios,
  ...tableScenarios,
  ...chartScenarios,
  ...stateScenarios,
]

const scenarioIds = new Set<string>()
const duplicateScenarioIds = new Set<string>()

for (const scenario of catalogScenarios) {
  if (scenarioIds.has(scenario.id)) duplicateScenarioIds.add(scenario.id)
  scenarioIds.add(scenario.id)
}

if (duplicateScenarioIds.size > 0) {
  throw new Error(`IDs de cenário duplicados: ${Array.from(duplicateScenarioIds).sort().join(', ')}`)
}

const registeredCategories = new Set(catalogScenarios.map((scenario) => scenario.category))
const missingCategories = CATALOG_CATEGORIES.filter((category) => !registeredCategories.has(category))

if (missingCategories.length > 0) {
  throw new Error(`Categorias sem cenários registrados: ${missingCategories.join(', ')}`)
}

export const catalogManifest = {
  categories: CATALOG_CATEGORY_OPTIONS,
  scenarios: catalogScenarios.map((scenario) => ({
    categoryId: CATALOG_CATEGORY_IDS[scenario.category],
    categoryLabel: scenario.category,
    id: scenario.id,
    title: scenario.title,
    visual: scenario.visual ?? { enabled: false, viewports: [] },
  })),
  viewports: PREVIEW_WIDTHS.filter((viewport) => viewport.key !== 'fluid').map((viewport) => ({
    height: viewport.height,
    id: viewport.key,
    width: viewport.width,
  })),
} as const
