export type DataState =
  | 'observed'
  | 'derived_zero'
  | 'unavailable'
  | 'not_applicable'

export type PublicationState =
  | 'published'
  | 'partial'
  | 'unavailable'
  | 'invalid'

export interface SnapshotValue {
  value: number | null
  state: DataState
  year: number
  sourceId: string
  sourceField: string
}

export interface SnapshotPercentage {
  value: number | null
  numerator: number | null
  denominator: number | null
  state: DataState
  year: number
  sourceId: string
}

export interface BreakdownValue {
  enrollments: SnapshotValue
  share: SnapshotPercentage
}

export interface NetworkBreakdown {
  publicSubtotal: BreakdownValue
  municipal: BreakdownValue
  state: BreakdownValue
  federal: BreakdownValue
  private: BreakdownValue
}

export interface SchoolLocationBreakdown {
  urban: BreakdownValue
  rural: BreakdownValue
}

export interface StageSnapshot {
  total: SnapshotValue
  shareOfBasicEducation?: SnapshotPercentage
  shareOfParentStage?: SnapshotPercentage
  byNetwork: NetworkBreakdown
  bySchoolLocation: SchoolLocationBreakdown
}

export interface EnrollmentComparisonValue {
  value2015: SnapshotValue
  value2025: SnapshotValue
  absoluteChange: number | null
  percentageChange: SnapshotPercentage
}

export interface HistoricalBreakdownComparison {
  total: EnrollmentComparisonValue
  byNetwork?: {
    publicSubtotal: EnrollmentComparisonValue
    municipal: EnrollmentComparisonValue
    state: EnrollmentComparisonValue
    federal: EnrollmentComparisonValue
    private: EnrollmentComparisonValue
  }
  bySchoolLocation?: {
    urban: EnrollmentComparisonValue
    rural: EnrollmentComparisonValue
  }
}

export interface CompositionComponent<TDetails extends Record<string, SnapshotValue>> {
  total: SnapshotValue
  details: TDetails
}

export interface SchoolPerformanceStage {
  approval: SnapshotValue
  failure: SnapshotValue
  dropout: SnapshotValue
}

export type ReconciliationStatus =
  | 'reconciled'
  | 'divergent'
  | 'not_evaluated'

export interface Reconciliation {
  id: string
  label: string
  expected: number | null
  observed: number | null
  difference: number | null
  status: ReconciliationStatus
}

export interface NullCoreRowAudit {
  year: 2025
  dependency: 'municipal' | 'estadual' | 'federal' | 'privada'
  schoolLocation: 'urbana' | 'rural'
  rowCount: number
  otherEducationalFieldsPopulated: string[]
}

export interface MunicipalEducationCompletenessEvidence {
  referenceYear: 2025
  expectedMunicipalities: number
  municipalitiesPresent: number
  annualLoadPresent: boolean
  validDependencyDomain: boolean
  validSchoolLocationDomain: boolean
  duplicateGrainCount: number
  negativeValueCount: number
  isCompleteForDerivedZero: boolean
}

export interface MunicipalEducationOverviewV1 {
  schemaVersion: 'municipal-education-overview-v1'
  publicationState: PublicationState
  municipality: {
    idMunicipality: string
    name: string
    slug: string
  }
  reference: {
    year: number
    generatedAt: string
  }
  universe: {
    territorialBasis: 'school_location'
    locationLabel: 'Localização da escola'
    basicEducationSourceField: 'QT_MAT_BAS'
    methodologyNotes: string[]
  }
  basicEducation: {
    total: SnapshotValue
  }
  basicEducationComposition: {
    total: SnapshotValue
    components: {
      earlyChildhood: CompositionComponent<{ creche: SnapshotValue; preSchool: SnapshotValue }>
      elementary: CompositionComponent<{ initialYears: SnapshotValue; finalYears: SnapshotValue }>
      highSchool: CompositionComponent<{ integratedTechnical: SnapshotValue }>
      youthAndAdultEducation: CompositionComponent<{ elementary: SnapshotValue; highSchool: SnapshotValue }>
      otherProfessionalOffers: CompositionComponent<{
        concomitantTechnical: SnapshotValue
        subsequentTechnical: SnapshotValue
        otherOffers: SnapshotValue
      }>
    }
    reconciliation: Reconciliation
  }
  specialEducation: {
    total: SnapshotValue
    commonClasses: SnapshotValue
    exclusiveClasses: SnapshotValue
  }
  highSchool: {
    total: StageSnapshot
    integratedTechnical: {
      total: SnapshotValue
      shareOfHighSchool: SnapshotPercentage
    }
  }
  schoolPerformance: {
    referenceYear: 2025
    stages: {
      elementary: SchoolPerformanceStage
      initialYears: SchoolPerformanceStage
      finalYears: SchoolPerformanceStage
      highSchool: SchoolPerformanceStage
    }
    sourceId: string
  }
  enrollmentComparison: {
    years: [2015, 2025]
    stages: {
      basicEducation: HistoricalBreakdownComparison
      earlyChildhood: HistoricalBreakdownComparison
      creche: HistoricalBreakdownComparison
      preSchool: HistoricalBreakdownComparison
      elementary: HistoricalBreakdownComparison
      initialYears: HistoricalBreakdownComparison
      finalYears: HistoricalBreakdownComparison
      highSchool: HistoricalBreakdownComparison
      youthAndAdultEducation: HistoricalBreakdownComparison
    }
    methodologyNote: string
  }
  earlyChildhood: {
    total: StageSnapshot
    creche: StageSnapshot
    preSchool: StageSnapshot
  }
  elementary: {
    total: StageSnapshot
    initialYears: StageSnapshot
    finalYears: StageSnapshot
  }
  sources: Array<{
    id: string
    organization: string
    title: string
    referenceYear: number
    url: string | null
  }>
  methodology: string[]
  quality: {
    reconciliations: Reconciliation[]
    semanticWarnings: string[]
    nullCoreRows: NullCoreRowAudit[]
    completeness: MunicipalEducationCompletenessEvidence
    schoolPerformanceChecks: Array<{
      stage: 'elementary' | 'initialYears' | 'finalYears' | 'highSchool'
      sum: number | null
      difference: number | null
      status: ReconciliationStatus
    }>
  }
}
