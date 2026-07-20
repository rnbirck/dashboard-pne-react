# Implementação P0/P1 do diagnóstico municipal

**Data:** 19/07/2026  
**Escopo concluído:** validade legal/metodológica P0 e contrato canônico P1  
**Fora do escopo:** P2, P3, P4, P5, P6, escore final e recomendação financeira

## Resultado

O diagnóstico municipal passou a ser construído por `build_municipal_diagnostic_v2` no pipeline. A função gera resumo, 49 indicadores, referências atingidas, lacunas comparáveis, exclusões, avisos e metadados. O exportador publica o contrato em `diagnostico_v2`, o particionador aplica o identificador municipal oficial e o React apresenta a ordem e os valores recebidos sem recalcular comparabilidade, distância, cumprimento ou score.

O campo `diagnostico` foi preservado como adaptador depreciado, derivado do mesmo contrato. Ele não dirige mais a interface React.

## Arquitetura

Antes:

```text
resultados -> diagnostico.py -> diagnostico legado
          \-> React -> normalização, comparabilidade, distância e ordenação próprias
```

Depois:

```text
resultados + catálogo -> build_municipal_diagnostic_v2
                      -> diagnostico_v2 -> React (formatação e filtros visuais)
                      -> adaptador diagnostico legado (compatibilidade temporária)
```

## Arquivos e funções

- `data_pipeline/src/municipal_diagnostic.py`: adiciona `build_municipal_diagnostic_v2`, `calculate_directional_distance`, validação de catálogo, domínio, referências, resumo e ordem transitória.
- `data_pipeline/scripts/export_static_data.py`: exporta `diagnostico_v2` e deriva o envelope legado do contrato.
- `data_pipeline/scripts/partition_static_data.py`: valida e incorpora o contrato aos payloads municipais, com ID oficial.
- `data_pipeline/src/views/diagnostico.py`: passa a adaptar o contrato canônico e deixa de produzir recomendações prescritivas.
- `src/data/diagnostic/indicatorCatalog.json` e seu gerador: registram validação legal, operacionalização, domínios, exibição e marcos multidimensionais.
- `src/features/diagnostic/diagnosticTypes.ts`: formaliza o schema v2 e seus estados.
- `src/features/diagnostic/diagnosticPresentation.js`: seleciona a versão suportada e cria somente modelos de apresentação.
- `src/pages/Diagnostico.jsx` e `src/components/DiagnosticPanel.jsx`: consomem o contrato pronto, preservando a estrutura visual existente.
- `data_pipeline/tests/test_municipal_diagnostic.py`: testes unitários das regras P0/P1.
- `data_pipeline/tests/test_municipal_diagnostic_payloads.py`: testes dos 497 contratos particionados.
- `scripts/checks/diagnostic-contract.test.mjs`: testes da fronteira pipeline/React.
- `docs/DIAGNOSTICO_MUNICIPAL_SCHEMA_V2.md`: especificação e migração do schema.

## Campos e decisões metodológicas

- Valores ausentes permanecem `null` e recebem razão estruturada em `nullReasons`.
- `rawValue` e `displayValue` preservam integralmente os resultados de `creche`, `pre_escola`, `basico_6_17` e `basico_15_17`, inclusive acima de 100%.
- Para esses indicadores, a fórmula usa todas as matrículas localizadas no município sobre a população residente estimada. Valores acima de 100% são possíveis e válidos nessa definição operacional; a base territorial conhecida é uma ressalva de interpretação, não uma incompatibilidade.
- A classificação usa `valueDomainPolicy`, fórmula e metadados territoriais do catálogo. Ela não se estende automaticamente a outros percentuais.
- O contrato registra fórmula, numerador, denominador e base territorial em `methodology`; a extensão é compatível com o schema v2 e não altera campos existentes.
- Distância, cumprimento, lacuna, contadores e ordem usam sempre `rawValue`. Somente a largura visual da barra é limitada a 100% no React.
- A validação dos 73 textos legais fica separada de `operationalizationStatus`.
- Comparações parciais são permitidas somente quando a dimensão quantitativa é válida e recebem flag de que não provam cumprimento integral.
- `at_least` e `at_most` usam distância favorável com sinais coerentes.
- A ordem `legacy-relative-gap-v2` considera apenas lacunas elegíveis e é explicitamente provisória.
- `priorityScore` permanece nulo em todos os contratos.

