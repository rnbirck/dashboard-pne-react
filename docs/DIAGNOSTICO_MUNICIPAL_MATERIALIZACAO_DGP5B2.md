# DGP5-B2 — Materialização paralela do Diagnóstico municipal v2

Data: 2026-07-21.

## 1. Objetivo e decisão

A etapa materializou, em paralelo ao contrato vigente, a propriedade `pne2026PublicDiagnosticV2`, com versão interna `pne2026-public-diagnostic-v2` e `schemaVersion: municipal-diagnostic-v2`. A propriedade foi produzida exclusivamente por `build_pne2026_public_diagnostic_v2(...)`; o materializador não reconstrói indicadores.

A DGP5-B2 foi aprovada. A DGP5-B3 pode adaptar a interface para o contrato v2, mantendo o v1 até decisão específica de remoção.

## 2. Estado inicial do worktree

O worktree já estava alterado antes da DGP5-B2: 1.535 entradas no `git status`, sendo 1.015 arquivos modificados e 520 não rastreados. Os 994 `public/data/municipios/*/diagnostico.json` já estavam modificados pela etapa anterior. Também havia alterações paralelas de frontend, finanças, QSE e documentação, todas preservadas.

O estado inicial do v1 nos 497 contratos canônicos era:

- hash agregado do valor JSON exato de `pne2026PublicDiagnostic`: `72919cf09d229b59cda104b6a45532668a3c8f3d24f845d1bac3f1177163c0c6`;
- versão `pne2026-public-diagnostic-v1` nos 497 municípios;
- 9.119 resultados: 7.759 `advance` e 1.360 `maintain`;
- mínimo 15, máximo 20, média 18,3481 e mediana 18;
- distribuição: 15: 3; 16: 1; 18: 321; 19: 160; 20: 12;
- 6.148 resultados com comparações, 1.982 trajetórias e 994 ocorrências de fontes no nível do contrato.

## 3. Materializador e método transacional

Foi criado `data_pipeline/scripts/materialize_pne2026_public_diagnostic_v2.py`. O fluxo:

1. lê o registro oficial e exige 497 slugs e 497 códigos IBGE únicos;
2. exige 994 arquivos físicos e identidade byte a byte prévia de cada par canônico–alias;
3. rejeita propriedades JSON duplicadas;
4. constrói e valida todos os 497 contratos em memória antes de escrever;
5. insere o v2 imediatamente antes do v1, preservando os bytes exatos do valor JSON do bloco v1;
6. prepara e valida os 994 conteúdos em staging;
7. mantém cópias de segurança e restaura os arquivos já substituídos se qualquer substituição falhar;
8. reabre e audita os 994 arquivos após a escrita.

A primeira execução escreveu 994 arquivos. A segunda execução produziu o mesmo hash agregado, `7a027714059db8feadad00eee21e907ad8bc71ed6f959ef77641c5489688fd05`, e escreveu zero arquivos, confirmando determinismo.

## 4. Contratos materializados

- contratos canônicos por slug: 497;
- aliases por código IBGE: 497;
- arquivos físicos: 994;
- pares canônico–alias byte a byte idênticos: 497;
- propriedade v2 por contrato: exatamente uma;
- versão interna correta: 497;
- catálogo com 34 pares, 24 metas, nove essenciais, 25 complementares e oito temas: 497;
- metadata dos nove essenciais, com `priorityOrder` de 1 a 9: presente nos 497;
- complementares promovidos: zero.

## 5. Auditoria completa da v2

- resultados PNE disponíveis e resultados v2: 15.896 / 15.896;
- ausências reais: 1.002 entre 16.898 possibilidades;
- mínimo / máximo por município: 26 / 34;
- média / mediana: 31,9839 / 32;
- distribuição: 26: 1; 27: 3; 28: 6; 29: 15; 30: 34; 31: 134; 32: 150; 33: 24; 34: 130;
- `advance` / `maintain` / sem classificação: 11.972 / 2.447 / 1.477;
- `at_least` / `at_most`: 15.399 / 497;
- `direct` / `partial_component` / `contextual_proxy`: 6.789 / 8.113 / 994;
- comparações estaduais / posições estaduais: 8.473 / 8.420;
- comparações com oferta semelhante: 7.616;
- trajetórias / anos estimados: 12.042 / 1.731;
- municípios sem `rendimento_magisterio`: 33.

