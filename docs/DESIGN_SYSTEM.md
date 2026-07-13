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
