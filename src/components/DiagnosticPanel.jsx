import { useMemo, useState } from 'react'
import { MethodNote } from './MethodNote'
import { ContentState } from './ContentState'
import { buildAppHash } from '../app/appHash'
import { FINANCIAL_PAGE_KEYS } from '../data/financialPageKeys'
import financingPrograms from '../data/diagnostic/financingPrograms.json'
import indicatorFinancingMatrix from '../data/diagnostic/indicatorFinancingMatrix.json'
import {
  buildAccountabilityText,
  buildDiagnosticViewModel,
  buildExecutiveSummary,
  buildFinancingViewModel,
  buildInvestigationGroups,
} from '../features/diagnostic/diagnosticPresentation'

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

export function DiagnosticPanel({ contractStatus = 'ready', data, municipio, municipioSlug }) {
  const analysis = useMemo(() => buildDiagnosticViewModel(data), [data])
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [copyStatus, setCopyStatus] = useState('idle')
  const filteredMunicipalActions = useMemo(
    () => selectedFilter === 'all'
      ? analysis.decisionSummary.municipalActionItems
      : analysis.decisionSummary.municipalActionItems.filter(
        (item) => item.categoryKey === selectedFilter,
      ),
    [analysis.decisionSummary.municipalActionItems, selectedFilter],
  )
  const filteredCoordination = useMemo(
    () => selectedFilter === 'all'
      ? analysis.decisionSummary.coordinationItems
      : analysis.decisionSummary.coordinationItems.filter(
        (item) => item.categoryKey === selectedFilter,
      ),
    [analysis.decisionSummary.coordinationItems, selectedFilter],
  )
  const filteredInvestigation = useMemo(
    () => selectedFilter === 'all'
      ? analysis.decisionSummary.investigationItems
      : analysis.decisionSummary.investigationItems.filter(
        (item) => item.categoryKey === selectedFilter,
      ),
    [analysis.decisionSummary.investigationItems, selectedFilter],
  )
  const filteredMonitoring = useMemo(
    () => selectedFilter === 'all'
      ? analysis.decisionSummary.monitoringItems
      : analysis.decisionSummary.monitoringItems.filter(
        (item) => item.categoryKey === selectedFilter,
      ),
    [analysis.decisionSummary.monitoringItems, selectedFilter],
  )
  const filteredPreservation = useMemo(
    () => selectedFilter === 'all'
      ? analysis.decisionSummary.preservationItems
      : analysis.decisionSummary.preservationItems.filter(
        (item) => item.categoryKey === selectedFilter,
      ),
    [analysis.decisionSummary.preservationItems, selectedFilter],
  )
  const financing = useMemo(
    () => buildFinancingViewModel(
      data,
      financingPrograms,
      indicatorFinancingMatrix,
      [...filteredMunicipalActions, ...filteredCoordination].map((item) => item.rawKey),
    ),
    [data, filteredCoordination, filteredMunicipalActions],
  )
  const showCategoryChip = selectedFilter === 'all'
  const selectedArea = analysis.areas.find((area) => area.key === selectedFilter)
  const selectedFilterLabel = selectedFilter === 'all'
    ? 'Todos os temas'
    : selectedArea?.fullLabel ?? selectedArea?.label ?? 'Tema selecionado'
  const selectedComparableCount = selectedFilter === 'all'
    ? analysis.summary.available
    : selectedArea?.available ?? 0
  const executiveSummary = buildExecutiveSummary(analysis)
  const accountabilityText = buildAccountabilityText(analysis, municipio)
  const mixedTerritorialBasisWarning = analysis.warnings.find(
    (warning) => warning.code === 'known_mixed_territorial_basis',
  )
  const hasUsefulStateBenchmark = analysis.stateBenchmark.hasUsefulComparison

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

  if (!data || contractStatus !== 'ready') {
    return (
      <section className="detail-panel empty-panel">
        <p>
          {contractStatus === 'incompatible_version'
            ? `O contrato do diagnóstico de ${municipio} usa uma versão incompatível.`
            : `O diagnóstico canônico de ${municipio} ainda não está disponível no ciclo vigente.`}
        </p>
      </section>
    )
  }

  return (
    <div className="diagnostic-panel">
      <section className="diagnostic-overview">
        <header className="diagnostic-overview__header">
          <div>
            <p className="diagnostic-overview__context">PNE 2026–2036 · ciclo vigente · acompanhamento atual</p>
            <h1>{municipio}: metas e pontos de atenção</h1>
            <p className="diagnostic-overview__intro">
              Leitura dos indicadores municipais com dados e referências comparáveis.
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
            {analysis.decisionSummary.municipalActionItems[0] ? (
              <div className="diagnostic-primary-focus">
                <div>
                  <small>Principal oportunidade de ação municipal</small>
                  <strong>{analysis.decisionSummary.municipalActionItems[0].label}</strong>
                </div>
                <span>Distância {analysis.decisionSummary.municipalActionItems[0].distanceLabel}</span>
              </div>
            ) : null}
          </div>

          <dl className="diagnostic-scoreboard" aria-label="Resumo das metas analisadas">
            <SummaryMetric
              helper="Evidência alta ou média e governabilidade municipal"
              label="Ação municipal"
              value={analysis.decisionSummary.municipalActionCount}
            />
            <SummaryMetric
              helper="Responsabilidade compartilhada, estadual ou federal"
              label="Pactuação"
              tone="default"
              value={analysis.decisionSummary.coordinationCount}
            />
            <SummaryMetric
              helper="Dados ou metodologia ainda não orientam intervenção"
              label="Investigação"
              tone="muted"
              value={analysis.decisionSummary.investigationCount}
            />
            <SummaryMetric
              helper="Referência atingida com ressalvas que exigem acompanhamento"
              label="Acompanhamento"
              tone="default"
              value={analysis.decisionSummary.monitoringCount}
            />
          </dl>
        </div>

        <div className="diagnostic-overview__footnote">
          <span>Triagem descritiva por evidência; não constitui ranking final.</span>
          <span>
            As cinco coleções classificam {analysis.decisionSummary.classifiedIndicatorCount} indicadores do contrato;
            o filtro abaixo conta {analysis.summary.available} resultados municipais disponíveis.
          </span>
          {mixedTerritorialBasisWarning ? <span>{mixedTerritorialBasisWarning.message}</span> : null}
        </div>
      </section>

      <section className="diagnostic-theme-filter platform-filter-panel" aria-label="Filtrar itens de atenção e referências atingidas por tema">
        <div className="diagnostic-theme-filter__header">
          <div>
            <span>Resultados municipais disponíveis</span>
            <p>{selectedFilterLabel}</p>
          </div>
          <strong>{selectedComparableCount} analisados</strong>
        </div>
        <div className="diagnostic-theme-filter__grid platform-filter-list">
          <button
            type="button"
            aria-pressed={selectedFilter === 'all'}
            className={`diagnostic-theme-filter__card platform-filter-option${selectedFilter === 'all' ? ' is-active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            <span>Todas</span>
              <span className="diagnostic-theme-filter__count">{analysis.summary.available}</span>
          </button>
          {analysis.areas.map((area) => (
            <button
              key={area.key}
              type="button"
              title={area.fullLabel ?? area.label}
              aria-pressed={selectedFilter === area.key}
              className={`diagnostic-theme-filter__card platform-filter-option${selectedFilter === area.key ? ' is-active' : ''}`}
              onClick={() => setSelectedFilter(area.key)}
            >
              <span>{area.label}</span>
              <span className="diagnostic-theme-filter__count">{area.available}</span>
            </button>
          ))}
        </div>
      </section>

      <StateBenchmarkSection benchmark={analysis.stateBenchmark} />

      <DecisionSummarySection
        coordinationItems={filteredCoordination}
        investigationItems={filteredInvestigation}
        municipalActionItems={filteredMunicipalActions}
        scopeLabel={selectedFilterLabel}
      />

      <FinancingSection
        data={financing}
        municipio={municipio}
        municipioSlug={municipioSlug}
      />

      <section className="diagnostic-themes-stack">
        <div className="page-card diagnostic-section">
          <header className="diagnostic-section__heading">
            <div>
              <h3>Situação por tema</h3>
              <p>Resultados, ação municipal, pactuação e investigação recebidos do pipeline.</p>
            </div>
            <span>Visão estrutural</span>
          </header>
          <div className="diagnostic-area-grid">
            {analysis.areas.map((area) => (
              <AreaMiniCard area={area} key={area.key} />
            ))}
          </div>
        </div>

        <OutcomeSummaryCard
          monitoringItems={filteredMonitoring}
          preservationItems={filteredPreservation}
          showCategoryChip={showCategoryChip}
        />

      </section>
      {!hasUsefulStateBenchmark ? (
        <MethodNote className="diagnostic-state-benchmark-note">
          Não há referência estadual metodologicamente comparável para os indicadores apresentados.
        </MethodNote>
      ) : null}
    </div>
  )
}

function SummaryMetric({ helper, label, tone = 'default', value }) {
  return (
    <div className={`diagnostic-scoreboard__item interaction-card--informative diagnostic-scoreboard__item--${tone}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      <small>{helper}</small>
    </div>
  )
}

function StateBenchmarkSection({ benchmark }) {
  const summary = benchmark?.summary ?? {}
  const unfavorable = benchmark?.unfavorable ?? []
  const favorable = benchmark?.favorable ?? []
  const hasUsefulBenchmark = Number(summary.comparable) > 0

  if (!hasUsefulBenchmark) return null

  return (
    <section className="page-card diagnostic-state-benchmark" aria-labelledby="diagnostic-state-title">
      <header className="diagnostic-state-benchmark__header">
        <div>
          <span>Contexto estadual</span>
          <h2 id="diagnostic-state-title">Como o município se compara ao RS</h2>
        </div>
        <p>
          {summary.worse ?? 0} indicadores em situação menos favorável que a referência estadual,{' '}
          {summary.better ?? 0} mais favoráveis, {summary.equivalent ?? 0} próximos e{' '}
          {summary.unavailable ?? 0} sem comparação disponível.
        </p>
      </header>

      <div className="diagnostic-state-benchmark__groups">
        <StateHighlightGroup
          emptyMessage="Nenhuma diferença desfavorável comparável."
          items={unfavorable}
          title="Maiores diferenças desfavoráveis"
          tone="attention"
        />
        <StateHighlightGroup
          emptyMessage="Nenhum destaque favorável comparável."
          items={favorable}
          title="Destaques favoráveis"
          tone="favorable"
        />
      </div>
    </section>
  )
}

function StateHighlightGroup({ emptyMessage, items, title, tone }) {
  return (
    <div className={`diagnostic-state-group diagnostic-state-group--${tone}`}>
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.rawKey}>
              <strong>{item.label}</strong>
              <span>
                Município {item.stateBenchmark.benchmarkMunicipalityLabel} ·{' '}
                {item.stateBenchmark.municipalityYear ?? 'ano não informado'}
              </span>
              <span>
                Referência RS {item.stateBenchmark.referenceLabel} · {item.stateBenchmark.year}
              </span>
              <small>{item.stateComparisonLabel}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </div>
  )
}

