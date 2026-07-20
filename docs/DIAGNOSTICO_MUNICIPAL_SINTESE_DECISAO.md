# Diagnóstico municipal — síntese para decisão (P3-C)

## Problema corrigido

`attentionItems` ordenava lacunas por `remainingGap / abs(targetValue)` e o React
exibia os cinco primeiros registros. A ordem era provisória, não considerava
trajetória, cenário, RS, pares, governabilidade, exposição ou qualidade da
evidência e ainda alimentava a síntese financeira. O campo permanece no contrato
para auditoria, mas não controla mais a interface nem o financiamento.

## Evidência categórica

Cada indicador recebe `evidenceLevel` e `evidence` com versão
`municipal-evidence-p3c-v1`. Não existe score de evidência publicado ou usado
como prioridade.

| Faixa | Regra descritiva |
| --- | --- |
| `high` | Comparação elegível, correspondência direta, histórico suficiente, cenário utilizável e benchmarks estadual e de pares disponíveis. |
| `medium` | Comparação elegível e pelo menos duas evidências metodológicas ou contextuais utilizáveis. Correspondência legal parcial limita a leitura e é registrada. |
| `low` | Comparação existente, mas histórico ou cenário insuficiente para orientar intervenção. |
| `insufficient` | Dado ausente, metodologia incompatível, comparação inelegível, proxy não validado, indicador informativo ou valor fora do domínio. |

Cada faixa possui até três `reasonCodes`. Entre os códigos usados estão
`INSUFFICIENT_HISTORY`, `LEGAL_CORRESPONDENCE_PARTIAL`,
`STATE_BENCHMARK_AVAILABLE`, `PEER_BENCHMARK_AVAILABLE`,
`MUNICIPAL_EXPOSURE_RECONCILED`, `SCENARIO_QUALITY_LOW` e
`METHODOLOGY_INCOMPATIBLE`. Ausência permanece `null` ou indisponível e nunca é
convertida em zero.

## Objeto canônico

O pipeline produz `decisionSummary` com contagens completas e as coleções
`municipalActionItems`, `coordinationItems`, `investigationItems`,
`monitoringItems` e `preservationItems`. A versão de seleção é
`municipal-decision-summary-p3c-v2`.

- `municipalActionItems`: até três itens iniciais;
- `coordinationItems`: até dois itens iniciais;
- `investigationItems`: todos os itens bloqueados, sem posição ordinal;
- `monitoringItems` e `preservationItems`: coleções descritivas, sem prioridade;
- nenhuma duplicidade entre coleções;
- `priorityScore` permanece `null`.

As contagens representam todos os indicadores de cada destino. Os arrays de
ação e pactuação são somente a seleção compacta inicial.

A soma de `municipalActionCount`, `coordinationCount`, `investigationCount`,
`monitoringCount` e `preservationCount` reconcilia os 49 indicadores do
contrato. Já o filtro “Resultados municipais disponíveis” conta somente os
indicadores com resultado publicável no município e pode ser menor. Esses dois
campos têm universos diferentes e não devem ser apresentados como equivalentes.

Uma referência quantitativa atingida só entra em `preservationItems` quando a
evidência é `high`. Quando a referência foi atingida com evidência `medium`, o
resultado entra em `monitoringItems`, com o motivo
`quantitative_reference_attained_with_caveats`. Assim, limitações parciais ou
contextuais não são apresentadas como resultado a preservar sem ressalva.

## Ação municipal

Um indicador só pode ser candidato quando tem comparação válida, referência
não atingida, evidência `high` ou `medium`, governabilidade `direct` ou
`shared`, classificação municipal compatível e ao menos uma evidência adicional:
ritmo desfavorável/insuficiente/estável, cenário abaixo da referência, percentil
baixo entre pares, diferença desfavorável para o RS ou exposição municipal
elevada. Uma responsabilidade compartilhada só é encaminhada para ação
municipal quando a exposição municipal reconciliada é de pelo menos 50%; nos
demais casos vai para pactuação.

