import {
  buildPublicSummaryText,
  formatPublicDistance,
  formatPublicValue,
  getPublicCurrentValue,
  getPublicOfficialSources,
  getPublicResultReading,
  getPublicResultStatus,
  getPublicStateComparison,
  getPublicSupportingReadings,
} from '../features/diagnostic/diagnosticPresentation'

export function DiagnosticPrintReport({ description, municipio, publicDiagnostic }) {
  const allResults = publicDiagnostic.goals.flatMap((goal) => (
    goal.results.map((result) => ({ goal, result }))
  ))
  const themeGroups = publicDiagnostic.presentation.themes
    .map((theme) => ({
      theme,
      results: allResults.filter(({ result }) => result.themeId === theme.id),
    }))
    .filter(({ results }) => results.length)
  const sources = getPublicOfficialSources(publicDiagnostic.sources)
  const summaryItems = [
    ['Resultados analisados', publicDiagnostic.summary.availableResultCount],
    ['Pontos para avançar', publicDiagnostic.summary.advanceCount],
    ['Resultados a manter', publicDiagnostic.summary.maintainCount],
    ['Para acompanhamento', publicDiagnostic.summary.unclassifiedCount],
    ['Acima ou próximos do RS', publicDiagnostic.summary.stateAboveOrNearCount],
    ['Abaixo do RS', publicDiagnostic.summary.stateBelowCount],
  ]

  return (
    <article className="diagnostic-print-report">
      <header className="diagnostic-print-report__header">
        <p className="diagnostic-print-report__institution">Painel SESI-RS de Inteligência Municipal</p>
        <div className="diagnostic-print-report__title-row">
          <div>
            <h1>Diagnóstico educacional</h1>
            <p className="diagnostic-print-report__municipality">{municipio}</p>
          </div>
          <p className="diagnostic-print-report__cycle">PNE 2026–2036</p>
        </div>
        <p className="diagnostic-print-report__description">{description}</p>
        <p className="diagnostic-print-report__summary-reading">
          {buildPublicSummaryText(publicDiagnostic.summary)}
        </p>
        <dl className="diagnostic-print-report__summary">
          {summaryItems.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="diagnostic-print-report__themes">
        {themeGroups.map(({ results, theme }) => (
          <section className="diagnostic-print-theme" key={theme.id}>
            <header className="diagnostic-print-theme__header">
              <div>
                <p>Tema {theme.order}</p>
                <h2>{theme.label}</h2>
              </div>
              <p>{results.length} {results.length === 1 ? 'indicador' : 'indicadores'}</p>
            </header>

            <div className="diagnostic-print-theme__indicators">
              {results.map(({ goal, result }) => (
                <DiagnosticPrintIndicator
                  goal={goal}
                  key={`${goal.goalId}-${result.indicatorId}`}
                  result={result}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {sources.length ? (
        <section className="diagnostic-print-report__sources">
          <h2>Fontes oficiais</h2>
          <ul>
            {sources.map((source) => (
              <li key={source.id}>
                <strong>{source.organization}</strong>
                <span>{source.publicTitle} · {source.period}</span>
              </li>
            ))}
          </ul>
          <p>Valores percentuais superiores a 100% são apresentados como 100%.</p>
        </section>
      ) : null}

      <footer className="diagnostic-print-report__footer">
        <span>{municipio}</span>
        <span>Diagnóstico municipal — PNE 2026–2036</span>
      </footer>
    </article>
  )
}

function DiagnosticPrintIndicator({ goal, result }) {
  const stateComparison = getPublicStateComparison(result)
  const supportingReadings = getPublicSupportingReadings(result)
  const publicReading = getPublicResultReading(result)
  const status = getPublicResultStatus(result)
  const measures = [
    {
      label: 'Município',
      value: getPublicCurrentValue(result),
      detail: Number.isFinite(result.current?.year) ? `Ano ${result.current.year}` : '',
    },
    {
      label: 'Meta PNE',
      value: formatPublicValue(result.indicatorReference?.value, result.current?.unit),
      detail: Number.isFinite(result.indicatorReference?.year)
        ? `Prazo ${result.indicatorReference.year}`
        : '',
    },
    {
      label: 'Distância até a meta',
      value: formatPublicDistance(result.distance, result.current?.unit),
    },
    {
      label: 'Referência RS',
      value: stateComparison?.stateValue,
      detail: stateComparison ? `Ano ${stateComparison.year}` : '',
    },
    {
      label: 'Município x RS',
      value: stateComparison?.difference,
    },
  ].filter(({ value }) => value !== '' && value !== null && value !== undefined)

  return (
    <article className="diagnostic-print-indicator">
      <header className="diagnostic-print-indicator__header">
        <p>Meta {goal.goalId} — {goal.title}</p>
        <h3>{result.publicName}</h3>
        <span>{status.label}</span>
      </header>

      {measures.length ? (
        <dl className={`diagnostic-print-indicator__measures diagnostic-print-indicator__measures--count-${measures.length}`}>
          {measures.map(({ detail, label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                <strong>{value}</strong>
                {detail ? <span>{detail}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {publicReading ? (
        <p className="diagnostic-print-indicator__reading">
          <strong>Leitura:</strong> {publicReading}
        </p>
      ) : null}

      {stateComparison?.reading ? (
        <p className="diagnostic-print-indicator__reading">
          <strong>Comparação com o RS:</strong> {stateComparison.reading}
        </p>
      ) : null}

      {supportingReadings.map((reading) => (
        <div className="diagnostic-print-indicator__reading" key={`${reading.kind}-${reading.title}`}>
          <strong>{reading.title}:</strong>
          {reading.lines.map((line) => <p key={line}>{line}</p>)}
        </div>
      ))}
    </article>
  )
}
