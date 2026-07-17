---
status: normative
scope: "Decisões normativas de design, experiência e implementação visual"
last_validated: 2026-07-17
read_when: "Antes de criar, alterar ou revisar qualquer interface"
supersedes: "Guia, design system e decisões vigentes do plano de migração de UI anterior"
---

# Guia de interface

Este é o único documento normativo de UI. O contexto de produto está em [`../../PRODUCT.md`](../../PRODUCT.md), os testes em [`TESTING.md`](TESTING.md) e pendências comprovadamente abertas em [`BACKLOG.md`](BACKLOG.md).

## Direção e fonte de verdade

O painel é um caderno institucional de acompanhamento municipal: editorial na hierarquia, analítico na organização e sóbrio na superfície. Deve separar dado observado, interpretação técnica e decisão da gestão; nunca parecer ranking, semáforo de municípios, peça promocional ou coleção de cards desconectados.

A hierarquia obrigatória é:

1. `PRODUCT.md` define a intenção do produto;
2. este guia define a regra visual normativa;
3. tokens, CSS e componentes definem a implementação vigente;
4. documentos históricos não possuem autoridade normativa.

Na implementação, `src/styles/design-tokens.css` fornece valores canônicos; `src/styles/platform-ui.css`, `src/styles/chart-system.css`, componentes compartilhados e o shell fornecem a gramática comum; CSS de domínio contém somente composição ou exceção funcional justificada. `src/App.css` é legado ativo e não cria padrão novo.

Quando implementação e guia divergirem, não invente uma correção silenciosa: registre a pendência em `BACKLOG.md` com consumidor, evidência e aceite.

## Fundações

### Tipografia

Use somente as fontes locais:

| Papel | Família | Referência | Peso |
| --- | --- | ---: | ---: |
| `h1` e entrada institucional | Source Serif 4 (`--font-serif`) | 32–56 px | 600 |
| Seção e título operacional | Public Sans (`--font-sans`) | 18–32 px | 600–700 |
| Corpo | Public Sans | 14–16 px | 400–500 |
| Apoio necessário | Public Sans | mínimo 12 px | 500–600 |
| Dados | Public Sans, números tabulares | 20–36 px | 600–700 |

Prosa longa respeita `--content-reading-max` e pode usar `text-wrap: pretty`; headings usam `text-wrap: balance`. Caixa alta fica restrita a siglas, códigos oficiais e eyebrows estruturais. Não reduza fonte para esconder conteúdo. Textos e valores precisam funcionar com zoom de 200%.

### Cor, superfície e densidade

Consuma tokens semânticos antes de qualquer valor local. Verde profundo ancora marca e navegação; superfícies claras e papel quente sustentam leitura prolongada. Ocre e terracota são sinais editoriais, não julgamento. Cor nunca é a única explicação de estado, e verde institucional não significa automaticamente sucesso.

Cards e painéis usam raios de 8–16 px. Painel estático prefere borda; sombra é reservada a elevação, menu, tooltip ou interação explorável. Não use glassmorphism, texto em gradiente, faixas laterais decorativas ou cards aninhados sem função.

Use a escala `--space-*`, ritmo principal de 8 px, `--shell-max`, `--sidebar-width` e `--z-*`. Controles principais e alvos interativos têm pelo menos 44 px; segmentos internos podem ter 36 px quando rotulados, operáveis por teclado e não forem ação crítica. Referências: 16 px entre irmãos, 24 px dentro de blocos e 32–48 px entre seções.

## Estrutura, navegação e conteúdo

Ordem preferencial: shell; município; cabeçalho com `h1`; síntese prioritária; filtros; evidência principal; aprofundamento; fonte, método e data. O município permanece visível no contexto global. Breadcrumb só aparece quando acrescenta orientação real.

Trocas de página restauram o topo e transferem foco ao `h1`. Retornos de detalhe restauram o contexto e o foco do item de origem. Detalhes de PNE, Educação e Financiamento preservam a largura do shell, título curto, KPIs prioritários e navegação local com voltar, posição, anterior e próximo. Detalhes longos do PNE repetem essa navegação ao final.

Nos ciclos PNE 2014–2024 e PNE 2026–2036, o detalhe usa acompanhamento em largura total e, abaixo, gráfico principal em aproximadamente 70% da linha ao lado da leitura rápida. No desktop, o gráfico principal tem 320 px. “Dados de apoio da meta” organiza histórico e dependência administrativa na primeira linha; rede privada ocupa faixa própria na segunda; quando houver projeção, ela divide a terceira linha com a tabela.

O título de cada série auxiliar identifica a métrica real — matrículas, escolas, turmas, salas, pessoas ou percentual — e não reutiliza “Histórico de matrículas” genericamente. Se o principal já mostra percentual e há numerador e denominador anuais, os apoios podem priorizar essas quantidades. Quantidade derivada de taxa e total de outra série oficial é identificada como estimativa, com base e limitação explícitas.

Gráficos auxiliares do PNE têm 270 px; a projeção exclusiva do ciclo vigente mantém cards de síntese antes do gráfico e 320 px. Abaixo de aproximadamente 900 px, os blocos empilham. No celular, gráficos usam 280 px e menos anos no eixo X, sem rolagem interna, compressão tipográfica ou overflow global. A referência PNE abre a leitura rápida; nota metodológica e fonte encerram o detalhe. Não esconda gráfico, tabela, fonte ou nota em abas.

