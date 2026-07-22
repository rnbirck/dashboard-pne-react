# DGP5-B1 — Homologação canônica do Diagnóstico completo

Data da decisão: 2026-07-21.

Esta etapa, realinhada pela decisão DGP5-B1R, integra o Diagnóstico por paridade com o fluxo público vigente do PNE 2026–2036. Ela não realiza uma nova homologação independente dos arquivos brutos, não materializa arquivos municipais, não substitui o contrato v1 e não inicia a interface.

## 1. Decisões de produto

- O universo é uma allowlist versionada de 34 pares únicos `goalId × indicatorId`, correspondentes aos cards agregados que chegam à grade pública do PNE 2026–2036.
- Nove resultados são essenciais em ordem editorial fixa e 25 são complementares. Ausência de valor não produz zero, card vazio nem promoção de complementar.
- A ordem normativa é numérica por meta — número inteiro e depois letra — e canônica dentro da meta. A ordem dos oito temas é uma dimensão independente.
- Os vínculos permitidos são `direct`, `partial_component` e `contextual_proxy`. Somente `4.a × basico_15_17` e `11.b × fundamental_concluido_18_mais` são proxies contextuais.
- Valor, classificação, distância, comparação, cópia e impressão usam o número real. Apenas a geometria futura de uma barra poderá limitar sua largura.
- Comparações, posições, pares similares, trajetórias e anos estimados só entram quando já estão materializados e são permitidos pelo catálogo.
- O resultado municipal já público no PNE 2026–2036 é a fonte canônica desta integração. Todo resultado disponível para um dos 34 pares entra no v2 sem recálculo; fontes e períodos são herdados do fluxo PNE.
- A investigação externa DGP5-B1.1 foi encerrada por estar fora do objetivo do produto. Nenhum arquivo de projeto irmão foi incorporado e a DGP5 não afirma certificação independente das bases brutas.

## 2. Catálogo canônico

O arquivo `data_pipeline/src/data/pne2026_diagnostic_presentation_v2.json` é a fonte única de apresentação `pne2026-diagnostic-presentation-v2`. A lista `results` é a allowlist; dela são derivados pares, metas, indicadores, tiers, temas, ordem, vínculos, classificação, política de valores e fontes.

O pipeline anexa `goalId` e `diagnosticPresentation` aos itens reais de `data_pipeline/src/views/pne_2026_2036.py::INDICADORES`. Assim, `_serialize_categories` exportará a relação canônica — inclusive `12.c` — sem consultar `src/data/pne2026IndicatorGoalRefs.js`. O mapa React legado foi preservado porque ainda atende a interface atual e sua remoção nesta etapa quebraria o fluxo v1.

## 3. Lista dos 34 pares

| Ordem | Meta | Indicador | Tier |
|---:|---|---|---|
| 1 | 1.a | `creche` | essencial |
| 2 | 1.c | `pre_escola` | essencial |
| 3 | 4.a | `basico_6_17` | essencial |
| 4 | 4.a | `basico_15_17` | complementar |
| 5 | 4.b | `idade_regular_quinto` | complementar |
| 6 | 4.c | `idade_regular_nono` | essencial |
| 7 | 4.d | `idade_regular_medio` | complementar |
| 8 | 5.a | `saeb_matematica_anos_iniciais` | complementar |
| 9 | 5.a | `saeb_portugues_anos_iniciais` | complementar |
| 10 | 5.b | `saeb_matematica_anos_finais` | essencial |
| 11 | 5.b | `saeb_portugues_anos_finais` | complementar |
| 12 | 5.d | `saeb_matematica_ensino_medio` | complementar |
| 13 | 5.d | `saeb_portugues_ensino_medio` | complementar |
| 14 | 6.a | `basico_integral` | essencial |
| 15 | 6.a | `escolas_integral` | complementar |
| 16 | 8.b | `salas_climatizadas` | complementar |
| 17 | 8.c | `educacao_ambiental` | complementar |
| 18 | 11.a | `alfabetizacao_pop_15_mais` | complementar |
| 19 | 11.b | `fundamental_concluido_15_29` | complementar |
| 20 | 11.b | `fundamental_concluido_18_mais` | complementar |
| 21 | 11.c | `medio_concluido_18_29` | essencial |
| 22 | 11.c | `medio_concluido_18_mais` | complementar |
| 23 | 12.a | `medio_tecnico_articulado_percentual` | complementar |
| 24 | 12.a | `medio_tecnico_participacao_publica` | complementar |
| 25 | 12.b | `subsequente_expansao` | complementar |
| 26 | 12.c | `eja_integrada_educacao_profissional_percentual` | complementar |
| 27 | 17.a | `adequacao_ai` | complementar |
| 28 | 17.a | `adequacao_af` | essencial |
| 29 | 17.a | `adequacao_em` | complementar |
| 30 | 17.b | `rendimento_magisterio` | complementar |
| 31 | 17.d | `temporarios` | complementar |
| 32 | 17.f | `pos_graduacao` | complementar |
| 33 | 18.b | `conselho_escolar` | complementar |
| 34 | 19.c | `salas_acessiveis` | essencial |

