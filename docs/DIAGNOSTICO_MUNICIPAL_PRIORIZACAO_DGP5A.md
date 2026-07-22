# DGP5-A — Auditoria e proposta de priorização do Diagnóstico municipal completo

**Data:** 21 de julho de 2026  
**Modo:** auditoria e proposta; nenhuma implementação ou materialização  
**Universo:** 497 municípios, ciclo PNE 2026–2036

## Resumo executivo

- **A grade pública possui 34 pares agregados `goalId × indicatorId`.** Eles aparecem 15.896 vezes nos 497 municípios, com 26 a 34 cards por município e média de 31,98. Os 49 indicadores técnicos não são o universo correto: 15 nunca chegam à grade pública atual.
- **O Diagnóstico v1 cobre 20 dos 34 pares.** A ampliação integral acrescentaria 14 pares e 6.777 resultados municipais disponíveis, crescimento de 74,3% sobre os 9.119 resultados hoje materializados.
- **A proposta institucional é de 9 essenciais fixos e 25 complementares.** Não se propõe excluir nenhum card agregado real. A prioridade não depende de distância, classificação, RS, ranking, trajetória ou disponibilidade do município.
- **A implementação deve criar `pne2026-public-diagnostic-v2`.** A versão externa `municipal-diagnostic-v2` pode permanecer, mas o contrato público aninhado muda de universo, metadata, temas e semântica. A DGP5-B só deve materializar depois de resolver as divergências metodológicas e de proveniência registradas nas seções 19, 22 e 23.

## 1. Decisão de produto

O Diagnóstico futuro deve apresentar duas camadas derivadas de uma única metadata institucional versionada:

1. **Resultados essenciais para a leitura inicial:** 9 pares fixos, iguais nos 497 municípios, em ordem editorial própria.
2. **Todos os resultados das metas:** os 34 pares agregados publicáveis, descontados apenas os que não tenham valor para o município; os 25 pares não essenciais ficam recolhidos e organizados por tema.

A lista de essenciais não pode existir no React. O desempenho municipal apenas determina classificação, valores e compatibilidade com filtros; nunca altera `tier` ou `priorityOrder`.

Nenhum dos 34 pares é proposto como `excluded`. As limitações encontradas exigem correção ou leitura relacional explícita antes da DGP5-B, não descarte silencioso.

## 2. Fonte canônica dos cards do PNE

A cadeia real usada pela página PNE 2026–2036 é:

1. `data_pipeline/src/views/pne_2026_2036.py::INDICADORES` define o catálogo e os cálculos.
2. `data_pipeline/scripts/export_static_data.py::_serialize_categories` remove somente `compute` e callables e produz `public/data/indicadores.json`.
3. `src/pages/CyclePage.jsx` lê `cycles.pne_2026_2036.categories` e os resultados do município.
4. `normalizePopulationPercentResults` aplica a apresentação vigente para percentuais populacionais.
5. `filterPneComparableCategories` determina quais itens realmente chegam à grade pública.
6. `buildThematicGroups` organiza os cards e `MetaCard` renderiza o valor principal.

Portanto, a fonte da auditoria foi a união dos itens devolvidos por esse fluxo para cada um dos 497 `public/data/municipios/<slug>/index.json`. Não foi usada a lista dos 49 indicadores técnicos, uma captura isolada nem a allowlist atual do Diagnóstico.

Há hoje uma cisão de metadata: `CyclePage` injeta `metaRef` pelo mapa manual `src/data/pne2026IndicatorGoalRefs.js`, enquanto o contrato técnico possui `legalValidation.legalGoalRefs`. O card `eja_integrada_educacao_profissional_percentual` prova a divergência: aparece em 338 municípios, resolve tecnicamente para `12.c`, mas o mapa React não contém essa relação e o identifica genericamente como “Indicador”. A DGP5-B deve eliminar essa duplicidade.

## 3. Auditoria dos 497 municípios

Foram lidos os 497 slugs canônicos de `public/data/municipios_index.json`, os respectivos `index.json` e `diagnostico.json`, além do catálogo, referência estadual e configuração pública v1.

| Medida | Resultado |
|---|---:|
| Municípios auditados | 497 |
| Indicadores técnicos do ciclo | 49 |
| Pares agregados que chegam à grade pública | 34 |
| Metas legais distintas nesses pares | 24 |
| Ocorrências de cards públicos | 15.896 |
| Mínimo / máximo por município | 26 / 34 |
| Média por município | 31,98 |
| Distribuição | 26: 1; 27: 3; 28: 6; 29: 15; 30: 34; 31: 134; 32: 150; 33: 24; 34: 130 |
| Pares no Diagnóstico v1 | 20 |
| Resultados materializados no Diagnóstico v1 | 9.119 |
| Pares novos necessários | 14 |
| Ocorrências novas disponíveis | 6.777 |
| Comparações estaduais renderizáveis na grade PNE | 9.601 |
| Tendências direcionais (`up`, `stable`, `down`) | 5.160 |

Para os 34 candidatos, a quantidade de municípios em que o card passa pelo predicado público coincide com a quantidade com valor principal finito. “Sem valor” na matriz significa que o card não é apresentado naquele município.

## 4. Quantidade de pares `goalId × indicatorId`

O total é **34 pares únicos**, também correspondentes a 34 `indicatorId` únicos. Eles cobrem 24 metas legais distintas.

O conjunto de metas difere do escopo v1 embora a contagem permaneça 24:

- entra `12.c`, hoje ausente da configuração pública;
- sai `3.a`, porque `alfabetizacao` não produz card publicável em nenhum dos 497 municípios;
- os outros 23 `goalId` permanecem.

## 5. Matriz completa PNE × Diagnóstico

### 5.1 Identidade, medida e vínculo

`partial_component` significa que o card mede uma dimensão da meta. `contextual_proxy` é a extensão proposta para os dois casos em que o recorte do card não coincide com o recorte legal e não deve ser apresentado como medida de cumprimento.

