# Proposta de sistema visual comum — Dashboard PNE

> **Status: histórico.** Preservada como proposta anterior à aprovação da gramática atual; não define regras ou pendências ativas. Consulte `../GUIA_DE_DESIGN.md` e `../PLANO_MIGRACAO_UI.md`.

> Documento de auditoria e proposta. Não representa implementação aprovada. Nenhum componente, dado ou regra de negócio foi alterado nesta etapa.

## 1. Escopo e método

A proposta parte da interface atual, do `../GUIA_DE_DESIGN.md`, dos tokens existentes em `src/styles/design-tokens.css`, de uma varredura dos componentes e de inspeção do dashboard local no navegador. O objetivo é reduzir variações acidentais sem redesenhar a plataforma.

Evidências principais:

- `App.css` concentra cerca de 20,8 mil linhas e ainda contém muitas decisões locais: 174 valores hexadecimais, 118 tamanhos de fonte, 29 raios e 84 sombras distintos em varredura textual;
- os tokens já definem escalas coerentes de cor, espaçamento, raio, sombra, controles e gráficos, mas sua adoção é parcial;
- componentes equivalentes foram criados em famílias separadas para PNE, educação, finanças, diagnóstico e metas legais;
- a sessão local auditada não expôs famílias carregadas em `document.fonts`; a interface calculou `Public Sans` e `Source Serif 4`, mas recorreu às fontes de fallback;
- a identidade atual — verde institucional, fundos quentes, superfícies claras e títulos serifados — é reconhecível e deve ser preservada.

## 2. Princípios visuais

1. **Mesma função, mesma aparência.** Variações devem comunicar função ou estado, não apenas a origem do módulo.
2. **Texto explica o dado.** Interação deve ser percebida por forma, cursor, foco e estado; não por instruções como “clique aqui”.
3. **Hierarquia antes de decoração.** Título, valor, referência, contexto e fonte devem ter ordem previsível.
4. **Cor tem papel definido.** Verde institucional não substitui automaticamente “positivo”, e vermelho não deve ser usado fora de condição negativa real.
5. **Superfícies estáveis.** Cards informativos não se elevam; cards exploráveis e de navegação têm resposta discreta e consistente.
6. **Tokens antes de valores locais.** A proposta reutiliza a escala existente e só recomenda novos aliases quando uma função ainda não está nomeada.
7. **Variação específica é permitida.** Projeções, tabelas extensas e gráficos comparativos podem ter estrutura própria, desde que compartilhem moldura, tipografia e estados.

## 3. Inventário de componentes

### 3.1 Famílias atuais

