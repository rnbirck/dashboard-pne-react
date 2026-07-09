# Auditoria metodologica dos indicadores municipais atuais do PNE 2026-2036

Data da auditoria: 2026-07-09.

Escopo: auditoria metodologica e diagnostica dos indicadores ja exibidos no ciclo `pne_2026_2036`. Nao foram alterados calculos, JSONs de dados, paginas, rotas, layout ou textos de UI.

Arquivos lidos: `public/data/indicadores.json`, `src/data/pne2026IndicatorGoalRefs.js`, `src/data/pne2026LegalGoalIndicatorMap.js`, `src/data/pne2026GoalTexts.js`, `data_pipeline/src/views/pne_2026_2036.py`, `data_pipeline/src/views/pne_shared.py`, `data_pipeline/src/views/pne_2026_projections.py`, `src/components/MetaCard.jsx`, `src/components/IndicatorDetail.jsx`, `src/components/IndicatorProjectionPanel.jsx`, `public/data/municipios/*/index.json`, `public/data/municipios/*/details.json` e consultas SQL em `data_pipeline/queries`.

Tambem foi criado o script somente-leitura `scripts/audit_pne2026_indicators.py`, que pode ser executado com:

```bash
python scripts/audit_pne2026_indicators.py
```

## Resumo executivo

- O ciclo `pne_2026_2036` possui 49 indicadores municipais no catalogo e 497 municipios exportados.
- A consistencia aritmetica basica dos JSONs esta boa: nao encontrei divergencia entre `distance`, `meta`, `direction` e `atingida`; as series estao ordenadas; o `end_year` bate com o ultimo ponto da serie; e as projecoes aparecem apenas nos quatro indicadores esperados: `creche`, `pre_escola`, `basico_6_17` e `basico_15_17`.
- A amostra Acegua, Alegrete, Caxias do Sul, Porto Alegre e Xangri-la nao apresentou divergencias entre `public/data` e `data_pipeline/export/data_partitioned`; tambem nao houve divergencia nas comparacoes automaticas possiveis entre `index.json` e componentes de `details.json`.
- Ha um provavel erro metodologico relevante em `medio_tecnico`: o nome e a meta legal indicam participacao da EPT tecnica no ensino medio, mas a formula usa `mat_integrado_total / mat_ept_nivel_medio_total`. Isso mede a composicao interna da EPT de nivel medio, nao a razao sobre estudantes do ensino medio; tambem ignora a modalidade concomitante citada pela meta legal 12.a.
- Ha um provavel erro ou incompatibilidade de denominador em `aee`: 98 municipios tem valores acima de 100% na serie, chegando a 425%. O numerador `quantidade_aee` e o denominador `total_turmas_educacao_especial` nao parecem representar uma taxa limitada a 100%.
- Indicadores informativos estao corretamente marcados como `tracks_goal: false`, mas os JSONs ainda carregam `distance` e `display.distance`. A UI principal evita compara-los como meta, mas o dado exportado fica ambiguo e deve ser limpo em revisao futura.
- Indicadores de cobertura por populacao estimada (`pre_escola`, `basico_6_17`, `basico_15_17`, `creche`) frequentemente passam de 100%. Isso pode ocorrer por estimativas populacionais, mobilidade escolar e oferta localizada no municipio, mas aumenta o risco de interpretar a taxa como cobertura exata da populacao residente.
- Indicadores censitarios de escolaridade populacional sao linhas de base 2010/2022, nao indicadores anuais. SAEB tambem nao e anual e o ultimo ano municipal pode ser 2023, 2021, 2019 ou 2017, conforme disponibilidade.

## Resultado dos checks automaticos