function DecisionSummarySection({
  coordinationItems,
  investigationItems,
  municipalActionItems,
  scopeLabel,
}) {
  return (
    <section className="page-card diagnostic-priorities diagnostic-decision-summary" aria-labelledby="diagnostic-decision-summary-title">
      <header className="diagnostic-priorities__header">
        <div className="diagnostic-priorities__header-text">
          <span>Triagem por evidência · {scopeLabel}</span>
          <h2 id="diagnostic-decision-summary-title">Síntese para decisão</h2>
          <p>Indicadores selecionados conforme evidência, trajetória e possibilidade de ação municipal.</p>
        </div>
      </header>

      <div className="diagnostic-decision-summary__groups">
        <DecisionGroup
          emptyMessage="Nenhum indicador elegível para ação municipal neste recorte."
          items={municipalActionItems}
          title="Ação municipal"
        />
        <DecisionGroup
          emptyMessage="Nenhum indicador selecionado para pactuação neste recorte."
          items={coordinationItems}
          title="Pactuação com outras redes"
          tone="coordination"
        />
      </div>

      <InvestigationBand items={investigationItems} />
    </section>
  )
}

function DecisionGroup({ emptyMessage, items, title, tone = 'action' }) {
  const list = items ?? []
  return (
    <div className={`diagnostic-decision-group diagnostic-decision-group--${tone}`}>
      <div className="diagnostic-decision-group__heading">
        <h3>{title}</h3>
        <span>{list.length}</span>
      </div>
      {list.length ? (
        <ul className="diagnostic-priorities__list">
          {list.map((item) => <DecisionItem item={item} key={item.key} />)}
        </ul>
      ) : (
        <ContentState as="p" kind="empty" className="diagnostic-empty-text">
          {emptyMessage}
        </ContentState>
      )}
    </div>
  )
}

