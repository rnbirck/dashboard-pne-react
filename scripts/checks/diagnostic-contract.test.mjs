import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  buildDiagnosticViewModel,
  buildExecutiveSummary,
  buildFinancingViewModel,
  buildInvestigationGroups,
  selectMunicipalDiagnosticContract,
} from '../../src/features/diagnostic/diagnosticPresentation.js'

function indicator(overrides) {
  return {
    indicatorId: 'base',
    theme: 'corpo_docente',
    themeLabel: 'Corpo docente',
    title: 'Indicador',
    currentYear: 2024,
    rawValue: 40,
    displayValue: 40,
    unit: 'percent',
    direction: 'at_least',
    dataStatus: 'available',
    legalCorrespondence: 'direct',
    operationalizationStatus: 'direct',
    valueDomainStatus: 'within_domain',
    targetComparisonStatus: 'eligible',
    configuredReference: { value: 50, year: 2036 },
    favorableDistance: -10,
    remainingGap: 10,
    exclusionReasons: [],
    flags: [],
    source: { labels: ['Fonte teste'] },
    presentation: { statusCode: 'comparable_gap' },
    benchmarks: {
      state: {
        status: 'comparable',
        value: 42.7,
        year: 2024,
        municipalityValue: 40,
        municipalityYear: 2024,
        municipalityLatestYear: 2024,
        usesLatestCommonYear: false,
        method: 'ratio_of_sums',
        coverageRate: 1,
        municipalityCount: 497,
        favorableDifference: -2.7,
        position: 'worse',
      },
      municipalDistribution: {
        status: 'available',
        year: 2024,
        median: 45,
        q1: 30,
        q3: 60,
        performancePercentile: 40,
        municipalityCount: 497,
        coverageRate: 1,
      },
    },
    trajectory: {
      status: 'available',
      scenarioType: 'required_trajectory',
      historyPointCount: 4,
      targetYear: 2036,
      observedFavorableAnnualPace: 1,
      requiredAnnualPace: 2,
      paceStatus: 'insufficient',
      projectedValue: 50,
      uncertainty: 'not_estimated',
    },
    governance: {
      classification: 'shared',
      pactuationRequired: true,
    },
    municipalExposure: {
      status: 'unavailable',
      municipalNumeratorShare: null,
      municipalDenominatorShare: null,
    },
    similarMunicipalities: {
      status: 'available',
      cohortSize: 20,
      year: 2024,
      statistics: { median: 45 },
      performancePercentile: 40,
      featuresUsed: ['offering_size'],
    },
    evidenceLevel: 'medium',
    evidence: {
      level: 'medium',
      reasonCodes: ['STATE_BENCHMARK_AVAILABLE', 'PEER_BENCHMARK_AVAILABLE'],
      methodologyVersion: 'municipal-evidence-p3c-v1',
    },
    decisionReading: {
      classification: 'municipal_action_with_coordination',
      reasonCodes: ['comparable_gap', 'pace_insufficient', 'governance_shared'],
      evidenceLevel: 'medium',
      summaryCollection: 'coordination',
    },
    ...overrides,
  }
}

