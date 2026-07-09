# Guia de Design e Experiência — Dashboard PNE

Status: referência permanente para criação, revisão e migração visual  
Última atualização: 9 de julho de 2026  
Tokens: `src/styles/design-tokens.css`

## 1. Contexto e objetivos

O Dashboard PNE deve transformar dados educacionais públicos em uma leitura municipal confiável, orientada à decisão e compreensível por gestores que não precisam dominar conceitos técnicos de análise de dados.

Cena de uso de referência: uma gestora municipal consulta o painel em um notebook ou monitor de escritório, muitas vezes durante reunião, precisa localizar rapidamente seu município, entender o que o número representa, identificar o período e a fonte, comparar o resultado com uma referência e explicar a leitura a outras pessoas.

O sistema visual deve ser:

- institucional, sem parecer burocrático;
- moderno, sem adotar modismos decorativos;
- sóbrio, sem usar cor como julgamento;
- claro, sem exigir conhecimento técnico para entender a próxima ação;
- consistente entre metas, educação, diagnóstico e financiamento;
- adequado à análise técnica e à comunicação pública da mesma evidência.

Princípios de experiência:

1. Começar pela decisão: mostrar primeiro o que está sendo analisado, o período, a leitura principal e o próximo passo.
2. Contextualizar antes de comparar: valor, unidade, ano, fonte e limitação devem anteceder conclusões.
3. Separar dado, interpretação e ação: números, leitura técnica e decisão da gestão são camadas diferentes.
4. Comunicar sem julgar: preferir “exige atenção”, “lacuna” e “referência” a ranking, nota ou reprovação.
5. Reduzir escolhas simultâneas: cada tela deve deixar claro município, tema ativo, filtro aplicado e caminho de retorno.
6. Manter a interface familiar: controles padrão, estados previsíveis e mesma linguagem de componente em todos os módulos.
7. Acessibilidade é requisito de aceite: WCAG 2.2 AA, teclado, zoom, contraste, foco e movimento reduzido.
8. Não alterar regras de negócio em ajustes visuais: dados, cálculos, filtros e conteúdo analítico permanecem fora do escopo visual.

## 2. Auditoria de referência

### 2.1 Escopo verificado

A auditoria combinou inspeção da aplicação executada e leitura da implementação. Foram percorridos:

- Home com e sem município selecionado;
- O que é o PNE;
- Metas legais do PNE 2026–2036;
- PNE 2014–2024;
- PNE 2026–2036;
- Diagnóstico municipal;
- Indicadores de Educação;
- Indicadores Financeiros da Educação;
- módulos Aplicação dos Recursos, FUNDEB, VAAR e PNATE;
- buscas, filtros temáticos, abas, acordeões, cards e navegação entre detalhes;
- gráficos de linha, barras, barras empilhadas, projeções e séries auxiliares;
- tabelas anuais e tabelas de detalhamento;
- seleção, limpeza e ausência de município;
- ausência de resultados de busca;
- mensagens de carregamento, erro e ausência por inspeção da implementação;
- textos legais longos e valores financeiros grandes;
- larguras de 1280 px, 768 px e 390 px.

Também foram executados `npm run lint`, `npm run build` e o teste E2E existente. Lint e build passaram. O E2E falhou porque ainda procura a estrutura antiga `.indicator-row`, o que impede a suíte de validar a interface atual.

### 2.2 Índice de saúde

| Dimensão | Nota | Evidência principal |
|---|---:|---|
| Acessibilidade | 2/4 | Há foco global e alguns gráficos acessíveis, mas persistem contraste insuficiente, alvos pequenos, abas sem semântica completa e tooltips exclusivos de ponteiro. |
| Performance | 2/4 | A aplicação responde bem localmente, porém o CSS e o bundle cresceram além do necessário e o seletor monta centenas de opções. |
| Responsividade | 1/4 | Cards empilham, mas a navegação domina a tela em tablet/celular e gráficos e tabelas são cortados. |
| Tematização | 1/4 | Tokens iniciais existem, mas convivem com grande volume de cores, tamanhos, raios e sombras locais. |
| Antipadrões | 2/4 | A identidade institucional é reconhecível, porém há excesso de cards, microtítulos em caixa alta e muitas camadas de overrides. |
| **Total** | **8/20** | **Ruim — a base visual de desktop é aproveitável, mas a dívida sistêmica impede consistência e acessibilidade.** |

Severidades registradas: P0 0, P1 8, P2 10 e P3 3.

### 2.3 Veredito sobre padrões genéricos

A interface não parece um template genérico quando vista em desktop: o verde institucional, o fundo neutro, a linguagem sem julgamento e a presença de fonte, ano e meta formam uma identidade válida. O problema está na implementação acumulada. A repetição de grades de cards, microtítulos em caixa alta, borda mais sombra em muitos painéis e sucessivos “passes” de CSS tornam o produto mais carregado e menos previsível do que precisa ser.

### 2.4 Problemas P1 — corrigir antes de expandir o padrão

