import { useMemo, useState } from 'react'
import {
  floorValueForGoal,
  isAccumulativeExpansionIndicator,
  resolveIndicatorUnit,
} from '../utils/format'

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
  const filterOptions = useMemo(
    () => [{ key: 'all', label: 'Todas' }, ...analysis.areas.map(({ key, label }) => ({ key, label }))],
    [analysis.areas],
  )
  const filteredIndicators = useMemo(
    () => selectedFilter === 'all'
      ? analysis.indicators
      : analysis.indicators.filter((indicator) => indicator.categoryKey === selectedFilter),
    [analysis.indicators, selectedFilter],
  )
  const filteredBestPosition = useMemo(() => buildBestPosition(filteredIndicators), [filteredIndicators])
  const filteredLargestGaps = useMemo(() => buildLargestGaps(filteredIndicators), [filteredIndicators])
  const showCategoryChip = selectedFilter === 'all'

  if (!data && analysis.summary.total === 0) {
    return (
      <section className="detail-panel empty-panel">
        <p>Não há diagnóstico para {municipio}.</p>
      </section>
    )
  }

  return (
    <div className="diagnostic-panel">
      <section className="page-card diagnostic-hero">
        <div>
          <h2>Diagnóstico de {municipio}</h2>
          <p>Síntese dos indicadores e posicionamento do município no ciclo vigente.</p>
        </div>
        <div className="diagnostic-summary">
          <SummaryCard
            icon="clipboard"
            label="Indicadores analisados"
            tone="default"
            value={analysis.summary.total}
          />
          <SummaryCard
            icon="check"
            label="Metas atingidas"
            tone="success"
            value={analysis.summary.achieved}
          />
          <SummaryCard
            icon="down"
            label="Abaixo da meta"
            tone="danger"
            value={analysis.summary.below}
          />
          <SummaryCard
            icon="minus"
            label="Sem comparação"
            tone="neutral"
            value={analysis.summary.noComparison}
          />
        </div>
      </section>

      <section className="diagnostic-filter-bar" aria-label="Filtrar destaques por categoria">
        <span>Filtrar destaques</span>
        <div className="diagnostic-filter-chips">
          {filterOptions.map((option) => (
            <button
              className={`diagnostic-filter-chip${selectedFilter === option.key ? ' is-active' : ''}`}
              key={option.key}
              onClick={() => setSelectedFilter(option.key)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="diagnostic-insight-grid">
        <InsightCard
          icon="trendUp"
          emptyMessage="Nenhum indicador comparável com meta nesta categoria."
          items={filteredBestPosition}
          showCategoryChip={showCategoryChip}
          title="Melhor posicionamento"
          tone="success"
        />
        <InsightCard
          icon="trendDown"
          emptyMessage="Nenhum indicador abaixo da meta nesta categoria."
          items={filteredLargestGaps}
          showCategoryChip={showCategoryChip}
          title="Maiores distâncias da meta"
          tone="danger"
        />
      </section>

      <section className="page-card diagnostic-section">
        <h3>Posicionamento por área</h3>
        <div className="diagnostic-grid">
          {analysis.areas.map((area) => (
            <AreaCard area={area} key={area.key} />
          ))}
        </div>
      </section>

      <PrioritiesSection items={analysis.priorities} />

      <section className="page-card diagnostic-reading">
        <div className="diagnostic-reading__heading">
          <IconBubble icon="book" tone="success" />
          <h3>Síntese analítica</h3>
        </div>
        <div className="diagnostic-reading__grid">
          {analysis.readings.map((reading) => (
            <article className="reading-card" key={reading.key}>
              <strong>{reading.title}</strong>
              <p>{reading.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ icon, label, tone, value }) {
  return (
    <article className={`diagnostic-summary-card diagnostic-summary-card--${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <IconBubble icon={icon} tone={tone} />
    </article>
  )
}

function PrioritiesSection({ items }) {
  const list = items ?? []
  return (
    <section className="page-card diagnostic-priorities">
      <header className="diagnostic-priorities__header">
        <div className="diagnostic-priorities__header-text">
          <span className="diagnostic-priorities__eyebrow">Plano de ação</span>
          <h3>Prioridades do município</h3>
          <p>
            Indicadores comparáveis com maior distância negativa em relação à meta.
          </p>
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
                <strong className="diagnostic-priorities__indicator" title={item.label}>
                  {item.label}
                </strong>
                <span className="diagnostic-priorities__chip diagnostic-priorities__chip--area">
                  {item.categoryLabel}
                </span>
              </div>
              <div className="diagnostic-priorities__meta">
                <span className="diagnostic-priorities__chip">
                  Atual: <strong>{item.currentLabel}</strong>
                </span>
                <span className="diagnostic-priorities__chip">
                  Meta: <strong>{item.metaLabel}</strong>
                </span>
                <span className="diagnostic-priorities__chip diagnostic-priorities__chip--negative">
                  Distância: <strong>{item.distanceLabel}</strong>
                </span>
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

function InsightCard({ emptyMessage = 'Nenhum indicador disponível para esta leitura.', icon, items, showCategoryChip = true, title, tone }) {
  return (
    <section className={`page-card diagnostic-insight diagnostic-insight--${tone}`}>
      <div className="diagnostic-insight__heading">
        <IconBubble icon={icon} tone={tone} />
        <h3>{title}</h3>
      </div>
      {items.length ? (
        <ul className="diagnostic-insight-list">
          {items.map((item) => (
            <li key={item.key}>
              <span aria-hidden="true" />
              <div>
                <p>{item.label} — {renderColoredNote(item.note, tone)}</p>
                {showCategoryChip ? <small>{item.categoryLabel}</small> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="diagnostic-empty-text">{emptyMessage}</p>
      )}
    </section>
  )
}

function AreaCard({ area }) {
  const achievedWidth = getSegmentWidth(area.achieved, area.total)
  const belowWidth = getSegmentWidth(area.below, area.total)
  const noComparisonWidth = getSegmentWidth(area.noComparison, area.total)

  return (
    <article className="diagnostic-area">
      <div className="diagnostic-area__title">
        <div>
          <IconBubble icon={area.key} tone="success" />
          <h4>{area.label}</h4>
        </div>
        <span className={`area-status area-status--${area.statusTone}`}>{area.statusLabel}</span>
      </div>
      <dl>
        <div>
          <dt>Total</dt>
          <dd>{area.total}</dd>
        </div>
        <div>
          <dt>Atingidas</dt>
          <dd className="is-success">{area.achieved}</dd>
        </div>
        <div>
          <dt>Abaixo da meta</dt>
          <dd className="is-danger">{area.below}</dd>
        </div>
        <div>
          <dt>Sem comp.</dt>
          <dd>{area.noComparison}</dd>
        </div>
      </dl>
      <div className="stacked-bar" aria-label={`Distribuição de ${area.label}`}>
        <span className="stacked-bar__success" style={{ width: `${achievedWidth}%` }} />
        <span className="stacked-bar__danger" style={{ width: `${belowWidth}%` }} />
        <span className="stacked-bar__neutral" style={{ width: `${noComparisonWidth}%` }} />
      </div>
      <HighlightBlock
        title="Melhor"
        tone="success"
        emptyText="Sem indicador comparável com meta nesta área."
        indicator={area.bestIndicator}
      />
      <HighlightBlock
        title="Lacuna"
        tone="danger"
        emptyText="Sem indicador abaixo da meta nesta área."
        indicator={area.worstIndicator}
      />
    </article>
  )
}

function HighlightBlock({ title, tone, emptyText, indicator }) {
  if (!indicator) {
    return (
      <div className={`area-highlight area-highlight--${tone}`}>
        <span className="area-highlight__title">{title}</span>
        <span className="area-highlight__empty">{emptyText}</span>
      </div>
    )
  }
  return (
    <div className={`area-highlight area-highlight--${tone}`}>
      <span className="area-highlight__title">{title}</span>
      <strong
        className="area-highlight__label"
        title={indicator.label}
      >
        {indicator.label}
      </strong>
      <span className="area-highlight__note">{indicator.summary}</span>
    </div>
  )
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}…`
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

function getIconPath(icon) {
  if (AREA_ICON_PATHS[icon]) return AREA_ICON_PATHS[icon]

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
  const areas = categories.map((category) => buildAreaAnalysis(category, results))
  const indicators = areas.flatMap((area) => area.indicators)

  const summary = indicators.reduce(
    (acc, indicator) => {
      acc.total += 1
      if (indicator.status === 'achieved') acc.achieved += 1
      if (indicator.status === 'below') acc.below += 1
      if (indicator.status === 'noComparison') acc.noComparison += 1
      return acc
    },
    { achieved: 0, below: 0, noComparison: 0, total: 0 },
  )

  const bestPosition = buildBestPosition(indicators)
  const largestGaps = buildLargestGaps(indicators)
  const priorities = buildPriorities(indicators)

  return {
    areas,
    bestPosition,
    indicators,
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
  const noComparison = indicators.filter((indicator) => indicator.status === 'noComparison').length
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
    label: category.label,
    noComparison,
    statusLabel: diagnosis.statusLabel,
    statusTone: diagnosis.statusTone,
    total,
    worstIndicator,
  }
}

function normalizeDiagnosticIndicator(item, category, result) {
  if (!hasDiagnosticRealData(result)) return null

  const comparable = isDiagnosticComparable(result)
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
    categoryLabel: category.label,
    currentValue: Number.isFinite(currentValue) ? currentValue : null,
    distance,
    displayDistance: result?.display?.distance,
    displayVariation: result?.display?.variation,
    isAccExpansion,
    isComparable: comparable,
    key: `${category.key}-${item.key}`,
    label: item.label,
    meta: Number.isFinite(meta) ? meta : null,
    rawKey: item.key,
    status: comparable ? (result?.atingida === true ? 'achieved' : 'below') : 'noComparison',
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
      note: `meta atingida${Number.isFinite(indicator.distance) ? ` (${formatDistance(indicator)})` : ''}`,
    }))

  achieved.forEach((indicator) => selectedKeys.add(indicator.key))

  const closestBelow = indicators
    .filter((indicator) => indicator.status === 'below' && indicator.isComparable && Number.isFinite(indicator.distance) && !selectedKeys.has(indicator.key))
    .sort((a, b) => b.distance - a.distance)
    .map((indicator) => ({
      ...indicator,
      note: `mais próximo da meta (${formatDistance(indicator, true)})`,
    }))

  closestBelow.forEach((indicator) => selectedKeys.add(indicator.key))

  const progress = indicators
    .filter((indicator) => indicator.isComparable && Number.isFinite(indicator.variation) && !selectedKeys.has(indicator.key))
    .sort((a, b) => getSortValue(b.variation) - getSortValue(a.variation))
    .map((indicator) => ({
      ...indicator,
      note: `maior avanço observado${formatVariationSuffix(indicator)}`,
    }))

  return [...achieved, ...closestBelow, ...progress].slice(0, 3)
}

function buildLargestGaps(indicators) {
  return indicators
    .filter((indicator) => indicator.status === 'below' && indicator.isComparable && Number.isFinite(indicator.distance))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4)
    .map((indicator) => ({ ...indicator, note: formatDistance(indicator, true) }))
}

function buildPriorities(indicators) {
  return indicators
    .filter((indicator) => indicator.status === 'below' && indicator.isComparable && Number.isFinite(indicator.distance))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
    .map((indicator) => ({
      ...indicator,
      currentLabel: formatIndicatorValueForPriority(indicator),
      metaLabel: formatMetaValueForPriority(indicator),
      distanceLabel: formatDistance(indicator, true),
    }))
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
  const achievedPercent = Math.round(achievedShare * 100)
  const belowPercent = comparableTotal ? Math.round((summary.below / comparableTotal) * 100) : 0
  const noComparison = summary.total - comparableTotal

  let overview
  if (summary.total === 0) {
    overview = 'Não há indicadores disponíveis para este município no ciclo vigente.'
  } else if (!comparableTotal) {
    overview = `Dos ${summary.total} indicadores analisados, nenhum possui referência de meta comparável. A leitura do município é limitada neste ciclo.`
  } else {
    const achievedPart = `${summary.achieved} com meta atingida (${achievedPercent}% dos comparáveis)`
    const belowPart = `${summary.below} abaixo da referência (${belowPercent}% dos comparáveis)`
    let toneText
    if (achievedShare >= 0.55) {
      toneText = 'predominância de metas atingidas no ciclo vigente'
    } else if (achievedShare >= 0.25) {
      toneText = 'desempenho heterogêneo entre áreas'
    } else {
      toneText = 'predominância de indicadores abaixo da meta'
    }
    const noComparisonPart = noComparison > 0
      ? ` Outros ${noComparison} indicadores não possuem referência comparável.`
      : ''
    overview = `Dos ${summary.total} indicadores analisados, ${achievedPart} e ${belowPart}. O conjunto indica ${toneText}.${noComparisonPart}`
  }

  const bestAreaText = bestArea?.comparableTotal > 0
    ? `${bestArea.label} é a área mais favorável, com ${bestArea.achieved} metas atingidas em ${bestArea.comparableTotal} indicadores comparáveis (${Math.round((bestArea.achieved / bestArea.comparableTotal) * 100)}%).`
    : 'Não há indicadores comparáveis suficientes para destacar uma área favorável.'

  const belowAreaText = belowArea?.below > 0
    ? `${belowArea.label} é a área mais crítica, com ${belowArea.below} indicadores abaixo da meta em ${belowArea.comparableTotal} comparáveis (${Math.round((belowArea.below / belowArea.comparableTotal) * 100)}%).`
    : 'Não há indicadores comparáveis abaixo da meta para destacar uma área crítica.'

  const topPriority = priorities[0]
  const priorityText = topPriority
    ? `Concentre atenção em ${topPriority.categoryLabel.toLocaleLowerCase('pt-BR')}, especialmente no indicador "${topPriority.label}", que está ${formatDistance(topPriority, true)}.`
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
      statusLabel: 'Baixa comparabilidade',
      statusTone: 'neutral',
    }
  }

  const achievedShare = achieved / comparableTotal
  const belowShare = below / comparableTotal

  if (achievedShare >= 0.5) {
    return {
      statusLabel: 'Resultado favorável',
      statusTone: 'success',
    }
  }

  if (belowShare >= 0.75 || achieved === 0) {
    return {
      statusLabel: 'Predomínio abaixo da meta',
      statusTone: 'danger',
    }
  }

  if (achieved > 0 && below > 0) {
    return {
      statusLabel: 'Resultado misto',
      statusTone: 'mixed',
    }
  }

  return {
    statusLabel: 'Predomínio abaixo da meta',
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

  const bestVariation = indicators
    .filter((indicator) => indicator.status !== 'noComparison' && Number.isFinite(indicator.variation))
    .sort((a, b) => b.variation - a.variation)[0]

  if (bestVariation) {
    return {
      ...bestVariation,
      summary: `Maior avanço observado${formatVariationSuffix(bestVariation)}`,
    }
  }

  return null
}

function buildWorstAreaIndicator(indicators) {
  const worst = indicators
    .filter((indicator) => indicator.status === 'below' && Number.isFinite(indicator.distance))
    .sort((a, b) => a.distance - b.distance)[0]

  if (!worst) return null

  return {
    ...worst,
    summary: formatDistance(worst, true),
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

function isDiagnosticComparable(result) {
  const status = String(result?.display?.status ?? '').toLocaleLowerCase('pt-BR')
  return (
    Boolean(result) &&
    result.available !== false &&
    result.tracks_goal !== false &&
    Number.isFinite(Number(result?.meta)) &&
    !status.includes('visualiza') &&
    !status.includes('informativo') &&
    !status.includes('indispon') &&
    !status.includes('sem dados')
  )
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

function formatVariationSuffix(indicator) {
  if (typeof indicator?.displayVariation === 'string' && indicator.displayVariation !== '-') {
    return ` (${indicator.displayVariation})`
  }
  if (!Number.isFinite(indicator?.variation)) return ''
  const keepOneDecimal = isIdebLabel(indicator.label)
  const formatted = formatSignedNumber(indicator.variation, keepOneDecimal)
  const unit = indicator.unit === 'percent'
    ? ' p.p.'
    : indicator.unit === 'years'
      ? ' anos'
      : ''
  return ` (${formatted}${unit})`
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

function getSegmentWidth(value, total) {
  if (!total || !value) return 0
  return Math.max(3, (value / total) * 100)
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
