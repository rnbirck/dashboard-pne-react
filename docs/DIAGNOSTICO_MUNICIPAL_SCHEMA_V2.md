# Schema do diagnóstico municipal v2

**Schema:** `municipal-diagnostic-v2`  
**Metodologia:** `municipal-diagnostic-p3c-v1`, com extensão `municipal-inequality-p4b-v1`  
**Artefato municipal:** `municipios/<slug>/diagnostico.json`

## Finalidade

`diagnostico_v2` é o contrato canônico e serializável do diagnóstico municipal nas etapas P0, P1, P2, P3-A, P3-B, P3-C, P4-A, piloto P4-B e P5-A. Ele separa existência do dado, validade legal e metodológica, elegibilidade comparativa, trajetória, governabilidade, exposição municipal, pares, benchmark estadual e o recorte piloto. O pipeline constrói o contrato; o React apenas apresenta os campos recebidos e resolve catálogos financeiros globais versionados.

O contrato sempre contém os 49 indicadores do ciclo, inclusive quando o resultado municipal está ausente. Ausência nunca é serializada como zero.

## Envelope

| Campo | Conteúdo |
|---|---|
| `schemaVersion` | versão estrutural do contrato |
| `methodologyVersion` | versão das regras P0/P1 com extensões P3-A/P5-A |
| `generatedAt` | instante da exportação |
| `municipalityId` / `municipalityName` | identidade municipal; o ID oficial é aplicado no particionamento |
| `sourcePeriods` | períodos efetivamente observados por fonte |
| `summary` | totais gerais e por tema, já calculados |
| `stateBenchmarkSummary` | totais e listas de destaques estaduais, já calculados |
| `stateBenchmarkExpandedSummary` | leitura técnica de todos os resultados disponíveis, fora da síntese principal |
| `trajectoryScenarioInventory` | inventário dos sete cenários de atendimento e quatro de manutenção |
| `decisionSummary` | cinco destinos mutuamente exclusivos e suas contagens, reconciliados com os 49 indicadores |
| `inequalityPilot` | bloco P4-B separado para `basico_integral × urban_rural`; não participa da síntese |
| `indicators` | os 49 registros completos, na ordem estável do catálogo |
| `attentionItems` | lacunas elegíveis, na ordem provisória do pipeline |
| `preservedItems` | referências quantitativas comparáveis atingidas |
| `excludedItems` | indicadores fora da ordem e suas razões |
| `warnings` | avisos metodológicos municipais |
| `generationMetadata` | método de geração, catálogo, ordenação, compatibilidade e etapas adiadas |

## Registro de indicador

Cada item expõe valor bruto e valor de apresentação separadamente, além de:

- identidade, tema, título, ano, unidade e direção;
- `dataStatus`;
- `legalCorrespondence` e `legalTextValidated`;
- metadados independentes em `legalValidation`;
- `operationalizationStatus`;
- `valueDomainStatus` e `targetComparisonStatus`;
- todos os marcos legais conhecidos em `targetMilestones`;
- a referência hoje configurada em `configuredReference`;
- `goalAttained`, `favorableDistance` e `remainingGap` calculados somente quando elegíveis;
- motivos de exclusão, flags, fonte e versão metodológica;
- `methodology`, com fórmula, numerador, denominador, base territorial e políticas de domínio/exibição;
- `benchmarks.state`, com status, valor, ano, método, cobertura, quantidade de municípios, diferença favorável e posição;
- quando houver fallback para o último ano comum, `municipalityValue`,
  `municipalityYear`, `municipalityLatestYear` e `usesLatestCommonYear`, sem
  substituir `rawValue` ou `currentYear` do indicador principal;
- `benchmarks.municipalDistribution`, com status, ano, mediana, Q1, Q3, percentil direcional, cobertura e quantidade de municípios;
- `legacyRelativeGapScore` apenas para a ordem transitória;
- `priorityScore: null`, com razão explícita, durante P0/P1;
- `trajectory`, `governance`, `municipalExposure`, `similarMunicipalities` e `decisionReading`;
- código de apresentação que não transfere regra de negócio ao frontend.

## Adaptações do contrato inicial

As extensões abaixo foram necessárias para tornar os requisitos P0/P1 verificáveis:

