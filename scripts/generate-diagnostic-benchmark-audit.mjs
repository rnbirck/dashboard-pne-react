import fs from 'node:fs'
import path from 'node:path'

const MUNICIPALITIES = [
  ['Agudo', 'agudo'],
  ['Nova Santa Rita', 'nova-santa-rita'],
  ['Aceguá', 'acegua'],
  ['Porto Alegre', 'porto-alegre'],
  ['André da Rocha', 'andre-da-rocha'],
]

const OUTPUT_DIRECTORY = path.resolve(
  'artifacts/diagnostico-stabilization-2026-07-19',
)

function csvCell(value) {
  const text = value == null ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function summaryPresence(indicator, summary) {
  if (!Number.isFinite(indicator.rawValue)) return 'ausente: sem valor municipal'
  const benchmark = indicator.benchmarks?.state ?? {}
  if (benchmark.status !== 'comparable') return `presente: ${benchmark.status}`
  const unfavorable = summary.largestUnfavorableIndicatorIds ?? []
  const favorable = summary.largestFavorableIndicatorIds ?? []
  if (unfavorable.includes(indicator.indicatorId)) return 'presente: destaque desfavorável'
  if (favorable.includes(indicator.indicatorId)) return 'presente: destaque favorável'
  return `presente: ${benchmark.position ?? 'comparável'}`
}

const rows = []
const municipalitySummaries = []

for (const [municipalityName, slug] of MUNICIPALITIES) {
  const payloadPath = path.resolve(`public/data/municipios/${slug}/diagnostico.json`)
  const contract = JSON.parse(fs.readFileSync(payloadPath, 'utf8'))
  if (!contract) throw new Error(`diagnostico_v2 ausente em ${municipalityName}`)
  const summary = contract.stateBenchmarkSummary ?? {}

  municipalitySummaries.push({
    municipalityName,
    analyzed: summary.analyzedCount ?? 0,
    comparable: summary.eligibleAnalyzedCount ?? 0,
    favorable: summary.betterCount ?? 0,
    unfavorable: summary.worseCount ?? 0,
    equivalent: summary.equivalentCount ?? 0,
    unavailable: summary.unavailableCount ?? 0,
  })

  for (const indicator of contract.indicators ?? []) {
    const benchmark = indicator.benchmarks?.state ?? {}
    rows.push([
      municipalityName,
      indicator.indicatorId,
      indicator.title,
      indicator.rawValue,
      indicator.currentYear,
      benchmark.municipalityValue,
      benchmark.municipalityYear,
      benchmark.value,
      benchmark.year,
      benchmark.status ?? 'unavailable',
      benchmark.reason?.code,
      benchmark.reason?.message,
      summaryPresence(indicator, summary),
    ])
  }
}

fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true })
const header = [
  'municipio',
  'indicatorId',
  'indicador',
  'valorMunicipalPrincipal',
  'anoMunicipalPrincipal',
  'valorMunicipalComparado',
  'anoMunicipalComparado',
  'valorRS',
  'anoRS',
  'statusComparabilidade',
  'codigoExclusao',
  'motivoExclusao',
  'presencaNoResumo',
]
const csv = [header, ...rows]
  .map((row) => row.map(csvCell).join(','))
  .join('\n')
fs.writeFileSync(path.join(OUTPUT_DIRECTORY, 'benchmark-audit.csv'), `${csv}\n`)

const markdown = [
  '# Auditoria do benchmark estadual',
  '',
  '| Município | Analisados | Comparáveis | Favoráveis | Desfavoráveis | Próximos | Sem comparação |',
  '|---|---:|---:|---:|---:|---:|---:|',
  ...municipalitySummaries.map((item) => (
    `| ${item.municipalityName} | ${item.analyzed} | ${item.comparable} | ${item.favorable} | ${item.unfavorable} | ${item.equivalent} | ${item.unavailable} |`
  )),
  '',
  'A tabela completa por indicador, incluindo valor/ano principal, valor/ano efetivamente comparado, referência RS, status, exclusão e presença no resumo, está em `benchmark-audit.csv`.',
  '',
]
fs.writeFileSync(
  path.join(OUTPUT_DIRECTORY, 'benchmark-audit-summary.md'),
  markdown.join('\n'),
)

console.log(`Auditoria gerada: ${rows.length} linhas para ${MUNICIPALITIES.length} municípios.`)
