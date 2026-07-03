import { isMissing } from '../utils/educationFormatters'

const EM = '\u2014'

const FIELD_HELP = {
  habilitado_condicionalidades: {
    label: 'Habilitação',
    short: 'Indica se o município cumpriu as condicionalidades de gestão exigidas para concorrer ao VAAR.',
  },
  indicador_aprendizagem: {
    label: 'Indicador de aprendizagem',
    short: 'Síntese em escala de 0 a 10 que combina aprendizagem, avanço, aprovação, participação no Saeb e equidade.',
  },
  delta_aprendizagem: {
    label: 'Variação da aprendizagem',
    short: 'Diferença do indicador de aprendizagem entre ciclos do próprio município.',
  },
  delta_aprendizagem_ajustado: {
    label: 'Variação ajustada de aprendizagem',
    short: 'Variação após aplicação da regra metodológica, quando disponível.',
  },
  iad: {
    label: 'IAD - avanço de desempenho',
    short: 'Indicador de avanço de desempenho entre edições do Saeb.',
  },
  iad_ajustado: {
    label: 'IAD ajustado',
    short: 'IAD após tratamento de pequenas oscilações dentro da margem de erro.',
  },
  proporcao_adequada_saeb_2019: {
    label: 'Aprendizado adequado - Saeb 2019',
    short: 'Percentual de estudantes com desempenho igual ou acima do nível adequado no Saeb.',
  },
  proporcao_adequada_saeb_2023: {
    label: 'Aprendizado adequado - Saeb 2023',
    short: 'Percentual de estudantes com desempenho igual ou acima do nível adequado no Saeb.',
  },
  taxa_aprovacao_penalizada_2019: {
    label: 'Aprovação penalizada - 2019',
    short: 'Taxa de aprovação ajustada pela ausência de informação de rendimento ou movimento.',
  },
  taxa_aprovacao_penalizada_2023: {
    label: 'Aprovação penalizada - 2023',
    short: 'Taxa de aprovação ajustada pela ausência de informação de rendimento ou movimento.',
  },
  equidade_2023: {
    label: 'Índice de equidade calculado com Saeb 2023',
    short: 'Medida associada à aprendizagem de grupos vulneráveis.',
  },
  indicador_atendimento_anterior: {
    label: 'Indicador de atendimento anterior',
    short: 'Indicador do ano-base anterior, usado para leitura da variação.',
  },
  indicador_atendimento_atual: {
    label: 'Indicador de atendimento atual',
    short: 'Indicador do ano-base atual. Mede permanência dos estudantes.',
  },
  delta_atendimento: {
    label: 'Variação do atendimento',
    short: 'Diferença entre o indicador atual e o anterior.',
  },
  delta_atendimento_ajustado: {
    label: 'Variação ajustada do atendimento',
    short: 'Variação após aplicação da regra metodológica, quando disponível.',
  },
  estudantes_areas_prioritarias_anterior: {
    label: 'Estudantes em áreas prioritárias - anterior',
    short: 'Total de estudantes considerados no cálculo no ano-base anterior.',
  },
  estudantes_areas_prioritarias_atual: {
    label: 'Estudantes em áreas prioritárias - atual',
    short: 'Total de estudantes considerados no cálculo no ano-base atual.',
  },
  proporcao_abandono_anterior: {
    label: 'Abandono anterior',
    short: 'Proporção de estudantes que deixaram de frequentar a escola no ano-base anterior.',
  },
  proporcao_abandono_atual: {
    label: 'Abandono atual',
    short: 'Proporção de estudantes que deixaram de frequentar a escola no ano-base atual.',
  },
  proporcao_sem_informacao_anterior: {
    label: 'Sem informação anterior',
    short: 'Proporção de estudantes sem informação final de rendimento ou movimento no ano-base anterior.',
  },
  proporcao_sem_informacao_atual: {
    label: 'Sem informação de rendimento/movimento - atual',
    short: 'Proporção de estudantes sem informação final de rendimento ou movimento no ano-base atual.',
  },
  indicador_atendimento_metodologia_anterior: {
    label: 'Indicador atendimento',
    short: 'Indicador de melhoria do atendimento na regra histórica do VAAR.',
  },
  evolucao_atendimento_metodologia_anterior: {
    label: 'Evolução atendimento',
    short: 'Evolução da melhoria do atendimento na regra histórica do VAAR.',
  },
  coeficiente_atendimento: {
    label: 'Coeficiente atendimento',
    short: 'Coeficiente de distribuição do componente atendimento.',
  },
  indicador_aprendizagem_metodologia_anterior: {
    label: 'Indicador aprendizagem',
    short: 'Indicador de melhoria de aprendizagem com equidade na regra histórica do VAAR.',
  },
  evolucao_aprendizagem_metodologia_anterior: {
    label: 'Evolução aprendizagem',
    short: 'Evolução da melhoria de aprendizagem na regra histórica do VAAR.',
  },
  coeficiente_aprendizagem: {
    label: 'Coeficiente aprendizagem',
    short: 'Coeficiente de distribuição do componente aprendizagem com equidade.',
  },
  coeficiente_total: {
    label: 'Coeficiente de distribuição total',
    short: 'Coeficiente total de distribuição da complementação VAAR no exercício.',
  },
  apresentou_evolucao_nos_dois_indicadores: {
    label: 'Evolução nos dois indicadores',
    short: 'Indica se a fonte registrou evolução simultânea nos componentes de aprendizagem e atendimento.',
  },
}

