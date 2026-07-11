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
    sparklineSeries,
    status,
    support,
    title,
    value,
  } = viewModel
  const className = `${classContract.root} interaction-card--explorable ${classContract.statusModifier(status.tone)}${isSelected ? ' is-selected' : ''}`

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
      <span className={classContract.topline}>
        <span className={classContract.context}>{contextLabel}</span>
        <StatusBadge status={status.label} tone={status.tone} />
      </span>

      <span className={classContract.title}>{title}</span>
      <span className={classContract.description}>{description}</span>

      <span className={classContract.valueRow}>
        <strong>{value.display}</strong>
        <span>{value.metaLabel}</span>
      </span>

      <span className={classContract.support}>
        <span>{support.label}</span>
        <strong>{support.value}</strong>
      </span>

      <Sparkline series={sparklineSeries} classNames={classContract.sparkline} />

      <span className={classContract.footer}>
        <span>{footer.primary}</span>
        {footer.secondary ? <span>{footer.secondary}</span> : null}
        <InteractionChevron />
      </span>
    </button>
  )
}
