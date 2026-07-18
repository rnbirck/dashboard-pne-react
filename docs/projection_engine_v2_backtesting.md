# Motor de projeções v2 — backtesting em modo sombra

## Resumo executivo

O experimento implementa a estratégia `ratio_of_counts`, que projeta numerador e denominador separadamente e calcula o percentual somente depois. Após a validação da prévia controlada, os quatro contratos com `last_components` foram promovidos ao fluxo público exclusivamente como **cenários de planejamento**. O bloco público preexistente `projecoes` permanece inalterado.

Nos quatro indicadores candidatos, o cenário constante dos componentes foi o benchmark mais estável em todos os horizontes combinados. As variantes Theil–Sen não superaram o baseline nem em MAE nem em P90. Isso não transforma a série constante em “tendência confirmada”: significa somente que, no desenho retroativo adotado, extrapolar tendência foi pior do que repetir a última observação.

A decisão de produto posterior ao backtesting foi publicar os quatro indicadores como apoio ao planejamento, mantendo explícitos os limites encontrados: as referências seguem com validação jurídica pendente, os erros aumentam materialmente no horizonte de cinco anos, municípios pequenos têm desempenho pior, `escolas_integral` é discreto e sujeito a saltos, e `pos_graduacao` contém violações históricas de domínio em seis municípios.

Os resultados são cenários preditivos experimentais, não previsões oficiais e não metas municipais obrigatórias.

## Escopo, dados e rastreabilidade

- Fontes: os mesmos carregadores e universos usados por `pne_2026_2036.py`.
- Período de treinamento: 2015–2025. Os carregadores também contêm 2014, excluído para seguir o recorte solicitado.
- Unidade: município × ano; 497 municípios em cada indicador.
- Componentes: contagens agregadas pelo universo já definido no pipeline. Denominadores populacionais dos quatro indicadores atuais preservam a agregação `max`; os demais usam soma.
- Validade: ano inteiro, componentes finitos e não nulos, denominador maior que zero e numerador não negativo.
- Nulos não são convertidos em zero. Denominador não positivo torna a observação indisponível.
- `escolas_integral` preserva o corte existente de 25%. Abertura, fechamento ou mudança de classificação de uma escola pode gerar saltos.
- As referências são identificadas como `configured_reference`, com `targetValidationStatus: configured_unvalidated`.
- Artefatos reproduzíveis: `artifacts/projections-v2/`.

Todos os indicadores tiveram 497 municípios com pelo menos cinco pontos válidos. Cada indicador experimental gerou 29.820 avaliações (5 modelos × 5.964 pares município–origem–horizonte), sem vazamento de observações posteriores à origem.

## Contrato e regras de domínio

O contrato experimental separa:

- `rawNumerator` e `rawDenominator`: saída bruta do modelo;
- `numerator` e `denominator`: componentes após eventual regra explícita de não negatividade;
- `rawValue`: razão dos componentes brutos;
- `boundedValue`: preenchido apenas quando uma regra de domínio transforma o resultado;
- `displayValue`: valor resultante da regra documentada, sem corte silencioso em 0% ou 100%;
- `domainViolations`, `limitsApplied`, `warnings`, `status`, evidência de qualidade e resultado de backtesting.

Os estados possíveis são `available`, `available_with_warning`, `insufficient_data`, `invalid_components` e `invalid_domain`. A direção `at_least` ou `at_most` afeta somente a interpretação da referência, nunca a série estatística.

## Modelos comparados

| Código | Descrição | Uso |
|---|---|---|
| `last_components` | Repete o último numerador e denominador | Baseline e candidato sombra |
| `last_percentage` | Repete o último percentual | Benchmark direto apenas |
| `theil_sen_components_full` | Theil–Sen dos dois componentes, série completa | Candidato sombra |
| `theil_sen_components_last5` | Theil–Sen dos dois componentes, cinco pontos recentes | Candidato sombra |
| `theil_sen_percentage` | Theil–Sen direto do percentual | Benchmark direto apenas |

O modelo de produção não é escolhido automaticamente. O ranking combina MAE, P90, viés absoluto, previsões inválidas e cobertura; modelos diretos do percentual não são elegíveis como estratégia final.

## Desenho do backtesting e métricas

Foram usadas origens de 2019 a 2024, sempre com pelo menos cinco observações anteriores ou contemporâneas à origem. Cada ajuste vê somente dados até a origem. Os horizontes 1, 3 e 5 são avaliados apenas quando existe observação real no ano-alvo; ausência não vira erro zero.

