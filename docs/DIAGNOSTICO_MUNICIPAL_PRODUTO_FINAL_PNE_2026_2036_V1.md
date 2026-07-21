# DGP0 — Contrato final do Diagnóstico municipal restrito às metas atuais do PNE 2026–2036

**Versão:** V1  
**Data da auditoria:** 20 de julho de 2026  
**Escopo:** especificação de produto e auditoria somente leitura; nenhuma implementação nesta etapa.

## 1. Decisão final do produto

O Diagnóstico municipal será uma leitura pública dos resultados municipais explicitamente ligados às metas que a página existente **PNE 2026–2036** já identifica como metas. O produto não usará os 49 indicadores como lista livre. A unidade pública de apresentação será a meta da allowlist, contendo um ou mais resultados municipais classificáveis, sem consolidar componentes por média, soma, escolha do melhor ou do pior resultado.

O diagnóstico final terá 16 metas potencialmente publicáveis: 10 com ao menos um vínculo direto e 6 somente com componentes parciais. Oito das 24 metas atuais não possuem diagnóstico municipal publicável nesta versão e serão omitidas silenciosamente. Entram 20 indicadores; 29 dos 49 ficam fora.

Financiamento, programas, recursos, situação fiscal, execução orçamentária, decisão por ação/parceria/investigação/acompanhamento/preservação, evidência, governabilidade, exposição municipal, score e ranking não integram o produto final.

## 2. Declaração de escopo fechado

A allowlist é formada exclusivamente pela interseção entre:

1. os 49 itens ordenados em `public/data/indicadores.json` para o ciclo `pne_2026_2036`; e
2. as referências realmente injetadas nesses itens por `PNE_2026_INDICATOR_GOAL_REFS`, em `src/data/pne2026IndicatorGoalRefs.js`.

Uma chave presente apenas em texto legal, catálogo diagnóstico, documento, helper ou mapa jurídico não amplia essa lista. Em especial, `src/data/pne2026GoalTexts.js` possui 73 textos e `src/data/pne2026LegalGoalIndicatorMap.js` contém relações adicionais, mas somente 24 referências são alcançadas pela interface pública atual. `7.a`, `10.b` e `12.c`, entre outras referências não injetadas, não pertencem à allowlist.

Regras permanentes:

- somente `goalId`, `metaRef` ou relação canônica equivalente que resolva para a allowlist autoriza avaliação;
- meta fora da allowlist, indicador sem vínculo e ID desconhecido não geram card nem fallback;
- React não amplia a lista, não cria relações, não procura semelhança textual e não recalcula classificação;
- nenhuma pesquisa externa pode ampliar a allowlist;
- a ordem é a primeira ocorrência atual na página PNE 2026–2036.

## 3. Localização da fonte canônica das metas

O caminho de execução localizado no código é:

`src/app/appRoutes.ts` → `src/app/AppPageRouter.tsx` (`activePage = pne2026`) → `src/pages/CyclePage.jsx` (`cycle = pne_2026_2036`) → `public/data/indicadores.json` → `enrichGoalRefs()` → `src/data/pne2026IndicatorGoalRefs.js` → `MetaCard`/`IndicatorDetail` → `src/data/pne2026GoalTexts.js`.

Não há um único arquivo que, isoladamente, represente a lista mostrada. A fonte primária do **universo e da ordem dos itens** é `public/data/indicadores.json`; a fonte primária da **identificação pública como meta** é `src/data/pne2026IndicatorGoalRefs.js`; a fonte primária de **objetivo, título e texto da meta** é `src/data/pne2026GoalTexts.js`. A lista canônica é a composição desses três arquivos realizada por `CyclePage.jsx`.

`MetaCard.jsx` exibe `Meta {metaRef}` somente quando `metaRef` existe. `IndicatorDetail.jsx` resolve `PNE_2026_GOAL_TEXTS[item.metaRef]` e usa `dashboardText`, com fallback para `displayText` e depois `originalText`. Portanto, `tracks_goal: true` ou uma relação em outro mapa não torna um item meta se a página não recebe `metaRef`.

Há divergências de rótulo de prazo no catálogo de itens: por exemplo, `pre_escola`, `basico_6_17`, `adequacao_*` e `salas_acessiveis` têm `meta_label` genérico que não coincide com o marco legal específico registrado no catálogo diagnóstico. O DGP0 não corrige a página; apenas fixa que DGP1 deve materializar valor e prazo canônicos no contrato público, sem o React reconciliar a divergência.

## 4. Allowlist das metas atuais do PNE 2026–2036

**IDs, na ordem atual:** `1.a`, `1.c`, `4.a`, `6.a`, `12.a`, `12.b`, `3.a`, `5.a`, `5.b`, `5.d`, `4.b`, `4.c`, `4.d`, `17.a`, `17.f`, `17.b`, `17.d`, `8.c`, `18.b`, `8.b`, `19.c`, `11.a`, `11.b`, `11.c`.

Todas as 24 referências são apresentadas explicitamente como `Meta {id}` por `MetaCard` em pelo menos um item. A descrição abaixo preserva `dashboardText` quando esse é o campo efetivamente escolhido pelo detalhe; na ausência dele, preserva o fallback atual `displayText`/`originalText`. Valores e prazos são os marcos já registrados no projeto, sem pesquisa ou correção externa.

