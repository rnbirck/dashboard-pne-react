# Plano de Migração da Interface — Dashboard PNE

> **Status: encerrado.** UI-01 a UI-18 foram concluídas nos respectivos escopos aprovados. Este documento preserva implementação, evidências, exceções e critérios de validação; novas iniciativas devem ser tratadas fora desta migração.
>
> Auditorias e propostas que originaram parte deste plano estão preservadas em [historico-ui/](historico-ui/).

## 1. Escopo e uso

O plano organiza a migração gradual do legado visual sem redesenhar a plataforma, trocar tecnologia, alterar dados, cálculos, filtros, regras de negócio ou textos analíticos.

Use este arquivo para:

- registrar o estado de padrões existentes;
- abrir, encerrar ou reavaliar pendências;
- apontar arquivos consumidores e evidências verificáveis;
- definir prioridade e critério de aceite antes de uma mudança visual.

## 2. Inventário atual

| Item | Estado | Implementação e consumidores | Evidência |
|---|---|---|---|
| Valores canônicos | Implementado | `src/styles/design-tokens.css`, `src/index.css` | Famílias, escala, estados, camadas e aliases legados centralizados. |
| Tipografia carregada | Implementado | `src/main.jsx`, `src/index.css`, `src/styles/platform-ui.css` | Public Sans 400–700 e Source Serif 4 600–700 são carregadas localmente. |
| Gramática de controles | Implementado no escopo aprovado | `src/styles/platform-ui.css`, `CategoryTabs`, `SearchField`, `SegmentedControl`, `DetailNavigation`, `MunicipalitySelector` | Busca, filtros, segmentos, abas e navegação local compartilham gramática; famílias semanticamente distintas permanecem separadas. |
| Navegação e foco | Implementado | `Layout`, `useDetailViewNavigation`, `resolveDetailSequence`, `DetailNavigation`, `hashNavigation`, páginas e módulos financeiros | Troca de página, hash estável, seleção, vizinhança, retorno ao grid e restauração de foco estão cobertos; resets de domínio permanecem nos consumidores. |
| Cards exploráveis | Implementado no escopo aprovado | `ExplorableIndicatorCardFrame`, `EducationIndicatorCard`, `FinancialIndicatorCard`, `InteractionChevron`, `Sparkline` | Educação e Financeiro compartilham o frame; `MetaCard` continua específico do PNE conforme decisão aprovada. |
| Gráficos compartilhados | Implementado no escopo aprovado | `ChartPrimitives`, `Sparkline`, `IndicatorChartHeader`, `FinancialChartFrame`, `chart-system.css` | Tooltip, legenda, vazio, foco, sparkline e cabeçalhos equivalentes são compartilhados; renderers e composições PNE permanecem específicos. |
| Exceções PNE | Implementado | `pne-cycle-experience.css`, `CyclePage`, detalhes de indicador | Meta, ciclo, distância e projeção mantêm composição específica. |
| Exceções Financeiras | Implementado | `FundebPanel`, `PnatePanel`, `SiopeIndicatorsPanel`, `VaarPanel`, `SistemaSPanel` | Tabelas e leituras monetárias preservam contexto próprio. |
| Legado central | Ativo e documentado | `src/App.css` e seus consumidores | Continua responsável por shell, composições locais, exceções e cascata histórica; é dívida técnica separada e não referência para novos padrões. |

## 3. Itens encerrados

| ID | Item | Estado | Prioridade | Evidência e consumidores | Critério de aceite |
|---|---|---|---|---|---|
| UI-01 | Seletor municipal único e IDs ARIA únicos | Implementado (Lote 2) | P1 | `MunicipalitySelector` usa `useId` por instância em input, listbox e opções; opções usam o nome municipal normalizado porque a API vigente fornece strings, não códigos. A lista visível é limitada deterministicamente a 100 resultados. | E2E monta duas instâncias simultâneas, confirma ausência de IDs duplicados e relações `aria-controls` exclusivas; busca, abertura, seleção, limpeza e fluxo integrado foram preservados. |
| UI-02 | Estados compartilhados | Implementado (Lote 2) | P1 | `ContentState` recebe conteúdo pronto, cinco naturezas semânticas e o elemento HTML a preservar. `LoadingState`, `ErrorState`, Educação, Diagnóstico, FUNDEB, PNATE, SIOPE e VAAR adotam a primitiva nas ocorrências equivalentes. | Mensagens, classes, ações e DOM visual permanecem; loading/status usa anúncio polido e erro usa alerta assertivo. Vazios compactos de gráficos e composições específicas continuam fora da primitiva. |
| UI-03 | Navegação compacta em notebook estreito | Implementado (Lote 2) | P1 | No intervalo estrutural 861–1080 px, cabeçalho e grupos reduzem espaços internos e os subitens usam duas colunas, preservando alturas interativas, identidade e conteúdo. | E2E mede município, barra de contexto e `h1` dentro da primeira dobra em 1024×768; desktop e mobile mantêm suas composições. |
| UI-04 | Tabelas semânticas e moldura comum | Implementado (Lote 2) | P1 | `EducationTable`, dados complementares do PNE, FUNDEB, PNATE, SIOPE e Sistema S preservam tabelas e wrappers existentes, agora com `caption` oculto, `scope="col"` e regiões roláveis nomeadas e focáveis. | Formatação, cálculos, colunas, textos visíveis, alinhamento existente e vazio contextual foram preservados; foco visível e overflow ficam no componente extenso, não no documento. |
| UI-05 | Contraste de tokens legados | Implementado (Lote 1) | P1 | Educação, Diagnóstico e PNE usam no mínimo `--font-size-xs` (12 px) nos textos auxiliares mapeados, com `--text-soft`/`--text-body` nos neutros de baixo contraste e 12 px nos rótulos de gráficos educacionais. Os seletores são explícitos e preservam classes, DOM e cores semânticas; FUNDEB, PNATE e SIOPE ficaram fora do lote. | E2E representativo confirma mínimo de 12 px, contraste AA das fontes, quebra de até duas linhas e ausência de overflow em 1366×768, 1280×720 e 1024×768. Regras legadas não foram removidas; usos fora das três áreas permanecem para lotes posteriores. |
| UI-06 | Responsividade de gráficos e tabelas extensas | Implementado (Lote 4) | P2 | O overflow de 451 px no PNE 2026 vinha do `u-sr-only` de uma opção longa da lista rolável de temas, posicionado contra o documento; não vinha de gráfico, eixo, legenda ou tooltip. Em até 620 px, `.category-tab` estabelece o contexto de posicionamento e a rolagem permanece contida no grupo nomeado. | Documento sem overflow em 768×1024, 390×844 e 320×568; escalas, séries, rótulos e fontes não mudaram. Os 21 baselines desktop e o baseline móvel PNE 2026 passam. |
| UI-07 | Extração gradual do legado | Implementado no escopo comprovado (Lote 4) | P2 | `state-box`, modificadores de loading/erro, spinner/keyframe e foco das regiões roláveis de tabelas foram movidos de `App.css` para `platform-ui.css`, junto às primitivas que os possuem. Não houve mudança de seletor ou valor. | Permanecem em `App.css`: layout e breakpoints estruturais, composições PNE/Financeiro/Educação, cards com exceções de domínio, gráficos legados e `DataSourceNote`, cuja mudança de ordem alteraria a cascata. Nenhum seletor sem equivalência comprovada foi removido. |
| UI-08 | Redução de breakpoints locais | Implementado (Lote 2, sem remoções) | P2 | Foram revisados somente 861–1080 px e até 620 px, tocados por UI-03/UI-06. Nenhum breakpoint legado foi removido porque não houve equivalência integral comprovada entre navegação de notebook e rolagem móvel. | As duas regras adicionadas documentam comportamentos estruturais distintos; não houve limpeza ampla nem perseguição de redução numérica. |
| UI-09 | Teste E2E e baseline visual | Implementado (Lote 3) | P1 | `visual-test.cjs` persiste 21 regiões: Home, PNE 2014–2024, PNE 2026–2036, Educação, Diagnóstico, FUNDEB e SIOPE em 1366×768, 1280×720 e 1024×768. `npm run update:visual` atualiza deliberadamente; falhas acima de 0,2% geram PNG de diferença em `visual-diffs`. | Animações, caret e movimento são neutralizados. O E2E funcional cobre loading, erro de console, ausência, nenhum resultado, textos/valores representativos, teclado, foco, recarga e overflow; smoke adicional cobre 768×1024 e 390×844. |
| UI-10 | Semântica completa de abas | Implementado (Lote 2) | P1 | `EducationIndicatorBreakdown` e `IndicatorComplementaryData` usam IDs por instância, `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby` e roving `tabIndex`. | Ativação automática por ArrowLeft/ArrowRight/Home/End preserva estado inicial, clique, classes e DOM visual. Filtros, segmentos, módulos financeiros, navegação sequencial e pills não foram tratados como abas. |
| UI-11 | Fonte e nota metodológica comuns | Implementado (Lote 1) | P2 | Todas as ocorrências equivalentes no escopo Educação, Diagnóstico e PNE resolvem `source` e `methodology` separadamente com `getDataSourceParts`: Educação mantém composição local; PNE usa `PneSourceNotes`; Diagnóstico preserva o `details` de Evidência e usa `MethodNote` somente quando há metodologia. `DataSourceNote` continua responsável apenas pela origem, sem alterar texto, classe, posição ou regra de resolução. FUNDEB, PNATE e SIOPE, já migrados, não foram tocados. | Permanecem específicos por semântica: notas de cobertura/disponibilidade, leituras e interpretações, alertas, referências legais, “Aviso metodológico” misto das metas legais, nota complementar de associação/cobertura do PNE, fonte legal/consulta complementar e a nota de privadas conveniadas. `SourceLine`, VAAR e áreas externas ao lote não entram nesta conclusão. O E2E cobre presença, ausência, unicidade e ordem fonte→metodologia por área. |
| UI-12 | Contexto endereçável de módulo e detalhe | Implementado (Lote 4) | P2 | A estratégia de hash cobre páginas, temas, módulos, Sistema S e detalhes estáveis de PNE, Educação, FUNDEB, PNATE e SIOPE. Os painéis financeiros recebem somente `detailKey` e `onDetailChange`; builders e disponibilidade continuam internos. | Acesso direto, recarga, abrir/trocar/fechar, voltar/avançar, foco restaurado, chave inválida e troca municipal são resolvidos após os dados. Trocar de módulo remove detalhe incompatível. |
| UI-13 | Primitiva comum de sparkline | Implementado (piloto) | P2 | `src/utils/sparkline.js`, `src/components/Sparkline.jsx`, `EducationIndicatorCard`, `FinancialIndicatorCard`. | Educação e Financeiro usam o mesmo modelo geométrico e JSX, preservando filtragem, ordenação, escala constante, paths, período, estado vazio, classes legadas e `aria-hidden`; `MetaCard` permanece fora do piloto. |
| UI-14 | Controles React compartilhados | Implementado | P2 | `src/components/SearchField.jsx` atende `CyclePage`, `EducacaoPage` e `PneLegalGoalsPage` no escopo aprovado; FUNDEB e PNATE mantêm a variante lateral `indicator-search` fora desse escopo. `src/components/SegmentedControl.jsx` atende `BasicEducationFilter` em `CyclePage` e `IndicatorSegmentedControl` em `EducacaoPage`, com `ariaLabel`, `className`, `optionClassName`, `options`, `selectedKey` e `onSelect`. Busca, PNE e Educação foram validados em 1366×768, 1280×720 e 1024×768; o segmento largo de Educação preserva 12 opções, wrapping, foco e `aria-pressed`. | Busca e segmento aprovados preservam DOM, classes, ordem, foco e lógica dos consumidores. O PNE preserva opções de 36 px; o segmento largo de Educação preserva a exceção legada de 30 px existente antes da migração, sem mudança de CSS. `infra-dep-pill` é uma ocorrência futura fora deste escopo por ainda não expor grupo rotulado nem `aria-pressed`. Filtros, tabs e navegação de módulo não entram em um componente universal. |
| UI-15 | Arquitetura dos cards exploráveis | Implementado | P2 | `ExplorableIndicatorCardFrame`, `EducationIndicatorCard`, `FinancialIndicatorCard`, `StatusBadge`, `Sparkline`, `InteractionChevron`, `e2e-test.cjs`. | Educação e Financeiro mantêm APIs e consumidores atuais, adaptam seus próprios view-models textuais e fornecem contratos de classes BEM imutáveis ao frame de sete regiões, sem wrapper DOM, CSS ou regras de domínio. `MetaCard` preserva composição, cálculos e sparkline próprios do PNE. Lint, build e E2E validam DOM, classes específicas, atributos ARIA, foco restaurado, sparkline válida/vazia e fluxos em 1366×768, 1280×720 e 1024×768. |
| UI-16 | Propriedade de moldura e título de gráfico | Implementado (Lote 3) | P2 | `IndicatorChartHeader` concentra eyebrow, título, subtítulo, resumo e ações textuais equivalentes de Educação e `FinancialChartFrame`, sem wrapper ou classe nova. Fontes/metodologias continuam na composição externa e renderers preservam séries, escalas, eixos e tooltips. | `IndicatorHistoryChart` permanece específico do PNE porque seu título integra a semântica da seção e a alternativa acessível do SVG; o baseline comprova equivalência visual das extrações. |
| UI-17 | Mecânica comum de seleção lista–detalhe | Implementado (Lote 3) | P2 | `resolveDetailSequence` consolida índice, anterior e próximo; `useDetailViewNavigation` mantém abertura, foco, posição e retorno. PNE, Educação, FUNDEB, PNATE e SIOPE usam a mesma mecânica. | Filtros, módulos, ciclos, modelos, disponibilidade, resets, textos e transformação permanecem nos consumidores; nenhuma API pública ou DOM foi alterado. |
| UI-18 | Primitivas de cabeçalho | Implementado (Lote 3) | P3 | `PageHeadingText` atende ciclos do PNE e os cabeçalhos educacional/financeiro; `DetailHeadingText` atende detalhes de Educação e Financeiro. Ambos compartilham somente contexto, título e descrição, sem wrapper adicional. | Home permanece institucional; Diagnóstico permanece específico por combinar contexto, ações e anúncio; hero, métricas, filtros, referências e alertas não foram absorvidos. Baseline sem diferenças. |

