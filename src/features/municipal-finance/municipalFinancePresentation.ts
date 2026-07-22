import type { MunicipalFinanceCatalog, MunicipalFinanceSourceCatalogEntry } from '../../data/municipalFinance'
import type {
  CompactDerivedRate,
  CompactFinancialValue,
  MunicipalFinanceDocumentV1,
  ProgramFinancialStatus,
} from '../diagnostic/municipalFinanceTypes'
import {
  hasPublishableFinancialContent,
  isPublishableFinancialValue,
} from '../../utils/financialPresentation'

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
  statusLabel: string | null
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
    local_calculation: 'Cálculo informado',
  }[nature]
}

export function programStatusLabel(status: ProgramFinancialStatus): string | null {
  if (status === 'not_verified') return null
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
  }[status] ?? null
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
      key: 'paid',
      title: 'Despesa paga em educação',
      amount: execution.paid,
      supportingText: 'Realizado · 2024',
    },
    {
      key: 'mde',
      title: 'Aplicação em MDE',
      amount: document.constitutionalApplication.mdeAppliedRate.canonical,
      supportingText: 'Realizado · 2024',
    },
    {
      key: 'fundeb',
      title: 'Fundeb total previsto',
      amount: fundeb.fundebTotalAnnualForecast,
      supportingText: 'Previsão oficial · 2026',
    },
    {
      key: 'vaar',
      title: 'VAAR previsto',
      amount: vaarStatus === 'confirmed_beneficiary' ? fundeb.fundebVaarAnnualForecast : null,
      supportingText: 'Previsão oficial · 2026',
    },
  ].filter((card) => isPublishableFinancialValue(card.amount))

  const executionStages = [
    { key: 'committed', label: 'Empenhado', value: execution.committed, progress: execution.committed.value === null ? null : 100 },
    {
      key: 'liquidated',
      label: 'Liquidado',
      value: execution.liquidated,
      progress: isPublishableDerivedRate(execution.derivedRates.liquidatedToCommittedRate, document)
        ? execution.derivedRates.liquidatedToCommittedRate.value : null,
    },
    {
      key: 'paid',
      label: 'Pago',
      value: execution.paid,
      progress: isPublishableDerivedRate(execution.derivedRates.paidToCommittedRate, document)
        ? execution.derivedRates.paidToCommittedRate.value : null,
    },
  ].filter((stage) => isPublishableFinancialValue(stage.value))

  const executionOutstanding: readonly AmountPresentation[] = [
    { label: 'Restos a pagar não processados', value: execution.outstandingNonProcessed },
    { label: 'Restos a pagar processados', value: execution.outstandingProcessed },
  ].filter((item) => isPublishableFinancialValue(item.value))

  const executionRates = [
    { key: 'liquidatedToCommitted', label: 'Percentual liquidado sobre o empenhado', value: execution.derivedRates.liquidatedToCommittedRate },
    { key: 'paidToCommitted', label: 'Percentual pago sobre o empenhado', value: execution.derivedRates.paidToCommittedRate },
    { key: 'paidToLiquidated', label: 'Percentual pago sobre o liquidado', value: execution.derivedRates.paidToLiquidatedRate },
    { key: 'outstandingToCommitted', label: 'Restos registrados em relação ao empenhado', value: execution.derivedRates.outstandingToCommittedRate },
  ].filter((item): item is { key: string; label: string; value: CompactDerivedRate & { value: number } } => (
    isPublishableDerivedRate(item.value, document)
  ))

  const allFundebComponents: readonly FundebComponentPresentation[] = [
    buildFundebComponent(
      'total',
      'Fundeb total',
      fundeb.fundebTotalAnnualForecast,
      null,
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
        not_verified: null,
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
  const fundebComponents = allFundebComponents.filter((component) => (
    component.key === 'total'
      ? isPublishableFinancialValue(component.amount)
      : component.statusLabel === 'Beneficiário' && isPublishableFinancialValue(component.amount)
  ))
  const fundebNonBeneficiaryLabels = allFundebComponents
    .filter((component) => component.key !== 'total' && component.statusLabel === 'Não beneficiário')
    .map((component) => component.title)

  const qseMetrics: readonly AmountPresentation[] = [
    { label: 'Valor distribuído em 2024', value: fundeb.qseDistributedClosedYear },
    { label: 'Estimativa oficial de 2026', value: fundeb.qseOfficialEstimateCurrentYear },
    { label: 'Matrículas usadas no coeficiente', value: document.qse.enrollmentsClosedYear },
    { label: 'Coeficiente de distribuição 2024', value: document.qse.distributionCoefficientClosedYear },
    { label: 'Coeficiente estimado 2026', value: document.qse.distributionCoefficientCurrentYear },
    { label: 'Valor distribuído por matrícula', value: document.perStudent.qseDistributedPerEnrollment },
  ]

  const qseGroups: readonly QseGroupPresentation[] = ([
    {
      key: 'distribution',
      title: 'Distribuição de 2024',
      metrics: [
        qseMetrics[0],
        ...(isPublishableDerivedRate(document.perStudent.qseDistributedPerEnrollment, document) ? [qseMetrics[5]] : []),
      ].filter((metric) => isPublishableFinancialValue(metric.value)),
      comparison: null,
    },
    {
      key: 'estimate',
      title: 'Estimativa de 2026',
      metrics: [qseMetrics[1]].filter((metric) => isPublishableFinancialValue(metric.value)),
      comparison: null,
    },
    {
      key: 'calculationBase',
      title: 'Base do cálculo',
      metrics: [qseMetrics[2]].filter((metric) => isPublishableFinancialValue(metric.value)),
      comparison: null,
    },
  ] satisfies QseGroupPresentation[]).filter((group) => group.metrics.length)

  const contextIndicatorIds = new Set(context.indicatorIds)
  const contextProgramIds = new Set(context.programIds)
  const hasContext = contextIndicatorIds.size > 0 || contextProgramIds.size > 0
  const relatedLinks = document.educationLinks.filter((link) => (
    (!hasContext || contextIndicatorIds.has(link.indicatorId) || contextProgramIds.has(link.programId))
    && isPublishableFinancialValue(resolveDocumentReference(document, link.amountReferenceId))
  ))
  const relations: readonly FinanceRelationPresentation[] = relatedLinks.map((link) => ({
    key: `${link.indicatorId}-${link.programId}-${link.relationType}`,
    indicatorLabel: indicatorById.get(link.indicatorId)?.name ?? link.indicatorId,
    programLabel: programById.get(link.programId)?.title ?? link.programId,
    relationLabel: {
      general_mde: 'Fonte geral de MDE',
      conditional_support: 'Apoio condicionado',
      accounting_context: 'Contexto contábil',
      direct_cost_driver: 'Relação direta registrada',
    }[link.relationType],
    reading: relationReading(link, programById.get(link.programId)?.title ?? link.programId),
  }))

  const contextLabels = {
    indicators: context.indicatorIds.map((id) => indicatorById.get(id)?.name ?? id),
    programs: context.programIds.map((id) => programById.get(id)?.title ?? id),
  }

  const sources = [
    buildSourceGroup('fundeb', 'FNDE — Fundeb', [
      ...sourceIdsForPublishableValues([
        fundeb.fundebTotalAnnualForecast,
        fundeb.fundebVaafAnnualForecast,
        fundeb.fundebVaatAnnualForecast,
        fundeb.fundebVaarAnnualForecast,
      ]),
    ], sourceById),
    buildSourceGroup('constitutional', 'FNDE — SIOPE e RREO', [
      ...(isPublishableFinancialValue(document.constitutionalApplication.mdeAppliedAmount.canonical)
        ? document.constitutionalApplication.mdeAppliedAmount.reconciliation.sourceIds : []),
      ...(isPublishableFinancialValue(document.constitutionalApplication.mdeAppliedRate.canonical)
        ? document.constitutionalApplication.mdeAppliedRate.reconciliation.sourceIds : []),
      ...(isPublishableFinancialValue(document.constitutionalApplication.fundebProfessionalRemunerationRate.canonical)
        ? document.constitutionalApplication.fundebProfessionalRemunerationRate.reconciliation.sourceIds : []),
      ...sourceIdsForPublishableValues([document.constitutionalApplication.fundebRevenueReceivedDeclared]),
    ], sourceById),
    buildSourceGroup('qse', 'FNDE — Salário-Educação', [
      ...sourceIdsForPublishableValues([
        fundeb.qseDistributedClosedYear,
        fundeb.qseOfficialEstimateCurrentYear,
      ]),
    ], sourceById),
    buildSourceGroup('siconfi', 'Tesouro Nacional — SICONFI/DCA', [
      ...hasPublishableFinancialContent([
        execution.committed,
        execution.liquidated,
        execution.paid,
        execution.outstandingNonProcessed,
        execution.outstandingProcessed,
      ]) ? [execution.sourceId] : [],
    ], sourceById),
  ].filter((group) => group.links.length)

  return {
    summaryCards,
    executionStages,
    executionOutstanding,
    executionRates,
    fundebComponents,
    fundebNonBeneficiaryLabels,
    qseGroups,
    relations,
    contextLabels,
    sources,
  }
}

function sourceIdsForPublishableValues(values: readonly CompactFinancialValue[]): string[] {
  return values
    .filter((value) => isPublishableFinancialValue(value))
    .map((value) => value.sourceId)
}

function buildFundebComponent(
  key: FundebComponentPresentation['key'],
  title: string,
  amount: MunicipalFinanceDocumentV1['amounts']['fundebTotalAnnualForecast'],
  statusLabel: string | null,
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
    observation: fundebObservation(key, statusLabel),
    source,
  }
}

