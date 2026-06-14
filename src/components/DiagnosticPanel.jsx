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
          {analysis.readings.map((reading, index) => (
            <article className="reading-card" key={reading}>
              <span>{index + 1}</span>
              <p>{reading}</p>
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
              <p>{item.label} — {item.note}</p>
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
        <IconBubble icon={area.key} tone="success" />
        <h4>{area.label}</h4>
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
      <p>{area.reading}</p>
    </article>
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
    .map((indicator) => ({ ...indicator, note: 'abaixo da meta' }))

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

  return {
    achieved,
    below,
    indicators,
    key: category.key,
    label: category.label,
    noComparison,
    reading: buildAreaReading({ achieved, below, noComparison, total }),
    total,
  }
}

function normalizeDiagnosticIndicator(item, category, result) {
  if (!hasDiagnosticRealData(result)) return null

  const comparable = isDiagnosticComparable(result)
  const distance = getNumericValue(result?.distance, result?.display?.distance)
  const variation = getNumericValue(result?.progress_delta, result?.raw_delta, result?.display?.variation)

  return {
    categoryKey: category.key,
    categoryLabel: category.label,
    distance,
    key: `${category.key}-${item.key}`,
    label: item.label,
    status: comparable ? (result?.atingida === true ? 'achieved' : 'below') : 'noComparison',
    variation,
  }
}

function buildBestPosition(indicators) {
  const achieved = indicators
    .filter((indicator) => indicator.status === 'achieved')
    .sort((a, b) => getSortValue(b.distance) - getSortValue(a.distance))
    .map((indicator) => ({ ...indicator, note: 'meta atingida' }))

  const achievedKeys = new Set(achieved.map((indicator) => indicator.key))
  const favorable = indicators
    .filter((indicator) => !achievedKeys.has(indicator.key) && getSortValue(indicator.variation) > 0)
    .sort((a, b) => getSortValue(b.variation) - getSortValue(a.variation))
    .map((indicator) => ({
      ...indicator,
      note: indicator.status === 'below' ? 'avanço observado' : 'desempenho favorável',
    }))

  return [...achieved, ...favorable].slice(0, 3)
}

function buildReadings(summary, areas) {
  const comparableTotal = summary.achieved + summary.below
  const achievedShare = comparableTotal ? summary.achieved / comparableTotal : 0
  const belowArea = pickAreaByCount(areas, 'below')
  const noComparisonArea = pickAreaByCount(areas, 'noComparison')
  const bestArea = pickAreaByRatio(areas, 'achieved')

  const first =
    achievedShare >= 0.55
      ? 'O município apresenta boa proporção de metas atingidas no conjunto analisado.'
      : achievedShare >= 0.25
        ? 'O município apresenta desempenho heterogêneo entre áreas no conjunto analisado.'
        : 'O município apresenta baixa proporção de metas atingidas no conjunto analisado.'

  const second = bestArea?.achieved > 0
    ? `O melhor desempenho relativo aparece em ${bestArea.label.toLocaleLowerCase('pt-BR')}, com concentração de resultados abaixo da meta em ${belowArea?.label.toLocaleLowerCase('pt-BR') ?? 'parte das áreas'}.`
    : `A maior concentração de indicadores abaixo da meta aparece em ${belowArea?.label.toLocaleLowerCase('pt-BR') ?? 'parte das áreas'}.`

  const third = noComparisonArea?.noComparison > 0
    ? `${noComparisonArea.label} reúne o maior volume de indicadores sem comparação ou informativos.`
    : 'Os indicadores analisados têm comparação direta com meta no ciclo vigente.'

  return [first, second, third]
}

function buildAreaReading({ achieved, below, noComparison, total }) {
  if (!total) return 'Sem indicadores disponíveis para leitura nesta área.'
  if (noComparison > achieved && noComparison >= below) {
    return 'Maior volume de indicadores sem comparação ou informativos.'
  }
  if (below === total) return 'Concentração total de indicadores abaixo da meta.'
  if (below > achieved) return 'Predomínio de indicadores abaixo da meta.'
  if (achieved > below && achieved > noComparison) {
    return 'Área com melhor proporção relativa de metas atingidas.'
  }
  if (achieved > 0) return 'Mais indicadores abaixo da meta do que favoráveis.'
  return 'Área com poucos indicadores favoráveis.'
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
