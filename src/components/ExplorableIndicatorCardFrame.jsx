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
    ariaLabel,
    contextLabel,
    description,
    footer,
    hideSparkline = false,
    hideStatus = false,
    hideSupport = false,
    sparklineSeries,
    status,
    support,
    title,
    value,
    variant,
  } = viewModel
  const statusTone = status?.tone ?? 'default'
  const variantClass = variant ? ` ${classContract.root}--${variant}` : ''
  const className = `${classContract.root} indicator-card-shell indicator-card-shell--${statusTone} interaction-card--explorable ${classContract.statusModifier(statusTone)}${variantClass}${isSelected ? ' is-selected' : ''}`

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
        {!hideStatus && status?.label ? <StatusBadge status={status.label} tone={statusTone} /> : null}
      </span>

      <span className={`${classContract.title} indicator-card-shell__title`}>{title}</span>
      <span className={`${classContract.description} indicator-card-shell__description`}>{description}</span>

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

      <span className={`${classContract.footer} indicator-card-shell__footer`}>
        {footer.primary ? <span title={footer.primary}>{footer.primary}</span> : null}
        {footer.secondary ? <span title={footer.secondary}>{footer.secondary}</span> : null}
        <InteractionChevron />
      </span>
    </button>
  )
}
