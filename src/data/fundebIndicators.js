export const FUNDEB_INDICATORS = [
  {
    key: 'receitas',
    label: 'Receitas do FUNDEB',
    tipo: 'financeiro',
    description: 'Total de recursos do FUNDEB registrados para o município no ano.',
  },
  {
    key: 'despesa_remuneracao_profissionais',
    label: 'Remuneração dos profissionais',
    tipo: 'financeiro',
    description: 'Valor aplicado na remuneração dos profissionais da educação básica com recursos do FUNDEB.',
  },
  {
    key: 'despesa_remuneracao_profissionais_ensino_fundamental',
    label: 'Remuneração no ensino fundamental',
    tipo: 'financeiro',
    description: 'Parte da remuneração dos profissionais vinculada ao ensino fundamental.',
  },
  {
    key: 'despesa_remuneracao_profissionais_ensino_infantil',
    label: 'Remuneração na educação infantil',
    tipo: 'financeiro',
    description: 'Parte da remuneração dos profissionais vinculada à educação infantil.',
  },
  {
    key: 'despesa_remuneracao_profissionais_creche',
    label: 'Remuneração em creche',
    tipo: 'financeiro',
    description: 'Valor aplicado na remuneração dos profissionais que atuam em creche. Para este indicador, a série deve ser lida a partir de 2021.',
  },
  {
    key: 'despesa_remuneracao_profissionais_pre_escola',
    label: 'Remuneração na pré-escola',
    tipo: 'financeiro',
    description: 'Valor aplicado na remuneração dos profissionais que atuam na pré-escola. Para este indicador, a série deve ser lida a partir de 2021.',
  },
  {
    key: 'despesa_total_fundeb',
    label: 'Despesa total do FUNDEB',
    tipo: 'financeiro',
    description: 'Total de despesas realizadas com recursos do FUNDEB no ano.',
  },
  {
    key: 'percentual_minimo_remuneracao_profissionais',
    label: 'Percentual aplicado em remuneração',
    tipo: 'percentual',
    description: 'Percentual dos recursos do FUNDEB aplicado na remuneração dos profissionais da educação. Até 2020, o mínimo era 60%; desde 2021, passou a ser 70%.',
  },
  {
    key: 'disponibilidade_financeira_ano_anterior',
    label: 'Saldo do ano anterior',
    tipo: 'financeiro',
    description: 'Saldo financeiro de recursos do FUNDEB vindo do exercício anterior.',
  },
  {
    key: 'ingresso_recursos_ate_bimestre',
    label: 'Recursos recebidos no ano',
    tipo: 'financeiro',
    description: 'Total de recursos do FUNDEB recebidos pelo município ao longo do ano.',
  },
  {
    key: 'pagamentos_efetuados_ate_bimestre',
    label: 'Pagamentos efetuados no ano',
    tipo: 'financeiro',
    description: 'Total de pagamentos realizados com recursos do FUNDEB ao longo do ano.',
  },
  {
    key: 'disponibilidade_financeira_ate_bimestre',
    label: 'Disponibilidade financeira no fim do ano',
    tipo: 'financeiro',
    description: 'Valor financeiro disponível ao final do período analisado, após os ingressos e pagamentos registrados.',
  },
  {
    key: 'saldo_financeiro_conciliado',
    label: 'Saldo financeiro conciliado',
    tipo: 'financeiro',
    description: 'Saldo financeiro conciliado informado no demonstrativo do FUNDEB.',
  },
]

export function formatFundebValue(value, tipo) {
  if (value === null || value === undefined) return '—'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  if (tipo === 'percentual') {
    return `${Math.round(numeric).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`
  }
  return numeric.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  })
}

export function getLimiteReferencia(ano) {
  return ano <= 2020 ? 60 : 70
}

export function getEstruturaVersaoLabel(versao) {
  if (!versao) return '—'
  if (versao === 'fundeb_antigo_60pct') return 'FUNDEB antigo (até 2020, mínimo de 60%)'
  if (versao === 'fundeb_transicao_2021_2022') return 'FUNDEB em transição (2021–2022, mínimo de 70%)'
  if (versao === 'fundeb_atual_2023_2025') return 'FUNDEB atual (a partir de 2023, mínimo de 70%)'
  if (versao === 'fundeb_novo_70pct') return 'FUNDEB novo (mínimo de 70%)'
  return versao.replace(/^fundeb_/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