As métricas do percentual são MAE macro em pontos percentuais, mediana do erro absoluto, P90, viés, MAE ponderado pelo denominador, proporções brutas acima de 100% e abaixo de 0%, cobertura e previsões inválidas. Para os componentes são calculados MAE, WAPE, viés e proporção de contagens brutas negativas. MAPE não é usado.

## Quatro candidatos — todos os modelos

Resultados combinando os horizontes disponíveis:

| Indicador | Modelo | MAE (p.p.) | Mediana AE | P90 AE | Viés (p.p.) |
|---|---|---:|---:|---:|---:|
| `basico_integral` | `last_components` | 6,03 | 3,24 | 15,31 | -3,93 |
|  | `last_percentage` | 6,03 | 3,24 | 15,31 | -3,93 |
|  | `theil_sen_components_full` | 8,17 | 5,25 | 19,52 | -5,08 |
|  | `theil_sen_components_last5` | 7,56 | 4,64 | 18,11 | -3,97 |
|  | `theil_sen_percentage` | 9,22 | 5,70 | 22,49 | -6,16 |
| `escolas_integral` | `last_components` | 8,62 | 1,72 | 25,00 | -5,10 |
|  | `last_percentage` | 8,62 | 1,72 | 25,00 | -5,10 |
|  | `theil_sen_components_full` | 12,29 | 6,53 | 33,33 | -6,98 |
|  | `theil_sen_components_last5` | 11,65 | 5,56 | 33,33 | -5,31 |
|  | `theil_sen_percentage` | 13,44 | 7,14 | 33,33 | -8,81 |
| `pos_graduacao` | `last_components` | 6,76 | 4,84 | 15,18 | -2,70 |
|  | `last_percentage` | 6,76 | 4,84 | 15,18 | -2,70 |
|  | `theil_sen_components_full` | 10,42 | 7,29 | 23,20 | +4,38 |
|  | `theil_sen_components_last5` | 10,25 | 6,99 | 23,23 | +3,91 |
|  | `theil_sen_percentage` | 9,41 | 6,79 | 20,80 | +3,31 |
| `temporarios` | `last_components` | 9,28 | 6,93 | 20,90 | -5,30 |
|  | `last_percentage` | 9,28 | 6,93 | 20,90 | -5,30 |
|  | `theil_sen_components_full` | 11,21 | 7,99 | 25,69 | -3,55 |
|  | `theil_sen_components_last5` | 11,44 | 7,99 | 26,23 | -2,41 |
|  | `theil_sen_percentage` | 11,08 | 8,06 | 25,12 | -3,71 |

`last_components` e `last_percentage` são numericamente iguais no baseline porque ambos repetem a última razão; a diferença metodológica é que apenas o primeiro mantém componentes auditáveis.

## Desempenho por horizonte do candidato sombra

| Indicador | H1 MAE / P90 | H3 MAE / P90 | H5 MAE / P90 | Viés H5 |
|---|---:|---:|---:|---:|
| `basico_integral` | 4,04 / 10,65 | 7,26 / 17,65 | 9,55 / 22,75 | -8,00 |
| `escolas_integral` | 5,85 / 20,00 | 10,32 / 33,33 | 13,53 / 33,33 | -10,32 |
| `pos_graduacao` | 4,88 / 10,94 | 8,04 / 17,66 | 9,87 / 20,55 | -5,84 |
| `temporarios` | 6,15 / 13,43 | 11,44 / 23,22 | 14,36 / 29,09 | -10,90 |

O erro e o viés negativo crescem com o horizonte. O baseline tende a subestimar séries que avançaram depois da origem, especialmente tempo integral e temporários.

## Diferenças por tamanho do denominador

Faixas definidas pelos quartis empíricos de cada indicador:

| Indicador | MAE pequeno (≤P25) | MAE intermediário | MAE grande (>P75) |
|---|---:|---:|---:|
| `basico_integral` | 8,12 | 6,24 | 3,52 |
| `escolas_integral` | 10,88 | 8,97 | 5,34 |
| `pos_graduacao` | 8,04 | 6,98 | 5,02 |
| `temporarios` | 10,52 | 10,00 | 6,58 |

O padrão é consistente: municípios com denominadores pequenos apresentam maior erro. Em `escolas_integral`, a granularidade discreta reforça essa diferença (P90 de 33,33 p.p. na faixa pequena).

## Diagnóstico dos quatro cenários municipais atuais

