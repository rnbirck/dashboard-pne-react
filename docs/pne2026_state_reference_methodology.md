# Referência estadual do RS — PNE 2026-2036

## Escopo e regra central

A referência estadual é calculada para todo o Rio Grande do Sul, com universo
fixo de 497 municípios, independentemente do município selecionado na interface.
Para indicadores de proporção, a regra é:

```text
Referência RS (ano) = 100 × Σ numeradores municipais válidos / Σ denominadores municipais válidos
```

O numerador e o denominador são consolidados por município e ano antes da soma
estadual. A média de percentuais municipais não é usada. Nulos não são zero;
um par sem numerador ou denominador é excluído, denominador zero produz valor
nulo e o arredondamento ocorre apenas na apresentação.

O artefato também guarda `municipal_coverage_percent` e
`denominator_coverage_percent`. O primeiro mede municípios com par válido; o
segundo mede a fração do universo estadual de escolas, salas ou população que
entrou no denominador, conforme o indicador.

## Arquivos e fluxo

- `data_pipeline/src/pne_state_reference.py`: registro, agregadores, regras especiais, auditoria e projeções estaduais.
- `data_pipeline/queries/infraestrutura_escolar_referencia.sql`: fonte por escola do Censo Escolar, sem `COALESCE` que transforme nulo em zero.
- `data_pipeline/src/data/repository.py` e `data_pipeline/src/data_loader.py`: registro do dataset por escola.
- `data_pipeline/src/views/pne_shared.py`: cálculo municipal comum também deixa de preencher razão inválida com zero.
- `data_pipeline/scripts/export_static_data.py`: gera `pne_2026_2036/referencia_estadual.json` sobre o universo completo do RS.
- `data_pipeline/scripts/partition_static_data.py`: copia o artefato para a raiz estática, sem duplicá-lo em 497 payloads municipais.
- `data_pipeline/src/municipal_diagnostic.py`: cruza o ponto estadual com a
  observação municipal do mesmo ano, calcula a distribuição e serializa apenas
  estatísticas compactas em `diagnostico_v2`.
- `src/data/staticData.js`: carrega a referência estadual sob demanda.
- `src/utils/stateReference.js` e `src/components/MetaCard.jsx`: só exibem comparação quando município e RS possuem o mesmo ano comparável.
- `src/styles/pne-cycle-experience.css`: estilo secundário da referência usando tokens existentes; não há novo padrão em `App.css`.

O arquivo publicado é `public/data/pne_2026_2036/referencia_estadual.json`.
Ele contém `registry`, `indicators`, `projections`, `totals_audit` e a versão
`pne2026-rs-reference-v1`.

Cada registro de indicador contém, no mínimo, `indicator_id`,
`aggregation_method`, `numerator_definition`, `denominator_definition`,
`filters`, `source`, `source_type`, `null_policy`, `methodology_version`,
`comparison_status` e `notes`. Cada ponto anual contém `indicator_id`, `year`,
`value`, `numerator`, `denominator`, `aggregation_method`,
`municipalities_valid`, `municipalities_expected`,
`municipal_coverage_percent`, `denominator_coverage_percent`, `source`,
`source_type`, `methodology_version`, `comparison_status` e `notes`.

No ciclo vigente, o registro também publica `unit` e `compatibility`, com regra
de mesmo indicador e mesmo ano, equivalência curada de fórmula/universo/base
territorial, filtros de dependência e versão metodológica. O diagnóstico bloqueia
a diferença estadual quando qualquer uma dessas condições falha.

## Uso no Diagnóstico municipal

O benchmark municipal não lê uma média pronta. O pipeline usa a Referência RS
agregada deste artefato e calcula, sobre os resultados municipais do mesmo
indicador e ano, mediana, Q1, Q3 e percentil direcional. A distribuição exige
ao menos 20 municípios e cobertura de 80%; valores fora do domínio são
excluídos, exceto nos quatro indicadores de base territorial mista cuja política
aceita valores acima de 100%.

Diferença favorável positiva sempre significa situação municipal mais favorável:
`município - RS` em `at_least` e `RS - município` em `at_most`. Diferenças de
até 0,1 p.p. em módulo são equivalentes. `basico_15_17` pode receber este
benchmark contextual mesmo mantendo a distância legal bloqueada.

O pipeline gera `stateBenchmarkSummary` somente sobre indicadores com resultado
na síntese municipal e escolhe até três diferenças desfavoráveis e dois
destaques favoráveis. O React consome as listas sem recalculá-las e a referência
estadual não altera `attentionItems`.

## Indicadores comparáveis habilitados

### Atendimento e EPT

- `creche`: `mat_basico_0_3 / pop_0_3`, denominador municipal por máximo do ano.
- `pre_escola`: `mat_infantil_pre / pop_4_5`, denominador municipal por máximo do ano.
- `basico_6_17`: `mat_basico_6_17 / pop_6_17`, denominador municipal por máximo do ano.
- `basico_15_17`: `mat_basico_15_17 / pop_15_17`; preserva a definição que inclui frequência ou conclusão da educação básica.
- `basico_integral`: `mat_basico_integral / mat_basico`, filtro `dependencia = publica`.
- `medio_tecnico`: `mat_profissional_tecnico / mat_medio`, mesmo ano e estágio/modalidade do indicador municipal.
- `escolas_integral`: classificação individual de cada escola pública elegível com corte de 25%; depois, escolas classificadas / escolas com par válido.
- `medio_tecnico_participacao_publica`: expansões anuais positivas da série estadual de EPT pública e privada a partir de 2015.
- `subsequente_expansao`: `(total estadual do ano / total estadual de 2015 - 1) × 100`; base 2015 exata e base zero nula.