Nos detalhes de Educação, gráfico e leitura rápida usam proporção aproximada de 70/30 no desktop; o gráfico tem 300 px, e a leitura separa evolução, definição e recorte. Notebook e tablet empilham; no celular, gráficos têm 280 px, texto mínimo de 12 px e menos anos no eixo X. Infraestrutura pode manter panorama multivariado em largura total. Dados de apoio usam cabeçalho contextual e cards em grid, sem ocultar evidências em abas ou disclosures. Outros domínios podem usar aprofundamento progressivo quando a tarefa justificar, preservando teclado e alternativa textual.

Desktop e notebook são prioridades. Acima de 1080 px, a sidebar pode ser persistente; abaixo disso deve reduzir impacto sem perder município, navegação ou conteúdo prioritário.

## Componentes

### Controles e cards

Busca e seleção usam superfície clara, borda neutra, foco comum e 44 px. Busca tem label, placeholder complementar e ação de limpar. Filtros combináveis usam `aria-pressed`; segmentos representam escolha exclusiva; abas usam `tablist`, `tab`, `aria-selected` e painel associado. Relações ARIA precisam ser únicas.

Use card somente para uma unidade de informação, ação, comparação ou estado persistente. Card explorável comunica ação por estrutura, foco e estado, não só hover; card informativo não recebe cursor, chevron ou elevação falsa.

Cards comparáveis de PNE, Educação e Financiamento medem 324 px no desktop/notebook, usam 16 px de padding e valor de 32 px. Em Educação e Financiamento, valor à esquerda ocupa a coluna primária de 60%, com Ano/Variação na lateral. Até 700 px, a composição é fluida, com altura mínima comum de 364 px. Alta usa verde-azulado suave, queda terracota suave e estável areia; a direção aparece no badge e na variação, nunca colore o valor. Ausência não vira zero e omite comparação inexistente.

### Gráficos, tabelas e estados

Todo gráfico informa medida, unidade, período, leitura principal, referência quando houver e fonte. Tooltip funciona por ponteiro e foco, mas nunca é a única forma de obter o valor. Eixos usam `--chart-axis-text` e texto final mínimo de 12 px; legendas não dependem só de cor.

No PNE, progresso mantém o valor municipal em superfície neutra e a cor semântica na linha do marcador. A referência do gráfico usa `Meta {valor}`; ciclo e vigência ficam no texto do detalhe.

Tabelas têm `caption`, cabeçalhos associados, números tabulares e alinhamento consistente. Em largura reduzida, rolagem horizontal é explícita; não oculte coluna silenciosamente.

Loading, erro, vazio, sem resultados, não aplicável e indisponível são estados distintos. Loading anuncia sem interromper; erro usa `role="alert"` e oferece nova tentativa quando possível; ausência diferencia zero, falta de denominador e série insuficiente; sem resultados repete filtros ativos e oferece limpeza.

### Indicadores acumulativos de expansão

Indicadores com `presentationMode: 'expansion-share-baseline'` têm apresentação própria. Antes de haver dados posteriores ao início do ciclo, o histórico é contexto pré-ciclo, sem classificação de alcance. A leitura decompõe variações pública e total ao redor de zero e compara o resultado com o patamar em escala que aceite negativos e valores acima de 100%. Indicadores percentuais tradicionais mantêm a série temporal comum.

## Implementação canônica

| Camada | Responsabilidade |
| --- | --- |
| `design-tokens.css` | Cores, tipografia, espaços, raios, medidas, estados e camadas. |
| `platform-ui.css` | Superfícies, cards, controles, toolbars, tabelas e estados compartilhados. |
| `chart-system.css` | Canvas, eixos, grades, séries, marcas, legendas, tooltips e estados de visualização. |
| `navigation-shell.css` | Sidebar, drawer, barra móvel, contexto global e assinatura. |
| `institutional-refresh.css` | Composição editorial comum e integração deliberada. |
| CSS de domínio | Layout e exceção funcional própria. |

Componentes canônicos incluem `ExplorableIndicatorCardFrame`, `SearchField`, `CategoryTabs`, `SegmentedControl`, `MunicipalitySelector`, `EducationTable`, `ContentState`, `LoadingState`, `ErrorState`, `ChartLegend`, `ChartTooltip`, `DataSourceNote`, `SourceLine`, `MethodNote`, `Header`, `SidebarAccordionGroup` e `DetailNavigation`. Preserve lógica analítica, rótulos e filtros no domínio consumidor.

A ordem da cascata é contrato: `index.css` carrega tokens; `App.tsx` carrega `App.css`, gráficos, PNE, plataforma, Financeiro e navegação; `main.jsx` carrega `institutional-refresh.css` por último; Educação carrega CSS com seu chunk. Mudá-la exige catálogo, diff visual, E2E e regressão pública. A duplicação responsiva de `.education-indicator-card-grid` entre `App.css` e `education-pages.css` é compatibilidade deliberada do catálogo, não modelo para novas duplicações.

## Exceções de domínio e aceite

- **PNE:** meta, distância, ciclo, status e projeção exigem referência legal e distinção observado/projetado.
- **Educação:** exploração por tema e etapa pode ser descritiva sem converter toda medida em status.
- **Diagnóstico:** leitura linear, impressão e cópia são próprias da síntese decisória.
- **Financeiro:** moeda, mínimos legais, séries e tabelas extensas exigem densidade própria.

Toda exceção reutiliza tokens, tipografia, foco, controles, cards e estados de base. Antes da entrega, confirme WCAG 2.2 AA, teclado, foco visível, zoom 200%, movimento reduzido, contraste, textos longos, valores grandes, loading, erro e vazio; valide desktop, notebook, tablet e celular. Uma tarefa visual não altera dado, fórmula, escala, filtro, rota ou conteúdo analítico.
