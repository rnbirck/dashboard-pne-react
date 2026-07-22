const SUPPORTED_SCHEMA_VERSION = 'municipal-diagnostic-v2'
export const SUPPORTED_PUBLIC_VERSION = 'pne2026-public-diagnostic-v2'
const MAX_PUBLIC_PERCENT = 100

export function selectMunicipalDiagnosticContract(municipioData) {
  const contract = municipioData?.schemaVersion
    ? municipioData
    : municipioData?.pne_2026_2036?.diagnostico_v2

  if (!contract) return { contract: null, status: 'missing' }
  if (contract.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    return { contract: null, status: 'incompatible_version' }
  }
  if (contract.pne2026PublicDiagnosticV2?.version !== SUPPORTED_PUBLIC_VERSION) {
    return { contract: null, status: 'incompatible_version' }
  }
  return { contract, status: 'ready' }
}

export function buildPublicSummaryText(summary = {}) {
  const clauses = [
    summary.advanceCount > 0 ? `${summary.advanceCount} ${summary.advanceCount === 1 ? 'ponto' : 'pontos'} para avançar` : '',
    summary.maintainCount > 0 ? `${summary.maintainCount} ${summary.maintainCount === 1 ? 'resultado' : 'resultados'} a manter` : '',
    summary.unclassifiedCount > 0 ? `${summary.unclassifiedCount} ${summary.unclassifiedCount === 1 ? 'resultado' : 'resultados'} para acompanhamento` : '',
  ].filter(Boolean)

  if (!clauses.length) return 'O diagnóstico não possui resultados disponíveis neste momento.'
  return `O diagnóstico reúne ${joinClauses(clauses)}.`
}

export function buildPublicDiagnosticCopy(publicDiagnostic, municipio) {
  if (publicDiagnostic?.version !== SUPPORTED_PUBLIC_VERSION) return ''

  const allResults = flattenPublicResults(publicDiagnostic)
  const essentials = allResults
    .filter(({ result }) => result.tier === 'essential')
    .toSorted((left, right) => left.result.priorityOrder - right.result.priorityOrder)
  const essentialIds = new Set(essentials.map(({ result }) => result.indicatorId))
  const lines = [
    `Diagnóstico educacional de ${municipio}`,
    'Plano Nacional de Educação (PNE) 2026–2036',
    '',
    'Resumo do diagnóstico',
    ...buildSummaryCopyLines(publicDiagnostic.summary),
  ]

  if (essentials.length) {
    lines.push('', 'Resultados essenciais')
    for (const item of essentials) appendCopyResult(lines, item)
  }

  const remainingGoals = publicDiagnostic.goals
    .map((goal) => ({
      ...goal,
      results: goal.results.filter((result) => !essentialIds.has(result.indicatorId)),
    }))
    .filter((goal) => goal.results.length)

  if (remainingGoals.length) {
    lines.push('', 'Demais resultados')
    for (const goal of remainingGoals) {
      for (const result of goal.results) appendCopyResult(lines, { goal, result })
    }
  }

  const officialSources = getPublicOfficialSources(publicDiagnostic.sources)
  if (officialSources.length) {
    lines.push('', 'Fontes das informações')
    for (const source of officialSources) {
      lines.push(`${source.organization} — ${source.publicTitle} — ${source.period}.`)
    }
  }

  return lines
    .filter((line) => line !== null && line !== undefined && !String(line).includes('NaN'))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function formatPublicValue(value, unit) {
  if (!Number.isFinite(value)) return ''
  const displayedValue = unit === 'percent' ? Math.min(value, MAX_PUBLIC_PERCENT) : value
  const formatted = displayedValue.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  if (unit === 'percent') return `${formatted}%`
  if (unit === 'years') return `${formatted} anos`
  return formatted
}

export function getPublicCurrentValue(result) {
  const current = result?.current
  if (!current) return ''
  if (current.unit === 'percent') {
    return formatPublicValue(current.displayValue ?? current.value, current.unit)
  }
  return current.displayText
    || formatPublicValue(current.displayValue ?? current.value, current.unit)
}

export function getPublicResultReading(result) {
  if (!isNonEmptyText(result?.publicReading)) return ''
  if (hasCappedResultPercentage(result)) {
    if (hasPublicTargetBeenReached(result)) {
      return isPublicResultAboveState(result)
        ? 'O município alcançou o valor previsto e apresenta resultado acima da referência do Rio Grande do Sul.'
        : 'O município alcançou o valor previsto para este indicador.'
    }
    return 'O município ainda não alcançou o valor previsto para este indicador.'
  }
  return normalizePublicPercentages(result.publicReading)
}

export function formatPublicDistance(value, unit) {
  if (!Number.isFinite(value)) return ''
  const formatted = value.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
    signDisplay: 'always',
  })
  return unit === 'percent' ? `${formatted} p.p.` : formatted
}