| ID | Problema e evidência | Impacto para o gestor | Recomendação | Critério relacionado |
|---|---|---|---|---|
| P1-01 | A troca de página preserva a rolagem anterior. Ao sair de uma tabela longa, Home abriu em `scrollY 267`; Financeiro abriu em `scrollY 837`. `App.jsx` troca apenas `activePage`. | A nova tela começa no meio, escondendo título, município, contexto e filtros. | Criar navegação centralizada que restaure o topo do conteúdo e transfira foco para o título da página. Preservar rolagem apenas em retorno explícito a uma lista. | WCAG 2.4.3, 2.4.11 |
| P1-02 | Em 768 px, itens principais da navegação chegaram a 243 px de altura; em 390 px o cabeçalho ocupou cerca de 472 px e todos os subitens permaneceram abertos. Subitens têm 31 px de altura. | A primeira tarefa vira atravessar o menu; conteúdo e município ficam abaixo da dobra. | Sidebar fixa somente em desktop. Entre 1080 e 769 px, usar cabeçalho compacto. Em celular, usar botão de menu com painel controlado, seção PNE expansível e alvos de 44 px. | WCAG 2.5.8, 1.4.10 |
| P1-03 | Gráficos usam larguras mínimas de 640–820 px. Em 390 px, o gráfico mostrou apenas até 2020 e a tabela FUNDEB ficou cortada; o contêiner medido tinha 720 px. | Anos recentes e valores podem desaparecer sem aviso, levando a leitura incompleta. | Tornar gráficos realmente responsivos, reduzir rótulos de forma determinística e oferecer alternativa tabular. Tabelas devem ter rolagem horizontal visível no próprio contêiner, sem serem cortadas pelo ancestral. | WCAG 1.4.10 |
| P1-04 | `--text-muted` sobre branco tem contraste 3,54:1; `--text-faint` e o eixo atual têm 2,55:1; placeholder atual tem 3,64:1. Muitos usos têm 10–13 px. | Fontes, eixos, descrições e pistas de preenchimento ficam difíceis de ler, especialmente em projetores e telas de baixa qualidade. | Novas implementações devem usar `--text-secondary`, `--text-subtle`, `--text-placeholder` e `--chart-axis-text`. Recalibrar os tokens legados na migração aprovada. Texto informativo mínimo de 12 px e contraste 4,5:1. | WCAG 1.4.3 |
| P1-05 | `CategoryTabs` declara `role="tablist"`, mas seus botões não têm `role="tab"`, `aria-selected` nem roving tabindex. Filtros do diagnóstico e eixos financeiros indicam seleção apenas por classe. | Leitores de tela não recebem o estado ativo e usuários de teclado não têm o comportamento esperado de abas. | Unificar em `Tabs`, `SegmentedControl` ou `FilterChips`. Abas reais devem usar tab/tablist/tabpanel; filtros devem usar `aria-pressed`. | WCAG 1.3.1, 4.1.2 |
| P1-06 | `EducationLineChart`, `EducationBarChart` e `EducationStackedBarChart` abrem tooltip apenas com `onMouseEnter`; pontos e barras não recebem foco. Outros gráficos já implementam foco e `<title>`. | Usuários de teclado e tecnologia assistiva perdem valores detalhados. | Extrair um `ChartTooltip` comum e tornar marcas focáveis. Incluir nome da série, categoria, ano, unidade e valor; fornecer resumo textual ou tabela. | WCAG 1.1.1, 2.1.1 |
| P1-07 | As duas instâncias possíveis de `MunicipalitySelector` reutilizam `municipio-selector-listbox` e IDs de opções. O botão de limpar mede 18 px, o chevron 26 px e até 497 opções são montadas quando a lista abre. | IDs duplicados quebram relações ARIA; ações são difíceis no toque; a lista é pesada e anuncia “Aceguá” como opção ativa antes de uma escolha real. | Gerar IDs com `useId`, manter um único seletor ativo por tela, integrar limpar/abrir ao alvo de 44 px e limitar/virtualizar resultados após pesquisa. | WCAG 4.1.2, 2.5.8 |
| P1-08 | `LoadingState` não possui `role="status"`/`aria-live`; `ErrorState` não usa `role="alert"` e não oferece tentativa novamente. Há ainda estados paralelos implementados diretamente em `EducacaoPage`. | Uma pessoa pode não saber que o carregamento terminou ou que ocorreu erro, principalmente sem visão. | Unificar `StatePanel` com variantes loading, empty, no-results e error, anúncio apropriado, ação de recuperação e skeleton quando houver estrutura previsível. | WCAG 4.1.3, 3.3.1 |

### 2.5 Problemas P2 — corrigir durante a unificação

