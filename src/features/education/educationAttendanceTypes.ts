export type EducationAttendanceIndicatorKey =
  | 'creche'
  | 'pre_escola'
  | 'basico_6_17'
  | 'basico_15_17'
  | 'infantil_0_5'
  | 'obrigatoria_4_17'
  | 'escolar_6_14'

export interface DisplayPercentage {
  displayValue: number | null
  displayWasCapped: boolean
  rawValue: number | null
}

export interface EducationAttendancePoint {
  denominator: number | null
  numerator: number | null
  rawValue: number | null
  year: number
}

export interface EducationAttendanceDiagnostics {
  above100: boolean
  invalidDenominator: boolean
  numeratorAboveDenominator: boolean
  smallDenominator: boolean
  smallDenominatorThreshold: number | null
  warnings: string[]
}

export interface EducationAttendancePresentation {
  headline: string
  insightLines: string[]
  interpretationStatus: 'available' | 'available_with_warning' | 'unavailable' | 'above_population_reference'
  statusLabel: string
}

export interface EducationAttendanceScenarioPoint extends EducationAttendancePoint {
  displayValue?: number | null
}

export interface EducationAttendanceReferenceTrajectoryPoint {
  denominator?: number | null
  displayValue?: number | null
  numerator?: number | null
  rawValue?: number | null
  value?: number | null
  year: number
}

export interface EducationProjectionScenario {
  historicalEndYear: number | null
  horizonYear: number | null
  method: string | null
  model?: string | null
  projected: EducationAttendanceScenarioPoint[]
  status: 'available' | 'unavailable'
  type: 'trend_scenario' | 'pne_reference_trajectory'
}

export interface EducationAttendanceIndicator {
  ageRange: string
  ageRangeDetails: { end: number; label: string; start: number }
  contractVersion: 'education-attendance-v2'
  diagnostics: EducationAttendanceDiagnostics
  fields: { denominator: string; numerator: string }
  historical: EducationAttendancePoint[]
  historicalChangePercentagePoints: number | null
  indicatorKey: EducationAttendanceIndicatorKey
  indicatorType: 'age_coverage_proxy' | 'mandatory_age_summary'
  kind: 'age_coverage'
  observed: EducationAttendancePoint | null
  populationModel: {
    baseValue: number | null
    baseYear: number
    absoluteChange: number | null
    changeAbsolute: number | null
    changePercent: number | null
    horizonYear: number
    label: string
    method: 'municipal_base_scaled_by_rs_age_group_change'
    methodCode: 'municipal_base_times_rs_age_factor'
    modelStatus: 'modeled_estimate'
    modeledValue: number | null
    percentageChange: number | null
    status: 'modeled'
  } | null
  presentation: EducationAttendancePresentation
  reference: {
    unit: 'percent'
    direction: 'at_least'
    validationStatus: 'configured_unvalidated'
    value: number
    year: number
  } | null
  scenario: EducationProjectionScenario
  territorialBasis: { denominator: string; numerator: string }
  title: string
}

export interface EducationIntegralIndicator {
  contractVersion: 'education-attendance-v2'
  diagnostics: EducationAttendanceDiagnostics
  fields: { denominator: string; numerator: string }
  historical: EducationAttendancePoint[]
  indicatorKey: 'basico_integral'
  indicatorType: 'integral_enrollment_share'
  kind: 'integral_coverage'
  observed: EducationAttendancePoint | null
  presentation: EducationAttendancePresentation
  reference: {
    targets: Array<{ type: string; value: number; year: number }>
    trajectory?: EducationAttendanceReferenceTrajectoryPoint[]
    validationStatus: 'configured_unvalidated'
  }
  scenario: EducationProjectionScenario
  territorialBasis: { denominator: string; numerator: string }
  title: string
}

export type EducationProjectedIndicator = EducationAttendanceIndicator | EducationIntegralIndicator

export interface EducationAttendancePayload {
  ageCoverage: Record<EducationAttendanceIndicatorKey, EducationAttendanceIndicator>
  contractVersion: 'education-attendance-v2'
  integral: { overall: EducationIntegralIndicator | null }
  municipality: string
}