| Grupo | Componentes e ocorrências | Diferenças observadas | Direção de consolidação |
| --- | --- | --- | --- |
| Cards de resumo | `StatCard` na Home; `EducationSummaryCard` em educação e finanças; `MetricCard` nos detalhes; `ManagementMetricCard` em `CyclePage`; `SummaryMetric` no diagnóstico; `SummaryCard` em metas legais; cartões locais em Fundeb, SIOPE e VAAR | Raios de 14–16 px, sombras e preenchimentos diferentes; valor ausente alterna entre `—` e `-`; alguns usam cor por tom, outros apenas tipografia | Base `SummaryCard` não clicável, com variantes de densidade e tom semântico |
| Cards de indicador | `MetaCard`, `EducationIndicatorCard`, `FinancialIndicatorCard` e linhas/cartões internos de Fundeb, Pnate, Sistema S e VAAR | Todos abrem detalhe, mas só alguns têm estado selecionado; hover e elevação variam; o affordance direcional não é comum | Base `IndicatorCard` explorável, preservando slots próprios de status, valor, meta e sparkline |
| Cards de navegação | `home-entry-card`, `pne-entry-card`, `educacao-module-card` e cartões de escopo | Misturam botão, link e tab; ícones, setas e sombras não seguem uma regra única | `NavigationCard` para mudança de módulo/página e `ModuleTab` para troca de conteúdo no mesmo contexto |
| Painéis de gráficos | `IndicatorHistoryChart`, `EducationLineChart`, `EducationBarChart`, `EducationStackedBarChart`, `ComplementaryEnrollmentChart`, `AdministrativeDependencyChart`, `IndicatorProjectionPanel` e molduras financeiras | Cabeçalho, altura, legenda, tooltip, fonte e estado sem dados variam; parte dos pontos aceita teclado e parte aceita apenas mouse | `ChartPanel` como moldura; primitivas específicas para linha, barra, comparação e projeção |
| Painéis de tabelas | `EducationTable` e tabelas locais em Fundeb, SIOPE, Sistema S, VAAR e dados de apoio | Densidade, cabeçalho, rolagem, alinhamento numérico e vazio não são uniformes | `DataTablePanel` com cabeçalho, unidade, rolagem e estado vazio previsíveis |
| Avisos e fontes | `DataSourceNote`, `SourceLine`, aviso metodológico de metas legais, caixas de interpretação e notas financeiras | “Fonte” e “Fontes” usam estruturas distintas; avisos metodológicos competem visualmente com painéis analíticos | `MethodNote` para ressalvas e `SourceLine` única para fonte/período |
| Filtros, chips e abas | `CategoryTabs`, chips de etapa, temas das metas, módulos financeiros, recortes de gráfico e tabs de detalhamento | Controles semelhantes usam semântica e alturas distintas; `CategoryTabs` declara `tablist`, mas os filhos não são `tab` nem expõem seleção | Quatro primitivas: `Tabs`, `FilterChips`, `SegmentedControl` e `Select/SearchField` |
| Botões e links | navegação lateral, voltar, anterior/próximo, copiar, imprimir, links legais e ações em estados | Ações de detalhe chegam a 33 px; botões secundários e links de navegação podem parecer equivalentes | `Button` por hierarquia e `TextLink` apenas para destino navegável |
| Badges e estados | `StatusBadge`, `area-status`, `coverage-badge`, `vaar-status-chip` e chips locais | Mesmo papel usa raio, caixa alta, cor e peso diferentes; alguns tons são estruturais, outros semânticos | `Badge` com variantes `status`, `coverage`, `category` e `neutral` |
| Cabeçalhos | shell (`Header` e `ContextBar`), heróis de página, `SectionHeader` e cabeçalhos locais | O breadcrumb existe, porém está oculto por CSS; diagnóstico começa em `h2`; ordem entre título, contexto, resumo e filtros varia | `PageHeader` e `SectionHeader` comuns, sem criar nova faixa visual |
| Tooltips | tooltips SVG nos gráficos e textos nativos em alguns elementos | Aparência, ativação por teclado e conteúdo variam | Tooltip único, disponível por ponteiro e foco, com valor, ano/categoria e unidade |
| Estados | `LoadingState`, `ErrorState` e estados locais de vazio/erro em painéis financeiros | Sem `role=status`/`alert` nos compartilhados; mensagens e ações diferem; vazio de busca não oferece limpar filtro | `StatePanel` com variantes `loading`, `empty`, `error` e `unavailable` |

### 3.2 Variantes justificadas

- O `MetaCard` precisa manter meta, distância e status do ciclo, campos que não pertencem aos indicadores educacionais comuns.
- Painéis de projeção precisam distinguir trecho observado e trecho projetado e podem usar linguagem tendencial exclusivamente nesse módulo.
- Tabelas financeiras extensas precisam de rolagem e cabeçalhos próprios.
- Cards legais expansíveis funcionam como acordeão e devem manter chevron e estado expandido.
- Home pode usar cards de entrada mais expressivos que cards analíticos, desde que a gramática de navegação seja a mesma.

### 3.3 Variações que podem ser consolidadas

- moldura, raio e foco de `MetaCard`, `EducationIndicatorCard` e `FinancialIndicatorCard`;
- sparkline duplicada nos três tipos de indicador;
- `DataSourceNote` e `SourceLine`;
- cards de resumo locais e `EducationSummaryCard`/`MetricCard`;
- estados vazios e de carregamento locais;
- tabs temáticas de PNE, educação e finanças;
- moldura de histórico compartilhada por educação, finanças e PNE.

## 4. Tipografia

### 4.1 Diagnóstico atual

- `index.html` solicita **Inter** e **Plus Jakarta Sans** nos pesos 400–800.
- Os tokens declaram **Public Sans** para textos/controles e **Source Serif 4** para títulos.
- A inspeção local calculou `Public Sans, system-ui, ...` no corpo e `Source Serif 4, Georgia, ...` nos títulos, mas `document.fonts` não listou famílias carregadas. Na prática, a aparência dependeu de `system-ui` e `Georgia` nessa sessão.
- Inter e Plus Jakarta Sans não aparecem na pilha principal dos tokens; portanto, o carregamento atual não garante a tipografia declarada.
- A folha principal contém pesos locais como 650, 750, 760, 800, 820, 850 e outros. Fontes sem esses cortes podem sintetizar peso, alterar largura e reduzir nitidez.
- A escala de tokens já é suficiente (`11, 12, 14, 16, 18, 20, 24, 32 e 40 px`), mas há 118 tamanhos distintos na folha consolidada.

