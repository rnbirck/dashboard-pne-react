# DF0 — Inventário publicável de cruzamentos entre o Diagnóstico municipal e o financiamento da educação

Versão auditada: 1  
Data-base dos contratos: 20/07/2026  
Escopo territorial: 497 municípios do Rio Grande do Sul  
Contratos congelados: municipal-diagnostic-v2 e municipal-finance-v1

Este documento registra somente o que já pode ser publicado com os dados e as regras existentes. Ele não altera indicadores, contratos, schemas, pipeline, JSONs ou interface.

## 1. Resumo executivo

A leitura conjunta dos 49 indicadores, da matriz indicador × financiamento e dos 497 pares de contratos municipais produz o seguinte inventário conservador:

| Medida | Resultado |
|---|---:|
| Indicadores com pelo menos uma relação financeira específica publicável | 16 de 49 |
| Mecanismos aptos para a primeira versão | 15 |
| Mecanismos com somente finalidade ou regra publicável, sem situação ou valor municipal integrado | 11 |
| Mecanismos com situação nominal municipal publicável | 4 |
| Mecanismos com algum valor municipal publicável | 4 |
| Campos municipais utilizáveis | 26 |
| Relações específicas aprovadas | 60 |
| Relações na categoria A | 0 |
| Relações na categoria B | 5 |
| Relações na categoria C | 55 |
| Recursos gerais na categoria D | 3 |
| Caso que permita calcular ganho ou perda de forma reproduzível | 0 |

Os 16 indicadores aprovados são os que simultaneamente:

1. têm associação específica no catálogo/matriz atual;
2. aparecem em pelo menos um contrato municipal em decisionSummary.municipalActionItems ou decisionSummary.coordinationItems;
3. não dependem do Programa Nacional de Infraestrutura Escolar, ainda pendente de regulamentação registrada no catálogo;
4. admitem texto público sem inferir elegibilidade, seleção, chamada aberta, recebimento, saldo ou efeito financeiro.

Não há relação A aprovada. A matriz contém relações internas do tipo conditioned ou direct, mas esses rótulos não bastam para afirmar que o resultado determina acesso ou valor. As cinco relações B são os cruzamentos de VAAR com indicadores acionáveis atuais. As demais relações específicas são C: o programa pode apoiar uma ação relacionada, sem que o indicador determine o recebimento.

Fundeb/VAAF, Fundeb/VAAT e Salário-Educação são recursos gerais D e devem aparecer uma única vez no resumo de financiamento ou no Panorama financeiro. A VAAR também possui informação sistêmica geral, mas só aparece no detalhe de indicador nos cinco cruzamentos B aprovados.

Os quatro mecanismos com evidência municipal são Fundeb/VAAF, VAAT, VAAR e Salário-Educação. Os três primeiros têm situação em programStatuses; no Salário-Educação, a evidência municipal é o valor nominal distribuído com natureza transferred/confirmed. Esses mesmos quatro mecanismos concentram todos os valores municipais disponíveis.

Nenhum valor foi interpretado como ganho, perda, saldo ou disponibilidade. Previsões de 2026 continuam sendo previsões; valores declarados pelo município continuam declarados; somente a QSE distribuída de 2024 é tratada como transferência confirmada pelo concedente no contrato atual.

## 2. Arquivos reais encontrados e inspecionados

### 2.1 Regra de produto e documentação do diagnóstico

- docs/PLANO_DIRETRIZ_PRODUTO_APP_PNE.md
- docs/DIAGNOSTICO_MUNICIPAL_IMPLEMENTACAO.md
- docs/DIAGNOSTICO_MUNICIPAL_SCHEMA_V2.md
- docs/DIAGNOSTICO_MUNICIPAL_SINTESE_DECISAO.md
- docs/DIAGNOSTICO_MUNICIPAL_VALIDACAO_P3C.md
- docs/DIAGNOSTICO_MUNICIPAL_IMPLEMENTACAO_RS_FINANCIAMENTO.md
- docs/DIAGNOSTICO_MUNICIPAL_RELACOES_INDICADORES.md

### 2.2 Catálogos, matriz, contratos e índices

- src/data/diagnostic/indicatorCatalog.json — catálogo dos 49 indicadores
- src/data/diagnostic/financingPrograms.json — catálogo de 18 programas, recursos e sistemas
- src/data/diagnostic/indicatorFinancingMatrix.json — 18 grupos de vínculos
- public/data/municipios_index.json — índice dos 497 municípios
- public/data/municipios/<slug>/diagnostico.json — 497 contratos de diagnóstico
- public/data/municipios/<slug>/financeiro.json — 497 contratos financeiros
- public/data/financeiro/manifest.json
- public/data/financeiro/catalogos.json
- public/data/financeiro/cobertura.json

### 2.3 Pipeline, tipos, apresentação e componentes

- data_pipeline/src/municipal_diagnostic.py
- data_pipeline/src/municipal_finance.py
- src/features/diagnostic/diagnosticTypes.ts
- src/features/diagnostic/municipalFinanceTypes.ts
- src/features/diagnostic/diagnosticPresentation.js
- src/features/municipal-finance/municipalFinancePresentation.ts
- src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx
- src/components/DiagnosticPanel.jsx
- src/data/municipalFinance.ts
- arquivos de dados estáticos, carregamento e rotas referenciados pelos módulos acima

### 2.4 Documentação financeira

- docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_METODOLOGIA.md
- docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_FONTES.md
- docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_SCHEMA_V1.md
- docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_IMPLEMENTACAO_P5B1.md
- docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_AUDITORIA_P5B2.md
- docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_RECONCILIACAO.md
- docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_IMPLEMENTACAO_P5B2B1.md
- docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_INTERFACE_P5C1.md

### 2.5 Uniformidade observada

- 497 de 497 diagnósticos: schemaVersion municipal-diagnostic-v2, methodologyVersion municipal-diagnostic-p3c-v1 e exatamente 49 indicadores com o mesmo conjunto de IDs.
- 497 de 497 financeiros: schemaVersion municipal-finance-v1, methodologyVersion municipal-finance-p5b2b1-v1 e dataVersion p5b2b1-2024-p6-2026-07-20.
- Não foi encontrada deriva de schema, versão ou estrutura obrigatória. Quando se contam também chaves opcionais de objetos anuláveis — por exemplo value versus nullReasonCode e metadados de composição — há 14 variantes esperadas de forma interna, todas compatíveis com o mesmo schema.
- Cada financeiro contém exatamente dois educationLinks atuais. Eles não são uma matriz pública pronta: um repete QSE como recurso geral para creche; o outro liga VAAR a alfabetizacao, que está em investigação nos 497 diagnósticos. Ambos precisam ser filtrados pela matriz aprovada, não exibidos literalmente.

## 3. Matriz de relações aprovadas

### 3.1 Regra de aprovação e cobertura municipal

As categorias públicas significam:

- A — resultado ou condição que pode influenciar um recurso: exige regra oficial documentada ligando o resultado/condição ao acesso ou valor. Nenhuma relação atual atingiu esse padrão.
- B — resultado que ajuda a cumprir uma condição: relação oficial, mas o indicador não determina isoladamente o recebimento.
- C — programa que pode apoiar a melhoria: o desenho do programa pode apoiar ação relacionada ao indicador.
- D — recurso geral da educação: recurso amplo, sem vínculo causal com indicador isolado.

Para uma relação específica B ou C aparecer futuramente no detalhe de um município, o ID do indicador deve estar no contrato daquele município em:

- decisionSummary.municipalActionItems; ou
- decisionSummary.coordinationItems.

Indicadores presentes somente em investigation não geram financiamento. Assim, “municípios da relação” significa exatamente o conjunto dos contratos que satisfaz esse predicado. A coluna “municípios habilitados pelo diagnóstico” abaixo é a contagem desse conjunto nos 497 arquivos reais. O conjunto nominal é verificável diretamente em public/data/municipios/<slug>/diagnostico.json, sem tabela paralela que possa divergir dos contratos.

Para VAAR, além desse filtro educacional, a situação e o valor municipal vêm de programStatuses.fundebVaar e amounts.fundebVaarAnnualForecast. Para programas C, não há campo municipal integrado: publica-se somente finalidade/regra e nunca elegibilidade ou recebimento.

### 3.2 Auditoria dos 49 indicadores

As fontes gerais D existentes na matriz — fundeb_vaaf, fundeb_vaat e salario_educacao_qsem — alcançam os 49 IDs, mas não são repetidas nas linhas abaixo nem em cada indicador.

