export type MunicipalFinanceSchemaVersion = 'municipal-finance-v1';

export type FinancialStage =
  | 'forecast'
  | 'authorized'
  | 'committed'
  | 'transferred'
  | 'received'
  | 'budgeted'
  | 'empenhado'
  | 'liquidado'
  | 'paid'
  | 'balance'
  | 'calculated_indicator'
  | 'not_applicable';

export type AmountNature =
  | 'official_estimate'
  | 'confirmed'
  | 'municipal_declared'
  | 'panel_displayed'
  | 'local_calculation';

export type ProgramFinancialStatus =
  | 'confirmed_beneficiary'
  | 'confirmed_non_beneficiary'
  | 'eligible'
  | 'not_eligible'
  | 'under_analysis'
  | 'selected'
  | 'agreement_signed'
  | 'transferred'
  | 'balance_available'
  | 'not_verified';

export type EvidenceStatus =
  | 'official_nominal'
  | 'official_aggregate'
  | 'municipal_declared'
  | 'panel_only'
  | 'not_verified'
  | 'unavailable';

export type DataQualityLevel = 'high' | 'medium' | 'low' | 'insufficient';

export type ReconciliationStatus =
  | 'not_required'
  | 'pending_source'
  | 'mapping_pending'
  | 'reconciled'
  | 'reconciliation_required'
  | 'source_missing'
  | 'divergent_explained'
  | 'divergent_unexplained'
  | 'divergent'
  | 'unavailable';

export type FinanceNullReasonCode =
  | 'not_published'
  | 'not_applicable'
  | 'not_audited_in_prototype'
  | 'source_not_automatable'
  | 'different_grain'
  | 'different_reference_period'
  | 'denominator_not_integrated'
  | 'reconciliation_pending'
  | 'unsupported_estimate_prohibited'
  | 'score_isolation_required';

export interface FinanceNullReason {
  code: FinanceNullReasonCode;
  category: 'availability' | 'applicability' | 'methodology' | 'reconciliation' | 'governance';
  message: string;
  sourceIds: readonly string[];
}

export interface FinancialValue {
  value: number | null;
  unit: 'BRL' | 'percent' | 'count' | 'BRL_per_student';
  referenceYear: number;
  amountNature?: AmountNature;
  financialStage?: FinancialStage;
  nullReason: FinanceNullReason | null;
}

export interface MunicipalFinanceEvidence {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  publisher: string;
  publicationDate?: string;
  accessedAt: string;
  referenceYear: number;
  municipalityKey: 'ibge_code' | 'official_name' | 'school_or_executor' | 'not_applicable';
  evidenceStatus: EvidenceStatus;
  notes: string;
}

export interface MunicipalFinanceTransfer {
  transferId: string;
  programId: string;
  label: string;
  referenceYear: number;
  financialStage: FinancialStage;
  amountNature: AmountNature;
  amount: FinancialValue;
  sourceId: string;
  evidenceStatus: EvidenceStatus;
  isPartialPeriod: boolean;
  canBeSummedWithConfirmedTransfers: boolean;
  notes: string;
}

export interface MunicipalProgramFinancialStatus {
  programId: string;
  status: ProgramFinancialStatus;
  statusAsOf: string;
  amount: FinancialValue;
  evidence: MunicipalFinanceEvidence;
  notes: string;
}

export interface MunicipalEducationExecution {
  referenceYear: number;
  functionalClassification: '12 - Educação';
  budgeted: FinancialValue;
  committed: FinancialValue;
  liquidated: FinancialValue;
  paid: FinancialValue;
  currentExpense: FinancialValue;
  capitalExpense: FinancialValue;
  outstandingNonProcessed: FinancialValue;
  outstandingProcessed: FinancialValue;
  evidence: MunicipalFinanceEvidence;
}

export interface MunicipalFinanceReconciliation {
  status: ReconciliationStatus;
  comparedSourceIds: readonly string[];
  absoluteDifference: FinancialValue;
  explanation: string;
  nextAction: string;
}

export interface MunicipalFinancePerStudent {
  metricId: string;
  label: string;
  referenceYear: number;
  value: FinancialValue;
  numerator: FinancialValue;
  denominator: FinancialValue;
  denominatorSourceId: string;
  sameReferenceYear: boolean;
  calculationAllowed: boolean;
  notes: string;
}

export interface MunicipalFinanceEducationLink {
  indicatorId: string;
  programId: string;
  relationType: 'general_mde' | 'direct_cost_driver' | 'conditional_support' | 'accounting_context';
  municipalStatus: ProgramFinancialStatus;
  financialStatus: FinancialStage;
  amountNature: AmountNature;
  evidenceStatus: EvidenceStatus;
  confirmedAmount: FinancialValue;
  potentialAmount: FinancialValue;
  affectsEducationalScores: false;
  notes: string;
}