| Meta | `indicatorId` | Nome público | Descrição curta | Tema de apresentação | Etapa ou população | Unidade | Prazo usado pelo card | Direção | Vínculo recomendado |
|---|---|---|---|---|---|---|---|---|---|
| 1.a — Creche | `creche` | População de 0 a 3 anos que frequenta a escola/creche | Cobertura escolar ou em creche da população de 0 a 3 anos | Educação Básica | 0 a 3 anos | % | 2036 | `at_least` | `partial_component` |
| 1.c — Pré-escola | `pre_escola` | População de 4 a 5 anos que frequenta a escola/creche | Cobertura escolar ou em creche da população de 4 a 5 anos | Educação Básica | 4 a 5 anos | % | 2028 | `at_least` | `direct` |
| 4.a — Acesso escolar 6 a 17 anos | `basico_6_17` | População de 6 a 17 anos que frequenta a educação básica | Cobertura da população de 6 a 17 anos | Educação Básica | 6 a 17 anos | % | 2029 | `at_least` | `direct` |
| 4.a — Acesso escolar 6 a 17 anos | `basico_15_17` | Matrículas da educação básica de estudantes de 15 a 17 anos em relação à população da faixa | Matrículas localizadas no município divididas pela população residente | Educação Básica | 15 a 17 anos | % | 2036 no card; 2029 na lei | `at_least` | `contextual_proxy` |
| 4.b — Conclusão do 5º ano na idade regular | `idade_regular_quinto` | Estudantes que concluem os anos iniciais na idade regular | Conclusão dos anos iniciais na idade adequada | IDEB / SAEB e Fluxo Escolar | 5º ano | % | 2036 | `at_least` | `direct` |
| 4.c — Conclusão do 9º ano na idade regular | `idade_regular_nono` | Estudantes que concluem os anos finais na idade regular | Conclusão dos anos finais na idade adequada | IDEB / SAEB e Fluxo Escolar | 9º ano | % | 2036 | `at_least` | `direct` |
| 4.d — Conclusão do ensino médio na idade regular | `idade_regular_medio` | Estudantes que concluem o ensino médio na idade regular | Conclusão do ensino médio na idade adequada | IDEB / SAEB e Fluxo Escolar | Ensino médio | % | 2036 | `at_least` | `direct` |
| 5.a — Aprendizagem nos anos iniciais | `saeb_matematica_anos_iniciais` | Desempenho em Matemática — anos iniciais | Estudantes no nível adequado ou superior em Matemática | IDEB / SAEB e Fluxo Escolar | Anos iniciais | % | 2031 | `at_least` | `partial_component` |
| 5.a — Aprendizagem nos anos iniciais | `saeb_portugues_anos_iniciais` | Desempenho em Português — anos iniciais | Estudantes no nível adequado ou superior em Português | IDEB / SAEB e Fluxo Escolar | Anos iniciais | % | 2031 | `at_least` | `partial_component` |
| 5.b — Aprendizagem nos anos finais | `saeb_matematica_anos_finais` | Desempenho em Matemática — anos finais | Estudantes no nível adequado ou superior em Matemática | IDEB / SAEB e Fluxo Escolar | Anos finais | % | 2031 | `at_least` | `partial_component` |
| 5.b — Aprendizagem nos anos finais | `saeb_portugues_anos_finais` | Desempenho em Português — anos finais | Estudantes no nível adequado ou superior em Português | IDEB / SAEB e Fluxo Escolar | Anos finais | % | 2031 | `at_least` | `partial_component` |
| 5.d — Aprendizagem no ensino médio | `saeb_matematica_ensino_medio` | Desempenho em Matemática — ensino médio | Estudantes no nível adequado ou superior em Matemática | IDEB / SAEB e Fluxo Escolar | Ensino médio | % | 2031 | `at_least` | `partial_component` |
| 5.d — Aprendizagem no ensino médio | `saeb_portugues_ensino_medio` | Desempenho em Português — ensino médio | Estudantes no nível adequado ou superior em Português | IDEB / SAEB e Fluxo Escolar | Ensino médio | % | 2031 | `at_least` | `partial_component` |
| 6.a — Tempo integral | `basico_integral` | Alunos do público-alvo da ETI em jornada integral na rede pública | Alunos da educação básica pública em jornada integral | Educação Integral | Estudantes da rede pública | % | 2031 | `at_least` | `partial_component` |
| 6.a — Tempo integral | `escolas_integral` | Escolas públicas com alunos em jornada de tempo integral | Escolas públicas com ao menos 25% dos alunos em jornada integral | Educação Integral | Escolas públicas | % | 2031 | `at_least` | `partial_component` |
| 8.b — Conforto térmico | `salas_climatizadas` | Salas de aula climatizadas | Salas utilizadas com climatização | Infraestrutura e Tecnologia | Salas de aula | % | 2036 | `at_least` | `partial_component` |
| 8.c — Educação ambiental | `educacao_ambiental` | Escolas que promovem educação ambiental | Escolas que promovem educação ambiental | Gestão Escolar e Educação Ambiental | Escolas | % | 2036 | `at_least` | `direct` |
| 11.a — Alfabetização 15 anos ou mais | `alfabetizacao_pop_15_mais` | Taxa de alfabetização da população de 15 anos ou mais | População de 15 anos ou mais alfabetizada | Escolaridade e Alfabetização | 15 anos ou mais | % | 2031 | `at_least` | `direct` |
| 11.b — Conclusão do ensino fundamental 15+ | `fundamental_concluido_15_29` | População de 15 a 29 anos com ensino fundamental concluído | Escolaridade fundamental concluída na população jovem | Escolaridade e Alfabetização | 15 a 29 anos | % | 2036 | `at_least` | `direct` |
| 11.b — Conclusão do ensino fundamental 15+ | `fundamental_concluido_18_mais` | População de 18 anos ou mais com ensino fundamental concluído | Escolaridade fundamental concluída na população adulta | Escolaridade e Alfabetização | 18 anos ou mais | % | 2036 | `at_least` | `contextual_proxy` |
| 11.c — Conclusão do ensino médio 18+ | `medio_concluido_18_29` | População de 18 a 29 anos com ensino médio concluído | Escolaridade média concluída na população jovem | Escolaridade e Alfabetização | 18 a 29 anos | % | 2036 | `at_least` | `direct` |
| 11.c — Conclusão do ensino médio 18+ | `medio_concluido_18_mais` | População de 18 anos ou mais com ensino médio concluído | Escolaridade média concluída na população adulta | Escolaridade e Alfabetização | 18 anos ou mais | % | 2036 | `at_least` | `direct` |
| 12.a — Educação profissional técnica de nível médio | `medio_tecnico_articulado_percentual` | Ensino médio articulado à educação profissional técnica | Cursos técnicos integrados sobre matrículas do ensino médio | EJA e Educação Profissional | Ensino médio | % | 2036 | `at_least` | `partial_component` |
| 12.a — Educação profissional técnica de nível médio | `medio_tecnico_participacao_publica` | Participação acumulada do segmento público na expansão da EPT de nível médio | Participação pública nas expansões anuais positivas desde 2015 | EJA e Educação Profissional | EPT de nível médio | % | 2036 | `at_least` | `partial_component` |
| 12.b — Cursos subsequentes | `subsequente_expansao` | Expansão acumulada das matrículas em cursos técnicos subsequentes | Expansão acumulada desde 2015 | EJA e Educação Profissional | Cursos técnicos subsequentes | % | 2036 | `at_least` | `partial_component` |
| 12.c — EJA articulada à educação profissional | `eja_integrada_educacao_profissional_percentual` | Percentual das matrículas da EJA articuladas à educação profissional | Matrículas de EJA articuladas à educação profissional | EJA e Educação Profissional | EJA | % | 2031; 2036 final | `at_least` | `direct` |
| 17.a — Formação específica dos docentes | `adequacao_ai` | Docentes com formação adequada nos anos iniciais | Adequação da formação docente nos anos iniciais | Corpo Docente | Anos iniciais | % | 2031 | `at_least` | `partial_component` |
| 17.a — Formação específica dos docentes | `adequacao_af` | Docentes com formação adequada nos anos finais | Adequação da formação docente nos anos finais | Corpo Docente | Anos finais | % | 2031 | `at_least` | `partial_component` |
| 17.a — Formação específica dos docentes | `adequacao_em` | Docentes com formação adequada no ensino médio | Adequação da formação docente no ensino médio | Corpo Docente | Ensino médio | % | 2031 | `at_least` | `partial_component` |
| 17.b — Rendimento do magistério | `rendimento_magisterio` | Rendimento do magistério em relação a outros profissionais com nível superior | Relação entre rendimento do magistério e de outros profissionais | Corpo Docente | Magistério com nível superior | % | 2036 | `at_least` | `partial_component` |
| 17.d — Profissionais sem cargo efetivo | `temporarios` | Docentes da rede pública com contrato temporário | Docentes da rede pública com vínculo temporário | Corpo Docente | Rede pública | % | 2031 | `at_most` | `direct` |
| 17.f — Pós-graduação dos docentes | `pos_graduacao` | Docentes da educação básica com pós-graduação | Docentes com especialização, mestrado ou doutorado | Corpo Docente | Educação básica | % | 2036 | `at_least` | `direct` |
| 18.b — Conselhos escolares | `conselho_escolar` | Escolas públicas com conselho escolar instituído e em funcionamento | Presença de conselho escolar em funcionamento | Gestão Escolar e Educação Ambiental | Escolas públicas | % | 2036 | `at_least` | `direct` |
| 19.c — Infraestrutura mínima nas escolas | `salas_acessiveis` | Salas de aula com acessibilidade | Salas utilizadas com acessibilidade | Infraestrutura e Tecnologia | Salas de aula | % | 2029 | `at_least` | `partial_component` |