| Validacao | Resultado |
|---|---|
| Municipios unicos auditados | 497 |
| Indicadores no ciclo `pne_2026_2036` | 49 |
| Projecoes 2036 | Presentes e disponiveis somente em `creche`, `pre_escola`, `basico_6_17`, `basico_15_17` |
| Distancia/status incoerentes com meta e direcao | 0 ocorrencias |
| Series fora de ordem ou `end_year` incoerente | 0 ocorrencias |
| Indicadores informativos com `distance`/`display.distance` no JSON | 12 indicadores, todos os 497 municipios |
| Percentuais acima de 100 em indicadores de cobertura populacional | `pre_escola` 429 municipios; `basico_6_17` 163; `basico_15_17` 142; `creche` 11 |
| Percentuais acima de 100 em indicadores que deveriam ser limitados | `aee` 98 municipios; `pos_graduacao` 6 municipios em anos historicos |
| Comparacao publica vs export particionada na amostra | 0 divergencias |
| Comparacao `index.json` vs componentes de `details.json` na amostra | 31 ou 32 comparacoes por municipio, 0 divergencias |

Observacao metodologica: o helper generico `_build_ratio_result` em `pne_shared.py` transforma divisao com denominador zero em 0% por causa de `.fillna(0)`. Isso nao apareceu como divergencia automatica nos JSONs, mas e um risco de metodo: em geral, denominador zero deveria resultar em sem dado, nao em zero.

## Tabela de todos os indicadores atuais

