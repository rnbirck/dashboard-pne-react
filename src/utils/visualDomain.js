export function getStableVisualDomain({ values, meta, isPercent = false, isIndex = false, isYears = false }) {
  const numericValues = (values ?? []).filter(Number.isFinite)
  const numericMeta = Number.isFinite(meta) ? [meta] : []
  const all = [...numericValues, ...numericMeta]

  if (!all.length) {
    if (isIndex) return { min: 0, max: 10, isIndex: true }
    if (isPercent) return { min: 0, max: 100, isPercent: true }
    if (isYears) return { min: 0, max: 15, isYears: true }
    return { min: 0, max: 100, isPercent: false }
  }

  const dataMin = Math.min(...all)
  const dataMax = Math.max(...all)

  if (isIndex) {
    const maxCeiling = Math.max(Math.ceil(dataMax), 8)
    const niceMax = maxCeiling <= 8 ? 8 : 10
    return { min: 0, max: niceMax, isIndex: true }
  }

  if (isYears) {
    const minFloor = Math.max(0, Math.floor(dataMin) - 1)
    const maxCeiling = Math.min(20, Math.ceil(dataMax) + 1)
    return { min: minFloor, max: maxCeiling, isYears: true }
  }

  if (isPercent) {
    if (dataMin >= 0 && dataMax <= 100) {
      return { min: 0, max: 100, isPercent: true }
    }
    if (dataMin < 0) {
      const minPad = computeHeadroom(Math.abs(dataMin), Math.abs(dataMax))
      const maxPad = computeHeadroom(Math.abs(dataMax), Math.abs(dataMin))
      return {
        min: roundDownToNiceFloor(dataMin - minPad),
        max: roundUpToNiceCeiling(Math.max(dataMax, 0) + maxPad),
        isPercent: true,
      }
    }
    const ceiling = roundUpToNiceCeiling(Math.max(dataMax, 0))
    return { min: 0, max: ceiling, isPercent: true }
  }

  if (all.every((value) => value >= 0)) {
    const headroom = computeHeadroom(dataMax, dataMin)
    return { min: 0, max: roundUpToNiceCeiling(dataMax + headroom), isPercent: false }
  }

  const minPad = computeHeadroom(Math.abs(dataMin), Math.abs(dataMax))
  const maxPad = computeHeadroom(Math.abs(dataMax), Math.abs(dataMin))
  return {
    min: roundDownToNiceFloor(dataMin - minPad),
    max: roundUpToNiceCeiling(dataMax + maxPad),
    isPercent: false,
  }
}

export function projectValueToPercent(value, domain) {
  if (!Number.isFinite(value) || !domain) return 0
  const { min, max } = domain
  if (max <= min) return 0
  const ratio = (value - min) / (max - min)
  return Math.max(0, Math.min(100, ratio * 100))
}

export function clampMarkerPosition(percent) {
  if (!Number.isFinite(percent)) return 0
  if (percent < 2) return 2
  if (percent > 98) return 98
  return percent
}

export function stablePercentTicks(domain) {
  if (!domain?.isPercent) return null
  if (domain.min < 0) {
    const step = pickMixedPercentStep(domain.max - domain.min)
    const ticks = []
    const start = Math.floor(domain.min / step) * step
    for (let value = start; value <= domain.max + 0.0001; value += step) {
      if (value >= domain.min - 0.0001) ticks.push(Number(value.toFixed(2)))
    }
    if (!ticks.includes(0) && domain.min < 0 && domain.max > 0) ticks.push(0)
    return ticks.sort((a, b) => a - b)
  }
  if (domain.max <= 100) {
    return [0, 25, 50, 75, 100]
  }
  const step = pickPercentStep(domain.max)
  const ticks = []
  for (let value = 0; value <= domain.max + 0.0001; value += step) {
    ticks.push(Number(value.toFixed(2)))
  }
  return ticks
}

export function stableIndexTicks(domain) {
  if (!domain?.isIndex) return null
  if (domain.max <= 8) {
    return [0, 2, 4, 6, 8]
  }
  return [0, 2, 4, 6, 8, 10]
}

export function stableYearsTicks(domain) {
  if (!domain?.isYears) return null
  const ticks = []
  for (let value = domain.min; value <= domain.max + 0.0001; value += 1) {
    ticks.push(Number(value.toFixed(1)))
  }
  return ticks
}

export function stableAbsoluteTicks(domain) {
  if (!domain || domain.isPercent || domain.isIndex || domain.isYears) return null
  const step = pickAbsoluteStep(domain.max - domain.min)
  const ticks = []
  for (let value = domain.min; value <= domain.max + 0.0001; value += step) {
    ticks.push(Number(value.toFixed(2)))
  }
  return ticks
}

function pickPercentStep(max) {
  if (max <= 125) return 25
  if (max <= 150) return 25
  if (max <= 200) return 25
  if (max <= 300) return 50
  if (max <= 500) return 50
  return 100
}

function pickMixedPercentStep(span) {
  if (span <= 80) return 20
  if (span <= 160) return 20
  if (span <= 250) return 25
  if (span <= 400) return 50
  return 100
}

function pickAbsoluteStep(span) {
  if (span <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(span, 1)))
  if (magnitude >= 100) return magnitude / 2
  if (magnitude >= 10) return magnitude / 2
  if (magnitude >= 1) return Math.max(1, magnitude / 2)
  return 0.5
}

function computeHeadroom(value, reference) {
  const base = Math.max(Math.abs(value), Math.abs(reference), 1)
  return base * 0.12
}

function roundUpToNiceCeiling(value) {
  if (value <= 0) return 100
  if (value <= 100) return 100
  if (value <= 125) return 125
  if (value <= 150) return 150
  if (value <= 200) return 200
  if (value <= 250) return 250
  if (value <= 300) return 300
  if (value <= 500) return 500
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

function roundDownToNiceFloor(value) {
  if (value >= 0) return 0
  const magnitude = 10 ** Math.floor(Math.log10(Math.abs(value)))
  return Math.floor(value / magnitude) * magnitude
}
