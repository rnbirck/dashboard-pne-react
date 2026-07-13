import { DetailNavigation } from './DetailNavigation'
import { DetailHeadingText } from './HeadingText'
import { ExplorableIndicatorCardFrame } from './ExplorableIndicatorCardFrame'
import { IndicatorChartHeader } from './IndicatorChartHeader'
import { MetricCard } from './MetricCard'
import { StatusBadge } from './StatusBadge'

const EM = '\u2014'
const FINANCIAL_CARD_CLASS_CONTRACT = Object.freeze({
  root: 'financial-indicator-card',
  statusModifier: (tone) => `financial-indicator-card--${tone}`,
  topline: 'financial-indicator-card__topline',
  context: 'financial-indicator-card__module',
  title: 'financial-indicator-card__title',
  description: 'financial-indicator-card__description',
  valueRow: 'financial-indicator-card__value-row',
  support: 'financial-indicator-card__support',
  footer: 'financial-indicator-card__footer',
  sparkline: Object.freeze({
    root: 'financial-indicator-card__sparkline',
    area: 'financial-indicator-card__sparkline-area',
    line: 'financial-indicator-card__sparkline-line',
    end: 'financial-indicator-card__sparkline-end',
    period: 'financial-indicator-card__sparkline-period',
    empty: 'financial-indicator-card__sparkline--empty',
  }),
})

export function FinancialIndicatorCard({ buttonRef, indicator, isSelected = false, onSelect }) {
  const statusTone = indicator.statusTone ?? 'default'
  const viewModel = {
    ariaLabel: `Abrir detalhe do indicador ${indicator.label}. Valor atual: ${indicator.currentDisplay ?? EM}.`,
    contextLabel: indicator.moduleLabel ?? 'Financeiro',
    description: indicator.cardDescription ?? indicator.description,
    footer: {
      primary: indicator.unitLabel ?? 'Indicador',
      secondary: null,
    },
    sparklineSeries: indicator.series,
    status: {
      label: indicator.statusLabel ?? 'Com dados',
      tone: statusTone,
    },
    support: {
      label: indicator.variationLabel ?? 'Variação no período',
      value: indicator.variationDisplay ?? EM,
    },
    title: indicator.label,
    value: {
      display: indicator.currentDisplayCompact ?? indicator.currentDisplay ?? EM,
      metaLabel: indicator.currentYear ? `Ano ${indicator.currentYear}` : 'Ano indisponível',
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
      showBack={!isBottom}
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
      <DetailHeadingText eyebrow="Indicador selecionado" title={indicator.label} description={indicator.description} />
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
      <IndicatorChartHeader className="financial-chart-header" subtitle={subtitle} summary={summary} title={title} />
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