function DecisionItem({ item }) {
  const trajectoryParts = []
  if (item.stateBenchmark.isComparable) trajectoryParts.push(`RS: ${item.stateComparisonLabel}`)
  if (!['not_applicable', 'insufficient_history'].includes(item.trajectory.paceStatus)) {
    trajectoryParts.push(`Ritmo: ${item.trajectory.paceStatusLabel.toLocaleLowerCase('pt-BR')}`)
  }
  if (item.trajectory.scenarioType !== 'not_available') {
    const scenarioValue = item.trajectory.projectedLabel !== '—'
      ? ` (${item.trajectory.projectedLabel})`
      : ''
    trajectoryParts.push(`Cenário: ${item.trajectory.scenarioLabel}${scenarioValue}`)
  }

  const responsibilityParts = []
  if (item.peers.status === 'available' && item.peers.percentileLabel) {
    responsibilityParts.push(
      item.peers.usesOfferingSizeOnly
        ? `Municípios com oferta de porte semelhante: ${item.peers.percentileLabel}`
        : `Coorte comparável: ${item.peers.percentileLabel}`,
    )
  }
  responsibilityParts.push(item.responsibilityText)
  if (item.municipalExposure.status === 'available') {
    responsibilityParts.push(`Exposição municipal: ${item.municipalExposure.denominatorShareLabel}`)
  }
  responsibilityParts.push(item.decisionReading.label)

  return (
    <li className="diagnostic-priorities__item diagnostic-decision-item">
      <div className="diagnostic-priorities__body">
        <div className="diagnostic-priorities__topline">
          <strong className="diagnostic-priorities__indicator" title={item.label}>{item.label}</strong>
          <span className="diagnostic-priorities__badges">
            <span className="diagnostic-priorities__chip diagnostic-priorities__chip--area">{item.categoryLabel}</span>
            <span className="diagnostic-priorities__chip">Evidência {evidenceLevelLabel(item.evidenceLevel)}</span>
          </span>
        </div>
        <p className="diagnostic-priorities__reading">
          <span>Atual <strong>{item.currentLabel}</strong></span>
          <span>Referência <strong>{item.metaLabel}</strong></span>
          <span>Distância <strong>{item.distanceLabel}</strong></span>
        </p>
        {trajectoryParts.length ? (
          <p className="diagnostic-priorities__decision-line">{trajectoryParts.join(' · ')}</p>
        ) : null}
        {responsibilityParts.length ? (
          <p className="diagnostic-priorities__decision-line">{responsibilityParts.join(' · ')}</p>
        ) : null}
        <details className="diagnostic-priorities__source">
          <summary>Ver evidências e limitações</summary>
          <p>
            Evidência {evidenceLevelLabel(item.evidenceLevel)}: {item.evidenceReasonLabels.join('; ') || 'sem razão adicional registrada'}.
          </p>
          {item.peers.usesOfferingSizeOnly ? (
            <p>
              Comparação formada atualmente pelo porte da oferta do indicador. Outros atributos municipais ainda não integram o pareamento.
            </p>
          ) : null}
          <p>{item.responsibilityText}</p>
          {item.stateBenchmark.isComparable ? (
            <p>Referência RS {item.stateBenchmark.referenceLabel} em {item.stateBenchmark.year}.</p>
          ) : null}
          <p>{item.sourceNote || 'Fonte não declarada no recorte carregado.'}</p>
          {item.methodologyNote ? <MethodNote>Nota metodológica: {item.methodologyNote}</MethodNote> : null}
        </details>
      </div>
    </li>
  )
}