## Bloqueios obrigatórios

| Indicador | Estado P0/P1 | Motivo |
|---|---|---|
| `basico_15_17` | incompatível | referência legada de 85% não é a universalização da Meta 4.a |
| `alfabetizacao` | definição oficial pendente | marcos de 80% em 2031 e 100% em 2036 existem, mas a seleção segura do marco ainda não foi implementada |
| SAEB | parcial e fora da comparação global | o valor principal representa nível adequado; a meta exige também nível básico |
| `medio_tecnico_articulado_percentual` | incompatível | numerador atual contém integradas, enquanto a lei inclui integradas ou concomitantes |
| `fundamental_concluido_18_mais` | proxy | universo atual é 18+ e a referência legal usa 15+ |
| `aee` | proxy | denominador atual não representa o público elegível ao AEE |
| `creche` | parcial comparável | cobertura quantitativa não mede demanda manifesta |
| `salas_climatizadas` e `salas_acessiveis` | parcial comparável | presença de salas não representa integralmente as condições legais de oferta |

## Compatibilidade e fallback

O payload mantém `diagnostico` e adiciona `diagnostico_v2`. O adaptador legado declara `status: deprecated`, `replacement: diagnostico_v2` e a origem da regra. O frontend não faz fallback analítico para o legado. Ausência ou versão incompatível produz apenas um estado neutro na página.

`excludedItems`, razões, warnings e flags continuam no contrato para auditoria, mas a síntese executiva deixou de renderizar a seção técnica “Indicadores fora da ordem provisória”.

A retirada do campo legado fica para uma migração futura, depois de inventariar consumidores externos. Nenhuma alteração de baseline visual foi feita.

## Nova Santa Rita — antes e depois

Antes, o legado registrava 46 resultados, 2 metas atingidas e 29 pontos de atenção; o React ignorava esse resumo e montava outra lista. `basico_15_17` era comparado a 85%, AEE e EPT articulada podiam carregar distância como se fossem metas diretas, e o cap visual podia ocultar um bruto acima de 100%.

No v2, Nova Santa Rita possui 49 registros, 46 resultados disponíveis, 23 comparações válidas, 2 referências atingidas, 21 lacunas comparáveis e 26 indicadores excluídos. As três ausências (`alfabetizacao`, `medio_tecnico_participacao_publica` e `subsequente_expansao`) permanecem nulas. `basico_15_17`, AEE e EPT articulada ficam sem distância legal e fora da ordem.

`temporarios` mantém direção `at_most`: o bruto de 13,165% diante do limite de 30% resulta em `favorableDistance = 16,835`, `remainingGap = 0` e referência atingida. Nenhum `priorityScore` é publicado.

Aceguá tem `pre_escola` bruto de aproximadamente 122,222%. O contrato preserva `rawValue` e `displayValue` em 122,222%, mantém `dataStatus = available` e `valueDomainStatus = within_domain`, registra `KNOWN_MIXED_TERRITORIAL_BASIS` e `VALUE_ABOVE_100_ALLOWED_BY_METHOD` e calcula a comparação operacional com o valor integral. A largura da barra pode ser limitada a 100% sem alterar o número mostrado.

Nenhuma matrícula por município de residência foi criada, estimada ou adicionada como dependência. A definição existente continua baseada em matrículas localizadas. O contrato mantém `basico_15_17` fora da comparação legal exclusivamente pela referência legada de 85%; AEE e pós-graduação acima de 100% conservam seus bloqueios próprios.