| ID | Problema e evidência | Direção |
|---|---|---|
| P2-01 | `App.css` tem 20.249 linhas, 420.108 bytes, 3.007 regras, 473 seletores repetidos e 318 duplicações no mesmo contexto. `.app-header` aparece quatro vezes na raiz; `.meta-card`, sete. | Migrar por módulo para arquivos de componente ou camadas CSS explícitas. Remover a regra antiga somente após validar a página piloto. |
| P2-02 | Há 174 cores hexadecimais e 236 valores rgb/rgba únicos, 113 tamanhos de fonte, 29 raios, 84 sombras e 24 breakpoints. `App.css` ainda referencia `--bg-muted` e `--border-soft` sem definição. | Novos estilos devem usar `design-tokens.css`. Valores locais só entram após decisão documentada; referências legadas indefinidas devem ser resolvidas na migração, sem mudança silenciosa de aparência. |
| P2-03 | Os tokens declaram Public Sans e Source Serif 4, mas `index.html` carrega Inter e Plus Jakarta Sans. Na prática são usados fallbacks do sistema e Georgia. | Escolher e carregar a dupla declarada ou alinhar tokens aos ativos reais. A proposta deste guia preserva Public Sans + Source Serif 4, condicionada ao carregamento correto. |
| P2-04 | A hierarquia de títulos varia: o nome do produto é `h1` no menu; páginas também usam `h1`; Diagnóstico começa em `h2`; detalhes começam em `h3` e chegam a `h5`. | O shell deve usar texto de marca sem ocupar o `h1`. Cada página tem um único `h1`; seções seguem `h2`; subseções, `h3`. |
| P2-05 | Sparkline, cards de indicador e navegação de detalhe foram implementados separadamente em Meta, Educação e Financeiro. | Extrair primitivas comuns e manter somente variações de conteúdo e tom. |
| P2-06 | Páginas narrativas e o diagnóstico usam cards dentro de cards e longas sequências de painéis. O Diagnóstico móvel chega a mais de 6.400 px de altura. | Reservar cards para agrupamento ou ação. Usar seções, divisores e divulgação progressiva para conteúdo contínuo. |
| P2-07 | Busca sem resultado mostra texto curto, sem limpar filtros; no ciclo, a mensagem diz “neste tema” mesmo quando a busca causou o vazio. A contagem não usa live region. | O estado deve explicar quais filtros produziram o vazio e oferecer “Limpar busca” e “Mostrar todos”. Atualizar contagem com anúncio não intrusivo. |
| P2-08 | Tabelas têm estilos e densidades diferentes; faltam `caption` e `scope="col"`. A tabela FUNDEB usa rolagem vertical interna mesmo com nove linhas. | Criar `DataTable` com caption, alinhamento por tipo, cabeçalho fixo apenas quando necessário e uma única direção principal de rolagem. |
| P2-09 | Breadcrumbs existem em `ContextBar`, mas não apareceram na experiência auditada. A navegação é estado local, sem URL ou histórico por módulo. | Exibir caminho contextual em larguras adequadas e avaliar rotas endereçáveis na etapa de navegação, sem alterar dados ou cálculos. |
| P2-10 | O build gera CSS de 316,01 kB e JS de 628,49 kB; Vite alerta para chunk acima de 500 kB. O teste E2E atual falha antes das asserções visuais. | Estabelecer orçamento, code splitting por módulo e testes de shell, seleção, filtros, responsividade e acessibilidade antes da migração. |

### 2.6 Problemas P3 — polimento controlado

- P3-01: microtítulos em caixa alta aparecem em excesso e competem com títulos de seção; usar apenas quando identificarem uma camada real.
- P3-02: z-index usa dez valores locais. Migrar para a escala `--z-*` e impedir números arbitrários.
- P3-03: o scrollbar customizado e alguns movimentos de elevação não agregam significado. Preservar apenas feedback de estado e respeitar movimento reduzido.

### 2.7 Padrões atuais que devem ser preservados

- verde profundo como âncora institucional, sem dominar a área de leitura;
- superfície principal clara para uso prolongado em ambientes de trabalho;
- município persistente e visível na barra de contexto;
- texto explícito de status junto à cor;
- apresentação conjunta de valor, unidade, ano e referência;
- notas de fonte e avisos metodológicos próximos do dado;
- linguagem de “atenção”, “lacuna” e “avanço”, sem ranking competitivo;
- leitura rápida nos detalhes de indicador;
- abas semânticas já corretas nos módulos financeiros e nos dados de apoio;
- pontos focáveis e `<title>` já presentes em `IndicatorHistoryChart` e gráficos complementares;
- foco global visível e regra de movimento reduzido;
- tabelas com números tabulares e alinhamento numérico à direita nos estilos mais recentes;
- estado sem município com explicação e ação clara, após remover a duplicação do seletor.

### 2.8 Padrões que precisam ser unificados

