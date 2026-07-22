export type DiagnosticDataStatus =
  | 'available'
  | 'missing'
  | 'not_applicable'
  | 'pending_official_definition'
  | 'methodologically_incompatible'
  | 'unverifiable'

export type DiagnosticDirection = 'at_least' | 'at_most'

export type DiagnosticLegalCorrespondence =
  | 'direct'
  | 'partial'
  | 'proxy'
  | 'methodologically_incompatible'
  | 'pending_official_definition'
  | 'informational'

export type DiagnosticOperationalizationStatus = DiagnosticLegalCorrespondence

export type DiagnosticValueDomainStatus =
  | 'within_domain'
  | 'outside_domain_territorial_mismatch'
  | 'outside_domain_unverifiable'
  | 'not_applicable'

export type DiagnosticTargetComparisonStatus =
  | 'eligible'
  | 'missing_data'
  | 'outside_domain'
  | 'methodologically_incompatible'
  | 'pending_official_definition'
  | 'not_applicable'
  | 'unverifiable'

export type DiagnosticPresentationStatus =
  | 'missing'
  | 'informational'
  | 'proxy'
  | 'pending_official_definition'
  | 'methodologically_incompatible'
  | 'outside_domain'
  | 'unverifiable'
  | 'goal_attained'
  | 'comparable_gap'

export interface DiagnosticReason {
  code: string
  message: string
  sourceField?: string
}

export interface DiagnosticTargetMilestone {
  dimension: string
  direction: DiagnosticDirection
  legalGoalRef: string
  validationStatus: 'official_law' | 'configured_unvalidated' | 'pending_inep_definition'
  value: number
  year: number
}

export interface DiagnosticConfiguredReference {
  value: number | null
  year: number | null
  direction: DiagnosticDirection | null
  label: string
  kind: 'official_law_reference' | 'configured_reference' | 'legacy_reference'
  validationStatus: string
}

export interface DiagnosticSource {
  sourceIds: string[]
  labels: string[]
  periodicity: string
  latestYear?: number
}

export interface DiagnosticMethodology {
  formula: string
  numerator: string
  denominator: string
  territorialBasis: {
    numerator?: string
    denominator?: string
  }
  valueDomainPolicy: string
  displayPolicy: string
}

export interface DiagnosticLegalValidation {
  validationId: 'pne-law-15388-2026-validation-v1'
  validatedAt: '2026-07-19'
  lawVersion: string
  source: string
  validatedGoalTexts: 73
  totalGoalTexts: 73
  status: 'validated' | 'not_applicable'
  legalGoalRefs: string[]
}

export type DiagnosticStateBenchmarkStatus =
  | 'comparable'
  | 'methodology_pending'
  | 'year_mismatch'
  | 'unavailable'
  | 'insufficient_coverage'

export type DiagnosticStatePosition =
  | 'better'
  | 'worse'
  | 'equivalent'
  | 'not_directional'

export interface DiagnosticStateBenchmark {
  status: DiagnosticStateBenchmarkStatus
  value: number | null
  year: number | null
  municipalityValue?: number | null
  municipalityYear?: number | null
  municipalityLatestYear?: number | null
  usesLatestCommonYear?: boolean
  method: string | null
  coverageRate: number | null
  municipalityCount: number | null
  favorableDifference: number | null
  position: DiagnosticStatePosition | null
  reason?: DiagnosticReason
  directionReason?: DiagnosticReason
}

export interface DiagnosticMunicipalDistributionBenchmark {
  status: 'available' | Exclude<DiagnosticStateBenchmarkStatus, 'comparable'>
  year: number | null
  median: number | null
  q1: number | null
  q3: number | null
  performancePercentile: number | null
  municipalityCount: number | null
  coverageRate: number | null
  reason?: DiagnosticReason
  directionReason?: DiagnosticReason
}