function contractFixture() {
  const indicators = [
    indicator({
      indicatorId: 'temporarios',
      title: 'Contratos temporários',
      rawValue: 41.75,
      displayValue: 41.7,
      direction: 'at_most',
      configuredReference: { value: 30, year: 2031 },
      favorableDistance: -999,
      remainingGap: 7,
      presentation: { statusCode: 'comparable_gap' },
    }),
    indicator({
      indicatorId: 'aee',
      title: 'AEE',
      rawValue: 1.408,
      displayValue: 1.4,
      operationalizationStatus: 'proxy',
      targetComparisonStatus: 'methodologically_incompatible',
      favorableDistance: null,
      remainingGap: null,
      presentation: { statusCode: 'proxy' },
      evidenceLevel: 'insufficient',
      evidence: {
        level: 'insufficient',
        reasonCodes: ['METHODOLOGY_INCOMPATIBLE', 'PROXY_NOT_VALIDATED'],
        methodologyVersion: 'municipal-evidence-p3c-v1',
      },
      decisionReading: {
        classification: 'insufficient_evidence',
        reasonCodes: ['METHODOLOGY_INCOMPATIBLE', 'PROXY_NOT_VALIDATED'],
        evidenceLevel: 'insufficient',
        summaryCollection: 'investigation',
      },
      exclusionReasons: [{ code: 'proxy', message: 'Denominador incompatível.' }],
    }),
    indicator({
      indicatorId: 'creche',
      title: 'Creche',
      governance: { classification: 'direct', pactuationRequired: false },
      decisionReading: {
        classification: 'municipal_direct_action',
        reasonCodes: ['comparable_gap', 'pace_insufficient', 'governance_direct'],
        evidenceLevel: 'medium',
        summaryCollection: 'municipal_action',
      },
    }),
    indicator({
      indicatorId: 'pos_graduacao',
      title: 'Docentes com pós-graduação',
      configuredReference: { value: 35, year: 2031 },
      favorableDistance: 5,
      remainingGap: 0,
      evidenceLevel: 'medium',
      evidence: {
        level: 'medium',
        reasonCodes: ['LEGAL_CORRESPONDENCE_PARTIAL', 'STATE_BENCHMARK_AVAILABLE'],
        methodologyVersion: 'municipal-evidence-p3c-v1',
      },
      decisionReading: {
        classification: 'monitor',
        reasonCodes: ['quantitative_reference_attained_with_caveats'],
        evidenceLevel: 'medium',
        summaryCollection: 'monitoring',
      },
      presentation: { statusCode: 'goal_attained' },
    }),
    indicator({
      indicatorId: 'pre_escola',
      theme: 'atendimento',
      themeLabel: 'Atendimento escolar',
      title: 'Pré-escola',
      rawValue: 122.222,
      displayValue: 122.222,
      configuredReference: { value: 100, year: 2028 },
      favorableDistance: 22.222,
      remainingGap: 0,
      flags: [
        { code: 'KNOWN_MIXED_TERRITORIAL_BASIS', message: 'Base territorial conhecida.' },
        { code: 'VALUE_ABOVE_100_ALLOWED_BY_METHOD', message: 'Valor permitido.' },
      ],
      presentation: { statusCode: 'goal_attained' },
      decisionReading: {
        classification: 'preserve_result',
        reasonCodes: ['quantitative_reference_attained'],
        evidenceLevel: 'medium',
        summaryCollection: 'preservation',
      },
    }),
  ]
  return {
    schemaVersion: 'municipal-diagnostic-v2',
    indicators,
    attentionItems: [
      { indicatorId: 'creche', rank: 1, legacyRelativeGapScore: 0.8, inclusionReasons: [] },
      { indicatorId: 'temporarios', rank: 2, legacyRelativeGapScore: 0.2, inclusionReasons: [] },
    ],
    preservedItems: [
      { indicatorId: 'pre_escola', preservationReasons: [] },
    ],
    excludedItems: [
      { indicatorId: 'aee', exclusionReasons: [{ code: 'proxy', message: 'Denominador incompatível.' }] },
    ],
    decisionSummary: {
      municipalActionCount: 1,
      coordinationCount: 1,
      investigationCount: 1,
      monitoringCount: 1,
      preservationCount: 1,
      municipalActionItems: [{
        indicatorId: 'creche',
        collection: 'municipal_action',
        evidenceLevel: 'medium',
        selectionPosition: 1,
        selectionReasonCodes: ['PACE_INSUFFICIENT'],
      }],
      coordinationItems: [{
        indicatorId: 'temporarios',
        collection: 'coordination',
        evidenceLevel: 'medium',
        selectionPosition: 1,
        selectionReasonCodes: ['PACE_INSUFFICIENT'],
      }],
      investigationItems: [{
        indicatorId: 'aee',
        collection: 'investigation',
        evidenceLevel: 'insufficient',
        selectionReasonCodes: ['METHODOLOGY_INCOMPATIBLE'],
      }],
      monitoringItems: [{
        indicatorId: 'pos_graduacao',
        collection: 'monitoring',
        evidenceLevel: 'medium',
        selectionReasonCodes: ['STATE_BENCHMARK_AVAILABLE'],
      }],
      preservationItems: [{
        indicatorId: 'pre_escola',
        collection: 'preservation',
        evidenceLevel: 'medium',
        selectionReasonCodes: ['STATE_BENCHMARK_AVAILABLE'],
      }],
      selectionMethodologyVersion: 'municipal-decision-summary-p3c-v2',
    },
    summary: {
      indicatorCount: 5,
      availableResults: 5,
      validLegalComparisons: 4,
      goalsAttained: 2,
      comparableGaps: 2,
      excludedIndicators: 1,
      themes: [],
    },
    stateBenchmarkSummary: {
      analyzedCount: 3,
      eligibleAnalyzedCount: 3,
      betterCount: 1,
      worseCount: 1,
      equivalentCount: 1,
      unavailableCount: 0,
      largestUnfavorableIndicatorIds: ['temporarios'],
      largestFavorableIndicatorIds: ['pre_escola'],
    },
    warnings: [],
  }
}

