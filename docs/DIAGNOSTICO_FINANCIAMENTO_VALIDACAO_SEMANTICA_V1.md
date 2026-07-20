# DF0.1 — Validação semântica e legal das relações entre indicadores e financiamento

**Versão:** 1.0  
**Data de corte:** 20 de julho de 2026  
**Escopo:** validação documental das 60 relações específicas inventariadas em `DIAGNOSTICO_FINANCIAMENTO_INVENTARIO_PUBLICAVEL_V1.md`  
**Natureza:** allowlist semântica para publicação; não altera contratos, dados, regras de cálculo, pipeline, interface ou elegibilidade municipal

Este documento aplica uma leitura restritiva: afinidade temática, contribuição indireta, possibilidade genérica de uso ou coincidência com uma meta do PNE não bastam para publicar um cruzamento. A relação somente permanece quando a base oficial identifica uma condição financeira equivalente ao indicador ou uma ação financiada diretamente relacionada ao seu numerador, denominador ou objeto mensurado.

## 1. Resumo executivo

| Resultado | Inventário DF0 | Allowlist DF0.1 | Variação |
|---|---:|---:|---:|
| Relações específicas | 60 | 26 | -34 |
| Classe B — condição financeira comprovada | 5 | 0 | -5 |
| Classe C — ação diretamente apoiada | 55 | 26 | -29 |
| Indicadores com ao menos uma relação específica | 16 | 10 | -6 |
| Mecanismos com ao menos uma relação específica | 12 | 10 | -2 |
| Mecanismos gerais, sem cruzamento específico (D) | 3 | 4 | +1 |

Conclusões centrais:

1. **Nenhuma das cinco relações VAAR é uma condição financeira específica comprovada.** Os indicadores locais não reproduzem a população, a fórmula, os componentes e os períodos usados oficialmente. O VAAR deve sair dos cruzamentos B e permanecer apenas como situação financeira geral do município, com consulta nominal oficial.
2. **A allowlist específica final contém 26 relações C**, distribuídas por dez indicadores e dez mecanismos.
3. **Trinta e quatro relações são excluídas:** 13 por serem apenas contextuais, 11 por escopo ou governança incompatível e 10 por falta de base oficial suficiente para o nexo alegado.
4. **A lista geral D passa a quatro mecanismos:** Fundeb/VAAF, VAAT, Salário-Educação e VAAR. Esses itens podem aparecer no panorama financeiro municipal, nunca como consequência de um indicador isolado.
5. A classificação C indica somente que existe uma ação diretamente relacionada. **Não comprova chamada aberta, seleção, saldo, adesão, elegibilidade, repasse ou efeito causal no indicador.**

Em termos de transição: **0 B foram mantidas; as 5 B originais foram excluídas como relações específicas e o VAAR foi reposicionado em D; 26 C foram mantidas e 29 C foram excluídas; os 3 D originais foram mantidos e receberam o VAAR como quarto item geral.**

### Allowlist em uma linha

`creche` (PAR, Novo PAC, PNATE, Caminho da Escola); `pre_escola` (PAR, Novo PAC, PNATE, Caminho da Escola); `basico_6_17` (PAR, PNATE, Caminho da Escola, PEATE/RS); `basico_integral` (PAR, Novo PAC, Escola em Tempo Integral, PNAE); `escolas_integral` (PAR, Novo PAC, Escola em Tempo Integral, PNAE); `adequacao_ai` (PARFOR); `adequacao_af` (PARFOR); `pos_graduacao` (ProEB); `salas_climatizadas` (PAR, PDDE); `salas_acessiveis` (PDDE).

## 2. Critérios aplicados

Cada uma das 60 relações foi submetida às mesmas doze perguntas:

1. Qual é o objetivo exato do indicador?
2. Qual é seu numerador, denominador ou objeto mensurado?
3. Qual população, etapa, rede e dependência administrativa ele cobre?
4. O mecanismo cria condição financeira ou financia uma ação identificável?
5. Essa condição usa fórmula equivalente à do indicador?
6. A população do mecanismo é compatível com a população do indicador?
7. O escopo material da ação é compatível com o objeto mensurado?
8. A dependência administrativa é compatível?
9. O município, sua rede, uma escola ou um docente tem via real de acesso?
10. A ação pode alterar diretamente o numerador, o denominador ou o objeto observado?
11. Há fonte oficial vigente ou suficientemente atual que sustente o nexo?
12. O texto público consegue descrever a relação sem prometer elegibilidade, recurso ou resultado?

### 2.1 Classes finais

- **B — condição financeira comprovada:** o indicador local é o próprio componente oficial, ou equivalente demonstrável, de uma regra de acesso/distribuição. Resultado final: nenhuma relação.
- **C — ação diretamente apoiada:** o mecanismo financia, fomenta ou viabiliza ação diretamente ligada ao objeto mensurado, ainda que alcance apenas subconjunto explícito e dependa de adesão, seleção ou execução.
- **Excluir — contextual:** o mecanismo pode favorecer o ambiente educacional, mas não atua diretamente no objeto do indicador.
- **Excluir — escopo incompatível:** população, etapa, rede, dependência administrativa, beneficiário ou objeto financiado não coincide com a relação publicada.
- **Excluir — base oficial insuficiente:** não foi localizada regra oficial específica bastante para sustentar o nexo; não se presume ação a partir da amplitude geral do programa.

### 2.2 Regras conservadoras de leitura

- “Pode contribuir” não equivale a ação diretamente financiada.
- Transferência geral de manutenção e desenvolvimento do ensino não cria relação específica.
- Programas rurais podem permanecer diante de indicador mais amplo apenas com o recorte **público rural** explícito.
- Benefício pago a docente não é receita da prefeitura.
- Indicação de escola no PAR/SIMEC não transforma em PAR um repasse operacionalizado pelo PDDE.
- Projeto de nova escola não equivale a programa de retrofit de todas as salas existentes.
- Uma seleção encerrada comprova o desenho da ação, mas não autoriza dizer que existe oportunidade aberta.

## 3. Validação especial das cinco relações VAAR

### 3.1 Regra oficial pertinente ao exercício de 2026

A Lei nº 14.113/2020 condiciona a complementação-VAAR ao cumprimento de condicionalidades de gestão e à evolução de indicadores oficiais. Para 2026, a Resolução CIF nº 17/2025 aprovou a metodologia detalhada na Nota Técnica Inep nº 34/2025.

A metodologia oficial reúne dois blocos, com ponderação de 50% cada:

- **atendimento:** permanência, dentro do ano, dos estudantes já matriculados na rede, com informação de abandono e ausência de informação de movimento/rendimento, comparando 2023 e 2024;
- **aprendizagem:** resultados do Saeb em língua portuguesa e matemática no 5º e 9º anos do ensino fundamental e no ensino médio, taxas de aprovação, participação e medida de equidade, com os períodos definidos na nota técnica.

O cálculo é feito por rede de ensino, com regras próprias de estabilidade/melhoria, participação, disponibilidade de dados e distribuição. A lista nominal e a previsão oficial do exercício continuam sendo a evidência definitiva de benefício; um indicador do painel não substitui essa consulta.

