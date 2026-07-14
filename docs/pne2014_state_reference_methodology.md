# Referência estadual do RS — PNE 2014–2024

## Escopo e regra central

O ciclo encerrado usa um artefato estadual próprio, independente do município
selecionado: `public/data/pne_2014_2024/referencia_estadual.json`. Para taxas,
a referência é calculada sobre os dados brutos válidos:

```text
Referência RS (ano) = 100 × Σ numeradores válidos / Σ denominadores válidos
```

Não há média de percentuais municipais. Nulos não são zero, pares incompletos
são excluídos, denominador estadual zero produz `null` e o arredondamento fica
restrito à apresentação. Cada registro preserva ano, numerador, denominador,
cobertura municipal, cobertura do denominador, fonte, filtros e metodologia.

O município e o RS só são comparados quando usam o mesmo indicador, ano final,
fonte, filtros, unidade e universo. Para os snapshots censitários, o ano do
resultado municipal continua sendo o ano observado (2010 ou 2022), sem
interpolação.

## Fluxo

- `data_pipeline/src/pne_2014_state_reference.py`: registro do ciclo, fórmulas,
  bloqueios e construção do artefato.
- `data_pipeline/src/pne_state_reference.py`: agregadores brutos, cobertura,
  nulos, classificação escolar e série especial de EPT.
- `data_pipeline/scripts/export_static_data.py`: exporta a referência dos dois
  ciclos.
- `data_pipeline/scripts/partition_static_data.py`: copia o artefato sem
  duplicá-lo nos payloads municipais.
- `src/data/staticData.js` e `src/pages/CyclePage.jsx`: carregam o artefato do
  ciclo ativo.
- `src/utils/stateReference.js` e `src/components/MetaCard.jsx`: ocultam a
  comparação quando não existe ponto estadual comparável e calculam
  exclusivamente `Município − RS` para a cor secundária.

## Indicadores habilitados

| Indicador | Dados brutos e filtros | Ano final do artefato |
| --- | --- | --- |
| `creche` | `mat_infantil_creche / pop_0_3`; população municipal por máximo do ano | 2024 |
| `pre_escola` | `mat_infantil_pre / pop_4_5`; população municipal por máximo do ano | 2024 |
| `basico_6_17` | `mat_basico_6_17 / pop_6_17`; população municipal por máximo do ano | 2024 |
| `basico_15_17` | frequência ou conclusão da educação básica / população de 15–17 anos | 2024 |
| `basico_integral` | matrículas integrais públicas / matrículas básicas públicas; `dependencia = publica` | 2024 |
| `escolas_integral` | classificação escola a escola com corte de 25%, depois razão de somas | 2024 |
| `eja_integrada_educacao_profissional` | `mat_eja_integrada_educacao_profissional_calculada / mat_eja_total` | 2024 |
| `medio_tecnico_participacao_publica` | expansões positivas públicas / públicas + privadas, agregadas no RS, base 2013 | 2024 |
| `pos_graduacao` | `docentes_pos_graduacao / total_docentes`; `dependencia = total` | 2024 |
| `alfabetizacao_pop_15_mais` | contagens brutas do Censo; snapshots 2010 e 2022 | 2022 |

O registro publicado contém 24 indicadores: 10 habilitados, 12 bloqueados por
metodologia e 2 indisponíveis por ausência de série bruta válida no export atual.

## Exemplos do artefato em 13/07/2026

Os valores abaixo são armazenados sem arredondamento; a cobertura foi de 497/497
municípios e 100% do denominador em cada exemplo.

| Indicador/ano | Numerador | Denominador | Referência RS |
| --- | ---: | ---: | ---: |
| `creche` / 2024 | 215.120 | 482.928 | 44,5449425173% |
| `pre_escola` / 2024 | 249.392 | 264.918 | 94,1393185816% |
| `basico_6_17` / 2024 | 1.572.762 | 1.640.117 | 95,8932807842% |
| `basico_integral` / 2024 | 263.153 | 1.731.520 | 15,1978030863% |
| `escolas_integral` / 2024 | 2.270 | 7.187 | 31,5848058995% |
| `eja_integrada_educacao_profissional` / 2024 | 5.272 | 77.226 | 6,8267163909% |
| `medio_tecnico_participacao_publica` / 2024 | 18.368 | 87.288 | 21,0429841444% |
| `pos_graduacao` / 2024 | 79.239 | 132.414 | 59,8418596221% |
| `alfabetizacao_pop_15_mais` / 2022 | 8.697.640 | 8.976.455 | 96,8939297306% |

## Indicadores bloqueados

Os indicadores abaixo permanecem no registro com
`comparison_status = methodology_pending`, sem série estadual comparável e
sem substituição por zero:

| Indicador | Motivo |
| --- | --- |
| `alfabetizacao` | A base municipal disponível fornece somente taxa, sem numerador e denominador brutos compatíveis. |
| `ideb_anos_iniciais`, `ideb_anos_finais`, `ideb_ensino_medio` | IDEB é índice, não uma razão de contagens agregáveis. |
| `adequacao_ai`, `adequacao_af`, `adequacao_em` | A base disponível fornece percentual de adequação, sem contagens brutas compatíveis. |
| `rendimento_magisterio` | A fonte fornece uma razão de rendimentos, sem numerador e denominador estaduais agregáveis. |
| `escolaridade_media_18_29` | Média de anos de estudo sem contagens brutas; não usar média de médias municipais. |
| `razao_escolaridade_racial_18_29` | Razão entre médias sem numerador e denominador brutos compatíveis. |
| `medio_tecnico_total`, `medio_tecnico` | Indicadores informativos de contagem, sem meta percentual comparável no card. |

Quando um indicador bloqueado ainda possui resultado municipal, o card mantém
Município, Meta PNE, Distância e barra conforme a metodologia histórica, mas não
renderiza o bloco `Referência RS`.

## Indicadores sem referência calculável no export atual

Estes indicadores possuem uma definição bruta prevista no registro, mas a fonte
disponível no export atual não retornou uma série válida para o recorte etário:

- `ensino_medio_ou_basica_completa_pop_15_17`;
- `ensino_fundamental_ou_completo_pop_6_14`.

Eles ficam em `unavailable_indicators`, com `comparison_status = unavailable`,
série vazia e sem substituição por média municipal, zero ou referência de outro
ciclo.

## Validação

```text
npm run check:state-reference
npm run check:state-json:closed
npm run check:state-json
npm run lint
npm run build
npm run test:e2e
npm run test:visual
```
