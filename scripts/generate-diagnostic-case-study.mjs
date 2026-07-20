import fs from 'node:fs'

const root = new URL('../', import.meta.url)
const readJson = (relativePath) => JSON.parse(fs.readFileSync(new URL(relativePath, root), 'utf8'))
const round = (value, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null
const quantile = (sorted, probability) => {
  if (!sorted.length) return null
  const position = (sorted.length - 1) * probability
  const lower = Math.floor(position)
  const fraction = position - lower
  return sorted[lower + 1] === undefined
    ? sorted[lower]
    : sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower])
}

const municipalityIndex = readJson('public/data/municipios_index.json')
const novaPayload = readJson('public/data/municipios/nova-santa-rita/index.json')
const novaDetails = readJson('public/data/municipios/nova-santa-rita/details.json')
const stateReference = readJson('public/data/pne_2026_2036/referencia_estadual.json')
const indicatorCatalog = readJson('src/data/diagnostic/indicatorCatalog.json')
const financingMatrix = readJson('src/data/diagnostic/indicatorFinancingMatrix.json')
const outputPath = new URL('docs/data/nova_santa_rita_diagnostico_exemplo.json', root)

const cycle = novaPayload.pne_2026_2036
const novaResults = cycle.indicadores
const resultSets = municipalityIndex.municipios.map((municipality) => ({
  municipality,
  results: readJson(`public/data/municipios/${municipality.slug}/index.json`).pne_2026_2036.indicadores,
}))

const exposureOverrides = {
  creche: { value: 100 * 387 / 591, basis: 'matrículas municipais / matrículas totais de creche em 2025; o total detalhado (591) difere do numerador PNE (557)' },
  pre_escola: { value: 100 * 756 / 823, basis: 'matrículas municipais / matrículas totais de pré-escola em 2025' },
  basico_6_17: { value: 100 * 3800 / 4852, basis: 'matrículas municipais / matrículas totais de 6 a 17 anos em 2025' },
  basico_15_17: { value: 100 * 249 / 1039, basis: 'matrículas municipais / matrículas totais de 15 a 17 anos em 2025' },
  basico_integral: { value: 100 * 1281 / 1286, basis: 'matrículas integrais municipais / matrículas integrais públicas totais em 2025' },
  escolas_integral: { value: 100 * 18 / 21, basis: 'escolas municipais elegíveis / escolas públicas elegíveis em 2025' },
}

const highSchoolIds = new Set([
  'idade_regular_medio', 'adequacao_em', 'saeb_matematica_ensino_medio',
  'saeb_portugues_ensino_medio', 'medio_tecnico_articulado_percentual',
  'medio_tecnico_participacao_publica', 'subsequente_expansao',
])
const territorialIds = new Set([
  'alfabetizacao_pop_15_mais', 'fundamental_concluido_18_mais',
  'fundamental_concluido_15_29', 'medio_concluido_18_mais',
  'medio_concluido_18_29', 'rendimento_magisterio',
])
const directIds = new Set(['creche', 'pre_escola'])

function governanceFor(indicatorId) {
  if (directIds.has(indicatorId)) return { level: 'direct', score: 100 }
  if (territorialIds.has(indicatorId)) return { level: 'territorial', score: 30 }
  if (highSchoolIds.has(indicatorId)) return { level: 'indirect', score: 20 }
  return { level: 'shared', score: 60 }
}

function stateValue(indicatorId, year) {
  const state = stateReference.indicators[indicatorId]
  if (!state || state.comparison_status !== 'comparable') return null
  const point = state.series?.find((item) => item.year === year)
  return Number.isFinite(point?.value) ? point.value : null
}