### 5.2 Cobertura, recursos e decisão proposta

“Tendência” conta apenas estados direcionais que o `MetaCard` consegue exibir. “>100” mostra `valor bruto / valor após a normalização atual do card`.

| `indicatorId` | Cobertura | Com / sem valor | Ano | No Diagnóstico v1 | RS | Tendência | >100 | Redundância principal | Complexidade | Decisão | Justificativa |
|---|---:|---:|---:|---|---:|---:|---|---|---|---|---|
| `creche` | 100,0% | 497 / 0 | 2025 | não | 497 | 318/497 | 3 / 0 | acesso por faixa | média | `essential` | Acesso inicial, decisão direta de oferta e cobertura integral; exige leitura de componente porque não mede demanda manifesta. |
| `pre_escola` | 100,0% | 497 / 0 | 2025 | não | 497 | 221/497 | 268 / 0 | acesso por faixa | baixa | `essential` | Universalização obrigatória, linguagem simples e cobertura integral. |
| `basico_6_17` | 100,0% | 497 / 0 | 2025 | não | 497 | 196/497 | 83 / 0 | acesso × matrícula 15–17 | média | `essential` | Melhor representante do acesso obrigatório; vínculo direto e faixa completa. |
| `basico_15_17` | 100,0% | 497 / 0 | 2025 | não | 497 | 222/497 | 57 / 0 | acesso 6–17 | alta | `complementary` | Pergunta específica da faixa, mas usa base territorial mista e referência legada incompatível com a meta 4.a; manter como contexto explícito. |
| `idade_regular_quinto` | 99,4% | 494 / 3 | 2025 | sim (494) | 0 | 136/494 | não | conclusão por etapa | baixa | `complementary` | Mede etapa distinta; permanece útil sem repetir o representante prioritário do fluxo. |
| `idade_regular_nono` | 99,4% | 494 / 3 | 2025 | sim (494) | 0 | 357/494 | não | conclusão por etapa | baixa | `essential` | Marca a conclusão do ensino fundamental e responde a uma decisão clara de fluxo e permanência. |
| `idade_regular_medio` | 99,2% | 493 / 4 | 2025 | sim (493) | 0 | 291/493 | não | conclusão por etapa | baixa | `complementary` | Não substitui 9º ano; preserva a transição final em camada completa. |
| `saeb_matematica_anos_iniciais` | 99,0% | 492 / 5 | 2023 | não | 0 | 0/492 | não | SAEB por etapa/disciplina | média | `complementary` | Aprendizagem distinta da etapa priorizada; componente adequado, não cumprimento integral da meta. |
| `saeb_portugues_anos_iniciais` | 99,0% | 492 / 5 | 2023 | não | 0 | 0/492 | 1 / 1 | SAEB por etapa/disciplina | média | `complementary` | Disciplina e etapa próprias; não é substituto de Matemática. |
| `saeb_matematica_anos_finais` | 99,2% | 493 / 4 | 2023 | não | 0 | 0/493 | não | SAEB por etapa/disciplina | média | `essential` | Representa aprendizagem com alta cobertura e equilibra a leitura em direção aos anos finais. |
| `saeb_portugues_anos_finais` | 99,2% | 493 / 4 | 2023 | não | 0 | 0/493 | não | SAEB por etapa/disciplina | média | `complementary` | Mede outra competência; deve continuar disponível sem duplicar a prioridade. |
| `saeb_matematica_ensino_medio` | 89,5% | 445 / 52 | 2023 | não | 0 | 0/445 | não | SAEB por etapa/disciplina | média | `complementary` | Cobertura menor e etapa distinta; importante para completude. |
| `saeb_portugues_ensino_medio` | 89,5% | 445 / 52 | 2023 | não | 0 | 0/445 | não | SAEB por etapa/disciplina | média | `complementary` | Não é substituto do resultado de Matemática nem das demais etapas. |
| `basico_integral` | 100,0% | 497 / 0 | 2025 | sim (497) | 497 | 351/497 | não | alunos × escolas integrais | baixa | `essential` | Responde quantos estudantes recebem jornada integral, a pergunta mais direta para planejamento de atendimento. |
| `escolas_integral` | 100,0% | 497 / 0 | 2025 | sim (497) | 497 | 273/497 | não | alunos × escolas integrais | baixa | `complementary` | Mede distribuição da oferta entre escolas, não cobertura dos alunos; não deve ser descartado. |
| `salas_climatizadas` | 100,0% | 497 / 0 | 2025 | sim (497) | 497 | 232/497 | não | condições físicas | baixa | `complementary` | Condição de conforto distinta da acessibilidade. |
| `educacao_ambiental` | 100,0% | 497 / 0 | 2025 | sim (497) | 497 | 0/497 | não | gestão/condições | baixa | `complementary` | Resultado direto, mas menos central para a leitura inicial que acesso, aprendizagem e oferta. |
| `alfabetizacao_pop_15_mais` | 100,0% | 497 / 0 | 2022 | sim (497) | 497 | 0/497 | não | escolaridade censitária | baixa | `complementary` | População ampla e indicador consolidado; mantido sem competir com o representante jovem da escolaridade. |
| `fundamental_concluido_15_29` | 100,0% | 497 / 0 | 2022 | sim (497) | 497 | 0/497 | não | coortes censitárias | baixa | `complementary` | Mede ensino fundamental na população jovem; pergunta diferente da conclusão na idade regular. |
| `fundamental_concluido_18_mais` | 100,0% | 497 / 0 | 2022 | não | 497 | 0/497 | não | coortes censitárias | média | `complementary` | Recorte de 18+ difere do 15+ legal; manter como proxy contextual, nunca como substituto direto. |
| `medio_concluido_18_29` | 100,0% | 497 / 0 | 2022 | sim (497) | 497 | 0/497 | não | coortes censitárias | baixa | `essential` | Síntese simples da escolaridade dos jovens e forte utilidade para planejamento territorial. |
| `medio_concluido_18_mais` | 100,0% | 497 / 0 | 2022 | sim (497) | 497 | 0/497 | não | coortes censitárias | baixa | `complementary` | Mede estoque educacional adulto e não substitui o recorte jovem. |
| `medio_tecnico_articulado_percentual` | 99,8% | 496 / 1 | 2025 | não | 496 | 452/496 | não | EPT | média | `complementary` | Alta cobertura, mas cobre somente cursos integrados e não toda a meta 12.a. |
| `medio_tecnico_participacao_publica` | 34,2% | 170 / 327 | 2025 | sim (170) | 170 | 121/170 | não | EPT | alta | `complementary` | Pergunta relevante sobre expansão pública, porém acumulativa e de baixa cobertura. |
| `subsequente_expansao` | 29,8% | 148 / 349 | 2025 | sim (14) | 148 | 62/148 | 7 / 7 | EPT | alta | `complementary` | Resultado válido e específico, mas a base atual marca 134 casos como fora do domínio; requer correção antes da publicação completa. |
| `eja_integrada_educacao_profissional_percentual` | 68,0% | 338 / 159 | 2025 | não | 338 | 294/338 | não | EPT | média | `complementary` | Vínculo direto com 12.c; permanece complementar pela cobertura e pelo recorte especializado. |
| `adequacao_ai` | 100,0% | 497 / 0 | 2025 | sim (497) | 0 | 183/497 | não | adequação por etapa | baixa | `complementary` | Etapa própria; não substitui anos finais ou ensino médio. |
| `adequacao_af` | 100,0% | 497 / 0 | 2025 | sim (497) | 0 | 166/497 | não | adequação por etapa | baixa | `essential` | Condição de oferta simples, consolidada e equilibrada com o foco de fluxo nos anos finais. |
| `adequacao_em` | 99,8% | 496 / 1 | 2025 | sim (496) | 0 | 170/496 | não | adequação por etapa | baixa | `complementary` | Não substitui as demais etapas e preserva a completude docente. |
| `rendimento_magisterio` | 93,4% | 464 / 33 | 2024 | não | 0 | 181/464 | 75 / 75 | condições docentes | alta | `complementary` | Importante para valorização, mas a proveniência oficial está pendente e o domínio atual rejeita valores legítimos acima de 100. |
| `temporarios` | 100,0% | 497 / 0 | 2025 | sim (497) | 497 | 253/497 | não | condições docentes | baixa | `complementary` | Direção inversa e pergunta própria sobre estabilidade do vínculo. |
| `pos_graduacao` | 100,0% | 497 / 0 | 2025 | sim (497) | 497 | 184/497 | não | formação docente | baixa | `complementary` | Formação continuada distinta da adequação à etapa. |
| `conselho_escolar` | 100,0% | 497 / 0 | 2025 | sim (497) | 497 | 276/497 | não | gestão | baixa | `complementary` | Dimensão de gestão relevante, mas não precisa ocupar a leitura inicial já equilibrada. |
| `salas_acessiveis` | 100,0% | 497 / 0 | 2025 | sim (497) | 497 | 221/497 | não | condições físicas | baixa | `essential` | Condição concreta, compreensível e transversal de infraestrutura e inclusão. |

