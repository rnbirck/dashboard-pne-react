import { useEffect, useMemo, useState } from 'react'
import { ChartLegend } from '../../components/ChartPrimitives'
import { IndicatorHistoryChart } from '../../components/IndicatorHistoryChart'
import {
  calculateQseAnnualVariation,
  prepareQseAnnualSeries,
  qseAnnualLoader,
  type QseAnnualDocumentV1,
  type QseAnnualPoint,
  type QseAnnualLoadStatus,
} from '../../data/qseAnnual'
import type { MunicipalFinanceDocumentV1 } from '../diagnostic/municipalFinanceTypes'
import {
  formatCoefficient,
  formatCompactCurrency,
  formatCount,
  formatFullCurrency,
} from './municipalFinancePresentation'
import { FinancialDisclosure } from './FinancialPanoramaComponents'

const FNDE_QSE_CONSULTATIONS_URL = 'https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/salario-educacao/consultas'

interface QseHistoryState {
  status: QseAnnualLoadStatus
  document: QseAnnualDocumentV1 | null
}

export function QseAnnualPanel({ document }: { document: MunicipalFinanceDocumentV1 }) {
  const ibgeCode = document.municipality.ibgeCode
  const [history, setHistory] = useState<QseHistoryState>({ status: 'idle', document: null })

  useEffect(() => {
    let cancelled = false
    setHistory({ status: 'loading', document: null })
    void qseAnnualLoader.load(ibgeCode).then((annualDocument) => {
      if (!cancelled) setHistory({ status: 'ready', document: annualDocument })
    }).catch(() => {
      if (!cancelled) setHistory({ status: qseAnnualLoader.getState(ibgeCode).status, document: null })
    })
    return () => { cancelled = true }
  }, [ibgeCode])

  const series = useMemo(
    () => prepareQseAnnualSeries(history.document?.series ?? []),
    [history.document],
  )
  const latest = series[series.length - 1] ?? null
  const variation = calculateQseAnnualVariation(series)
  const distributedAmount = latest?.distributedAmount
    ?? document.amounts.qseDistributedClosedYear.value
  const distributedYear = latest?.year
    ?? document.amounts.qseDistributedClosedYear.referenceYear
  const perEnrollmentPoint = [...series].reverse().find(
    (point) => typeof point.distributedPerEnrollment === 'number',
  ) ?? null
  const perEnrollment = perEnrollmentPoint?.distributedPerEnrollment
    ?? document.perStudent.qseDistributedPerEnrollment.value
  const perEnrollmentYear = perEnrollmentPoint?.year
    ?? document.perStudent.qseDistributedPerEnrollment.referenceYear
  const estimate = document.amounts.qseOfficialEstimateCurrentYear
  const hasEstimate = typeof estimate.value === 'number' && Number.isFinite(estimate.value)

  return (
    <section className="page-card municipal-finance-section municipal-finance-qse" aria-labelledby="municipal-finance-qse-title">
      <h2 id="municipal-finance-qse-title">QSE — Quota Salário Educação</h2>

      <div className="municipal-finance-qse-kpis">
        <QseKpi
          label={`QSE distribuída em ${distributedYear}`}
          value={typeof distributedAmount === 'number' ? formatCompactCurrency(distributedAmount) : 'Não disponível'}
          fullValue={typeof distributedAmount === 'number' ? formatFullCurrency(distributedAmount) : undefined}
        />
        <QseKpi
          label={variation ? `Variação em relação a ${variation.previous.year}` : 'Variação anual'}
          value={formatVariation(variation?.percentage ?? null, Boolean(variation))}
          tone={variationTone(variation?.percentage ?? null)}
        />
        <QseKpi
          label={`Valor por matrícula em ${perEnrollmentYear}`}
          value={typeof perEnrollment === 'number' ? `${formatFullCurrency(perEnrollment)}` : 'Não calculável'}
          supporting={perEnrollmentPoint?.enrollmentBasis
            ? `${formatCount(perEnrollmentPoint.enrollmentBasis)} matrículas em ${perEnrollmentPoint.year}`
            : undefined}
        />
      </div>

      {history.status === 'loading' || history.status === 'idle' ? (
        <div className="municipal-finance-qse-history-state state-skeleton" role="status" aria-label="Carregando histórico anual da QSE">
          <span /><span /><span />
        </div>
      ) : series.length ? (
        <div className="municipal-finance-qse-analysis">
          <QseAnnualChart series={series} />
          <QseAnnualReading
            estimateValue={hasEstimate ? estimate.value : null}
            estimateYear={hasEstimate ? estimate.referenceYear : null}
            series={series}
          />
        </div>
      ) : (
        <p className="municipal-finance-qse-history-state">Histórico anual indisponível no momento.</p>
      )}

      <FinancialDisclosure className="municipal-finance-qse-methodology" label="Dados usados no cálculo">
        <dl className="municipal-finance-execution-detail-grid">
          {perEnrollmentPoint?.enrollmentBasis !== null && perEnrollmentPoint?.enrollmentBasis !== undefined ? (
            <div><dt>Matrículas utilizadas</dt><dd>{formatCount(perEnrollmentPoint.enrollmentBasis)} ({perEnrollmentPoint.year})</dd></div>
          ) : null}
          {perEnrollmentPoint?.distributionCoefficient !== null && perEnrollmentPoint?.distributionCoefficient !== undefined ? (
            <div><dt>Coeficiente de distribuição</dt><dd>{formatCoefficient(perEnrollmentPoint.distributionCoefficient)} ({perEnrollmentPoint.year})</dd></div>
          ) : null}
          <div><dt>Competência</dt><dd>Ano-calendário da distribuição</dd></div>
          <div><dt>Valor por matrícula</dt><dd>Valor distribuído ÷ matrículas oficiais do mesmo ano</dd></div>
        </dl>
        <p className="municipal-finance-method-note">
          Fonte: <a href={FNDE_QSE_CONSULTATIONS_URL} rel="noreferrer" target="_blank">FNDE — consultas do Salário-Educação</a>. Anos ausentes não são preenchidos; zero oficial é preservado.
        </p>
      </FinancialDisclosure>
    </section>
  )
}