| Ordem | ID público | Objetivo / título atual | Descrição atual usada no detalhe | Valor e prazo registrados | Direção | Subdivisão atual |
|---:|---|---|---|---|---|---|
| 1 | `1.a` | Objetivo 1 — Creche | Acompanhar o atendimento em creche das crianças de 0 a 3 anos no município, tendo como referência a meta de 60%. | 60% em 2036; o texto também trata de 100% da demanda manifesta | aumentar/alcançar | atendimento de 0–3 anos |
| 2 | `1.c` | Objetivo 1 — Pré-escola | Acompanhar a universalização da pré-escola para crianças de 4 e 5 anos no município. | 100% em 2028 | alcançar | 4–5 anos |
| 3 | `4.a` | Objetivo 4 — Acesso escolar 6 a 17 anos | Acompanhar o acesso à escola da população de 6 a 17 anos no município. | 100% em 2029 | alcançar | 6–17; a página também contém recorte 15–17 |
| 4 | `6.a` | Objetivo 6 — Tempo integral | Acompanhar a oferta de matrículas em tempo integral na educação básica do município. | estudantes: 35% em 2031 e 50% em 2036; escolas: 50% em 2031 e 65% em 2036 | aumentar/alcançar | estudantes e escolas públicas |
| 5 | `12.a` | Objetivo 12 — Educação profissional técnica de nível médio | Acompanhar a participação da educação profissional técnica de nível médio nas matrículas do ensino médio. | 50% das matrículas e 50% da expansão no segmento público em 2036 | aumentar/alcançar | articulação e participação pública na expansão |
| 6 | `12.b` | Objetivo 12 — Cursos subsequentes | Acompanhar a expansão das matrículas em cursos técnicos subsequentes. | expansão mínima de 60%; referência de contrato em 2036 | aumentar | expansão desde a linha de base |
| 7 | `3.a` | Objetivo 3 — Alfabetização ao final do 2º ano | Assegurar que, no mínimo, 80% (oitenta por cento) das crianças estejam alfabetizadas ao final do segundo ano do ensino fundamental, até o quinto ano de vigência deste PNE, e que todas as crianças estejam alfabetizadas ao final do segundo ano do ensino fundamental, até o final do decênio. | 80% em 2031 e 100% em 2036 | aumentar/alcançar | alfabetização ao final do 2º ano |
| 8 | `5.a` | Objetivo 5 — Aprendizagem nos anos iniciais | Acompanhar o desempenho dos estudantes nos anos iniciais do ensino fundamental. | básico: 100%; adequado: 70% em 2031 e 90% em 2036 | aumentar/alcançar | Matemática e Português; básico e adequado |
| 9 | `5.b` | Objetivo 5 — Aprendizagem nos anos finais | Acompanhar o desempenho dos estudantes nos anos finais do ensino fundamental. | básico: 100%; adequado: 60% em 2031 e 85% em 2036 | aumentar/alcançar | Matemática e Português; básico e adequado |
| 10 | `5.d` | Objetivo 5 — Aprendizagem no ensino médio | Acompanhar o desempenho dos estudantes no ensino médio. | básico: 100%; adequado: 50% em 2031 e 80% em 2036 | aumentar/alcançar | Matemática e Português; básico e adequado |
| 11 | `4.b` | Objetivo 4 — Conclusão do 5º ano na idade regular | Acompanhar a conclusão dos anos iniciais do ensino fundamental na idade regular. | 100%; referência de contrato em 2036 | alcançar/manter | 5º ano |
| 12 | `4.c` | Objetivo 4 — Conclusão do 9º ano na idade regular | Acompanhar a conclusão dos anos finais do ensino fundamental na idade regular, tendo como referência a meta de 95%. | 95%; referência de contrato em 2036 | aumentar/alcançar | 9º ano |
| 13 | `4.d` | Objetivo 4 — Conclusão do ensino médio na idade regular | Acompanhar a conclusão do ensino médio na idade regular, tendo como referência a meta de 90%. | 90%; referência de contrato em 2036 | aumentar/alcançar | ensino médio |
| 14 | `17.a` | Objetivo 17 — Formação específica dos docentes | Acompanhar o percentual de docentes com formação adequada para a etapa ou área em que atuam. | 100% em 2031 | alcançar | anos iniciais, anos finais e ensino médio |
| 15 | `17.f` | Objetivo 17 — Pós-graduação dos docentes | Acompanhar o percentual de docentes da educação básica com pós-graduação. | 70%; referência de contrato em 2036 | aumentar/alcançar | educação básica |
| 16 | `17.b` | Objetivo 17 — Rendimento do magistério | Acompanhar a valorização do magistério por meio do rendimento médio dos profissionais docentes. | equiparação, 100%; referência de contrato em 2036 | aumentar/alcançar | relação com outros profissionais de nível superior |
| 17 | `17.d` | Objetivo 17 — Profissionais sem cargo efetivo | Acompanhar a proporção de profissionais do magistério sem cargo efetivo na rede pública. | no máximo 30% em 2031 | reduzir/manter abaixo do teto | rede pública |
| 18 | `8.c` | Objetivo 8 — Educação ambiental | Assegurar que todas as instituições de ensino promovam a educação ambiental com base na Política Nacional de Educação Ambiental e nas diretrizes curriculares nacionais do Conselho Nacional de Educação (CNE). | 100%; referência de contrato em 2036 | alcançar/manter | instituições de ensino |
| 19 | `18.b` | Objetivo 18 — Conselhos escolares | Assegurar que todas as escolas públicas da educação básica tenham conselhos escolares instituídos e em pleno funcionamento, em consonância com a Lei nº 14.644, de 2 de agosto de 2023, com a participação dos diferentes segmentos da comunidade escolar. | 100%; referência de contrato em 2036 | alcançar/manter | escolas públicas |
| 20 | `8.b` | Objetivo 8 — Conforto térmico | Assegurar que todos os estabelecimentos de ensino tenham estrutura física e instalações que atendam a padrões de conforto térmico. | 100%; referência de contrato em 2036 | alcançar/manter | estabelecimentos de ensino |
| 21 | `19.c` | Objetivo 19 — Infraestrutura mínima nas escolas | Garantir, até o final do terceiro ano de vigência deste PNE, as condições mínimas de infraestrutura de funcionamento e salubridade de todas as escolas da educação básica, com vistas à superação de situações críticas. | 100% em 2029 | alcançar/manter | componente de acessibilidade das salas |
| 22 | `11.a` | Objetivo 11 — Alfabetização 15 anos ou mais | Acompanhar a taxa de alfabetização da população de 15 anos ou mais. | 97% em 2031 e 100% em 2036 | aumentar/alcançar | população de 15 anos ou mais |
| 23 | `11.b` | Objetivo 11 — Conclusão do ensino fundamental 15+ | Acompanhar o percentual da população de 15 anos ou mais com ensino fundamental concluído. | 85% para 15+ e 100% para 15–29 em 2036 | aumentar/alcançar | duas faixas etárias |
| 24 | `11.c` | Objetivo 11 — Conclusão do ensino médio 18+ | Acompanhar o percentual da população de 18 anos ou mais com ensino médio concluído. | 75% para 18+ e 100% para 18–29 em 2036 | aumentar/alcançar | duas faixas etárias |

Campos reais: `metaRef` vem de `PNE_2026_INDICATOR_GOAL_REFS`; `objective`, `shortTitle`, `dashboardText`, `displayText` e `originalText` vêm de `PNE_2026_GOAL_TEXTS`; `key`, `label`, `desc`, `sub`, `meta_label`, `tracks_goal` e `presentationMode` vêm de `public/data/indicadores.json`. Os marcos quantitativos do diagnóstico vêm de `targetMilestones`/`configuredReference`, materializados a partir de `src/data/diagnostic/indicatorCatalog.json`.

## 5. Arquivos que produzem a página PNE 2026–2036

### Fontes primárias e execução

- `src/app/appRoutes.ts`, `src/app/AppPageRouter.tsx` e `src/types/app.ts`: rota e identidade `pne2026`;
- `src/pages/CyclePage.jsx`: composição, enriquecimento de `metaRef`, filtros, seleção e detalhe;
- `public/data/indicadores.json`: 49 itens, rótulos, descrições, agrupamento e ordem;
- `src/data/pne2026IndicatorGoalRefs.js`: vínculo indicador → meta realmente mostrado;
- `src/data/pne2026GoalTexts.js`: objetivo, título e textos;
- `src/data/staticData.ts`: loaders do catálogo, município, detalhe, diagnóstico e referência estadual;
- `public/data/municipios_index.json`, `public/data/municipios/{slug}/index.json`, `public/data/municipios/{slug}/detalhes.json` e `public/data/pne_2026_2036/referencia_estadual.json`: resultados e apoios estáticos.

### Consumidores e helpers relevantes

- `src/components/MetaCard.jsx`, `IndicatorDetail.jsx`, `IndicatorComplementaryData.jsx`, `ExpansionShareBaselineDetail.jsx`, `CategoryTabs.jsx`, `DataSourceNote.jsx`, `DetailNavigation.jsx`, `SearchField.jsx`, `SegmentedControl.jsx`, `HeadingText.jsx` e `StatusBadge.jsx`;
- `src/data/thematicGroups.js`, `src/data/pne2026LegalGoalIndicatorMap.js` e `src/data/educationIndicatorCatalog.js`;
- `src/utils/pneAccumulativeCycle.js`, `pneCycleCopy.js`, `pneDisplayRules.js`, `indicatorValues.js`, `stateReference.js`, `format.js`, `hashNavigation.js`, `useAsyncData.js` e `src/hooks/useDetailViewNavigation.js`;
- `src/styles/pne-cycle-experience.css`, `src/styles/institutional-refresh.css` e o legado ativo `src/App.css`.

