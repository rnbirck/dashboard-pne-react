const SUPPORTED_SCHEMA_VERSION = 'municipal-diagnostic-v2'
const SUPPORTED_PUBLIC_VERSION = 'pne2026-public-diagnostic-v1'

export function selectMunicipalDiagnosticContract(municipioData) {
  const contract = municipioData?.schemaVersion
    ? municipioData
    : municipioData?.pne_2026_2036?.diagnostico_v2

  if (!contract) return { contract: null, status: 'missing' }
  if (contract.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return { contract: null, status: 'incompatible_version' }
  }
  if (contract.pne2026PublicDiagnostic?.version !== SUPPORTED_PUBLIC_VERSION) {
    return { contract: null, status: 'incompatible_version' }
  }
  return { contract, status: 'ready' }
}

export function buildPublicSummaryText(summary = {}) {
  const sentences = [`O diagnóstico apresenta ${summary.displayedResultsCount ?? 0} resultados.`]
  const situationClauses = []

  if (summary.advanceResultsCount > 0) {
    situationClauses.push(
      summary.advanceResultsCount === 1
        ? '1 ainda pode avançar'
        : `${summary.advanceResultsCount} ainda podem avançar`,
    )
  }
  if (summary.reachedResultsCount > 0) {
    situationClauses.push(
      summary.reachedResultsCount === 1
        ? '1 já alcançou o valor previsto'
        : `${summary.reachedResultsCount} já alcançaram o valor previsto`,
    )
  }
  if (situationClauses.length) {
    sentences.push(`Destes, ${joinClauses(situationClauses)}.`)
  }
  if (summary.stateAboveOrNearCount > 0) {
    sentences.push(
      summary.stateAboveOrNearCount === 1
        ? 'Em 1 resultado, o município está acima ou próximo do Rio Grande do Sul.'
        : `Em ${summary.stateAboveOrNearCount} resultados, o município está acima ou próximo do Rio Grande do Sul.`,
    )
  }
  if (summary.stateBelowCount > 0) {
    sentences.push(
      `Em ${summary.stateBelowCount}, há espaço para avançar em relação ao estado.`,
    )
  }

  return sentences.join(' ')
}

export function buildPublicDiagnosticCopy(publicDiagnostic, municipio) {
  if (publicDiagnostic?.version !== SUPPORTED_PUBLIC_VERSION) return ''

  const lines = [
    `Diagnóstico educacional de ${municipio}`,
    'Plano Nacional de Educação (PNE) 2026–2036',
    '',
    buildPublicSummaryText(publicDiagnostic.summary),
  ]

  for (const classification of ['advance', 'maintain']) {
    const title = classification === 'advance' ? 'Pontos para avançar' : 'Resultados a manter'
    const matchingGoals = publicDiagnostic.goals
      .map((goal) => ({
        ...goal,
        results: goal.results.filter((result) => result.classification === classification),
      }))
      .filter((goal) => goal.results.length)

    if (!matchingGoals.length) continue
    lines.push('', title)
    for (const goal of matchingGoals) {
      for (const result of goal.results) {
        lines.push(
          `Meta ${goal.goalId} — ${goal.publicTitle}`,
          result.publicName,
          `Resultado do município: ${formatPublicValue(result.current.displayValue, result.current.unit)} (${result.current.year}).`,
          `Valor previsto: ${formatPublicValue(result.target.displayValue, result.current.unit)} até ${result.target.year}.`,
          result.publicReading,
        )
        appendOptionalReading(lines, result.stateComparison?.reading)
        appendOptionalReading(lines, result.statewidePosition?.reading)
        appendOptionalReading(lines, result.similarMunicipalities?.reading)
        appendOptionalReading(lines, result.trajectory?.historicalReading)
        appendOptionalReading(lines, result.trajectory?.achievementReading)
        lines.push('')
      }
    }
  }

  if (publicDiagnostic.sources.length) {
    lines.push('Fontes das informações')
    for (const source of publicDiagnostic.sources) {
      lines.push(`${source.organization} — ${source.publicTitle} — ${source.period}.`)
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function formatPublicValue(value, unit) {
  if (!Number.isFinite(value)) return ''
  const formatted = value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  if (unit === 'percent') return `${formatted}%`
  if (unit === 'years') return `${formatted} anos`
  return formatted
}

function appendOptionalReading(lines, reading) {
  if (reading) lines.push(reading)
}

function joinClauses(clauses) {
  if (clauses.length < 2) return clauses[0] ?? ''
  return `${clauses.slice(0, -1).join(', ')} e ${clauses.at(-1)}`
}
