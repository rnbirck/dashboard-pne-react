import { MethodologyNotice } from './MethodologyNotice'

export function EducationSection({ id, title, children, avisos }) {
  return (
    <section className="education-section" id={id}>
      <div className="education-section__heading">
        <div>
          <span className="eyebrow">Indicadores da Educação</span>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="education-section__body">
        {children}
      </div>
      <MethodologyNotice avisos={avisos} />
    </section>
  )
}
