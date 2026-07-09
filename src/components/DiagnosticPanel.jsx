import { useMemo, useState } from 'react'
import {
  floorValueForGoal,
  isAccumulativeExpansionIndicator,
  resolveIndicatorUnit,
} from '../utils/format'
import { getDataSourceNote } from '../utils/dataSourceNotes'
import { isPneComparableIndicator } from '../utils/pneDisplayRules'

function isAccumulativeExpansionLabel(label) {
  const text = String(label ?? '').toLocaleLowerCase('pt-BR')
  return text.includes('expansão acumulada') || text.includes('expansÃ£o acumulada')
}

function isNegativeHighlightEligible(indicator) {
  return !isAccumulativeExpansionLabel(indicator?.label)
}

const AREA_ICON_PATHS = {
  atendimento: (
    <>
      <path d="M4 20h16" />
      <path d="M6 20V9l6-4 6 4v11" />
      <path d="M9 20v-6h6v6" />
      <path d="M12 9v2" />
    </>
  ),
  rendimento: (
    <>
      <path d="M4 18h16" />
      <path d="M6 15l4-4 3 3 5-7" />
      <path d="M16 7h2v2" />
    </>
  ),
  corpo_docente: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M4 19a5 5 0 0 1 10 0" />
      <path d="M14 19a4 4 0 0 1 6 0" />
    </>
  ),
  infraestrutura: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20V5h10v15" />
      <path d="M10 9h1" />
      <path d="M13 9h1" />
      <path d="M10 13h1" />
      <path d="M13 13h1" />
    </>
  ),
  escolaridade_populacao: (
    <>
      <circle cx="8" cy="8" r="2.6" />
      <circle cx="16" cy="8" r="2.6" />
      <path d="M3.5 18a4.5 4.5 0 0 1 9 0" />
      <path d="M11.5 18a4.5 4.5 0 0 1 9 0" />
    </>
  ),
}

