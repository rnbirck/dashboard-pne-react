# Sistema visual — Painel SESI-RS / Inteligência Municipal

> Documento permanente de referência para novas páginas, componentes e
> revisões visuais. A implementação canônica está em
> `src/styles/design-tokens.css`, `src/styles/platform-ui.css`,
> `src/styles/navigation-shell.css` e `src/styles/institutional-refresh.css`.

## 1. Direção visual

O painel é tratado como um caderno institucional de acompanhamento municipal:
editorial na hierarquia, analítico na organização e sóbrio na superfície. A
interface precisa ajudar a ler uma situação educacional antes de pedir uma
decisão, mantendo município, unidade, período, fonte e limitação próximos da
evidência.

A assinatura visual combina:

- verde profundo como campo institucional e âncora de ação;
- papel quente e superfícies neutras para leitura prolongada;
- Source Serif 4 em títulos de entrada e Public Sans em operação e dados;
- linhas de seção, índices e divisores para organizar a leitura sem decorar;
- ocre e terracota como sinais editoriais de atenção, nunca como julgamento;
- uma malha de fundo muito sutil no conteúdo para dar continuidade espacial.

O produto não é um ranking, um semáforo de municípios ou uma coleção de cards
isolados. Dado, interpretação e decisão permanecem visualmente distinguíveis.

## 2. Tipografia

As famílias carregadas localmente são obrigatórias:

| Papel | Família | Referência | Observação |
| --- | --- | ---: | --- |
| Título de página | Source Serif 4 | 32–56 px | Deve ter contraste e largura controlada. |
| Seção | Public Sans | 24–32 px | Organiza blocos de evidência. |
| Título operacional | Public Sans | 18–22 px | Usado em cards, grupos e detalhes. |
| Corpo | Public Sans | 14–16 px | Texto com entrelinha confortável. |
| Apoio | Public Sans | mínimo 12 px | Fonte, unidade, período e limitações. |
| Dados | Public Sans | 20–36 px | `font-variant-numeric: tabular-nums`. |

Eyebrows usam caixa alta somente como rótulo estrutural, com espaçamento de
letras amplo. Prosa deve usar `text-wrap: pretty`; headings devem usar
`text-wrap: balance`. A tipografia não deve ser reduzida para esconder texto
essencial.

## 3. Cores e contrastes

Os valores ficam em `design-tokens.css`; componentes devem consumir tokens
semânticos, não repetir hexadecimais.

| Função | Token | Uso |
| --- | --- | --- |
| Campo institucional | `--green-brand-dark` / `--surface-ink` | Sidebar, assinatura e blocos de orientação. |
| Ação e seleção | `--green-primary`, `--green-deep`, `--green-soft` | Foco, seleção, links e ação primária. |
| Papel e conteúdo | `--bg-app`, `--surface-card`, `--surface-moss` | Leitura, agrupamento e contexto. |
| Texto | `--text-strong`, `--text-body`, `--text-soft` | Títulos, corpo e metadados. |
| Sinal editorial | `--signal-ochre`, `--signal-clay` | Índices, atenção e variação sem semáforo. |
| Fonte | `--source-label` | Rótulo neutro de atribuição. |
| Gráfico | `--chart-series-*`, `--chart-grid`, `--chart-axis-text` | Séries, grade e rótulos. |

Estados sempre têm texto ou rótulo além da cor. Verde institucional não é
sinônimo automático de sucesso; séries de gráficos não usam tokens de status.
O contraste mínimo é WCAG 2.2 AA.

## 4. Espaçamento, superfícies e largura

- A escala base é de 4 px, com ritmo principal de 8 px (`--space-*`).
- `--sidebar-width` mantém 280 px no desktop.
- `--shell-max` é a largura máxima do produto; o conteúdo usa
  `--page-padding-inline` e reduz para os tokens de tablet e celular.
- Seções principais usam 28–40 px de respiro; cards irmãos usam 16–18 px.
- Superfícies estáticas preferem borda fina e sombra mínima. Elevação fica
  reservada a navegação, tooltip, drawer e cards exploráveis.
- Raios são moderados: 7 px para controles, 10 px para painéis e 14–18 px
  somente quando a composição pede maior acolhimento.
- Não usar glassmorphism decorativo, texto em gradiente, faixa lateral de
  status ou cards aninhados sem necessidade de conteúdo.

### Densidade e insets

Os tokens de composição definem a densidade comum: `--page-gap` em 24 px,
`--section-gap` em 28 px e `--card-gap` em 16 px. Heróis e cabeçalhos editoriais
usam `--hero-padding-block` (32 px), `--hero-padding-block-compact` (30 px) e
`--hero-padding-block-mobile` (22 px); a escala tipográfica do corpo permanece
inalterada e controles continuam com `--control-height`/`--touch-target-min` de
no mínimo 44 px.

