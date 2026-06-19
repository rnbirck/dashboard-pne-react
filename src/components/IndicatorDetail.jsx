import { forwardRef } from 'react'
import {
  buildAccumulativeExpansionInterpretation,
  cleanInterpretationText,
  floorValueForGoal,
  formatIndicatorValue,
  formatMetaValue,
  getDisplayValue,
  getIndicatorTitle,
  improveZeroValueInterpretation,
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
import { MetricCard } from './MetricCard'
import { StatusBadge } from './StatusBadge'

export const IndicatorDetail = forwardRef(function IndicatorDetail(
  { cycle, item, municipioData, result },
  ref,
) {
  if (!item || !result) {
    return (
      <section className="detail-panel empty-panel" ref={ref}>
        <p>Selecione um indicador para ver os detalhes.</p>
      </section>
    )
  }

  const status = getDisplayValue(result.display, 'status')
  const normalizedStatus = String(status).toLocaleLowerCase('pt-BR')
  const isInformative =
    normalizedStatus.includes('visualiza') || normalizedStatus.includes('informativo')
  const tone = isInformative
    ? 'muted'
    : result.atingida
      ? 'success'
      : result.available
        ? 'warning'
        : 'muted'
  const isComparable = isComparableIndicator(result)
  const startYear = getBoundaryYear(result, 'start')
  const endYear = getBoundaryYear(result, 'end')
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
  const formattedStart = formatIndicatorValue(goalResult.start_value, unit)
  const formattedEnd = formatIndicatorValue(goalResult.end_value, unit)
  const variation = roundPpString(getDisplayValue(result.display, 'variation'), ppOptions)
  const hasStartYear = typeof startYear === 'number' && startYear > 0
  const hasEndYear = typeof endYear === 'number' && endYear > 0
  const isSingleYear = isSingleYearIndicator(result)
  const seriesValues = (result.series ?? []).map((p) => Number(p?.valor)).filter(Number.isFinite)
  const hasRealSeriesValues = seriesValues.some((v) => v !== 0)
  const hasSeries = (result.series ?? []).length >= 2 && hasRealSeriesValues

  const metaValue = formatMetaValue(goalResult, unit)
  const distanceValue = roundPpString(getDisplayValue(goalResult.display, 'distance'), ppOptions)
  const showGoalProgress = isComparable && Number.isFinite(Number(goalResult?.meta)) && Number.isFinite(Number(goalResult?.end_value))
  const useCustomInterpretation = isAccExpansion && Number.isFinite(flooredResult.end_value) && flooredResult.end_value <= 0
  const shouldImproveZeroInterpretation =
    Number.isFinite(Number(goalResult.end_value)) &&
    Number(goalResult.end_value) <= 0

  return (
    <section className="detail-panel" ref={ref}>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">Indicador selecionado</span>
          <h3>{getIndicatorTitle(item, result)}</h3>
          {item.sub && <p>{item.sub}</p>}
          {item.desc && <p>{item.desc}</p>}
        </div>
        <StatusBadge status={status} tone={tone} />
      </div>

      {isSingleYear ? (
        isComparable ? (
          <div className="metric-grid metric-grid--four">
            {hasStartYear && (
              <MetricCard label={`Valor em ${startYear}`} value={formattedStart} />
            )}
            <MetricCard label={result.meta_label ?? 'Meta'} value={metaValue} />
            <MetricCard
              label="Distância da meta"
              value={distanceValue}
              tone={distanceTone}
            />
            <MetricCard
              label="Situação"
              value={result.atingida ? 'Atingida' : 'Não atingida'}
              tone={distanceTone}
            />
          </div>
        ) : (
          <div className="metric-grid metric-grid--two">
            {hasStartYear && (
              <MetricCard label={`Valor em ${startYear}`} value={formattedStart} />
            )}
            <MetricCard label="Tipo" value="Informativo" tone="muted" />
          </div>
        )
      ) : (
        isComparable ? (
          <div className="metric-grid">
            {hasStartYear && (
              <MetricCard label={`Valor em ${startYear}`} value={formattedStart} />
            )}
            {hasEndYear && (
              <MetricCard label={`Valor em ${endYear}`} value={formattedEnd} />
            )}
            <MetricCard label="Variação" value={variation} />
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
              <MetricCard label={`Valor em ${startYear}`} value={formattedStart} />
            )}
            {hasEndYear && (
              <MetricCard label={`Valor em ${endYear}`} value={formattedEnd} />
            )}
            <MetricCard label="Variação" value={variation} />
            <MetricCard label="Tipo" value="Informativo" tone="muted" />
          </div>
        )
      )}

      {showGoalProgress && (
        <GoalProgress
          result={goalResult}
          unit={unit}
        />
      )}

      {(useCustomInterpretation || result.display?.interpretation) && (
        <div className="interpretation-box">
          <span>Interpretação</span>
          <p>
            {useCustomInterpretation
              ? buildAccumulativeExpansionInterpretation({
                  endYear,
                  metaValue: goalResult.meta,
                  metaLabel: result.meta_label,
                  distance: goalResult.distance,
                })
              : shouldImproveZeroInterpretation
                ? improveZeroValueInterpretation(
                    cleanInterpretationText(result.display.interpretation, ppOptions),
                    { isAccumulativeExpansion: isAccExpansion },
                  )
                : isComparable
                  ? buildComparableInterpretation({
                      endYear,
                      formattedEnd,
                      metaValue,
                      distanceValue,
                      atingida: result.atingida,
                    })
                  : cleanInterpretationText(result.display.interpretation, ppOptions)}
          </p>
          {isSingleYear && !useCustomInterpretation && (
            <small style={{ display: 'block', marginTop: '6px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Há apenas um ano disponível para este indicador.
            </small>
          )}
        </div>
      )}

      {hasSeries && (
        <div className="indicator-chart-card">
          <IndicatorHistoryChart
            endYear={result.end_year}
            item={item}
            meta={isComparable ? goalResult.meta : null}
            result={isAccExpansion ? flooredResult : result}
            series={result.series}
            showMetaLine={isComparable}
            startYear={result.start_year}
            title={getIndicatorTitle(item, result)}
            unit={unit}
            floorNegativeValues={isAccExpansion}
          />
        </div>
      )}

      <IndicatorComplementaryData cycle={cycle} indicatorKey={item?.key} municipioData={municipioData} result={result} />

      {!hasSeries && !isInformative && (
        <div className="detail-empty-state">
          <p>Este indicador não possui série histórica disponível para este município no ciclo vigente.</p>
        </div>
      )}

      {isInformative && !hasSeries && (
        <div className="detail-empty-state">
          <p>Este indicador é informativo e não possui acompanhamento de meta neste ciclo.</p>
        </div>
      )}
    </section>
  )
})

function GoalProgress({ result, unit }) {
  const endValue = formatIndicatorValue(result.end_value, unit)
  const metaMarkerLabel = formatMetaValue(result, unit)
  const progress = calculateGoalProgress(result, unit)
  const end = Number(result.end_value)
  const meta = Number(result.meta)
  const isOverLimit = Number.isFinite(end) && Number.isFinite(meta) && end > meta && result.atingida === false
  const markersAreClose = Math.abs(progress.current - progress.meta) < 8
  const currentTone = result.atingida ? 'success' : result.atingida === false ? 'warning' : 'muted'
  const metaLabelOffsetPct = markersAreClose
    ? Math.min(progress.meta + 14, 95)
    : progress.meta

  return (
    <section
      className={`goal-progress${isOverLimit ? ' goal-progress--over-limit' : ''}`}
      aria-label="Acompanhamento da meta"
    >
      <div className="goal-progress__heading">
        <span>Acompanhamento da meta</span>
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
          className={`goal-progress__marker goal-progress__marker--${currentTone}`}
          style={{ left: `${progress.current}%` }}
        >
          <em>{endValue}</em>
        </span>
      </div>
    </section>
  )
}

export function isAvailableIndicator(result) {
  if (!result || result.available === false) return false
  const status = String(result?.display?.status ?? '').toLocaleLowerCase('pt-BR')
  if (
    status.includes('indispon') ||
    status.includes('sem dados') ||
    status.includes('sem variação') ||
    status.includes('sem variacao')
  ) {
    return false
  }
  const start = Number(result?.start_value)
  const end = Number(result?.end_value)
  const series = (result?.series ?? [])
    .map((point) => Number(point?.valor))
    .filter(Number.isFinite)
  if (!Number.isFinite(start) && !Number.isFinite(end) && series.length === 0) {
    return false
  }
  // Esconder indicadores informativos cuja série inteira é zero
  const isInformative =
    status.includes('visualiza') ||
    status.includes('informativo') ||
    result.tracks_goal === false ||
    result.meta == null
  if (isInformative && series.length > 0 && series.every((v) => v === 0)) {
    return false
  }
  if (isInformative && Number.isFinite(start) && start === 0 && Number.isFinite(end) && end === 0 && series.length === 0) {
    return false
  }
  return true
}

export function isComparableIndicator(result) {
  const meta = Number(result?.meta)
  const status = String(result?.display?.status ?? '').toLocaleLowerCase('pt-BR')
  return (
    Boolean(result) &&
    result.available !== false &&
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

function buildComparableInterpretation({ endYear, formattedEnd, metaValue, distanceValue, atingida }) {
  const adverbio = atingida === true ? 'acima' : 'abaixo'
  return `Em ${endYear}, o município chegou a ${formattedEnd}, ${adverbio} da meta definida (${metaValue}). A distância em relação à meta é de ${distanceValue}.`
}

function getDistanceTone(result, isComparable) {
  if (!isComparable) return 'muted'
  if (result?.atingida === true) return 'success'
  if (result?.atingida === false) return 'warning'
  return 'muted'
}