> **Evidência de UI-05.** Em PNE 2014–2024, PNE 2026–2036, Metas Legais, Educação, FUNDEB, PNATE, SIOPE e Sistema S, o E2E registrou altura de 16,80–33,59 px e uma a duas linhas, sem overflow da nota. Em 390×844, a fonte do Sistema S continua em 12 px e sem overflow. O overflow horizontal preexistente do PNE 2026 em 390 px (451 px para viewport de 390 px) foi encontrado e não foi corrigido por estar fora deste piloto.

> **Cobertura complementar de UI-11/UI-12.** `scripts/checks/e2e-test.cjs` monta no navegador o `SistemaSPanel` real com o JSON público de Alegrete para validar fonte única, ordem, métricas, gráfico, distribuição, tabela e overflow. A entrada integrada `#sistemas` também é exercitada com a resposta municipal retida: a rota direta, o carregamento, a troca para Áurea sem Sistema S, a navegação Educação–Financeiro–Educação e o recarregamento preservam o contexto correto. A revisão visual ocorre em 1366×768, 1280×720 e 1024×768, sem overflow horizontal.

> **Evidência do Lote 1 (UI-05/UI-11).** Educação migrou as fontes do histórico principal, infraestrutura, alunos por turma e detalhamentos exploráveis; PNE migrou histórico com e sem série, dados complementares e indicadores das metas legais; Diagnóstico separou fonte e metodologia nas evidências das prioridades. Fonte e metodologia aparecem uma vez, em parágrafos irmãos e na ordem original. A verificação tipográfica representativa cobre cards e gráficos de Educação, PNE e Diagnóstico; `DataSourceNote` permaneceu entre 12–13,44 px, com contraste de 5,23:1–7,80:1 e sem overflow nas três resoluções prioritárias.

### Evidência do Lote 2

Os três gates foram executados em sequência, com lint, build, E2E e `git diff --check` entre as frentes. A cobertura final inclui IDs simultâneos do seletor municipal, anúncios dos estados, semântica e foco de tabelas, primeira dobra em 1024×768, ausência de overflow nos fluxos cobertos em cinco viewports e teclado/ARIA das duas famílias de abas reais. UI-06 permanece parcial exclusivamente pelo overflow móvel legado do PNE 2026 já registrado; corrigi-lo exigiria alterar a composição dos gráficos além do risco aprovado para este lote.

### Evidência do Lote 4

- **CSS movido:** `.state-box`, `.state-box > span`, `.state-box--loading`, `.state-box--error`, `.state-spinner`, `@keyframes spin` e os quatro seletores `:focus-visible` das regiões tabulares passaram a `platform-ui.css`. Consumidores: `ContentState`, `LoadingState`, `ErrorState`, Educação, SIOPE e wrappers de Educação/FUNDEB/PNATE/SIOPE/Sistema S/PNE complementar.
- **CSS removido:** somente as cópias equivalentes em `App.css` após a transferência; nenhum seletor ativo foi eliminado sem destino.
- **CSS mantido:** `DataSourceNote` e overrides de domínio, `IndicatorChartHeader`, cards exploráveis, gráficos PNE/Financeiro, layouts, breakpoints estruturais e exceções responsivas. A justificativa é dependência de especificidade, ordem de cascata ou composição ainda local.
- **Hash financeiro final:** a visão geral usa `#financeiros`; os módulos usam `#financeiros-aplicacao-recursos?detalhe=<key>`, `#financeiros-fundeb?detalhe=<key>` e `#financeiros-pnate?detalhe=<key>` quando há detalhamento. `#financeiros-vaar` preserva o módulo sem índice individual. Os hashes legados com `?modulo=` continuam aceitos e são normalizados para a rota independente correspondente.
- **Visão geral financeira editorial:** `#financeiros` foi simplificada em hero com quadro legal, três blocos sobre a organização do financiamento, uma única grade navegável dos quatro módulos, conceitos em acordeão e fontes oficiais compactas no rodapé. O fluxo detalhado, os blocos repetidos e os cards grandes de referências foram removidos. No desktop, o submenu lateral permanece a navegação principal; em larguras reduzidas, a navegação financeira usa um seletor compacto sem duplicar o submenu visível.

### Encerramento da reorganização de Indicadores da Educação

Os Lotes 0–5 de Educação estão encerrados no escopo aprovado: catálogo central com 37 indicadores-base e 15 complementares, oito seções endereçáveis, Visão geral, acesso por `secao`, aliases legados (`tema`, `theme` e `detalhe`), detalhes com sequência restrita à seção e estados provisórios de Demanda/Metodologia. A revisão final preservou dados, JSONs, pipeline, cálculos, séries, renderers e regras de negócio.