| Necessidade | Implementações atuais | Padrão único proposto |
|---|---|---|
| Cabeçalho de página | Home, ciclos, Educação, Financeiro, Legal e Diagnóstico usam estruturas distintas | `PageHeader` com contexto, `h1`, descrição, município e ações opcionais |
| Título de seção | eyebrow + h2, h3 direto, strong e headings visuais | `SectionHeader` com nível semântico configurável e descrição opcional |
| Indicador resumido | `MetricCard`, cards de visão geral e cards do diagnóstico | `SummaryMetric` com label, valor, período e nota |
| Card de indicador | `MetaCard`, `EducationIndicatorCard`, `FinancialIndicatorCard` | `IndicatorCard` com slots para referência, valor, delta, status e sparkline |
| Seleção temática | tabs, chips, botões em tablist e cards | `Tabs` para troca de painel; `FilterChips` para refino; `SegmentedControl` para poucos recortes |
| Busca e filtros | barras e mensagens próprias por página | `FilterToolbar`, `SearchField`, resumo de filtros e ação limpar |
| Estados | `LoadingState`, `ErrorState`, textos locais e caixas vazias | `StatePanel` com variantes e ações consistentes |
| Gráficos | cinco famílias com eixos, tooltip e cores diferentes | `ChartFrame`, `ChartLegend`, `ChartTooltip`, `ChartEmpty` e paleta comum |
| Tabelas | `EducationTable`, `fundeb-table`, `sistema-s-table` e outras | `DataTable` + `TableContainer` com densidade, alinhamento e overflow padronizados |
| Fonte e metodologia | `SourceLine`, `DataSourceNote` e parágrafos locais | `SourceNote` e `MethodNote` |
| Navegação de detalhe | versões de ciclo, educação e financeiro | `DetailNavigation` com voltar, posição, anterior e próximo |
| Status | inferências e rótulos diferentes por módulo | `StatusBadge` com vocabulário semântico único e texto obrigatório |

## 3. Identidade visual e hierarquia

### 3.1 Estratégia

A estratégia cromática é **restrita**: neutros levemente orientados ao verde, um verde institucional como ação/seleção e cores semânticas usadas somente quando comunicam estado. O tema principal permanece claro; o verde profundo pode ocupar a navegação desktop, mas deve virar cabeçalho compacto ou painel de menu em telas menores.

### 3.2 Tipografia

Usar duas famílias com papéis diferentes:

- `--font-serif`: identidade institucional em título de página e títulos narrativos principais;
- `--font-sans`: navegação, controles, corpo, números, cards, tabelas, gráficos e títulos operacionais.

Antes de migrar páginas, garantir que Public Sans e Source Serif 4 sejam realmente carregadas. Não adicionar uma terceira família.

| Papel | Token/tamanho | Família | Peso | Uso |
|---|---|---|---:|---|
| Título de página | `--font-size-3xl` / 32 px | serif | 600–700 | Um por página; 28 px no celular |
| Título de seção narrativa | `--font-size-2xl` / 24 px | serif | 600–700 | Explicações legais e grandes blocos |
| Título de seção operacional | `--font-size-xl` / 20 px | sans | 600–700 | Filtros, visão geral, dados de apoio |
| Título de componente | `--font-size-lg` / 18 px | sans | 600–700 | Card, gráfico, tabela |
| Corpo | `--font-size-sm` / 14 px | sans | 400–500 | Padrão da aplicação |
| Corpo confortável | `--font-size-md` / 16 px | sans | 400 | Introduções e textos longos |
| Auxiliar | `--font-size-xs` / 12 px | sans | 500–700 | Ano, fonte, unidade; nunca abaixo de 12 px para conteúdo necessário |
| Dado | 20–32 px conforme contexto | sans | 600–700 | Sempre com números tabulares |

Regras:

- limitar prosa a `--content-reading-max` (72ch);
- não usar `clamp()` para títulos de produto; breakpoints devem controlar a estrutura;
- usar `text-wrap: balance` em h1–h3 e `text-wrap: pretty` em prosa longa;
- não usar caixa alta em títulos completos; reservar para rótulos curtos e não essenciais;
- não usar peso 800 em todos os elementos; contraste de tamanho e espaço deve conduzir a hierarquia.

### 3.3 Estrutura padrão de página

Ordem obrigatória:

1. Shell e navegação global.
2. Barra de contexto com município e caminho atual.
3. `PageHeader` com contexto, `h1`, descrição e ações.
4. Síntese de 3 a 5 informações realmente prioritárias, se houver.
5. Filtros e busca.
6. Resultado principal: lista, gráfico, tabela ou diagnóstico.
7. Aprofundamento progressivo.
8. Fonte, metodologia e data de atualização.

Larguras e alturas:

- conteúdo máximo: `--shell-max` (1380 px);
- sidebar desktop: `--sidebar-width` (264 px);
- barra de contexto: mínimo `--context-bar-height` (70 px);
- padding horizontal: 34 px desktop, 24 px tablet e 16 px celular;
- controles: mínimo `--control-height` e alvo de toque `--touch-target-min`, ambos 44 px;
- uma seção não deve usar altura fixa para acomodar conteúdo textual;
- gráficos devem usar 240, 300 ou 360 px como alturas de referência, nunca largura mínima que corte conteúdo.

### 3.4 Espaçamentos

Usar a escala `--space-*`. O sistema tem base de 4 px e ritmo predominante de 8 px.

