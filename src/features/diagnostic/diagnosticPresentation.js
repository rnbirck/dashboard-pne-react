const SUPPORTED_SCHEMA_VERSION = 'municipal-diagnostic-v2'

const PRESENTATION_STATUS_LABELS = {
  missing: 'Dado ausente',
  informational: 'Indicador informativo',
  proxy: 'Indicador proxy',
  pending_official_definition: 'Comparação pendente',
  methodologically_incompatible: 'Comparação incompatível',
  outside_domain: 'Valor fora do domínio',
  unverifiable: 'Dado não verificável',
  goal_attained: 'Referência atingida',
  comparable_gap: 'Lacuna comparável',
}

const THEME_STATUS = {
  no_data: ['Sem dados', 'neutral', 'Nenhum resultado municipal disponível neste tema.'],
  no_comparable: ['Sem comparação válida', 'neutral', 'Os resultados do tema permanecem informativos ou metodologicamente excluídos.'],
  mixed: ['Situação comparável mista', 'mixed', 'Há referências atingidas e lacunas comparáveis neste tema.'],
  attention: ['Lacunas comparáveis', 'danger', 'O tema possui pontos de atenção comparáveis.'],
  all_attained: ['Referências atingidas', 'success', 'As comparações quantitativas válidas do tema atingem suas referências.'],
}

const FINANCING_RELATION_LABELS = {
  direct: 'Relação direta com o objeto financiado',
  conditioned: 'Depende de habilitação, condição ou regulamentação',
  programmatic: 'Pode financiar ação relacionada',
  general_mde: 'Fonte geral de manutenção e desenvolvimento do ensino',
}

const SPECIFIC_FINANCING_RELATIONS = ['direct', 'conditioned', 'programmatic']

const FINANCING_FRONT_RULES = [
  {
    key: 'attendance_journey_retention',
    title: 'Atendimento, jornada e permanência',
    description: 'Ações de acesso, jornada, aprendizagem, progressão e permanência escolar.',
    themes: ['atendimento', 'rendimento', 'escolaridade_populacao'],
  },
  {
    key: 'professional_development',
    title: 'Formação e valorização dos profissionais',
    description: 'Formação, qualificação, atração e condições de permanência dos profissionais.',
    themes: ['corpo_docente'],
  },
  {
    key: 'infrastructure_offer',
    title: 'Infraestrutura e condições de oferta',
    description: 'Adequação de espaços, equipamentos, conectividade e condições de funcionamento.',
    themes: ['infraestrutura'],
  },
]

const FINANCING_BADGES = {
  adhesion: 'Depende de adesão',
  automatic_transfer: 'Repasse automático',
  conditional_complement: 'Condicionado',
  selection: 'Depende de seleção',
}

const RESPONSIBILITY_TEXTS = {
  direct: 'Cabe ao município planejar e executar a oferta sob sua responsabilidade.',
  shared: 'Cabe ao município atuar na própria rede e pactuar metas, oferta e fluxos com as demais redes.',
  state_led: 'Cabe ao Estado liderar a oferta; o município pode pactuar acesso, demanda e articulação local.',
  federal_led: 'Cabe à União liderar a política; o município pode aderir e articular a execução local.',
  territorial: 'O resultado é territorial e não representa falha exclusiva da prefeitura; cabe pactuação intersetorial.',
  informational: 'A leitura é informativa e precisa de validação antes de orientar uma ação.',
}

const EVIDENCE_REASON_LABELS = {
  COMPARISON_NOT_ELIGIBLE: 'referência ainda não elegível para comparação',
  DATA_UNAVAILABLE: 'dado municipal indisponível',
  INFORMATIONAL_INDICATOR: 'indicador de caráter informativo',
  INSUFFICIENT_HISTORY: 'histórico insuficiente',
  LEGAL_CORRESPONDENCE_PARTIAL: 'correspondência parcial com a meta legal',
  METHODOLOGY_INCOMPATIBLE: 'metodologia incompatível com a referência',
  MUNICIPAL_EXPOSURE_RECONCILED: 'exposição municipal reconciliada',
  PEER_BENCHMARK_AVAILABLE: 'comparação por porte da oferta disponível',
  PROXY_NOT_VALIDATED: 'aproximação ainda não validada',
  SCENARIO_AVAILABLE: 'cenário disponível',
  SCENARIO_QUALITY_LOW: 'cenário com qualidade limitada',
  SCENARIO_UNAVAILABLE: 'cenário indisponível',
  STATE_BENCHMARK_AVAILABLE: 'referência estadual disponível',
  SUFFICIENT_HISTORY: 'histórico suficiente',
  VALUE_DOMAIN_INCOMPATIBLE: 'valor incompatível com o domínio da medida',
}

