# Diagnóstico financeiro municipal — schema v1

## Identificação

- `schemaVersion`: `municipal-finance-v1`.
- `dataVersion`: `p5b2b1-2024-p6-2026-07-20`.
- `methodologyVersion`: `municipal-finance-p5b2b1-v1`.
- Grão: um município do RS por código IBGE.
- Exercício fechado: 2024.
- Exercício de previsão anual: 2026.
- Corte das previsões: 22/06/2026.

O tipo canônico está em `src/features/diagnostic/municipalFinanceTypes.ts` como `MunicipalFinanceDocumentV1`.

## Estrutura superior

| Campo | Conteúdo |
| --- | --- |
| `municipality` | código IBGE, nome, slug e UF |
| `periods` | exercício fechado, previsão anual e corte |
| `dataQuality` | nível derivado, razões e cobertura por dimensão |
| `summary` | transferências cobertas, previsão anual e DCA empenhada |
| `amounts` | Fundeb e QSE separados por fonte, ano, natureza e estágio |
| `programStatuses` | VAAF, VAAT e VAAR sem inferência |
| `qse` | matrículas, coeficientes e parcelas |
| `execution` | função 12 da DCA e taxas derivadas |
| `constitutionalApplication` | SIOPE e RREO separados, valor canônico reconciliado e receita Fundeb declarada |
| `reconciliation` | síntese da reconciliação constitucional SIOPE × RREO |
| `perStudent` | QSE distribuída por matrícula com memória de cálculo |
| `educationLinks` | referências compactas sem replicação por indicador |
| `educationalScoreIsolation` | escores nulos e isolamento decisório |
| `generationMetadata` | ausência de interface, índice e fonte manual |

## Valor financeiro compacto

```json
{
  "value": 1045009.11,
  "unit": "BRL",
  "referenceYear": 2024,
  "financialStage": "transferred",
  "amountNature": "confirmed",
  "sourceId": "fnde_qse_realized_2024"
}
```

Quando `value` é nulo, `nullReasonCode` é obrigatório. A mensagem completa fica no catálogo global, não no contrato municipal.

## Estágios e naturezas

`financialStage`: `forecast`, `authorized`, `committed`, `transferred`, `received`, `budgeted`, `empenhado`, `liquidado`, `paid`, `balance` ou `not_applicable`.

`amountNature`: `official_estimate`, `confirmed`, `municipal_declared`, `panel_displayed` ou `local_calculation`.

Previsão nunca é recebimento; DCA nunca é receita; transferência nunca é saldo bancário.

## Resumo com cobertura explícita

- `confirmedTransfersCoveredBySources`: inclui apenas fontes listadas em `coveredSourceIds` e usa a regra `same_year_confirmed_transferred_nonoverlapping`. Na P5-B1, contém somente a QSE distribuída de 2024.
- `officialAnnualForecastsCurrentYear`: contém o total anual previsto do Fundeb, com a regra `fundeb_total_standalone_no_components`.
- `dcaEducationCommitted`: explicita a execução empenhada declarada ao SICONFI para a função 12.

Os campos P5-A `confirmedTransfersPrimaryYear`, `officialForecastsCurrentPartialYear` e `educationCommittedPrimaryYear` existem apenas na interface legada `MunicipalFinancePrototypeDocumentV1`.

## Cobertura por dimensão

Cada dimensão contém:

```json
{
  "rate": 1,
  "status": "complete",
  "availableSourceIds": ["fnde_qse_realized_2024"],
  "missingSourceIds": [],
  "reasonCodes": []
}
```

Uma taxa nula exige `reasonCodes`. Status permitidos: `complete`, `partial`, `source_missing`, `divergent`, `unavailable`, `pending_source` e `mapping_pending`. Baixa cobertura não significa baixo desempenho financeiro.

## Composição do Fundeb

Total, VAAF, VAAT e VAAR são campos separados. Cada componente informa:

- `includedInFundebTotal`;
- `compositionStatus`;
- `doubleCountingRisk`;
- `summationAllowed`.

Componentes contidos ou não reconciliados nunca podem ser somados novamente. Habilitação para cálculo VAAT é guardada em `calculationStatus` e não muda, sozinha, o status de benefício.

## Taxas derivadas

Cada taxa é um valor `local_calculation` com `calculation.formula`, referências do numerador, referência do denominador, fonte, ano e função. Componentes ausentes geram `missing_calculation_component`; denominador zero gera `zero_denominator`.

## Aplicação constitucional e reconciliação

`constitutionalApplication` fixa `referenceYear: 2024`, `period: 6` e `stageBasis: empenhado`. `mdeAppliedAmount`, `mdeAppliedRate` e `fundebProfessionalRemunerationRate` preservam `siope`, `rreo`, `canonical` e `reconciliation`. A receita `fundebRevenueReceivedDeclared` permanece exclusiva do RREO, com natureza `municipal_declared` e estágio `received`.

Estados constitucionais aceitos: `reconciled`, `source_missing`, `divergent_explained` e `divergent_unexplained`. O canônico só existe em `reconciled`; os demais estados preservam as fontes e usam nulo estruturado. A tolerância monetária é R$ 0,01; percentuais usam a precisão publicada de duas casas, com tolerância documentada de 0,005 ponto percentual. O canônico é a média aritmética arredondada à precisão publicada, sem fonte preferencial.

A reconciliação superior tem escopo `siope_rreo_constitutional_application`. A DCA função 12 continua fora desse confronto. `fundebRevenueReceivedDeclared` não participa de transferências confirmadas nem de regras de soma.

## Catálogos globais

- `/data/financeiro/catalogos.json`: fontes, URLs, órgãos, hashes, códigos de razão e regras de soma.
- `/data/financeiro/cobertura.json`: cobertura agregada por fonte e campo.
- `/data/financeiro/manifest.json`: versão, quantidades, hashes e rota lazy.

O contrato municipal não repete URLs, textos legais ou descrições extensas.

## Loader

`src/data/municipalFinance.ts` resolve slug ou código, mantém cache e expõe estados `idle`, `loading`, `ready`, `absent`, `incompatible_version` e `error`. O loader valida `schemaVersion` antes de entregar o documento.

Desde a P5-C1, o consumidor visual é importado somente na rota
`#financeiros-panorama`. O catálogo `/data/financeiro/catalogos.json` também é
carregado nessa rota, com cache separado, para resolver fontes, URLs, mensagens
de ausência e regras de soma sem replicá-las no contrato municipal.

O React apresenta `amounts`, `execution.derivedRates`, `coverageByDimension` e
`educationLinks` diretamente. Ele não soma complementações, não recalcula taxas,
não converte nulo em zero e não usa o contrato educacional como fallback.

Na P5-B2-B1, o tipo aceita a extensão compatível do schema, mas a apresentação conserva um gate explícito de P5-C2. Os campos constitucionais e a cobertura nova não são renderizados pela P5-C1.
