# Plano de Migração da Interface — Dashboard PNE

> **Status: plano ativo.** Este documento acompanha implementação, evidências e critérios de aceite. Ele não cria decisões visuais: regras aprovadas pertencem ao [GUIA_DE_DESIGN.md](GUIA_DE_DESIGN.md).
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
| Gramática de controles | Visual implementado; componentes parcialmente implementados | `src/styles/platform-ui.css`, `CategoryTabs`, `DetailNavigation`, `MunicipalitySelector`, `CyclePage`, `EducacaoPage` | Busca, filtros, segmentos, abas e navegação local compartilham classes `platform-*`; busca, segmentos e abas ainda repetem JSX e comportamento em páginas. |
| Navegação e foco | Foco e restauração implementados; orquestração parcialmente compartilhada | `Layout`, `useDetailViewNavigation`, `DetailNavigation`, `navigationScroll`, páginas de ciclo, Educação e módulos financeiros | Trocas de página posicionam topo/foco e o retorno ao grid restaura contexto; seleção ativa, vizinhança e resets ainda são calculados pelos consumidores. |
| Cards exploráveis | Identidade e interação implementadas; arquitetura React parcial | `MetaCard`, `EducationIndicatorCard`, `FinancialIndicatorPrimitives`, `InteractionChevron`, `platform-ui.css` | Foco, seleção e affordance comum estão presentes; PNE, Educação e Financeiro mantêm estruturas React próprias. |
| Gráficos compartilhados | Primitivas e CSS implementados; molduras e cabeçalhos parciais | `ChartPrimitives`, `Sparkline`, `src/utils/sparkline.js`, `chart-system.css`, gráficos de PNE, Educação e complementares | Tooltip, legenda, vazio, foco de marcas, tipografia e a sparkline piloto são compartilhados; a responsabilidade por título e moldura ainda se repete. |
| Exceções PNE | Implementado | `pne-cycle-experience.css`, `CyclePage`, detalhes de indicador | Meta, ciclo, distância e projeção mantêm composição específica. |
| Exceções Financeiras | Implementado | `FundebPanel`, `PnatePanel`, `SiopeIndicatorsPanel`, `VaarPanel`, `SistemaSPanel` | Tabelas e leituras monetárias preservam contexto próprio. |
| Legado central | Transitório ativo | `src/App.css` e seus consumidores | Continua renderizando shell, páginas e regras locais; não é base para novos padrões. |

## 3. Pendências abertas

