export const PLANNING_SCENARIO_GROUPS = Object.freeze([
  {
    key: 'integral',
    title: 'Educação em tempo integral',
    description: 'Matrículas e escolas públicas classificadas segundo os universos já usados pelo painel.',
    indicatorKeys: Object.freeze(['basico_integral', 'escolas_integral']),
  },
  {
    key: 'professionals',
    title: 'Profissionais da educação',
    description: 'Formação em pós-graduação e vínculos temporários entre docentes elegíveis.',
    indicatorKeys: Object.freeze(['pos_graduacao', 'temporarios']),
  },
])

export const PLANNING_SCENARIO_INDICATORS = Object.freeze([
  {
    key: 'basico_integral',
    title: 'Matrículas em tempo integral',
    numeratorLabel: 'Matrículas em tempo integral',
    denominatorLabel: 'Total de matrículas elegíveis',
    source: 'Censo Escolar — INEP',
  },
  {
    key: 'escolas_integral',
    title: 'Escolas públicas de tempo integral',
    numeratorLabel: 'Escolas classificadas como de tempo integral',
    denominatorLabel: 'Escolas públicas elegíveis',
    source: 'Censo Escolar — INEP',
  },
  {
    key: 'pos_graduacao',
    title: 'Docentes com pós-graduação',
    numeratorLabel: 'Docentes com pós-graduação',
    denominatorLabel: 'Total de docentes elegíveis',
    source: 'Censo Escolar — INEP',
  },
  {
    key: 'temporarios',
    title: 'Docentes temporários',
    numeratorLabel: 'Docentes temporários',
    denominatorLabel: 'Total de docentes públicos elegíveis',
    source: 'Censo Escolar — INEP',
  },
])

export type PlanningScenarioStatus =
  | 'available'
  | 'available_with_warning'
  | 'insufficient_data'
  | 'invalid_components'
  | 'invalid_domain'

export interface PlanningScenarioTarget {
  requiredAnnualPacePp: number
  type: 'configured_reference'
  value: number
  year: number
}

export interface PlanningScenarioHistoricalPoint {
  denominator: number
  numerator: number
  value: number
  year: number
}

export interface PlanningScenarioProjectedPoint {
  boundedValue?: number | null
  denominator?: number | null
  displayValue?: number | null
  domainViolations?: Array<Record<string, unknown>>
  limitsApplied?: Array<Record<string, unknown>>
  numerator?: number | null
  rawDenominator?: number | null
  rawNumerator?: number | null
  rawValue?: number | null
  status: PlanningScenarioStatus
  year: number
}

export interface PlanningScenarioContract {
  contractVersion: 'planning-scenarios-v1'
  diagnostics?: {
    domainViolations?: Array<Record<string, unknown>>
    latestDataGap?: number
    limitsApplied?: Array<Record<string, unknown>>
    missingYearCount?: number
    validPointCount?: number
    warnings?: string[]
  }
  direction: 'at_least' | 'at_most'
  historical: PlanningScenarioHistoricalPoint[]
  indicatorKey: string
  model: 'last_components'
  projected: PlanningScenarioProjectedPoint[]
  qualityEvidence?: {
    provisionalLevel?: 'alta' | 'media' | 'baixa' | 'insuficiente' | null
    reasons?: string[]
  }
  referenceTrajectory?: Array<{ value: number; year: number }>
  scenarioType: 'maintenance'
  status: PlanningScenarioStatus
  strategy: 'ratio_of_counts'
  targetValidationStatus: 'configured_unvalidated'
  targets: PlanningScenarioTarget[]
}

export type PlanningScenarios = Record<string, PlanningScenarioContract>

export interface PlanningScenarioPanelAdapter {
  available: boolean
  historical_percent: Array<number | null>
  historical_years: number[]
  projected_2036: number | null
  projected_percent: Array<number | null>
  quality: string | null
  reference_trajectory_values: Array<number | null>
  reference_trajectory_years: number[]
  warnings: string[]
  years: number[]
}

export function adaptPlanningScenarioContract(
  contract?: PlanningScenarioContract | null,
): PlanningScenarioPanelAdapter {
  const historical = Array.isArray(contract?.historical) ? contract.historical : []
  const projected = Array.isArray(contract?.projected) ? contract.projected : []
  const trajectory = Array.isArray(contract?.referenceTrajectory) ? contract.referenceTrajectory : []
  const available = contract?.status === 'available' || contract?.status === 'available_with_warning'
  const projected2036 = projected.find((point) => point.year === 2036)?.displayValue

  return {
    available,
    historical_percent: historical.map((point) => toFiniteNumber(point.value)),
    historical_years: historical.map((point) => point.year),
    projected_2036: toFiniteNumber(projected2036),
    projected_percent: projected.map((point) => toFiniteNumber(point.displayValue)),
    quality: contract?.qualityEvidence?.provisionalLevel ?? null,
    reference_trajectory_values: trajectory.map((point) => point.value),
    reference_trajectory_years: trajectory.map((point) => point.year),
    warnings: contract?.diagnostics?.warnings ?? [],
    years: projected.map((point) => point.year),
  }
}

function toFiniteNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}
