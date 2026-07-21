# DGP0-V — Verificação da aplicação do contrato final do Diagnóstico municipal

**Data da verificação:** 21 de julho de 2026  
**Escopo:** auditoria somente leitura da DGP0, restrita às metas apresentadas na página PNE 2026–2036.  
**Entregável auditado:** `docs/DIAGNOSTICO_MUNICIPAL_PRODUTO_FINAL_PNE_2026_2036_V1.md`.  
**Método:** inspeção do Git e dos arquivos, leitura do contrato, reconstrução da allowlist a partir da página e auditoria efêmera dos contratos municipais. Nenhuma consulta à internet foi realizada.

## 1. Resumo executivo

O entregável original foi localizado no caminho esperado. É um Markdown V1 completo, com 540 linhas e as 30 seções anunciadas. O documento fecha o Diagnóstico em 24 metas atualmente identificadas pela página PNE 2026–2036, impede o uso dos 49 indicadores como lista livre, aprova 20 indicadores vinculados e exclui formalmente financiamento, programas e recursos da estrutura final. Evidência: `docs/DIAGNOSTICO_MUNICIPAL_PRODUTO_FINAL_PNE_2026_2036_V1.md`, linhas 1–13, 44–77, 182–200 e 536–540.

A reconstrução independente confirmou a allowlist, sua ordem, os 34 vínculos explícitos e todas as contagens centrais dos 497 contratos lógicos. Foram lidos os 497 caminhos canônicos por slug listados em `public/data/municipios_index.json`; os 497 caminhos alternativos por ID também foram comparados e são cópias byte a byte idênticas, totalizando 994 arquivos físicos sem divergência. A auditoria reproduziu 24.353 registros, 9.119 resultados classificáveis, 6.148 comparações resultado × RS, 5.964 percentis, 6.086 comparações de oferta semelhante e 1.982 trajetórias publicáveis.

O resultado geral é **APROVADA COM RESSALVAS**. As ressalvas não alteram a allowlist nem o escopo final: URLs oficiais de INEP/IBGE ainda precisam ser materializadas no contrato público; o destino dos 29 indicadores excluídos não foi explicitamente classificado como “somente página geral de Educação”; e o plano DGP1–DGP4 não discrimina, fase a fase, todos os campos pedidos de dependências, elementos congelados, critérios de parada e testes. Evidência: documento DGP0, linhas 333–345 e 475–507.

## 2. Resultado geral

### APROVADA COM RESSALVAS

Os requisitos centrais passaram:

- a fonte da página e a composição da lista foram localizadas;
- a allowlist tem exatamente 24 IDs, sem meta externa ou do PNE anterior;
- os 49 indicadores deixaram de ser lista livre;
- os vínculos Meta × Indicador foram classificados em A/B/D/E;
- componentes parciais não são contados como metas integrais;
- financiamento foi formalmente excluído do produto final;
- as contagens dos 497 contratos são reproduzíveis;
- a evidência disponível sustenta que a DGP0 criou somente o Markdown esperado.

As ressalvas são documentais ou dependências explícitas da DGP1, não contradições no contrato final. A decisão é **DGP1 pode começar**, desde que preserve as pendências registradas e não publique fonte sem URL oficial. Evidência: documento DGP0, linhas 24–30, 147–180, 202–226, 333–345, 397–473 e 509–540.

## 3. Estado do repositório

### Comandos Git registrados

```text
git status --short
git diff --name-status
git diff --stat
git log --oneline -n 15
```

O estado anterior à criação deste relatório era:

```text
 M docs/PLANO_MIGRACAO_UI.md
 M scripts/checks/diagnostic-contract.test.mjs
 M scripts/checks/diagnostic-e2e-test.cjs
 M src/components/DiagnosticPanel.jsx
 M src/features/diagnostic/diagnosticPresentation.js
 M src/pages/Diagnostico.jsx
 M src/styles/institutional-refresh.css
?? artifacts/diagnostico-df2-2026-07-20/
?? docs/DIAGNOSTICO_CONTRATO_LINGUAGEM_PUBLICA_V1.md
?? docs/DIAGNOSTICO_FINANCIAMENTO_INTERFACE_DF2.md
?? docs/DIAGNOSTICO_MUNICIPAL_PRODUTO_FINAL_PNE_2026_2036_V1.md
?? scripts/checks/diagnostic-financing-interface.test.mjs
?? src/features/diagnostic/DiagnosticFinancingSection.jsx
```

O `git diff --stat` registrou 7 arquivos rastreados, 251 inserções e 484 remoções. Os 15 commits mais recentes são alterações do dashboard e não registram o documento DGP0. O entregável DGP0 permanece não rastreado; `git log --all -- <arquivo>` não retorna commit.

### Distinção das alterações

| Grupo | Evidência | Classificação |
|---|---|---|
| Última tarefa DGP0 | `DIAGNOSTICO_MUNICIPAL_PRODUTO_FINAL...` foi modificado em 2026-07-21 00:13:49, declara natureza somente documental e afirma que apenas ele foi criado | atribuição fortemente sustentada, mas sem commit ou histórico de execução |
| Worktree preexistente DF2 | código, testes, CSS, plano, componente e artefatos têm horários entre 2026-07-20 20:54 e 21:09; `DIAGNOSTICO_FINANCIAMENTO_INTERFACE_DF2.md` lista exatamente esses arquivos nas linhas 10–29 | preexistente à DGP0 |
| Documento preexistente DF3-A | `DIAGNOSTICO_CONTRATO_LINGUAGEM_PUBLICA_V1.md`, 2026-07-20 22:33:10 | histórico substituído pela DGP0 no que conflita com o produto final |
| Arquivos já em commit | fontes da página PNE, pipeline, contratos municipais e demais documentos rastreados | base de auditoria; não foram alterados nesta verificação |
| DGP0-V | `docs/VERIFICACAO_DGP0_DIAGNOSTICO_PNE_2026_2036.md` | único arquivo criado por esta verificação |

