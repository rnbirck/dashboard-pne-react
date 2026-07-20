import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const readText = (relativePath) => readFile(join(repoRoot, relativePath), 'utf8')
const readJson = (relativePath) => readText(relativePath).then(JSON.parse)

async function loadTypeScriptModule(relativePath) {
  const source = await readText(relativePath)
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)
}

const [
  presentationModule,
  catalog,
  programs,
  indicators,
  agudo,
  novaSantaRita,
  andreDaRocha,
  portoAlegre,
  santaCruzDoSul,
  vaatBeneficiary,
] = await Promise.all([
  loadTypeScriptModule('src/features/municipal-finance/municipalFinancePresentation.ts'),
  readJson('public/data/financeiro/catalogos.json'),
  readJson('src/data/diagnostic/financingPrograms.json'),
  readJson('src/data/diagnostic/indicatorCatalog.json'),
  readJson('public/data/municipios/agudo/financeiro.json'),
  readJson('public/data/municipios/nova-santa-rita/financeiro.json'),
  readJson('public/data/municipios/andre-da-rocha/financeiro.json'),
  readJson('public/data/municipios/porto-alegre/financeiro.json'),
  readJson('public/data/municipios/santa-cruz-do-sul/financeiro.json'),
  readJson('public/data/municipios/ararica/financeiro.json'),
])

const context = { indicatorIds: ['creche', 'alfabetizacao'], programIds: ['salario_educacao_qsem', 'fundeb_vaar'] }
const present = (document, requestedContext = context) => presentationModule.buildMunicipalFinancePresentation(
  document,
  catalog,
  programs,
  indicators,
  requestedContext,
)

test('1. contrato financeiro permanece fora do index e a página é lazy', async () => {
  const [indexPayload, routerSource, loaderSource] = await Promise.all([
    readJson('public/data/municipios/agudo/index.json'),
    readText('src/app/AppPageRouter.tsx'),
    readText('src/data/municipalFinance.ts'),
  ])
  assert.equal(Object.hasOwn(indexPayload, 'financeiro'), false)
  assert.match(routerSource, /const LazyMunicipalFinancePanoramaPage = lazy/)
  assert.match(routerSource, /activePage === FINANCIAL_PAGE_KEYS\.panorama/)
  assert.match(loaderSource, /\/financeiro\.json/)
  assert.doesNotMatch(routerSource, /import \{ MunicipalFinancePanoramaPage \}/)
})

test('2. rota preserva slug, indicatorId e programId a partir do Diagnóstico', async () => {
  const diagnosticSource = await readText('src/components/DiagnosticPanel.jsx')
  assert.match(diagnosticSource, /FINANCIAL_PAGE_KEYS\.panorama/)
  assert.match(diagnosticSource, /municipio: municipioSlug \?\? municipio/)
  assert.match(diagnosticSource, /indicatorId: front\.indicators/)
  assert.match(diagnosticSource, /programId: front\.mechanisms/)
})

test('3. QSE distribuída usa diretamente a transferência coberta de 2024', () => {
  const view = present(agudo)
  const card = view.summaryCards.find((item) => item.key === 'qse')
  assert.equal(card.amount, agudo.amounts.qseDistributedClosedYear)
  assert.equal(card.amount.financialStage, 'transferred')
  assert.equal(card.amount.amountNature, 'confirmed')
  assert.match(card.supportingText, /valor distribuído pelo FNDE/)
})

test('4. QSE não é apresentada como saldo', () => {
  const view = present(agudo)
  const qseText = JSON.stringify({
    card: view.summaryCards.find((item) => item.key === 'qse'),
    metrics: view.qseMetrics,
    groups: view.qseGroups,
  })
  assert.doesNotMatch(qseText, /saldo/i)
})

test('5. Fundeb total é previsão oficial anual e não recebimento', () => {
  const card = present(agudo).summaryCards.find((item) => item.key === 'fundeb')
  assert.equal(card.amount, agudo.amounts.fundebTotalAnnualForecast)
  assert.equal(card.amount.financialStage, 'forecast')
  assert.equal(card.amount.amountNature, 'official_estimate')
  assert.match(card.supportingText, /não representa recebimento/)
})

