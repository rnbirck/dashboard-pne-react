import { useState } from 'react'
import { pneOverviewContent } from '../data/pneOverviewContent'

function ExpandableCard({ isOpen, item, onToggle, pairIndex }) {
  return (
    <details className="pne-expandable" data-pair={pairIndex} open={isOpen}>
      <summary aria-expanded={isOpen} onClick={onToggle}>
        <span className="pne-expandable__summary">
          <span>{item.title}</span>
          {item.reference ? (
            <small>{item.reference}</small>
          ) : null}
        </span>
        <span className="pne-expandable__marker" aria-hidden="true" />
      </summary>
      <div className="pne-expandable__body">
        <p>{item.summary}</p>
        {item.municipalUse ? (
          <p className="pne-expandable__note">
            <strong>No município:</strong> {item.municipalUse}
          </p>
        ) : null}
        {item.panelUse ? (
          <p className="pne-expandable__note">
            <strong>No painel:</strong> {item.panelUse}
          </p>
        ) : null}
      </div>
    </details>
  )
}

function ExpandableGrid({ className = '', items }) {
  const [openPairs, setOpenPairs] = useState(() => new Set())

  function togglePair(pairIndex) {
    setOpenPairs((currentOpenPairs) => {
      const nextOpenPairs = new Set(currentOpenPairs)

      if (nextOpenPairs.has(pairIndex)) {
        nextOpenPairs.delete(pairIndex)
      } else {
        nextOpenPairs.add(pairIndex)
      }

      return nextOpenPairs
    })
  }

  return (
    <div className={['pne-expandable-grid', className].filter(Boolean).join(' ')}>
      {items.map((item, index) => {
        const pairIndex = Math.floor(index / 2)

        return (
          <ExpandableCard
            isOpen={openPairs.has(pairIndex)}
            item={item}
            key={item.title}
            onToggle={(event) => {
              event.preventDefault()
              togglePair(pairIndex)
            }}
            pairIndex={pairIndex}
          />
        )
      })}
    </div>
  )
}

export function PneOverviewPage({ onNavigate }) {
  const {
    conceptCards,
    entryCards,
    entrySection,
    goalStrategyExplainers,
    goalStrategySection,
    governanceMonitoringItems,
    governanceSection,
    guidelineGroups,
    guidelineSection,
    hero,
    introduction,
    objectiveGroups,
    objectiveSection,
    sources,
  } = pneOverviewContent

  return (
    <div className="page-stack pne-overview-page">
      <section className="page-card pne-overview-hero">
        <div className="pne-overview-hero__copy">
          <span className="eyebrow">{hero.eyebrow}</span>
          <h1>{hero.title}</h1>
          <p>{hero.description}</p>
        </div>

        <aside className="pne-legal-card" aria-label="Resumo da base legal do PNE">
          <span className="pne-legal-card__eyebrow">Base legal</span>
          <strong>Lei nº 15.388/2026</strong>
          <dl>
            {hero.legalFacts.map((fact) => (
              <div key={`${fact.label}-${fact.value}`}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      <section className="page-card pne-overview-intro">
        <div className="pne-overview-intro__heading">
          <span className="eyebrow">{introduction.eyebrow}</span>
          <h2>{introduction.title}</h2>
          <p>{introduction.lead}</p>
        </div>
        <div className="pne-intro-grid">
          {introduction.points.map((point) => (
            <article className="pne-intro-card" key={point.title}>
              <span aria-hidden="true" />
              <h3>{point.title}</h3>
              <p>{point.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pne-overview-section">
        <div className="pne-overview-section__heading">
          <span className="eyebrow">COMO A LEI ORGANIZA O PLANO</span>
          <h2>Diretrizes, objetivos, metas e estratégias</h2>
          <p>
            Quatro peças ajudam a transformar a lei em acompanhamento: princípios,
            mudanças esperadas, referências de verificação e caminhos de ação.
          </p>
        </div>
        <div className="pne-concept-grid">
          {conceptCards.map((concept, index) => (
            <article className="pne-concept-card" key={concept.title}>
              <span className="pne-concept-card__index">{String(index + 1).padStart(2, '0')}</span>
              <h3>{concept.title}</h3>
              <p>{concept.description}</p>
              <p className="pne-concept-card__note">{concept.panelUse}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-card pne-overview-section pne-overview-section--guided">
        <div className="pne-overview-section__heading">
          <span className="eyebrow">{guidelineSection.eyebrow}</span>
          <h2>{guidelineSection.title}</h2>
          <p>{guidelineSection.description}</p>
        </div>
        <div className="pne-guideline-summary" aria-label="Resumo das diretrizes do PNE">
          {guidelineSection.summaryItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <ExpandableGrid items={guidelineGroups} />
      </section>

      <section className="pne-overview-section">
        <div className="pne-overview-section__heading">
          <span className="eyebrow">{objectiveSection.eyebrow}</span>
          <h2>{objectiveSection.title}</h2>
          <p>{objectiveSection.description}</p>
        </div>
        <ExpandableGrid items={objectiveGroups} />
      </section>

      <section className="page-card pne-overview-section pne-overview-section--guided">
        <div className="pne-overview-section__heading">
          <span className="eyebrow">{goalStrategySection.eyebrow}</span>
          <h2>{goalStrategySection.title}</h2>
          <p>{goalStrategySection.description}</p>
        </div>
        <div className="pne-anchor-grid">
          {goalStrategySection.anchors.map((anchor) => (
            <article className="pne-anchor-card" key={anchor.title}>
              <h3>{anchor.title}</h3>
              <p>{anchor.body}</p>
            </article>
          ))}
        </div>
        <ExpandableGrid className="pne-expandable-grid--wide" items={goalStrategyExplainers} />
      </section>

      <section className="pne-overview-section">
        <div className="pne-overview-section__heading">
          <span className="eyebrow">{governanceSection.eyebrow}</span>
          <h2>{governanceSection.title}</h2>
          <p>{governanceSection.description}</p>
        </div>
        <ExpandableGrid items={governanceMonitoringItems} />
      </section>

      <section className="pne-overview-section pne-overview-entries">
        <div className="pne-overview-section__heading">
          <span className="eyebrow">{entrySection.eyebrow}</span>
          <h2>{entrySection.title}</h2>
          <p>{entrySection.description}</p>
        </div>
        <div className="pne-entry-grid">
          {entryCards.map((entry) => (
            <button
              className="pne-entry-card"
              key={entry.page}
              type="button"
              onClick={() => onNavigate?.(entry.page)}
            >
              <span className="pne-entry-card__indicator">
                <span aria-hidden="true" />
                {entry.indicator}
              </span>
              <span className="pne-entry-card__title">{entry.title}</span>
              <p>{entry.description}</p>
              <strong>{entry.actionLabel}</strong>
            </button>
          ))}
        </div>
      </section>

      <footer className="pne-overview-source">
        <p>{sources.label}</p>
        <p>{sources.complementary}</p>
        <div>
          <a href={sources.planaltoUrl} target="_blank" rel="noreferrer">
            Presidência da República / Planalto
          </a>
          <a href={sources.camaraUrl} target="_blank" rel="noreferrer">
            Câmara dos Deputados
          </a>
        </div>
      </footer>
    </div>
  )
}