Regras comuns propostas, independentemente da alternativa aprovada:

- usar apenas 400, 500, 600 e 700; reservar 800 para um caso explicitamente validado;
- corpo em 14–16 px, controles em no mínimo 14 px e textos auxiliares em no mínimo 12 px;
- evitar caixa alta em frases; quando necessária em rótulos curtos, usar espaçamento moderado e 12 px;
- valores tabulares devem usar algarismos alinhados (`font-variant-numeric: tabular-nums`);
- títulos longos devem usar `line-height: 1.2–1.35`, sem truncamento quando forem a identificação principal.

### 4.2 Alternativa A — uma família

**Public Sans em toda a plataforma**, carregada explicitamente e usada por títulos, valores, textos e controles.

- Vantagens: uma única métrica tipográfica, carregamento e QA mais simples, menos síntese de peso e maior previsibilidade em tabelas e cards compactos.
- Riscos: reduz o contraste institucional hoje produzido pelo fallback serifado; títulos podem parecer mais utilitários.
- Quebras de linha: títulos serifados atuais tendem a mudar de largura; revisar especialmente cards legais e detalhes com títulos longos.
- Pesos: 400 para corpo, 500 para controles, 600 para subtítulos/valores, 700 para títulos.
- Validação reforçada: Home, metas legais, cabeçalhos de ciclos, diagnóstico, títulos de indicadores e tabelas financeiras.

### 4.3 Alternativa B — duas famílias

**Source Serif 4** para títulos principais e valores de destaque; **Public Sans** para corpo, controles, tabelas, badges e metadados. Ambas carregadas explicitamente.

- Vantagens: preserva mais diretamente a identidade atual e separa conteúdo editorial de operação.
- Riscos: dois downloads e mais combinações a testar; serifas em valores compactos podem prejudicar alinhamento se usadas em excesso.
- Quebras de linha: a Source Serif real pode diferir bastante do fallback Georgia; revisar alturas uniformes e títulos legais.
- Pesos: Source Serif 4 em 600/700; Public Sans em 400/500/600/700.
- Validação reforçada: Home, PNE overview, metas legais, resumos de ciclos, valores grandes, gráficos e celular.

Não é recomendado manter simultaneamente quatro famílias. Inter e Plus Jakarta Sans só devem ser retiradas após uma alternativa ser aprovada e validada.

## 5. Paleta funcional reduzida

### 5.1 Inventário por função

| Função | Tokens existentes recomendados | Uso comum |
| --- | --- | --- |
| Institucional | `--green-brand-dark`, `--green-primary`, `--green-deep`, `--green-soft` | shell, ação primária, seleção e realce discreto |
| Fundo | `--bg-body`, `--bg-app` | fundo externo e área de trabalho |
| Superfície | `--surface-card`, `--surface-soft`, `--surface-muted` | cards, painéis e blocos auxiliares |
| Borda | `--border-card`, `--border-line` | contorno de card e divisores |
| Texto | `--text-strong`, `--text`, `--text-body`, `--text-soft`, `--text-inverted` | títulos, corpo, apoio e texto sobre fundo escuro |
| Positivo | `--status-ok-ink/bg/line` | somente resultado/estado positivo comprovado |
| Negativo | `--status-far-ink/bg/line` | somente resultado/estado negativo comprovado |
| Atenção | `--status-warn-ink/bg/line` | ressalva ou atenção metodológica, não status genérico |
| Ausência de dados | `--status-muted-ink/bg/line` | leitura indisponível ou não conclusiva |
| Gráficos | `--chart-primary`, `--chart-secondary`, `--chart-series-2…6`, `--chart-grid`, `--chart-axis` | séries quantitativas, grade e eixos |

### 5.2 Problemas observados

- existem muitos brancos quentes, beges, verdes e cinzas quase equivalentes fora dos tokens;
- gráficos de educação usam azuis, verdes, âmbar e roxos hardcoded que não coincidem com a sequência de séries dos tokens;
- verde atua como marca, seleção, série de gráfico e status positivo; sem contexto, pode sugerir avaliação onde há apenas categoria;
- cores semânticas aparecem em badges e elementos estruturais com significados distintos;
- `--text-muted` e `--text-faint` são frágeis para informação essencial sobre superfície branca; devem ficar restritos a decoração ou metadados não críticos;
- ativos em tabs, chips e navegação lateral nem sempre usam a mesma combinação de preenchimento, borda e peso.

### 5.3 Regra proposta