Não é possível provar a autoria temporal da DGP0 apenas pelo Git porque o entregável está não rastreado e o histórico da execução foi perdido. A sequência de horários, o mapa explícito da DF2 e o conteúdo da DGP0 não apresentam conflito com a afirmação de que somente o Markdown foi criado na DGP0.

## 4. Entregável localizado

| Campo | Resultado |
|---|---|
| Caminho | `docs/DIAGNOSTICO_MUNICIPAL_PRODUTO_FINAL_PNE_2026_2036_V1.md` |
| Data do sistema de arquivos | 2026-07-21 00:13:49 −03:00 |
| Data no Git | não disponível; arquivo não rastreado |
| Linhas | 540 |
| Título | “DGP0 — Contrato final do Diagnóstico municipal restrito às metas atuais do PNE 2026–2036” |
| Versão | V1 |
| Status | entregável exato localizado; não registrado em commit |
| Substitui decisões anteriores | sim, para financiamento e classificações antigas; linhas 536–540 |
| 30 seções esperadas | sim, seções numeradas 1 a 30 |
| Integridade | completo; termina com declaração de escopo técnico na linha 540 |

Documentos com conteúdo relacionado, mas que não representam a decisão atual:

- `docs/DIAGNOSTICO_FINANCIAMENTO_INTERFACE_DF2.md`: integra programas ao Diagnóstico e lista os arquivos alterados, linhas 1–56; foi superado pela DGP0 para a futura página.
- `docs/DIAGNOSTICO_CONTRATO_LINGUAGEM_PUBLICA_V1.md`: mantém DF2 visível nas linhas 43–57; foi formalmente substituído pela DGP0 no escopo conflitante.
- documentos DF0/DF0.1/DF1/DF2 permanecem como histórico técnico; o Panorama financeiro permanece fora desta decisão. Evidência: documento DGP0, linhas 381–389 e 536–540.

## 5. Arquivos criados e alterados

| Arquivo/grupo | Estado encontrado | Relação com DGP0 | Desvio da DGP0 | Tratamento |
|---|---|---|---|---|
| `docs/DIAGNOSTICO_MUNICIPAL_PRODUTO_FINAL_PNE_2026_2036_V1.md` | não rastreado, criado | entregável da DGP0 | não | preservar; registrar em commit somente em etapa autorizada |
| `src/components/DiagnosticPanel.jsx` | modificado | DF2 preexistente; importa e renderiza financiamento | não atribuído à DGP0 | revisar/remover na DGP2, não nesta auditoria |
| `src/features/diagnostic/diagnosticPresentation.js` | modificado | DF2 preexistente | não atribuído à DGP0 | preservar até etapa futura |
| `src/pages/Diagnostico.jsx` | modificado | DF2 preexistente | não atribuído à DGP0 | preservar até etapa futura |
| `src/styles/institutional-refresh.css` | modificado | DF2 preexistente | não atribuído à DGP0 | revisar seletores na DGP2/DGP3 |
| `scripts/checks/diagnostic-contract.test.mjs` | modificado | DF2 preexistente | não atribuído à DGP0 | adaptar quando autorizado |
| `scripts/checks/diagnostic-e2e-test.cjs` | modificado | DF2 preexistente | não atribuído à DGP0 | adaptar quando autorizado |
| `docs/PLANO_MIGRACAO_UI.md` | modificado | registra DF2 | não atribuído à DGP0 | preservar |
| `src/features/diagnostic/DiagnosticFinancingSection.jsx` | não rastreado | DF2 preexistente | não atribuído à DGP0 | consumidor a remover futuramente |
| `scripts/checks/diagnostic-financing-interface.test.mjs` | não rastreado | DF2 preexistente | não atribuído à DGP0 | teste a revisar futuramente |
| `docs/DIAGNOSTICO_FINANCIAMENTO_INTERFACE_DF2.md` | não rastreado | registro DF2 | histórico, não decisão atual | preservar como histórico |
| `docs/DIAGNOSTICO_CONTRATO_LINGUAGEM_PUBLICA_V1.md` | não rastreado | registro DF3-A anterior | conteúdo substituído em parte | preservar como histórico |
| `artifacts/diagnostico-df2-2026-07-20/` | não rastreado | duas capturas DF2 | preexistente | preservar |

O diff atual confirma que `DiagnosticPanel.jsx` ainda chama `buildPublicFinancingItems`, `collectPublicFinancingSources` e renderiza `DiagnosticFinancingSection` nas linhas 4–8, 104–110 e 311–315. Isso descreve o estado pré-DGP2 e não invalida a decisão documental da DGP0.

## 6. Fonte canônica das metas

O caminho de execução confirmado é:

`src/app/appRoutes.ts:13` → `src/app/AppPageRouter.tsx:180–188` → `src/pages/CyclePage.jsx:32–38` → ciclo `pne_2026_2036` de `public/data/indicadores.json:218–220` → `enrichGoalRefs()` em `src/pages/CyclePage.jsx:392–408` → `src/data/pne2026IndicatorGoalRefs.js:1–35` → `MetaCard`/`IndicatorDetail`.

Fontes canônicas por função:

