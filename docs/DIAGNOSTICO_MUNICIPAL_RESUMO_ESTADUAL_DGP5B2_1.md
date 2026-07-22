# DGP5-B2.1 — Complementação do resumo estadual do Diagnóstico municipal v2

Data: 2026-07-21.

## 1. Decisão

A DGP5-B2.1 não foi implementada nem aprovada. A lacuna detectada pela DGP5-B3
não pode ser corrigida exclusivamente no `summary` porque o contrato v2 também
não materializa, dentro de `stateComparison`, a classificação pública individual
que seria a única origem permitida para as duas novas contagens.

Nenhum builder, teste, contrato municipal ou frontend foi alterado. A interface
deve continuar no v1.

## 2. Lacuna encontrada na DGP5-B3

O `summary` de `pne2026PublicDiagnosticV2` não possui contagens separadas para:

- resultados acima ou próximos do Rio Grande do Sul;
- resultados abaixo do Rio Grande do Sul.

A DGP5-B3 foi corretamente interrompida antes de qualquer mudança no frontend,
pois derivar essas contagens no React é proibido.

## 3. Semântica homologada no v1

O arquivo solicitado `data_pipeline/src/pne2026_public_diagnostic.py` não existe
neste checkout. O builder v1 vigente está em
`data_pipeline/src/municipal_diagnostic.py::build_pne_2026_public_diagnostic`.

No v1, a propriedade individual usada é `stateComparison.state`, com a seguinte
semântica pública:

- `above` e `near` entram em `stateAboveOrNearCount`;
- `below` entra em `stateBelowCount`;
- ausência de `stateComparison` não entra em nenhuma contagem.

O v1 materializa `stateComparison.state` somente depois de validar a comparação
estadual. A classificação técnica `better/equivalent/worse` é traduzida para
`above/near/below` no próprio objeto público individual.

## 4. Estado real do v2

A auditoria somente leitura dos 497 contratos encontrou:

| Evidência | Total |
|---|---:|
| Resultados com `stateComparison` | 8.473 |
| `stateComparison` com propriedade `state` | 0 |
| Resultados com `statewidePosition` | 8.420 |
| `statewidePosition: better` | 4.092 |
| `statewidePosition: worse` | 4.328 |
| Posições técnicas comparáveis `equivalent` no contrato municipal | 538 |

O builder v2 atual copia valor, ano, método, cobertura, quantidade municipal e
diferença favorável para `stateComparison`, mas omite a classificação pública
`above/near/below`. Ele também condiciona uma propriedade chamada
`statewidePosition` a `better/similar/worse`, embora a origem técnica produza
`better/equivalent/worse`. Assim, comparações equivalentes não são representadas
nessa propriedade.

## 5. Motivo do bloqueio

A especificação desta etapa exige simultaneamente:

1. adicionar somente duas contagens ao `summary`;
2. não alterar comparações individuais;
3. agregar uma classificação pública já presente nos resultados;
4. tornar as contagens reproduzíveis pelos objetos públicos individuais;
5. não usar `statewidePosition`, diferenças numéricas, texto livre ou novo
   cálculo.

Essas condições não podem ser satisfeitas pelo contrato atual: a classificação
pública individual necessária não existe. Contar a posição técnica, interpretar
`favorableDifference` ou usar `statewidePosition` violaria o escopo. Adicionar
`stateComparison.state` resolveria a origem, mas alteraria as comparações
individuais e deixaria de ser a única diferença semântica autorizada nesta etapa.

## 6. Campos não adicionados

Não foram adicionados `stateAboveOrNearCount` nem `stateBelowCount` ao resumo v2.
Produzir esses campos sem antes materializar a classificação pública individual
criaria contagens não reproduzíveis e descartaria indevidamente a categoria
“próximo”.

## 7. Materialização e preservação

O materializador transacional não foi executado em modo de escrita. Nenhum dos
497 contratos canônicos, 497 aliases ou 994 arquivos físicos foi modificado.

Foram preservados integralmente:

- o bloco v1;
- todos os resultados v2;
- valores, anos, unidades, classificações, vínculos, metas, tiers e ordem;
- comparações, posições, trajetórias e fontes;
- PNE, frontend, finanças, rotas, shell e baselines.

## 8. Arquivos criados

- `docs/DIAGNOSTICO_MUNICIPAL_RESUMO_ESTADUAL_DGP5B2_1.md`.

## 9. Arquivos alterados

Nenhum.

## 10. Arquivos removidos

Nenhum.

## 11. Testes e auditorias

Foi executada auditoria Node.js somente leitura dos 497 contratos canônicos para
contar comparações estaduais, presença de `stateComparison.state`, valores de
`statewidePosition` e posições técnicas comparáveis.

Não foram executados testes do builder/materializador, materialização, segunda
geração ou auditoria pós-escrita, pois não existe implementação compatível com as
invariantes desta etapa. Build, ESLint, typecheck, E2E, screenshots e regressão
visual também não foram executados, como exigido.

## 12. Pendência para retomar a DGP5-B2.1

É necessária uma decisão contratual que autorize materializar a classificação
pública `above/near/below` em cada `stateComparison` do v2 — preservando a
semântica do v1 — antes de agregar as duas contagens ao resumo. Essa autorização
amplia a diferença permitida além do `summary` e deve esclarecer o tratamento do
campo atual `statewidePosition`.

## 13. Decisão final

**DGP5-B2.1 não aprovada; a interface permanece no v1 porque a classificação
pública individual `stateComparison.state` não está materializada no contrato
v2 e não pode ser inferida ou substituída por `statewidePosition`.**
