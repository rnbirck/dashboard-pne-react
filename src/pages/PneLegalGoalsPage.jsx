import { useMemo, useState } from 'react'
import { DataSourceNote } from '../components/DataSourceNote'
import { MunicipalitySelector } from '../components/MunicipalitySelector'
import {
  PNE_2026_LEGAL_GOAL_INDICATOR_MAP,
  PNE_2026_LEGAL_GOAL_MAPPING_METADATA,
} from '../data/pne2026LegalGoalIndicatorMap'
import {
  formatIndicatorValue,
  formatMetaValue,
  getIndicatorTitle,
  resolveIndicatorUnit,
  roundPpString,
} from '../utils/format'
import { normalizePopulationPercentResults } from '../utils/indicatorValues'

const PNE_2026_CYCLE = 'pne_2026_2036'
const EMPTY_ARRAY = []

const COVERAGE_LABELS = {
  aproximada: 'Indicador aproximado',
  direta: 'Indicador direto',
  parcial: 'Cobertura parcial',
}

const COVERAGE_FILTERS = [
  { label: 'Todas as coberturas', value: 'todos' },
  { label: 'Indicador direto', value: 'direta' },
  { label: 'Parcial ou aproximada', value: 'parcial_aproximada' },
  { label: 'Sem indicador municipal', value: 'sem_indicador' },
]

const PERCENT_FORMATTER = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