| Função | Arquivo | Evidência |
|---|---|---|
| universo, agrupamento e ordem pública | `public/data/indicadores.json` | ciclo inicia nas linhas 218–220; 49 itens reconstruídos |
| vínculo indicador → meta exibida | `src/data/pne2026IndicatorGoalRefs.js` | 34 chaves nas linhas 1–35 |
| injeção do `metaRef` | `src/pages/CyclePage.jsx` | linhas 392–408 |
| identificação visual como meta | `src/components/MetaCard.jsx` | linha 79 |
| objetivo, título e texto | `src/data/pne2026GoalTexts.js` | catálogo de 73 textos; consumido em `IndicatorDetail.jsx:235–242` |
| apresentação do ID/texto | `src/components/IndicatorDetail.jsx` | linhas 694–709 |
| rota | `src/app/appRoutes.ts` e `src/app/AppPageRouter.tsx` | linhas 13 e 180–188 |

Arquivos derivados ou auxiliares que não ampliam a allowlist: `src/data/pne2026LegalGoalIndicatorMap.js`, `src/data/diagnostic/indicatorCatalog.json`, `src/data/educationIndicatorCatalog.js`, helpers da página, loaders, testes e documentação. O documento DGP0 faz essa distinção nas linhas 17–42 e 79–104.

## 7. Contagem e allowlist

A reconstrução produziu 49 itens, 34 indicadores com `metaRef`, 15 sem `metaRef`, 24 IDs únicos e 73 textos legais disponíveis. A allowlist do documento corresponde exatamente à primeira ocorrência dos `metaRef` na ordem pública.

| Meta/ID da página | Presente na allowlist | Ordem igual | Conteúdo igual | Observação |
|---|---:|---:|---:|---|
| `1.a` — Creche | sim | sim | sim | primeiro indicador `creche` |
| `1.c` — Pré-escola | sim | sim | sim | `meta_label` da grade é genérico; prazo específico foi registrado como divergência |
| `4.a` — Acesso escolar 6 a 17 anos | sim | sim | sim | dois indicadores ligados |
| `6.a` — Tempo integral | sim | sim | sim | dois componentes |
| `12.a` — EPT de nível médio | sim | sim | sim | dois vínculos, somente um B |
| `12.b` — Cursos subsequentes | sim | sim | sim | um componente B |
| `3.a` — Alfabetização ao final do 2º ano | sim | sim | sim | usa texto legal por ausência de `dashboardText` |
| `5.a` — Aprendizagem nos anos iniciais | sim | sim | sim | dois componentes bloqueados |
| `5.b` — Aprendizagem nos anos finais | sim | sim | sim | dois componentes bloqueados |
| `5.d` — Aprendizagem no ensino médio | sim | sim | sim | dois componentes bloqueados |
| `4.b` — Conclusão do 5º ano na idade regular | sim | sim | sim | vínculo A |
| `4.c` — Conclusão do 9º ano na idade regular | sim | sim | sim | vínculo A |
| `4.d` — Conclusão do ensino médio na idade regular | sim | sim | sim | vínculo A |
| `17.a` — Formação específica dos docentes | sim | sim | sim | três componentes B |
| `17.f` — Pós-graduação dos docentes | sim | sim | sim | vínculo A |
| `17.b` — Rendimento do magistério | sim | sim | sim | vínculo E por proveniência pendente |
| `17.d` — Profissionais sem cargo efetivo | sim | sim | sim | vínculo A, direção `at_most` |
| `8.c` — Educação ambiental | sim | sim | sim | vínculo A |
| `18.b` — Conselhos escolares | sim | sim | sim | vínculo A |
| `8.b` — Conforto térmico | sim | sim | sim | componente B |
| `19.c` — Infraestrutura mínima nas escolas | sim | sim | sim | componente B |
| `11.a` — Alfabetização 15+ | sim | sim | sim | vínculo A |
| `11.b` — Conclusão do fundamental 15+ | sim | sim | sim | um A e um E |
| `11.c` — Conclusão do médio 18+ | sim | sim | sim | dois vínculos A, sem consolidação |

**Classificação da allowlist: APROVADA.** IDs, títulos e ordem coincidem; nenhuma meta externa, antiga, auxiliar ou inferida foi encontrada. As divergências de `meta_label` e prazo são explicitamente registradas, não usadas para ampliar a lista. Evidência: documento DGP0, linhas 17–77; fontes da página citadas na seção 6 deste relatório.

IDs exatos: `1.a`, `1.c`, `4.a`, `6.a`, `12.a`, `12.b`, `3.a`, `5.a`, `5.b`, `5.d`, `4.b`, `4.c`, `4.d`, `17.a`, `17.f`, `17.b`, `17.d`, `8.c`, `18.b`, `8.b`, `19.c`, `11.a`, `11.b`, `11.c`.

## 8. Matriz Meta × Indicador

| Meta | Indicadores diretos (A) | Componentes parciais (B) | Descritivos (C) | Incompatíveis/bloqueados (E) | Decisão final |
|---|---:|---:|---:|---:|---|
| `1.a` | 0 | 0 | 0 | 1 | sem diagnóstico atual |
| `1.c` | 0 | 0 | 0 | 1 | sem diagnóstico atual |
| `4.a` | 0 | 0 | 0 | 2 | sem diagnóstico atual |
| `6.a` | 0 | 2 | 0 | 0 | publicar componentes |
| `12.a` | 0 | 1 | 0 | 1 | publicar um componente |
| `12.b` | 0 | 1 | 0 | 0 | publicar componente quando elegível |
| `3.a` | 0 | 0 | 0 | 1 | sem diagnóstico atual |
| `5.a` | 0 | 0 | 0 | 2 | sem diagnóstico atual |
| `5.b` | 0 | 0 | 0 | 2 | sem diagnóstico atual |
| `5.d` | 0 | 0 | 0 | 2 | sem diagnóstico atual |
| `4.b` | 1 | 0 | 0 | 0 | diagnóstico direto |
| `4.c` | 1 | 0 | 0 | 0 | diagnóstico direto |
| `4.d` | 1 | 0 | 0 | 0 | diagnóstico direto |
| `17.a` | 0 | 3 | 0 | 0 | publicar componentes |
| `17.f` | 1 | 0 | 0 | 0 | diagnóstico direto |
| `17.b` | 0 | 0 | 0 | 1 | sem diagnóstico atual |
| `17.d` | 1 | 0 | 0 | 0 | diagnóstico direto |
| `8.c` | 1 | 0 | 0 | 0 | diagnóstico direto |
| `18.b` | 1 | 0 | 0 | 0 | diagnóstico direto |
| `8.b` | 0 | 1 | 0 | 0 | publicar componente |
| `19.c` | 0 | 1 | 0 | 0 | publicar componente |
| `11.a` | 1 | 0 | 0 | 0 | diagnóstico direto |
| `11.b` | 1 | 0 | 0 | 1 | publicar o A separado |
| `11.c` | 2 | 0 | 0 | 0 | dois resultados, sem consolidar a meta |