| Indicador | Meta legal | Grupo | Fonte e funcao | Formula, variaveis e filtros | Serie/meta/projecao | Diagnostico |
|---|---:|---|---|---|---|---|
| `creche` | 1.a | Atendimento | INEP Censo Escolar + populacao por idade; `_calc_creche` | `mat_basico_0_3 / pop_0_3 * 100`; denominador agregado por maximo | 2015-2025; meta 60%; distancia sim; projecao 2036 sim | Correto como cobertura, mas nao mede demanda manifesta; 11 municipios passam de 100% |
| `pre_escola` | 1.c | Atendimento | INEP Censo Escolar + populacao por idade; `_calc_pre_escola` | `mat_infantil_pre / pop_4_5 * 100`; denominador agregado por maximo | 2015-2025; meta 100%; distancia sim; projecao 2036 sim | Mede acesso por cobertura estimada; 429 municipios tem algum ponto acima de 100% |
| `basico_6_17` | 4.a | Atendimento | INEP Censo Escolar + populacao por idade; `_calc_basico_6_17` | `(mat_basico_6_10 + mat_basico_11_14 + mat_basico_15_17) / pop_6_17 * 100` | 2015-2025; meta 100%; distancia sim; projecao 2036 sim | Aproxima acesso escolar; 163 municipios passam de 100% |
| `basico_15_17` | 4.a | Atendimento | INEP Censo Escolar + populacao por idade; `_calc_basico_15_17` | `mat_basico_15_17 / pop_15_17 * 100` | 2015-2025; meta 85%; distancia sim; projecao 2036 sim | Parcial: nao inclui jovens de 15-17 que ja concluiram a educacao basica; 142 municipios passam de 100% |
| `basico_integral` | 6.a | Atendimento | INEP Censo Escolar; `_calc_basico_integral` | rede publica; `mat_basico_integral / mat_basico * 100` | 2015-2025; meta dinamica 35%/50%; distancia sim | Coerente com o componente de matriculas em tempo integral; manter com ressalva de qualidade/jornada declarada |
| `escolas_integral` | 6.a | Atendimento | INEP Censo Escolar; `_calc_escolas_integral` | escolas publicas com `mat_basico_integral / mat_basico >= 25%` sobre escolas publicas com matricula | 2015-2025; meta dinamica 50%/65%; distancia sim | Coerente com o componente de escolas; manter |
| `aee` | 10.b | Atendimento | INEP/Censo Escolar ou base derivada de AEE; `_calc_aee` | `quantidade_aee / total_turmas_educacao_especial * 100` | 2015-2025; meta 80%/100%; distancia sim | Revisao urgente: taxa ultrapassa 100% em 98 municipios; denominador nao mede publico do AEE |
| `eja_integrada_educacao_profissional` | 12.c | Atendimento | INEP Censo Escolar/EJA; `_calc_eja_integrada_educacao_profissional` | contagem `mat_eja_curso_tecnico_integrada + mat_eja_fic_integrado_fundamental + mat_eja_fic_integrado_medio` | 2015-2025; sem meta; sem projecao | Deve ser contexto. O JSON ainda exporta `distance` e `display.distance`, o que deve ser removido |
| `medio_tecnico` | 12.a | Atendimento | INEP EPT nivel medio; `_calc_medio_tecnico` | `mat_integrado_total / mat_ept_nivel_medio_total * 100` | disponivel em 178/497 municipios; meta 50%; distancia sim | Provavel erro: denomina EPT total, nao ensino medio total; numerador exclui concomitante; nome/descricao superprometem |
| `medio_tecnico_participacao_publica` | 12.a | Atendimento | INEP EPT nivel medio; `_calc_medio_tecnico_participacao_publica` | expansoes anuais positivas publicas acumuladas / expansoes positivas totais acumuladas | disponivel em 170/497; meta 50%; distancia sim | Coerente com o subcomponente de expansao publica, mas nao cobre a parte federal integrada |
| `subsequente_expansao` | 12.b | Atendimento | INEP EPT nivel medio; `_calc_subsequente_expansao` | crescimento acumulado de `mat_subsequente_total` desde base 2015 | disponivel em 148/497; meta 60%; distancia sim | Coerente como crescimento acumulado; valores podem ser negativos ou acima de 100%, sem validacao 0-100 |
| `alfabetizacao` | 3.a | Rendimento | INEP indicador de alfabetizacao; `_calc_alfabetizacao` | valor `taxa_alfabetizacao`, rede publica | 2019-2025, com lacunas; meta 100%; distancia sim | Coerente com alfabetizacao ao fim do 2o ano, se a fonte mantiver essa definicao |
| `saeb_matematica_anos_iniciais` | 5.a | Rendimento | INEP SAEB; `_calculate_saeb_results` | percentual em nivel adequado ou superior, matematica, etapa 5 | SAEB 2017-2023, nao anual; meta 70%; distancia sim | Parcial: valor principal acompanha adequado, nao a exigencia simultanea de 100% no nivel basico |
| `saeb_matematica_anos_finais` | 5.b | Rendimento | INEP SAEB; `_calculate_saeb_results` | percentual em nivel adequado ou superior, matematica, etapa 9 | SAEB 2017-2023, nao anual; meta 60%; distancia sim | Parcial; nao anual; nao mede desigualdades da meta 5.c |
| `saeb_matematica_ensino_medio` | 5.d | Rendimento | INEP SAEB; `_calculate_saeb_results` | percentual em nivel adequado ou superior, matematica, etapa 12 | SAEB 2019-2023, com lacunas; meta 50%; distancia sim | Parcial; nao anual; cobertura municipal menor no ensino medio |
| `saeb_portugues_anos_iniciais` | 5.a | Rendimento | INEP SAEB; `_calculate_saeb_results` | percentual em nivel adequado ou superior, portugues, etapa 5 | SAEB 2017-2023, nao anual; meta 70%; distancia sim | Parcial; ha um ponto 100,01 por arredondamento/fonte, sem relevancia material |
| `saeb_portugues_anos_finais` | 5.b | Rendimento | INEP SAEB; `_calculate_saeb_results` | percentual em nivel adequado ou superior, portugues, etapa 9 | SAEB 2017-2023, nao anual; meta 60%; distancia sim | Parcial; nao anual |
| `saeb_portugues_ensino_medio` | 5.d | Rendimento | INEP SAEB; `_calculate_saeb_results` | percentual em nivel adequado ou superior, portugues, etapa 12 | SAEB 2019-2023, com lacunas; meta 50%; distancia sim | Parcial; nao anual |
| `idade_regular_quinto` | 4.b | Rendimento | INEP Indicadores Educacionais/distorcao idade-serie; `_calc_idade_regular` | `100 - taxa_distorcao_fundamental_anos_iniciais`, filtro dependencia total | 2017-2025; meta 100%; distancia sim | Proxy aceitavel para conclusao em idade regular; usa etapa agregada dos anos iniciais, nao conclusao individual do 5o ano |
| `idade_regular_nono` | 4.c | Rendimento | INEP Indicadores Educacionais/distorcao idade-serie; `_calc_idade_regular` | `100 - taxa_distorcao_fundamental_anos_finais`, dependencia total | 2017-2025; meta 95%; distancia sim | Proxy aceitavel; nao mede recortes de equidade citados no texto legal |
| `idade_regular_medio` | 4.d | Rendimento | INEP Indicadores Educacionais/distorcao idade-serie; `_calc_idade_regular` | `100 - taxa_distorcao_medio`, dependencia total | 2017-2025; meta 90%; distancia sim | Proxy aceitavel; nao mede recortes de equidade citados no texto legal |
| `adequacao_ai` | 17.a | Corpo docente | INEP Adequacao Docente; `_calc_adequacao` | `percentual_adequacao`, etapa anos iniciais, dependencia total, localizacao total | 2019-2025; meta 100%; distancia sim | Coerente como formacao adequada; responsabilidade municipal deve ser lida com cautela por incluir dependencias totais |
| `adequacao_af` | 17.a | Corpo docente | INEP Adequacao Docente; `_calc_adequacao` | `percentual_adequacao`, etapa anos finais, dependencia total, localizacao total | 2019-2025; meta 100%; distancia sim | Coerente com ressalva de dependencia administrativa |
| `adequacao_em` | 17.a | Corpo docente | INEP Adequacao Docente; `_calc_adequacao` | `percentual_adequacao`, ensino medio, dependencia total, localizacao total | 2019-2025; meta 100%; distancia sim | Coerente com ressalva maior: ensino medio nao e responsabilidade municipal direta |
| `pos_graduacao` | 17.f | Corpo docente | INEP docentes pos-graduacao; `_calc_pos_graduacao` | `percentual_pos_graduacao` | 2015-2025; meta 70%; distancia sim | Metodologia esperada, mas 6 municipios tem pontos historicos acima de 100%; revisar fonte/denominador desses anos |
| `rendimento_magisterio` | 17.b | Corpo docente | base oficial de rendimento docente; `_calc_rendimento_magisterio` | `razao_percentual_remuneracao_media` | 2014-2024; disponivel em 464/497; meta 100%; distancia sim | Coerente como razao de rendimento; pode exceder 100%; fonte/escopo ocupacional precisam estar documentados |
| `temporarios` | 17.d | Corpo docente | INEP docentes temporarios; `_calc_temporarios` | dependencia publica; `percentual_temporarios`; direcao `at_most` | 2015-2025; meta maxima 30%; distancia sim | Formula e sinal estao corretos; texto de apoio pode dizer "faltam -x p.p." e a barra do card nao e direction-aware |
| `internet` | 7.a | Infraestrutura | INEP Censo Escolar; `_calc_infra` | `percentual_internet`, denominador `qntd_escolas`, todas as dependencias | 2015-2025; sem meta; sem projecao | Contexto. Nao mede alta velocidade, uso pedagogico nem apenas escolas publicas |
| `internet_alunos` | 7.a | Infraestrutura | INEP Censo Escolar; `_calc_infra` | `percentual_internet_alunos`, todas as escolas | 2019-2025; sem meta | Contexto; proxy parcial de conectividade para estudantes |
| `internet_aprendizagem` | 7.a | Infraestrutura | INEP Censo Escolar; `_calc_infra` | `percentual_internet_aprendizagem`, todas as escolas | 2019-2025; sem meta | Contexto; aproxima uso pedagogico, mas nao velocidade/qualidade |
| `internet_comunidade` | sem meta legal | Infraestrutura | INEP Censo Escolar; `_calc_infra` | `percentual_internet_comunidade`, todas as escolas | 2019-2025; sem meta | Manter sem meta legal; contexto apenas |
| `acesso_internet_computador` | sem meta legal | Infraestrutura | INEP Censo Escolar; `_calc_infra` | `percentual_acesso_internet_computador`, todas as escolas | 2019-2025; sem meta | Manter sem meta legal; contexto apenas |
| `acesso_internet_disp_pessoais` | sem meta legal | Infraestrutura | INEP Censo Escolar; `_calc_infra` | `percentual_acesso_internet_disp_pessoais`, todas as escolas | 2019-2025; sem meta | Manter sem meta legal; contexto apenas |
| `rede_local` | 7.a | Infraestrutura | INEP Censo Escolar; `_calc_infra` | `percentual_rede_local`, todas as escolas | 2019-2025; sem meta | Contexto; nao equivale a wifi interno nem alta velocidade |
| `rede_wireless` | 7.a | Infraestrutura | INEP Censo Escolar; `_calc_infra_totalizado` | `(rede_local_wireless + cabo_wireless) / qntd_escolas * 100`, todas as escolas | 2019-2025; meta 50%/75%/100%; distancia sim | Proxy parcial; legal fala escolas publicas, alta velocidade e uso pedagogico; revisar se deve ter distancia |
| `banda_larga` | 7.a | Infraestrutura | INEP Censo Escolar; `_calc_infra_totalizado` | `escolas_com_banda_larga / qntd_escolas * 100`, todas as escolas | 2015-2025; meta 50%/75%/100%; distancia sim | Proxy parcial; banda larga declarada nao garante alta velocidade adequada para uso pedagogico |
| `educacao_ambiental` | 8.c | Infraestrutura | INEP Censo Escolar; `_calc_infra_totalizado` | `escolas_com_educacao_ambiental / qntd_escolas * 100` | 2024-2025; meta 100%; distancia sim | Coerente como declaracao escolar; ainda nao valida qualidade/aderencia curricular |
| `conselho_escolar` | 18.b | Infraestrutura | INEP Censo Escolar; `_calc_infra_totalizado` | escolas publicas com orgao conselho escolar / escolas publicas total | 2019-2025; meta 100%; distancia sim | Coerente como proxy administrativo; nao valida funcionamento substantivo do conselho |
| `proposta_pedagogica` | sem meta legal | Infraestrutura | INEP Censo Escolar; `_calc_infra` | escolas publicas com resposta em `tp_proposta_pedagogica` / escolas publicas total | 2015-2025; sem meta | Manter sem meta legal; depende de interpretacao da variavel de resposta |
| `salas_climatizadas` | 8.b | Infraestrutura | INEP Censo Escolar; `_calc_infra_totalizado` | `qt_salas_utiliza_climatizadas / qt_salas_utilizadas * 100` | 2019-2025; meta 100%; distancia sim | Proxy parcial: conforto termico e padrao fisico nao se reduzem a sala climatizada |
| `salas_acessiveis` | 19.c | Infraestrutura | INEP Censo Escolar; `_calc_infra_totalizado` | `qt_salas_utilizadas_acessiveis / qt_salas_utilizadas * 100` | 2019-2025; meta 100%; distancia sim | Proxy parcial de acessibilidade; nao cobre escola inteira, transporte, materiais ou atendimento |
| `desktop_aluno` | sem meta legal | Infraestrutura | INEP Censo Escolar; `_calc_infra` | escolas com desktop para alunos / total de escolas | 2019-2025; sem meta | Manter sem meta legal; contexto apenas |
| `comp_portatil_aluno` | sem meta legal | Infraestrutura | INEP Censo Escolar; `_calc_infra` | escolas com portatil para alunos / total de escolas | 2019-2025; sem meta | Manter sem meta legal; contexto apenas |
| `tablet_aluno` | sem meta legal | Infraestrutura | INEP Censo Escolar; `_calc_infra` | escolas com tablet para alunos / total de escolas | 2019-2025; sem meta | Manter sem meta legal; contexto apenas |
| `alfabetizacao_pop_15_mais` | 11.a | Escolaridade | IBGE Censo Demografico; `_calc_alfabetizacao_pop_15_mais` | `taxa_alfabetizacao_15_mais` | 2010/2022; meta 97%/100%; distancia sim | Correto como linha censitaria; nao e indicador anual municipal |
| `fundamental_concluido_18_mais` | 11.b | Escolaridade | IBGE Censo Demografico + populacao por idade; `_calc_fundamental_concluido_18_mais` | `populacao_18_mais_ensino_fundamental_concluido / populacao_18_mais_total * 100` | 2010/2022; meta 85%; distancia sim | Recorte 18+ nao corresponde ao texto 15+; manter como parcial ou revisar nome/meta |
| `fundamental_concluido_15_29` | 11.b | Escolaridade | IBGE Censo Demografico + populacao por idade; `_calc_fundamental_concluido_15_29` | populacao 15-29 com fundamental concluido / populacao 15-29 | 2010/2022; meta 100%; distancia sim | Coerente com componente de universalizacao 15-29; nao anual |
| `medio_concluido_18_mais` | 11.c | Escolaridade | IBGE Censo Demografico + populacao por idade; `_calc_medio_concluido_18_mais` | `populacao_18_mais_ensino_medio_concluido / populacao_18_mais_total * 100` | 2010/2022; meta 75%; distancia sim | Coerente com componente 18+; nao anual |
| `medio_concluido_18_29` | 11.c | Escolaridade | IBGE Censo Demografico + populacao por idade; `_calc_medio_concluido_18_29` | `populacao_18_29_ensino_medio_concluido / populacao_18_29_total * 100` | 2010/2022; meta 100%; distancia sim | Coerente com componente 18-29; nao anual |