| Relação | Espaço padrão |
|---|---:|
| Ícone–rótulo / label–valor curto | 8 px |
| Título–descrição | 8–12 px |
| Elementos dentro de controle/card | 12–16 px |
| Cards irmãos | 16 px |
| Blocos internos de seção | 24 px |
| Seções principais | 32–48 px |
| Mudança de assunto na página | 48–64 px |

Não criar valores locais como 13, 17, 19 ou 27 px sem necessidade comprovada.

### 3.5 Cores e usos semânticos

| Papel | Token | Regra |
|---|---|---|
| Marca/navegação | `--green-brand-dark` | Área de navegação desktop e identidade; não usar como fundo de cards analíticos |
| Ação/seleção | `--green-primary` | Ação primária, seleção atual e foco; não usar como decoração |
| Hover ativo | `--green-deep` | Hover/active de ações primárias |
| Fundo de seleção | `--green-soft` | Seleção leve, info e realce contextual |
| Texto principal | `--text`, `--text-strong` | Corpo e títulos |
| Texto secundário | `--text-secondary`, `--text-subtle` | Descrição e metadado com contraste AA |
| Placeholder | `--text-placeholder` | Nunca usar `--text-muted` para placeholder |
| Superfície | `--surface-card`, `--surface-soft` | Branco para conteúdo; suave para agrupamento secundário |
| Sucesso | `--status-ok-*` | Referência atingida ou limite respeitado; sempre com texto |
| Atenção | `--status-warn-*` | Exige acompanhamento; não significa reprovação |
| Lacuna | `--status-far-*` | Distância relevante ou erro; sempre explicar o critério |
| Sem dados | `--status-muted-*` | Ausência ou indisponibilidade; não confundir com desabilitado |

Os tokens legados `--text-muted`, `--text-faint` e `--chart-axis` permanecem por compatibilidade, mas não devem ser escolhidos para novo texto essencial antes da correção de contraste.

### 3.6 Bordas, raios e sombras

- Cards e painéis: raio de 8 a 16 px; 14 px é o padrão atual.
- Inputs e botões: 8 a 10 px; pill somente para chip, badge e controle segmentado.
- Borda e sombra não devem ser usadas juntas como decoração. Preferir borda em painéis estáticos e sombra discreta em elementos elevados.
- `--shadow-sm` é o padrão; `--shadow-md` ou superior apenas para dropdown, popover e elevação temporária.
- Não usar faixa colorida lateral maior que 1 px. Estado deve ser comunicado por badge, ícone, texto, fundo leve ou borda completa.
- Não aninhar cards somente para obter espaçamento; usar seção e divisor.

## 4. Regras de componentes

### 4.1 Navegação e contexto

- Desktop acima de 1080 px: sidebar fixa, rolável somente se necessário e com item atual explícito.
- Tablet: cabeçalho compacto; não distribuir grupos em alturas desiguais.
- Celular: menu fechado por padrão, acionador de 44 px, título curto e município visível fora do painel do menu.
- O grupo PNE pode expandir/recolher; usar `aria-expanded` e manter somente o grupo necessário aberto.
- Item atual usa `aria-current="page"`; subitem atual também deve ser anunciado.
- Toda navegação de página restaura o topo do conteúdo e foca o `h1` com `tabindex="-1"`.
- A barra de contexto mostra um único seletor de município. Em estado vazio, reutilizar esse seletor ou ocultar a instância global; nunca renderizar duas relações ARIA com o mesmo ID.

### 4.2 Títulos, subtítulos e textos auxiliares

- `PageHeader`: contexto opcional, `h1`, descrição de até 2 linhas e ações.
- `SectionHeader`: h2/h3, descrição e ação contextual opcional.
- Rótulo auxiliar não substitui heading semântico.
- Textos longos devem quebrar naturalmente e permanecer com 65–75 caracteres por linha.
- Metadados essenciais — ano, unidade e fonte — não podem usar contraste ou tamanho de texto “decorativo”.

### 4.3 Cards

Usar card somente quando houver pelo menos uma destas funções:

- agrupar informação que deve ser percebida como unidade;
- oferecer uma ação única e clara;
- permitir comparação entre itens irmãos;
- representar estado persistente.

Anatomia de `IndicatorCard`:

1. tema ou referência;
2. status textual;
3. título;
4. descrição curta, quando necessária;
5. valor atual + unidade + ano;
6. comparação/delta;
7. leitura ou sparkline somente quando agregar decisão;
8. fonte apenas no detalhe ou quando variar por card.

Estados: default, hover, focus-visible, selected, disabled, loading e unavailable. Seleção usa `aria-pressed` ou semântica de opção; não depender apenas de borda verde.

Evitar:

- card dentro de card;
- cinco ou mais métricas com igual peso;
- repetir a mesma informação em card, subtítulo e badge;
- sparkline sem escala, período ou acesso ao valor detalhado;
- altura fixa que corte título ou valor grande.

### 4.4 Seletores, filtros e busca

