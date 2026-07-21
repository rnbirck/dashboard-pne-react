import { useMemo, useState } from 'react'
import { ContentState } from './ContentState'
import {
  buildPublicDiagnosticCopy,
  buildPublicSummaryText,
  formatPublicValue,
} from '../features/diagnostic/diagnosticPresentation'

const SITUATION_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'advance', label: 'Pontos para avançar' },
  { key: 'maintain', label: 'Resultados a manter' },
]

export function DiagnosticPanel({ contractStatus = 'ready', data, municipio }) {
  const publicDiagnostic = data?.pne2026PublicDiagnostic
  const [selectedSituation, setSelectedSituation] = useState('all')
  const [selectedTheme, setSelectedTheme] = useState('all')
  const [copyStatus, setCopyStatus] = useState('idle')

  const themeByKey = useMemo(
    () => new Map((publicDiagnostic?.themes ?? []).map((theme) => [theme.theme, theme])),
    [publicDiagnostic],
  )
  const availableThemes = useMemo(
    () => (publicDiagnostic?.themes ?? []).filter(
      (theme) => countThemeResults(theme, selectedSituation) > 0,
    ),
    [publicDiagnostic, selectedSituation],
  )
  const selectedThemeData = selectedTheme === 'all' ? null : themeByKey.get(selectedTheme)
  const availableSituations = useMemo(
    () => SITUATION_OPTIONS.filter(
      (option) => option.key === 'all' || countThemeResults(selectedThemeData, option.key) > 0,
    ),
    [selectedThemeData],
  )
  const visibleGoals = useMemo(
    () => (publicDiagnostic?.goals ?? [])
      .map((goal) => ({
        ...goal,
        results: goal.results.filter((result) => (
          (selectedSituation === 'all' || result.classification === selectedSituation)
          && (selectedTheme === 'all' || result.theme === selectedTheme)
        )),
      }))
      .filter((goal) => goal.results.length),
    [publicDiagnostic, selectedSituation, selectedTheme],
  )

  async function handleCopySummary() {
    try {
      if (!globalThis.navigator?.clipboard?.writeText) throw new Error('clipboard')
      await globalThis.navigator.clipboard.writeText(
        buildPublicDiagnosticCopy(publicDiagnostic, municipio),
      )
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  function handleSituationChange(situation) {
    setSelectedSituation(situation)
    if (
      selectedTheme !== 'all'
      && countThemeResults(themeByKey.get(selectedTheme), situation) === 0
    ) {
      setSelectedTheme('all')
    }
  }

  function handleThemeChange(theme) {
    setSelectedTheme(theme)
    const nextTheme = theme === 'all' ? null : themeByKey.get(theme)
    if (
      selectedSituation !== 'all'
      && countThemeResults(nextTheme, selectedSituation) === 0
    ) {
      setSelectedSituation('all')
    }
  }

  if (
    contractStatus !== 'ready'
    || publicDiagnostic?.version !== 'pne2026-public-diagnostic-v1'
  ) {
    return (
      <ContentState kind="error" className="pne-diagnostic-error">
        <strong>Não foi possível abrir o diagnóstico agora. Tente novamente.</strong>
      </ContentState>
    )
  }

  return (
    <div className="pne-diagnostic" data-public-diagnostic-version={publicDiagnostic.version}>
      <header className="pne-diagnostic__header">
        <div className="pne-diagnostic__heading">
          <p className="pne-diagnostic__kicker">Plano Nacional de Educação (PNE) 2026–2036</p>
          <h1>Diagnóstico educacional de {municipio}</h1>
          <p className="pne-diagnostic__description">
            Veja os resultados do município em relação às metas do PNE e aos demais municípios do Rio Grande do Sul.
          </p>
        </div>
        <div className="pne-diagnostic__actions" aria-label="Ações do diagnóstico">
          <button type="button" className="pne-diagnostic-action" onClick={handleCopySummary}>
            <ActionIcon name="copy" />
            {copyStatus === 'copied' ? 'Síntese copiada' : 'Copiar síntese'}
          </button>
          <button
            type="button"
            className="pne-diagnostic-action pne-diagnostic-action--primary"
            onClick={() => globalThis.window?.print()}
          >
            <ActionIcon name="print" />
            Imprimir relatório
          </button>
          <span className="u-sr-only" role="status" aria-live="polite">
            {copyStatus === 'copied' ? 'Síntese copiada para a área de transferência.' : ''}
            {copyStatus === 'error' ? 'Não foi possível copiar a síntese.' : ''}
          </span>
        </div>
      </header>

      <section className="pne-diagnostic-summary" aria-labelledby="pne-diagnostic-summary-title">
        <div className="pne-diagnostic-section-heading">
          <p>Visão do município</p>
          <h2 id="pne-diagnostic-summary-title">Resumo do diagnóstico</h2>
        </div>
        <p className="pne-diagnostic-summary__reading">
          {buildPublicSummaryText(publicDiagnostic.summary)}
        </p>
        <SummaryCards summary={publicDiagnostic.summary} />
      </section>

      <section className="pne-diagnostic-filters platform-filter-panel" aria-labelledby="pne-diagnostic-filters-title">
        <div className="pne-diagnostic-section-heading">
          <p>Refine a leitura</p>
          <h2 id="pne-diagnostic-filters-title">Filtros</h2>
        </div>
        <div className="pne-diagnostic-filters__groups">
          <FilterGroup label="Situação">
            {availableSituations.map((option) => (
              <FilterButton
                active={selectedSituation === option.key}
                key={option.key}
                label={option.label}
                onClick={() => handleSituationChange(option.key)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Tema">
            <FilterButton
              active={selectedTheme === 'all'}
              label="Todos"
              onClick={() => handleThemeChange('all')}
            />
            {availableThemes.map((theme) => (
              <FilterButton
                active={selectedTheme === theme.theme}
                key={theme.theme}
                label={theme.publicTitle}
                onClick={() => handleThemeChange(theme.theme)}
              />
            ))}
          </FilterGroup>
        </div>
      </section>

      <section className="pne-diagnostic-results" aria-labelledby="pne-diagnostic-results-title">
        <div className="pne-diagnostic-section-heading pne-diagnostic-section-heading--results">
          <p>Plano Nacional de Educação</p>
          <h2 id="pne-diagnostic-results-title">Metas e resultados</h2>
        </div>
        <div className="pne-diagnostic-goals">
          {visibleGoals.map((goal) => (
            <GoalBlock goal={goal} key={goal.goalId} themeByKey={themeByKey} />
          ))}
        </div>
      </section>

      <SourcesSection sources={publicDiagnostic.sources} />
    </div>
  )
}

function SummaryCards({ summary }) {
  const cards = [
    ['Pontos para avançar', summary.advanceResultsCount, 'advance'],
    ['Resultados a manter', summary.reachedResultsCount, 'maintain'],
    ['Acima ou próximos do RS', summary.stateAboveOrNearCount, 'state'],
    ['Abaixo do RS', summary.stateBelowCount, 'state'],
  ].filter(([, value]) => value > 0)

  return (
    <dl className="pne-diagnostic-summary__cards">
      {cards.map(([label, value, tone]) => (
        <div className={`pne-diagnostic-summary-card pne-diagnostic-summary-card--${tone}`} key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function FilterGroup({ children, label }) {
  return (
    <fieldset className="pne-diagnostic-filter-group">
      <legend>{label}</legend>
      <div className="pne-diagnostic-filter-group__options">{children}</div>
    </fieldset>
  )
}

function FilterButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`platform-filter-option pne-diagnostic-filter${active ? ' is-active' : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function GoalBlock({ goal, themeByKey }) {
  return (
    <article className="pne-diagnostic-goal">
      <header className="pne-diagnostic-goal__header">
        <p>Meta {goal.goalId}</p>
        <h3>{goal.publicTitle}</h3>
        {goal.publicDescription ? <p>{goal.publicDescription}</p> : null}
        {goal.targetYear ? <span>Prazo da meta: {goal.targetYear}</span> : null}
      </header>
      <div className="pne-diagnostic-goal__results">
        {goal.results.map((result) => (
          <ResultCard
            goalId={goal.goalId}
            key={result.indicatorId}
            result={result}
            themeTitle={themeByKey.get(result.theme)?.publicTitle ?? ''}
          />
        ))}
      </div>
    </article>
  )
}

function ResultCard({ goalId, result, themeTitle }) {
  const hasSupportingContent = Boolean(
    result.stateComparison
    || result.statewidePosition
    || result.similarMunicipalities
    || result.trajectory,
  )
  const titleId = `pne-diagnostic-result-${goalId}-${result.indicatorId}`

  return (
    <article className="pne-diagnostic-result" aria-labelledby={titleId}>
      <header className="pne-diagnostic-result__header">
        {themeTitle ? <p>{themeTitle}</p> : null}
        <div>
          <h4 id={titleId}>{result.publicName}</h4>
          <span className={`pne-diagnostic-result__status pne-diagnostic-result__status--${result.classification}`}>
            {result.classification === 'advance' ? 'Ponto para avançar' : 'Resultado a manter'}
          </span>
        </div>
        {result.relationship === 'partial_component' ? (
          <small>Este é um dos resultados acompanhados nesta meta.</small>
        ) : null}
      </header>

      <dl className="pne-diagnostic-result__measures">
        <Measure label="Resultado do município">
          <strong>{formatPublicValue(result.current.displayValue, result.current.unit)}</strong>
          <span>Ano {result.current.year}</span>
        </Measure>
        <Measure label="Valor previsto">
          <strong>{formatPublicValue(result.target.displayValue, result.current.unit)}</strong>
        </Measure>
        <Measure label="Prazo">
          <strong>{result.target.year}</strong>
        </Measure>
        <Measure className="pne-diagnostic-result__distance" label="Quanto falta ou quanto supera">
          <strong>{result.targetReading}</strong>
        </Measure>
      </dl>

      <p className="pne-diagnostic-result__reading">{result.publicReading}</p>

      {hasSupportingContent ? (
        <details className="pne-diagnostic-result__details">
          <summary>Ver comparação e evolução</summary>
          <div className="pne-diagnostic-result__details-content">
            {result.stateComparison ? (
              <SupportingReading title="Rio Grande do Sul">
                <p>{result.stateComparison.reading}</p>
                <small>
                  Município {formatPublicValue(result.stateComparison.municipalityValue, result.current.unit)} ·
                  {' '}RS {formatPublicValue(result.stateComparison.stateValue, result.current.unit)} ·
                  {' '}{result.stateComparison.year}
                </small>
              </SupportingReading>
            ) : null}
            {result.statewidePosition ? (
              <SupportingReading title="Posição entre municípios">
                <p>{result.statewidePosition.reading}</p>
              </SupportingReading>
            ) : null}
            {result.similarMunicipalities ? (
              <SupportingReading title={result.similarMunicipalities.title}>
                <p>{result.similarMunicipalities.reading}</p>
              </SupportingReading>
            ) : null}
            {result.trajectory ? (
              <SupportingReading title="Evolução recente">
                <p>{result.trajectory.historicalReading}</p>
                {result.trajectory.achievementReading ? (
                  <p>{result.trajectory.achievementReading}</p>
                ) : null}
              </SupportingReading>
            ) : null}
          </div>
        </details>
      ) : null}
    </article>
  )
}

function Measure({ children, className = '', label }) {
  return (
    <div className={className}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function SupportingReading({ children, title }) {
  return (
    <section>
      <h5>{title}</h5>
      {children}
    </section>
  )
}

function SourcesSection({ sources }) {
  return (
    <section className="pne-diagnostic-sources" aria-labelledby="pne-diagnostic-sources-title">
      <div className="pne-diagnostic-section-heading">
        <p>Dados oficiais</p>
        <h2 id="pne-diagnostic-sources-title">Fontes das informações</h2>
      </div>
      <ul>
        {sources.map((source) => (
          <li key={source.id}>
            <div>
              <strong>{source.organization}</strong>
              <span>{source.publicTitle} · {source.period}</span>
            </div>
            <a
              aria-label={`Acessar fonte oficial: ${source.organization} — ${source.publicTitle}`}
              href={source.officialUrl}
              rel="noreferrer"
              target="_blank"
            >
              Acessar fonte oficial
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ActionIcon({ name }) {
  if (name === 'copy') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 8V4h10v4" />
      <rect x="5" y="14" width="14" height="6" rx="1" />
      <path d="M5 16H3V9h18v7h-2" />
      <path d="M17 11h1" />
    </svg>
  )
}

function countThemeResults(theme, situation) {
  if (!theme) return 1
  if (situation === 'advance') return theme.advanceResultsCount ?? 0
  if (situation === 'maintain') return theme.maintainResultsCount ?? 0
  return theme.displayedResultsCount ?? 0
}