export function PneLegalGoalsPage({
  indicadores,
  municipioData,
  municipios = EMPTY_ARRAY,
  onMunicipioChange,
  onNavigate,
  selectedMunicipio,
}) {
  const [expandedGoalIds, setExpandedGoalIds] = useState(() => new Set())
  const [objectiveFilter, setObjectiveFilter] = useState('todos')
  const [coverageFilter, setCoverageFilter] = useState('todos')
  const [searchQuery, setSearchQuery] = useState('')

  const cycleCategories = indicadores?.cycles?.[PNE_2026_CYCLE]?.categories ?? EMPTY_ARRAY
  const cycleItems = useMemo(
    () => cycleCategories.flatMap((category) =>
      (category.items ?? []).map((item) => ({
        ...item,
        categoryKey: category.key,
        categoryLabel: category.label,
      })),
    ),
    [cycleCategories],
  )
  const itemByKey = useMemo(
    () => new Map(cycleItems.map((item) => [item.key, item])),
    [cycleItems],
  )

  const municipioResults = municipioData?.[PNE_2026_CYCLE]?.indicadores ?? null
  const normalizedResults = useMemo(
    () => normalizePopulationPercentResults(municipioResults, cycleItems),
    [cycleItems, municipioResults],
  )
  const projections = municipioData?.[PNE_2026_CYCLE]?.projecoes ?? {}

  const summary = useMemo(
    () => buildCoverageSummary(PNE_2026_LEGAL_GOAL_INDICATOR_MAP),
    [],
  )

  const objectiveOptions = useMemo(() => {
    const objectiveIds = new Set(
      PNE_2026_LEGAL_GOAL_INDICATOR_MAP.map((goal) => goal.objectiveId).filter(Boolean),
    )

    return Array.from(objectiveIds).sort((a, b) => Number(a) - Number(b))
  }, [])

  const filteredGoals = useMemo(() => {
    const query = normalizeText(searchQuery.trim())

    return PNE_2026_LEGAL_GOAL_INDICATOR_MAP.filter((goal) => {
      if (objectiveFilter !== 'todos' && goal.objectiveId !== objectiveFilter) {
        return false
      }

      if (!matchesCoverageFilter(goal, coverageFilter)) {
        return false
      }

      if (!query) return true

      const indicatorTexts = goal.relatedIndicators.flatMap((indicatorRelation) => {
        const item = itemByKey.get(indicatorRelation.indicatorId)
        return [
          indicatorRelation.indicatorId,
          indicatorRelation.coverage,
          indicatorRelation.relationNote,
          item?.label,
          item?.desc,
          item?.categoryLabel,
        ]
      })

      const searchableText = [
        goal.legalGoalId,
        `Meta ${goal.legalGoalId}`,
        goal.objectiveId,
        `Objetivo ${goal.objectiveId}`,
        goal.legalText,
        ...indicatorTexts,
      ].join(' ')

      return normalizeText(searchableText).includes(query)
    })
  }, [coverageFilter, itemByKey, objectiveFilter, searchQuery])

  function toggleGoal(goalId) {
    setExpandedGoalIds((current) => {
      const next = new Set(current)

      if (next.has(goalId)) {
        next.delete(goalId)
      } else {
        next.add(goalId)
      }

      return next
    })
  }

  return (
    <div className="page-stack legal-goals-page">
      <section className="page-card legal-goals-hero">
        <div className="legal-goals-hero__copy">
          <span className="eyebrow">Plano Nacional de Educação</span>
          <h1>Metas legais do PNE 2026-2036</h1>
          <p>
            Acompanhamento das metas da Lei nº 15.388/2026 a partir dos indicadores
            municipais disponíveis no painel.
          </p>
          {selectedMunicipio ? (
            <p className="legal-goals-hero__municipio">
              Município em foco: <strong>{selectedMunicipio}</strong>
            </p>
          ) : null}
        </div>

        <aside className="legal-goals-law-card" aria-label="Base legal e validação">
          <span>Base legal</span>
          <strong>{PNE_2026_LEGAL_GOAL_MAPPING_METADATA.law}</strong>
          <p>
            {PNE_2026_LEGAL_GOAL_MAPPING_METADATA.totalLegalGoals} metas legais na
            matriz. Validação oficial linha a linha:{' '}
            {PNE_2026_LEGAL_GOAL_MAPPING_METADATA.validatedAgainstOfficialLaw
              ? 'concluída'
              : 'pendente'}
            .
          </p>
        </aside>
      </section>

      <section className="legal-goals-summary-grid" aria-label="Resumo da cobertura da matriz">
        <SummaryCard
          detail="na matriz legal"
          label="Total de metas legais"
          value={summary.total}
        />
        <SummaryCard
          detail="com pelo menos um vínculo direto"
          label="Metas com indicador direto"
          value={summary.withDirectIndicator}
        />
        <SummaryCard
          detail="inclui metas que também têm vínculo direto"
          label="Cobertura parcial/aproximada"
          value={summary.withPartialOrApproximateIndicator}
        />
        <SummaryCard
          detail="sem dado municipal correspondente"
          label="Sem indicador municipal"
          value={summary.withoutMunicipalIndicator}
        />
      </section>

      <section className="legal-goals-method-note" role="note">
        <span>Nota metodológica</span>
        <p>
          Os textos legais devem ser validados linha a linha contra a fonte oficial antes
          de publicação final. A correspondência entre metas e indicadores pode ser
          direta, parcial ou aproximada.
        </p>
      </section>

      {!selectedMunicipio ? (
        <section className="page-card legal-goals-empty-municipio">
          <h2>Selecione um município para acompanhar os indicadores relacionados</h2>
          <p>
            A matriz legal já está disponível, mas os resultados atuais, distâncias e
            projeções dependem da escolha de um município.
          </p>
          {onMunicipioChange ? (
            <div className="legal-goals-empty-municipio__selector">
              <MunicipalitySelector
                municipios={municipios}
                onChange={onMunicipioChange}
                selectedMunicipio=""
                variant="hero"
              />
            </div>
          ) : null}
        </section>
      ) : (
        <>
          <section className="legal-goals-filter-panel">
            <div className="legal-goals-filter-panel__heading">
              <div>
                <span className="eyebrow">Matriz de correspondência</span>
                <h2>Metas legais e indicadores municipais</h2>
              </div>
              <label className="legal-goals-search">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="m16 16 4 4" />
                </svg>
                <input
                  aria-label="Buscar metas legais"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar por código, texto legal ou indicador..."
                  type="search"
                  value={searchQuery}
                />
              </label>
            </div>

            <div className="legal-goals-filters">
              <label>
                <span>Objetivo</span>
                <select
                  aria-label="Filtrar por objetivo"
                  onChange={(event) => setObjectiveFilter(event.target.value)}
                  value={objectiveFilter}
                >
                  <option value="todos">Todos os objetivos</option>
                  {objectiveOptions.map((objectiveId) => (
                    <option key={objectiveId} value={objectiveId}>
                      Objetivo {objectiveId}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Cobertura</span>
                <select
                  aria-label="Filtrar por tipo de cobertura"
                  onChange={(event) => setCoverageFilter(event.target.value)}
                  value={coverageFilter}
                >
                  {COVERAGE_FILTERS.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <div className="legal-goals-results-meta">
            <span>{filteredGoals.length} metas exibidas</span>
            <p>{selectedMunicipio} · Lei nº 15.388/2026</p>
          </div>

          {filteredGoals.length === 0 ? (
            <section className="page-card legal-goals-no-results">
              <p>Nenhuma meta legal encontrada para os filtros selecionados.</p>
            </section>
          ) : (
            <section className="legal-goals-accordion" aria-label="Metas legais do PNE 2026-2036">
              {filteredGoals.map((goal) => (
                <LegalGoalAccordionItem
                  goal={goal}
                  isExpanded={expandedGoalIds.has(goal.legalGoalId)}
                  itemByKey={itemByKey}
                  key={goal.legalGoalId}
                  normalizedResults={normalizedResults}
                  onNavigate={onNavigate}
                  onToggle={() => toggleGoal(goal.legalGoalId)}
                  projections={projections}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function SummaryCard({ detail, label, value }) {
  return (
    <article className="legal-goals-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function LegalGoalAccordionItem({
  goal,
  isExpanded,
  itemByKey,
  normalizedResults,
  onNavigate,
  onToggle,
  projections,
}) {
  const contentId = `legal-goal-panel-${goal.legalGoalId.replace('.', '-')}`

  return (
    <article className={`legal-goal-card${isExpanded ? ' is-expanded' : ''}`}>
      <button
        aria-controls={contentId}
        aria-expanded={isExpanded}
        className="legal-goal-toggle"
        onClick={onToggle}
        type="button"
      >
        <span className="legal-goal-toggle__content">
          <span className="legal-goal-toggle__topline">
            <span className="legal-goal-code">Meta {goal.legalGoalId}</span>
            <span className="legal-goal-objective">Objetivo {goal.objectiveId}</span>
          </span>
          <span className="legal-goal-text">{goal.legalText}</span>
          <CoverageBadgeList goal={goal} />
        </span>
        <span className="legal-goal-chevron" aria-hidden="true" />
      </button>

      {isExpanded ? (
        <div className="legal-goal-card__body" id={contentId}>
          {goal.relatedIndicators.length === 0 ? (
            <NoMunicipalIndicator reason={goal.noMunicipalIndicatorReason} />
          ) : (
            <div className="legal-goal-indicator-list">
              {goal.relatedIndicators.map((indicatorRelation) => (
                <LegalGoalIndicator
                  indicatorRelation={indicatorRelation}
                  item={itemByKey.get(indicatorRelation.indicatorId)}
                  key={`${goal.legalGoalId}-${indicatorRelation.indicatorId}`}
                  onNavigate={onNavigate}
                  projection={projections?.[indicatorRelation.indicatorId]}
                  result={normalizedResults?.[indicatorRelation.indicatorId]}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </article>
  )
}

function CoverageBadgeList({ goal }) {
  const coverages = uniqueCoverageTypes(goal)

  if (!coverages.length) {
    return (
      <span className="legal-goal-badge-row">
        <CoverageBadge coverage="sem_indicador" label="Sem indicador municipal" />
      </span>
    )
  }

  return (
    <span className="legal-goal-badge-row">
      {coverages.map((coverage) => (
        <CoverageBadge coverage={coverage} key={coverage} />
      ))}
    </span>
  )
}

function CoverageBadge({ coverage, label }) {
  const displayLabel = label ?? COVERAGE_LABELS[coverage] ?? coverage

  return (
    <span className={`coverage-badge coverage-badge--${coverage}`}>
      {displayLabel}
    </span>
  )
}

function NoMunicipalIndicator({ reason }) {
  return (
    <div className="legal-goal-no-indicator">
      <span>Sem indicador municipal correspondente</span>
      <p>{reason || 'Sem indicador municipal disponível atualmente na plataforma.'}</p>
    </div>
  )
}

function LegalGoalIndicator({ indicatorRelation, item, onNavigate, projection, result }) {
  const hasCatalogItem = Boolean(item)
  const hasMunicipalResult = hasUsableMunicipalResult(indicatorRelation, result)
  const unit = resolveIndicatorUnit(item, result)
  const showMeta = hasMunicipalResult && hasReferenceMeta(result)
  const showDistance = hasMunicipalResult && hasComparableDistance(indicatorRelation, result)
  const showProjection = hasMunicipalResult && hasProjection2036(indicatorRelation, projection)
  const sourceContext = {
    block: 'pne',
    cycle: PNE_2026_CYCLE,
    indicatorKey: indicatorRelation.indicatorId,
    item,
    result,
  }

  return (
    <article className="legal-goal-indicator">
      <header className="legal-goal-indicator__header">
        <div>
          <span className="legal-goal-indicator__eyebrow">
            {item?.categoryLabel ?? 'Indicador relacionado'} · {indicatorRelation.indicatorId}
          </span>
          <h3>{hasCatalogItem ? getIndicatorTitle(item, result) : indicatorRelation.indicatorId}</h3>
          {item?.desc ? <p>{item.desc}</p> : null}
        </div>
        <CoverageBadge coverage={indicatorRelation.coverage} />
      </header>

      <p className="legal-goal-relation-note">{indicatorRelation.relationNote}</p>

      {!hasCatalogItem ? (
        <div className="legal-goal-indicator__empty">
          Indicador mapeado não encontrado no catálogo atual do ciclo PNE 2026-2036.
        </div>
      ) : !hasMunicipalResult ? (
        <div className="legal-goal-indicator__empty">
          Sem resultado municipal disponível para este indicador no município selecionado.
        </div>
      ) : (
        <div className="legal-goal-metric-grid">
          <LegalMetric
            detail={getCurrentMetricDetail(result)}
            label={getCurrentMetricLabel(result)}
            value={formatIndicatorValue(result.end_value, unit)}
          />
          {showMeta ? (
            <LegalMetric
              detail={result.meta_label ?? 'Meta de referência do indicador'}
              label="Meta de referência"
              value={formatMetaValue(result, unit)}
            />
          ) : null}
          {showDistance ? (
            <LegalMetric
              label="Distância da meta"
              tone={result.atingida ? 'success' : 'warning'}
              value={formatDistance(result, unit)}
            />
          ) : null}
          {showProjection ? (
            <LegalMetric
              detail={formatProjectionDistance(projection.distance_to_target_2036)}
              label="Projeção para 2036"
              tone={projection.status_2036 === 'tende_a_atingir' ? 'success' : 'warning'}
              value={formatProjectionPercent(projection.projected_2036)}
            />
          ) : null}
        </div>
      )}

      <div className="legal-goal-indicator__footer">
        <DataSourceNote context={sourceContext} />
        {onNavigate ? (
          <button
            className="legal-goal-open-cycle"
            onClick={() => onNavigate('pne2026')}
            type="button"
          >
            Abrir página do ciclo 2026-2036
          </button>
        ) : null}
      </div>
    </article>
  )
}

function LegalMetric({ detail, label, tone = 'default', value }) {
  return (
    <div className={`legal-goal-metric legal-goal-metric--${tone}`}>
      <span>{label}</span>
      <strong>{value ?? '—'}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  )
}

function buildCoverageSummary(goals) {
  return goals.reduce(
    (summary, goal) => {
      const coverageTypes = new Set(
        goal.relatedIndicators.map((indicatorRelation) => indicatorRelation.coverage),
      )

      summary.total += 1

      if (coverageTypes.has('direta')) {
        summary.withDirectIndicator += 1
      }

      if (coverageTypes.has('parcial') || coverageTypes.has('aproximada')) {
        summary.withPartialOrApproximateIndicator += 1
      }

      if (!coverageTypes.size) {
        summary.withoutMunicipalIndicator += 1
      }

      return summary
    },
    {
      total: 0,
      withDirectIndicator: 0,
      withPartialOrApproximateIndicator: 0,
      withoutMunicipalIndicator: 0,
    },
  )
}

function matchesCoverageFilter(goal, coverageFilter) {
  const coverageTypes = new Set(
    goal.relatedIndicators.map((indicatorRelation) => indicatorRelation.coverage),
  )

  if (coverageFilter === 'direta') return coverageTypes.has('direta')
  if (coverageFilter === 'parcial_aproximada') {
    return coverageTypes.has('parcial') || coverageTypes.has('aproximada')
  }
  if (coverageFilter === 'sem_indicador') return coverageTypes.size === 0
  return true
}

function uniqueCoverageTypes(goal) {
  return Array.from(
    new Set(goal.relatedIndicators.map((indicatorRelation) => indicatorRelation.coverage)),
  )
}

function hasUsableMunicipalResult(indicatorRelation, result) {
  if (!indicatorRelation.hasMunicipalResult || !result || result.available === false) {
    return false
  }

  const endValue = Number(result.end_value)
  if (Number.isFinite(endValue)) return true

  return (result.series ?? []).some((point) => Number.isFinite(Number(point?.valor)))
}

function hasReferenceMeta(result) {
  const meta = Number(result?.meta)
  return Number.isFinite(meta)
}

function hasComparableDistance(indicatorRelation, result) {
  if (!indicatorRelation.hasDistance || !hasReferenceMeta(result)) return false

  const status = normalizeText(result?.display?.status)
  return !(
    status.includes('visualizacao') ||
    status.includes('informativo') ||
    status.includes('indispon') ||
    status.includes('sem dados') ||
    status.includes('sem variacao')
  )
}

function hasProjection2036(indicatorRelation, projection) {
  return (
    indicatorRelation.hasProjection2036 &&
    projection?.available === true &&
    Number.isFinite(Number(projection.projected_2036))
  )
}

function getCurrentMetricLabel(result) {
  const year = getReadableYear(result?.end_year)
  return year ? `Resultado municipal (${year})` : 'Resultado municipal'
}

function getCurrentMetricDetail(result) {
  const status = result?.display?.status
  return status && !normalizeText(status).includes('visualizacao') ? status : null
}

function formatDistance(result, unit) {
  const ppOptions = { keepOneDecimal: unit === 'index' }
  const displayDistance = roundPpString(result?.display?.distance, ppOptions)

  if (displayDistance) return displayDistance

  const numericDistance = Number(result?.distance)
  if (!Number.isFinite(numericDistance)) return '—'

  const sign = numericDistance > 0 ? '+' : ''
  return `${sign}${PERCENT_FORMATTER.format(numericDistance)} p.p.`
}

function formatProjectionPercent(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? `${PERCENT_FORMATTER.format(numeric)}%` : '—'
}

function formatProjectionDistance(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 'Distância estimada não disponível'
  const sign = numeric > 0 ? '+' : ''
  return `Distância estimada: ${sign}${PERCENT_FORMATTER.format(numeric)} p.p.`
}

function getReadableYear(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}
