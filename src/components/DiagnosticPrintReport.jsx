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
            <div className="diagnostic-print-theme__indicators">
              <div className="diagnostic-print-theme__opening">
                <header className="diagnostic-print-theme__header">
                  <div>
                    <p>Tema {theme.order}</p>
                    <h2>{theme.label}</h2>
                  </div>
                  <p>{results.length} {results.length === 1 ? 'indicador' : 'indicadores'}</p>
                </header>
                <DiagnosticPrintIndicator
                  goal={results[0].goal}
                  result={results[0].result}
                />
              </div>
              {results.slice(1).map(({ goal, result }) => (
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
  const contextReadings = supportingReadings.filter(({ kind }) => kind !== 'trajectory')
  const trajectoryReading = supportingReadings.find(({ kind }) => kind === 'trajectory')
  const comparisonItemCount = Number(Boolean(stateComparison?.reading)) + contextReadings.length
  const closingItemCount = Number(Boolean(trajectoryReading)) + Number(Boolean(publicReading))
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
      <div className="diagnostic-print-indicator__top-row">
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
      </div>

      {comparisonItemCount ? (
        <section className={`diagnostic-print-indicator__comparison-row diagnostic-print-indicator__comparison-row--count-${comparisonItemCount}`}>
          {stateComparison?.reading ? (
            <DiagnosticPrintReading title="Comparação com o RS">
              <p>{stateComparison.reading}</p>
            </DiagnosticPrintReading>
          ) : null}
          {contextReadings.map((reading) => (
            <DiagnosticPrintReading key={`${reading.kind}-${reading.title}`} title={reading.title}>
              {reading.lines.map((line) => <p key={line}>{line}</p>)}
            </DiagnosticPrintReading>
          ))}
        </section>
      ) : null}

      {closingItemCount ? (
        <section className={`diagnostic-print-indicator__closing-row diagnostic-print-indicator__closing-row--count-${closingItemCount}`}>
          {trajectoryReading ? (
            <DiagnosticPrintReading title={trajectoryReading.title}>
              {trajectoryReading.lines.map((line) => <p key={line}>{line}</p>)}
            </DiagnosticPrintReading>
          ) : null}
          {publicReading ? (
            <DiagnosticPrintReading title="Leitura do indicador">
              <p>{publicReading}</p>
            </DiagnosticPrintReading>
          ) : null}
        </section>
      ) : null}
    </article>
  )
}

function DiagnosticPrintReading({ children, title }) {
  return (
    <section className="diagnostic-print-indicator__reading">
      <strong>{title}</strong>
      <div>{children}</div>
    </section>
  )
}
