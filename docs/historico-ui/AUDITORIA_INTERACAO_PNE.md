# Auditoria de interação e navegabilidade — Dashboard PNE

> **Status: histórico.** Preservada como evidência da auditoria original; não define regras ou pendências ativas. Consulte `../GUIA_DE_DESIGN.md` e `../PLANO_MIGRACAO_UI.md`.

> Auditoria realizada sobre a aplicação local e o código atual. Este documento não autoriza nem aplica mudanças. Dados, cálculos, status e regras de negócio permanecem fora do escopo.

## 1. Resumo executivo

A navegação principal é compreensível e o dashboard já preserva bem o município selecionado e parte dos filtros internos. O maior problema não é falta de conteúdo, mas a ausência de uma gramática única: cards visualmente próximos podem significar resumo, detalhe, navegação, acordeão ou aba.

Os dois riscos comportamentais mais relevantes são:

1. a troca entre PNE 2014–2024 e PNE 2026–2036 pode manter um detalhe aberto do outro ciclo;
2. toda a navegação vive em estado React sem alterar a URL, o que impede Voltar/Avançar do navegador, links diretos e restauração confiável de página/detalhe.

A solução recomendada é incremental. Primeiro devem ser estabilizados tokens, tipografia e gramática de cards/controles. A navegação por URL fica para o lote estrutural final.

## 2. Evidências e cobertura

Foram inspecionados no navegador local:

- Home;
- visão geral do PNE;
- PNE 2014–2024 e PNE 2026–2036;
- diagnóstico municipal;
- metas legais;
- indicadores de educação e finanças;
- detalhe de indicador, histórico, dados de apoio e projeção;
- filtros temáticos, busca, seletor municipal, tabs e chips;
- navegação lateral, retorno para lista, troca de ciclo e rolagem.

Também foram examinados `App.jsx`, `Header.jsx`, `ContextBar.jsx`, `CyclePage.jsx`, as páginas e os componentes compartilhados. A inspeção automatizada confirmou que a URL permaneceu `http://127.0.0.1:4173/` durante mudanças de módulo e detalhe.

### Saúde técnica visual — escala 0 a 4

| Dimensão | Nota | Evidência resumida |
| --- | ---: | --- |
| Acessibilidade | 2 | foco visível e vários SVGs focáveis já existem; tabs incompletas, alvos de 30–33 px e gráficos dependentes de mouse reduzem a consistência |
| Performance visual | 2 | grande volume de CSS e primitivas duplicadas aumenta custo de manutenção e recálculo; não foi detectado bloqueio funcional na navegação auditada |
| Theming/tokens | 1 | tokens são bons, porém há 174 hexadecimais, 84 sombras e 29 raios distintos na folha consolidada |
| Responsividade | 2 | há adaptações, mas 23 breakpoints diferentes e alturas locais tornam os comportamentos menos previsíveis |
| Anti-padrões visuais | 2 | identidade é coerente, porém há excesso de variantes locais, pesos sintéticos e cards com funções distintas muito parecidos |
| **Total** | **9/20** | base funcional, com fragilidade de consistência e manutenção |

## 3. Gramática de interação proposta

| Classe | Função | Sinal visual obrigatório | Sinal proibido |
| --- | --- | --- | --- |
| A — informativo | apresenta resumo, valor, fonte ou análise sem abrir conteúdo | borda/superfície estáveis; cursor padrão | hover com elevação, chevron, `cursor:pointer` |
| B — explorável | abre o detalhe do mesmo objeto | card inteiro clicável, hover sutil, foco visível, chevron pequeno, estado selecionado quando aplicável | texto “clique para saber mais”, animação chamativa |
| C — navegação | muda página, módulo ou destino | botão/link semântico, seta discreta, estado ativo no destino | aparência de status ou ação duplicada dentro do card |
| D — controle/filtro | altera a visão atual | rótulo do grupo, seleção persistente, `aria-selected`/`aria-pressed`, alvo mínimo de 44 px | parecer card de conteúdo ou link externo |