function InvestigationBand({ items }) {
  const list = items ?? []
  const groups = buildInvestigationGroups(list)
  return (
    <div className="diagnostic-investigation-band">
      <details className="diagnostic-investigation-summary">
        <summary>
          <span><strong>{list.length}</strong> indicadores precisam de investigação antes de orientar uma ação.</span>
          <span>Consultar grupos de limitações</span>
        </summary>
        <div className="diagnostic-investigation-groups">
          {groups.map((group) => (
            <section className="diagnostic-investigation-group" key={group.key}>
              <header>
                <h3>{group.title}</h3>
                <span>{group.count}</span>
              </header>
              <p>{group.description}</p>
              <small>
                {group.examples.length
                  ? `Exemplos: ${group.examples.join('; ')}.`
                  : 'Nenhum indicador neste grupo.'}
              </small>
              <details>
                <summary>Consultar evidências e limitações</summary>
                {group.items.length ? (
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.key}>
                        <strong>{item.label}</strong>
                        <span>{item.decisionReading.label} · evidência {evidenceLevelLabel(item.evidenceLevel)}</span>
                        <small>{item.evidenceReasonLabels.join('; ') || item.statusLabel}</small>
                      </li>
                    ))}
                  </ul>
                ) : <p>Nenhuma evidência adicional neste grupo.</p>}
              </details>
            </section>
          ))}
        </div>
      </details>
    </div>
  )
}

