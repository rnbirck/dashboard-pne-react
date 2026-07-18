import type { Fixture } from '../types'

export interface YearValue {
  ano: number
  valor: number | null
}

export interface EducationIndicatorFixture {
  [property: string]: unknown
  cardVariant?: string
  categoryLabel: string
  chartColor: string
  currentDisplay: string
  currentValue: number | null
  currentYear: number | null
  description: string
  explore: readonly unknown[]
  formatType: string
  formatValue: (value: number) => string
  initialDisplay: string
  initialValue: number | null
  initialYear: number | null
  key: string
  label: string
  mainCutLabel: string
  quickReading: string
  scaleType: string
  series: readonly YearValue[]
  showPointLabels: boolean
  source: string
  statusLabel: string
  statusTone: string
  themeLabel: string
  themeShortLabel: string
  unit: string
  variationDisplay: string
  variationRaw: number | null
  variationTone: string
}

export interface FinancialIndicatorFixture {
  cardDescription: string
  currentDisplay: string
  currentDisplayCompact?: string
  currentYear: number | null
  groupLabel: string
  label: string
  moduleLabel: string
  series: readonly YearValue[]
  statusLabel: string
  statusTone: string
  unitLabel: string
  variationDisplay: string | null
  variationLabel: string
  initialYear: number | null
}

export interface PneItemFixture {
  key: string
  label: string
  metaRef: string
  value_mode: 'percent'
}

export interface PneResultFixture {
  atingida?: boolean
  available: boolean
  direction?: string
  display: {
    distance?: string
    status: string
    variation?: string
  }
  distance?: number
  end_value?: number
  meta?: number
  series: readonly YearValue[]
  start_value?: number
  tracks_goal?: boolean
  trend?: {
    end_year: number
    start_year: number
    status: 'down' | 'stable' | 'up'
  }
}

export interface ProjectionFixture {
  available: boolean
  historical_percent: readonly number[]
  historical_population: readonly number[]
  historical_years: readonly number[]
  projected_2036: number
  projected_percent: readonly number[]
  quality: string
  warnings: readonly string[]
  years: readonly number[]
}

const formatPercent = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const formatNumber = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })

function educationIndicator(overrides: Partial<EducationIndicatorFixture> = {}): EducationIndicatorFixture {
  return {
    categoryLabel: 'Atendimento e oferta',
    chartColor: 'var(--chart-series-1)',
    currentDisplay: '94,8%',
    currentValue: 94.8,
    currentYear: 2024,
    description: 'Percentual de estudantes atendidos no recorte principal do município.',
    explore: [],
    formatType: 'percent',
    formatValue: formatPercent,
    initialDisplay: '89,6%',
    initialValue: 89.6,
    initialYear: 2020,
    key: 'atendimento-fixture',
    label: 'Taxa de atendimento escolar',
    mainCutLabel: 'Total do município',
    quickReading: 'O atendimento cresceu no período observado, preservando margem para acompanhamento.',
    scaleType: 'percent',
    series: [
      { ano: 2020, valor: 89.6 },
      { ano: 2021, valor: 91.2 },
      { ano: 2022, valor: 92.7 },
      { ano: 2023, valor: 93.4 },
      { ano: 2024, valor: 94.8 },
    ],
    showPointLabels: true,
    source: 'INEP Censo Escolar · fixture determinística do catálogo',
    statusLabel: 'Com dados',
    statusTone: 'success',
    themeLabel: 'Matrículas e atendimento',
    themeShortLabel: 'Atendimento',
    unit: 'percentual',
    variationDisplay: '+5,2 p.p.',
    variationRaw: 5.2,
    variationTone: 'positive',
    ...overrides,
  }
}