- `municipalityName` complementa o ID e permite auditar o envelope agregado antes de o particionador aplicar o código oficial;
- `themeLabel` evita que o React tenha de manter uma segunda tabela semântica de temas;
- `legalValidation` guarda data, fonte, versão da lei e referências, separadamente da operacionalização;
- `legacyRelativeGapScore` nomeia sem ambiguidade o único cálculo transitório desta etapa;
- `priorityScore` existe sempre como nulo para tornar verificável que o escore final não foi publicado;
- `presentation.statusCode` leva ao frontend o estado já decidido pelo pipeline; limites de largura permanecem estritamente visuais no React;
- `nullReasons` associa cada nulo ao motivo estruturado exigido;
- `themeLabel`, resumos temáticos e listas por referência permitem apresentar o contrato sem reclassificação local.
- `methodology` acrescenta metadados auditáveis sem remover nem renomear campos do schema atual; consumidores antigos podem ignorar a extensão.
- `benchmarks` e `stateBenchmarkSummary` ampliam o mesmo schema de forma aditiva; consumidores P0/P1 podem ignorar os campos.
- `generationMetadata.implementedSubstages` registra também `P3-C`, `P4-A` e
  `P4-B-pilot`; `inequalityPilotAffectsDecisionSummary: false` torna explícita a
  separação. A ampliação de P4, P5-B e P6 continua adiada.

Não foram adicionados campos de necessidade, acionabilidade, confiança,
elegibilidade ou valores financeiros. O piloto de desigualdade é descritivo e
separado; os catálogos de financiamento permanecem globais.

## Extensão P4-B — localização urbana/rural

`inequalityPilot` usa metodologia `municipal-inequality-p4b-v1`, indicador
`basico_integral` e dimensão `urban_rural`. O objeto registra ano comum, códigos
de universo e fórmula, limite de célula e dois grupos estáveis (`urban` e
`rural`). Cada grupo contém numerador, denominador, percentual, ano, cobertura,
estado de publicação e código de supressão.

Os estados aceitos são `available`, `suppressed_small_cell`, `missing`,
`not_applicable` e `methodology_incompatible`. Campos numéricos suprimidos ou
ausentes permanecem nulos. Denominador menor que 10, numerador entre 1 e 9 ou
complemento entre 1 e 9 exige supressão; quando necessário, o outro grupo é
suprimido de forma complementar. `observedDifferencePercentagePoints` só existe
quando os dois resultados são publicáveis.

O bloco não aparece no `index.json`. Ele permanece no `diagnostico.json`,
carregado sob demanda no detalhe de `basico_integral`. Não altera indicadores,
`evidenceLevel`, `decisionReading`, `decisionSummary`, financiamento,
`priorityScore` ou a ordem existente. A especificação metodológica completa está
em [DIAGNOSTICO_MUNICIPAL_PILOTO_DESIGUALDADE_P4B.md](DIAGNOSTICO_MUNICIPAL_PILOTO_DESIGUALDADE_P4B.md).

## Benchmarks estaduais

`benchmarks.state.status` aceita `comparable`, `methodology_pending`,
`year_mismatch`, `unavailable` e `insufficient_coverage`. Somente
`comparable` recebe valor estadual. O ano estadual e o ano municipal efetivamente
comparado são sempre iguais. Quando o ano principal não possui ponto estadual
válido, o pipeline pode selecionar o último ano comum não posterior somente se
fórmula, unidade, faixa, etapa, universo, base territorial e regra de agregação
forem equivalentes. A diferença usa:

```text
at_least: município - RS
at_most:  RS - município
```

Positivo significa situação municipal mais favorável. `position` aceita
`better`, `worse`, `equivalent` e `not_directional`; o último preserva o valor
contextual quando não há direção favorável declarada, sem inventar diferença.
Equivalência usa tolerância absoluta de 0,1 p.p.

`municipalDistribution.status` usa `available` ou os estados de indisponibilidade
acima. A distribuição exige o mesmo indicador, ano, unidade, fórmula, universo,
dependência, metodologia e base territorial, além de 80% de cobertura e ao menos
20 municípios. Percentil alto sempre significa desempenho mais favorável.

Objetos indisponíveis preservam campos numéricos nulos e uma `reason`
estruturada. Quando somente a direção está ausente, `directionReason` explica o
nulo de diferença ou percentil.

`stateBenchmarkSummary` considera somente o universo com comparação legal válida, idêntico a `summary.validLegalComparisons`:

- `analyzedCount` e `eligibleAnalyzedCount`;
- `betterCount`, `worseCount`, `equivalentCount` e `unavailableCount`;
- `largestUnfavorableIndicatorIds`, limitado a três;
- `largestFavorableIndicatorIds`, limitado a dois.

As listas já chegam ordenadas pelo pipeline e não alteram a ordem de
`attentionItems`.

## Estados

`dataStatus` aceita `available`, `missing`, `not_applicable`, `pending_official_definition`, `methodologically_incompatible` e `unverifiable`.

`legalCorrespondence` e `operationalizationStatus` são independentes e aceitam `direct`, `partial`, `proxy`, `methodologically_incompatible`, `pending_official_definition` e `informational`. A confirmação dos 73 textos da lei não valida automaticamente fórmula, universo, numerador, denominador ou alvo operacional.