const LEARNING_EXPLANATION_METRICS = [
  ['indicador_aprendizagem', 'decimal'],
  ['delta_aprendizagem', 'signedDecimal'],
  ['equidade_2023', 'decimal'],
  ['proporcao_adequada_saeb_2023', 'percent'],
  ['taxa_aprovacao_penalizada_2023', 'percent'],
]

const ATTENDANCE_EXPLANATION_METRICS = [
  ['indicador_atendimento_atual', 'decimal'],
  ['delta_atendimento', 'signedDecimal'],
  ['delta_atendimento_ajustado', 'signedDecimalOptional'],
  ['proporcao_abandono_atual', 'percent'],
  ['proporcao_sem_informacao_atual', 'percent'],
  ['estudantes_areas_prioritarias_atual', 'integer'],
]

const LEARNING_DETAIL_METRICS = [
  ['indicador_aprendizagem', 'decimal'],
  ['delta_aprendizagem', 'signedDecimal'],
  ['delta_aprendizagem_ajustado', 'signedDecimal'],
  ['iad', 'decimal'],
  ['iad_ajustado', 'decimal'],
  ['proporcao_adequada_saeb_2019', 'percent'],
  ['proporcao_adequada_saeb_2023', 'percent'],
  ['taxa_aprovacao_penalizada_2019', 'percent'],
  ['taxa_aprovacao_penalizada_2023', 'percent'],
  ['equidade_2023', 'decimal'],
]

const ATTENDANCE_DETAIL_METRICS = [
  ['indicador_atendimento_atual', 'decimal'],
  ['proporcao_abandono_atual', 'percent'],
  ['proporcao_sem_informacao_atual', 'percent'],
  ['delta_atendimento', 'signedDecimal'],
  ['delta_atendimento_ajustado', 'signedDecimal'],
  ['indicador_atendimento_anterior', 'decimal'],
  ['proporcao_abandono_anterior', 'percent'],
  ['proporcao_sem_informacao_anterior', 'percent'],
  ['estudantes_areas_prioritarias_atual', 'integer'],
  ['estudantes_areas_prioritarias_anterior', 'integer'],
]