function projectionFor(indicatorId) {
  const trend = cycle.projecoes?.[indicatorId]
  if (trend?.available) {
    const currentIndex = trend.years?.indexOf(2026) ?? -1
    return {
      expectedCurrentValue: currentIndex >= 0 ? trend.projected_percent_raw?.[currentIndex] ?? null : null,
      inertialProjection2036: trend.projected_2036_raw ?? trend.projected_2036 ?? null,
      model: 'attendance_trend_v1',
      quality: trend.quality ?? null,
      validationStatus: 'model_not_official_inep_projection',
      warnings: trend.warnings ?? [],
    }
  }
  const maintenance = cycle.cenarios_planejamento?.[indicatorId]
  if (maintenance?.status === 'available' || maintenance?.status === 'available_with_warning') {
    return {
      expectedCurrentValue: maintenance.projected?.find((point) => point.year === 2026)?.displayValue ?? null,
      inertialProjection2036: maintenance.projected?.find((point) => point.year === 2036)?.displayValue ?? null,
      model: 'last_components_maintenance',
      quality: maintenance.qualityEvidence?.provisionalLevel ?? null,
      validationStatus: maintenance.targetValidationStatus ?? 'configured_unvalidated',
      warnings: maintenance.diagnostics?.warnings ?? [],
    }
  }
  return {
    expectedCurrentValue: null,
    inertialProjection2036: null,
    model: null,
    quality: null,
    validationStatus: 'not_available',
    warnings: [],
  }
}

function confidenceFor(definition, result, comparableStateValue) {
  const provenance = definition.sourceIds.some((sourceId) => sourceId.includes('pending')) ? 15 : 30
  const correspondence = { direct: 30, partial: 20, proxy: 10, informative: 5 }[definition.correspondence] ?? 0
  const latestGap = 2026 - Number(result.end_year)
  let temporal = latestGap <= 2 ? 25 : latestGap <= 5 ? 15 : 5
  if (result.trend?.status === 'unavailable') temporal = Math.max(0, temporal - 10)
  if (result.trend?.status === 'inconclusive') temporal = Math.max(0, temporal - 5)
  const benchmark = comparableStateValue === null ? 0 : 15
  return { benchmark, correspondence, provenance, temporal, total: provenance + correspondence + temporal + benchmark }
}

function financingPrograms(indicatorId) {
  return financingMatrix.links
    .filter((link) => link.indicatorIds.includes(indicatorId) && link.linkType !== 'no_proven_direct_link')
    .map((link) => ({ linkType: link.linkType, programId: link.programId }))
}

