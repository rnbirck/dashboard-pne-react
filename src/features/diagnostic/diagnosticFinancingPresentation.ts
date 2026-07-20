import publicFinancingCatalogData from '../../data/diagnostic/publicFinancingCatalog.json' with { type: 'json' }
import type { MunicipalDiagnosticContractV2 } from './diagnosticTypes'

export type PublicFinancingProgramId =
  | 'par_novo_par'
  | 'novo_pac_educacao'
  | 'pnate'
  | 'caminho_escola'
  | 'peate_rs'
  | 'escola_tempo_integral'
  | 'pnae'
  | 'parfor'
  | 'proeb_capes'
  | 'pdde'

export interface PublicFinancingProgram {
  id: PublicFinancingProgramId
  publicName: string
  shortDescription?: string
  displayOrder: number
  sourceIds: string[]
}

export interface PublicFinancingRelation {
  id: string
  indicatorId: string
  programId: PublicFinancingProgramId
  relationType: 'supported_action'
  actionText: string
  scopeText?: string
  sourceIds: string[]
  displayOrder: number
}

export interface PublicFinancingSource {
  id: string
  organization: string
  publicTitle: string
  yearLabel: string
  url: string
}

export interface PublicFinancingCatalog {
  catalogVersion: 'diagnostic-public-financing-v1'
  programs: PublicFinancingProgram[]
  relations: PublicFinancingRelation[]
  sources: PublicFinancingSource[]
}

export interface PublicFinancingAction {
  actionText: string
  indicatorIds: string[]
}

export interface PublicFinancingScope {
  scopeText: string
  indicatorIds: string[]
}

export interface PublicFinancingItem {
  programId: PublicFinancingProgramId
  publicName: string
  shortDescription?: string
  relatedIndicators: string[]
  actions: PublicFinancingAction[]
  scopes: PublicFinancingScope[]
  sourceIds: string[]
}

type DiagnosticFinancingInput = Pick<MunicipalDiagnosticContractV2, 'decisionSummary'>

export const PUBLIC_FINANCING_CATALOG = (
  publicFinancingCatalogData as unknown as PublicFinancingCatalog
)

export const PUBLIC_FINANCING_PROGRAMS = PUBLIC_FINANCING_CATALOG.programs
export const PUBLIC_FINANCING_RELATIONS = PUBLIC_FINANCING_CATALOG.relations
export const PUBLIC_FINANCING_SOURCES = PUBLIC_FINANCING_CATALOG.sources

function orderedByDisplayOrder<T extends { displayOrder: number }>(items: readonly T[]): T[] {
  return [...items].sort((left, right) => left.displayOrder - right.displayOrder)
}

function appendUnique(items: string[], value: string): void {
  if (!items.includes(value)) items.push(value)
}

function collectSelectedIndicatorIds(
  diagnostic: DiagnosticFinancingInput | null | undefined,
): Set<string> {
  const selected = new Set<string>()
  const decisionSummary = diagnostic?.decisionSummary

  for (const item of decisionSummary?.municipalActionItems ?? []) {
    if (typeof item.indicatorId === 'string') selected.add(item.indicatorId)
  }
  for (const item of decisionSummary?.coordinationItems ?? []) {
    if (typeof item.indicatorId === 'string') selected.add(item.indicatorId)
  }

  return selected
}

function collectItemSourceIds(
  program: PublicFinancingProgram,
  relations: PublicFinancingRelation[],
): string[] {
  const usedSourceIds = new Set([
    ...program.sourceIds,
    ...relations.flatMap((relation) => relation.sourceIds),
  ])

  return PUBLIC_FINANCING_SOURCES
    .filter((source) => usedSourceIds.has(source.id))
    .map((source) => source.id)
}

/**
 * Selects only relations authorized by the public catalog for indicators that
 * the municipal diagnostic already placed in action or coordination.
 */
export function buildPublicFinancingItems(
  diagnostic: DiagnosticFinancingInput | null | undefined,
): PublicFinancingItem[] {
  const selectedIndicatorIds = collectSelectedIndicatorIds(diagnostic)
  if (!selectedIndicatorIds.size) return []

  const orderedPrograms = orderedByDisplayOrder(PUBLIC_FINANCING_PROGRAMS)
  const orderedRelations = orderedByDisplayOrder(PUBLIC_FINANCING_RELATIONS)
  const items: PublicFinancingItem[] = []

  for (const program of orderedPrograms) {
    const applicableRelations = orderedRelations.filter((relation) => (
      relation.programId === program.id
      && selectedIndicatorIds.has(relation.indicatorId)
    ))
    if (!applicableRelations.length) continue

    const relatedIndicators: string[] = []
    const actions: PublicFinancingAction[] = []
    const scopes: PublicFinancingScope[] = []

    for (const relation of applicableRelations) {
      appendUnique(relatedIndicators, relation.indicatorId)

      let action = actions.find((item) => item.actionText === relation.actionText)
      if (!action) {
        action = { actionText: relation.actionText, indicatorIds: [] }
        actions.push(action)
      }
      appendUnique(action.indicatorIds, relation.indicatorId)

      if (relation.scopeText) {
        let scope = scopes.find((item) => item.scopeText === relation.scopeText)
        if (!scope) {
          scope = { scopeText: relation.scopeText, indicatorIds: [] }
          scopes.push(scope)
        }
        appendUnique(scope.indicatorIds, relation.indicatorId)
      }
    }

    items.push({
      programId: program.id,
      publicName: program.publicName,
      ...(program.shortDescription ? { shortDescription: program.shortDescription } : {}),
      relatedIndicators,
      actions,
      scopes,
      sourceIds: collectItemSourceIds(program, applicableRelations),
    })
  }

  return items
}

/** Returns only the official sources referenced by the displayed items. */
export function collectPublicFinancingSources(
  items: readonly PublicFinancingItem[],
): PublicFinancingSource[] {
  if (!items.length) return []
  const usedSourceIds = new Set(items.flatMap((item) => item.sourceIds))
  return PUBLIC_FINANCING_SOURCES.filter((source) => usedSourceIds.has(source.id))
}