const HISTORICAL_METRICS = [
  ['indicador_atendimento_metodologia_anterior', 'decimal'],
  ['evolucao_atendimento_metodologia_anterior', 'decimal'],
  ['coeficiente_atendimento', 'decimal'],
  ['indicador_aprendizagem_metodologia_anterior', 'decimal'],
  ['evolucao_aprendizagem_metodologia_anterior', 'decimal'],
  ['coeficiente_aprendizagem', 'decimal'],
  ['coeficiente_total', 'decimal'],
  ['apresentou_evolucao_nos_dois_indicadores', 'boolean'],
]

const GLOSSARY_ITEMS = [
  ['VAAR', 'Complementação financeira do Fundeb baseada em condicionalidades e evolução de resultados.'],
  ['Condicionalidades', 'Requisitos de gestão que habilitam o município a concorrer à complementação.'],
  ['Aprendizagem com Equidade', 'Componente que observa evolução da aprendizagem com critérios de equidade.'],
  ['Atendimento', 'Componente associado à permanência dos estudantes, abandono e completude dos registros.'],
  ['Variação', 'Diferença entre ciclos do próprio indicador do município.'],
  ['Abandono', 'Estudantes que deixaram de frequentar a escola no ano letivo; menor valor é mais favorável.'],
  ['Sem informação', 'Estudantes sem registro final de rendimento ou movimento; isso pode reduzir o indicador de atendimento.'],
  ['Coeficiente de distribuição', 'Número usado para calcular a participação do município na parcela de recursos do componente, quando elegível.'],
  ['Histórico de 2023/2024', 'Anos que seguem regras anteriores e aparecem como consulta histórica de recebimento.'],
]

function formatBoolean(value) {
  if (value === true) return 'Sim'
  if (value === false) return 'Não'
  return EM
}

function formatReceived(value) {
  if (value === true) return 'Recebeu'
  if (value === false) return 'Não recebeu'
  return EM
}

function hasNumber(value) {
  return !isMissing(value) && Number.isFinite(Number(value))
}

function hasText(value) {
  return !isMissing(value) && String(value).trim().length > 0
}

function formatMetric(value, type = 'decimal') {
  if (type === 'boolean') return formatBoolean(value)
  if (type === 'signedDecimal') return formatSignedMetric(value)
  if (type === 'signedDecimalOptional') return hasNumber(value) ? formatSignedMetric(value) : null
  if (!hasNumber(value)) return EM
  const numeric = Number(value)
  if (type === 'integer') return numeric.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
  if (type === 'percent') {
    return `${(numeric * 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`
  }
  return numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  })
}

function formatSignedMetric(value) {
  if (!hasNumber(value)) return EM
  const numeric = Number(value)
  const formatted = Math.abs(numeric).toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  })
  if (numeric > 0) return `+${formatted}`
  if (numeric < 0) return `-${formatted}`
  return formatted
}

function getComponentCount(summary) {
  return [summary?.recebe_aprendizagem, summary?.recebe_atendimento].filter(Boolean).length
}

function buildResultText(summary, year) {
  const learning = summary?.recebe_aprendizagem
  const attendance = summary?.recebe_atendimento
  if (learning === true && attendance === true) {
    return `O município recebeu os componentes de Aprendizagem com Equidade e Atendimento em ${year}.`
  }
  if (learning === true && attendance === false) {
    return `O município recebeu Aprendizagem com Equidade em ${year}, mas não recebeu Atendimento.`
  }
  if (learning === false && attendance === true) {
    return `O município recebeu Atendimento em ${year}, mas não recebeu Aprendizagem com Equidade.`
  }
  if (learning === false && attendance === false) {
    return `O município não recebeu os componentes de Aprendizagem com Equidade nem Atendimento em ${year}.`
  }
  return `Não há informação completa sobre recebimento dos componentes em ${year}.`
}

function buildSituationText(summary, year) {
  const learning = summary?.recebe_aprendizagem
  const attendance = summary?.recebe_atendimento
  if (learning === true && attendance === true) return 'Recebeu aprendizagem e atendimento'
  if (learning === true && attendance === false) return 'Recebeu apenas aprendizagem'
  if (learning === false && attendance === true) return 'Recebeu apenas atendimento'
  if (learning === false && attendance === false) return `Não recebeu componentes em ${year}`
  return 'Sem dado disponível'
}

