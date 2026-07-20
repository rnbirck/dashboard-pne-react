import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { buildAppHash } from '../../app/appHash'
import { ContentState } from '../../components/ContentState'
import { FinancialCompactModuleSelector } from '../../components/FinancialCompactModuleSelector'
import { StatusBadge } from '../../components/StatusBadge'
import {
  loadMunicipalFinanceCatalog,
  municipalFinanceLoader,
  type MunicipalFinanceCatalog,
  type MunicipalFinanceLoadStatus,
  type MunicipalFinanceSourceCatalogEntry,
} from '../../data/municipalFinance'
import { FINANCIAL_PAGE_KEYS } from '../../data/financialPageKeys'
import financingPrograms from '../../data/diagnostic/financingPrograms.json'
import indicatorCatalog from '../../data/diagnostic/indicatorCatalog.json'
import type { MunicipalFinanceDocumentV1, CompactFinancialValue } from '../diagnostic/municipalFinanceTypes'
import type { ParsedAppLocation } from '../../types/navigation'
import {
  buildMunicipalFinancePresentation,
  formatCoefficient,
  formatCompactCurrency,
  formatCount,
  formatFullCurrency,
  formatPercent,
  splitFinanceContextIds,
} from './municipalFinancePresentation'

interface MunicipalFinancePanoramaPageProps {
  municipalityIdentifier: string | null
  municipalityName: string | null
  navigationContext: ParsedAppLocation
}

interface PageLoadState {
  status: MunicipalFinanceLoadStatus
  document: MunicipalFinanceDocumentV1 | null
  catalog: MunicipalFinanceCatalog | null
}

const INITIAL_STATE: PageLoadState = {
  status: 'idle',
  document: null,
  catalog: null,
}

