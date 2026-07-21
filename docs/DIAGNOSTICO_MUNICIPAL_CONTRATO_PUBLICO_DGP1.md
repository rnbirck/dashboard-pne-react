# DGP1 — Contrato público do Diagnóstico municipal

## Objetivo e resultado

A DGP1 adiciona ao contrato técnico `municipal-diagnostic-v2` uma camada derivada,
fechada e pronta para apresentação do Diagnóstico municipal do PNE 2026–2036. A
propriedade final é `pne2026PublicDiagnostic`, na versão
`pne2026-public-diagnostic-v1`.

A camada seleciona somente os vínculos homologados na DGP0/DGP0-V, aplica os
gates públicos no pipeline e entrega classificação, distâncias, leituras,
comparações e fontes sem depender de regras no React.

## Arquivos

Criados:

- `data_pipeline/src/data/pne2026_public_diagnostic_v1.json`;
- `data_pipeline/tests/test_pne_2026_public_diagnostic.py`;
- `docs/DIAGNOSTICO_MUNICIPAL_CONTRATO_PUBLICO_DGP1.md`.

Alterados:

- `data_pipeline/src/municipal_diagnostic.py`;
- `src/features/diagnostic/diagnosticTypes.ts`.

Não foram alterados pela DGP1 componentes, páginas, CSS, rotas, loaders,
contratos financeiros, fórmulas educacionais, benchmarks técnicos, trajetórias
técnicas ou JSONs em `public/data`.

## Compatibilidade

`schemaVersion` permanece `municipal-diagnostic-v2` e `methodologyVersion`
permanece `municipal-diagnostic-p3c-v1`. A inclusão é aditiva: todos os campos
técnicos anteriores, inclusive os 49 indicadores, `decisionSummary`, evidência,
governabilidade, exposição, benchmarks e trajetória, continuam intactos.

O pipeline atualizado sempre preenche `pne2026PublicDiagnostic`. Como os 497
JSONs públicos não foram regenerados nesta etapa, a propriedade é temporariamente
opcional em `MunicipalDiagnosticContractV2`. Isso mantém a leitura dos contratos
anteriores e permite que a DGP2 migre a interface sem exigir regeneração prévia.

## Configuração fechada

A única configuração de produção é
`data_pipeline/src/data/pne2026_public_diagnostic_v1.json`. Ela contém a versão,
o ciclo, as 24 metas em ordem, seus 20 vínculos e o registro de fontes. A
allowlist não é derivada dos 49 indicadores.

Ordem homologada das metas:

`1.a`, `1.c`, `4.a`, `6.a`, `12.a`, `12.b`, `3.a`, `5.a`, `5.b`, `5.d`,
`4.b`, `4.c`, `4.d`, `17.a`, `17.f`, `17.b`, `17.d`, `8.c`, `18.b`, `8.b`,
`19.c`, `11.a`, `11.b`, `11.c`.

O teste de deriva reconstrói a primeira ocorrência pública de cada meta a partir
da ordem de `public/data/indicadores.json` e do mapa
`pne2026IndicatorGoalRefs.js`. Qualquer alteração futura nessa origem falha o
teste; ela não amplia silenciosamente o Diagnóstico.

## Vínculos autorizados

### Diretos — 11

- `4.b × idade_regular_quinto`;
- `4.c × idade_regular_nono`;
- `4.d × idade_regular_medio`;
- `17.f × pos_graduacao`;
- `17.d × temporarios`;
- `8.c × educacao_ambiental`;
- `18.b × conselho_escolar`;
- `11.a × alfabetizacao_pop_15_mais`;
- `11.b × fundamental_concluido_15_29`;
- `11.c × medio_concluido_18_mais`;
- `11.c × medio_concluido_18_29`.

### Componentes parciais — 9

- `6.a × basico_integral`;
- `6.a × escolas_integral`;
- `12.a × medio_tecnico_participacao_publica`;
- `12.b × subsequente_expansao`;
- `17.a × adequacao_ai`;
- `17.a × adequacao_af`;
- `17.a × adequacao_em`;
- `8.b × salas_climatizadas`;
- `19.c × salas_acessiveis`.

`partial_component` classifica somente o resultado ligado à meta. O objeto de
meta não recebe classificação, status agregado, média, soma, score nem declaração
de alcance integral.

## Indicadores excluídos

Os 14 vínculos incompatíveis ou bloqueados continuam somente na camada técnica:

