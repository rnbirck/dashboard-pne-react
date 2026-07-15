import { IndicatorProjectionPanel } from '../../../components/IndicatorProjectionPanel.jsx'
import {
  EDUCATION_DEMAND_GROUP_CATALOG,
  EDUCATION_DEMAND_INDICATOR_CATALOG,
} from '../../../data/educationIndicatorCatalog.js'
import { formatNumber, formatPercent } from '../../../utils/educationFormatters.js'
import { formatIndicatorCount } from '../educationFormatters'
import { buildProjectionHistory } from '../educationViewModels'
import type { EducationMunicipioData } from '../educationTypes'

interface EducationDemandIndicatorModel {
  ageRange: string
  key: string
  populationLabel: string
  source: string
  title: string
}

interface EducationDemandSectionProps {
  municipioData?: EducationMunicipioData | null
}

interface EducationDemandIndicatorProps {
  indicator: EducationDemandIndicatorModel
  projection: unknown
}

export function EducationDemandSection({ municipioData }: EducationDemandSectionProps) {
  const projections = municipioData?.pne_2026_2036?.projecoes ?? {}

  return (
    <div className="education-demand-page">
      <section className="page-card education-thematic-heading" aria-labelledby="education-demand-title">
        <span className="eyebrow">Seção de indicadores</span>
        <h2 id="education-demand-title">Demanda e projeções</h2>
        <p>Cenários estimados de atendimento a partir do histórico municipal disponível e da população de referência por faixa etária. Cada indicador separa o observado de um cenário estimado até 2036; a projeção apoia o planejamento, mas não é uma previsão oficial.</p>
      </section>

      <details className="page-card education-demand-note">
        <summary>Nota metodológica</summary>
        <p>Os indicadores consideram os dados disponíveis para o município. Matrículas localizadas no território não representam necessariamente a residência dos estudantes. As projeções são cenários estimados e não constituem previsão oficial nem cálculo direto de déficit de vagas.</p>
      </details>

      {EDUCATION_DEMAND_GROUP_CATALOG.map((group) => (
        <section className="education-indicator-group education-demand-group" key={group.key} aria-labelledby={`education-demand-group-${group.key}`}>
          <div className="education-indicator-group__heading">
            <div>
              <span className="eyebrow">Demanda e projeções</span>
              <h3 id={`education-demand-group-${group.key}`}>{group.label}</h3>
            </div>
            <span>{formatIndicatorCount(group.indicatorKeys.length)}</span>
          </div>
          <p className="education-indicator-group__description">{group.description}</p>
          <div className="education-demand-indicator-grid">
            {group.indicatorKeys.map((indicatorKey) => {
              const indicator = EDUCATION_DEMAND_INDICATOR_CATALOG.find((item) => item.key === indicatorKey)
              return indicator ? (
                <EducationDemandIndicator
                  indicator={indicator}
                  key={indicator.key}
                  projection={projections[indicator.key]}
                />
              ) : null
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function EducationDemandIndicator({ indicator, projection }: EducationDemandIndicatorProps) {
  const history = buildProjectionHistory(projection)
  const latest = history.at(-1)
  const firstYear = history[0]?.year
  const lastYear = latest?.year
  const historyLabel = history.length > 1 && firstYear && lastYear
    ? `${firstYear}–${lastYear} · ${history.length} anos`
    : history.length === 1 && firstYear
      ? `${firstYear} · 1 ano`
      : 'Não disponível para o município'
  const population = latest?.population

  return (
    <article className="page-card education-demand-indicator" aria-labelledby={`education-demand-indicator-${indicator.key}`}>
      <div className="education-demand-indicator__heading">
        <div>
          <span className="eyebrow">{indicator.populationLabel}</span>
          <h4 id={`education-demand-indicator-${indicator.key}`}>{indicator.title}</h4>
        </div>
        <span className="education-demand-indicator__age">Faixa etária: {indicator.ageRange}</span>
      </div>

      <dl className="education-demand-indicator__metadata">
        <div>
          <dt>Último valor observado</dt>
          <dd>{latest ? `${formatPercent(latest.value)} · ${latest.year}` : '—'}</dd>
        </div>
        <div>
          <dt>Histórico disponível</dt>
          <dd>{historyLabel}</dd>
        </div>
        <div>
          <dt>População de referência</dt>
          <dd>{population == null ? '—' : `${formatNumber(population)} pessoas · ${lastYear}`}</dd>
        </div>
      </dl>

      <IndicatorProjectionPanel chartLabel={indicator.title} contextOnly projection={projection} />
      <p className="education-demand-indicator__source"><strong>Fonte:</strong> {indicator.source}</p>
    </article>
  )
}