Totais: 11 vínculos A em 10 metas, 9 vínculos B em 6 metas, 14 vínculos E e nenhum C. Outros 15 indicadores são D, sem relação com a allowlist. Evidência: documento DGP0, linhas 106–157.

Indicadores que entram, 20: `basico_integral`, `escolas_integral`, `medio_tecnico_participacao_publica`, `subsequente_expansao`, `idade_regular_quinto`, `idade_regular_nono`, `idade_regular_medio`, `adequacao_ai`, `adequacao_af`, `adequacao_em`, `pos_graduacao`, `temporarios`, `educacao_ambiental`, `conselho_escolar`, `salas_climatizadas`, `salas_acessiveis`, `alfabetizacao_pop_15_mais`, `fundamental_concluido_15_29`, `medio_concluido_18_mais`, `medio_concluido_18_29`.

Indicadores que ficam fora, 29:

- E, 14: `creche`, `pre_escola`, `basico_6_17`, `basico_15_17`, `medio_tecnico_articulado_percentual`, `alfabetizacao`, os seis `saeb_*`, `rendimento_magisterio`, `fundamental_concluido_18_mais`;
- D, 15: `aee`, `eja_integrada_educacao_profissional_percentual`, `internet`, `internet_alunos`, `internet_aprendizagem`, `internet_comunidade`, `acesso_internet_computador`, `acesso_internet_disp_pessoais`, `rede_local`, `rede_wireless`, `banda_larga`, `proposta_pedagogica`, `desktop_aluno`, `comp_portatil_aluno`, `tablet_aluno`.

Metas sem diagnóstico municipal atual, 8: `1.a`, `1.c`, `4.a`, `3.a`, `5.a`, `5.b`, `5.d`, `17.b`.

Quais dos 29 indicadores excluídos ficam **somente** na página geral de Educação: **Não confirmado na auditoria**. A DGP0 determina que fiquem fora do Diagnóstico, mas não produz uma lista de destino por página. Evidência: documento DGP0, linhas 171–200.

## 9. Cardinalidade das metas

A página possui 15 metas com um indicador vinculado e 9 com vários: `4.a`, `6.a`, `12.a`, `5.a`, `5.b`, `5.d`, `17.a`, `11.b`, `11.c`. Nenhum indicador está associado a mais de uma meta pelo mapa efetivamente usado. A DGP0 proíbe média, soma, score, seleção de melhor/pior e dedução de situação integral por um componente. O contador escolhido é “Resultados que alcançaram o valor previsto na meta”, não “Metas alcançadas”. Evidência: documento DGP0, linhas 202–226.

Componentes B são apresentados como “Resultado ligado à meta” e não alimentam contador integral de metas. Evidência: linhas 165–169 e 215–224.

## 10. Classificação pública

A classificação principal foi reduzida a **Resultados a manter** e **Pontos para avançar**. A DGP0 remove ação municipal, pactuação, parceria como classe principal, investigação, evidência, governabilidade, exposição, prioridade, score e ranking. O RS é apenas contexto e indicadores sem meta válida não são classificados como não alcançados. Evidência: documento DGP0, linhas 13, 215–226, 285–309 e 347–366.

Os contratos atuais ainda contêm estruturas antigas em `decisionSummary`, `attentionItems`, governança e evidência. A DGP0 as mantém internas até a substituição no pipeline e na interface; não as aceita no produto final.

## 11. Distância para a meta

A DGP0 define direção e fórmulas corretamente:

- `at_least`: alcançado quando valor municipal ≥ referência;
- `at_most`: alcançado quando valor municipal ≤ referência;
- distância favorável: `atual − meta` para `at_least`, `meta − atual` para `at_most`;
- distância restante: `max(0, −distância favorável)`.

A reprodução dos 9.119 resultados elegíveis encontrou zero resultado sem valor, ano, fonte ou distância; zero divergência na fórmula de distância; e zero divergência entre direção e `goalAttained`. A linguagem recomendada usa “faltam”, “acima” e “valor previsto alcançado”, sem gap, déficit, atraso ou julgamento do município. Evidência: documento DGP0, linhas 215–226 e 295–319; contratos `public/data/municipios/{slug}/diagnostico.json`, campos `direction`, `configuredReference`, `favorableDistance`, `remainingGap` e `goalAttained`.

## 12. Meta × Rio Grande do Sul

A DGP0 define as cinco combinações e mantém o RS secundário. O pipeline exige compatibilidade curada, ano comparável, cobertura mínima de 80% e tolerância existente de 0,1 p.p. para “próximo”. Evidência: `data_pipeline/src/municipal_diagnostic.py`, linhas 15–20, 399–438 e 592–700; documento DGP0, linhas 228–242.

| Combinação real | Resultados |
|---|---:|
| alcançou + acima/próximo do RS | 1.175 |
| alcançou + abaixo do RS | 0 |
| ainda pode avançar + acima/próximo do RS | 2.024 |
| ainda pode avançar + abaixo do RS | 2.949 |
| sem RS + alcançou | 185 |
| sem RS + pode avançar | 2.786 |