O E2E foi atualizado somente nos contratos que haviam ficado defasados em relação à arquitetura vigente de Financeiros: título da visão geral, rotas `financeiros-*`, seletor estrutural de módulo, retorno de `#educacao` para Visão geral e múltiplas grades agrupadas de Educação. A configuração agora registra `window.innerWidth=1366` em 1366×768; caso o ambiente limite a 1280, o teste informa explicitamente a resolução efetiva.

Validação final: lint, build, E2E, histórico Back/Forward, reload, URLs legadas, aliases, foco, `aria-current`, troca municipal, console e overflow passaram. Permanecem fora deste encerramento as 67 ocorrências `MISSING_VM` e a validação de detalhes com 2 erros e 994 avisos, todas registradas como pendências preexistentes.

### Iniciativa pós-migração — refinamento das oito páginas de Educação (2026-07-12)

Esta iniciativa não reabre UI-01 a UI-18. O escopo visual abrangeu Visão geral, Atendimento, Trajetória, Profissionais, Infraestrutura, Modalidades, Demanda e Metodologia, preservando dados, JSONs, cálculos, filtros, conteúdo analítico, rotas e estrutura da navegação global.

- `src/styles/education-pages.css` passou a concentrar a composição do módulo com hero institucional, resumo tabular sem cards aninhados, acessos temáticos, grupos abertos, cards 3→2→1, detalhes, Demanda e Metodologia. Seletores de detalhe foram escopados por `.educacao-page` para não atingir Financeiro.
- Busca, limpeza e recortes de Infraestrutura reutilizam a gramática compartilhada; limpar a busca mantém 44 px sem deslocamento e devolve foco ao input. O item pai de Educação volta de qualquer subseção para `#educacao`/Visão geral.
- Detalhes usam hierarquia `h1 → h2`, caption específico na tabela de Infraestrutura, textos auxiliares com contraste AA e rótulos SVG sem redução abaixo de 12 px físicos.
- Demanda usa um indicador por linha, região gráfica rolável no celular, nomes acessíveis específicos e roving tabindex: quatro paradas de `Tab` substituem 92, com ArrowLeft/ArrowRight/Home/End entre anos. Série inválida recebe estado vazio explícito.
- Metodologia usa fontes em grade 3→2→1, disclosures nativos com indicador visual e blocos distintos para escopo, interpretação e limitações.

Evidência registrada: smoke das oito rotas em 1366×768, 1024×768 e 390×844 (24 combinações) sem erro de console, overflow, truncamento de títulos ou texto visível abaixo de 12 px; grade de tablet em 768×1024 validada com duas colunas de 348 px; troca de seção restaurou rolagem e foco em 24/24 casos. O E2E integral passou em 1366×768, 1280×720, 1024×768 e na checagem móvel de 390×844, incluindo teclado, foco, hash, estados, fonte e contraste. Lint, build e `git diff --check` passaram; as três referências visuais de Educação foram atualizadas e recomparadas em 1366×768, 1280×720 e 1024×768 com diferença de 0,000%. A suíte visual global ainda precisa alinhar a navegação dos casos FUNDEB/SIOPE à página intermediária atual de Financeiros; esse timeout ocorre depois das comparações de Educação e não altera os baselines dos demais módulos.

Acabamento final (2026-07-12): o topo das seções internas passou a reunir identificação, quantidade e busca em uma única superfície, mantendo o hero institucional separado. Rodapés dos cards agora eliminam a categoria repetida pelo contexto ou agrupamento, limitam-se a dois chips sem quebra e reservam uma coluna fixa para a seta; títulos completos permanecem no nome acessível do card e chips truncados expõem `title`. A grade interna estabiliza títulos, descrições, métricas, sparklines e rodapés; grupos de um card deixam de exibir divisor longo. Em Demanda, metadados e caixas numéricas foram compactados, observado/projetado ganharam superfícies distintas, gráficos receberam limite visual moderado no desktop e a nota metodológica virou disclosure nativo fechado por padrão. Smoke responsivo em 1366×768, 1280×720, 1024×768 e 390×844 confirmou zero overflow horizontal, chips quebrados, textos abaixo de 12 px, títulos cortados ou rodapés fora da base. Lint, build e `git diff --check` passaram. O E2E integral permanece temporariamente defasado: ainda procura o grupo legado `Temas da educação / Escolas` e interrompe a primeira resolução antes das demais; a falha é de contrato do teste, não da interface atual.

### Nova iniciativa — identidade SESI-RS, navegação lateral e Home (2026-07-12)

Esta iniciativa não reabre UI-01 a UI-18 nem altera dados, JSONs, cálculos, indicadores, regras de negócio, rotas ou aliases. O escopo cobre a identidade institucional do shell, a navegação global e a hierarquia da Home.

- A sidebar desktop preserva `--sidebar-width` (264 px), passa a usar o nome compacto “Painel SESI-RS / Inteligência Municipal” e organiza PNE, Indicadores educacionais e Financiamento da educação em accordions exclusivos. Home permanece um item simples; somente subitens e Home recebem `aria-current="page"`.
- `SidebarAccordionGroup` concentra o padrão de grupo com `aria-expanded`, `aria-controls`, chevron rotacionado, foco visível, alvos de 44 px e exclusividade de abertura. Reload, hashchange e histórico derivam o grupo proprietário do hash atual.
- Abaixo de 1080 px, a sidebar persistente é substituída por drawer com botão de abertura, backdrop, fechamento por Escape, retorno de foco, contenção de Tab, rolagem interna e fechamento após navegação. O conteúdo e o seletor municipal permanecem visíveis antes da abertura.
- `SidebarInstitutionalSignature` e `InstitutionalBrandStrip` definem os pontos estáveis para `public/brands/SESI.png` e `public/brands/FIERGS.png`, preservando logos separados, proporção e `object-fit: contain`. Os binários não estavam presentes nos anexos disponíveis nesta execução e precisam ser adicionados sem edição dos originais.
- A Home passa a apresentar o nome institucional completo, o título e a descrição aprovados, município como contexto operacional, três acessos principais, os conceitos “Visão municipal integrada”, “Evidências oficiais” e “Planejamento e decisão”, além da faixa institucional final. `index.html` acompanha a nova descrição, título e `theme-color` verde institucional.

### Refinamento da sidebar e assinatura institucional (2026-07-12)

Rodada posterior de acabamento, sem reabrir a arquitetura de navegação: a largura canônica passou a 280 px, os grupos principais usam os rótulos compactos “PNE”, “Indicadores educacionais” e “Financiamento”, e os estados foram simplificados para reduzir molduras e linhas redundantes. O submenu mantém uma única linha vertical sutil, recuo confortável e subitem ativo secundário ao grupo pai.

Os arquivos originais `SESI.png` e `FIERGS.png` foram copiados sem alteração para `public/brands/SESI.png` e `public/brands/FIERGS.png`. A assinatura da sidebar e a faixa da Home usam os logos como imagens institucionais, sem botões, chips, filtros ou bordas individuais.

### Refinamento da barra superior e da Home (2026-07-12)

Esta rodada conclui a assinatura institucional no shell: `InstitutionalTopBarSignature` exibe os arquivos reais `public/brands/SESI.png` e `public/brands/FIERGS.png` na barra superior, alinhados ao lado direito do seletor municipal. A sidebar deixa de repetir as marcas e passa a terminar com uma nota institucional discreta, sem card.

A Home foi aproximada da composição da página “O que é o PNE” com a seção “Como navegar” em quatro passos, o bloco editorial “Sobre o painel” e a linha de fontes próxima ao conteúdo de apoio. O bloco de leitura comum usa uma superfície contínua com divisores para não duplicar visualmente a grade de acessos principais. A observação anterior sobre ausência dos arquivos de marca fica superada pela cópia verificada dos originais para `public/brands`.

## 4. Resumo final da migração

### Componentes e primitivas compartilhadas

- estrutura e interação: `ExplorableIndicatorCardFrame`, `DetailNavigation`, `useDetailViewNavigation`, `resolveDetailSequence` e `InteractionChevron`;
- estados e contexto: `ContentState`, `LoadingState`, `ErrorState`, `MunicipalitySelector` e `hashNavigation`;
- controles: `SearchField`, `SegmentedControl`, `CategoryTabs` e a gramática `platform-*`;
- dados auxiliares: `DataSourceNote`, `MethodNote`, `PneSourceNotes` e `getDataSourceParts`;
- gráficos e títulos: `Sparkline`, `ChartPrimitives`, `IndicatorChartHeader`, `FinancialChartFrame`, `PageHeadingText` e `DetailHeadingText`;
- tabelas: `EducationTable`, captions semânticos e regiões roláveis nomeadas e focáveis.

### Revisão sistêmica da família Financeiro (2026-07-12)

Implementada uma rodada própria de refinamento visual e estrutural para Visão geral, SIOPE, FUNDEB, PNATE, VAAR, grades de indicadores, detalhes e estados vazios. A iniciativa não reabre UI-01 a UI-18 e não altera dados, JSONs, cálculos, filtros, regras de negócio, rotas ou textos analíticos.

- `FinancialSectionHeader` e `FinancialMetricStrip` consolidam cabeçalhos editoriais e faixas de resumo; `financial-pages.css` concentra tokens, ritmo, superfícies, cards, controles, detalhes e responsividade da família financeira.
- FUNDEB e PNATE compartilham busca com limpeza e foco restaurado; suas faixas de resumo ocupam a largura útil e usam o mesmo grid responsivo. SIOPE transforma o bloco duplicado em nota técnica compacta, mantendo fonte e metodologia.
- Cards financeiros preservam os view-models atuais, mas estabilizam título, descrição, valor, ano, variação, sparkline e rodapé. A navegação inferior do detalhe mantém somente anterior/próximo; o retorno permanece na toolbar superior.
- VAAR preserva a composição de resultado própria, com síntese e quatro métricas dimensionadas como uma unidade; componentes, pontos de atenção e accordions adotam o mesmo ritmo de superfícies.
- Evidência: `npm run test:e2e`, `npm run test:visual`, `npm run lint`, `npm run build` e `git diff --check` passaram. Os 22 baselines visuais foram atualizados deliberadamente após a revisão.