test('React presents the canonical decision collections without using the legacy attention order', () => {
  const view = buildDiagnosticViewModel(contractFixture())
  assert.deepEqual(view.decisionSummary.municipalActionItems.map((item) => item.rawKey), ['creche'])
  assert.deepEqual(view.decisionSummary.coordinationItems.map((item) => item.rawKey), ['temporarios'])
  const temporary = view.decisionSummary.coordinationItems[0]
  assert.equal(temporary.selectionPosition, 1)
  assert.equal(temporary.direction, 'at_most')
  assert.equal(temporary.rawValue, 41.75)
  assert.equal(temporary.displayValue, 41.7)
  assert.equal(temporary.favorableDistance, -999)
  assert.equal(temporary.remainingGap, 7)
  assert.equal(temporary.visualProgressValue, 41.75)
  assert.equal(view.decisionSummary.investigationItems[0].selectionPosition, null)
  assert.deepEqual(view.decisionSummary.monitoringItems.map((item) => item.rawKey), ['pos_graduacao'])
  assert.equal(view.decisionSummary.classifiedIndicatorCount, 5)
})

test('executive counts reconcile the contract universe and mention monitoring', () => {
  const view = buildDiagnosticViewModel(contractFixture())
  const decision = view.decisionSummary
  assert.equal(
    decision.municipalActionCount
      + decision.coordinationCount
      + decision.investigationCount
      + decision.monitoringCount
      + decision.preservationCount,
    view.summary.indicatorCount,
  )
  assert.match(buildExecutiveSummary(view), /1 estão em acompanhamento/)
})

test('investigation reasons are grouped into four Portuguese summaries with at most two examples', () => {
  const groups = buildInvestigationGroups([
    { label: 'Método', evidenceReasonCodes: ['METHODOLOGY_INCOMPATIBLE'] },
    { label: 'Ausência', evidenceReasonCodes: ['DATA_UNAVAILABLE'] },
    { label: 'Proxy', evidenceReasonCodes: ['PROXY_NOT_VALIDATED'] },
    { label: 'Histórico', evidenceReasonCodes: ['INSUFFICIENT_HISTORY'] },
    { label: 'Outro histórico', evidenceReasonCodes: ['SCENARIO_UNAVAILABLE'] },
    { label: 'Terceiro histórico', evidenceReasonCodes: ['SCENARIO_QUALITY_LOW'] },
  ])
  assert.equal(groups.length, 4)
  assert.deepEqual(groups.map((group) => group.count), [1, 1, 1, 3])
  assert.ok(groups.every((group) => group.examples.length <= 2))
  assert.equal(groups.reduce((total, group) => total + group.count, 0), 6)
})

test('value above 100 remains numeric while only the visual width is clamped', () => {
  const view = buildDiagnosticViewModel(contractFixture())
  const preSchool = view.preserved.find((item) => item.rawKey === 'pre_escola')
  assert.equal(preSchool.rawValue, 122.222)
  assert.equal(preSchool.displayValue, 122.222)
  assert.equal(preSchool.currentLabel, '122,2%')
  assert.match(preSchool.note, /122,2%/)
  assert.equal(preSchool.favorableDistance, 22.222)
  assert.equal(preSchool.visualProgressValue, 100)
})

test('methodological states are converted only to presentation text', () => {
  const view = buildDiagnosticViewModel(contractFixture())
  assert.equal(view.excluded[0].statusLabel, 'Indicador proxy')
  assert.equal(view.excluded[0].note, 'Denominador incompatível.')
})