## 6. Indicadores já presentes

Os 20 pares atuais são:

`idade_regular_quinto`, `idade_regular_nono`, `idade_regular_medio`,
`basico_integral`, `escolas_integral`, `salas_climatizadas`,
`educacao_ambiental`, `alfabetizacao_pop_15_mais`,
`fundamental_concluido_15_29`, `medio_concluido_18_29`,
`medio_concluido_18_mais`, `medio_tecnico_participacao_publica`,
`subsequente_expansao`, `adequacao_ai`, `adequacao_af`, `adequacao_em`,
`temporarios`, `pos_graduacao`, `conselho_escolar` e `salas_acessiveis`.

Eles produzem 9.119 resultados no v1, entre 15 e 20 por município.

## 7. Indicadores novos

Os 14 pares a acrescentar são:

`creche`, `pre_escola`, `basico_6_17`, `basico_15_17`,
`saeb_matematica_anos_iniciais`, `saeb_portugues_anos_iniciais`,
`saeb_matematica_anos_finais`, `saeb_portugues_anos_finais`,
`saeb_matematica_ensino_medio`, `saeb_portugues_ensino_medio`,
`fundamental_concluido_18_mais`, `medio_tecnico_articulado_percentual`,
`eja_integrada_educacao_profissional_percentual` e `rendimento_magisterio`.