Cobertura: 6.148 comparações resultado × RS, sendo 3.159 acima, 40 próximas e 2.949 abaixo; 5.154 combinações município × meta com RS. Todos os 497 municípios têm ao menos uma comparação; 497 têm ao menos uma acima, 38 uma próxima e 494 uma abaixo. A reprodução encontrou zero comparação publicável com ano municipal/estadual divergente e zero comparação sem método.

## 13. Posição entre municípios

O percentil direcional foi validado no pipeline: valores menores contam a favor em `at_least`, valores maiores contam a favor em `at_most` e empates valem metade. Evidência: `data_pipeline/src/municipal_diagnostic.py`, linhas 301–319 e 701–735.

As faixas propostas são matematicamente compatíveis:

- `percentile >= 75`: entre os 25% com resultados mais favoráveis;
- `25 <= percentile < 75`: faixa intermediária;
- `percentile < 25`: maior espaço para avançar.

Cobertura reproduzida: 5.964 resultados com percentil, distribuídos em 1.546 / 2.924 / 1.494. Todos os 497 municípios possuem ao menos um percentil. Nenhum percentil ficou fora de 0–100. A DGP0 proíbe posição ordinal, ranking, melhor/pior quartil e percentil bruto na interface. Evidência: documento DGP0, linhas 244–254.

## 14. Municípios de oferta semelhante

O título final é **Municípios com oferta educacional de tamanho semelhante**. O método usa somente `offering_size`, exige ao menos 20 municípios, calcula distância de porte e seleciona até 20 pares. Não sustenta equivalência socioeconômica. Evidência: `data_pipeline/src/municipal_diagnostic.py`, linhas 1138–1235; documento DGP0, linhas 256–262.

Cobertura reproduzida: 6.086 comparações em 497 municípios; zero registro disponível falhou em compatibilidade de indicador, ano, fórmula, unidade, base territorial ou oferta. Distribuição: 1.819 na faixa ≥75, 2.831 intermediárias e 1.436 abaixo de 25, conforme o documento original. Quando indisponível, a orientação é omitir sem explicação.

## 15. Trajetória

A DGP0 limita a trajetória aos 20 indicadores A/B e distingue disponibilidade técnica de publicação segura:

- 9.119 resultados têm `trajectory.status = available`;
- 1.982 `component_maintenance` têm trajetória pública em 497 municípios;
- 583 possuem ano estimado, distribuídos em 351 municípios;
- 7.137 `required_trajectory` com `quality = not_assessed` não podem ser apresentados como evolução histórica validada.

Pontos históricos reproduzidos: 1.991 com um ponto, 498 com dois e 6.630 com pelo menos três. Estados de ritmo: 1.787 `moving_away`, 410 `stable`, 1.601 `sufficient`, 1.672 `insufficient`, 1.360 `target_already_met` e 2.289 `insufficient_history`. A DGP0 exige que o pipeline materialize o texto e que o React não faça inferência. Evidência: documento DGP0, linhas 264–283 e 431–457.

## 16. Estrutura final proposta

A estrutura final contém: cabeçalho; resumo e contadores de resultados; contexto RS; filtros; lista por meta; resultado, ano, referência, prazo e distância; RS; posição estadual; trajetória; oferta semelhante; e fontes. Cada indicador aparece uma vez e grupos vazios são omitidos. Evidência: documento DGP0, linhas 285–293.

Meta sem resultado A/B elegível não cria card vazio, “sem dados” ou justificativa; continua normalmente na página PNE 2026–2036. Evidência: linhas 321–331.

## 17. Remoção do financiamento

**Classificação: APROVADO no contrato DGP0.**

A DGP0:

1. remove financiamento, programas e recursos do produto final, linhas 9–13;
2. manda remover “Programas que podem apoiar as melhorias” e “Fontes dos programas”, linhas 347–365;
3. mapeia `DiagnosticFinancingSection.jsx`, helpers, imports, testes e CSS para remoção futura, linhas 381–389;
4. mantém DF0, DF0.1, DF1 e DF2 apenas como histórico e preserva o Panorama financeiro, linhas 381–389 e 536–540;
5. substitui formalmente decisões anteriores que mantinham DF2 visível, linhas 536–540.

Não houve remoção de código na DGP0. O código atual ainda contém o consumidor de financiamento em `src/components/DiagnosticPanel.jsx:4–8`, `104–110` e `311–315`, alteração preexistente da DF2. Isso não é desvio da DGP0, que era exclusivamente documental; a remoção pertence à DGP2.

## 18. Estruturas antigas

A seção 24 do documento DGP0 avalia as estruturas antigas e decide entre remover, substituir, incorporar e manter. Evidência: linhas 347–366.

| Grupo | Decisão DGP0 |
|---|---|
| cabeçalho, síntese e situação por tema atuais | substituir |
| ação, pactuação, investigação, evidência, governabilidade, exposição, score/ranking | remover |
| resultados a preservar/acompanhar | incorporar nos dois grupos finais |
| listas de diferenças/destaques RS | incorporar no próprio resultado |
| percentil, oferta semelhante e trajetória | incorporar qualitativa e condicionalmente |
| programas e fontes de programas | remover |
| mensagens técnicas e estados vazios | remover da página pública |
| seleção municipal, cópia, impressão e fontes educacionais | manter e adaptar |

O mapa de arquivos correspondente está nas linhas 368–395. Documentos DF2 e DF3-A são históricos e não controlam a decisão atual quando houver conflito.

## 19. Auditoria dos 497 municípios

### Universo e método reproduzido