## Agrupamento por diagnostico

### Indicadores tecnicamente corretos para o dashboard

Estes indicadores podem permanecer como indicadores de acompanhamento, desde que a interface e a documentacao mantenham as ressalvas de fonte e periodicidade:

- `basico_integral`
- `escolas_integral`
- `alfabetizacao`
- `idade_regular_quinto`
- `idade_regular_nono`
- `idade_regular_medio`
- `educacao_ambiental`
- `conselho_escolar`
- `adequacao_ai`
- `adequacao_af`
- `adequacao_em`
- `rendimento_magisterio`
- `temporarios`, com ajuste de linguagem para meta do tipo `at_most`
- `fundamental_concluido_15_29`
- `medio_concluido_18_mais`
- `medio_concluido_18_29`

### Corretos com ressalva metodologica forte

- `creche`, `pre_escola`, `basico_6_17`: medem cobertura estimada por municipio, nao necessariamente atendimento da populacao residente. Valores acima de 100% devem ser tratados como sinal de limite metodologico, nao como "mais que universalizado".
- `basico_15_17`: alem do problema de valores acima de 100%, nao conta jovens que ja concluiram a educacao basica fora da escola.
- Indicadores SAEB: o valor principal mede adequado ou superior por disciplina/etapa. A meta legal tambem fala em 100% no nivel basico, e o SAEB nao e anual.
- `alfabetizacao_pop_15_mais`, `fundamental_concluido_18_mais`, `fundamental_concluido_15_29`, `medio_concluido_18_mais`, `medio_concluido_18_29`: sao indicadores censitarios 2010/2022, nao serie anual.
- `rede_wireless` e `banda_larga`: podem ser contexto de conectividade, mas nao medem integralmente internet de alta velocidade adequada ao uso pedagogico em escolas publicas.
- `salas_climatizadas` e `salas_acessiveis`: sao proxies de infraestrutura fisica, nao medidas diretas das metas 8.b e 19.c.