### 3.2 Teste individual

| Relação DF0 | Definição atual: população e fórmula local | Componente VAAR mais próximo | Equivalência? | Fonte | Decisão final | Texto público específico |
|---|---|---|:---:|---|---|---|
| `creche × fundeb_vaar` | matrículas localizadas de 0–3 anos / população municipal residente de 0–3 anos | permanência de estudantes já matriculados; a metodologia não usa cobertura populacional de creche como fórmula | Não | S1–S5 | excluir; não há condição B comprovada | nenhum; relação não será publicada |
| `pre_escola × fundeb_vaar` | matrículas de pré-escola / população municipal de 4–5 anos | a movimentação da pré-escola integra o atendimento, mas mede permanência de matriculados, não cobertura da população de 4–5 anos | Não | S1–S5 | excluir; sem equivalência de população ou fórmula | nenhum; relação não será publicada |
| `basico_6_17 × fundeb_vaar` | matrículas de 6–17 anos / população municipal de 6–17 anos | permanência de matriculados e componentes de aprendizagem por rede | Não | S1–S5 | excluir; cobertura populacional não é o indicador oficial VAAR | nenhum; relação não será publicada |
| `idade_regular_quinto × fundeb_vaar` | média municipal da taxa de conclusão dos anos iniciais na idade regular | Saeb do 5º ano, aprovação, participação e equidade | Não | S1–S5 | excluir; etapa próxima não torna as medidas equivalentes | nenhum; relação não será publicada |
| `idade_regular_nono × fundeb_vaar` | média municipal da taxa de conclusão dos anos finais na idade regular | Saeb do 9º ano, aprovação, participação e equidade | Não | S1–S5 | excluir; conclusão em idade regular não é o componente oficial | nenhum; relação não será publicada |

### 3.3 Respostas obrigatórias

1. **O que o VAAR usa de fato?** Condicionalidades legais, indicador de atendimento baseado em permanência/movimento dos já matriculados e indicador de aprendizagem composto por Saeb, aprovação, participação e equidade, conforme metodologia anual oficial.
2. **O indicador local reproduz essa fórmula?** Não, em nenhum dos cinco cruzamentos.
3. **Etapa e população são compatíveis?** Há aproximação temática em pré-escola, 5º e 9º anos, mas a população, o evento observado e a unidade de cálculo não coincidem.
4. **Os períodos são compatíveis?** Não de forma demonstrada. A metodologia VAAR fixa pares de anos próprios; o painel usa séries e referências municipais que não substituem esses períodos.
5. **É proxy ou equivalente?** No máximo proxy temática. Proxy não deve ser publicada como condição financeira.

**Resultado:** `fundeb_vaar` deixa a classe B específica e passa à classe D geral. A aplicação pode mostrar situação nominal e previsão oficial do município, com texto independente dos indicadores educacionais.

## 4. Matriz de decisão das 60 relações

Legenda: **S** = sim; **P** = compatibilidade parcial, somente com recorte explícito; **N** = não. Em “muda N/D”, N e D significam numerador e denominador, não “não disponível”. Os códigos de fonte são detalhados na seção 9.

Para manter a matriz legível, `indicatorId` e `programId` aparecem nas colunas “Indicador” e “Mecanismo”; os nomes correspondentes estão nos dois quadros abaixo. “Etapa/escopo”, “Rede/dep.” e “Público” registram as três compatibilidades exigidas. “Decisão final” já contém a categoria final; para C, a ação da linha é convertida no texto público da seção 5 e nos modelos específicos da seção 7. Relações excluídas não possuem texto público.

| indicatorId | Nome do indicador |
|---|---|
| `creche` | População de 0 a 3 anos que frequenta a escola/creche |
| `pre_escola` | População de 4 a 5 anos que frequenta a escola/creche |
| `basico_6_17` | População de 6 a 17 anos que frequenta a educação básica |
| `basico_integral` | Alunos do público-alvo da ETI em jornada integral na rede pública |
| `escolas_integral` | Escolas públicas com alunos em jornada de tempo integral |
| `eja_integrada_educacao_profissional_percentual` | Percentual das matrículas da EJA articuladas à educação profissional |
| `idade_regular_quinto` | Estudantes que concluem os anos iniciais na idade regular |
| `idade_regular_nono` | Estudantes que concluem os anos finais na idade regular |
| `adequacao_ai` | Docentes com formação adequada nos anos iniciais |
| `adequacao_af` | Docentes com formação adequada nos anos finais |
| `pos_graduacao` | Docentes da educação básica com pós-graduação |
| `rendimento_magisterio` | Rendimento do magistério em relação a outros profissionais com nível superior |
| `temporarios` | Docentes da rede pública com contrato temporário |
| `conselho_escolar` | Escolas públicas com conselho escolar instituído e em funcionamento |
| `salas_climatizadas` | Salas de aula climatizadas |
| `salas_acessiveis` | Salas de aula com acessibilidade |

| programId | Nome do programa/mecanismo |
|---|---|
| `fundeb_vaar` | Complementação-VAAR do Fundeb |
| `par_novo_par` | Plano de Ações Articuladas (PAR/Novo PAR) |
| `novo_pac_educacao` | Novo PAC Seleções — educação básica |
| `escola_tempo_integral` | Programa Escola em Tempo Integral |
| `pnae` | Programa Nacional de Alimentação Escolar |
| `pnate` | Programa Nacional de Apoio ao Transporte do Escolar |
| `caminho_escola` | Programa Caminho da Escola |
| `peate_rs` | Programa Estadual de Apoio ao Transporte Escolar — PEATE/RS |
| `pdde` | Programa Dinheiro Direto na Escola e Ações Integradas |
| `parfor` | PARFOR — formação inicial de professores em serviço |
| `proeb_capes` | ProEB/CAPES — pós-graduação de professores da rede pública |
| `bolsa_mais_professores` | Bolsa Mais Professores |