export function getPublicResultStatus(result) {
  if (result.classification === 'advance') {
    return { key: 'advance', label: 'Ponto para avançar' }
  }
  if (result.classification === 'maintain') {
    return { key: 'maintain', label: 'Resultado a manter' }
  }
  if (result.relationshipType === 'contextual_proxy') {
    return { key: 'context', label: 'Resultado de contexto' }
  }
  return { key: 'followup', label: 'Resultado para acompanhamento' }
}

export function getPublicRelationshipNote(result) {
  if (result.relationshipType === 'contextual_proxy') {
    return 'Este resultado ajuda a contextualizar a meta, mas não mede sozinho o seu cumprimento.'
  }
  if (result.relationshipType === 'partial_component') {
    return 'Este é um dos resultados acompanhados nesta meta.'
  }
  return ''
}

export function getPublicSupportingReadings(result) {
  const readings = []
  if (
    result.statewidePosition
    && typeof result.statewidePosition === 'object'
    && isNonEmptyText(result.statewidePosition.reading)
  ) {
    readings.push({
      kind: 'position',
      title: 'Posição entre os municípios do RS',
      lines: [normalizePublicPercentages(result.statewidePosition.reading)],
    })
  }
  if (isNonEmptyText(result.similarMunicipalities?.reading)) {
    readings.push({
      kind: 'similar',
      title: isNonEmptyText(result.similarMunicipalities.title)
        ? result.similarMunicipalities.title
        : 'Municípios com oferta educacional de tamanho semelhante',
      lines: [normalizePublicPercentages(result.similarMunicipalities.reading)],
    })
  }
  const trajectoryLines = [
    result.trajectory?.historicalReading,
    result.trajectory?.achievementReading,
  ].filter(isNonEmptyText)
  if (trajectoryLines.length) {
    readings.push({
      kind: 'trajectory',
      title: 'Evolução recente',
      lines: trajectoryLines.map(normalizePublicPercentages),
    })
  }
  return readings
}

export function getPublicStateComparison(result) {
  const comparison = result?.stateComparison
  if (
    !comparison
    || !Number.isFinite(comparison.municipalityValue)
    || !Number.isFinite(comparison.stateValue)
    || !Number.isFinite(comparison.year)
    || !isNonEmptyText(comparison.reading)
  ) return null

  const unit = comparison.unit || result.current?.unit
  const municipalityValue = getPublicDisplayedNumber(comparison.municipalityValue, unit)
  const stateValue = getPublicDisplayedNumber(comparison.stateValue, unit)
  const hasCappedPercentage = unit === 'percent' && (
    comparison.municipalityValue > MAX_PUBLIC_PERCENT
    || comparison.stateValue > MAX_PUBLIC_PERCENT
  )
  const difference = unit === 'percent'
    ? municipalityValue - stateValue
    : comparison.difference

  return {
    municipalityValue: formatPublicValue(municipalityValue, unit),
    stateValue: formatPublicValue(stateValue, unit),
    difference: formatPublicDistance(difference, unit),
    year: comparison.year,
    reading: hasCappedPercentage
      ? buildCappedStateComparisonReading(municipalityValue, stateValue)
      : normalizePublicPercentages(comparison.reading),
    valueReading: hasCappedPercentage
      ? `Município ${formatPublicValue(municipalityValue, unit)}; Rio Grande do Sul ${formatPublicValue(stateValue, unit)}; ${comparison.year}.`
      : normalizePublicPercentages(comparison.valueReading),
  }
}

export function getPublicOfficialSources(sources = []) {
  return sources.filter((source) => (
    isNonEmptyText(source.organization)
    && isNonEmptyText(source.publicTitle)
    && isNonEmptyText(source.period)
    && isNonEmptyText(source.officialUrl)
  ))
}

function flattenPublicResults(publicDiagnostic) {
  return (publicDiagnostic?.goals ?? []).flatMap((goal) => (
    goal.results.map((result) => ({ goal, result }))
  ))
}