`pne2026LegalGoalIndicatorMap.js` é consumidor/mapa jurídico mais amplo, não a fonte da allowlist. `PneLegalGoalsPage.jsx` é outra página e não amplia o ciclo público auditado.

### Geração, testes e documentação específica localizada

- geração/auditoria: `scripts/export_education_indicators.py`, `scripts/audit_pne2026_indicators.py`, `scripts/patch_early_childhood_indicators.py`, `scripts/migrations/fix-pne-2026.cjs` e `scripts/migrations/update-value-modes.cjs`;
- testes/fixtures: `scripts/checks/app-routing-test.mjs`, `e2e-test.cjs`, `pne-accumulative-cycle.test.mjs`, `population-coverage-chart.test.mjs`, `verify-state-reference.cjs`, `visual-test.cjs`, `src/dev-ui/fixtures/catalogFixtures.ts` e `src/dev-ui/scenarios/pneScenarios.tsx`;
- referência normativa de UI: `docs/GUIA_DE_DESIGN.md` e `docs/PLANO_MIGRACAO_UI.md`; contexto histórico sem força normativa: `docs/historico-ui/AUDITORIA_INTERACAO_PNE.md`, `AUDITORIA_VISUAL_PNE_02.md` e `INVENTARIO_GRAFICOS_PNE.md`.

## 6. Matriz Meta × Indicador

Legenda de compatibilidade: **S** = compatível; **P** = apenas componente/recorte parcial; **N** = incompatível ou pendente. Colunas `Ano/Pop./Etapa/Rede` avaliam ano, população/universo, etapa e rede. A decisão A/B/E decorre de vínculo explícito, catálogo, pipeline, contratos e gate de fonte — nunca do nome.

| Meta | Indicador e fórmula/universo | Tipo interno | Unidade/direção; alvo | Ano/Pop./Etapa/Rede | Distância / afirmar meta integral | Decisão |
|---|---|---|---|---|---|---|
| `1.a` Creche | `creche`: `100×Σmat_0_3/Σpop_0_3`; matrícula no município da escola / população residente | partial/partial | % ↑; 60%/2036 | S/P/S/P | cálculo interno / publicação não | **E**: fonte populacional oficial pendente |
| `1.c` Pré-escola | `pre_escola`: `100×Σmat_pre/Σpop_4_5`; matrícula / população residente | direct/direct | % ↑; 100%/2028 | S/S/S/S | cálculo interno / publicação não | **E**: fonte populacional oficial pendente |
| `4.a` Acesso 6–17 | `basico_6_17`: `100×Σmat_6_17/Σpop_6_17` | direct/direct | % ↑; 100%/2029 | S/S/S/S | cálculo interno / publicação não | **E**: fonte populacional oficial pendente |
| `4.a` Acesso 6–17 | `basico_15_17`: `100×Σmat_15_17/Σpop_15_17` | partial/methodologically_incompatible | % ↑; legal 100%/2029, implementação histórica 85% | N/P/P/P | não / não | **E** |
| `6.a` Tempo integral | `basico_integral`: `100×Σmat_integral/Σmat_basico`; estudantes da rede pública | partial/partial | % ↑; 35%/2031, 50%/2036 | S/P/S/S | sim, do componente / não | **B** |
| `6.a` Tempo integral | `escolas_integral`: `100×Σescolas_com_integral/Σescolas_publicas` | partial/partial | % ↑; 50%/2031, 65%/2036 | S/P/S/S | sim, do componente / não | **B** |
| `12.a` EPT nível médio | `medio_tecnico_articulado_percentual`: `100×Σmat_integradas/Σmat_medio` | partial/partial | % ↑; 50%/2036 | S/N/S/P | não; faltam concomitantes / não | **E** |
| `12.a` EPT nível médio | `medio_tecnico_participacao_publica`: `100×expansão pública positiva acumulada/expansão total positiva acumulada` | partial/partial | % ↑; 50%/2036 | S/P/S/S | sim, do componente / não | **B** |
| `12.b` Cursos subsequentes | `subsequente_expansao`: `100×(mat_ano/mat_2015−1)` | partial/partial | % ↑; 60%/2036 | S/P/S/P | sim, da expansão / não; qualidade e permanência ausentes | **B** |
| `3.a` Alfabetização 2º ano | `alfabetizacao`: média municipal da taxa; numerador/denominador não declarados | direct/pending_official_definition | % ↑; 80%/2031 e 100%/2036 | N/N/S/P | não / não | **E** |
| `5.a` Aprendizagem iniciais | `saeb_matematica_anos_iniciais`: soma das parcelas no nível adequado ou superior / participantes Saeb | partial/partial | % ↑; básico 100%; adequado 70%/2031 e 90%/2036 | N/P/S/P | não; dimensão básica ausente / não | **E** |
| `5.a` Aprendizagem iniciais | `saeb_portugues_anos_iniciais`: mesma fórmula, Português | partial/partial | % ↑; mesmos marcos | N/P/S/P | não / não | **E** |
| `5.b` Aprendizagem finais | `saeb_matematica_anos_finais`: adequado ou superior / participantes Saeb | partial/partial | % ↑; básico 100%; adequado 60%/2031 e 85%/2036 | N/P/S/P | não / não | **E** |
| `5.b` Aprendizagem finais | `saeb_portugues_anos_finais`: mesma fórmula, Português | partial/partial | % ↑; mesmos marcos | N/P/S/P | não / não | **E** |
| `5.d` Aprendizagem médio | `saeb_matematica_ensino_medio`: adequado ou superior / participantes Saeb | partial/partial | % ↑; básico 100%; adequado 50%/2031 e 80%/2036 | N/P/S/P | não / não | **E** |
| `5.d` Aprendizagem médio | `saeb_portugues_ensino_medio`: mesma fórmula, Português | partial/partial | % ↑; mesmos marcos | N/P/S/P | não / não | **E** |
| `4.b` 5º ano na idade | `idade_regular_quinto`: média municipal de `taxa_idade_regular` no 5º ano | direct/direct | % ↑; 100%/2036 | S/S/S/S | sim / sim | **A** |
| `4.c` 9º ano na idade | `idade_regular_nono`: média municipal no 9º ano | direct/direct | % ↑; 95%/2036 | S/S/S/S | sim / sim | **A** |
| `4.d` Médio na idade | `idade_regular_medio`: média municipal no ensino médio | direct/direct | % ↑; 90%/2036 | S/S/S/S | sim / sim | **A** |
| `17.a` Formação docente | `adequacao_ai`: média do percentual de adequação, anos iniciais | partial/partial | % ↑; 100%/2031 | S/P/P/P | sim, do componente / não | **B** |
| `17.a` Formação docente | `adequacao_af`: média do percentual de adequação, anos finais | partial/partial | % ↑; 100%/2031 | S/P/P/P | sim, do componente / não | **B** |
| `17.a` Formação docente | `adequacao_em`: média do percentual de adequação, ensino médio | partial/partial | % ↑; 100%/2031 | S/P/P/P | sim, do componente / não | **B** |
| `17.f` Pós-graduação | `pos_graduacao`: `100×Σdocentes_pos/Σdocentes` | direct/direct | % ↑; 70%/2036 | S/S/S/S | sim / sim | **A** |
| `17.b` Rendimento | `rendimento_magisterio`: `100×rendimento_magistério/rendimento_outros` | partial/partial | % ↑; 100%/2036 | S/P/P/P | cálculo interno existe / publicação não | **E**: fonte oficial pendente |
| `17.d` Sem cargo efetivo | `temporarios`: `100×Σdocentes_temporarios/Σdocentes` | direct/direct | % ↓ (`at_most`); 30%/2031 | S/S/S/S | sim / sim | **A** |
| `8.c` Educação ambiental | `educacao_ambiental`: `100×Σescolas_com_educação_ambiental/Σescolas` | direct/direct | % ↑; 100%/2036 | S/S/S/S | sim / sim, com limite declaratório | **A** |
| `18.b` Conselhos | `conselho_escolar`: `100×Σescolas_publicas_com_conselho/Σescolas_publicas` | direct/direct | % ↑; 100%/2036 | S/S/S/S | sim / sim, com limite declaratório | **A** |
| `8.b` Conforto térmico | `salas_climatizadas`: `100×Σsalas_climatizadas/Σsalas_utilizadas` | partial/partial | % ↑; 100%/2036 | S/P/P/P | sim, climatização / não, conforto integral | **B** |
| `19.c` Infraestrutura mínima | `salas_acessiveis`: `100×Σsalas_acessiveis/Σsalas_utilizadas` | partial/partial | % ↑; 100%/2029 | S/P/P/P | sim, acessibilidade das salas / não | **B** |
| `11.a` Alfabetização 15+ | `alfabetizacao_pop_15_mais`: `100×Σalfabetizadas_15+/Σpop_15+`; residentes | direct/direct | % ↑; 97%/2031 e 100%/2036 | S/S/S/S | sim / sim | **A** |
| `11.b` Fundamental 15+ | `fundamental_concluido_18_mais`: `100×Σconcluintes_18+/Σpop_18+` | partial/proxy | % ↑; 85%/2036 | S/N/S/S | não; meta usa 15+ / não | **E** |
| `11.b` Fundamental 15–29 | `fundamental_concluido_15_29`: `100×Σconcluintes_15_29/Σpop_15_29` | direct/direct | % ↑; 100%/2036 | S/S/S/S | sim / sim | **A** |
| `11.c` Médio 18+ | `medio_concluido_18_mais`: `100×Σconcluintes_18+/Σpop_18+` | direct/direct | % ↑; 75%/2036 | S/S/S/S | sim / sim | **A** |
| `11.c` Médio 18–29 | `medio_concluido_18_29`: `100×Σconcluintes_18_29/Σpop_18_29` | direct/direct | % ↑; 100%/2036 | S/S/S/S | sim / sim | **A** |