| Indicador | Baseline MAE | Motor atual com limites | Motor atual bruto | P90 com limites | Viés com limites |
|---|---:|---:|---:|---:|---:|
| `creche` | 8,22 | 7,22 | 7,68 | 15,95 | -2,46 |
| `pre_escola` | 11,52 | 11,11 | 12,34 | 25,00 | -6,54 |
| `basico_6_17` | 3,16 | 4,16 | 3,52 | 8,83 | -1,21 |
| `basico_15_17` | 7,88 | 10,31 | 10,66 | 20,05 | -0,06 |

O motor atual melhora o MAE de `creche` e marginalmente o de `pre_escola`, mas perde para o baseline em `basico_6_17` e `basico_15_17`. O replay reproduz tendência suavizada do numerador, amortecimento, limite anual de 8%, fator populacional estadual por faixa, limite anual em pontos percentuais e teto de exibição.

| Indicador | Previsões avaliadas | Previsões com limite acionado | Acionamentos | Efeito absoluto médio final (p.p.) |
|---|---:|---:|---:|---:|
| `creche` | 5.964 | 2.474 | 4.402 | 1,41 |
| `pre_escola` | 5.964 | 3.327 | 6.377 | 8,81 |
| `basico_6_17` | 5.964 | 1.901 | 2.341 | 1,77 |
| `basico_15_17` | 5.964 | 4.224 | 8.400 | 6,69 |

Nos 497 payloads canônicos atuais, 3.583 valores históricos brutos acima de 100% diferem do valor exibido. Não foram encontrados denominadores não positivos convertidos em 0% nos artefatos atuais. A qualidade publicada soma 1.937 classificações `media` e 51 `baixa`; não há `alta`.

## Violações de domínio

Nos contratos sombra do baseline:

- `basico_integral`, `escolas_integral` e `temporarios`: nenhuma violação histórica ou projetada;
- `pos_graduacao`: 13 anos com numerador histórico acima do denominador, distribuídos em seis municípios; os valores são preservados e sinalizados;
- nenhuma contagem projetada precisou da regra de não negatividade no modelo selecionado;
- nenhum valor sombra selecionado foi truncado em 100%.

Os benchmarks de tendência produzem valores brutos acima de 100% em parte das avaliações, sobretudo em `pos_graduacao`; essas ocorrências permanecem nas métricas e não são ocultadas.

## Auditoria estadual

A projeção estadual pública atual contém nove indicadores com pelo menos um valor fora do domínio percentual superior a 100%: `pre_escola`, `eja_integrada_educacao_profissional_percentual`, `internet`, `internet_aprendizagem`, `rede_local`, `rede_wireless`, `educacao_ambiental`, `salas_climatizadas` e `comp_portatil_aluno`. O maior valor é 178,79% no indicador de EJA; o artefato registra o primeiro ano, valor bruto e componentes de cada caso.

Nos cenários estaduais sombra de 2036:

| Indicador | Componentes estaduais | Percentual agregado direto | Agregação municipal | Diferença direta–componentes |
|---|---:|---:|---:|---:|
| `basico_integral` | 18,28% | 17,06% | 18,28% | -1,22 p.p. |
| `escolas_integral` | 36,09% | 31,27% | 36,09% | -4,82 p.p. |
| `pos_graduacao` | 56,82% | 85,40% | 56,82% | +28,58 p.p. |
| `temporarios` | 35,82% | 48,66% | 35,82% | +12,84 p.p. |

Como o modelo selecionado é constante, projetar os componentes estaduais ou agregar as projeções municipais produz o mesmo resultado. A forte divergência do percentual direto em `pos_graduacao` e `temporarios` é evidência contra extrapolar o percentual agregado como método principal.

## Proposta provisória de qualidade

Os limiares são específicos por indicador e derivados da própria distribuição municipal: P50/P75 do MAE, P25 do denominador e P75 da volatilidade e da divergência entre modelos. Saltos relevantes usam uma regra robusta de 3 MAD sobre variações anuais. As regras ainda não substituem a qualidade pública.

| Indicador | Alta | Média | Baixa | Insuficiente |
|---|---:|---:|---:|---:|
| `basico_integral` | 23 | 314 | 160 | 0 |
| `escolas_integral` | 23 | 329 | 145 | 0 |
| `pos_graduacao` | 55 | 288 | 154 | 0 |
| `temporarios` | 50 | 284 | 163 | 0 |