function fundebObservation(
  key: FundebComponentPresentation['key'],
  statusLabel: string | null,
): string {
  if (key === 'total') return 'Total anual previsto.'
  if (statusLabel === 'Não beneficiário') return 'Município não beneficiário em 2026.'
  return statusLabel === 'Beneficiário'
    ? 'Previsão separada; não comprova recebimento efetivo.'
    : statusLabel ? `${statusLabel} em 2026.` : ''
}

function resolveDocumentReference(document: MunicipalFinanceDocumentV1, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return null
    return (value as Record<string, unknown>)[key]
  }, document)
}

function isPublishableDerivedRate(
  rate: CompactDerivedRate,
  document: MunicipalFinanceDocumentV1,
): rate is CompactDerivedRate & { value: number } {
  if (!isPublishableFinancialValue(rate)) return false
  const denominator = resolveDocumentReference(document, rate.calculation.denominatorReferenceId)
  if (!isPublishableFinancialValue(denominator)) return false
  const denominatorValue = (denominator as CompactFinancialValue).value
  if (denominatorValue === 0) return false
  return rate.calculation.numeratorReferenceIds.every((referenceId) => (
    isPublishableFinancialValue(resolveDocumentReference(document, referenceId))
  ))
}

function relationReading(
  link: MunicipalFinanceDocumentV1['educationLinks'][number],
  programLabel: string,
): string {
  if (link.relationType === 'general_mde') {
    return `${programLabel} é fonte geral de MDE. Não há confirmação de destinação específica para este indicador.`
  }
  if (link.relationType === 'accounting_context') {
    return 'A evidência oferece contexto contábil de execução e não representa fonte adicional de recurso.'
  }
  if (link.relationType === 'direct_cost_driver') {
    return 'A relação direta está registrada; ela não altera a prioridade educacional nem comprova aplicação do valor.'
  }
  if (link.municipalStatus === 'confirmed_beneficiary' && link.programId === 'fundeb_vaar') {
    return 'O município é beneficiário nominal do VAAR em 2026, mas o valor apresentado é previsão e não comprova recebimento ou aplicação.'
  }
  if (link.municipalStatus === 'confirmed_non_beneficiary') {
    return `O município está registrado como não beneficiário de ${programLabel} no período; nenhum valor potencial é apresentado.`
  }
  return `${programLabel} é apoio condicionado. Não há confirmação de recebimento, aplicação ou efeito sobre o indicador.`
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
        natureLabel: 'Fonte oficial',
      })),
  }
}