| # | Indicador | Mecanismo | Classe original | Objetivo do indicador | Ação/condição alegada | Público | Etapa/escopo | Rede/dep. | Acesso/governança municipal | Muda N/D ou objeto? | Fonte | Decisão final / categoria final | Texto público ou motivo da exclusão |
|---:|---|---|:---:|---|---|:---:|:---:|:---:|---|---|---|---|---|
| 1 | `creche` | `fundeb_vaar` | B | cobertura 0–3 | condição VAAR | N | N | N | consulta nominal, não controle local | N | S1–S5 | excluir — base insuficiente | permanência de matriculados não equivale à cobertura populacional 0–3 |
| 2 | `creche` | `par_novo_par` | C | cobertura 0–3 | construção/ampliação e equipamentos da educação infantil | P | S | P | município propõe; análise e orçamento federais | N: sim; D: não | S6–S8 | **C** | Proinfância/PAR atua diretamente na capacidade pública de creche |
| 3 | `creche` | `novo_pac_educacao` | C | cobertura 0–3 | creches e escolas de educação infantil | P | S | P | município propõe em seleção | N: sim; D: não | S9–S10 | **C** | modalidade oficial financia expansão física da educação infantil |
| 4 | `creche` | `pnae` | C | cobertura 0–3 | alimentação dos matriculados | P | N | P | transferência automática à entidade executora | não diretamente | S13–S14 | excluir — contextual | alimentação atende quem já está matriculado; não financia expansão da cobertura |
| 5 | `creche` | `pnate` | C | cobertura 0–3 | transporte de estudante público rural | P | S | P | município executa para elegíveis rurais | N: sim, no subconjunto | S15 | **C** | remove barreira direta de acesso, somente para educação pública rural elegível |
| 6 | `creche` | `caminho_escola` | C | cobertura 0–3 | veículos para transporte escolar | P | S | P | município acessa por PAR, recursos próprios ou crédito | N: sim, no subconjunto | S16 | **C** | transporte pode viabilizar acesso diário do público rural/ribeirinho |
| 7 | `creche` | `peate_rs` | C | cobertura 0–3 | transporte de alunos estaduais rurais | N | N | N | município conveniado apenas executa transporte estadual | não de forma material | S17 | excluir — escopo incompatível | o PEATE/RS não financia o transporte da rede municipal de educação infantil |
| 8 | `pre_escola` | `fundeb_vaar` | B | cobertura 4–5 | condição VAAR | N | N | N | consulta nominal, não controle local | N | S1–S5 | excluir — base insuficiente | movimento de matriculados na pré-escola não equivale à cobertura de 4–5 anos |
| 9 | `pre_escola` | `par_novo_par` | C | cobertura 4–5 | construção/ampliação e equipamentos da educação infantil | P | S | P | município propõe; análise e orçamento federais | N: sim; D: não | S6–S8 | **C** | Proinfância/PAR atua diretamente na oferta pública de pré-escola |
| 10 | `pre_escola` | `novo_pac_educacao` | C | cobertura 4–5 | creches e escolas de educação infantil | P | S | P | município propõe em seleção | N: sim; D: não | S9–S10 | **C** | modalidade oficial financia expansão física da pré-escola |
| 11 | `pre_escola` | `pnae` | C | cobertura 4–5 | alimentação dos matriculados | P | N | P | transferência automática à entidade executora | não diretamente | S13–S14 | excluir — contextual | alimentação apoia permanência, mas não cria a vaga medida pela cobertura |
| 12 | `pre_escola` | `pnate` | C | cobertura 4–5 | transporte de estudante público rural | P | S | P | município executa para elegíveis rurais | N: sim, no subconjunto | S15 | **C** | ação direta de acesso, limitada à educação pública rural |
| 13 | `pre_escola` | `caminho_escola` | C | cobertura 4–5 | veículos para transporte escolar | P | S | P | município acessa pelas vias oficiais | N: sim, no subconjunto | S16 | **C** | veículos podem remover barreira direta de acesso rural/ribeirinho |
| 14 | `pre_escola` | `peate_rs` | C | cobertura 4–5 | transporte de alunos estaduais rurais | N | N | N | execução municipal em colaboração estadual | não de forma material | S17 | excluir — escopo incompatível | rede estadual rural não coincide com a responsabilidade municipal de pré-escola |
| 15 | `basico_6_17` | `fundeb_vaar` | B | frequência 6–17 | condição VAAR | N | N | N | consulta nominal, não controle local | N | S1–S5 | excluir — base insuficiente | cobertura da população 6–17 não é o indicador VAAR de atendimento |
| 16 | `basico_6_17` | `par_novo_par` | C | frequência 6–17 | construção, ampliação, equipamentos e transporte | P | S | P | município planeja e propõe | N: sim; D: não | S6–S7 | **C** | infraestrutura e oferta pública podem ampliar diretamente vagas acessíveis |
| 17 | `basico_6_17` | `pnae` | C | frequência 6–17 | alimentação dos matriculados | P | N | P | transferência automática | não diretamente | S13–S14 | excluir — contextual | a ação é essencial, mas não mede nem financia diretamente cobertura/frequência populacional |
| 18 | `basico_6_17` | `pnate` | C | frequência 6–17 | transporte de estudante público rural | P | S | P | município recebe/executa para elegíveis | N: sim, no subconjunto | S15 | **C** | objetivo oficial inclui acesso e permanência dos estudantes rurais |
| 19 | `basico_6_17` | `caminho_escola` | C | frequência 6–17 | veículos de transporte escolar | P | S | P | município acessa pelas vias oficiais | N: sim, no subconjunto | S16 | **C** | ação direta de transporte do público básico rural/ribeirinho |
| 20 | `basico_6_17` | `peate_rs` | C | frequência 6–17 | transporte de estudante da rede estadual rural | P | S | P | município habilitado executa convênio | N: sim, no subconjunto | S17 | **C** | recorte estadual rural está contido no indicador territorial amplo; deve ser explicitado |
| 21 | `basico_integral` | `par_novo_par` | C | proporção de matrículas integrais | obras/intervenções para vagas integrais | P | S | P | seleção municipal; não há garantia de janela | N: sim | S6, S11 | **C** | PAR-Portfólio e ações correlatas têm objeto oficial de vagas em tempo integral |
| 22 | `basico_integral` | `novo_pac_educacao` | C | proporção de matrículas integrais | construção de escolas de fundamental/médio em tempo integral | P | S | P | município propõe em seleção | N: sim | S9–S10 | **C** | infraestrutura é destinada expressamente à oferta integral |
| 23 | `basico_integral` | `escola_tempo_integral` | C | proporção de matrículas integrais | criação, manutenção e qualificação de matrículas integrais | P | S | P | rede municipal adere e pactua | N: sim | S12 | **C** | o objeto financiado coincide diretamente com o numerador |
| 24 | `basico_integral` | `pnae` | C | proporção de matrículas integrais | alimentação de estudantes com jornada mínima integral | P | S | P | transferência automática conforme Censo | N: manutenção direta | S13–S14 | **C** | há atendimento e valor per capita próprios para estudante em tempo integral |
| 25 | `basico_integral` | `pnate` | C | proporção de matrículas integrais | transporte rural | P | N | P | município executa para elegíveis | apenas incidental | S15 | excluir — contextual | transporte rural não cria nem financia a jornada integral |
| 26 | `basico_integral` | `caminho_escola` | C | proporção de matrículas integrais | veículos de transporte | P | N | P | município acessa pelas vias oficiais | apenas incidental | S16 | excluir — contextual | veículo escolar não é ação específica de expansão da jornada |
| 27 | `escolas_integral` | `par_novo_par` | C | proporção de escolas com jornada integral | obras/intervenções em escolas com vagas integrais | P | S | P | seleção municipal | N: sim | S6, S11 | **C** | ação oficial atua diretamente em unidades com oferta integral |
| 28 | `escolas_integral` | `novo_pac_educacao` | C | proporção de escolas com jornada integral | novas escolas de tempo integral | P | S | P | município propõe em seleção | N e D: sim | S9–S10 | **C** | construção tem destinação expressa de funcionamento integral |
| 29 | `escolas_integral` | `escola_tempo_integral` | C | proporção de escolas com jornada integral | criação/manutenção de matrículas integrais nas redes | P | S | P | rede municipal adere e pactua | N: sim | S12 | **C** | matrículas pactuadas fazem a escola integrar o numerador |
| 30 | `escolas_integral` | `pnae` | C | proporção de escolas com jornada integral | alimentação diferenciada de matrículas integrais | P | S | P | transferência automática | N: manutenção direta | S13–S14 | **C** | alimentação é requisito operacional diretamente financiado para a jornada integral |
| 31 | `escolas_integral` | `pnate` | C | proporção de escolas com jornada integral | transporte rural | P | N | P | município executa para elegíveis | apenas incidental | S15 | excluir — contextual | não financia implantação ou funcionamento integral da escola |
| 32 | `escolas_integral` | `caminho_escola` | C | proporção de escolas com jornada integral | veículos de transporte | P | N | P | município acessa pelas vias oficiais | apenas incidental | S16 | excluir — contextual | não há modalidade específica vinculada à conversão de escolas para tempo integral |
| 33 | `eja_integrada_educacao_profissional_percentual` | `par_novo_par` | C | proporção da EJA articulada à EPT | planejamento genérico no PAR | P | P | P | município planeja; ação específica não demonstrada | não comprovado | S6–S7 | excluir — base insuficiente | não foi localizada iniciativa oficial vigente que financie exatamente a integração EJA–EPT |
| 34 | `idade_regular_quinto` | `fundeb_vaar` | B | conclusão dos anos iniciais na idade regular | condição VAAR de aprendizagem | N | N | N | consulta nominal | N | S1–S5 | excluir — base insuficiente | Saeb/aprovação do 5º ano não equivalem à conclusão em idade regular |
| 35 | `idade_regular_quinto` | `par_novo_par` | C | conclusão na idade regular | ações gerais de permanência | P | N | P | município planeja | apenas indireto | S6–S7 | excluir — contextual | o PAR não financia uma ação identificada que altere essa taxa específica |
| 36 | `idade_regular_quinto` | `pnae` | C | conclusão na idade regular | alimentação escolar | P | N | P | transferência automática | apenas indireto | S13–S14 | excluir — contextual | alimentação não atua diretamente no evento “concluir na idade regular” |
| 37 | `idade_regular_nono` | `fundeb_vaar` | B | conclusão dos anos finais na idade regular | condição VAAR de aprendizagem | N | N | N | consulta nominal | N | S1–S5 | excluir — base insuficiente | Saeb/aprovação do 9º ano não equivalem à conclusão em idade regular |
| 38 | `idade_regular_nono` | `par_novo_par` | C | conclusão na idade regular | ações gerais de permanência | P | N | P | município planeja | apenas indireto | S6–S7 | excluir — contextual | nexo depende de múltiplos passos e não há ação oficial específica comprovada |
| 39 | `idade_regular_nono` | `pnae` | C | conclusão na idade regular | alimentação escolar | P | N | P | transferência automática | apenas indireto | S13–S14 | excluir — contextual | alimentação não altera diretamente a taxa de conclusão em idade regular |
| 40 | `adequacao_ai` | `par_novo_par` | C | adequação da formação inicial nos anos iniciais | formação genérica no PAR | P | P | P | município planeja | não comprovado | S6, S18 | excluir — base insuficiente | formação continuada genérica não equivale a licenciatura adequada à docência exercida |
| 41 | `adequacao_ai` | `parfor` | C | adequação da formação inicial nos anos iniciais | licenciatura correspondente à área de atuação | P | S | P | demanda articulada; benefício formativo ao docente | N: sim, para participantes | S18 | **C** | objetivo oficial do PARFOR é adequar a formação inicial de professores em serviço |
| 42 | `adequacao_ai` | `bolsa_mais_professores` | C | adequação da formação inicial nos anos iniciais | bolsa e especialização para novos ingressantes | N | N | N | edital vigente: adesão de estados/DF; benefício pessoal | não comprovado | S20 | excluir — escopo incompatível | rede municipal não acessa o edital vigente e especialização não corrige formação inicial inadequada |
| 43 | `adequacao_af` | `par_novo_par` | C | adequação da licenciatura à disciplina nos anos finais | formação genérica no PAR | P | P | P | município planeja | não comprovado | S6, S18 | excluir — base insuficiente | não há iniciativa PAR específica demonstrada de licenciatura por área de atuação |
| 44 | `adequacao_af` | `parfor` | C | adequação da licenciatura à disciplina nos anos finais | licenciatura correspondente à área de atuação | P | S | P | demanda articulada; benefício formativo ao docente | N: sim, para participantes | S18 | **C** | licenciatura na área é diretamente aderente ao objeto do indicador |
| 45 | `adequacao_af` | `bolsa_mais_professores` | C | adequação da licenciatura à disciplina nos anos finais | ingresso/permanência e especialização | N | N | N | edital vigente restrito a estados/DF | não comprovado | S20 | excluir — escopo incompatível | especialização e ingresso não substituem licenciatura adequada; sem acesso municipal no ciclo vigente |
| 46 | `pos_graduacao` | `par_novo_par` | C | proporção de docentes com pós-graduação | formação continuada genérica | P | P | P | município planeja | não comprovado | S6–S7 | excluir — base insuficiente | amplitude do PAR não prova oferta financiada de pós-graduação |
| 47 | `pos_graduacao` | `proeb_capes` | C | proporção de docentes com pós-graduação | mestrado profissional para docente da rede pública | P | S | P | acesso do docente/IES; não é receita municipal | N: sim, para concluintes | S19 | **C** | o ProEB fomenta pós-graduação stricto sensu do público diretamente mensurado |
| 48 | `pos_graduacao` | `bolsa_mais_professores` | C | proporção de docentes com pós-graduação | bolsa vinculada a especialização | N | P | N | edital vigente restrito a estados/DF; pagamento ao docente | N: possível, fora da rede municipal | S20 | excluir — escopo incompatível | a formação é direta, mas o ciclo vigente não oferece via à rede municipal do diagnóstico |
| 49 | `rendimento_magisterio` | `par_novo_par` | C | razão entre rendimento docente e de outros graduados | planejamento de valorização | P | N | P | município define remuneração local, mas PAR não a financia | N | S6–S7 | excluir — escopo incompatível | PAR não é fonte comprovada para salário, carreira ou equiparação remuneratória |
| 50 | `temporarios` | `par_novo_par` | C | proporção de docentes com vínculo temporário | planejamento de gestão | P | N | P | provimento e vínculo são da rede | N | S6–S7 | excluir — escopo incompatível | diagnóstico no PAR não financia concurso nem converte vínculo temporário em efetivo |
| 51 | `temporarios` | `bolsa_mais_professores` | C | proporção de docentes com vínculo temporário | ingresso/permanência por bolsa | N | N | N | edital vigente restrito a estados/DF; bolsa ao docente | N | S20 | excluir — escopo incompatível | bolsa não altera a natureza do vínculo e não é mecanismo municipal no ciclo vigente |
| 52 | `conselho_escolar` | `par_novo_par` | C | escolas com conselho instituído e funcionando | planejamento/gestão democrática | P | N | P | município pode normatizar, mas ação financeira específica não demonstrada | não diretamente | S6–S7 | excluir — contextual | apoio geral à gestão não comprova instituição e funcionamento do órgão colegiado |
| 53 | `conselho_escolar` | `pdde` | C | escolas com conselho instituído e funcionando | repasse à UEx, que pode ter forma de conselho | P | N | P | recurso vai à EEx/UEx; organização local | não necessariamente | S21–S22 | excluir — contextual | UEx e conselho escolar não são conceitos equivalentes; receber PDDE não prova conselho funcionando |
| 54 | `salas_climatizadas` | `par_novo_par` | C | proporção de salas utilizadas climatizadas | aquisição de equipamentos de climatização | P | S | P | município cadastra iniciativa; análise federal | objeto: sim | S6–S7 | **C** | climatização consta expressamente entre os equipamentos apoiáveis no PAR |
| 55 | `salas_climatizadas` | `novo_pac_educacao` | C | proporção de salas utilizadas climatizadas | construção de novas escolas | P | N | P | município propõe em modalidades de obra | apenas incidental | S9–S10 | excluir — escopo incompatível | não há modalidade oficial demonstrada de climatização/retrofit das salas existentes |
| 56 | `salas_climatizadas` | `pdde` | C | proporção de salas utilizadas climatizadas | material permanente e pequenos serviços de infraestrutura | P | S | P | EEx/UEx recebe e prioriza, conforme categoria e saldo | objeto: sim | S21 | **C** | PDDE admite material permanente e pequenos serviços; limitar a equipamento/instalação, sem obra de grande porte |
| 57 | `salas_acessiveis` | `par_novo_par` | C | proporção de salas utilizadas acessíveis | planejamento/indicação de escola acessível | P | P | P | secretaria indica no PAR/SIMEC, mas repasse é PDDE/UEx | não como PAR comprovado | S23 | excluir — base insuficiente | a fonte específica localizada operacionaliza o financiamento pelo PDDE, não pelo PAR |
| 58 | `salas_acessiveis` | `novo_pac_educacao` | C | proporção de salas utilizadas acessíveis | construção de novas escolas | P | N | P | município propõe em seleção | apenas incidental | S9–S10 | excluir — escopo incompatível | acessibilidade obrigatória do projeto não equivale a modalidade de adequação das salas existentes |
| 59 | `salas_acessiveis` | `caminho_escola` | C | proporção de salas utilizadas acessíveis | transporte escolar acessível | P | N | P | município acessa veículos | N | S16 | excluir — escopo incompatível | acessibilidade do veículo não altera acessibilidade física da sala de aula |
| 60 | `salas_acessiveis` | `pdde` | C | proporção de salas utilizadas acessíveis | adequações arquitetônicas e mobiliário acessível | P | S | P | secretaria indica; UEx planeja e recebe | objeto: sim | S23 | **C** | Escola Acessível financia diretamente rampas, portas, sanitários, sinalização e mobiliário acessível |