function evidenceLevelLabel(level) {
  return {
    high: 'alta',
    medium: 'média',
    low: 'baixa',
    insufficient: 'insuficiente',
  }[level] ?? 'insuficiente'
}

function FinancingSection({ data, municipio, municipioSlug }) {
  const fronts = data?.fronts ?? []
  const allPathsHref = buildAppHash(FINANCIAL_PAGE_KEYS.panorama, {
    indicatorId: (data?.indicatorIds ?? []).join(','),
    municipio: municipioSlug ?? municipio,
    programId: (data?.programIds ?? []).join(','),
  })

  return (
    <section className="page-card diagnostic-financing" aria-labelledby="diagnostic-financing-title">
      <header className="diagnostic-financing__header">
        <div>
          <span>Relações potenciais</span>
          <h2 id="diagnostic-financing-title">Caminhos de financiamento relacionados</h2>
          <p>
            Os mecanismos abaixo têm relação potencial com as ações indicadas. Elegibilidade,
            valores e situação municipal ainda não foram verificados.
          </p>
        </div>
        <span>{fronts.length} {fronts.length === 1 ? 'frente' : 'frentes'}</span>
      </header>

      {fronts.length ? (
        <div className="diagnostic-financing__list">
          {fronts.map((front) => (
            <FinancingFront
              front={front}
              key={front.key}
              municipio={municipio}
              municipioSlug={municipioSlug}
            />
          ))}
        </div>
      ) : (
        <ContentState as="p" kind="empty" className="diagnostic-empty-text">
          Nenhum mecanismo relacionado foi registrado para os itens de ação ou pactuação deste recorte.
        </ContentState>
      )}

      {data?.generalMdeRelated ? (
        <p className="diagnostic-financing__general-note">
          Fontes gerais de MDE podem apoiar diferentes ações, observadas as regras de aplicação e a
          disponibilidade orçamentária municipal.
        </p>
      ) : null}

      {(data?.indicatorIds ?? []).length ? (
        <a className="diagnostic-financing__explore" href={allPathsHref}>
          Abrir panorama financeiro do município
        </a>
      ) : null}
    </section>
  )
}