- Busca e filtros ficam juntos em `FilterToolbar`.
- O campo de busca possui label acessível, ícone decorativo e botão limpar de 44 px quando há texto.
- Chips de filtro usam `aria-pressed`; abas não devem ser usadas para simples filtragem.
- Mostrar resumo: quantidade exibida, tema, município e período.
- Composição de filtros deve ser visível e possuir ação “Limpar filtros”.
- Município: pesquisar antes de montar lista extensa; resultados devem ser limitados ou virtualizados.
- Textos longos devem quebrar dentro do filtro; nunca reduzir fonte abaixo de 12 px.

Estados obrigatórios: default, hover, focus-visible, active/selected, disabled, loading, error e sem resultados.

### 4.5 Botões e estados interativos

- Primário: uma ação dominante por região; fundo `--action-primary-bg` e texto invertido.
- Secundário: superfície clara e borda.
- Terciário: sem fundo, apenas para ações de baixa ênfase.
- Ícone isolado exige nome acessível e alvo mínimo de 44 × 44 px.
- Duração padrão: 120–240 ms, `--ease-out`; animar opacidade e transform, não layout.
- Loading preserva a largura do botão, desabilita novo acionamento e mantém rótulo compreensível.
- Disabled deve continuar legível e não pode ser o único modo de explicar indisponibilidade.

### 4.6 Gráficos

Todo gráfico deve responder, nesta ordem:

1. O que está sendo medido?
2. Em qual unidade?
3. Qual período?
4. Qual é a leitura principal?
5. Há meta ou referência?
6. Qual é a fonte?

Anatomia:

- título operacional em sans;
- resumo textual de uma frase;
- legenda próxima e na mesma ordem visual das séries;
- área do gráfico;
- fonte e nota metodológica;
- alternativa tabular ou resumo acessível.

Eixos e rótulos:

- usar `--chart-axis-text` e tamanho mínimo equivalente a 12 px na renderização final;
- mostrar unidade no eixo ou no título;
- evitar todos os rótulos quando colidem; priorizar início, fim, mínimo, máximo e meta;
- não truncar categoria sem oferecer nome completo em tooltip e tecnologia assistiva;
- anos devem seguir ordem cronológica; categorias só podem ser reordenadas quando a ordenação tem significado declarado.

Legenda:

- não depender apenas de cor; combinar cor com nome e, quando necessário, traço/padrão;
- série principal usa `--chart-series-1`; séries adicionais seguem a ordem dos tokens;
- não reutilizar verde de sucesso para uma série que não representa sucesso.

Tooltip:

- deve abrir por hover e foco;
- conteúdo: série, categoria/ano, valor e unidade;
- não pode ser cortado pelo contêiner;
- não deve ser a única forma de obter o valor;
- usar `--z-tooltip` e respeitar zoom de 200%.

Ausência:

- explicar por que o gráfico não aparece;
- distinguir “sem dados”, “série insuficiente” e “não aplicável”;
- não mostrar eixos vazios ou zero como se fosse dado observado.

### 4.7 Tabelas

- Usar `caption` descritivo, mesmo que visualmente oculto.
- Cabeçalhos de coluna usam `scope="col"`; cabeçalhos de linha, `scope="row"` quando aplicável.
- Texto à esquerda; números, percentuais e moeda à direita; anos centralizados ou alinhados à direita de forma consistente.
- Usar números tabulares.
- Altura de linha mínima de `--table-row-height`.
- Cabeçalho fixo somente quando a tabela realmente rolar verticalmente.
- Em celular, preferir rolagem horizontal claramente indicada; não ocultar colunas silenciosamente.
- Não combinar rolagem vertical interna com página longa para tabelas curtas.
- Valores grandes não podem quebrar no separador monetário; permitir largura adequada ou abreviação apenas em gráficos, nunca em tabela de precisão.
- Estado vazio ocupa a largura da tabela, explica o recorte e oferece recuperação.

### 4.8 Mensagens de carregamento, ausência e erro

`StatePanel` deve conter título, explicação e ação quando existir recuperação.

| Estado | Comportamento |
|---|---|
| Loading | Skeleton para estruturas conhecidas; `role="status"`, `aria-live="polite"` e texto específico, por exemplo “Carregando indicadores de Porto Alegre”. |
| Sem município | Explicar a necessidade da seleção e oferecer um único seletor. |
| Sem dados | Informar indicador/recorte, período consultado e diferença entre zero e ausência. |
| Sem resultados | Repetir filtros ativos e oferecer limpar busca/filtros. |
| Erro | `role="alert"`, linguagem simples, ação tentar novamente e detalhe técnico apenas quando útil. |

Não usar spinner solto no centro de uma área grande nem mensagens genéricas como “Nada aqui”.

## 5. Responsividade

Breakpoints de referência:

- até 620 px: celular;
- 621–820 px: tablet estreito;
- 821–1080 px: tablet/paisagem;
- acima de 1080 px: desktop com sidebar.

Esses quatro intervalos substituem a proliferação atual de 24 breakpoints. Um breakpoint adicional exige comportamento estrutural que não possa ser resolvido com grid/flex fluido.

Regras:

