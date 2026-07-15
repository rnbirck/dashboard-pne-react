import fs from 'node:fs'
import path from 'node:path'

function optionValue(argv, index, name) {
  const argument = argv[index]
  const inlinePrefix = `${name}=`
  if (argument.startsWith(inlinePrefix)) return { consumed: 0, value: argument.slice(inlinePrefix.length) }
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`O argumento ${name} exige um valor.`)
  return { consumed: 1, value }
}

export function parseVisualArguments(argv) {
  const filters = { category: null, scenario: null, update: false, viewport: null }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--update') {
      filters.update = true
      continue
    }
    if (argument === '--scenario' || argument.startsWith('--scenario=')) {
      const { consumed, value } = optionValue(argv, index, '--scenario')
      filters.scenario = value
      index += consumed
      continue
    }
    if (argument === '--category' || argument.startsWith('--category=')) {
      const { consumed, value } = optionValue(argv, index, '--category')
      filters.category = value
      index += consumed
      continue
    }
    if (argument === '--viewport' || argument.startsWith('--viewport=')) {
      const { consumed, value } = optionValue(argv, index, '--viewport')
      filters.viewport = value
      index += consumed
      continue
    }
    throw new Error(`Argumento desconhecido: ${argument}. Use --scenario, --category, --viewport ou --update.`)
  }
  return filters
}

function duplicateValues(values) {
  const seen = new Set()
  const duplicates = new Set()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates].sort()
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`Manifesto inválido: ${label} deve ser uma lista.`)
  return value
}

export function validateCatalogManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') throw new Error('Manifesto do catálogo ausente ou inválido.')
  const categories = requireArray(manifest.categories, 'categories')
  const scenarios = requireArray(manifest.scenarios, 'scenarios')
  const viewports = requireArray(manifest.viewports, 'viewports')
  const categoryIds = categories.map((category) => category.id)
  const scenarioIds = scenarios.map((scenario) => scenario.id)
  const viewportIds = viewports.map((viewport) => viewport.id)

  const duplicateCategoryIds = duplicateValues(categoryIds)
  const duplicateScenarioIds = duplicateValues(scenarioIds)
  const duplicateViewportIds = duplicateValues(viewportIds)
  if (duplicateCategoryIds.length) throw new Error(`IDs de categoria duplicados: ${duplicateCategoryIds.join(', ')}`)
  if (duplicateScenarioIds.length) throw new Error(`IDs de cenário duplicados: ${duplicateScenarioIds.join(', ')}`)
  if (duplicateViewportIds.length) throw new Error(`IDs de viewport duplicados: ${duplicateViewportIds.join(', ')}`)

  const validCategories = new Set(categoryIds)
  const validViewports = new Set(viewportIds)
  for (const viewport of viewports) {
    if (!viewport.id || !Number.isInteger(viewport.width) || !Number.isInteger(viewport.height)) {
      throw new Error(`Viewport inválido no manifesto: ${JSON.stringify(viewport)}`)
    }
  }
  for (const scenario of scenarios) {
    if (!scenario.id || !validCategories.has(scenario.categoryId)) {
      throw new Error(`Cenário inválido no manifesto: ${scenario.id ?? '(sem id)'}`)
    }
    const visual = scenario.visual
    if (!visual || typeof visual.enabled !== 'boolean' || !Array.isArray(visual.viewports)) {
      throw new Error(`Metadados visuais inválidos: ${scenario.id}`)
    }
    const invalidViewports = visual.viewports.filter((viewport) => !validViewports.has(viewport))
    if (invalidViewports.length) {
      throw new Error(`${scenario.id}: viewports visuais inválidos: ${invalidViewports.join(', ')}`)
    }
    const duplicates = duplicateValues(visual.viewports)
    if (duplicates.length) throw new Error(`${scenario.id}: viewports duplicados: ${duplicates.join(', ')}`)
    if (visual.enabled && visual.viewports.length === 0) {
      throw new Error(`${scenario.id}: cenário visual habilitado sem viewport.`)
    }
    if (visual.captureTarget && !['preview', 'component'].includes(visual.captureTarget)) {
      throw new Error(`${scenario.id}: alvo de captura inválido: ${visual.captureTarget}`)
    }
    if (visual.maxDiffRatio !== undefined
      && (typeof visual.maxDiffRatio !== 'number' || visual.maxDiffRatio < 0 || visual.maxDiffRatio > 1)) {
      throw new Error(`${scenario.id}: maxDiffRatio deve estar entre 0 e 1.`)
    }
  }
  return manifest
}

function validOptions(values) {
  return values.join(', ')
}

export function selectVisualCases(manifest, filters) {
  validateCatalogManifest(manifest)
  const scenarioIds = manifest.scenarios.map((scenario) => scenario.id)
  const categoryIds = manifest.categories.map((category) => category.id)
  const viewportIds = manifest.viewports.map((viewport) => viewport.id)
  if (filters.scenario && !scenarioIds.includes(filters.scenario)) {
    throw new Error(`Cenário inexistente: ${filters.scenario}. Opções válidas: ${validOptions(scenarioIds)}`)
  }
  if (filters.category && !categoryIds.includes(filters.category)) {
    throw new Error(`Categoria inexistente: ${filters.category}. Opções válidas: ${validOptions(categoryIds)}`)
  }
  if (filters.viewport && !viewportIds.includes(filters.viewport)) {
    throw new Error(`Viewport inexistente: ${filters.viewport}. Opções válidas: ${validOptions(viewportIds)}`)
  }

  const viewportById = new Map(manifest.viewports.map((viewport) => [viewport.id, viewport]))
  const selectedScenarios = manifest.scenarios.filter((scenario) => (
    scenario.visual.enabled
      && (!filters.scenario || scenario.id === filters.scenario)
      && (!filters.category || scenario.categoryId === filters.category)
  ))
  const cases = selectedScenarios.flatMap((scenario) => scenario.visual.viewports
    .filter((viewport) => !filters.viewport || viewport === filters.viewport)
    .map((viewport) => ({
      captureTarget: scenario.visual.captureTarget ?? 'preview',
      categoryId: scenario.categoryId,
      height: viewportById.get(viewport).height,
      id: scenario.id,
      maxDiffRatio: scenario.visual.maxDiffRatio,
      title: scenario.title,
      viewport,
      width: viewportById.get(viewport).width,
    })))

  if (cases.length === 0) {
    const scope = [
      filters.scenario ? `scenario=${filters.scenario}` : null,
      filters.category ? `category=${filters.category}` : null,
      filters.viewport ? `viewport=${filters.viewport}` : null,
    ].filter(Boolean).join(', ') || 'matriz padrão'
    throw new Error(`Nenhum baseline visual configurado para ${scope}.`)
  }
  return cases
}

export function baselineName(testCase) {
  return `${testCase.id}.${testCase.viewport}.png`
}

export function persistBaseline({ actualBuffer, baselinePath, update, updateCommand }) {
  if (update) {
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true })
    fs.writeFileSync(baselinePath, actualBuffer)
    return null
  }
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Baseline ausente: ${baselinePath}. Crie somente este baseline com: ${updateCommand}`)
  }
  return fs.readFileSync(baselinePath)
}
