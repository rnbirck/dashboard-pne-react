# DF1 — Camada canônica pública de programas relacionados ao Diagnóstico municipal

**Versão:** 1.0  
**Data:** 20 de julho de 2026  
**Catálogo:** `diagnostic-public-financing-v1`

## 1. Objetivo da camada

A DF1 materializa a fonte canônica que uma etapa posterior poderá usar para apresentar programas relacionados aos resultados selecionados no Diagnóstico municipal. A camada contém somente os dez programas e as 26 relações aprovadas na DF0.1.

Cada relação significa exclusivamente que um programa **pode apoiar uma ação concreta relacionada ao resultado educacional**. A camada não calcula diagnóstico, prioridade, acesso a recurso, situação municipal ou efeito financeiro.

## 2. Arquivos materializados

### Criados

- `src/data/diagnostic/publicFinancingCatalog.json` — catálogo único de programas, relações e fontes públicas.
- `src/features/diagnostic/diagnosticFinancingPresentation.ts` — tipos e funções puras de seleção, consolidação e fontes.
- `scripts/checks/diagnostic-financing-presentation.test.mjs` — testes unitários da camada.
- `docs/DIAGNOSTICO_FINANCIAMENTO_CAMADA_PUBLICA_V1.md` — documentação desta etapa.

### Alterado

- `tsconfig.json` — habilitado `resolveJsonModule` para tipar a importação do catálogo JSON pelo módulo TypeScript.

Nenhum componente, contrato municipal, catálogo amplo, pipeline ou arquivo gerado foi alterado.

## 3. Modelo de dados final

### 3.1 Programa público

| Campo | Uso |
|---|---|
| `id` | identificador canônico do programa |
| `publicName` | nome curto apresentado ao usuário |
| `shortDescription` | descrição simples do objeto apoiado |
| `displayOrder` | ordem estável do programa |
| `sourceIds` | fontes oficiais que descrevem o programa |

### 3.2 Relação pública

| Campo | Uso |
|---|---|
| `id` | composição única `indicatorId__programId` |
| `indicatorId` | indicador real do catálogo educacional |
| `programId` | programa do catálogo público |
| `relationType` | constante interna `supported_action` |
| `actionText` | frase pública concreta iniciada por “Pode apoiar” |
| `scopeText` | recorte essencial de rede, público, território ou beneficiário; omitido quando desnecessário |
| `sourceIds` | fontes oficiais da ação e do recorte |
| `displayOrder` | ordem estável da relação |

### 3.3 Fonte pública

| Campo | Uso |
|---|---|
| `id` | identificador estável |
| `organization` | órgão oficial responsável |
| `publicTitle` | título simples da fonte |
| `yearLabel` | exercício, ano ou vigência pertinente |
| `url` | endereço oficial |

### 3.4 Saída consolidada

`buildPublicFinancingItems(diagnostic)` retorna, por programa:

- `programId`, `publicName` e `shortDescription`;
- `relatedIndicators`, sem repetição;
- `actions`, cada ação com os indicadores aos quais se aplica;
- `scopes`, cada recorte com os indicadores aos quais se aplica;
- `sourceIds`, deduplicados e em ordem estável.

`collectPublicFinancingSources(items)` retorna somente os objetos de fonte usados pelos itens recebidos.

Não existem campos de valor financeiro, saldo, situação municipal, disponibilidade ou acesso ao recurso.

## 4. Dez programas específicos

| Ordem | programId | Nome público |
|---:|---|---|
| 1 | `par_novo_par` | PAR/Novo PAR |
| 2 | `novo_pac_educacao` | Novo PAC Educação |
| 3 | `pnate` | PNATE |
| 4 | `caminho_escola` | Caminho da Escola |
| 5 | `peate_rs` | PEATE/RS |
| 6 | `escola_tempo_integral` | Programa Escola em Tempo Integral |
| 7 | `pnae` | PNAE |
| 8 | `parfor` | PARFOR |
| 9 | `proeb_capes` | ProEB/CAPES |
| 10 | `pdde` | PDDE |