`public/data/municipios_index.json` contém 497 municípios. Para cada registro, foi lido `public/data/municipios/{slug}/diagnostico.json`, indexado por `indicatorId` e filtrado pelos 20 vínculos A/B definidos na DGP0. Foram conferidos presença de resultado, ano, fonte, elegibilidade, distância, alcance, RS, percentil, oferta semelhante e trajetória. Os caminhos equivalentes por ID foram comparados byte a byte com os caminhos por slug: 497 pares, zero divergência.

| Indicador | Meta | Classe | resultado/ano | fonte | distância elegível | alcançou | pode avançar | RS | percentil | oferta semelhante | trajetória pública |
|---|---|:---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `basico_integral` | `6.a` | B | 497 | 497 | 497 | 107 | 390 | 497 | 497 | 488 | 497 |
| `escolas_integral` | `6.a` | B | 497 | 497 | 497 | 176 | 321 | 497 | 497 | 484 | 497 |
| `medio_tecnico_participacao_publica` | `12.a` | B | 170 | 497 | 170 | 113 | 57 | 170 | 0 | 152 | 0 |
| `subsequente_expansao` | `12.b` | B | 148 | 497 | 14 | 4 | 10 | 14 | 0 | 0 | 0 |
| `idade_regular_quinto` | `4.b` | A | 494 | 497 | 494 | 24 | 470 | 0 | 0 | 0 | 0 |
| `idade_regular_nono` | `4.c` | A | 494 | 497 | 494 | 37 | 457 | 0 | 0 | 0 | 0 |
| `idade_regular_medio` | `4.d` | A | 493 | 497 | 493 | 107 | 386 | 0 | 0 | 0 | 0 |
| `adequacao_ai` | `17.a` | B | 497 | 497 | 497 | 17 | 480 | 0 | 0 | 0 | 0 |
| `adequacao_af` | `17.a` | B | 497 | 497 | 497 | 0 | 497 | 0 | 0 | 0 | 0 |
| `adequacao_em` | `17.a` | B | 496 | 497 | 496 | 0 | 496 | 0 | 0 | 0 | 0 |
| `pos_graduacao` | `17.f` | A | 497 | 497 | 497 | 178 | 319 | 497 | 497 | 497 | 491 |
| `temporarios` | `17.d` | A | 497 | 497 | 497 | 128 | 369 | 497 | 497 | 497 | 497 |
| `educacao_ambiental` | `8.c` | A | 497 | 497 | 497 | 59 | 438 | 497 | 497 | 497 | 0 |
| `conselho_escolar` | `18.b` | A | 497 | 497 | 497 | 182 | 315 | 497 | 497 | 496 | 0 |
| `salas_climatizadas` | `8.b` | B | 497 | 497 | 497 | 77 | 420 | 497 | 497 | 497 | 0 |
| `salas_acessiveis` | `19.c` | B | 497 | 497 | 497 | 10 | 487 | 497 | 497 | 490 | 0 |
| `alfabetizacao_pop_15_mais` | `11.a` | A | 497 | 497 | 497 | 141 | 356 | 497 | 497 | 497 | 0 |
| `fundamental_concluido_15_29` | `11.b` | A | 497 | 497 | 497 | 0 | 497 | 497 | 497 | 497 | 0 |
| `medio_concluido_18_mais` | `11.c` | A | 497 | 497 | 497 | 0 | 497 | 497 | 497 | 497 | 0 |
| `medio_concluido_18_29` | `11.c` | A | 497 | 497 | 497 | 0 | 497 | 497 | 497 | 497 | 0 |
| **Total** | — | — | **9.253** | **9.940** | **9.119** | **1.360** | **7.759** | **6.148** | **5.964** | **6.086** | **1.982** |

Resultados mostrados por município: mínimo 15 em Restinga Seca, Vespasiano Correa e Westfalia; máximo 20 em 12 municípios. Distribuição: 15 em 3 municípios, 16 em 1, 18 em 321, 19 em 160 e 20 em 12. Municípios com zero resultados classificáveis: 0. Metas/grupos por município: mínimo 11 e máximo 16. Evidência original: documento DGP0, linhas 397–473; reprodução efêmera abaixo.

### Comandos e scripts efêmeros registrados

```text
rg --files public/data/municipios
Get-Content public/data/municipios_index.json
node  # scripts enviados por stdin; nenhum arquivo temporário persistido
```

O primeiro script importou `PNE_2026_INDICATOR_GOAL_REFS` e `PNE_2026_GOAL_TEXTS`, achatou `indicadores.json`, injetou `metaRef` com a mesma regra de `CyclePage.jsx` e reteve a primeira ocorrência de cada ID. O segundo percorreu os 497 slugs, aplicou os conjuntos A/B do documento e agregou os seguintes predicados:

```js
hasResult = Number.isFinite(indicator.displayValue)
hasYear = Number.isFinite(indicator.currentYear)
hasSource = indicator.source?.sourceIds?.length > 0
eligible = indicator.targetComparisonStatus === 'eligible'
distanceValid = eligible && Number.isFinite(indicator.favorableDistance)
  && Number.isFinite(indicator.remainingGap)
rsValid = eligible && indicator.benchmarks?.state?.status === 'comparable'
percentileValid = eligible
  && indicator.benchmarks?.municipalDistribution?.status === 'available'
similarValid = eligible && indicator.similarMunicipalities?.status === 'available'
trajectoryPublic = eligible && indicator.trajectory?.status === 'available'
  && indicator.trajectory?.scenarioType === 'component_maintenance'
  && indicator.trajectory?.quality !== 'not_assessed'
```

Também foram verificadas as fórmulas direcionais de distância e alcance, compatibilidade de pares, intervalo de percentil, ano/método do RS e igualdade binária entre as árvores por slug e ID. Nenhum erro foi encontrado.

## 20. Fontes