Painéis de conteúdo usam `--panel-inset` de 24 px no desktop,
`--panel-inset-intermediate` de 20 px em notebook/tablet e
`--panel-inset-mobile` de 16 px no celular. A área de Educação expõe esse
contrato por `--education-panel-padding` em hero, filtros, resumos, detalhes,
gráficos, tabelas e estados do módulo. Uma superfície deve fornecer o inset do
seu próprio conteúdo uma vez; grades, fontes e estados internos não repetem
uma moldura ou um espaçamento estrutural já fornecido pelo pai.

## 5. Anatomia das páginas

Toda rota deve seguir, quando fizer sentido:

1. shell, navegação e município;
2. `h1`, eyebrow, descrição e ação contextual;
3. síntese da leitura prioritária;
4. filtros e recortes;
5. evidência principal;
6. aprofundamento progressivo;
7. fonte, metodologia, período e limitação.

Heróis podem usar uma coluna editorial ou uma coluna de contexto lateral. O
bloco lateral deve explicar base legal, objetivo do módulo ou estado do
município; nunca ser uma área vazia usada apenas para equilibrar o grid.

## 6. Controles compartilhados

`SearchField`, `MunicipalitySelector`, `CategoryTabs`, `SegmentedControl`,
`DetailNavigation` e as classes `platform-*` são a gramática comum.

- controles críticos têm pelo menos 44 px de altura;
- busca tem label acessível, placeholder complementar e limpeza explícita;
- filtros combináveis usam `aria-pressed`;
- escolhas exclusivas usam segmento ou aba com `aria-selected`;
- seleção ativa combina borda, superfície e texto, sem depender somente de cor;
- grupos roláveis no celular mantêm a rolagem dentro do próprio controle;
- foco é sempre visível e não é substituído por hover.

## 7. Cards e indicadores

Um card só existe quando agrupa uma unidade de informação, uma ação, uma
comparação ou um estado persistente. O frame compartilhado
`ExplorableIndicatorCardFrame` organiza:

1. contexto e status;
2. título e descrição;
3. valor, unidade e ano;
4. variação ou apoio;
5. série curta, quando disponível;
6. affordance de abertura.

Cards exploráveis são botões ou links focáveis e expõem estado selecionado.
Cards informativos não recebem chevron nem cursor de ação. A altura não pode
truncar títulos ou valores grandes.

## 8. Gráficos, tabelas e fontes

Gráficos devem declarar medida, unidade, período, leitura, referência e fonte.
Tooltips são complementares, nunca a única forma de obter um valor. Rótulos
de eixo têm pelo menos 12 px e séries recebem legenda textual.

Tabelas usam `caption`, `scope="col"`, números tabulares e alinhamento
consistente. Em telas estreitas, a rolagem é explícita dentro da região
nomeada; colunas não desaparecem silenciosamente.

`DataSourceNote`, `SourceLine` e `MethodNote` ficam próximos da evidência. A
nota de fonte é neutra, legível e não deve parecer um badge de status.

## 9. Estados

`ContentState` é a primitiva para loading, erro, vazio, sem resultados e
indisponibilidade.

- loading: mensagem polida e, quando previsível, skeleton;
- erro: linguagem simples, `role="alert"` e recuperação quando possível;
- vazio: explicar se é ausência, série insuficiente, não aplicável ou zero;
- sem resultados: repetir o recorte ativo e oferecer limpeza;
- sem município: explicar a dependência do contexto sem duplicar relações ARIA.

## 10. Responsividade e acessibilidade

Desktop e notebook são prioridades em 1366×768, 1280×720 e 1024×768. Em
larguras abaixo de 1080 px a sidebar vira drawer; a barra de contexto e o
município permanecem visíveis antes da abertura. Em 390×844 e 320×568:

- não pode existir overflow horizontal do documento;
- grids passam de 3/2 colunas para uma coluna quando necessário;
- filtros e eixos rolam dentro do próprio grupo;
- títulos longos quebram, sem truncamento por altura fixa;
- drawer fecha com Escape, devolve foco e contém Tab.

Também são obrigatórios foco visível, ordem de teclado coerente, zoom de 200%,
contraste AA, alvos de toque de 44 px e respeito a
`prefers-reduced-motion: reduce`.

## 11. Exemplos de uso

```jsx
<SearchField
  label="Buscar indicador"
  value={query}
  onChange={setQuery}
  onClear={() => setQuery('')}
/>

<StatusBadge status="Com dados" tone="success" />

<FinancialSection
  eyebrow="Resumo financeiro"
  title="Visão geral"
  description="Leitura consolidada do período disponível."
>
  {children}
</FinancialSection>
```