function compareNumbers(current, previous) {
  if (!hasNumber(current) || !hasNumber(previous)) return null
  const diff = Number(current) - Number(previous)
  if (Math.abs(diff) < 0.0000001) return 'stable'
  return diff > 0 ? 'up' : 'down'
}

function getLatestRow(rows, year) {
  if (!rows.length) return {}
  return rows.find((row) => Number(row.ano_fundeb) === Number(year)) ?? rows.at(-1) ?? {}
}

function getStatusTone(value) {
  if (value === true || value === 'Recebeu') return 'positive'
  if (value === false || value === 'Não recebeu') return 'attention'
  return 'neutral'
}

function buildAttentionCards(summary, learningRow, attendanceRow, year) {
  const cards = []

  if (summary?.habilitado_condicionalidades === false) {
    cards.push({
      title: 'Condicionalidades',
      text: 'A habilitação é o primeiro ponto de atenção, pois sem essa etapa o município não recebe VAAR.',
      values: [['Habilitação', formatBoolean(summary.habilitado_condicionalidades)]],
    })
  } else if (summary?.habilitado_condicionalidades === true) {
    cards.push({
      title: 'Condicionalidades',
      text: 'O município aparece habilitado nas condicionalidades do exercício mais recente.',
      values: [['Habilitação', 'Sim']],
    })
  }

  if (summary?.recebe_aprendizagem === true && summary?.recebe_atendimento === true) {
    cards.push({
      title: 'Componentes recebidos',
      text: 'Manter a evolução dos indicadores nos próximos ciclos.',
      values: [['Componentes', '2 de 2']],
    })
  }

  if (hasNumber(learningRow.delta_aprendizagem)) {
    const delta = Number(learningRow.delta_aprendizagem)
    cards.push({
      title: 'Aprendizagem',
      text: delta > 0
        ? `Aprendizagem avançou em ${year}: ${formatSignedMetric(delta)}.`
        : delta < 0
          ? `Aprendizagem teve queda em ${year}: ${formatSignedMetric(delta)}.`
          : `Aprendizagem ficou estável em ${year}: ${formatSignedMetric(delta)}.`,
      values: [['Variação', formatSignedMetric(delta)]],
    })
  } else if (!hasNumber(learningRow.indicador_aprendizagem)) {
    cards.push({
      title: 'Aprendizagem',
      text: 'Indicador de aprendizagem não disponível na fonte para este exercício.',
      values: [['Indicador', EM]],
    })
  }

  if (hasNumber(attendanceRow.delta_atendimento)) {
    const raw = Number(attendanceRow.delta_atendimento)
    const adjusted = attendanceRow.delta_atendimento_ajustado
    const stableAdjusted = raw < 0 && hasNumber(adjusted) && Math.abs(Number(adjusted)) < 0.0000001
    cards.push({
      title: 'Atendimento',
      text: stableAdjusted
        ? 'Atendimento teve queda bruta, mas a variação ajustada ficou estável pela regra metodológica.'
        : raw > 0
          ? `Atendimento avançou no período observado: ${formatSignedMetric(raw)}.`
          : raw < 0
            ? `Atendimento teve queda no período observado: ${formatSignedMetric(raw)}.`
            : `Atendimento ficou estável no período observado: ${formatSignedMetric(raw)}.`,
      values: [
        ['Variação', formatSignedMetric(raw)],
        ...(hasNumber(adjusted) ? [['Ajustada', formatSignedMetric(adjusted)]] : []),
      ],
    })
  }

  const abandonment = compareNumbers(attendanceRow.proporcao_abandono_atual, attendanceRow.proporcao_abandono_anterior)
  if (abandonment) {
    cards.push({
      title: 'Abandono',
      text: abandonment === 'up'
        ? `Abandono aumentou de ${formatMetric(attendanceRow.proporcao_abandono_anterior, 'percent')} para ${formatMetric(attendanceRow.proporcao_abandono_atual, 'percent')}; como menor abandono é mais favorável, acompanhe permanência dos estudantes.`
        : abandonment === 'down'
          ? `Abandono reduziu de ${formatMetric(attendanceRow.proporcao_abandono_anterior, 'percent')} para ${formatMetric(attendanceRow.proporcao_abandono_atual, 'percent')}.`
          : `Abandono ficou estável em ${formatMetric(attendanceRow.proporcao_abandono_atual, 'percent')}.`,
      values: [
        ['Anterior', formatMetric(attendanceRow.proporcao_abandono_anterior, 'percent')],
        ['Atual', formatMetric(attendanceRow.proporcao_abandono_atual, 'percent')],
      ],
    })
  }

  const missingInfo = compareNumbers(attendanceRow.proporcao_sem_informacao_atual, attendanceRow.proporcao_sem_informacao_anterior)
  if (missingInfo) {
    cards.push({
      title: 'Sem informação',
      text: missingInfo === 'up'
        ? `Sem informação aumentou de ${formatMetric(attendanceRow.proporcao_sem_informacao_anterior, 'percent')} para ${formatMetric(attendanceRow.proporcao_sem_informacao_atual, 'percent')}; acompanhe a consistência dos registros.`
        : missingInfo === 'down'
          ? `Sem informação reduziu de ${formatMetric(attendanceRow.proporcao_sem_informacao_anterior, 'percent')} para ${formatMetric(attendanceRow.proporcao_sem_informacao_atual, 'percent')}; isso favorece a consistência dos registros.`
          : `Sem informação ficou estável em ${formatMetric(attendanceRow.proporcao_sem_informacao_atual, 'percent')}.`,
      values: [
        ['Anterior', formatMetric(attendanceRow.proporcao_sem_informacao_anterior, 'percent')],
        ['Atual', formatMetric(attendanceRow.proporcao_sem_informacao_atual, 'percent')],
      ],
    })
  }

  if (!cards.length) {
    cards.push({
      title: `Leitura do ciclo ${year}`,
      text: 'Acompanhar os componentes do próprio município com os registros disponíveis na fonte.',
      values: [['Exercício', year]],
    })
  }

  return cards.slice(0, 5)
}