const INVESTIGATION_GROUPS = [
  {
    key: 'methodology_reference',
    title: 'Metodologia ou referência ainda incompatível',
    description: 'A fórmula, o domínio ou a referência ainda não permite uma comparação segura.',
    reasonCodes: new Set([
      'COMPARISON_NOT_ELIGIBLE',
      'METHODOLOGY_INCOMPATIBLE',
      'VALUE_DOMAIN_INCOMPATIBLE',
    ]),
  },
  {
    key: 'municipal_data',
    title: 'Dado municipal indisponível',
    description: 'O recorte municipal necessário não foi publicado ou não pôde ser reconciliado.',
    reasonCodes: new Set(['DATA_UNAVAILABLE']),
  },
  {
    key: 'informational_proxy',
    title: 'Indicador informativo ou proxy',
    description: 'A medida ajuda a contextualizar, mas não substitui o indicador principal.',
    reasonCodes: new Set(['INFORMATIONAL_INDICATOR', 'PROXY_NOT_VALIDATED']),
  },
  {
    key: 'local_validation',
    title: 'Oferta ou componentes que exigem validação local',
    description: 'Histórico, cenário ou componentes da oferta precisam de conferência antes da decisão.',
    reasonCodes: new Set(),
  },
]

export function selectMunicipalDiagnosticContract(municipioData) {
  const contract = municipioData?.schemaVersion
    ? municipioData
    : municipioData?.pne_2026_2036?.diagnostico_v2
  if (!contract) return { contract: null, status: 'missing' }
  if (contract.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return { contract: null, status: 'incompatible_version' }
  }
  return { contract, status: 'ready' }
}