const assessments = []
const unavailableIndicators = []
for (const definition of indicatorCatalog.indicators) {
  const result = novaResults[definition.indicatorId]
  if (!result?.available || !Number.isFinite(result.end_value)) {
    unavailableIndicators.push({
      indicatorId: definition.indicatorId,
      reason: result?.trend?.unavailable_reason ?? 'municipal_result_unavailable',
      status: 'missing',
    })
    continue
  }

  const minimum = definition.validRange.minimum
  const maximum = definition.validRange.maximum
  const inRange = (minimum === null || result.end_value >= minimum) && (maximum === null || result.end_value <= maximum)
  const peerValues = []
  let excludedOutOfRange = 0
  for (const set of resultSets) {
    const candidate = set.results[definition.indicatorId]
    if (!candidate?.available || candidate.end_year !== result.end_year || !Number.isFinite(candidate.end_value)) continue
    if ((minimum !== null && candidate.end_value < minimum) || (maximum !== null && candidate.end_value > maximum)) {
      excludedOutOfRange += 1
      continue
    }
    peerValues.push(candidate.end_value)
  }
  peerValues.sort((left, right) => left - right)
  const less = peerValues.filter((value) => value < result.end_value).length
  const equal = peerValues.filter((value) => value === result.end_value).length
  const rawPercentile = peerValues.length ? 100 * (less + 0.5 * equal) / peerValues.length : null
  const direction = definition.direction ?? result.direction ?? 'at_least'
  const performancePercentile = rawPercentile === null ? null : direction === 'at_most' ? 100 - rawPercentile : rawPercentile
  const weightedState = stateValue(definition.indicatorId, result.end_year)
  const legalTarget = definition.targets.find((item) => item.year >= 2026) ?? definition.targets.at(-1) ?? null
  const correspondenceEligible = definition.correspondence === 'direct' || definition.correspondence === 'partial'
  const targetGap = !legalTarget || !inRange || !correspondenceEligible
    ? null
    : Math.max(0, direction === 'at_most' ? result.end_value - legalTarget.value : legalTarget.value - result.end_value)
  const observedSlope = Number.isFinite(result.trend?.slope) ? result.trend.slope : null
  const favorableObservedPace = observedSlope === null ? null : direction === 'at_most' ? -observedSlope : observedSlope
  const remainingYears = legalTarget ? legalTarget.year - result.end_year : null
  const requiredAnnualPace = targetGap === null || !remainingYears || remainingYears <= 0 ? null : targetGap / remainingYears
  const accelerationFactor = requiredAnnualPace === null
    ? null
    : requiredAnnualPace === 0
      ? 0
      : favorableObservedPace > 0
        ? requiredAnnualPace / favorableObservedPace
        : null
  const trajectoryGapScore = targetGap === null || !legalTarget?.value
    ? null
    : Math.min(100, 100 * targetGap / Math.abs(legalTarget.value))
  const paceScore = targetGap === null
    ? null
    : targetGap === 0
      ? 0
      : favorableObservedPace === null || favorableObservedPace <= 0
        ? 100
        : Math.min(100, 50 * accelerationFactor)
  const availableNeedWeight = (trajectoryGapScore === null ? 0 : 35) + (paceScore === null ? 0 : 25)
  const stateDistributionContextScore = performancePercentile === null ? null : 100 - performancePercentile
  const confidence = confidenceFor(definition, result, weightedState)
  const governance = governanceFor(definition.indicatorId)
  const exposure = exposureOverrides[definition.indicatorId] ?? null
  const availableActionabilityWeight = 40 + 15 + (exposure ? 25 : 0)
  const actionabilityScore = availableActionabilityWeight >= 70
    ? (40 * governance.score + 15 * confidence.total + (exposure ? 25 * exposure.value : 0)) / availableActionabilityWeight
    : null
  const flags = []
  if (!inRange) flags.push('value_outside_conceptual_range')
  if (excludedOutOfRange) flags.push('state_distribution_contains_out_of_range_values')
  if (definition.correspondence !== 'direct') flags.push(`legal_correspondence_${definition.correspondence}`)
  if (result.trend?.status === 'inconclusive') flags.push('trend_inconclusive')
  if (result.trend?.status === 'unavailable') flags.push(`trend_unavailable:${result.trend.unavailable_reason}`)
  if (definition.sourceIds.some((sourceId) => sourceId.includes('pending'))) flags.push('source_provenance_pending')

  assessments.push({
    indicatorId: definition.indicatorId,
    name: definition.name,
    category: definition.category,
    observation: {
      endYear: result.end_year,
      endValue: round(result.end_value),
      startYear: result.start_year,
      startValue: round(result.start_value),
      status: inRange ? 'available' : 'methodologically_incompatible',
    },
    legalReference: {
      correspondence: definition.correspondence,
      legalGoalRefs: definition.legalGoalRefs,
      nextTarget: legalTarget,
      implementationTarget: {
        direction: result.direction ?? null,
        label: result.meta_label ?? null,
        value: Number.isFinite(result.meta) ? result.meta : null,
      },
    },
    trajectory: {
      accelerationFactor: round(accelerationFactor),
      favorableObservedAnnualPace: round(favorableObservedPace),
      officialExpectedCurrentValue: null,
      officialStatus: 'pending_inep_per_entity_projection_within_180_day_legal_window',
      observedAnnualChange: round(observedSlope),
      requiredAnnualPace: round(requiredAnnualPace),
      targetGap: round(targetGap),
      ...projectionFor(definition.indicatorId),
    },
    benchmarks: {
      matchedPeerCohort: { reason: 'COREDE/CRE, porte, perfil da rede e variáveis socioeconômicas não estão integrados ao contrato atual.', status: 'not_available' },
      rsMunicipalDistribution: {
        excludedOutOfRange,
        median: round(quantile(peerValues, 0.5)),
        performancePercentile: round(performancePercentile),
        q1: round(quantile(peerValues, 0.25)),
        q3: round(quantile(peerValues, 0.75)),
        sampleSize: peerValues.length,
        year: result.end_year,
      },
      stateWeightedValue: round(weightedState),
    },
    governance: {
      level: governance.level,
      municipalExposureBasis: exposure?.basis ?? null,
      municipalExposurePercent: round(exposure?.value),
      status: exposure ? 'partial_quantification' : 'not_quantified',
    },
    financing: {
      candidatePrograms: financingPrograms(definition.indicatorId),
      municipalEligibilityStatus: 'not_verified',
    },
    quality: {
      confidenceComponents: confidence,
      confidenceScore: confidence.total,
      flags,
      limits: definition.limits,
    },
    priority: {
      actionabilityScore: round(actionabilityScore),
      actionabilityUnavailableWeightPercent: 100 - availableActionabilityWeight,
      finalScore: null,
      needComponents: {
        internalInequalityScore: null,
        matchedPeerGapScore: null,
        paceScore: round(paceScore),
        stateDistributionContextScore: round(stateDistributionContextScore),
        trajectoryGapScore: round(trajectoryGapScore),
      },
      needScore: null,
      needUnavailableWeightPercent: 100 - availableNeedWeight,
      status: 'insufficient_evidence',
      reason: 'O peso disponível da necessidade é inferior a 70%: faltam pares semelhantes e desigualdade interna; ausência não foi tratada como zero.',
    },
  })
}