### Provavel erro ou inconsistencia a revisar antes de manter status/distancia

- `medio_tecnico`: formula, denominador e nome nao estao alinhados a meta 12.a. Recomendacao: nao tratar como cumprimento da meta enquanto a formula nao for revisada.
- `aee`: valores acima de 100% indicam denominador inadequado ou fonte nao comparavel ao numerador. Recomendacao: revisar fonte, variavel e denominador antes de exibir distancia.
- `pos_graduacao`: 6 municipios tem pontos historicos acima de 100%. Recomendacao: auditar os registros de fonte ou denominador desses anos.
- Helper `_build_ratio_result`: denominador zero vira 0%. Recomendacao: ajustar futuramente para retornar sem dado quando o denominador for zero, depois de avaliar impacto.

### Nomes ou leituras que podem superprometer

- `medio_tecnico`: "matriculas do ensino medio integradas..." sugere razao sobre ensino medio; a formula atual e sobre EPT de nivel medio.
- `aee`: "oferta de AEE e salas de recursos na educacao especial" sugere cobertura do publico do AEE; a formula atual compara turmas/salas com total de turmas de educacao especial.
- `rede_wireless` e `banda_larga`: se associadas diretamente a meta 7.a, podem sugerir alta velocidade pedagogica em escolas publicas, o que a formula nao garante.
- `salas_climatizadas`: "conforto termico" e mais amplo que sala climatizada.
- `salas_acessiveis`: acessibilidade escolar e mais ampla que salas utilizadas acessiveis.
- `fundamental_concluido_18_mais`: meta 11.b fala 15+ para o componente de 85%, mas o indicador usa 18+.