function buildSummaryCopyLines(summary = {}) {
  return [
    summary.advanceCount > 0 ? `Pontos para avançar: ${summary.advanceCount}.` : '',
    summary.maintainCount > 0 ? `Resultados a manter: ${summary.maintainCount}.` : '',
    summary.unclassifiedCount > 0
      ? `Resultados para acompanhamento: ${summary.unclassifiedCount}.`
      : '',
    Number.isFinite(summary.stateAboveOrNearCount)
      ? `Acima ou próximos do RS: ${summary.stateAboveOrNearCount}.`
      : '',
    Number.isFinite(summary.stateBelowCount)
      ? `Abaixo do RS: ${summary.stateBelowCount}.`
      : '',
  ].filter(Boolean)
}

function appendCopyResult(lines, { goal, result }) {
  lines.push(
    '',
    `Meta ${goal.goalId} — ${goal.title}`,
    result.publicName,
    getPublicResultStatus(result).label,
    `Resultado do município: ${displayCurrentValue(result)} (${result.current.year}).`,
  )
  if (Number.isFinite(result.indicatorReference?.value)) {
    lines.push(
      `Valor previsto: ${formatPublicValue(result.indicatorReference.value, result.current.unit)} até ${result.indicatorReference.year}.`,
    )
  }
  const publicReading = getPublicResultReading(result)
  if (publicReading) lines.push(publicReading)
  const relationshipNote = getPublicRelationshipNote(result)
  if (relationshipNote) lines.push(relationshipNote)
  const stateComparison = getPublicStateComparison(result)
  if (stateComparison) {
    lines.push(
      'Comparação com o RS',
      isNonEmptyText(stateComparison.valueReading)
        ? stateComparison.valueReading
        : `Município ${stateComparison.municipalityValue}; Rio Grande do Sul ${stateComparison.stateValue}; ${stateComparison.year}.`,
      stateComparison.reading,
    )
  }
  for (const reading of getPublicSupportingReadings(result)) {
    lines.push(reading.title, ...reading.lines)
  }
}

function displayCurrentValue(result) {
  return getPublicCurrentValue(result)
}

function getPublicDisplayedNumber(value, unit) {
  return unit === 'percent' ? Math.min(value, MAX_PUBLIC_PERCENT) : value
}

function hasCappedResultPercentage(result) {
  if (result?.current?.unit !== 'percent') return false
  return [
    result.current.value,
    result.current.displayValue,
    result.indicatorReference?.value,
  ].some((value) => Number.isFinite(value) && value > MAX_PUBLIC_PERCENT)
}

function buildCappedStateComparisonReading(municipalityValue, stateValue) {
  if (municipalityValue > stateValue) {
    return 'O resultado apresentado está acima do observado no Rio Grande do Sul.'
  }
  if (municipalityValue < stateValue) {
    return 'O resultado apresentado está abaixo do observado no Rio Grande do Sul.'
  }
  return 'O resultado apresentado é igual ao observado no Rio Grande do Sul.'
}

function hasPublicTargetBeenReached(result) {
  const currentValue = getPublicDisplayedNumber(
    result.current?.displayValue ?? result.current?.value,
    result.current?.unit,
  )
  const referenceValue = getPublicDisplayedNumber(
    result.indicatorReference?.value,
    result.current?.unit,
  )
  if (!Number.isFinite(currentValue) || !Number.isFinite(referenceValue)) return false
  const direction = result.indicatorReference?.direction ?? result.direction
  return direction === 'at_most'
    ? currentValue <= referenceValue
    : currentValue >= referenceValue
}

function isPublicResultAboveState(result) {
  const comparison = result?.stateComparison
  const unit = comparison?.unit || result.current?.unit
  if (!comparison || unit !== 'percent') return false
  const municipalityValue = getPublicDisplayedNumber(comparison.municipalityValue, unit)
  const stateValue = getPublicDisplayedNumber(comparison.stateValue, unit)
  return municipalityValue > stateValue
}

function normalizePublicPercentages(text) {
  if (!isNonEmptyText(text)) return text
  return text.replace(/([+-]?\d[\d.,]*)(\s*%)/g, (match, rawValue, suffix) => {
    const value = Number(rawValue.includes(',')
      ? rawValue.replace(/\./g, '').replace(',', '.')
      : rawValue)
    return Number.isFinite(value) && value > MAX_PUBLIC_PERCENT ? `100${suffix}` : match
  })
}

function isNonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function joinClauses(clauses) {
  if (clauses.length < 2) return clauses[0] ?? ''
  return `${clauses.slice(0, -1).join(', ')} e ${clauses.at(-1)}`
}