test('6. VAAR beneficiário mostra status e previsão separados', () => {
  const view = present(novaSantaRita)
  const card = view.summaryCards.find((item) => item.key === 'vaar')
  assert.equal(card.statusLabel, 'Beneficiário')
  assert.equal(card.amount, novaSantaRita.amounts.fundebVaarAnnualForecast)
  assert.equal(card.amount.financialStage, 'forecast')
  assert.match(card.supportingText, /não comprova transferência/)
})

test('7. VAAR não beneficiário não recebe valor potencial', () => {
  const card = present(agudo).summaryCards.find((item) => item.key === 'vaar')
  assert.equal(card.statusLabel, 'Não beneficiário')
  assert.equal(card.amount, null)
  assert.equal(agudo.amounts.fundebVaarAnnualForecast.value, null)
})

test('8. VAAF, VAAT e VAAR permanecem bloqueados para nova soma', () => {
  const components = present(novaSantaRita).fundebComponents.filter((item) => item.key !== 'total')
  assert.equal(components.length, 3)
  components.forEach((component) => {
    assert.equal(component.amount.summationAllowed, false)
    assert.equal(component.summationNote, 'Já incluído no total ou composição não reconciliada.')
  })
  for (const key of ['fundebVaafAnnualForecast', 'fundebVaatAnnualForecast', 'fundebVaarAnnualForecast']) {
    assert.equal(novaSantaRita.amounts[key].summationAllowed, false)
  }
})

test('9. beneficiário VAAT é distinguido da habilitação para cálculo', () => {
  const vaat = present(vaatBeneficiary).fundebComponents.find((item) => item.key === 'vaat')
  assert.equal(vaat.statusLabel, 'Beneficiário')
  assert.match(vaat.calculationStatusLabel, /Habilitado para o cálculo da condição de beneficiário/)
  assert.match(vaat.calculationStatusLabel, /não confirma benefício/)
})

test('10. DCA é execução municipal declarada, não fonte de recurso', () => {
  const view = present(agudo)
  assert.deepEqual(view.executionStages.map((item) => item.label), ['Empenhado', 'Liquidado', 'Pago'])
  view.executionStages.forEach((item) => {
    assert.equal(item.value.amountNature, 'municipal_declared')
    assert.equal(item.value.sourceId, 'siconfi_dca_function_2024')
    assert.notEqual(item.value.financialStage, 'received')
    assert.notEqual(item.value.financialStage, 'transferred')
  })
})

test('11. taxas apresentadas são as mesmas instâncias recebidas no contrato', () => {
  const view = present(agudo)
  const byKey = new Map(view.executionRates.map((item) => [item.key, item.value]))
  assert.equal(byKey.get('liquidatedToCommitted'), agudo.execution.dcaEducation.derivedRates.liquidatedToCommittedRate)
  assert.equal(byKey.get('paidToCommitted'), agudo.execution.dcaEducation.derivedRates.paidToCommittedRate)
  assert.equal(byKey.get('paidToLiquidated'), agudo.execution.dcaEducation.derivedRates.paidToLiquidatedRate)
  assert.equal(byKey.get('outstandingToCommitted'), agudo.execution.dcaEducation.derivedRates.outstandingToCommittedRate)
})

