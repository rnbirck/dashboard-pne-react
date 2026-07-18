import type { ReactNode } from 'react'
import { ContentState } from '../../../components/ContentState.jsx'
import { IndicatorProjectionPanel } from '../../../components/IndicatorProjectionPanel.jsx'
import {
  PLANNING_SCENARIO_GROUPS,
  PLANNING_SCENARIO_INDICATORS,
  adaptPlanningScenarioContract,
  type PlanningScenarioContract,
  type PlanningScenarios,
  type PlanningScenarioStatus,
} from '../../../data/planningScenarios'
import { formatNumber } from '../../../utils/educationFormatters.js'

interface EducationPlanningScenariosSectionProps {
  scenarios?: PlanningScenarios | null
}

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
})

export function EducationPlanningScenariosSection({
  scenarios,
}: EducationPlanningScenariosSectionProps) {
  return (
    <section className="education-projection-preview" aria-labelledby="education-planning-scenarios-title">
      <header className="education-projection-preview__intro">
        <div>
          <span className="education-projection-preview__eyebrow">Apoio ao planejamento</span>
          <h2 id="education-planning-scenarios-title">Cenários de planejamento</h2>
          <p>Cenários construídos a partir do último patamar observado e das referências atualmente configuradas no painel. Servem como apoio ao planejamento municipal e não representam previsões oficiais.</p>
        </div>
        <p className="education-projection-preview__boundary">
          O cenário de manutenção não comprova estabilidade futura. A trajetória necessária explicita o ritmo associado à referência configurada, sem classificar o município.
        </p>
      </header>

      {scenarios ? (
        <div className="education-projection-preview__groups">
          {PLANNING_SCENARIO_GROUPS.map((group) => {
            const indicators = PLANNING_SCENARIO_INDICATORS.filter((indicator) => (
              group.indicatorKeys.includes(indicator.key)
            ))
            return (
              <section className="education-projection-preview__group" key={group.key} aria-labelledby={`planning-scenarios-group-${group.key}`}>
                <header className="education-projection-preview__group-heading">
                  <h3 id={`planning-scenarios-group-${group.key}`}>{group.title}</h3>
                  <p>{group.description}</p>
                </header>
                <div className="education-projection-preview__grid">
                  {indicators.map((indicator) => (
                    <EducationPlanningScenarioCard
                      contract={scenarios[indicator.key]}
                      indicator={indicator}
                      key={indicator.key}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <ContentState kind="unavailable" className="state-box">
          <strong>Cenários de planejamento indisponíveis</strong>
          <span>Não há contratos publicados para o município selecionado.</span>
        </ContentState>
      )}

      <footer className="education-projection-preview__method">
        <h3>Como interpretar os cenários</h3>
        <dl>
          <div>
            <dt>Histórico observado</dt>
            <dd>Valores calculados a partir dos componentes disponíveis no pipeline.</dd>
          </div>
          <div>
            <dt>Patamar mantido até 2036</dt>
            <dd>Repete os últimos numerador e denominador observados; não é evidência de estabilidade futura.</dd>
          </div>
          <div>
            <dt>Trajetória necessária para a referência</dt>
            <dd>Percurso calculado no pipeline para alcançar ou permanecer dentro da referência configurada.</dd>
          </div>
          <div>
            <dt>Referência atualmente configurada no painel</dt>
            <dd>A referência é utilizada como parâmetro de planejamento e não representa, nesta aplicação, uma obrigação legal municipal validada.</dd>
          </div>
        </dl>
      </footer>
    </section>
  )
}

function EducationPlanningScenarioCard({
  contract,
  indicator,
}: {
  contract?: PlanningScenarioContract
  indicator: typeof PLANNING_SCENARIO_INDICATORS[number]
}) {
  const panelScenario = adaptPlanningScenarioContract(contract)
  const history = contract?.historical ?? []
  const latest = history[history.length - 1]
  const status = contract?.status ?? 'insufficient_data'
  const statusCopy = getStatusCopy(status)
  const quality = contract?.qualityEvidence?.provisionalLevel
  const violations = contract?.diagnostics?.domainViolations?.length ?? 0
  const headingId = `planning-scenario-${indicator.key}`

  return (
    <article className={`page-card education-projection-preview-card education-projection-preview-card--${status}`} aria-labelledby={headingId}>
      <header className="education-projection-preview-card__heading">
        <PlanningScenarioIcon indicatorKey={indicator.key} />
        <div>
          <span className="education-projection-preview-card__context">Cenário de manutenção</span>
          <h4 id={headingId}>{indicator.title}</h4>
          <p>{indicator.numeratorLabel} ÷ {indicator.denominatorLabel}</p>
        </div>
        <span className={`education-projection-preview-card__status education-projection-preview-card__status--${statusCopy.tone}`}>
          {statusCopy.label}
        </span>
      </header>

      <div className="education-projection-preview-card__components" aria-label="Últimos componentes observados">
        <div>
          <span>Numerador · {latest?.year ?? '—'}</span>
          <strong>{latest?.numerator == null ? '—' : formatNumber(latest.numerator)}</strong>
        </div>
        <div>
          <span>Denominador · {latest?.year ?? '—'}</span>
          <strong>{latest?.denominator == null ? '—' : formatNumber(latest.denominator)}</strong>
        </div>
      </div>

      {panelScenario.available ? (
        <IndicatorProjectionPanel
          chartHeight={216}
          chartLabel={indicator.title}
          compact
          contentLabels={{
            accessibleChartPrefix: 'Gráfico do cenário de manutenção',
            observedLegend: `Histórico observado até ${latest?.year ?? 'o último ano disponível'}`,
            observedValue: latest?.year ? `Último valor observado (${latest.year})` : 'Último valor observado',
            projectedColor: 'var(--chart-series-2)',
            projectedLegend: 'Patamar mantido até 2036',
            projectedPoint: 'Patamar mantido',
            projectedValue: 'Patamar mantido em 2036',
            referenceLegend: 'Trajetória necessária para a referência',
            title: 'Cenário de manutenção',
            variant: 'maintenance',
          }}
          contextOnly
          projection={panelScenario}
          showContextAlerts={false}
          showTitle={false}
        />
      ) : (
        <ContentState kind="unavailable" className="education-projection-preview-card__invalid">
          <strong>{statusCopy.label}</strong>
          <span>{statusCopy.description}</span>
        </ContentState>
      )}

      <div className="education-projection-preview-card__references">
        <span>Referência atualmente configurada no painel</span>
        <ul>
          {(contract?.targets ?? []).map((target) => (
            <li key={target.year}>
              <strong>{percentFormatter.format(target.value)}%</strong>
              <span>em {target.year} · {contract?.direction === 'at_most' ? 'limite máximo' : 'patamar mínimo'}</span>
              <span>Ritmo anual necessário: {formatAnnualPace(target.requiredAnnualPacePp)} p.p./ano</span>
            </li>
          ))}
        </ul>
        <p>A referência é utilizada como parâmetro de planejamento e não representa, nesta aplicação, uma obrigação legal municipal validada.</p>
      </div>

      <footer className="education-projection-preview-card__footer">
        <p>
          <strong>Qualidade do cenário:</strong> {formatQuality(quality)}.
          {violations > 0 ? ` ${violations} ${violations === 1 ? 'violação de domínio registrada' : 'violações de domínio registradas'}.` : ''}
        </p>
        {contract?.qualityEvidence?.reasons?.length ? (
          <details>
            <summary>Evidências de qualidade</summary>
            <ul>
              {contract.qualityEvidence.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </details>
        ) : null}
        <p><strong>Fonte:</strong> {indicator.source}</p>
      </footer>
    </article>
  )
}

function getStatusCopy(status: PlanningScenarioStatus) {
  const labels = {
    available: { label: 'Disponível', tone: 'neutral', description: 'Cenário de planejamento disponível.' },
    available_with_warning: { label: 'Com ressalvas', tone: 'warning', description: 'Cenário disponível com alertas de qualidade ou domínio.' },
    insufficient_data: { label: 'Dados insuficientes', tone: 'muted', description: 'A série não possui evidência suficiente para formar o cenário.' },
    invalid_components: { label: 'Componentes inválidos', tone: 'warning', description: 'Numerador ou denominador apresenta inconsistência que impede o cenário.' },
    invalid_domain: { label: 'Domínio inválido', tone: 'warning', description: 'O denominador ou o resultado está fora do domínio necessário para o cálculo.' },
  } satisfies Record<PlanningScenarioStatus, { description: string; label: string; tone: string }>
  return labels[status]
}

function formatAnnualPace(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${percentFormatter.format(value)}`
}

function formatQuality(quality?: string | null) {
  const labels: Record<string, string> = {
    alta: 'alta',
    media: 'média',
    baixa: 'baixa',
    insuficiente: 'insuficiente',
  }
  return quality ? labels[quality] ?? quality : 'não classificada'
}

function PlanningScenarioIcon({ indicatorKey }: { indicatorKey: string }) {
  const paths: Record<string, ReactNode> = {
    basico_integral: <><path d="M4 5.5h16v13H4z" /><path d="M8 9h8M8 13h5M12 18.5v2" /></>,
    escolas_integral: <><path d="m3 10 9-6 9 6" /><path d="M5 9v10h14V9M9 19v-5h6v5" /></>,
    pos_graduacao: <><path d="m3 9 9-4 9 4-9 4z" /><path d="M7 11.5v4c2.5 2 7.5 2 10 0v-4M20 10v5" /></>,
    temporarios: <><circle cx="9" cy="9" r="4" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M17 12v4l2 1" /><circle cx="17" cy="16" r="4" /></>,
  }
  return (
    <span className="education-projection-preview-card__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
        {paths[indicatorKey] ?? paths.basico_integral}
      </svg>
    </span>
  )
}