## 5. Allowlist final de relações específicas

Somente as relações abaixo podem seguir para implementação como cruzamentos específicos. Todas são classe C.

| # | Indicador × mecanismo | Ação publicável | Condição obrigatória no texto |
|---:|---|---|---|
| 1 | `creche × par_novo_par` | obras/equipamentos para ampliar a oferta pública de educação infantil | depende de iniciativa, análise e orçamento |
| 2 | `creche × novo_pac_educacao` | construção de creches/escolas de educação infantil | somente em seleção aplicável; não afirmar chamada aberta |
| 3 | `creche × pnate` | transporte de estudantes públicos rurais elegíveis | recorte rural e público obrigatório |
| 4 | `creche × caminho_escola` | veículos para acesso diário rural/ribeirinho | depende da via de aquisição/assistência |
| 5 | `pre_escola × par_novo_par` | obras/equipamentos para ampliar a pré-escola pública | depende de iniciativa, análise e orçamento |
| 6 | `pre_escola × novo_pac_educacao` | construção de unidades de educação infantil | somente em seleção aplicável |
| 7 | `pre_escola × pnate` | transporte de estudantes públicos rurais elegíveis | recorte rural e público obrigatório |
| 8 | `pre_escola × caminho_escola` | veículos para acesso diário rural/ribeirinho | depende da via de aquisição/assistência |
| 9 | `basico_6_17 × par_novo_par` | infraestrutura/equipamentos para ampliar oferta pública | especificar a iniciativa; não prometer atendimento |
| 10 | `basico_6_17 × pnate` | custeio suplementar do transporte público rural | recorte rural obrigatório |
| 11 | `basico_6_17 × caminho_escola` | aquisição de veículos de transporte escolar | recorte rural/ribeirinho e via de acesso obrigatórios |
| 12 | `basico_6_17 × peate_rs` | transporte de alunos da rede estadual residentes no meio rural | declarar rede estadual, ruralidade e convênio municipal |
| 13 | `basico_integral × par_novo_par` | obras/intervenções ligadas a vagas integrais | seleção/iniciativa aplicável; não afirmar vigência de janela |
| 14 | `basico_integral × novo_pac_educacao` | construção de escolas para tempo integral | seleção pública e proposta municipal |
| 15 | `basico_integral × escola_tempo_integral` | criação, manutenção e qualificação de matrículas integrais | adesão, pactuação e comprovação das matrículas |
| 16 | `basico_integral × pnae` | alimentação de estudantes em jornada integral | uso exclusivo em alimentação; base no Censo Escolar |
| 17 | `escolas_integral × par_novo_par` | obras/intervenções em unidades com vagas integrais | seleção/iniciativa aplicável |
| 18 | `escolas_integral × novo_pac_educacao` | novas escolas destinadas ao funcionamento integral | seleção pública e proposta municipal |
| 19 | `escolas_integral × escola_tempo_integral` | matrículas integrais pactuadas nas unidades da rede | adesão e execução da política local |
| 20 | `escolas_integral × pnae` | alimentação necessária à operação da jornada integral | não dizer que o PNAE cria a escola integral |
| 21 | `adequacao_ai × parfor` | licenciatura/formação pedagógica adequada à atuação | benefício formativo ao docente; depende de oferta/seleção |
| 22 | `adequacao_af × parfor` | licenciatura correspondente à área de docência | benefício formativo ao docente; depende de oferta/seleção |
| 23 | `pos_graduacao × proeb_capes` | mestrado profissional de docentes da rede pública | bolsa/fomento vinculado ao curso e ao docente, não receita municipal |
| 24 | `salas_climatizadas × par_novo_par` | aquisição de equipamentos de climatização | iniciativa, especificação, análise e orçamento |
| 25 | `salas_climatizadas × pdde` | equipamento permanente e pequena instalação | verificar categoria, saldo, prioridade da UEx/EEx e vedação a obra grande |
| 26 | `salas_acessiveis × pdde` | adequações arquitetônicas e mobiliário acessível | Escola Acessível, indicação/adesão e repasse à UEx |