export function MunicipalFinancePanoramaPage({
  municipalityIdentifier,
  municipalityName,
  navigationContext,
}: MunicipalFinancePanoramaPageProps) {
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [loadState, setLoadState] = useState<PageLoadState>(INITIAL_STATE)
  const context = useMemo(() => ({
    indicatorIds: splitFinanceContextIds(navigationContext.params.get('indicatorId')),
    programIds: splitFinanceContextIds(navigationContext.params.get('programId')),
  }), [navigationContext])

  useEffect(() => {
    let cancelled = false
    if (!municipalityIdentifier) {
      setLoadState(INITIAL_STATE)
      return undefined
    }

    setLoadState({ status: 'loading', document: null, catalog: null })
    void Promise.all([
      municipalFinanceLoader.load(municipalityIdentifier),
      loadMunicipalFinanceCatalog().catch(() => null),
    ]).then(([document, catalog]) => {
      if (!cancelled) setLoadState({ status: 'ready', document, catalog })
    }).catch(() => {
      if (cancelled) return
      setLoadState({
        status: municipalFinanceLoader.getState(municipalityIdentifier).status,
        document: null,
        catalog: null,
      })
    })

    return () => {
      cancelled = true
    }
  }, [loadAttempt, municipalityIdentifier])

  const returnParams = {
    municipio: loadState.document?.municipality.slug ?? municipalityIdentifier,
    indicatorId: context.indicatorIds.join(','),
    programId: context.programIds.join(','),
    tema: navigationContext.params.get('tema'),
  }
  const municipalityTitle = loadState.document?.municipality.name ?? municipalityName ?? 'Município'

  if (!municipalityIdentifier) {
    return (
      <PageFrame municipalityName={municipalityTitle} returnHref={buildAppHash('diagnostico', returnParams)}>
        <ContentState kind="unavailable" className="municipal-finance-state page-card">
          <h2>Selecione um município</h2>
          <p>Use o seletor da barra de contexto para abrir o panorama financeiro.</p>
        </ContentState>
      </PageFrame>
    )
  }

  if (loadState.status === 'idle' || loadState.status === 'loading') {
    return (
      <PageFrame municipalityName={municipalityTitle} returnHref={buildAppHash('diagnostico', returnParams)}>
        <MunicipalFinanceSkeleton />
      </PageFrame>
    )
  }

  if (loadState.status !== 'ready' || !loadState.document) {
    const stateCopies: Partial<Record<MunicipalFinanceLoadStatus, { title: string; body: string }>> = {
      absent: {
        title: 'Panorama financeiro ainda não disponível para este município.',
        body: 'O contrato municipal não foi localizado na publicação atual.',
      },
      incompatible_version: {
        title: 'Os dados financeiros precisam ser atualizados antes da apresentação.',
        body: 'A versão publicada não é compatível com esta interface.',
      },
      error: {
        title: 'Não foi possível carregar os dados financeiros.',
        body: 'Tente novamente. Os demais dados do município permanecem disponíveis.',
      },
    }
    const stateCopy = stateCopies[loadState.status] ?? {
      title: 'Não foi possível carregar os dados financeiros.',
      body: 'Tente novamente em instantes.',
    }
    return (
      <PageFrame municipalityName={municipalityTitle} returnHref={buildAppHash('diagnostico', returnParams)}>
        <ContentState
          kind={loadState.status === 'error' ? 'error' : 'unavailable'}
          className="municipal-finance-state page-card"
        >
          <h2>{stateCopy.title}</h2>
          <p>{stateCopy.body}</p>
          {loadState.status === 'error' ? (
            <button className="platform-navigation-button" type="button" onClick={() => setLoadAttempt((value) => value + 1)}>
              Tentar novamente
            </button>
          ) : null}
        </ContentState>
      </PageFrame>
    )
  }

  const document = loadState.document
  const presentation = buildMunicipalFinancePresentation(
    document,
    loadState.catalog,
    financingPrograms,
    indicatorCatalog,
    context,
  )

  return (
    <PageFrame
      municipalityName={document.municipality.name}
      returnHref={buildAppHash('diagnostico', {
        ...returnParams,
        municipio: document.municipality.slug,
      })}
    >
      <ContextNotice labels={presentation.contextLabels} />

      <section className="municipal-finance-summary-grid" aria-label="Resumo financeiro municipal">
        {presentation.summaryCards.map((card) => (
          <article className="page-card municipal-finance-summary-card" key={card.key}>
            <span className="municipal-finance-summary-card__label">{card.title}</span>
            {'statusLabel' in card ? (
              <strong className="municipal-finance-summary-card__status">{card.statusLabel}</strong>
            ) : (
              <FinanceValue value={card.amount} label={card.title} emphasized />
            )}
            {'statusLabel' in card && card.amount ? (
              <p className="municipal-finance-summary-card__secondary">
                Previsão VAAR: <FinanceValue value={card.amount} label="Previsão VAAR 2026" />
              </p>
            ) : null}
            <p>{card.supportingText}</p>
          </article>
        ))}
      </section>

      <ConstitutionalApplicationSection document={document} catalog={loadState.catalog} />

      <div className="municipal-finance-primary-grid">
        <div className="municipal-finance-primary-column municipal-finance-primary-column--left">
          <section className="page-card municipal-finance-section municipal-finance-execution" aria-labelledby="municipal-finance-execution-title">
            <SectionHeading
              eyebrow="Execução declarada"
              title="Execução da função Educação em 2024"
              titleId="municipal-finance-execution-title"
              description="Estágios da despesa informados na DCA/SICONFI para a função 12."
            />
            <ol className="municipal-finance-execution-flow" aria-label="Empenhado, liquidado e pago">
              {presentation.executionStages.map((stage) => (
                <li key={stage.key}>
                  <span>{stage.label}</span>
                  <FinanceValue value={stage.value} label={`${stage.label} em 2024`} emphasized />
                  {stage.progress !== null ? (
                    <progress
                      aria-label={`${stage.label}: ${formatPercent(stage.progress)}`}
                      max="100"
                      value={stage.progress}
                    />
                  ) : null}
                </li>
              ))}
            </ol>
            <dl className="municipal-finance-execution-detail-grid">
              {presentation.executionOutstanding.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd><FinanceValue value={item.value} label={item.label} catalog={loadState.catalog} /></dd>
                </div>
              ))}
              {presentation.executionRates.map((rate) => (
                <div key={rate.key}>
                  <dt>{rate.label}</dt>
                  <dd>{formatPercent(rate.value.value)}</dd>
                </div>
              ))}
            </dl>
            <p className="municipal-finance-method-note">
              Percentuais descritivos já calculados no contrato; não representam eficiência ou qualidade da gestão.
            </p>
          </section>

          <section className="page-card municipal-finance-section municipal-finance-qse" aria-labelledby="municipal-finance-qse-title">
            <SectionHeading
              eyebrow="Transferência e estimativa separadas"
              title="Quota municipal do salário-educação"
              titleId="municipal-finance-qse-title"
              description="A distribuição de 2024 não é saldo e não é somada à estimativa de 2026."
            />
            <div className="municipal-finance-qse-groups">
              {presentation.qseGroups.map((group) => (
                <article key={group.key}>
                  <h3>{group.title}</h3>
                  <dl>
                    {group.metrics.map((metric) => (
                      <div key={metric.label}>
                        <dt>{metric.label}</dt>
                        <dd><FinanceValue value={metric.value} label={metric.label} catalog={loadState.catalog} emphasized /></dd>
                        <small>{metric.value.referenceYear} · {metric.value.amountNature === 'official_estimate' ? 'estimativa oficial' : 'fonte nominal'}</small>
                      </div>
                    ))}
                  </dl>
                  {group.comparison ? <p>{group.comparison}</p> : null}
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="municipal-finance-primary-column municipal-finance-primary-column--right">
          <section className="page-card municipal-finance-section municipal-finance-fundeb" aria-labelledby="municipal-finance-fundeb-title">
            <SectionHeading
              eyebrow="Previsão oficial anual"
              title="Fundeb e complementações — previsão 2026"
              titleId="municipal-finance-fundeb-title"
              description="Total e componentes são apresentados separadamente, sem nova soma."
            />
            <ol className="municipal-finance-fundeb-list">
              {presentation.fundebComponents.map((component) => (
                <li key={component.key}>
                  <div className="municipal-finance-fundeb-list__identity">
                    <h3>{component.title}</h3>
                    <StatusBadge
                      displayStatus={undefined}
                      marker={undefined}
                      status={component.statusLabel}
                      title={undefined}
                      tone={component.statusLabel === 'Beneficiário' ? 'info' : 'muted'}
                    />
                  </div>
                  <div className="municipal-finance-fundeb-list__amount">
                    <FinanceValue value={component.amount} label={`${component.title} previsto em 2026`} catalog={loadState.catalog} emphasized />
                    <span>Exercício {component.amount.referenceYear}</span>
                  </div>
                  <p>{component.observation}</p>
                </li>
              ))}
            </ol>
            <p className="municipal-finance-fundeb-note">
              Os componentes não devem ser somados novamente ao total. Benefício e previsão não representam recebimento.
            </p>
            <details className="municipal-finance-disclosure municipal-finance-fundeb-disclosure">
              <summary>Ver metadados do Fundeb</summary>
              <div className="municipal-finance-fundeb-metadata">
                {presentation.fundebComponents.map((component) => (
                  <article key={component.key}>
                    <h3>{component.title}</h3>
                    <dl>
                      <div><dt>Natureza</dt><dd>{component.natureLabel}</dd></div>
                      <div><dt>Estágio</dt><dd>{component.stageLabel} · {component.amount.referenceYear}</dd></div>
                      <div><dt>Composição</dt><dd>{component.inclusionLabel}</dd></div>
                      <div><dt>Dupla contagem</dt><dd>{component.doubleCountingLabel}</dd></div>
                    </dl>
                    {component.calculationStatusLabel ? <p>{component.calculationStatusLabel}</p> : null}
                    {component.summationNote ? <p className="municipal-finance-no-sum">{component.summationNote}</p> : null}
                    {component.caution ? <p className="municipal-finance-method-note">{component.caution}</p> : null}
                    <SourceReference source={component.source} />
                  </article>
                ))}
              </div>
            </details>
          </section>
        </div>
      </div>

      <section className="page-card municipal-finance-section municipal-finance-coverage" aria-labelledby="municipal-finance-coverage-title">
        <div className="municipal-finance-section__heading-with-status">
          <SectionHeading
            eyebrow="Transparência da evidência"
            title="Cobertura e limitações dos dados"
            titleId="municipal-finance-coverage-title"
            description="O nível descreve a cobertura da evidência disponível e não o desempenho financeiro do município."
          />
          <StatusBadge
            displayStatus={undefined}
            marker={undefined}
            status={presentation.qualityLabel}
            title={undefined}
            tone="muted"
          />
        </div>
        <p className="municipal-finance-coverage-summary">
          {presentation.coverageSummary.complete} dimensões completas · {presentation.coverageSummary.pending} pendentes · {presentation.coverageSummary.unavailable} indisponíveis
        </p>
        <dl className="municipal-finance-coverage-grid municipal-finance-coverage-grid--highlights">
          {presentation.coverageHighlights.map((dimension) => (
            <CoverageDimension key={dimension.key} dimension={dimension} />
          ))}
        </dl>
        <details className="municipal-finance-disclosure municipal-finance-coverage-disclosure">
          <summary>Ver cobertura detalhada</summary>
          <dl className="municipal-finance-coverage-grid">
            {presentation.coverage.map((dimension) => (
              <CoverageDimension key={dimension.key} dimension={dimension} />
            ))}
          </dl>
        </details>
      </section>

      <section className="page-card municipal-finance-section municipal-finance-relations" aria-labelledby="municipal-finance-relations-title">
        <SectionHeading
          eyebrow="Contexto educacional"
          title="Relação com os pontos de atenção"
          titleId="municipal-finance-relations-title"
          description="Leitura contextual das relações documentadas no contrato, sem alterar a síntese educacional."
        />
        {presentation.relations.length ? (
          <div className="municipal-finance-relation-list">
            {presentation.relations.map((relation) => (
              <article key={relation.key}>
                <h3>{relation.relationLabel} — {relation.programLabel}</h3>
                <p className="municipal-finance-relation-list__indicator">Relacionada a: {relation.indicatorLabel}</p>
                <p>{relation.reading}</p>
              </article>
            ))}
          </div>
        ) : (
          <ContentState kind="empty" className="municipal-finance-relation-empty">
            Nenhuma relação financeira documentada no contrato atual para este contexto.
          </ContentState>
        )}
      </section>

      <footer className="municipal-finance-sources" aria-labelledby="municipal-finance-sources-title">
        <div className="municipal-finance-sources__heading">
          <span className="eyebrow">Referências oficiais</span>
          <h2 id="municipal-finance-sources-title">Fontes</h2>
        </div>
        <p className="municipal-finance-sources__line">
          {presentation.sources.map((group) => group.label).join(' · ')}
        </p>
        <details className="municipal-finance-disclosure municipal-finance-sources__disclosure">
          <summary>Consultar fontes e metodologia</summary>
          <ul className="municipal-finance-sources__groups">
            {presentation.sources.map((group) => (
              <li key={group.key}>
                <strong>{group.label}</strong>
                {group.description ? <p>{group.description}</p> : <p>Detalhamento do catálogo indisponível.</p>}
                <ul>
                  {group.links.map((link) => (
                    <li key={link.url}>
                      <a href={link.url} rel="noreferrer" target="_blank">{link.label}</a>
                      <small>
                        {link.agency}{link.referenceYear ? ` · ${link.referenceYear}` : ''} · {link.natureLabel}
                      </small>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </details>
      </footer>
    </PageFrame>
  )
}

function ConstitutionalApplicationSection({
  document,
  catalog,
}: {
  document: MunicipalFinanceDocumentV1
  catalog: MunicipalFinanceCatalog | null
}) {
  const application = document.constitutionalApplication
  const reconciliation = document.reconciliation
  const coverage = document.dataQuality.coverageByDimension.constitutionalApplication
  const reconciliationCoverage = document.dataQuality.coverageByDimension.reconciliation
  const metrics = [
    application.mdeAppliedAmount,
    application.mdeAppliedRate,
    application.fundebProfessionalRemunerationRate,
  ]
  const reasonCodes = [
    ...coverage.reasonCodes,
    ...reconciliationCoverage.reasonCodes,
    ...reconciliation.reasonCodes,
    ...metrics.flatMap((metric) => [
      ...metric.reconciliation.reasonCodes,
      metric.canonical.nullReasonCode,
      metric.siope.nullReasonCode,
      metric.rreo.nullReasonCode,
    ]),
    application.fundebRevenueReceivedDeclared.nullReasonCode,
  ].filter((reasonCode): reasonCode is string => Boolean(reasonCode))
  const uniqueReasonCodes = Array.from(new Set(reasonCodes))
  const revisionBlocked = uniqueReasonCodes.includes('source_revision_detected')
  const contractStatus = application.status !== 'reconciled'
    ? application.status
    : reconciliation.status !== 'reconciled'
      ? reconciliation.status
      : coverage.status !== 'complete'
        ? coverage.status
        : reconciliationCoverage.status !== 'complete'
          ? reconciliationCoverage.status
          : 'reconciled'
  const status = getConstitutionalStatusPresentation(contractStatus, revisionBlocked)
  const canPublishMainValues = contractStatus === 'reconciled' && !revisionBlocked
  const reasonMessages = uniqueReasonCodes.map((reasonCode) => (
    catalog?.reasonMessages[reasonCode] ?? reasonCode
  ))
  const unavailableReason = reasonMessages[0] ?? status.description
  const sourceIds = Array.from(new Set([
    ...metrics.flatMap((metric) => metric.reconciliation.sourceIds),
    ...reconciliation.availableSourceIds,
    ...reconciliation.pendingSourceIds,
    application.fundebRevenueReceivedDeclared.sourceId,
  ]))
  const sourceNames = sourceIds.map((sourceId) => (
    catalog?.sources.find((source) => source.sourceId === sourceId)?.name
  )).filter((name): name is string => Boolean(name))

  return (
    <section
      className="page-card municipal-finance-section municipal-finance-constitutional-application"
      aria-labelledby="municipal-finance-constitutional-title"
    >
      <div className="municipal-finance-section__heading-with-status">
        <SectionHeading
          eyebrow="SIOPE × RREO · sexto bimestre"
          title={`Aplicação constitucional da educação — ${application.referenceYear}`}
          titleId="municipal-finance-constitutional-title"
          description="Valores declarados pelo município e apresentados conforme a reconciliação publicada no contrato."
        />
        <StatusBadge
          displayStatus={undefined}
          marker={undefined}
          status={status.label}
          title={status.description}
          tone="muted"
        />
      </div>

      <div className="municipal-finance-constitutional-primary-grid">
        <article className="municipal-finance-constitutional-metric municipal-finance-constitutional-metric--mde">
          <h3>Aplicado em MDE</h3>
          <span className="municipal-finance-constitutional-metric__label">Percentual aplicado em MDE</span>
          <ConstitutionalCanonicalValue
            canPublish={canPublishMainValues}
            catalog={catalog}
            label="Percentual aplicado em MDE"
            reason={unavailableReason}
            value={application.mdeAppliedRate.canonical}
          />
          <dl>
            <div>
              <dt>Valor aplicado em MDE</dt>
              <dd>
                <ConstitutionalCanonicalValue
                  canPublish={canPublishMainValues}
                  catalog={catalog}
                  label="Valor aplicado em MDE"
                  reason={unavailableReason}
                  value={application.mdeAppliedAmount.canonical}
                />
              </dd>
            </div>
          </dl>
        </article>

        <article className="municipal-finance-constitutional-metric">
          <h3>Remuneração dos profissionais</h3>
          <span className="municipal-finance-constitutional-metric__label">
            Percentual dos recursos do Fundeb destinado à remuneração
          </span>
          <ConstitutionalCanonicalValue
            canPublish={canPublishMainValues}
            catalog={catalog}
            label="Percentual do Fundeb destinado à remuneração dos profissionais da educação"
            reason={unavailableReason}
            value={application.fundebProfessionalRemunerationRate.canonical}
          />
        </article>
      </div>

      <div className="municipal-finance-constitutional-strip">
        <article className="municipal-finance-constitutional-revenue">
          <div>
            <span className="municipal-finance-constitutional-metric__label">Receita Fundeb declarada</span>
            <ConstitutionalCanonicalValue
              canPublish={canPublishMainValues}
              catalog={catalog}
              label="Receita Fundeb recebida declarada em 2024"
              reason={unavailableReason}
              value={application.fundebRevenueReceivedDeclared}
            />
          </div>
          <p>
            Valor declarado pelo município no SIOPE e no RREO. Não representa transferência efetiva confirmada pelo concedente nem saldo disponível.
          </p>
        </article>

        <article className="municipal-finance-constitutional-reconciliation">
          <div className="municipal-finance-constitutional-reconciliation__status">
            <span>Reconciliação das fontes</span>
            <strong>{status.label}</strong>
          </div>
          <p>{status.description}</p>
          <dl>
            <div><dt>Período</dt><dd>{application.period}º bimestre de {application.referenceYear}</dd></div>
            <div><dt>Base da despesa</dt><dd>{application.stageBasis}</dd></div>
            <div><dt>Fontes</dt><dd>{sourceNames.length ? sourceNames.join(' · ') : 'Catálogo de fontes indisponível'}</dd></div>
          </dl>
          {!canPublishMainValues && reasonMessages.length ? (
            <ul className="municipal-finance-constitutional-reasons" aria-label="Limitações informadas pelo contrato">
              {reasonMessages.map((message) => <li key={message}>{message}</li>)}
            </ul>
          ) : null}
        </article>
      </div>

      <div className="municipal-finance-constitutional-disclosures">
        <details className="platform-support-disclosure municipal-finance-constitutional-disclosure">
          <summary className="platform-support-disclosure__summary">
            <div>
              <h3>Ver valores por fonte</h3>
              <p>SIOPE e RREO permanecem separados, sem fonte preferencial.</p>
            </div>
          </summary>
          <div className="platform-support-disclosure__body">
            <div className="municipal-finance-constitutional-source-grid">
              <ConstitutionalSourceCard
                application={application}
                catalog={catalog}
                revisionBlocked={revisionBlocked}
                sourceKey="siope"
                unavailableReason={unavailableReason}
              />
              <ConstitutionalSourceCard
                application={application}
                catalog={catalog}
                revisionBlocked={revisionBlocked}
                sourceKey="rreo"
                unavailableReason={unavailableReason}
              />
            </div>
          </div>
        </details>

        <details className="platform-support-disclosure municipal-finance-constitutional-disclosure">
          <summary className="platform-support-disclosure__summary">
            <div>
              <h3>Nota metodológica</h3>
              <p>Diferença entre MDE constitucional e DCA.</p>
            </div>
          </summary>
          <div className="platform-support-disclosure__body">
            <p className="municipal-finance-method-note">
              MDE constitucional e despesa da função Educação na DCA representam universos contábeis e legais diferentes e não devem ser comparados diretamente.
            </p>
          </div>
        </details>
      </div>
    </section>
  )
}

function ConstitutionalCanonicalValue({
  canPublish,
  catalog,
  label,
  reason,
  value,
}: {
  canPublish: boolean
  catalog: MunicipalFinanceCatalog | null
  label: string
  reason: string
  value: CompactFinancialValue
}) {
  if (!canPublish) {
    return (
      <span className="municipal-finance-value municipal-finance-value--missing">
        <span>Valor não publicado</span>
        <small>{reason}</small>
      </span>
    )
  }
  return <FinanceValue value={value} label={label} catalog={catalog} emphasized />
}

function ConstitutionalSourceCard({
  application,
  catalog,
  revisionBlocked,
  sourceKey,
  unavailableReason,
}: {
  application: MunicipalFinanceDocumentV1['constitutionalApplication']
  catalog: MunicipalFinanceCatalog | null
  revisionBlocked: boolean
  sourceKey: 'siope' | 'rreo'
  unavailableReason: string
}) {
  const sourceValue = application.mdeAppliedAmount[sourceKey]
  const source = catalog?.sources.find((entry) => entry.sourceId === sourceValue.sourceId) ?? null
  const sourceLabel = sourceKey === 'siope' ? 'SIOPE' : 'RREO'
  const sourceStatus = source?.status === 'integrated'
    ? 'Integrada'
    : source?.status === 'manual'
      ? 'Consulta manual'
      : source?.status === 'unavailable'
        ? 'Indisponível'
        : null
  const metrics = [
    { label: 'Valor aplicado em MDE', value: application.mdeAppliedAmount[sourceKey] },
    { label: 'Percentual aplicado em MDE', value: application.mdeAppliedRate[sourceKey] },
    { label: 'Remuneração dos profissionais', value: application.fundebProfessionalRemunerationRate[sourceKey] },
    ...(sourceKey === 'rreo'
      ? [{ label: 'Receita Fundeb declarada', value: application.fundebRevenueReceivedDeclared }]
      : []),
  ]

  return (
    <article>
      <header>
        <div>
          <span>{sourceLabel}</span>
          <h4>{source?.name ?? 'Fonte não identificada no catálogo'}</h4>
        </div>
        {sourceStatus ? (
          <StatusBadge
            displayStatus={undefined}
            marker={undefined}
            status={sourceStatus}
            title={`Status da fonte: ${sourceStatus}`}
            tone="muted"
          />
        ) : null}
      </header>
      <dl className="municipal-finance-constitutional-source-meta">
        <div><dt>Exercício</dt><dd>{source?.referenceYear ?? application.referenceYear}</dd></div>
        <div><dt>Período</dt><dd>{application.period}º bimestre</dd></div>
      </dl>
      <dl className="municipal-finance-constitutional-source-values">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>
              {revisionBlocked ? (
                <span className="municipal-finance-value municipal-finance-value--missing">
                  <span>Valor bloqueado</span>
                  <small>{unavailableReason}</small>
                </span>
              ) : (
                <FinanceValue value={metric.value} label={`${metric.label} — ${sourceLabel}`} catalog={catalog} />
              )}
            </dd>
          </div>
        ))}
      </dl>
      {source ? <SourceReference source={source} /> : null}
    </article>
  )
}

function getConstitutionalStatusPresentation(status: string, revisionBlocked: boolean) {
  if (revisionBlocked) {
    return {
      label: 'Fonte em revisão',
      description: 'A publicação permanece bloqueada enquanto a revisão ou retificação da fonte estiver pendente.',
    }
  }
  if (status === 'reconciled') {
    return {
      label: 'Reconciliado',
      description: 'Valores reconciliados entre SIOPE e RREO.',
    }
  }
  if (['divergent', 'divergent_explained', 'divergent_unexplained', 'reconciliation_required'].includes(status)) {
    return {
      label: 'Divergente',
      description: 'Os valores declarados no SIOPE e no RREO apresentam divergência e devem ser analisados separadamente.',
    }
  }
  if (status === 'source_missing') {
    return {
      label: 'Fonte ausente',
      description: 'A reconciliação está parcial porque uma das fontes previstas no contrato está ausente.',
    }
  }
  if (status === 'partial') {
    return {
      label: 'Parcial',
      description: 'A reconciliação está parcial; somente as informações disponíveis no contrato são apresentadas.',
    }
  }
  if (status === 'unavailable') {
    return {
      label: 'Indisponível',
      description: 'O contrato não disponibiliza informações suficientes para publicar os valores reconciliados.',
    }
  }
  return {
    label: 'Reconciliação parcial',
    description: 'A reconciliação não está concluída; somente as informações disponibilizadas pelo contrato são apresentadas.',
  }
}

function PageFrame({
  children,
  municipalityName,
  returnHref,
}: {
  children: ReactNode
  municipalityName: string
  returnHref: string
}) {
  return (
    <div className="page-stack financial-page municipal-finance-panorama">
      <FinancialCompactModuleSelector activePageKey={FINANCIAL_PAGE_KEYS.panorama} />
      <section className="page-card municipal-finance-hero">
        <a className="municipal-finance-back-link" href={returnHref}>
          <span aria-hidden="true">←</span> Voltar ao Diagnóstico municipal
        </a>
        <span className="eyebrow">Financiamento · evidências municipais</span>
        <h1>{municipalityName}: panorama financeiro da educação</h1>
        <p>Receitas, previsões e execução identificadas nas fontes oficiais disponíveis.</p>
        <p className="municipal-finance-hero__note">
          Os valores apresentados possuem períodos, estágios e fontes diferentes e não devem ser somados automaticamente.
        </p>
      </section>
      {children}
    </div>
  )
}

function ContextNotice({ labels }: { labels: { indicators: readonly string[]; programs: readonly string[] } }) {
  if (!labels.indicators.length && !labels.programs.length) return null
  return (
    <aside className="municipal-finance-context" aria-label="Contexto recebido do Diagnóstico municipal">
      <strong>Contexto recebido do Diagnóstico municipal</strong>
      {labels.indicators.length ? <p><span>Indicadores:</span> {labels.indicators.join('; ')}</p> : null}
      {labels.programs.length ? <p><span>Programas:</span> {labels.programs.join('; ')}</p> : null}
    </aside>
  )
}

function SectionHeading({ eyebrow, title, titleId, description }: {
  eyebrow: string
  title: string
  titleId: string
  description: string
}) {
  return (
    <header className="municipal-finance-section__heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={titleId}>{title}</h2>
      <p>{description}</p>
    </header>
  )
}

function FinanceValue({
  value,
  label,
  catalog = null,
  emphasized = false,
}: {
  value: CompactFinancialValue
  label: string
  catalog?: MunicipalFinanceCatalog | null
  emphasized?: boolean
}) {
  if (value.value === null) {
    const reason = value.nullReasonCode
      ? catalog?.reasonMessages[value.nullReasonCode] ?? 'Dado não publicado para este componente.'
      : 'Dado indisponível.'
    return (
      <span className="municipal-finance-value municipal-finance-value--missing">
        <span>Não disponível</span>
        <small>{reason}</small>
      </span>
    )
  }

  const formatted = formatFinanceValue(value, true)
  const full = formatFinanceValue(value, false)
  return (
    <span
      className={`municipal-finance-value${emphasized ? ' municipal-finance-value--emphasized' : ''}`}
      title={`${label}: ${full}`}
    >
      <span aria-hidden="true">{formatted}</span>
      <span className="u-sr-only">{label}: {full}</span>
    </span>
  )
}

function formatFinanceValue(value: CompactFinancialValue, compact: boolean): string {
  const numericValue = value.value as number
  if (value.unit === 'BRL') return compact ? formatCompactCurrency(numericValue) : formatFullCurrency(numericValue)
  if (value.unit === 'BRL_per_student') return `${formatFullCurrency(numericValue)} por matrícula`
  if (value.unit === 'percent') return formatPercent(numericValue)
  if (value.unit === 'count') return formatCount(numericValue)
  return formatCoefficient(numericValue)
}

function CoverageDimension({ dimension }: {
  dimension: {
    key: string
    label: string
    status: string
    statusLabel: string
    reason: string | null
  }
}) {
  return (
    <div>
      <dt>{dimension.label}</dt>
      <dd>
        <StatusBadge
          displayStatus={undefined}
          marker={undefined}
          status={dimension.statusLabel}
          title={undefined}
          tone={dimension.status === 'complete' ? 'info' : 'muted'}
        />
        {dimension.reason ? <small>{dimension.reason}</small> : null}
      </dd>
    </div>
  )
}

function SourceReference({ source }: { source: MunicipalFinanceSourceCatalogEntry | null }) {
  if (!source?.name) return <p className="municipal-finance-source-reference">Fonte do catálogo indisponível.</p>
  return (
    <p className="municipal-finance-source-reference">
      <span>Fonte:</span>{' '}
      {source.url ? <a href={source.url} rel="noreferrer" target="_blank">{source.agency} — {source.name}</a> : source.name}
    </p>
  )
}

function MunicipalFinanceSkeleton() {
  return (
    <div className="municipal-finance-skeleton" role="status" aria-busy="true" aria-label="Carregando panorama financeiro">
      <div className="municipal-finance-summary-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="page-card municipal-finance-summary-card state-skeleton" key={index}>
            <span /><span /><span />
          </div>
        ))}
      </div>
      <div className="municipal-finance-primary-grid" aria-hidden="true">
        <div className="municipal-finance-primary-column municipal-finance-primary-column--left">
          {Array.from({ length: 2 }, (_, index) => (
            <div className="page-card municipal-finance-section state-skeleton" key={index}>
              <span /><span /><span />
            </div>
          ))}
        </div>
        <div className="municipal-finance-primary-column municipal-finance-primary-column--right">
          <div className="page-card municipal-finance-section state-skeleton">
            <span /><span /><span />
          </div>
        </div>
      </div>
      <span className="u-sr-only">Carregando dados financeiros.</span>
    </div>
  )
}