Juntos, eles acrescentam 6.777 ocorrências com valor nos 497 municípios.

## 8. Indicadores excluídos e justificativa

**Nenhum dos 34 cards agregados é proposto como `excluded`.** Redundância visual não é motivo de descarte, e as incompatibilidades encontradas podem ser tratadas por vínculo canônico, leitura pública e correção de domínio ou proveniência.

Quinze dos 49 indicadores técnicos ficam fora da matriz porque não são cards agregados publicáveis no fluxo atual:

- `aee`, `internet`, `internet_alunos`, `internet_aprendizagem`, `internet_comunidade`, `acesso_internet_computador`, `acesso_internet_disp_pessoais`, `rede_local`, `rede_wireless`, `banda_larga`, `proposta_pedagogica`, `desktop_aluno`, `comp_portatil_aluno` e `tablet_aluno`: são removidos como contexto, proxy ou visualização informativa pelo predicado público;
- `alfabetizacao`: não produz card disponível em nenhum dos 497 municípios.

Esses 15 itens não receberam a decisão `excluded`, pois nunca entraram no universo de candidatos definido pela grade real.

## 9. Proposta de 9 essenciais

| Ordem | Meta | `indicatorId` | Pergunta decisória |
|---:|---|---|---|
| 1 | 1.a | `creche` | Qual parcela das crianças de 0 a 3 anos está atendida? |
| 2 | 1.c | `pre_escola` | A pré-escola está universalizada? |
| 3 | 4.a | `basico_6_17` | A população em idade escolar obrigatória está atendida? |
| 4 | 6.a | `basico_integral` | Quantos estudantes recebem jornada integral? |
| 5 | 4.c | `idade_regular_nono` | Os estudantes concluem o ensino fundamental na idade regular? |
| 6 | 5.b | `saeb_matematica_anos_finais` | Qual a proporção com aprendizagem adequada em Matemática ao fim do fundamental? |
| 7 | 11.c | `medio_concluido_18_29` | Quantos jovens adultos concluíram o ensino médio? |
| 8 | 17.a | `adequacao_af` | Os docentes dos anos finais têm formação adequada? |
| 9 | 19.c | `salas_acessiveis` | As salas utilizadas oferecem acessibilidade? |

## 10. Justificativa individual dos essenciais

1. **Creche:** cobertura de 100%, pergunta imediatamente acionável para expansão de vagas e exigência explícita da decisão de produto. O texto deve lembrar que o card não mede a demanda manifesta integral.
2. **Pré-escola:** vínculo direto, cobertura de 100% e leitura universal de acesso obrigatório.
3. **6 a 17 anos:** melhor representante do acesso obrigatório. É mais simples e mais fiel que o proxy de matrículas de 15 a 17 anos.
4. **Alunos em tempo integral:** representa o alcance sobre estudantes, enquanto o indicador de escolas descreve a distribuição da oferta.
5. **Conclusão do 9º ano na idade regular:** alta cobertura, vínculo direto e marco decisivo de permanência e fluxo.
6. **Matemática nos anos finais:** introduz aprendizagem sem concentrar a leitura nas etapas iniciais. É um componente da meta, não uma síntese de todas as disciplinas e etapas.
7. **Ensino médio concluído entre 18 e 29 anos:** representa escolaridade da população jovem com pergunta clara para planejamento social e produtivo.
8. **Adequação docente nos anos finais:** acrescenta condição de oferta com cobertura integral e equilibra as etapas representadas.
9. **Salas acessíveis:** acrescenta infraestrutura e inclusão com medida simples, alta cobertura e relação direta com decisões de adequação física.

## 11. Indicadores complementares por tema

A camada complementar contém 25 pares. A ordem temática proposta é institucional e independente da ordem editorial dos essenciais.

1. **Educação Básica — 1:** `basico_15_17`.
2. **Educação Integral — 1:** `escolas_integral`.
3. **IDEB / SAEB e Fluxo Escolar — 7:** `idade_regular_quinto`, `idade_regular_medio`, `saeb_matematica_anos_iniciais`, `saeb_portugues_anos_iniciais`, `saeb_portugues_anos_finais`, `saeb_matematica_ensino_medio`, `saeb_portugues_ensino_medio`.
4. **Escolaridade e Alfabetização — 4:** `alfabetizacao_pop_15_mais`, `fundamental_concluido_15_29`, `fundamental_concluido_18_mais`, `medio_concluido_18_mais`.
5. **EJA e Educação Profissional — 4:** `medio_tecnico_articulado_percentual`, `medio_tecnico_participacao_publica`, `subsequente_expansao`, `eja_integrada_educacao_profissional_percentual`.
6. **Corpo Docente — 5:** `adequacao_ai`, `adequacao_em`, `rendimento_magisterio`, `temporarios`, `pos_graduacao`.
7. **Infraestrutura e Tecnologia — 1:** `salas_climatizadas`.
8. **Gestão Escolar e Educação Ambiental — 2:** `educacao_ambiental`, `conselho_escolar`.

O tema Educação Especial não aparece porque `aee` é contexto informativo e não chega à grade agregada; `salas_acessiveis` pertence hoje a Infraestrutura e Tecnologia.

## 12. Análise de redundâncias

