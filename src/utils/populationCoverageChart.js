function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

export function buildPopulationCoverageSeries({ cycle, details, endYear, startYear }) {
  const numeratorLabel = normalizeText(details?.calculation?.numerator_label)
  const denominatorLabel = normalizeText(details?.calculation?.denominator_label)

  if (!numeratorLabel.includes('matricul') || !denominatorLabel.includes('populacao')) {
    return []
  }

  const componentSeries =
    details?.series_components_by_cycle?.[cycle] ?? details?.series_components

  if (!Array.isArray(componentSeries)) return []

  const minimumYear = finiteYear(startYear)
  const maximumYear = finiteYear(endYear)
  const rowsInPeriod = componentSeries
    .filter((row) => {
      const year = finiteYear(row?.ano)
      if (year === null) return false
      if (minimumYear !== null && year < minimumYear) return false
      if (maximumYear !== null && year > maximumYear) return false
      return true
    })
    .sort((a, b) => Number(a.ano) - Number(b.ano))

  if (rowsInPeriod.length < 2) return []

  const normalizedRows = rowsInPeriod.map((row) => {
    const year = finiteYear(row?.ano)
    const enrolled = finiteNumber(row?.numerador)
    const population = finiteNumber(row?.denominador)
    const percent = finiteNumber(row?.percentual)

    if (
      year === null ||
      enrolled === null ||
      population === null ||
      percent === null ||
      population <= 0 ||
      enrolled < 0 ||
      enrolled > population ||
      percent < 0 ||
      percent > 100
    ) {
      return null
    }

    return {
      enrolled,
      percent,
      population,
      unattended: population - enrolled,
      year,
    }
  })

  return normalizedRows.every(Boolean) ? normalizedRows : []
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function finiteYear(value) {
  const numericValue = finiteNumber(value)
  return numericValue !== null && numericValue > 0 ? numericValue : null
}