| ID real | Nome atual | Tema | Grupo interno nos 497 contratos | Vínculos específicos atuais | Resultado DF0 |
|---|---|---|---|---|---|
| creche | População de 0 a 3 anos que frequenta a escola/creche | atendimento | ação municipal: 243 | VAAR, PAR, Novo PAC, PNAE, PNATE, Caminho da Escola, PEATE/RS | 7 relações aprovadas |
| pre_escola | População de 4 a 5 anos que frequenta a escola/creche | atendimento | ação municipal: 178 | VAAR, PAR, Novo PAC, PNAE, PNATE, Caminho da Escola, PEATE/RS | 7 relações aprovadas |
| basico_6_17 | População de 6 a 17 anos que frequenta a educação básica | atendimento | coordenação federativa: 346 | VAAR, PAR, PNAE, PNATE, Caminho da Escola, PEATE/RS | 6 relações aprovadas |
| basico_15_17 | Matrículas da educação básica de estudantes de 15 a 17 anos em relação à população da faixa | atendimento | sem ação/coordenação: 0 | VAAR, PAR, PNAE, PNATE, Caminho da Escola, PEATE/RS | omitido: somente investigação |
| basico_integral | Alunos do público-alvo da ETI em jornada integral na rede pública | atendimento | coordenação federativa: 9 | PAR, Novo PAC, Escola em Tempo Integral, PNAE, PNATE, Caminho da Escola | 6 relações aprovadas |
| escolas_integral | Escolas públicas com alunos em jornada de tempo integral | atendimento | ação municipal: 288 | PAR, Novo PAC, Escola em Tempo Integral, PNAE, PNATE, Caminho da Escola | 6 relações aprovadas |
| aee | Oferta de AEE e salas de recursos na educação especial | atendimento | sem ação/coordenação: 0 | PAR | omitido: somente investigação |
| eja_integrada_educacao_profissional_percentual | Percentual das matrículas da EJA articuladas à educação profissional | atendimento | coordenação federativa: 13 | PAR | 1 relação aprovada |
| medio_tecnico_articulado_percentual | Ensino médio articulado à educação profissional técnica | atendimento | sem ação/coordenação: 0 | PAR | omitido: somente investigação |
| medio_tecnico_participacao_publica | Participação acumulada do segmento público na expansão da EPT de nível médio | atendimento | sem ação/coordenação: 0 | nenhum vínculo específico | omitido |
| subsequente_expansao | Expansão acumulada das matrículas em cursos técnicos subsequentes | atendimento | sem ação/coordenação: 0 | nenhum vínculo específico | omitido |
| alfabetizacao | Estudantes alfabetizados na rede pública | rendimento | sem ação/coordenação: 0 | VAAR, PAR, PNAE | omitido: investigação nos 497 municípios |
| saeb_matematica_anos_iniciais | Desempenho em Matemática — anos iniciais | rendimento | sem ação/coordenação: 0 | VAAR | omitido: somente investigação |
| saeb_matematica_anos_finais | Desempenho em Matemática — anos finais | rendimento | sem ação/coordenação: 0 | VAAR | omitido: somente investigação |
| saeb_matematica_ensino_medio | Desempenho em Matemática — ensino médio | rendimento | sem ação/coordenação: 0 | VAAR | omitido: somente investigação |
| saeb_portugues_anos_iniciais | Desempenho em Português — anos iniciais | rendimento | sem ação/coordenação: 0 | VAAR | omitido: somente investigação |
| saeb_portugues_anos_finais | Desempenho em Português — anos finais | rendimento | sem ação/coordenação: 0 | VAAR | omitido: somente investigação |
| saeb_portugues_ensino_medio | Desempenho em Português — ensino médio | rendimento | sem ação/coordenação: 0 | VAAR | omitido: somente investigação |
| idade_regular_quinto | Estudantes que concluem os anos iniciais na idade regular | rendimento | coordenação federativa: 8 | VAAR, PAR, PNAE | 3 relações aprovadas |
| idade_regular_nono | Estudantes que concluem os anos finais na idade regular | rendimento | coordenação federativa: 2 | VAAR, PAR, PNAE | 3 relações aprovadas |
| idade_regular_medio | Estudantes que concluem o ensino médio na idade regular | rendimento | sem ação/coordenação: 0 | VAAR, PAR, PNAE | omitido: somente investigação |
| adequacao_ai | Docentes com formação adequada nos anos iniciais | corpo docente | coordenação federativa: 9 | PAR, PARFOR, Bolsa Mais Professores | 3 relações aprovadas |
| adequacao_af | Docentes com formação adequada nos anos finais | corpo docente | coordenação federativa: 20 | PAR, PARFOR, Bolsa Mais Professores | 3 relações aprovadas |
| adequacao_em | Docentes com formação adequada no ensino médio | corpo docente | sem ação/coordenação: 0 | PAR, PARFOR, Bolsa Mais Professores | omitido: somente investigação |
| pos_graduacao | Docentes da educação básica com pós-graduação | corpo docente | coordenação federativa: 147 | PAR, ProEB/CAPES, Bolsa Mais Professores | 3 relações aprovadas |
| rendimento_magisterio | Rendimento do magistério em relação a outros profissionais com nível superior | corpo docente | coordenação federativa: 6 | PAR | 1 relação aprovada |
| temporarios | Docentes da rede pública com contrato temporário | corpo docente | coordenação federativa: 243 | PAR, Bolsa Mais Professores | 2 relações aprovadas |
| internet | Escolas da educação básica com acesso à internet | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| internet_alunos | Escolas com internet disponível para os alunos | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| internet_aprendizagem | Escolas com internet usada na aprendizagem | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| internet_comunidade | Escolas com internet aberta à comunidade | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| acesso_internet_computador | Escolas com acesso dos alunos à internet por computador | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| acesso_internet_disp_pessoais | Escolas com acesso dos alunos à internet por dispositivos pessoais | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| rede_local | Escolas com rede local de computadores | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| rede_wireless | Escolas com rede local sem fio | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| banda_larga | Escolas com internet banda larga | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| educacao_ambiental | Escolas que promovem educação ambiental | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| conselho_escolar | Escolas públicas com conselho escolar instituído e em funcionamento | infraestrutura | coordenação federativa: 177 | PAR, programa de infraestrutura pendente, PDDE | 2 relações aprovadas; programa pendente excluído |
| proposta_pedagogica | Escolas públicas com projeto político pedagógico | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| salas_climatizadas | Salas de aula climatizadas | infraestrutura | coordenação federativa: 5 | PAR, programa de infraestrutura pendente, Novo PAC, PDDE | 3 relações aprovadas; programa pendente excluído |
| salas_acessiveis | Salas de aula com acessibilidade | infraestrutura | coordenação federativa: 9 | PAR, programa de infraestrutura pendente, Novo PAC, Caminho da Escola, PDDE | 4 relações aprovadas; programa pendente excluído |
| desktop_aluno | Escolas com computadores de mesa para alunos | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| comp_portatil_aluno | Escolas com computadores portáteis para alunos | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| tablet_aluno | Escolas com tablets para alunos | infraestrutura | sem ação/coordenação: 0 | PAR, programa de infraestrutura pendente, PDDE | omitido |
| alfabetizacao_pop_15_mais | Taxa de alfabetização da população de 15 anos ou mais | escolaridade da população | sem ação/coordenação: 0 | nenhum vínculo específico | omitido |
| fundamental_concluido_18_mais | População de 18 anos ou mais com ensino fundamental concluído | escolaridade da população | sem ação/coordenação: 0 | nenhum vínculo específico | omitido |
| fundamental_concluido_15_29 | População de 15 a 29 anos com ensino fundamental concluído | escolaridade da população | sem ação/coordenação: 0 | nenhum vínculo específico | omitido |
| medio_concluido_18_mais | População de 18 anos ou mais com ensino médio concluído | escolaridade da população | sem ação/coordenação: 0 | nenhum vínculo específico | omitido |
| medio_concluido_18_29 | População de 18 a 29 anos com ensino médio concluído | escolaridade da população | sem ação/coordenação: 0 | nenhum vínculo específico | omitido |

### 3.3 Regras compartilhadas das relações

Para manter a matriz legível e impedir divergência entre linhas repetidas, as propriedades do mecanismo são canônicas nesta tabela. Cada linha da seção 3.4 referencia uma destas regras.

| Código | ID e nome oficial | Nome público recomendado | Finalidade e explicação simples | Fonte oficial e período | Tipo interno | Campo municipal real | Situação/valor e cobertura | Local futuro |
|---|---|---|---|---|---|---|---|---|
| M-VAAR | fundeb_vaar — Complementação-VAAR do Fundeb | Complementação VAAR do Fundeb | Condicionalidade do Fundeb. Melhorar o resultado pode ajudar a cumprir uma condição, mas não determina sozinho o benefício. | FNDE, lista nominal e previsão 2026; fnde_fundeb_vaar_status_2026 e fnde_fundeb_vaar_forecast_2026 | conditioned | programStatuses.fundebVaar.status; amounts.fundebVaarAnnualForecast | situação: 497/497, sendo 274 beneficiários e 223 não beneficiários; previsão: 274/497 | detalhe do indicador e resumo financeiro, consolidados |
| M-PAR | par_novo_par — Plano de Ações Articuladas (PAR/Novo PAR) | Novo PAR | O diagnóstico pode fundamentar iniciativa, sujeita a cadastro, análise técnica e orçamento. | FNDE, PAR/Novo PAR, verificado em 2026: https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/par | programmatic | nenhum | sem situação ou valor municipal integrado | detalhe do indicador |
| M-PAC | novo_pac_educacao — Novo PAC Seleções, educação básica | Novo PAC Educação | Pode apoiar expansão e infraestrutura quando houver seleção aplicável; não prova chamada aberta nem seleção do município. | Casa Civil, Manual Educação Seleções 2025: https://www.gov.br/casacivil/pt-br/novopac/selecoes2025/eixos/educacao-ciencia-e-tecnologia/arquivos/novopacmanualeducaoselecoes2025-27-02-25-trava.pdf | programmatic | nenhum | sem situação ou valor municipal integrado | detalhe do indicador |
| M-ETI | escola_tempo_integral — Programa Escola em Tempo Integral | Escola em Tempo Integral | Fomenta criação, manutenção e qualificação de matrículas em tempo integral mediante adesão e pactuação. | MEC, execução 2025: https://www.gov.br/mec/pt-br/acesso-a-informacao/perguntas-frequentes/programa-escola-em-tempo-integral/execucao-dos-recursos-2025-das-matriculas-em-tempo-integral-portarias-no-605-e-no-669-2025/a-rede-devera-seguir-o | direct | nenhum | sem situação ou valor municipal integrado | detalhe do indicador |
| M-PNAE | pnae — Programa Nacional de Alimentação Escolar | Alimentação Escolar (PNAE) | Pode apoiar permanência e jornada por meio da alimentação escolar; não financia genericamente a lacuna. | FNDE, programa vigente: https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae | programmatic | nenhum | sem situação ou valor municipal integrado | detalhe do indicador |
| M-PNATE | pnate — Programa Nacional de Apoio ao Transporte do Escolar | Transporte Escolar (PNATE) | Pode apoiar acesso e permanência de estudantes públicos rurais elegíveis. | FNDE, programa vigente: https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnate/pnate-home/ | programmatic | nenhum | sem situação ou valor municipal integrado | detalhe do indicador |
| M-CAM | caminho_escola — Programa Caminho da Escola | Caminho da Escola | Pode reduzir barreiras de transporte; a forma de aquisição e o atendimento dependem da via e dos requisitos. | FNDE, programa vigente: https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/caminho-da-escola | programmatic | nenhum | sem situação ou valor municipal integrado | detalhe do indicador |
| M-PDDE | pdde — Programa Dinheiro Direto na Escola e Ações Integradas | PDDE | Recursos por escola ou entidade podem apoiar pequenos investimentos e gestão; não são disponibilidade livre da secretaria. | FNDE, programa vigente: https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pdde | programmatic | nenhum | sem situação ou valor municipal integrado | detalhe do indicador |
| M-PARFOR | parfor — formação inicial de professores em serviço | PARFOR | Pode apoiar licenciatura na área de atuação, conforme oferta, manifestação e edital. | CAPES, programa vigente: https://www.gov.br/capes/pt-br/acesso-a-informacao/acoes-e-programas/educacao-basica/parfor/parfor | direct | nenhum | sem situação ou valor municipal integrado | detalhe do indicador |
| M-PROEB | proeb_capes — pós-graduação de professores da rede pública | ProEB/CAPES | Cursos e bolsas podem apoiar a pós-graduação dos docentes participantes. | CAPES, programa vigente: https://www.gov.br/capes/pt-br/acesso-a-informacao/acoes-e-programas/articulacao-e-inovacao-em-educacao-aberta/programa-de-pos-graduacao-stricto-sensu-para-qualificacao-de-professores-da-rede-publica-de-educacao-basica-proeb | direct | nenhum | sem situação ou valor municipal integrado | detalhe do indicador |
| M-BOLSA | bolsa_mais_professores — Bolsa Mais Professores | Bolsa Mais Professores | Pode apoiar atração, permanência e formação somente em localidades e áreas elegíveis; o benefício é do docente. | MEC, programa vigente: https://www.gov.br/mec/pt-br/mais-professores/bolsa-mais-professores | programmatic | nenhum | sem situação ou valor municipal integrado | detalhe do indicador |
| M-PEATE | peate_rs — Programa Estadual de Apoio ao Transporte Escolar | PEATE/RS | Pode apoiar transporte de estudantes estaduais rurais em regime de colaboração e município habilitado. | Seduc/RS, programa vigente: https://educacao.rs.gov.br/programa-estadual-de-apoio-ao-transporte-escolar-peate | programmatic | nenhum | sem situação ou valor municipal integrado | detalhe do indicador |

Regras comuns de exibição:

- EC-1 — só mostrar se o indicador estiver em ação municipal ou coordenação federativa no diagnóstico daquele município.
- EC-2 — para M-VAAR, mostrar a situação nominal apenas quando houver valor de status reconhecido; mostrar a previsão somente se value estiver preenchido. Não converter ausência em zero.
- EC-3 — para mecanismos C, o catálogo autoriza somente finalidade e regra. Não afirmar inscrição, elegibilidade, chamada aberta, seleção, atendimento, repasse ou valor.
- ND-1 — renderizar cada programa no máximo uma vez por página. Se o mesmo programa se relacionar a mais de um indicador exibido, consolidar os indicadores no mesmo cartão.
- ND-2 — não repetir recursos gerais D nos detalhes; eles pertencem ao resumo financeiro ou ao Panorama.
- FT-1 — citar somente a fonte usada no item e seu ano/vigência; não listar fonte cuja informação não apareça.

### 3.4 Relações específicas aprovadas

Na coluna de valor, “não” significa que a relação é publicável como finalidade/regra, sem informação nominal integrada. Em VAAR, a previsão é informação complementar e não cria a relação.