export function buildDiagnosticViewModel(contract) {
  if (!contract || contract.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return emptyDiagnosticViewModel()
  }

  const indicators = (contract.indicators ?? []).map(toIndicatorViewModel)
  const viewById = new Map(indicators.map((indicator) => [indicator.rawKey, indicator]))
  const decisionContract = contract.decisionSummary ?? {}
  const mapDecisionItems = (references) => (references ?? [])
    .map((reference) => {
      const view = viewById.get(reference.indicatorId)
      if (!view) return null
      return {
        ...view,
        collection: reference.collection,
        evidenceLevel: reference.evidenceLevel ?? view.evidenceLevel,
        selectionPosition: reference.selectionPosition ?? null,
        selectionReasonCodes: reference.selectionReasonCodes ?? [],
      }
    })
    .filter(Boolean)
  const decisionSummary = {
    coordinationCount: decisionContract.coordinationCount ?? 0,
    coordinationItems: mapDecisionItems(decisionContract.coordinationItems),
    investigationCount: decisionContract.investigationCount ?? 0,
    investigationItems: mapDecisionItems(decisionContract.investigationItems),
    monitoringCount: decisionContract.monitoringCount ?? 0,
    monitoringItems: mapDecisionItems(decisionContract.monitoringItems),
    municipalActionCount: decisionContract.municipalActionCount ?? 0,
    municipalActionItems: mapDecisionItems(decisionContract.municipalActionItems),
    preservationCount: decisionContract.preservationCount ?? 0,
    preservationItems: mapDecisionItems(decisionContract.preservationItems).map((item) => ({
      ...item,
      note: formatPreservedNote(item),
    })),
    selectionMethodologyVersion: decisionContract.selectionMethodologyVersion ?? '',
  }
  decisionSummary.classifiedIndicatorCount = [
    decisionSummary.municipalActionCount,
    decisionSummary.coordinationCount,
    decisionSummary.investigationCount,
    decisionSummary.monitoringCount,
    decisionSummary.preservationCount,
  ].reduce((total, count) => total + Number(count ?? 0), 0)
  const excluded = (contract.excludedItems ?? [])
    .map((reference) => {
      const view = viewById.get(reference.indicatorId)
      if (!view) return null
      const reason = reference.exclusionReasons?.[0]
      return {
        ...view,
        note: reason?.message ?? PRESENTATION_STATUS_LABELS[view.presentationStatus],
        exclusionReasons: reference.exclusionReasons ?? [],
      }
    })
    .filter(Boolean)
  const stateSummary = contract.stateBenchmarkSummary ?? {}
  const stateBenchmark = {
    favorable: (stateSummary.largestFavorableIndicatorIds ?? [])
      .map((indicatorId) => viewById.get(indicatorId))
      .filter(Boolean)
      .slice(0, 2),
    summary: {
      analyzed: stateSummary.analyzedCount ?? 0,
      better: stateSummary.betterCount ?? 0,
      comparable: stateSummary.eligibleAnalyzedCount ?? 0,
      equivalent: stateSummary.equivalentCount ?? 0,
      unavailable: stateSummary.unavailableCount ?? 0,
      worse: stateSummary.worseCount ?? 0,
    },
    hasUsefulComparison: Number(stateSummary.eligibleAnalyzedCount) > 0,
    unfavorable: (stateSummary.largestUnfavorableIndicatorIds ?? [])
      .map((indicatorId) => viewById.get(indicatorId))
      .filter(Boolean)
      .slice(0, 3),
  }

  const areas = (contract.summary?.themes ?? []).map((theme) => {
    const [statusLabel, statusTone, reading] = THEME_STATUS[theme.statusCode] ?? THEME_STATUS.no_comparable
    const focus = theme.focusIndicatorId ? viewById.get(theme.focusIndicatorId) : null
    return {
      achieved: theme.goalsAttained,
      available: theme.availableResults,
      coordination: theme.coordinationIndicators ?? 0,
      below: theme.comparableGaps,
      comparableTotal: theme.validLegalComparisons,
      excluded: theme.excludedIndicators,
      fullLabel: theme.label,
      investigation: theme.investigationIndicators ?? 0,
      key: theme.theme,
      label: theme.label,
      monitoring: theme.monitoringIndicators ?? 0,
      municipalAction: theme.municipalActionIndicators ?? 0,
      preservation: theme.preservationIndicators ?? 0,
      reading,
      statusLabel,
      statusTone,
      total: theme.validLegalComparisons,
      worstIndicator: focus
        ? { ...focus, summary: `${focus.distanceLabel} para a referência` }
        : null,
    }
  })

  return {
    areas,
    decisionSummary,
    excluded,
    indicators,
    preserved: decisionSummary.preservationItems,
    stateBenchmark,
    summary: {
      achieved: contract.summary?.goalsAttained ?? 0,
      available: contract.summary?.availableResults ?? 0,
      below: contract.summary?.comparableGaps ?? 0,
      excluded: contract.summary?.excludedIndicators ?? 0,
      indicatorCount: contract.summary?.indicatorCount ?? 0,
      total: contract.summary?.validLegalComparisons ?? 0,
    },
    warnings: contract.warnings ?? [],
  }
}