test('12. React não recalcula taxas nem soma componentes financeiros', async () => {
  const [pageSource, presentationSource] = await Promise.all([
    readText('src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx'),
    readText('src/features/municipal-finance/municipalFinancePresentation.ts'),
  ])
  assert.doesNotMatch(pageSource, /liquidated\.value\s*\//)
  assert.doesNotMatch(pageSource, /paid\.value\s*\//)
  assert.doesNotMatch(pageSource, /outstanding\w*\.value\s*\+/)
  assert.doesNotMatch(presentationSource, /fundebVaafAnnualForecast\.value\s*\+/)
  assert.doesNotMatch(presentationSource, /fundebVaatAnnualForecast\.value\s*\+/)
  assert.doesNotMatch(presentationSource, /fundebVaarAnnualForecast\.value\s*\+/)
})

test('13. ausência de restos é preservada e oculta somente a taxa dependente', () => {
  const view = present(andreDaRocha)
  const missing = view.executionOutstanding.find((item) => item.label === 'Restos a pagar não processados')
  assert.equal(missing.value.value, null)
  assert.equal(missing.value.nullReasonCode, 'not_published')
  assert.equal(view.executionRates.some((item) => item.key === 'outstandingToCommitted'), false)
})

test('14. aplicação constitucional permanece como mapeamento pendente, nunca zero', async () => {
  const view = present(agudo)
  view.constitutionalApplication.forEach((item) => assert.equal(item.statusLabel, 'Mapeamento pendente'))
  assert.doesNotMatch(JSON.stringify(view.constitutionalApplication), /19159995|17699379/)
  const presentationSource = await readText('src/features/municipal-finance/municipalFinancePresentation.ts')
  assert.match(presentationSource, /P5-C2_VISIBILITY_GATE/)
})

test('15. cobertura insuficiente é apresentada como cobertura de evidência neutra', () => {
  const view = present(andreDaRocha)
  assert.equal(view.qualityLabel, 'Cobertura de evidência insuficiente')
  assert.equal(view.coverage.length, 7)
  assert.deepEqual(
    view.coverage.map((item) => item.statusLabel),
    ['Completa', 'Completa', 'Completa', 'Parcial', 'Mapeamento pendente', 'Completa', 'Fonte pendente'],
  )
})

test('16. SIOPE e SICONFI aparecem como reconciliação e contexto contábil, não recurso', () => {
  const view = present(agudo)
  assert.equal(view.reconciliationPending, true)
  assert.equal(view.sources.find((item) => item.key === 'siconfi').label, 'Tesouro Nacional — SICONFI/DCA')
  assert.doesNotMatch(JSON.stringify(view.sources), /fonte de recurso|recurso recebido/i)
})

test('17. relações usam somente educationLinks e catálogos globais', () => {
  const view = present(novaSantaRita)
  assert.equal(view.relations.length, novaSantaRita.educationLinks.length)
  assert.ok(view.relations.some((item) => /fonte geral de MDE/i.test(item.relationLabel)))
  assert.ok(view.relations.some((item) => /beneficiário nominal do VAAR/.test(item.reading)))
  assert.ok(view.relations.every((item) => item.indicatorLabel && item.programLabel))
})

test('18. contexto recebido restringe relações sem criar fallback educacional', () => {
  const view = present(agudo, { indicatorIds: ['creche'], programIds: [] })
  assert.equal(view.relations.length, 1)
  assert.match(view.relations[0].reading, /não confirma destinação específica/)
  const absent = present(agudo, { indicatorIds: ['indicador_sem_vinculo'], programIds: [] })
  assert.deepEqual(absent.relations, [])
})

test('19. contrato educacional, decisionSummary e priorityScore permanecem isolados', async () => {
  const diagnosticPayload = await readJson('public/data/municipios/agudo/diagnostico.json')
  assert.ok(diagnosticPayload.decisionSummary)
  assert.equal(agudo.educationalScoreIsolation.changesDecisionSummary, false)
  assert.equal(agudo.educationalScoreIsolation.changesAttentionOrder, false)
  assert.equal(agudo.educationalScoreIsolation.priorityScore, null)
})

test('20. textos dos cinco estados do loader são explícitos', async () => {
  const pageSource = await readText('src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx')
  assert.match(pageSource, /Carregando panorama financeiro/)
  assert.match(pageSource, /Panorama financeiro ainda não disponível para este município\./)
  assert.match(pageSource, /Os dados financeiros precisam ser atualizados antes da apresentação\./)
  assert.match(pageSource, /Não foi possível carregar os dados financeiros\./)
  assert.match(pageSource, /status: 'ready'/)
})

test('21. formatação monetária compacta mantém o valor completo disponível', () => {
  assert.equal(presentationModule.formatCompactCurrency(agudo.amounts.qseDistributedClosedYear.value), 'R$ 1,05 mi')
  assert.equal(presentationModule.formatCompactCurrency(novaSantaRita.amounts.fundebTotalAnnualForecast.value), 'R$ 52,32 mi')
  assert.equal(presentationModule.formatCompactCurrency(portoAlegre.execution.dcaEducation.committed.value), 'R$ 1,12 bi')
  assert.match(presentationModule.formatFullCurrency(agudo.amounts.qseDistributedClosedYear.value), /1\.045\.009,11/)
})

test('22. fixtures públicas cobrem capitais, município médio, beneficiário e ausência', () => {
  assert.equal(portoAlegre.municipality.name, 'Porto Alegre')
  assert.equal(santaCruzDoSul.municipality.name, 'Santa Cruz do Sul')
  assert.equal(vaatBeneficiary.programStatuses.fundebVaat.status, 'confirmed_beneficiary')
  assert.equal(agudo.programStatuses.fundebVaar.status, 'confirmed_non_beneficiary')
  assert.equal(andreDaRocha.execution.dcaEducation.outstandingNonProcessed.value, null)
})

test('23. página responsiva usa grades 4→2→1, pilhas independentes e não contém tabela', async () => {
  const [pageSource, styleSource] = await Promise.all([
    readText('src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx'),
    readText('src/styles/financial-pages.css'),
  ])
  assert.doesNotMatch(pageSource, /<table|overflowX|overflowY/)
  assert.match(styleSource, /\.municipal-finance-summary-grid[\s\S]*repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(styleSource, /max-width: 1180px[\s\S]*\.municipal-finance-summary-grid[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/)
  assert.match(styleSource, /max-width: 620px[\s\S]*\.municipal-finance-summary-grid[\s\S]*grid-template-columns: 1fr/)
  assert.match(pageSource, /municipal-finance-primary-column--left[\s\S]*municipal-finance-execution[\s\S]*municipal-finance-qse/)
  assert.match(pageSource, /municipal-finance-primary-column--right[\s\S]*municipal-finance-fundeb/)
  assert.match(styleSource, /max-width: 1024px[\s\S]*\.municipal-finance-execution[\s\S]*order: 1[\s\S]*\.municipal-finance-fundeb[\s\S]*order: 2[\s\S]*\.municipal-finance-qse[\s\S]*order: 3/)
})

test('24. Fundeb usa quatro linhas compactas e mantém metadados completos no disclosure', async () => {
  const [pageSource, view] = await Promise.all([
    readText('src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx'),
    Promise.resolve(present(novaSantaRita)),
  ])
  assert.equal(view.fundebComponents.length, 4)
  assert.ok(view.fundebComponents.every((component) => component.observation))
  assert.match(pageSource, /<ol className="municipal-finance-fundeb-list">/)
  assert.match(pageSource, /<summary>Ver metadados do Fundeb<\/summary>/)
  assert.doesNotMatch(pageSource, /className="municipal-finance-fundeb-card"/)
})

test('25. QSE é organizada em três grupos sem combinar distribuição e estimativa', () => {
  const view = present(agudo)
  assert.deepEqual(view.qseGroups.map((group) => group.title), [
    'Distribuição de 2024',
    'Estimativa de 2026',
    'Base do cálculo',
  ])
  assert.equal(view.qseGroups[0].metrics[0].value, agudo.amounts.qseDistributedClosedYear)
  assert.equal(view.qseGroups[1].metrics[0].value, agudo.amounts.qseOfficialEstimateCurrentYear)
  assert.match(view.qseGroups[2].comparison, /Os exercícios permanecem separados/)
})

test('26. cobertura resume sete dimensões e destaca execução, aplicação e reconciliação', () => {
  const view = present(agudo)
  assert.equal(view.coverage.length, 7)
  assert.deepEqual(view.coverageHighlights.map((dimension) => dimension.key), [
    'budgetExecution',
    'constitutionalApplication',
    'reconciliation',
  ])
  assert.equal(
    view.coverageSummary.complete + view.coverageSummary.pending + view.coverageSummary.unavailable,
    7,
  )
})

test('27. disclosures de cobertura e fontes permanecem fechados por padrão', async () => {
  const pageSource = await readText('src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx')
  assert.match(pageSource, /<summary>Ver cobertura detalhada<\/summary>/)
  assert.match(pageSource, /<summary>Consultar fontes e metodologia<\/summary>/)
  assert.doesNotMatch(pageSource, /<details[^>]*\sopen(?:=|\s|>)/)
})

test('28. refinamento não escreve contratos nem regenera public data', async () => {
  const sources = await Promise.all([
    readText('src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx'),
    readText('src/features/municipal-finance/municipalFinancePresentation.ts'),
  ])
  const combined = sources.join('\n')
  assert.doesNotMatch(combined, /writeFile|appendFile|public\/data/)
  assert.equal(agudo.educationalScoreIsolation.priorityScore, null)
})