| Indicador real e nome público | Mecanismo real e nome público | Categoria | Explicação da relação | Fonte/ano | Campo e natureza do valor | Cobertura municipal | Local, condição e não duplicação |
|---|---|:---:|---|---|---|---|---|
| creche — População de 0 a 3 anos na escola/creche | fundeb_vaar — Complementação VAAR | B | Pode ajudar a cumprir uma das condições do recurso; não determina o benefício. | M-VAAR, 2026 | status nominal; previsão oficial em 124 dos 243 municípios do cruzamento | gate 243; status 243; previsão 124 | detalhe + resumo; EC-1, EC-2, ND-1 |
| creche — População de 0 a 3 anos na escola/creche | par_novo_par — Novo PAR | C | Pode apoiar planejamento e iniciativas relacionadas à ampliação do atendimento. | M-PAR, vigente | nenhum valor | gate 243 | detalhe; EC-1, EC-3, ND-1 |
| creche — População de 0 a 3 anos na escola/creche | novo_pac_educacao — Novo PAC Educação | C | Pode apoiar expansão de infraestrutura em seleção aplicável. | M-PAC, 2025 | nenhum valor | gate 243 | detalhe; EC-1, EC-3, ND-1 |
| creche — População de 0 a 3 anos na escola/creche | pnae — Alimentação Escolar | C | Pode apoiar permanência por alimentação escolar. | M-PNAE, vigente | nenhum valor | gate 243 | detalhe; EC-1, EC-3, ND-1 |
| creche — População de 0 a 3 anos na escola/creche | pnate — Transporte Escolar | C | Pode apoiar acesso de estudantes rurais elegíveis. | M-PNATE, vigente | nenhum valor | gate 243 | detalhe; EC-1, EC-3, ND-1 |
| creche — População de 0 a 3 anos na escola/creche | caminho_escola — Caminho da Escola | C | Pode apoiar transporte escolar conforme via e requisitos. | M-CAM, vigente | nenhum valor | gate 243 | detalhe; EC-1, EC-3, ND-1 |
| creche — População de 0 a 3 anos na escola/creche | peate_rs — PEATE/RS | C | Pode apoiar transporte de estudantes estaduais rurais em colaboração. | M-PEATE, vigente | nenhum valor | gate 243 | detalhe; EC-1, EC-3, ND-1 |
| pre_escola — População de 4 a 5 anos na escola/creche | fundeb_vaar — Complementação VAAR | B | Pode ajudar a cumprir uma das condições do recurso; não determina o benefício. | M-VAAR, 2026 | status nominal; previsão oficial em 88 dos 178 municípios do cruzamento | gate 178; status 178; previsão 88 | detalhe + resumo; EC-1, EC-2, ND-1 |
| pre_escola — População de 4 a 5 anos na escola/creche | par_novo_par — Novo PAR | C | Pode apoiar planejamento e iniciativas relacionadas à universalização. | M-PAR, vigente | nenhum valor | gate 178 | detalhe; EC-1, EC-3, ND-1 |
| pre_escola — População de 4 a 5 anos na escola/creche | novo_pac_educacao — Novo PAC Educação | C | Pode apoiar expansão de infraestrutura em seleção aplicável. | M-PAC, 2025 | nenhum valor | gate 178 | detalhe; EC-1, EC-3, ND-1 |
| pre_escola — População de 4 a 5 anos na escola/creche | pnae — Alimentação Escolar | C | Pode apoiar permanência por alimentação escolar. | M-PNAE, vigente | nenhum valor | gate 178 | detalhe; EC-1, EC-3, ND-1 |
| pre_escola — População de 4 a 5 anos na escola/creche | pnate — Transporte Escolar | C | Pode apoiar acesso de estudantes rurais elegíveis. | M-PNATE, vigente | nenhum valor | gate 178 | detalhe; EC-1, EC-3, ND-1 |
| pre_escola — População de 4 a 5 anos na escola/creche | caminho_escola — Caminho da Escola | C | Pode apoiar transporte escolar conforme via e requisitos. | M-CAM, vigente | nenhum valor | gate 178 | detalhe; EC-1, EC-3, ND-1 |
| pre_escola — População de 4 a 5 anos na escola/creche | peate_rs — PEATE/RS | C | Pode apoiar transporte de estudantes estaduais rurais em colaboração. | M-PEATE, vigente | nenhum valor | gate 178 | detalhe; EC-1, EC-3, ND-1 |
| basico_6_17 — População de 6 a 17 anos na educação básica | fundeb_vaar — Complementação VAAR | B | Pode ajudar a cumprir uma das condições do recurso; não determina o benefício. | M-VAAR, 2026 | status nominal; previsão oficial em 198 dos 346 municípios do cruzamento | gate 346; status 346; previsão 198 | detalhe + resumo; EC-1, EC-2, ND-1 |
| basico_6_17 — População de 6 a 17 anos na educação básica | par_novo_par — Novo PAR | C | Pode apoiar planejamento e iniciativas de acesso e permanência. | M-PAR, vigente | nenhum valor | gate 346 | detalhe; EC-1, EC-3, ND-1 |
| basico_6_17 — População de 6 a 17 anos na educação básica | pnae — Alimentação Escolar | C | Pode apoiar permanência por alimentação escolar. | M-PNAE, vigente | nenhum valor | gate 346 | detalhe; EC-1, EC-3, ND-1 |
| basico_6_17 — População de 6 a 17 anos na educação básica | pnate — Transporte Escolar | C | Pode apoiar acesso de estudantes rurais elegíveis. | M-PNATE, vigente | nenhum valor | gate 346 | detalhe; EC-1, EC-3, ND-1 |
| basico_6_17 — População de 6 a 17 anos na educação básica | caminho_escola — Caminho da Escola | C | Pode apoiar transporte escolar conforme via e requisitos. | M-CAM, vigente | nenhum valor | gate 346 | detalhe; EC-1, EC-3, ND-1 |
| basico_6_17 — População de 6 a 17 anos na educação básica | peate_rs — PEATE/RS | C | Pode apoiar transporte de estudantes estaduais rurais em colaboração. | M-PEATE, vigente | nenhum valor | gate 346 | detalhe; EC-1, EC-3, ND-1 |
| basico_integral — Alunos em jornada integral | par_novo_par — Novo PAR | C | Pode apoiar planejamento de expansão da jornada integral. | M-PAR, vigente | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |
| basico_integral — Alunos em jornada integral | novo_pac_educacao — Novo PAC Educação | C | Pode apoiar infraestrutura para oferta integral em seleção aplicável. | M-PAC, 2025 | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |
| basico_integral — Alunos em jornada integral | escola_tempo_integral — Escola em Tempo Integral | C | Pode apoiar criação, manutenção e qualificação de matrículas integrais. | M-ETI, 2025 | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |
| basico_integral — Alunos em jornada integral | pnae — Alimentação Escolar | C | Pode apoiar a jornada ampliada por alimentação escolar. | M-PNAE, vigente | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |
| basico_integral — Alunos em jornada integral | pnate — Transporte Escolar | C | Pode apoiar acesso de estudantes rurais elegíveis. | M-PNATE, vigente | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |
| basico_integral — Alunos em jornada integral | caminho_escola — Caminho da Escola | C | Pode apoiar transporte escolar conforme via e requisitos. | M-CAM, vigente | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |
| escolas_integral — Escolas com alunos em tempo integral | par_novo_par — Novo PAR | C | Pode apoiar planejamento de expansão da oferta integral. | M-PAR, vigente | nenhum valor | gate 288 | detalhe; EC-1, EC-3, ND-1 |
| escolas_integral — Escolas com alunos em tempo integral | novo_pac_educacao — Novo PAC Educação | C | Pode apoiar infraestrutura para oferta integral em seleção aplicável. | M-PAC, 2025 | nenhum valor | gate 288 | detalhe; EC-1, EC-3, ND-1 |
| escolas_integral — Escolas com alunos em tempo integral | escola_tempo_integral — Escola em Tempo Integral | C | Pode apoiar criação, manutenção e qualificação de matrículas integrais. | M-ETI, 2025 | nenhum valor | gate 288 | detalhe; EC-1, EC-3, ND-1 |
| escolas_integral — Escolas com alunos em tempo integral | pnae — Alimentação Escolar | C | Pode apoiar a jornada ampliada por alimentação escolar. | M-PNAE, vigente | nenhum valor | gate 288 | detalhe; EC-1, EC-3, ND-1 |
| escolas_integral — Escolas com alunos em tempo integral | pnate — Transporte Escolar | C | Pode apoiar acesso de estudantes rurais elegíveis. | M-PNATE, vigente | nenhum valor | gate 288 | detalhe; EC-1, EC-3, ND-1 |
| escolas_integral — Escolas com alunos em tempo integral | caminho_escola — Caminho da Escola | C | Pode apoiar transporte escolar conforme via e requisitos. | M-CAM, vigente | nenhum valor | gate 288 | detalhe; EC-1, EC-3, ND-1 |
| eja_integrada_educacao_profissional_percentual — EJA articulada à educação profissional | par_novo_par — Novo PAR | C | Pode apoiar o planejamento de iniciativa articulada. | M-PAR, vigente | nenhum valor | gate 13 | detalhe; EC-1, EC-3, ND-1 |
| idade_regular_quinto — Conclusão dos anos iniciais na idade regular | fundeb_vaar — Complementação VAAR | B | Pode ajudar a cumprir uma das condições do recurso; não determina o benefício. | M-VAAR, 2026 | status nominal; previsão oficial em 5 dos 8 municípios do cruzamento | gate 8; status 8; previsão 5 | detalhe + resumo; EC-1, EC-2, ND-1 |
| idade_regular_quinto — Conclusão dos anos iniciais na idade regular | par_novo_par — Novo PAR | C | Pode apoiar ações de permanência e trajetória escolar. | M-PAR, vigente | nenhum valor | gate 8 | detalhe; EC-1, EC-3, ND-1 |
| idade_regular_quinto — Conclusão dos anos iniciais na idade regular | pnae — Alimentação Escolar | C | Pode apoiar permanência por alimentação escolar. | M-PNAE, vigente | nenhum valor | gate 8 | detalhe; EC-1, EC-3, ND-1 |
| idade_regular_nono — Conclusão dos anos finais na idade regular | fundeb_vaar — Complementação VAAR | B | Pode ajudar a cumprir uma das condições do recurso; não determina o benefício. | M-VAAR, 2026 | status nominal; nenhum dos 2 municípios do cruzamento tem previsão preenchida | gate 2; status 2; previsão 0 | detalhe + resumo; EC-1, EC-2, ND-1 |
| idade_regular_nono — Conclusão dos anos finais na idade regular | par_novo_par — Novo PAR | C | Pode apoiar ações de permanência e trajetória escolar. | M-PAR, vigente | nenhum valor | gate 2 | detalhe; EC-1, EC-3, ND-1 |
| idade_regular_nono — Conclusão dos anos finais na idade regular | pnae — Alimentação Escolar | C | Pode apoiar permanência por alimentação escolar. | M-PNAE, vigente | nenhum valor | gate 2 | detalhe; EC-1, EC-3, ND-1 |
| adequacao_ai — Formação adequada nos anos iniciais | par_novo_par — Novo PAR | C | Pode apoiar planejamento de formação docente. | M-PAR, vigente | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |
| adequacao_ai — Formação adequada nos anos iniciais | parfor — PARFOR | C | Pode apoiar licenciatura adequada à área de atuação. | M-PARFOR, vigente | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |
| adequacao_ai — Formação adequada nos anos iniciais | bolsa_mais_professores — Bolsa Mais Professores | C | Pode apoiar atração, permanência e formação em área elegível. | M-BOLSA, vigente | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |
| adequacao_af — Formação adequada nos anos finais | par_novo_par — Novo PAR | C | Pode apoiar planejamento de formação docente. | M-PAR, vigente | nenhum valor | gate 20 | detalhe; EC-1, EC-3, ND-1 |
| adequacao_af — Formação adequada nos anos finais | parfor — PARFOR | C | Pode apoiar licenciatura adequada à área de atuação. | M-PARFOR, vigente | nenhum valor | gate 20 | detalhe; EC-1, EC-3, ND-1 |
| adequacao_af — Formação adequada nos anos finais | bolsa_mais_professores — Bolsa Mais Professores | C | Pode apoiar atração, permanência e formação em área elegível. | M-BOLSA, vigente | nenhum valor | gate 20 | detalhe; EC-1, EC-3, ND-1 |
| pos_graduacao — Docentes com pós-graduação | par_novo_par — Novo PAR | C | Pode apoiar planejamento de formação continuada. | M-PAR, vigente | nenhum valor | gate 147 | detalhe; EC-1, EC-3, ND-1 |
| pos_graduacao — Docentes com pós-graduação | proeb_capes — ProEB/CAPES | C | Pode apoiar a pós-graduação dos docentes participantes. | M-PROEB, vigente | nenhum valor | gate 147 | detalhe; EC-1, EC-3, ND-1 |
| pos_graduacao — Docentes com pós-graduação | bolsa_mais_professores — Bolsa Mais Professores | C | Pode apoiar formação em área e localidade elegíveis. | M-BOLSA, vigente | nenhum valor | gate 147 | detalhe; EC-1, EC-3, ND-1 |
| rendimento_magisterio — Rendimento do magistério | par_novo_par — Novo PAR | C | Pode apoiar planejamento de ações de valorização; não calcula impacto remuneratório. | M-PAR, vigente | nenhum valor | gate 6 | detalhe; EC-1, EC-3, ND-1 |
| temporarios — Docentes com contrato temporário | par_novo_par — Novo PAR | C | Pode apoiar planejamento da gestão e valorização docente. | M-PAR, vigente | nenhum valor | gate 243 | detalhe; EC-1, EC-3, ND-1 |
| temporarios — Docentes com contrato temporário | bolsa_mais_professores — Bolsa Mais Professores | C | Pode apoiar atração e permanência em área elegível; não altera vínculo automaticamente. | M-BOLSA, vigente | nenhum valor | gate 243 | detalhe; EC-1, EC-3, ND-1 |
| conselho_escolar — Conselho escolar em funcionamento | par_novo_par — Novo PAR | C | Pode apoiar planejamento e fortalecimento da gestão escolar. | M-PAR, vigente | nenhum valor | gate 177 | detalhe; EC-1, EC-3, ND-1 |
| conselho_escolar — Conselho escolar em funcionamento | pdde — PDDE | C | Pode apoiar gestão e ações por escola ou entidade executora. | M-PDDE, vigente | nenhum valor | gate 177 | detalhe; EC-1, EC-3, ND-1 |
| salas_climatizadas — Salas de aula climatizadas | par_novo_par — Novo PAR | C | Pode apoiar planejamento de infraestrutura e equipamentos. | M-PAR, vigente | nenhum valor | gate 5 | detalhe; EC-1, EC-3, ND-1 |
| salas_climatizadas — Salas de aula climatizadas | novo_pac_educacao — Novo PAC Educação | C | Pode apoiar infraestrutura em seleção aplicável. | M-PAC, 2025 | nenhum valor | gate 5 | detalhe; EC-1, EC-3, ND-1 |
| salas_climatizadas — Salas de aula climatizadas | pdde — PDDE | C | Pode apoiar pequenos investimentos conforme ação e entidade. | M-PDDE, vigente | nenhum valor | gate 5 | detalhe; EC-1, EC-3, ND-1 |
| salas_acessiveis — Salas de aula com acessibilidade | par_novo_par — Novo PAR | C | Pode apoiar planejamento de infraestrutura acessível. | M-PAR, vigente | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |
| salas_acessiveis — Salas de aula com acessibilidade | novo_pac_educacao — Novo PAC Educação | C | Pode apoiar infraestrutura em seleção aplicável. | M-PAC, 2025 | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |
| salas_acessiveis — Salas de aula com acessibilidade | caminho_escola — Caminho da Escola | C | Pode apoiar transporte acessível conforme via e requisitos. | M-CAM, vigente | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |
| salas_acessiveis — Salas de aula com acessibilidade | pdde — PDDE | C | Pode apoiar pequenos investimentos conforme ação e entidade. | M-PDDE, vigente | nenhum valor | gate 9 | detalhe; EC-1, EC-3, ND-1 |

