const LABEL_GAP = 22

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max))
}

function projectionAndTargetCoincide({
  projectedRawValue,
  projectedYear,
  targetRawValue,
  targetYear,
}) {
  return Number.isFinite(projectedRawValue)
    && Number.isFinite(targetRawValue)
    && Number.isFinite(projectedYear)
    && Number.isFinite(targetYear)
    && projectedYear === targetYear
    && projectedRawValue === targetRawValue
}

export function buildProjectionEndLabelLayout({
  chartHeight,
  chartWidth,
  lastProjectedPoint,
  metaLine,
  padding,
  projectedRawValue,
  targetRawValue,
  targetYear,
}) {
  if (!lastProjectedPoint) return { combined: false, meta: null, projected: null }

  const plotTop = padding.top
  const plotBottom = chartHeight - padding.bottom
  const labelX = chartWidth - padding.right - 6
  const projectedYear = Number(lastProjectedPoint.year)
  const combined = projectionAndTargetCoincide({
    projectedRawValue,
    projectedYear,
    targetRawValue,
    targetYear: Number(targetYear),
  })
  const projected = {
    x: labelX,
    y: clamp(
      lastProjectedPoint.y < plotTop + 24 ? lastProjectedPoint.y + 20 : lastProjectedPoint.y - 12,
      plotTop + 14,
      plotBottom - 12,
    ),
  }

  if (!metaLine || combined) {
    return { combined, meta: metaLine ? { hidden: true, x: labelX, y: metaLine.labelY } : null, projected }
  }

  const meta = { hidden: false, x: labelX, y: metaLine.labelY }
  if (Math.abs(projected.y - meta.y) < LABEL_GAP) {
    const midpoint = (lastProjectedPoint.y + metaLine.y) / 2
    let upper = clamp(midpoint - LABEL_GAP / 2, plotTop + 14, plotBottom - 12)
    let lower = clamp(midpoint + LABEL_GAP / 2, plotTop + 14, plotBottom - 12)
    if (lower - upper < LABEL_GAP) {
      upper = clamp(upper, plotTop + 14, plotBottom - 12 - LABEL_GAP)
      lower = upper + LABEL_GAP
    }
    if (lastProjectedPoint.y <= metaLine.y) {
      projected.y = upper
      meta.y = lower
    } else {
      meta.y = upper
      projected.y = lower
    }
  }

  return { combined: false, meta, projected }
}