## Testes focados adicionados

- testes Python para os 49 indicadores, nulos, correspondências direta/parcial/proxy, bloqueios, domínio, fórmulas preservadas, casos acima de 100%, `at_least`, `at_most`, score transitório, resumo, ordem e serialização;
- testes Node para ordem recebida, preservação do bruto, limite exclusivamente visual, distância e score recebidos, apresentação `at_most`, estado proxy, textos da página e ausência de ordenação/cálculo diagnóstico no módulo React;
- validação particionada para 497 municípios, 49 IDs únicos, razões de nulos, referências internas, exclusões e `priorityScore` nulo.

## Regeneração e volume

O catálogo e a matriz foram reproduzidos pelo gerador oficial. A exportação oficial com derivados concluiu com 497 municípios e zero erros; o estágio do diagnóstico levou 5,010 s. O particionador validou os contratos e gerou 1.993 JSONs nas rotas por slug e por ID, totalizando 798,6 MB; o maior payload municipal tem 711,8 KB. A sincronização oficial publicou os 999 arquivos alterados sem criar ou remover rotas. Uma falha transitória de escrita do Windows interrompeu a primeira tentativa após 253 arquivos; a repetição do mesmo sincronizador oficial publicou os 746 restantes.

A segunda execução do particionador não criou, atualizou nem removeu arquivos e preservou os 1.993 JSONs, comprovando determinismo. O diff rastreado em `public/data` contém 999 arquivos, 6.501.445 inserções e 213.281 remoções. O diff rastreado total do repositório contém 1.031 arquivos, 6.504.232 inserções e 214.567 remoções, mas inclui alterações preexistentes no diretório de trabalho.

A auditoria encontrou valores acima de 100% em 3 municípios para `creche`, 268 para `pre_escola`, 83 para `basico_6_17` e 57 para `basico_15_17`. Todos permanecem com o bruto integral. AEE tem 38 casos acima de 100% e conserva seu bloqueio próprio. A base publicada atual não contém pós-graduação acima de 100% (máximo de 94%); o tratamento `unverifiable` é coberto por fixture sintética.

## Relatório de validação

Passaram:

- 13 testes Python de diagnóstico e payload, incluindo a auditoria dos 497 municípios com 49 IDs únicos, igualdade entre `rawValue` e o `end_value` da série de origem, casos obrigatórios e preservação de `excludedItems`;
- 6 testes do contrato React e 7 testes de rotas;
- lint e build Vite;
- validação de detalhes: 40.122 arquivos, zero erros e 1.708 avisos já existentes;
- inspeção dirigida do Diagnóstico de Aceguá em 1366×768 e 390×844: 122,2% e +22,2 p.p. preservados, nota metodológica exibida uma vez, seção técnica ausente, barras contidas, nenhum overflow horizontal e nenhum erro de console;
- `git diff --check` após a implementação.

Antes da alteração, os testes Python (10), os testes React (4), lint, build e os 7 testes de rotas passavam; continuam passando após a correção. O E2E global ainda interrompe antes do Diagnóstico na falha preexistente `Educação: ressalva geral fica visível` (esperado 1, encontrado 0). A inspeção dirigida do Diagnóstico foi concluída separadamente e não encontrou nova falha. Nenhum baseline foi atualizado. As capturas finais estão em `artifacts/diagnostico-methodology-2026-07-19/`.

## Limitações preservadas para P2 a P6

- trajetória, projeção oficial, incerteza e qualidade aprofundada;
- referência RS, percentis, pares e governabilidade;
- desigualdade interna e relações causais;
- capacidade financeira, elegibilidade e portfólio;
- necessidade, acionabilidade, confiança, sensibilidade e ranking final.

Nenhuma recomendação financeira ou causal é gerada pelo contrato P0/P1.