As 60 linhas são a lista fechada da primeira versão: 5 B e 55 C. Não é permitido ampliar essa lista apenas porque um programa financia educação ou porque o contrato possui algum valor financeiro.

### 3.5 Municípios cobertos por indicador

Para tornar explícita a resposta a “em quais municípios”, os conjuntos abaixo listam os slugs reais dos contratos que atendem ao gate de cada um dos 16 indicadores. Todas as relações do mesmo indicador usam este conjunto; a presença de valor VAAR é o subconjunto contado separadamente na seção 3.4.

<details>
<summary>creche — 243 municípios</summary>

acegua, agua-santa, agudo, alegrete, alegria, alpestre, alvorada, amaral-ferrador, arambare, arroio-do-padre, arroio-do-tigre, arroio-dos-ratos, arroio-grande, arvorezinha, augusto-pestana, bage, balneario-pinhal, barao-do-triunfo, barra-do-quarai, barra-do-ribeiro, barra-do-rio-azul, barracao, barros-cassal, bom-jesus, bom-progresso, boqueirao-do-leao, bozano, braga, butia, cacequi, cachoeira-do-sul, cachoeirinha, cacique-doble, caibate, caicara, camaqua, campestre-da-serra, campina-das-missoes, campinas-do-sul, campo-novo, candelaria, candido-godoi, candiota, cangucu, canoas, canudos-do-vale, capao-do-cipo, capao-do-leao, capela-de-santana, caraa, caseiros, catuipe, caxias-do-sul, centenario, cerrito, cerro-branco, cerro-grande-do-sul, chapada, charqueadas, charrua, chui, chuvisca, cidreira, ciriaco, condor, coronel-barros, coronel-bicaco, coxilha, cristal, cristal-do-sul, dezesseis-de-novembro, dilermando-de-aguiar, dom-feliciano, dom-pedrito, dona-francisca, eldorado-do-sul, encruzilhada-do-sul, entre-ijuis, erebango, esmeralda, estrela-velha, faxinal-do-soturno, faxinalzinho, flores-da-cunha, fontoura-xavier, formigueiro, garruchos, gaurama, general-camara, gentil, girua, glorinha, gramado-xavier, gravatai, guabiju, guaiba, herval, herveiras, horizontina, hulha-negra, ibiraiaras, ilopolis, ipiranga-do-sul, itaara, itacurubi, itaqui, itati, jaboticaba, jacuizinho, jaguarao, jaguari, jaquirana, jari, joia, lagoa-vermelha, lagoao, liberato-salzano, macambara, mampituba, manoel-viana, maquine, mariana-pimentel, mata, mato-castelhano, minas-do-leao, monte-alegre-dos-campos, morro-redondo, mostardas, mucum, muitos-capoes, muliterno, nicolau-vergueiro, nonoai, nova-bassano, nova-palma, nova-ramada, nova-santa-rita, novo-barreiro, novo-hamburgo, novo-machado, osorio, palmeira-das-missoes, palmitinho, pantano-grande, paraiso-do-sul, passa-sete, passo-do-sobrado, passo-fundo, paverama, pedras-altas, pedro-osorio, pejucara, pelotas, pinhal, pinhal-da-serra, pinhal-grande, pinheiro-machado, pinto-bandeira, pirapo, piratini, pontao, ponte-preta, porto-alegre, porto-lucena, quatro-irmaos, quevedos, redentora, restinga-seca, rio-dos-indios, rio-grande, rio-pardo, rodeio-bonito, rolador, ronda-alta, roque-gonzales, rosario-do-sul, salto-do-jacui, sant-ana-do-livramento, santa-cecilia-do-sul, santa-margarida-do-sul, santa-maria, santa-tereza, santa-vitoria-do-palmar, santana-da-boa-vista, santo-antonio-da-patrulha, santo-antonio-das-missoes, santo-antonio-do-palma, santo-antonio-do-planalto, santo-expedito-do-sul, sao-borja, sao-francisco-de-assis, sao-francisco-de-paula, sao-gabriel, sao-jeronimo, sao-joao-da-urtiga, sao-jose-do-norte, sao-jose-dos-ausentes, sao-leopoldo, sao-lourenco-do-sul, sao-luiz-gonzaga, sao-miguel-das-missoes, sao-nicolau, sao-pedro-das-missoes, sao-pedro-do-sul, sao-valerio-do-sul, sao-vicente-do-sul, sapucaia-do-sul, seberi, sede-nova, segredo, selbach, senador-salgado-filho, sentinela-do-sul, serio, sertao-santana, sete-de-setembro, sinimbu, tabai, taquari, tavares, tenente-portela, terra-de-areia, tio-hugo, tiradentes-do-sul, toropi, tramandai, tres-palmeiras, trindade-do-sul, tucunduva, tunas, tupancireta, turucu, ubiretama, unistalda, uruguaiana, vacaria, vale-do-sol, vale-verde, vanini, viamao, vila-nova-do-sul, vista-alegre-do-prata, vitoria-das-missoes

</details>

<details>
<summary>pre_escola — 178 municípios</summary>

agua-santa, ajuricaba, alegrete, almirante-tamandare-do-sul, alvorada, arroio-do-meio, arroio-grande, barao, barao-do-triunfo, barra-do-quarai, barra-do-ribeiro, bento-goncalves, brochier, butia, cachoeirinha, cacique-doble, caibate, caicara, campina-das-missoes, campo-novo, candelaria, candiota, cangucu, canoas, capao-do-cipo, capao-do-leao, capitao, casca, caseiros, cerrito, cerro-largo, chapada, charqueadas, chiapetta, chui, constantina, coqueiros-do-sul, cotipora, cruz-alta, cruzeiro-do-sul, derrubadas, dom-pedrito, eldorado-do-sul, encruzilhada-do-sul, entre-ijuis, estancia-velha, estrela, faxinalzinho, fazenda-vilanova, feliz, garibaldi, gentil, gravatai, guaiba, guarani-das-missoes, horizontina, hulha-negra, ibiruba, ijui, ilopolis, independencia, inhacora, itaara, itacurubi, itaqui, itatiba-do-sul, ivora, ivoti, jaguarao, jaguari, lagoa-vermelha, lajeado, lajeado-do-bugre, linha-nova, machadinho, manoel-viana, maquine, marques-de-souza, mata, mato-castelhano, minas-do-leao, morro-redondo, mucum, muliterno, nao-me-toque, nicolau-vergueiro, nonoai, nova-alvorada, nova-bassano, nova-candelaria, nova-petropolis, nova-prata, nova-ramada, novo-machado, novo-tiradentes, novo-xingu, osorio, paim-filho, palmitinho, panambi, pantano-grande, paverama, pedro-osorio, pelotas, pinhal-da-serra, pinhal-grande, pinheiro-machado, piratini, ponte-preta, porto-alegre, porto-lucena, porto-vera-cruz, pouso-novo, presidente-lucena, quarai, quevedos, redentora, rio-grande, rio-pardo, ronda-alta, roque-gonzales, rosario-do-sul, sananduva, sant-ana-do-livramento, santa-barbara-do-sul, santa-cecilia-do-sul, santa-clara-do-sul, santa-cruz-do-sul, santa-maria, santa-maria-do-herval, santa-tereza, santa-vitoria-do-palmar, santiago, santo-antonio-das-missoes, santo-expedito-do-sul, sao-borja, sao-francisco-de-assis, sao-gabriel, sao-jeronimo, sao-jorge, sao-jose-do-hortencio, sao-jose-do-inhacora, sao-jose-do-sul, sao-leopoldo, sao-lourenco-do-sul, sao-nicolau, sao-paulo-das-missoes, sao-pedro-da-serra, sao-pedro-das-missoes, sao-sebastiao-do-cai, sao-valerio-do-sul, sao-vicente-do-sul, sapucaia-do-sul, seberi, senador-salgado-filho, sentinela-do-sul, serio, sertao-santana, sete-de-setembro, silveira-martins, tabai, tapejara, tapera, taquari, tavares, tenente-portela, tres-de-maio, tres-passos, trindade-do-sul, tupanci-do-sul, tupandi, uruguaiana, vale-real, vera-cruz, vespasiano-correa, viadutos, viamao, westfalia

</details>

<details>
<summary>basico_6_17 — 346 municípios</summary>