O chevron não é decorativo: só aparece em B ou C e sempre indica abertura/deslocamento. Elementos A não reagem ao ponteiro.

## 4. Mapa de elementos clicáveis

| Página/área | Elemento atual | Classe | Estado atual | Ajuste mínimo proposto |
| --- | --- | --- | --- | --- |
| Shell | itens do menu lateral em `Header` | C | botão, item ativo visível; URL não muda | manter aparência e, no lote 5, associar cada destino a URL |
| Shell | `MunicipalitySelector` | D | combobox com limpeza, lista e persistência local | manter; padronizar altura/foco com demais seletores |
| Home | `home-entry-card` | C | card inteiro, cursor e elevação; affordance direcional não é comum | aplicar seta/chevron único e hover compartilhado |
| Home | cards estatísticos | A | não clicáveis e sem cursor | manter estáticos; aproximar da base de resumo |
| O que é o PNE | `pne-entry-card` | C | botões de navegação com elevação | adotar o mesmo padrão da Home |
| O que é o PNE | `details/summary` conceituais | B | marcador nativo e expansão local claros | preservar acordeão e uniformizar foco |
| Metas legais | filtros de tema | D | botões com `aria-pressed`; alvo adequado | adotar primitive `FilterChips` |
| Metas legais | `legal-goal-toggle` | B | botão de largura total, chevron e expansão claros | preservar; alinhar borda/foco ao card explorável |
| Ciclos PNE | `CategoryTabs` | D | grupo chamado de tablist, mas botões sem papel/seleção semântica | tratar como filtro exclusivo com `aria-pressed` ou completar tabs |
| Ciclos PNE | chips de etapa | D | botões visuais sem estado semântico comum | `FilterChips` com seleção exposta |
| Ciclos PNE | `MetaCard` | B | botão inteiro, cursor e estado selecionado; sem chevron comum | adotar chevron e hover do card explorável |
| Diagnóstico | links de seção | C | âncoras internas claras, alvo em torno de 40 px | elevar alvo a 44 px e manter posição/âncora previsíveis |
| Diagnóstico | cards de resumo e área | A | sem cursor e sem hover relevante | manter não clicáveis |
| Diagnóstico | filtros de área/status | D | aparência ativa por classe, sem `aria-pressed` consistente | expor seleção e compartilhar filtro |
| Educação | temas em `CategoryTabs` | D | mesmo problema semântico dos ciclos | filtro exclusivo comum |
| Educação | `EducationIndicatorCard` | B | botão inteiro e `aria-label`; sem chevron/seleção persistente comum | card explorável compartilhado |
| Educação | voltar/anterior/próximo | C | retorno funciona; navegação aparece acima e abaixo; alvos de cerca de 33 px | manter duplicação em páginas longas, mas usar alvo mínimo e mesma barra |
| Educação | recorte do histórico | D | botões com `aria-pressed`; cerca de 30 px | aumentar alvo e compartilhar segmented control |
| Educação | tabs de dados de apoio | D | `tablist`, `tab` e `aria-selected` corretos | usar como referência semântica para as demais abas |
| Finanças | `educacao-module-card` | D | cards com `role=tab` e `aria-selected`; parecem navegação | renomear visualmente como seletor de módulo, sem seta de navegação |
| Finanças | `FinancialIndicatorCard` | B | botão inteiro e `aria-label`; sem chevron comum | adotar card explorável compartilhado |
| Gráficos | pontos de PNE, projeção e complementares | B | tooltip disponível por ponteiro e foco | manter e compartilhar implementação |
| Gráficos | pontos/barras de educação | B | tooltip somente por `onMouseEnter/onMouseLeave` | adicionar foco e rótulo acessível no lote de gráficos |

## 5. Aparência ambígua

### 5.1 Clicáveis que parecem estáticos

