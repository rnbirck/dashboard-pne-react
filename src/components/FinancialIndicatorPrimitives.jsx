import { MetricCard } from './MetricCard'
import { StatusBadge } from './StatusBadge'
import { DetailNavigation } from './DetailNavigation'
import { InteractionChevron } from './InteractionChevron'

const EM = '\u2014'
const SPARKLINE_WIDTH = 320
const SPARKLINE_HEIGHT = 56

export function FinancialIndicatorCard({ buttonRef, indicator, isSelected = false, onSelect }) {
  const sparkline = getSparkline(indicator.series)
  const statusTone = indicator.statusTone ?? 'default'

  return (
    <button
      className={`financial-indicator-card interaction-card--explorable financial-indicator-card--${statusTone}${isSelected ? ' is-selected' : ''}`}
      ref={buttonRef}
      type="button"
      onClick={onSelect}
      aria-label={`Abrir detalhe do indicador ${indicator.label}`}
      aria-pressed={isSelected}
      title={indicator.label}
    >
      <span className="financial-indicator-card__topline">
        <span className="financial-indicator-card__module">{indicator.moduleLabel ?? 'Financeiro'}</span>
        <StatusBadge status={indicator.statusLabel ?? 'Com dados'} tone={statusTone} />
      </span>

      <span className="financial-indicator-card__title">{indicator.label}</span>
      <span className="financial-indicator-card__description">{indicator.description}</span>

      <span className="financial-indicator-card__value-row">
        <strong>{indicator.currentDisplay ?? EM}</strong>
        <span>{indicator.currentYear ? `Ano ${indicator.currentYear}` : 'Ano indisponível'}</span>
      </span>

      <span className="financial-indicator-card__support">
        <span>{indicator.variationLabel ?? 'Variação no período'}</span>
        <strong>{indicator.variationDisplay ?? EM}</strong>
      </span>

      {sparkline ? (
        <span className="financial-indicator-card__sparkline" aria-hidden="true">
          <svg viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}>
            <path className="financial-indicator-card__sparkline-area" d={sparkline.areaPath} />
            <path className="financial-indicator-card__sparkline-line" d={sparkline.linePath} />
            <circle
              className="financial-indicator-card__sparkline-end"
              cx={sparkline.lastPoint.x}
              cy={sparkline.lastPoint.y}
              r="3.4"
            />
          </svg>
          <span className="financial-indicator-card__sparkline-period">
            {sparkline.firstYear}–{sparkline.lastYear}
          </span>
        </span>
      ) : (
        <span className="financial-indicator-card__sparkline financial-indicator-card__sparkline--empty">
          Histórico não disponível.
        </span>
      )}

      <span className="financial-indicator-card__footer">
        <span>{indicator.unitLabel ?? 'Indicador'}</span>
        {indicator.sourceLabel ? <span>{indicator.sourceLabel}</span> : null}
        <InteractionChevron />
      </span>
    </button>
  )
}

export function FinancialDetailNavigation({
  activeIndex,
  nextIndicator,
  onBack,
  onNext,
  onPrevious,
  previousIndicator,
  total,
  isBottom = false,
}) {
  return (
    <DetailNavigation
      activeIndex={activeIndex}
      className={`financial-detail-nav${isBottom ? ' financial-detail-nav--bottom' : ''}`}
      isBottom={isBottom}
      nextItem={nextIndicator}
      onBack={onBack}
      onNext={onNext}
      onPrevious={onPrevious}
      previousItem={previousIndicator}
      total={total}
    />
  )
}

export function FinancialDetailHeader({ indicator }) {
  return (
    <div className="detail-heading educacao-detail-heading financial-detail-heading">
      <div className="detail-heading__copy">
        <span className="eyebrow">Indicador selecionado</span>
        <h3 data-detail-title tabIndex={-1}>{indicator.label}</h3>
        {indicator.description ? <p>{indicator.description}</p> : null}
      </div>
      <div className="educacao-detail-heading__badges financial-detail-heading__badges">
        {indicator.moduleLabel ? <span className="indicator-stage-badge">{indicator.moduleLabel}</span> : null}
        {indicator.unitLabel ? <span className="indicator-stage-badge">{indicator.unitLabel}</span> : null}
        <StatusBadge status={indicator.statusLabel ?? 'Com dados'} tone={indicator.statusTone ?? 'default'} />
      </div>
    </div>
  )
}