test('state-led and territorial responsibility texts never claim direct municipal action', () => {
  const contract = contractFixture()
  contract.indicators[0].governance = { classification: 'state_led', pactuationRequired: true }
  const territorial = indicator({
    indicatorId: 'territorial',
    governance: { classification: 'territorial', pactuationRequired: true },
  })
  contract.indicators.push(territorial)
  const view = buildDiagnosticViewModel(contract)
  const stateLed = view.indicators.find((item) => item.rawKey === 'temporarios')
  const territorialView = view.indicators.find((item) => item.rawKey === 'territorial')
  assert.match(stateLed.responsibilityText, /Estado liderar/)
  assert.doesNotMatch(stateLed.responsibilityText, /executar a oferta sob sua responsabilidade/)
  assert.match(territorialView.responsibilityText, /não representa falha exclusiva da prefeitura/)
  assert.doesNotMatch(territorialView.responsibilityText, /ação municipal direta/i)
})

test('React preserves the benchmark summary and highlight lists received from the pipeline', () => {
  const view = buildDiagnosticViewModel(contractFixture())
  assert.deepEqual(view.stateBenchmark.unfavorable.map((item) => item.rawKey), ['temporarios'])
  assert.deepEqual(view.stateBenchmark.favorable.map((item) => item.rawKey), ['pre_escola'])
  assert.deepEqual(view.stateBenchmark.summary, {
    analyzed: 3,
    better: 1,
    comparable: 3,
    equivalent: 1,
    unavailable: 0,
    worse: 1,
  })
  assert.equal(view.stateBenchmark.hasUsefulComparison, true)
  assert.equal(view.stateBenchmark.unfavorable[0].stateBenchmark.municipalityYear, 2024)
})

test('an unavailable state benchmark remains absence instead of a four-zero section', () => {
  const contract = contractFixture()
  contract.stateBenchmarkSummary = {
    analyzedCount: 4,
    eligibleAnalyzedCount: 0,
    betterCount: 0,
    worseCount: 0,
    equivalentCount: 0,
    unavailableCount: 4,
    largestUnfavorableIndicatorIds: [],
    largestFavorableIndicatorIds: [],
  }
  const view = buildDiagnosticViewModel(contract)

  assert.equal(view.stateBenchmark.hasUsefulComparison, false)
  assert.deepEqual(view.stateBenchmark.unfavorable, [])
  assert.deepEqual(view.stateBenchmark.favorable, [])
  assert.equal(view.stateBenchmark.summary.unavailable, 4)
})

test('financing presentation resolves only versioned matrix links for action and coordination items', async () => {
  const [programs, matrix, catalog] = await Promise.all([
    readFile(new URL('../../src/data/diagnostic/financingPrograms.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../../src/data/diagnostic/indicatorFinancingMatrix.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../../src/data/diagnostic/indicatorCatalog.json', import.meta.url), 'utf8').then(JSON.parse),
  ])
  const programIds = new Set(programs.programs.map((program) => program.programId))
  const indicatorIds = new Set(catalog.indicators.map((item) => item.indicatorId))
  for (const link of matrix.links) {
    assert.ok(programIds.has(link.programId), link.programId)
    for (const indicatorId of link.indicatorIds) assert.ok(indicatorIds.has(indicatorId), indicatorId)
  }

  const financing = buildFinancingViewModel(contractFixture(), programs, matrix)
  assert.deepEqual(
    financing.fronts.flatMap((front) => front.indicators.map((item) => item.indicatorId)),
    ['creche', 'temporarios'],
  )
  assert.ok(financing.fronts.length <= 3)
  assert.equal(financing.generalMdeRelated, true)
  const displayedProgramIds = []
  for (const front of financing.fronts) {
    assert.ok(front.mechanisms.length <= 3)
    for (const mechanism of front.mechanisms) {
      displayedProgramIds.push(mechanism.programId)
      assert.equal(mechanism.municipalEligibilityStatus, 'not_verified')
      assert.notEqual(mechanism.programId, 'siope')
      assert.notEqual(mechanism.programId, 'siconfi_finbra')
      assert.notEqual(mechanism.programId, 'fundeb_vaaf')
      assert.notEqual(mechanism.programId, 'fundeb_vaat')
      assert.notEqual(mechanism.programId, 'salario_educacao_qsem')
      assert.notEqual(mechanism.relationType, 'no_proven_direct_link')
      assert.equal('value' in mechanism, false)
    }
  }
  assert.equal(new Set(displayedProgramIds).size, displayedProgramIds.length)

  const neutral = buildFinancingViewModel(contractFixture(), programs, { links: [] })
  assert.equal(neutral.fronts[0].mechanisms.length, 0)
  assert.equal(neutral.generalMdeRelated, false)
})

