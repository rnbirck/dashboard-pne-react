import { forwardRef, useEffect, useState } from 'react'
import {
  floorValueForGoal,
  formatIndicatorValue,
  formatMetaValue,
  getDisplayValue,
  getIndicatorTitle,
  isAccumulativeExpansionIndicator,
  isIdebIndicator,
  isSingleYearIndicator,
  resolveIndicatorUnit,
  roundPpString,
} from '../utils/format'
import {
  clampMarkerPosition,
  getStableVisualDomain,
  projectValueToPercent,
} from '../utils/visualDomain'
import { IndicatorComplementaryData } from './IndicatorComplementaryData'
import { IndicatorHistoryChart } from './IndicatorHistoryChart'
import { ChartEmptyState } from './ChartPrimitives'
import { isDemographicCensusIndicator, buildDisplayIndicatorSeries } from '../utils/indicatorSeries'
import { loadIndicatorDetail } from '../data/staticData'
import { PneSourceNotes } from './PneSourceNotes'
import { MetricCard } from './MetricCard'
import { PNE_2026_GOAL_TEXTS } from '../data/pne2026GoalTexts'
import { PNE_2014_GOAL_TEXTS } from '../data/pne2014GoalTexts'
import { getPneCycleCopy, isClosedPneCycle } from '../utils/pneCycleCopy'
import { StatusBadge } from './StatusBadge'

