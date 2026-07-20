import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  EDUCATION_SECTION_LABELS,
  EDUCATION_SOURCE_CATALOG,
} from '../../../data/educationIndicatorCatalog.js'
import {
  formatIndicatorCount,
  formatSourceYears,
  getIndicatorYears,
  normalizeEducationIndicatorLabel,
  normalizeMethodologyId,
} from '../educationFormatters'
import type { EducationIndicatorCatalogItem, EducationIndicatorResult } from '../educationTypes'

interface EducationMethodologyCatalogItem extends EducationIndicatorCatalogItem {
  label: string
  source: string
}

interface EducationMethodologySectionProps {
  catalog: ReadonlyArray<EducationMethodologyCatalogItem>
  items: ReadonlyArray<EducationIndicatorResult>
}

interface MethodologyTextSectionProps {
  children: ReactNode
  icon: MethodologyIconName
  title: string
  variant?: string
}

type MethodologyIconName = 'book' | 'calendar' | 'chevron' | 'close' | 'coverage' | 'search' | 'sources' | 'warning'
type IndicatorAvailability = 'available' | 'no-data' | 'unavailable'

interface MethodologyIndicator extends EducationMethodologyCatalogItem {
  availability: IndicatorAvailability
}

interface MethodologySource {
  indicators: MethodologyIndicator[]
  key: string
  officialName: string
  periodicity: string
  years: number[]
}

type DrawerSelection = { kind: 'all' } | { kind: 'source'; source: MethodologySource }

const DESKTOP_CHIP_LIMIT = 3
const MOBILE_CHIP_LIMIT = 2

