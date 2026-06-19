import { MethodologyNotice } from './MethodologyNotice'

export function EducationSection({ id, title, description, children, avisos }) {
  return (
    <section className="education-section" id={id}>
      <div className="education-section__heading">
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>
      <div className="education-section__body">
        {children}
      </div>
      <MethodologyNotice avisos={avisos} />
    </section>
  )
}
