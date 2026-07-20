# Auditoria técnica do módulo Diagnóstico municipal

**Escopo:** dados, cálculos, metas, projeções, comparações, governabilidade, qualidade e financiamento.  
**Fora do escopo executado:** alterações de UI e novos componentes.  
**Data da auditoria:** 19/07/2026.

## 1. Sumário executivo

O módulo atual é útil como leitura rápida de distância para metas, mas **não é suficiente para ordenar prioridades executivas ou recomendar financiamento**. O principal risco é arquitetural: existem duas lógicas de diagnóstico. O pipeline serializa resumo, desafios e positivos, enquanto o React ignora essas análises e recalcula prioridades com outra regra.

A priorização apresentada no frontend usa apenas `abs(distância/meta)`, classifica os cinco maiores valores e não considera trajetória, ritmo, comparação estadual/pares, desigualdade, governabilidade, exposição da rede municipal, qualidade da evidência ou financiamento. Indicadores de diferentes responsabilidades administrativas concorrem na mesma lista. O progresso também usa `atual/meta`, regra inadequada para metas `at_most`.

A Lei nº 15.388/2026 está vigente. Os 73 textos de metas do repositório foram comparados com o texto oficial atualizado e coincidem semanticamente; três diferenças automáticas eram apenas espaços ao redor de marcação tipográfica. Porém, o metadado local ainda declara `validatedAgainstOfficialLaw: false`, e há incompatibilidades entre algumas fórmulas/alvos operacionais e a lei.

O acervo tem 497 municípios e 49 indicadores no ciclo novo. A auditoria automatizada encontrou percentuais acima de 100 em seis indicadores; em quatro medidas de atendimento isso decorre principalmente de numerador por município da escola versus população residente. O frontend capa alguns desses valores em 100, o que melhora exibição, mas oculta a incompatibilidade e altera distância/meta.

Há dois conjuntos de cenários: sete projeções de atendimento por tendência e quatro cenários de manutenção por componentes. Ambos são úteis para planejamento, mas não são projeções oficiais do Inep. Não há intervalos de incerteza, e a fonte populacional da projeção contém caminhos locais absolutos.

A referência estadual está tecnicamente mais madura: usa razão de somas, cobertura e política de nulos. Ela publica 34 registros comparáveis e 16 com metodologia pendente, mas o módulo Diagnóstico não a consome. Mediana, quartis, percentil, COREDE, CRE e pares semelhantes não existem no contrato atual.

Conclusão: antes de aprofundar a interface, é necessário corrigir validade legal, unificar a regra de domínio no pipeline e integrar evidência contextual. O exemplo de Nova Santa Rita mantém o escore final nulo porque faltam pares e desigualdade interna; isso é o resultado metodologicamente correto, não uma falha de geração.

## 2. Fluxo atual e inventário técnico

### 2.1 Frontend

| Arquivo | Responsabilidade auditada |
|---|---|
| `src/pages/Diagnostico.jsx` | lê `pne_2026_2036.diagnostico`, normaliza percentuais populacionais, filtra indicadores comparáveis, cria grupos temáticos e chama o painel |
| `src/components/DiagnosticPanel.jsx` | recalcula resumo, melhores posições, lacunas e top 5; contém a regra privada de prioridade |
| `src/utils/pneDisplayRules.js` | exclui proxies/informativos e exige `tracks_goal`, meta, distância e status comparável |
| `src/utils/indicatorValues.js` | identifica percentuais populacionais por texto e capa valores em 100 antes do diagnóstico |
| `src/data/thematicGroups.js` | reorganiza categorias para apresentação |
| `src/data/pne2026IndicatorGoalRefs.js` | referência simples indicador → meta legal |
| `src/data/pne2026LegalGoalIndicatorMap.js` | 73 metas legais e relações direta/parcial/aproximada |
| `src/data/pne2026GoalTexts.js` | textos locais das 73 metas |
| `src/data/planningScenarios.ts` | tipos/adaptador dos quatro cenários de manutenção |
| `src/features/education/educationAttendancePresentation.ts` | contrato de apresentação das projeções de atendimento, preservando bruto e exibido |