- `MetaCard`, `EducationIndicatorCard` e `FinancialIndicatorCard` dependem principalmente do hover. Em tela tátil, o affordance de detalhe diminui porque não há chevron comum.
- cards de módulo financeiro são tabs, mas têm volume e formato de card de navegação.
- temas em `CategoryTabs` parecem simultaneamente aba, filtro e card temático; o estado ativo não é semanticamente exposto.
- marcas de alguns gráficos de educação produzem tooltip, mas não indicam que recebem interação e não aceitam foco.

### 5.2 Estáticos que se aproximam de clicáveis

- cards de resumo compartilham borda, raio, sombra e, em alguns módulos, cor de destaque com cards exploráveis. Em repouso, a diferença é pequena.
- painéis analíticos e cards de indicador podem ter a mesma elevação, mesmo que só o segundo abra detalhe.
- badges de categoria, cobertura e status usam formatos próximos; a cor pode sugerir ação ou avaliação sem que exista nenhuma.

### 5.3 Padrões já claros e que devem ser preservados

- acordeões de metas legais têm chevron e área clicável explícita;
- seletor municipal comunica combobox e mantém o município;
- item ativo no menu lateral é perceptível;
- cards informativos do diagnóstico não exibem cursor de clique;
- tabs de detalhamento do indicador usam `role=tab` e `aria-selected` corretamente.

## 6. Estrutura comparada das páginas

| Página | Estrutura atual | Variação/risco | Estrutura comum recomendada |
| --- | --- | --- | --- |
| Home | título/contexto → entradas → resumo | página de entrada, sem filtros ou fonte | exceção válida: identificação → atalhos → visão geral |
| PNE overview | título/contexto → base/conceitos → acessos → conteúdo expansível | muitos tipos de card na mesma página | identificação → título → contexto → acessos → conteúdo legal/metodológico |
| PNE 2014–2024 | identificação do ciclo → resumo → busca/temas/etapas → cards → detalhe | lista e detalhe dependem de estado local | identificação → título → contexto → resumo → filtros → conteúdo → fonte |
| PNE 2026–2036 | mesma base do ciclo anterior, com textos/status próprios | troca de ciclo pode herdar detalhe aberto | mesma estrutura, com estado explicitamente isolado por ciclo |
| Diagnóstico | título interno começa em `h2` → ações → âncoras → resumo → filtros → áreas | shell e página geram hierarquia de títulos inconsistente | identificação → `h1` da página → contexto → resumo → filtros/âncoras → conteúdo → fonte |
| Metas legais | título → base legal → resumo → aviso → filtros → acordeões | boa sequência; texto de orientação acima dos filtros é longo | manter; reduzir orientação de interface e deixar contexto legal |
| Educação | título → resumo → temas/busca → cards → detalhe e apoio | detalhe mantém resumo e controles superiores, aumentando percurso | manter contexto; ao abrir detalhe, tornar retorno e título selecionado prioritários |
| Finanças | título → módulos → resumo/filtros → cards/painéis → detalhe | seletor de módulo parece navegação por card | identificar o controle como seleção interna e manter estrutura comum |
| Detalhe | retorno/navegação → título → métricas → histórico → apoio → retorno | navegação duplicada é útil em página longa, mas pequena; URL não representa o detalhe | barra local comum no topo e rodapé, título, resumo, histórico, apoio, fonte |
| Dados complementares | dentro do módulo de educação, com tabs e gráficos próprios | pode parecer um novo módulo sem mudança clara de contexto | manter identificação de educação e usar painel analítico comum |

A sequência “identificação → título → contexto curto → resumo → filtros → conteúdo → fonte/metodologia” serve como padrão, não como molde rígido. Home e PNE overview são exceções justificadas.

O `ContextBar` já possui breadcrumb/metadados, mas esses trechos estão ocultos por CSS. Antes de criar novo cabeçalho, deve-se decidir se esse componente existente pode expor contexto suficiente sem adicionar uma faixa grande.

## 7. Navegação e preservação de contexto

### 7.1 Comportamentos confirmados