A ordenação sucessiva considera, nesta ordem: `moving_away`, `insufficient`,
cenário abaixo da referência, menor percentil de pares, pior diferença para o
RS, maior exposição, maior `remainingGap` e `indicatorId`.

## Pactuação

Entram indicadores com evidência `high` ou `medium`, referência não atingida,
governabilidade `shared`, `state_led` ou `federal_led` e classificação de
coordenação compatível. A ordem considera evidência, responsabilidade
compartilhada antes da estadual/federal, ritmo, pares, RS, lacuna e
`indicatorId`.

Os textos distinguem execução municipal, liderança estadual, indução federal e
coordenação territorial. Resultado estadual ou territorial não é descrito
como falha exclusiva da prefeitura.

## Investigação

Evidência insuficiente ou baixa, metodologia incompatível, histórico
insuficiente, cenário indisponível, oferta não identificada, proxy não validado
e indicador informativo são enviados para `investigationItems`. Esses itens não
recebem posição ordinal, card principal ou chamada financeira. A interface
mantém a faixa fechada por padrão e resume os itens em quatro grupos:
metodologia ou referência incompatível; dado municipal indisponível; indicador
informativo ou proxy; oferta ou componentes que exigem validação local. Cada
grupo mostra quantidade, descrição, no máximo dois exemplos e o acesso
“Consultar evidências e limitações”. A lista completa fica dentro desse detalhe,
sem caixa de rolagem interna e com motivos apresentados em português.

## Governabilidade

A matriz continua explícita por indicador, sem inferência pelo tema. P3-C
corrige `basico_6_17` para responsabilidade compartilhada e permite que creche
e pré-escola migrem de direta para compartilhada quando a exposição
reconciliada identifica oferta mista relevante. Ensino médio e SAEB do ensino
médio permanecem predominantemente estaduais; escolaridade adulta permanece
territorial; infraestrutura agregada de toda a rede pública permanece
compartilhada; indicadores informativos não geram ação executiva.

## Interface e financiamento

O React apenas associa os IDs canônicos aos dados dos indicadores e aplica o
filtro temático; não seleciona, reordena nem calcula elegibilidade. A lista
compacta apresenta até três ações, duas pactuações e uma faixa de
investigação. Campos indisponíveis não aparecem nas duas linhas analíticas.

O cabeçalho usa as contagens de `decisionSummary` e só destaca a primeira
oportunidade de `municipalActionItems`. A síntese financeira consome
exclusivamente `municipalActionItems` e `coordinationItems`; investigação não
gera mecanismo sugerido. Elegibilidade, valores, saldos e prioridade financeira
continuam não verificados.

O texto executivo menciona ação municipal, pactuação, investigação e
acompanhamento. Preservação permanece separada. A seção final única se chama
“Resultados a preservar e acompanhar” e organiza as coleções em “Preservar” e
“Acompanhar”, sem alterar sua seleção ou ordem.

Quando `similarMunicipalities.featuresUsed` contém somente `offering_size`, a
interface usa “Municípios com oferta de porte semelhante” e informa que outros
atributos municipais ainda não integram o pareamento. O cálculo dos coortes,
percentis, membros e distâncias não foi alterado.

## Síntese versus ranking

Esta etapa é uma triagem descritiva para limitar a síntese inicial. A ordem é
determinística, composta por critérios sucessivos e documentados, mas não é
ranking final. Não foram criados ou publicados `needScore`,
`actionabilityScore`, `confidenceScore`, `priorityScore` ou qualquer score
composto oculto.

## Auditoria humana

- `docs/data/diagnostico_municipal_classificacoes_p3b_legacy.csv`: fotografia
  anterior dos 497 contratos;
- `docs/data/diagnostico_municipal_classificacoes_497.csv`: contagens P3-C por
  indicador e dimensões de evidência/governabilidade;
- `docs/data/diagnostico_municipal_auditoria_amostra.csv`: amostra de 15
  municípios, com valor, meta, evidência, trajetória, pares, governabilidade,
  exposição, classificação, coleção, razões e posições anterior/nova.

A revisão humana não participa da regra de seleção.