## 5. Vinte e seis relações autorizadas

1. `creche__par_novo_par`
2. `creche__novo_pac_educacao`
3. `creche__pnate`
4. `creche__caminho_escola`
5. `pre_escola__par_novo_par`
6. `pre_escola__novo_pac_educacao`
7. `pre_escola__pnate`
8. `pre_escola__caminho_escola`
9. `basico_6_17__par_novo_par`
10. `basico_6_17__pnate`
11. `basico_6_17__caminho_escola`
12. `basico_6_17__peate_rs`
13. `basico_integral__par_novo_par`
14. `basico_integral__novo_pac_educacao`
15. `basico_integral__escola_tempo_integral`
16. `basico_integral__pnae`
17. `escolas_integral__par_novo_par`
18. `escolas_integral__novo_pac_educacao`
19. `escolas_integral__escola_tempo_integral`
20. `escolas_integral__pnae`
21. `adequacao_ai__parfor`
22. `adequacao_af__parfor`
23. `pos_graduacao__proeb_capes`
24. `salas_climatizadas__par_novo_par`
25. `salas_climatizadas__pdde`
26. `salas_acessiveis__pdde`

Indicadores únicos: `creche`, `pre_escola`, `basico_6_17`, `basico_integral`, `escolas_integral`, `adequacao_ai`, `adequacao_af`, `pos_graduacao`, `salas_climatizadas` e `salas_acessiveis`.

## 6. Textos públicos finais

| Relação | actionText | scopeText, quando necessário |
|---|---|---|
| `creche × par_novo_par` | Pode apoiar obras e equipamentos para ampliar a oferta pública de creche. | — |
| `creche × novo_pac_educacao` | Pode apoiar a construção de unidades de educação infantil para ampliar a oferta de creche. | — |
| `creche × pnate` | Pode apoiar o transporte de estudantes da rede pública que vivem na área rural. | Para estudantes da rede pública que vivem na área rural. |
| `creche × caminho_escola` | Pode apoiar a aquisição de veículos para o transporte escolar, principalmente em áreas rurais. | Prioriza o transporte de estudantes de áreas rurais ou ribeirinhas. |
| `pre_escola × par_novo_par` | Pode apoiar obras e equipamentos para ampliar a oferta pública de pré-escola. | — |
| `pre_escola × novo_pac_educacao` | Pode apoiar a construção de unidades de educação infantil para ampliar a oferta de pré-escola. | — |
| `pre_escola × pnate` | Pode apoiar o transporte de estudantes da rede pública que vivem na área rural. | Para estudantes da rede pública que vivem na área rural. |
| `pre_escola × caminho_escola` | Pode apoiar a aquisição de veículos para o transporte escolar, principalmente em áreas rurais. | Prioriza o transporte de estudantes de áreas rurais ou ribeirinhas. |
| `basico_6_17 × par_novo_par` | Pode apoiar obras e equipamentos para ampliar o acesso à educação básica pública. | — |
| `basico_6_17 × pnate` | Pode apoiar o transporte de estudantes da rede pública que vivem na área rural. | Para estudantes da rede pública que vivem na área rural. |
| `basico_6_17 × caminho_escola` | Pode apoiar a aquisição de veículos para o transporte escolar, principalmente em áreas rurais. | Prioriza o transporte de estudantes de áreas rurais ou ribeirinhas. |
| `basico_6_17 × peate_rs` | Pode apoiar o transporte de estudantes da rede estadual que vivem na área rural. | Para estudantes da rede estadual que vivem na área rural. |
| `basico_integral × par_novo_par` | Pode apoiar obras e melhorias em escolas com vagas de tempo integral. | — |
| `basico_integral × novo_pac_educacao` | Pode apoiar a construção de escolas destinadas ao atendimento em tempo integral. | — |
| `basico_integral × escola_tempo_integral` | Pode apoiar a criação e a manutenção de matrículas em jornada integral. | — |
| `basico_integral × pnae` | Pode apoiar a alimentação dos estudantes que permanecem na escola em jornada integral. | — |
| `escolas_integral × par_novo_par` | Pode apoiar obras e melhorias em escolas com vagas de tempo integral. | — |
| `escolas_integral × novo_pac_educacao` | Pode apoiar a construção de escolas destinadas ao atendimento em tempo integral. | — |
| `escolas_integral × escola_tempo_integral` | Pode apoiar a criação e a manutenção de matrículas em jornada integral. | — |
| `escolas_integral × pnae` | Pode apoiar a alimentação dos estudantes que permanecem na escola em jornada integral. | — |
| `adequacao_ai × parfor` | Pode apoiar a formação do professor na área em que atua. | A participação ocorre por meio das ofertas destinadas aos professores da rede pública. |
| `adequacao_af × parfor` | Pode apoiar a formação do professor na área em que atua. | A participação ocorre por meio das ofertas destinadas aos professores da rede pública. |
| `pos_graduacao × proeb_capes` | Pode apoiar cursos de pós-graduação para professores da rede pública. | O apoio é destinado ao professor participante do curso. |
| `salas_climatizadas × par_novo_par` | Pode apoiar a aquisição de equipamentos para climatizar salas de aula. | — |
| `salas_climatizadas × pdde` | Pode apoiar equipamentos e pequenas instalações para climatizar salas de aula. | O recurso é utilizado pela escola ou por sua entidade executora. |
| `salas_acessiveis × pdde` | Pode apoiar adaptações e equipamentos para tornar os espaços escolares mais acessíveis. | O recurso é utilizado pela escola ou por sua entidade executora. |

