import type { ReactNode } from 'react'
import { EducationCompactHeader } from '../education/components/EducationCompactHeader'

export type FinancialIconName = 'allocation' | 'budget' | 'fundeb' | 'payment' | 'resources' | 'trend'

export function FinancialCompactHeader({
  backHref,
  description,
}: {
  backHref: string
  description: string
}) {
  return (
    <EducationCompactHeader
      backLink={{ href: backHref, label: 'Voltar à visão geral de financiamento' }}
      className="financial-page-header financial-page-header--panorama"
      description={description}
      eyebrow="Financiamento da educação"
      title="Panorama financeiro"
    />
  )
}

export function FinancialMetricCard({
  children,
  icon,
  label,
  meta,
  tone = 'observed',
}: {
  children: ReactNode
  icon: FinancialIconName
  label: string
  meta: string
  tone?: 'forecast' | 'observed'
}) {
  return (
    <article className={`page-card municipal-finance-summary-card municipal-finance-summary-card--${tone}`}>
      <span className="municipal-finance-summary-card__icon" aria-hidden="true"><FinancialIcon name={icon} /></span>
      <span className="municipal-finance-summary-card__label">{label}</span>
      <div className="municipal-finance-summary-card__value">{children}</div>
      <p>{meta}</p>
    </article>
  )
}

export function FinancialDisclosure({
  children,
  label,
  className = '',
}: {
  children: ReactNode
  label: string
  className?: string
}) {
  return (
    <details className={`municipal-finance-disclosure${className ? ` ${className}` : ''}`}>
      <summary>{label}</summary>
      {children}
    </details>
  )
}

function FinancialIcon({ name }: { name: FinancialIconName }) {
  const paths: Record<FinancialIconName, ReactNode> = {
    allocation: <><path d="M4 19h16" /><path d="M6 16V9" /><path d="M12 16V5" /><path d="M18 16v-4" /></>,
    budget: <><path d="M5 5h14v14H5z" /><path d="M8 9h8" /><path d="M8 13h5" /></>,
    fundeb: <><path d="m3 9 9-5 9 5" /><path d="M5 10v8" /><path d="M9 10v8" /><path d="M15 10v8" /><path d="M19 10v8" /><path d="M3 20h18" /></>,
    payment: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /><path d="M7 15h4" /></>,
    resources: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6" /><path d="M15 15c3 0 5 1.5 6 4" /></>,
    trend: <><path d="M4 18V6" /><path d="M4 18h16" /><path d="m7 14 4-4 3 2 5-6" /></>,
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}