export interface DiagnosticBenchmarks {
  state: DiagnosticStateBenchmark
  municipalDistribution: DiagnosticMunicipalDistributionBenchmark
}

export type DiagnosticTrajectoryScenarioType =
  | 'trend_projection'
  | 'component_maintenance'
  | 'required_trajectory'
  | 'historical_trend_only'
  | 'not_available'

export interface DiagnosticTrajectory {
  status: 'available' | 'not_available'
  scenarioType: DiagnosticTrajectoryScenarioType
  model: string | null
  baseYear: number | null
  baseValue: number | null
  targetYear: number | null
  targetValue: number | null
  referenceStatus: 'official' | 'configured_planning_reference' | 'configured_unvalidated' | 'pending'
  observedFavorableAnnualPace: number | null
  historyPointCount: number
  requiredAnnualPace: number | null
  paceStatus:
    | 'target_already_met'
    | 'sufficient'
    | 'insufficient'
    | 'moving_away'
    | 'stable'
    | 'insufficient_history'
    | 'not_applicable'
  horizonYear: number | null
  projectedValue: number | null
  estimatedAchievementYear: number | null
  uncertainty: 'not_estimated'
  quality: string
  sourceCodes: string[]
  warningCodes: string[]
  ruleVersion: 'municipal-trajectory-p2-v1'
}

export interface DiagnosticGovernance {
  classification: 'direct' | 'shared' | 'state_led' | 'federal_led' | 'territorial' | 'informational'
  legalResponsibilityCodes: string[]
  operationalResponsibilityCodes: string[]
  networkCodes: string[]
  municipalActionCodes: string[]
  pactuationRequired: boolean
  rationaleCode: string
  ruleVersion: 'municipal-governance-p3c-v1'
}

export interface DiagnosticMunicipalExposure {
  status: 'available' | 'unavailable'
  year: number | null
  municipalNumerator: number | null
  totalNumerator: number | null
  municipalDenominator: number | null
  totalDenominator: number | null
  municipalNumeratorShare: number | null
  municipalDenominatorShare: number | null
  reasonCode: string | null
  ruleVersion: 'municipal-network-exposure-p3b-v1'
}

export interface DiagnosticSimilarMunicipalities {
  status: 'available' | 'unavailable'
  methodologyVersion: 'municipal-peer-cohort-rs-v1'
  indicatorId: string
  year: number | null
  cohortSize: number
  members: Array<{
    municipalityName: string
    distance: number
    value: number
    offeringSize: number
  }>
  statistics: { median: number; q1: number; q3: number } | null
  performancePercentile: number | null
  coverageRate: number | null
  featuresUsed: string[]
  unavailableFeatureCodes: string[]
  relaxationCodes: string[]
  reasonCode: string | null
}

export interface DiagnosticDecisionReading {
  classification:
    | 'municipal_direct_action'
    | 'municipal_action_with_coordination'
    | 'intergovernmental_coordination'
    | 'investigate_data_or_supply'
    | 'preserve_result'
    | 'monitor'
    | 'insufficient_evidence'
  reasonCodes: string[]
  evidenceLevel: DiagnosticEvidenceLevel
  summaryCollection: DiagnosticDecisionCollection
  financialEligibilityVerified: false
  changesAttentionOrder: false
}

export type DiagnosticEvidenceLevel = 'high' | 'medium' | 'low' | 'insufficient'

export type DiagnosticDecisionCollection =
  | 'municipal_action'
  | 'coordination'
  | 'investigation'
  | 'monitoring'
  | 'preservation'

export interface DiagnosticEvidence {
  level: DiagnosticEvidenceLevel
  reasonCodes: string[]
  methodologyVersion: 'municipal-evidence-p3c-v1'
}