test('financial synthesis excludes investigation items and consolidates selected programs', async () => {
  const [programs, matrix, payload] = await Promise.all([
    readFile(new URL('../../src/data/diagnostic/financingPrograms.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../../src/data/diagnostic/indicatorFinancingMatrix.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../../public/data/municipios/agudo/diagnostico.json', import.meta.url), 'utf8').then(JSON.parse),
  ])
  const contract = payload
  const expectedIds = [
    ...contract.decisionSummary.municipalActionItems,
    ...contract.decisionSummary.coordinationItems,
  ].map((item) => item.indicatorId)
  const financing = buildFinancingViewModel(contract, programs, matrix)
  const displayedIds = financing.fronts.flatMap(
    (front) => front.indicators.map((item) => item.indicatorId),
  )
  const displayedPrograms = financing.fronts.flatMap(
    (front) => front.mechanisms.map((item) => item.programId),
  )

  assert.deepEqual([...displayedIds].sort(), [...expectedIds].sort())
  assert.equal(new Set(displayedIds).size, displayedIds.length)
  assert.equal(displayedIds.some((indicatorId) => (
    contract.decisionSummary.investigationItems.some((item) => item.indicatorId === indicatorId)
  )), false)
  assert.ok(financing.fronts.length <= 3)
  assert.equal(new Set(displayedPrograms).size, displayedPrograms.length)
  assert.equal(displayedPrograms.includes('fundeb_vaaf'), false)
  assert.equal(displayedPrograms.includes('fundeb_vaat'), false)
  assert.equal(displayedPrograms.includes('salario_educacao_qsem'), false)
  assert.equal(displayedPrograms.includes('siope'), false)
  assert.equal(displayedPrograms.includes('siconfi_finbra'), false)
  for (const front of financing.fronts) assert.ok(front.mechanisms.length <= 3)
})

test('selection accepts only diagnostico_v2 and never falls back to legacy analysis', () => {
  assert.equal(selectMunicipalDiagnosticContract({ pne_2026_2036: { diagnostico: {} } }).status, 'missing')
  assert.equal(
    selectMunicipalDiagnosticContract({
      pne_2026_2036: { diagnostico_v2: { schemaVersion: 'future-version' } },
    }).status,
    'incompatible_version',
  )
  assert.equal(
    selectMunicipalDiagnosticContract({ schemaVersion: 'municipal-diagnostic-v2' }).status,
    'ready',
  )
})

test('diagnostic is absent from the initial payload and loaded only by its route', async () => {
  const [initialPayload, staticDataSource, pageSource, routerSource] = await Promise.all([
    readFile(new URL('../../public/data/municipios/agudo/index.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../../src/data/staticData.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../src/pages/Diagnostico.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../src/app/AppPageRouter.tsx', import.meta.url), 'utf8'),
  ])
  assert.equal('diagnostico_v2' in initialPayload.pne_2026_2036, false)
  assert.equal('diagnostico' in initialPayload.pne_2026_2036, false)
  assert.equal(initialPayload.pne_2026_2036.diagnostico_ref.status, 'available')
  assert.match(staticDataSource, /\/diagnostico\.json/)
  assert.match(pageSource, /useMunicipioDiagnostic\(slug\)/)
  assert.match(routerSource, /const LazyDiagnostico = lazy/)
  assert.doesNotMatch(routerSource, /loadMunicipioDiagnostic/)
})