export function buildFinancingViewModel(
  contract,
  programsCatalog,
  matrixCatalog,
  displayedDecisionIndicatorIds,
) {
  if (!contract || contract.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return { fronts: [], generalMdeRelated: false, indicatorIds: [], programIds: [] }
  }
  const programById = new Map(
    (programsCatalog?.programs ?? []).map((program) => [program.programId, program]),
  )
  const indicatorById = new Map(
    (contract.indicators ?? []).map((indicator) => [indicator.indicatorId, indicator]),
  )
  const matrixLinks = matrixCatalog?.links ?? []
  const requestedIndicatorIds = Array.isArray(displayedDecisionIndicatorIds)
    ? new Set(displayedDecisionIndicatorIds)
    : null
  const decisionItems = [
    ...(contract.decisionSummary?.municipalActionItems ?? []),
    ...(contract.decisionSummary?.coordinationItems ?? []),
  ]
    .filter((item) => !requestedIndicatorIds || requestedIndicatorIds.has(item.indicatorId))
  let generalMdeRelated = false
  const fronts = []

  for (const decisionItem of decisionItems) {
    const indicator = indicatorById.get(decisionItem.indicatorId)
    if (!indicator) continue
    const rule = FINANCING_FRONT_RULES.find((candidate) => (
      candidate.themes.includes(indicator.theme)
    ))
    if (!rule) continue
    let front = fronts.find((candidate) => candidate.key === rule.key)
    if (!front) {
      front = {
        description: rule.description,
        indicators: [],
        key: rule.key,
        mechanisms: [],
        title: rule.title,
      }
      fronts.push(front)
    }
    front.indicators.push({
      actionMode: decisionItem.collection,
      indicatorId: decisionItem.indicatorId,
      label: indicator.title ?? decisionItem.indicatorId,
    })
  }

  const usedProgramIds = new Set()
  for (const front of fronts) {
    const hasMunicipalAction = front.indicators.some((item) => item.actionMode === 'municipal_action')
    const hasCoordination = front.indicators.some((item) => item.actionMode === 'coordination')
    front.actionMode = hasMunicipalAction && hasCoordination
      ? 'mixed'
      : hasCoordination ? 'coordination' : 'municipal_action'
    front.description = hasMunicipalAction && hasCoordination
      ? 'Ações municipais potenciais e articulações com outras redes, sujeitas à verificação de elegibilidade.'
      : hasCoordination
        ? 'Possíveis caminhos de adesão, colaboração ou articulação interfederativa.'
        : 'Possíveis caminhos para apoiar uma ação municipal, sem elegibilidade verificada.'
    const frontIndicatorIds = new Set(front.indicators.map((item) => item.indicatorId))
    for (const relationType of SPECIFIC_FINANCING_RELATIONS) {
      for (const link of matrixLinks) {
        if (
          front.mechanisms.length >= 3
          || link.linkType !== relationType
          || !link.indicatorIds?.some((indicatorId) => frontIndicatorIds.has(indicatorId))
          || usedProgramIds.has(link.programId)
        ) {
          continue
        }
        const program = programById.get(link.programId)
        if (!program || program.accessMode === 'information_system') continue
        front.mechanisms.push({
          badge: program.status === 'created_pending_regulation'
            ? 'Regulamentação pendente'
            : FINANCING_BADGES[program.accessMode] ?? null,
          evidence: link.evidence,
          municipalEligibilityStatus: 'not_verified',
          programId: link.programId,
          relationLabel: FINANCING_RELATION_LABELS[relationType],
          relationType,
          title: program.title,
        })
        usedProgramIds.add(link.programId)
      }
    }
  }

  for (const decisionItem of decisionItems) {
    for (const link of matrixLinks) {
      if (link.linkType === 'general_mde' && link.indicatorIds?.includes(decisionItem.indicatorId)) {
        generalMdeRelated = true
      }
    }
  }

  return {
    fronts: fronts.slice(0, 3),
    generalMdeRelated,
    indicatorIds: decisionItems.map((item) => item.indicatorId),
    programIds: [...usedProgramIds],
  }
}

export function buildExecutiveSummary(analysis) {
  const decision = analysis.decisionSummary
  return `${decision.municipalActionCount} indicadores com possibilidade de ação municipal, ${decision.coordinationCount} dependem de pactuação, ${decision.investigationCount} precisam de investigação e ${decision.monitoringCount} estão em acompanhamento.`
}

export function buildInvestigationGroups(items) {
  const groups = INVESTIGATION_GROUPS.map((definition) => ({
    description: definition.description,
    examples: [],
    items: [],
    key: definition.key,
    title: definition.title,
  }))
  for (const item of items ?? []) {
    const reasonCodes = item.evidenceReasonCodes ?? []
    const groupIndex = INVESTIGATION_GROUPS.findIndex(
      (definition, index) => index < INVESTIGATION_GROUPS.length - 1
        && reasonCodes.some((reasonCode) => definition.reasonCodes.has(reasonCode)),
    )
    const group = groups[groupIndex >= 0 ? groupIndex : groups.length - 1]
    group.items.push(item)
  }
  return groups.map((group) => ({
    ...group,
    count: group.items.length,
    examples: group.items.slice(0, 2).map((item) => item.label),
  }))
}

