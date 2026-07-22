export const PNATE_INDICATORS = [
  {
    key: 'repasse_total',
    label: 'Valor informado pelo PNATE no exercício',
    tipo: 'financeiro',
    description: 'Valor anual informado pelo PNATE para o município.',
  },
  {
    key: 'repasse_autorizado_apos_desconto',
    label: 'Repasse autorizado após desconto',
    tipo: 'financeiro',
    description: 'Valor do repasse após descontos e regras de autorização informadas pelo FNDE.',
  },
  {
    key: 'resultado_per_capita',
    label: 'Parâmetro per capita',
    tipo: 'financeiro',
    description: 'Resultado per capita usado no cálculo do atendimento do PNATE.',
  },
  {
    key: 'total_alunos',
    label: 'Estudantes atendidos',
    tipo: 'numero',
    description: 'Total de estudantes considerados no cálculo do PNATE.',
  },
  {
    key: 'total_alunos_rede_municipal',
    label: 'Estudantes da rede municipal',
    tipo: 'numero',
    description: 'Total de estudantes da rede municipal considerados no PNATE.',
  },
  {
    key: 'total_alunos_rede_estadual',
    label: 'Estudantes da rede estadual',
    tipo: 'numero',
    description: 'Total de estudantes da rede estadual considerados no PNATE.',
  },
  {
    key: 'desconto',
    label: 'Desconto',
    tipo: 'financeiro',
    description: 'Valor descontado do repasse no exercício.',
  },
  {
    key: 'saldo_desconsiderado',
    label: 'Saldo desconsiderado',
    tipo: 'financeiro',
    description: 'Saldo informado pela fonte que foi desconsiderado no cálculo do repasse.',
  },
  {
    key: 'valor_total_municipal',
    label: 'Valor total municipal',
    tipo: 'financeiro',
    description: 'Valor direcionado à rede municipal quando disponível no leiaute da fonte.',
  },
  {
    key: 'valor_total_estadual',
    label: 'Valor total estadual',
    tipo: 'financeiro',
    description: 'Valor direcionado à rede estadual/SEDUC quando disponível no leiaute da fonte.',
  },
]

export function formatPnateValue(value, tipo) {
  if (value === null || value === undefined) return '—'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  if (tipo === 'numero') {
    return numeric.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
  }
  return numeric.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  })
}