- estrutura muda; tipografia não deve encolher continuamente;
- grids de cards usam `repeat(auto-fit, minmax(280px, 1fr))` quando adequado;
- título e valor longo devem ser testados com 200% de zoom;
- filtros podem rolar horizontalmente somente quando o padrão é reconhecível e o estado ativo permanece visível;
- ações críticas não podem ficar fora da primeira dobra por causa da navegação;
- gráficos devem caber no viewport ou ter rolagem explícita dentro de um contêiner que não seja cortado;
- tabela responsiva mantém cabeçalhos e contexto; não converter automaticamente toda tabela em cards.

Matriz mínima de teste: 320 × 568, 390 × 844, 768 × 1024, 1024 × 768, 1280 × 720 e 1440 × 900.

## 6. Acessibilidade e critérios de aceite

Requisitos não negociáveis:

- contraste de texto normal mínimo 4,5:1; texto grande, 3:1;
- foco visível com contraste mínimo 3:1 e nunca removido sem substituto;
- alvo de ponteiro mínimo 44 × 44 px;
- teclado alcança e opera menu, seletor, filtros, abas, acordeões, gráficos e tabelas;
- ordem de foco acompanha a ordem visual;
- um único `h1` por página; headings sem saltos incoerentes;
- landmark `header`, `nav`, `main`, `aside` e `section` usados conforme função;
- `aria-current`, `aria-selected`, `aria-pressed`, `aria-expanded` e live regions refletem o estado real;
- ícones decorativos ocultos; ícones informativos possuem nome ou texto adjacente;
- estado nunca depende somente de cor;
- zoom de 200% sem perda de conteúdo ou funcionalidade;
- `prefers-reduced-motion` elimina movimento não essencial;
- impressão do diagnóstico preserva contraste, hierarquia, fonte e quebras lógicas.

## 7. Conteúdo e tom

Tom: claro, profissional, responsável, direto e sem jargão desnecessário.

Preferir:

- “Em 2025, o município registra 79%, 21 p.p. abaixo da referência.”
- “Não há dados municipais comparáveis para este recorte.”
- “Limpar filtros e mostrar todos os indicadores.”
- “Fonte: Censo Escolar 2025 — INEP.”

Evitar:

- “Desempenho ruim” sem critério;
- “Município reprovado”;
- “Sem dados” sem explicar o recorte;
- sigla sem expansão na primeira ocorrência;
- “clique aqui”;
- contagem ou percentual sem período e unidade.

## 8. Exemplos do que fazer e evitar

### Fazer

```css
.component {
  gap: var(--space-4);
  padding: var(--space-6);
  border: var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
}
```

```jsx
<button role="tab" aria-selected={isActive} tabIndex={isActive ? 0 : -1}>
  Histórico
</button>
```

### Evitar

```css
.component {
  gap: 13px;
  padding: 19px 23px;
  color: #8c887c;
  border: 1px solid #e8e0d2;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
}
```

```jsx
<div className={isActive ? 'active' : ''} onClick={selectTheme}>
  Histórico
</div>
```

Outros antipadrões proibidos:

- estilos inline para decisões reutilizáveis;
- novo valor de cor, espaço, raio, sombra ou z-index sem token;
- faixa lateral colorida em card;
- nested cards;
- texto em gradiente;
- glassmorphism decorativo;
- animação de entrada em toda seção;
- fonte menor para “fazer caber”;
- overflow escondido para mascarar problema responsivo;
- duplicar componente visualmente equivalente em outro módulo.

## 9. Componentes compartilhados previstos

Ordem sugerida de criação:

1. `AppShell`, `PrimaryNavigation`, `MobileNavigation` e `ContextBar`.
2. `MunicipalitySelector` com IDs únicos e lista eficiente.
3. `PageHeader` e `SectionHeader`.
4. `Button`, `IconButton`, `Tabs`, `SegmentedControl` e `FilterChips`.
5. `FilterToolbar`, `SearchField` e `ResultsSummary`.
6. `SummaryMetric`, `IndicatorCard`, `StatusBadge` e `DeltaValue`.
7. `DetailNavigation` e `QuickReading`.
8. `ChartFrame`, `ChartLegend`, `ChartTooltip`, `ChartEmpty` e alternativa tabular.
9. `DataTable` e `TableContainer`.
10. `StatePanel`, `SourceNote`, `MethodNote` e `InfoHint`.

## 10. Página piloto

Página recomendada: **Indicadores de Educação**, tema **Matrículas e atendimento**, incluindo o detalhe **Total de matrículas**.

Motivos:

- exercita shell, município, cabeçalho, visão geral, busca, temas e cards;
- contém valor grande, percentual, zero, ausência de histórico e textos longos;
- abre detalhe com navegação anterior/próximo, leitura rápida, série histórica, recortes e abas;
- reúne gráficos de linha, barras, barras empilhadas e tabelas;
- compartilha primitivas com PNE e Financeiro;
- permite validar desktop, tablet, celular, teclado, contraste e estados sem tocar em regras analíticas.