export const educationIndicators: readonly Fixture<EducationIndicatorFixture>[] = [
  { id: 'education-common', description: 'Valor comum com série completa.', value: educationIndicator() },
  {
    id: 'education-zero',
    description: 'Zero preservado como valor válido.',
    value: educationIndicator({
      currentDisplay: '0%',
      currentValue: 0,
      initialDisplay: '3,4%',
      initialValue: 3.4,
      key: 'abandono-zero',
      label: 'Taxa de abandono no recorte observado',
      series: [{ ano: 2022, valor: 3.4 }, { ano: 2023, valor: 1.2 }, { ano: 2024, valor: 0 }],
      variationDisplay: '-3,4 p.p.',
      variationRaw: -3.4,
      variationTone: 'negative',
    }),
  },
  {
    id: 'education-missing',
    description: 'Ausência não convertida em zero.',
    value: educationIndicator({
      currentDisplay: '—',
      currentValue: null,
      currentYear: null,
      initialDisplay: '—',
      initialValue: null,
      initialYear: null,
      key: 'education-missing',
      label: 'Indicador sem leitura municipal disponível',
      series: [],
      statusLabel: 'Sem dados',
      statusTone: 'muted',
      variationDisplay: '—',
      variationRaw: null,
      variationTone: 'default',
    }),
  },
  {
    id: 'education-large',
    description: 'Valor e título extensos.',
    value: educationIndicator({
      currentDisplay: '12.345.678',
      currentValue: 12345678,
      currentYear: 2024,
      description: 'Quantidade total em uma unidade extensa que testa quebra de linha e preservação de hierarquia.',
      formatType: 'number',
      formatValue: formatNumber,
      initialDisplay: '10.020.300',
      initialValue: 10020300,
      key: 'education-large',
      label: 'Quantidade total de matrículas em todas as etapas, modalidades e dependências administrativas',
      series: [{ ano: 2022, valor: 10020300 }, { ano: 2023, valor: 11200000 }, { ano: 2024, valor: 12345678 }],
      unit: 'matrículas registradas no período de referência',
      variationDisplay: '+2.325.378 matrículas',
      variationRaw: 2325378,
    }),
  },
]

function financialIndicator(moduleLabel: string, overrides: Partial<FinancialIndicatorFixture> = {}): FinancialIndicatorFixture {
  return {
    cardDescription: 'Indicador financeiro com leitura controlada para inspeção de valor, ano e variação.',
    currentDisplay: 'R$ 18.450.320,75',
    currentDisplayCompact: 'R$ 18,5 mi',
    currentYear: 2024,
    groupLabel: 'Execução e disponibilidade',
    initialYear: 2021,
    label: `Receita acompanhada no ${moduleLabel}`,
    moduleLabel,
    series: [{ ano: 2021, valor: 14.2 }, { ano: 2022, valor: 15.8 }, { ano: 2023, valor: 17.1 }, { ano: 2024, valor: 18.5 }],
    statusLabel: 'Com dados',
    statusTone: 'success',
    unitLabel: 'Reais correntes',
    variationDisplay: '+30,3%',
    variationLabel: 'Variação desde 2021',
    ...overrides,
  }
}

export const financialIndicators: readonly Fixture<FinancialIndicatorFixture>[] = [
  { id: 'fundeb', description: 'Card real do FUNDEB.', value: financialIndicator('FUNDEB') },
  {
    id: 'vaar',
    description: 'Card real do VAAR com valor zero.',
    value: financialIndicator('VAAR', {
      currentDisplay: 'R$ 0,00',
      currentDisplayCompact: 'R$ 0',
      label: 'Complementação VAAR recebida',
      series: [{ ano: 2023, valor: 0 }, { ano: 2024, valor: 0 }],
      variationDisplay: '0,0%',
      variationLabel: 'Variação anual',
    }),
  },
  {
    id: 'siope',
    description: 'Card real do SIOPE com queda.',
    value: financialIndicator('SIOPE', {
      currentDisplay: '24,7%',
      currentDisplayCompact: '24,7%',
      label: 'Aplicação em manutenção e desenvolvimento do ensino',
      series: [{ ano: 2021, valor: 27.4 }, { ano: 2022, valor: 26.8 }, { ano: 2023, valor: 25.2 }, { ano: 2024, valor: 24.7 }],
      unitLabel: 'Percentual da receita de impostos',
      variationDisplay: '-2,7 p.p.',
    }),
  },
  {
    id: 'pnate',
    description: 'Card real do PNATE sem comparação.',
    value: financialIndicator('PNATE', {
      currentDisplay: '—',
      currentDisplayCompact: '—',
      currentYear: null,
      initialYear: null,
      label: 'Execução dos recursos transferidos para transporte escolar',
      series: [],
      statusLabel: 'Sem dados',
      statusTone: 'muted',
      variationDisplay: null,
    }),
  },
]