| Grupo | Perguntas diferentes? | Representante essencial | Por que os demais permanecem | Não tratar como substitutos porque… |
|---|---|---|---|---|
| Alunos × escolas em tempo integral | sim | `basico_integral` | `escolas_integral` mostra capilaridade da oferta | aluno atendido e escola ofertante têm denominadores distintos |
| Conclusão na idade regular por etapa | sim | `idade_regular_nono` | 5º ano e ensino médio são transições próprias | um bom fluxo em uma etapa não implica bom fluxo nas outras |
| Escolaridade censitária por idade e nível | sim | `medio_concluido_18_29` | alfabetização, fundamental e recorte 18+ medem estoques diferentes | nível concluído e coorte alteram a pergunta |
| Formação adequada por etapa | sim | `adequacao_af` | anos iniciais e ensino médio preservam os recortes da atuação docente | adequação em uma etapa não representa as demais |
| SAEB por disciplina e etapa | sim | `saeb_matematica_anos_finais` | cinco resultados cobrem Português e outras etapas | disciplina e etapa são dimensões substantivas, não variações visuais |
| Acesso 6–17 × matrículas 15–17 | sim | `basico_6_17` | o proxy 15–17 mantém informação específica | o segundo mistura município da escola e população residente e usa referência diferente |
| EPT | sim | nenhum | os quatro resultados medem articulação, participação pública, expansão subsequente e EJA | taxas, bases e horizontes são diferentes |
| Climatização × acessibilidade | sim | `salas_acessiveis` | climatização preserva conforto térmico | condições de acesso e conforto não se substituem |

## 13. Ordem editorial dos essenciais

A ordem 1–9 da seção 9 forma a narrativa:

1. acesso na primeira infância;
2. acesso obrigatório;
3. ampliação da jornada;
4. permanência e trajetória;
5. aprendizagem;
6. conclusão e escolaridade;
7. condições docentes e físicas da oferta.

Ela não muda por município nem por filtro. Se um essencial não tiver valor ou for removido pelo filtro, nenhum complementar ocupa sua posição.

## 14. Ordem normativa do conjunto completo

A ordem normativa plana deve continuar usando a regra pós-DGP4:

1. número de `goalId` como inteiro;
2. letra como desempate;
3. para resultados da mesma meta, ordem canônica do catálogo dos cards.

A ordem editorial dos essenciais comunica uma história; a ordem normativa comunica a estrutura da lei e garante cópia, impressão e testes determinísticos.

Há uma tensão real entre uma ordem global estritamente numérica e o agrupamento da tela em oito temas: um card não pode estar simultaneamente em um único disclosure temático e intercalado globalmente com outros temas. A recomendação é usar ordem numérica **dentro de cada tema** na tela e ordem numérica global na cópia. A decisão sobre exigir ordem global também na tela precisa de aprovação do produto antes da DGP5-B.

## 15. Proposta de interface

A página mantém a composição existente, sem redesenho:

1. Cabeçalho.
2. Resumo do diagnóstico.
3. Filtros.
4. **Resultados essenciais para a leitura inicial**.
5. **Todos os resultados das metas**.
6. Fontes.

### Leitura prioritária

- título: **Resultados essenciais para a leitura inicial**;
- apoio: “Esta seleção reúne dimensões centrais de acesso, trajetória, aprendizagem, escolaridade e condições de oferta. Os demais resultados continuam disponíveis abaixo.”;
- renderiza somente os essenciais disponíveis e compatíveis com o filtro;
- usa o mesmo componente de resultado atual;
- informa discretamente o total completo e quantos resultados adicionais existem.

### Todos os resultados das metas

Recomenda-se um `<details>` principal fechado, com `<summary>` equivalente a **Ver todos os {N} resultados**, seguido por disclosures temáticos nativos também fechados.

O subtítulo é: “Consulte todos os indicadores municipais apresentados no PNE 2026–2036.”

`N` é o total de resultados disponíveis compatíveis com o filtro ativo, incluindo os essenciais já visíveis. O texto de apoio esclarece que a abertura revela os resultados adicionais; os cards essenciais não são repetidos dentro do disclosure.

Cada `summary` temático informa:

- nome do tema;
- total do tema no filtro;
- quantos estão na leitura essencial acima;
- quantos são complementares e serão revelados;
- pontos para avançar;
- resultados a manter, quando maior que zero.

### Avaliação das opções

| Opção | Avaliação |
|---|---|
| Disclosure principal com disclosures temáticos internos | **Recomendada.** Preserva uma ação principal, usa estados nativos, mantém foco previsível e reduz a altura inicial. |
| Disclosures temáticos diretamente na página | Operável, mas cria oito ações concorrentes e enfraquece a distinção entre leitura inicial e conjunto completo. |
| Disclosure principal com todos os temas já abertos | Tem apenas um estado, porém perde a progressão temática e produz uma abertura muito longa. |

Os cards existem uma única vez no DOM: essenciais na primeira seção e apenas complementares dentro dos temas. Abrir a seção completa torna os 34 resultados disponíveis na página, sem clonar os 9 essenciais.

## 16. Comportamento dos filtros

1. O predicado de situação e tema é aplicado ao conjunto completo disponível.
2. Depois do filtro, os resultados são particionados pela metadata em essencial e complementar.
3. A seleção institucional não muda; complementares nunca são promovidos.
4. O resumo municipal usa as contagens completas materializadas e permanece imutável.
5. Opções de situação com contagem zero continuam omitidas, como no comportamento homologado na DGP4.
6. Temas sem resultado compatível são omitidos dos filtros e dos disclosures.
7. O total `{N}` do disclosure reflete o filtro ativo, mas a cópia continua independente dele.

Quando o filtro remove todos os essenciais, a seção permanece com título e mostra:

> Nenhum resultado essencial corresponde aos filtros selecionados. Consulte os demais resultados abaixo.

Não se promove outro card e não se cria um estado vazio da página. Se todos os resultados compatíveis já estiverem na seção essencial, o disclosure complementar é substituído por:

> Todos os resultados deste filtro já aparecem na leitura inicial.

## 17. Regra de cópia

`Copiar síntese` deve continuar partindo do contrato integral, nunca do estado visual.

A saída deve:

- incluir resumo completo;
- percorrer cada resultado disponível uma vez;
- ignorar filtros, disclosures e tier para fins de completude;
- usar ordem numérica global de meta e ordem canônica dentro da meta;
- informar a classificação em cada resultado, sem separar primeiro todos os `advance` e depois todos os `maintain`;
- incluir leituras complementares e fontes;
- não repetir essenciais.

O helper atual agrupa primeiro por classificação. A DGP5-B deverá alterar essa ordem para atender à regra numérica, sem recalcular valores.

## 18. Regra de impressão

A impressão usa a mesma árvore de cards filtrados da tela:

- essenciais ficam na seção inicial;
- complementares ficam uma única vez nos disclosures;
- filtros determinam quais cards permanecem no DOM;
- a folha de impressão força o conteúdo de todos os `<details>` a participar do layout, independentemente do atributo `open`;
- `summary`, ações e controles são ocultados;
- grades são linearizadas, cards usam `break-inside: avoid` quando suportado e fontes iniciam ao final em bloco seguro para A4.