export function FinancialReferenceBox({ children, title = 'O que este indicador mede' }) {
  if (!children) return null

  return (
    <div className="educacao-indicator-reference financial-indicator-reference">
      <span>{title}</span>
      <p>{children}</p>
    </div>
  )
}

export function FinancialMetricGrid({ indicator }) {
  return (
    <div className="metric-grid metric-grid--three financial-metric-grid">
      <MetricCard
        label="Valor inicial"
        value={indicator.initialDisplay ?? EM}
        detail={indicator.initialYear ? `Ano ${indicator.initialYear}` : null}
      />
      <MetricCard
        label="Valor atual"
        value={indicator.currentDisplay ?? EM}
        detail={indicator.currentYear ? `Ano ${indicator.currentYear}` : null}
        size="large"
      />
      <MetricCard
        label="Variação"
        value={indicator.variationDisplay ?? EM}
        tone={indicator.variationTone ?? 'default'}
      />
    </div>
  )
}

export function FinancialQuickReading({ text, tone = 'default' }) {
  if (!text) return null

  return (
    <div className={`interpretation-box education-quick-reading financial-quick-reading financial-quick-reading--${tone}`}>
      <span>Leitura rápida</span>
      <p>{text}</p>
    </div>
  )
}

export function FinancialChartFrame({ children, source, subtitle, summary, title = 'Histórico do indicador' }) {
  return (
    <div className="indicator-chart-card educacao-main-chart-card financial-chart-card">
      <div className="indicator-chart-header financial-chart-header">
        <div className="indicator-chart-title-group">
          <span className="indicator-chart-eyebrow">Série histórica</span>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
          {summary ? <p className="indicator-chart-summary">{summary}</p> : null}
        </div>
      </div>
      {children}
      {source}
    </div>
  )
}

export function FinancialSupportData({ children, subtitle = 'Tabela e recortes de apoio do indicador.' }) {
  if (!children) return null

  return (
    <section className="educacao-explore education-support-data financial-support-data">
      <div className="educacao-explore__heading">
        <div>
          <span className="educacao-explore__eyebrow">Aprofundamento</span>
          <h3>Dados de apoio do indicador</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="educacao-explore__panel">
        {children}
      </div>
    </section>
  )
}

function getSparkline(series = []) {
  const points = series
    .map((point) => ({
      value: Number(point?.valor),
      year: Number(point?.ano),
    }))
    .filter((point) => Number.isFinite(point.value) && Number.isFinite(point.year))
    .sort((a, b) => a.year - b.year)

  if (points.length < 3) return null

  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const insetX = 2
  const insetY = 7
  const baseline = SPARKLINE_HEIGHT - 4
  const step = (SPARKLINE_WIDTH - insetX * 2) / (points.length - 1)

  const scaledPoints = points.map((point, index) => {
    const x = insetX + index * step
    const y = range === 0
      ? SPARKLINE_HEIGHT / 2
      : baseline - ((point.value - min) / range) * (SPARKLINE_HEIGHT - insetY * 2)

    return { x, y }
  })

  const linePath = scaledPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ')
  const firstPoint = scaledPoints[0]
  const lastPoint = scaledPoints[scaledPoints.length - 1]
  const areaPath = `${linePath} L${lastPoint.x.toFixed(1)} ${baseline.toFixed(1)} L${firstPoint.x.toFixed(1)} ${baseline.toFixed(1)} Z`

  return {
    areaPath,
    firstYear: points[0].year,
    lastPoint,
    lastYear: points[points.length - 1].year,
    linePath,
  }
}