### Indicadores que devem ser apenas contexto

Ja estao marcados como `tracks_goal: false` e devem continuar sem meta legal ou distancia:

- `eja_integrada_educacao_profissional`
- `internet`
- `internet_alunos`
- `internet_aprendizagem`
- `internet_comunidade`
- `acesso_internet_computador`
- `acesso_internet_disp_pessoais`
- `rede_local`
- `proposta_pedagogica`
- `desktop_aluno`
- `comp_portatil_aluno`
- `tablet_aluno`

Tambem recomendo avaliar se `rede_wireless`, `banda_larga`, `salas_climatizadas` e `salas_acessiveis` deveriam aparecer como "proxy com meta de referencia" ou apenas "indicador de contexto", porque a distancia atual pode induzir leitura direta da meta legal.

### Indicadores que nao devem exibir distancia

De forma obrigatoria: todos os 12 indicadores `tracks_goal: false` listados acima. O dado exportado hoje ainda contem `distance` e `display.distance`, apesar de a UI principal usar "variacao" e "sem meta comparavel".

De forma recomendada ate revisao metodologica: `medio_tecnico`, `aee`, `rede_wireless`, `banda_larga`, `salas_climatizadas`, `salas_acessiveis`.

## Revisoes especiais solicitadas

### Creche e meta 1.a

