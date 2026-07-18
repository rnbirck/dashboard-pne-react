import type { ReactNode } from 'react'

interface EducationSectionBarProps {
  description?: ReactNode
  eyebrow?: string
  filters?: ReactNode
  id?: string
  search?: ReactNode
  title: ReactNode
  variant?: 'section' | 'scenarios'
}

export function EducationSectionBar({
  description,
  eyebrow = 'Seção de indicadores',
  filters,
  id,
  search,
  title,
  variant = 'section',
}: EducationSectionBarProps) {
  return (
    <section className={`education-section-bar education-section-bar--${variant}`} aria-labelledby={id}>
      <div className="education-section-bar__identity">
        <span className="education-section-bar__eyebrow">{eyebrow}</span>
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {search || filters ? (
        <div className="education-section-bar__tools">
          {search}
          {filters}
        </div>
      ) : null}
    </section>
  )
}