- O município Porto Alegre permaneceu selecionado após mudanças de página e é persistido por `MunicipalityContext` em `localStorage`.
- O retorno interno de detalhes de ciclo, educação e finanças preservou tema/categoria e restaurou aproximadamente a região anterior da lista.
- A troca PNE 2026 → PNE 2014 → PNE 2026 preservou a categoria escolhida, o que é desejável quando não há detalhe aberto.
- O menu lateral deixa claro o módulo ativo.

### 7.2 Problemas de ida e volta

| Evidência | Impacto | Causa provável | Recomendação |
| --- | --- | --- | --- |
| Abrir um indicador em PNE 2026 e trocar para PNE 2014 manteve o detalhe aberto; ao voltar a 2026 ele continuou aberto | risco de interpretar indicador e status no ciclo errado | `CyclePage` mantém `stage`/`indicator` ao mudar a prop `cycle` e o React reutiliza o componente | ao mudar `cycle`, fechar detalhe e limpar seleção incompatível; preservar somente filtros válidos |
| URL não muda entre Home, módulos, listas e detalhes | Voltar/Avançar sai do fluxo ou não refaz etapas; página/indicador não pode ser compartilhado | `App.jsx` usa `activePage` e estados locais, sem roteamento/history | lote futuro de rotas mínimas para módulo, ciclo e indicador |
| troca de página não possui política global de scroll | algumas transições chegam ao topo; outras ficam em posição resultante do tamanho anterior | não há efeito central de scroll; o navegador apenas limita o offset ao novo documento | definir: nova página vai ao topo; retorno de detalhe restaura lista; troca de filtro preserva topo do bloco |
| retorno depende de botões internos | teclado/browser não oferecem o modelo mental usual de histórico | detalhe não tem URL nem entrada no history | manter retorno interno e integrar history no lote 5 |
| ações anterior/próximo e voltar se repetem no topo e rodapé | duplicação é útil em páginas longas, mas estilos/alturas pequenas reduzem previsibilidade | barras locais independentes | manter ambas quando a página for longa, usando um único componente e alvo de 44 px |

### 7.3 Política de contexto proposta

- **Município:** preservar globalmente até ação explícita do usuário.
- **Tema, etapa e busca:** preservar ao abrir/fechar detalhe no mesmo módulo; limpar apenas quando forem inválidos no destino.
- **Troca de ciclo:** fechar detalhe; manter tema/etapa somente se a chave existir nos dois ciclos.
- **Nova página/módulo:** mover para o topo.
- **Voltar do detalhe:** retornar à posição da grade anterior.
- **Voltar do navegador:** reproduzir a mesma sequência da navegação interna.
- **Link direto:** abrir página e indicador com município padrão/persistido; filtros opcionais só entram na URL se forem estáveis.

## 8. Estados e mensagens

Os componentes compartilhados `LoadingState` e `ErrorState` coexistem com implementações locais em painéis financeiros. A ausência pontual também alterna entre `—` e `-`.

Na aplicação local:

- busca vazia em educação: “Nenhum indicador disponível para este tema ou busca.”;
- busca vazia em metas legais: “Nenhuma meta com acompanhamento municipal comparável encontrada para os filtros selecionados.”;
- nenhum dos dois estados apareceu como região viva (`role=status`/`alert`) nem ofereceu ação comum de limpar filtros.

Padrão mínimo recomendado:

- carregando: “Carregando dados…”;
- sem dados: “Dados não disponíveis para este recorte.”;
- sem histórico: “Histórico não disponível.”;
- filtro sem resultado: “Nenhum indicador corresponde aos filtros.” + “Limpar filtros”;
- erro: “Não foi possível carregar os dados.” + “Tentar novamente” quando disponível;
- valor pontual: `—`.

## 9. Recomendações prioritárias

Prioridades: **P1 alta**, **P2 média**, **P3 baixa**. Não há P0 bloqueante identificado.