## 6. Paridade PNE × v2 e valores especiais

A auditoria encontrou zero divergência de valor, ano, unidade, classificação e fonte. Também encontrou zero resultado ausente no v2, zero resultado inesperado, zero resultado fora dos 34 pares, zero meta fora das 24 metas e zero duplicação.

Foram preservados:

- 127 valores negativos de `subsequente_expansao`;
- 494 valores acima de 100%, inclusive sete de `subsequente_expansao`;
- 994 ocorrências `contextual_proxy`, todas sem classificação;
- os seis resultados SAEB como `partial_component`;
- a regra `maintain_only` de `medio_tecnico_articulado_percentual`: 13 `maintain`, 483 sem classificação e nenhum `advance`;
- ausência como ausência, sem zero, placeholder ou promoção de complementar.

## 7. Preservação do v1

O hash agregado do valor JSON exato de `pne2026PublicDiagnostic` antes e depois permaneceu `72919cf09d229b59cda104b6a45532668a3c8f3d24f845d1bac3f1177163c0c6`. A versão, os 9.119 resultados, as classificações, a ordem, as fontes, comparações e trajetórias permaneceram cobertas pelo mesmo bloco byte a byte.

A propriedade `pne2026PublicDiagnostic` não foi renomeada, substituída nem recalculada. A interface continua consumindo o v1.

## 8. Arquivos criados

- `data_pipeline/scripts/materialize_pne2026_public_diagnostic_v2.py`;
- `data_pipeline/tests/test_materialize_pne2026_public_diagnostic_v2.py`;
- `docs/DIAGNOSTICO_MUNICIPAL_MATERIALIZACAO_DGP5B2.md`.

## 9. Arquivos alterados

- 994 arquivos `public/data/municipios/*/diagnostico.json`, limitados à adição de `pne2026PublicDiagnosticV2`.

## 10. Arquivos removidos

Nenhum.

## 11. Testes executados

- `python -m unittest data_pipeline.tests.test_pne2026_public_diagnostic_v2 data_pipeline.tests.test_materialize_pne2026_public_diagnostic_v2`: 30 testes, todos aprovados;
- `python -m unittest data_pipeline.tests.test_pne_2026_public_diagnostic data_pipeline.tests.test_municipal_diagnostic_payloads.MunicipalDiagnosticPayloadTest.test_slug_and_code_aliases_are_identical_for_index_and_diagnostic`: 18 testes, todos aprovados;
- `python data_pipeline/scripts/audit_pne2026_public_diagnostic_v2.py`: auditoria dos 497 municípios aprovada;
- `python data_pipeline/scripts/materialize_pne2026_public_diagnostic_v2.py`, segunda execução: zero arquivos escritos e hash agregado idêntico;
- `git diff --check`: aprovado, sem erro de whitespace; o Git emitiu apenas avisos de conversão futura LF/CRLF do ambiente Windows.

Não foram executados lint JavaScript, typecheck, build, E2E, regressão visual ou screenshots.

## 12. Caminhos protegidos

O materializador não lê nem escreve React do Diagnóstico, CSS, tipos TypeScript, rotas, shell, PNE público agregado, JSONs ou contratos financeiros, `financeiro.json`, Panorama financeiro, baselines ou documentos DGP2–DGP5-B1. Alterações preexistentes nesses caminhos permaneceram intactas.

## 13. Pendências e decisão final

Não há bloqueio de materialização. Os 33 municípios sem `rendimento_magisterio` refletem ausência real no PNE e permanecem sem resultado, como exigido.

**DGP5-B2 aprovada; a DGP5-B3 pode adaptar a interface para o contrato v2.**