A regra técnica central é autoral, somente em `@media print`, equivalente a:

```css
.pne-diagnostic details:not([open]) > :not(summary) {
  display: block !important;
}

.pne-diagnostic details > summary {
  display: none !important;
}
```

Assim, o conteúdo fechado continua no mesmo DOM e é apenas retirado do estado visual nativo na tela. A impressão não precisa abrir disclosures por JavaScript, duplicar cards, manter árvore paralela nem depender de `beforeprint`.

A ordem A4 será a ordem dos temas na tela, com ordem numérica dentro de cada tema, salvo decisão de produto diferente para a tensão registrada na seção 14.

## 19. Metadata canônica proposta

### Local

Criar um único catálogo versionado no pipeline, consumido tanto pela serialização do catálogo PNE quanto pelo builder do Diagnóstico. Nome conceitual:

`pne2026-diagnostic-presentation-v2`

Ele deve ficar em `data_pipeline/src/data/`, não no React. `pne_2026_2036.py::INDICADORES` continua sendo a coleção dos cards; a metadata é validada contra ela e incorporada aos itens serializados. O builder público usa o mesmo catálogo, eliminando a segunda allowlist e o mapa `pne2026IndicatorGoalRefs.js`.

### Forma recomendada

```json
{
  "version": "pne2026-diagnostic-presentation-v2",
  "themes": [
    { "themeId": "educacao_basica", "publicTitle": "Educação Básica", "order": 1 }
  ],
  "results": [
    {
      "goalId": "1.a",
      "indicatorId": "creche",
      "themeId": "educacao_basica",
      "tier": "essential",
      "priorityOrder": 1,
      "relationshipType": "partial_component",
      "relationshipReading": "Este resultado acompanha uma dimensão da meta e não representa, sozinho, seu cumprimento integral."
    }
  ]
}
```

Regras:

- a lista de `results` é a própria allowlist; `allowedGoalIds` e `allowedIndicatorIds` são derivados;
- `goalId × indicatorId` é chave única;
- `priorityOrder` é obrigatório e único somente em `essential`, com sequência 1–9;
- `themeOrder` não precisa ser repetido em cada resultado; deriva de `themes[].order`;
- `relationshipType` aceita `direct`, `partial_component` e `contextual_proxy`;
- `relationshipReading` é materializada pelo pipeline; o React não seleciona texto por tipo;
- nenhuma propriedade depende de valor, classificação, comparação estadual ou município;
- a versão da metadata é registrada no contrato público.

### Essencial sem valor

O contrato v2 deve carregar a mesma metadata de apresentação nos 497 municípios e publicar apenas valores realmente disponíveis. Quando um par essencial não existir em `goals[].results`, a interface consulta a definição canônica materializada no próprio contrato, não uma lista local, e mostra a mensagem de indisponibilidade da seção 16. Nenhum complementar ocupa a vaga.

Para tornar a completude auditável sem inventar zero, recomenda-se que `scope` exponha os 34 pares esperados e que o contrato diferencie `availableResultsCount` de pares sem resultado. Não é necessário criar um card numérico vazio.

## 20. Impacto de versão e materialização

### Versão

Recomenda-se **`pne2026-public-diagnostic-v2`**.

Evidências da política real:

- o builder atual rejeita qualquer versão pública diferente de v1;
- a configuração v1 exige exatamente 24 metas, 20 indicadores, 11 vínculos diretos e 9 parciais;
- o seletor React aceita somente a versão pública exata;
- a inclusão do contrato público v1 foi aditiva ao `municipal-diagnostic-v2`, sem alterar a versão externa.

Logo:

- `schemaVersion: municipal-diagnostic-v2` pode permanecer;
- `methodologyVersion` técnica pode permanecer onde o cálculo não mudar;
- a propriedade aninhada passa a v2 porque o universo sobe de 20 para 34, o conjunto de metas troca `3.a` por `12.c`, surgem metadata, temas e um terceiro tipo de vínculo, e consumidores v1 não devem interpretar a nova forma silenciosamente.

### Resumo e temas

- os cinco campos atuais do resumo mantêm a mesma definição e passam a contar todos os resultados disponíveis;
- pode ser adicionado `unavailableResultsCount`, sem converter ausência em zero;
- a taxonomia visual passa dos cinco temas técnicos atuais para oito temas de apresentação derivados de `THEMATIC_GROUPS`;
- o campo técnico de tema não deve ser sobrescrito; o v2 recebe `themeId` de apresentação próprio.

### Materialização

- 497 contratos canônicos e 497 aliases precisam ser rematerializados;
- a nova linha de base esperada é 15.896 resultados disponíveis, com 26–34 por município, desde que todas as pré-condições metodológicas sejam resolvidas;
- o número de objetos de resultado cresce 74,3% sobre o v1;
- aliases precisam permanecer idênticos byte a byte;
- `public/data/indicadores.json` precisa receber a metadata canônica exportada;
- consumidores que aceitam somente v1 falharão até serem atualizados de forma coordenada.

Não se recomenda editar a configuração v1 em lugar: ela deve permanecer como referência da versão já materializada.

## 21. Arquivos previstos para a DGP5-B

### Canônicos e pipeline

- novo `data_pipeline/src/data/pne2026_diagnostic_presentation_v2.json`;
- `data_pipeline/src/views/pne_2026_2036.py` para vincular a metadata ao catálogo canônico;
- `data_pipeline/scripts/export_static_data.py` somente se a serialização precisar de validação explícita da metadata;
- `data_pipeline/src/municipal_diagnostic.py` para carregar e materializar v2;
- novo ou atualizado tipo de configuração pública v2, sem reescrever o JSON v1.

### React e apresentação

- `src/pages/CyclePage.jsx` para consumir `goalId` canônico do item exportado;
- remoção de `src/data/pne2026IndicatorGoalRefs.js` após confirmar os únicos consumidores atuais;
- `src/components/DiagnosticPanel.jsx`;
- `src/features/diagnostic/diagnosticPresentation.js`;
- `src/features/diagnostic/diagnosticTypes.ts`;
- `src/styles/institutional-refresh.css` para composição e impressão.

### Testes e dados gerados

