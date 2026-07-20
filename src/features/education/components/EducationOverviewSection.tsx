import type { ReactNode } from 'react'
import { EducationSummaryCard } from '../../../components/EducationSummaryCard.jsx'
import { EDUCATION_SECTION_KEYS } from '../../../data/educationIndicatorCatalog.js'
import { formatIndicatorCount } from '../educationFormatters'
import { EducationSectionBar } from './EducationSectionBar'

interface EducationOverviewCardModel {
  detail?: string
  icon?: EducationOverviewIconName
  key?: string
  label: string
  tone?: string
  value: unknown
  year?: number | string | null
}

type EducationOverviewIconName =
  | 'approval'
  | 'classroom'
  | 'demand'
  | 'enrollment'
  | 'ideb'
  | 'infrastructure'
  | 'methodology'
  | 'modalities'
  | 'professionals'
  | 'school'
  | 'teacher'
  | 'technical'
  | 'trajectory'

const SECTION_ICONS: Partial<Record<string, EducationOverviewIconName>> = {
  [EDUCATION_SECTION_KEYS.attendance]: 'enrollment',
  [EDUCATION_SECTION_KEYS.trajectory]: 'trajectory',
  [EDUCATION_SECTION_KEYS.professionals]: 'professionals',
  [EDUCATION_SECTION_KEYS.infrastructure]: 'infrastructure',
  [EDUCATION_SECTION_KEYS.modalities]: 'modalities',
  [EDUCATION_SECTION_KEYS.demand]: 'demand',
  [EDUCATION_SECTION_KEYS.methodology]: 'methodology',
}

interface EducationOverviewNavigationItem {
  description: string
  indicatorKeys: string[]
  key: string
  label: string
}

interface EducationOverviewSectionProps {
  overview: ReadonlyArray<EducationOverviewCardModel>
  sections: ReadonlyArray<EducationOverviewNavigationItem>
}

function EducationOverviewCards({ overview }: Pick<EducationOverviewSectionProps, 'overview'>) {
  return (
    <section className="page-card education-summary-section educacao-overview">
      <div className="education-summary-grid educacao-overview-grid">
        {overview.map((card) => (
          <EducationSummaryCard
            accessibleValue={undefined}
            detail={card.detail}
            icon={<EducationOverviewIcon name={card.icon ?? 'ideb'} />}
            key={card.key ?? card.label}
            label={card.label}
            value={card.value}
            year={card.year ?? undefined}
            tone={card.tone}
          />
        ))}
      </div>
    </section>
  )
}


export function EducationOverviewSection({ overview, sections }: EducationOverviewSectionProps) {
  const methodology = sections.find((section) => section.key === EDUCATION_SECTION_KEYS.methodology)
  const navigableSections = sections.filter((section) => (
    section.key !== EDUCATION_SECTION_KEYS.overview
    && section.key !== EDUCATION_SECTION_KEYS.methodology
  ))

  return (
    <div className="education-overview-page">
      <EducationSectionBar
        description="Últimos dados disponíveis por bloco, com o ano de referência em cada indicador."
        id="education-overview-title"
        title="Visão geral"
      />
      <EducationOverviewCards overview={overview} />

      <section className="page-card education-section-navigation" aria-labelledby="education-section-navigation-title">
        <div className="education-section-navigation__heading">
          <div>
            <span className="eyebrow">Áreas de análise</span>
            <h2 id="education-section-navigation-title">Explore os indicadores por seção</h2>
          </div>
          <p>{'Escolha uma se\u00e7\u00e3o para consultar seus indicadores e detalhamentos.'}</p>
        </div>

        <nav className="education-section-link-grid" aria-label="Seções de indicadores da educação">
          {navigableSections.map((section) => (
            <a className="education-section-link" href={`#educacao?secao=${section.key}`} key={section.key}>
              <span className="education-section-link__icon" aria-hidden="true"><EducationOverviewIcon name={SECTION_ICONS[section.key] ?? 'ideb'} /></span>
              <span className="education-section-link__copy">
                <span className="education-section-link__title">{section.label}</span>
                <span className="education-section-link__description">{section.description}</span>
                {section.indicatorKeys.length > 0 ? (
                  <span className="education-section-link__meta">{formatIndicatorCount(section.indicatorKeys.length)}</span>
                ) : null}
              </span>
              <span className="education-section-link__arrow" aria-hidden="true">›</span>
            </a>
          ))}
        </nav>

        {methodology ? (
          <a className="education-section-link education-section-link--secondary" href={`#educacao?secao=${methodology.key}`}>
            <span className="education-section-link__icon" aria-hidden="true"><EducationOverviewIcon name="methodology" /></span>
            <span className="education-section-link__copy education-section-link__copy--secondary">
              <span className="education-section-link__title">{methodology.label}</span>
              <span className="education-section-link__description">{methodology.description}</span>
            </span>
            <span className="education-section-link__arrow" aria-hidden="true">›</span>
          </a>
        ) : null}
      </section>
    </div>
  )
}

