import { InteractionChevron } from './InteractionChevron'

export function NavigationEntryCard({
  ariaLabel,
  bodyText,
  footerText,
  href,
  icon: Icon,
  indicator,
  onClick,
  title,
}) {
  const Tag = href ? 'a' : 'button'
  const interactionProps = href
    ? { href }
    : { onClick, type: 'button' }

  return (
    <Tag
      aria-label={ariaLabel ?? `Abrir ${title}`}
      className="platform-entry-card home-entry-card interaction-card--navigation"
      {...interactionProps}
    >
      {Icon ? (
        <span className="platform-entry-card__icon home-entry-card__icon" aria-hidden="true">
          <Icon />
        </span>
      ) : (
        <span className="platform-entry-card__indicator" aria-label={`${indicator} indicadores`}>
          <span aria-hidden="true" />
          {indicator}
        </span>
      )}
      <strong className="platform-entry-card__title">{title}</strong>
      {bodyText ? <p className="platform-entry-card__description">{bodyText}</p> : null}
      <span className="platform-entry-card__footer home-entry-card__footer">
        <span>{footerText}</span>
        <InteractionChevron className="interaction-chevron--navigation" />
      </span>
    </Tag>
  )
}
