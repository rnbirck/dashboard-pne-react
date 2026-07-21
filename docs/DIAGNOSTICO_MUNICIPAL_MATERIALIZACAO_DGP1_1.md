# DGP1.1 — Materialização controlada do contrato público

## 1. Objetivo

Materializar `pne2026PublicDiagnostic` nos contratos municipais públicos já
existentes, sem recalcular ou alterar a camada técnica do Diagnóstico. A etapa
atualizou os 497 contratos canônicos por slug e seus 497 aliases por código
IBGE, totalizando 994 arquivos físicos.

## 2. Comando e estratégia de geração

O gerador geral `data_pipeline/scripts/export_static_data.py --include-derived`
não possui opção “somente Diagnóstico”: ele também carrega e grava detalhes,
referências estaduais, projeções, cenários, atendimento, FUNDEB e PNATE. O
particionador também opera sobre todos os payloads. Executá-los contrariaria o
escopo restrito desta etapa.

Foi usada a invocação PowerShell mais restrita, com Python recebido por `stdin`:

```powershell
@'
from src.municipal_diagnostic import build_pne_2026_public_diagnostic

# Para cada item de public/data/municipios_index.json:
# 1. lê o contrato técnico canônico por slug;
# 2. materializa exclusivamente a propriedade abaixo;
contract['pne2026PublicDiagnostic'] = (
    build_pne_2026_public_diagnostic(contract)
)
# 3. serializa com ensure_ascii=False, indent=2 e newline final;
# 4. grava atomicamente o mesmo conteúdo no slug e no alias IBGE.
# Assertions antes e depois validam escopo, invariância e auditoria.
'@ | python -X utf8 -
```

A invocação importou a função de produção e sua configuração versionada. Antes
da escrita foi criado backup ZIP temporário dos 497 contratos canônicos. Cada
arquivo foi escrito em temporário no próprio diretório e substituído
atomicamente. O backup foi removido somente após todas as asserções; em caso de
erro, o comando restauraria os 994 arquivos.

Não houve acesso à internet, atualização de base, execução do exportador geral,
particionamento geral ou pipeline financeiro.

## 3. Arquivos gerados e auxiliares

Modificados:

- `public/data/municipios/<slug>/diagnostico.json`: 497 arquivos;
- `public/data/municipios/<codigo-IBGE>/diagnostico.json`: 497 arquivos.

Criado:

- `docs/DIAGNOSTICO_MUNICIPAL_MATERIALIZACAO_DGP1_1.md`.

Nenhum manifesto ou índice precisou ser alterado. A ordem e o universo de
`public/data/municipios_index.json` permaneceram idênticos. Nenhum arquivo
auxiliar de geração permaneceu no repositório.

## 4. Versões antes e depois

| Campo | Antes | Depois | Contratos |
|---|---|---|---:|
| `schemaVersion` | `municipal-diagnostic-v2` | `municipal-diagnostic-v2` | 497 |
| `dataVersion` | ausente | ausente | 497 |
| `methodologyVersion` | `municipal-diagnostic-p3c-v1` | `municipal-diagnostic-p3c-v1` | 497 |
| `pne2026PublicDiagnostic.version` | ausente | `pne2026-public-diagnostic-v1` | 497 |
| ciclo público | ausente | `pne_2026_2036` | 497 |

A mudança é exclusivamente aditiva. Não houve alteração de timestamp ou
metadado de geração.

## 5. Contratos e identidade dos aliases

| Medida | Antes | Depois |
|---|---:|---:|
| contratos canônicos por slug | 497 | 497 |
| aliases por código IBGE | 497 | 497 |
| arquivos físicos | 994 | 994 |
| pares byte a byte idênticos | 497 | 497 |
| pares divergentes | 0 | 0 |

O primeiro e o último slug do índice continuam, respectivamente, `acegua` e
`aurea`. Nenhum município entrou, saiu, foi duplicado ou mudou de posição.

## 6. Comparação semântica antes × depois

Para cada um dos 497 contratos canônicos foi calculado SHA-256 da serialização
JSON canônica, com chaves ordenadas, removendo exclusivamente
`pne2026PublicDiagnostic`. Os 497 hashes antes e depois foram idênticos.

Campos autorizados a mudar:

- inclusão de `pne2026PublicDiagnostic`.

Campos que permaneceram invariantes:

- os 49 indicadores e seus IDs;
- valores, anos, unidades, numeradores, denominadores e séries;
- referências configuradas, direção, `goalAttained`, `favorableDistance` e
  `remainingGap`;