function EducationOverviewIcon({ name }: { name: EducationOverviewIconName }) {
  const paths: Record<EducationOverviewIconName, ReactNode> = {
    enrollment: <><circle cx="8" cy="8" r="2.5" /><circle cx="16" cy="8" r="2.5" /><path d="M3.5 19c.4-3.7 1.9-5.6 4.5-5.6s4.1 1.9 4.5 5.6" /><path d="M11.5 19c.4-3.7 1.9-5.6 4.5-5.6s4.1 1.9 4.5 5.6" /></>,
    school: <><path d="m3 10 9-6 9 6" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /><path d="M9 10h6" /></>,
    teacher: <><circle cx="12" cy="7" r="3" /><path d="M5 20c.5-4.5 2.8-7 7-7s6.5 2.5 7 7" /><path d="m17 4 1.5 1.5L21 3" /></>,
    classroom: <><circle cx="7" cy="9" r="2" /><circle cx="12" cy="7" r="2.5" /><circle cx="17" cy="9" r="2" /><path d="M3.5 19c.3-3 1.5-4.6 3.5-4.6" /><path d="M7 19c.4-4 2-6 5-6s4.6 2 5 6" /><path d="M17 14.4c2 0 3.2 1.6 3.5 4.6" /></>,
    approval: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16.5 8" /></>,
    ideb: <><path d="M5 20V11" /><path d="M10 20V7" /><path d="M15 20V4" /><path d="M20 20V9" /></>,
    technical: <><path d="M4 6h16v11H4z" /><path d="M8 21h8" /><path d="M12 17v4" /></>,
    trajectory: <><path d="M4 17c3-7 5-2 8-8s5-1 8-5" /><path d="m15 4 5-.5-.5 5" /><circle cx="5" cy="17" r="1" /></>,
    professionals: <><circle cx="10" cy="7" r="3" /><path d="M4 20c.5-4.5 2.5-7 6-7s5.5 2.5 6 7" /><path d="M17 5h4" /><path d="M19 3v4" /></>,
    infrastructure: <><path d="m3 9 9-5 9 5" /><path d="M5 10h14" /><path d="M6 18h12" /><path d="M4 21h16" /><path d="M8 10v8M12 10v8M16 10v8" /></>,
    modalities: <><circle cx="7" cy="7" r="2" /><circle cx="17" cy="7" r="2" /><path d="M3 19v-3c0-3 1.5-5 4-5s4 2 4 5v3" /><path d="M13 19v-3c0-3 1.5-5 4-5s4 2 4 5v3" /><path d="M9 20h6" /></>,
    demand: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /><path d="m8 4 1.5 2" /></>,
    methodology: <><path d="M6 3h9l3 3v15H6z" /><path d="M15 3v4h4" /><path d="M9 11h6M9 15h6M9 19h4" /></>,
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}
