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
- **Hash financeiro final:** `#financeiros?modulo=fundeb&detalhe=<key>`, `#financeiros?modulo=pnate&detalhe=<key>` e `#financeiros?modulo=siope&detalhe=<slug>`. Índices nunca são persistidos.

## 4. Resumo final da migração

### Componentes e primitivas compartilhadas

- estrutura e interação: `ExplorableIndicatorCardFrame`, `DetailNavigation`, `useDetailViewNavigation`, `resolveDetailSequence` e `InteractionChevron`;
- estados e contexto: `ContentState`, `LoadingState`, `ErrorState`, `MunicipalitySelector` e `hashNavigation`;
- controles: `SearchField`, `SegmentedControl`, `CategoryTabs` e a gramática `platform-*`;
- dados auxiliares: `DataSourceNote`, `MethodNote`, `PneSourceNotes` e `getDataSourceParts`;
- gráficos e títulos: `Sparkline`, `ChartPrimitives`, `IndicatorChartHeader`, `FinancialChartFrame`, `PageHeadingText` e `DetailHeadingText`;
- tabelas: `EducationTable`, captions semânticos e regiões roláveis nomeadas e focáveis.

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