function FinancingFront({ front, municipio, municipioSlug }) {
  const detailsHref = buildAppHash(FINANCIAL_PAGE_KEYS.panorama, {
    indicatorId: front.indicators.map((item) => item.indicatorId).join(','),
    municipio: municipioSlug ?? municipio,
    programId: front.mechanisms.map((item) => item.programId).join(','),
    tema: front.key,
  })

  return (
    <article className="diagnostic-financing-block">
      <div className="diagnostic-financing-block__heading">
        <h3>{front.title}</h3>
        <span>
          {front.actionMode === 'coordination'
            ? 'Pactuação interfederativa'
            : front.actionMode === 'mixed'
              ? 'Ação e pactuação'
              : 'Ação municipal potencial'}
        </span>
      </div>
      <p className="diagnostic-financing-block__description">{front.description}</p>
      <div className="diagnostic-financing-block__indicators">
        <small>Indicadores relacionados</small>
        <p>{front.indicators.map((item) => item.label).join('; ')}</p>
      </div>
      {front.mechanisms.length ? (
        <ul>
          {front.mechanisms.map((mechanism) => (
            <li key={mechanism.programId}>
              <strong>{mechanism.title}</strong>
              {mechanism.badge ? <span>{mechanism.badge}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="diagnostic-financing-block__empty">
          Nenhum mecanismo específico relacionado na matriz vigente.
        </p>
      )}
      <a href={detailsHref}>Ver evidências no panorama financeiro</a>
    </article>
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

function OutcomeSummaryCard({ monitoringItems, preservationItems, showCategoryChip }) {
  return (
    <section className="page-card diagnostic-insight diagnostic-insight--success diagnostic-outcomes">
      <div className="diagnostic-insight__heading">
        <IconBubble icon="trendUp" tone="success" />
        <div>
          <h3>Resultados a preservar e acompanhar</h3>
          <p className="diagnostic-insight__description">
            Resultados com referência atingida, separados pelo nível de evidência recebido do pipeline.
          </p>
        </div>
      </div>
      <div className="diagnostic-outcomes__groups">
        <OutcomeGroup
          emptyMessage="Nenhum resultado com evidência alta neste recorte."
          items={preservationItems}
          showCategoryChip={showCategoryChip}
          title="Preservar"
        />
        <OutcomeGroup
          emptyMessage="Nenhum resultado em acompanhamento neste recorte."
          items={monitoringItems}
          showCategoryChip={showCategoryChip}
          title="Acompanhar"
        />
      </div>
    </section>
  )
}

function OutcomeGroup({ emptyMessage, items, showCategoryChip, title }) {
  return (
    <div className="diagnostic-outcomes__group">
      <div className="diagnostic-outcomes__heading">
        <h4>{title}</h4>
        <span>{items.length}</span>
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
              <p className="diagnostic-insight-list__result">
                {item.note ?? `Resultado ${item.currentLabel}; ${item.decisionReading.label.toLocaleLowerCase('pt-BR')}.`}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <ContentState as="p" kind="empty" className="diagnostic-empty-text">{emptyMessage}</ContentState>
      )}
    </div>
  )
}

function AreaMiniCard({ area }) {
  return (
    <div className="diagnostic-area-mini-card interaction-card--informative">
      <div className="diagnostic-area-mini-card__header">
        <div className="diagnostic-area-mini-card__title">
          <IconBubble icon={area.key} tone="success" />
          <h4>{area.label}</h4>
        </div>
        <span className={`area-status area-status--${area.statusTone}`}>{area.statusLabel}</span>
      </div>
      <div className="diagnostic-area-mini-card__metrics">
        <div className="diagnostic-area-mini-card__metric">
          <span>Indicadores analisados</span>
          <strong>{area.available}</strong>
        </div>
        <div className="diagnostic-area-mini-card__metric">
          <span>Referências atingidas</span>
          <strong className="is-success">{area.achieved}</strong>
        </div>
        <div className="diagnostic-area-mini-card__metric">
          <span>Ação municipal</span>
          <strong>{area.municipalAction}</strong>
        </div>
        <div className="diagnostic-area-mini-card__metric">
          <span>Pactuação</span>
          <strong>{area.coordination}</strong>
        </div>
        <div className="diagnostic-area-mini-card__metric">
          <span>Investigação</span>
          <strong className="is-danger">{area.investigation}</strong>
        </div>
      </div>
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
