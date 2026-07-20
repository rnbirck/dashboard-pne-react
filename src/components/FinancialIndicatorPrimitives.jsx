import { DetailNavigation } from './DetailNavigation'
import { DetailHeadingText } from './HeadingText'
import { ExplorableIndicatorCardFrame } from './ExplorableIndicatorCardFrame'
import { IndicatorChartHeader } from './IndicatorChartHeader'
import { MetricCard } from './MetricCard'
import { QuickReadingHeading } from './QuickReadingHeading'
import { SearchField } from './SearchField'
import { EducationSectionBar } from '../features/education/components/EducationSectionBar'

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
  const reading = getFinancialReading({ direction, hasComparison, hasCurrentValue, hasSeries: comparableSeries.length > 0 })
  const description = String(indicator.cardDescription ?? indicator.description ?? '').trim()
  const statusLabel = normalizeFinancialStatusLabel(
    indicator.statusLabel ?? (hasCurrentValue ? 'Com dados' : 'Sem dados'),
  )
  const statusTone = statusLabel === 'Alta'
    ? 'success'
    : statusLabel === 'Queda'
      ? 'warning'
      : statusLabel === 'Estável'
        ? 'muted'
        : indicator.statusTone ?? 'default'
  const hasSeries = comparableSeries.length > 0
  const footerLabel = hasSeries ? 'Ver série histórica' : 'Abrir detalhes'
  const footerVisualLabel = hasSeries ? 'Histórico' : 'Detalhes'
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
      year: indicator.currentYear ?? 'Indisponível',
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

function normalizeFinancialStatusLabel(label) {
  if (label === 'Aumento' || label === 'Aumentou') return 'Alta'
  if (label === 'Redução' || label === 'Reduziu') return 'Queda'
  return label
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
  return (
    <div className="metric-grid metric-grid--four financial-metric-grid">
      <MetricCard
        icon="current"
        label="Valor inicial"
        value={indicator.initialDisplay ?? EM}
        detail={indicator.initialYear ? `Ano ${indicator.initialYear}` : null}
      />
      <MetricCard
        icon="comparison"
        label="Valor atual"
        value={indicator.currentDisplay ?? EM}
        detail={indicator.currentYear ? `Ano ${indicator.currentYear}` : null}
        size="large"
      />
      <MetricCard
        icon="variation"
        label="Variação no período"
        value={indicator.variationDisplay ?? EM}
        detail={indicator.initialYear && indicator.currentYear ? `${indicator.initialYear} a ${indicator.currentYear}` : null}
        tone={indicator.variationTone ?? 'default'}
      />
      <MetricCard icon="current" label="Ano de referência" value={indicator.currentYear ?? EM} />
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
  if (!indicators.length) return null
  const countLabel = `${indicators.length} ${indicators.length === 1 ? 'indicador' : 'indicadores'}`
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
        {indicators.map((indicator) => (
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