test('presentation module contains no local sort or diagnostic distance calculation', async () => {
  const source = await readFile(
    new URL('../../src/features/diagnostic/diagnosticPresentation.js', import.meta.url),
    'utf8',
  )
  assert.doesNotMatch(source, /\.sort\s*\(/)
  assert.doesNotMatch(source, /currentValue\s*[-+]\s*(?:targetValue|meta)/)
  assert.doesNotMatch(source, /goalAttained\s*=/)
  assert.doesNotMatch(source, /priorityScore/)
  assert.doesNotMatch(source, /indicator\.title\.(?:includes|match|test)/)
})

test('executive page does not render technical exclusions or repeated provisional copy', async () => {
  const source = await readFile(
    new URL('../../src/components/DiagnosticPanel.jsx', import.meta.url),
    'utf8',
  )
  const presentationSource = await readFile(
    new URL('../../src/features/diagnostic/diagnosticPresentation.js', import.meta.url),
    'utf8',
  )
  assert.doesNotMatch(source, /Indicadores fora da ordem provisória/)
  assert.doesNotMatch(presentationSource, /ordem provisória/i)
  assert.doesNotMatch(source, /critério provisório/i)
  assert.doesNotMatch(source, /ordenação transitória/i)
  assert.doesNotMatch(source, /não representa um escore final/i)
  assert.doesNotMatch(source, /diagnostic-priorities__progress/)
  assert.match(source, /Síntese para decisão/)
  assert.match(source, /Pactuação com outras redes/)
  assert.match(source, /Principal oportunidade de ação municipal/)
  assert.doesNotMatch(source, /ritmo não aplicável/i)
  assert.doesNotMatch(source, /sem pares/i)
  assert.doesNotMatch(source, /exposição indisponível/i)
  assert.match(source, /Consultar evidências e limitações/)
  assert.match(source, /Resultados a preservar e acompanhar/)
  assert.match(source, /Municípios com oferta de porte semelhante/)
  assert.doesNotMatch(source, /municípios semelhantes/i)
  assert.doesNotMatch(source, /perfil semelhante/i)
  assert.doesNotMatch(source, /pares socioeconômicos/i)
  assert.match(source, /Como o município se compara ao RS/)
  assert.match(source, /if \(!hasUsefulBenchmark\) return null/)
  assert.match(
    source,
    /Não há referência estadual metodologicamente comparável para os indicadores apresentados\./,
  )
  assert.match(source, /Caminhos de financiamento relacionados/)
  assert.doesNotMatch(source, /Situação municipal não verificada/)
  assert.doesNotMatch(source, /Ver todos/)
  assert.match(source, /Abrir panorama financeiro do município/)
  assert.match(source, /FINANCIAL_PAGE_KEYS\.panorama/)
  assert.match(source, /indicatorId: front\.indicators/)
  assert.match(source, /programId: front\.mechanisms/)
  assert.match(source, /municipioSlug \?\? municipio/)
})

test('P4-B pilot is lazy, absent from index and rendered only in the basico_integral detail', async () => {
  const [indexPayload, diagnosticPayload, cycleSource, detailSource, pilotSource] = await Promise.all([
    readFile(new URL('../../public/data/municipios/agudo/index.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../../public/data/municipios/agudo/diagnostico.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../../src/pages/CyclePage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/IndicatorDetail.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../../src/components/InequalityPilotSection.jsx', import.meta.url), 'utf8'),
  ])
  assert.equal('inequalityPilot' in indexPayload, false)
  assert.equal('inequalityPilot' in (indexPayload.pne_2026_2036 ?? {}), false)
  assert.equal(diagnosticPayload.inequalityPilot.indicatorId, 'basico_integral')
  assert.equal(diagnosticPayload.inequalityPilot.dimension, 'urban_rural')
  assert.match(cycleSource, /activeItem\?\.key === 'basico_integral'/)
  assert.match(cycleSource, /loadMunicipioDiagnostic/)
  assert.match(detailSource, /item\?\.key === 'basico_integral'/)
  assert.match(detailSource, /InequalityPilotSection/)
  assert.match(pilotSource, /Oferta em tempo integral por localização/)
  assert.match(pilotSource, /Resultado não exibido devido ao pequeno número de matrículas/)
  assert.doesNotMatch(pilotSource, /desigualdade comprovada|grupo prejudicado|causa da diferença|prioridade automática/i)
})
