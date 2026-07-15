import type { ReactNode } from 'react'

interface ScenarioGridProps {
  children: ReactNode
  columns?: 'auto' | 'compact' | 'single'
}

interface ScenarioItemProps {
  children: ReactNode
  description?: string
  label: string
}

export function ScenarioGrid({ children, columns = 'auto' }: ScenarioGridProps) {
  return <div className={`dev-ui-scenario-grid dev-ui-scenario-grid--${columns}`}>{children}</div>
}

export function ScenarioItem({ children, description, label }: ScenarioItemProps) {
  return (
    <section className="dev-ui-scenario-item">
      <div className="dev-ui-scenario-item__heading">
        <h3>{label}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="dev-ui-scenario-item__content">{children}</div>
    </section>
  )
}

export function DisabledFixture({ children, label }: { children: ReactNode; label: string }) {
  return (
    <fieldset className="dev-ui-disabled-fixture" disabled aria-label={label}>
      {children}
    </fieldset>
  )
}
