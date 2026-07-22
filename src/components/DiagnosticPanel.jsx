import { useEffect, useMemo, useState } from 'react'
import { ContentState } from './ContentState'
import { DiagnosticPrintReport } from './DiagnosticPrintReport'
import { PnePageHeader } from './PnePageHeader'
import {
  buildPublicDiagnosticCopy,
  buildPublicSummaryText,
  formatPublicValue,
  getPublicCurrentValue,
  getPublicOfficialSources,
  getPublicResultReading,
  getPublicResultStatus,
  getPublicStateComparison,
  getPublicSupportingReadings,
  SUPPORTED_PUBLIC_VERSION,
} from '../features/diagnostic/diagnosticPresentation'

const SITUATION_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'advance', label: 'Pontos para avançar' },
  { key: 'maintain', label: 'Resultados a manter' },
  { key: 'unclassified', label: 'Resultados para acompanhamento' },
]

const DIAGNOSTIC_DESCRIPTION = 'Veja os resultados do município em relação às metas do PNE e ao contexto dos municípios do Rio Grande do Sul.'

export function DiagnosticPanel({ contractStatus = 'ready', data, municipio }) {
  const publicDiagnostic = data?.pne2026PublicDiagnosticV2
  const [selectedSituation, setSelectedSituation] = useState('all')
  const [copyStatus, setCopyStatus] = useState('idle')

  useEffect(() => {
    setSelectedSituation('all')
    setCopyStatus('idle')
  }, [publicDiagnostic])

  const themes = useMemo(
    () => publicDiagnostic?.presentation?.themes ?? [],
    [publicDiagnostic],
  )
  const allResults = useMemo(
    () => (publicDiagnostic?.goals ?? []).flatMap((goal) => (
      goal.results.map((result) => ({ goal, result }))
    )),
    [publicDiagnostic],
  )
  const availableSituations = useMemo(
    () => SITUATION_OPTIONS.filter((option) => (
      option.key === 'all'
      || allResults.some(({ result }) => matchesSituation(result, option.key))
    )),
    [allResults],
  )
  const visibleThemeGroups = useMemo(
    () => themes
      .map((theme) => {
        const themeResults = allResults.filter(({ result }) => result.themeId === theme.id)
        return {
          theme,
          summary: summarizeThemeResults(themeResults),
          results: themeResults.filter(({ result }) => matchesSituation(result, selectedSituation)),
        }
      })
      .filter(({ results }) => results.length),
    [allResults, selectedSituation, themes],
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

  if (
    contractStatus !== 'ready'
    || publicDiagnostic?.version !== SUPPORTED_PUBLIC_VERSION
  ) {
    return (
      <ContentState kind="error" className="pne-diagnostic-error">
        <strong>Não foi possível abrir o diagnóstico agora. Tente novamente.</strong>
      </ContentState>
    )
  }

  return (
    <div className="pne-diagnostic" data-public-diagnostic-version={publicDiagnostic.version}>
      <PnePageHeader
        actions={<>
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
        </>}
        asideLabel="Resumo do diagnóstico municipal"
        asideContent={<DiagnosticHeaderSummary summary={publicDiagnostic.summary} />}
        description={DIAGNOSTIC_DESCRIPTION}
        eyebrow="DIAGNÓSTICO MUNICIPAL · PNE 2026–2036"
        title={`Diagnóstico educacional de ${municipio}`}
      />

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
                onClick={() => setSelectedSituation(option.key)}
              />
            ))}
          </FilterGroup>
        </div>
      </section>

      <section className="pne-diagnostic-results" aria-labelledby="pne-diagnostic-results-title">
        <div className="pne-diagnostic-section-heading pne-diagnostic-section-heading--results">
          <p>Plano Nacional de Educação</p>
          <h2 id="pne-diagnostic-results-title">Resultados por tema</h2>
        </div>
        <div className="pne-diagnostic-themes">
          {visibleThemeGroups.map(({ results, summary, theme }) => (
            <ThemeBlock
              key={theme.id}
              results={results}
              summary={summary}
              theme={theme}
            />
          ))}
        </div>
      </section>

      <SourcesSection sources={getPublicOfficialSources(publicDiagnostic.sources)} />

      <DiagnosticPrintReport
        description={DIAGNOSTIC_DESCRIPTION}
        municipio={municipio}
        publicDiagnostic={publicDiagnostic}
      />
    </div>
  )
}

function DiagnosticHeaderSummary({ summary }) {
  const analyzedCount = summary.advanceCount + summary.maintainCount + summary.unclassifiedCount

  return (
    <dl className="pne-page-header__metrics">
      <div className="pne-page-header__metric pne-page-header__metric--info">
        <dt>Metas analisadas</dt>
        <dd>{analyzedCount}</dd>
      </div>
      <div className="pne-page-header__metric pne-page-header__metric--attention">
        <dt>Pontos a trabalhar</dt>
        <dd>{summary.advanceCount}</dd>
      </div>
      <div className="pne-page-header__metric pne-page-header__metric--success">
        <dt>Pontos a continuar</dt>
        <dd>{summary.maintainCount}</dd>
      </div>
    </dl>
  )
}