- comparação estadual, percentis e municípios semelhantes;
- trajetória técnica e inventário de cenários;
- `decisionSummary`, evidência, governabilidade e exposição;
- piloto de desigualdade, `priorityScore`, fontes técnicas e motivos internos;
- versões e metadados de geração.

Resultado: 24.353 indicadores técnicos antes e depois, zero hash semântico
divergente e nenhuma alteração ampla de ordem, arredondamento ou formatação
numérica na camada técnica.

## 7. Allowlist e metas publicadas

Todos os contratos materializam, na mesma ordem, as 24 metas homologadas:

`1.a`, `1.c`, `4.a`, `6.a`, `12.a`, `12.b`, `3.a`, `5.a`, `5.b`, `5.d`,
`4.b`, `4.c`, `4.d`, `17.a`, `17.f`, `17.b`, `17.d`, `8.c`, `18.b`, `8.b`,
`19.c`, `11.a`, `11.b`, `11.c`.

`scope.allowedIndicatorIds` contém somente:

`basico_integral`, `escolas_integral`,
`medio_tecnico_participacao_publica`, `subsequente_expansao`,
`idade_regular_quinto`, `idade_regular_nono`, `idade_regular_medio`,
`adequacao_ai`, `adequacao_af`, `adequacao_em`, `pos_graduacao`, `temporarios`,
`educacao_ambiental`, `conselho_escolar`, `salas_climatizadas`,
`salas_acessiveis`, `alfabetizacao_pop_15_mais`,
`fundamental_concluido_15_29`, `medio_concluido_18_mais`,
`medio_concluido_18_29`.

Os outros 29 indicadores não aparecem na camada pública e permanecem em todos
os contratos técnicos. `goals` não contém meta vazia, ID externo ou meta fora
da allowlist.

## 8. Vínculos e classificações

A união dos vínculos observados nos 497 contratos reproduziu exatamente:

- 20 vínculos únicos;
- 11 `direct`;
- 9 `partial_component`.

As metas `6.a`, `12.a`, `17.a` e `11.c` preservam seus resultados separados.
Nenhum objeto de meta contém `status`, `classification`, `goalAttained`, score
ou prioridade consolidada. Não foi calculada média, soma, melhor ou pior
resultado.

Todos os componentes parciais usam texto referente ao “resultado” e ao valor
previsto para esse resultado. As classificações materializadas foram:

| Classificação | Resultados |
|---|---:|
| `maintain` | 1.360 |
| `advance` | 7.759 |
| total | 9.119 |

`classification`, `favorableDifference` e `remainingGap` foram validados
direcionalmente em todos os resultados. Divergências: zero.

## 9. Resumos municipais

Em todos os 497 municípios:

- `displayedResultsCount = reachedResultsCount + advanceResultsCount`;
- `stateAboveOrNearCount + stateBelowCount <= displayedResultsCount`;
- as contagens foram reproduzidas diretamente de `goals[].results`.

Distribuições observadas (`valor: quantidade de municípios`):

- exibidos: `15: 3`, `16: 1`, `18: 321`, `19: 160`, `20: 12`;
- alcançados: `0: 32`, `1: 98`, `2: 114`, `3: 104`, `4: 78`, `5: 36`,
  `6: 21`, `7: 9`, `8: 4`, `9: 1`;
- a avançar: `9: 1`, `10: 4`, `11: 8`, `12: 21`, `13: 28`, `14: 68`,
  `15: 94`, `16: 94`, `17: 93`, `18: 75`, `19: 11`;
- RS acima ou próximo: `1: 5`, `2: 19`, `3: 33`, `4: 61`, `5: 72`,
  `6: 70`, `7: 72`, `8: 55`, `9: 52`, `10: 34`, `11: 11`, `12: 9`,
  `13: 4`;
- RS abaixo: `0: 3`, `1: 10`, `2: 30`, `3: 46`, `4: 52`, `5: 76`,
  `6: 71`, `7: 71`, `8: 60`, `9: 43`, `10: 23`, `11: 11`, `12: 1`.

Não foram contadas metas vazias, fontes ausentes, investigação ou financiamento.

## 10. Auditoria do RS e dos percentis

| Medida | Obtido |
|---|---:|
| comparações com RS | 6.148 |
| `above` | 3.159 |
| `near` | 40 |
| `below` | 2.949 |
| faixas estaduais | 5.964 |
| `top_quarter` | 1.546 |
| `middle` | 2.924 |
| `more_room_to_advance` | 1.494 |