export interface MunicipalDiagnosticIndicatorV2 {
  indicatorId: string
  theme: string
  themeLabel: string
  title: string
  currentYear: number | null
  rawValue: number | null
  displayValue: number | null
  unit: 'percent' | 'index' | 'count' | 'years'
  direction: DiagnosticDirection | null
  dataStatus: DiagnosticDataStatus
  legalCorrespondence: DiagnosticLegalCorrespondence
  legalTextValidated: boolean
  legalValidation: DiagnosticLegalValidation
  operationalizationStatus: DiagnosticOperationalizationStatus
  valueDomainStatus: DiagnosticValueDomainStatus
  targetComparisonStatus: DiagnosticTargetComparisonStatus
  targetMilestones: DiagnosticTargetMilestone[]
  configuredReference: DiagnosticConfiguredReference
  goalAttained: boolean | null
  favorableDistance: number | null
  remainingGap: number | null
  legacyRelativeGapScore: number | null
  priorityScore: null
  exclusionReasons: DiagnosticReason[]
  flags: DiagnosticReason[]
  source: DiagnosticSource
  methodology: DiagnosticMethodology
  methodologyVersion: 'municipal-diagnostic-p3c-v1'
  benchmarks: DiagnosticBenchmarks
  trajectory: DiagnosticTrajectory
  governance: DiagnosticGovernance
  municipalExposure: DiagnosticMunicipalExposure
  similarMunicipalities: DiagnosticSimilarMunicipalities
  evidenceLevel: DiagnosticEvidenceLevel
  evidence: DiagnosticEvidence
  decisionReading: DiagnosticDecisionReading
  presentation: {
    statusCode: DiagnosticPresentationStatus
  }
  nullReasons: Record<string, DiagnosticReason>
}

export interface DiagnosticAttentionItemV2 {
  indicatorId: string
  theme: string
  rank: number
  legacyRelativeGapScore: number
  inclusionReasons: DiagnosticReason[]
  decisionReading: DiagnosticDecisionReading
}

export interface DiagnosticPreservedItemV2 {
  indicatorId: string
  theme: string
  preservationReasons: DiagnosticReason[]
}

export interface DiagnosticExcludedItemV2 {
  indicatorId: string
  theme: string
  exclusionReasons: DiagnosticReason[]
}

export interface DiagnosticThemeSummaryV2 {
  theme: string
  label: string
  totalIndicators: number
  availableResults: number
  validLegalComparisons: number
  goalsAttained: number
  comparableGaps: number
  excludedIndicators: number
  municipalActionIndicators: number
  coordinationIndicators: number
  investigationIndicators: number
  monitoringIndicators: number
  preservationIndicators: number
  statusCode: 'no_data' | 'no_comparable' | 'mixed' | 'attention' | 'all_attained'
  focusIndicatorId?: string
}

export interface DiagnosticSummaryV2 {
  indicatorCount: 49
  availableResults: number
  validLegalComparisons: number
  goalsAttained: number
  comparableGaps: number
  excludedIndicators: number
  preservedIndicators: number
  themes: DiagnosticThemeSummaryV2[]
}

export interface DiagnosticStateBenchmarkSummaryV2 {
  analyzedCount: number
  eligibleAnalyzedCount: number
  betterCount: number
  worseCount: number
  equivalentCount: number
  unavailableCount: number
  largestUnfavorableIndicatorIds: string[]
  largestFavorableIndicatorIds: string[]
}

export interface DiagnosticStateBenchmarkExpandedSummaryV2 {
  analyzedCount: number
  comparableCount: number
  unavailableCount: number
  universe: 'all_available_municipal_results'
}

export interface DiagnosticSourcePeriodV2 {
  sourceId: string
  label: string
  minimumYear: number
  maximumYear: number
  indicatorIds: string[]
}

export interface DiagnosticDecisionSummaryItemV2 {
  indicatorId: string
  theme: string
  collection: DiagnosticDecisionCollection
  evidenceLevel: DiagnosticEvidenceLevel
  decisionClassification: DiagnosticDecisionReading['classification']
  governanceClassification: DiagnosticGovernance['classification']
  selectionReasonCodes: string[]
  selectionPosition?: number
}