agua-santa, agudo, ajuricaba, alecrim, alegria, almirante-tamandare-do-sul, alto-alegre, alto-feliz, amaral-ferrador, ametista-do-sul, andre-da-rocha, aratiba, arroio-do-meio, arroio-dos-ratos, arroio-grande, arvorezinha, augusto-pestana, aurea, bage, barao-de-cotegipe, barao-do-triunfo, barra-do-guarita, barra-do-quarai, barra-do-rio-azul, barracao, barros-cassal, bento-goncalves, boa-vista-do-cadeado, boa-vista-do-sul, bom-jesus, bom-principio, boqueirao-do-leao, bossoroca, bozano, braga, brochier, butia, cacapava-do-sul, cacequi, cachoeira-do-sul, cachoeirinha, caibate, caicara, camaqua, cambara-do-sul, campestre-da-serra, campinas-do-sul, campo-novo, campos-borges, candido-godoi, candiota, cangucu, canoas, capao-bonito-do-sul, capao-do-cipo, capao-do-leao, capela-de-santana, capitao, caraa, carazinho, carlos-barbosa, carlos-gomes, casca, catuipe, centenario, cerrito, cerro-branco, cerro-grande, cerro-largo, charrua, chiapetta, chui, chuvisca, cidreira, ciriaco, colinas, colorado, constantina, coqueiros-do-sul, coronel-barros, coronel-pilar, cotipora, crissiumal, cristal, cristal-do-sul, cruzaltense, cruzeiro-do-sul, david-canabarro, derrubadas, dezesseis-de-novembro, dilermando-de-aguiar, dois-lajeados, dom-feliciano, dom-pedrito, dom-pedro-de-alcantara, dona-francisca, doutor-mauricio-cardoso, doutor-ricardo, eldorado-do-sul, encantado, encruzilhada-do-sul, engenho-velho, entre-ijuis, entre-rios-do-sul, erebango, ernestina, erval-grande, erval-seco, esmeralda, esperanca-do-sul, espumoso, estacao, estancia-velha, estrela, estrela-velha, eugenio-de-castro, fagundes-varela, faxinal-do-soturno, faxinalzinho, formigueiro, fortaleza-dos-valos, garibaldi, garruchos, gaurama, general-camara, getulio-vargas, girua, gramado-xavier, guabiju, herval, horizontina, humaita, ibiaca, ibiraiaras, ibirapuita, igrejinha, ijui, ilopolis, imigrante, independencia, ipiranga-do-sul, irai, itaara, itacurubi, itapuca, itaqui, itatiba-do-sul, ivora, ivoti, jaboticaba, jacuizinho, jacutinga, jaguarao, jari, joia, lagoa-bonita-do-sul, lagoa-dos-tres-cantos, lagoao, lajeado-do-bugre, lavras-do-sul, lindolfo-collor, linha-nova, machadinho, mampituba, manoel-viana, maquine, marata, marcelino-ramos, mariana-pimentel, mariano-moro, marques-de-souza, mata, mato-leitao, mato-queimado, monte-alegre-dos-campos, mormaco, morro-redondo, morro-reuter, mostardas, mucum, muitos-capoes, muliterno, nicolau-vergueiro, nonoai, nova-alvorada, nova-brescia, nova-candelaria, nova-esperanca-do-sul, nova-hartz, nova-padua, nova-palma, nova-petropolis, nova-roma-do-sul, nova-santa-rita, novo-barreiro, novo-cabrais, novo-machado, novo-tiradentes, novo-xingu, paim-filho, palmitinho, pantano-grande, paraiso-do-sul, pareci-novo, passo-do-sobrado, paulo-bento, paverama, pedras-altas, pedro-osorio, pejucara, pinhal, pinhal-da-serra, pinhal-grande, pinheirinho-do-vale, pinheiro-machado, pinto-bandeira, pirapo, piratini, planalto, poco-das-antas, pontao, ponte-preta, porto-alegre, porto-lucena, porto-vera-cruz, porto-xavier, pouso-novo, presidente-lucena, progresso, protasio-alves, putinga, quarai, quatro-irmaos, quevedos, redentora, relvado, restinga-seca, rio-dos-indios, rio-grande, rio-pardo, rodeio-bonito, rolador, roque-gonzales, sagrada-familia, saldanha-marinho, salto-do-jacui, sananduva, sant-ana-do-livramento, santa-barbara-do-sul, santa-cecilia-do-sul, santa-margarida-do-sul, santa-maria, santa-maria-do-herval, santa-tereza, santa-vitoria-do-palmar, santana-da-boa-vista, santiago, santo-angelo, santo-antonio-da-patrulha, santo-antonio-do-palma, santo-antonio-do-planalto, santo-cristo, santo-expedito-do-sul, sao-domingos-do-sul, sao-francisco-de-assis, sao-gabriel, sao-joao-da-urtiga, sao-jorge, sao-jose-das-missoes, sao-jose-do-herval, sao-jose-do-hortencio, sao-jose-do-inhacora, sao-jose-do-ouro, sao-jose-do-sul, sao-jose-dos-ausentes, sao-leopoldo, sao-luiz-gonzaga, sao-marcos, sao-martinho, sao-miguel-das-missoes, sao-nicolau, sao-paulo-das-missoes, sao-pedro-da-serra, sao-pedro-das-missoes, sao-pedro-do-butia, sao-pedro-do-sul, sao-sebastiao-do-cai, sao-sepe, sao-valentim-do-sul, sao-valerio-do-sul, sapiranga, seberi, sede-nova, segredo, selbach, senador-salgado-filho, serafina-correa, serio, sete-de-setembro, severiano-de-almeida, sinimbu, sobradinho, soledade, tapera, tapes, taquarucu-do-sul, tavares, tenente-portela, tio-hugo, tiradentes-do-sul, toropi, tres-arroios, tres-cachoeiras, tres-coroas, tres-de-maio, tres-palmeiras, tres-passos, trindade-do-sul, triunfo, tucunduva, tunas, tupanci-do-sul, tupancireta, tupandi, tuparendi, turucu, ubiretama, uniao-da-serra, uruguaiana, vacaria, vale-do-sol, vale-real, vale-verde, vanini, venancio-aires, viadutos, victor-graeff, vila-flores, vila-langaro, vila-maria, vista-alegre, vista-alegre-do-prata, vista-gaucha, vitoria-das-missoes, westfalia, xangri-la

</details>

<details>
<summary>basico_integral — 9 municípios</summary>

barao-de-cotegipe, boa-vista-das-missoes, candido-godoi, cotipora, doutor-mauricio-cardoso, parai, paulo-bento, sao-joao-da-urtiga, vila-langaro

</details>

<details>
<summary>escolas_integral — 288 municípios</summary>

acegua, agudo, alecrim, alegrete, alpestre, alvorada, amaral-ferrador, ametista-do-sul, andre-da-rocha, anta-gorda, antonio-prado, arambare, arroio-do-padre, arroio-do-sal, arroio-do-tigre, arroio-dos-ratos, arroio-grande, augusto-pestana, aurea, bage, balneario-pinhal, barao-de-cotegipe, barao-do-triunfo, barra-do-guarita, barra-funda, barracao, barros-cassal, bento-goncalves, boa-vista-das-missoes, boa-vista-do-sul, bom-jesus, boqueirao-do-leao, bossoroca, braga, butia, cacapava-do-sul, cacequi, cachoeira-do-sul, cachoeirinha, caibate, caicara, camaqua, cambara-do-sul, campina-das-missoes, campinas-do-sul, campo-novo, candelaria, candido-godoi, candiota, cangucu, canoas, canudos-do-vale, capao-da-canoa, capao-do-leao, capela-de-santana, carazinho, caseiros, catuipe, caxias-do-sul, cerrito, cerro-branco, cerro-grande-do-sul, charqueadas, chiapetta, ciriaco, colorado, condor, constantina, coronel-barros, coronel-pilar, cotipora, cristal, cristal-do-sul, cruz-alta, derrubadas, dezesseis-de-novembro, dilermando-de-aguiar, dois-irmaos-das-missoes, dois-lajeados, dom-feliciano, dom-pedrito, dona-francisca, doutor-ricardo, eldorado-do-sul, encruzilhada-do-sul, engenho-velho, entre-ijuis, ernestina, esmeralda, estacao, estrela-velha, eugenio-de-castro, farroupilha, flores-da-cunha, floriano-peixoto, fontoura-xavier, fortaleza-dos-valos, frederico-westphalen, garibaldi, garruchos, general-camara, gentil, getulio-vargas, glorinha, gramado-dos-loureiros, gramado-xavier, gravatai, guabiju, guaiba, guarani-das-missoes, herval, hulha-negra, humaita, ibarama, ibiaca, ibirapuita, imbe, ipe, irai, itaara, itaqui, ivora, jacuizinho, jaguarao, jaguari, jaquirana, jari, joia, julio-de-castilhos, lagoa-vermelha, lagoao, lavras-do-sul, machadinho, mampituba, manoel-viana, maquine, marcelino-ramos, mariana-pimentel, mariano-moro, mata, mato-queimado, maximiliano-de-almeida, minas-do-leao, miraguai, monte-alegre-dos-campos, montenegro, morrinhos-do-sul, morro-redondo, mostardas, nonoai, nova-alvorada, nova-bassano, nova-candelaria, nova-padua, nova-prata, nova-roma-do-sul, nova-santa-rita, novo-barreiro, novo-cabrais, novo-hamburgo, osorio, paim-filho, palmares-do-sul, palmeira-das-missoes, palmitinho, panambi, pantano-grande, paraiso-do-sul, parobe, passa-sete, passo-do-sobrado, passo-fundo, paulo-bento, pejucara, pelotas, pinhal-da-serra, pinheiro-machado, pinto-bandeira, pirapo, piratini, pontao, ponte-preta, portao, porto-maua, porto-vera-cruz, progresso, protasio-alves, putinga, quarai, quinze-de-novembro, restinga-seca, rio-dos-indios, rio-grande, rio-pardo, roca-sales, rodeio-bonito, rolador, rondinha, roque-gonzales, rosario-do-sul, sagrada-familia, saldanha-marinho, salto-do-jacui, salvador-das-missoes, sant-ana-do-livramento, santa-barbara-do-sul, santa-cecilia-do-sul, santa-cruz-do-sul, santa-maria, santa-tereza, santana-da-boa-vista, santo-angelo, santo-antonio-da-patrulha, santo-antonio-das-missoes, santo-antonio-do-planalto, santo-augusto, santo-cristo, sao-domingos-do-sul, sao-francisco-de-assis, sao-francisco-de-paula, sao-gabriel, sao-jeronimo, sao-joao-da-urtiga, sao-jorge, sao-jose-do-herval, sao-jose-do-norte, sao-jose-do-ouro, sao-jose-dos-ausentes, sao-leopoldo, sao-lourenco-do-sul, sao-luiz-gonzaga, sao-marcos, sao-martinho, sao-miguel-das-missoes, sao-nicolau, sao-pedro-das-missoes, sao-pedro-do-sul, sao-sebastiao-do-cai, sao-sepe, sao-valentim, sao-vicente-do-sul, sapucaia-do-sul, sarandi, seberi, sede-nova, segredo, selbach, senador-salgado-filho, sentinela-do-sul, serafina-correa, sertao-santana, severiano-de-almeida, sinimbu, soledade, tabai, tapejara, taquara, taquarucu-do-sul, tenente-portela, terra-de-areia, tio-hugo, tiradentes-do-sul, torres, tramandai, tres-arroios, tres-cachoeiras, tres-coroas, tres-palmeiras, trindade-do-sul, triunfo, tunas, tupancireta, turucu, uruguaiana, vacaria, vale-do-sol, venancio-aires, vera-cruz, veranopolis, vespasiano-correa, viadutos, viamao, vila-maria, vila-nova-do-sul, vista-alegre, vista-alegre-do-prata, vitoria-das-missoes, westfalia

</details>

<details>
<summary>eja_integrada_educacao_profissional_percentual — 13 municípios</summary>

alvorada, arroio-do-sal, camaqua, caxias-do-sul, dois-irmaos, gravatai, ibiruba, panambi, passo-fundo, santa-rosa, santo-angelo, santo-augusto, tupancireta

</details>

<details>
<summary>idade_regular_quinto — 8 municípios</summary>

glorinha, mata, monte-belo-do-sul, nova-ramada, pirapo, rodeio-bonito, roque-gonzales, silveira-martins

</details>

<details>
<summary>idade_regular_nono — 2 municípios</summary>

nova-ramada, rondinha

</details>

<details>
<summary>adequacao_ai — 9 municípios</summary>

campo-bom, esteio, fagundes-varela, humaita, ibarama, lindolfo-collor, quinze-de-novembro, sao-pedro-das-missoes, unistalda

</details>

<details>
<summary>adequacao_af — 20 municípios</summary>

barao-do-triunfo, campos-borges, chiapetta, eugenio-de-castro, floriano-peixoto, herveiras, ipe, jaquirana, linha-nova, montauri, novo-xingu, passa-sete, picada-cafe, poco-das-antas, roca-sales, sao-miguel-das-missoes, sao-paulo-das-missoes, sertao-santana, silveira-martins, vila-flores

</details>

<details>
<summary>pos_graduacao — 147 municípios</summary>