export const pneItems: readonly Fixture<{ cycle: 'pne_2014_2024' | 'pne_2026_2036'; item: PneItemFixture; result: PneResultFixture }>[] = [
  {
    id: 'pne-2014',
    description: 'Ciclo encerrado com meta não atingida.',
    value: {
      cycle: 'pne_2014_2024',
      item: { key: 'meta-1a', label: 'Universalizar o atendimento escolar da população de 4 a 5 anos', metaRef: '1A', value_mode: 'percent' },
      result: {
        atingida: false,
        available: true,
        direction: 'at_least',
        display: { distance: '-5,2 p.p.', status: 'Abaixo da meta', variation: '+4,8 p.p.' },
        distance: -5.2,
        end_value: 94.8,
        meta: 100,
        series: [{ ano: 2014, valor: 90 }, { ano: 2019, valor: 92.5 }, { ano: 2024, valor: 94.8 }],
        start_value: 90,
        tracks_goal: true,
      },
    },
  },
  {
    id: 'pne-2026',
    description: 'Ciclo vigente com tendência positiva.',
    value: {
      cycle: 'pne_2026_2036',
      item: { key: 'meta-2a', label: 'Garantir trajetória escolar regular com equidade e permanência', metaRef: '2A', value_mode: 'percent' },
      result: {
        atingida: false,
        available: true,
        direction: 'at_least',
        display: { distance: '-8,1 p.p.', status: 'Em acompanhamento', variation: '+3,4 p.p.' },
        distance: -8.1,
        end_value: 91.9,
        meta: 100,
        series: [{ ano: 2021, valor: 88.5 }, { ano: 2022, valor: 89.7 }, { ano: 2023, valor: 90.8 }, { ano: 2024, valor: 91.9 }],
        start_value: 88.5,
        tracks_goal: true,
        trend: { start_year: 2021, end_year: 2024, status: 'up' },
      },
    },
  },
]

const completeProjection: ProjectionFixture = {
  available: true,
  historical_percent: [71.2, 73.5, 75.1, 76.8, 78.4],
  historical_population: [4260, 4210, 4180, 4130, 4090],
  historical_years: [2020, 2021, 2022, 2023, 2024],
  projected_2036: 88.6,
  projected_percent: [80.2, 82.1, 84.3, 86.5, 88.6],
  quality: 'media',
  warnings: ['Cenário sensível à variação anual das matrículas e da população de referência.'],
  years: [2026, 2028, 2030, 2033, 2036],
}

export const educationMunicipioFixture = {
  educacao: {
    atendimento_cenarios: {
      contractVersion: 'education-attendance-v2',
      municipality: 'Município de referência',
      ageCoverage: Object.fromEntries([
        ['creche', 'Atendimento em creche', '0 a 3 anos', 78.4],
        ['pre_escola', 'Atendimento na pré-escola', '4 a 5 anos', 104.2],
        ['basico_6_17', 'Atendimento na educação básica', '6 a 17 anos', 97.2],
        ['basico_15_17', 'Atendimento de adolescentes', '15 a 17 anos', 89.4],
        ['infantil_0_5', 'Atendimento da educação infantil', '0 a 5 anos', 87.3],
        ['obrigatoria_4_17', 'Atendimento na escolaridade obrigatória', '4 a 17 anos', 98.1],
        ['escolar_6_14', 'Atendimento escolar', '6 a 14 anos', 99.5],
      ].map(([key, title, ageRange, value]) => [key, {
        contractVersion: 'education-attendance-v2',
        indicatorKey: key,
        kind: 'age_coverage',
        title,
        ageRange,
        territorialBasis: { numerator: 'município da escola', denominator: 'população residente municipal' },
        fields: { numerator: `mat_${key}`, denominator: `pop_${key}` },
        observed: { year: 2025, numerator: 3210, denominator: 4090, rawValue: value },
        historical: [
          { year: 2022, numerator: 3100, denominator: 4180, rawValue: Number(value) - 3 },
          { year: 2023, numerator: 3160, denominator: 4130, rawValue: Number(value) - 1.5 },
          { year: 2025, numerator: 3210, denominator: 4090, rawValue: value },
        ],
        reference: ['creche', 'pre_escola', 'basico_6_17', 'basico_15_17'].includes(String(key))
          ? { value: key === 'creche' ? 60 : key === 'basico_15_17' ? 85 : 100, unit: 'percent', validationStatus: 'configured_unvalidated', year: 2036, direction: 'at_least' }
          : null,
        populationModel: { status: 'modeled', baseYear: 2025, horizonYear: 2036, baseValue: 4090, modeledValue: 3680, changeAbsolute: -410, changePercent: -10, method: 'municipal_base_scaled_by_rs_age_group_change', label: 'População municipal modelada para 2036' },
        scenario: { type: 'trend_scenario', method: 'fixture', status: 'available', projected: [{ year: 2026, numerator: 3220, denominator: 4050, rawValue: Number(value) + 1 }, { year: 2036, numerator: 3300, denominator: 3680, rawValue: Number(value) + 8 }] },
        diagnostics: { invalidDenominator: false, smallDenominator: false, smallDenominatorThreshold: 500, above100: Number(value) > 100, warnings: Number(value) > 100 ? ['O valor acima de 100% é preservado: matrículas e população usam bases territoriais distintas.'] : [] },
        presentation: { headline: `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%`, statusLabel: Number(value) > 100 ? 'Acima de 100% — bases territoriais distintas' : 'Dado disponível', insightLines: [`O indicador compara matrículas com a população residente de ${ageRange}.`] },
      }])),
      integral: {
        overall: {
          contractVersion: 'education-attendance-v2', indicatorKey: 'basico_integral', kind: 'integral_coverage', title: 'Participação da educação básica em tempo integral', territorialBasis: { numerator: 'município da escola', denominator: 'município da escola' }, fields: { numerator: 'mat_basico_integral', denominator: 'mat_basico' }, observed: { year: 2025, numerator: 2300, denominator: 9000, rawValue: 25.6 }, historical: [{ year: 2022, numerator: 1800, denominator: 9200, rawValue: 19.6 }, { year: 2025, numerator: 2300, denominator: 9000, rawValue: 25.6 }], reference: { targets: [{ year: 2031, value: 35, type: 'configured_reference' }, { year: 2036, value: 50, type: 'configured_reference' }], validationStatus: 'configured_unvalidated' }, scenario: { type: 'pne_reference_trajectory', method: 'configured_pne_reference_trajectory', status: 'available', projected: [{ year: 2031, numerator: null, denominator: null, rawValue: 35, displayValue: 35 }, { year: 2036, numerator: null, denominator: null, rawValue: 50, displayValue: 50 }] }, diagnostics: { invalidDenominator: false, smallDenominator: false, smallDenominatorThreshold: 1000, above100: false, warnings: [] }, presentation: { headline: '25,6%', statusLabel: 'Dado disponível', insightLines: ['Rede pública.'] },
        },
      },
    },
  },
  pne_2026_2036: {
    projecoes: {
      creche: completeProjection,
      pre_escola: { ...completeProjection, projected_2036: 96.4, warnings: [] },
      basico_6_17: { ...completeProjection, historical_percent: [96.1, 96.8, 97.2], historical_population: [11800, 11690, 11580], historical_years: [2022, 2023, 2024] },
      basico_15_17: { ...completeProjection, historical_percent: [], historical_population: [], historical_years: [], projected_percent: [], years: [], available: false },
    },
  },
}

