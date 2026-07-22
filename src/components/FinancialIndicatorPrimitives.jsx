import { DetailNavigation } from './DetailNavigation'
import { DetailHeadingText } from './HeadingText'
import { ExplorableIndicatorCardFrame } from './ExplorableIndicatorCardFrame'
import { IndicatorChartHeader } from './IndicatorChartHeader'
import { MetricCard } from './MetricCard'
import { QuickReadingHeading } from './QuickReadingHeading'
import { SearchField } from './SearchField'
import { EducationSectionBar } from '../features/education/components/EducationSectionBar'
import {
  isPublishableFinancialDisplay,
  isPublishableFinancialIndicator,
} from '../utils/financialPresentation'

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
  if (!isPublishableFinancialIndicator(indicator)) return null

  const comparableSeries = getComparableSeries(indicator.series)
  const hasComparison = comparableSeries.length >= 2
    && indicator.initialYear !== null
    && indicator.initialYear !== undefined
    && indicator.currentYear !== null
    && indicator.currentYear !== undefined
    && indicator.variationDisplay
    && indicator.variationDisplay !== EM
  const direction = getFinancialDirection({ hasComparison, series: comparableSeries })
  const reading = getFinancialReading({ direction, hasComparison, currentYear: indicator.currentYear })
  const description = String(indicator.cardDescription ?? indicator.description ?? '').trim()
  const statusLabel = normalizeFinancialStatusLabel(indicator.statusLabel)
  const statusTone = statusLabel === 'Alta'
    ? 'success'
    : statusLabel === 'Queda'
      ? 'warning'
      : statusLabel === 'Estável'
        ? 'muted'
        : indicator.statusTone ?? 'default'
  const hasHistoricalSeries = comparableSeries.length >= 2
  const footerLabel = hasHistoricalSeries ? 'Ver série histórica' : 'Abrir detalhes'
  const footerVisualLabel = hasHistoricalSeries ? 'Histórico' : 'Detalhes'
  const viewModel = {
    anatomy: 'financial',
    ariaLabel: [
      `Abrir detalhe do indicador ${indicator.label}.`,
      `Valor ${indicator.currentDisplay ?? EM},`,
      `ano ${indicator.currentYear}.`,
      statusLabel ? `${statusLabel}.` : '',
      hasComparison ? `${indicator.variationLabel}: ${indicator.variationDisplay}.` : '',
      description ? `Descrição: ${description}.` : '',
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
    contextLabel: indicator.moduleLabel ?? 'Financeiro',
    description,
    footer: {
      icon: null,
      primary: indicator.groupLabel ?? indicator.moduleLabel ?? footerVisualLabel,
      actionLabel: footerLabel,
    },
    insight: {
      context: null,
      direction,
      emphasis: reading,
      marker: null,
      reading,
      period: null,
    },
    metadata: {
      year: indicator.currentYear,
      variation: hasComparison
        ? {
            label: `Var. desde ${indicator.initialYear}`,
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
    variant: 'catalog',
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

function getFinancialDirection({ hasComparison, series }) {
  if (!hasComparison) return null
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

function normalizeFinancialStatusLabel(label) {
  if (!label) return null
  if (label === 'Aumento' || label === 'Aumentou') return 'Alta'
  if (label === 'Redução' || label === 'Reduziu') return 'Queda'
  return label
}

function getFinancialReading({ direction, hasComparison, currentYear }) {
  if (!hasComparison) return `Valor informado para ${currentYear}`
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
      showBack
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
      <DetailHeadingText description={indicator.description} eyebrow="Indicador selecionado" level={1} title={indicator.label} />
      <div className="educacao-detail-heading__badges financial-detail-heading__badges" aria-label="Contexto do indicador">
        {indicator.moduleLabel ? <span className="indicator-stage-badge">{indicator.moduleLabel}</span> : null}
        {indicator.unitLabel ? <span className="indicator-stage-badge">{indicator.unitLabel}</span> : null}
      </div>
    </div>
  )
}

export function FinancialMetricGrid({ indicator }) {
  const hasInitialValue = isPublishableFinancialDisplay(indicator.initialDisplay)
  const hasCurrentValue = isPublishableFinancialDisplay(indicator.currentDisplay)
  const hasVariation = isPublishableFinancialDisplay(indicator.variationDisplay)
    && indicator.initialYear !== indicator.currentYear
  const metrics = [
    hasInitialValue && indicator.initialYear !== indicator.currentYear ? (
      <MetricCard
        icon="current"
        key="initial"
        label="Valor inicial"
        value={indicator.initialDisplay}
        detail={indicator.initialYear ? `Ano ${indicator.initialYear}` : null}
      />
    ) : null,
    hasCurrentValue ? (
      <MetricCard
        icon="comparison"
        key="current"
        label="Valor atual"
        value={indicator.currentDisplay}
        detail={indicator.currentYear ? `Ano ${indicator.currentYear}` : null}
        size="large"
      />
    ) : null,
    hasVariation ? (
      <MetricCard
        icon="variation"
        key="variation"
        label="Variação no período"
        value={indicator.variationDisplay}
        detail={indicator.initialYear && indicator.currentYear ? `${indicator.initialYear} a ${indicator.currentYear}` : null}
        tone={indicator.variationTone ?? 'default'}
      />
    ) : null,
    indicator.currentYear ? (
      <MetricCard icon="current" key="year" label="Ano de referência" value={indicator.currentYear} />
    ) : null,
  ].filter(Boolean)

  if (!metrics.length) return null

  return (
    <div className="metric-grid metric-grid--four financial-metric-grid">
      {metrics}
    </div>
  )
}

export function FinancialCatalogSectionBar({ count, description, onSearchChange, searchQuery, title, titleId }) {
  const countLabel = `${count} ${count === 1 ? 'indicador' : 'indicadores'}`

  return (
    <EducationSectionBar
      description={description}
      id={titleId}
      search={(
        <div className="education-section-bar__search financial-catalog-search">
          <div>
            <span className="eyebrow">Indicadores da seção</span>
            <strong className="education-section-filter-count">{countLabel}</strong>
          </div>
          <SearchField
            ariaLabel="Buscar indicador"
            className="cycle-search platform-search-field"
            onChange={(event) => onSearchChange(event.target.value)}
            onClear={() => onSearchChange('')}
            placeholder="Buscar indicador..."
            value={searchQuery}
          />
        </div>
      )}
      title={title}
    />
  )
}

export function FinancialIndicatorGroup({
  description,
  indicators,
  label,
  onSelect,
  registerCard,
  groupKey,
}) {
  const publishableIndicators = indicators.filter(isPublishableFinancialIndicator)
  if (!publishableIndicators.length) return null
  const countLabel = `${publishableIndicators.length} ${publishableIndicators.length === 1 ? 'indicador' : 'indicadores'}`
  const titleId = `financial-group-${groupKey}`

  return (
    <section className="education-indicator-group financial-indicator-group" aria-labelledby={titleId}>
      <div className="education-indicator-group__heading">
        <div>
          <span className="eyebrow">Indicadores relacionados</span>
          <h3 id={titleId}>{label}</h3>
        </div>
        <span>{countLabel}</span>
      </div>
      {description ? <p className="education-indicator-group__description">{description}</p> : null}
      <div className="education-indicator-card-grid financial-indicator-card-grid">
        {publishableIndicators.map((indicator) => (
          <FinancialIndicatorCard
            buttonRef={(node) => registerCard(indicator.key, node)}
            indicator={indicator}
            isSelected={false}
            key={indicator.key}
            onSelect={() => onSelect(indicator.key)}
          />
        ))}
      </div>
    </section>
  )
}

function FinancialQuickReadingIcon({ name }) {
  const paths = {
    measure: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
    period: <><path d="M5 6h14M8 12h8M10 18h4" /></>,
    trend: <><path d="m5 15 4-4 3 3 7-7" /><path d="M15 7h4v4" /></>,
  }

  return (
    <svg aria-hidden="true" className="education-quick-reading__icon" fill="none" viewBox="0 0 24 24">
      {paths[name] ?? paths.measure}
    </svg>
  )
}

function getFinancialReadingItems({ description, indicator, metadata, readingGuide, text }) {
  const period = indicator?.initialYear && indicator?.currentYear
    ? `${indicator.initialYear} a ${indicator.currentYear}`
    : indicator?.currentYear
      ? String(indicator.currentYear)
      : EM

  return [
    { icon: 'trend', label: 'Evolução observada', text: text ?? indicator?.quickReading },
    { icon: 'measure', label: 'O que o indicador mede', text: readingGuide?.oQueMede ?? metadata?.measures ?? description },
    { emphasis: true, icon: 'period', label: 'Recorte exibido', text: period },
  ].filter((item) => item.text)
}

export function FinancialQuickReading({ description, indicator, metadata, readingGuide, text }) {
  const items = getFinancialReadingItems({ description, indicator, metadata, readingGuide, text })
  if (!items.length) return null

  return (
    <aside className="interpretation-box education-quick-reading financial-quick-reading" aria-label="Leitura rápida do indicador">
      <QuickReadingHeading />
      <ul className="education-quick-reading__list">
        {items.map((item) => (
          <li key={item.label}>
            <FinancialQuickReadingIcon name={item.icon} />
            <div>
              <span>{item.label}</span>
              <p>{item.emphasis ? <strong>{item.text}</strong> : item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export function FinancialPrimaryAnalysis({ children }) {
  return (
    <div className="financial-primary-analysis">
      {children}
    </div>
  )
}

export function FinancialChartFrame({ children, source, subtitle, summary, title = 'Evolução do indicador' }) {
  return (
    <div className="indicator-chart-card educacao-main-chart-card financial-chart-card">
      <IndicatorChartHeader className="financial-chart-header" subtitle={subtitle} summary={summary} title={title} />
      {children}
      {source}
    </div>
  )
}

export function FinancialSourcesFooter({ children, periods, source }) {
  if (!source && !periods && !children) return null

  return (
    <footer className="financial-sources-footer">
      <div className="financial-sources-footer__heading">
        <span className="eyebrow">Referências oficiais</span>
        <h2>Fontes e metodologia</h2>
      </div>
      {source ? <p><strong>Fonte oficial:</strong> {source}</p> : null}
      {periods ? <p>{periods}</p> : null}
      {children ? (
        <details className="platform-support-disclosure financial-sources-footer__details">
          <DisclosureSummary description="Critérios de publicação e cuidados de interpretação." title="Consultar detalhes" />
          <div className="platform-support-disclosure__body">{children}</div>
        </details>
      ) : null}
    </footer>
  )
}

function DisclosureSummary({ description, title }) {
  return (
    <summary className="platform-support-disclosure__summary">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </summary>
  )
}