ajuricaba, alecrim, alegria, alvorada, anta-gorda, antonio-prado, arroio-do-meio, arroio-do-sal, arroio-dos-ratos, bage, balneario-pinhal, barao, barra-do-quarai, barra-do-ribeiro, barra-do-rio-azul, benjamin-constant-do-sul, bento-goncalves, boa-vista-das-missoes, boa-vista-do-burica, boa-vista-do-incra, bom-progresso, bossoroca, butia, cacequi, cachoeirinha, cacique-doble, candelaria, canela, canudos-do-vale, capao-da-canoa, capao-do-cipo, capitao, capivari-do-sul, caraa, casca, caseiros, caxias-do-sul, cerrito, cerro-grande-do-sul, chapada, charqueadas, charrua, ciriaco, condor, coqueiro-baixo, cruz-alta, cruzaltense, dezesseis-de-novembro, dilermando-de-aguiar, dois-irmaos, dois-irmaos-das-missoes, eldorado-do-sul, erebango, ernestina, erval-seco, esteio, fazenda-vilanova, flores-da-cunha, fontoura-xavier, forquetinha, gentil, gramado, gravatai, guabiju, guapore, guarani-das-missoes, harmonia, herval, hulha-negra, ibiraiaras, imbe, independencia, irai, itati, itatiba-do-sul, ivora, jaboticaba, lagoa-dos-tres-cantos, lagoa-vermelha, lajeado, lajeado-do-bugre, liberato-salzano, machadinho, mampituba, manoel-viana, maquine, marau, minas-do-leao, miraguai, montauri, morro-reuter, mucum, muitos-capoes, nova-araca, nova-bassano, nova-brescia, nova-petropolis, nova-prata, nova-santa-rita, novo-hamburgo, novo-machado, palmares-do-sul, palmeira-das-missoes, pedro-osorio, pelotas, pinhal, portao, porto-lucena, porto-maua, presidente-lucena, protasio-alves, relvado, riozinho, ronda-alta, sant-ana-do-livramento, santa-clara-do-sul, santa-margarida-do-sul, santa-maria-do-herval, sao-borja, sao-jeronimo, sao-joao-do-polesine, sao-jose-das-missoes, sao-jose-do-norte, sao-lourenco-do-sul, sao-valentim-do-sul, sao-vendelino, sapucaia-do-sul, senador-salgado-filho, sentinela-do-sul, severiano-de-almeida, tapes, tavares, terra-de-areia, teutonia, tiradentes-do-sul, torres, tramandai, travesseiro, tres-cachoeiras, uniao-da-serra, vale-real, venancio-aires, vera-cruz, vicente-dutra, vila-maria, vila-nova-do-sul, westfalia

</details>

<details>
<summary>rendimento_magisterio — 6 municípios</summary>

cruzeiro-do-sul, glorinha, imigrante, nova-candelaria, portao, santo-antonio-do-planalto

</details>

<details>
<summary>temporarios — 243 municípios</summary>

acegua, agua-santa, agudo, alegrete, almirante-tamandare-do-sul, alpestre, amaral-ferrador, antonio-prado, arambare, ararica, aratiba, arroio-do-padre, arroio-do-tigre, arroio-grande, arvorezinha, augusto-pestana, aurea, barao, barra-do-guarita, barra-do-ribeiro, barra-funda, benjamin-constant-do-sul, boa-vista-do-burica, bom-jesus, bom-principio, bom-retiro-do-sul, bozano, braga, brochier, caibate, caicara, camargo, campestre-da-serra, campina-das-missoes, campinas-do-sul, campo-novo, cangucu, canoas, capao-bonito-do-sul, capao-da-canoa, capela-de-santana, carazinho, carlos-barbosa, centenario, cerro-grande, cerro-grande-do-sul, chapada, charqueadas, colorado, coronel-bicaco, coxilha, cristal, cristal-do-sul, david-canabarro, derrubadas, dois-irmaos-das-missoes, dois-lajeados, dom-feliciano, dom-pedrito, doutor-ricardo, encantado, encruzilhada-do-sul, engenho-velho, entre-ijuis, entre-rios-do-sul, erechim, erval-grande, espumoso, estacao, estrela, estrela-velha, farroupilha, fazenda-vilanova, feliz, floriano-peixoto, fontoura-xavier, formigueiro, fortaleza-dos-valos, frederico-westphalen, garibaldi, gaurama, general-camara, gentil, getulio-vargas, girua, gramado-dos-loureiros, gramado-xavier, guaiba, guarani-das-missoes, harmonia, herveiras, hulha-negra, ibiaca, igrejinha, ijui, ilopolis, inhacora, ipiranga-do-sul, itaqui, itati, jacuizinho, jaquirana, julio-de-castilhos, lagoa-bonita-do-sul, lagoa-vermelha, lavras-do-sul, liberato-salzano, macambara, marata, marau, marques-de-souza, mato-castelhano, mato-leitao, minas-do-leao, monte-alegre-dos-campos, monte-belo-do-sul, montenegro, morrinhos-do-sul, morro-redondo, nao-me-toque, nonoai, nova-boa-vista, nova-esperanca-do-sul, nova-palma, nova-prata, nova-roma-do-sul, novo-barreiro, osorio, paim-filho, palmeira-das-missoes, palmitinho, panambi, parai, paraiso-do-sul, pareci-novo, parobe, passa-sete, passo-do-sobrado, passo-fundo, paverama, picada-cafe, pinhal-da-serra, pinhal-grande, pinheirinho-do-vale, pinto-bandeira, piratini, planalto, ponte-preta, porto-alegre, porto-maua, porto-xavier, progresso, quarai, quatro-irmaos, quinze-de-novembro, redentora, restinga-seca, rio-dos-indios, rio-pardo, riozinho, rolante, ronda-alta, rondinha, rosario-do-sul, salto-do-jacui, salvador-das-missoes, salvador-do-sul, sananduva, santa-cecilia-do-sul, santa-clara-do-sul, santa-cruz-do-sul, santa-maria, santa-rosa, santa-tereza, santa-vitoria-do-palmar, santo-antonio-da-patrulha, santo-antonio-das-missoes, sao-borja, sao-francisco-de-assis, sao-francisco-de-paula, sao-jeronimo, sao-joao-do-polesine, sao-jorge, sao-jose-do-hortencio, sao-jose-do-inhacora, sao-leopoldo, sao-lourenco-do-sul, sao-luiz-gonzaga, sao-marcos, sao-martinho-da-serra, sao-nicolau, sao-pedro-do-butia, sao-pedro-do-sul, sao-sebastiao-do-cai, sao-sepe, sao-valentim, sao-valerio-do-sul, sao-vendelino, sao-vicente-do-sul, sarandi, seberi, sede-nova, segredo, selbach, sentinela-do-sul, sertao-santana, sete-de-setembro, sobradinho, soledade, tabai, tapejara, tapera, taquara, taquari, taquarucu-do-sul, tenente-portela, tio-hugo, torres, travesseiro, tres-arroios, tres-forquilhas, tres-palmeiras, tres-passos, trindade-do-sul, tucunduva, tunas, unistalda, uruguaiana, vacaria, vale-do-sol, vale-verde, vera-cruz, veranopolis, vespasiano-correa, viadutos, viamao, vicente-dutra, victor-graeff, vila-nova-do-sul, vista-alegre-do-prata, vista-gaucha, vitoria-das-missoes, xangri-la

</details>

<details>
<summary>conselho_escolar — 177 municípios</summary>

acegua, alegrete, alpestre, alto-alegre, alto-feliz, ametista-do-sul, andre-da-rocha, anta-gorda, arambare, ararica, arroio-do-padre, arroio-do-tigre, balneario-pinhal, barra-funda, barros-cassal, boa-vista-do-cadeado, boa-vista-do-incra, boa-vista-do-sul, bom-progresso, bom-retiro-do-sul, boqueirao-do-leao, cacapava-do-sul, cachoeira-do-sul, cacique-doble, camargo, cambara-do-sul, campo-bom, candelaria, candiota, canela, canudos-do-vale, capao-do-leao, capivari-do-sul, carlos-gomes, caseiros, catuipe, cerro-branco, cerro-largo, chui, chuvisca, cidreira, colinas, condor, constantina, coqueiro-baixo, coqueiros-do-sul, coronel-barros, coronel-bicaco, coronel-pilar, coxilha, cruz-alta, dom-pedro-de-alcantara, dona-francisca, erechim, esperanca-do-sul, estancia-velha, farroupilha, faxinal-do-soturno, faxinalzinho, feliz, flores-da-cunha, forquetinha, frederico-westphalen, garruchos, gramado, gramado-dos-loureiros, guaiba, guapore, horizontina, ibirapuita, ibiruba, imbe, inhacora, ipe, itaara, itacurubi, itapuca, ivoti, jacutinga, jaguarao, jaguari, jari, joia, julio-de-castilhos, lagoao, lajeado, macambara, marcelino-ramos, mariana-pimentel, mariano-moro, mato-castelhano, mato-queimado, maximiliano-de-almeida, miraguai, montenegro, morrinhos-do-sul, mostardas, muliterno, nao-me-toque, nicolau-vergueiro, nova-alvorada, nova-araca, nova-bassano, nova-boa-vista, nova-hartz, nova-padua, novo-cabrais, novo-hamburgo, novo-tiradentes, osorio, palmares-do-sul, pantano-grande, parobe, pedras-altas, pelotas, pontao, porto-vera-cruz, pouso-novo, putinga, rio-grande, roca-sales, rolador, rolante, rosario-do-sul, sagrada-familia, saldanha-marinho, salvador-das-missoes, salvador-do-sul, santa-cruz-do-sul, santana-da-boa-vista, santiago, santo-antonio-das-missoes, santo-antonio-do-palma, santo-augusto, santo-cristo, santo-expedito-do-sul, sao-domingos-do-sul, sao-francisco-de-paula, sao-gabriel, sao-jose-do-herval, sao-jose-do-norte, sao-jose-do-ouro, sao-jose-do-sul, sao-jose-dos-ausentes, sao-martinho, sao-martinho-da-serra, sao-pedro-da-serra, sao-valentim, sao-vicente-do-sul, sapiranga, sapucaia-do-sul, sarandi, serafina-correa, serio, sertao, sinimbu, tabai, tapejara, taquara, taquari, terra-de-areia, teutonia, toropi, tramandai, tres-coroas, tres-de-maio, tres-forquilhas, triunfo, tupanci-do-sul, tupandi, tuparendi, turucu, ubiretama, vanini, veranopolis, vespasiano-correa, viamao

</details>

<details>
<summary>salas_climatizadas — 5 municípios</summary>

campina-das-missoes, esmeralda, pejucara, santa-barbara-do-sul, sertao

</details>

<details>
<summary>salas_acessiveis — 9 municípios</summary>

barracao, crissiumal, ibarama, jaguari, maximiliano-de-almeida, mormaco, pinheiro-machado, quevedos, vista-alegre

</details>

## 4. Recursos gerais da educação

Os três mecanismos abaixo são categoria D. Eles podem ser usados no resumo financeiro do município e no Panorama financeiro, mas nunca repetidos nos 49 detalhes de indicadores.

| ID e nome oficial | Nome público | Finalidade | Fonte oficial e período | Campo real | Situação e valor municipal | Natureza | Cobertura | Regra pública |
|---|---|---|---|---|---|---|---:|---|
| fundeb_vaaf — Fundeb e complementação-VAAF | Fundeb | Recurso amplo de manutenção e desenvolvimento da educação básica, distribuído conforme regras do Fundo. | FNDE 2026 e Lei 14.113/2020: https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026-1/publicacoes-2026/2-publicacao/1-receita-total-do-fundeb-por-ente-federado.csv | amounts.fundebTotalAnnualForecast; programStatuses.fundebVaaf.status | previsão total do Fundeb em 497/497; situação VAAF em 497/497; valor isolado de VAAF em 0/497 | previsão oficial 2026; status nominal | 497 | um único bloco geral; não somar VAAF/VAAT/VAAR ao total |
| fundeb_vaat — Complementação-VAAT do Fundeb | Complementação VAAT | Complementação sistêmica sujeita ao VAAT e às regras anuais; não deriva de um indicador isolado. | FNDE 2026: https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026-1/publicacoes-2026/2-publicacao/3-vaat-vaat-min-e-complementacao-vaat-por-ente-federado.csv | programStatuses.fundebVaat.status; programStatuses.fundebVaat.calculationStatus; amounts.fundebVaatAnnualForecast | status em 497/497: 14 beneficiários e 483 não beneficiários; habilitação para cálculo em 497/497; previsão em 14/497 | status nominal e previsão oficial 2026 | 497 | um único bloco geral; não inferir benefício pela habilitação; não somar ao total |
| salario_educacao_qsem — Quota estadual e municipal do Salário-Educação | Salário-Educação | Recurso amplo para programas, projetos e ações da educação básica. | FNDE, distribuição 2024 e estimativa 2026: https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/salario-educacao | amounts.qseDistributedClosedYear; amounts.qseOfficialEstimateCurrentYear e bases em qse | distribuição 2024 e estimativa 2026 em 497/497 | transferido confirmado em 2024; previsão oficial em 2026 | 497 | um único bloco geral; separar realizado de estimado |

