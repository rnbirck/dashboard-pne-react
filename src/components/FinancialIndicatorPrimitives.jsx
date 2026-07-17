import { DetailNavigation } from './DetailNavigation'
import { DetailHeadingText } from './HeadingText'
import { ExplorableIndicatorCardFrame } from './ExplorableIndicatorCardFrame'
import { IndicatorChartHeader } from './IndicatorChartHeader'
import { MetricCard } from './MetricCard'
import { QuickReadingHeading } from './QuickReadingHeading'

const EM = '\u2014'
const FINANCIAL_CARD_CLASS_CONTRACT = Object.freeze({
  root: 'financial-indicator-card',
  statusModifier: (tone) => `financial-indicator-card--${tone}`,
  topline: 'financial-indicator-card__topline',
  context: 'financial-indicator-card__module',
  title: 'financial-indicator-card__title',
  description: 'financial-indicator-card__description',
  valueRow: 'financial-indicator-card__value-row',
  metadata: 'financial-indicator-card__metadata',
  metadataItem: 'financial-indicator-card__metadata-item',
  metadataLabel: 'financial-indicator-card__metadata-label',
  metadataValue: 'financial-indicator-card__metadata-value',
  divider: 'financial-indicator-card__divider',
  insight: 'financial-indicator-card__insight',
  insightItem: 'financial-indicator-card__insight-item',
  insightLabel: 'financial-indicator-card__insight-label',
  insightValue: 'financial-indicator-card__insight-value',
  footer: 'financial-indicator-card__footer',
  action: 'financial-indicator-card__action',
})