### 5.1 Escopo consolidado da allowlist

- **10 indicadores:** `creche`, `pre_escola`, `basico_6_17`, `basico_integral`, `escolas_integral`, `adequacao_ai`, `adequacao_af`, `pos_graduacao`, `salas_climatizadas`, `salas_acessiveis`.
- **10 mecanismos específicos:** `par_novo_par`, `novo_pac_educacao`, `pnate`, `caminho_escola`, `peate_rs`, `escola_tempo_integral`, `pnae`, `parfor`, `proeb_capes`, `pdde`.
- **26 relações C; 0 relações B.**

## 6. Relações gerais D

Os itens abaixo pertencem ao panorama financeiro municipal e não devem ser cruzados com uma lacuna isolada.

| Mecanismo | Texto público aprovado | Campos municipais | Natureza e ano | Local recomendado | Regra de não repetição |
|---|---|---|---|---|---|
| `fundeb_vaaf` — Fundeb e VAAF | “A previsão oficial do Fundeb do município para 2026 é [valor]. A situação VAAF nominal consta como [status].” | `amounts.fundebTotalAnnualForecast`; `programStatuses.fundebVaaf.status` | previsão e status oficiais, 2026 | Panorama financeiro; uma síntese única no resumo financeiro | não repetir em cartões de indicadores nem atribuir o total a uma lacuna |
| `fundeb_vaat` — complementação VAAT | “Para 2026, o município consta como [status] na complementação-VAAT, com previsão oficial de [valor, se houver].” | `amounts.fundebVaatAnnualForecast`; `programStatuses.fundebVaat.status`; `programStatuses.fundebVaat.calculationStatus` | previsão/status oficiais, 2026; habilitação para cálculo não é benefício | Panorama financeiro; uma síntese única no resumo financeiro | não inferir benefício a partir de indicador e não somar novamente ao total do Fundeb |
| `salario_educacao_qsem` — quota municipal | “A quota municipal do Salário-Educação foi de [valor] em 2024; a estimativa oficial de 2026 é [valor].” | `amounts.qseDistributedClosedYear`; `amounts.qseOfficialEstimateCurrentYear`; `qse.enrollmentsClosedYear`; `qse.distributionCoefficientClosedYear`; `qse.distributionCoefficientCurrentYear` | realizado confirmado de 2024 e estimativa de 2026, sempre separados | Panorama financeiro; expansão metodológica da QSE | mostrar cada exercício uma vez e não apresentar a quota como reservada a indicador específico |
| `fundeb_vaar` — complementação VAAR | “Para 2026, o município consta como [status] na complementação-VAAR, com previsão oficial de [valor, se houver]. Os indicadores deste diagnóstico não comprovam essa condição.” | `amounts.fundebVaarAnnualForecast`; `programStatuses.fundebVaar.status` | previsão/status oficiais, 2026 | somente Panorama/resumo financeiro; nunca no detalhe do indicador | não repetir nos cinco indicadores excluídos e não somar novamente ao total do Fundeb |