export interface DiagnosticDecisionSummaryV2 {
  municipalActionCount: number
  coordinationCount: number
  investigationCount: number
  monitoringCount: number
  preservationCount: number
  municipalActionItems: DiagnosticDecisionSummaryItemV2[]
  coordinationItems: DiagnosticDecisionSummaryItemV2[]
  investigationItems: DiagnosticDecisionSummaryItemV2[]
  monitoringItems: DiagnosticDecisionSummaryItemV2[]
  preservationItems: DiagnosticDecisionSummaryItemV2[]
  selectionMethodologyVersion: 'municipal-decision-summary-p3c-v2'
}

export type DiagnosticInequalityPilotStatus =
  | 'available'
  | 'suppressed_small_cell'
  | 'missing'
  | 'not_applicable'
  | 'methodology_incompatible'

export interface DiagnosticInequalityPilotGroupV1 {
  groupCode: 'urban' | 'rural'
  status: DiagnosticInequalityPilotStatus
  publicationStatus: DiagnosticInequalityPilotStatus
  year: number | null
  numerator: number | null
  denominator: number | null
  percentage: number | null
  coverage: 'municipality_public_network' | 'missing'
  suppressionReasonCode: 'small_cell' | 'complementary_suppression' | null
}

export interface DiagnosticInequalityPilotV1 {
  status: DiagnosticInequalityPilotStatus
  methodologyVersion: 'municipal-inequality-p4b-v1'
  indicatorId: 'basico_integral'
  dimension: 'urban_rural'
  year: number | null
  universeCode: 'public_basic_education_enrollments'
  formulaCode: 'integral_enrollments_over_eligible_enrollments'
  minimumCellSize: 10
  observedDifferencePercentagePoints: number | null
  groups: DiagnosticInequalityPilotGroupV1[]
}

export type Pne2026PublicResultClassification = 'maintain' | 'advance'
export type Pne2026PublicRelationship = 'direct' | 'partial_component'
export type Pne2026PublicPosition = 'above' | 'near' | 'below'

export interface Pne2026PublicStateComparisonV1 {
  municipalityValue: number
  stateValue: number
  year: number
  favorableDifference: number
  state: Pne2026PublicPosition
  reading: string
}

export interface Pne2026PublicStatewidePositionV1 {
  band: 'top_quarter' | 'middle' | 'more_room_to_advance'
  reading: string
}

export interface Pne2026PublicSimilarMunicipalitiesV1 {
  title: 'Municípios com oferta educacional de tamanho semelhante'
  median: number
  favorableDifference: number
  state: Pne2026PublicPosition
  reading: string
}

export interface Pne2026PublicTrajectoryV1 {
  historicalState: 'improved' | 'stable' | 'declined'
  historicalReading: string
  estimatedAchievementYear?: number
  achievementReading?: string
}

export interface Pne2026PublicResultV1 {
  indicatorId: string
  relationship: Pne2026PublicRelationship
  theme: string
  publicName: string
  current: {
    value: number
    displayValue: number | null
    year: number
    unit: 'percent' | 'index' | 'count' | 'years'
  }
  target: {
    value: number
    displayValue: number
    year: number
    direction: DiagnosticDirection
  }
  classification: Pne2026PublicResultClassification
  targetReading: string
  remainingGap: number
  favorableDifference: number
  stateComparison?: Pne2026PublicStateComparisonV1
  statewidePosition?: Pne2026PublicStatewidePositionV1
  similarMunicipalities?: Pne2026PublicSimilarMunicipalitiesV1
  trajectory?: Pne2026PublicTrajectoryV1
  publicReading: string
  sourceIds: string[]
}

export interface Pne2026PublicGoalV1 {
  goalId: string
  order: number
  publicTitle: string
  publicDescription: string
  targetYear: number | null
  results: Pne2026PublicResultV1[]
}