## 4. Nove essenciais

A ordem editorial fixa é: `creche`, `pre_escola`, `basico_6_17`, `basico_integral`, `idade_regular_nono`, `saeb_matematica_anos_finais`, `medio_concluido_18_29`, `adequacao_af` e `salas_acessiveis`.

`priorityOrder` é contínuo de 1 a 9. A lista permanece igual em todos os municípios; um essencial sem valor continua identificado na metadata, mas não gera resultado numérico e não é substituído.

## 5. Vinte e cinco complementares

Os complementares são todos os demais pares da tabela. Eles não recebem `priorityOrder` e nunca são promovidos por ausência, filtro ou bloqueio de um essencial. A separação em tier não altera a ordem normativa global nem autoriza duplicar o mesmo resultado em outra coleção.

## 6. Oito temas

| Ordem temática | ID estável | Rótulo público |
|---:|---|---|
| 1 | `atendimento_escolar_v2` | Atendimento escolar |
| 2 | `educacao_tempo_integral_v2` | Educação em tempo integral |
| 3 | `aprendizagem_trajetoria_escolar_v2` | Aprendizagem e trajetória escolar |
| 4 | `escolaridade_alfabetizacao_v2` | Escolaridade e alfabetização |
| 5 | `educacao_profissional_eja_v2` | Educação profissional e EJA |
| 6 | `profissionais_educacao_v2` | Profissionais da educação |
| 7 | `infraestrutura_escolar_v2` | Infraestrutura escolar |
| 8 | `gestao_escolar_educacao_ambiental_v2` | Gestão escolar e educação ambiental |

O agrupamento temático não reordena a cópia integral nem redefine a ordem legal.

## 7. Tipos de vínculo

- `direct`: o resultado acompanha diretamente o recorte definido para a meta.
- `partial_component`: mede uma dimensão da meta e não representa sozinho seu cumprimento integral.
- `contextual_proxy`: usa recorte ou base territorial diferente e não mede cumprimento.

Os dois proxies contextuais são informativos e nunca recebem `advance` ou `maintain`. Os seis SAEB podem receber a classificação do componente adequado ou superior, sempre com texto que impede a leitura como cumprimento integral da meta. `medio_tecnico_articulado_percentual` admite apenas `maintain`: alcançar 50% só com matrículas integradas é condição suficiente para o componente; ficar abaixo não prova avanço ou insuficiência da meta completa, pois a forma concomitante não está no numerador.

## 8. Resolução dos nove incompatíveis

| Resultado | Fórmula e universo homologados | Referência do indicador / prazo legal | Decisão |
|---|---|---|---|
| `basico_15_17` | `100 × matrículas da educação básica de estudantes de 15–17 localizadas no município ÷ população residente de 15–17` | 85% em 2036 / meta 4.a de 100% para 6–17 em 2029 | `contextual_proxy`, informativo, sem classificação; resultado herdado do PNE quando disponível. |
| `fundamental_concluido_18_mais` | `100 × população de 18+ com fundamental concluído ÷ população de 18+`, Censo 2022 | 85% em 2036 / meta 11.b para população de 15+ em 2036 | `contextual_proxy`, informativo, fonte IBGE homologada. |
| `medio_tecnico_articulado_percentual` | `100 × matrículas técnicas integradas ao ensino médio ÷ matrículas do ensino médio` | 50% em 2036 / meta 12.a integrada ou concomitante | `partial_component`; `maintain` permitido, `advance` não. Fonte Censo Escolar. |
| Seis resultados SAEB | soma das parcelas de estudantes no nível adequado ou superior; redes, dependências e localização totais do município, Saeb 2023 | marco adequado de 2031 e referência final de 2036 das metas 5.a, 5.b e 5.d | `partial_component`; classificação do componente; comparação estadual, posição, similares e trajetória desabilitados. |

No SAEB, os recortes são Língua Portuguesa e Matemática no 5º ano, 9º ano e ensino médio. Os níveis mínimos adequados são 4/5 no 5º ano, 4/5 no 9º ano e 4/6 no ensino médio, respectivamente para Língua Portuguesa/Matemática. As referências adequadas de 2031 são 70%, 60% e 50%; as finais de 2036 são 90%, 85% e 80%. A fonte é o [Saeb/INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/saeb).

