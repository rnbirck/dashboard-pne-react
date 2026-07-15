import { CATALOG_CATEGORIES } from '../types'
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

const registeredCategories = new Set(catalogScenarios.map((scenario) => scenario.category))
const missingCategories = CATALOG_CATEGORIES.filter((category) => !registeredCategories.has(category))

if (missingCategories.length > 0) {
  throw new Error(`Categorias sem cenários registrados: ${missingCategories.join(', ')}`)
}
