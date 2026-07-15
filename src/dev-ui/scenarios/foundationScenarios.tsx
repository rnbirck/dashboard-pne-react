import { ScenarioGrid, ScenarioItem } from '../components/ScenarioPrimitives'
import type { CatalogScenario } from '../types'

const colorTokens = [
  { label: 'Marca institucional', token: '--green-brand-dark', background: 'var(--green-brand-dark)', color: 'var(--text-inverted)' },
  { label: 'Ação e seleção', token: '--green-primary', background: 'var(--green-primary)', color: 'var(--text-inverted)' },
  { label: 'Superfície de card', token: '--surface-card', background: 'var(--surface-card)', color: 'var(--text-strong)' },
  { label: 'Superfície suave', token: '--surface-soft', background: 'var(--surface-soft)', color: 'var(--text-strong)' },
  { label: 'Estado positivo', token: '--status-ok-bg', background: 'var(--status-ok-bg)', color: 'var(--status-ok-text)' },
  { label: 'Estado de atenção', token: '--status-warn-bg', background: 'var(--status-warn-bg)', color: 'var(--status-warn-text)' },
] as const

export const foundationScenarios: readonly CatalogScenario[] = [
  {
    id: 'foundation-tokens',
    category: 'Fundamentos',
    title: 'Tokens de cor e superfície',
    description: 'Amostra os papéis semânticos canônicos usados pela plataforma.',
    objective: 'Validar contraste, separação de superfícies e consistência dos tokens sem introduzir valores locais.',
    states: ['marca', 'ação', 'superfícies', 'positivo', 'atenção'],
    visual: { enabled: true, viewports: ['desktop'] },
    render: () => (
      <div className="dev-ui-token-grid">
        {colorTokens.map((token) => (
          <div className="dev-ui-token-swatch" key={token.token} style={{ background: token.background, color: token.color }}>
            <strong>{token.label}</strong>
            <small>{token.token}</small>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'foundation-type',
    category: 'Fundamentos',
    title: 'Tipografia, textos e números',
    description: 'Combina hierarquia editorial, prosa longa e valores tabulares.',
    objective: 'Inspecionar wrapping, ritmo tipográfico, unidade curta ou extensa e precisão numérica.',
    states: ['título curto', 'título longo', 'prosa longa', 'valor decimal', 'valor grande'],
    visual: { enabled: true, viewports: ['desktop', 'mobile'] },
    render: () => (
      <ScenarioGrid columns="single">
        <ScenarioItem label="Hierarquia editorial">
          <div className="dev-ui-type-specimen">
            <h1>Diagnóstico municipal</h1>
            <h2>Indicadores de educação e financiamento</h2>
            <h3>Título operacional com texto suficiente para ocupar duas ou três linhas em uma largura reduzida</h3>
            <p>Esta nota metodológica deliberadamente extensa verifica legibilidade, largura de leitura e quebra de linha. O catálogo não atribui significado analítico a estes valores; eles existem apenas para validar a interface.</p>
          </div>
        </ScenarioItem>
        <ScenarioItem label="Valores e unidades">
          <div className="dev-ui-type-specimen">
            <p><strong>Comum:</strong> 1.284</p>
            <p><strong>Zero:</strong> 0</p>
            <p><strong>Negativo:</strong> −12,4 p.p.</p>
            <p><strong>Decimal:</strong> 94,8%</p>
            <p><strong>Muito grande:</strong> 12.345.678.901</p>
            <p><strong>Unidade extensa:</strong> matrículas registradas no período de referência</p>
          </div>
        </ScenarioItem>
      </ScenarioGrid>
    ),
  },
]