function FieldLabel({ field }) {
  const help = FIELD_HELP[field]
  const label = help?.label ?? field
  return (
    <span className="vaar-field-label">
      <span>{label}</span>
      {help?.short ? (
        <span
          aria-label={`${label}: ${help.short}`}
          className="vaar-help"
          data-help={help.short}
          role="img"
          tabIndex="0"
          title={help.short}
        >
          i
        </span>
      ) : null}
    </span>
  )
}

function VaarStatusPill({ value }) {
  return <span className={`vaar-status-chip is-${getStatusTone(value)}`}>{formatReceived(value)}</span>
}

function VaarResultMetric({ label, value, note }) {
  return (
    <article className="vaar-result-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  )
}

function VaarWhatIs() {
  const keyPoints = [
    ['Condicionalidades de gestão', 'Requisitos administrativos que habilitam a rede a concorrer à complementação.'],
    ['Aprendizagem com Equidade', 'Componente que observa evolução da aprendizagem considerando critérios de equidade.'],
    ['Atendimento e permanência', 'Componente ligado à permanência dos estudantes e à qualidade dos registros.'],
  ]

  return (
    <section className="page-card vaar-intro vaar-what-is" aria-labelledby="vaar-what-is-title">
      <div className="vaar-what-is__header">
        <span className="eyebrow">Complementação VAAR</span>
        <h2 id="vaar-what-is-title">O que é o VAAR</h2>
        <p>
          VAAR é uma complementação da União ao Fundeb voltada a redes públicas que cumprem condicionalidades de gestão e apresentam evolução em indicadores educacionais. A sigla se refere ao Valor Aluno Ano Resultado, uma parcela vinculada a resultados de atendimento e aprendizagem.
        </p>
      </div>
      <div className="vaar-what-is__cards" aria-label="Pontos-chave do VAAR">
        {keyPoints.map(([title, text]) => (
          <article className="vaar-what-is-card" key={title}>
            <strong>{title}</strong>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function MetricList({ row, metrics }) {
  return (
    <dl className="vaar-metric-list">
      {metrics.map(([key, type]) => {
        const formatted = formatMetric(row?.[key], type)
        if (formatted === null) return null
        return (
          <div className="vaar-metric-row" key={key}>
            <dt><FieldLabel field={key} /></dt>
            <dd>{formatted}</dd>
          </div>
        )
      })}
    </dl>
  )
}

function VaarResult2026({ summary, lastYear }) {
  const componentCount = getComponentCount(summary)
  const situation = buildSituationText(summary, lastYear ?? EM)
  return (
    <section className="page-card vaar-executive-result" aria-labelledby="vaar-result-title">
      <div className="vaar-executive-result__header">
        <div>
          <span className="eyebrow">Exercício financeiro</span>
          <h2 id="vaar-result-title">Resultado VAAR {lastYear ?? EM}</h2>
          <p>Síntese do recebimento da complementação VAAR no exercício.</p>
        </div>
        <span className="vaar-component-count">{componentCount} de 2 componentes</span>
      </div>
      <p className="vaar-executive-result__reading">{buildResultText(summary, lastYear ?? EM)}</p>
      <p className="vaar-executive-result__rule">
        O recebimento depende primeiro da habilitação nas condicionalidades e depois da regra de evolução em cada componente.
      </p>
      <div className="vaar-result-summary">
        <article className="vaar-result-hero">
          <span>Recebimento em 2026</span>
          <strong>{situation}</strong>
          <small>Síntese administrativa do exercício financeiro.</small>
        </article>
        <div className="vaar-result-metrics">
          <VaarResultMetric label="Habilitação" value={formatBoolean(summary.habilitado_condicionalidades)} note="Condicionalidades" />
          <VaarResultMetric label="Aprendizagem com Equidade" value={formatReceived(summary.recebe_aprendizagem)} note="Componente" />
          <VaarResultMetric label="Atendimento" value={formatReceived(summary.recebe_atendimento)} note="Componente" />
          <VaarResultMetric label="Coeficiente de distribuição total" value={formatMetric(summary.coeficiente_total)} note="Distribuição" />
        </div>
      </div>
    </section>
  )
}

function VaarExplanation2026({ summary, learningRow, attendanceRow, lastYear }) {
  return (
    <section className="page-card vaar-section" aria-labelledby="vaar-explain-title">
      <div className="vaar-section__heading">
        <div>
          <span className="eyebrow">Componentes do resultado</span>
          <h3 id="vaar-explain-title">O que explica o resultado de {lastYear ?? EM}</h3>
        </div>
        <p>Os dois componentes representam Aprendizagem com Equidade e Atendimento.</p>
      </div>
      <div className="vaar-explain-grid">
        <article className="vaar-component-card">
          <div className="vaar-component-card__header">
            <h4>Aprendizagem com Equidade</h4>
            <VaarStatusPill value={summary.recebe_aprendizagem} />
          </div>
          <p>Combina aprendizagem, avanço, aprovação, participação no Saeb e equidade em uma leitura composta.</p>
          <MetricList row={learningRow} metrics={LEARNING_EXPLANATION_METRICS} />
        </article>
        <article className="vaar-component-card">
          <div className="vaar-component-card__header">
            <h4>Atendimento</h4>
            <VaarStatusPill value={summary.recebe_atendimento} />
          </div>
          <p>Esse componente observa permanência dos estudantes. Abandono e ausência de informação são pontos de atenção.</p>
          <MetricList row={attendanceRow} metrics={ATTENDANCE_EXPLANATION_METRICS} />
        </article>
      </div>
      {(hasText(summary?.motivo_aprendizagem) || hasText(summary?.motivo_atendimento)) ? (
        <div className="vaar-reading__notes">
          {hasText(summary.motivo_aprendizagem) ? <small><strong>Aprendizagem:</strong> {summary.motivo_aprendizagem}</small> : null}
          {hasText(summary.motivo_atendimento) ? <small><strong>Atendimento:</strong> {summary.motivo_atendimento}</small> : null}
        </div>
      ) : null}
    </section>
  )
}

function VaarAttention({ cards }) {
  return (
    <section className="page-card vaar-section" aria-labelledby="vaar-attention-title">
      <div className="vaar-section__heading">
        <div>
          <span className="eyebrow">Pontos de atenção</span>
          <h3 id="vaar-attention-title">Pontos de atenção do município</h3>
        </div>
        <p>Leituras geradas somente com dados do próprio município.</p>
      </div>
      <div className="vaar-attention-grid">
        {cards.map((card) => (
          <article className="vaar-insight-card" key={`${card.title}-${card.text}`}>
            <strong>{card.title}</strong>
            <p>{card.text}</p>
            <dl className="vaar-insight-values">
              {card.values.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}

function VaarHistory({ history, lastYear }) {
  if (!history.length) return null
  const orderedHistory = [...history].sort((a, b) => Number(b.ano_fundeb) - Number(a.ano_fundeb))
  return (
    <section className="page-card vaar-section" aria-labelledby="vaar-history-title">
      <div className="vaar-section__heading">
        <div>
          <span className="eyebrow">Histórico</span>
          <h3 id="vaar-history-title">Histórico de recebimento VAAR</h3>
        </div>
        <p>Anos anteriores ajudam a consultar o histórico do município.</p>
      </div>
      <p className="vaar-subtle-note">2023 e 2024 seguem regras anteriores e aparecem como histórico de recebimento.</p>
      <div className="vaar-history-grid">
        {orderedHistory.map((row) => {
          const isLatest = Number(row.ano_fundeb) === Number(lastYear)
          const isHistorical = Number(row.ano_fundeb) <= 2024
          return (
            <article className={`vaar-history-card${isLatest ? ' is-latest' : ''}`} key={row.ano_fundeb}>
              <div className="vaar-history-card__top">
                <strong>{row.ano_fundeb ?? EM}</strong>
                {isLatest ? <span className="vaar-latest-chip">mais recente</span> : null}
                {!isLatest && isHistorical ? <span className="vaar-history-chip">histórico</span> : null}
              </div>
              <dl>
                <div>
                  <dt>Aprendizagem</dt>
                  <dd>{formatBoolean(row.recebe_aprendizagem)}</dd>
                </div>
                <div>
                  <dt>Atendimento</dt>
                  <dd>{formatBoolean(row.recebe_atendimento)}</dd>
                </div>
                {!isMissing(row.coeficiente_total) ? (
                  <div>
                    <dt>Coeficiente total</dt>
                    <dd>{formatMetric(row.coeficiente_total)}</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function TechnicalDetails({ title, rows, metrics, emptyText }) {
  return (
    <details className="page-card vaar-detail-toggle vaar-technical-details">
      <summary>{title}</summary>
      {rows.length ? (
        <div className="vaar-year-grid">
          {rows.map((row) => (
            <article className="vaar-year-card" key={row.ano_fundeb}>
              <div className="vaar-year-card__header">
                <span>Exercício financeiro</span>
                <strong>{row.ano_fundeb ?? EM}</strong>
              </div>
              <MetricList row={row} metrics={metrics} />
            </article>
          ))}
        </div>
      ) : (
        <p className="vaar-empty-detail">{emptyText}</p>
      )}
    </details>
  )
}

function VaarHistoricalDetails({ rows, availableYears }) {
  const missingYears = [2023, 2024].filter((year) => !availableYears.includes(year))
  return (
    <details className="page-card vaar-detail-toggle vaar-technical-details">
      <summary>Consultar dados históricos de 2023/2024</summary>
      {rows.length ? (
        <div className="vaar-year-grid">
          {rows.map((row) => (
            <article className="vaar-year-card" key={row.ano_fundeb}>
              <div className="vaar-year-card__header">
                <span>Exercício financeiro</span>
                <strong>{row.ano_fundeb ?? EM}</strong>
              </div>
              <MetricList row={row} metrics={HISTORICAL_METRICS} />
            </article>
          ))}
        </div>
      ) : null}
      <div className="vaar-reading__notes">
        {missingYears.length ? (
          <small>Anos ausentes não significam "não recebeu"; indicam ausência de registro na fonte carregada para {missingYears.join(' e ')}.</small>
        ) : null}
        <small>Os dados de 2023/2024 aparecem como consulta histórica do município.</small>
      </div>
    </details>
  )
}

function VaarGlossary() {
  return (
    <details className="page-card vaar-detail-toggle vaar-technical-details">
      <summary>Glossário e metodologia</summary>
      <div className="vaar-glossary">
        {GLOSSARY_ITEMS.map(([title, text]) => (
          <article className="vaar-glossary-card" key={title}>
            <strong>{title}</strong>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </details>
  )
}

export function VaarPanel({ vaarData }) {
  const data = vaarData ?? {}
  const summary = data.resumo_ultimo_ano ?? {}
  const history = Array.isArray(data.historico_recebimento) && data.historico_recebimento.length
    ? data.historico_recebimento
    : Array.isArray(data.historico) ? data.historico : []
  const learning = Array.isArray(data.aprendizagem) ? data.aprendizagem.filter((row) => row.metodologia_vaar !== 'metodologia_anterior') : []
  const attendance = Array.isArray(data.atendimento) ? data.atendimento.filter((row) => row.metodologia_vaar !== 'metodologia_anterior') : []
  const historicalRows = Array.isArray(data.metodologia_anterior) ? data.metodologia_anterior : []
  const availableYears = Array.isArray(data.anos_disponiveis) ? data.anos_disponiveis.map(Number) : history.map((row) => Number(row.ano_fundeb))
  const lastYear = data.ultimo_ano ?? summary.ano_fundeb ?? null
  const latestLearning = getLatestRow(learning, lastYear)
  const latestAttendance = getLatestRow(attendance, lastYear)
  const attentionCards = buildAttentionCards(summary, latestLearning, latestAttendance, lastYear ?? EM)
  const hasData = history.length > 0 || learning.length > 0 || attendance.length > 0 || historicalRows.length > 0

  if (!hasData) {
    return (
      <div className="vaar-panel">
        <div className="vaar-empty">
          <p>Dados da complementação VAAR não disponíveis para este município.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="vaar-panel">
      <VaarWhatIs />
      <VaarResult2026 summary={summary} lastYear={lastYear} />
      <VaarExplanation2026 summary={summary} learningRow={latestLearning} attendanceRow={latestAttendance} lastYear={lastYear} />
      <VaarAttention cards={attentionCards} />
      <VaarHistory history={history} lastYear={lastYear} />

      <TechnicalDetails
        title="Ver detalhes de Aprendizagem"
        rows={learning}
        metrics={LEARNING_DETAIL_METRICS}
        emptyText="Detalhes de aprendizagem não disponíveis para este município."
      />
      <TechnicalDetails
        title="Ver detalhes de Atendimento"
        rows={attendance}
        metrics={ATTENDANCE_DETAIL_METRICS}
        emptyText="Detalhes de atendimento não disponíveis para este município."
      />
      <VaarHistoricalDetails rows={historicalRows} availableYears={availableYears} />
      <VaarGlossary />

      <p className="vaar-source">Fonte: {data.fonte || 'VAAR/FUNDEB'}.</p>
    </div>
  )
}