function SummaryCards({ summary }) {
  const cards = [
    ['Pontos para avançar', summary.advanceCount, 'advance'],
    ['Resultados a manter', summary.maintainCount, 'maintain'],
    ['Resultados para acompanhamento', summary.unclassifiedCount, 'neutral'],
    ['Acima ou próximos do RS', summary.stateAboveOrNearCount, 'maintain'],
    ['Abaixo do RS', summary.stateBelowCount, 'advance'],
  ]

  return (
    <dl className="pne-diagnostic-summary__cards">
      {cards.map(([label, value, tone], index) => (
        <div
          className={`pne-diagnostic-summary-card pne-diagnostic-summary-card--${tone}${index === 3 ? ' pne-diagnostic-summary-card--context-start' : ''}`}
          key={label}
        >
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

function ThemeBlock({ results, summary, theme }) {
  const titleId = `pne-diagnostic-theme-${theme.id}`

  return (
    <article className="pne-diagnostic-theme" aria-labelledby={titleId}>
      <header className="pne-diagnostic-theme__header">
        <div className="pne-diagnostic-theme__heading">
          <span className="pne-diagnostic-theme__icon" aria-hidden="true">
            <DiagnosticIcon name={theme.id} />
          </span>
          <div>
            <p>Tema {theme.order}</p>
            <h3 id={titleId}>{theme.label}</h3>
          </div>
        </div>
        <ThemeSummary summary={summary} />
      </header>
      <div className="pne-diagnostic-theme__results">
        {results.map(({ goal, result }) => (
          <ResultCard
            goal={goal}
            headingLevel={4}
            key={result.indicatorId}
            result={result}
            standalone
          />
        ))}
      </div>
    </article>
  )
}

function ThemeSummary({ summary }) {
  const items = [
    ['Total de resultados', summary.total],
    ['Pontos para avançar', summary.advance],
    ['Resultados a manter', summary.maintain],
    ['Resultados para acompanhamento', summary.unclassified],
  ]

  return (
    <dl className="pne-diagnostic-theme-summary">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ResultCard({ goal, headingLevel, result, standalone = false }) {
  const stateComparison = getPublicStateComparison(result)
  const supportingReadings = getPublicSupportingReadings(result)
  const status = getPublicResultStatus(result)
  const titleId = `pne-diagnostic-result-${goal.goalId}-${result.indicatorId}`
  const Heading = `h${headingLevel}`
  const currentValue = getPublicCurrentValue(result)
  const publicReading = getPublicResultReading(result)

  return (
    <article
      className={`pne-diagnostic-result${standalone ? ' pne-diagnostic-result--standalone' : ''}`}
      aria-labelledby={titleId}
    >
      <div className="pne-diagnostic-result__primary">
        <div className="pne-diagnostic-result__identity">
          <span className="pne-diagnostic-result__icon" aria-hidden="true">
            <DiagnosticIcon name={result.themeId} />
          </span>
          <header className="pne-diagnostic-result__header">
            <p className="pne-diagnostic-result__goal-context">Meta {goal.goalId} — {goal.title}</p>
            <div>
              <Heading id={titleId}>{result.publicName}</Heading>
              <span className={`pne-diagnostic-result__status pne-diagnostic-result__status--${status.key}`}>
                {status.label}
              </span>
            </div>
          </header>
        </div>

        <dl className="pne-diagnostic-result__measures">
          <Measure label="Resultado do município">
            <strong>{currentValue}</strong>
            <span>Ano {result.current.year}</span>
          </Measure>
          <Measure label="Valor previsto">
            <strong>{formatPublicValue(result.indicatorReference.value, result.current.unit)}</strong>
          </Measure>
          <Measure label="Prazo">
            <strong>{result.indicatorReference.year}</strong>
          </Measure>
        </dl>

        <div className="pne-diagnostic-result__context">
          {supportingReadings.length ? (
            <div
              className={`pne-diagnostic-result__support-grid pne-diagnostic-result__support-grid--count-${supportingReadings.length}`}
              aria-label="Posição, municípios semelhantes e evolução recente"
            >
              {supportingReadings.map((reading) => (
                <SupportingReading
                  badge={getSupportingReadingBadge(reading)}
                  key={reading.title}
                  kind={reading.kind}
                  title={reading.title}
                >
                  {reading.lines.map((line) => <p key={line}>{line}</p>)}
                </SupportingReading>
              ))}
            </div>
          ) : null}

          {publicReading ? (
            <p className="pne-diagnostic-result__reading">{publicReading}</p>
          ) : null}
        </div>
      </div>

      {stateComparison ? (
        <section className="pne-diagnostic-result__state-comparison">
          <h5>Comparação com a média dos municípios do RS neste indicador</h5>
          <dl>
            <Measure label="Município">
              <strong>{stateComparison.municipalityValue}</strong>
            </Measure>
            <Measure label="Rio Grande do Sul">
              <strong>{stateComparison.stateValue}</strong>
            </Measure>
            <Measure label="Diferença">
              <strong>{stateComparison.difference}</strong>
            </Measure>
            <Measure label="Ano">
              <strong>{stateComparison.year}</strong>
            </Measure>
          </dl>
          <p>
            <span className="pne-diagnostic-result__comparison-reading">{stateComparison.reading}</span>
          </p>
        </section>
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

function SupportingReading({ badge, children, kind, title }) {
  const compactTitle = kind === 'position'
    ? 'Posição no RS'
    : kind === 'similar'
      ? 'Municípios semelhantes'
      : title

  return (
    <section className={`pne-diagnostic-support-reading pne-diagnostic-support-reading--${kind}`}>
      <header>
        <span className="pne-diagnostic-support-reading__icon" aria-hidden="true">
          <DiagnosticSupportIcon name={kind} />
        </span>
        <h5>{compactTitle}</h5>
      </header>
      {badge ? <span className="pne-diagnostic-support-reading__badge">{badge}</span> : null}
      <div>{children}</div>
    </section>
  )
}

function getSupportingReadingBadge({ kind, lines }) {
  const reading = lines.join(' ').toLocaleLowerCase('pt-BR')

  if (kind === 'position') {
    if (reading.includes('mais favoráveis')) return 'Faixa superior'
    if (reading.includes('maior espaço para avançar')) return 'Faixa prioritária'
    if (reading.includes('intermediária')) return 'Faixa intermediária'
    return ''
  }

  if (kind === 'similar') {
    if (reading.includes('acima da mediana')) return 'Acima da mediana'
    if (reading.includes('abaixo da mediana')) return 'Abaixo da mediana'
    return ''
  }

  if (reading.includes('melhorou')) return 'Melhorou nos últimos anos'
  if (reading.includes('recuou')) return 'Recuou nos últimos anos'
  if (reading.includes('estável')) return 'Permaneceu estável'
  return ''
}

function DiagnosticSupportIcon({ name }) {
  if (name === 'position') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M5 19v-5h4v5M10 19V9h4v10M15 19V4h4v15" />
      </svg>
    )
  }

  if (name === 'similar') {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2" />
        <path d="M3.5 19v-1.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V19M15 14h1.5a4 4 0 0 1 4 4v1" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24">
      <path d="m4 17 5-5 3 3 7-8" />
      <path d="M15 7h4v4" />
    </svg>
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
      <p className="pne-diagnostic-sources__method-note">
        Valores percentuais superiores a 100% são apresentados como 100%.
      </p>
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

function DiagnosticIcon({ name }) {
  if (name === 'atendimento_escolar_v2') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 19v-7.5L12 5l8 6.5V19H4" />
        <path d="M8 19v-5h8v5" />
      </svg>
    )
  }

  if (name === 'educacao_tempo_integral_v2') {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  }

  if (name === 'aprendizagem_trajetoria_escolar_v2') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h3.5a3 3 0 0 1 3 3v14.5H7a2.5 2.5 0 0 0-2.5 2.5z" />
        <path d="M19.5 5.5A2.5 2.5 0 0 0 17 3h-3.5a3 3 0 0 0-3 3v14.5H17a2.5 2.5 0 0 1 2.5 2.5z" />
      </svg>
    )
  }

  if (name === 'escolaridade_alfabetizacao_v2') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M5 6h8M5 10h6M5 14h4" />
        <path d="m12 18 1-4 5.5-5.5 3 3L16 17z" />
      </svg>
    )
  }

  if (name === 'educacao_profissional_eja_v2') {
    return (
      <svg viewBox="0 0 24 24">
        <rect x="3.5" y="7" width="17" height="12" rx="2" />
        <path d="M9 7V5h6v2M3.5 12h17M10 12v2h4v-2" />
      </svg>
    )
  }

  if (name === 'profissionais_educacao_v2') {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19v-1.5A4.5 4.5 0 0 1 8 13h2a4.5 4.5 0 0 1 4.5 4.5V19" />
        <path d="m16 10 1.5 1.5L21 8" />
      </svg>
    )
  }

  if (name === 'infraestrutura_escolar_v2') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 20V8l8-4 8 4v12" />
        <path d="M8 11h2M14 11h2M8 15h2M14 15h2M10 20v-2h4v2" />
      </svg>
    )
  }

  if (name === 'gestao_escolar_educacao_ambiental_v2') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M6 18c0-6 3.5-10 12-12 0 8-3.5 12-9 12z" />
        <path d="M7 20c2-5 5-8 9-10" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M8 15.5 10.7 12l2.2 2.1L16 9.5" />
      <path d="M8 8.5h.01" />
    </svg>
  )
}

function matchesSituation(result, situation) {
  if (situation === 'all') return true
  if (situation === 'unclassified') return result.classification == null
  return result.classification === situation
}

function summarizeThemeResults(results) {
  return results.reduce((summary, { result }) => ({
    total: summary.total + 1,
    advance: summary.advance + Number(result.classification === 'advance'),
    maintain: summary.maintain + Number(result.classification === 'maintain'),
    unclassified: summary.unclassified + Number(result.classification == null),
  }), {
    total: 0,
    advance: 0,
    maintain: 0,
    unclassified: 0,
  })
}
