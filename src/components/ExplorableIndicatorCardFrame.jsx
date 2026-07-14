import { InteractionChevron } from './InteractionChevron'
import { Sparkline } from './Sparkline'
import { StatusBadge } from './StatusBadge'

export function ExplorableIndicatorCardFrame({
  buttonRef,
  classContract,
  isSelected = false,
  onSelect,
  viewModel,
}) {
  const {
    anatomy,
    ariaLabel,
    contextLabel,
    description,
    footer,
    hideSparkline = false,
    hideStatus = false,
    hideSupport = false,
    insight,
    metadata,
    sparklineSeries,
    status,
    support,
    title,
    value,
    variant,
  } = viewModel
  const isEditorialCard = anatomy === 'education' || anatomy === 'financial'
  const statusTone = status?.tone ?? 'default'
  const variantClass = variant ? ` ${classContract.root}--${variant}` : ''
  const anatomyClass = anatomy ? ` indicator-card-shell--${anatomy}` : ''
  const directionClass = isEditorialCard && status?.direction ? ` indicator-card-shell--direction-${status.direction}` : ''
  const className = `${classContract.root} indicator-card-shell${anatomyClass} indicator-card-shell--${statusTone}${directionClass} interaction-card--explorable ${classContract.statusModifier(statusTone)}${variantClass}${isSelected ? ' is-selected' : ''}`

  return (
    <button
      className={className}
      ref={buttonRef}
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      title={title}
    >
      <span className={`${classContract.topline} indicator-card-shell__topline`}>
        <span className={`${classContract.context} indicator-card-shell__context`}>{contextLabel}</span>
        {!hideStatus && status?.label ? (
          <StatusBadge
            marker={isEditorialCard ? status.marker : undefined}
            status={status.label}
            tone={statusTone}
          />
        ) : null}
      </span>

      <span className={`${classContract.title} indicator-card-shell__title`}>{title}</span>
      <span className={`${classContract.description} indicator-card-shell__description`}>{description}</span>

      {isEditorialCard ? (
        <>
          <span className={`${classContract.valueRow} indicator-card-shell__value-row`}>
            <strong>{value.display}</strong>
            {value.metaLabel ? <span>{value.metaLabel}</span> : null}
          </span>

          <span className={`${classContract.metadata} indicator-card-shell__metadata`}>
            <span className={`${classContract.metadataItem} indicator-card-shell__metadata-item`}>
              <span className={`${classContract.metadataLabel} indicator-card-shell__metadata-label`}>Ano</span>
              <strong className={`${classContract.metadataValue} indicator-card-shell__metadata-value`}>{metadata.year}</strong>
            </span>
            {metadata.variation ? (
              <span className={`${classContract.metadataItem} indicator-card-shell__metadata-item`}>
                <span className={`${classContract.metadataLabel} indicator-card-shell__metadata-label`}>{metadata.variation.label}</span>
                <strong className={`${classContract.metadataValue} indicator-card-shell__metadata-value indicator-card-shell__metadata-value--variation`}>{metadata.variation.value}</strong>
              </span>
            ) : null}
          </span>

          <span className={`${classContract.divider} indicator-card-shell__divider`} aria-hidden="true" />

          <span className={`${classContract.insight} indicator-card-shell__insight`}>
            <span className={`${classContract.insightItem} indicator-card-shell__insight-item`}>
              <span className={`${classContract.insightLabel} indicator-card-shell__insight-label`}>Leitura</span>
              <strong className={`${classContract.insightValue} indicator-card-shell__insight-value`}>{insight.reading}</strong>
            </span>
            {insight.period ? (
              <span className={`${classContract.insightItem} indicator-card-shell__insight-item`}>
                <span className={`${classContract.insightLabel} indicator-card-shell__insight-label`}>Período</span>
                <strong className={`${classContract.insightValue} indicator-card-shell__insight-value`}>{insight.period}</strong>
              </span>
            ) : null}
          </span>
        </>
      ) : (
        <>
          <span className={`${classContract.valueRow} indicator-card-shell__value-row`}>
            <strong>{value.display}</strong>
            <span>{value.metaLabel}</span>
          </span>

          {!hideSupport && support ? (
            <span className={`${classContract.support} indicator-card-shell__support`}>
              <span>{support.label}</span>
              <strong>{support.value}</strong>
            </span>
          ) : null}

          {!hideSparkline ? <Sparkline series={sparklineSeries} classNames={classContract.sparkline} /> : null}
        </>
      )}

      <span className={`${classContract.footer} indicator-card-shell__footer`}>
        {footer.primary ? <span title={footer.primary}>{footer.primary}</span> : null}
        {footer.secondary ? <span title={footer.secondary}>{footer.secondary}</span> : null}
        {footer.actionLabel ? (
          <span
            className={`${classContract.action ?? 'indicator-card-shell__action'} indicator-card-shell__action`}
            aria-hidden="true"
            title={footer.actionLabel}
          >
            <InteractionChevron />
          </span>
        ) : (
          <InteractionChevron />
        )}
      </span>
    </button>
  )
}
