import { resolveIndicatorUnit } from '../utils/format'

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

      <section className="diagnostic-insight-grid">
        <InsightCard
          icon="trendUp"
          items={analysis.bestPosition}
          title="Melhor posicionamento"
          tone="success"
        />
        <InsightCard
          icon="trendDown"
          items={analysis.largestGaps}
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

      <section className="page-card diagnostic-reading">
        <div className="diagnostic-reading__heading">
          <IconBubble icon="book" tone="success" />
          <h3>Leitura do posicionamento</h3>
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

function InsightCard({ icon, items, title, tone }) {
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
                <p>{item.label} — {item.note}</p>
                <small>{item.categoryLabel}</small>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="diagnostic-empty-text">Nenhum indicador disponível para esta leitura.</p>
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
      <div className="area-position-lines">
        <PositionLine
          label="Melhor"
          value={area.bestIndicator?.summary ?? 'Sem indicador comparável com meta nesta área.'}
        />
        <PositionLine
          label="Maior distância"
          value={area.worstIndicator?.summary ?? 'Sem indicador abaixo da meta nesta área.'}
        />
      </div>
      <p>{area.reading}</p>
    </article>
  )
}

function PositionLine({ label, value }) {
  return (
    <p className="area-position-line">
      <strong>{label}:</strong> <span>{value}</span>
    </p>
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
  const largestGaps = indicators
    .filter((indicator) => indicator.status === 'below')
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4)
    .map((indicator) => ({ ...indicator, note: formatDistance(indicator, true) }))

  return {
    areas,
    bestPosition,
    largestGaps,
    readings: buildReadings(summary, areas),
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
  const diagnosis = buildAreaDiagnosis({ achieved, below, noComparison, total })
  const bestIndicator = buildBestAreaIndicator(indicators)
  const worstIndicator = buildWorstAreaIndicator(indicators)

  return {
    achieved,
    bestIndicator,
    below,
    indicators,
    key: category.key,
    label: category.label,
    noComparison,
    reading: diagnosis.reading,
    statusLabel: diagnosis.statusLabel,
    statusTone: diagnosis.statusTone,
    total,
    worstIndicator,
  }
}

function normalizeDiagnosticIndicator(item, category, result) {
  if (!hasDiagnosticRealData(result)) return null

  const comparable = isDiagnosticComparable(result)
  const distance = getNumericValue(result?.distance, result?.display?.distance)
  const variation = getNumericValue(result?.progress_delta, result?.raw_delta, result?.display?.variation)
  const unit = resolveIndicatorUnit(item, result)

  return {
    categoryKey: category.key,
    categoryLabel: category.label,
    distance,
    displayDistance: result?.display?.distance,
    displayVariation: result?.display?.variation,
    key: `${category.key}-${item.key}`,
    label: item.label,
    rawKey: item.key,
    status: comparable ? (result?.atingida === true ? 'achieved' : 'below') : 'noComparison',
    unit,
    variation,
  }
}

function buildBestPosition(indicators) {
  const achieved = indicators
    .filter((indicator) => indicator.status === 'achieved')
    .sort((a, b) => getSortValue(b.distance) - getSortValue(a.distance))
    .map((indicator) => ({
      ...indicator,
      note: `meta atingida${Number.isFinite(indicator.distance) ? ` (${formatDistance(indicator)})` : ''}`,
    }))

  const achievedKeys = new Set(achieved.map((indicator) => indicator.key))
  const favorable = indicators
    .filter((indicator) => !achievedKeys.has(indicator.key) && getSortValue(indicator.variation) > 0)
    .sort((a, b) => getSortValue(b.variation) - getSortValue(a.variation))
    .map((indicator) => ({
      ...indicator,
      note: indicator.status === 'below'
        ? `avanço observado${formatVariationSuffix(indicator)}`
        : `desempenho favorável${formatVariationSuffix(indicator)}`,
    }))

  return [...achieved, ...favorable].slice(0, 3)
}

function buildReadings(summary, areas) {
  const comparableTotal = summary.achieved + summary.below
  const achievedShare = comparableTotal ? summary.achieved / comparableTotal : 0
  const belowArea = pickAreaByCount(areas, 'below')
  const noComparisonArea = pickAreaByCount(areas, 'noComparison')
  const bestArea = pickAreaByRatio(areas, 'achieved')
  const achievedPercent = Math.round(achievedShare * 100)
  const belowPercent = comparableTotal ? Math.round((summary.below / comparableTotal) * 100) : 0

  const overviewTone =
    achievedShare >= 0.55
      ? 'boa proporção de metas atingidas'
      : achievedShare >= 0.25
        ? 'desempenho heterogêneo entre áreas'
        : 'baixa proporção de metas atingidas'

  const overview = `Dos ${summary.total} indicadores analisados, ${summary.achieved} aparecem com meta atingida (${achievedPercent}% dos comparáveis) e ${summary.below} estão abaixo da referência (${belowPercent}%). O conjunto indica ${overviewTone} no ciclo vigente.`

  const bestAreaText = bestArea?.achieved > 0
    ? `${bestArea.label} apresenta o melhor posicionamento relativo, com ${bestArea.achieved} metas atingidas entre ${bestArea.total} indicadores analisados.`
    : 'Nenhuma área apresenta meta atingida entre os indicadores comparáveis analisados.'

  const belowAreaText = belowArea?.below > 0
    ? `${belowArea.label} concentra ${belowArea.below} indicadores abaixo da meta entre ${belowArea.total} analisados.`
    : 'Não há concentração de indicadores abaixo da meta nas áreas analisadas.'

  const comparisonText = noComparisonArea?.noComparison > 0
    ? `${noComparisonArea.label} reúne ${noComparisonArea.noComparison} indicadores sem comparação, o que limita parte da leitura direta por meta.`
    : 'Os indicadores analisados têm comparação direta com meta no ciclo vigente.'

  return [
    { key: 'overview', title: 'Quadro geral', text: overview },
    { key: 'best-area', title: 'Área mais favorável', text: bestAreaText },
    { key: 'gap-area', title: 'Área com maior distância', text: belowAreaText },
    { key: 'comparison', title: 'Sem comparação', text: comparisonText },
  ]
}

function buildAreaDiagnosis({ achieved, below, noComparison, total }) {
  const comparableTotal = achieved + below
  const achievedShare = comparableTotal ? achieved / comparableTotal : 0
  const belowShare = comparableTotal ? below / comparableTotal : 0
  const noComparisonShare = total ? noComparison / total : 0

  if (achievedShare >= 0.5) {
    return {
      reading: 'Área com melhor proporção relativa de metas atingidas.',
      statusLabel: 'Mais favorável',
      statusTone: 'success',
    }
  }

  if (belowShare >= 0.75) {
    return {
      reading: 'Concentração de indicadores abaixo da meta.',
      statusLabel: 'Predomínio abaixo da meta',
      statusTone: 'danger',
    }
  }

  if (noComparisonShare >= 0.4) {
    return {
      reading: 'Parte relevante da área não possui comparação direta por meta.',
      statusLabel: 'Muitos sem comparação',
      statusTone: 'neutral',
    }
  }

  if (achieved > 0 && below > 0) {
    return {
      reading: 'Área com resultados favoráveis e indicadores ainda abaixo da meta.',
      statusLabel: 'Resultado misto',
      statusTone: 'mixed',
    }
  }

  return {
    reading: 'Área com poucos indicadores comparáveis disponíveis.',
    statusLabel: 'Leitura limitada',
    statusTone: 'neutral',
  }
}

function buildBestAreaIndicator(indicators) {
  const achieved = indicators
    .filter((indicator) => indicator.status === 'achieved' && Number.isFinite(indicator.distance))
    .sort((a, b) => b.distance - a.distance)[0]

  if (achieved) {
    return {
      ...achieved,
      summary: `${achieved.label} — meta atingida, ${formatDistance(achieved)}`,
    }
  }

  const closestBelow = indicators
    .filter((indicator) => indicator.status === 'below' && Number.isFinite(indicator.distance))
    .sort((a, b) => b.distance - a.distance)[0]

  if (closestBelow) {
    return {
      ...closestBelow,
      summary: `${closestBelow.label} — mais próximo da meta, ${formatDistance(closestBelow, true)}`,
    }
  }

  const bestVariation = indicators
    .filter((indicator) => indicator.status !== 'noComparison' && Number.isFinite(indicator.variation))
    .sort((a, b) => b.variation - a.variation)[0]

  if (bestVariation) {
    return {
      ...bestVariation,
      summary: `${bestVariation.label} — maior avanço observado${formatVariationSuffix(bestVariation)}`,
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
    summary: `${worst.label} — ${formatDistance(worst, true)}`,
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
  const formatted = formatSignedNumber(value)
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
  const formatted = formatSignedNumber(indicator.variation)
  const unit = indicator.unit === 'percent'
    ? ' p.p.'
    : indicator.unit === 'years'
      ? ' anos'
      : ''
  return ` (${formatted}${unit})`
}

function formatSignedNumber(value) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}`
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

function pickAreaByCount(areas, key) {
  return [...areas].sort((a, b) => b[key] - a[key])[0] ?? null
}

function pickAreaByRatio(areas, key) {
  return [...areas]
    .filter((area) => area.total > 0)
    .sort((a, b) => (b[key] / b.total) - (a[key] / a.total))[0] ?? null
}