`creche`, `pre_escola`, `basico_6_17`, `basico_15_17`,
`medio_tecnico_articulado_percentual`, `alfabetizacao`,
`saeb_matematica_anos_iniciais`, `saeb_portugues_anos_iniciais`,
`saeb_matematica_anos_finais`, `saeb_portugues_anos_finais`,
`saeb_matematica_ensino_medio`, `saeb_portugues_ensino_medio`,
`rendimento_magisterio`, `fundamental_concluido_18_mais`.

Os 15 indicadores sem relação com a allowlist também continuam somente na
camada técnica:

`aee`, `eja_integrada_educacao_profissional_percentual`, `internet`,
`internet_alunos`, `internet_aprendizagem`, `internet_comunidade`,
`acesso_internet_computador`, `acesso_internet_disp_pessoais`, `rede_local`,
`rede_wireless`, `banda_larga`, `proposta_pedagogica`, `desktop_aluno`,
`comp_portatil_aluno`, `tablet_aluno`.

Os 29 permanecem disponíveis para outros consumidores. A DGP1 não decide nem
altera seu destino na página geral de indicadores e não publica motivo de
exclusão na nova camada.

## Modelo final

```text
pne2026PublicDiagnostic
  version
  cycleId
  scope
    allowedGoalIds[]
    allowedIndicatorIds[]
  summary
    displayedResultsCount
    reachedResultsCount
    advanceResultsCount
    stateAboveOrNearCount
    stateBelowCount
  themes[]
  goals[]
    goalId, order, publicTitle, publicDescription, targetYear
    results[]
      indicatorId, relationship, theme, publicName
      current { value, displayValue, year, unit }
      target { value, displayValue, year, direction }
      classification, targetReading
      remainingGap, favorableDifference
      stateComparison? { municipalityValue, stateValue, year,
                         favorableDifference, state, reading }
      statewidePosition? { band, reading }
      similarMunicipalities? { title, median, favorableDifference,
                               state, reading }
      trajectory? { historicalState, historicalReading,
                    estimatedAchievementYear?, achievementReading? }
      publicReading
      sourceIds[]
  sources[]
```

`themes` contém apenas temas exibidos e suas contagens de resultados. `goals`
contém apenas metas com ao menos um resultado publicável. Resultados permanecem
na ordem canônica da configuração e não são duplicados.

## Gates públicos

Um resultado entra somente se tiver vínculo autorizado, valor finito, ano,
unidade pública, fonte presente no registro oficial com URL, comparação
`eligible`, alvo e prazo válidos, direção conhecida e distâncias canônicas
válidas. Falhas são omitidas sem placeholder, zero, razão ou meta vazia.

Antes de publicar, a função confere `direction`, `goalAttained`,
`favorableDistance` e `remainingGap` contra a regra direcional. Divergência
lança erro; campos ausentes apenas bloqueiam o resultado.

## Classificação e distância

`maintain` corresponde a `goalAttained = true`; `advance`, a
`goalAttained = false`. Para `at_least`, a distância favorável é atual menos
alvo. Para `at_most`, é alvo menos atual. `remainingGap` permanece
`max(0, -favorableDistance)`.

Os textos são produzidos pelo pipeline, usam “valor previsto para este
resultado” e adaptam a direção de `at_most`. Nenhuma regra pública usa
`decisionSummary`, score, evidência, governabilidade ou financiamento.

## Rio Grande do Sul e posição estadual

`stateComparison` só existe quando o benchmark técnico está `comparable`, ano
municipal e estadual coincidem, método e cobertura são válidos e a diferença
favorável é coerente com a direção. A tolerância técnica existente de 0,1 é
preservada. Os estados `above`, `near` e `below` representam favorabilidade;
em `at_most`, o texto esclarece corretamente quando um valor numérico menor é
mais favorável.

A leitura combinada Meta × RS é materializada sem modificar `classification`.
Sem RS válido, permanece apenas a leitura frente ao valor previsto.

`statewidePosition` consome somente percentil direcional finito entre 0 e 100 e
publica apenas `top_quarter`, `middle` ou `more_room_to_advance`, acompanhado do
texto simples. O percentil bruto não é copiado para a camada pública.

## Oferta semelhante

`similarMunicipalities` exige `status = available`, mesmo indicador, ano,
fórmula, unidade, base territorial e base de oferta, além de
`featuresUsed = ["offering_size"]`. O objeto público expõe somente título,
mediana, diferença favorável, estado qualitativo e texto. Coorte, membros,
distâncias, Q1/Q3, atributos internos e códigos de relaxamento ficam restritos
à camada técnica.