export const educationMunicipioWithoutProjectionsFixture = {
  educacao: {
    atendimento_cenarios: {
      ageCoverage: {},
      contractVersion: 'education-attendance-v2',
      integral: { overall: null },
      municipality: 'Município sem projeções publicáveis',
    },
  },
}

export const tableColumns = [
  { key: 'territorio', label: 'Território e dependência administrativa' },
  { key: 'matriculas', label: 'Matrículas no período de referência', className: 'numeric', format: formatNumber },
  { key: 'variacao', label: 'Variação em relação ao período anterior', className: 'platform-data-cell--numeric' },
  { key: 'percentual', label: 'Percentual de atendimento', className: 'platform-data-cell--numeric', format: formatPercent },
  { key: 'fonte', label: 'Fonte e observação metodológica' },
] as const

export const tableRows: readonly Record<string, unknown>[] = [
  { territorio: 'Rede municipal — Educação Infantil', matriculas: 12345678, variacao: '+4,8%', percentual: 93.4, fonte: 'INEP Censo Escolar — total informado para o recorte' },
  { territorio: 'Rede estadual — Ensino Fundamental', matriculas: 8450, variacao: '-1,2%', percentual: 97.8, fonte: 'INEP Censo Escolar — série parcial' },
  { territorio: 'Rede privada — Educação Profissional e Tecnológica', matriculas: null, variacao: '—', percentual: null, fonte: 'Dado não disponível para o município' },
  { territorio: 'Todas as dependências — Educação de Jovens e Adultos', matriculas: 0, variacao: '0,0%', percentual: 0, fonte: 'Zero informado pela fonte; não representa ausência' },
]

export const chartSeries = {
  closeValues: [{ ano: 2020, valor: 91.1 }, { ano: 2021, valor: 91.3 }, { ano: 2022, valor: 91.2 }, { ano: 2023, valor: 91.5 }, { ano: 2024, valor: 91.4 }],
  constant: [{ ano: 2021, valor: 42 }, { ano: 2022, valor: 42 }, { ano: 2023, valor: 42 }, { ano: 2024, valor: 42 }],
  long: Array.from({ length: 15 }, (_, index) => ({ ano: 2010 + index, valor: 65 + index * 1.7 })),
  partial: [{ ano: 2019, valor: 58 }, { ano: 2020, valor: null }, { ano: 2021, valor: 64 }, { ano: 2022, valor: null }, { ano: 2023, valor: 71 }],
  short: [{ ano: 2023, valor: 74 }, { ano: 2024, valor: 79 }],
} satisfies Record<string, readonly YearValue[]>