Observações obrigatórias:

- A previsão total do Fundeb é autônoma para exibição. VAAT e VAAR já estão marcados como componentes incluídos no total e não podem ser adicionados novamente.
- amounts.fundebVaafAnnualForecast existe no schema, mas não tem valor publicável em nenhum dos 497 contratos; o status VAAF pode ser usado, o valor não.
- A receita Fundeb declarada no RREO municipal não é tratada como transferência confirmada pelo concedente.
- O vínculo educationLinks entre creche e salario_educacao_qsem é geral e duplicado em todos os contratos; deve ser substituído pelo único bloco D.

## 5. Valores e situações municipais disponíveis

O inventário conta 26 campos únicos utilizáveis: 22 valores, bases ou cálculos e 4 campos de situação. Campos equivalentes em summary são atalhos de apresentação e não são contados novamente.

| Nº | Campo real | Significado | Ano | Natureza | Fonte | Cobertura com valor/situação | Local recomendado |
|---:|---|---|---:|---|---|---:|---|
| 1 | amounts.fundebTotalAnnualForecast | receita total anual prevista do Fundeb | 2026 | previsão oficial; total, inclui complementações | fnde_fundeb_total_forecast_2026 | 497/497 | resumo e Panorama |
| 2 | amounts.fundebVaatAnnualForecast | complementação VAAT prevista | 2026 | previsão oficial; incluída no total Fundeb | fnde_fundeb_vaat_2026 | 14/497 | resumo e Panorama, somente com valor |
| 3 | amounts.fundebVaarAnnualForecast | complementação VAAR prevista | 2026 | previsão oficial; incluída no total Fundeb | fnde_fundeb_vaar_forecast_2026 | 274/497 | resumo; detalhe B somente após gate |
| 4 | amounts.qseDistributedClosedYear | quota municipal do Salário-Educação distribuída | 2024 | transferido pelo concedente, confirmado | fnde_qse_realized_2024 | 497/497 | resumo e Panorama |
| 5 | amounts.qseOfficialEstimateCurrentYear | estimativa anual da quota municipal | 2026 | previsão oficial | fnde_qse_estimate_2026 | 497/497 | resumo e Panorama, separada do realizado |
| 6 | qse.enrollmentsClosedYear | matrículas usadas na distribuição | 2024 | base oficial confirmada | fnde_qse_realized_2024 | 497/497 | detalhe metodológico/expansão |
| 7 | qse.distributionCoefficientClosedYear | coeficiente da distribuição realizada | 2024 | base oficial confirmada | fnde_qse_realized_2024 | 497/497 | detalhe metodológico/expansão |
| 8 | qse.distributionCoefficientCurrentYear | coeficiente da estimativa | 2026 | base de previsão oficial | fnde_qse_estimate_2026 | 497/497 | detalhe metodológico/expansão |
| 9 | execution.dcaEducation.committed | despesa na função Educação empenhada | 2024 | despesa declarada pelo município | siconfi_dca_function_2024 | 497/497 | Panorama de execução |
| 10 | execution.dcaEducation.liquidated | despesa na função Educação liquidada | 2024 | despesa declarada pelo município | siconfi_dca_function_2024 | 497/497 | Panorama de execução |
| 11 | execution.dcaEducation.paid | despesa na função Educação paga | 2024 | despesa declarada pelo município | siconfi_dca_function_2024 | 497/497 | Panorama de execução |
| 12 | execution.dcaEducation.outstandingNonProcessed | restos a pagar não processados | 2024 | saldo contábil de despesa declarado | siconfi_dca_function_2024 | 357/497 | Panorama, somente com valor |
| 13 | execution.dcaEducation.outstandingProcessed | restos a pagar processados | 2024 | saldo contábil de despesa declarado | siconfi_dca_function_2024 | 400/497 | Panorama, somente com valor |
| 14 | execution.dcaEducation.derivedRates.liquidatedToCommittedRate | liquidação sobre empenho | 2024 | cálculo local sobre despesas declaradas | siconfi_dca_function_2024 | 497/497 | Panorama de execução |
| 15 | execution.dcaEducation.derivedRates.paidToCommittedRate | pagamento sobre empenho | 2024 | cálculo local sobre despesas declaradas | siconfi_dca_function_2024 | 497/497 | Panorama de execução |
| 16 | execution.dcaEducation.derivedRates.paidToLiquidatedRate | pagamento sobre liquidação | 2024 | cálculo local sobre despesas declaradas | siconfi_dca_function_2024 | 497/497 | Panorama de execução |
| 17 | execution.dcaEducation.derivedRates.outstandingToCommittedRate | restos a pagar sobre empenho | 2024 | cálculo local sobre despesas declaradas | siconfi_dca_function_2024 | 336/497 | Panorama, somente com valor |
| 18 | constitutionalApplication.mdeAppliedAmount.canonical | valor aplicado em MDE reconciliado | 2024, período 6 | declarado pelo município; canônico após reconciliação | SIOPE OData + RREO Anexo 8 | 497/497 | Panorama constitucional |
| 19 | constitutionalApplication.mdeAppliedRate.canonical | percentual aplicado em MDE reconciliado | 2024, período 6 | declarado/calculado; canônico após reconciliação | SIOPE OData + RREO Anexo 8 | 497/497 | Panorama constitucional |
| 20 | constitutionalApplication.fundebProfessionalRemunerationRate.canonical | percentual do Fundeb em remuneração dos profissionais | 2024, período 6 | declarado/calculado; canônico após reconciliação | SIOPE OData + RREO Anexo 8 | 497/497 | Panorama constitucional |
| 21 | constitutionalApplication.fundebRevenueReceivedDeclared | receita do Fundeb recebida segundo declaração municipal | 2024, período 6 | recebimento declarado pelo município; não confirmado pelo concedente | fnde_siope_rreo_annex8_2024_p6 | 497/497 | Panorama, com rótulo explícito de declaração |
| 22 | perStudent.qseDistributedPerEnrollment | QSE distribuída por matrícula usada no cálculo | 2024 | cálculo local sobre transferência confirmada e base oficial | fnde_qse_realized_2024 | 497/497 | Panorama/expansão da QSE |
| 23 | programStatuses.fundebVaaf.status | situação nominal VAAF | 2026 | status oficial | fnde_fundeb_total_forecast_2026 | 497/497; todos confirmed_non_beneficiary | resumo e Panorama |
| 24 | programStatuses.fundebVaat.status | situação nominal VAAT | 2026 | status oficial derivado do demonstrativo nominal | fnde_fundeb_vaat_2026 | 497/497; 14 beneficiários, 483 não beneficiários | resumo e Panorama |
| 25 | programStatuses.fundebVaat.calculationStatus | habilitação para cálculo do VAAT | 2026 | status oficial; não equivale a benefício | fnde_fundeb_vaat_status_2026 | 497/497; todos habilitados para cálculo | Panorama/expansão |
| 26 | programStatuses.fundebVaar.status | situação nominal VAAR | 2026 | status oficial | fnde_fundeb_vaar_status_2026 | 497/497; 274 beneficiários, 223 não beneficiários | resumo e detalhe B após gate |

Campos presentes no schema, mas não publicáveis nesta versão:

- amounts.fundebVaafAnnualForecast: 0/497 com valor; ausência não vira zero.
- qse.installments: 0/497; parcelas não integradas.
- execution.dcaEducation.budgeted: 0/497; orçamento não está na consulta DCA por função.
- execution.dcaEducation.currentExpense e capitalExpense: 0/497; classificação econômica não mapeada.
- Campos de reconciliação bruta e duplicatas de summary são metadados/apoio técnico, não novos valores públicos.

## 6. Textos públicos propostos

Os textos abaixo são modelos canônicos. Para cada uma das 60 relações, usar o modelo do respectivo mecanismo e substituir “[resultado]” pelo nome público do indicador da linha. Isso cobre cada relação sem criar 60 redações divergentes. A frase complementar é omitida quando sua condição não estiver satisfeita.

| Aplicação | Título | Frase principal | Frase complementar opcional | Fonte e ano |
|---|---|---|---|---|
| M-VAAR, categoria B | Complementação VAAR do Fundeb | Melhorar [resultado] pode ajudar o município a cumprir uma das condições consideradas para este recurso. | Situação do município em 2026: [situação]. Previsão oficial: [valor], somente quando o contrato trouxer o valor. | FNDE, 2026 |
| M-PAR, categoria C | Novo PAR | Este programa pode apoiar o planejamento de ações relacionadas a [resultado]. | O atendimento depende de iniciativa cadastrada, análise técnica e orçamento. | FNDE, regra vigente consultada em 2026 |
| M-PAC, categoria C | Novo PAC Educação | Este programa pode apoiar obras e equipamentos relacionados a [resultado]. | A participação depende de seleção oficial aplicável. | Casa Civil, Seleções 2025 |
| M-ETI, categoria C | Escola em Tempo Integral | Este programa pode apoiar a criação e a qualificação de matrículas em tempo integral. | A rede precisa observar as regras de adesão, pactuação e comprovação das matrículas. | MEC, execução 2025 |
| M-PNAE, categoria C | Alimentação Escolar | Este programa pode apoiar a permanência dos estudantes por meio da alimentação escolar. | Os recursos têm uso específico no programa. | FNDE, regra vigente |
| M-PNATE, categoria C | Transporte Escolar | Este programa pode apoiar o acesso e a permanência de estudantes públicos que vivem em área rural. | O atendimento segue as regras próprias do programa. | FNDE, regra vigente |
| M-CAM, categoria C | Caminho da Escola | Este programa pode apoiar o transporte escolar relacionado a [resultado]. | A forma de atendimento depende da via de aquisição e dos requisitos oficiais. | FNDE, regra vigente |
| M-PDDE, categoria C | PDDE | Este programa pode apoiar ações de gestão e pequenos investimentos relacionados a [resultado]. | A execução ocorre por escola ou entidade e segue as regras de cada ação. | FNDE, regra vigente |
| M-PARFOR, categoria C | PARFOR | Este programa pode apoiar a formação adequada de professores para a área em que atuam. | A participação depende de oferta, manifestação e regras do edital. | CAPES, regra vigente |
| M-PROEB, categoria C | ProEB/CAPES | Este programa pode apoiar a pós-graduação de professores da rede pública. | A participação depende de curso e regras aplicáveis. | CAPES, regra vigente |
| M-BOLSA, categoria C | Bolsa Mais Professores | Este programa pode apoiar a formação e a permanência de professores em áreas elegíveis. | O benefício é destinado ao professor e depende das regras do programa. | MEC, regra vigente |
| M-PEATE, categoria C | PEATE/RS | Este programa pode apoiar o transporte de estudantes estaduais da área rural. | O município precisa participar do regime de colaboração e atender às regras estaduais. | Seduc/RS, regra vigente |
| fundeb_vaaf, categoria D | Fundeb | Previsão oficial do Fundeb para o município em 2026: [valor]. | Situação da complementação VAAF: [situação]. | FNDE, 2026 |
| fundeb_vaat, categoria D | Complementação VAAT | Situação do município em 2026: [situação]. | Previsão oficial: [valor], somente quando o contrato trouxer o valor. | FNDE, 2026 |
| salario_educacao_qsem, categoria D | Salário-Educação | Valor distribuído ao município em 2024: [valor]. | Estimativa oficial para 2026: [valor]. | FNDE, 2024 e 2026 |

Regras editoriais:

- Nunca trocar “previsão” por “recebimento”.
- Em valores do RREO, manter “declarado pelo município”.
- Não usar na interface os nomes internos de grupo, relationType, amountNature, nullReasonCode, gate ou coverage.
- Não mostrar frase complementar vazia e não substituir ausência por mensagem de indisponibilidade.
- No Fundeb, não apresentar a previsão total como soma do total com VAAT ou VAAR.

## 7. Regras de omissão

A camada pública futura deve aplicar as regras abaixo antes de montar cartões, listas, rodapés ou seções:

1. Relação ausente da lista fechada da seção 3.4 não gera item.
2. Indicador presente somente em investigation não gera relação financeira.
3. Relação aprovada cujo indicador não esteja em ação municipal nem coordenação federativa no município não gera item.
4. Programa C gera apenas finalidade e regra. Ausência de situação ou valor municipal não gera mensagem.
5. Valor nulo não gera zero, traço, “indisponível”, “pendente” nem qualquer explicação pública.
6. Situação nominal só aparece se vier de campo e fonte aprovados.
7. Seção sem item após todos os filtros não é renderizada.
8. Fonte só aparece no rodapé quando sua informação foi efetivamente exibida.
9. O mesmo programa aparece no máximo uma vez na página; múltiplos indicadores são consolidados no mesmo item.
10. Recursos D aparecem somente no bloco geral ou Panorama, nunca repetidos nos indicadores.
11. Previsão, distribuição, declaração, transferência, empenho, liquidação e pagamento mantêm rótulos distintos.
12. A interface não explica por que uma relação, um programa, um valor ou uma seção foi omitido.

## 8. Exclusões internas

Esta seção é controle de equipe e não deve originar mensagens públicas.

### 8.1 Disposição dos 18 itens do catálogo financeiro

| ID | Disposição DF0 | Motivo |
|---|---|---|
| fundeb_vaaf | aprovado, D | recurso geral; situação nominal e previsão total disponíveis |
| fundeb_vaat | aprovado, D | recurso geral; status completo e previsão para beneficiários |
| fundeb_vaar | aprovado, B em 5 cruzamentos | condição oficial e situação nominal; indicador não determina sozinho o benefício |
| salario_educacao_qsem | aprovado, D | recurso geral; distribuição 2024 e estimativa 2026 |
| par_novo_par | aprovado, C | finalidade/regra oficial, sem situação municipal integrada |
| novo_pac_educacao | aprovado, C | finalidade/regra de seleção, sem inferir chamada ou seleção municipal |
| escola_tempo_integral | aprovado, C | finalidade/regra; o tipo interno direct não representa ganho financeiro |
| pnae | aprovado, C | apoio restrito à alimentação escolar |
| pnate | aprovado, C | apoio restrito ao transporte de estudantes rurais elegíveis |
| caminho_escola | aprovado, C | apoio programático; atendimento depende da via e dos requisitos |
| pdde | aprovado, C | granularidade por escola/entidade; não é recurso livre da secretaria |
| parfor | aprovado, C | o tipo interno direct não comprova participação nem repasse |
| proeb_capes | aprovado, C | o tipo interno direct não comprova participação nem repasse |
| bolsa_mais_professores | aprovado, C | benefício do docente, sujeito a área e localidade elegíveis |
| peate_rs | aprovado, C | regime de colaboração e habilitação; sem situação municipal integrada |
| programa_nacional_infraestrutura_escolar | excluído | catálogo registra created_pending_regulation; Lei 15.388/2026 exige ato do MEC para adesão, trajetória e priorização |
| siope | excluído como mecanismo | sistema de informação e evidência orçamentária, não fonte de financiamento |
| siconfi_finbra | excluído como mecanismo | sistema fiscal/contábil, não fonte de financiamento |

O RREO também é apenas fonte de informação. Ele participa da reconciliação dos valores declarados, mas não é programa, fundo ou transferência.

### 8.2 Relações e indicadores excluídos

- 26 indicadores têm vínculo específico na matriz, mas aparecem em zero contratos sob ação municipal ou coordenação federativa: basico_15_17, aee, medio_tecnico_articulado_percentual, alfabetizacao, os seis indicadores SAEB, idade_regular_medio, adequacao_em, internet, internet_alunos, internet_aprendizagem, internet_comunidade, acesso_internet_computador, acesso_internet_disp_pessoais, rede_local, rede_wireless, banda_larga, educacao_ambiental, proposta_pedagogica, desktop_aluno, comp_portatil_aluno e tablet_aluno.
- 7 indicadores não têm vínculo específico na matriz: medio_tecnico_participacao_publica, subsequente_expansao, alfabetizacao_pop_15_mais, fundamental_concluido_18_mais, fundamental_concluido_15_29, medio_concluido_18_mais e medio_concluido_18_29.
- As 17 relações com programa_nacional_infraestrutura_escolar permanecem excluídas até existir e ser documentado o ato regulamentador pertinente.
- As relações no_proven_direct_link de SIOPE e SICONFI não são relações financeiras publicáveis.
- Os vínculos gerais Fundeb/QSE para todos os indicadores foram convertidos em três itens D, sem repetição por indicador.

### 8.3 educationLinks atuais e duplicidades

Em 497/497 contratos financeiros há exatamente:

1. creche × salario_educacao_qsem, relationType general_mde, apontando para amounts.qseDistributedClosedYear. É um recurso D geral e não deve aparecer como relação específica de creche.
2. alfabetizacao × fundeb_vaar, relationType conditional_support, apontando para amounts.fundebVaarAnnualForecast. O indicador está em investigation nos 497 diagnósticos e, por isso, o vínculo não gera cartão.

Consequentemente, educationLinks não deve ser publicado sem o filtro da matriz DF0.

### 8.4 Valores excluídos da leitura pretendida

- Previsões Fundeb, VAAT, VAAR e QSE não são recebimentos.
- Receita Fundeb do RREO é declaração municipal, não transferência confirmada pelo concedente.
- DCA empenhada, liquidada e paga é despesa, não receita.
- Restos a pagar são saldos contábeis de despesa, não recursos novos.
- QSE transferida não é saldo disponível.
- Fundeb total não pode ser somado às complementações já incluídas.
- Campos nulos ou com cobertura zero não podem ser convertidos em zero.
- Não existe componente contratual para calcular efeito marginal de um indicador sobre acesso, valor, ganho ou perda.

## 9. Plano recomendado de implementação

As etapas seguintes são propostas, não executadas neste DF0.

### DF1 — Camada pública de apresentação

- Criar um catálogo público derivado da lista fechada deste documento.
- Separar conteúdo público de rótulos internos.
- Implementar as categorias B, C e D; não criar categoria A vazia na interface.
- Centralizar os modelos de texto e as regras EC, ND e FT.

### DF2 — Integração da matriz aprovada

- Cruzar o catálogo público com indicatorFinancingMatrix e os dois grupos de decisionSummary.
- Tratar a seção 3.4 como allowlist verificável.
- Consolidar programas repetidos por página.
- Não usar educationLinks como fonte exclusiva da decisão de exibição.

### DF3 — Reorganização do Diagnóstico

- Acrescentar, no detalhe do indicador, somente relações B/C aprovadas que sobrevivam ao gate municipal.
- Criar um resumo geral único para recursos D.
- Omitir integralmente seções vazias.
- Preservar todos os resultados, comparações e classificações educacionais congelados.

### DF4 — Valores municipais

- Exibir os 26 campos conforme natureza, ano e cobertura definidos na seção 5.
- Manter previsto, transferido, declarado, empenhado, liquidado e pago em blocos semanticamente distintos.
- Aplicar a regra de composição do Fundeb e as omissões por valor nulo.

### DF5 — Fontes

- Gerar a seção final de fontes a partir dos itens realmente renderizados.
- Mostrar órgão, nome simples da fonte e ano/período.
- Não expor fontes de relações ou valores omitidos.

### DF6 — Testes de conteúdo e omissão

- Cobrir as 60 relações permitidas e rejeitar relações fora da allowlist.
- Cobrir investigation, gate ausente, valor nulo, seção vazia, fonte não usada e consolidação de programas.
- Verificar que previsões e declarações conservam seus rótulos.
- Verificar que Fundeb total não sofre dupla contagem e que não há texto de ganho/perda.

## 10. Necessidade de novos downloads

A primeira versão publicável pode ser construída integralmente com os dados atuais. Nenhum novo download é requisito para publicar:

- as 60 relações específicas como regra/finalidade;
- as situações e previsões atuais de VAAR;
- os três recursos gerais D;
- os 26 campos municipais utilizáveis;
- os textos e as regras de omissão deste inventário.

Nenhuma relação aprovada depende de nova base para sua forma mínima. Os 11 mecanismos C, porém, não possuem situação ou valor municipal integrado. Caso uma versão posterior queira afirmar inscrição, seleção, atendimento, repasse ou valor por município, será necessária uma base nominal oficial, estável, datada e com chave municipal para o respectivo programa.

Prioridade sugerida para enriquecimento posterior:

1. Sem download adicional: publicar a primeira versão conservadora.
2. Alta, somente se houver fonte nominal reproduzível: PAR/Novo PAR, Novo PAC e Escola em Tempo Integral.
3. Média, com atenção à granularidade e natureza: PNAE, PNATE, Caminho da Escola, PDDE e PEATE/RS.
4. Baixa, até existir grão municipal adequado: PARFOR, ProEB/CAPES e Bolsa Mais Professores.
5. Bloqueada: Programa Nacional de Infraestrutura Escolar, até regulamentação oficial documentada.

Downloads ou consultas adicionais não devem ser realizados apenas para preencher ausência visual. Cada integração futura deve preservar ano, situação, natureza do valor, fonte oficial, cobertura e regra de omissão.

## 11. Registro de auditoria e verificabilidade

### 11.1 Procedimento executado

Foi executado um script Python efêmero, sem arquivo persistente, que:

- carregou public/data/municipios_index.json;
- percorreu os 497 diagnostico.json e os 497 financeiro.json;
- validou conjuntos de versões, schemas, chaves e IDs;
- contou a presença de cada indicador em decisionSummary.municipalActionItems, coordinationItems e investigationItems;
- cruzou os gates com indicatorFinancingMatrix.json;
- contou programStatuses, valores preenchidos e anos por campo financeiro;
- verificou a composição e a igualdade estrutural de educationLinks;
- calculou as interseções entre os cinco indicadores B e os 274 contratos com previsão VAAR;
- não gravou nem regenerou contratos.

Também foram usados comandos somente de leitura para localizar arquivos, consultar trechos de documentação e código, listar chaves/valores de amostras e inspecionar o estado do Git.

### 11.2 Contagens reproduzíveis

| Controle | Resultado |
|---|---:|
| Slugs no índice | 497 |
| Diagnósticos encontrados | 497 |
| Financeiros encontrados | 497 |
| Diagnósticos ausentes | 0 |
| Financeiros ausentes | 0 |
| Indicadores por diagnóstico | 49 |
| Conjuntos distintos de IDs de indicadores | 1 |
| Schemas e versões financeiras distintos | 1 |
| Formas internas observadas ao contar chaves opcionais | 14, todas compatíveis com o schema |
| educationLinks por contrato | 2 |
| Contratos com situação VAAF | 497 |
| Contratos com situação VAAT | 497 |
| Contratos com situação VAAR | 497 |
| Beneficiários VAAT | 14 |
| Beneficiários VAAR | 274 |
| Não beneficiários VAAR | 223 |
| Contratos com QSE distribuída 2024 | 497 |
| Contratos com estimativa QSE 2026 | 497 |

### 11.3 Confirmações de escopo

- Nenhum dos 49 indicadores foi alterado.
- Nenhum contrato, schema, pipeline, JSON gerado, componente React ou texto público existente foi alterado.
- Nenhuma base externa foi baixada.
- Nenhuma relação foi acrescentada além do catálogo, da matriz, das regras oficiais documentadas e dos gates observados.
- Nenhuma previsão foi tratada como recebimento.
- Nenhuma declaração municipal foi tratada como transferência confirmada.
- Nenhum ganho, perda, saldo ou valor hipotético foi calculado.
- SIOPE, SICONFI e RREO foram classificados somente como fontes de informação.
- As contagens vieram dos 497 arquivos reais.
- A intervenção DF0 criou somente docs/DIAGNOSTICO_FINANCIAMENTO_INVENTARIO_PUBLICAVEL_V1.md. Alterações alheias já presentes no worktree antes da criação deste documento permaneceram intocadas.