### Segunda rodada de refinamento da família Financeiro (2026-07-12)

Esta rodada preservou a arquitetura, os view-models, dados, cálculos, filtros, rotas, textos analíticos e comportamento funcional da família financeira. O foco foi proporção, densidade, alinhamento, wrapping, leitura responsiva e equilíbrio entre visão geral e detalhe.

- A visão geral passou a usar o hero em uma única coluna útil, sem reserva vazia; os acordeões editoriais ficaram mais curtos e os blocos mantêm o ritmo de 24 px entre seções e 16 px entre relações.
- FUNDEB, PNATE e SIOPE usam 3 colunas no desktop, 2 no notebook e 1 no celular; PNATE alterna para 3+2 no intermediário. O SIOPE mantém 4 métricas equilibradas e o eixo horizontal rola dentro do seletor em 390 px, sem overflow do documento.
- O SIOPE passou a limitar o título móvel a três linhas sem reduzir a escala tipográfica; os rodapés dos cards reservam a seta, mantêm chips em uma linha e alinham valor/ano na mesma base.
- VAAR distribui a atenção em 3+2 cards quando a largura não comporta cinco; os accordions de detalhe foram reduzidos para uma faixa de aproximadamente 56–58 px fechada.
- Detalhes FUNDEB e PNATE removem a caixa de referência redundante; gráficos passam a respeitar séries curtas/longas (~300/320 px) e tabelas de até 12 anos ficam abertas, sem scroll interno.
- Evidência visual manual: 1366×768, 1280×720, 1024×768 e 390×844, incluindo visão geral, os quatro módulos, três detalhes, título longo, grade intermediária, eixo SIOPE, foco e overflow. Validação final: `npm run lint`, `npm run build`, `npm run test:e2e`, `npm run update:visual`, `npm run test:visual` (22 regiões, tolerância de 0,2%) e `git diff --check` passaram. `npm run check:units` continua bloqueado pelas 67 inconsistências `MISSING_VM` preexistentes do PNE.

### Terceira rodada de convergência da família Financeiro (2026-07-12)

Esta rodada comparou as quatro páginas de referência do painel com Visão geral, SIOPE, FUNDEB, PNATE e VAAR em 1366×768 antes da alteração. O escopo preservou dados, JSONs, cálculos, filtros, rotas, textos analíticos e regras de negócio.

- `FinancialSection` e `FinancialSectionHeader` passaram a concentrar identificação, título, contexto/quantidade, ações e conteúdo na mesma superfície branca. Visão geral, indicadores, eixos, VAAR, histórico, contexto e estados relacionados seguem o mesmo ritmo de seção.
- SIOPE, FUNDEB e PNATE deixaram de separar visualmente título, resumo, busca e grade; a navegação por eixo do SIOPE permanece dentro da seção. O título hero do SIOPE cabe em duas linhas no desktop sem reduzir a escala tipográfica.
- FUNDEB e PNATE usam a mesma composição de indicadores e o mesmo espaçamento de grade; PNATE mantém cinco métricas em 5 colunas no desktop e 3+2 no intermediário. A nota metodológica do PNATE usa tratamento neutro/editorial, sem aparência de status.
- VAAR adota o cabeçalho compartilhado nas seções de introdução, resultado, explicação, atenção e histórico, reduzindo painéis independentes sem alterar a leitura específica do módulo.
- A revisão responsiva confirmou 3→2→1 colunas, eixos roláveis internamente no celular, foco visível, contraste, textos longos e ausência de overflow do documento. As referências visuais foram atualizadas somente depois da comparação: `npm run update:visual` e `npm run test:visual` passaram em 22 regiões, com tolerância de 0,2%.

### Quarta rodada de convergência visual da família Financeiro (2026-07-12)

Esta rodada fechou a equivalência visual entre Financeiro e as referências PNE 2026, Educação e Home sem alterar dados, JSONs, cálculos, filtros, rotas, fontes ou conteúdo analítico.

- A anatomia de indicadores financeiros passou a ser compartilhada por `ExplorableIndicatorCardFrame`/`indicator-card-shell`, com a mesma tipografia, badge, composição horizontal de valor e Ano/Variação, faixa Leitura/Período, rodapé de um chip e chevron simples de Educação; sparklines e botões circulares foram removidos destes cards. `MetaCard` permanece a exceção semântica do PNE por carregar meta legal, progresso e leitura específica.
- Os cards das cinco páginas de Indicadores de Educação foram refinados para a gramática institucional neutra: superfície clara, borda e sombra discretas, verde único para hierarquia, direção restrita ao badge/variação e bloco `Leitura / Período` em superfície quente sem contorno decorativo.
- A densidade dos cards de Educação foi alinhada à família dos cards de ciclo do PNE: escala tipográfica 12/16/32, espaçamento-base de 8 px, bloco informativo compacto e rodapé com divisor, chip e chevron de 24 px.
- A calibração final fixa a medida comparável em 324 px para PNE, Educação e Financeiro no desktop/notebook e usa mínimo comum de 364 px no mobile. O valor principal retorna à mesma faixa vertical dos cards PNE; badges e variações passam a aplicar corretamente verde-azulado, areia e terracota conforme Alta, Estável e Queda.
- Nos cards de Educação e Financiamento, o destaque principal foi alinhado à esquerda dentro da coluna de 60%, com recuo interno adicional de 16 px; divisor, coluna Ano/Variação e composição específica do PNE permanecem intactos.
- SIOPE usa `CategoryTabs`/`platform-category-tabs`; FUNDEB usa `SegmentedControl` rolável internamente; FUNDEB e PNATE usam `SearchField`; estados e chevrons usam `StatusBadge` e `InteractionChevron`. As grades financeiras ficam em 3→2→1 colunas em 1280/1024/390 px, reservando quatro colunas apenas para larguras realmente amplas.
- Acesso da Home e módulos financeiros usam `NavigationEntryCard`, mantendo a distribuição própria de três/quatro acessos sem duplicar shell, foco, ícone, descrição, contador e rodapé. `FinancialSection`/`FinancialSectionHeader` continuam como base dos cabeçalhos, contadores, busca e divisores.
- VAAR reutiliza `MetricCard`, `StatusBadge`, `platform-info-card` e o padrão de acordeão `pne-expandable`; as grades de explicação, atenção, histórico e anos preservam seus dados e sua semântica de domínio.
- Foram removidos de `financial-pages.css` os blocos duplicados de anatomia de card, segmented control, seletor de eixo, busca, grid-shell, cabeçalho e sidebar. Permanecem somente exceções de composição, conteúdo e visualização específicas de cada módulo.
- Evidência comparativa em 1366×768: `scripts/checks/visual-comparisons/round4/` contém os seis pares solicitados — PNE×SIOPE, Educação×FUNDEB, Educação×PNATE, seletor PNE×SIOPE, seletor PNE×FUNDEB e acesso Home×Financeiro — revisados antes da atualização das referências visuais.

### Áreas migradas

Home e shell, ciclos PNE 2014–2024 e PNE 2026–2036, metas legais, Educação, Diagnóstico, FUNDEB, PNATE, SIOPE, VAAR e Sistema S foram cobertos conforme os lotes aprovados. A migração preservou APIs públicas sempre que possível e manteve dados, cálculos, filtros, textos analíticos e regras de negócio fora do escopo visual.

### Exceções de domínio preservadas

- `MetaCard`, metas, ciclos, distância, projeção, referências e relações legais permanecem específicos do PNE;
- FUNDEB, PNATE, SIOPE, VAAR e Sistema S preservam builders, unidades, valores monetários, disponibilidade, alertas e leituras próprias;
- cobertura, disponibilidade, alerta, interpretação, fonte, metodologia e referência legal continuam responsabilidades distintas;
- Home mantém a composição institucional; Diagnóstico mantém ações e síntese executiva; renderers de gráficos preservam escalas, séries, eixos, tooltips e alternativas acessíveis.

### Cobertura disponível

- `scripts/checks/e2e-test.cjs`: fluxos integrados, ARIA, teclado, foco, loading, erro, vazio, nenhum resultado, hashes, recarga, histórico, ausência de overflow e estados representativos;
- `scripts/checks/visual-test.cjs`: 22 baselines persistentes — 21 regiões desktop/notebook e um baseline móvel do PNE 2026 — com tolerância de 0,2% e PNG de diferença quando houver falha;
- viewports cobertos: 1366×768, 1280×720, 1024×768, 768×1024, 390×844 e 320×568, além do smoke de zoom previsto no guia.

### Validação obrigatória para mudanças futuras

Toda mudança futura que alcance a interface deve executar:

```text
npm run test:e2e
npm run test:visual
npm run lint
npm run build
git diff --check
```

Referências visuais só devem ser atualizadas deliberadamente com `npm run update:visual`, após revisão da diferença.

## 5. Dívidas técnicas fora da migração

As questões abaixo não reabrem UI-01 a UI-18 e devem receber planejamento próprio:

- **bundle JavaScript acima de 500 kB:** exige análise de divisão de código, dependências e carregamento; não é pendência visual;
- **CSS legado ativo:** `src/App.css` permanece necessário para shell, composições locais, especificidade, ordem de cascata, exceções PNE/Financeiro e breakpoints estruturais. O legado está inventariado e não deve ser removido sem mapeamento de consumidores e baseline;
- **melhorias futuras de produto ou design:** novos fluxos, conteúdo, recursos, redesign, revisão de arquitetura de informação e evolução visual devem começar com escopo e aprovação próprios, seguindo `docs/GUIA_DE_DESIGN.md`.

## 6. Critérios de aceite de qualquer mudança futura

- preservar identidade institucional, dados, cálculos, filtros, regras de negócio e textos analíticos;
- comparar comportamento visual e funcional antes/depois;
- validar primeiro 1366×768, 1280×720 e 1024×768; depois 768×1024, 390×844 e 320×568;
- testar teclado, foco, contraste, zoom de 200%, texto longo, valores grandes, loading, erro e ausência;
- executar lint, build e testes relevantes;
- atualizar o estado, a evidência e os consumidores deste plano;
- remover regra legada somente após confirmar todos os consumidores.

## 7. Histórico relacionado

Os registros abaixo oferecem contexto e não definem regra ativa:

- [Auditoria visual — etapa 02](historico-ui/AUDITORIA_VISUAL_PNE_02.md)
- [Auditoria de interação e navegabilidade](historico-ui/AUDITORIA_INTERACAO_PNE.md)
- [Proposta de sistema visual comum](historico-ui/DESIGN_SYSTEM_PNE_PROPOSTA.md)
- [Inventário histórico de gráficos](historico-ui/INVENTARIO_GRAFICOS_PNE.md)

## 8. Iniciativa de identidade editorial SESI-RS (2026-07-12)

Esta iniciativa sucede a migração UI-01 a UI-18 sem reabrir seus contratos. O
escopo visual cobre o shell, a barra de contexto, a Home, PNE 2014–2024, PNE
2026–2036, metas legais, Diagnóstico Municipal, Educação, Sistema S e todos os
módulos financeiros. Dados, JSONs, cálculos, filtros, aliases, fontes,
conteúdo analítico e regras de negócio permaneceram inalterados.

- `design-tokens.css` recebeu a paleta editorial SESI-RS, superfícies de papel,
  sinais ocre/terracota, raios moderados e a escala de composição revisada.
- `institutional-refresh.css` consolidou a direção compartilhada: shell com
  malha discreta, heróis editoriais, superfícies contínuas, índices, controles,
  cards exploráveis, tabelas, gráficos, fontes e estados.
- A barra lateral e o drawer mantêm os fluxos de teclado, foco, Escape,
  restauração de foco e abertura exclusiva dos grupos. O contexto municipal
  continua visível na navegação.
- Home, PNE, Educação, Diagnóstico e Financeiro usam a mesma anatomia de
  título, síntese, filtro, evidência e fonte; exceções de domínio continuam
  apenas onde a semântica exige.