export interface MunicipalFinanceScoreIsolation {
  needScore: null;
  actionabilityScore: null;
  confidenceScore: null;
  priorityScore: null;
  nullReasons: {
    needScore: FinanceNullReason;
    actionabilityScore: FinanceNullReason;
    confidenceScore: FinanceNullReason;
    priorityScore: FinanceNullReason;
  };
  changesDecisionSummary: false;
  changesAttentionOrder: false;
}

export interface MunicipalFinanceSourceSummary {
  sourceId: string;
  use: 'transfer' | 'program_status' | 'execution' | 'denominator' | 'context_only';
  evidenceStatus: EvidenceStatus;
}

/**
 * @deprecated Fixture detalhada da auditoria P5-A. Novos consumidores devem
 * usar MunicipalFinanceDocumentV1, que representa o artefato compacto P5-B1.
 */
export interface MunicipalFinancePrototypeDocumentV1 {
  schemaVersion: MunicipalFinanceSchemaVersion;
  methodologyVersion: 'municipal-finance-p5a-v1';
  generatedAt: string;
  municipality: {
    ibgeCode: string;
    name: string;
    uf: 'RS';
    sampleRoles: readonly string[];
  };
  referencePeriod: {
    primaryFiscalYear: 2024;
    currentPartialYear: 2026;
    currentCutoffDate: string;
    mixesPeriodsInTotals: false;
  };
  dataQuality: {
    level: DataQualityLevel;
    coverageRate: number;
    automatableSourceCount: number;
    manualSourceCount: number;
    unresolvedLimitations: readonly string[];
  };
  summary: {
    confirmedTransfersPrimaryYear: FinancialValue;
    officialForecastsCurrentPartialYear: FinancialValue;
    educationCommittedPrimaryYear: FinancialValue;
    financingPotential: FinancialValue;
  };
  transfers: readonly MunicipalFinanceTransfer[];
  programStatuses: readonly MunicipalProgramFinancialStatus[];
  execution: MunicipalEducationExecution;
  reconciliation: MunicipalFinanceReconciliation;
  perStudent: readonly MunicipalFinancePerStudent[];
  educationLinks: readonly MunicipalFinanceEducationLink[];
  educationalScoreIsolation: MunicipalFinanceScoreIsolation;
  sources: readonly MunicipalFinanceSourceSummary[];
  generationMetadata: {
    interfacePublished: false;
    publicDataRegenerated: false;
    lazyMunicipalRoutePlanned: true;
    prototypeOnly: true;
  };
}

export type MunicipalFinanceCoverageStatus =
  | 'complete'
  | 'partial'
  | 'unavailable'
  | 'pending_source'
  | 'mapping_pending'
  | 'source_missing'
  | 'divergent';

export interface MunicipalFinanceCoverageDimension {
  rate: number | null;
  status: MunicipalFinanceCoverageStatus;
  availableSourceIds: readonly string[];
  missingSourceIds: readonly string[];
  reasonCodes: readonly string[];
}

export interface CompactFinancialValue {
  value: number | null;
  unit: 'BRL' | 'percent' | 'count' | 'coefficient' | 'BRL_per_student';
  referenceYear: number;
  financialStage: FinancialStage;
  amountNature: AmountNature;
  sourceId: string;
  nullReasonCode?: string;
}

export interface CompactFinancialAggregate extends CompactFinancialValue {
  coveredSourceIds: readonly string[];
  summationRuleId: string;
}

export type FundebCompositionStatus =
  | 'total'
  | 'included_in_total'
  | 'not_included_in_total'
  | 'composition_not_reconciled';

export interface FundebCompositionMetadata {
  includedInFundebTotal: boolean;
  compositionStatus: FundebCompositionStatus;
  doubleCountingRisk: 'none' | 'high';
  summationAllowed: boolean;
}

export interface CompactDerivedRate extends CompactFinancialValue {
  calculation: {
    formula: string;
    numeratorReferenceIds: readonly string[];
    denominatorReferenceId: string;
    sourceId: string;
    referenceYear: number;
    functionalClassification: '12 - Educação';
  };
}