| # | Prioridade | Recomendação | Impacto para o gestor | Esforço | Risco de regressão | Arquivos/componentes principais |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | P1 | Fechar o detalhe e validar filtros ao trocar entre ciclos | evita leitura de indicador sob o ciclo errado | pequeno | médio | `CyclePage.jsx`, `App.jsx` |
| 2 | P1 | Definir política única de scroll: topo em nova página e restauração ao voltar do detalhe | elimina transições que parecem “paradas no meio” | pequeno | médio | `App.jsx`, `CyclePage.jsx`, `EducacaoPage.jsx`, componentes de detalhe |
| 3 | P1 | Completar semântica de tabs/filtros e elevar alvos de 30–33 px para 44 px | melhora previsibilidade, teclado e toque | médio | médio | `CategoryTabs.jsx`, `EducacaoPage.jsx`, `PneLegalGoalsPage.jsx`, `IndicatorDetail.jsx`, CSS |
| 4 | P1 | Dar foco e tooltip de teclado aos gráficos de educação | garante leitura dos valores sem mouse | médio | médio | `EducationLineChart.jsx`, `EducationBarChart.jsx`, `EducationStackedBarChart.jsx` |
| 5 | P1 | Planejar URLs para módulo, ciclo e indicador, com browser history e link direto | permite compartilhar, voltar e retomar uma análise | grande | alto | `App.jsx`, `Header.jsx`, páginas e componentes de detalhe |
| 6 | P2 | Corrigir o carregamento tipográfico e limitar pesos a 400/500/600/700 | melhora nitidez e evita aparência variável entre máquinas | médio | médio | `index.html`, `design-tokens.css`, `App.css` |
| 7 | P2 | Consolidar cores locais em tokens funcionais e separar categoria de status | reduz leituras semânticas indevidas e diferenças entre módulos | médio | médio | `design-tokens.css`, `App.css`, gráficos em `EducacaoPage.jsx` |
| 8 | P2 | Adotar base comum para resumo, indicador, navegação, painel e aviso | torna o significado do card reconhecível sem texto instrucional | médio | médio | `StatCard`, `EducationSummaryCard`, `MetricCard`, `MetaCard`, cards de educação/finanças |
| 9 | P2 | Aplicar um affordance discreto comum a cards exploráveis | deixa claro o que abre detalhe também em touch | pequeno | baixo | `MetaCard`, `EducationIndicatorCard`, `FinancialIndicatorCard`, CSS |
| 10 | P2 | Unificar moldura, altura, séries, tooltip, fonte e vazio dos gráficos | facilita comparar históricos entre módulos | médio | médio | todos os componentes de gráfico e molduras financeiras |
| 11 | P2 | Normalizar cabeçalho da página, hierarquia `h1` e contexto/breadcrumb existente | melhora orientação sem criar nova faixa | médio | médio | `Header.jsx`, `ContextBar.jsx`, `DiagnosticPanel.jsx`, páginas |
| 12 | P2 | Unificar loading, erro, ausência, sem histórico e filtro vazio | reduz mensagens inconsistentes e oferece recuperação previsível | pequeno | baixo | `LoadingState.jsx`, `ErrorState.jsx`, estados locais, `SourceLine.jsx`, `DataSourceNote.jsx` |

## 10. Plano futuro de implementação

Nenhum lote deve começar sem aprovação específica. Cada lote deve terminar com regressão visual e funcional antes do próximo.

### Lote 1 — tokens, fontes, cores e superfícies

- **Componentes/arquivos:** `index.html`, `src/styles/design-tokens.css`, `App.css` e cores locais de gráficos.
- **Mudanças visuais:** carregar a alternativa tipográfica aprovada; restringir pesos; substituir cores, raios e sombras equivalentes por tokens; alinhar superfícies.
- **Mudanças comportamentais:** nenhuma.
- **Risco:** médio, principalmente quebra de linha, altura de cards e contraste.
- **Validação:** todas as páginas em desktop/tablet/celular, títulos longos, valores grandes, comparação de fontes realmente carregadas, contraste e build.
- **Preservar:** identidade verde/quente, hierarquia de conteúdo, status, dados e layout.