export interface Pne2026PublicThemeV1 {
  theme: string
  publicTitle: string
  displayedResultsCount: number
  maintainResultsCount: number
  advanceResultsCount: number
  goalIds: string[]
}

export interface Pne2026PublicSourceV1 {
  id: 'inep_censo_escolar' | 'ibge_censo_demografico_2010_2022'
  organization: string
  publicTitle: string
  period: string
  officialUrl: string
}

export interface Pne2026PublicDiagnosticV1 {
  version: 'pne2026-public-diagnostic-v1'
  cycleId: 'pne_2026_2036'
  scope: {
    allowedGoalIds: string[]
    allowedIndicatorIds: string[]
  }
  summary: {
    displayedResultsCount: number
    reachedResultsCount: number
    advanceResultsCount: number
    stateAboveOrNearCount: number
    stateBelowCount: number
  }
  themes: Pne2026PublicThemeV1[]
  goals: Pne2026PublicGoalV1[]
  sources: Pne2026PublicSourceV1[]
}

export type Pne2026PublicResultClassificationV2 = 'maintain' | 'advance' | null
export type Pne2026PublicRelationshipV2 = 'direct' | 'partial_component' | 'contextual_proxy'
export type Pne2026PublicTierV2 = 'essential' | 'complementary'

export interface Pne2026PublicStateComparisonV2 {
  state: 'above' | 'near' | 'below'
  municipalityValue: number
  stateValue: number
  year: number
  unit: 'percent' | 'index' | 'count' | 'years'
  difference: number
  favorableDifference: number
  reading: string
  valueReading: string
}

export interface Pne2026PublicSimilarMunicipalitiesV2 {
  year?: number | null
  median: number
  unit: 'percent' | 'index' | 'count' | 'years'
  title: 'Municípios com oferta educacional de tamanho semelhante'
  reading: string
}

export interface Pne2026PublicTrajectoryV2 {
  estimatedAchievementYear?: number
  historicalReading?: string
  achievementReading?: string
}

export interface Pne2026PublicResultV2 {
  resultOrder: number
  goalId: string
  indicatorId: string
  themeId: string
  tier: Pne2026PublicTierV2
  priorityOrder: number | null
  publicName: string
  publicDescription: string
  relationshipType: Pne2026PublicRelationshipV2
  relationshipReading: string
  direction: DiagnosticDirection
  current: {
    value: number
    displayValue: number
    displayText?: string
    year: number
    unit: 'percent' | 'index' | 'count' | 'years'
  }
  indicatorReference: {
    value: number
    year: number
    direction?: DiagnosticDirection
    label?: string
    kind?: string
    validationStatus?: string
  }
  finalReference?: { value: number; year: number; dimension?: string }
  legalGoal: { target?: number; deadline: number; [key: string]: unknown }
  classification: Pne2026PublicResultClassificationV2
  remainingGap: number | null
  favorableDifference: number | null
  distance: number | null
  publicReading?: string | null
  status?: string | null
  stateComparison?: Pne2026PublicStateComparisonV2
  statewidePosition?: { reading: string }
  similarMunicipalities?: Pne2026PublicSimilarMunicipalitiesV2
  trajectory?: Pne2026PublicTrajectoryV2
  sourceIds: string[]
}

export interface Pne2026PublicGoalV2 {
  goalId: string
  title: string
  order: number
  results: Pne2026PublicResultV2[]
}

export interface Pne2026PublicThemeV2 {
  id: string
  order: number
  label: string
}

export interface Pne2026PublicSourceV2 {
  id: string
  organization?: string
  publicTitle: string
  period?: string
  officialUrl?: string
}

