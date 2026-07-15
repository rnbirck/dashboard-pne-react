import { ChartEmptyState } from '../../components/ChartPrimitives.jsx'
import { EducationBarChart } from '../../components/EducationBarChart.jsx'
import { EducationLineChart } from '../../components/EducationLineChart.jsx'
import { EducationStackedBarChart } from '../../components/EducationStackedBarChart.jsx'
import { ErrorState } from '../../components/ErrorState.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { ScenarioGrid, ScenarioItem } from '../components/ScenarioPrimitives'
import { chartSeries } from '../fixtures/catalogFixtures'
import type { CatalogScenario } from '../types'

const formatPercent = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

export const chartScenarios: readonly CatalogScenario[] = [
  {
    id: 'charts-line-series',
    category: 'Gráficos',
    title: 'Séries de linha controladas',
    description: 'Gráfico real com séries curta, longa, parcial, constante e de valores próximos.',
    objective: 'Validar escala, rótulos, foco dos pontos, lacunas e diferenças pequenas sem imagem estática.',
    states: ['série curta', 'série longa', 'valores nulos', 'constante', 'valores próximos'],
    render: () => (
      <ScenarioGrid columns="single">
        <ScenarioItem label="Série curta"><EducationLineChart formatLabel={formatPercent} scaleType="percent" series={chartSeries.short} showPointLabels title="Taxa de atendimento — série curta" /></ScenarioItem>
        <ScenarioItem label="Série longa"><EducationLineChart formatLabel={formatPercent} scaleType="percent" series={chartSeries.long} title="Taxa de atendimento — série histórica longa" /></ScenarioItem>
        <ScenarioItem label="Série parcial"><EducationLineChart formatLabel={formatPercent} scaleType="percent" series={chartSeries.partial} showPointLabels title="Taxa com anos sem observação" /></ScenarioItem>
        <ScenarioItem label="Série constante"><EducationLineChart series={chartSeries.constant} showPointLabels title="Série constante" /></ScenarioItem>
        <ScenarioItem label="Valores muito próximos"><EducationLineChart formatLabel={formatPercent} scaleType="count" series={chartSeries.closeValues} showPointLabels title="Valores muito próximos" /></ScenarioItem>
      </ScenarioGrid>
    ),
  },
  {
    id: 'charts-types-scale',
    category: 'Gráficos',
    title: 'Barras, legenda e escala',
    description: 'Gráficos reais de barras simples e empilhadas com rótulos extensos e grande diferença de escala.',
    objective: 'Inspecionar overflow, tooltip, legenda longa, ordem e legibilidade dos eixos.',
    states: ['barras', 'empilhado', 'legenda longa', 'grande escala'],
    render: () => (
      <ScenarioGrid columns="single">
        <ScenarioItem label="Grande diferença de escala">
          <EducationBarChart
            data={[{ label: 'Educação Infantil — rede municipal', value: 180 }, { label: 'Ensino Fundamental — todas as dependências', value: 12450 }, { label: 'Educação Profissional e Tecnológica', value: 42 }]}
            formatLabel={(value: number) => value.toLocaleString('pt-BR')}
            preserveOrder
            title="Matrículas por etapa e dependência administrativa"
          />
        </ScenarioItem>
        <ScenarioItem label="Legenda extensa">
          <EducationStackedBarChart
            categories={[{ key: 'municipal', label: 'Rede municipal' }, { key: 'estadual', label: 'Rede estadual com descrição extensa' }, { key: 'privada', label: 'Rede privada' }]}
            data={[
              { year: 2022, values: { municipal: 6200, estadual: 3100, privada: 1180 } },
              { year: 2023, values: { municipal: 6350, estadual: 3020, privada: 1240 } },
              { year: 2024, values: { municipal: 6410, estadual: 2990, privada: 1290 } },
            ]}
            title="Distribuição das matrículas por dependência"
          />
        </ScenarioItem>
      </ScenarioGrid>
    ),
  },
  {
    id: 'charts-system-states',
    category: 'Gráficos',
    title: 'Estados de gráficos',
    description: 'Ausência de dados, loading e erro usando componentes de estado reais.',
    objective: 'Garantir distinção semântica e textual entre indisponibilidade, processamento e falha.',
    states: ['sem dados', 'loading', 'erro'],
    render: () => (
      <ScenarioGrid>
        <ScenarioItem label="Sem dados"><ChartEmptyState message="Série histórica indisponível para este recorte." /></ScenarioItem>
        <ScenarioItem label="Loading"><LoadingState message="Carregando série do gráfico..." /></ScenarioItem>
        <ScenarioItem label="Erro"><ErrorState title="Não foi possível exibir o gráfico." message="Tente novamente após revisar a fixture." /></ScenarioItem>
      </ScenarioGrid>
    ),
  },
]