export function buildAccountabilityText(analysis, municipio) {
  const actionLines = analysis.decisionSummary.municipalActionItems.map((item) => (
    `Ação municipal — ${item.label}: atual ${item.currentLabel}, referência ${item.metaLabel}, distância ${item.distanceLabel}.`
  ))
  const coordinationLines = analysis.decisionSummary.coordinationItems.map((item) => (
    `Pactuação — ${item.label}: ${item.responsibilityText}`
  ))
  const decisionLines = [...actionLines, ...coordinationLines]
  const sources = [...new Set(
    analysis.indicators.flatMap((indicator) => indicator.sourceLabels ?? []),
  )]

  return [
    `DIAGNÓSTICO MUNICIPAL — ${municipio}`,
    'PNE 2026–2036',
    'Síntese para decisão',
    '',
    buildExecutiveSummary(analysis),
    '',
    ...(decisionLines.length ? decisionLines : ['Nenhuma ação municipal elegível nesta síntese.']),
    '',
    sources.length ? `Fontes: ${sources.join('; ')}.` : 'Fontes: não declaradas no contrato.',
    '',
    'Nota: triagem descritiva por evidência; não constitui ranking final.',
  ].join('\n')
}

function toIndicatorViewModel(indicator) {
  const configuredReference = indicator.configuredReference ?? {}
  const currentValue = indicator.displayValue
  const rawValue = indicator.rawValue
  const meta = configuredReference.value
  const unit = indicator.unit
  const distance = indicator.favorableDistance
  const remainingGap = indicator.remainingGap
  const methodologyNote = indicator.flags?.[0]?.message ?? ''
  const visualProgressValue = clampVisualPercentage(rawValue)
  const stateBenchmark = indicator.benchmarks?.state ?? {}
  const benchmarkMunicipalityValue = Number.isFinite(stateBenchmark.municipalityValue)
    ? stateBenchmark.municipalityValue
    : currentValue
  const benchmarkMunicipalityYear = Number.isFinite(stateBenchmark.municipalityYear)
    ? stateBenchmark.municipalityYear
    : stateBenchmark.year
  const stateComparable = stateBenchmark.status === 'comparable'
    && ['better', 'worse', 'equivalent'].includes(stateBenchmark.position)
    && Number.isFinite(stateBenchmark.value)
    && Number.isFinite(stateBenchmark.year)
    && Number.isFinite(benchmarkMunicipalityValue)
    && Number.isFinite(benchmarkMunicipalityYear)
  const stateDifferenceLabel = stateComparable
    ? formatUnsignedNumberByUnit(stateBenchmark.favorableDifference, unit)
    : ''
  const trajectory = indicator.trajectory ?? {}
  const governance = indicator.governance ?? {}
  const exposure = indicator.municipalExposure ?? {}
  const peers = indicator.similarMunicipalities ?? {}
  const decisionReading = indicator.decisionReading ?? {}

  return {
    categoryKey: indicator.theme,
    categoryLabel: indicator.themeLabel,
    currentLabel: formatNumberByUnit(currentValue, unit),
    currentValue,
    dataStatus: indicator.dataStatus,
    direction: indicator.direction,
    distance,
    distanceLabel: formatUnsignedNumberByUnit(remainingGap, unit),
    displayValue: currentValue,
    evidenceLevel: indicator.evidenceLevel ?? indicator.evidence?.level ?? 'insufficient',
    evidenceReasonCodes: indicator.evidence?.reasonCodes ?? [],
    evidenceReasonLabels: (indicator.evidence?.reasonCodes ?? []).map(
      (reasonCode) => EVIDENCE_REASON_LABELS[reasonCode] ?? 'limitação metodológica registrada',
    ),
    exclusionReasons: indicator.exclusionReasons ?? [],
    favorableDistance: distance,
    flags: indicator.flags ?? [],
    isComparable: indicator.targetComparisonStatus === 'eligible',
    key: `${indicator.theme}-${indicator.indicatorId}`,
    label: indicator.title,
    legalCorrespondence: indicator.legalCorrespondence,
    meta,
    metaLabel: formatNumberByUnit(meta, unit),
    currentYear: indicator.currentYear,
    methodologyNote,
    operationalizationStatus: indicator.operationalizationStatus,
    presentationStatus: indicator.presentation?.statusCode,
    visualProgressValue,
    rawKey: indicator.indicatorId,
    rawValue,
    referenceYear: configuredReference.year ?? null,
    remainingGap,
    sourceLabels: indicator.source?.labels ?? [],
    sourceNote: (indicator.source?.labels ?? []).join('; '),
    trajectory: {
      estimatedAchievementYear: trajectory.estimatedAchievementYear ?? null,
      historyPointCount: trajectory.historyPointCount ?? 0,
      observedPaceLabel: formatPace(trajectory.observedFavorableAnnualPace, unit),
      paceStatus: trajectory.paceStatus ?? 'not_applicable',
      paceStatusLabel: PACE_STATUS_LABELS[trajectory.paceStatus] ?? 'Ritmo não aplicável',
      projectedLabel: formatNumberByUnit(trajectory.projectedValue, unit),
      requiredPaceLabel: formatPace(trajectory.requiredAnnualPace, unit),
      scenarioLabel: SCENARIO_LABELS[trajectory.scenarioType] ?? 'Sem cenário',
      scenarioType: trajectory.scenarioType ?? 'not_available',
      targetYear: trajectory.targetYear ?? null,
      uncertainty: trajectory.uncertainty ?? 'not_estimated',
    },
    governance: {
      classification: governance.classification ?? 'informational',
      label: GOVERNANCE_LABELS[governance.classification] ?? 'Leitura informativa',
      pactuationRequired: governance.pactuationRequired === true,
      responsibilityText: RESPONSIBILITY_TEXTS[governance.classification]
        ?? RESPONSIBILITY_TEXTS.informational,
    },
    responsibilityText: RESPONSIBILITY_TEXTS[governance.classification]
      ?? RESPONSIBILITY_TEXTS.informational,
    municipalExposure: {
      denominatorShare: exposure.municipalDenominatorShare ?? null,
      denominatorShareLabel: formatShare(exposure.municipalDenominatorShare),
      numeratorShare: exposure.municipalNumeratorShare ?? null,
      numeratorShareLabel: formatShare(exposure.municipalNumeratorShare),
      reasonCode: exposure.reasonCode ?? null,
      status: exposure.status ?? 'unavailable',
      year: exposure.year ?? null,
    },
    peers: {
      cohortSize: peers.cohortSize ?? 0,
      medianLabel: formatNumberByUnit(peers.statistics?.median, unit),
      performancePercentile: peers.performancePercentile ?? null,
      percentileLabel: Number.isFinite(peers.performancePercentile)
        ? `${peers.performancePercentile.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}º percentil favorável`
        : '',
      featuresUsed: peers.featuresUsed ?? [],
      usesOfferingSizeOnly: Array.isArray(peers.featuresUsed)
        && peers.featuresUsed.length === 1
        && peers.featuresUsed[0] === 'offering_size',
      status: peers.status ?? 'unavailable',
      year: peers.year ?? null,
    },
    decisionReading: {
      classification: decisionReading.classification ?? 'insufficient_evidence',
      label: DECISION_LABELS[decisionReading.classification] ?? 'Evidência insuficiente',
      reasonCodes: decisionReading.reasonCodes ?? [],
      summaryCollection: decisionReading.summaryCollection ?? 'investigation',
    },
    stateBenchmark: {
      benchmarkMunicipalityLabel: formatNumberByUnit(benchmarkMunicipalityValue, unit),
      benchmarkMunicipalityValue,
      coverageRate: stateBenchmark.coverageRate ?? null,
      differenceLabel: stateDifferenceLabel,
      favorableDifference: stateBenchmark.favorableDifference ?? null,
      isComparable: stateComparable,
      method: stateBenchmark.method ?? null,
      municipalityCount: stateBenchmark.municipalityCount ?? null,
      municipalityLatestYear: stateBenchmark.municipalityLatestYear ?? indicator.currentYear ?? null,
      municipalityYear: benchmarkMunicipalityYear ?? null,
      position: stateBenchmark.position ?? null,
      referenceLabel: formatNumberByUnit(stateBenchmark.value, unit),
      status: stateBenchmark.status ?? 'unavailable',
      value: stateBenchmark.value ?? null,
      year: stateBenchmark.year ?? null,
      usesLatestCommonYear: stateBenchmark.usesLatestCommonYear === true,
    },
    stateComparisonLabel: stateComparable
      ? formatStateComparisonLabel({
        difference: stateBenchmark.favorableDifference,
        direction: indicator.direction,
        position: stateBenchmark.position,
        unit,
      })
      : '',
    statusLabel: PRESENTATION_STATUS_LABELS[indicator.presentation?.statusCode] ?? 'Estado metodológico não informado',
    unit,
    valueDomainStatus: indicator.valueDomainStatus,
  }
}

