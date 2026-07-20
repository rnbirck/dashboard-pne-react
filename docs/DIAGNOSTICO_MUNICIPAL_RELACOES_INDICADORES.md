# Diagnóstico municipal — relações entre indicadores (P4-A)

## Escopo

O catálogo `src/data/diagnostic/indicatorRelations.json` registra 24 relações
auditáveis entre indicadores sem alterar o contrato, a seleção ou a interface do
P3-C. O arquivo não é importado pelo frontend nem pelo pipeline de decisão e
declara `causalUseAllowed: false`.

| `relationType` | Quantidade | Significado |
| --- | ---: | --- |
| `supported` | 6 | relação de definição ou pré-requisito sustentada pelos campos do Censo Escolar |
| `association` | 8 | correlação municipal descritiva, calculada em um único ano comum |
| `hypothesis` | 10 | hipótese conceitual não testada, que exige análise pré-registrada |

## Campos do catálogo

Cada relação possui `relationId`, `sourceIndicatorId`, `targetIndicatorId`,
`sourceStage`, `targetStage`, `relationType`, `direction`, `strength`,
`rationale`, `evidenceSource`, `evidenceDesign`, `applicableUniverses`,
`limitations`, `requiredData` e `methodologyVersion`. Associações acrescentam
ano, quantidade de municípios, coeficiente de Pearson e origem no objeto
`evidence`. Relações sustentadas registram a semântica compartilhada da fonte.
Hipóteses registram explicitamente `requires_pre_registered_analysis`.

`sourceStage` e `targetStage` situam cada ponta na cadeia `input` →
`capacity_activity` → `process_coverage` → `result`. A meta legal permanece no
catálogo de indicadores; nenhuma aresta cria uma nova meta ou encurta a cadeia
em uma alegação causal.

## Relações sustentadas

As seis relações sustentadas são restritas à gramática dos próprios campos:
internet para alunos, uso para aprendizagem, oferta à comunidade e acesso por
computador/dispositivo pressupõem a declaração de internet; rede wireless é uma
modalidade de rede local. “Sustentada” não significa que a característica cause
aprendizagem, atendimento ou qualquer outro resultado.

## Associações descritivas

As oito associações usam somente pares municipais com o mesmo ano corrente. O
catálogo contém a evidência numérica completa. Entre os resultados mais fortes
estão `basico_integral` × `escolas_integral` em 2025 (497 municípios) e os pares
de Língua Portuguesa × Matemática do SAEB em 2023. Esses coeficientes são
ecológicos, não ajustados e sem temporalidade; servem para documentar
co-variação, não para recomendar uma intervenção.

Não houve mistura de anos: quando os contratos municipais tinham anos correntes
diferentes, foi selecionado um único ano comum com maior cobertura. Nenhum valor
ausente foi convertido em zero.

## Hipóteses

As hipóteses ligam formação e adequação docente, vínculos temporários e
adequação, acessibilidade física e AEE, tempo integral e trajetória, internet
para aprendizagem e SAEB, e os dois indicadores de educação infantil. Elas não
foram usadas para ordenar itens, explicar causalmente resultados ou sugerir
financiamento.

## Regras de uso

- `hypothesis` não pode aparecer como achado.
- `association` deve ser apresentada com ano, cobertura, coeficiente e aviso
  ecológico; não pode receber linguagem causal.
- `supported` só autoriza a leitura estrutural declarada no campo `basis`.
- Nenhuma relação altera score, ranking, classificação, governabilidade,
  seleção financeira ou o P3-C.
- Recomendações causais exigiriam desenho próprio, temporalidade, confundidores,
  compatibilidade de universos e validação separada; isso não foi implementado.
