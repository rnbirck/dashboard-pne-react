# Diagnóstico municipal — trajetória, governabilidade e pares

**Data:** 19/07/2026  
**Contrato:** `municipal-diagnostic-v2`  
**Metodologia:** `municipal-diagnostic-p2-p3b-v1`

## Resultado

A etapa P1.2 separou o contrato aprofundado em
`municipios/<slug>/diagnostico.json`. O `index.json` conserva apenas
`diagnostico_ref`; o React busca o artefato completo somente quando a rota de
Diagnóstico é aberta. O mesmo conteúdo é publicado nos aliases por slug e por
código IBGE. O export agregado ainda conserva o adaptador antigo como
compatibilidade temporária, mas ele não é publicado no índice nem consumido
pela interface.

P2 e P3-B acrescentaram, sem alterar a ordem transitória:

- `trajectory`, com ritmo direcional, próximo marco, tipo de cenário, valor do
  cenário e incerteza explicitamente não estimada;
- `governance`, com classe explícita por indicador, responsabilidades, redes,
  ação municipal, pactuação e versão da regra;
- `municipalExposure`, disponível somente quando numerador e denominador por
  dependência reconciliam com o total;
- `similarMunicipalities`, com 20 vizinhos compatíveis por indicador/ano e
  distância de porte da oferta, ou ausência estruturada;
- `decisionReading`, classificação descritiva com até três códigos de razão,
  sem escore e sem usar financiamento como evidência.

O inventário `trajectoryScenarioInventory` registra os sete cenários de
atendimento e os quatro de manutenção. Quatro cenários de atendimento possuem
correspondência direta no catálogo de 49 indicadores; os três recortes
adicionais permanecem no inventário sem serem atribuídos artificialmente a
outro indicador.

## Regras de trajetória

O próximo marco oficial aplicável é escolhido por ano da observação, direção,
validade legal e compatibilidade metodológica. Na ausência de marco oficial,
o contrato diferencia referência de planejamento, referência configurada não
validada e referência pendente.

- `at_least`: ritmo favorável observado = inclinação Theil–Sen;
- `at_most`: ritmo favorável observado = menos a inclinação;
- ritmo necessário = lacuna remanescente / anos até o marco;
- meta atingida recebe `target_already_met` e ritmo necessário zero;
- não existe fator infinito ou extrapolação criada pelo Diagnóstico.

`trend_projection` reaproveita os sete contratos de atendimento;
`component_maintenance` reaproveita os quatro contratos aprovados de
manutenção; `required_trajectory` é apenas o caminho linear necessário;
`historical_trend_only` não é apresentado como projeção. Cenários não são
promessas de resultado.

## Universo da síntese estadual

`stateBenchmarkSummary.analyzedCount` agora usa exatamente o mesmo universo de
`summary.validLegalComparisons`. Assim:

```text
better + worse + equivalent + unavailable = analyzedCount
```

Em Agudo, os quatro totais somam 24, os mesmos 24 indicadores analisados. A
leitura ampliada de todos os resultados municipais disponíveis permanece em
`stateBenchmarkExpandedSummary` e não dirige a síntese executiva. Nenhum
benchmark individual foi alterado.

## Governabilidade e exposição

As classes aceitas são `direct`, `shared`, `state_led`, `federal_led`,
`territorial` e `informational`. A tabela é explícita por indicador; tema não
atribui responsabilidade automaticamente.

Exposição municipal exige componentes por dependência do numerador e do
denominador no mesmo ano, com soma idêntica ao agregado. Na base atual, essa
reconciliação está disponível para escolas em tempo integral. Ausência ou
componente parcial produz `status: unavailable`, valores nulos e código de
razão; não produz estimativa nem zero substituto.

## Nova Santa Rita

- creche: 35,10% em 2025; ritmo favorável 4,09 p.p./ano contra 2,26
  necessários; projeção de tendência 51,03% em 2036; ação municipal direta;
- matrículas integrais: 21,02%; cenário de manutenção 21,02%; ritmo 1,29
  contra 2,33 p.p./ano; responsabilidade compartilhada;
- escolas integrais: exposição reconciliada de 100% do numerador e 85,71% do
  denominador na rede municipal;
- pós-graduação: movimento favorável de -0,22 p.p./ano, portanto
  `moving_away`, diante de 1,88 p.p./ano necessários;
- temporários: referência `at_most` já atingida, classificação
  `preserve_result`;
- 15–17 anos: governabilidade `state_led`, mas a referência incompatível
  impede ritmo necessário e classificação executiva causal.

## Payload

| Medida | Antes | Depois |
|---|---:|---:|
| Agudo `index.json` | 764.707 B | 314.871 B |
| Agudo `diagnostico.json` | embutido (199.534 B no v2 antigo) | 492.796 B |
| transferência inicial municipal | 764.707 B | 314.871 B |
| total ao abrir Diagnóstico em Agudo | 764.707 B | 807.667 B |
| 497 índices canônicos | 378.147.289 B | 155.760.261 B |
| 497 diagnósticos canônicos | embutidos | 245.489.203 B |
| índice + diagnóstico canônicos | 378.147.289 B | 401.249.464 B |

O maior índice municipal é Canoas, com 324.300 B; o maior diagnóstico também
é Canoas, com 503.474 B. `public/data` possui 3.499 JSONs e 1.417.024.503 B,
incluindo bases educacionais e os aliases por código. O ganho principal é de
58,8% na transferência inicial de Agudo; o aprofundamento é pago somente na
rota que o utiliza. O total canônico índice + diagnóstico cresceu 6,1% para
publicar pares, trajetória e governabilidade.

## Limites preservados

Não foram criados escore final, desigualdades internas, elegibilidade nominal,
valores financeiros, custos, chamadas abertas ou recomendação causal. Porte da
oferta é a única variável de pares com cobertura municipal suficiente nesta
etapa; população, ruralidade, NSE, capacidade fiscal e COREDE permanecem
registrados como indisponíveis.
# Revisão P3-C da governabilidade

`basico_6_17` passa a `shared`. Creche e pré-escola permanecem diretas quando a
composição não demonstra oferta mista relevante e passam a `shared` quando a
exposição reconciliada mostra participação municipal inferior a 90% do
denominador. `territorial`, `state_led`, `federal_led` e `informational` nunca
são apresentados como ação municipal direta. A versão da regra é
`municipal-governance-p3c-v1`.
