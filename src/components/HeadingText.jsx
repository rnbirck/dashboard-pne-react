export function DetailHeadingText({ description, eyebrow, level = 3, title }) {
  const Heading = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3'

  return (
    <div className="detail-heading__copy">
      <span className="eyebrow">{eyebrow}</span>
      <Heading data-detail-title tabIndex={-1}>{title}</Heading>
      {description ? <p>{description}</p> : null}
    </div>
  )
}