Para uma nova página, reutilize primeiro os componentes compartilhados e os
tokens. Crie uma exceção de módulo somente quando o conteúdo exigir outra
composição semântica. Não altere dados, JSONs, cálculos, filtros, aliases,
fontes ou conteúdo metodológico para resolver uma necessidade visual.

## 12. Arquivos canônicos e ordem da cascata

| Arquivo | Responsabilidade | Não deve receber |
| --- | --- | --- |
| `src/styles/design-tokens.css` | Variáveis, escalas, cores, tipografia, espaços, raios, medidas, estados e camadas. | Regras de componente ou página. |
| `src/styles/platform-ui.css` | Superfícies, cards, controles, toolbars, tabelas, estados e padrões editoriais compartilhados. | Geometria de gráfico ou regra exclusiva de um domínio. |
| `src/styles/chart-system.css` | Superfície, canvas, eixos, grades, séries, marcas, legendas, tooltips e estados de visualização. | Escala, cálculo, série, formatação ou regra analítica. |
| `src/styles/navigation-shell.css` | Sidebar, drawer, barra móvel, contexto global e assinatura institucional. | Layout interno de páginas. |
| `src/styles/institutional-refresh.css` | Composição editorial institucional comum e ajustes deliberados de integração. | Anatomia duplicada já definida em `platform-ui.css` ou `chart-system.css`. |
| CSS de domínio | Layout próprio, composição e exceção funcional justificada. | Gramática base de controles, cards, tabelas, estados ou gráficos. |
| `src/App.css` | Legado ativo ainda necessário, impressão e exceções históricas não migráveis com segurança. | Qualquer novo padrão compartilhado. |

A ordem atual é um contrato de cascata. `index.css` carrega os tokens; `App.tsx`
carrega `App.css`, gráficos, PNE, plataforma, Financeiro e navegação, nessa
ordem; `main.jsx` carrega `institutional-refresh.css` por último. O CSS de
Educação é carregado com o chunk da página. Se o usuário solicitar validação
completa para uma alteração nessa ordem, a cobertura recomendada inclui diff
visual, catálogo, E2E e regressão pública; o risco não ativa esses comandos por
si só.

## 13. Inventário operacional

| Grupo | Implementação canônica e tokens | Consumidores e variantes | Diferenças preservadas / legado |
| --- | --- | --- | --- |
| Superfícies e cabeçalhos | `platform-ui.css`; `--surface-*`, `--border-*`, `--radius-*`, `--panel-inset*` | `page-card`, `FinancialSection`, `PageHeadingText`, `DetailHeadingText`, heroes e cabeçalhos de seção | Heroes, contexto lateral e composição de cada domínio permanecem locais. |
| Cards | `ExplorableIndicatorCardFrame`, `platform-ui.css`; `--card-*`, `--status-*` | Educação, Financeiro, `MetaCard`, `MetricCard`, `StatCard`; informativo, explorável, selecionado e indisponível | `MetaCard` mantém meta, ciclo e projeção do PNE. Cards de resumo sem ação não recebem affordance. |
| Valores, unidades e badges | `MetricCard`, `EducationSummaryCard`, `StatusBadge`; tokens tipográficos e de estado | Zero, ausência, moeda, percentual, índice, ano, alta, queda, estabilidade e cobertura | Formatadores e critérios analíticos continuam no domínio; ausência nunca vira zero. |
| Busca, filtros, segmentos e abas | `SearchField`, `CategoryTabs`, `SegmentedControl`, `MunicipalitySelector`, `platform-ui.css`; `--control-*`, `--focus-*` | Busca vazia/preenchida/desabilitada, filtros combináveis, seleção exclusiva e grupos roláveis | Semântica ARIA e lógica do filtro permanecem no consumidor. |
| Toolbars e resumo de resultados | `platform-exploration-toolbar`, `platform-results-summary`, `platform-ui.css` | Educação, PNE legal e módulos financeiros | Quantidade e ordem dos controles seguem a tarefa de cada página. |
| Tabelas | `EducationTable`, `platform-data-table*`, `platform-ui.css`; `--table-*` | Educação, PNE, FUNDEB, PNATE, SIOPE e Sistema S; numérico, ausência, overflow e estado | Colunas, unidades, mínimos legais e altura máxima de cálculos continuam específicos. |
| Loading, vazio, erro e indisponibilidade | `ContentState`, `LoadingState`, `ErrorState`, `platform-ui.css`; `--state-*` | Painel, tabela e gráfico; `status`, `alert`, skeleton e recuperação | Vazios compactos e mensagens de negócio permanecem no domínio. |
| Avisos de cobertura | `platform-coverage-note`, `ContentState`; tokens de atenção e cobertura | SIOPE e projeções educacionais | O aviso informa limitação; não altera regra de cobertura nem substitui dado ausente. |
| Gráficos, eixos e grades | `ChartPrimitives`, renderers SVG reais, `chart-system.css`; `--chart-*` | Linha, barra, empilhado, projeção e histórico; série completa, parcial e nula | Domínios, ticks, escalas, geometria, metas e formatadores continuam nos renderers. |
| Legendas e tooltips | `ChartLegend`, `ChartTooltip`, `chart-system.css`; `--chart-tooltip-*`, `--z-tooltip` | Série única, multissérie, linha sólida/tracejada, ponteiro e teclado | Tooltip é complementar; fonte, rótulo e valor permanecem acessíveis fora dele. |
| Fontes e notas | `DataSourceNote`, `SourceLine`, `MethodNote`; `--source-label`, `--text-*` | Fonte, metodologia, período e limitação | Texto analítico e atribuição oficial não são reescritos por uma tarefa visual. |
| Navegação | `Header`, `SidebarAccordionGroup`, `DetailNavigation`, `navigation-shell.css` | Sidebar, drawer, submenu, retorno, anterior/próximo e restauração de foco | Rotas, hashes, aliases e vizinhança permanecem na camada de navegação. |

