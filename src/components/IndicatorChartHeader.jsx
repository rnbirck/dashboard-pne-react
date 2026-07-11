export function IndicatorChartHeader({ children, className = '', eyebrow = 'Série histórica', hasWideSegmented = false, subtitle, summary, title }) {
  return (
    <div className={`indicator-chart-header${hasWideSegmented ? ' has-wide-segmented' : ''}${className ? ` ${className}` : ''}`}>
      <div className="indicator-chart-title-group">
        {eyebrow ? <span className="indicator-chart-eyebrow">{eyebrow}</span> : null}
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
        {summary ? <p className="indicator-chart-summary">{summary}</p> : null}
      </div>
      {children}
    </div>
  )
}