A comparação estadual permaneceu contexto secundário e não alterou nenhuma
classificação frente à meta. O percentil bruto não foi copiado para a nova
camada; somente a faixa qualitativa foi materializada.

## 11. Oferta educacional semelhante

Foram materializadas 6.086 comparações válidas:

- `above`: 2.856;
- `near`: 342;
- `below`: 2.888.

Os objetos públicos contêm somente título, mediana, diferença favorável,
estado qualitativo e texto. Dados de coorte, lista de membros, distância,
atributos internos, Q1/Q3 e códigos de relaxamento permanecem exclusivamente na
camada técnica.

## 12. Trajetórias públicas

Foram materializadas 1.982 trajetórias públicas, com ao menos uma em cada um dos
497 municípios:

- `improved`: 1.109;
- `stable`: 234;
- `declined`: 639;
- com ano estimado: 583.

Somente `component_maintenance` com qualidade avaliada foi publicado.
`required_trajectory/not_assessed` continuou omitido da camada pública, sem
alteração da trajetória técnica.

## 13. Fontes públicas

Cada um dos 497 contratos usa efetivamente e deduplica as duas fontes:

- INEP — Censo Escolar da Educação Básica, 2025:
  <https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar>;
- IBGE — Censos Demográficos 2010 e 2022:
  <https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html>.

Todos os registros possuem ID, órgão, título público, período e URL oficial.
Cada `sourceId` é usado por ao menos um resultado do próprio contrato. Não há
resultado sem fonte nem fonte financeira, de programa, presumida ou genérica.

## 14. Tamanho dos contratos

Os números incluem os 994 arquivos físicos.

| Medida | Antes | Depois |
|---|---:|---:|
| tamanho total | 530.469.624 bytes | 554.882.356 bytes |
| tamanho médio | 533.671,65 bytes | 558.231,75 bytes |
| menor arquivo | 523.169 bytes | 545.987 bytes |
| maior arquivo | 542.434 bytes | 568.489 bytes |

O acréscimo total foi de 24.412.732 bytes, aproximadamente 23,28 MiB ou 4,60%,
correspondente exclusivamente à nova propriedade.

## 15. Auditoria consolidada

| Medida | Esperado | Obtido |
|---|---:|---:|
| contratos lógicos | 497 | 497 |
| arquivos físicos | 994 | 994 |
| indicadores técnicos | 24.353 | 24.353 |
| resultados classificáveis | 9.119 | 9.119 |
| mínimo por município | 15 | 15 |
| máximo por município | 20 | 20 |
| comparações com RS | 6.148 | 6.148 |
| faixas estaduais | 5.964 | 5.964 |
| oferta semelhante | 6.086 | 6.086 |
| trajetórias públicas | 1.982 | 1.982 |
| trajetórias com ano estimado | 583 | 583 |
| resultados sem fonte oficial | 0 | 0 |
| divergências direcionais | 0 | 0 |
| indicadores fora da allowlist | 0 | 0 |
| metas externas | 0 | 0 |

## 16. Testes executados

- inspeção prévia: contagem, identidade byte a byte, versões, tamanhos e hashes;
- materializador transacional: schema, 24 metas, 20 indicadores, vínculos 11/9,
  resumos, fontes, auditoria dos 497 e invariância técnica;
- identidade pós-escrita slug × código IBGE: 497 pares, zero divergência;
- 52 testes Python DGP1 e direcionados do pipeline/payload: aprovados em
  13,501 segundos;
- `git diff --check`: aprovado.

Não foram executados build do frontend, E2E, regressão visual, download,
pipeline financeiro, publicação, commit ou push.

## 17. Divergências e áreas preservadas

Não foi encontrada divergência. O índice não mudou. O hash agregado dos 994
`financeiro.json` permaneceu idêntico antes e depois. O hash agregado de toda a
árvore `src` também permaneceu idêntico durante a materialização, comprovando
que nenhum React, CSS, rota, loader ou código do Panorama financeiro foi tocado
pela DGP1.1.

Os documentos DGP0, DGP0-V e DGP1 não foram alterados. Nenhum dado externo foi
baixado.

## 18. Critério para DGP2

Os 497 contratos canônicos e 497 aliases contêm a propriedade pública válida,
os pares são idênticos, a camada técnica é semanticamente invariável, as
contagens homologadas foram reproduzidas e os testes passaram. **DGP2 pode
começar.**