export function EducationMethodologySection({ catalog, items }: EducationMethodologySectionProps) {
  const [sourceQuery, setSourceQuery] = useState('')
  const [drawerSelection, setDrawerSelection] = useState<DrawerSelection | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const itemByKey = useMemo(() => new Map(items.map((item) => [item.key, item])), [items])
  const sourceGroups = useMemo<MethodologySource[]>(() => EDUCATION_SOURCE_CATALOG.map((source) => {
    const indicators = catalog
      .filter((indicator) => indicator.source === source.key)
      .map((indicator) => ({
        ...indicator,
        availability: getIndicatorAvailability(itemByKey.get(indicator.key)),
      }))
    const years = indicators.flatMap((indicator) => getIndicatorYears(itemByKey.get(indicator.key)))

    return {
      ...source,
      indicators,
      years: Array.from(new Set(years)).sort((a, b) => a - b),
    }
  }), [catalog, itemByKey])
  const normalizedSourceQuery = normalizeSearch(sourceQuery)
  const visibleSourceGroups = sourceGroups.filter((source) => {
    if (!normalizedSourceQuery) return true
    return normalizeSearch([
      source.officialName,
      source.periodicity,
      ...source.indicators.map((indicator) => indicator.label),
    ].join(' ')).includes(normalizedSourceQuery)
  })

  function openDrawer(selection: DrawerSelection, trigger: HTMLButtonElement) {
    triggerRef.current = trigger
    setDrawerSelection(selection)
  }

  function closeDrawer() {
    setDrawerSelection(null)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  return (
    <div className="education-methodology-page">
      <section className="page-card education-methodology-scope" aria-labelledby="education-methodology-scope-title">
        <div className="education-methodology-scope__copy">
          <h3 id="education-methodology-scope-title">Escopo do diagnóstico</h3>
          <p>O diagnóstico considera instituições de ensino localizadas no município. Quando disponíveis, os dados distinguem diferentes dependências administrativas e recortes da oferta educacional.</p>
          <p>Os indicadores apoiam a leitura do território, mas não substituem levantamentos complementares realizados pelo município.</p>
        </div>
        <div className="education-methodology-scope__facts">
          <MethodologyFact
            description="Instituições públicas e privadas de educação básica e contextos complementares do PNE."
            icon="coverage"
            title="Cobertura"
          />
          <MethodologyFact
            description="Cada indicador mantém seus próprios anos e período de atualização."
            icon="calendar"
            title="Atualização"
          />
          <MethodologyFact
            description="Censos, avaliações nacionais, registros administrativos e pesquisas oficiais."
            icon="sources"
            title="Tipos de fonte"
          />
        </div>
      </section>

      <section className="page-card education-methodology-sources" aria-labelledby="education-methodology-sources-title">
        <div className="education-methodology-sources__header">
          <div>
            <h3 id="education-methodology-sources-title">Fontes e periodicidade</h3>
            <p>A relação usa as fontes declaradas no catálogo central e a cobertura observada para o município selecionado.</p>
          </div>
          <div className="education-methodology-sources__tools">
            <label className="education-methodology-search">
              <span className="u-sr-only">Buscar fonte ou indicador</span>
              <MethodologyIcon name="search" />
              <input
                onChange={(event) => setSourceQuery(event.target.value)}
                placeholder="Buscar fonte ou indicador..."
                type="search"
                value={sourceQuery}
              />
            </label>
            <button
              className="education-methodology-catalog-button platform-navigation-button"
              onClick={(event) => openDrawer({ kind: 'all' }, event.currentTarget)}
              type="button"
            >
              Lista completa de indicadores
            </button>
          </div>
        </div>

        <div className="education-methodology-source-list">
          <div className="education-methodology-source-list__head" aria-hidden="true">
            <span>Fonte</span>
            <span>Indicadores</span>
            <span>Periodicidade</span>
            <span>Intervalo de tempo</span>
            <span>Indicadores relacionados</span>
            <span />
          </div>
          {visibleSourceGroups.map((source) => (
            <button
              aria-label={`Ver indicadores relacionados à fonte ${source.officialName}`}
              className="education-methodology-source-row"
              key={source.key}
              onClick={(event) => openDrawer({ kind: 'source', source }, event.currentTarget)}
              type="button"
            >
              <span className="education-methodology-source-row__name">
                <span className="education-methodology-source-row__icon" aria-hidden="true"><MethodologyIcon name="sources" /></span>
                <strong>{source.officialName}</strong>
              </span>
              <span className="education-methodology-source-row__count">{source.indicators.length}</span>
              <span className="education-methodology-source-row__periodicity">
                <span className="education-methodology-source-row__mobile-label">Periodicidade</span>
                {source.periodicity}
              </span>
              <span className="education-methodology-source-row__years">
                <span className="education-methodology-source-row__mobile-label">Período</span>
                {formatSourceYears(source.years)}
              </span>
              <span className="education-methodology-source-row__related">
                <IndicatorChips indicators={source.indicators} limit={DESKTOP_CHIP_LIMIT} variant="desktop" />
                <IndicatorChips indicators={source.indicators} limit={MOBILE_CHIP_LIMIT} variant="mobile" />
              </span>
              <span className="education-methodology-source-row__chevron" aria-hidden="true"><MethodologyIcon name="chevron" /></span>
            </button>
          ))}
          {!visibleSourceGroups.length ? (
            <p className="education-methodology-source-list__empty">Nenhuma fonte ou indicador corresponde à busca.</p>
          ) : null}
        </div>
      </section>

      <MethodologyTextSection icon="book" title="Como interpretar" variant="interpretation">
        <ul>
          <li>Cada card mantém seu próprio ano de referência; os anos podem variar entre indicadores.</li>
          <li>Zero é um valor válido quando informado pela fonte. Ausência de dado não deve ser interpretada como zero.</li>
          <li>Variações entre o primeiro e o último ponto válido consideram apenas os anos com dado disponível.</li>
          <li>Fontes distintas podem apresentar valores diferentes por adotarem recortes, definições e coberturas próprias.</li>
          <li>Alertas de cobertura parcial permanecem associados ao indicador e devem ser considerados na leitura.</li>
        </ul>
      </MethodologyTextSection>

      <MethodologyTextSection icon="warning" title="Limitações" variant="limitations">
        <ul>
          <li>Escolas localizadas no território não representam necessariamente a residência dos estudantes.</li>
          <li>Os dados atuais não identificam todas as pessoas que estão fora da escola.</li>
          <li>Os indicadores não calculam automaticamente déficit de vagas.</li>
          <li>As projeções são cenários estimados e não constituem previsão oficial.</li>
          <li>Periodicidade, cobertura e disponibilidade variam entre fontes e municípios.</li>
          <li>Um diagnóstico para o PME pode exigir dados complementares produzidos pelo município.</li>
        </ul>
      </MethodologyTextSection>

      <section className="page-card education-methodology-links" aria-labelledby="education-methodology-links-title">
        <div>
          <span className="education-methodology-title-icon" aria-hidden="true"><MethodologyIcon name="book" /></span>
          <div>
            <h3 id="education-methodology-links-title">Consulte também</h3>
            <p>As páginas relacionadas preservam seus próprios indicadores e critérios.</p>
          </div>
        </div>
        <div className="education-methodology-links__list">
          <a href="#pne-overview">Metas e resultados do PNE <span aria-hidden="true">→</span></a>
          <a href="#financeiros">Indicadores Financeiros da Educação <span aria-hidden="true">→</span></a>
        </div>
      </section>

      <MethodologyDrawer
        catalog={catalog}
        itemByKey={itemByKey}
        onClose={closeDrawer}
        selection={drawerSelection}
      />
    </div>
  )
}

function MethodologyFact({ description, icon, title }: { description: string; icon: MethodologyIconName; title: string }) {
  return (
    <article className="education-methodology-fact">
      <span aria-hidden="true"><MethodologyIcon name={icon} /></span>
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </article>
  )
}

function IndicatorChips({ indicators, limit, variant }: { indicators: MethodologyIndicator[]; limit: number; variant: 'desktop' | 'mobile' }) {
  const visibleIndicators = indicators.slice(0, limit)
  const remaining = Math.max(0, indicators.length - visibleIndicators.length)

  return (
    <span className={`education-methodology-chips education-methodology-chips--${variant}`}>
      {visibleIndicators.map((indicator) => (
        <span className="education-methodology-chip" key={indicator.key}>{normalizeEducationIndicatorLabel(indicator.label)}</span>
      ))}
      {remaining ? <span className="education-methodology-chip education-methodology-chip--more">+{remaining}</span> : null}
      {!indicators.length ? <span className="education-methodology-chip education-methodology-chip--empty">Sem indicadores</span> : null}
    </span>
  )
}

function MethodologyDrawer({
  catalog,
  itemByKey,
  onClose,
  selection,
}: {
  catalog: ReadonlyArray<EducationMethodologyCatalogItem>
  itemByKey: Map<string, EducationIndicatorResult>
  onClose: () => void
  selection: DrawerSelection | null
}) {
  const [query, setQuery] = useState('')
  const drawerRef = useRef<HTMLElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const isOpen = selection !== null
  const indicators = useMemo<MethodologyIndicator[]>(() => {
    const selectedIndicators = selection?.kind === 'source' ? selection.source.indicators : catalog
    return selectedIndicators.map((indicator) => ({
      ...indicator,
      availability: 'availability' in indicator
        ? indicator.availability
        : getIndicatorAvailability(itemByKey.get(indicator.key)),
    }))
  }, [catalog, itemByKey, selection])
  const filteredIndicators = indicators.filter((indicator) => normalizeSearch(indicator.label).includes(normalizeSearch(query)))
  const groupedIndicators = groupIndicatorsBySection(filteredIndicators)
  const source = selection?.kind === 'source' ? selection.source : null
  const title = source?.officialName ?? 'Lista completa de indicadores'

  useEffect(() => {
    setQuery('')
  }, [selection])

  useEffect(() => {
    if (!isOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => closeButtonRef.current?.focus())
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab') return

    const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ) ?? [])
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div className="education-methodology-drawer-layer" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <aside
        aria-labelledby="education-methodology-drawer-title"
        aria-modal="true"
        className="education-methodology-drawer"
        onKeyDown={handleKeyDown}
        ref={drawerRef}
        role="dialog"
      >
        <header className="education-methodology-drawer__header">
          <div>
            <span className="eyebrow">Indicadores relacionados</span>
            <h2 id="education-methodology-drawer-title">{title}</h2>
          </div>
          <button aria-label="Fechar detalhamento da fonte" className="education-methodology-drawer__close" onClick={onClose} ref={closeButtonRef} type="button">
            <MethodologyIcon name="close" />
          </button>
        </header>

        <dl className="education-methodology-drawer__metadata">
          {source ? <div><dt>Periodicidade</dt><dd>{source.periodicity}</dd></div> : <div><dt>Escopo</dt><dd>Todas as fontes</dd></div>}
          {source ? <div><dt>Intervalo disponível</dt><dd>{formatSourceYears(source.years)}</dd></div> : null}
          <div><dt>Quantidade</dt><dd>{formatIndicatorCount(indicators.length)}</dd></div>
        </dl>

        <div className="education-methodology-drawer__search-slot">
          {indicators.length > 8 ? (
            <label className="education-methodology-search education-methodology-drawer__search">
              <span className="u-sr-only">Buscar indicador no detalhamento</span>
              <MethodologyIcon name="search" />
              <input onChange={(event) => setQuery(event.target.value)} placeholder="Buscar indicador..." type="search" value={query} />
            </label>
          ) : null}
        </div>

        <div className="education-methodology-drawer__body">
          {groupedIndicators.map((group) => (
            <section className="education-methodology-drawer__group" key={group.key}>
              <h3>{group.label}</h3>
              <ul>
                {group.indicators.map((indicator) => (
                  <li key={indicator.key}>
                    <span>{normalizeEducationIndicatorLabel(indicator.label)}</span>
                    {indicator.availability !== 'available' ? (
                      <small>{indicator.availability === 'unavailable' ? 'Indisponível no município' : 'Sem dados para o município'}</small>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {!indicators.length ? <p className="education-methodology-drawer__empty">Esta fonte não possui indicadores associados no catálogo atual.</p> : null}
          {indicators.length > 0 && !filteredIndicators.length ? <p className="education-methodology-drawer__empty">Nenhum indicador corresponde à busca.</p> : null}
        </div>
      </aside>
    </div>,
    document.body,
  )
}

function MethodologyTextSection({ children, icon, title, variant }: MethodologyTextSectionProps) {
  const variantClass = variant ? ` education-methodology-text--${variant}` : ''
  return (
    <section className={`page-card education-methodology-text${variantClass}`} aria-labelledby={`education-methodology-${normalizeMethodologyId(title)}`}>
      <div className="education-methodology-text__title">
        <span className="education-methodology-title-icon" aria-hidden="true"><MethodologyIcon name={icon} /></span>
        <h3 id={`education-methodology-${normalizeMethodologyId(title)}`}>{title}</h3>
      </div>
      {children}
    </section>
  )
}

function MethodologyIcon({ name }: { name: MethodologyIconName }) {
  const paths: Record<MethodologyIconName, ReactNode> = {
    book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22z" /><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    coverage: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6M15 15c3 0 5 1.5 6 4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    sources: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>,
    warning: <><path d="M10.3 3.6 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}

function groupIndicatorsBySection(indicators: MethodologyIndicator[]) {
  const groups = Object.entries(EDUCATION_SECTION_LABELS).map(([key, label]) => ({
    indicators: indicators.filter((indicator) => indicator.section === key),
    key,
    label,
  })).filter((group) => group.indicators.length > 0)
  const knownKeys = new Set(Object.keys(EDUCATION_SECTION_LABELS))
  const ungrouped = indicators.filter((indicator) => !indicator.section || !knownKeys.has(indicator.section))
  return ungrouped.length ? [...groups, { indicators: ungrouped, key: 'outros', label: 'Outros indicadores' }] : groups
}

function getIndicatorAvailability(item?: EducationIndicatorResult): IndicatorAvailability {
  if (item?.available === false) return 'unavailable'
  if (!item) return 'no-data'
  const hasSeriesData = Array.isArray(item.series) && item.series.some((point) => {
    if (!point || typeof point !== 'object') return false
    return Object.entries(point).some(([key, value]) => key !== 'ano' && value !== null && value !== undefined && value !== '')
  })
  const currentValue = item.currentValue
  return hasSeriesData || (currentValue !== null && currentValue !== undefined && currentValue !== '') ? 'available' : 'no-data'
}

function normalizeSearch(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}