Resultado consolidado: **14 mecanismos publicáveis no diagnóstico**, sendo dez em relações específicas C e quatro somente no panorama geral D.

## 7. Textos públicos finais

### 7.1 Textos curtos por mecanismo mantido

| Mecanismo | Texto público final |
|---|---|
| PAR/Novo PAR | “O PAR pode apoiar **[construção/ampliação de unidade, obra para tempo integral ou equipamento de climatização]** relacionada a este resultado. A iniciativa depende de cadastro, análise técnica e orçamento.” |
| Novo PAC Educação | “O Novo PAC pode apoiar **a construção de unidade de educação infantil ou escola destinada ao tempo integral** relacionada a este resultado. É necessário haver seleção aplicável e proposta selecionada.” |
| PNATE | “O PNATE pode apoiar **o custeio do transporte de estudantes da educação pública residentes em área rural** relacionado a este resultado.” |
| Caminho da Escola | “O Caminho da Escola pode apoiar **a aquisição de veículos para o transporte diário de estudantes, prioritariamente rurais ou ribeirinhos**, relacionada ao acesso escolar.” |
| PEATE/RS | “O PEATE/RS pode apoiar **o transporte de estudantes da rede estadual residentes no meio rural**, executado pelo município habilitado em regime de colaboração.” |
| Escola em Tempo Integral | “O Programa Escola em Tempo Integral pode apoiar **a criação, manutenção e qualificação de matrículas em jornada integral** pactuadas pela rede.” |
| PNAE | “O PNAE pode apoiar **a alimentação dos estudantes em jornada integral**, com atendimento calculado pelas matrículas do Censo Escolar.” |
| PARFOR | “O PARFOR pode apoiar **a licenciatura correspondente à área em que o professor da rede pública atua**, contribuindo para a adequação da formação docente.” |
| ProEB/CAPES | “O ProEB pode apoiar **a pós-graduação stricto sensu de professores em exercício na rede pública**, por cursos e bolsas vinculados às regras da CAPES.” |
| PDDE | “O PDDE pode apoiar **equipamento/pequena instalação de climatização** ou, no Escola Acessível, **adequações arquitetônicas e mobiliário acessível** na escola beneficiária.” |

### 7.2 Relação C — ação diretamente apoiada

> **[Mecanismo] pode apoiar [ação específica] diretamente relacionada a [objeto do indicador].** O atendimento depende de [adesão/seleção/iniciativa/análise], regras do ciclo e disponibilidade aplicável. Esta relação não confirma elegibilidade, chamada aberta, repasse nem resultado no indicador.

### 7.3 Transporte com população restrita

> Para este indicador amplo, o apoio se limita aos **estudantes da educação pública residentes em área rural** [e, no PEATE/RS, aos estudantes da rede estadual]. O programa não cobre automaticamente toda a população medida.

### 7.4 Formação com benefício à pessoa

> O programa apoia a formação do docente participante; **não constitui receita livre do município**. Oferta, seleção, matrícula, permanência e conclusão devem ser verificadas nas regras vigentes.

### 7.5 Seleção ou ação sem janela confirmada

> A modalidade oficial demonstra que a ação pode ser apoiada, mas **não comprova seleção aberta nem atendimento do município**. Consulte o edital/manual e o resultado do ciclo vigente.

### 7.6 Panorama D — situação financeira geral

> A situação de **[mecanismo]** do município em **[exercício]** é **[status/valor oficial]**. O dado pertence ao panorama financeiro geral e não decorre, isoladamente, do resultado de nenhum indicador do diagnóstico.

### 7.7 VAAR — texto obrigatório

> A complementação-VAAR depende de condicionalidades legais e de indicadores oficiais calculados pelo Inep. Os indicadores deste diagnóstico não reproduzem essa metodologia e não comprovam benefício. A evidência válida é a consulta nominal oficial do exercício.

### 7.8 Formulações proibidas

- “O município tem direito ao recurso porque o indicador está abaixo da meta.”
- “Melhorar este indicador libera VAAR.”
- “Há verba disponível” sem valor nominal, exercício e fonte oficial.
- “Inscrições abertas” quando a fonte apenas descreve seleção passada ou modalidade permanente.
- “O programa financia o indicador”; programas financiam ações, não percentuais.
- “PAR financiará acessibilidade” quando a ação específica identificada é repassada pelo PDDE/Escola Acessível.