`Diagnostico.jsx` passa o objeto serializado como `data`, mas `DiagnosticPanel.jsx` chama `buildDiagnosticAnalysis(categories, results)`. O objeto `data` serve essencialmente à decisão de estado vazio; desafios, positivos e resumo do pipeline não dirigem o conteúdo analítico.

### 2.2 Pipeline e artefatos

| Arquivo/artefato | Responsabilidade auditada |
|---|---|
| `data_pipeline/src/views/pne_2026_2036.py` | fórmulas, metas configuradas, direção, disponibilidade e catálogo de 49 indicadores |
| `data_pipeline/src/views/diagnostico.py` | diagnóstico legado/serializado, resumo, desafios, positivos e indicadores por categoria |
| `data_pipeline/scripts/export_static_data.py` | exporta `diagnostico_por_municipio.json` |
| `data_pipeline/scripts/partition_static_data.py` | incorpora diagnóstico, indicadores e cenários ao payload municipal |
| `data_pipeline/src/pne_trend.py` | tendência Theil–Sen, limiar por MAD, consistência e quebras metodológicas |
| `data_pipeline/src/views/pne_2026_projections.py` | sete projeções de atendimento por tendência e população |
| `data_pipeline/src/projections_v2.py` | quatro cenários de manutenção por razão de componentes |
| `data_pipeline/src/education_attendance.py` | contrato canônico da página de atendimento/cenários |
| `data_pipeline/src/pne_state_reference.py` | registro, agregação e validação da referência estadual |
| `public/data/municipios/<slug>/index.json` | 49 resultados, diagnóstico, sete projeções e quatro cenários por município |
| `public/data/municipios/<slug>/details.json` | séries, componentes e alguns recortes por dependência |
| `public/data/pne_2026_2036/referencia_estadual.json` | série estadual ponderada, registro metodológico, projeções e auditoria |

Os tipos gerais atuais são frouxos: `MunicipioData` e os ciclos usam `unknown`/`Record<string, unknown>`. O contrato proposto foi adicionado em `src/features/diagnostic/diagnosticTypes.ts` sem ligar a UI.

## 3. Regra de priorização atual

### 3.1 Frontend

Em `DiagnosticPanel.jsx`:

1. elimina resultado sem dado real, não comparável e acumulativo ainda encerrado em 2025;
2. define status somente por `atingida`;
3. calcula `priorityScore = abs(distance) / abs(meta)` quando a meta é positiva;
4. ordena decrescente e seleciona cinco;
5. rotula `>= 0,50` como lacuna muito elevada e `>= 0,25` como elevada;
6. calcula barra como `clamp(atual/meta, 0, 100)`.

Problemas:

- não há ano-alvo ou urgência;
- não há tendência, ritmo necessário ou cenário inercial;
- não há RS, pares ou desigualdade;
- não há governabilidade nem dependência administrativa;
- não há denominador, margem de erro, qualidade ou recência no escore;
- não há custo, elegibilidade ou capacidade de execução;
- distância relativa favorece metas pequenas e mistura proxies com medidas mais diretas;
- a barra não respeita `at_most`;
- o cap de percentuais populacionais ocorre antes da análise e pode transformar valor bruto incompatível em aparente meta atingida.

### 3.2 Pipeline serializado

`diagnostico.py` usa outra lógica:

- resumo por resultados disponíveis;
- categoria ativa pela maior quantidade de atenção;
- desafios ordenados por distância bruta mais negativa e limitados a quatro;
- positivos tomados em ordem e limitados a quatro;
- textos genéricos de desafio/posição.

Portanto, frontend e pipeline podem discordar em total, ordem e justificativa. Não há teste de contrato que obrigue equivalência.

## 4. Indicadores, fórmulas e fontes