A DGP0 limita a interface a órgão, nome da base/pesquisa/relatório, ano/período e link oficial; apenas fontes efetivamente usadas podem aparecer. Fonte de programa, fonte financeira, hash, parser, schema, contrato, campo JSON, cobertura, código de ausência e detalhes técnicos ficam fora. Resultado sem fonte oficial é omitido silenciosamente. Evidência: documento DGP0, linhas 321–345.

Os 20 indicadores aprovados usam `inep_censo_escolar` e `ibge_censo_demografico_2010_2022`. Os contratos trazem IDs, rótulos e períodos, mas as URLs oficiais de INEP e IBGE ainda não estão materializadas; isso é gate explícito da DGP1. `municipal_age_population_panel` e proveniências pendentes não autorizam publicação. Estado: **PASSOU COM RESSALVA**.

## 21. Plano DGP1–DGP4

O documento propõe e não executa as quatro fases: DGP1 contrato público, DGP2 reconstrução da página, DGP3 fontes/cópia/impressão/acessibilidade e DGP4 validação final. Evidência: linhas 475–507.

| Fase | Objetivo e ações | Arquivos/dependências | Congelamento/parada/testes | Avaliação |
|---|---|---|---|---|
| DGP1 | materializar allowlist, A/B, gates, estados e fontes | pipeline e tipos aparecem no mapa das linhas 368–395; depende da DGP0 e de URLs oficiais | critérios gerais estão nas linhas 509–530, mas não há bloco próprio de parada/testes | parcial |
| DGP2 | reconstruir lista, resumo e filtros; remover financiamento | componentes, apresentação, CSS e testes estão mapeados | depende do contrato DGP1; congelamentos e teste por fase não estão formalizados | parcial |
| DGP3 | consolidar fontes, tela/cópia/impressão e acessibilidade | depende da interface DGP2 e das fontes DGP1 | lista validações de UX, mas não separa critério de parada e suíte | parcial |
| DGP4 | auditar 497 e validar interface final | depende de DGP1–DGP3 | lista escopo de validação e build, sem mapa completo de testes por arquivo | parcial |

Nenhuma fase foi implementada durante a DGP0. A lacuna é de detalhamento do plano, não de decisão do produto.

## 22. Conformidade técnica

A DGP0 deveria criar somente um Markdown. O arquivo DGP0 declara isso nas linhas 3–5, 370 e 540. Os horários e o documento DF2 sustentam que as alterações em JSX, JS, CSS, testes, plano e artefatos já existiam antes. Nenhum `.json`, contrato municipal, pipeline Python, rota, loader, schema ou catálogo apresenta alteração no `git status` atribuível à DGP0.

Limitação: sem commit ou registro de execução, a atribuição histórica não pode ser provada de forma absoluta. Estado: **PASSOU COM RESSALVA**.

Nesta DGP0-V não houve alteração de código, contrato, JSON, pipeline, catálogo, teste ou documento anterior. Somente este relatório foi criado.

## 23. Matriz V01–V30

| ID | Requisito | Estado | Evidência | Arquivo/linhas | Impacto | Correção futura |
|---|---|---|---|---|---|---|
| V01 | fonte canônica da página PNE localizada | PASSOU | rota, ciclo, catálogo, mapa e textos localizados | `appRoutes.ts:13`; `AppPageRouter.tsx:180–188`; `CyclePage.jsx:32–38,392–408` | nenhum | — |
| V02 | contagem exata das metas | PASSOU | 24 IDs reconstruídos | DGP0:44–77 | nenhum | — |
| V03 | allowlist fechada | PASSOU | interseção e primeira ocorrência definidas | DGP0:15–30 | nenhum | — |
| V04 | nenhuma meta externa | PASSOU | lista igual à página | DGP0:44–77,532–534 | nenhum | — |
| V05 | nenhuma meta antiga | PASSOU | nenhum ID do ciclo 2014–2024 | DGP0:24–30,532–534 | nenhum | — |
| V06 | ordem preservada | PASSOU | 24 IDs na ordem pública | DGP0:30,44–77 | nenhum | — |
| V07 | 49 indicadores não usados como lista livre | PASSOU | 20 entram, 29 ficam fora | DGP0:7–13,182–200 | nenhum | — |
| V08 | vínculos explícitos Meta × Indicador | PASSOU | 34 vínculos vêm do mapa da página | `pne2026IndicatorGoalRefs.js:1–35`; DGP0:106–145 | nenhum | — |
| V09 | classificação dos vínculos | PASSOU | A/B/C/D/E registrada | DGP0:147–157 | nenhum | — |
| V10 | componentes parciais corretos | PASSOU | B não declara meta integral | DGP0:165–169,202–224 | nenhum | — |
| V11 | metas múltiplas sem média/score | PASSOU | proibição explícita | DGP0:202–213 | nenhum | — |
| V12 | classificação pública com dois grupos | PASSOU | manter/avançar | DGP0:215–226 | nenhum | — |
| V13 | direção `at_least`/`at_most` | PASSOU | fórmula e 9.119 verificações sem divergência | DGP0:219–224 | nenhum | — |
| V14 | distância válida | PASSOU | 9.119 distâncias elegíveis reproduzidas | DGP0:397–427 | nenhum | — |
| V15 | matriz Meta × RS | PASSOU | cinco combinações e 6.148 casos | DGP0:228–242 | nenhum | — |
| V16 | posição estadual validada | PASSOU | fórmula direcional e 5.964 percentis | pipeline:301–319,701–735; DGP0:244–254 | nenhum | — |
| V17 | municípios de oferta semelhante | PASSOU | método, nome e 6.086 casos | pipeline:1138–1235; DGP0:256–262 | nenhum | — |
| V18 | trajetória limitada à allowlist | PASSOU | 1.982 publicáveis; cenários não avaliados bloqueados | DGP0:264–283 | nenhum | — |
| V19 | linguagem respeitosa | PASSOU | textos e termos proibidos | DGP0:295–319 | nenhum | — |
| V20 | omissão silenciosa | PASSOU | gates e ausência sem mensagem | DGP0:321–331 | nenhum | — |
| V21 | estrutura final sem duplicidade | PASSOU | lista por meta e resultado único | DGP0:285–293 | nenhum | — |
| V22 | financiamento removido | PASSOU | excluído do contrato final | DGP0:13,347–389,536–540 | implementação ainda futura | executar somente na DGP2 |
| V23 | DF2 apenas histórico | PASSOU | substituição formal | DGP0:381–389,536–540 | nenhum | — |
| V24 | Panorama financeiro preservado | PASSOU | exclusão expressa da mudança | DGP0:389,538 | nenhum | — |
| V25 | fontes educacionais | PASSOU COM RESSALVA | política correta; URLs oficiais ainda pendentes | DGP0:333–345 | impede publicar fontes incompletas | materializar na DGP1 |
| V26 | auditoria dos 497 contratos | PASSOU | 497 lógicos, 24.353 registros; contagens reproduzidas | DGP0:397–473 | nenhum | — |
| V27 | mapa de arquivos | PASSOU | fontes da página e arquivos futuros mapeados | DGP0:79–104,368–395 | nenhum | — |
| V28 | plano DGP1–DGP4 | PARCIAL | fases existem, mas requisitos por fase não estão todos explicitados | DGP0:475–507 | governança da execução menos precisa | explicitar no prompt de cada fase |
| V29 | somente Markdown criado | PASSOU COM RESSALVA | horários e DF2 sustentam a atribuição; sem commit/histórico | DGP0:3–5,370,540 | incerteza histórica residual | preservar escopo e registrar em commit quando autorizado |
| V30 | nenhuma meta pesquisada/adicionada | PASSOU COM RESSALVA | lista não contém meta extra; declaração existe, mas histórico externo foi perdido | DGP0:532–534 | nenhuma divergência material | manter lista imutável na DGP1 |

