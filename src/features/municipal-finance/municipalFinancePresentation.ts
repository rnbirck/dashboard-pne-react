import type { MunicipalFinanceCatalog, MunicipalFinanceSourceCatalogEntry } from '../../data/municipalFinance'
import type {
  CompactDerivedRate,
  CompactFinancialValue,
  MunicipalFinanceCoverageStatus,
  MunicipalFinanceDocumentV1,
  ProgramFinancialStatus,
} from '../diagnostic/municipalFinanceTypes'

export interface FinancePresentationContext {
  indicatorIds: readonly string[]
  programIds: readonly string[]
}

export interface FinancingProgramsCatalog {
  programs: readonly {
    programId: string
    title: string
  }[]
}

export interface IndicatorCatalog {
  indicators: readonly {
    indicatorId: string
    name: string
  }[]
}

export interface AmountPresentation {
  label: string
  value: CompactFinancialValue
  supportingText?: string
}

export interface FundebComponentPresentation {
  key: 'total' | 'vaaf' | 'vaat' | 'vaar'
  title: string
  amount: CompactFinancialValue
  statusLabel: string
  calculationStatusLabel: string | null
  natureLabel: string
  stageLabel: string
  inclusionLabel: string
  doubleCountingLabel: string
  summationNote: string | null
  caution: string | null
  observation: string
  source: MunicipalFinanceSourceCatalogEntry | null
}

export interface QseGroupPresentation {
  key: 'distribution' | 'estimate' | 'calculationBase'
  title: string
  metrics: readonly AmountPresentation[]
  comparison: string | null
}

export interface FinanceRelationPresentation {
  key: string
  indicatorLabel: string
  programLabel: string
  relationLabel: string
  reading: string
}

export interface FinanceSourceGroupPresentation {
  key: string
  label: string
  description: string
  links: readonly {
    label: string
    url: string
    agency: string
    referenceYear: number | null
    natureLabel: string
  }[]
}

const fullCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
})

const integerFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

export function formatFullCurrency(value: number): string {
  return fullCurrencyFormatter.format(value)
}

export function formatCompactCurrency(value: number): string {
  const absolute = Math.abs(value)
  if (absolute >= 1_000_000_000) return `R$ ${decimalFormatter.format(value / 1_000_000_000)} bi`
  if (absolute >= 1_000_000) return `R$ ${decimalFormatter.format(value / 1_000_000)} mi`
  if (absolute >= 1_000) return `R$ ${decimalFormatter.format(value / 1_000)} mil`
  return formatFullCurrency(value)
}

export function formatPercent(value: number): string {
  return `${decimalFormatter.format(value)}%`
}

export function formatCount(value: number): string {
  return integerFormatter.format(value)
}

export function formatCoefficient(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 8,
  }).format(value)
}