## Trajetória

A trajetória pública aceita somente `component_maintenance` disponível, com
qualidade avaliada, ritmo observado, histórico suficiente e valor projetado.
Ela publica leitura histórica simples e, quando válido, ano e frase de alcance
estimado. `required_trajectory` com `not_assessed`, modelo, qualidade,
incerteza e códigos não são publicados.

## Fontes oficiais

O registro canônico foi verificado em 2026-07-21 e contém apenas:

- INEP — Censo Escolar da Educação Básica, período 2025:
  <https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar>;
- IBGE — Censos Demográficos 2010 e 2022:
  <https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html>.

Cada resultado aponta para `sourceIds`; a lista raiz é deduplicada e contém
somente as fontes efetivamente usadas. Fonte ausente ou sem URL bloqueia o
resultado. Nenhum resultado foi bloqueado pela nova regra de URL na auditoria.

## Resumo municipal

As cinco contagens são derivadas exclusivamente dos resultados presentes em
`goals[].results`: exibidos, alcançados, a avançar, acima/próximos do RS e abaixo
do RS. Não há contador de metas alcançadas.

## Função pura e integração

`build_pne_2026_public_diagnostic(municipal_diagnostic_contract)` recebe o
contrato técnico concluído, lê a configuração versionada, aplica os gates,
ordena e retorna uma nova estrutura determinística. O contrato recebido não é
alterado. Um parâmetro nomeado de configuração existe apenas para injeção
controlada em testes.

`build_municipal_diagnostic_v2` constrói primeiro todos os campos técnicos e,
em seguida, adiciona o retorno da função a `pne2026PublicDiagnostic`. A função
não acessa internet, arquivos financeiros, interface ou `decisionSummary` e não
recalcula indicador, série, benchmark ou trajetória.

## Auditoria em memória dos 497 contratos

Os contratos atuais foram lidos por slug e transformados somente em memória.
Nada foi escrito em `public/data`.

| Invariante | Esperado | Obtido |
|---|---:|---:|
| contratos lógicos | 497 | 497 |
| indicadores técnicos | 24.353 | 24.353 |
| resultados classificáveis | 9.119 | 9.119 |
| mínimo por município | 15 | 15 |
| máximo por município | 20 | 20 |
| municípios sem resultado | 0 | 0 |
| comparações com RS | 6.148 | 6.148 |
| faixas estaduais | 5.964 | 5.964 |
| oferta semelhante | aproximadamente 6.086 | 6.086 |
| trajetórias públicas | 1.982 | 1.982 |
| trajetórias com ano estimado | 583 | 583 |
| municípios com trajetória | 497 | 497 |
| indicador fora da allowlist | 0 | 0 |
| meta externa | 0 | 0 |
| divergência direcional | 0 | 0 |
| resultado sem fonte oficial | 0 | 0 |

Não houve diferença em relação à DGP0-V nem perda causada pelo novo gate de URL.
O teste `PublicDiagnosticPayloadAuditTest` torna a auditoria reproduzível.

## Testes e validações executados

- novos testes unitários, de deriva, integração, tipos e auditoria: 16 testes,
  todos aprovados;
- testes direcionados existentes do pipeline e dos payloads: 36 testes, todos
  aprovados;
- sintaxe Python dos dois arquivos alterados/criados: aprovada com `py_compile`;
- configuração JSON: importada com sucesso;
- ESLint direcionado a `diagnosticTypes.ts`: aprovado;
- TypeScript direcionado a `diagnosticTypes.ts`: aprovado;
- serialização e reimportação da camada em arquivo temporário removido ao fechar:
  aprovada;
- `git diff --check`: aprovado.

Não foram executados build completo, E2E, regressão visual, regeneração de dados,
download, publicação, deploy, commit ou push.

## Fora do escopo e decisão para DGP2

Financiamento permanece temporariamente na interface até a DGP2. Nenhum dado
financeiro foi usado. O Panorama financeiro, DF1 e DF2 não foram alterados.
A página geral de indicadores também não foi alterada.

Os critérios técnicos da DGP1 foram atendidos: configuração fechada, função
pura integrada, tipos compatíveis, URLs oficiais, gates, textos, auditoria e
testes estão materializados. **DGP2 pode começar.**