### Corpo docente

- `pos_graduacao`: `docentes_pos_graduacao / total_docentes`, filtro `dependencia = total`.
- `temporarios`: `docentes_temporarios / total_docentes`, filtro `dependencia = publica`.

### Infraestrutura

Os 17 indicadores usam registros por escola do Censo Escolar e preservam os
filtros do indicador municipal: o universo geral usa todas as escolas
retornadas pelo Censo; `conselho_escolar` e `proposta_pedagogica` usam apenas
escolas públicas federal, estadual e municipal com `mat_basico >= 1`.

- Escolas: `internet`, `internet_alunos`, `internet_aprendizagem`, `internet_comunidade`, `acesso_internet_computador`, `acesso_internet_disp_pessoais`, `rede_local`, `rede_wireless`, `banda_larga`, `educacao_ambiental`, `desktop_aluno`, `comp_portatil_aluno` e `tablet_aluno`.
- Respostas públicas: `conselho_escolar` e `proposta_pedagogica`; proposta válida é o código 0 ou 1.
- Salas: `salas_climatizadas` e `salas_acessiveis`, com soma de salas utilizadas e seus numeradores somente quando o par da escola é válido.

Para cada indicador, a cobertura do denominador estadual é calculada contra o
universo de escolas ou salas elegíveis, e não contra a contagem de municípios.

### Escolaridade da população

Os cinco indicadores usam contagens do Censo e população oficial por idade,
sempre com os dois snapshots disponíveis: 2010 e 2022. São eles
`alfabetizacao_pop_15_mais`, `fundamental_concluido_18_mais`,
`fundamental_concluido_15_29`, `medio_concluido_18_mais` e
`medio_concluido_18_29`. Não há interpolação, projeção ou série anual contínua.

## Indicadores sem comparação habilitada

O registro mantém estes indicadores com `comparison_status = methodology_pending`
e sem série estadual comparável:

- `aee`: denominador municipal inadequado, com possibilidade de valor acima de 100%;
- `eja_integrada_educacao_profissional`: município e RS ainda não estão na mesma razão de numerador/denominador;
- `alfabetizacao` e `rendimento_magisterio`: não há fonte estadual agregável equivalente;
- `saeb_matematica_anos_iniciais`, `saeb_matematica_anos_finais`, `saeb_matematica_ensino_medio`, `saeb_portugues_anos_iniciais`, `saeb_portugues_anos_finais` e `saeb_portugues_ensino_medio`: não usar média municipal nem peso de matrícula;
- `idade_regular_quinto`, `idade_regular_nono`, `idade_regular_medio`, `adequacao_ai`, `adequacao_af` e `adequacao_em`: não reconstruir por média municipal.

Esses itens não recebem substituição por `0%` e não exibem `Referência RS` ou
`Município vs RS`.

## Regras especiais e projeções

- A participação pública na expansão da EPT agrega primeiro os totais públicos e privados de todo o RS, calcula diferenças anuais e acumula somente expansões positivas. Quedas, total de expansão não positivo e mudanças de cobertura ficam registrados em `notes`.
- A expansão subsequente compara o total estadual de cada ano ao total estadual de 2015. A base não é escolhida pelo primeiro ano positivo disponível.
- A classificação de escolas integrais ocorre escola a escola; calcular 25% sobre o total estadual é incorreto e não é feito.
- Projeções estaduais projetam numerador e denominador da série estadual agregada (`aggregate_state_series_forecast`). Não recebem resultados municipais e, portanto, não fazem média de projeções municipais. Censos permanecem sem projeção.
- A comparação de interface exige que `end_year` municipal e `year` estadual coincidam. Sem o mesmo ano, o bloco secundário não é renderizado.

## Exemplos do artefato gerado

Valores abaixo são armazenados sem arredondamento:

| Indicador/ano | Numerador | Denominador | Referência RS |
|---|---:|---:|---:|
| `creche` 2025 | 201.041 | 470.903 | 42,6926564494% |
| `internet` 2025 | 9.866 | 11.046 | 89,3173999638% |
| `escolas_integral` 2025 | 2.592 | 7.183 | 36,0852011694% |
| `alfabetizacao_pop_15_mais` 2022 | 8.697.640 | 8.976.455 | 96,8939297306% |
| `medio_tecnico_participacao_publica` 2025 | 11.345 | 62.451 | 18,1662423340% |
| `subsequente_expansao` 2025 | 45.115 | 77.564 | -41,8351296993% |

No card, a formatação de percentual é uma etapa de apresentação; a diferença
é exibida como `Município vs RS` em pontos percentuais, com sinal.

## Auditoria de totais

O export de 13/07/2026 registrou, sem forçar igualdade manual:

- escolas 2025: 11.046 na visão agregada e 11.046 no registro por escola — reconciliado;
- salas utilizadas 2025: 94.951 nas duas fontes — reconciliado;
- matrículas de 0 a 3 anos 2025: 201.041 nas duas fontes — reconciliado;
- docentes da educação básica 2025: 134.950 na fonte de pós-graduação contra 161.461 no registro por escola, divergência de -26.511 — registrada para investigação;
- população de 0 a 3 anos 2025: comparação independente não disponível no pipeline — não foi feito ajuste.

Esses resultados ficam em `totals_audit` e não alteram os numeradores ou
denominadores do cálculo estadual.

## Validação

```text
npm run check:state-reference
npm run lint
npm run build
```

O teste de referência cobre razão de somas, pesos de denominador, nulos,
denominador zero, pares incompletos, arredondamento tardio, classificação
individual de escolas, snapshots censitários, cobertura e projeção baseada
exclusivamente na série estadual.