export interface MunicipalFinanceDocumentV1 {
  schemaVersion: MunicipalFinanceSchemaVersion;
  dataVersion: string;
  methodologyVersion: 'municipal-finance-p5b2b1-v1';
  generatedAt: string;
  municipality: {
    ibgeCode: string;
    name: string;
    slug: string;
    uf: 'RS';
  };
  periods: {
    closedFiscalYear: 2024;
    annualForecastYear: 2026;
    forecastCutoffDate: string;
    mixesPeriodsInTotals: false;
  };
  dataQuality: {
    level: DataQualityLevel;
    reasonCodes: readonly string[];
    coverageByDimension: {
      confirmedTransfers: MunicipalFinanceCoverageDimension;
      officialForecasts: MunicipalFinanceCoverageDimension;
      programStatuses: MunicipalFinanceCoverageDimension;
      budgetExecution: MunicipalFinanceCoverageDimension;
      constitutionalApplication: MunicipalFinanceCoverageDimension;
      perStudentMetrics: MunicipalFinanceCoverageDimension;
      reconciliation: MunicipalFinanceCoverageDimension;
    };
  };
  summary: {
    confirmedTransfersCoveredBySources: CompactFinancialAggregate;
    officialAnnualForecastsCurrentYear: CompactFinancialAggregate;
    dcaEducationCommitted: CompactFinancialValue;
  };
  amounts: {
    fundebTotalAnnualForecast: CompactFinancialValue & FundebCompositionMetadata;
    fundebVaafAnnualForecast: CompactFinancialValue & FundebCompositionMetadata;
    fundebVaatAnnualForecast: CompactFinancialValue & FundebCompositionMetadata;
    fundebVaarAnnualForecast: CompactFinancialValue & FundebCompositionMetadata;
    qseDistributedClosedYear: CompactFinancialValue;
    qseOfficialEstimateCurrentYear: CompactFinancialValue;
  };
  programStatuses: {
    fundebVaaf: {
      status: ProgramFinancialStatus;
      sourceId: string;
      referenceYear: 2026;
    };
    fundebVaat: {
      status: ProgramFinancialStatus;
      calculationStatus: 'habilitated_for_calculation' | 'not_habilitated_for_calculation' | 'not_verified';
      sourceIds: readonly string[];
      referenceYear: 2026;
    };
    fundebVaar: {
      status: ProgramFinancialStatus;
      sourceIds: readonly string[];
      referenceYear: 2026;
    };
  };
  qse: {
    enrollmentsClosedYear: CompactFinancialValue;
    distributionCoefficientClosedYear: CompactFinancialValue;
    distributionCoefficientCurrentYear: CompactFinancialValue;
    installments: CompactFinancialValue;
  };
  execution: {
    dcaEducation: {
      referenceYear: 2024;
      functionalClassification: '12 - Educação';
      amountNature: 'municipal_declared';
      sourceId: string;
      committed: CompactFinancialValue;
      liquidated: CompactFinancialValue;
      paid: CompactFinancialValue;
      outstandingNonProcessed: CompactFinancialValue;
      outstandingProcessed: CompactFinancialValue;
      budgeted: CompactFinancialValue;
      currentExpense: CompactFinancialValue;
      capitalExpense: CompactFinancialValue;
      derivedRates: {
        liquidatedToCommittedRate: CompactDerivedRate;
        paidToCommittedRate: CompactDerivedRate;
        paidToLiquidatedRate: CompactDerivedRate;
        outstandingToCommittedRate: CompactDerivedRate;
      };
    };
  };
  constitutionalApplication: {
    status: 'reconciled' | 'source_missing' | 'divergent_explained' | 'divergent_unexplained';
    referenceYear: 2024;
    period: 6;
    stageBasis: 'empenhado';
    mdeAppliedAmount: ConstitutionalReconciledMetric;
    mdeAppliedRate: ConstitutionalReconciledMetric;
    fundebProfessionalRemunerationRate: ConstitutionalReconciledMetric;
    fundebRevenueReceivedDeclared: CompactFinancialValue;
  };
  reconciliation: {
    status: ReconciliationStatus;
    scope: 'siope_rreo_constitutional_application';
    availableSourceIds: readonly string[];
    pendingSourceIds: readonly string[];
    absoluteDifference: CompactFinancialValue;
    percentageDifference: CompactFinancialValue;
    reasonCodes: readonly string[];
  };
  perStudent: {
    qseDistributedPerEnrollment: CompactDerivedRate;
  };
  educationLinks: readonly {
    indicatorId: string;
    programId: string;
    relationType: 'general_mde' | 'direct_cost_driver' | 'conditional_support' | 'accounting_context';
    municipalStatus: ProgramFinancialStatus;
    financialStage: FinancialStage;
    amountNature: AmountNature;
    evidenceStatus: EvidenceStatus;
    amountReferenceId: string;
  }[];
  educationalScoreIsolation: {
    needScore: null;
    actionabilityScore: null;
    confidenceScore: null;
    priorityScore: null;
    nullReasonCode: 'scores_not_applicable_to_financial_contract';
    changesDecisionSummary: false;
    changesAttentionOrder: false;
  };
  generationMetadata: {
    interfacePublished: false;
    includedInMunicipalIndex: false;
    manualSourcesIntegrated: false;
    lazyLoadOnly: true;
  };
}

export interface ConstitutionalReconciledMetric {
  canonical: CompactFinancialValue;
  siope: CompactFinancialValue;
  rreo: CompactFinancialValue;
  reconciliation: {
    status: 'reconciled' | 'source_missing' | 'divergent_explained' | 'divergent_unexplained';
    sourceIds: readonly string[];
    absoluteDifference: CompactFinancialValue;
    percentageDifference: CompactFinancialValue;
    tolerance: number;
    toleranceUnit: 'BRL' | 'percent';
    toleranceRuleId: string;
    canonicalRuleId: string;
    reasonCodes: readonly string[];
  };
}