## 7. Fontes oficiais usadas

O registro contém 18 fontes. Fontes usadas somente por relações excluídas não foram copiadas.

| sourceId | Órgão | Título e período | URL |
|---|---|---|---|
| `fnde_par` | FNDE | Plano de Ações Articuladas; página vigente em 2026 | [Fonte](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/par) |
| `govbr_par_infraestrutura` | FNDE | Solicitar ações de infraestrutura educacional; 2026 | [Fonte](https://www.gov.br/pt-br/servicos/solicitar-acoes-de-infraestrutura-educacional-obras-mobiliario-e-equipamentos) |
| `fnde_proinfancia` | FNDE | Proinfância; página vigente em 2026 | [Fonte](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/proinfancia/proinfancia-home/) |
| `casa_civil_novo_pac_educacao_2025` | Casa Civil | Manual Educação Novo PAC Seleções; 2025 | [Fonte](https://www.gov.br/casacivil/pt-br/novopac/selecoes2025/eixos/educacao-ciencia-e-tecnologia/arquivos/novopacmanualeducaoselecoes2025-27-02-25-trava.pdf) |
| `casa_civil_novo_pac_tempo_integral` | Casa Civil | Escolas em Tempo Integral no Novo PAC; 2023–2025 | [Fonte](https://www.gov.br/casacivil/pt-br/novopac/selecoes/eixos/educacao-ciencia-e-tecnologia/escolas-em-tempo-integral/) |
| `fnde_pnate` | FNDE | Programa Nacional de Apoio ao Transporte do Escolar; 2026 | [Fonte](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnate) |
| `fnde_caminho_escola` | FNDE | Programa Caminho da Escola; 2026 | [Fonte](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/caminho-da-escola) |
| `seduc_rs_peate` | Seduc/RS | Programa Estadual de Apoio ao Transporte Escolar; 2026 | [Fonte](https://www.educacao.rs.gov.br/programa-estadual-de-apoio-ao-transporte-escolar-peate) |
| `fnde_par_portfolio_tempo_integral_2023` | FNDE | Resolução CD/FNDE nº 25 — PAR-Portfólio; 2023 | [Fonte](https://www.gov.br/fnde/pt-br/acesso-a-informacao/legislacao/resolucoes/2023/resolucao-no-25-de-24-de-novembro-de-2023-resolucao-no-25-de-24-de-novembro-de-2023-dou-imprensa-nacional.pdf) |
| `planalto_lei_14640_2023` | Presidência da República | Lei nº 14.640; 2023 | [Fonte](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14640.htm) |
| `fnde_escola_tempo_integral` | FNDE | Programa Escola em Tempo Integral; página atualizada em 2026 | [Fonte](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/programas_suplementares/educacao-basica/educacao-basica) |
| `fnde_pnae` | FNDE | Programa Nacional de Alimentação Escolar; 2026 | [Fonte](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae) |
| `fnde_pnae_resolucao_4_2026` | FNDE | Resolução CD/FNDE nº 4; 2026 | [Fonte](https://www.gov.br/fnde/pt-br/acesso-a-informacao/legislacao/resolucoes/2026/resolucao-cd_fnde-no-4-de-26-de-fevereiro-de-2026.pdf/%40%40download/file) |
| `capes_parfor` | CAPES | Plano Nacional de Formação de Professores da Educação Básica; 2026 | [Fonte](https://www.gov.br/capes/pt-br/acesso-a-informacao/acoes-e-programas/educacao-basica/parfor/parfor) |
| `capes_proeb` | CAPES | ProEB; página atualizada em 2026 | [Fonte](https://www.gov.br/capes/pt-br/acesso-a-informacao/acoes-e-programas/articulacao-e-inovacao-em-educacao-aberta/programa-de-pos-graduacao-stricto-sensu-para-qualificacao-de-professores-da-rede-publica-de-educacao-basica-proeb) |
| `fnde_pdde_recursos` | FNDE | Uso dos recursos do PDDE; regras consultadas em 2026 | [Fonte](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pdde/sobre-recursos) |
| `fnde_pdde` | FNDE | Programa Dinheiro Direto na Escola; 2026 | [Fonte](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pdde) |
| `fnde_escola_acessivel` | FNDE | Programa Escola Acessível; 2026 | [Fonte](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pdde/conta-pdde-estrutura-1/programa-escola-acessivel) |

## 8. Regra de seleção municipal

O seletor recebe o contrato `municipal-diagnostic-v2` ou a parte que contém `decisionSummary` e lê somente:

- `decisionSummary.municipalActionItems`;
- `decisionSummary.coordinationItems`.

Os `indicatorId` dessas duas coleções são cruzados com as 26 relações do catálogo público. A função não lê indicadores brutos, distâncias, metas, trajetória, evidência, governabilidade, contratos financeiros ou `educationLinks`.

Itens presentes apenas em `investigationItems`, `monitoringItems` ou `preservationItems` são ignorados. Um ID selecionado que não tenha relação na allowlist também não produz conteúdo.

## 9. Regra de consolidação

1. Programas seguem `displayOrder` e aparecem uma única vez.
2. Indicadores relacionados seguem a ordem das relações e não se repetem.
3. Frases `actionText` idênticas são consolidadas, preservando todos os `indicatorIds` ligados a elas.
4. Ações diferentes do mesmo programa permanecem separadas.
5. `scopeText` idênticos são consolidados, preservando os indicadores correspondentes.
6. Fontes do programa e das relações aplicáveis são unidas, deduplicadas e retornadas na ordem do registro oficial.

## 10. Regra de omissão

- Sem indicador autorizado em ação municipal ou articulação, `buildPublicFinancingItems` retorna `[]`.
- Sem item apresentado, `collectPublicFinancingSources` retorna `[]`.
- Relações fora da allowlist não produzem programa, texto, fonte ou mensagem de ausência.
- Recursos gerais — Fundeb/VAAF, VAAT, VAAR e Salário-Educação — não existem neste catálogo específico.

## 11. Auditoria dos 497 municípios

### 11.1 Método

- Índice: `public/data/municipios_index.json`, gerado em `2026-07-19T23:50:16-03:00`.
- Universo: 497 slugs canônicos do índice.
- Contrato lido: `public/data/municipios/<slug>/diagnostico.json`.
- Os 497 aliases numéricos físicos foram deliberadamente excluídos para não contar cada município duas vezes.
- A execução foi somente leitura.

### 11.2 Resultado

| Medida | Resultado |
|---|---:|
| Contratos canônicos lidos | 497 |
| Municípios com ao menos um programa | 486 |
| Municípios com lista vazia | 11 |
| Associações únicas município–indicador que sobreviveram | 1.254 |
| Itens município–programa após consolidação | 2.845 |
| Instâncias município–relação antes da consolidação | 4.451 |
| IDs de indicador desconhecidos nas cinco coleções | 0 |

“Associação município–indicador” conta uma vez cada indicador autorizado presente em ação municipal ou articulação. “Item município–programa” conta a saída agrupada do seletor. A diferença para as 4.451 instâncias demonstra a consolidação de relações repetidas por programa.

### 11.3 Frequência dos programas

| Programa | Municípios |
|---|---:|
| `par_novo_par` | 463 |
| `caminho_escola` | 428 |
| `pnate` | 428 |
| `novo_pac_educacao` | 408 |
| `peate_rs` | 346 |
| `escola_tempo_integral` | 291 |
| `pnae` | 291 |
| `proeb_capes` | 147 |
| `parfor` | 29 |
| `pdde` | 14 |

Os totais foram calculados pelo módulo TypeScript e recomputados de modo independente por uma leitura Python do catálogo e dos mesmos 497 contratos; os resultados coincidiram integralmente.

## 12. Testes e verificações executados

| Verificação | Comando/forma | Resultado |
|---|---|---|
| Testes unitários da camada | `node --test scripts/checks/diagnostic-financing-presentation.test.mjs` | 9 testes aprovados; 0 falhas |
| Lint direcionado | `npx eslint src/features/diagnostic/diagnosticFinancingPresentation.ts scripts/checks/diagnostic-financing-presentation.test.mjs` | aprovado |
| Typecheck direcionado | `npx tsc --noEmit --strict --skipLibCheck --module ESNext --moduleResolution bundler --resolveJsonModule --lib ES2020,DOM,DOM.Iterable src/features/diagnostic/diagnosticFinancingPresentation.ts` | aprovado |
| Auditoria canônica | script efêmero Node sobre os 497 slugs | concluída; nenhum ID desconhecido |
| Reconciliação independente | script efêmero Python sobre os 497 slugs | mesmas contagens do seletor |

Os testes cobrem as 22 condições solicitadas: cardinalidades, integridade referencial, ausência de duplicatas, exclusões, coleções aceitas/ignoradas, consolidação, preservação de ações diferentes, listas vazias, fontes usadas, linguagem pública e ausência de campos financeiros ou de situação municipal.

O build não foi executado porque a DF1 não conecta o módulo a nenhum componente ou entrada do aplicativo. E2E e regressão visual também não se aplicam a esta etapa sem interface.

## 13. Itens explicitamente fora do escopo

- alterações nos 49 indicadores, cálculos, metas, séries ou comparações;
- alterações em `decisionSummary`, governabilidade, exposição ou evidência;
- alterações em `indicatorCatalog.json`, `indicatorFinancingMatrix.json` e `financingPrograms.json`;
- alterações em pipeline, schemas ou contratos municipais;
- alterações em `DiagnosticPanel.jsx`, CSS, rotas ou Panorama financeiro;
- criação de situação municipal, valor, estimativa, ganho ou perda para os dez programas;
- regeneração dos 497 municípios, downloads, publicação, commit ou push.

## 14. Orientação para a futura DF2

A DF2 deve integrar `buildPublicFinancingItems` ao fluxo de apresentação do Diagnóstico e substituir, nesse ponto de consumo público, a leitura de `financingPrograms.json` e `indicatorFinancingMatrix.json`. A interface deve:

1. usar os nomes, ações, recortes e fontes retornados pela camada canônica;
2. resolver os nomes dos `relatedIndicators` pelo catálogo educacional já carregado;
3. preservar o agrupamento por programa e os vínculos de cada ação;
4. omitir integralmente a seção quando a lista estiver vazia;
5. coletar fontes com `collectPublicFinancingSources` somente depois de definir os itens exibidos;
6. manter Fundeb/VAAF, VAAT, VAAR e Salário-Educação exclusivamente no fluxo financeiro geral.

Essa integração não foi realizada na DF1.
