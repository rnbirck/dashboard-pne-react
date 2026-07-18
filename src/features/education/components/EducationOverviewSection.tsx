import { EducationSummaryCard } from '../../../components/EducationSummaryCard.jsx'
import { EDUCATION_SECTION_KEYS } from '../../../data/educationIndicatorCatalog.js'
import { formatIndicatorCount } from '../educationFormatters'
import { EducationSectionBar } from './EducationSectionBar'

interface EducationOverviewCardModel {
  label: string
  tone?: string
  value: unknown
  year?: number | string | null
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
          <EducationSummaryCard accessibleValue={undefined} detail={undefined} key={card.label} label={card.label} value={card.value} year={card.year} tone={card.tone} />
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
              <span className="education-section-link__title">{section.label}</span>
              <span className="education-section-link__description">{section.description}</span>
              {section.indicatorKeys.length > 0 ? (
                <span className="education-section-link__meta">{formatIndicatorCount(section.indicatorKeys.length)}</span>
              ) : null}
            </a>
          ))}
        </nav>

        {methodology ? (
          <a className="education-section-link education-section-link--secondary" href={`#educacao?secao=${methodology.key}`}>
            <span className="education-section-link__title">{methodology.label}</span>
            <span className="education-section-link__description">{methodology.description}</span>
          </a>
        ) : null}
      </section>
    </div>
  )
}