## 7. Classificação dos vínculos

| Classe | Quantidade | Decisão pública |
|---|---:|---|
| A — direta e classificável | 11 vínculos, cobrindo 10 metas | entra integralmente; pode classificar o resultado como manter/avançar |
| B — componente parcial publicável | 9 vínculos, cobrindo 6 metas sem A e compondo 6 metas ao todo | entra como **Resultado ligado à meta**; nunca declara a meta inteira alcançada |
| C — descritivo | 0 vínculo aceito | nenhum vínculo foi criado por proximidade temática |
| D — sem relação com a allowlist | 15 indicadores | fica fora e não gera mensagem |
| E — incompatível/bloqueado | 14 vínculos explícitos | fica fora e permanece documentado internamente |

Os gates adicionais vêm do contrato público já aprovado. A origem `pipeline_rendimento_professores_provenance_pending` bloqueia `rendimento_magisterio`. A “Base municipal de população por idade” ainda não identifica órgão responsável, título oficial e link oficial; o contrato determina omitir, até a confirmação, `creche`, `pre_escola` e `basico_6_17`. Os vínculos conceituais e cálculos internos permanecem registrados, mas não são publicáveis nesta versão.

## 8. Metas com diagnóstico municipal direto

São 10: `4.b`, `4.c`, `4.d`, `17.f`, `17.d`, `8.c`, `18.b`, `11.a`, `11.b` e `11.c`.

`11.b` também possui um vínculo E, que não entra; a existência do vínculo inválido não reduz a validade do resultado A separado. `11.c` possui dois resultados A e não recebe situação consolidada de meta sem uma regra explícita de combinação.

## 9. Metas com componente parcial

São 6 metas sem vínculo A e com ao menos um vínculo B: `6.a`, `12.a`, `12.b`, `17.a`, `8.b` e `19.c`.

O título público obrigatório de cada item é **Resultado ligado à meta**. `goalAttained` nesses itens significa somente que o resultado medido alcançou a referência quantitativa do componente. Ele não alimenta contador de metas alcançadas, nem autoriza a frase “meta alcançada”.

## 10. Metas sem diagnóstico municipal atual

São 8: `1.a`, `1.c`, `4.a`, `3.a`, `5.a`, `5.b`, `5.d` e `17.b`.

- `1.a`, `1.c` e `4.a`: os cálculos dependem da “Base municipal de população por idade”, cuja identificação oficial e URL ainda estão pendentes; `4.a` também possui o vínculo incompatível `basico_15_17`;
- `3.a`: nenhuma observação municipal atual; operacionalização e fonte oficial pendentes;
- `5.a`, `5.b` e `5.d`: o valor principal cobre nível adequado, mas a meta exige também nível básico e marcos combinados; todos os contratos bloqueiam a comparação;
- `17.b`: há valores e cálculos internos, porém a proveniência oficial permanece pendente e o contrato de linguagem determina omissão.

Essas metas continuam normalmente na página PNE 2026–2036 e são omitidas silenciosamente apenas no Diagnóstico municipal.

## 11. Indicadores que entram

Entram 20, sempre condicionados a `targetComparisonStatus = eligible` no município:

`basico_integral`, `escolas_integral`, `medio_tecnico_participacao_publica`, `subsequente_expansao`, `idade_regular_quinto`, `idade_regular_nono`, `idade_regular_medio`, `adequacao_ai`, `adequacao_af`, `adequacao_em`, `pos_graduacao`, `temporarios`, `educacao_ambiental`, `conselho_escolar`, `salas_climatizadas`, `salas_acessiveis`, `alfabetizacao_pop_15_mais`, `fundamental_concluido_15_29`, `medio_concluido_18_mais`, `medio_concluido_18_29`.

Um resultado aparece uma única vez, dentro da meta apontada pelo vínculo canônico. `subsequente_expansao` pode ser negativo ou muito superior a 100%, pois é variação acumulada sobre uma linha de base; não deve ser truncado como proporção. Os indicadores de atendimento hoje bloqueados pela fonte populacional também podem superar 100% por sua base territorial mista e deverão preservar esses valores se o gate de fonte for resolvido no futuro.

## 12. Indicadores que ficam fora

### Vínculo explícito com a allowlist, mas classe E — 14

`creche`, `pre_escola`, `basico_6_17`, `basico_15_17`, `medio_tecnico_articulado_percentual`, `alfabetizacao`, `saeb_matematica_anos_iniciais`, `saeb_portugues_anos_iniciais`, `saeb_matematica_anos_finais`, `saeb_portugues_anos_finais`, `saeb_matematica_ensino_medio`, `saeb_portugues_ensino_medio`, `rendimento_magisterio`, `fundamental_concluido_18_mais`.

### Sem relação com a allowlist — classe D, 15

`aee`, `eja_integrada_educacao_profissional_percentual`, `internet`, `internet_alunos`, `internet_aprendizagem`, `internet_comunidade`, `acesso_internet_computador`, `acesso_internet_disp_pessoais`, `rede_local`, `rede_wireless`, `banda_larga`, `proposta_pedagogica`, `desktop_aluno`, `comp_portatil_aluno`, `tablet_aluno`.