`valueDomainStatus` diferencia `within_domain`, `outside_domain_territorial_mismatch`, `outside_domain_unverifiable` e `not_applicable`.

Nos indicadores cuja política declarada é `allow_above_max_known_mixed_territorial_basis`, `within_domain` também abrange valores acima de 100%. A regra é vinculada à fórmula `100 * matrículas localizadas no município / população residente estimada`, não à unidade percentual em geral. Esses itens recebem `KNOWN_MIXED_TERRITORIAL_BASIS` e, quando superam 100%, `VALUE_ABOVE_100_ALLOWED_BY_METHOD`. AEE e pós-graduação docente não usam essa política.

`targetComparisonStatus` explicita se a comparação é `eligible` ou se foi excluída por ausência, domínio, incompatibilidade, definição oficial pendente ou inaplicabilidade.

## Nulos auditáveis

Todo campo nulo do indicador possui uma entrada em `nullReasons`, indexada pelo caminho do campo. Exemplos:

```json
{
  "rawValue": null,
  "goalAttained": null,
  "priorityScore": null,
  "nullReasons": {
    "rawValue": {
      "code": "raw_value_unavailable",
      "message": "Nenhuma observação municipal válida forneceu valor bruto; ausência não foi convertida em zero.",
      "sourceField": "result.end_value"
    },
    "goalAttained": {
      "code": "missing_observation",
      "message": "Indicador sem resultado municipal disponível; o valor permanece nulo."
    },
    "priorityScore": {
      "code": "final_priority_deferred",
      "message": "O escore aprofundado depende das etapas P2 a P6 e não é publicado nesta versão."
    }
  }
}
```

## Distância direcional

O pipeline usa uma única regra:

```text
at_least: favorableDistance = currentValue - targetValue
at_most:  favorableDistance = targetValue - currentValue

goalAttained = favorableDistance >= 0
remainingGap = max(0, -favorableDistance)
```

Não há cálculo quando o valor ou alvo é nulo, a comparação é incompatível ou o valor está fora do domínio específico do indicador. Nos quatro indicadores de atendimento com base territorial mista, valores acima de 100% continuam no domínio, e distância, cumprimento e lacuna usam `rawValue` integral. `displayValue` também preserva o bruto nesses casos. Somente a largura de uma barra pode ser limitada no componente React, sem serializar esse limite como resultado analítico.

Para `basico_15_17`, a base territorial conhecida não bloqueia o valor; a referência legada de 85% continua sendo uma incompatibilidade independente, portanto a distância legal permanece nula. Para AEE, o denominador não representa o público elegível. Para pós-graduação acima de 100%, numerador, denominador e duplicidades continuam `unverifiable` até reconciliação.

## Ordem provisória

`attentionItems` é ordenado exclusivamente no pipeline pelo método versionado `legacy-relative-gap-v2`:

```text
legacyRelativeGapScore = remainingGap / abs(targetValue)
```

O cálculo exige alvo finito e diferente de zero, lacuna disponível, domínio válido e correspondência direta ou parcial elegível. Empates usam a ordem do catálogo. Isso mantém a página funcional, mas não é um ranking aprofundado e não preenche `priorityScore`.

## Compatibilidade e fallback

O campo legado `diagnostico` permanece somente no export agregado durante a transição. O `index.json` publicado contém `diagnostico_ref`; o React carrega `diagnostico.json` na rota de Diagnóstico. Se o artefato estiver ausente ou se `schemaVersion` for incompatível, a página apresenta o estado correspondente, sem recorrer ao legado nem recalcular análise.

A remoção futura do adaptador agregado exige confirmar que não há consumidor externo dependente. A ampliação de P4, P5-B e P6 poderá estender o contrato, mas não deve mudar silenciosamente a semântica já publicada.
# Extensão P3-C — evidência e síntese para decisão

O schema permanece `municipal-diagnostic-v2`, com metodologia
`municipal-diagnostic-p3c-v1`. Cada indicador acrescenta `evidenceLevel`, o
objeto versionado `evidence` e, em `decisionReading`, `evidenceLevel` e
`summaryCollection`. A raiz acrescenta `decisionSummary`, com contagens e as
coleções `municipalActionItems`, `coordinationItems`, `investigationItems`,
`monitoringItems` e `preservationItems`. A seleção usa
`municipal-decision-summary-p3c-v2`; `attentionItems` permanece para auditoria e
`priorityScore` permanece nulo. Regras completas:
[DIAGNOSTICO_MUNICIPAL_SINTESE_DECISAO.md](DIAGNOSTICO_MUNICIPAL_SINTESE_DECISAO.md).
