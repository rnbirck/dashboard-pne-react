import type { ReactNode, Ref } from 'react'

export type EducationHeaderVariant = 'section' | 'detail' | 'scenarios' | 'methodology'

export type EducationContextIcon =
  | 'municipality'
  | 'section'
  | 'scope'
  | 'period'
  | 'cut'
  | 'source'
  | 'projection'

export interface EducationContextItem {
  icon?: EducationContextIcon
  label: string
  value: ReactNode
}

interface EducationBackLink {
  label?: string
  onClick?: () => void
  href?: string
}

interface EducationCompactHeaderProps {
  action?: ReactNode
  backLink?: EducationBackLink
  className?: string
  contextItems?: ReadonlyArray<EducationContextItem>
  description?: ReactNode
  eyebrow?: string
  headingRef?: Ref<HTMLHeadingElement>
  title: ReactNode
  variant?: EducationHeaderVariant
}

export function EducationCompactHeader({
  action,
  backLink,
  className = '',
  contextItems = [],
  description,
  eyebrow = 'Indicadores de Educação',
  headingRef,
  title,
  variant = 'section',
}: EducationCompactHeaderProps) {
  const inlineBackLink = variant === 'detail' ? undefined : backLink

  return (
    <header className={`education-compact-header education-compact-header--${variant}${className ? ` ${className}` : ''}`}>
      <div className="education-compact-header__copy">
        {backLink && !inlineBackLink ? <EducationHeaderBackLink backLink={backLink} /> : null}
        <span className="education-compact-header__eyebrow">{eyebrow}</span>
        <h1 ref={headingRef} tabIndex={-1}>{title}</h1>
        {description ? <p className="education-compact-header__description">{description}</p> : null}
      </div>

      {contextItems.length || action || inlineBackLink ? (
        <div className="education-compact-header__context-row">
          {contextItems.length ? (
            <div className="education-compact-header__context" aria-label="Contexto desta página">
              {contextItems.map((item) => (
                <EducationContextChip item={item} key={`${item.label}-${String(item.value)}`} />
              ))}
            </div>
          ) : null}
          {action || inlineBackLink ? (
            <div className="education-compact-header__action">
              {action}
              {inlineBackLink ? <EducationHeaderBackLink backLink={inlineBackLink} /> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}

function EducationContextChip({ item }: { item: EducationContextItem }) {
  return (
    <div className={`education-context-chip${item.label === 'Seção' ? ' education-context-chip--section' : ''}`}>
      <span className="education-context-chip__icon" aria-hidden="true">
        <EducationContextIconGlyph name={item.icon ?? 'scope'} />
      </span>
      <span className="education-context-chip__copy">
        <span className="education-context-chip__label">{item.label}</span>
        <strong className="education-context-chip__value">{item.value}</strong>
      </span>
    </div>
  )
}

function EducationHeaderBackLink({ backLink }: { backLink: EducationBackLink }) {
  const content = (
    <>
      <span aria-hidden="true">←</span>
      {backLink.label ?? 'Voltar aos indicadores'}
    </>
  )

  if (backLink.href) {
    return <a className="education-compact-header__back platform-navigation-button" href={backLink.href}>{content}</a>
  }

  return (
    <button className="education-compact-header__back platform-navigation-button" onClick={backLink.onClick} type="button">
      {content}
    </button>
  )
}

function EducationContextIconGlyph({ name }: { name: EducationContextIcon }) {
  const paths: Record<EducationContextIcon, ReactNode> = {
    municipality: <><path d="M4 20h16" /><path d="M6 20V9l6-4 6 4v11" /><path d="M9 20v-5h6v5" /></>,
    section: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" /></>,
    scope: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6" /><path d="M15 15c3 0 5 1.5 6 4" /></>,
    period: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
    cut: <><path d="M4 7h16" /><path d="M7 4v6" /><path d="M4 17h16" /><path d="M16 14v6" /></>,
    source: <><path d="M5 4h11l3 3v13H5z" /><path d="M16 4v4h4" /><path d="M8 12h8" /><path d="M8 16h6" /></>,
    projection: <><path d="M4 18V6" /><path d="M4 18h16" /><path d="m7 14 4-4 3 2 5-6" /></>,
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}