export function splitFinanceContextIds(value: string | null | undefined): string[] {
  return Array.from(new Set(
    String(value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  ))
}

export function financialStageLabel(stage: CompactFinancialValue['financialStage']): string {
  return {
    forecast: 'Previsão',
    authorized: 'Autorizado',
    committed: 'Comprometido',
    transferred: 'Distribuído',
    received: 'Recebido',
    budgeted: 'Orçado',
    empenhado: 'Empenhado',
    liquidado: 'Liquidado',
    paid: 'Pago',
    balance: 'Restos registrados',
    calculated_indicator: 'Indicador calculado',
    not_applicable: 'Não aplicável',
  }[stage]
}

export function amountNatureLabel(nature: CompactFinancialValue['amountNature']): string {
  return {
    official_estimate: 'Estimativa oficial',
    confirmed: 'Evidência confirmada na fonte',
    municipal_declared: 'Execução declarada pelo município',
    panel_displayed: 'Valor exibido em painel oficial',
    local_calculation: 'Cálculo publicado no contrato',
  }[nature]
}

export function programStatusLabel(status: ProgramFinancialStatus): string {
  return {
    confirmed_beneficiary: 'Beneficiário',
    confirmed_non_beneficiary: 'Não beneficiário',
    eligible: 'Habilitado',
    not_eligible: 'Não habilitado',
    under_analysis: 'Em análise',
    selected: 'Selecionado',
    agreement_signed: 'Termo assinado',
    transferred: 'Transferência identificada',
    balance_available: 'Disponibilidade registrada pela fonte',
    not_verified: 'Não verificado',
  }[status] ?? 'Indisponível'
}

export function coverageStatusLabel(status: MunicipalFinanceCoverageStatus): string {
  return {
    complete: 'Completa',
    partial: 'Parcial',
    unavailable: 'Indisponível',
    pending_source: 'Fonte pendente',
    mapping_pending: 'Mapeamento pendente',
    source_missing: 'Fonte ausente',
    divergent: 'Divergente',
  }[status]
}

export function buildMunicipalFinancePresentation(
  document: MunicipalFinanceDocumentV1,
  catalog: MunicipalFinanceCatalog | null,
  programsCatalog: FinancingProgramsCatalog,
  indicatorsCatalog: IndicatorCatalog,
  context: FinancePresentationContext,
) {
  const sourceById = new Map((catalog?.sources ?? []).map((source) => [source.sourceId, source]))
  const programById = new Map(programsCatalog.programs.map((program) => [program.programId, program]))
  const indicatorById = new Map(indicatorsCatalog.indicators.map((indicator) => [indicator.indicatorId, indicator]))
  const source = (sourceId: string) => sourceById.get(sourceId) ?? null
  const execution = document.execution.dcaEducation
  const fundeb = document.amounts
  const vaarStatus = document.programStatuses.fundebVaar.status

  const summaryCards = [
    {
      key: 'qse',
      title: 'QSE distribuída',
      amount: fundeb.qseDistributedClosedYear,
      supportingText: '2024 · valor distribuído pelo FNDE',
    },
    {
      key: 'fundeb',
      title: 'Fundeb previsto',
      amount: fundeb.fundebTotalAnnualForecast,
      supportingText: 'Previsão oficial anual · não representa recebimento',
    },
    {
      key: 'paid',
      title: 'Despesa paga em Educação',
      amount: execution.paid,
      supportingText: 'DCA/SICONFI · função 12 · 2024',
    },
    {
      key: 'vaar',
      title: 'VAAR 2026',
      statusLabel: programStatusLabel(vaarStatus),
      amount: vaarStatus === 'confirmed_beneficiary' ? fundeb.fundebVaarAnnualForecast : null,
      supportingText: vaarStatus === 'confirmed_beneficiary'
        ? 'Previsão oficial separada · não comprova transferência'
        : 'Status nominal na publicação do FNDE',
    },
  ] as const

  const executionStages = [
    { key: 'committed', label: 'Empenhado', value: execution.committed, progress: execution.committed.value === null ? null : 100 },
    { key: 'liquidated', label: 'Liquidado', value: execution.liquidated, progress: execution.derivedRates.liquidatedToCommittedRate.value },
    { key: 'paid', label: 'Pago', value: execution.paid, progress: execution.derivedRates.paidToCommittedRate.value },
  ] as const

  const executionOutstanding: readonly AmountPresentation[] = [
    { label: 'Restos a pagar não processados', value: execution.outstandingNonProcessed },
    { label: 'Restos a pagar processados', value: execution.outstandingProcessed },
  ]

  const executionRates = [
    { key: 'liquidatedToCommitted', label: 'Percentual liquidado sobre o empenhado', value: execution.derivedRates.liquidatedToCommittedRate },
    { key: 'paidToCommitted', label: 'Percentual pago sobre o empenhado', value: execution.derivedRates.paidToCommittedRate },
    { key: 'paidToLiquidated', label: 'Percentual pago sobre o liquidado', value: execution.derivedRates.paidToLiquidatedRate },
    { key: 'outstandingToCommitted', label: 'Restos registrados em relação ao empenhado', value: execution.derivedRates.outstandingToCommittedRate },
  ].filter((item): item is { key: string; label: string; value: CompactDerivedRate & { value: number } } => (
    item.value.value !== null
  ))

  const fundebComponents: readonly FundebComponentPresentation[] = [
    buildFundebComponent(
      'total',
      'Fundeb total',
      fundeb.fundebTotalAnnualForecast,
      fundeb.fundebTotalAnnualForecast.value === null ? 'Indisponível' : 'Previsão disponível',
      null,
      source(fundeb.fundebTotalAnnualForecast.sourceId),
    ),
    buildFundebComponent(
      'vaaf',
      'VAAF',
      fundeb.fundebVaafAnnualForecast,
      programStatusLabel(document.programStatuses.fundebVaaf.status),
      null,
      source(fundeb.fundebVaafAnnualForecast.sourceId),
    ),
    buildFundebComponent(
      'vaat',
      'VAAT',
      fundeb.fundebVaatAnnualForecast,
      programStatusLabel(document.programStatuses.fundebVaat.status),
      {
        habilitated_for_calculation: 'Habilitado para o cálculo da condição de beneficiário; isso não confirma benefício.',
        not_habilitated_for_calculation: 'Não habilitado para o cálculo da condição de beneficiário.',
        not_verified: 'Habilitação para cálculo não verificada.',
      }[document.programStatuses.fundebVaat.calculationStatus],
      source(fundeb.fundebVaatAnnualForecast.sourceId),
    ),
    buildFundebComponent(
      'vaar',
      'VAAR',
      fundeb.fundebVaarAnnualForecast,
      programStatusLabel(vaarStatus),
      null,
      source(fundeb.fundebVaarAnnualForecast.sourceId),
      'Benefício nominal não significa recebimento; previsão não significa transferência.',
    ),
  ]

  const qseMetrics: readonly AmountPresentation[] = [
    { label: 'Valor distribuído em 2024', value: fundeb.qseDistributedClosedYear },
    { label: 'Estimativa oficial de 2026', value: fundeb.qseOfficialEstimateCurrentYear },
    { label: 'Matrículas usadas no coeficiente', value: document.qse.enrollmentsClosedYear },
    { label: 'Coeficiente de distribuição 2024', value: document.qse.distributionCoefficientClosedYear },
    { label: 'Coeficiente estimado 2026', value: document.qse.distributionCoefficientCurrentYear },
    { label: 'Valor distribuído por matrícula', value: document.perStudent.qseDistributedPerEnrollment },
  ]

  const qseGroups: readonly QseGroupPresentation[] = [
    {
      key: 'distribution',
      title: 'Distribuição de 2024',
      metrics: [qseMetrics[0], qseMetrics[5]],
      comparison: null,
    },
    {
      key: 'estimate',
      title: 'Estimativa de 2026',
      metrics: [qseMetrics[1], qseMetrics[4]],
      comparison: null,
    },
    {
      key: 'calculationBase',
      title: 'Base do cálculo',
      metrics: [qseMetrics[2], qseMetrics[3]],
      comparison: describeQseCoefficientComparison(
        document.qse.distributionCoefficientClosedYear,
        document.qse.distributionCoefficientCurrentYear,
      ),
    },
  ]

  const coverageDefinitions = [
    ['confirmedTransfers', 'Transferências confirmadas cobertas'],
    ['officialForecasts', 'Previsões oficiais'],
    ['programStatuses', 'Status dos programas'],
    ['budgetExecution', 'Execução orçamentária'],
    ['constitutionalApplication', 'Aplicação constitucional'],
    ['perStudentMetrics', 'Indicadores por matrícula'],
    ['reconciliation', 'Reconciliação'],
  ] as const
  const coverage = coverageDefinitions.map(([key, label]) => {
    const dimension = document.dataQuality.coverageByDimension[key]
    return {
      key,
      label,
      status: dimension.status,
      statusLabel: coverageStatusLabel(dimension.status),
      reason: dimension.reasonCodes[0]
        ? catalog?.reasonMessages[dimension.reasonCodes[0]] ?? null
        : null,
    }
  })
  const coverageSummary = coverage.reduce((summary, dimension) => {
    if (dimension.status === 'complete') summary.complete += 1
    else if (dimension.status === 'unavailable') summary.unavailable += 1
    else summary.pending += 1
    return summary
  }, { complete: 0, pending: 0, unavailable: 0 })
  const coverageHighlightKeys = new Set<string>([
    'budgetExecution',
    'constitutionalApplication',
    'reconciliation',
  ])
  const coverageHighlights = coverage.filter((dimension) => coverageHighlightKeys.has(dimension.key))

  const contextIndicatorIds = new Set(context.indicatorIds)
  const contextProgramIds = new Set(context.programIds)
  const hasContext = contextIndicatorIds.size > 0 || contextProgramIds.size > 0
  const relatedLinks = document.educationLinks.filter((link) => (
    !hasContext || contextIndicatorIds.has(link.indicatorId) || contextProgramIds.has(link.programId)
  ))
  const relations: readonly FinanceRelationPresentation[] = relatedLinks.map((link) => ({
    key: `${link.indicatorId}-${link.programId}-${link.relationType}`,
    indicatorLabel: indicatorById.get(link.indicatorId)?.name ?? link.indicatorId,
    programLabel: programById.get(link.programId)?.title ?? link.programId,
    relationLabel: {
      general_mde: 'Fonte geral de MDE',
      conditional_support: 'Apoio condicionado',
      accounting_context: 'Contexto contábil',
      direct_cost_driver: 'Relação direta documentada',
    }[link.relationType],
    reading: relationReading(link, programById.get(link.programId)?.title ?? link.programId),
  }))

  const contextLabels = {
    indicators: context.indicatorIds.map((id) => indicatorById.get(id)?.name ?? id),
    programs: context.programIds.map((id) => programById.get(id)?.title ?? id),
  }

  const sources = [
    buildSourceGroup('fundeb', 'FNDE — Fundeb', [
      fundeb.fundebTotalAnnualForecast.sourceId,
      fundeb.fundebVaafAnnualForecast.sourceId,
      fundeb.fundebVaatAnnualForecast.sourceId,
      fundeb.fundebVaarAnnualForecast.sourceId,
      ...document.programStatuses.fundebVaat.sourceIds,
      ...document.programStatuses.fundebVaar.sourceIds,
    ], sourceById),
    buildSourceGroup('constitutional', 'FNDE — SIOPE e RREO', [
      ...document.constitutionalApplication.mdeAppliedAmount.reconciliation.sourceIds,
      ...document.constitutionalApplication.mdeAppliedRate.reconciliation.sourceIds,
      ...document.constitutionalApplication.fundebProfessionalRemunerationRate.reconciliation.sourceIds,
      document.constitutionalApplication.fundebRevenueReceivedDeclared.sourceId,
    ], sourceById),
    buildSourceGroup('qse', 'FNDE — Salário-Educação', [
      fundeb.qseDistributedClosedYear.sourceId,
      fundeb.qseOfficialEstimateCurrentYear.sourceId,
    ], sourceById),
    buildSourceGroup('siconfi', 'Tesouro Nacional — SICONFI/DCA', [
      execution.sourceId,
    ], sourceById),
  ]

  return {
    summaryCards,
    executionStages,
    executionOutstanding,
    executionRates,
    fundebComponents,
    qseMetrics,
    qseGroups,
    coverage,
    coverageHighlights,
    coverageSummary,
    relations,
    contextLabels,
    sources,
    qualityLabel: {
      high: 'Cobertura alta',
      medium: 'Cobertura média',
      low: 'Cobertura baixa',
      insufficient: 'Cobertura de evidência insuficiente',
    }[document.dataQuality.level],
  }
}

function buildFundebComponent(
  key: FundebComponentPresentation['key'],
  title: string,
  amount: MunicipalFinanceDocumentV1['amounts']['fundebTotalAnnualForecast'],
  statusLabel: string,
  calculationStatusLabel: string | null,
  source: MunicipalFinanceSourceCatalogEntry | null,
  caution: string | null = null,
): FundebComponentPresentation {
  return {
    key,
    title,
    amount,
    statusLabel,
    calculationStatusLabel,
    natureLabel: amountNatureLabel(amount.amountNature),
    stageLabel: financialStageLabel(amount.financialStage),
    inclusionLabel: amount.includedInFundebTotal ? 'Incluído no total' : 'Não incluído no total',
    doubleCountingLabel: amount.doubleCountingRisk === 'high'
      ? 'Risco de dupla contagem'
      : 'Sem sobreposição identificada',
    summationNote: amount.summationAllowed
      ? null
      : 'Já incluído no total ou composição não reconciliada.',
    caution,
    observation: fundebObservation(key, statusLabel, calculationStatusLabel, amount),
    source,
  }
}

function fundebObservation(
  key: FundebComponentPresentation['key'],
  statusLabel: string,
  calculationStatusLabel: string | null,
  amount: MunicipalFinanceDocumentV1['amounts']['fundebTotalAnnualForecast'],
): string {
  if (key === 'total') return 'Total anual previsto.'
  if (key === 'vaat' && calculationStatusLabel) {
    return calculationStatusLabel.replace(/; isso não confirma benefício\.$/, ' não confirma benefício.')
  }
  if (statusLabel === 'Não beneficiário') return 'Não beneficiário.'
  if (amount.compositionStatus === 'included_in_total') return 'Previsão já incluída no total.'
  if (amount.compositionStatus === 'composition_not_reconciled') return 'Composição não reconciliada.'
  return statusLabel === 'Beneficiário'
    ? 'Benefício nominal com previsão separada.'
    : 'Situação publicada na fonte nominal.'
}

function describeQseCoefficientComparison(
  closedYear: CompactFinancialValue,
  currentYear: CompactFinancialValue,
): string {
  if (closedYear.value === null || currentYear.value === null) {
    return 'A comparação entre os coeficientes não está disponível; a ausência publicada foi preservada.'
  }
  return `Coeficiente publicado para ${closedYear.referenceYear}: ${formatCoefficient(closedYear.value)}; `
    + `estimativa para ${currentYear.referenceYear}: ${formatCoefficient(currentYear.value)}. Os exercícios permanecem separados.`
}

function relationReading(
  link: MunicipalFinanceDocumentV1['educationLinks'][number],
  programLabel: string,
): string {
  if (link.relationType === 'general_mde') {
    return `${programLabel} é fonte geral de MDE. O contrato não confirma destinação específica para este indicador.`
  }
  if (link.relationType === 'accounting_context') {
    return 'A evidência oferece contexto contábil de execução e não representa fonte adicional de recurso.'
  }
  if (link.relationType === 'direct_cost_driver') {
    return 'A relação direta está documentada no contrato; ela não altera a prioridade educacional nem comprova aplicação do valor.'
  }
  if (link.municipalStatus === 'confirmed_beneficiary' && link.programId === 'fundeb_vaar') {
    return 'O município é beneficiário nominal do VAAR em 2026, mas o valor apresentado é previsão e não comprova recebimento ou aplicação.'
  }
  if (link.municipalStatus === 'confirmed_non_beneficiary') {
    return `A fonte nominal registra o município como não beneficiário de ${programLabel} no período; nenhum valor potencial é apresentado.`
  }
  return `${programLabel} é apoio condicionado. O contrato não confirma recebimento, aplicação ou efeito sobre o indicador.`
}

function buildSourceGroup(
  key: string,
  label: string,
  sourceIds: readonly string[],
  sourceById: ReadonlyMap<string, MunicipalFinanceSourceCatalogEntry>,
): FinanceSourceGroupPresentation {
  const entries = Array.from(new Set(sourceIds))
    .map((sourceId) => sourceById.get(sourceId))
    .filter((entry): entry is MunicipalFinanceSourceCatalogEntry => Boolean(entry))
  return {
    key,
    label,
    description: entries.map((entry) => entry.name).filter(Boolean).join('; '),
    links: entries
      .filter((entry): entry is MunicipalFinanceSourceCatalogEntry & { name: string; url: string } => (
        Boolean(entry.name && entry.url)
      ))
      .map((entry) => ({
        label: entry.name,
        url: entry.url,
        agency: entry.agency ?? 'Órgão não informado',
        referenceYear: entry.referenceYear ?? null,
        natureLabel: entry.status === 'integrated' ? 'Fonte integrada' : `Situação da fonte: ${entry.status}`,
      })),
  }
}
