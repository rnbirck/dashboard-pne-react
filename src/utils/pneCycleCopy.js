const CLOSED_CYCLE = 'pne_2014_2024'

const CLOSED_CYCLE_COPY = {
  detailEyebrow: 'Indicador selecionado · ciclo encerrado',
  emptyResult: 'Sem dados suficientes para conclusão neste município no ciclo encerrado.',
  eyebrow: 'Ciclo encerrado · resultado consolidado',
  gridCountLabel: 'indicadores com resultado consolidado',
  progressLabel: 'Resultado consolidado da meta',
  status: {
    achieved: 'Meta atingida',
    below: 'Meta não atingida',
    missing: 'Sem dados suficientes para conclusão',
  },
  summary: {
    achievedLabel: 'Metas atingidas',
    belowLabel: 'Metas não atingidas',
    detailLabel: 'dentro dos indicadores com resultado conclusivo',
    emptyDetail: 'sem resultados conclusivos',
    totalDetail: 'resultados consolidados exibidos para o município',
    totalLabel: 'Indicadores com resultado conclusivo',
  },
  supportText: 'Resultados observados ao final do período de referência do PNE 2014–2024.',
  valueLabel: (year) => `Resultado final (${year})`,
}

const CURRENT_CYCLE_COPY = {
  detailEyebrow: 'Indicador selecionado · ciclo vigente',
  emptyResult: 'Sem leitura disponível para este município no ciclo vigente.',
  eyebrow: 'Ciclo vigente · acompanhamento atual',
  gridCountLabel: 'indicadores com acompanhamento atual',
  progressLabel: 'Acompanhamento atual da meta',
  status: {
    achieved: 'Atinge a meta no momento',
    below: 'Ainda não atinge a meta',
    missing: 'Sem leitura disponível',
  },
  summary: {
    achievedLabel: 'Atingem a referência no momento',
    belowLabel: 'Ainda não atingem a referência',
    detailLabel: 'dentro dos indicadores com leitura atual',
    emptyDetail: 'sem leitura atual disponível',
    totalDetail: 'leituras atuais exibidas para o município',
    totalLabel: 'Indicadores com leitura atual',
  },
  supportText: 'Situação observada até o ano mais recente disponível. Esta leitura não representa uma previsão de cumprimento em 2036.',
  valueLabel: (year) => `Valor mais recente (${year})`,
}

export function getPneCycleCopy(cycle) {
  return cycle === CLOSED_CYCLE ? CLOSED_CYCLE_COPY : CURRENT_CYCLE_COPY
}

export function isClosedPneCycle(cycle) {
  return cycle === CLOSED_CYCLE
}