O indicador `creche` usa matriculas/local de oferta sobre populacao municipal estimada de 0 a 3 anos. Isso e uma cobertura estimada, nao atendimento a 100% da demanda manifesta. A projecao 2036 tambem projeta cobertura, nao demanda manifesta. Recomendacao: manter como acompanhamento de cobertura e nao afirmar cumprimento da parte "demanda manifesta".

### Conectividade da meta 7.a

Os indicadores atuais de conectividade nao medem integralmente "internet de alta velocidade adequada para uso pedagogico de estudantes e professores, inclusive com redes internas wi-fi, em escolas publicas". A consulta de infraestrutura usa `qntd_escolas` total para varios indicadores, nao somente escolas publicas. `rede_wireless` e `banda_larga` sao componentes observaveis, mas nao suficientes para status direto da meta 7.a.

### Metas 8.b e 19.c

`salas_climatizadas` e `salas_acessiveis` sao proxies por sala utilizada. A meta 8.b fala padroes de conforto termico do estabelecimento; a meta 19.c e mais ampla que sala de aula acessivel. Recomenda-se manter como contexto/proxy ou revisar o uso de distancia.

### SAEB e aprendizagem

Os seis indicadores SAEB principais medem o percentual em nivel adequado ou superior por disciplina e etapa. A meta legal tambem exige nivel basico para 100% dos estudantes, e o SAEB nao e anual. A leitura deve ser "indicador parcial de aprendizagem", nao cumprimento integral da meta.

### Recortes da meta 11.b

`fundamental_concluido_18_mais` esta associado a 11.b, mas a primeira parte da meta fala populacao de 15 anos ou mais. O indicador `fundamental_concluido_15_29` cobre a segunda parte, de universalizacao de 15 a 29 anos. Recomenda-se revisar nome, dashboardText ou associacao do primeiro indicador.

### EPT nas metas 12.a, 12.b e 12.c

`medio_tecnico` precisa de revisao de denominador e numerador. `medio_tecnico_participacao_publica` e coerente com a expansao publica acumulada, mas cobre apenas um subcomponente da 12.a. `subsequente_expansao` e coerente como crescimento acumulado. `eja_integrada_educacao_profissional` deve continuar como contexto sem meta/distancia.

### Docentes nas metas 17.a, 17.b, 17.d e 17.f

