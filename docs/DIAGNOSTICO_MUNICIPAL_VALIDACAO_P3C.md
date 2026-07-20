# Diagnóstico municipal — validação completa P3-C

## Resultado

A P3-C foi encerrada sem falha estrutural remanescente. Os 497 contratos
canônicos mantêm 49 indicadores cada, totalizando 24.353 registros. A seleção é
determinística, não publica score e não usa investigação na síntese financeira.
A interface dirigida passou nos quatro viewports solicitados sem atualização de
baseline.

Foram corrigidas três inconsistências encontradas durante a validação:

1. `monitor` era logicamente inalcançável, pois todo estado não elegível já era
   convertido em evidência insuficiente antes do ramo de acompanhamento;
2. itens decisórios sem o antigo rank continuavam reservando uma coluna de
   34 px, fazendo o conteúdo ocupar essa coluna; no celular, `flex-basis: 320px`
   do título virava altura;
3. duas asserções de teste estavam mais restritivas que os contratos atuais: a
   ordem entre frentes financeiras e a vedação genérica de qualquer texto
   “Fundeb”, que também bloqueava a relação condicionada e não nominal com VAAR.

## Testes e verificações

| Comando/verificação | Resultado final |
| --- | --- |
| `python -m unittest discover -s data_pipeline/tests -p "test_*.py"` | passou: 119 testes |
| `npm run test:diagnostic` | passou: 12 testes de contrato React e financiamento |
| `npm run test:app-routing` | passou: 7 testes |
| `npm run validate:details` | passou: 40.122 arquivos, 0 erros e 1.708 avisos conhecidos sobre dependência |
| auditoria dos payloads `test_municipal_diagnostic_payloads.py` | incluída na suíte Python: 497 contratos, schema, 49 indicadores, coleções e invariantes |
| determinismo de `_refresh_contract` aplicado duas vezes em memória | passou para os 497 contratos |
| `npm run lint` | passou |
| `npm run build` | passou: 157 módulos transformados |
| `npm run test:e2e:diagnostic` | passou em 1366×768, 1280×720, 1024×768 e 390×844 |
| `git diff --check` | passou |

O `typecheck`, executado adicionalmente, permanece com três grupos de erros
preexistentes e fora da P3-C: `src/dev-ui/scenarios/cardScenarios.tsx` exige
`icon` em duas fixtures; `EducationMethodologySection.tsx` recebe
`availability: unknown`; e `EducationPage.tsx` fornece `icon: string` onde o
tipo exige o conjunto fechado de ícones. Nenhum erro aponta para os contratos ou
componentes do Diagnóstico.

A exportação integral tentou consultar PostgreSQL em `localhost:5432`, mas o
serviço estava indisponível. A regra corrigida foi então aplicada de forma
determinística sobre os contratos já exportados, cobrindo 1.988 arquivos físicos
entre os diretórios público e particionado, 497 IDs oficiais e os 497 contratos
do monólito. O script auxiliar `generate-diagnostic-case-study.mjs` ainda espera
o bloco legado `cycle.diagnostico`; o exemplo de Nova Santa Rita foi atualizado
pelo gerador canônico de auditoria, sem depender desse caminho legado.

## Por que `monitor` era zero

Na versão anterior, `_build_evidence_level` marcava qualquer comparação diferente
de `eligible` como `insufficient`. `_build_decision_reading` tratava
`insufficient` antes de chegar ao ramo que atribuía `monitor` para comparação
não elegível ou referência indeterminada. Logo, esse ramo não podia receber
nenhum registro.

Não foi criada quantidade artificial. A regra corrigida separa duas situações
reais de referência atingida:

- evidência `high`: `preserve_result`;
- evidência `medium`: `monitor`, com
  `quantitative_reference_attained_with_caveats`.

Evidência `low` continua em `investigate_data_or_supply`; proxy, indicador
informativo, incompatibilidade metodológica, ausência e valor fora do domínio
continuam em `insufficient_evidence`. A versão da seleção passou a
`municipal-decision-summary-p3c-v2`.