const output = {
  contractVersion: 'municipal-diagnostic-proposal-v1',
  generatedAt: '2026-07-19',
  methodologyVersion: 'priority-methodology-proposal-v1',
  municipality: { id: '4313375', name: 'Nova Santa Rita', state: 'RS' },
  legalContext: {
    law: 'Lei 15.388/2026',
    legalTextComparison: '73 de 73 metas locais conferidas; diferenças automáticas restritas a espaços de marcação tipográfica.',
    officialPerEntityIndicatorStatus: 'pending_within_180_day_legal_window_as_of_2026-07-19',
  },
  evidenceSummary: {
    assessmentsAvailable: assessments.length,
    municipalityUniverse: resultSets.length,
    serializedDiagnosticSummary: cycle.diagnostico.summary,
    unavailableIndicators,
  },
  scoringPolicy: {
    actionabilityWeights: { confidence: 15, financingAvailability: 20, governance: 40, municipalExposure: 25 },
    minimumAvailableWeightPercent: 70,
    missingValues: 'preserved_as_null_without_zero_imputation',
    needWeights: { internalInequality: 15, matchedPeerGap: 25, pace: 25, trajectoryGap: 35 },
  },
  assessments,
  robustnessExamples: [
    {
      municipality: 'André da Rocha',
      role: 'small-denominator stress case',
      integral2025Denominator: 188,
      integralPlanningBacktestMaePp: 5.914,
      note: 'O erro retrospectivo do cenário de manutenção é material; ranking deve expor denominador e incerteza.',
    },
    {
      municipality: 'Porto Alegre',
      role: 'large-network stress case',
      integral2025Denominator: 138494,
      integralPlanningBacktestMaePp: 2.049,
      note: 'A rede grande reduz instabilidade relativa, mas agregados podem ocultar desigualdade intraurbana, hoje ausente.',
    },
  ],
  sources: {
    catalog: 'src/data/diagnostic/indicatorCatalog.json',
    financingMatrix: 'src/data/diagnostic/indicatorFinancingMatrix.json',
    municipalDetails: 'public/data/municipios/nova-santa-rita/details.json',
    municipalPayload: 'public/data/municipios/nova-santa-rita/index.json',
    stateReference: 'public/data/pne_2026_2036/referencia_estadual.json',
  },
}

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