`adequacao_ai`, `adequacao_af` e `adequacao_em` sao bons indicadores educacionais, mas usam dependencia total. `rendimento_magisterio` deve documentar claramente a fonte e escopo ocupacional. `temporarios` tem direcao `at_most` correta nos dados, mas a leitura textual deve evitar frases do tipo "abaixo da referencia" ou "faltam -x p.p.". `pos_graduacao` precisa de revisao dos pontos historicos acima de 100%.

### Indicadores pendentes de tecnologia e proposta pedagogica

`internet_comunidade`, `acesso_internet_computador`, `acesso_internet_disp_pessoais`, `proposta_pedagogica`, `desktop_aluno`, `comp_portatil_aluno` e `tablet_aluno` devem continuar sem meta legal associada. Eles sao informativos e nao devem entrar em status, distancia, projecao ou conclusao de meta.

## Fontes oficiais recomendadas por tipo de indicador

| Tipo | Fonte oficial atual/recomendada | Observacao |
|---|---|---|
| Matricula, etapa, modalidade, EPT, EJA, tempo integral | INEP/Censo Escolar da Educacao Basica | Adequado para serie anual municipal de oferta localizada; cuidado com populacao residente e mobilidade |
| Populacao por idade | IBGE/estimativas e bases etarias usadas no pipeline | Denominadores municipais por idade podem gerar taxas acima de 100%; documentar metodologia |
| Escolaridade da populacao | IBGE/Censo Demografico | Municipal, mas decenal; usar como linha censitaria, nao serie anual |
| Aprendizagem | INEP/SAEB e indicadores derivados | Municipal quando disponivel, mas nao anual e com lacunas |
| Docentes | INEP/Indicadores Educacionais e Censo Escolar | Bom para formacao/adequacao/vinculo; responsabilidade municipal depende da dependencia usada |
| Infraestrutura | INEP/Censo Escolar | Bom para variaveis observaveis; muitas metas exigem qualidade/padrao mais amplo |
| Remuneracao/rendimento docente | Base oficial de rendimento usada no pipeline; documentar origem final | Confirmar cobertura municipal, ocupacoes, vinculos e tratamento de pequenas contagens |

## Recomendacoes priorizadas

1. Revisar `medio_tecnico` antes de continuar usando distancia/status de meta 12.a. A formula atual nao mede a razao legal proposta.
2. Revisar `aee` e seu denominador. Enquanto houver valores acima de 100%, nao usar como status direto da meta 10.b.
3. Remover ou anular `distance` e `display.distance` dos indicadores `tracks_goal: false` no proximo ciclo de manutencao dos dados.
4. Avaliar se `rede_wireless`, `banda_larga`, `salas_climatizadas` e `salas_acessiveis` devem perder distancia ou ganhar rotulo explicito de proxy parcial.
5. Ajustar leituras de indicadores `at_most`, especialmente `temporarios`, para evitar interpretacao "quanto maior melhor".
6. Documentar que indicadores censitarios sao 2010/2022 e que SAEB nao e anual.
7. Investigar pontos acima de 100% em `pos_graduacao` e decidir se sao erro de fonte, denominador, duplicidade ou arredondamento indevido.
8. Tratar denominador zero em `_build_ratio_result` como sem dado, depois de medir o impacto em todos os indicadores afetados.

## Duvidas para revisao humana

- A meta 12.a deve ser acompanhada por `integrado + concomitante` sobre matriculas totais do ensino medio, ou por outra definicao pactuada de "estudantes matriculados no ensino medio"?
- Para 7.a, a distancia de `rede_wireless` e `banda_larga` deve permanecer mesmo sendo proxy, ou o dashboard deve mostrar esses itens apenas como contexto?
- Para 8.b e 19.c, a instituicao aceita sala climatizada/acessivel como proxy com meta de 100%, ou prefere retirar distancia?
- Qual e a fonte final de `rendimento_professores_razao_percentual` e quais filtros ocupacionais/territoriais foram aplicados?
- O indicador `fundamental_concluido_18_mais` deve continuar associado a 11.b ou deve ser substituido/renomeado para refletir 15+?
- Como tratar taxas de cobertura acima de 100%: manter valor bruto com nota, limitar visualmente a 100%, ou exibir alerta metodologico?