| ID | Item | Estado | Prioridade | Evidência e consumidores | Critério de aceite |
|---|---|---|---|---|---|
| UI-01 | Seletor municipal único e IDs ARIA únicos | Aberto | P1 | `MunicipalitySelector`, `App`, `ContextBar`; IDs fixos `municipio-selector-listbox` e opções derivadas de índice. | Uma única relação ARIA por instância, IDs gerados de forma única, ação de limpar/abrir com alvo adequado e lista extensa limitada após busca. |
| UI-02 | Estados compartilhados | Aberto | P1 | `LoadingState`, `ErrorState`, `EducacaoPage`, `SiopeIndicatorsPanel`, `FundebPanel`, `PnatePanel`, `VaarPanel`, `DiagnosticPanel` e detalhes usam estruturas paralelas. | Um contrato comum para loading, erro, vazio, sem resultado e indisponível, com anúncio, contexto e recuperação quando aplicável; estados de gráfico permanecem adaptadores compactos. |
| UI-03 | Navegação compacta em notebook estreito | Aberto | P1 | `Header`, `App.css`, `platform-ui.css`; em 1024 px a navegação ainda ocupa área vertical relevante. | Conteúdo prioritário, município e `h1` permanecem acessíveis na primeira dobra sem reduzir alvos ou ocultar contexto. |
| UI-04 | Tabelas semânticas e moldura comum | Aberto | P1 | `EducationTable`, `IndicatorComplementaryData`, `FundebPanel`, `PnatePanel`, `SiopeIndicatorsPanel`, `SistemaSPanel`; há tabelas anuais paralelas em FUNDEB e PNATE. | Caption, `scope`, alinhamento numérico, vazio contextual e overflow horizontal explícito em todas as famílias, sobre uma primitiva sem regras de formatação de domínio. |
| UI-05 | Contraste de tokens legados | Implementado (piloto) | P1 | Piloto limitado a `DataSourceNote`: `p.data-source-note` usa `--font-size-xs` (12 px) e `--text-soft`; os overrides conflitantes de FUNDEB, SIOPE, Financeiro, Educação e mobile foram removidos sem alterar `SourceLine`, eixos ou outros textos pequenos. O E2E mediu 12–13,44 px, `rgb(106, 101, 89)` ou a exceção `rgb(86, 82, 71)`, fundos `rgb(245, 243, 236)`/`rgb(255, 255, 255)` e contraste de 5,23:1–7,80:1. | Toda atribuição de fonte e a nota metodológica SIOPE que reutiliza essa gramática mantêm no mínimo 12 px, contraste AA e ausência de overflow; os demais usos legados de `--text-muted`, `--text-faint` e `--chart-axis` continuam fora deste piloto. |
| UI-06 | Responsividade de gráficos e tabelas extensas | Aberto | P2 | `App.css`, `chart-system.css`, gráficos e tabelas específicas mantêm larguras mínimas em alguns contextos. | Sem corte silencioso; gráfico e tabela informam overflow ou adaptam rótulos de forma determinística. |
| UI-07 | Extração gradual do legado | Em acompanhamento | P2 | Alteração controlada em `App.css`: a regra proprietária de `DataSourceNote` foi consolidada como `p.data-source-note`; foram removidos somente os overrides diretos que reduziam tamanho ou contraste em PNE, Educação e Financeiro. | Cada migração remove duplicação somente após equivalência visual/funcional e registra os consumidores restantes. |
| UI-08 | Redução de breakpoints locais | Em acompanhamento | P2 | `App.css` contém mais variações de media query que os intervalos aprovados. | Breakpoints adicionais só permanecem quando houver comportamento estrutural documentado. |
| UI-09 | Teste E2E e baseline visual | Em andamento | P1 | `scripts/checks/e2e-test.cjs` usa papéis, nomes acessíveis, labels e estados ARIA: Home, seleção de Áurea, PNE 2014–2024 e PNE 2026–2036, busca, abertura de card, retorno com foco restaurado, Educação, Financeiro/SIOPE, erros de console e overflow em 1366×768, 1280×720 e 1024×768. | Fluxos prioritários executam com seletores semânticos e sem overflow horizontal. Permanecem pendentes: teclado além da restauração de foco, estados de ausência/erro, valores e textos longos, e baseline visual persistente. |
| UI-10 | Semântica completa de abas | Aberto | P1 | `EducationIndicatorBreakdown` e `IndicatorComplementaryData` trocam painéis irmãos, mas ainda precisam de relações tab–panel e teclado completos. A navegação de módulos financeiros em `EducacaoPage` usa `tablist`, porém continua uma pendência semântica distinta. `platform-ui.css` compartilha apenas a aparência. | Toda aba real possui papel, estado, painel associado e navegação por teclado coerentes; navegação de módulo, filtros e segmentos permanecem componentes semanticamente distintos. |
| UI-11 | Fonte e nota metodológica comuns | Em andamento | P2 | `src/components/MethodNote.jsx` atende as duas ocorrências idênticas de comparabilidade em `FundebPanel` (detalhe e workspace legado), a nota metodológica de `PnatePanel` após a Visão geral quando `avisos.length > 0`, e o cabeçalho do `SiopeIndicatorsPanel`. No SIOPE, `DataSourceNote` permanece a apresentação da origem `SIOPE / FNDE`; `MethodNote` apresenta uma única vez a regra do 6º bimestre no contexto introdutório, e gráfico e tabela exibem somente a origem. `SistemaSPanel` agora usa `DataSourceNote` com o contexto do resolver `educacao/sistema_s`: a origem oficial `Censo Escolar / Sinopse Estatística da Educação Básica — INEP` aparece uma vez após a grade de Visão geral e vale para todo o módulo, sem repetição no gráfico ou tabela. O contrato continua restrito a `children` e `className`, preservando o elemento `p`, conteúdo e classes existentes. `src/utils/dataSourceNotes.js` expõe `getDataSourceParts(context)` como base estruturada (`source` e `methodology`), enquanto `getDataSourceNote(context)` permanece retrocompatível para todos os consumidores atuais. `scripts/checks/verify-data-source-notes.cjs` cobre o resolver, incluindo Sistema S; `scripts/checks/e2e-test.cjs` valida SIOPE e Sistema S em Alegrete, com fonte, ordem, métricas, gráfico, distribuição, tabela, aviso municipal de ausência de 2025 e ausência de confusão com o alerta de registro. O baseline visual restrito ao cabeçalho SIOPE e à Visão geral do Sistema S foi revisado em 1366×768, 1280×720 e 1024×768, sem overflow ou deslocamento; a persistência de baseline geral permanece em UI-09. | Fonte, método, cobertura, alerta, interpretação e referência legal permanecem responsabilidades distintas. Permanecem pendentes `SourceLine`, demais usos de `DataSourceNote`, PNE, Educação, Diagnóstico e VAAR; outros consumidores do resolver ainda não foram migrados para apresentação estruturada. Um eventual `SourceNote` e novas adoções devem usar a base estruturada sem alterar órgão, base, período, link, ressalva ou regra de resolução; cobertura, disponibilidade, alertas, interpretação e referências legais não entram nas primitivas. |
| UI-12 | Contexto endereçável de módulo e detalhe | Planejado | P2 | `App`, `Header`, páginas e navegação de detalhe usam estado local. A rota especial `#sistemas` perde o tema durante o carregamento municipal e retorna ao padrão; permanece registrada, sem correção nesta rodada. | Módulo, ciclo e detalhe podem ser retomados e compartilhados sem perder a política de foco e rolagem. |
| UI-13 | Primitiva comum de sparkline | Implementado (piloto) | P2 | `src/utils/sparkline.js`, `src/components/Sparkline.jsx`, `EducationIndicatorCard`, `FinancialIndicatorCard`. | Educação e Financeiro usam o mesmo modelo geométrico e JSX, preservando filtragem, ordenação, escala constante, paths, período, estado vazio, classes legadas e `aria-hidden`; `MetaCard` permanece fora do piloto. |
| UI-14 | Controles React compartilhados | Implementado | P2 | `src/components/SearchField.jsx` atende `CyclePage`, `EducacaoPage` e `PneLegalGoalsPage` no escopo aprovado; FUNDEB e PNATE mantêm a variante lateral `indicator-search` fora desse escopo. `src/components/SegmentedControl.jsx` atende `BasicEducationFilter` em `CyclePage` e `IndicatorSegmentedControl` em `EducacaoPage`, com `ariaLabel`, `className`, `optionClassName`, `options`, `selectedKey` e `onSelect`. Busca, PNE e Educação foram validados em 1366×768, 1280×720 e 1024×768; o segmento largo de Educação preserva 12 opções, wrapping, foco e `aria-pressed`. | Busca e segmento aprovados preservam DOM, classes, ordem, foco e lógica dos consumidores. O PNE preserva opções de 36 px; o segmento largo de Educação preserva a exceção legada de 30 px existente antes da migração, sem mudança de CSS. `infra-dep-pill` é uma ocorrência futura fora deste escopo por ainda não expor grupo rotulado nem `aria-pressed`. Filtros, tabs e navegação de módulo não entram em um componente universal. |
| UI-15 | Arquitetura dos cards exploráveis | Planejado | P2 | `MetaCard`, `EducationIndicatorCard`, `FinancialIndicatorCard`, `StatusBadge`, `InteractionChevron`. | Educação e Financeiro compartilham uma estrutura normalizada somente após definir view-model; `MetaCard` preserva composição e regras do PNE. |
| UI-16 | Propriedade de moldura e título de gráfico | Planejado | P2 | `FinancialChartFrame`, `IndicatorChartHeader`, `IndicatorHistoryChart`, `chart-system.css`. | Cada gráfico possui uma única responsabilidade por título, resumo e fonte; renderers mantêm escalas, séries e interação de domínio. |
| UI-17 | Mecânica comum de seleção lista–detalhe | Parcial | P2 | `DetailNavigation`, `useDetailViewNavigation`, `CyclePage`, `EducacaoPage`, `FundebPanel`, `PnatePanel`, `SiopeIndicatorsPanel`. | Índice, item anterior/próximo e seleção podem ser compartilhados sem absorver filtros, ciclos, módulos ou políticas de reset dos consumidores. |
| UI-18 | Primitivas de cabeçalho | Planejado | P3 | Cabeçalhos locais em Home, ciclos, PNE, Educação, Financeiro e Diagnóstico. | Apenas eyebrow, título e descrição são compartilhados; hero, métricas, ações e referências de domínio permanecem compostos localmente. |