## 9. Resolução de `subsequente_expansao`

A regra canônica é `100 × (matrículas atuais ÷ matrículas do ano-base positivo − 1)`. O cálculo PNE só produz resultado quando a base é positiva; portanto o domínio válido é de -100% sem limite superior.

Nos 497 municípios há 148 resultados PNE: 127 negativos, 14 entre 0% e 100% e sete acima de 100%. O v1 conservava apenas os 14 do intervalo 0–100 e marcava os outros 134 como fora do domínio. O v2 aplica a mesma regra do PNE, publica os 148 e preserva os sete valores acima de 100%. Não houve mudança nos JSONs PNE existentes.

Os quatro resultados de educação profissional permanecem separados: articulação técnica do ensino médio, participação pública na expansão, expansão dos cursos subsequentes e EJA articulada. `12.c` usa 25% em 2031 como referência ativa e 50% em 2036 como referência final.

## 10. Resolução de `rendimento_magisterio`

A DGP5-B1R definiu que esta integração não depende de uma nova certificação independente da tabela `rendimento_professores_razao_percentual`. O v2 herda exatamente as ocorrências de `rendimento_magisterio` já publicadas pelo fluxo municipal do PNE 2026–2036, incluindo valor, ano, unidade, estado público, fonte e período disponíveis.

Foram representadas 464 ocorrências; 33 municípios permanecem sem resultado porque o próprio PNE não possui valor. A razão preserva as 75 ocorrências acima de 100%, sem truncamento e sem recálculo.

Registro histórico: a investigação DGP5-B1.1 procurou esclarecer a linhagem bruta de população e rendimento, mas foi interrompida por decisão de produto. Seus achados não foram incorporados ao repositório, não alteraram valores nem fontes públicas e não constituem certificação independente. A regra técnica da integração é: “Resultado herdado do fluxo municipal vigente do PNE 2026–2036, sem reprocessamento no Diagnóstico.”

## 11. Política acima de 100%

Cada um dos 34 resultados aponta para uma política explícita:

- `bounded_percentage_0_100`: percentuais naturalmente limitados; valores fora do domínio não são publicados;
- `saeb_percentage_with_source_rounding`: preserva resíduos de até 0,05 p.p. acima de 100% causados pela soma de parcelas arredondadas na fonte;
- `mixed_territorial_basis_above_100`: quatro indicadores de atendimento com matrícula localizada e população residente, sem teto artificial;
- `accumulated_growth_from_minus_100`: expansão acumulada, de -100% sem limite superior;
- `enrolment_ratio_above_100`: razão de matrículas, sem presumir pessoas únicas;
- `comparative_ratio_above_100`: razão de rendimentos, sem teto artificial.

Na grade PNE existem 494 ocorrências acima de 100%: 411 nas quatro bases territoriais mistas, 75 em rendimento, sete em expansão subsequente e uma de 100,01% no SAEB por arredondamento da fonte. O v2 representa as 494 por paridade, sem truncamento. Também preserva os 127 valores negativos de `subsequente_expansao`.

## 12. Fontes

O catálogo preserva o registro de fontes estruturadas já homologado:

- [Censo Escolar/INEP](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar), 2014–2025;
- [Saeb/INEP](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/saeb), 2019–2023;
- [Censos Demográficos/IBGE](https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html), 2010 e 2022;
- [Lei nº 15.388/2026](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15388.htm), como fonte legal separada.

Para cada ocorrência, o builder copia os `sourceIds`, rótulos, periodicidade e último ano que já constam no resultado municipal vigente. Isso inclui os identificadores já usados pelo PNE para população municipal por idade e rendimento; nenhum identificador novo foi criado. A DGP5 não substitui nem melhora essas fontes e não certifica independentemente seus arquivos brutos.

## 13. Builder v2

`data_pipeline/src/pne2026_public_diagnostic_v2.py` produz em memória:

- versão interna `pne2026-public-diagnostic-v2`;
- `schemaVersion: municipal-diagnostic-v2`;
- escopo derivado dos 34 pares do catálogo;
- metadata completa dos nove essenciais em todos os municípios;
- metas em ordem numérica e resultados na ordem canônica;
- somente observações PNE disponíveis e finitas, com ano válido, sem transformar ausência em zero;
- valor bruto, valor exibido, ano, unidade, direção, referência, prazo, distância, status e leitura copiados da saída PNE ou de sua metadata municipal já materializada;
- classificações traduzidas do estado público `atingida`, limitadas pelas decisões `advance_and_maintain`, `maintain_only` e `informative_only` do catálogo, sem recomputar distância;
- comparações, posições, similares e trajetórias sanitizadas apenas quando materializados e permitidos;
- fontes e períodos já relacionados ao resultado PNE.