const PACE_STATUS_LABELS = {
  target_already_met: 'Referência já atingida',
  sufficient: 'Ritmo suficiente',
  insufficient: 'Ritmo insuficiente',
  moving_away: 'Movimento desfavorável',
  stable: 'Ritmo estável',
  insufficient_history: 'Histórico insuficiente',
  not_applicable: 'Ritmo não aplicável',
}

const SCENARIO_LABELS = {
  trend_projection: 'Projeção de tendência',
  component_maintenance: 'Cenário de manutenção',
  required_trajectory: 'Trajetória necessária',
  historical_trend_only: 'Tendência histórica',
  not_available: 'Sem cenário',
}

const GOVERNANCE_LABELS = {
  direct: 'Ação municipal direta',
  shared: 'Responsabilidade compartilhada',
  state_led: 'Liderança estadual',
  federal_led: 'Liderança federal',
  territorial: 'Coordenação territorial',
  informational: 'Leitura informativa',
}

const DECISION_LABELS = {
  municipal_direct_action: 'Ação municipal direta',
  municipal_action_with_coordination: 'Ação municipal com coordenação',
  intergovernmental_coordination: 'Coordenação intergovernamental',
  investigate_data_or_supply: 'Investigar dado ou oferta',
  preserve_result: 'Preservar resultado',
  monitor: 'Monitorar',
  insufficient_evidence: 'Evidência insuficiente',
}

