import { forwardRef } from 'react'
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
import { MetricCard } from './MetricCard'
import { PNE_2026_GOAL_TEXTS } from '../data/pne2026GoalTexts'
import { PNE_2014_GOAL_TEXTS } from '../data/pne2014GoalTexts'
import { StatusBadge } from './StatusBadge'

const CENSUS_INDICATOR_KEYS = new Set([
  'alfabetizacao_pop_15_mais',
  'fundamental_concluido_18_mais',
  'fundamental_concluido_15_29',
  'medio_concluido_18_mais',
  'medio_concluido_18_29',
  'escolaridade_media_18_29',
  'razao_escolaridade_racial_18_29',
])

export const IndicatorDetail = forwardRef(function IndicatorDetail(
  { cycle, item, municipioData, result },
  ref,
) {
  if (!item) {
    return (
      <section className="detail-panel empty-panel" ref={ref}>
        <p>Selecione um indicador para ver os detalhes.</p>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="detail-panel empty-panel" ref={ref}>
        <p>Este indicador não possui série histórica disponível para este município no ciclo vigente.</p>
      </section>
    )
  }

  const cycleMinYear = cycle === 'pne_2014_2024' ? 2014 : null
  const isCensusIndicator = isDemographicCensusIndicator(item?.key, municipioData?.indicator_details?.[item?.key])
  const censusSeries = isCensusIndicator
    ? buildCensusIndicatorSeries(municipioData?.indicator_details?.[item?.key])
    : []
  const baseSeries = isCensusIndicator && censusSeries.length > 0
    ? censusSeries
    : (result.series ?? [])
  const effectiveCycleMinYear = isCensusIndicator ? null : cycleMinYear
  const displaySeries = effectiveCycleMinYear
    ? baseSeries.filter((p) => Number(p?.ano) >= effectiveCycleMinYear)
    : baseSeries
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
  const tone = isInformative
    ? 'muted'
    : result.atingida
      ? 'success'
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
  const formattedStart = formatIndicatorValue(goalResult.start_value, unit)
  const formattedEnd = formatIndicatorValue(goalResult.end_value, unit)
  const variation = roundPpString(getDisplayValue(result.display, 'variation'), ppOptions)
  const hasStartYear = typeof startYear === 'number' && startYear > 0
  const hasEndYear = typeof endYear === 'number' && endYear > 0
  const isSingleYear = isSingleYearIndicator(result)
  const seriesValues = displaySeries.map((p) => Number(p?.valor)).filter(Number.isFinite)
  const hasRealSeriesValues = seriesValues.some((v) => v !== 0)
  const hasSeries = seriesValues.length >= 2 && hasRealSeriesValues

  const metaValue = formatMetaValue(goalResult, unit)
  const distanceValue = roundPpString(getDisplayValue(goalResult.display, 'distance'), ppOptions)
  const showGoalProgress = isComparable && Number.isFinite(Number(goalResult?.meta)) && Number.isFinite(Number(goalResult?.end_value))
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
    distanceValue,
    endYear,
    formattedEnd,
    isComparable,
    metaValue,
    startYear,
    variation,
  })

  return (
    <section className="detail-panel" ref={ref}>
      <div className="detail-heading">
        <div className="detail-heading__copy">
          <span className="eyebrow">Indicador selecionado</span>
          <h3>{getIndicatorTitle(item, result)}</h3>
          {item.sub && <p>{item.sub}</p>}
          {item.desc && <p>{item.desc}</p>}
          {legalGoal && (
            <div className="indicator-goal-reference">
              <span>Referência do PNE</span>
              <p>
                <strong>Meta {item.metaRef} —</strong>{' '}
                {legalGoal.dashboardText || legalGoal.displayText || legalGoal.originalText}
              </p>
            </div>
          )}
        </div>
        <StatusBadge status={status} tone={tone} />
      </div>

      {isSingleYear ? (
        isComparable ? (
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
              value={result.atingida ? 'Atingida' : 'Não atingida'}
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
        isComparable ? (
          <div className="metric-grid">
            {hasStartYear && (
              <MetricCard label={`Valor inicial (${startYear})`} value={formattedStart} />
            )}
            {hasEndYear && (
              <MetricCard label={`Valor atual (${endYear})`} value={formattedEnd} size="large" />
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
              <MetricCard label={`Valor inicial (${startYear})`} value={formattedStart} />
            )}
            {hasEndYear && (
              <MetricCard label={`Valor atual (${endYear})`} value={formattedEnd} size="large" />
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

      {quickReading && (
        <div className="interpretation-box">
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
            endYear={endYear}
            item={item}
            meta={isComparable ? goalResult.meta : null}
            result={isAccExpansion ? flooredResult : result}
            series={displaySeries}
            showMetaLine={isComparable}
            startYear={startYear}
            title={getIndicatorTitle(item, result)}
            unit={unit}
            floorNegativeValues={isAccExpansion}
          />
        </div>
      )}

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

      <IndicatorComplementaryData cycle={cycle} indicatorKey={item?.key} municipioData={municipioData} result={result} />
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

function getDistanceTone(result, isComparable) {
  if (!isComparable) return 'muted'
  if (result?.atingida === true) return 'success'
  if (result?.atingida === false) return 'warning'
  return 'muted'
}

function buildQuickReading({
  atingida,
  distanceValue,
  endYear,
  formattedEnd,
  isComparable,
  metaValue,
  startYear,
  variation,
}) {
  if (!hasReadableValue(formattedEnd) || !hasReadableYear(endYear)) return ''

  const variationAbs = formatAbsPp(variation)
  const distanceAbs = formatAbsPp(distanceValue)
  const hasVariation = hasReadableValue(variationAbs)
  const hasDistance = hasReadableValue(distanceAbs)
  const hasStartYear = hasReadableYear(startYear)
  const hasMeta = hasReadableValue(metaValue)
  const variationNumber = parseDisplayNumber(variation)
  const isStable = Number.isFinite(variationNumber) && Math.abs(variationNumber) < 0.5

  if (!isComparable || !hasMeta) {
    return `Em ${endYear}, o município registra ${formattedEnd}. Este indicador é acompanhado como informação de contexto, sem meta definida para comparação.`
  }

  if (isStable && hasStartYear && hasVariation) {
    return `Em ${endYear}, o município registra ${formattedEnd}. O indicador permaneceu próximo ao nível observado em ${startYear}, com variação de ${variationAbs} no período.`
  }

  if (atingida === true) {
    const evolution = hasStartYear && hasVariation && Number.isFinite(variationNumber)
      ? variationNumber >= 0
        ? ` Em relação a ${startYear}, houve avanço de ${variationAbs}, indicando evolução positiva no período.`
        : ` Em relação a ${startYear}, houve queda de ${variationAbs}, mas o indicador permanece na referência esperada.`
      : ''
    return `Em ${endYear}, o município registra ${formattedEnd}, alcançando a referência de ${metaValue}.${evolution}`
  }

  if (atingida === false) {
    const distance = hasDistance
      ? `, ainda ${distanceAbs} abaixo da referência de ${metaValue}`
      : `, abaixo da referência de ${metaValue}`
    const evolution = hasStartYear && hasVariation && Number.isFinite(variationNumber)
      ? variationNumber >= 0
        ? ` Apesar do avanço de ${variationAbs} desde ${startYear}, o indicador ainda exige atenção para alcançar a meta.`
        : ` Houve queda de ${variationAbs} desde ${startYear}, e o indicador exige atenção para se aproximar da referência.`
      : ' O indicador ainda exige atenção para alcançar a meta.'
    return `Em ${endYear}, o município registra ${formattedEnd}${distance}.${evolution}`
  }

  return `Em ${endYear}, o município registra ${formattedEnd}. A referência de comparação é ${metaValue}.`
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

function parseDisplayNumber(value) {
  const match = String(value ?? '').match(/[-+]?\d+(?:[,.]\d+)?/)
  if (!match) return Number.NaN
  const numeric = Number(match[0].replace(',', '.'))
  return Number.isFinite(numeric) ? numeric : Number.NaN
}

function isDemographicCensusIndicator(indicatorKey, details) {
  if (CENSUS_INDICATOR_KEYS.has(indicatorKey)) return true

  const text = [
    details?.source,
    details?.fonte,
    details?.methodology,
    details?.description,
    details?.calculation?.source,
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('pt-BR')

  return text.includes('censo demografico') || text.includes('censo demográfico')
}

function buildCensusIndicatorSeries(details) {
  const componentSeries = extractCensusSeries(details?.series_components, 'percentual')
  if (componentSeries.length > 0) return componentSeries

  return extractCensusSeries(details?.series_total, 'valor')
}

function extractCensusSeries(rows, valueKey) {
  if (!Array.isArray(rows)) return []

  const byYear = new Map()
  rows.forEach((row) => {
    const ano = Number(row?.ano)
    const valor = Number(row?.[valueKey])
    if (!Number.isFinite(ano) || !Number.isFinite(valor)) return
    byYear.set(ano, { ano, valor })
  })

  return Array.from(byYear.values()).sort((a, b) => a.ano - b.ano)
}

function startYearFromSeries(series) {
  const years = series.map((p) => Number(p?.ano)).filter((y) => Number.isFinite(y))
  return years.length ? Math.min(...years) : null
}

function endYearFromSeries(series) {
  const years = series.map((p) => Number(p?.ano)).filter((y) => Number.isFinite(y))
  return years.length ? Math.max(...years) : null
}
