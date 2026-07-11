export function DetailHeadingText({ description, eyebrow, title }) {
  return (
    <div className="detail-heading__copy">
      <span className="eyebrow">{eyebrow}</span>
      <h3 data-detail-title tabIndex={-1}>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  )
}

export function PageHeadingText({ description, eyebrow, title }) {
  return (
    <>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </>
  )
}