A duplicação literal da regra responsiva de `.education-indicator-card-grid`
entre `App.css` e `education-pages.css` é mantida como compatibilidade do
catálogo isolado: cenários de cards podem carregar o componente sem importar a
página de Educação. As demais repetições exatas dentro do mesmo contexto foram
removidas na estabilização final.

## 14. Compartilhado, domínio e variantes

Use estilo compartilhado quando a anatomia, o estado e a interação forem
equivalentes em dois ou mais domínios. Use estilo de domínio quando a diferença
expressar composição, densidade, escala, regra legal ou significado próprio.

Para adicionar uma variante:

1. confirme que a primitiva existente não cobre o estado;
2. nomeie a diferença por função, não por aparência;
3. reutilize tokens semânticos;
4. mantenha DOM e ARIA da primitiva;
5. cubra default, foco, desabilitado, loading, erro, vazio e responsividade quando aplicável;
6. registre a variante no catálogo somente se houver risco novo e reutilização real.

Não copie um bloco compartilhado para o CSS de domínio. Se a exceção exigir
mais propriedades que a anatomia base, documente por que ela não é uma variante
reutilizável antes de implementá-la.

## 15. Matriz de validação sob demanda

A execução local pelo Codex segue exclusivamente os modos do `AGENTS.md` da
raiz. A matriz abaixo ajuda a escolher a menor cobertura somente depois de um
pedido explícito de validação:

```text
Alteração em componente isolado:
→ catálogo + regressão isolada.

Alteração em navegação ou interação:
→ catálogo, testes de roteamento e E2E.

Alteração em página ou composição:
→ catálogo, E2E e regressão pública.

Alteração em cálculo ou indicador:
→ verify:indicator e testes de domínio.
```

Em alteração estrutural de UI, `npm run typecheck`, `npm run lint`,
`npm run build` e `npm run test:ui-architecture` ficam reservados à validação
explicitamente solicitada; o risco estrutural não autoriza execução automática.
Baseline só pode mudar quando a diferença visual for intencional, necessária,
documentada e revisada. Instabilidade, fonte ausente, foco acidental, loading,
dimensão diferente ou erro de console devem ser corrigidos, não aceitos.

## 16. Práticas proibidas e checklist de QA

É proibido:

- criar padrão novo em `App.css`;
- repetir tokens por hex, pixel ou sombra quando existir valor semântico;
- criar tooltip ou legenda canônica de gráfico fora de `chart-system.css`;
- usar `!important` para vencer uma cascata não compreendida;
- esconder coluna, texto, valor ou estado para eliminar overflow;
- alterar dado, cálculo, escala, filtro, rota ou conteúdo para resolver layout;
- atualizar baseline por conveniência.

Antes da entrega, preserve por implementação e inspeção dos arquivos afetados:

- componente ou variante equivalente reutilizado;
- desktop, notebook e celular sem overflow global;
- foco visível, ordem de Tab, Escape e restauração de foco preservados;
- `aria-current`, `aria-selected`, `aria-expanded` e `aria-busy` corretos;
- zero distinto de ausência e estado não dependente apenas de cor;
- textos longos, valores grandes, loading, vazio e erro legíveis;
- catálogo isolado sem dados municipais e ausente do build público;

Testes executáveis, inspeções em viewports, build e verificações de Git dependem
do modo de validação explicitamente solicitado conforme `AGENTS.md`.