### Lote 2 — cards informativos e exploráveis

- **Componentes/arquivos:** `StatCard`, `EducationSummaryCard`, `MetricCard`, `MetaCard`, `EducationIndicatorCard`, `FinancialIndicatorCard`, resumos locais de diagnóstico/metas/ciclos e CSS.
- **Mudanças visuais:** borda, raio, sombra e padding comuns; chevron somente em exploráveis/navegação; remoção de hover em informativos.
- **Mudanças comportamentais:** garantir área clicável única, foco visível e estado selecionado quando necessário.
- **Risco:** médio; seletores compartilhados podem afetar várias páginas.
- **Validação:** pointer, teclado, touch, títulos longos, alturas de grade, cards sem histórico e estados de status.
- **Preservar:** conteúdo, ordem de métricas, meta, distância, status, ícones funcionais e destinos atuais.

### Lote 3 — gráficos e tooltips

- **Componentes/arquivos:** `IndicatorHistoryChart`, `IndicatorProjectionPanel`, `EducationLineChart`, `EducationBarChart`, `EducationStackedBarChart`, `ComplementaryEnrollmentChart`, `AdministrativeDependencyChart`, sparklines e molduras financeiras.
- **Mudanças visuais:** moldura, grade, eixo, espessura, altura, tooltip, último ponto, legenda e fonte comuns.
- **Mudanças comportamentais:** foco por teclado nas marcas, tooltip em foco/ponteiro e vazio comum.
- **Risco:** médio/alto por escalas SVG, muitas séries e responsividade.
- **Validação:** dados extremos, séries únicas/múltiplas, metas, projeção, unidades, teclado, leitor de tela, 390–1920 px e ausência de dados.
- **Preservar:** séries, valores, cálculos, domínios, projeção, metodologia e linguagem exclusiva do módulo tendencial.

### Lote 4 — filtros, abas e seletores

- **Componentes/arquivos:** `CategoryTabs`, chips de etapa/tema, módulos financeiros, `MunicipalitySelector`, buscas, tabs de apoio e CSS.
- **Mudanças visuais:** alturas, bordas, seleção, espaçamento e foco previsíveis por tipo de controle.
- **Mudanças comportamentais:** papéis ARIA corretos, teclado e ação comum de limpar filtros.
- **Risco:** médio; alterar semântica não pode alterar a lógica de filtragem.
- **Validação:** seleção única/múltipla, busca vazia, contagens, município, teclado, touch e persistência após detalhe.
- **Preservar:** opções, filtros, valores selecionados, ordenação e resultados.

### Lote 5 — navegação entre lista e detalhe

- **Componentes/arquivos:** `App.jsx`, `Header.jsx`, `ContextBar.jsx`, `CyclePage.jsx`, `EducacaoPage.jsx`, páginas financeiras e componentes de detalhe.
- **Mudanças visuais:** contexto/breadcrumb discreto e barra local de voltar/anterior/próximo consistente.
- **Mudanças comportamentais:** reset de detalhe por ciclo, política de scroll, history, URLs diretas e restauração de contexto.
- **Risco:** alto; é o único lote estrutural e deve ser isolado dos demais.
- **Validação:** Voltar/Avançar, reload, link direto, troca de ciclo, município persistido, filtros, scroll, indicador inexistente e navegação por teclado.
- **Preservar:** shell, páginas, cards, dados, regras, nomes de módulos e fluxo interno conhecido.

## 11. Ordem de decisão recomendada

1. aprovar uma das duas alternativas tipográficas;
2. aprovar a gramática A–D e os cinco padrões de card/painel;
3. aprovar a separação entre cores institucionais, categóricas e semânticas;
4. executar lotes 1–4 com QA isolado;
5. detalhar tecnicamente o lote 5 antes de introduzir rotas.

Essa ordem evita que a futura navegação estrutural seja implementada sobre componentes ainda inconsistentes e mantém o dashboard reconhecível durante toda a evolução.