`eja_integrada_educacao_profissional_percentual` tem `tracks_goal: true` e relação jurídica com `12.c` em outro mapa, mas recebe `metaRef = null`; `MetaCard` o apresenta como **Indicador**, não como meta. `12.c` não entra. O mesmo princípio exclui relações auxiliares com `7.a` e `10.b`.

## 13. Regras para metas com vários indicadores

Há 15 metas com um indicador ligado e 9 com vários: `4.a`, `6.a`, `12.a`, `5.a`, `5.b`, `5.d`, `17.a`, `11.b` e `11.c`. `17.a` tem três vínculos; as demais têm dois. Nenhum dos 49 indicadores está ligado a mais de uma meta da allowlist pelo mapa efetivamente usado na página.

Para qualquer meta com vários resultados:

- preservar cada resultado separadamente e na ordem atual dos indicadores;
- não calcular média, soma, score ou posição consolidada;
- não selecionar automaticamente melhor ou pior;
- não deduzir situação da meta a partir de um componente;
- contar resultados, não metas, no resumo público;
- só criar estado consolidado quando o pipeline materializar componentes obrigatórios e regra formal de combinação.

## 14. “Resultados a manter” e “Pontos para avançar”

Os contadores finais serão **Resultados que alcançaram o valor previsto na meta** e **Resultados que ainda podem avançar em direção à meta**. “Metas alcançadas” não é seguro porque há componentes parciais e metas com vários resultados sem regra de consolidação.

Somente A recebe classificação integral. Em B, os mesmos dois grupos podem descrever o **resultado ligado à meta**, nunca a meta inteira. A classificação deve vir pronta do pipeline e respeitar `direction`:

- `at_least`: alcançado quando valor municipal ≥ referência;
- `at_most`: alcançado quando valor municipal ≤ referência; `temporarios` é o caso atual;
- `favorableDistance = atual − meta` para `at_least` e `meta − atual` para `at_most`;
- `remainingGap = max(0, −favorableDistance)`.

O frontend somente formata valores já contratados. Não usa `legacyRelativeGapScore`, `attentionItems`, `priorityScore` ou uma diferença bruta sem direção.

## 15. Matriz Meta × Rio Grande do Sul

A comparação estadual é secundária e nunca muda sozinha a classificação perante a meta. O pipeline usa o mesmo ano quando possível; se necessário, usa o último ano comum comparável, exige cobertura mínima de 80%, calcula a referência estadual pelo método registrado e aplica a direção favorável. “Próximo” já possui regra: `abs(favorableDifference) ≤ 0,1` ponto percentual.

Nos 9.119 resultados A/B classificáveis dos 497 contratos:

| Combinação de resultado | Ocorrências resultado × município | Exemplo observado | Texto recomendado |
|---|---:|---|---|
| alcançou + acima/próximo do RS | 1.175 | Agudo — `pos_graduacao` | Resultado a manter. O valor previsto foi alcançado e o município está em posição favorável ou próxima no RS. |
| alcançou + abaixo do RS | 0 | nenhuma ocorrência | Usar o texto previsto somente se surgir em contrato futuro válido. |
| ainda pode avançar + acima/próximo do RS | 2.024 | Aceguá — `salas_climatizadas` | Ponto para avançar. O valor previsto ainda não foi alcançado, embora o resultado esteja próximo ou acima do RS. |
| ainda pode avançar + abaixo do RS | 2.949 | Aceguá — `basico_integral` | Ponto para avançar. Há espaço para melhorar em relação à meta e ao resultado do RS. |
| sem RS publicável | 2.971, sendo 185 alcançados e 2.786 a avançar | Alecrim — `idade_regular_medio`; Aceguá — `idade_regular_quinto` | Mostrar somente resultado, referência, distância e classificação principal. |

Há 6.148 comparações resultado × RS: 3.159 acima, 40 próximas e 2.949 abaixo. Agrupadas apenas por disponibilidade, sem consolidar situação da meta, são 5.154 combinações município × meta com RS entre 7.952 possíveis (16 metas × 497 municípios). A diferença entre 6.148 e 5.154 decorre de metas com vários resultados.

## 16. Posição entre municípios

A fórmula foi confirmada no pipeline. Para `at_least`, valores menores que o municipal contam a favor; para `at_most`, valores maiores contam a favor; empates contam pela metade. Logo, percentil alto sempre representa posição direcional mais favorável.

As faixas públicas são seguras:

- `percentile ≥ 75`: “O município está entre os 25% com resultados mais favoráveis do Rio Grande do Sul.”;
- `25 ≤ percentile < 75`: “O resultado está na faixa intermediária entre os municípios do Rio Grande do Sul.”;
- `percentile < 25`: “O município está entre os que apresentam maior espaço para avançar neste resultado.”

Não mostrar percentil bruto, Q1, Q3, colocação, ordinal, cobertura, “melhor/pior quartil” ou ranking. Há 5.964 resultados com percentil: 1.546 na faixa ≥75, 2.924 na faixa intermediária e 1.494 abaixo de 25. Em cobertura municipal, 438 municípios têm ao menos um resultado na faixa superior, 495 na intermediária e 430 na inferior.

## 17. Municípios com oferta educacional de tamanho semelhante

O contrato `municipal-peer-cohort-rs-v1` usa somente porte de oferta (`offering_size`), exige pelo menos 20 municípios e não sustenta o rótulo “socioeconomicamente semelhantes”. O título público é **Municípios com oferta educacional de tamanho semelhante**.

Há 6.086 comparações publicáveis em 497 municípios; todas possuem mediana, estatísticas do grupo e percentil direcional. Faixas: 1.819 ≥75, 2.831 intermediárias e 1.436 <25. Exibir apenas mediana e leitura qualitativa simples, por exemplo: “Entre municípios com oferta educacional de tamanho semelhante, o resultado está acima/próximo/abaixo da mediana.” Não mostrar coorte, cluster, pareamento, distância, lista ordenada, Q1/Q3 ou quartil de porte.

Quando `status != available`, omitir o bloco. Não explicar a ausência.

## 18. Trajetória

Os 9.119 resultados classificáveis possuem `trajectory.status = available` e `projectedValue`, mas isso não significa que todos tenham evolução histórica validada:

- 1.982 são `component_maintenance`;
- 7.137 são `required_trajectory`, com `quality = not_assessed`; representam caminho necessário, não projeção histórica validada.

Assim, a cobertura publicável de trajetória/projeção nesta versão é de **1.982 resultados em 497 municípios**, limitada a `component_maintenance` com qualidade avaliada. Desses, 583 possuem `estimatedAchievementYear`, distribuídos por 351 municípios. Os 7.137 cenários `required_trajectory` não podem receber texto de “evolução recente” sem contrato público adicional. Os três indicadores `trend_projection` existentes dependem da fonte populacional ainda bloqueada e, por isso, não integram o produto atual.

Entre todos os resultados classificáveis, o pipeline registra 6.630 séries com pelo menos três pontos, 498 com dois e 1.991 com um. Os estados de ritmo são: 1.787 `moving_away`, 410 `stable`, 1.601 `sufficient`, 1.672 `insufficient`, 1.360 `target_already_met` e 2.289 `insufficient_history`. DGP1 deve materializar a frase pública e o gate de qualidade; React não traduz esses códigos por inferência.

Textos autorizados, somente após o gate:

- “O resultado melhorou nos últimos anos.”;
- “O resultado permaneceu próximo do mesmo nível.”;
- “O resultado recuou no período recente.”;
- “Se a evolução recente continuar, o município pode alcançar a meta em {ano}.”;
- “No ritmo recente, o resultado ainda não alcançaria a meta até {ano}.”

Sem série válida, qualidade avaliada ou cenário apropriado, omitir.

## 19. Estrutura final da página

1. **Cabeçalho específico do Diagnóstico:** “Plano Nacional de Educação (PNE) 2026–2036”, “Diagnóstico educacional de {município}”, explicação curta, copiar síntese e imprimir relatório.
2. **Resumo:** contagens de resultados, não de metas: alcançaram o valor previsto; podem avançar; acima/próximos do RS; abaixo do RS.
3. **Filtros:** situação (`Todos`, `Pontos para avançar`, `Resultados a manter`) e somente temas com resultado classificável no município. Tema vazio não aparece.
4. **Lista principal:** metas na ordem da allowlist, somente quando contiverem ao menos um resultado `eligible`. Resultados separados, sem estado consolidado não autorizado. Conteúdo condicional: meta, descrição curta, resultado municipal, ano, valor previsto, prazo, distância, situação, RS, faixa estadual, trajetória e oferta semelhante.
5. **Fontes das informações:** somente fontes efetivamente usadas pelo que permaneceu visível, com órgão, base, ano/período e link oficial canônico.

A composição deve reutilizar tokens, controles, superfícies, foco e tipografia existentes. O guia preserva a especificidade do Diagnóstico para síntese linear, cópia e impressão. Cards não devem ser usados apenas como espaçamento, títulos e valores não podem ser truncados e filtros devem manter foco visível, teclado e `aria-pressed`.

## 20. Textos públicos recomendados

| Situação | Texto |
|---|---|
| A alcançado | **Resultado a manter.** O valor previsto na meta foi alcançado. |
| A não alcançado | **Ponto para avançar.** Faltam {x} pontos percentuais para alcançar o valor previsto na meta. |
| A acima | O resultado está {x} pontos percentuais acima do valor previsto na meta. |
| B | **Resultado ligado à meta.** Este resultado acompanha uma parte da meta. |
| B alcançou referência | Este resultado alcançou o valor previsto para o componente acompanhado. |
| RS acima | O resultado do município está {x} pontos percentuais acima do resultado do Rio Grande do Sul. |
| RS abaixo | O resultado do município está {x} pontos percentuais abaixo do resultado do Rio Grande do Sul. |
| RS equivalente | O resultado do município está próximo do resultado do Rio Grande do Sul. |
| oferta semelhante | Entre municípios com oferta educacional de tamanho semelhante, o resultado está {leitura} da mediana. |

Não usar “gap”, “lacuna”, “déficit”, “atraso”, “pior”, “melhor”, “ruim”, “crítico”, “fracasso”, “insuficiente”, “baixo desempenho”, “última posição”, “prioridade”, “ranking”, “benchmark”, “coorte” ou “percentil direcional” na interface pública.

## 21. Política de linguagem respeitosa

- descrever o resultado e a possibilidade de avanço, não qualificar município, rede ou pessoas;
- usar sujeito explícito e frases curtas;
- distinguir “resultado” de “meta” e “componente” de cumprimento integral;
- preservar unidade, ano e direção; para `at_most`, menor é mais favorável;
- usar “acima”, “próximo” e “abaixo” somente com comparação válida e direção aplicada;
- não transformar incerteza, ausência ou limite metodológico em julgamento;
- manter a terminologia idêntica na tela, cópia e impressão.

## 22. Política de omissão

Omitir silenciosamente:

- meta da allowlist sem resultado A/B `eligible` no município;
- indicador D, C ou E;
- valor, ano, fonte, RS, percentil, oferta semelhante ou trajetória cujo status não satisfaça o gate correspondente;
- tema sem resultado;
- bloco financeiro, técnico ou metodológico que não faça parte da leitura pública.

Não renderizar card vazio, “sem dados”, “indisponível”, “será incluído”, “não avaliada”, código técnico ou justificativa de ausência. A meta continua visível normalmente na página PNE 2026–2036.

## 23. Fontes das informações

Os 20 indicadores aprovados usam dois IDs de dados. Um terceiro ID permanece bloqueado:

| ID | Órgão/base registrada | Período atual | Uso | Gate para DGP1 |
|---|---|---|---|---|
| `inep_censo_escolar` | INEP — Censo Escolar | 2025 | 16 indicadores aprovados | materializar URL oficial canônica no contrato público |
| `ibge_censo_demografico_2010_2022` | IBGE — Censos Demográficos 2010 e 2022 | observação atual 2022 | quatro indicadores de escolaridade/alfabetização | materializar URL oficial canônica no contrato público |
| `municipal_age_population_panel` | Base municipal de população por idade | 2025 | nenhum resultado público nesta versão; bloqueia `creche`, `pre_escola` e `basico_6_17` | identificar órgão/base oficial e URL antes de qualquer publicação |

A fonte da referência legal já registrada no contrato é a Lei nº 15.388/2026 no Planalto. O contrato atual traz IDs e rótulos de dados, mas não traz URLs oficiais para INEP, IBGE e base populacional. DGP1 deve resolver esse déficit usando fonte canônica aprovada; DGP0 não pesquisou nem inventou links. `pipeline_rendimento_professores_provenance_pending` e `pipeline_alfabetizacao_provenance_pending` não são fontes públicas aceitas.

Na página, listar somente fontes de resultados realmente renderizados. Não listar Saeb se as metas 5.a/5.b/5.d continuarem omitidas, nem fontes de programas/financiamento.

## 24. Elementos atuais a remover, substituir, incorporar ou manter

| Elemento atual | Decisão futura |
|---|---|
| cabeçalho “metas e pontos de atenção” | substituir pelo cabeçalho definido na seção 19 |
| placar ação/parceria/investigação/acompanhamento/preservação | remover |
| síntese para decisão | substituir pelo resumo de resultados classificáveis |
| ação municipal, pactuação e faixa de investigação | remover |
| evidência, governabilidade e exposição municipal | remover da página pública |
| situação por tema atual | substituir por filtros e lista por meta |
| prioridades/ordem transitória/rank visual | remover |
| resultados a preservar/acompanhar atuais | incorporar como “Resultados a manter”/“Pontos para avançar” |
| maiores diferenças desfavoráveis e destaques favoráveis | incorporar apenas como contexto RS no próprio resultado; remover listas separadas |
| referência RS | incorporar em cada resultado válido |
| percentil e oferta semelhante | incorporar qualitativamente em cada resultado válido |
| trajetória | incorporar condicionalmente em cada resultado válido |
| “Programas que podem apoiar as melhorias” | remover |
| “Fontes dos programas” | remover |
| textos/disclosures técnicos e estados vazios | remover da página pública; manter dados internos |
| copiar síntese, imprimir, seleção municipal e fontes educacionais | manter e adaptar ao novo contrato |

## 25. Arquivos, imports, helpers, testes e estilos afetados

Mapa para DGP1–DGP3; nenhum deles foi alterado no DGP0.

### Contrato e apresentação a modificar