O catálogo estendido de 49 entradas está em `src/data/diagnostic/indicatorCatalog.json`; o gerador reproduzível está em `scripts/generate-diagnostic-audit-catalog.mjs`.

### 4.1 Atendimento e EPT — 11 indicadores

- `creche`, `pre_escola`, `basico_6_17`, `basico_15_17`: `100 * matrícula localizada / população residente`; denominador agregado por máximo no ano.
- `basico_integral`: matrículas integrais / matrículas públicas elegíveis.
- `escolas_integral`: escolas públicas com ao menos 25% de alunos integrais / escolas públicas elegíveis.
- `aee`: oferta/salas AEE / turmas de educação especial; proxy informativo, denominador inadequado ao público-alvo.
- `eja_integrada_educacao_profissional_percentual`: matrículas EJA articuladas / EJA elegível, com marcos 25% e 50%.
- `medio_tecnico_articulado_percentual`: matrículas integradas / matrículas do ensino médio; concomitantes ficam apenas no apoio.
- `medio_tecnico_participacao_publica`: participação pública nas expansões anuais positivas acumuladas.
- `subsequente_expansao`: crescimento acumulado sobre base 2015.

Fonte predominante: Censo Escolar/Sinopse INEP; os quatro indicadores etários combinam base de matrícula com população municipal por idade. A proveniência completa dessa população não acompanha o resultado municipal.

### 4.2 Aprendizagem e fluxo — 10 indicadores

- `alfabetizacao`: média municipal da taxa de alfabetização da rede pública; a tabela de origem externa não é identificada no contrato.
- seis SAEB: soma das parcelas classificadas em nível adequado ou superior por etapa e componente; o nível básico existe aninhado, mas não entra no card/prioridade.
- três `idade_regular_*`: média da taxa por etapa-proxy.

Fonte: SAEB/INEP para proficiência; Censo/indicadores derivados para fluxo. Periodicidade e anos diferem e precisam aparecer na comparação.

### 4.3 Corpo docente — 6 indicadores

- três `adequacao_*`: média do percentual de formação adequada por etapa, dependência total;
- `pos_graduacao`: docentes com pós-graduação / total de docentes;
- `temporarios`: temporários / docentes públicos, direção `at_most`;
- `rendimento_magisterio`: rendimento médio do magistério com nível superior / outros assalariados com nível superior.

A origem do indicador de rendimento está escondida atrás da tabela do pipeline; não há URL, edição ou método amostral no payload.

### 4.4 Infraestrutura — 17 indicadores

Todos usam razão de contagens anuais, em geral escola com atributo / escolas; `salas_climatizadas` e `salas_acessiveis` usam salas com atributo / salas utilizadas. Internet, equipamentos, PPP e AEE são informativos/proxies; educação ambiental, conselho, climatização e acessibilidade acompanham metas com graus diferentes de correspondência.

São respostas declaratórias do Censo Escolar. A presença não prova velocidade, funcionamento, suficiência, uso pedagógico, conforto térmico ou acessibilidade integral.

### 4.5 Escolaridade da população — 5 indicadores

Razões sobre Censos Demográficos 2010/2022:

- alfabetização 15+;
- fundamental concluído 18+;
- fundamental concluído 15–29;
- médio concluído 18+;
- médio concluído 18–29.

A longa defasagem é estrutural. `fundamental_concluido_18_mais` não corresponde à idade 15+ da Meta 11.b e deve ser proxy.

## 5. Conferência com o PNE 2026–2036