Critério de sucesso do piloto: a página deve servir de referência copiável para os outros módulos, com zero estilo local duplicado para padrões já extraídos.

## 11. Plano de implementação por etapas

### Etapa 0 — Baseline e proteção

- atualizar o E2E para os componentes atuais;
- registrar screenshots de referência nas seis resoluções;
- adicionar testes de teclado, contraste, ausência e valores longos;
- estabelecer orçamento inicial de CSS/JS;
- não alterar dados, cálculos ou filtros.

### Etapa 1 — Fundamentos

- consolidar uso de `design-tokens.css`;
- carregar corretamente Public Sans e Source Serif 4;
- reduzir escala tipográfica, espaçamentos, raios, sombras, breakpoints e z-index;
- corrigir tokens de contraste;
- definir camadas CSS e estratégia de migração do `App.css`.

### Etapa 2 — Shell, navegação e contexto

- corrigir restauração de rolagem e foco;
- implementar navegação responsiva compacta;
- padronizar município, breadcrumb e ações globais;
- garantir alvos de 44 px e estados acessíveis.

### Etapa 3 — Primitivas compartilhadas

- criar títulos, botões, filtros, abas, badges, cards e estados;
- substituir gradualmente duplicações sem mudar conteúdo analítico;
- documentar anatomia e testes de cada componente.

### Etapa 4 — Página piloto

- migrar Indicadores de Educação;
- resolver gráficos e tabelas responsivos;
- validar textos longos, números grandes, loading, vazio e erro;
- obter aprovação visual e de uso antes de ampliar.

### Etapa 5 — Visualização de dados

- extrair tooltip, legenda, eixos, paleta e alternativa acessível;
- unificar tabelas e alinhamento numérico;
- eliminar larguras mínimas que causem corte.

### Etapa 6 — PNE e Diagnóstico

- migrar ciclos 2014/2024 e 2026/2036;
- migrar Metas legais e O que é o PNE;
- reduzir densidade do Diagnóstico com divulgação progressiva;
- preservar todas as notas metodológicas e leituras analíticas.

### Etapa 7 — Financeiro

- migrar Aplicação, FUNDEB, VAAR e PNATE;
- validar moeda, séries longas, regras de mínimo e impressão;
- reutilizar os mesmos cards, gráficos, tabelas e estados do piloto.

### Etapa 8 — Remoção de legado e QA final

- remover seletores antigos somente após equivalência visual e funcional;
- medir redução de CSS e duplicações;
- executar lint, build, E2E, auditoria WCAG e teste com gestores;
- atualizar este guia apenas quando houver nova decisão visual legítima.

Após cada etapa, repetir a auditoria de acessibilidade, performance, responsividade, tematização e antipadrões.

## 12. Checklist de revisão

### Estrutura

- [ ] Existe um único `h1` e a página começa no topo após navegação.
- [ ] Município, tema, período e fonte estão claros.
- [ ] A próxima ação é evidente sem ler toda a página.
- [ ] A interface usa seção quando card não é necessário.

### Tokens e consistência

- [ ] Não há cor, espaço, raio, sombra, altura ou z-index local já coberto por token.
- [ ] Componente existente foi reutilizado antes de criar outro.
- [ ] Estados default, hover, focus-visible, active, disabled, loading e error foram considerados.

### Dados

- [ ] Valor inclui unidade e ano.
- [ ] Meta, distância e direção estão semanticamente corretas.
- [ ] Zero é diferente de ausência.
- [ ] Fonte e limitação permanecem visíveis.
- [ ] Nenhuma regra de negócio foi alterada por ajuste visual.

### Gráficos e tabelas

- [ ] Tooltip funciona por ponteiro e teclado.
- [ ] Eixos, legenda, unidade e fonte são legíveis.
- [ ] Há alternativa textual ou tabular.
- [ ] Números estão alinhados e usam algarismos tabulares.
- [ ] Tabela tem caption e headers associados.

### Responsividade e acessibilidade

- [ ] Testado em 320, 390, 768, 1024, 1280 e 1440 px.
- [ ] Testado com zoom de 200% e texto longo.
- [ ] Nenhum conteúdo é cortado ou escondido por overflow.
- [ ] Alvos interativos têm no mínimo 44 × 44 px.
- [ ] Contraste atende WCAG 2.2 AA.
- [ ] Ordem de foco e estados ARIA correspondem à interface.
- [ ] Movimento reduzido está coberto.

## 13. Ações recomendadas após aprovação

1. **P1 — `$impeccable adapt`**: corrigir shell responsivo, navegação, gráficos e tabelas na página piloto.
2. **P1 — `$impeccable harden`**: corrigir semântica, teclado, estados, contraste e seletor municipal.
3. **P2 — `$impeccable typeset`**: alinhar fontes carregadas, hierarquia e tamanhos mínimos.
4. **P2 — `$impeccable distill`**: reduzir cards e camadas sem remover conteúdo analítico.
5. **P3 — `$impeccable polish`**: concluir consistência visual e microestados após todas as migrações.