function formatPace(value, unit) {
  if (!Number.isFinite(value)) return 'não calculável'
  const formatted = value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  return unit === 'percent' ? `${formatted} p.p./ano` : `${formatted}/ano`
}

function formatShare(value) {
  if (!Number.isFinite(value)) return 'não disponível'
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

function formatStateComparisonLabel({ difference, direction, position, unit }) {
  if (position === 'equivalent') return 'resultado próximo da Referência RS'
  const amount = formatUnsignedNumberByUnit(difference, unit)
  if (position === 'better' && direction === 'at_most') {
    return `${amount} abaixo da Referência RS`
  }
  if (position === 'better') return `${amount} acima da Referência RS`
  if (position === 'worse' && direction === 'at_most') {
    return `${amount} acima da Referência RS`
  }
  if (position === 'worse') return `${amount} abaixo da Referência RS`
  return 'Sem referência estadual comparável'
}

function clampVisualPercentage(value) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

function formatPreservedNote(indicator) {
  if (!Number.isFinite(indicator.favorableDistance)) {
    return `Resultado ${indicator.currentLabel}; ${indicator.statusLabel.toLocaleLowerCase('pt-BR')}`
  }
  return `Resultado ${indicator.currentLabel}; referência quantitativa atingida ${formatSignedNumberByUnit(indicator.favorableDistance, indicator.unit)}`
}

function formatNumberByUnit(value, unit) {
  if (!Number.isFinite(value)) return '—'
  if (unit === 'percent') {
    return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
  }
  if (unit === 'index' || unit === 'years') {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  }
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function formatUnsignedNumberByUnit(value, unit) {
  if (!Number.isFinite(value)) return 'não calculável'
  const formatted = Math.abs(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  if (unit === 'percent') return `${formatted} p.p.`
  if (unit === 'years') return `${formatted} anos`
  return formatted
}

function formatSignedNumberByUnit(value, unit) {
  if (!Number.isFinite(value)) return 'não calculável'
  const sign = value > 0 ? '+' : ''
  const formatted = `${sign}${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}`
  if (unit === 'percent') return `${formatted} p.p.`
  if (unit === 'years') return `${formatted} anos`
  return formatted
}

function emptyDiagnosticViewModel() {
  return {
    areas: [],
    decisionSummary: {
      classifiedIndicatorCount: 0,
      coordinationCount: 0,
      coordinationItems: [],
      investigationCount: 0,
      investigationItems: [],
      monitoringCount: 0,
      monitoringItems: [],
      municipalActionCount: 0,
      municipalActionItems: [],
      preservationCount: 0,
      preservationItems: [],
      selectionMethodologyVersion: '',
    },
    excluded: [],
    indicators: [],
    preserved: [],
    stateBenchmark: {
      favorable: [],
      hasUsefulComparison: false,
      summary: { analyzed: 0, better: 0, comparable: 0, equivalent: 0, unavailable: 0, worse: 0 },
      unfavorable: [],
    },
    summary: { achieved: 0, available: 0, below: 0, excluded: 0, indicatorCount: 0, total: 0 },
    warnings: [],
  }
}
