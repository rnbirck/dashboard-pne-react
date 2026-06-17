import { formatIndicatorValue, resolveIndicatorUnit } from './format'

const POPULATION_VALUE_LIMIT = 100

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function toNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function isPopulationPercentIndicator(item, result) {
  if (resolveIndicatorUnit(item, result) !== 'percent') return false

  const text = normalizeText([
    item?.label,
    item?.sub,
    item?.desc,
    result?.label,
    result?.sub,
    result?.desc,
  ].filter(Boolean).join(' '))

  return text.includes('populacao')
}

export function capPopulationPercentValue(value, item, result) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  if (!isPopulationPercentIndicator(item, result)) return numeric
  return Math.min(numeric, POPULATION_VALUE_LIMIT)
}

export function normalizePopulationPercentResult(result, item) {
  if (!result || !isPopulationPercentIndicator(item, result)) return result

  const startValue = capPopulationPercentValue(result.start_value, item, result)
  const endValue = capPopulationPercentValue(result.end_value, item, result)
  const metaValue = capPopulationPercentValue(result.meta, item, result)
  const series = (result.series ?? []).map((point) => ({
    ...point,
    valor: capPopulationPercentValue(point?.valor, item, result),
  }))

  const startNumber = toNumber(startValue)
  const endNumber = toNumber(endValue)
  const metaNumber = toNumber(metaValue)
  const variation = Number.isFinite(startNumber) && Number.isFinite(endNumber)
    ? endNumber - startNumber
    : toNumber(result.progress_delta ?? result.raw_delta)
  const distance = Number.isFinite(endNumber) && Number.isFinite(metaNumber)
    ? endNumber - metaNumber
    : toNumber(result.distance)

  const atingida = Number.isFinite(endNumber) && Number.isFinite(metaNumber)
    ? endNumber >= metaNumber
    : result.atingida

  return {
    ...result,
    start_value: startValue,
    end_value: endValue,
    meta: metaValue,
    raw_delta: Number.isFinite(variation) ? variation : result.raw_delta,
    progress_delta: Number.isFinite(variation) ? variation : result.progress_delta,
    distance: Number.isFinite(distance) ? distance : result.distance,
    atingida,
    series,
    display: {
      ...result.display,
      start_value: formatIndicatorValue(startValue, 'percent'),
      end_value: formatIndicatorValue(endValue, 'percent'),
      variation: Number.isFinite(variation) ? formatVariation(variation) : result.display?.variation,
      distance: Number.isFinite(distance) ? formatDistance(distance) : result.display?.distance,
      status: atingida === true ? 'Meta atingida' : result.display?.status,
      interpretation: buildPopulationPercentInterpretation({
        distance,
        endYear: result.end_year,
        endValue,
        metaValue,
      }) ?? result.display?.interpretation,
    },
  }
}

export function normalizePopulationPercentResults(results = {}, items = []) {
  if (!results || typeof results !== 'object') return results
  const itemByKey = new Map(items.map((item) => [item.key, item]))
  return Object.fromEntries(
    Object.entries(results).map(([key, result]) => [
      key,
      normalizePopulationPercentResult(result, itemByKey.get(key)),
    ]),
  )
}

function formatVariation(value) {
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: abs % 1 === 0 ? 0 : 1,
  })
  if (value > 0) return `Alta de ${formatted} p.p.`
  if (value < 0) return `Queda de ${formatted} p.p.`
  return 'Sem variação'
}

function formatDistance(value) {
  const formatted = Math.abs(value).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: Math.abs(value) % 1 === 0 ? 0 : 1,
  })
  if (value > 0) return `+${formatted} p.p.`
  if (value < 0) return `-${formatted} p.p.`
  return '0 p.p.'
}

function buildPopulationPercentInterpretation({ distance, endYear, endValue, metaValue }) {
  const numericEnd = toNumber(endValue)
  const numericMeta = toNumber(metaValue)
  if (!Number.isFinite(numericEnd) || !Number.isFinite(numericMeta)) return null

  const yearText = Number.isFinite(Number(endYear)) ? `Em ${endYear}, o município` : 'O município'
  const valueText = formatIndicatorValue(numericEnd, 'percent')
  const metaText = formatIndicatorValue(numericMeta, 'percent')

  if (Number.isFinite(distance) && distance < 0) {
    return `${yearText} alcançou ${valueText}, abaixo da meta definida (${metaText}). A distância em relação à meta é ${formatDistance(distance)}.`
  }

  return `${yearText} alcançou ${valueText} e atingiu a meta definida (${metaText}). A distância em relação à meta é 0 p.p.`
}