O resultado final contém 1.103 casos de `monitor`, todos com evidência `medium`
e referência atingida, distribuídos por 435 municípios. Há 775 casos de
`preserve_result`, todos com evidência `high`, em 400 municípios. Não restou
caso de acompanhamento classificado como preservação sem evidência alta ou como
investigação/evidência insuficiente contrariando essa definição.

## Distribuição de evidência

| Nível | Registros | Percentual |
| --- | ---: | ---: |
| `high` | 2.212 | 9,08% |
| `medium` | 6.797 | 27,91% |
| `low` | 2.328 | 9,56% |
| `insufficient` | 13.016 | 53,45% |
| **Total** | **24.353** | **100%** |

| Classificação decisória | Registros |
| --- | ---: |
| `municipal_direct_action` | 568 |
| `municipal_action_with_coordination` | 5.616 |
| `intergovernmental_coordination` | 947 |
| `investigate_data_or_supply` | 2.328 |
| `monitor` | 1.103 |
| `preserve_result` | 775 |
| `insufficient_evidence` | 13.016 |

Vinte e quatro indicadores têm evidência insuficiente nos 497 municípios. O
grupo inclui os seis SAEB parciais, `aee`, `alfabetizacao`, `basico_15_17`,
`medio_tecnico_articulado_percentual`, `fundamental_concluido_18_mais`, os
indicadores informativos de conectividade/equipamentos e
`proposta_pedagogica`. `subsequente_expansao` tem 483 registros insuficientes.
Os motivos mais frequentes são `COMPARISON_NOT_ELIGIBLE` (8.170),
`METHODOLOGY_INCOMPATIBLE` (4.846), `PROXY_NOT_VALIDATED` (3.479),
`INFORMATIONAL_INDICATOR` (3.479), `INSUFFICIENT_HISTORY` (2.327),
`VALUE_DOMAIN_INCOMPATIBLE` (1.747) e `DATA_UNAVAILABLE` (1.499).

## Ações, governabilidade e financiamento

Há 92 municípios sem ação municipal elegível; 174 têm uma, 158 têm duas e 73
têm três. Nenhum município ultrapassa três ações, portanto não há outlier com
número excepcionalmente alto. Pactuações variam de 6 a 17 por município, mas a
coleção compacta continua limitada a dois itens.

Não foi encontrado indicador com governabilidade `state_led`, `federal_led` ou
`territorial` classificado como `municipal_direct_action`. Também não há
interseção entre `investigationItems` e os IDs consumidos pelo financiamento.
VAAF, VAAT, Salário-Educação geral, SIOPE, SICONFI e FINBRA permanecem fora dos
mecanismos compactos; VAAR pode aparecer apenas como relação condicionada, com
elegibilidade municipal não verificada.

Em Agudo, a coleção compacta manteve `creche` e `escolas_integral` como ação,
`temporarios` e `basico_6_17` como pactuação, `pos_graduacao` como monitoramento
e `pre_escola`/`conselho_escolar` como preservação. Em Nova Santa Rita,
`escolas_integral` e `creche` são ação, `pos_graduacao` e `basico_6_17` são
pactuação, `alfabetizacao_pop_15_mais` é monitoramento e `temporarios` é
preservação.

## Revisão da amostra de 15 municípios

O CSV `docs/data/diagnostico_municipal_auditoria_amostra.csv` contém 735 linhas
(15 × 49) e passou a registrar motivo da evidência, governabilidade, coleção
efetivamente selecionada, presença no cabeçalho, presença no financiamento,
classificação esperada, conformidade e divergência.

As 735 linhas estão conformes. Treze municípios têm um item no cabeçalho; dois
casos da amostra não têm ação municipal elegível. Há 59 presenças na síntese
financeira, todas provenientes das coleções compactas de ação ou pactuação, e
nenhuma investigação foi usada. A coluna `divergencia` está vazia em toda a
amostra.

## Baselines e escopo

Nenhum baseline foi atualizado. As capturas produzidas pelo E2E são apenas
artefatos de evidência. Não foram publicados novos cards, gráficos, score,
ranking, causalidade, custo, saldo ou elegibilidade financeira.