export const IndicatorDetail = forwardRef(function IndicatorDetail(
  { cycle, item, municipioData, result },
  ref,
) {
  const cycleCopy = getPneCycleCopy(cycle)
  const [loadedDetails, setLoadedDetails] = useState(null)
  const fallbackDetails = municipioData?.indicator_details?.[item?.key] ?? null
  const details = loadedDetails ?? fallbackDetails

  useEffect(() => {
    let isMounted = true
    const slug = municipioData?.slug
    const indicatorKey = item?.key

    setLoadedDetails(null)

    if (!slug || !indicatorKey) {
      return () => {
        isMounted = false
      }
    }

    loadIndicatorDetail(slug, indicatorKey)
      .then((data) => {
        if (isMounted) {
          setLoadedDetails(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadedDetails(null)
        }
      })

    return () => {
      isMounted = false
    }
  }, [municipioData?.slug, item?.key])

  if (!item) {
    return (
      <section className="detail-panel detail-panel--empty empty-panel" ref={ref}>
        <p>Selecione um indicador para ver os detalhes.</p>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="detail-panel detail-panel--empty empty-panel" ref={ref}>
        <p>{cycleCopy.emptyResult}</p>
      </section>
    )
  }

  const cycleMinYear = cycle === 'pne_2014_2024' ? 2014 : null
  const isCensusIndicator = isDemographicCensusIndicator({ indicatorKey: item?.key, item, details })
  const displaySeries = buildDisplayIndicatorSeries({ cycle, result, details, item, indicatorKey: item?.key })
  const effectiveCycleMinYear = isCensusIndicator ? null : cycleMinYear
  const filteredStartYear = effectiveCycleMinYear && Number.isFinite(Number(result.start_year)) && Number(result.start_year) < effectiveCycleMinYear
    ? effectiveCycleMinYear
    : startYearFromSeries(displaySeries) ?? result.start_year
  const filteredEndYear = effectiveCycleMinYear
    ? endYearFromSeries(displaySeries) ?? result.end_year
    : result.end_year

  const status = getDisplayValue(result.display, 'status')
  const normalizedStatus = String(status).toLocaleLowerCase('pt-BR')
  const isInformative =
    normalizedStatus.includes('visualiza') || normalizedStatus.includes('informativo')
  const isApproximate = isApproximateIndicator(item, result)
  const isDangerStatus =
    normalizedStatus.includes('distante') ||
    normalizedStatus.includes('crítico') ||
    normalizedStatus.includes('critico') ||
    normalizedStatus.includes('não atingida') ||
    normalizedStatus.includes('nao atingida')
  const tone = isApproximate || isInformative
    ? 'muted'
    : result.atingida
      ? 'success'
      : isDangerStatus
        ? 'danger'
        : result.available
        ? 'warning'
        : 'muted'
  const isComparable = isComparableIndicator(result)
  const rawStartYear = getBoundaryYear(result, 'start')
  const rawEndYear = getBoundaryYear(result, 'end')
  const startYear = filteredStartYear ?? rawStartYear
  const endYear = filteredEndYear ?? rawEndYear
  const distanceTone = getDistanceTone(result, isComparable)
  const unit = resolveIndicatorUnit(item, result)
  const isIdeb = isIdebIndicator(item, result)
  const isAccExpansion = isAccumulativeExpansionIndicator(item, result)
  const ppOptions = { keepOneDecimal: isIdeb }
  const endValueForGoal = floorValueForGoal(Number(result.end_value), item, result)
  const startValueForGoal = floorValueForGoal(Number(result.start_value), item, result)
  const metaValueForGoal = floorValueForGoal(Number(result.meta), item, result)
  const flooredResult = isAccExpansion
    ? {
        ...result,
        end_value: endValueForGoal,
        start_value: startValueForGoal,
        meta: metaValueForGoal,
        distance: Number.isFinite(endValueForGoal) && Number.isFinite(metaValueForGoal)
          ? endValueForGoal - metaValueForGoal
          : result.distance,
      }
    : result
  const goalResult = isAccExpansion && Number.isFinite(flooredResult.distance)
    ? {
        ...flooredResult,
        display: {
          ...flooredResult.display,
          distance: `${flooredResult.distance > 0 ? '+' : ''}${Math.round(flooredResult.distance).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} p.p.`,
        },
      }
    : flooredResult
  const formattedStart = isApproximate
    ? formatApproximatePercent(goalResult.start_value)
    : formatIndicatorValue(goalResult.start_value, unit)
  const formattedEnd = isApproximate
    ? formatApproximatePercent(goalResult.end_value)
    : formatIndicatorValue(goalResult.end_value, unit)
  const variation = roundPpString(getDisplayValue(result.display, 'variation'), ppOptions)
  const compactVariation = formatCompactVariation(variation)
  const hasStartYear = typeof startYear === 'number' && startYear > 0
  const hasEndYear = typeof endYear === 'number' && endYear > 0
  const isSingleYear = isSingleYearIndicator(result)
  const seriesValues = displaySeries.map((p) => Number(p?.valor)).filter(Number.isFinite)
  const hasRealSeriesValues = seriesValues.some((v) => v !== 0)
  const hasSeries = seriesValues.length >= 2 && (isApproximate || hasRealSeriesValues)

  const metaValue = isApproximate
    ? formatApproximatePercent(result.reference_value)
    : formatMetaValue(goalResult, unit)
  const distanceValue = roundPpString(getDisplayValue(goalResult.display, 'distance'), ppOptions)
  const referenceDifferenceValue = formatApproximateDifference(result.reference_difference)
  const showGoalProgress = isComparable && Number.isFinite(Number(goalResult?.meta)) && Number.isFinite(Number(goalResult?.end_value))
  const historyReferenceValue = isApproximate ? result.reference_value : goalResult.meta
  const showHistoryReference =
    (isComparable || isApproximate) && Number.isFinite(Number(historyReferenceValue))
  const goalTexts = cycle === 'pne_2026_2036'
    ? PNE_2026_GOAL_TEXTS
    : cycle === 'pne_2014_2024'
      ? PNE_2014_GOAL_TEXTS
      : null
  const legalGoal = goalTexts && item.metaRef
    ? goalTexts[item.metaRef]
    : null
  const quickReading = buildQuickReading({
    atingida: goalResult.atingida,
    cycle,
    distanceValue,
    direction: goalResult.direction,
    endYear,
    formattedEnd,
    hasAbove100: Boolean(result.acima_de_100),
    isComparable,
    isApproximate,
    metaValue,
    startYear,
    variation: item?.key === 'medio_tecnico_articulado_percentual'
      ? compactVariation
      : variation,
  })
  const historySummary = buildHistoryChartSummary({
    atingida: goalResult.atingida,
    distanceValue,
    direction: goalResult.direction,
    endYear,
    formattedEnd,
    isComparable,
    isApproximate,
    metaValue,
  })

  return (
    <section className={`detail-panel detail-panel--${tone}`} ref={ref}>
      <div className="detail-heading">
        <div className="detail-heading__copy">
          <span className="eyebrow">{cycleCopy.detailEyebrow}</span>
          <h2 data-detail-title tabIndex={-1}>{getIndicatorTitle(item, result)}</h2>
          {item.sub && <p>{item.sub}</p>}
          {item.desc && <p>{appendStageExplanations(item.desc)}</p>}
          {legalGoal && (
            <div className="indicator-goal-reference">
              <span>Referência do PNE</span>
              <p>
                <strong>Meta {item.metaRef} —</strong>{' '}
                {legalGoal.dashboardText || legalGoal.displayText || legalGoal.originalText}
              </p>
            </div>
          )}
          {!isApproximate && Array.isArray(result.meta_references) && result.meta_references.length > 0 && (
            <div className="indicator-goal-reference">
              <span>Referências quantitativas</span>
              {result.meta_references.map((reference) => (
                <p key={`${reference.year}-${reference.value}`}>
                  <strong>{reference.label} ({reference.year}) —</strong>{' '}
                  {Number(reference.value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                </p>
              ))}
            </div>
          )}
        </div>
        <StatusBadge
          displayStatus={getDetailStatusLabel({ cycle, isComparable, result, status })}
          status={status}
          title={getDetailStatusLabel({ cycle, isComparable, result, status })}
          tone={tone}
        />
      </div>

      {isSingleYear ? (
        isApproximate ? (
          <div className="metric-grid metric-grid--three">
            {hasStartYear && (
              <MetricCard label={`Valor inicial (${startYear})`} value={formattedStart} />
            )}
            <MetricCard label="Referência legal final (2036)" value={metaValue} />
            <MetricCard label="Tipo" value="Indicador aproximado" tone="muted" />
          </div>
        ) : isComparable ? (
          <div className="metric-grid metric-grid--four">
            {hasStartYear && (
              <MetricCard label={`Valor inicial (${startYear})`} value={formattedStart} />
            )}
            <MetricCard label={result.meta_label ?? 'Meta'} value={metaValue} />
            <MetricCard
              label="Distância da meta"
              value={distanceValue}
              tone={distanceTone}
            />
            <MetricCard
              label="Situação"
              value={result.atingida ? cycleCopy.status.achieved : cycleCopy.status.below}
              tone={distanceTone}
            />
          </div>
        ) : (
          <div className="metric-grid metric-grid--two">
            {hasStartYear && (
              <MetricCard label={`Valor inicial (${startYear})`} value={formattedStart} />
            )}
            <MetricCard label="Tipo" value="Informativo" tone="muted" />
          </div>
        )
      ) : (
        isApproximate ? (
          <div className="metric-grid">
            {hasStartYear && (
              <MetricCard label={`Valor inicial (${startYear})`} value={formattedStart} />
            )}
            {hasEndYear && (
              <MetricCard label={cycleCopy.valueLabel(endYear)} value={formattedEnd} size="large" />
            )}
            <MetricCard
              detail={getVariationDetail(variation, startYear)}
              label="Variação"
              value={compactVariation}
            />
            <MetricCard label="Referência legal final (2036)" value={metaValue} />
            {Number.isFinite(Number(result.reference_difference)) ? (
              <MetricCard
                label="Diferença para a referência de 2036"
                value={referenceDifferenceValue}
              />
            ) : null}
          </div>
        ) : isComparable ? (
          <div className="metric-grid">
            {hasStartYear && (
              <MetricCard label={`Valor inicial (${startYear})`} value={formattedStart} />
            )}
            {hasEndYear && (
              <MetricCard label={cycleCopy.valueLabel(endYear)} value={formattedEnd} size="large" />
            )}
            <MetricCard
              detail={getVariationDetail(variation, startYear)}
              label="Variação"
              value={compactVariation}
            />
            <MetricCard label={result.meta_label ?? 'Meta'} value={metaValue} />
            <MetricCard
              label="Distância da meta"
              value={distanceValue}
              tone={distanceTone}
            />
          </div>
        ) : (
          <div className="metric-grid metric-grid--four">
            {hasStartYear && (
              <MetricCard label={`Valor inicial (${startYear})`} value={formattedStart} />
            )}
            {hasEndYear && (
              <MetricCard label={cycleCopy.valueLabel(endYear)} value={formattedEnd} size="large" />
            )}
            <MetricCard
              detail={getVariationDetail(variation, startYear)}
              label="Variação"
              value={compactVariation}
            />
            <MetricCard label="Tipo" value="Informativo" tone="muted" />
          </div>
        )
      )}

      {showGoalProgress && (
        <GoalProgress
          label={cycleCopy.progressLabel}
          result={goalResult}
          unit={unit}
        />
      )}

      {quickReading && (
        <div className={`interpretation-box interpretation-box--${tone}`}>
          <span>Leitura rápida</span>
          <p>{quickReading}</p>
          {isSingleYear && (
            <small style={{ display: 'block', marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Há apenas um ano disponível para este indicador.
            </small>
          )}
        </div>
      )}

      {hasSeries && (
        <div className="indicator-chart-card">
          <IndicatorHistoryChart
            adaptiveDomain
            chartHeight={340}
            endYear={endYear}
            essentialLabels
            item={item}
            meta={showHistoryReference ? historyReferenceValue : null}
            referenceLabel={isApproximate
              ? 'Referência 2036'
              : isClosedPneCycle(cycle)
                ? 'Referência final'
                : 'Meta'}
            result={isAccExpansion ? flooredResult : result}
            series={displaySeries}
            showMetaLine={showHistoryReference}
            startYear={startYear}
            subtitle={isApproximate
              ? 'Série histórica do ciclo vigente, com referência legal final para 2036.'
              : isClosedPneCycle(cycle)
                ? 'Série histórica consolidada do ciclo encerrado, com meta de referência quando aplicável.'
                : 'Série histórica do ciclo vigente, com meta de referência quando aplicável.'}
            title={historySummary}
            unit={unit}
            floorNegativeValues={isAccExpansion}
          />
          <PneSourceNotes
            context={{
              block: 'pne',
              cycle,
              details,
              indicatorKey: item?.key,
              item,
              result,
            }}
          />
        </div>
      )}

      {!hasSeries && !isInformative && (
        <>
          <ChartEmptyState message="Histórico não disponível." />
          <PneSourceNotes
            context={{
              block: 'pne',
              cycle,
              details,
              indicatorKey: item?.key,
              item,
              result,
            }}
          />
        </>
      )}

      {isInformative && !hasSeries && (
        <div className="detail-empty-state">
          <p>Este indicador é informativo e não possui acompanhamento de meta neste ciclo.</p>
        </div>
      )}

      <IndicatorComplementaryData cycle={cycle} indicatorKey={item?.key} municipioData={municipioData} result={result} />
    </section>
  )
})

function appendStageExplanations(desc) {
  if (!desc) return desc
  if (desc.includes('anos iniciais do ensino fundamental') && !desc.includes('1º ao 5º ano')) {
    desc = desc.replace('anos iniciais do ensino fundamental', 'anos iniciais do ensino fundamental (1º ao 5º ano)')
  }
  if (desc.includes('anos finais do ensino fundamental') && !desc.includes('6º ao 9º ano')) {
    desc = desc.replace('anos finais do ensino fundamental', 'anos finais do ensino fundamental (6º ao 9º ano)')
  }
  return desc
}

function GoalProgress({ label, result, unit }) {
  const endValue = formatIndicatorValue(result.end_value, unit)
  const metaMarkerLabel = formatMetaValue(result, unit)
  const progress = calculateGoalProgress(result, unit)
  const end = Number(result.end_value)
  const meta = Number(result.meta)
  const isOverLimit = Number.isFinite(end) && Number.isFinite(meta) && end > meta && result.atingida === false
  const markersAreClose = Math.abs(progress.current - progress.meta) < 8
  const statusText = String(result?.display?.status ?? '').toLocaleLowerCase('pt-BR')
  const currentTone = result.atingida
    ? 'success'
    : statusText.includes('distante') ||
        statusText.includes('crítico') ||
        statusText.includes('critico') ||
        statusText.includes('não atingida') ||
        statusText.includes('nao atingida')
      ? 'danger'
      : result.atingida === false
        ? 'warning'
        : 'muted'
  const metaLabelOffsetPct = markersAreClose
    ? Math.min(progress.meta + 14, 95)
    : progress.meta
  const markerEdgeClass = progress.current >= 92
    ? ' goal-progress__marker--edge-end'
    : progress.current <= 8
      ? ' goal-progress__marker--edge-start'
      : ''

  return (
    <section
      className={`goal-progress${isOverLimit ? ' goal-progress--over-limit' : ''}`}
      aria-label={label}
    >
      <div className="goal-progress__heading">
        <span>{label}</span>
      </div>
      <div className="goal-progress__track">
        {isOverLimit ? (
          <>
            <span
              className={`goal-progress__fill goal-progress__fill--${currentTone}`}
              style={{ width: `${progress.meta}%` }}
            />
            <span
              className="goal-progress__overlimit"
              style={{
                left: `${progress.meta}%`,
                width: `${progress.current - progress.meta}%`,
              }}
            />
          </>
        ) : (
          <span
            className={`goal-progress__fill goal-progress__fill--${currentTone}`}
            style={{ width: `${progress.current}%` }}
          />
        )}
        <span
          className="goal-progress__target-tick"
          style={{ left: `${progress.meta}%` }}
        />
        <span
          className="goal-progress__target-label"
          style={{ left: `${metaLabelOffsetPct}%` }}
        >
          Meta {metaMarkerLabel}
        </span>
        <span
          className={`goal-progress__marker goal-progress__marker--${currentTone}${markerEdgeClass}`}
          style={{ left: `${progress.current}%` }}
        >
          <em>{endValue}</em>
        </span>
      </div>
    </section>
  )
}

function formatCompactVariation(value) {
  if (!hasReadableValue(value)) return value ?? '-'
  const numeric = parseDisplayNumber(value)
  if (!Number.isFinite(numeric)) return value

  const normalized = String(value).toLocaleLowerCase('pt-BR')
  const signedValue = normalized.includes('queda')
    ? -Math.abs(numeric)
    : normalized.includes('alta') || normalized.includes('+')
      ? Math.abs(numeric)
      : numeric
  const formatted = Math.abs(signedValue).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })
  const sign = signedValue > 0 ? '+' : signedValue < 0 ? '-' : ''

  return `${sign}${formatted} p.p.`
}

function getVariationDetail(value, startYear) {
  const normalized = String(value ?? '').toLocaleLowerCase('pt-BR')
  const yearSuffix = hasReadableYear(startYear) ? ` desde ${startYear}` : ''

  if (normalized.includes('alta')) return `alta${yearSuffix}`
  if (normalized.includes('queda')) return `queda${yearSuffix}`
  if (parseDisplayNumber(value) === 0) return 'sem variação relevante'
  return undefined
}

function getDetailStatusLabel({ cycle, isComparable, result, status }) {
  const cycleCopy = getPneCycleCopy(cycle)
  const normalizedStatus = String(status).toLocaleLowerCase('pt-BR')
  if (normalizedStatus.includes('visualiza') || normalizedStatus.includes('informativo')) {
    return 'Informativo'
  }
  if (
    !result ||
    result.available === false ||
    normalizedStatus.includes('indispon') ||
    normalizedStatus.includes('sem dados')
  ) {
    return cycleCopy.status.missing
  }
  if (result?.monitoring_mode === 'approximate_reference') {
    return 'Indicador aproximado'
  }
  if (!isComparable) {
    return 'Informativo'
  }
  if (result.atingida === true) {
    return cycleCopy.status.achieved
  }
  if (result.atingida === false) {
    return cycleCopy.status.below
  }
  return cycleCopy.status.missing
}

export function isComparableIndicator(result) {
  if (
    !result ||
    result.available === false ||
    result.tracks_goal === false ||
    result.monitoring_mode === 'approximate_reference' ||
    result.meta == null ||
    result.distance == null ||
    typeof result.atingida !== 'boolean'
  ) {
    return false
  }

  const meta = Number(result?.meta)
  const distance = Number(result?.distance)
  const status = String(result?.display?.status ?? '').toLocaleLowerCase('pt-BR')
  return (
    Number.isFinite(distance) &&
    Number.isFinite(meta) &&
    !status.includes('visualiza') &&
    !status.includes('informativo') &&
    !status.includes('indispon') &&
    !status.includes('sem dados') &&
    !status.includes('sem variação') &&
    !status.includes('sem variacao')
  )
}

function calculateGoalProgress(result, unit) {
  const start = Number(result?.start_value)
  const current = Number(result?.end_value)
  const meta = Number(result?.meta)

  if (!Number.isFinite(current) || !Number.isFinite(meta)) {
    return { fill: 0, current: 0, meta: 0 }
  }

  const seriesValues = (result?.series ?? [])
    .map((point) => Number(point?.valor))
    .filter(Number.isFinite)
  const allValues = [...seriesValues, current, start].filter(Number.isFinite)

  const domain = getStableVisualDomain({
    values: allValues,
    meta,
    isPercent: unit === 'percent',
    isIndex: unit === 'index',
    isYears: unit === 'years',
  })

  const fill = clampMarkerPosition(projectValueToPercent(current, domain))
  const metaPosition = clampMarkerPosition(projectValueToPercent(meta, domain))

  return {
    current: fill,
    fill,
    meta: metaPosition,
  }
}

function getBoundaryYear(result, boundary) {
  const rawYear = boundary === 'start' ? result?.start_year : result?.end_year
  const directYear = Number(rawYear)
  if (Number.isFinite(directYear) && directYear > 0) return directYear
  const years = (result?.series ?? [])
    .map((point) => Number(point?.ano))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  if (!years.length) return '-'
  return boundary === 'start' ? years[0] : years[years.length - 1]
}

function getDistanceTone(result, isComparable) {
  if (!isComparable) return 'muted'
  if (result?.atingida === true) return 'success'
  const status = String(result?.display?.status ?? '').toLocaleLowerCase('pt-BR')
  if (
    status.includes('distante') ||
    status.includes('crítico') ||
    status.includes('critico') ||
    status.includes('não atingida') ||
    status.includes('nao atingida')
  ) {
    return 'danger'
  }
  if (result?.atingida === false) return 'warning'
  return 'muted'
}

function buildHistoryChartSummary({
  atingida,
  distanceValue,
  direction,
  endYear,
  formattedEnd,
  isApproximate,
  isComparable,
  metaValue,
}) {
  if (!hasReadableValue(formattedEnd) || !hasReadableYear(endYear)) {
    return 'Histórico do indicador'
  }

  if (isApproximate) {
    return `${formattedEnd} em ${endYear} — indicador aproximado; referência legal final: ${metaValue} em 2036.`
  }

  if (!isComparable || !hasReadableValue(metaValue)) {
    return `${formattedEnd} em ${endYear} — indicador informativo, sem meta de referência.`
  }

  const normalizedDistance = String(distanceValue ?? '').toLocaleLowerCase('pt-BR')
  const parsedDistanceNumber = parseDisplayNumber(distanceValue)
  let distanceNumber = parsedDistanceNumber
  if (Number.isFinite(parsedDistanceNumber)) {
    if (normalizedDistance.includes('abaixo') || atingida === false) {
      distanceNumber = -Math.abs(parsedDistanceNumber)
    } else if (normalizedDistance.includes('acima') || atingida === true) {
      distanceNumber = Math.abs(parsedDistanceNumber)
    }
  }
  const distanceAbs = formatAbsPp(distanceValue)

  if (direction === 'at_most' && hasReadableValue(distanceAbs)) {
    if (atingida === true) {
      return `${formattedEnd} em ${endYear} — dentro do limite maximo de ${metaValue}.`
    }
    return `${formattedEnd} em ${endYear} — ${distanceAbs} acima do limite maximo de ${metaValue}.`
  }

  if (Number.isFinite(distanceNumber) && Math.abs(distanceNumber) < 0.05) {
    return `${formattedEnd} em ${endYear} — no nível da meta de ${metaValue}.`
  }

  if (Number.isFinite(distanceNumber) && hasReadableValue(distanceAbs)) {
    const relation = distanceNumber > 0
      ? `${distanceAbs} acima da meta de ${metaValue}`
      : `a ${distanceAbs} da meta de ${metaValue}`
    return `${formattedEnd} em ${endYear} — ${relation}.`
  }

  return `${formattedEnd} em ${endYear} — meta de referência: ${metaValue}.`
}

function buildQuickReading({
  atingida,
  cycle,
  distanceValue,
  direction,
  endYear,
  formattedEnd,
  hasAbove100,
  isApproximate,
  isComparable,
  metaValue,
  startYear,
  variation,
}) {
  if (!hasReadableValue(formattedEnd) || !hasReadableYear(endYear)) return ''

  const isClosedCycle = isClosedPneCycle(cycle)
  const variationAbs = formatAbsPp(variation)
  const distanceAbs = formatAbsPp(distanceValue)
  const hasVariation = hasReadableValue(variationAbs)
  const hasDistance = hasReadableValue(distanceAbs)
  const hasStartYear = hasReadableYear(startYear)
  const hasMeta = hasReadableValue(metaValue)
  const variationNumber = parseDisplayNumber(variation)
  const isStable = Number.isFinite(variationNumber) && Math.abs(variationNumber) < 0.5

  if (isApproximate) {
    const warning = hasAbove100
      ? ' Valores acima de 100% são preservados porque a medida usa matrículas e não estudantes únicos.'
      : ''
    return `Em ${endYear}, o município registra ${formattedEnd}. A referência legal final é ${metaValue} em 2036; este proxy não representa cumprimento da meta.${warning}`
  }

  if (!isComparable || !hasMeta) {
    const periodText = isClosedCycle
      ? `No resultado consolidado de ${endYear}`
      : `Em ${endYear}`
    return `${periodText}, o município registra ${formattedEnd}. Este indicador é apresentado como informação de contexto, sem meta definida para comparação.`
  }

  if (direction === 'at_most') {
    if (atingida === true) {
      return isClosedCycle
        ? `No resultado consolidado de ${endYear}, o município registra ${formattedEnd}, dentro do limite máximo de ${metaValue}.`
        : `Em ${endYear}, o município registra ${formattedEnd}, dentro do limite máximo de ${metaValue} no momento.`
    }
    const distance = hasDistance
      ? `, ${distanceAbs} acima do limite máximo de ${metaValue}`
      : `, acima do limite máximo de ${metaValue}`
    return isClosedCycle
      ? `No resultado consolidado de ${endYear}, o município registra ${formattedEnd}${distance}.`
      : `Em ${endYear}, o município registra ${formattedEnd}${distance}; portanto, ainda não atinge a meta no momento.`
  }

  if (isStable && hasStartYear && hasVariation) {
    const periodText = isClosedCycle
      ? `No resultado consolidado de ${endYear}`
      : `Em ${endYear}`
    return `${periodText}, o município registra ${formattedEnd}. O indicador permaneceu próximo ao nível observado em ${startYear}, com variação de ${variationAbs} no período.`
  }

  if (atingida === true) {
    const evolution = hasStartYear && hasVariation && Number.isFinite(variationNumber)
      ? variationNumber >= 0
        ? ` Em relação a ${startYear}, houve aumento de ${variationAbs} no período.`
        : ` Em relação a ${startYear}, houve queda de ${variationAbs} no período.`
      : ''
    return isClosedCycle
      ? `No resultado consolidado de ${endYear}, o município registra ${formattedEnd}, atingindo a meta de ${metaValue}.${evolution}`
      : `Em ${endYear}, o município registra ${formattedEnd} e atinge a meta de ${metaValue} no momento.${evolution}`
  }

  if (atingida === false) {
    const distance = hasDistance
      ? `, ${distanceAbs} abaixo da referência de ${metaValue}`
      : `, abaixo da referência de ${metaValue}`
    const evolution = hasStartYear && hasVariation && Number.isFinite(variationNumber)
      ? variationNumber >= 0
        ? ` Em relação a ${startYear}, houve aumento de ${variationAbs} no período.`
        : ` Em relação a ${startYear}, houve queda de ${variationAbs} no período.`
      : ''
    return isClosedCycle
      ? `No resultado consolidado de ${endYear}, o município registra ${formattedEnd}${distance}; a meta não foi atingida.${evolution}`
      : `Em ${endYear}, o município registra ${formattedEnd}${distance} e ainda não atinge a meta no momento.${evolution}`
  }

  const periodText = isClosedCycle
    ? `No resultado consolidado de ${endYear}`
    : `Em ${endYear}`
  return `${periodText}, o município registra ${formattedEnd}. A referência de comparação é ${metaValue}.`
}

function hasReadableValue(value) {
  return value !== null && value !== undefined && value !== '' && value !== '-'
}

function hasReadableYear(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function formatAbsPp(value) {
  if (!hasReadableValue(value)) return '-'
  const numeric = parseDisplayNumber(value)
  if (!Number.isFinite(numeric)) return value
  const formatted = Math.abs(numeric).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  })
  return `${formatted} p.p.`
}

function isApproximateIndicator(item, result) {
  return (
    item?.monitoring_mode === 'approximate_reference' ||
    result?.monitoring_mode === 'approximate_reference'
  )
}

function formatApproximatePercent(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return `${numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

function formatApproximateDifference(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  const sign = numeric > 0 ? '+' : ''
  return `${sign}${numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} p.p.`
}

function parseDisplayNumber(value) {
  const match = String(value ?? '').match(/[-+]?\d+(?:[,.]\d+)?/)
  if (!match) return Number.NaN
  const numeric = Number(match[0].replace(',', '.'))
  return Number.isFinite(numeric) ? numeric : Number.NaN
}

function startYearFromSeries(series) {
  const years = series.map((p) => Number(p?.ano)).filter((y) => Number.isFinite(y))
  return years.length ? Math.min(...years) : null
}

function endYearFromSeries(series) {
  const years = series.map((p) => Number(p?.ano)).filter((y) => Number.isFinite(y))
  return years.length ? Math.max(...years) : null
}
