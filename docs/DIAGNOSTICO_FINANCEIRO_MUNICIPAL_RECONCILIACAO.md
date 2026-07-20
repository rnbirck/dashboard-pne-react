# P5-B2-A — reconciliação DCA × SIOPE × RREO

Data: **20/07/2026**. A matriz completa está em [diagnostico_financeiro_reconciliacao_p5b2.csv](data/diagnostico_financeiro_reconciliacao_p5b2.csv).

## Resultado

Na amostra 2024, SIOPE OData e RREO Anexo 8 coincidem centavo a centavo no valor aplicado em MDE e exatamente nos percentuais de MDE e de remuneração dos profissionais do Fundeb. Isso é uma reconciliação entre duas rotas oficiais do mesmo sistema, não uma validação independente da declaração municipal.

A DCA função 12 não é equivalente ao limite constitucional de MDE. Ela não foi usada para inferir cumprimento legal. Da mesma forma, saldo financeiro do Fundeb não é comparável à receita do Fundeb recebida: o primeiro é estoque após ingressos e pagamentos; a segunda é fluxo acumulado.

## Regras de comparação

Uma linha só é comparável quando município, exercício, período, conceito, estágio, natureza e unidade são compatíveis. Rótulos semelhantes não bastam.

Equivalências:

- `equivalent`: mesmo conceito e mesmo grão;
- `partially_equivalent`: duas fontes são comparáveis, mas a terceira não oferece o conceito;
- `not_equivalent`: conceitos/grãos diferentes;
- `mapping_pending`: falta mapeamento ou fonte.

Estados:

- `reconciled`: valores comparáveis iguais dentro de R$ 0,01 ou do percentual publicado;
- `divergent_explained`: diferença documentada por regra de escopo;
- `divergent_unexplained`: diferença comparável sem explicação;
- `mapping_pending`: mapeamento ainda não homologado;
- `source_missing`: fonte ausente;
- `not_comparable`: comparação proibida.

## Campos reconciliados

| Campo | DCA | SIOPE | RREO | Resultado |
| --- | --- | --- | --- | --- |
| valor aplicado em MDE | não existe na DCA função 12 | indicador nominal em BRL | linha 29, valor aplicado | SIOPE × RREO `reconciled`; tripla `partially_equivalent` |
| percentual de aplicação em MDE | não existe | indicador percentual | linha 29, percentual | SIOPE × RREO `reconciled` |
| remuneração dos profissionais do Fundeb | não existe | indicador percentual | linha 15, percentual | SIOPE × RREO `reconciled` |
| execução da função Educação | empenhado/liquidado/pago/restos | não é o mesmo conceito no POC | MDE/áreas e deduções próprias | `not_comparable` |
| Fundeb — saldo versus recebido | não existe | saldo financeiro | linha 6, receita recebida | `not_comparable` |

Em Agudo, por exemplo, o valor aplicado em MDE é R$ 19.159.995,28 e a taxa é 28,51% nas duas rotas. A DCA empenhada da função Educação é R$ 25.722.214,85; a diferença não é erro a reconciliar, pois os universos legais são distintos.

## Ausência e retificação

Barra do Quaraí não aparece no SIOPE 2025/P6 nem no diretório RREO 2025/P6. A matriz registra `source_missing` e valores vazios, nunca zero.

O diretório RREO não oferece histórico de versões. Uma futura integração deve registrar hash e `Last-Modified` em cada execução, manter o snapshot anterior e reabrir a reconciliação quando houver mudança. A data tardia da entrega MSC de Araricá demonstra por que data de publicação e versão não podem ser descartadas.

## Limites

- A igualdade SIOPE/RREO pode refletir a mesma cadeia de geração; não comprova auditoria externa.
- O POC RREO mapeia somente linhas necessárias à prova constitucional inicial.
- O POC MSC restringe uma conta de pagamento e preserva o grão; não reconcilia ainda todos os estágios da DCA.
- Nenhuma fonte foi escolhida silenciosamente como preferencial e nenhum valor foi escrito nos contratos públicos.