## 8. Exclusões finais

### 8.1 Contextuais — 13

- `creche × pnae`; `pre_escola × pnae`; `basico_6_17 × pnae` — alimentação dos já matriculados não financia diretamente cobertura/frequência populacional (S13–S14).
- `basico_integral × pnate`; `escolas_integral × pnate` — transporte rural não cria jornada ou escola integral (S15).
- `basico_integral × caminho_escola`; `escolas_integral × caminho_escola` — veículo escolar não é ação específica de tempo integral (S16).
- `idade_regular_quinto × par_novo_par`; `idade_regular_nono × par_novo_par` — ações gerais do PAR não alteram diretamente a conclusão em idade regular (S6–S7).
- `idade_regular_quinto × pnae`; `idade_regular_nono × pnae` — alimentação tem nexo indireto e multicausal com conclusão em idade regular (S13–S14).
- `conselho_escolar × par_novo_par` — apoio geral à gestão não prova conselho instituído e funcionando (S6–S7).
- `conselho_escolar × pdde` — UEx pode assumir diversas formas e não equivale necessariamente a conselho escolar (S21–S22).

Esses mecanismos podem apoiar permanência, gestão ou funcionamento geral, mas o caminho até o objeto medido é indireto ou multicausal.

### 8.2 Escopo, população ou governança incompatível — 11

- `creche × peate_rs`; `pre_escola × peate_rs` — PEATE/RS atende estudantes da rede estadual rural, não a oferta municipal de educação infantil (S17).
- `adequacao_ai × bolsa_mais_professores`; `adequacao_af × bolsa_mais_professores` — edital vigente restrito a estados/DF e especialização não corrige formação inicial inadequada (S20).
- `pos_graduacao × bolsa_mais_professores` — curso é aderente à pós-graduação, mas não há via municipal no ciclo vigente; o benefício é pessoal (S20).
- `temporarios × bolsa_mais_professores` — bolsa não altera vínculo funcional e o edital vigente não é municipal (S20).
- `rendimento_magisterio × par_novo_par` — PAR não é fonte de remuneração/equiparação salarial (S6–S7).
- `temporarios × par_novo_par` — PAR não financia concurso nem conversão de vínculo (S6–S7).
- `salas_climatizadas × novo_pac_educacao` — modalidades comprovadas são de obra, não de retrofit de climatização (S9–S10).
- `salas_acessiveis × novo_pac_educacao` — acessibilidade do novo projeto não é programa de adequação das salas existentes (S9–S10).
- `salas_acessiveis × caminho_escola` — o objeto é veículo/transporte, não a acessibilidade física da sala (S16).

### 8.3 Base oficial insuficiente para o nexo — 10

- Os cinco cruzamentos VAAR: `creche`, `pre_escola`, `basico_6_17`, `idade_regular_quinto` e `idade_regular_nono` × `fundeb_vaar` — nenhuma fórmula local equivale aos componentes oficiais de atendimento/aprendizagem (S1–S5).
- `eja_integrada_educacao_profissional_percentual × par_novo_par` — não foi comprovada iniciativa vigente específica de integração EJA–EPT (S6–S7).
- `adequacao_ai × par_novo_par`; `adequacao_af × par_novo_par` — formação genérica não comprova licenciatura adequada por etapa/área (S6, S18).
- `pos_graduacao × par_novo_par` — não foi comprovada oferta de pós-graduação financiada pelo PAR (S6–S7).
- `salas_acessiveis × par_novo_par` — o PAR/SIMEC indica escolas, mas a fonte específica atribui o repasse ao PDDE/Escola Acessível (S23).

Nos cinco últimos casos, o mecanismo amplo ou o uso do PAR/SIMEC não basta para atribuir ao PAR uma ação financeira específica. A relação poderá ser reavaliada se surgir norma, iniciativa ou edital oficial que identifique inequivocamente objeto, público, responsável financeiro e via de acesso.

## 9. Fontes oficiais

Todas as fontes externas foram consultadas em 20 de julho de 2026. Notícias oficiais foram usadas apenas quando descrevem objeto, público ou operação institucional; elegibilidade e regras prevalecem nas leis, resoluções, notas técnicas, manuais e editais.