- manter a paleta atual e eliminar gradualmente valores equivalentes em favor dos tokens acima;
- reservar `status-*` para estados semânticos; categorias de gráfico usam `chart-series-*`;
- seleção usa `green-soft` + `green-deep` + borda `green-primary`, sem assumir sucesso;
- informação essencial usa no mínimo `--text-soft`; `--text-muted` e `--text-faint` não devem carregar fonte, ano, unidade ou ação sozinhos;
- uma superfície deve usar no máximo fundo, borda e uma cor semântica; evitar combinar faixa lateral, badge, ícone e fundo para repetir o mesmo estado.

## 6. Espaçamentos, bordas, raios e sombras

### 6.1 Escala comum

Usar a escala já existente de 4 px, com ritmo principal de 8 px:

- 4 px: separação interna mínima;
- 8 px: ícone–rótulo e metadados próximos;
- 12 px: blocos compactos;
- 16 px: padding de controles e cards compactos;
- 20–24 px: padding de cards e painéis padrão;
- 24–32 px: intervalo entre seções;
- 40–48 px: separação de blocos de página, apenas quando necessária.

### 6.2 Bordas e raios

- cards e painéis: `1px solid var(--border-card)`;
- divisores: `1px solid var(--border-line)`;
- foco: `--focus-ring`, sem substituir a borda permanente;
- controles: `--radius-sm` (8 px);
- cards/painéis: `--radius-md` (14 px);
- cards de entrada maiores podem manter `--radius-lg` (16 px);
- pills apenas para chips, status e contagens curtas.

### 6.3 Sombras

- informativo e painel analítico: nenhuma sombra ou `--shadow-sm`;
- explorável/navegação em repouso: `--shadow-sm`;
- hover explorável: no máximo `--shadow-md`, sem salto maior que 1 px;
- dropdown/popover: `--shadow-lg` ou `--shadow-xl`;
- não usar múltiplas sombras locais para diferenciar módulos.

## 7. Padrões de cards e painéis

| Padrão | Função e estrutura | Visual proposto | Interação | Componentes candidatos |
| --- | --- | --- | --- | --- |
| Card de resumo | rótulo, valor, ano/período e apoio curto | padding 16 px; raio 14 px; borda; sem elevação reativa; valor dominante | não clicável por padrão; sem hover, seta ou cursor | `EducationSummaryCard`, `MetricCard`, `SummaryMetric`, `SummaryCard`, `ManagementMetricCard`, `StatCard` sem `onClick` |
| Card de indicador | categoria/status, título, descrição curta, valor atual, referência e visual compacto opcional | padding 16–20 px; raio 14 px; borda; sombra mínima; altura alinhada por conteúdo, não por truncamento agressivo | card inteiro como botão/link; cursor pointer; hover sutil; foco visível; chevron pequeno em posição fixa; estado selecionado distinto | `MetaCard`, `EducationIndicatorCard`, `FinancialIndicatorCard` |
| Card de navegação | ícone funcional, destino, resumo curto e seta | padding 20–24 px; raio 14–16 px; identidade institucional, sem cor de status | botão para estado interno ou link para URL; hover/foco comuns; seta apenas quando indica deslocamento | `home-entry-card`, `pne-entry-card`, cartões de escopo |
| Painel analítico | cabeçalho, contexto/unidade, gráfico ou tabela, fonte e nota | padding 20–24 px; raio 14 px; borda; sem hover | não clicável; somente controles e marcas internas respondem | painéis de histórico, tabelas, composição e apoio |
| Aviso metodológico | rótulo curto, mensagem e, se necessário, ligação para método | padding 16–20 px; raio 8–14 px; superfície neutra ou atenção; sem sombra | não clicável, salvo link explícito; `role=note` quando adequado | metas legais, projeção, fontes e ressalvas financeiras |

Regras adicionais:

- chevron identifica abertura/navegação, não decoração; não deve aparecer em card informativo;
- uma única área clicável por card; evitar título e botão duplicando o mesmo destino;
- status deve permanecer texto legível, não apenas cor;
- alturas uniformes só são desejáveis dentro da mesma grade e quando não provocam truncamento de títulos.

## 8. Padrões de gráficos

### 8.1 Moldura comum

Todo gráfico deve seguir: título → contexto curto/unidade → visual → legenda quando necessária → fonte/período → nota metodológica opcional. O painel define altura com `--chart-height-sm/md/lg`; o SVG não define tipografia ou fundo próprios fora dos tokens.

### 8.2 Tipos