> **Evidência de UI-05.** Em PNE 2014–2024, PNE 2026–2036, Metas Legais, Educação, FUNDEB, PNATE, SIOPE e Sistema S, o E2E registrou altura de 16,80–33,59 px e uma a duas linhas, sem overflow da nota. Em 390×844, a fonte do Sistema S continua em 12 px e sem overflow. O overflow horizontal preexistente do PNE 2026 em 390 px (451 px para viewport de 390 px) foi encontrado e não foi corrigido por estar fora deste piloto.

> **Limitação de validação de UI-11.** `scripts/checks/e2e-test.cjs` monta no navegador o `SistemaSPanel` real com o JSON público de Alegrete para validar fonte única, ordem, métricas, gráfico, distribuição, tabela e overflow. A rota especial `#sistemas` ainda reverte para o tema padrão enquanto os dados municipais carregam; esse defeito preexistente de navegação está fora deste escopo e impede a cobertura pela entrada usual. O baseline visual restrito à Visão geral do Sistema S foi revisado em 1366×768, 1280×720 e 1024×768, sem overflow ou deslocamento.

> **Evidência de UI-11.** A gramática compartilhada de `DataSourceNote`, inclusive a nota metodológica SIOPE que a reutiliza, recebeu o mínimo de 12 px e contraste AA pelo piloto de UI-05. Nenhum conteúdo, resolver, posição, período, órgão ou metodologia foi alterado; demais consumidores ainda aguardam apresentação estruturada.

## 4. Critérios de aceite de qualquer migração

- preservar identidade institucional, dados, cálculos, filtros, regras de negócio e textos analíticos;
- comparar comportamento visual e funcional antes/depois;
- validar primeiro 1366×768, 1280×720 e 1024×768; depois 768×1024, 390×844 e 320×568;
- testar teclado, foco, contraste, zoom de 200%, texto longo, valores grandes, loading, erro e ausência;
- executar lint, build e testes relevantes;
- atualizar o estado, a evidência e os consumidores deste plano;
- remover regra legada somente após confirmar todos os consumidores.

## 5. Histórico relacionado

Os registros abaixo oferecem contexto e não definem regra ativa:

- [Auditoria visual — etapa 02](historico-ui/AUDITORIA_VISUAL_PNE_02.md)
- [Auditoria de interação e navegabilidade](historico-ui/AUDITORIA_INTERACAO_PNE.md)
- [Proposta de sistema visual comum](historico-ui/DESIGN_SYSTEM_PNE_PROPOSTA.md)
- [Inventário histórico de gráficos](historico-ui/INVENTARIO_GRAFICOS_PNE.md)