export interface Pne2026PublicDiagnosticV2 {
  version: 'pne2026-public-diagnostic-v2'
  schemaVersion: 'municipal-diagnostic-v2'
  cycleId: 'pne_2026_2036'
  presentationCatalogVersion: string
  publicationReady: boolean
  municipalityId: string
  municipalityName: string
  summary: {
    authorizedResultCount: 34
    availableResultCount: number
    unavailableResultCount: number
    essentialAvailableCount: number
    complementaryAvailableCount: number
    advanceCount: number
    maintainCount: number
    unclassifiedCount: number
    relationshipCounts: Record<Pne2026PublicRelationshipV2, number>
    stateComparisonCount: number
    statewidePositionCount: number
    similarMunicipalitiesCount: number
    trajectoryCount: number
    estimatedAchievementYearCount: number
    stateAboveOrNearCount: number
    stateBelowCount: number
  }
  presentation: {
    themes: Pne2026PublicThemeV2[]
    resultDefinitions: Array<Record<string, unknown>>
  }
  goals: Pne2026PublicGoalV2[]
  sources: Pne2026PublicSourceV2[]
}

export interface MunicipalDiagnosticContractV2 {
  schemaVersion: 'municipal-diagnostic-v2'
  methodologyVersion: 'municipal-diagnostic-p3c-v1'
  generatedAt: string
  municipalityId: string
  municipalityName: string
  sourcePeriods: DiagnosticSourcePeriodV2[]
  summary: DiagnosticSummaryV2
  stateBenchmarkSummary: DiagnosticStateBenchmarkSummaryV2
  stateBenchmarkExpandedSummary: DiagnosticStateBenchmarkExpandedSummaryV2
  decisionSummary: DiagnosticDecisionSummaryV2
  inequalityPilot: DiagnosticInequalityPilotV1
  trajectoryScenarioInventory: {
    attendance: Array<{
      indicatorId: string
      scenarioType: 'trend_projection'
      status: 'available' | 'not_available'
    }>
    maintenance: Array<{
      indicatorId: string
      scenarioType: 'component_maintenance'
      status: 'available' | 'not_available'
    }>
  }
  indicators: MunicipalDiagnosticIndicatorV2[]
  attentionItems: DiagnosticAttentionItemV2[]
  preservedItems: DiagnosticPreservedItemV2[]
  excludedItems: DiagnosticExcludedItemV2[]
  warnings: Array<DiagnosticReason & { indicatorIds: string[] }>
  pne2026PublicDiagnostic?: Pne2026PublicDiagnosticV1
  pne2026PublicDiagnosticV2?: Pne2026PublicDiagnosticV2
  generationMetadata: {
    generator: 'build_municipal_diagnostic_v2'
    catalogVersion: string
    attentionOrderingMethod: 'legacy-relative-gap-v2'
    attentionOrderingStatus: 'provisional'
    deterministicIndicatorOrder: true
    deterministicTieBreak: 'catalog_order'
    municipalityIdentityStatus: 'official_id' | 'name_fallback_pending_partition'
    legacyFieldPreserved: false
    reactBusinessRulesAllowed: false
    finalPriorityScorePublished: false
    financialRecommendationPublished: false
    stateBenchmarkPublished: boolean
    financingCatalogResolution: 'global_versioned_catalogs'
    decisionSummaryPublished: true
    decisionSummaryIsFinalRanking: false
    inequalityPilotPublished: boolean
    inequalityPilotAffectsDecisionSummary: false
    implementedSubstages: Array<'P2' | 'P3-A' | 'P3-B' | 'P3-C' | 'P4-A' | 'P4-B-pilot' | 'P5-A'>
    legalTextValidation: Omit<DiagnosticLegalValidation, 'status' | 'legalGoalRefs'>
    deferredStages: Array<'P4-remaining' | 'P5-B' | 'P6'>
    deliveryMode?: 'route_lazy_static_json'
    legacyCompatibility?: 'aggregate_export_only'
  }
}

export interface MunicipalDiagnosticSelection {
  contract: MunicipalDiagnosticContractV2 | null
  status: 'ready' | 'missing' | 'incompatible_version'
}