- A documentação permanente está em [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

Evidência da rodada: screenshots revisados em 1366×768, 1280×720, 1024×768 e
390×844, incluindo drawer mobile e detalhe aberto do PNE; auditoria de rotas
confirmou zero overflow horizontal em 12 rotas principais nos viewports de
390×844 e 1024×768. `npm run test:e2e`, `npm run lint`, `npm run build` e
`git diff --check` devem permanecer como critérios de aceite desta iniciativa;
baselines visuais foram atualizados deliberadamente após a revisão final.

## 9. Segunda rodada — densidade, insets e leitura linear (2026-07-12)

Esta rodada preserva a direção editorial SESI-RS da iniciativa anterior e não
altera dados, JSONs, cálculos, filtros, metas, textos metodológicos, fontes,
classificações, URLs, aliases ou regras de negócio.

- `design-tokens.css` agora explicita a densidade comum (`24/28/16` px), os
  insets de painel (`24/20/16` px) e a escala vertical compacta dos heróis;
  `institutional-refresh.css` aplica os valores aos cabeçalhos de Home, PNE,
  metas legais, Diagnóstico, Educação e Financeiro sem reduzir corpo, dados ou
  controles abaixo de 44 px.
- `education-pages.css` usa `--education-panel-padding` em desktop,
  intermediário e mobile para manter o mesmo respiro em hero, filtros,
  resumos, detalhes, gráficos, tabelas, metodologia, demanda e estados do
  módulo; o estado sem município também recebe o inset editorial.
- Diagnóstico deixou de renderizar a navegação interna Panorama/Prioridades/
  Temas. O estado de âncora, os IDs, os listeners e os estilos órfãos foram
  removidos; a ordem natural mantém síntese, filtro, prioridades e temas, com
  impressão, cópia, teclado e conteúdo preservados.
- `CyclePage` deixou de renderizar somente a faixa intermediária redundante
  `meta-grid-header`; contagens, status, títulos, município no hero, resumo do
  ciclo, detalhe, navegação e notas metodológicas permanecem.

A evidência final deve cobrir as 22 regiões visuais, as rotas solicitadas em
1366×768 e o drawer mobile em 390×844, além de loading, vazio, erro, texto
longo, valores grandes, foco e teclado. O aceite é `npm run lint`,
`npm run build`, `npm run test:e2e`, `npm run update:visual`,
`npm run test:visual` e `git diff --check`.

## Referência estadual do RS no PNE 2026-2036 (2026-07-13)

O ciclo PNE 2026-2036 passou a carregar `referencia_estadual.json` em paralelo
ao payload municipal. `MetaCard` mantém o valor municipal e a meta como foco,
com a leitura secundária `Referência RS` e `Município vs RS` apenas quando há o
mesmo ano comparável. O bloco reutiliza tokens existentes, mantém foco de
teclado e não cria uma nova família visual.

O cálculo, o registro metodológico e a auditoria ficam em
`docs/pne2026_state_reference_methodology.md`; esta mudança de UI é apenas o
consumidor da referência e não redefine a gramática visual do guia.

## Referência estadual do RS no PNE 2014–2024 (2026-07-13)

O ciclo encerrado passou a carregar um artefato estadual específico, com a
mesma leitura secundária `Referência RS` / `Município vs RS` dos cards do ciclo
2026–2036. A comparação usa o ano final efetivamente apresentado pelo
município; portanto, indicadores censitários anteriores a 2024 não são
forçados para o último ano do ciclo.

Foram habilitados 10 indicadores com numerador e denominador brutos
compatíveis; 12 permanecem bloqueados por índice, percentual sem contagens,
razão de médias ou indicador meramente informativo. O registro, a cobertura,
os exemplos e os motivos ficam em
`docs/pne2014_state_reference_methodology.md` e no artefato publicado em
`public/data/pne_2014_2024/referencia_estadual.json`.

## Legibilidade da meta no detalhe do PNE (2026-07-14)

O valor municipal no acompanhamento da meta passou a usar superfície neutra,
texto forte e borda canônica, enquanto a linha do marcador preserva o tom de
status. Nos gráficos do ciclo vigente, o rótulo visual da referência foi
reduzido de `Referência 2036 {valor}` para `Meta {valor}`; ciclo, ano, série,
fonte e alternativa textual permanecem disponíveis sem alteração de dados.

## Contexto e leitura rápida em Educação (2026-07-14)

O hero educacional passou a preencher o painel lateral com rótulo contextual,
município em destaque, seção atual e quantidade de indicadores da seção,
seguindo a hierarquia editorial de Home e PNE. A leitura rápida deixou de usar
o ponto de status herdado; título, texto, tom semântico e dados foram
preservados, com resposta fluida em desktop, notebook, tablet e celular.

## Primeira fase de convergência real dos cards (2026-07-15)

Educação e Financeiro passaram a compartilhar, em `platform-ui.css`, a mesma
anatomia editorial dos cards exploráveis já aprovada no guia: contexto e
status no topo, título e descrição, valor principal com Ano/Variação, bloco de
Leitura/Período e rodapé de ação. A divergência encontrada era de implementação:
o JSX compartilhado já expunha essas regiões, mas a maior parte da gramática
visual permanecia restrita a `.educacao-page`; por isso o catálogo isolado e os
cards financeiros ainda recaíam na composição antiga.

- `design-tokens.css` passou a explicitar o padding comum e a altura mínima
  móvel; `platform-ui.css` tornou-se o proprietário da grade, hierarquia,
  truncamento, direção semântica, container query e reflow móvel dos dois
  domínios. A duplicação equivalente foi removida de `education-pages.css`.
- Cards informativos de resumo e resultado de Educação foram preservados como
  exceção funcional: não são exploráveis e não reproduzem a anatomia comum.
- Nenhum componente, dado, JSON, cálculo, filtro, regra de negócio ou conteúdo
  analítico foi alterado. `public/data/` e `data_pipeline/` permaneceram sem
  diferenças. O guia não mudou porque a decisão reutilizável já estava
  registrada; esta rodada apenas convergiu a implementação ao contrato vigente.
- Medições nas rotas reais confirmaram altura de 324 px e ausência de overflow
  em 1366 e 1024 px. Em 390 px, os cards fizeram reflow para 367 px, sem corte
  de título, descrição ou valor. Educação mediu 320/475/348 px de largura e
  Financeiro 311/459/316 px, respectivamente.
- O JavaScript gerado permaneceu em 754.592 bytes. O CSS total passou de
  560.398 para 564.131 bytes (+3.733 bytes; +0,67%), sem novo chunk inicial
  acima de 500 kB.

Evidência final: `npm run test:dev-ui:visual` 26/26, `npm run test:dev-ui`,
`npm run typecheck`, `npm run test:education` 9/9,
`npm run test:app-routing` 7/7, `npm run test:e2e`, `npm run lint`,
`npm run build` e `npm run test:visual` 23/23. A inspeção nas rotas reais cobriu
1366, 1024 e 390 px, com console limpo e navegação/foco preservados.

Baselines isolados atualizados deliberadamente:

- `tests/dev-ui-visual/baselines/cards-explorable-states.mobile.png`
- `tests/dev-ui-visual/baselines/cards-explorable-states.notebook.png`
- `tests/dev-ui-visual/baselines/education-search.desktop.png`
- `tests/dev-ui-visual/baselines/finance-module-cards.desktop.png`
- `tests/dev-ui-visual/baselines/finance-module-cards.mobile.png`

Baselines públicos atualizados deliberadamente, após revisão dos diffs:

- `scripts/checks/visual-baselines/fundeb-1024x768.png`
- `scripts/checks/visual-baselines/fundeb-1280x720.png`
- `scripts/checks/visual-baselines/fundeb-1366x768.png`
- `scripts/checks/visual-baselines/siope-1024x768.png`
- `scripts/checks/visual-baselines/siope-1280x720.png`
- `scripts/checks/visual-baselines/siope-1366x768.png`

## Segunda fase de convergência real dos controles de exploração (2026-07-15)

Busca, filtros de categoria, controles segmentados, abas de conteúdo, toolbars
e resumos de resultado passaram a usar uma gramática compartilhada em
`platform-ui.css`. A rodada priorizou Educação, FUNDEB, PNATE e SIOPE e
reaproveitou PNE somente onde a função era equivalente. Diagnóstico permaneceu
como consumidor da mesma base de filtros, sem mudança funcional ou de conteúdo.

- `SearchField`, `CategoryTabs` e `SegmentedControl` continuam sendo os
  componentes canônicos. Busca ganhou estados vazio, preenchido, desabilitado e
  limpeza com ícone, preservando o foco após limpar; filtros e segmentos passaram
  a aceitar opções desabilitadas e rótulos longos sem corte.
- `platform-exploration-toolbar` tornou-se a composição comum para busca,
  recorte e contexto do resultado. Ela distribui os controles em desktop e
  notebook e faz reflow vertical em celular; PNATE usa a variante de controle
  único. `platform-results-summary` consolida a leitura compacta de contexto em
  PNE, metas legais e SIOPE.
- As diferenças funcionais continuam explícitas: filtros de categoria são grupos
  de botões com `aria-pressed` e contagens; segmentos representam uma escolha
  exclusiva; abas de detalhe usam `tablist`, `tab`, `tabpanel`, `aria-selected`
  e navegação pelas setas. A aparência não aproxima controles com semânticas
  diferentes.
- Os tokens comuns agora registram padding, espaçamento e largura máxima da
  busca/toolbars. Regras duplicadas de composição foram removidas de
  `education-pages.css` e `financial-pages.css`; `App.css` não foi alterado e
  continua sendo legado ativo, não referência para novos padrões.
- O catálogo isolado passou a cobrir busca vazia, preenchida e desabilitada,
  limpeza, rótulos longos, contagens, opção desabilitada, toolbar completa,
  reflow e abas educacionais reais. Nenhum dado, JSON, cálculo, regra de negócio,
  fonte ou conteúdo analítico mudou; `public/data/` e `data_pipeline/`
  permaneceram sem diferenças. O guia não mudou porque a distinção entre
  busca, filtro, segmento e aba já estava registrada; esta rodada converge a
  implementação ao contrato vigente.

A inspeção nas rotas reais de Educação, FUNDEB, PNATE, SIOPE e PNE 2014
confirmou zero overflow horizontal global em 1366, 1024 e 390 px. Buscas
mantiveram 44 px de altura, segmentos 46 px quando em linha, toolbars fizeram
reflow sem corte e abas extensas conservaram rolagem interna no celular. A
navegação por teclado, o foco visível, a troca de abas por setas e a limpeza de
busca com retenção de foco foram verificadas na aplicação e no catálogo.

O bundle JavaScript passou de 754.592 para 755.087 bytes (+495 bytes; +0,07%).
O CSS total passou de 564.131 para 565.945 bytes (+1.814 bytes; +0,32%): o CSS
principal passou de 524.396 para 526.800 bytes, enquanto o chunk de Educação
recuou de 39.735 para 39.145 bytes. Não houve nova dependência, novo componente
de biblioteca ou novo chunk inicial relevante.

Evidência final: `npm run typecheck`, `npm run test:education` 9/9,
`npm run test:app-routing` 7/7, `npm run test:dev-ui`,
`npm run test:dev-ui:visual` 27/27, `npm run lint`, `npm run build`,
`npm run test:e2e`, `npm run test:visual` 23/23 e `git diff --check`.

Baselines isolados atualizados deliberadamente:

- `tests/dev-ui-visual/baselines/navigation-search-filters.desktop.png`
- `tests/dev-ui-visual/baselines/navigation-search-filters.notebook.png`
- `tests/dev-ui-visual/baselines/navigation-search-filters.mobile.png`
- `tests/dev-ui-visual/baselines/education-search.desktop.png`
- `tests/dev-ui-visual/baselines/education-detail.notebook.png`

Baselines públicos atualizados deliberadamente, após revisão dos diffs:

- `scripts/checks/visual-baselines/pne-2014-1366x768.png`
- `scripts/checks/visual-baselines/pne-2014-1280x720.png`
- `scripts/checks/visual-baselines/pne-2014-1024x768.png`
- `scripts/checks/visual-baselines/pne-2014-390x844.png`
- `scripts/checks/visual-baselines/pne-2026-1366x768.png`
- `scripts/checks/visual-baselines/pne-2026-1280x720.png`
- `scripts/checks/visual-baselines/pne-2026-1024x768.png`
- `scripts/checks/visual-baselines/pne-2026-390x844.png`
- `scripts/checks/visual-baselines/fundeb-1366x768.png`
- `scripts/checks/visual-baselines/fundeb-1280x720.png`
- `scripts/checks/visual-baselines/fundeb-1024x768.png`
- `scripts/checks/visual-baselines/siope-1366x768.png`
- `scripts/checks/visual-baselines/siope-1280x720.png`
- `scripts/checks/visual-baselines/siope-1024x768.png`

## Terceira fase de convergência real das tabelas e estados de dados (2026-07-15)

As superfícies tabulares de Educação, FUNDEB, PNATE, SIOPE, PNE e Sistema S
passaram a compartilhar a gramática de `platform-ui.css`: superfície, borda,
raio, cabeçalho, célula, separador, números tabulares, alinhamento, foco e
overflow local. Diagnóstico e VAAR não possuem tabela HTML própria nesta
rodada; seus estados vazios e de indisponibilidade foram incluídos na mesma
linguagem visual sem alterar a composição ou a lógica dos módulos.

- `design-tokens.css` passou a registrar altura do cabeçalho, padding das
  células, larguras mínimas, colunas de borda, distância da fonte, sombra de
  overflow e alturas dos estados. Cabeçalhos longos podem quebrar em mais de
  uma linha sem reduzir a fonte; valores numéricos e seus cabeçalhos ficam
  alinhados à direita, com numerais tabulares.
- `EducationTable` identifica colunas numéricas pelos valores ou pelo contrato
  explícito da coluna. Zero continua sendo renderizado como valor; `null` e
  demais ausências mantêm o travessão dominante, agora com nome acessível
  `Dado não disponível`. FUNDEB e PNATE distinguem a ausência da primeira
  comparação da variação estável: alta, queda, estabilidade e indisponibilidade
  preservam sinais e textos, usando cor apenas como apoio.
- Regiões largas usam `overflow: auto`, largura mínima por família, sombra
  interna discreta, scrollbar local, contenção de overscroll e foco visível.
  O teste visual do catálogo mede em 390 px que `scrollWidth > clientWidth`,
  que `scrollLeft` se move e que a tabela não aumenta a largura do documento.
  As colunas permanecem disponíveis; nenhuma foi ocultada ou convertida em
  card.
- `ContentState` expõe a família e o tipo do estado, conserva `role="status"`
  ou `role="alert"` e anuncia `aria-busy` no carregamento. `LoadingState`
  ganhou skeleton suave com altura previsível e fallback sem animação em
  `prefers-reduced-motion`. Vazio, sem resultados, indisponibilidade, erro e
  cobertura parcial mantêm textos e regras de aplicação próprios, mas usam
  superfícies visualmente distinguíveis e proporcionais.
- Avisos existentes de registro incompleto do SIOPE e qualidade/cobertura das
  projeções educacionais usam a variante compartilhada de cobertura. A regra
  de negócio não mudou: ausência municipal não foi convertida em ausência
  estadual e dado não localizado não foi convertido em inexistência.
- Permaneceram específicos: a altura máxima de 360 px dos componentes de
  cálculo do PNE; o destaque da coluna mais recente na matriz de infraestrutura;
  o registro textual do SIOPE; as unidades, mínimos legais e formatadores de
  FUNDEB/PNATE; e as superfícies sem tabela de VAAR e Diagnóstico.
- Foram removidas 443 linhas de anatomia tabular duplicada de `App.css`,
  `education-pages.css`, `financial-pages.css` e `institutional-refresh.css`.
  `App.css` foi alterado somente para retirar regras comprovadamente
  substituídas pela primitiva compartilhada; as exceções ainda consumidas
  permaneceram. O saldo do bundle CSS foi de 565.945 para 565.308 bytes
  (-637 bytes; -0,11%). O JavaScript passou de 755.087 para 757.538 bytes
  (+2.451 bytes; +0,32%) pelos marcadores acessíveis e skeletons, sem nova
  dependência ou chunk inicial acima de 500 kB.

O catálogo cobre tabela larga, cabeçalhos e extremos longos, moeda/percentual
por meio dos consumidores reais, valor grande, zero, ausência, variações,
loading, vazio, erro, indisponibilidade e série parcial. A inspeção final cobriu
1366×900, 1024×900 e 390×844; no aplicativo, o E2E cobriu 1366×768,
1280×720 e 1024×768 e confirmou foco, teclado e ausência de overflow global.
`npm run test:visual` permaneceu 23/23 sem atualização de referência pública.

Evidência final: `npm run typecheck`, `npm run test:education` 9/9,
`npm run test:app-routing` 7/7, `npm run test:dev-ui`,
`npm run test:dev-ui:visual` 27/27, `npm run lint`, `npm run build`,
`npm run test:e2e`, `npm run test:visual` 23/23 e `git diff --check`.
`public/data/` e `data_pipeline/` permaneceram sem diferenças.

Baselines isolados atualizados deliberadamente, após revisão dos diffs:

- `tests/dev-ui-visual/baselines/tables-content-overflow.notebook.png`
- `tests/dev-ui-visual/baselines/tables-content-overflow.mobile.png`
- `tests/dev-ui-visual/baselines/tables-states.desktop.png`
- `tests/dev-ui-visual/baselines/states-system-feedback.desktop.png`
- `tests/dev-ui-visual/baselines/states-system-feedback.mobile.png`
- `tests/dev-ui-visual/baselines/charts-system-states.desktop.png`
- `tests/dev-ui-visual/baselines/education-search.desktop.png`
- `tests/dev-ui-visual/baselines/education-demand-methodology.mobile.png`

Nenhum baseline público foi alterado nesta fase.

## Quarta fase de convergência real dos gráficos e visualizações (2026-07-15)

A auditoria confirmou que a aplicação não usa biblioteca externa de gráficos:
as visualizações são SVGs React próprios. `IndicatorHistoryChart` atende PNE,
FUNDEB, PNATE e SIOPE; `EducationLineChart`, `EducationBarChart` e
`EducationStackedBarChart` atendem Educação e Sistema S; os componentes
complementares cobrem matrículas, dependência administrativa e projeções. A
comparação por faixa etária permanece construída no detalhe educacional, mas
passou a consumir as mesmas primitivas e a mesma gramática visual. Sparklines
continuam como microvisualizações dos cards, sem receber a anatomia de gráfico
analítico; o mapa do RS não foi tratado como gráfico. Diagnóstico e VAAR não
possuem visualização equivalente nesta rodada.

- `chart-system.css` tornou-se o proprietário da superfície, cabeçalho, canvas,
  eixos, grades, rótulos, linhas, áreas, pontos, barras, foco, legenda, tooltip,
  estados e comportamento responsivo. `design-tokens.css` passou a explicitar
  padding, distância, largura de tooltip, halo de rótulo e linha de hover.
- `ChartTooltip` preserva a API de série única e ganhou leituras multissérie com
  marcadores e valores alinhados. O gráfico empilhado usa a mesma anatomia para
  expor todas as séries do ano, mantendo os formatadores existentes e
  distinguindo zero de `Dado não disponível`. `ChartLegend` e
  `ChartEmptyState` permanecem as primitivas reais; loading e erro usam variantes
  dos estados compartilhados, com altura próxima ao gráfico e `aria-busy`.
- Linhas educacionais e projeções passaram a criar segmentos independentes
  quando há `null`. Pontos e anos disponíveis continuam visíveis, mas a área não
  atravessa a lacuna, anos ausentes não recebem zero e séries parciais não são
  interpoladas. Domínios, escalas, mínimos, máximos, metas, algoritmos de ticks,
  arredondamentos e formatadores permaneceram nos componentes originais.
- Eixos e grades usam os tokens canônicos e texto final mínimo de 12 px; rótulos
  usam halo da superfície para permanecer legíveis. Histórico e projeção
  mantêm linha sólida/tracejada e legenda textual; a meta conserva o sinal ocre
  e o rótulo compacto `Meta {valor}`. Barras mantêm ordem, orientação, raio e
  espaçamento definidos por cada gráfico.
- Em desktop e notebook, títulos, controles, gráfico, legenda e fonte mantêm a
  hierarquia editorial. Em 390 px, SVGs extensos usam rolagem horizontal local
  para não reduzir eixos e rótulos, legendas quebram sem overflow e tooltips
  invertem a direção junto às bordas. A inspeção real confirmou zero overflow
  global em Educação, PNE e FUNDEB; quatro projeções educacionais mantiveram
  legendas e 92 marcas focáveis, e o detalhe do PNE manteve `Meta 60%`, fonte e
  11 pontos focáveis.
- Permaneceram específicos: domínios adaptativos do PNE, domínio percentual e
  de índice, escalas financeiras e seus formatadores, geometria horizontal e
  vertical das barras, janela 2016–2036 da projeção, quantidade atual de ticks e
  rótulos, comparação etária, alturas financeiras e as fontes/notas de cada
  domínio. Essas diferenças carregam significado ou composição próprios e não
  foram abstraídas.
- Foram removidas 650 linhas de anatomia de gráfico duplicada de `App.css`.
  `chart-system.css` recebeu a implementação canônica e o saldo do bundle CSS
  caiu de 565.308 para 562.024 bytes (-3.284 bytes; -0,58%). O JavaScript passou
  de 757.538 para 759.481 bytes (+1.943 bytes; +0,26%) pelas lacunas semânticas,
  tooltip multissérie e asserções estruturais. Permaneceram 20 chunks JavaScript,
  sem dependência ou novo chunk inicial relevante.

O catálogo passou a cobrir linha curta, longa, parcial, constante, valores
próximos, barras com grande escala, legenda longa, tooltip multissérie, loading,
vazio e erro em desktop, notebook e mobile. As asserções verificam segmentos
separados para valores nulos, ausência de overflow global, anatomia multissérie,
contenção do tooltip e fechamento por Escape. A regressão pública permaneceu
23/23 sem mudança de baseline.

Baselines isolados atualizados deliberadamente, após revisão dos diffs:

- `tests/dev-ui-visual/baselines/charts-line-series.desktop.png`
- `tests/dev-ui-visual/baselines/charts-line-series.notebook.png`
- `tests/dev-ui-visual/baselines/charts-line-series.mobile.png`
- `tests/dev-ui-visual/baselines/charts-types-scale.desktop.png`
- `tests/dev-ui-visual/baselines/charts-types-scale.notebook.png`
- `tests/dev-ui-visual/baselines/charts-types-scale.mobile.png`
- `tests/dev-ui-visual/baselines/charts-system-states.desktop.png`
- `tests/dev-ui-visual/baselines/charts-system-states.mobile.png`
- `tests/dev-ui-visual/baselines/education-detail.notebook.png`
- `tests/dev-ui-visual/baselines/education-demand-methodology.mobile.png`

Evidência final: `npm run typecheck`, `npm run test:education` 9/9,
`npm run test:app-routing` 7/7, `npm run test:dev-ui`, categorias visuais de
gráficos, Educação e Financiamento, `npm run lint`, `npm run build`,
`npm run test:e2e`, `npm run test:visual` 23/23 e `git diff --check`.
`public/data/` e `data_pipeline/` permaneceram sem diferenças. Nenhum baseline
público foi alterado nesta fase.

## Fase final de estabilização e encerramento (2026-07-15)

O ponto de partida foi a árvore limpa no commit
`88a3b75807e5fb5b1fc320234367126fd37086e3` (`Refine dashboard layout and
shared UI styles`). A suíte commitada passou integralmente após iniciar o Vite
exigido pelos harnesses públicos. A primeira tentativa de E2E sem servidor
falhou com `ERR_CONNECTION_REFUSED`; o código da aplicação não foi alterado
para mascarar essa pré-condição.

O inventário permanente foi consolidado em `docs/DESIGN_SYSTEM.md`, cobrindo
superfícies, cabeçalhos, cards, valores, unidades, badges, busca, filtros,
segmentos, abas, toolbars, tabelas, estados, cobertura, gráficos, eixos, grades,
legendas, tooltips, fontes, notas e navegação. Para cada família estão
registrados implementação canônica, tokens, consumidores, variantes e
diferenças funcionais preservadas. A responsabilidade final ficou assim:

- `design-tokens.css`: somente valores, escalas e medidas canônicas;
- `platform-ui.css`: gramática compartilhada de superfície, controles, cards,
  tabelas, estados e composição editorial comum;
- `chart-system.css`: anatomia canônica das visualizações;
- CSS de domínio: layout, composição e exceção funcional justificada;
- `App.css`: legado ativo, impressão e exceções históricas não migradas sem
  evidência; continua proibido para padrões novos.

A auditoria estática e de consumidores removeu quatro componentes sem qualquer
importador estático, lazy ou dinâmico: `IndicatorList`,
`InstitutionalBrandStrip`, `RankingBlock` e `RioGrandeDoSulMap`. Também removeu
`formatRankingValue`, usado somente pelo componente órfão; estilos dedicados ao
mapa, à faixa institucional e ao ranking; 27 blocos CSS exatamente duplicados
no mesmo contexto; e chaves duplicadas de desenvolvimento em `package.json`.
O grafo final não registra componente sem importador conhecido.

Foram removidas 374 linhas de CSS: 294 de `App.css`, 76 de
`navigation-shell.css`, três de `financial-pages.css` e uma de
`institutional-refresh.css`. `App.css` passou de 423.829 para 417.695 bytes.
Os quatro componentes removidos somavam 235 linhas e o helper, 22 linhas.

Itens legados preservados deliberadamente:

- a regra responsiva de `.education-indicator-card-grid` permanece em
  `App.css` e `education-pages.css`, pois o catálogo de cards pode carregar o
  componente sem importar o chunk da página de Educação;
- seletores de gráfico fora de `chart-system.css` permanecem somente quando
  escopados a PNE, Educação ou Financeiro e expressam altura, composição,
  escala visual ou exceção do domínio; tooltip e legenda canônicos não vazam;
- os `!important` restantes pertencem a reduced motion, impressão, reset de
  conteúdo técnico financeiro, neutralização de pseudo-elementos legados da
  navegação ou estabilização exclusiva do catálogo;
- media queries, valores locais e especificidade histórica ainda presentes em
  `App.css` não foram movidos em massa: a remoção sem prova poderia alterar
  páginas, impressão ou estados que não compartilham anatomia.

`scripts/checks/ui-architecture-test.mjs` passou a proteger, com baixo custo, a
ordem canônica dos imports, o teto flexível de 440.000 bytes para `App.css`, a
existência de importador para todo CSS de `src/styles`, a ausência de tooltip e
legenda canônicos fora de `chart-system.css`, a ausência de `any` explícito na
camada TypeScript central e a não inclusão de resultados/diffs visuais
temporários no Git. O teste existente continua responsável por IDs duplicados
de cenário, isolamento do catálogo e ausência do catálogo em `dist`.

O catálogo final possui 17 cenários, nove categorias e 31 combinações visuais:
Fundamentos 3, Cards 4, Educação 3, PNE 2, Financiamento 2, Navegação 4,
Tabelas 3, Gráficos 8 e Estados 2. Nenhum cenário ou baseline foi adicionado por
simetria. `MunicipalitySelector`, drawer, restauração de foco entre rotas e
carregamento municipal permanecem no E2E porque dependem do shell real.

As páginas reais foram verificadas em 1366×768, 1280×720, 1024×768 e, na
auditoria final ampliada, 390×844. A cobertura mobile percorre Home, visão geral
do PNE, PNE 2014–2024, PNE 2026–2036, Metas legais, as oito seções de Educação,
Diagnóstico, visão geral financeira, SIOPE, FUNDEB, VAAR, PNATE e Sistema S.
Não houve overflow global nem erro de console. Foco visível, contenção e Escape
do drawer, restauração de foco, `aria-current`, `aria-selected`,
`aria-expanded`, `aria-busy`, ausência acessível, tabelas semânticas, tooltips
por teclado e reduced motion permaneceram cobertos. A fonte de dados manteve
12 px e contraste medido de 5,15:1.

Bundle antes/depois:

| Métrica | Antes | Depois | Variação |
| --- | ---: | ---: | ---: |
| JavaScript total | 759.481 B | 759.481 B | 0 |
| Chunk inicial | 261.211 B | 261.211 B | 0 |
| CSS total | 562.024 B | 558.096 B | -3.928 B (-0,70%) |
| CSS principal | 522.992 B | 519.064 B | -3.928 B |
| Chunks JavaScript | 20 | 20 | 0 |
| Arquivos em `dist` | 2.543 | 2.543 | 0 |
| Maior chunk | 261.211 B | 261.211 B | 0 |
| Build aproximado | 4,59 s | 4,22 s | -0,37 s |

Não existe chunk acima de 500 kB. Os tempos são indicativos do ambiente local,
não metas rígidas:

| Suíte | Antes | Depois |
| --- | ---: | ---: |
| Regressão isolada completa | 14,18 s | 17,23 s |
| E2E público | 93,29 s | 64,44 s |
| Regressão pública | 37,12 s | 38,58 s |

A variação não indica regressão funcional ou de bundle: os mesmos 31 e 23
casos passaram, e o E2E final ainda acrescentou a varredura mobile das páginas
principais. Cache de Vite, fontes e sistema operacional afetam essas medições.

Evidência final: `npm run typecheck`, `npm run test:education` 9/9,
`npm run test:app-routing` 7/7, `npm run test:dev-ui`,
`npm run test:dev-ui:visual` 31/31, categorias `cards`, `navigation`, `tables`,
`charts` e `states`, `npm run test:ui-architecture`, `npm run lint`,
`npm run build`, `npm run test:e2e`, `npm run test:visual` 23/23 e
`git diff --check`. Nenhum baseline isolado ou público foi alterado.
`public/data/`, `data_pipeline/`, cálculos, filtros, séries, escalas,
formatadores, rotas, hashes, aliases, loaders e comportamento público
permaneceram sem diferenças.

Pendência real remanescente: `App.css` continua como dívida técnica ativa, mas
sem seletor órfão relevante comprovado nesta auditoria. Qualquer nova redução
deve ser uma migração própria, baseada em consumidor, catálogo, página real e
regressão; não faz parte da convergência visual encerrada.

## Auditoria incremental de código morto (2026-07-15)

O ponto de partida desta rodada foi a árvore limpa no commit
`653e717ed71d30c600bb3a8b4829ab61aa2274d8` (`Document stabilized UI catalog
and validation rules`). A auditoria cobriu os 3.086 arquivos rastreados, 153
arquivos de código, 131 módulos de `src`, 359 símbolos exportados, 11 folhas de
estilo, 1.222 classes CSS únicas, as 16 dependências declaradas e as entradas
de `scripts`, `public`, testes e documentação.

O grafo estático foi resolvido com as mesmas extensões do bundler, incluindo os
imports `.js` que apontam para implementações TypeScript. Foram encontradas 417
arestas e 16 imports dinâmicos. `src/main.jsx` é o único módulo de `src` sem
importador, por ser a entrada explícita do Vite. Não restou componente, página,
hook, helper ou módulo órfão de alta confiança.

Foram removidas 20 definições sem consumidor comprovado:

- `FinancialReferenceBox`, `isAvailableIndicator`,
  `getEducationSourceCatalogItem`, `getFinancialModuleByKey` e
  `getEstruturaVersaoLabel`;
- `getPne2026LegalGoalById`, `getPne2026LegalGoalsByIndicatorId` e
  `getPne2026LegalGoalCoverageSummary`;
- os tipos `PreviewWidthOption` e `ParseAppHash`;
- `formatYear`, `getLatestFromSeries`, `getLatestValue`, `getLatestYear`,
  `buildEvolutionText`, `filterOptionsFromMap` e o helper local
  `hasSeriesData`;
- `cleanInterpretationText`, `improveZeroValueInterpretation` e
  `buildAccumulativeExpansionInterpretation`.

Seis logs temporários de desenvolvimento, quatro deles vazios e dois contendo
somente a inicialização do Vite, foram removidos da raiz. `.gitignore` passou a
bloquear exatamente `.codex-vite*.log` e `tmp-vite-*.log`, sem criar uma regra
ampla para evidências legítimas.

A análise CSS combinou parser PostCSS, consumidores estáticos, nomes compostos
em runtime e confirmação no catálogo e nas páginas reais. Foram removidas 583
regras integralmente órfãs, 212 ramificações mortas de seletores mistos e 13
declarações de três propriedades locais sem leitura:
`--education-panel-gap`, `--education-direction-accent` e
`--education-direction-border`. A fonte encolheu 99.541 bytes, dos quais 93.161
bytes pertenciam a `App.css`. Regras vivas não foram reordenadas e nenhum token
do sistema visual foi excluído.

Itens de confiança média ou baixa preservados deliberadamente:

- `scripts/checks/e2e-debug.cjs`,
  `scripts/checks/verify-data-source-notes.cjs` e
  `scripts/export_education_indicators.py`, pois são ferramentas manuais
  plausíveis mesmo sem chamador em `package.json`;
- artefatos, saídas históricas, comparações `round4`, baselines visuais e
  símbolos consumidos pela geração dessas evidências;
- tokens sem uso local atual, por constituírem API visual estável;
- logos institucionais, favicon, `public/data/`, `data_pipeline/`, cálculos,
  filtros, séries, escalas, formatadores vivos, rotas, hashes, aliases, loaders
  e configurações públicas.

Nenhuma dependência, script de pacote, asset institucional, baseline ou arquivo
de dados foi removido. As 20 rotas-chave foram abertas em 1366×768, 1024×768 e
390×844: todas concluíram o carregamento lazy com um único `h1`, sem overflow
global, alerta ou erro de console. Home e PNATE também foram inspecionadas
visualmente nos extremos desktop e mobile.

Bundle antes/depois desta auditoria:

| Métrica | Antes | Depois | Variação |
| --- | ---: | ---: | ---: |
| JavaScript total | 759.481 B | 759.481 B | 0 |
| Chunk inicial | 261.211 B | 261.211 B | 0 |
| CSS total | 558.096 B | 492.350 B | -65.746 B (-11,78%) |
| CSS principal | 519.064 B | 455.407 B | -63.657 B |
| CSS de Educação | 39.032 B | 36.943 B | -2.089 B |
| Chunks JavaScript | 20 | 20 | 0 |
| Arquivos em `dist` | 2.543 | 2.543 | 0 |
| Maior chunk | 261.211 B | 261.211 B | 0 |

Evidência exigida para o estado final: `npm run typecheck`,
`npm run test:education` 9/9, `npm run test:app-routing` 7/7,
`npm run test:dev-ui`, `npm run test:dev-ui:visual` 31/31,
`npm run test:ui-architecture`, `npm run lint`, `npm run build`,
`npm run test:e2e`, `npm run test:visual` 23/23 e `git diff --check`.
As diferenças permanecem vazias em `public/data/`, `data_pipeline/` e nos
diretórios de baseline. Nenhum baseline foi atualizado para fazer a regressão
passar.