| Código | Órgão | Documento ou página | Período de referência | URL oficial | Relação sustentada |
|---|---|---|---|---|---|
| S1 | Presidência da República | Lei nº 14.113/2020 — Fundeb | vigente; regra estrutural | [Planalto](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14113.htm) | condicionalidades e indicadores do VAAR |
| S2 | Comissão Intergovernamental/FNDE | Resolução CIF nº 17/2025 | exercício 2026 | [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/legislacao/2025/resolucao-cif-no-17.pdf/%40%40download/file) | metodologia VAAR aprovada para 2026 |
| S3 | Inep | Nota Técnica nº 34/2025 | dados/períodos definidos para 2026 | [Inep](https://download.inep.gov.br/fundeb/2026/nota_tecnica_34_atendimento_e_aprendizagem_2025.pdf) | fórmulas, populações, períodos e componentes VAAR |
| S4 | Inep | Indicadores da complementação-VAAR | base vigente consultada em 2026 | [Inep](https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/fundeb/bases-de-dados/indicadores-da-complementacao-vaar) | bases e metodologia oficial |
| S5 | FNDE | Estimativa VAAR por ente e indicador | 2026 | [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026-estima/estimativa-da-complementacao-vaar-para-cada-ente-federado-por-indicador-i.pdf) | evidência nominal/financeira do exercício |
| S6 | FNDE | Plano de Ações Articuladas | página vigente consultada em 2026 | [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/par) | finalidade, dimensões e objetos apoiáveis do PAR |
| S7 | FNDE/Gov.br | Solicitar infraestrutura educacional | serviço atualizado em 2026 | [Gov.br](https://www.gov.br/pt-br/servicos/solicitar-acoes-de-infraestrutura-educacional-obras-mobiliario-e-equipamentos) | via de acesso e natureza condicionada do PAR/Novo PAR |
| S8 | FNDE | Proinfância | programa vigente consultado em 2026 | [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/proinfancia/proinfancia-home/) | obras e equipamentos para creches/pré-escolas via PAR |
| S9 | Casa Civil | Manual Educação Novo PAC Seleções | seleção 2025 | [Casa Civil](https://www.gov.br/casacivil/pt-br/novopac/selecoes2025/eixos/educacao-ciencia-e-tecnologia/arquivos/novopacmanualeducaoselecoes2025-27-02-25-trava.pdf) | modalidades e critérios de educação infantil/tempo integral |
| S10 | Casa Civil | Escolas em tempo integral no Novo PAC | seleções 2023–2025 | [Casa Civil](https://www.gov.br/casacivil/pt-br/novopac/selecoes/eixos/educacao-ciencia-e-tecnologia/escolas-em-tempo-integral/) | objeto, proponentes e critérios da modalidade |
| S11 | FNDE | Resolução CD/FNDE nº 25/2023 — PAR-Portfólio | ciclo instituído em 2023 | [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/legislacao/resolucoes/2023/resolucao-no-25-de-24-de-novembro-de-2023-resolucao-no-25-de-24-de-novembro-de-2023-dou-imprensa-nacional.pdf) | obras/intervenções para escolas e vagas em tempo integral |
| S12 | Presidência/FNDE | Lei nº 14.640/2023 e página do Programa Escola em Tempo Integral | vigente; página atualizada em 2026 | [Planalto](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14640.htm); [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/programas_suplementares/educacao-basica/educacao-basica) | fomento de matrículas integrais, adesão e repasse |
| S13 | FNDE | PNAE | valores/regras consultados em 2026 | [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae) | público, transferência e valor específico de tempo integral |
| S14 | FNDE | Resolução CD/FNDE nº 4/2026 — PNAE | 2026 | [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/legislacao/resolucoes/2026/resolucao-cd_fnde-no-4-de-26-de-fevereiro-de-2026.pdf/%40%40download/file) | regras vigentes de alimentação escolar |
| S15 | FNDE | PNATE | programa vigente consultado em 2026 | [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnate) | transporte da educação básica pública rural |
| S16 | FNDE | Caminho da Escola | programa vigente consultado em 2026 | [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/caminho-da-escola) | objeto, público prioritário e vias de aquisição |
| S17 | Seduc/RS | Programa PEATE/RS | programa vigente consultado em 2026 | [Seduc/RS](https://www.educacao.rs.gov.br/programa-estadual-de-apoio-ao-transporte-escolar-peate) | estudantes da rede estadual rural e convênio municipal |
| S18 | CAPES | PARFOR | regras vigentes consultadas em 2026 | [CAPES](https://www.gov.br/capes/pt-br/acesso-a-informacao/acoes-e-programas/educacao-basica/parfor/parfor) | adequação da formação inicial por licenciatura na área de atuação |
| S19 | CAPES | ProEB | página/regras atualizadas em 2026 | [CAPES](https://www.gov.br/capes/pt-br/acesso-a-informacao/acoes-e-programas/articulacao-e-inovacao-em-educacao-aberta/programa-de-pos-graduacao-stricto-sensu-para-qualificacao-de-professores-da-rede-publica-de-educacao-basica-proeb) | mestrado profissional, bolsas e público docente |
| S20 | MEC/CAPES | Bolsa Mais Professores e Edital nº 22/2025 | edital 2025, execução 2026 | [MEC](https://www.gov.br/mec/pt-br/mais-professores/bolsa-mais-professores); [MEC Normas](https://mecnormas.mec.gov.br/pesquisa/detalhar/8183) | benefício, especialização e adesão restrita a estados/DF |
| S21 | FNDE | Usos dos recursos do PDDE | regras consultadas em 2026 | [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pdde/sobre-recursos) | material permanente, pequenos reparos, beneficiário e vedações |
| S22 | FNDE | PDDE | operação vigente consultada em 2026 | [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pdde) | EEx/UEx, público e forma de operação |
| S23 | FNDE/MEC | Programa Escola Acessível e serviço oficial | regras vigentes consultadas em 2026 | [FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pdde/conta-pdde-estrutura-1/programa-escola-acessivel); [Gov.br](https://www.gov.br/pt-br/servicos/obter-recursos-para-obras-de-acessibilidade-em-escolas-publicas) | ações financiáveis, indicação no PAR/SIMEC e repasse PDDE à UEx |
| S24 | Presidência da República | Lei nº 15.388/2026 — PNE | 2026–2035/2036, conforme metas | [Planalto](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15388.htm) | objetivos e metas legais dos indicadores locais |

### 9.1 Bases internas consultadas, sem alteração

- `docs/PLANO_DIRETRIZ_PRODUTO_APP_PNE.md`
- `docs/DIAGNOSTICO_FINANCIAMENTO_INVENTARIO_PUBLICAVEL_V1.md`
- `docs/DIAGNOSTICO_MUNICIPAL_RELACOES_INDICADORES.md`
- `docs/DIAGNOSTICO_MUNICIPAL_IMPLEMENTACAO_RS_FINANCIAMENTO.md`
- `docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_FONTES.md`
- `docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_METODOLOGIA.md`
- `src/data/diagnostic/indicatorCatalog.json`
- `src/data/diagnostic/financingPrograms.json`
- `src/data/diagnostic/indicatorFinancingMatrix.json`
- `data_pipeline/src/municipal_diagnostic.py`
- `data_pipeline/src/municipal_finance.py`

## 10. Recomendação objetiva para DF1

DF1 deve adotar esta allowlist como lista fechada, sem ampliar relações por herança do catálogo amplo.

1. Remover as cinco relações VAAR da camada específica e apresentar `fundeb_vaar` somente em D, com situação/previsão nominal oficial.
2. Materializar exatamente as 26 relações C da seção 5; qualquer nova relação exige nova validação documental.
3. Manter nos textos e contratos as restrições de população rural, rede estadual, beneficiário docente, EEx/UEx, seleção, adesão e ausência de garantia.
4. Não transformar mecanismo sem janela confirmada em oportunidade aberta.
5. Não usar ausência de valor municipal como prova de ausência do programa, nem presença do programa como prova de recurso disponível.
6. Registrar separadamente no DF1 as 34 exclusões, para impedir reintrodução automática por mapeamentos amplos.

### 10.1 Estrutura recomendada do catálogo público

Cada entrada específica deve conter somente: `indicatorId`, `programId`, classe C, ação concreta, texto público, recorte de etapa/rede/público, via de acesso, condicionantes, fontes oficiais e data de verificação. A allowlist deve ser positiva e fechada; ausência nela significa não publicar. Relações excluídas ficam apenas neste controle documental e não geram mensagem de interface.

### 10.2 Campos municipais necessários

- Para as 26 relações C, **nenhum valor financeiro municipal novo é necessário**: a publicação descreve a ação oficial e usa o indicador já existente apenas como contexto.
- Para os quatro D, usar exclusivamente os campos existentes listados na seção 6: previsão/status do Fundeb/VAAF, VAAT e VAAR; valores, matrículas e coeficientes da QSE.
- Não criar campo de elegibilidade, disponibilidade, ganho, perda ou valor potencial a partir da relação C.

### 10.3 Informações exclusivas do Panorama financeiro

Fundeb/VAAF, VAAT, Salário-Educação e VAAR — com seus valores, exercícios e status — devem ficar no Panorama/resumo financeiro, uma única vez. Eles não devem ser repetidos no cartão ou detalhe de indicador. As relações C podem aparecer no detalhe educacional apenas como ação possível, sem valor municipal quando o contrato não o possui.

### 10.4 Dados e execução

**Nenhum novo download municipal e nenhuma regeneração dos 497 municípios são necessários para DF1.** A etapa usa os contratos municipais existentes e o catálogo documental validado. Também não requer alteração de fórmula educacional, `decisionSummary` ou comparação com o RS.

**Gate de entrada para DF1:** 26 relações C, 0 B, 4 mecanismos gerais D, 10 indicadores específicos, 10 mecanismos específicos, 14 mecanismos publicáveis no total e 34 exclusões documentadas.