Fontes oficiais: [Lei nº 15.388/2026 no Planalto](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15388.htm), [texto atualizado da Câmara](https://www2.camara.leg.br/legin/fed/lei/2026/lei-15388-14-abril-2026-798950-normaatualizada-pl.html) e [registro legislativo do Senado](https://legis.senado.leg.br/norma/43047141).

A lei foi publicada em 15/04/2026 e não tinha revogação expressa. O Anexo III dá 180 dias para o Inep estabelecer indicadores e projeções das metas por ente e prevê a primeira publicação do monitoramento após 18 meses. Em 19/07/2026, a ausência desses artefatos ainda estava dentro do prazo legal.

Resultado da conferência textual:

- 73 metas oficiais identificadas;
- 73 metas locais identificadas;
- nenhuma meta ausente ou extra;
- três diferenças de texto automáticas explicadas por espaço ao redor de itálico (`bullying`, `wi-fi` e uma pontuação), sem diferença semântica.

Incompatibilidades operacionais prioritárias:

| Indicador | Implementação | Lei vigente / conclusão |
|---|---|---|
| `creche` | cobertura matrícula/população | Meta 1.a também exige 100% da demanda manifesta; correspondência parcial |
| `basico_15_17` | alvo 85% | Meta 4.a universaliza 6–17 até o terceiro ano; alvo incompatível |
| `alfabetizacao` | alvo direto 100% | Meta 3.a: 80% no quinto ano e 100% no decênio; marco intermediário omitido |
| SAEB | somente adequado, marco 2031 | metas também exigem 100% no básico e 90/85/80 no fim do decênio |
| AEE | turmas AEE / turmas de educação especial | Meta 10.b usa público do AEE; proxy não comparável |
| `medio_tecnico_articulado_percentual` | somente integrado / ensino médio | Meta 12.a inclui integrado **ou concomitante**; correspondência parcial |
| `fundamental_concluido_18_mais` | população 18+ | Meta 11.b usa 15+; proxy etária |
| `salas_climatizadas` | salas climatizadas | Meta 8.b fala estabelecimentos e padrões de conforto; proxy parcial |
| `salas_acessiveis` | salas acessíveis | Meta 19.c trata condições mínimas completas; indicador parcial |

O metadado `validatedAgainstOfficialLaw: false` está obsoleto em relação à conferência textual, mas não deve ser simplesmente trocado por `true`: é preciso separar `legalTextValidated` de `indicatorOperationalizationValidated`.

## 6. Qualidade dos dados

Foi executado `python scripts/audit_pne2026_indicators.py` antes das alterações. Resultado:

- 497 municípios únicos;
- 49 indicadores de catálogo;
- cinco amostras reconciliadas entre payload público, detalhes e exportação do pipeline, com 32–33 checagens automáticas por município e 16–17 itens não automaticamente comparáveis;
- seis indicadores percentuais com valores acima de 100:

| Indicador | Municípios > 100 | Faixa observada |
|---|---:|---:|
| creche | 11 | 0 a 148,052 |
| pré-escola | 429 | 18,421 a 240,625 |
| 6–17 | 163 | 40,580 a 155,652 |
| 15–17 | 142 | 14,679 a 334,386 |
| AEE | 98 | 0 a 425 |
| pós-graduação | 6 | 7,895 a 134,975 |

Interpretação:

- nas quatro coberturas etárias, a definição operacional usa matrículas localizadas e população residente estimada; mobilidade escolar e oferta regional tornam possíveis valores acima de 100%, que permanecem válidos no índice;
- AEE tem denominador conceitualmente incompatível;
- pós-graduação acima de 100 não é plausível e exige reconciliação de docentes/numerador, duplicidades e agregação;
- `creche`, `pre_escola`, `basico_6_17` e `basico_15_17` preservam o número integral na apresentação e nos cálculos; somente uma largura gráfica pode ser limitada visualmente;
- benchmarks desses indicadores devem incluir valores acima de 100% quando fórmula, ano, faixa etária e fontes forem equivalentes, sem cap antes de média, razão estadual, mediana, quartis, percentis, tendência, distância ou ritmo;
- a limitação territorial afeta a interpretação e não comprova atendimento individual de todos os residentes, mas não invalida nem exclui o indicador.

Outras limitações:

- dados nulos não são tratados como zero no pipeline estadual, mas o diagnóstico não publica cobertura de fonte;
- detalhes por dependência existem de modo desigual;
- a auditoria estadual registra discrepância de 26.511 docentes entre fontes de totais;
- validação populacional externa independente não está disponível no artefato estadual;
- séries do Censo Demográfico têm apenas 2010/2022 para esses indicadores.

A lista estruturada de ausências está em `docs/data/dados_ausentes_diagnostico.json`.

## 7. Projeções e cenários

### 7.1 Atendimento — sete chaves

`pne_2026_projections.py` gera `creche`, `pre_escola`, `basico_6_17`, `basico_15_17` e três agregados informativos (`infantil_0_5`, `obrigatoria_4_17`, `escolar_6_14`) para 2026–2036.

Método:

- base preferida 2025;
- inclinação do numerador: Theil–Sen com pelo menos cinco pontos, regressão linear com três/quatro e inclinação zero com menos;
- mediana dos três últimos anos como base;
- amortecimento e limite de ±8% ao ano no numerador;
- denominador municipal do último ano multiplicado pela variação da faixa etária na projeção estadual do RS;
- percentual limitado por variação anual e teto plausível; creche usa teto 85%, demais 100%; bruto e exibido são preservados no contrato de educação;
- qualidade `media`/`baixa` e avisos, sem intervalo de previsão.

Riscos:

- fonte populacional apontada por caminho relativo a outro projeto e caminho absoluto do usuário;
- projeção demográfica estadual aplicada ao município não captura dinâmica migratória local;
- limites são regras de plausibilidade, não incerteza estatística;
- `projected_percent` e `projected_percent_raw` podem divergir;
- Nova Santa Rita produz 125,31% bruto em pré-escola e 109,74% em 6–17; esses resultados são valores elevados do índice operacional, não cobertura individual superior a 100%.

### 7.2 Planejamento — quatro chaves

`projections_v2.py` publica manutenção de últimos componentes para `basico_integral`, `escolas_integral`, `pos_graduacao` e `temporarios`.

- estratégia: razão de contagens;
- modelo selecionado no backtest: `last_components`;
- alvo: `configured_unvalidated`;
- trajetória requerida separada do cenário de manutenção;
- qualidade baseada em histórico, lacunas, denominador, volatilidade, violações e backtest;
- documentação existente cobre MAE/bias e mostra pior desempenho relativo em denominadores pequenos.

Esses quatro cenários não devem ser chamados de tendência: são persistência dos componentes observados.

### 7.3 Estado e página Educação

A referência estadual projeta razões agregadas e registra cobertura. Nove pontos estaduais projetados excedem 100 no bruto, conforme documentação existente. O contrato `education-attendance-v2` escolhe trajetórias apresentáveis, preserva bruto/capado e exclui cenários constantes como “projeção” salvo trajetórias de planejamento explicitamente configuradas.

Recomendação: envelope único de tipos, sem unificar os métodos; cada cenário deve declarar `scenarioType`, `model`, fonte, alvo, qualidade, incerteza, bruto e limites.

## 8. Comparação com RS e pares

`referencia_estadual.json` contém 50 registros (inclui uma chave legada), dos quais:

- 34 `comparable`;
- 16 `methodology_pending`: AEE, alfabetização infantil, três idades regulares, três adequações docentes, rendimento e seis SAEB, além de chave EJA legada.

Para razões, o método correto é `100 * Σnumerador/Σdenominador`, com pares válidos, denominador zero nulo e cobertura explícita. Isso evita média municipal não ponderada.

O módulo Diagnóstico não carrega esse artefato. Também não há:

- mediana/Q1/Q3/percentil no payload do diagnóstico;
- COREDE ou CRE;
- coorte por porte, perfil da rede, ruralidade e NSE;
- lista de pares e regra de relaxamento.

O JSON de Nova Santa Rita calcula apenas a distribuição estadual municipal do mesmo ano, com exclusões de domínio registradas. Ele não chama essa distribuição de “pares semelhantes”. A metodologia de coorte está em `docs/METODOLOGIA_PRIORIZACAO_PROPOSTA.md`.

## 9. Governabilidade municipal

| Classe | Exemplos | Leitura correta |
|---|---|---|
| Direta | creche e pré-escola da rede municipal | município planeja oferta, profissionais e atendimento, mas o indicador territorial inclui outras redes e mobilidade |
| Compartilhada | 6–17, ensino fundamental, tempo integral, AEE, infraestrutura pública | exige decomposição por dependência e pactuação; percentual territorial não é desempenho exclusivo da prefeitura |
| Indireta/Estado | ensino médio, SAEB EM, grande parte da EPT | município pode atuar em busca ativa, transporte e colaboração, mas não controla a oferta principal |
| Territorial | escolaridade adulta e rendimento | resultado da população, com múltiplas políticas e defasagem; não atribuir causalidade à rede atual |

Governabilidade deve combinar responsabilidade e **exposição municipal**, calculada com numerador e denominador reconciliados. Em Nova Santa Rita foi possível estimar exposição somente para seis itens a partir dos detalhes: creche 65,5%, pré-escola 91,9%, 6–17 78,3%, 15–17 24,0%, matrículas integrais 99,6% e escolas públicas elegíveis 85,7%. Essas parcelas descrevem a base observada, não o impacto causal.

## 10. Relações entre indicadores

O repositório não possui modelo explícito de relações. Relações plausíveis — infraestrutura e jornada, transporte/alimentação e permanência, formação e aprendizagem, conectividade e uso pedagógico — não autorizam inferência causal automática.

A proposta usa cadeia `insumo → capacidade/atividade → processo/cobertura → resultado → meta`, com relação `hypothesis`, `association` ou `supported`. Isso permite sugerir perguntas e dados necessários sem afirmar que financiar um insumo produzirá a variação esperada no resultado.

## 11. Financiamento

O repositório contém consultas SQL históricas para Fundeb e PNATE, mas o diagnóstico não integra capacidade financeira, execução ou elegibilidade. Foram catalogados 18 mecanismos/fontes/sistemas em `src/data/diagnostic/financingPrograms.json` e relacionados aos 49 indicadores.

Distinções obrigatórias:

- transferências automáticas: Fundeb, QSE, PNAE, PNATE, observadas regras próprias;
- complementações condicionadas: VAAT/VAAR;
- adesão/seleção: PAR, infraestrutura, Novo PAC, tempo integral, formação;
- informação: SIOPE e SICONFI/FINBRA — não são dinheiro.

Não foi inferida elegibilidade de Nova Santa Rita. O mapa e a fórmula de lacuna financeira estão em `docs/MAPA_FONTES_FINANCIAMENTO.md`.

## 12. Estudo de caso e robustez

O estudo legível está em `docs/NOVA_SANTA_RITA_DIAGNOSTICO_EXEMPLO.md`; o contrato completo, com 46 avaliações e três ausências, está em `docs/data/nova_santa_rita_diagnostico_exemplo.json`.

O contraste adicional usa:

- André da Rocha: denominador integral 188 em 2025; MAE de backtest 5,914 p.p.;
- Porto Alegre: denominador 138.494; MAE 2,049 p.p.

O primeiro evidencia instabilidade discreta; o segundo exige desigualdade intraurbana. Percentual sem denominador falha nos dois extremos por razões diferentes.

## 13. Entregáveis e recomendação priorizada

Entregáveis criados:

- contrato tipado proposto;
- catálogo estendido de 49 indicadores;
- catálogo de 18 mecanismos de financiamento;
- matriz indicador × financiamento;
- metodologia de priorização;
- caso completo de Nova Santa Rita;
- lista estruturada de dados ausentes;
- plano de implementação.

Ordem recomendada:

1. **P0:** impedir distâncias legalmente incompatíveis e separar validação textual de validação operacional;
2. **P1:** tornar o pipeline a fonte única da análise e eliminar a duplicação React/pipeline;
3. **P2:** unificar contratos de cenário, proveniência e incerteza;
4. **P3:** integrar RS, pares e dependência administrativa;
5. **P4:** desigualdades e relações com grau de evidência;
6. **P5:** finanças e elegibilidade nominal;
7. **P6:** somente então publicar escore e adaptar interface.

Critérios detalhados estão em `docs/DIAGNOSTICO_MUNICIPAL_IMPLEMENTACAO.md`.

## 14. Limitações desta auditoria

- não acessa cadastro local de demanda, orçamento, capacidade, projetos ou sistemas autenticados do município;
- não valida individualmente a origem externa de todas as tabelas internas do banco;
- não cria indicador oficial antes do Inep;
- não transforma programa existente em recurso disponível;
- não estima causalidade;
- não altera UI, conteúdo analítico publicado ou arquivos gerados em `public/data`;
- o escore proposto depende de calibração e validação humana antes de produção.

## 15. Validação executada

Ambiente: Windows/PowerShell, Node.js v24.16.0, Vite 8, Playwright instalado no projeto. Os comandos foram executados em 19/07/2026, sem atualização de baselines.

| Comando | Resultado | Observação |
|---|---|---|
| `python scripts/audit_pne2026_indicators.py` | passou | 497 municípios, 49 indicadores; seis famílias com valores >100 detalhadas na seção 6 |
| `npm run typecheck` | falhou, código 2 | erros em arquivos já modificados fora do escopo: `cardScenarios.tsx`, `EducationMethodologySection.tsx` e `EducationPage.tsx`; nenhum erro apontou para os artefatos desta auditoria |
| `npm run lint` | passou | ESLint do repositório completo |
| `npm run check:units` | falhou, código 1 | catálogo público atual não possui `value_mode` em muitos indicadores dos dois ciclos; o teste lista cada chave ausente |
| `npm run check:state-reference` | passou | suíte Python de referência estadual/pipeline |
| `npm run check:state-json` | passou | referência 2026–2036 válida, 50 registros e 497 municípios esperados |
| `npm run check:state-json:closed` | passou | referência 2014–2024 válida, 24 registros e 497 municípios esperados |
| `npm run test:education` | passou | 21/21 testes |
| `npm run test:app-routing` | passou | 7/7 testes |
| `npm run test:pne-cycle` | passou | 15/15 testes |
| `npm run test:dev-ui` | falhou, código 1 | interrompido pelo `tsc` do catálogo nos mesmos erros de tipos já citados |
| `npm run validate:details` | passou | código 0; reportou 1.635 avisos/problemas permitidos no padrão atual, sobretudo mistura de `publica` com dependências e séries zeradas/nulas |
| `npm run build` | passou | Vite concluiu em 4,99 s |
| `npm run test:e2e` | falhou inicialmente por servidor ausente | o script exige Vite ativo em `localhost:5173` |
| `npm run test:e2e` com Vite ativo | falhou, código 1 | asserção preexistente na página Educação: “ressalva geral fica visível”, esperado 1 e obtido 0 |
| `npm run test:visual` | falhou inicialmente por servidor ausente | repetido somente após iniciar o servidor exigido |
| `npm run test:visual` com Vite ativo | falhou, código 1 | 10/23 casos passaram; 13 divergências em PNE, Educação, Fundeb e SIOPE; baselines não atualizados |
| `npm run test:dev-ui:visual` | falhou, código 1 | 21/31 casos passaram; dez regressões em cards, Educação, Financiamento e gráficos; baselines não atualizados |
| conferência referencial dos novos JSONs | passou | 49 indicadores únicos, 18 programas únicos, 18 vínculos matriciais sem referência inválida, 49 indicadores cobertos no caso e 16 grupos de ausência |

As falhas visuais e de tipos atingem arquivos/telas que já estavam modificados na árvore de trabalho antes desta auditoria. Os novos JSONs e documentos não são consumidos pela interface atual e não alteram pixels. Os artefatos visuais de resultado/diff gerados pelos testes foram deixados conforme o comportamento normal dos scripts; nenhum baseline foi atualizado.