O builder não lê mapa manual do React, não altera o v1, não converte ausência em zero, não promove essenciais, não duplica resultados e não possui operação de escrita em `public/data/`.

## 14. Auditoria em memória

| Medida | Resultado |
|---|---:|
| Municípios | 497 |
| Pares / indicadores / metas | 34 / 34 / 24 |
| Essenciais / complementares | 9 / 25 |
| Ocorrências PNE | 15.896 |
| Ocorrências v2 representadas | 15.896 |
| Ausências reais no PNE | 1.002 |
| Mínimo / máximo por município | 26 / 34 |
| Média / mediana por município | 31,98 / 32 |
| Distribuição | 26: 1; 27: 3; 28: 6; 29: 15; 30: 34; 31: 134; 32: 150; 33: 24; 34: 130 |
| `advance` / `maintain` / sem classificação | 11.972 / 2.447 / 1.477 |
| `at_least` / `at_most` | 15.399 / 497 |
| `direct` / `partial_component` / `contextual_proxy` | 6.789 / 8.113 / 994 |
| Comparações estaduais / posições estaduais | 8.473 / 8.420 |
| Comparações com similares | 7.616 |
| Trajetórias / anos estimados | 12.042 / 1.731 |
| Valores v2 acima de 100% / negativos | 494 / 127 |

A distribuição conta somente resultados numéricos existentes no PNE e representados no v2. A auditoria é reproduzível pelo script `data_pipeline/scripts/audit_pne2026_public_diagnostic_v2.py`, que escreve apenas JSON no stdout.

## 15. Divergências restantes

Não há resultado inesperado, duplicação nem divergência de valor, ano, unidade, classificação ou fonte entre as 15.896 ocorrências PNE e v2. As 1.002 ausências são ausências reais no próprio PNE e continuam omitidas.

Os cinco indicadores anteriormente bloqueados acrescentam 2.452 ocorrências por herança direta: 497 de `creche`, 497 de `pre_escola`, 497 de `basico_6_17`, 497 de `basico_15_17` e 464 de `rendimento_magisterio`. Não houve recálculo, busca externa ou preenchimento dos 33 municípios sem rendimento.

## 16. Arquivos alterados

Criados:

- `data_pipeline/src/data/pne2026_diagnostic_presentation_v2.json`;
- `data_pipeline/src/pne2026_public_diagnostic_v2.py`;
- `data_pipeline/scripts/audit_pne2026_public_diagnostic_v2.py`;
- `data_pipeline/tests/test_pne2026_public_diagnostic_v2.py`;
- `docs/DIAGNOSTICO_MUNICIPAL_HOMOLOGACAO_DGP5B1.md`.

Alterado:

- `data_pipeline/src/views/pne_2026_2036.py`, somente para anexar metadata canônica ao catálogo real antes da exportação.

Nenhum arquivo foi removido.

## 17. Testes

Os testes dirigidos cobrem: 34 pares únicos, 24 metas, tiers 9/25, oito temas, `priorityOrder`, três vínculos, `12.c`, referências, fontes herdadas, valores negativos e acima de 100%, ausência de truncamento, ausência de recálculo numérico no builder ou React, essencial ausente sem zero/promoção, ausência de duplicação, v1 preservado, builder sem escrita pública e auditoria real dos 497 municípios.

Foram executados 77 testes Python direcionados do catálogo/builder, do contrato PNE, atendimento, educação profissional e tendência; todos passaram. A auditoria em memória confirmou 15.896 ocorrências em ambos os fluxos e zero divergência. Não há TypeScript alterado. O repositório não possui lint Python configurado, e o lint JavaScript não se aplica aos arquivos alterados. `git diff --check` retornou sem erros; avisos de conversão LF/CRLF do ambiente não representam erro de whitespace.

## 18. Caminhos protegidos

Não foram alterados por esta etapa: `public/data/municipios/**`, aliases IBGE, contratos materializados, JSONs financeiros, Panorama financeiro, React/CSS do Diagnóstico, baselines, rotas, shell e documentação DGP2–DGP4. Alterações paralelas já existentes no worktree foram preservadas.

## 19. Decisão sobre materialização e interface

A integração por paridade foi confirmada para os 497 municípios: 34 pares autorizados, 24 metas, 15.896 ocorrências em ambos os fluxos e zero diferença de valor, ano, unidade, classificação ou fonte. A investigação independente de arquivos brutos deixou de ser condição de aceite desta integração.

Decisão: DGP5-B1 realinhada e aprovada para materialização. A próxima etapa pode materializar o contrato v2 e adaptar a interface, preservando o contrato v1 e os caminhos protegidos até autorização específica para essa execução.