function QseKpi({
  fullValue,
  label,
  supporting,
  tone,
  value,
}: {
  fullValue?: string
  label: string
  supporting?: string
  tone?: 'increase' | 'decrease'
  value: string
}) {
  return (
    <article className={`municipal-finance-qse-kpi${tone ? ` municipal-finance-qse-kpi--${tone}` : ''}`}>
      <span>{label}</span>
      <strong title={fullValue}>{value}</strong>
      {supporting ? <small>{supporting}</small> : null}
    </article>
  )
}

function formatVariation(percentage: number | null, hasComparison: boolean): string {
  if (!hasComparison) return 'Sem ano anterior comparável'
  if (percentage === null) return 'Não calculável sobre base zero'
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`
}

function variationTone(percentage: number | null): 'increase' | 'decrease' | undefined {
  if (percentage === null || percentage === 0) return undefined
  return percentage > 0 ? 'increase' : 'decrease'
}

export function QseAnnualChart({ series }: { series: readonly QseAnnualPoint[] }) {
  const latestYear = series[series.length - 1].year

  return (
    <div className="indicator-chart-card municipal-finance-qse-chart">
      <IndicatorHistoryChart
        adaptiveDomain
        chartHeight={230}
        chartType="bar"
        endYear={latestYear}
        essentialLabels
        formatDataLabel={(value: number) => formatCompactCurrency(value).replace(',00', '')}
        formatYAxis={(value: number) => value === 0 ? 'R$ 0' : formatCompactCurrency(value).replace(',00', '')}
        item={{ label: 'QSE distribuída' }}
        pneLayout
        series={series.map((point) => ({ ano: point.year, valor: point.distributedAmount }))}
        showMetaLine={false}
        startYear={series[0].year}
        subtitle={`Valores nominais realizados · ${series[0].year}–${latestYear}`}
        title="Histórico de valores (R$ mil)"
        unit="currency"
      />
      <ChartLegend
        className="municipal-finance-qse-chart__legend"
        items={[{
          color: 'var(--chart-primary)',
          key: 'qse-realized',
          label: 'Distribuição anual realizada',
        }]}
      />
    </div>
  )
}

function QseAnnualReading({
  estimateValue,
  estimateYear,
  series,
}: {
  estimateValue: number | null
  estimateYear: number | null
  series: readonly QseAnnualPoint[]
}) {
  const variation = calculateQseAnnualVariation(series)
  const maximum = series.reduce((current, point) => (
    point.distributedAmount > current.distributedAmount ? point : current
  ))
  const minimum = series.reduce((current, point) => (
    point.distributedAmount < current.distributedAmount ? point : current
  ))
  const absoluteDifference = variation
    ? Math.abs(variation.current.distributedAmount - variation.previous.distributedAmount)
    : null

  return (
    <aside className="municipal-finance-qse-reading" aria-labelledby="municipal-finance-qse-reading-title">
      <h3 id="municipal-finance-qse-reading-title">Leitura rápida</h3>
      <ul>
        {variation?.percentage !== null && variation?.percentage !== undefined && variation.percentage !== 0 ? (
          <li>
            <strong>{variation.percentage > 0 ? 'Aumento' : 'Redução'} no último ano</strong>
            <span>
              {Math.abs(variation.percentage).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}% em relação a {variation.previous.year}. Diferença de {formatFullCurrency(absoluteDifference as number)}.
            </span>
          </li>
        ) : null}
        {series.length > 1 ? (
          <li>
            <strong>Faixa observada no período</strong>
            <span>
              De {formatCompactCurrency(minimum.distributedAmount)} em {minimum.year} a {formatCompactCurrency(maximum.distributedAmount)} em {maximum.year}.
            </span>
          </li>
        ) : null}
        {estimateValue !== null && estimateYear !== null ? (
          <li>
            <strong>Planejamento para {estimateYear}</strong>
            <span>{formatCompactCurrency(estimateValue)} estimados; ainda não representam recurso distribuído.</span>
          </li>
        ) : null}
      </ul>
    </aside>
  )
}