- `data_pipeline/src/municipal_diagnostic.py`: materializar allowlist, vínculos aprovados, gates públicos, cópia/estado e fontes oficiais;
- `src/features/diagnostic/diagnosticTypes.ts`: tipar o contrato público por meta/resultado;
- `src/features/diagnostic/diagnosticPresentation.js`: substituir `decisionSummary`, governabilidade/evidência e coleções por grupos da allowlist;
- `src/components/DiagnosticPanel.jsx`: reconstruir resumo, filtros, lista, RS, faixas, trajetória, cópia e impressão;
- `src/pages/Diagnostico.jsx`: manter rota/load e adaptar somente se o novo contrato exigir;
- `src/data/diagnostic/indicatorCatalog.json` e `src/data/pne2026IndicatorGoalRefs.js`: continuar como fontes técnicas; evitar duplicação divergente ao materializar o contrato.

### Remoção de financiamento da página

- remover o consumidor `src/features/diagnostic/DiagnosticFinancingSection.jsx`;
- remover imports e chamadas `buildPublicFinancingItems(data)` e `collectPublicFinancingSources(...)` de `src/components/DiagnosticPanel.jsx`;
- remover `src/features/diagnostic/diagnosticFinancingPresentation.ts` se ficar sem consumidor;
- remover os testes exclusivos `scripts/checks/diagnostic-financing-interface.test.mjs` e `scripts/checks/diagnostic-financing-presentation.test.mjs` se não houver outro consumidor;
- retirar as asserções de integração financeira de `scripts/checks/diagnostic-contract.test.mjs` e `scripts/checks/diagnostic-e2e-test.cjs`;
- remover seletores exclusivos `.diagnostic-financing*` e `.diagnostic-financing-sources*` de `src/styles/institutional-refresh.css`, preservando regras compartilhadas da referência estadual;
- manter catálogos DF0/DF0.1/DF1/DF2 como histórico técnico se ainda tiverem consumidores fora da página; não alterar Panorama financeiro.

### Substituição da interface atual

- revisar os blocos `diagnostic-decision-*`, `diagnostic-scoreboard`, `diagnostic-priorities`, `diagnostic-theme-*` e suas regras em `src/App.css`/`src/styles/institutional-refresh.css` somente após remover os consumidores;
- atualizar `scripts/checks/diagnostic-contract.test.mjs` e `scripts/checks/diagnostic-e2e-test.cjs`; manter testes de pipeline e de rotas, ajustando o contrato ao escopo fechado;
- registrar a mudança de estado no `docs/PLANO_MIGRACAO_UI.md` na etapa de implementação, sem usar `src/App.css` como origem de novos padrões.

## 26. Auditoria dos 497 municípios

Foram lidos, em modo somente leitura, os 497 arquivos `public/data/municipios/{slug}/diagnostico.json`, totalizando 24.353 registros de indicador. A auditoria abaixo restringe-se aos 20 vínculos A/B publicáveis. Não houve escrita, regeneração ou download.

Universo máximo: 9.940 combinações indicador × município. Há 9.253 resultados/anos presentes, 9.940 registros com metadado de fonte e 9.119 comparações válidas com a referência. Todo resultado `eligible` tem fonte identificada no contrato. Os anos atuais são 2022 ou 2025. O intervalo bruto observado entre indicadores é −100% a 5.080%, ambos em `subsequente_expansao`; esse intervalo mistura medidas e não pode virar escala, score ou comparação global.

### Cobertura de resultado e meta

| Indicador | Meta | Classe | resultado | ano | fonte | comparação/distância | alcançou referência | pode avançar |
|---|---|:---:|---:|---:|---:|---:|---:|---:|
| `basico_integral` | `6.a` | B | 497 | 497 | 497 | 497 | 107 | 390 |
| `escolas_integral` | `6.a` | B | 497 | 497 | 497 | 497 | 176 | 321 |
| `medio_tecnico_participacao_publica` | `12.a` | B | 170 | 170 | 497 | 170 | 113 | 57 |
| `subsequente_expansao` | `12.b` | B | 148 | 148 | 497 | 14 | 4 | 10 |
| `idade_regular_quinto` | `4.b` | A | 494 | 494 | 497 | 494 | 24 | 470 |
| `idade_regular_nono` | `4.c` | A | 494 | 494 | 497 | 494 | 37 | 457 |
| `idade_regular_medio` | `4.d` | A | 493 | 493 | 497 | 493 | 107 | 386 |
| `adequacao_ai` | `17.a` | B | 497 | 497 | 497 | 497 | 17 | 480 |
| `adequacao_af` | `17.a` | B | 497 | 497 | 497 | 497 | 0 | 497 |
| `adequacao_em` | `17.a` | B | 496 | 496 | 497 | 496 | 0 | 496 |
| `pos_graduacao` | `17.f` | A | 497 | 497 | 497 | 497 | 178 | 319 |
| `temporarios` | `17.d` | A | 497 | 497 | 497 | 497 | 128 | 369 |
| `educacao_ambiental` | `8.c` | A | 497 | 497 | 497 | 497 | 59 | 438 |
| `conselho_escolar` | `18.b` | A | 497 | 497 | 497 | 497 | 182 | 315 |
| `salas_climatizadas` | `8.b` | B | 497 | 497 | 497 | 497 | 77 | 420 |
| `salas_acessiveis` | `19.c` | B | 497 | 497 | 497 | 497 | 10 | 487 |
| `alfabetizacao_pop_15_mais` | `11.a` | A | 497 | 497 | 497 | 497 | 141 | 356 |
| `fundamental_concluido_15_29` | `11.b` | A | 497 | 497 | 497 | 497 | 0 | 497 |
| `medio_concluido_18_mais` | `11.c` | A | 497 | 497 | 497 | 497 | 0 | 497 |
| `medio_concluido_18_29` | `11.c` | A | 497 | 497 | 497 | 497 | 0 | 497 |
| **Total** | — | — | **9.253** | **9.253** | **9.940** | **9.119** | **1.360** | **7.759** |

Em B, “alcançou referência” permanece resultado de componente, não cumprimento da meta.

### Cobertura de RS, posição, oferta semelhante e trajetória

| Indicador | RS válido | acima | próximo | abaixo | percentil | ≥75 / 25–75 / <25 | oferta semelhante | trajetória pública | ano estimado |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `basico_integral` | 497 | 294 | 4 | 199 | 497 | 124 / 249 / 124 | 488 | 497 | 107 |
| `escolas_integral` | 497 | 254 | 0 | 243 | 497 | 124 / 242 / 131 | 484 | 497 | 176 |
| `medio_tecnico_participacao_publica` | 170 | 142 | 0 | 28 | 0 | 0 / 0 / 0 | 152 | 0* | 0 |
| `subsequente_expansao` | 14 | 14 | 0 | 0 | 0 | 0 / 0 / 0 | 0 | 0* | 0 |
| `idade_regular_quinto` | 0 | 0 | 0 | 0 | 0 | 0 / 0 / 0 | 0 | 0* | 0 |
| `idade_regular_nono` | 0 | 0 | 0 | 0 | 0 | 0 / 0 / 0 | 0 | 0* | 0 |
| `idade_regular_medio` | 0 | 0 | 0 | 0 | 0 | 0 / 0 / 0 | 0 | 0* | 0 |
| `adequacao_ai` | 0 | 0 | 0 | 0 | 0 | 0 / 0 / 0 | 0 | 0* | 0 |
| `adequacao_af` | 0 | 0 | 0 | 0 | 0 | 0 / 0 / 0 | 0 | 0* | 0 |
| `adequacao_em` | 0 | 0 | 0 | 0 | 0 | 0 / 0 / 0 | 0 | 0* | 0 |
| `pos_graduacao` | 497 | 373 | 5 | 119 | 497 | 124 / 249 / 124 | 497 | 491 | 172 |
| `temporarios` | 497 | 190 | 2 | 305 | 497 | 124 / 249 / 124 | 497 | 497 | 128 |
| `educacao_ambiental` | 497 | 228 | 1 | 268 | 497 | 124 / 249 / 124 | 497 | 0* | 0 |
| `conselho_escolar` | 497 | 305 | 0 | 192 | 497 | 182 / 192 / 123 | 496 | 0* | 0 |
| `salas_climatizadas` | 497 | 388 | 0 | 109 | 497 | 124 / 249 / 124 | 497 | 0* | 0 |
| `salas_acessiveis` | 497 | 282 | 2 | 213 | 497 | 124 / 249 / 124 | 490 | 0* | 0 |
| `alfabetizacao_pop_15_mais` | 497 | 144 | 18 | 335 | 497 | 124 / 249 / 124 | 497 | 0* | 0 |
| `fundamental_concluido_15_29` | 497 | 263 | 6 | 228 | 497 | 124 / 249 / 124 | 497 | 0* | 0 |
| `medio_concluido_18_mais` | 497 | 58 | 0 | 439 | 497 | 124 / 249 / 124 | 497 | 0* | 0 |
| `medio_concluido_18_29` | 497 | 224 | 2 | 271 | 497 | 124 / 249 / 124 | 497 | 0* | 0 |
| **Total** | **6.148** | **3.159** | **40** | **2.949** | **5.964** | **1.546 / 2.924 / 1.494** | **6.086** | **1.982** | **583** |