## 24. Divergências e riscos

1. **URLs oficiais pendentes.** INEP e IBGE possuem ID, rótulo e período, mas não URL oficial materializada. Resultado sem fonte oficial não pode ser publicado. Evidência: DGP0, linhas 333–345.
2. **Destino dos 29 indicadores.** A exclusão do Diagnóstico é inequívoca, porém a lista dos que permanecem somente na página geral de Educação não foi formalizada. **Não confirmado na auditoria.** Evidência: DGP0, linhas 190–200.
3. **Plano DGP1–DGP4 pouco segmentado.** As fases existem, mas dependências, congelamentos, parada e testes não aparecem completos para cada fase. Evidência: DGP0, linhas 475–507.
4. **Rastreabilidade histórica limitada.** O entregável DGP0 está não rastreado; a atribuição temporal depende de horários, conteúdo e do registro DF2. Não há evidência de desvio, mas não existe prova por commit.
5. **Dois caminhos físicos por município.** Há 994 arquivos, representando 497 contratos lógicos em espelhos slug/ID. Os pares são idênticos hoje; futuras auditorias devem escolher o índice canônico ou verificar os espelhos para evitar contagem dobrada.
6. **Interface atual ainda mostra financiamento.** Isso é estado preexistente e esperado antes da DGP2, não falha da etapa documental. Evidência: `DiagnosticPanel.jsx:4–8,104–110,311–315`.

## 25. Decisão sobre iniciar ou não a DGP1

**DGP1 pode começar.**

A allowlist, a ordem, os vínculos A/B/E/D, os gates, a cardinalidade, a direção e as contagens estão suficientemente fechados e reproduzíveis. A DGP1 deve tratar as URLs oficiais como gate, manter os 29 indicadores fora do Diagnóstico e não executar reconstrução visual nem remoção de interface, que pertencem à DGP2.

## 26. Próximo prompt recomendado, sem executá-lo

Task:
Implementar a DGP1 — contrato público do Diagnóstico municipal no pipeline, materializando a allowlist imutável das 24 metas, os 20 indicadores A/B aprovados, os gates de publicação e os campos públicos de situação, distância, RS, faixa estadual, oferta semelhante, trajetória e fontes.

Scope:
Modificar somente o pipeline e os tipos/contratos estritamente necessários. Usar como fonte normativa `docs/DIAGNOSTICO_MUNICIPAL_PRODUTO_FINAL_PNE_2026_2036_V1.md` e as ressalvas de `docs/VERIFICACAO_DGP0_DIAGNOSTICO_PNE_2026_2036.md`. Não reconstruir a página, não remover ainda componentes da interface, não alterar o Panorama financeiro, não ampliar a allowlist e não regenerar dados sem autorização explícita. Tratar URL oficial de INEP/IBGE como gate; sem URL, omitir o resultado público.

Success:
O pipeline produz um contrato por meta e resultado somente para os 24 IDs permitidos e os 20 vínculos A/B elegíveis; componentes B nunca contam como meta integral; `at_least`/`at_most`, distância, RS, percentil, oferta semelhante, trajetória e fontes vêm materializados sem recálculo no React; os 29 indicadores excluídos não entram; e os critérios de parada e testes específicos da DGP1 ficam explicitados antes da futura DGP2.

---

**Confirmação final de escopo:** nesta verificação, somente este relatório Markdown foi criado. Nenhum documento anterior, código, contrato, JSON, pipeline, teste, rota, loader, schema ou catálogo foi alterado; nenhum dado foi regenerado ou baixado; nenhuma meta foi pesquisada ou adicionada; nenhuma correção e nenhuma etapa DGP1–DGP4 foi executada.