export function DiagnosticPanel({ categories = [], data, municipio, results = {} }) {
  const analysis = buildDiagnosticAnalysis(categories, results)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [activeAnchor, setActiveAnchor] = useState('summary')
  const [copyStatus, setCopyStatus] = useState('idle')
  const filteredIndicators = useMemo(
    () => {
      if (selectedFilter === 'all') return analysis.indicators
      const area = analysis.areas.find((a) => a.key === selectedFilter)
      return area ? area.indicators : []
    },
    [analysis.indicators, analysis.areas, selectedFilter],
  )
  const filteredBestPosition = useMemo(() => buildBestPosition(filteredIndicators), [filteredIndicators])
  const filteredPriorities = useMemo(() => buildPriorities(filteredIndicators), [filteredIndicators])
  const showCategoryChip = selectedFilter === 'all'
  const selectedArea = analysis.areas.find((area) => area.key === selectedFilter)
  const selectedFilterLabel = selectedFilter === 'all'
    ? 'Todos os temas'
    : selectedArea?.fullLabel ?? selectedArea?.label ?? 'Tema selecionado'
  const executiveSummary = buildExecutiveSummary(analysis)
  const accountabilityText = buildAccountabilityText(analysis, municipio)

  async function handleCopyAccountability() {
    try {
      if (!globalThis.navigator?.clipboard?.writeText) {
        throw new Error('Clipboard indisponível')
      }
      await globalThis.navigator.clipboard.writeText(accountabilityText)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  function handlePrint() {
    globalThis.window?.print()
  }

  if (!data && analysis.summary.total === 0) {
    return (
      <section className="detail-panel empty-panel">
        <p>Não há diagnóstico para {municipio}.</p>
      </section>
    )
  }

  return (
    <div className="diagnostic-panel">
      <section className="diagnostic-overview" id="diagnostic-summary">
        <header className="diagnostic-overview__header">
          <div>
            <p className="diagnostic-overview__context">PNE 2026–2036 · diagnóstico municipal</p>
            <h2>{municipio}: metas, lacunas e prioridades</h2>
            <p className="diagnostic-overview__intro">
              Uma leitura para orientar decisões da gestão e comunicar resultados com a mesma base de evidências.
            </p>
          </div>
          <div className="diagnostic-overview__actions" aria-label="Ações do diagnóstico">
            <button type="button" className="diagnostic-action" onClick={handleCopyAccountability}>
              <ActionIcon icon="copy" />
              {copyStatus === 'copied' ? 'Síntese copiada' : 'Copiar síntese'}
            </button>
            <button type="button" className="diagnostic-action diagnostic-action--primary" onClick={handlePrint}>
              <ActionIcon icon="print" />
              Imprimir relatório
            </button>
            <span className="u-sr-only" role="status" aria-live="polite">
              {copyStatus === 'copied' ? 'Síntese copiada para a área de transferência.' : ''}
              {copyStatus === 'error' ? 'Não foi possível copiar a síntese.' : ''}
            </span>
          </div>
        </header>

        <div className="diagnostic-decision-brief">
          <div className="diagnostic-decision-brief__reading">
            <span>Leitura principal</span>
            <p>{executiveSummary}</p>
            {analysis.priorities[0] ? (
              <div className="diagnostic-primary-focus">
                <div>
                  <small>Principal ponto de atenção</small>
                  <strong>{analysis.priorities[0].label}</strong>
                </div>
                <span>Faltam {analysis.priorities[0].distanceLabel}</span>
              </div>
            ) : null}
          </div>

          <dl className="diagnostic-scoreboard" aria-label="Resumo das metas analisadas">
            <SummaryMetric
              helper="Base com referência comparável"
              label="Indicadores analisados"
              value={analysis.summary.total}
            />
            <SummaryMetric
              helper="Resultados na referência"
              label="Metas atingidas"
              tone="success"
              value={analysis.summary.achieved}
            />
            <SummaryMetric
              helper="Lacunas que pedem acompanhamento"
              label="Abaixo da meta"
              tone="danger"
              value={analysis.summary.below}
            />
          </dl>
        </div>

        <div className="diagnostic-overview__footnote">
          <span>A ordem de atenção usa a lacuna proporcional à meta para permitir comparação entre unidades diferentes.</span>
        </div>
      </section>

      <nav className="diagnostic-anchor-nav" aria-label="Navegação interna do diagnóstico">
        <a
          className={activeAnchor === 'summary' ? 'is-active' : ''}
          href="#diagnostic-summary"
          onClick={() => setActiveAnchor('summary')}
        >
          Panorama
        </a>
        <a
          className={activeAnchor === 'priorities' ? 'is-active' : ''}
          href="#diagnostic-priorities"
          onClick={() => setActiveAnchor('priorities')}
        >
          Prioridades
        </a>
        <a
          className={activeAnchor === 'themes' ? 'is-active' : ''}
          href="#diagnostic-themes"
          onClick={() => setActiveAnchor('themes')}
        >
          Temas
        </a>
      </nav>

      <section className="diagnostic-theme-filter" aria-label="Filtrar prioridades e avanços por tema">
        <div className="diagnostic-theme-filter__header">
          <div>
            <span>Recorte das prioridades e dos avanços</span>
            <p>{selectedFilterLabel}</p>
          </div>
          <strong>{filteredIndicators.length} com meta</strong>
        </div>
        <div className="diagnostic-theme-filter__grid">
          <button
            type="button"
            className={`diagnostic-theme-filter__card${selectedFilter === 'all' ? ' is-active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            <span>Todas</span>
            <span className="diagnostic-theme-filter__count">{analysis.summary.total}</span>
          </button>
          {analysis.areas.map((area) => (
            <button
              key={area.key}
              type="button"
              title={area.fullLabel ?? area.label}
              className={`diagnostic-theme-filter__card${selectedFilter === area.key ? ' is-active' : ''}`}
              onClick={() => setSelectedFilter(area.key)}
            >
              <span>{area.label}</span>
              <span className="diagnostic-theme-filter__count">{area.total}</span>
            </button>
          ))}
        </div>
      </section>

      <PrioritiesSection
        items={filteredPriorities}
        scopeLabel={selectedFilterLabel}
      />

      <section className="diagnostic-themes-stack" id="diagnostic-themes">
        <div className="page-card diagnostic-section">
          <header className="diagnostic-section__heading">
            <div>
              <h3>Pressão por tema</h3>
              <p>Distribuição das metas atingidas e das lacunas em cada dimensão acompanhada.</p>
            </div>
            <span>Visão estrutural</span>
          </header>
          <div className="diagnostic-area-grid">
            {analysis.areas.map((area) => (
              <AreaMiniCard area={area} key={area.key} />
            ))}
          </div>
        </div>

        <InsightCard
          className="diagnostic-insight--advances"
          description="Resultados que já alcançaram a referência ou estão próximos dela e devem ser preservados."
          icon="trendUp"
          emptyMessage="Nenhum avanço comparável foi identificado neste recorte."
          items={filteredBestPosition}
          showCategoryChip={showCategoryChip}
          title="Avanços a preservar"
          tone="success"
        />
      </section>
    </div>
  )
}

function SummaryMetric({ helper, label, tone = 'default', value }) {
  return (
    <div className={`diagnostic-scoreboard__item diagnostic-scoreboard__item--${tone}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      <small>{helper}</small>
    </div>
  )
}

function PrioritiesSection({ items, scopeLabel }) {
  const list = items ?? []
  return (
    <section className="page-card diagnostic-priorities" id="diagnostic-priorities">
      <header className="diagnostic-priorities__header">
        <div className="diagnostic-priorities__header-text">
          <span>Ordem de atenção · {scopeLabel}</span>
          <h3>Prioridades para decisão</h3>
          <p>Até cinco lacunas ordenadas pela proporção que ainda falta para alcançar cada meta.</p>
        </div>
        {list.length > 0 && (
          <span className="diagnostic-priorities__count">
            {list.length} {list.length === 1 ? 'prioridade' : 'prioridades'}
          </span>
        )}
      </header>
      {list.length ? (
        <ol className="diagnostic-priorities__list" aria-label="Prioridades do município">
          {list.map((item, index) => (
            <li className="diagnostic-priorities__item" key={item.key}>
              <span className="diagnostic-priorities__rank" aria-hidden="true">{index + 1}</span>
              <div className="diagnostic-priorities__body">
                <div className="diagnostic-priorities__topline">
                  <strong className="diagnostic-priorities__indicator" title={item.label}>
                    {item.label}
                  </strong>
                  <span className="diagnostic-priorities__chip diagnostic-priorities__chip--area">
                    {item.categoryLabel}
                  </span>
                </div>
                <p className="diagnostic-priorities__reading">{item.reading}</p>
                <details className="diagnostic-priorities__source">
                  <summary>
                    Evidência{item.referenceYear ? ` · ${item.referenceYear}` : ''}
                  </summary>
                  <p>{item.sourceNote || 'Fonte não declarada no recorte carregado.'}</p>
                </details>
              </div>
              <div className="diagnostic-priorities__measure">
                <div className="diagnostic-priorities__values">
                  <span>Atual <strong>{item.currentLabel}</strong></span>
                  <span>Meta <strong>{item.metaLabel}</strong></span>
                  <span className="diagnostic-priorities__status">{item.priorityLabel}</span>
                </div>
                <div className="diagnostic-priorities__progress" aria-label={`Atual ${item.currentLabel} de meta ${item.metaLabel}`}>
                  <span style={{ width: `${item.progressPercent}%` }} />
                </div>
                <strong className="diagnostic-priorities__distance">
                  <span>Distância</span>
                  {item.distanceLabel}
                </strong>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="diagnostic-empty-text">
          Nenhum indicador abaixo da meta com referência comparável neste ciclo.
        </p>
      )}
    </section>
  )
}

function ActionIcon({ icon }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icon === 'copy' ? (
        <>
          <rect x="8" y="8" width="11" height="11" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </>
      ) : (
        <>
          <path d="M7 8V4h10v4" />
          <rect x="6" y="14" width="12" height="6" />
          <path d="M6 17H4V9h16v8h-2" />
          <path d="M16 11h1" />
        </>
      )}
    </svg>
  )
}

function InsightCard({
  className = '',
  description,
  emptyMessage = 'Nenhum indicador disponível para esta leitura.',
  icon,
  items,
  showCategoryChip = true,
  title,
  tone,
}) {
  return (
    <section className={`page-card diagnostic-insight diagnostic-insight--${tone}${className ? ` ${className}` : ''}`}>
      <div className="diagnostic-insight__heading">
        <IconBubble icon={icon} tone={tone} />
        <div>
          <h3>{title}</h3>
          {description ? <p className="diagnostic-insight__description">{description}</p> : null}
        </div>
      </div>
      {items.length ? (
        <ul className="diagnostic-insight-list">
          {items.map((item) => (
            <li className="diagnostic-insight-list__item" key={item.key}>
              <span className="diagnostic-insight-list__marker" aria-hidden="true" />
              <div className="diagnostic-insight-list__body">
                <strong title={item.label}>{item.label}</strong>
                {showCategoryChip ? <small>{item.categoryLabel}</small> : null}
              </div>
              <p className="diagnostic-insight-list__result">{renderColoredNote(item.note, tone)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="diagnostic-empty-text">{emptyMessage}</p>
      )}
    </section>
  )
}

function AreaMiniCard({ area }) {
  const total = area.total
  const achievedPct = total > 0 ? (area.achieved / total) * 100 : 0
  const belowPct = total > 0 ? (area.below / total) * 100 : 0
  const hasItems = total > 0
  const gapLabel = area.worstIndicator
    ? `${area.worstIndicator.label} (${area.worstIndicator.summary})`
    : '-'

  return (
    <div className="diagnostic-area-mini-card">
      <div className="diagnostic-area-mini-card__header">
        <div className="diagnostic-area-mini-card__title">
          <IconBubble icon={area.key} tone="success" />
          <h4>{area.label}</h4>
        </div>
        <span className={`area-status area-status--${area.statusTone}`}>{area.statusLabel}</span>
      </div>
      <div className="diagnostic-area-mini-card__metrics">
        <div className="diagnostic-area-mini-card__metric">
          <span>Total</span>
          <strong>{area.total}</strong>
        </div>
        <div className="diagnostic-area-mini-card__metric">
          <span>Atingidas</span>
          <strong className="is-success">{area.achieved}</strong>
        </div>
        <div className="diagnostic-area-mini-card__metric">
          <span>Abaixo</span>
          <strong className="is-danger">{area.below}</strong>
        </div>
      </div>
      {hasItems ? (
        <div className="diagnostic-area-mini-card__bar" aria-label={`Distribuição de ${area.label}`}>
          <span className="diagnostic-area-mini-card__bar-achieved" style={{ width: `${achievedPct}%` }} />
          <span className="diagnostic-area-mini-card__bar-below" style={{ width: `${belowPct}%` }} />
        </div>
      ) : (
        <div className="diagnostic-area-mini-card__bar" />
      )}
      <p className="diagnostic-area-mini-card__reading">{area.reading}</p>
      <p className="diagnostic-area-mini-card__gap" title={gapLabel}>{gapLabel}</p>
    </div>
  )
}

function IconBubble({ icon, tone }) {
  return (
    <span className={`diagnostic-icon diagnostic-icon--${tone}`} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        {getIconPath(icon)}
      </svg>
    </span>
  )
}

function renderColoredNote(note, tone) {
  if (typeof note !== 'string' || !note) return note
  const match = note.match(/([+-]?\d+(?:[,.]\d+)?)(\s*p\.p\.)?/)
  if (!match) return note
  const start = match.index
  const end = start + match[0].length
  const before = note.slice(0, start)
  const value = note.slice(start, end)
  const after = note.slice(end)
  const isNegative = match[1].startsWith('-')
  const isPositive = match[1].startsWith('+')
  let valueClass = 'insight-note__value'
  if (tone === 'success' && isPositive) valueClass += ' is-positive'
  if (tone === 'danger' && isNegative) valueClass += ' is-negative'
  return (
    <>
      {before}
      <span className={valueClass}>{value}</span>
      {after}
    </>
  )
}

const ICON_ALIAS = {
  educacao_basica: 'atendimento',
  educacao_integral: 'atendimento',
  eja_educacao_profissional: 'escolaridade_populacao',
  educacao_especial: 'atendimento',
  ideb_saeb_fluxo: 'rendimento',
  infraestrutura_tecnologia: 'infraestrutura',
  gestao_ambiental: 'infraestrutura',
}

function getIconPath(icon) {
  const resolvedIcon = ICON_ALIAS[icon] ?? icon
  if (AREA_ICON_PATHS[resolvedIcon]) return AREA_ICON_PATHS[resolvedIcon]

  if (icon === 'clipboard') {
    return (
      <>
        <path d="M9 4h6l1 2h2v14H6V6h2l1-2Z" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
      </>
    )
  }
  if (icon === 'check') {
    return (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12 2.3 2.3 4.7-5" />
      </>
    )
  }
  if (icon === 'down') {
    return (
      <>
        <path d="M12 5v13" />
        <path d="m7 13 5 5 5-5" />
      </>
    )
  }
  if (icon === 'minus') {
    return (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M8 12h8" />
      </>
    )
  }
  if (icon === 'trendUp') {
    return (
      <>
        <path d="M4 16l5-5 4 4 7-8" />
        <path d="M15 7h5v5" />
      </>
    )
  }
  if (icon === 'trendDown') {
    return (
      <>
        <path d="M4 8l5 5 4-4 7 8" />
        <path d="M15 17h5v-5" />
      </>
    )
  }
  if (icon === 'book') {
    return (
      <>
        <path d="M5 5h6a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H5V5Z" />
        <path d="M19 5h-5a3 3 0 0 0-3 3" />
        <path d="M19 5v11h-5a3 3 0 0 0-3 3" />
      </>
    )
  }
  if (icon === 'alert') {
    return (
      <>
        <path d="M12 3 2 21h20L12 3Z" />
        <path d="M12 10v5" />
        <circle cx="12" cy="18" r="0.6" fill="currentColor" />
      </>
    )
  }
  return AREA_ICON_PATHS.atendimento
}

function buildDiagnosticAnalysis(categories, results) {
  const areas = categories
    .map((category) => buildAreaAnalysis(category, results))
    .filter((area) => area.total > 0)
  const indicators = areas.flatMap((area) => area.indicators)

  const uniqueIndicators = Array.from(
    new Map(indicators.map((indicator) => [indicator.rawKey, indicator])).values()
  )

  const summary = uniqueIndicators.reduce(
    (acc, indicator) => {
      acc.total += 1
      if (indicator.status === 'achieved') acc.achieved += 1
      if (indicator.status === 'below') acc.below += 1
      return acc
    },
    { achieved: 0, below: 0, total: 0 },
  )

  const bestPosition = buildBestPosition(uniqueIndicators)
  const largestGaps = buildLargestGaps(uniqueIndicators, bestPosition)
  const priorities = buildPriorities(uniqueIndicators)

  return {
    areas,
    bestPosition,
    indicators: uniqueIndicators,
    largestGaps,
    priorities,
    readings: buildReadings(summary, areas, priorities),
    summary,
  }
}

function buildAreaAnalysis(category, results) {
  const indicators = (category.items ?? [])
    .map((item) => normalizeDiagnosticIndicator(item, category, results?.[item.key]))
    .filter(Boolean)

  const achieved = indicators.filter((indicator) => indicator.status === 'achieved').length
  const below = indicators.filter((indicator) => indicator.status === 'below').length
  const total = indicators.length
  const comparableTotal = achieved + below
  const diagnosis = buildAreaDiagnosis({ achieved, below, comparableTotal })
  const bestIndicator = buildBestAreaIndicator(indicators)
  const worstIndicator = buildWorstAreaIndicator(indicators)

  return {
    achieved,
    bestIndicator,
    below,
    comparableTotal,
    indicators,
    key: category.key,
    label: category.shortLabel ?? category.label,
    fullLabel: category.label,
    reading: buildAreaReading({ achieved, below, comparableTotal, total }),
    statusLabel: diagnosis.statusLabel,
    statusTone: diagnosis.statusTone,
    total,
    worstIndicator,
  }
}

function normalizeDiagnosticIndicator(item, category, result) {
  if (!hasDiagnosticRealData(result)) return null
  if (!isPneComparableIndicator({ indicatorKey: item.key, result })) return null

  const isAccExpansion = isAccumulativeExpansionIndicator(item, result)
  const rawDistance = getNumericValue(result?.distance, result?.display?.distance)
  const variation = getNumericValue(result?.progress_delta, result?.raw_delta, result?.display?.variation)
  const unit = resolveIndicatorUnit(item, result)
  const rawCurrentValue = Number(result?.end_value)
  const rawMeta = Number(result?.meta)
  const currentValue = floorValueForGoal(rawCurrentValue, item, result)
  const meta = floorValueForGoal(rawMeta, item, result)
  const distance = isAccExpansion && Number.isFinite(currentValue) && Number.isFinite(meta)
    ? currentValue - meta
    : rawDistance

  return {
    categoryKey: category.key,
    categoryLabel: category.shortLabel ?? category.label,
    currentValue: Number.isFinite(currentValue) ? currentValue : null,
    distance,
    displayDistance: result?.display?.distance,
    displayVariation: result?.display?.variation,
    isAccExpansion,
    isComparable: true,
    key: `${category.key}-${item.key}`,
    label: item.label,
    meta: Number.isFinite(meta) ? meta : null,
    rawKey: item.key,
    referenceYear: Number.isFinite(Number(result?.end_year)) ? Number(result.end_year) : null,
    sourceNote: getDataSourceNote({ indicatorKey: item.key, item, result }),
    status: result?.atingida === true ? 'achieved' : 'below',
    unit,
    variation,
  }
}

function buildBestPosition(indicators) {
  const selectedKeys = new Set()
  const achieved = indicators
    .filter((indicator) => indicator.status === 'achieved' && indicator.isComparable)
    .sort((a, b) => getSortValue(b.distance) - getSortValue(a.distance))
    .map((indicator) => ({
      ...indicator,
      note: formatAchievedPositionNote(indicator),
    }))

  achieved.forEach((indicator) => selectedKeys.add(indicator.key))

  const nearGoal = indicators
    .filter((indicator) =>
      indicator.status === 'below'
      && indicator.isComparable
      && Number.isFinite(indicator.distance)
      && isCloseToGoal(indicator)
      && !selectedKeys.has(indicator.key),
    )
    .sort((a, b) => b.distance - a.distance)
    .map((indicator) => ({
      ...indicator,
      note: `Perto da meta ${formatDistance(indicator)}`,
    }))

  return [...achieved, ...nearGoal].slice(0, 3)
}

function buildLargestGaps(indicators, excludedIndicators = []) {
  const excludedKeys = new Set(excludedIndicators.map((indicator) => indicator.key))
  return indicators
    .filter((indicator) =>
      indicator.status === 'below'
      && indicator.isComparable
      && Number.isFinite(indicator.distance)
      && isNegativeHighlightEligible(indicator)
      && !excludedKeys.has(indicator.key),
    )
    .sort((a, b) => buildPriorityScore(b) - buildPriorityScore(a))
    .slice(0, 4)
    .map((indicator) => ({ ...indicator, note: formatDistance(indicator) }))
}

function formatAchievedPositionNote(indicator) {
  if (Number.isFinite(indicator.distance) && indicator.distance > 0) {
    return `Atingida ${formatDistance(indicator)}`
  }
  return 'Atingida'
}

function isCloseToGoal(indicator) {
  if (!Number.isFinite(indicator.distance) || indicator.distance >= 0) return false

  const gap = Math.abs(indicator.distance)
  if (indicator.unit === 'percent') return gap <= 10
  if (indicator.unit === 'index' || isIdebLabel(indicator.label)) return gap <= 0.5

  const meta = Math.abs(Number(indicator.meta))
  if (Number.isFinite(meta) && meta > 0) {
    return gap <= meta * 0.1
  }

  return false
}

function buildPriorities(indicators) {
  return indicators
    .filter((indicator) =>
      indicator.status === 'below'
      && indicator.isComparable
      && Number.isFinite(indicator.distance)
      && isNegativeHighlightEligible(indicator),
    )
    .sort((a, b) => buildPriorityScore(b) - buildPriorityScore(a))
    .slice(0, 5)
    .map((indicator) => ({
      ...indicator,
      currentLabel: formatIndicatorValueForPriority(indicator),
      distanceLabel: formatGapToGoal(indicator),
      metaLabel: formatMetaValueForPriority(indicator),
      priorityLabel: buildPriorityLabel(indicator),
      priorityScore: buildPriorityScore(indicator),
      progressPercent: buildPriorityProgressPercent(indicator),
      reading: buildPriorityReading(indicator),
      statusLabel: getIndicatorStatusLabel(indicator.status),
    }))
}

function buildPriorityScore(indicator) {
  const distance = Math.abs(Number(indicator?.distance))
  const meta = Math.abs(Number(indicator?.meta))
  if (!Number.isFinite(distance)) return 0
  if (Number.isFinite(meta) && meta > 0) return distance / meta
  return distance
}

function buildPriorityLabel(indicator) {
  const score = buildPriorityScore(indicator)
  if (score >= 0.5) return 'Lacuna muito elevada'
  if (score >= 0.25) return 'Lacuna elevada'
  return 'Requer acompanhamento'
}

function buildPriorityProgressPercent(indicator) {
  const current = Number(indicator.currentValue)
  const meta = Number(indicator.meta)
  if (!Number.isFinite(current) || !Number.isFinite(meta) || meta <= 0) return 0
  return Math.max(0, Math.min(100, (current / meta) * 100))
}

function buildPriorityReading(indicator) {
  const score = buildPriorityScore(indicator)
  const shareLabel = Math.round(score * 100).toLocaleString('pt-BR')
  if (score >= 0.5) {
    return `A distância representa cerca de ${shareLabel}% da própria meta e justifica investigação imediata das causas locais.`
  }
  if (score >= 0.25) {
    return `Ainda falta cerca de ${shareLabel}% da própria meta; o indicador deve entrar no planejamento e no monitoramento periódico.`
  }
  return `A lacuna equivale a cerca de ${shareLabel}% da própria meta; acompanhar a trajetória evita perda de ritmo.`
}

function buildExecutiveSummary(analysis) {
  const { areas, summary } = analysis
  if (!summary.total) {
    return 'Não há indicadores com meta comparável para uma síntese executiva neste município.'
  }

  const pressureArea = pickAreaByBelowPressure(areas)
  const pressureText = pressureArea?.below > 0
    ? `maior pressão em ${pressureArea.label}`
    : 'sem área crítica destacada'
  const achievedLabel = summary.achieved === 1 ? 'meta atingida' : 'metas atingidas'
  const attentionLabel = summary.below === 1 ? 'exige atenção' : 'exigem atenção'

  return `${summary.total} indicadores com meta analisados; ${summary.achieved} ${achievedLabel} e ${summary.below} ${attentionLabel}; ${pressureText}.`
}

function buildAccountabilitySummary(analysis, municipio) {
  const { priorities, summary } = analysis
  if (!summary.total) {
    return `${municipio} ainda não possui indicadores com dado municipal e meta comparável suficientes para uma síntese pública neste ciclo.`
  }

  const achievedLabel = summary.achieved === 1 ? 'meta foi atingida' : 'metas foram atingidas'
  const belowLabel = summary.below === 1 ? 'indicador permanece abaixo da meta' : 'indicadores permanecem abaixo da meta'
  const priorityText = priorities[0]
    ? `O principal ponto de atenção é ${priorities[0].label}, com distância de ${endSentence(priorities[0].distanceLabel)}`
    : 'Não foi identificado ponto de atenção comparável neste recorte.'

  return `Em ${municipio}, foram analisados ${summary.total} indicadores com meta comparável: ${summary.achieved} ${achievedLabel} e ${summary.below} ${belowLabel}. ${priorityText}`
}

function buildAccountabilityText(analysis, municipio) {
  const priorityLines = analysis.priorities.length
    ? analysis.priorities.map((item, index) => {
      const reference = item.referenceYear ? `, referência ${item.referenceYear}` : ''
      return `${index + 1}. ${item.label}: atual ${item.currentLabel}, meta ${item.metaLabel}, distância ${endSentence(`${item.distanceLabel}${reference}`)}`
    })
    : ['Nenhuma prioridade comparável identificada neste recorte.']
  const sources = buildSourceSummary(analysis.indicators)

  return [
    `DIAGNÓSTICO MUNICIPAL — ${municipio}`,
    'PNE 2026–2036',
    '',
    buildAccountabilitySummary(analysis, municipio),
    '',
    'Prioridades para acompanhamento:',
    ...priorityLines,
    '',
    sources.length ? `Fontes: ${sources.join('; ')}.` : 'Fontes: não declaradas no recorte carregado.',
    '',
    'Nota de leitura: o diagnóstico mostra a posição dos indicadores frente às metas. A definição de ações depende do contexto local, da capacidade de execução e da escuta da comunidade.',
  ].join('\n')
}

function buildSourceSummary(indicators) {
  return [...new Set(
    (indicators ?? [])
      .map((indicator) => String(indicator.sourceNote ?? '').split('. Nota metodológica:')[0])
      .filter(Boolean),
  )]
}

function endSentence(text) {
  return /[.!?]$/.test(text) ? text : `${text}.`
}

function buildAreaReading({ achieved, below, comparableTotal, total }) {
  if (!total || !comparableTotal) return 'Sem indicadores com meta comparável.'
  if (achieved >= below) {
    return 'Predomínio de metas atingidas.'
  }
  if (below > achieved && achieved > 0) {
    return 'Resultado misto.'
  }
  return 'Predomínio abaixo da meta.'
}

function getIndicatorStatusLabel(status) {
  if (status === 'achieved') return 'Meta atingida'
  return 'Abaixo da meta'
}

function formatIndicatorValueForPriority(indicator) {
  return formatNumberByUnit(indicator.currentValue, indicator.unit, isIdebLabel(indicator.label))
}

function formatMetaValueForPriority(indicator) {
  return formatNumberByUnit(Number(indicator.meta), indicator.unit, isIdebLabel(indicator.label))
}

function formatNumberByUnit(value, unit, keepOneDecimal = false) {
  if (!Number.isFinite(value)) return '-'
  if (unit === 'percent') {
    if (keepOneDecimal) {
      return `${value.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`
    }
    return `${Math.round(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`
  }
  if (unit === 'index' || unit === 'years') {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  }
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function buildReadings(summary, areas, priorities) {
  const comparableTotal = summary.achieved + summary.below
  const achievedShare = comparableTotal ? summary.achieved / comparableTotal : 0
  const belowArea = pickAreaByBelowPressure(areas)
  const bestArea = pickAreaByComparableRatio(areas, 'achieved')

  let overview
  if (summary.total === 0) {
    overview = 'Não há indicadores com meta comparável para este município no ciclo vigente.'
  } else {
    let toneText
    if (achievedShare >= 0.55) {
      toneText = 'predominância de metas atingidas'
    } else if (achievedShare >= 0.25) {
      toneText = 'desempenho heterogêneo entre temas'
    } else {
      toneText = 'predominância de indicadores abaixo da meta'
    }
    overview = `${summary.total} indicadores com meta: ${summary.achieved} metas atingidas e ${summary.below} exigem atenção. O quadro indica ${toneText}.`
  }

  const bestAreaText = bestArea?.achieved > 0
    ? `${bestArea.label}: ${bestArea.achieved} de ${bestArea.comparableTotal} indicadores com meta atingem a referência.`
    : 'Não há indicadores com meta suficientes para destacar uma área favorável.'

  const belowAreaText = belowArea?.below > 0
    ? `${belowArea.label}: ${belowArea.below} de ${belowArea.comparableTotal} indicadores com meta estão abaixo da referência.`
    : 'Não há indicadores com meta abaixo da referência para destacar uma área crítica.'

  const topPriority = priorities[0]
  const priorityText = topPriority
    ? `${topPriority.label}: ${formatDistance(topPriority, true)} em ${topPriority.categoryLabel}.`
    : 'Não há indicadores abaixo da meta com prioridade crítica.'

  return [
    { key: 'overview', title: 'Quadro geral', text: overview },
    { key: 'best-area', title: 'Área mais favorável', text: bestAreaText },
    { key: 'gap-area', title: 'Área mais crítica', text: belowAreaText },
    { key: 'priority', title: 'Prioridade de ação', text: priorityText },
  ]
}

function buildAreaDiagnosis({ achieved, below, comparableTotal }) {
  if (!comparableTotal) {
    return {
      statusLabel: 'Sem indicadores',
      statusTone: 'neutral',
    }
  }

  const achievedShare = achieved / comparableTotal
  const belowShare = below / comparableTotal

  if (achievedShare >= 0.5) {
    return {
      statusLabel: 'Favorável',
      statusTone: 'success',
    }
  }

  if (belowShare >= 0.75 || achieved === 0) {
    return {
      statusLabel: 'Abaixo da meta',
      statusTone: 'danger',
    }
  }

  if (achieved > 0 && below > 0) {
    return {
      statusLabel: 'Misto',
      statusTone: 'mixed',
    }
  }

  return {
    statusLabel: 'Abaixo da meta',
    statusTone: 'danger',
  }
}

function buildBestAreaIndicator(indicators) {
  const achieved = indicators
    .filter((indicator) => indicator.status === 'achieved' && Number.isFinite(indicator.distance))
    .sort((a, b) => b.distance - a.distance)[0]

  if (achieved) {
    return {
      ...achieved,
      summary: `Meta atingida, ${formatDistance(achieved)}`,
    }
  }

  const closestBelow = indicators
    .filter((indicator) => indicator.status === 'below' && Number.isFinite(indicator.distance))
    .sort((a, b) => b.distance - a.distance)[0]

  if (closestBelow) {
    return {
      ...closestBelow,
      summary: `Mais próximo da meta, ${formatDistance(closestBelow, true)}`,
    }
  }

  return null
}

function buildWorstAreaIndicator(indicators) {
  const worst = indicators
    .filter((indicator) =>
      indicator.status === 'below'
      && Number.isFinite(indicator.distance)
      && isNegativeHighlightEligible(indicator),
    )
    .sort((a, b) => a.distance - b.distance)[0]

  if (!worst) return null

  return {
    ...worst,
    summary: `${formatGapToGoal(worst)} abaixo da meta`,
  }
}

function hasDiagnosticRealData(result) {
  if (!result || result.available === false) return false
  const status = String(result?.display?.status ?? '').toLocaleLowerCase('pt-BR')
  if (status.includes('indispon') || status.includes('sem dados')) return false

  const start = Number(result?.start_value)
  const end = Number(result?.end_value)
  const series = (result?.series ?? [])
    .map((point) => Number(point?.valor))
    .filter(Number.isFinite)

  return Number.isFinite(start) || Number.isFinite(end) || series.length > 0
}

function formatDistance(indicator, includeMetaSuffix = false) {
  if (!Number.isFinite(indicator?.distance)) return 'distância não calculável'
  const value = indicator.distance
  const keepOneDecimal = isIdebLabel(indicator.label)
  const formatted = formatSignedNumber(value, keepOneDecimal)
  const unit = indicator.unit === 'percent'
    ? ' p.p.'
    : indicator.unit === 'years'
      ? ' anos'
      : ''
  return `${formatted}${unit}${includeMetaSuffix ? ' da meta' : ''}`
}

function formatGapToGoal(indicator) {
  if (!Number.isFinite(indicator?.distance)) return 'valor não calculável'
  const value = Math.abs(indicator.distance)
  const keepOneDecimal = isIdebLabel(indicator.label)
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: keepOneDecimal ? 1 : 0,
    maximumFractionDigits: keepOneDecimal ? 1 : 0,
  })
  const unit = indicator.unit === 'percent'
    ? ' p.p.'
    : indicator.unit === 'years'
      ? ' anos'
      : ''
  return `${formatted}${unit}`
}

function formatSignedNumber(value, keepOneDecimal = false) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString('pt-BR', {
    minimumFractionDigits: keepOneDecimal ? 1 : 0,
    maximumFractionDigits: keepOneDecimal ? 1 : 0,
  })}`
}

function isIdebLabel(label) {
  return String(label ?? '').toLocaleLowerCase('pt-BR').includes('ideb')
}

function getNumericValue(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    const text = String(value ?? '').toLocaleLowerCase('pt-BR')
    const match = text.match(/[-+]?\d+(?:[,.]\d+)?/)
    if (!match) continue
    const parsed = Number(match[0].replace(',', '.'))
    if (!Number.isFinite(parsed)) continue
    if (text.includes('queda')) return -Math.abs(parsed)
    if (text.includes('alta')) return Math.abs(parsed)
    return parsed
  }
  return Number.NaN
}

function getSortValue(value) {
  return Number.isFinite(value) ? value : -Infinity
}

function pickAreaByComparableRatio(areas, key) {
  return [...areas]
    .filter((area) => area.comparableTotal > 0)
    .sort((a, b) => (b[key] / b.comparableTotal) - (a[key] / a.comparableTotal))[0] ?? null
}

function pickAreaByBelowPressure(areas) {
  return [...areas]
    .filter((area) => area.comparableTotal > 0)
    .sort((a, b) => {
      const countDiff = b.below - a.below
      if (countDiff !== 0) return countDiff
      return (b.below / b.comparableTotal) - (a.below / a.comparableTotal)
    })[0] ?? null
}