- `data_pipeline/tests/test_pne_2026_public_diagnostic.py`;
- `scripts/checks/diagnostic-contract.test.mjs`;
- `scripts/checks/diagnostic-e2e-test.cjs`;
- `public/data/indicadores.json` gerado;
- 497 `public/data/municipios/<slug>/diagnostico.json` e 497 aliases IBGE;
- artefatos equivalentes em `data_pipeline/export/` conforme o fluxo de materialização adotado;
- `docs/PLANO_MIGRACAO_UI.md` ao encerrar a implementação.

## 22. Testes necessários

Menor cobertura suficiente para a DGP5-B:

1. **Paridade canônica:** para cada um dos 497 municípios, reproduzir a coleção dos cards do PNE e comparar exatamente os pares disponíveis com o contrato v2.
2. **Metadata:** 34 pares únicos, 9 `essential`, 25 `complementary`, 0 `excluded`, oito temas e ordens válidas.
3. **Prioridade fixa:** os 497 contratos carregam a mesma seleção e `priorityOrder` 1–9, sem promoção por classificação, valor, RS ou disponibilidade.
4. **Vínculos:** tipos e leituras materializados; `12.c` presente; nenhum mapa manual React.
5. **Sem duplicação:** cada card disponível aparece uma vez no DOM, mesmo com o disclosure principal aberto.
6. **Filtros:** situação e tema afetam as duas camadas; resumo imutável; zero opções artificiais; caso sem essencial mostra a mensagem aprovada.
7. **Essencial sem valor:** pelo menos `idade_regular_nono` ou `saeb_matematica_anos_finais` ausente, sem promoção de complementar.
8. **Tema sem essencial:** disclosure e contagens continuam corretos.
9. **Cópia:** completa, independente dos filtros, em ordem numérica global e sem duplicação.
10. **Impressão:** disclosures fechados imprimem todo o conteúdo complementar compatível com o filtro; fontes ao final; A4 multipágina sem sobreposição.
11. **Teclado e foco:** Enter/Espaço em `summary`, filtros e retorno de foco; nenhum conteúdo fechado focável.
12. **Mobile:** uma largura móvel representativa, sem rolagem interna ou perda de texto.
13. **Domínios:** casos acima de 100 em `subsequente_expansao` e `rendimento_magisterio`, além da normalização populacional, preservam a leitura canônica aprovada.
14. **Aliases e linha de base:** 497 pares slug/IBGE idênticos e totais 15.896, 26–34, após a resolução dos bloqueios.

Esses testes não foram executados nesta auditoria.

## 23. Riscos

1. **Paridade semântica incompleta no catálogo técnico.** Nove indicadores que aparecem na grade são hoje `methodologically_incompatible` no Diagnóstico técnico: `basico_15_17`, `medio_tecnico_articulado_percentual`, os seis SAEB e `fundamental_concluido_18_mais`.
2. **Domínio divergente.** `subsequente_expansao` tem 148 cards, mas somente 14 resultados tecnicamente elegíveis; 134 são marcados fora do domínio. `rendimento_magisterio` tem 464 cards, 75 deles acima de 100 e hoje fora do domínio técnico, embora uma razão salarial acima de 100 seja interpretável.
3. **Proveniência pendente.** `rendimento_magisterio` usa `pipeline_rendimento_professores_provenance_pending`, incompatível com o gate atual de fonte oficial.
4. **Registro de fontes insuficiente.** Os novos pares exigem `inep_saeb` e uma resolução oficial para `municipal_age_population_panel`; o v1 só registra INEP Censo Escolar e IBGE Censo Demográfico.
5. **Valores acima de 100.** O export bruto tem 494 ocorrências acima de 100 em sete indicadores. A normalização atual reduz 411 ocorrências populacionais a 100 no React; permanecem 83 ocorrências acima de 100 em três indicadores. O pipeline e o contrato precisam definir a apresentação, não duplicar decisões.
6. **Ordem × temas.** Agrupamento temático único e ordem numérica global estrita são incompatíveis na mesma árvore sem duplicação; a interpretação da seção 14 precisa ser homologada.
7. **Contrato maior.** Aumento de 74,3% nos resultados materializados afeta tamanho dos 994 arquivos e tempo de carga, cópia e impressão.
8. **Consumidores estritos.** React e testes rejeitam qualquer versão pública diferente de v1; rollout parcial produz erro operacional.
9. **Impressão longa.** 26–34 resultados com detalhes e fontes exigem linearização A4 e verificação multipágina.
10. **Worktree atual.** A auditoria leu o estado pós-DGP4 já modificado no worktree e preservou todas as alterações preexistentes; a DGP5-B deve confirmar a base antes de materializar.

## 24. Perguntas que exigem decisão do produto

1. Aprovar os 9 essenciais e a ordem editorial proposta.
2. Aprovar `contextual_proxy` para `basico_15_17` e `fundamental_concluido_18_mais`, com leitura que proíbe interpretação de cumprimento.
3. Aprovar a publicação dos componentes SAEB e EPT como `partial_component`, mesmo quando o catálogo técnico atual os marca incompatíveis com o cumprimento integral.
4. Aprovar a taxonomia de oito temas e a regra de ordem numérica dentro do tema na tela, mantendo ordem global na cópia.
5. Confirmar que `{N}` representa todos os resultados disponíveis compatíveis com o filtro, embora os essenciais já estejam visíveis acima.
6. Confirmar o comportamento sem valor: omitir o card numérico, manter a prioridade institucional e mostrar mensagem curta, sem promoção.
7. Definir a política canônica para valores acima de 100, especialmente expansão acumulada e razão salarial.
8. Exigir resolução de proveniência e fonte oficial antes da DGP5-B, ou autorizar um bloqueio explícito que impeça a materialização incompleta.

## 25. Recomendação final

Avançar para a DGP5-B somente após homologar os 9 essenciais, o tipo `contextual_proxy`, a interpretação da ordem temática e a política de valores acima de 100, e após resolver as fontes e incompatibilidades técnicas listadas.

A implementação deve nascer de um catálogo único no pipeline, produzir `pne2026-public-diagnostic-v2`, preencher a lacuna `12.c`, derivar a paridade da mesma coleção dos cards públicos e materializar os 497 contratos de forma coordenada. O React deve apenas filtrar e apresentar a metadata recebida; não deve possuir uma allowlist ou ordem de prioridade própria.

Esta etapa termina na proposta. Nenhum código de produção, contrato, JSON, teste, baseline, dado ou versão foi alterado ou materializado.