\* O contrato possui `required_trajectory` e `projectedValue`, mas `quality = not_assessed`; não conta como evolução/projeção histórica publicável. A cobertura técnica bruta de `trajectory.status = available` é 9.119.

### Contagens globais e extremos de exibição

- metas na página: **24**;
- metas com ao menos um resultado municipal atual em algum vínculo explícito, mesmo que E: **23**; somente `3.a` não tem resultado;
- metas que entram: **16**; diretas: **10**; somente parciais: **6**; sem diagnóstico: **8**;
- indicadores ligados à allowlist: **34**; sem relação com a allowlist: **15**;
- indicadores que entram: **20**; que ficam fora no total: **29**;
- municípios com ao menos um resultado classificável: **497**;
- resultados mostrados por município: mínimo **15** em Restinga Seca, Vespasiano Correa e Westfalia; máximo **20** em 12 municípios: Bento Gonçalves, Campinas do Sul, Dois Irmãos, Encantado, Garibaldi, Lagoa Vermelha, Santa Vitória do Palmar, Santana da Boa Vista, Santo Antônio da Patrulha, São Lourenço do Sul, Tupanciretã e Viamão;
- metas/grupos mostrados por município: mínimo **11** nos três municípios de cobertura mínima; máximo **16** nos 12 de cobertura máxima;
- distribuição de resultados por município: 15 em 3 municípios, 16 em 1, 18 em 321, 19 em 160 e 20 em 12;
- distribuição de metas por município: 11 em 3, 13 em 1, 14 em 321, 15 em 160 e 16 em 12;
- municípios com ao menos uma comparação RS: **497**; com acima: 497; próximo: 38; abaixo: 494;
- municípios com ao menos um percentil: **497**; com oferta semelhante: **497**; com trajetória pública: **497**; com ao menos um ano estimado: **351**;
- combinações município × meta com RS: **5.154**; combinações resultado × RS: **6.148**.

## 27. Plano DGP1–DGP4

### DGP1 — Contrato público no pipeline

- materializar allowlist imutável, ordem e 34 vínculos auditados;
- publicar somente A/B e aplicar gate municipal `eligible` e gate de fonte oficial;
- produzir `resultStatus`, distância, texto/estado RS, faixa estadual, oferta semelhante e trajetória pública;
- distinguir A de B e impedir contador integral para B;
- materializar órgão, base, período e URL oficial efetivamente usada;
- preservar todos os valores educacionais, inclusive acima de 100% e `at_most`.

### DGP2 — Reconstrução da página

- remover financiamento e coleções técnicas;
- organizar a lista pela ordem das 24 metas, omitindo grupos vazios;
- implementar resumo de resultados, filtros de situação/tema e itens por meta;
- consumir o contrato sem cálculo ou fallback no React;
- atualizar o plano de migração com consumidores e seletores realmente removidos.

### DGP3 — Fontes, cópia, impressão e acessibilidade

- consolidar fontes efetivamente usadas;
- alinhar tela, texto copiado e impressão;
- aplicar todas as omissões e linguagem respeitosa;
- validar teclado, foco, nomes acessíveis, textos longos, valores grandes e responsividade.

### DGP4 — Validação final

- auditar 497 municípios e todos os vínculos da allowlist;
- validar A/B/E/D, cardinalidade, `at_least`, `at_most`, Meta × RS, faixas, componentes, valores acima de 100% e fontes;
- validar desktop, notebook, tablet e mobile;
- confirmar ausência completa de financiamento, grupos técnicos, score e ranking;
- executar build e a validação explicitamente autorizada para o fechamento.

## 28. Critérios finais de aceite

1. somente os 24 IDs da allowlist podem originar grupo;
2. somente os 20 indicadores A/B podem entrar e somente quando `eligible`;
3. nenhuma meta externa, antiga ou auxiliar entra;
4. nenhum componente B vira cumprimento integral ou contador de meta;
5. nenhuma média, soma, melhor/pior seleção, score ou ranking é criado;
6. React não cria vínculo, distância, direção, status, faixa ou trajetória;
7. `at_least`, `at_most`, unidade, ano e fórmula são preservados;
8. valores acima de 100% e expansões negativas/superiores a 100% não são truncados;
9. RS aparece somente com `state.status = comparable`; próximo usa tolerância existente de 0,1 p.p.;
10. percentil alto mantém significado favorável e só vira faixa qualitativa;
11. oferta semelhante usa esse nome e somente `status = available`;
12. trajetória pública exclui `required_trajectory` não avaliada e não é inferida no frontend;
13. metas, temas e apoios sem conteúdo são omitidos silenciosamente;
14. não aparecem investigação, evidência, governabilidade, exposição municipal, programas ou financiamento;
15. fontes são oficiais, efetivamente usadas e possuem órgão, base, período e URL canônica;
16. tela, cópia e impressão usam a mesma semântica;
17. contratos e dados educacionais são preservados;
18. a auditoria final cobre os 497 municípios e todas as combinações aplicáveis;
19. o build de produção passa na DGP4;
20. nenhum dado ou meta é baixado para ampliar o escopo.

## 29. Declaração de nenhuma meta nova procurada ou adicionada

Nenhuma consulta à internet, legislação externa ou fonte fora do repositório foi realizada. Nenhuma meta nova, externa ou do PNE 2014–2024 foi procurada ou adicionada. A existência de 73 textos legais no projeto não foi usada como catálogo de entrada. A allowlist contém exatamente as 24 referências que a página pública atual identifica por `metaRef`.

## 30. Substituição das decisões anteriores sobre financiamento

Este documento substitui, para a futura página pública de Diagnóstico municipal, decisões anteriores que mantinham financiamento, programas, fontes de programas e classificação por ação/parceria/investigação/acompanhamento/preservação. DF0, DF0.1, DF1 e DF2 permanecem como histórico técnico e não foram alterados. O Panorama financeiro não é afetado.

No DGP0, somente este Markdown foi criado. Nenhum código, contrato, JSON, dado, página, teste, estilo ou documento anterior foi modificado; nenhum arquivo foi baixado ou regenerado.