`alta` exige MAE até o P50 e ausência de sinais adversos de lacuna, recência, porte, volatilidade, divergência, salto ou domínio. `media` exige MAE até o P75 e no máximo dois sinais. Os demais casos avaliáveis são `baixa`; menos de cinco pontos ou ausência de erro retroativo é `insuficiente`.

## Leitura do backtesting e decisão de publicação

| Indicador | Modelo selecionado | Motivo | Forma de publicação |
|---|---|---|---|
| `basico_integral` | `last_components` | Menor MAE e P90; componentes auditáveis | Cenário de manutenção, com P90 H5 de 22,75 p.p. e viés H5 de -8,00 p.p. expostos como limites metodológicos. |
| `escolas_integral` | `last_components` | Modelos alternativos pioram média e cauda | Cenário de manutenção, com ressalva de unidade discreta e P90 H5 de 33,33 p.p. |
| `pos_graduacao` | `last_components` | Menor MAE; evita viés positivo dos modelos alternativos | Cenário de manutenção, preservando o estado inválido dos seis municípios com domínio inconsistente. |
| `temporarios` | `last_components` | Menor MAE e P90 | Cenário de manutenção, com MAE H5 de 14,36 p.p. e viés H5 de -10,90 p.p. expostos como limites metodológicos. |

O modelo constante não é apresentado como evidência de estabilidade futura. A publicação comunica somente manutenção do último patamar observado, trajetória necessária, referência configurada e qualidade do cenário.

## Riscos, robustez e decisões humanas pendentes

- Validar juridicamente as referências atualmente configuradas e a forma correta de comunicá-las.
- Investigar os seis municípios e 13 anos de `pos_graduacao` com numerador acima do denominador.
- Confirmar com especialistas se mudanças metodológicas anuais afetam comparabilidade dos componentes.
- Definir tolerância aceitável de erro por horizonte e por porte municipal; os dados mostram as distribuições, mas não definem o risco institucional aceitável.
- Reavaliar periodicamente se o cenário constante continua agregando valor como apoio ao planejamento, sem inferir estabilidade futura.
- Para `escolas_integral`, avaliar um tratamento futuro específico para contagens discretas e mudanças de classificação, sem introduzi-lo antes de validação.
- Revisar os nove indicadores estaduais que excedem 100% e distinguir inconsistência de universo de extrapolação estatística.
- Submeter a proposta de qualidade a validação humana antes de substituir qualquer classificação consumida pela aplicação.

## Reproduzir e inspecionar

```powershell
$env:PYTHONPATH='data_pipeline'
data_pipeline\.venv\Scripts\python.exe data_pipeline\scripts\backtest_pne_projections_v2.py
data_pipeline\.venv\Scripts\python.exe -m unittest data_pipeline.tests.test_projections_v2 -v
```

Artefatos principais:

- `artifacts/projections-v2/backtest-summary.json`
- `artifacts/projections-v2/model-ranking.json`
- `artifacts/projections-v2/quality-distribution.json`
- `artifacts/projections-v2/state-domain-audit.json`
- `artifacts/projections-v2/shadow-projections/*.json`
- `artifacts/projections-v2/samples/*.json`
- `artifacts/projections-v2/run-manifest.json`

O manifesto registra hashes agregados idênticos dos payloads públicos antes e depois do runner. Na publicação, os quatro contratos existentes continuam isolados e inalterados em `pne_2026_2036.projecoes`; os novos contratos ficam em `pne_2026_2036.cenarios_planejamento`.

## Publicação canônica no frontend

Os quatro contratos aprovados são transformados no pipeline e incorporados ao payload municipal canônico em `pne_2026_2036.cenarios_planejamento`. O exportador exige artefatos aprovados com `last_components` e `targetValidationStatus: configured_unvalidated`; também produz a trajetória necessária e o ritmo anual necessário para cada referência, para que o frontend permaneça exclusivamente apresentacional.

```powershell
data_pipeline\.venv\Scripts\python.exe data_pipeline\scripts\export_planning_scenarios.py
data_pipeline\.venv\Scripts\python.exe data_pipeline\scripts\partition_static_data.py
```

A seção **Cenários de planejamento** é pública por padrão, sem feature flag, diretório experimental ou carregamento separado. Ela apresenta **Cenário de manutenção**, **Patamar mantido até 2036**, **Trajetória necessária para a referência**, **Referência atualmente configurada no painel**, **Ritmo anual necessário** e **Qualidade do cenário**. A referência permanece um parâmetro de planejamento e não representa, nesta aplicação, uma obrigação legal municipal validada.