export function FinancialIndicatorCard({ buttonRef, indicator, isSelected = false, onSelect }) {
  const statusTone = indicator.statusTone ?? 'default'
  const hasCurrentValue = Boolean(indicator.currentDisplay && indicator.currentDisplay !== EM)
  const comparableSeries = getComparableSeries(indicator.series)
  const hasComparison = comparableSeries.length >= 2
    && indicator.initialYear !== null
    && indicator.initialYear !== undefined
    && indicator.currentYear !== null
    && indicator.currentYear !== undefined
    && indicator.variationDisplay
    && indicator.variationDisplay !== EM
  const direction = getFinancialDirection({ hasComparison, hasCurrentValue, series: comparableSeries })
  const period = hasComparison ? `${indicator.initialYear}\u2013${indicator.currentYear}` : null
  const reading = getFinancialReading({ direction, hasComparison, hasCurrentValue, hasSeries: comparableSeries.length > 0 })
  const description = String(indicator.cardDescription ?? indicator.description ?? '').trim()
  const statusLabel = indicator.statusLabel ?? (hasCurrentValue ? 'Com dados' : 'Sem dados')
  const viewModel = {
    anatomy: 'financial',
    ariaLabel: [
      `Abrir detalhe do indicador ${indicator.label}.`,
      `Valor ${indicator.currentDisplay ?? EM},`,
      indicator.currentYear ? `ano ${indicator.currentYear}.` : 'ano indisponível.',
      statusLabel ? `${statusLabel}.` : '',
      hasComparison ? `${indicator.variationLabel}: ${indicator.variationDisplay}.` : '',
      description ? `Descrição: ${description}.` : '',
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
    contextLabel: indicator.moduleLabel ?? 'Financeiro',
    description,
    footer: {
      primary: indicator.groupLabel ?? indicator.unitLabel ?? indicator.moduleLabel ?? 'Indicador',
      actionLabel: 'Abrir detalhes',
    },
    insight: {
      reading,
      period,
    },
    metadata: {
      year: indicator.currentYear ?? 'Indisponível',
      variation: hasComparison
        ? {
            label: indicator.variationLabel ?? `Variação desde ${indicator.initialYear}`,
            value: indicator.variationDisplay,
          }
        : null,
    },
    status: {
      direction,
      label: statusLabel,
      marker: getDirectionMarker(direction),
      tone: statusTone,
    },
    title: indicator.label,
    value: {
      display: indicator.currentDisplayCompact ?? indicator.currentDisplay ?? EM,
      metaLabel: null,
    },
  }

  return (
    <ExplorableIndicatorCardFrame
      buttonRef={buttonRef}
      classContract={FINANCIAL_CARD_CLASS_CONTRACT}
      isSelected={isSelected}
      onSelect={onSelect}
      viewModel={viewModel}
    />
  )
}

function getComparableSeries(series) {
  if (!Array.isArray(series)) return []
  return series.filter((point) => point?.valor !== null && point?.valor !== undefined && Number.isFinite(Number(point.valor)))
}

function getFinancialDirection({ hasComparison, hasCurrentValue, series }) {
  if (!hasCurrentValue) return 'missing'
  if (!hasComparison) return 'data'
  const first = Number(series[0]?.valor)
  const latest = Number(series[series.length - 1]?.valor)
  if (latest > first) return 'up'
  if (latest < first) return 'down'
  return 'stable'
}

function getDirectionMarker(direction) {
  if (direction === 'up') return '\u2197'
  if (direction === 'stable') return '\u2192'
  if (direction === 'down') return '\u2198'
  return ''
}

function getFinancialReading({ direction, hasComparison, hasCurrentValue, hasSeries }) {
  if (!hasCurrentValue) return 'Leitura recente indisponível'
  if (!hasComparison) return hasSeries ? 'Série disponível' : 'Leitura recente indisponível'
  if (direction === 'up') return 'Crescimento recente'
  if (direction === 'down') return 'Redução recente'
  return 'Estabilidade recente'
}

export function FinancialDetailNavigation({
  activeIndex,
  nextIndicator,
  onBack,
  onNext,
  onPrevious,
  previousIndicator,
  statusLabel,
  statusTone,
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
      showBack={!isBottom}
      statusLabel={statusLabel}
      statusTone={statusTone}
      total={total}
    />
  )
}

export function FinancialSectionHeader({ actions = null, description, eyebrow, meta, title, titleId, className = '' }) {
  return (
    <div className={`pne-overview-section__heading financial-section-heading${className ? ` ${className}` : ''}`}>
      <span className="eyebrow">{eyebrow}</span>
      <div className="financial-section-heading__title-row">
        <h2 id={titleId}>{title}</h2>
        {meta || actions ? (
          <div className="financial-section-heading__tools">
            {meta ? <span className="financial-section-heading__meta">{meta}</span> : null}
            {actions ? <div className="financial-section-heading__actions">{actions}</div> : null}
          </div>
        ) : null}
      </div>
      {description ? <p>{description}</p> : null}
    </div>
  )
}

export function FinancialSection({
  actions,
  children,
  className = '',
  description,
  eyebrow,
  meta,
  title,
  titleId,
}) {
  return (
    <section
      aria-labelledby={titleId}
      className={`page-card pne-overview-section financial-section${className ? ` ${className}` : ''}`}
    >
      <FinancialSectionHeader
        actions={actions}
        description={description}
        eyebrow={eyebrow}
        meta={meta}
        title={title}
        titleId={titleId}
      />
      {children}
    </section>
  )
}

export function FinancialMetricStrip({ children, className = '' }) {
  return <div className={`education-summary-grid financial-summary-grid${className ? ` ${className}` : ''}`}>{children}</div>
}

export function FinancialDetailHeader({ indicator }) {
  return (
    <div className="detail-heading educacao-detail-heading financial-detail-heading">
      <DetailHeadingText eyebrow="Indicador selecionado" title={indicator.label} />
      <div className="educacao-detail-heading__badges financial-detail-heading__badges" aria-label="Contexto do indicador">
        {indicator.moduleLabel ? <span className="indicator-stage-badge">{indicator.moduleLabel}</span> : null}
        {indicator.unitLabel ? <span className="indicator-stage-badge">{indicator.unitLabel}</span> : null}
      </div>
    </div>
  )
}

export function FinancialMetricGrid({ indicator }) {
  return (
    <div className="metric-grid metric-grid--four financial-metric-grid">
      <MetricCard
        accessibleValue={indicator.initialDisplay}
        icon="start"
        label="Valor inicial"
        value={indicator.initialDisplayCompact ?? indicator.initialDisplay ?? EM}
        detail={indicator.initialYear ? `Ano ${indicator.initialYear}` : null}
      />
      <MetricCard
        accessibleValue={indicator.currentDisplay}
        icon="current"
        label="Valor atual"
        value={indicator.currentDisplayCompact ?? indicator.currentDisplay ?? EM}
        detail={indicator.currentYear ? `Ano ${indicator.currentYear}` : null}
        size="large"
      />
      <MetricCard icon="current" label="Ano" value={indicator.currentYear ?? EM} />
      <MetricCard
        icon={indicator.variationRaw < 0 ? 'variationDown' : 'variation'}
        label="Variação"
        value={indicator.variationDisplay ?? EM}
        tone={indicator.variationTone ?? 'default'}
      />
    </div>
  )
}

export function FinancialQuickReading({ description, indicator, text, tone = 'default' }) {
  const cutLabel = buildFinancialCutLabel(indicator)
  if (!text && !description && !cutLabel) return null

  return (
    <aside className={`interpretation-box education-quick-reading financial-quick-reading financial-quick-reading--${tone}`} aria-label="Leitura rápida">
      <QuickReadingHeading />
      <ul className="financial-quick-reading__list">
        {text ? (
          <li>
            <FinancialInsightIcon name="trend" />
            <div>
              <span>Evolução observada</span>
              <p>{text}</p>
            </div>
          </li>
        ) : null}
        {description ? (
          <li>
            <FinancialInsightIcon name="measure" />
            <div>
              <span>O que o indicador mede</span>
              <p>{description}</p>
            </div>
          </li>
        ) : null}
        {cutLabel ? (
          <li>
            <FinancialInsightIcon name="cut" />
            <div>
              <span>Recorte exibido</span>
              <p><strong>{cutLabel}</strong></p>
            </div>
          </li>
        ) : null}
      </ul>
    </aside>
  )
}

function buildFinancialCutLabel(indicator) {
  if (!indicator) return ''
  const period = indicator.initialYear && indicator.currentYear
    ? `${indicator.initialYear} a ${indicator.currentYear}`
    : indicator.currentYear
      ? `Ano ${indicator.currentYear}`
      : ''
  return [indicator.moduleLabel, indicator.unitLabel, period].filter(Boolean).join(' · ')
}

function FinancialInsightIcon({ name }) {
  const paths = {
    trend: <><path d="M5 16 10 11l3 3 6-7" /><path d="M15 7h4v4" /></>,
    measure: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
    cut: <><path d="M5 6h14M8 12h8M10 18h4" /></>,
  }

  return (
    <svg aria-hidden="true" className="financial-quick-reading__icon" fill="none" viewBox="0 0 24 24">
      {paths[name] ?? paths.measure}
    </svg>
  )
}

export function FinancialChartFrame({ children, source, subtitle, summary, title = 'Histórico do indicador' }) {
  return (
    <div className="indicator-chart-card educacao-main-chart-card financial-chart-card">
      <IndicatorChartHeader className="financial-chart-header" subtitle={subtitle} summary={summary} title={title} />
      {children}
      {source}
    </div>
  )
}

export function FinancialSupportData({ children, subtitle = 'Tabela e recortes de apoio do indicador.' }) {
  if (!children) return null

  return (
    <details className="educacao-explore education-support-data financial-support-data platform-support-disclosure">
      <summary className="platform-support-disclosure__summary">
        <div>
          <span className="educacao-explore__eyebrow">Aprofundamento</span>
          <h3>Dados de apoio do indicador</h3>
          <p>{subtitle}</p>
        </div>
      </summary>
      <div className="educacao-explore__panel">
        {children}
      </div>
    </details>
  )
}

export function FinancialMethodologyDisclosure({ children }) {
  if (!children) return null

  return (
    <details className="platform-support-disclosure financial-methodology-disclosure">
      <summary className="platform-support-disclosure__summary">
        <div>
          <span className="educacao-explore__eyebrow">Referência técnica</span>
          <h3>Metodologia e fonte</h3>
          <p>Conceito, forma de cálculo, período e cuidados de interpretação.</p>
        </div>
      </summary>
      <div className="platform-support-disclosure__body">{children}</div>
    </details>
  )
}