| Tipo | Regra proposta |
| --- | --- |
| Histórico | linha principal de 2–2,5 px; grade discreta; eixos com `chart-axis`; primeiro e último ponto legíveis; meta em linha tracejada e rótulo textual quando aplicável; tooltip por foco e ponteiro |
| Sparkline | linha de 2–2,5 px, último ponto, período inicial–final e texto alternativo; sem grade/eixos completos; vazio explícito e compacto |
| Barras | cor por série/categoria, não por status salvo quando o gráfico é de status; rótulo/unidade consistentes; cada barra/segmento focável |
| Comparação | sequência `chart-series-1…6`; legenda próxima; mesma categoria mantém cor dentro do gráfico; não reutilizar verde/vermelho para inferir aprovação |
| Projeção | observado em linha sólida e projeção em tracejado; marco de transição e hipótese visíveis; linguagem tendencial restrita a este painel |
| Complementar | mesma moldura, tooltip e fonte; adaptações de densidade para muitas categorias sem criar uma estética paralela |

### 8.3 Diferenças atuais a remover gradualmente

- `IndicatorHistoryChart`, projeção e gráficos complementares oferecem foco nos pontos; `EducationLineChart`, `EducationBarChart` e `EducationStackedBarChart` dependem de hover;
- tooltips variam em forma e conteúdo;
- séries de educação usam cores locais, enquanto PNE/finanças usam tokens;
- sparklines de PNE, educação e finanças duplicam implementação e tratam ausência/período de formas diferentes;
- alturas, nota de fonte e destaque do último ponto não seguem um contrato comum.

## 9. Filtros e controles

| Controle | Quando usar | Aparência e semântica |
| --- | --- | --- |
| Aba | alterna visões irmãs dentro do mesmo contexto | `tablist` + `tab`, `aria-selected`, foco por setas; altura mínima 44 px; indicador ativo persistente |
| Chip de filtro | adiciona/remove critério e pode combinar com outros | botão com `aria-pressed`; pill ou raio 8 px; contagem opcional; ação “Limpar filtros” separada |
| Segmented control | escolha única entre poucos recortes do mesmo gráfico | grupo rotulado; botões com `aria-pressed`; mesma largura quando possível |
| Seletor | escolha em conjunto longo ou hierárquico | label persistente, valor atual e menu; município continua no contexto global |
| Busca | reduz a lista atual | label acessível, placeholder exemplificativo e limpar campo; resultado conta o conjunto filtrado |
| Botão | executa ação | verbo claro; primário para ação principal, secundário para apoio, discreto para navegação local |
| Link | muda de URL ou abre recurso | sublinhado/estado de foco reconhecível; não usar link para alternar estado sem URL |

`CategoryTabs` deve ser decidido como aba ou filtro. Nos ciclos e temas de educação, o comportamento atual é mais próximo de filtro exclusivo; nesse caso, a semântica recomendada é grupo de botões com `aria-pressed`, não `tablist` incompleto.

## 10. Estados do sistema

| Estado | Mensagem padrão | Comportamento |
| --- | --- | --- |
| Carregando | “Carregando dados…” | `role=status`, `aria-live=polite`; manter o espaço do conteúdo quando possível |
| Sem dados para o recorte | “Dados não disponíveis para este recorte.” | sem cor de erro; preservar filtros e fonte quando conhecida |
| Sem histórico | “Histórico não disponível.” | no espaço do gráfico, sem eixo vazio |
| Filtro sem resultado | “Nenhum indicador corresponde aos filtros.” | oferecer botão “Limpar filtros”; não usar instrução longa |
| Erro | “Não foi possível carregar os dados.” | `role=alert`; ação “Tentar novamente” quando houver retry |
| Conteúdo indisponível | “Conteúdo indisponível no momento.” | explicar causa somente se conhecida e útil |
| Valor pontual ausente | `—` | usar em célula/valor; manter unidade fora do traço somente se aplicável |

Na inspeção local, educação mostrou “Nenhum indicador disponível para este tema ou busca.” e metas legais mostrou “Nenhuma meta com acompanhamento municipal comparável encontrada para os filtros selecionados.”. Ambas são compreensíveis, mas não compartilham estrutura, semântica viva ou ação de limpeza.

## 11. Critérios de aceite para uma implementação futura

- nenhuma mudança em dados, cálculos, status, regras ou pipeline;
- comparação visual das páginas equivalentes antes/depois;
- desktop, tablet e celular, incluindo títulos longos e valores grandes;
- teclado, foco visível, tooltip por foco e alvo mínimo de 44 px;
- contraste de texto, estados, seleção e gráficos;
- carregamento, erro, ausência, sem histórico e filtros sem resultado;
- lint, build e testes relevantes;
- remoção de regra duplicada somente depois de confirmar todos os consumidores.
