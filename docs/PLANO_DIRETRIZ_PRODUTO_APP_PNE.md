# APP PNE — Diretriz de Produto e Plano de Realinhamento

**Status:** diretriz obrigatória para as próximas tarefas do Codex  
**Versão:** 1.1 — inclui viabilidade, aquisição e cobertura municipal dos dados  
**Data:** 20/07/2026  
**Destino recomendado no repositório:** `docs/PLANO_DIRETRIZ_PRODUTO_APP_PNE.md`

---

## 1. Finalidade deste documento

Este documento define a direção de produto do APP PNE e o plano que deve ser seguido para realinhar as interfaces, os textos e as próximas implementações.

Ele deve ser lido antes de qualquer novo prompt enviado ao Codex que altere:

- o Diagnóstico municipal;
- o detalhe de metas ou indicadores;
- as comparações com o Rio Grande do Sul;
- as comparações com municípios semelhantes;
- as relações entre resultados educacionais e financiamento;
- o Panorama financeiro da educação;
- as fontes exibidas ao usuário;
- qualquer nova informação pública da plataforma.

A função deste documento é impedir que o projeto volte a crescer na direção de um painel técnico, contábil ou metodológico. A plataforma deve permanecer centrada na educação do município e na compreensão das metas do PNE.

### 1.1 Regra de precedência

Quando houver conflito entre instruções, o Codex deve respeitar esta ordem:

1. regras legais e metodológicas homologadas nos contratos e documentos técnicos do projeto;
2. esta diretriz de produto para tudo que é mostrado ao usuário;
3. o prompt específico da etapa em execução;
4. preferências locais de componente, estilo ou refatoração.

O prompt de uma etapa não pode contrariar esta diretriz sem uma decisão explícita do responsável pelo produto e uma atualização de versão deste arquivo.

### 1.2 Regra de parada

O Codex deve interromper a implementação e relatar o conflito quando a tarefa exigir uma destas ações:

- inventar um dado, uma regra ou uma relação financeira;
- concluir que um município ganhará ou perderá um recurso sem base oficial documentada;
- transformar ausência em zero;
- recalcular no React algo que pertence ao pipeline;
- mostrar ao usuário termos técnicos proibidos por esta diretriz;
- incluir informação que não esteja diretamente ligada à educação municipal;
- criar score, ranking ou avaliação geral do município;
- alterar silenciosamente uma regra metodológica já homologada.


### 1.3 Regra de viabilidade dos dados municipais

Nenhuma informação planejada deve ser considerada disponível apenas porque:

- existe uma página pública sobre o tema;
- existe um painel de consulta;
- existe dado nacional ou estadual;
- existe uma regra de programa;
- existe dado para alguns municípios;
- existe um arquivo que não tenha chave municipal, período ou formato estável;
- existe uma consulta manual que não possa ser repetida no pipeline.

Antes de entrar no roadmap de implementação pública, cada indicador, comparação, valor financeiro, situação de programa ou relação de financiamento deve ter sua viabilidade comprovada na **Fase D0 — Auditoria de viabilidade e aquisição municipal**.

A comprovação mínima exige:

1. instituição oficial responsável;
2. base, relatório, painel, API ou arquivo exato;
3. endereço oficial de consulta e, quando existir, endereço ou padrão de download;
4. formato de obtenção: API, CSV, XLSX, ODS, FTP, PDF estruturado ou consulta manual;
5. nível geográfico real da informação;
6. chave municipal inequívoca, preferencialmente código IBGE;
7. ano ou período;
8. periodicidade de atualização;
9. cobertura entre os 497 municípios do RS;
10. regra de retificação ou substituição de arquivos;
11. fórmula e componentes necessários, quando o valor não vier pronto;
12. prova de que a informação responde à pergunta pública pretendida;
13. teste de download e processamento reproduzível;
14. decisão explícita sobre o que pode ser publicado.

Uma página de consulta manual pode servir como fonte documental. Ela não é, por si só, uma fonte automatizável para os 497 municípios.

### 1.4 Quatro níveis distintos de informação sobre financiamento

A plataforma deve distinguir internamente quatro níveis. A existência de um nível não autoriza publicar os seguintes.

#### Nível 1 — Regra e finalidade do programa

Permite explicar:

> “Este programa pode apoiar ações para melhorar este resultado.”

Exige regra oficial, finalidade educacional, vigência e fonte. Não exige valor municipal.

#### Nível 2 — Situação nominal do município

Permite informar, quando a lista oficial for completa e inequívoca:

- município contemplado;
- município com previsão;
- município sem previsão em uma lista exaustiva;
- proposta selecionada;
- condição cumprida ou não cumprida, quando publicada oficialmente.

Exige lista nominal, período, chave municipal e semântica clara da ausência de uma linha.

#### Nível 3 — Valor municipal

Permite informar quanto foi:

- previsto;
- distribuído;
- informado pelo município;
- transferido pelo concedente;
- comprometido;
- reconhecido após a entrega;
- pago.

Cada natureza deve permanecer separada. Exige fonte nominal, período, unidade e estágio identificados.

#### Nível 4 — Ganho, perda ou efeito financeiro de um indicador

Só pode ser publicado quando houver:

1. regra oficial vigente;
2. indicador ou condição exatamente associado;
3. direção do efeito;
4. fórmula reproduzível;
5. todos os insumos municipais necessários;
6. valor de referência e período compatíveis;
7. validação no pipeline;
8. memória de cálculo;
9. texto público aprovado.

Sem esses elementos, a plataforma pode falar em influência ou apoio, mas não pode quantificar quanto o município ganhará ou perderá.

### 1.5 Compromisso realista de cobertura

A plataforma não deve prometer publicamente que acompanha todas as metas legais do PNE nem que possui todos os valores de todos os programas, a menos que uma auditoria futura comprove isso.

A promessa correta é:

> **Apresentar os principais resultados municipais ligados às metas do PNE que possuam informação municipal segura, comparações válidas e relações financeiras oficialmente documentadas.**

Na experiência pública:

- não mostrar mensagens sobre dado ausente, bloqueado ou a ser coletado;
- não preencher lacunas com zero;
- não criar cartões vazios;
- não afirmar que a página cobre “todas as metas”;
- mostrar somente as leituras comprovadas para aquele município.

Internamente:

- manter a matriz completa de metas, indicadores e programas;
- registrar o motivo de cada item não publicado;
- medir a cobertura real por município e por pergunta do produto;
- impedir que uma ausência seja interpretada como resultado negativo ou não beneficiário.

### 1.6 Situação conhecida na versão 1.1

Esta tabela orienta a Fase D0 e não substitui a auditoria por item.

| Família de informação | Situação inicial | Consequência para o produto |
|---|---|---|
| Censo Escolar e indicadores derivados de matrículas, escolas, docentes e infraestrutura | Grande parte possui arquivos oficiais e chave municipal ou escolar | Pode formar o núcleo dos indicadores municipais, após validar fórmula, ano, dependência e universo |
| Saeb e Ideb | Há resultados municipais, mas a divulgação depende da edição, participação e critérios da avaliação | Publicar somente onde houver resultado oficial comparável; ausência de resultado não é desempenho zero |
| Indicadores populacionais do Censo Demográfico | Há dados municipais por idade e características em anos censitários | Úteis para linhas de base e recortes, sem transformar o Censo em série anual |
| Estimativas anuais da população total | Há estimativas municipais anuais | Não fornecem automaticamente população municipal anual por idade |
| Projeções anuais por sexo e idade | As projeções oficiais do IBGE são para Brasil e UFs, não para municípios | Qualquer estimativa municipal por idade precisa de método próprio documentado e não pode ser tratada como download oficial municipal |
| Todas as metas legais do PNE | Nem todas possuem indicador municipal direto e atual | A plataforma deve trabalhar com o subconjunto municipal comprovado e não prometer cobertura integral |
| Fundeb previsto, VAAF, VAAT e VAAR | Há arquivos nominais estruturados por ente em publicações oficiais | Pode ser integrado com natureza e ano claramente identificados |
| Salário-Educação | Há consulta e séries de distribuição por município | Pode ser publicado como valor distribuído ou estimado, sem misturar exercícios |
| SIOPE, RREO, DCA e MSC | Existem fontes municipais; algumas já foram homologadas e outras exigem mapeamento contábil | Usar somente os conceitos validados e manter as naturezas contábeis separadas |
| Transferência efetiva do Fundeb | A trilha automatizável e reproduzível ainda não está comprovada no projeto | Não publicar como transferência confirmada até nova homologação |
| PNAE, PNATE, PDDE, PEATE/RS, PAR, Novo PAC, Escola em Tempo Integral e Caminho da Escola | A disponibilidade é heterogênea: consulta manual, grão escola/executor, lista por ciclo ou necessidade de endurecimento | Auditar programa por programa; regra do programa pode ser mostrada antes do valor municipal, mas seleção, recebimento e saldo exigem fonte nominal |

### 1.7 Estados internos obrigatórios de viabilidade

Cada item da matriz D0 deve receber um destes estados:

- `ready`: download municipal estruturado, validado e reproduzível;
- `ready_with_mapping`: fonte reproduzível, mas exige mapeamento homologado antes da publicação;
- `partial`: cobertura, período ou conceito municipal incompleto;
- `manual`: consulta possível, porém sem coleta em lote reproduzível;
- `needs_hardening`: fonte existe, mas formato, atualização ou estabilidade ainda não são confiáveis;
- `blocked`: não há caminho oficial reproduzível suficiente;
- `not_municipal`: a fonte não oferece o nível municipal necessário;
- `not_current`: existe apenas série desatualizada para a pergunta pretendida;
- `not_applicable`: a informação não se aplica ao item.

Somente `ready` pode ser publicado diretamente. `ready_with_mapping` exige a conclusão e homologação do mapeamento. Os demais estados permanecem internos.

---

## 2. Direção central do produto

> **O APP PNE é uma plataforma sobre a educação do município.**
>
> Ela deve permitir que qualquer gestor compreenda, em linguagem simples, como o município está nas metas do PNE, como se compara ao Rio Grande do Sul e a municípios semelhantes, e quais recursos da educação podem ser influenciados pelos resultados ou apoiar a melhoria desses resultados.

A plataforma não é:

- um portal de contabilidade pública;
- um sistema de auditoria;
- uma documentação do pipeline;
- um painel de qualidade dos dados;
- um sistema de gestão fiscal geral;
- um ranking de municípios;
- uma avaliação geral de prefeitos, secretarias ou redes;
- um simulador de recebimento garantido de recursos.

A complexidade técnica continua necessária internamente. O usuário, porém, deve ver apenas informações claras, seguras e úteis.

### 2.1 Promessa ao usuário

Em poucos minutos, o usuário deve conseguir responder:

1. Em quais metas o município precisa avançar?
2. Em quais metas o município apresenta bons resultados?
3. Como o município está em relação ao resultado do RS?
4. Como está em relação a municípios com oferta educacional de tamanho semelhante?
5. O resultado está melhorando, piorando ou se mantendo?
6. A prefeitura consegue agir diretamente ou depende também do Estado ou da União?
7. Quais recursos ou programas da educação estão relacionados a essas metas?
8. O resultado pode influenciar o acesso ou o valor de algum recurso?
9. Quais programas podem ajudar a financiar a melhoria?
10. Qual é a fonte e o ano de cada informação?

Se uma nova funcionalidade não ajuda a responder pelo menos uma dessas perguntas, ela não deve entrar na experiência principal.

### 2.2 Público principal

A linguagem deve funcionar para:

- secretários municipais de Educação;
- equipes técnicas das secretarias;
- prefeitos e gestores municipais;
- conselhos de Educação;
- dirigentes escolares;
- cidadãos interessados na educação local.

Não se deve presumir que o usuário conheça legislação educacional, contabilidade pública, estatística, ciência de dados ou a arquitetura da plataforma.

---

## 3. Filtro obrigatório de escopo: “somente educação”

Toda nova informação deve passar pelo teste abaixo:

> **Esta informação ajuda o usuário a entender uma meta do PNE, um resultado educacional, uma comparação educacional, uma ação para melhorar a educação ou um recurso destinado à educação?**

### 3.1 Informações que entram no escopo principal

- metas e indicadores educacionais vinculados ao PNE usado pela plataforma;
- atendimento, acesso, permanência e trajetória escolar;
- aprendizagem e desempenho;
- educação integral;
- educação profissional;
- formação e condições dos profissionais da educação;
- gestão democrática e infraestrutura escolar, quando representadas por indicadores homologados;
- desigualdades educacionais, somente quando houver base segura para publicação;
- comparação com o RS;
- comparação com municípios com oferta de porte semelhante;
- evolução histórica do resultado;
- responsabilidade municipal e necessidade de parceria com outras redes;
- Fundeb, Salário-Educação e outros recursos destinados à educação;
- aplicação de recursos em educação;
- programas que possam financiar ações educacionais;
- regras oficiais que liguem resultados ou condições educacionais ao recebimento de recursos;
- fontes oficiais e anos de referência.

### 3.2 Informações que só entram quando estiverem diretamente ligadas à educação

- despesas correntes e de capital;
- pessoal, custeio e investimentos;
- projetos;
- custos;
- saldos confirmados;
- capacidade de execução;
- dados socioeconômicos, fiscais ou territoriais usados exclusivamente para contextualizar comparações educacionais;
- informações de órgãos e fontes orçamentárias usadas exclusivamente para explicar gastos em educação.

Essas informações devem aparecer como apoio à compreensão da educação, nunca como um diagnóstico fiscal geral do município.

### 3.3 Informações que não entram na experiência principal

- situação fiscal geral do município;
- capacidade de endividamento;
- arrecadação sem relação com educação;
- obras e projetos sem relação com educação;
- desempenho administrativo geral;
- ranking da gestão municipal;
- índice geral de qualidade da prefeitura;
- saúde financeira geral;
- detalhes técnicos do pipeline, do contrato, do parser ou dos arquivos;
- estados de cobertura, reconciliação ou revisão de fontes;
- mensagens sobre dados que serão coletados futuramente.

---

## 4. Princípios obrigatórios da experiência pública

### 4.1 Educação primeiro; financiamento como apoio

A meta ou o resultado educacional deve ser sempre o ponto de partida.

A ordem narrativa correta é:

1. situação educacional;
2. comparação;
3. evolução;
4. quem pode agir;
5. recurso que pode ser influenciado ou que pode apoiar a melhoria;
6. fonte.

O Panorama financeiro é complementar ao Diagnóstico municipal. Ele não deve se tornar o centro conceitual da plataforma.

### 4.2 Mostrar o resultado, não a engrenagem

O sistema pode usar internamente:

- validade metodológica;
- qualidade da evidência;
- reconciliação;
- tolerâncias;
- gates;
- motivos estruturados de ausência;
- fórmulas;
- contratos;
- versões;
- hashes;
- parser;
- cobertura.

Nada disso deve dominar ou, em regra, aparecer na interface pública.

A diretriz é:

> **A complexidade decide internamente o que é seguro publicar. O usuário vê somente a informação segura.**

### 4.3 Linguagem simples

Cada texto deve:

- apresentar uma ideia por frase;
- usar voz direta;
- usar verbos comuns;
- evitar siglas desnecessárias;
- evitar nomes de estruturas internas;
- explicar o que o número significa;
- indicar o ano;
- evitar notas longas antes da informação principal.

Preferir:

- “O resultado melhorou nos últimos anos.”
- “O município está acima do resultado do RS.”
- “A prefeitura pode atuar diretamente.”
- “A melhoria depende também do Estado ou da União.”
- “Este programa pode financiar ações para ampliar a jornada escolar.”

Evitar:

- “Trajetória favorável com evidência média.”
- “Governabilidade compartilhada.”
- “Percentil direcional 78.”
- “Indicador bloqueado por incompatibilidade metodológica.”
- “Fonte em revisão após alteração de hash.”

### 4.4 Nenhuma mensagem pública sobre ausência técnica

A interface pública não deve mostrar textos como:

- “Não temos essa informação.”
- “Dado indisponível.”
- “Fonte ausente.”
- “Informação será coletada.”
- “Indicador bloqueado.”
- “Cobertura insuficiente.”
- “Aguardando homologação.”
- “Não foi possível reconciliar.”

Quando não existir um valor seguro para publicação:

- não transformar em zero;
- não inventar uma conclusão;
- não mostrar card vazio;
- não mostrar contador de ausências;
- não abrir uma seção apenas para explicar a falta;
- omitir o valor, o item ou a seção correspondente;
- não incluir a fonte no rodapé se nenhuma informação dessa fonte foi usada na página.

Uma ausência continua preservada e explicada internamente no contrato e nos documentos técnicos.

### 4.5 Não prometer ganho ou perda sem regra oficial

A plataforma deve distinguir com clareza:

- resultado que pode influenciar um recurso;
- resultado que ajuda a cumprir uma condição;
- programa que pode financiar uma melhoria;
- fonte geral da educação que não depende diretamente daquele indicador.

Nunca usar “o município ganhará” ou “o município perderá” quando a regra não for determinística, atual e documentada.

### 4.6 Fontes no final da página

Toda página deve terminar com **“Fontes das informações”**.

A seção deve mostrar apenas:

- nome da instituição;
- nome simples da base, relatório ou programa;
- ano ou período;
- link para a fonte oficial, quando existir.

Não mostrar no rodapé público:

- hash;
- versão do parser;
- versão de layout;
- schema;
- contrato;
- dataVersion;
- metodologiaVersion;
- cobertura técnica;
- detalhes de reconciliação.

---

## 5. Regras técnicas e metodológicas que permanecem obrigatórias

O realinhamento de linguagem não permite enfraquecer a qualidade dos dados.

### 5.1 Responsabilidades do pipeline

O pipeline continua responsável por:

- fórmulas;
- validade legal e metodológica;
- valores e percentuais;
- comparação com referências;
- razão de somas usada na referência do RS;
- direção favorável dos indicadores;
- trajetória;
- classificação interna;
- relação entre indicador e financiamento;
- gates de publicação;
- preservação de valores nulos;
- razões estruturadas de ausência;
- reconciliação de fontes financeiras;
- prevenção de dupla contagem.

### 5.2 Responsabilidades do React

O React pode:

- ordenar e apresentar as seções já definidas pelo contrato;
- aplicar textos públicos aprovados;
- formatar moeda, percentual e ano;
- omitir elementos marcados como não publicáveis;
- montar referências para a seção de fontes;
- controlar disclosures e navegação;
- preservar acessibilidade e responsividade.

O React não pode:

- recalcular resultados;
- decidir validade legal;
- calcular referência estadual;
- reconciliar fontes;
- inferir elegibilidade;
- simular valores ganhos ou perdidos;
- criar ranking;
- converter ausência em zero;
- classificar um indicador como bom ou ruim por conta própria.

### 5.3 Regras canônicas preservadas

- Ausência nunca vira zero.
- Nulos continuam com razão estruturada internamente.
- Valores acima de 100% dos indicadores de atendimento permanecem integrais.
- Matrículas localizadas não são substituídas por matrículas de residentes.
- A referência do RS usa razão de somas, e não média simples dos percentuais municipais.
- As direções `at_least` e `at_most` continuam respeitadas internamente.
- Resultado sem segurança suficiente não recebe posição ordinal.
- Itens classificados internamente para investigação não alimentam financiamento.
- Programa relacionado não prova elegibilidade, seleção, recebimento ou saldo.
- Previsão não é recebimento.
- Transferência não é saldo.
- Valor declarado não é transferência confirmada pelo concedente.
- DCA não é receita.
- A função Educação na DCA não é a mesma coisa que aplicação constitucional em educação.
- Fundeb total não pode ser somado novamente a VAAF, VAAT ou VAAR.
- Nenhum `priorityScore`, ranking ou avaliação geral deve ser publicado.
- Shell, largura e identidade visual SESI-RS devem ser preservados.

### 5.4 Regra para resultados acima de 100%

O valor integral continua visível.

Quando um resultado de atendimento ultrapassar 100%, usar apenas uma explicação simples e contextual:

> “O resultado pode passar de 100% porque as escolas do município também recebem estudantes de outros municípios.”

Não usar palavras como erro, anomalia, cap, numerador, denominador ou mobilidade pendular na experiência principal.

---

## 6. Vocabulário público obrigatório

### 6.1 Siglas

Podem permanecer na experiência principal, por serem centrais e amplamente reconhecíveis no contexto da plataforma:

- PNE;
- RS;
- Fundeb.

Siglas menos conhecidas devem ser substituídas por nomes simples na interface principal.

Exemplos:

- `QSE` → **Salário-Educação**;
- `MDE` → **recursos aplicados em educação**;
- `DCA` → **gastos registrados em Educação**;
- `SIOPE` e `RREO` → nomes completos apenas na seção de fontes;
- `VAAR` → **complementação do Fundeb ligada a resultados e condições de gestão**, podendo apresentar “VAAR” como informação secundária após a explicação.

### 6.2 Tradução de termos internos para linguagem pública

| Termo interno ou atual | Texto público preferencial | Regra |
|---|---|---|
| Diagnóstico municipal | Metas do PNE no município | Pode permanecer “Diagnóstico” apenas em navegação secundária |
| Síntese para decisão | Resumo das metas | Não expor o nome do contrato |
| Ação municipal | O município pode agir | Usar como frase, não como categoria técnica |
| Pactuação | Depende de parceria | Informar Estado ou União quando o contrato permitir |
| Governabilidade compartilhada | A melhoria depende também de outras redes | Não usar “governabilidade” |
| Investigação | Não exibir como categoria pública | O item fica fora dos destaques e do financiamento |
| Monitor | Acompanhar | Usar frase simples |
| Preserve | Bom resultado para manter | Não usar o nome interno |
| Evidência alta/média/baixa | Não exibir | A qualidade controla a publicação internamente |
| Evidência insuficiente | Não exibir | O item não recebe conclusão pública |
| Referência RS | Resultado do RS | Mostrar ano |
| Diferença favorável | Acima do RS | Mostrar valor em pontos percentuais quando aplicável |
| Diferença desfavorável | Abaixo do RS | Mostrar valor em pontos percentuais quando aplicável |
| Percentil | Posição entre os municípios | Preferir “entre os 25% com melhores resultados”, quando seguro |
| Quartil | Faixa de posição | Não usar a palavra “quartil” |
| Coorte | Municípios com oferta semelhante | Não chamar de socioeconomicamente semelhantes |
| Benchmark | Comparação | Não usar o termo em inglês |
| Gap/lacuna | Quanto falta para a referência | Somente quando a comparação for válida |
| Trajetória observada | Evolução do resultado | Usar melhorou, caiu ou ficou estável |
| Ritmo necessário | Ritmo necessário para alcançar a referência | Só mostrar se já produzido pelo pipeline |
| Cenário de tendência | Se o ritmo atual continuar | Não usar “cenário” como título |
| Ano estimado de alcance | Possível ano de alcance | Não apresentar como garantia |
| Exposição municipal | Participação da rede municipal | Somente quando a leitura for útil e segura |
| Proxy | Não exibir | Não publicar conclusão equivalente à meta |
| Reconciliado | Não exibir como selo | O valor seguro pode ser mostrado |
| Reconciliação | Não exibir | Manter como gate interno |
| Cobertura dos dados | Não exibir | Remover da experiência pública |
| Aplicação constitucional da educação | Quanto o município aplicou em educação | O fundamento legal fica nas fontes |
| Aplicado em MDE | Valor aplicado em educação | Mostrar ano |
| Percentual aplicado em MDE | Percentual aplicado em educação | Explicar em uma frase simples |
| Remuneração dos profissionais | Parte do Fundeb usada para remunerar profissionais da educação | Evitar título sem contexto |
| Receita Fundeb recebida declarada | Valor do Fundeb informado pelo município | Não chamar de transferência confirmada |
| Empenhado | Comprometido no orçamento | O termo legal pode aparecer apenas em explicação secundária, se indispensável |
| Liquidado | Despesa reconhecida após a entrega | Evitar o termo isolado |
| Pago | Pago | Pode permanecer |
| Previsão | Valor previsto | Sempre mostrar ano |
| Beneficiário VAAR | Há previsão desta complementação para o município | Não confundir com recebimento |
| Não beneficiário | Não há previsão desta complementação para o município neste ano | É um resultado, não uma ausência de dado |
| Fonte geral de MDE | Recurso geral para a educação | Não vincular diretamente a uma meta |
| Relação programática | Pode financiar ações para melhorar este resultado | Não dizer que o indicador determina o recurso |
| Relação condicionada | Melhorar este resultado pode ajudar a cumprir uma condição | Informar a fonte oficial |
| Relação direta | Este resultado pode influenciar o acesso ou o valor do recurso | Exige regra oficial documentada |

### 6.3 Termos proibidos na interface pública

A busca automatizada deve verificar, no conteúdo renderizado ao usuário, a presença indevida de:

- `municipal-diagnostic-v2`;
- `municipal-finance-v1`;
- `decisionSummary`;
- `priorityScore`;
- `needScore`;
- `actionabilityScore`;
- pipeline;
- schema;
- contrato, quando usado no sentido técnico;
- parser;
- hash;
- gate;
- canônico;
- `null`;
- `undefined`;
- `NaN`;
- evidência alta;
- evidência média;
- evidência baixa;
- evidência insuficiente;
- investigação, quando usada como categoria do diagnóstico;
- pactuação;
- governabilidade;
- proxy;
- benchmark;
- percentil;
- quartil;
- coorte;
- reconciliação;
- reconciliado, como selo público;
- cobertura e limitações;
- dado indisponível;
- fonte ausente;
- bloqueado;
- informação será coletada;
- aguardando homologação;
- mudança de hash;
- versão do layout;
- versão do parser.

Alguns termos podem existir em código, testes, contratos e documentos técnicos. A proibição se aplica ao texto público renderizado.

---

## 7. Política pública de exibição, omissão e contagem

### 7.1 Quando mostrar um resultado

Um resultado pode aparecer quando o contrato indicar que é seguro apresentar pelo menos uma destas leituras:

- valor municipal;
- comparação com a referência do PNE;
- comparação com o RS;
- comparação com municípios de oferta semelhante;
- evolução histórica;
- relação com financiamento.

Cada leitura deve ser mostrada apenas se for válida. A existência do valor municipal não autoriza automaticamente todas as comparações.

### 7.2 Quando omitir

O item ou a leitura deve ser omitido quando houver internamente:

- ausência;
- bloqueio;
- revisão de fonte;
- divergência sem valor canônico;
- incompatibilidade para a comparação pretendida;
- evidência insuficiente para uma conclusão;
- relação financeira não comprovada.

A omissão pública não apaga o registro interno.

### 7.3 Seções vazias

Se uma seção não tiver itens publicáveis:

- não renderizar o título;
- não renderizar um card vazio;
- não renderizar “nenhum resultado”;
- não renderizar “informação indisponível”;
- remover o link correspondente da navegação interna.

### 7.4 Contadores

Os contadores da interface devem considerar somente os itens efetivamente mostrados naquela categoria.

Não mostrar números que façam o usuário supor que todas as metas ou todos os indicadores receberam uma conclusão, quando isso não for verdadeiro.

Preferir títulos como:

- “Metas que precisam avançar”;
- “Resultados que dependem de parceria”;
- “Bons resultados para manter”;
- “Resultados para acompanhar”.

Evitar:

- “49 indicadores avaliados”;
- “28 indicadores em investigação”;
- “13 com evidência insuficiente”.

### 7.5 Valores negativos substantivos

Uma informação negativa real pode ser mostrada quando for um resultado oficial, e não uma falha de dados.

Exemplo permitido:

> “Não há previsão desta complementação do Fundeb para o município em 2026.”

Isso é diferente de:

> “Não temos informação sobre a complementação.”

A primeira frase comunica um resultado. A segunda comunica uma limitação técnica e deve ser omitida.

---

## 8. Modelo público das relações entre metas e financiamento

A relação entre educação e financiamento é um diferencial central do APP PNE. Ela deve ser ampliada com precisão, sem prometer algo que a regra oficial não garante.

### 8.1 Quatro tipos internos; quatro mensagens públicas

| Tipo da relação | Pergunta respondida | Mensagem pública | Pode falar em ganho ou perda? |
|---|---|---|---|
| Direta | O resultado entra diretamente na regra do recurso? | “Este resultado pode influenciar o acesso ou o valor do recurso.” | Somente com regra oficial, direção e período documentados |
| Condicionada | O resultado ajuda a cumprir uma das condições? | “Melhorar este resultado pode ajudar o município a cumprir uma condição do programa.” | Não afirmar resultado automático |
| Programática | O programa pode financiar uma ação de melhoria? | “Este programa pode financiar ações para melhorar este resultado.” | Não. O indicador não determina o recebimento |
| Fonte geral da educação | É uma fonte geral que pode apoiar despesas educacionais? | “Este é um recurso geral para a educação.” | Não vincular diretamente ao indicador |

Quando não houver vínculo comprovado, não mostrar o programa naquele indicador.

### 8.2 Regra para “ganhar ou perder”

A plataforma só pode usar uma formulação mais específica quando todos os itens abaixo estiverem presentes no contrato ou na matriz homologada:

1. regra oficial identificada;
2. período de vigência;
3. indicador ou condição claramente associado;
4. direção do efeito;
5. fórmula ou regra de decisão reproduzível;
6. fonte oficial;
7. texto público aprovado.

Sem esses elementos, usar “pode influenciar” ou “pode ajudar a cumprir uma condição”.

Nunca calcular no React:

- valor que o município ganhará;
- valor que o município perderá;
- probabilidade de recebimento;
- elegibilidade;
- posição em seleção;
- saldo disponível.

### 8.3 Estrutura de cada cartão de recurso

Cada cartão público deve responder, de forma curta:

1. **Qual é o recurso ou programa?**
2. **Como ele se relaciona com esta meta?**
3. **O resultado pode influenciar o recurso ou o programa apenas pode apoiar a melhoria?**
4. **O que o recurso pode financiar, quando essa informação estiver documentada?**
5. **Qual é a fonte e o ano da regra?**

### 8.4 Organização da seção consolidada

No Diagnóstico municipal, separar visualmente:

#### Recursos que podem ser influenciados pelos resultados

Somente relações diretas ou condicionadas homologadas.

#### Recursos que podem apoiar melhorias

Relações programáticas.

#### Recursos gerais da educação

Fundeb, Salário-Educação ou outras fontes gerais, sem sugerir vínculo direto com cada indicador.

Não misturar os três grupos em uma lista única.

### 8.5 Textos proibidos

- “O município receberá este recurso se melhorar.”
- “O município perderá o recurso se não atingir a meta.”
- “Recurso disponível.”
- “Saldo disponível.”
- “Município elegível.”
- “Recebimento garantido.”

Esses textos só poderiam ser usados se um contrato futuro trouxesse comprovação oficial específica e inequívoca. Não estão autorizados por esta diretriz.

---

## 9. Arquitetura ideal da experiência

## 9.1 Página principal do Diagnóstico municipal

### Bloco 1 — Cabeçalho

Título recomendado:

> **{Município}: metas do PNE e recursos para a educação**

Subtítulo recomendado:

> Veja onde o município avançou, onde precisa melhorar, como se compara ao RS e quais recursos estão relacionados.

Não usar no cabeçalho:

- nomenclatura de painel ou versão;
- texto sobre cobertura;
- texto sobre evidência;
- quantidade de indicadores sem conclusão;
- explicação do pipeline.

### Bloco 2 — Resumo das metas

Usar até quatro grupos públicos:

1. **Metas que precisam avançar**  
   Resultados em que o município pode atuar diretamente.

2. **Resultados que dependem de parceria**  
   Situações que também dependem do Estado, da União ou de outras redes.

3. **Bons resultados para manter**  
   Resultados favoráveis que devem ser preservados.

4. **Resultados para acompanhar**  
   Situações que merecem observação, sem necessidade de uma chamada imediata.

Não mostrar “Investigação” ou níveis de evidência.

### Bloco 3 — Comparação com o RS

Título:

> **Como o município está em relação ao RS**

Mostrar poucos destaques:

- até três resultados em que o município precisa avançar em relação ao RS;
- até três resultados favoráveis;
- ano comparado;
- diferença em pontos percentuais, quando aplicável;
- posição simples entre os municípios, quando houver segurança para a leitura.

Exemplos:

- “O resultado está 4,2 pontos percentuais abaixo do RS.”
- “O município está entre os 25% com melhores resultados do estado.”
- “O resultado é semelhante ao observado no RS.”

Não mostrar percentil, quartil, direção estatística ou fórmula.

### Bloco 4 — Metas que precisam avançar

Cada item deve mostrar:

- nome simples;
- uma frase explicando o que o indicador mede;
- resultado municipal e ano;
- referência, se válida;
- comparação com o RS, se válida;
- evolução, se segura;
- frase sobre quem pode agir;
- link para recursos relacionados, quando houver.

### Bloco 5 — Resultados que dependem de parceria

Mesmo formato do bloco anterior, com uma frase simples:

> “A melhoria depende também da atuação do Estado ou da União.”

Quando o contrato indicar a rede predominante, nomeá-la.

### Bloco 6 — Bons resultados para manter

Apresentação compacta:

- resultado;
- comparação favorável;
- mensagem “Bom resultado para manter”;
- ano;
- fonte no rodapé.

### Bloco 7 — Resultados para acompanhar

Apresentação compacta, sem tom de alerta e sem score.

### Bloco 8 — Recursos relacionados às prioridades

Separar:

- recursos que podem ser influenciados pelos resultados;
- recursos que podem apoiar melhorias;
- recursos gerais da educação.

Cada recurso deve indicar a meta ou grupo de metas ao qual está relacionado.

### Bloco 9 — Visão por tema

Pode permanecer como navegação estrutural, desde que use títulos simples:

- Atendimento escolar;
- Aprendizagem;
- Profissionais da educação;
- Infraestrutura;
- Escolaridade da população.

Não mostrar contadores de investigação ou evidência.

### Bloco 10 — Fontes das informações

Última seção da página.

---

## 9.2 Detalhe de uma meta ou indicador

A ordem ideal é:

1. **Nome da meta ou do resultado**
2. **O que este resultado mostra**
3. **Resultado do município**
4. **Resultado esperado**, quando a comparação for válida
5. **Comparação com o RS**
6. **Comparação com municípios de oferta semelhante**
7. **Como o resultado evoluiu**
8. **Quem pode agir**
9. **Recursos relacionados**
10. **Fonte e ano**, referenciados no rodapé

### 9.2.1 Evolução

Usar frases como:

- “O resultado melhorou nos últimos anos.”
- “O resultado ficou praticamente estável.”
- “O resultado caiu nos últimos anos.”
- “Mantido o ritmo atual, a referência pode ser alcançada em {ano}.”

A última frase só pode aparecer quando o pipeline já produzir o ano e a qualidade interna permitir a publicação.

### 9.2.2 Comparação com municípios semelhantes

Usar sempre:

> “Municípios com oferta educacional de tamanho semelhante.”

Não usar:

- municípios socioeconomicamente semelhantes;
- coorte;
- grupo de pares;
- cluster.

### 9.2.3 Desigualdades

Um recorte de desigualdade só pode aparecer quando já estiver homologado e seguro.

O piloto urbano/rural de tempo integral pode ser apresentado com linguagem simples:

> “Tempo integral em escolas urbanas e rurais.”

Não mostrar regras de supressão, tamanho de célula ou risco de identificação na página pública. Essas regras continuam obrigatórias internamente.

---

## 9.3 Panorama financeiro da educação

A página deve ser complementar e responder:

- quais são os principais recursos da educação do município;
- quanto estava previsto;
- quanto foi distribuído ou informado;
- quanto foi pago em gastos de Educação;
- quanto foi aplicado em educação;
- qual parte do Fundeb foi destinada à remuneração dos profissionais;
- quais recursos estão ligados às metas prioritárias.

### Bloco 1 — Cabeçalho

Título recomendado:

> **{Município}: recursos da educação**

Subtítulo:

> Veja os principais recursos, valores aplicados e relações com as metas do PNE.

Remover do cabeçalho:

- avisos sobre bases, estágios e períodos diferentes;
- linguagem de reconciliação;
- linguagem de cobertura;
- nomenclatura de “evidências municipais”.

A separação entre valores de natureza diferente deve ser resolvida pela organização dos blocos e pelos rótulos, não por um aviso técnico dominante.

### Bloco 2 — Principais valores

Exemplos de títulos:

- **Salário-Educação distribuído ao município em {ano}**
- **Fundeb previsto para {ano}**
- **Valor pago em Educação em {ano}**
- **Complementação do Fundeb ligada a resultados e condições**

Cada card deve informar claramente se o valor é:

- previsto;
- distribuído;
- informado pelo município;
- comprometido no orçamento;
- reconhecido após a entrega;
- pago.

Não somar valores com naturezas diferentes.

### Bloco 3 — Quanto o município aplicou em educação

Substituir a apresentação técnica da P5-C2 por:

- **Percentual aplicado em educação**;
- **Valor aplicado em educação**;
- **Parte do Fundeb usada para remunerar profissionais da educação**;
- **Valor do Fundeb informado pelo município**, quando publicável.

Exemplo de explicação:

> “Percentual das receitas consideradas pela legislação que foi aplicado em educação no ano.”

Não mostrar na visão pública principal:

- SIOPE × RREO;
- reconciliado;
- base empenhada;
- status de reconciliação;
- valores separados por fonte;
- nota sobre DCA versus MDE;
- disclosure de revisão de fonte.

Essas diferenças continuam protegidas internamente.

### Bloco 4 — Gastos em Educação

Título recomendado:

> **Como os gastos em Educação avançaram no orçamento**

Rótulos simples:

- **Comprometido no orçamento**;
- **Despesa reconhecida após a entrega**;
- **Pago**;
- **Valores ainda a pagar**, quando a leitura estiver homologada.

Evitar “função 12”, “DCA” e siglas na interface principal.

### Bloco 5 — Fundeb

Mostrar separadamente:

- total previsto;
- VAAF, VAAT e complementação ligada a resultados e condições;
- ano;
- situação do município;
- frase simples sobre previsão não ser recebimento.

Preferir incorporar a natureza no rótulo:

> “Valor previsto para o município em 2026.”

Em vez de um aviso técnico amplo.

### Bloco 6 — Salário-Educação

Substituir “QSE” por “Salário-Educação”.

Mostrar separadamente:

- valor distribuído no ano concluído;
- estimativa para outro ano;
- base de cálculo apenas se ajudar o gestor e puder ser explicada em linguagem simples.

Não destacar coeficientes ou códigos técnicos na visão principal.

### Bloco 7 — Recursos ligados às metas

Título:

> **Recursos relacionados às metas que precisam avançar**

A ligação deve vir do contrato e da matriz de financiamento. O Panorama financeiro não deve alterar a classificação educacional.

### Bloco 8 — Fontes das informações

Última seção.

### O que deve desaparecer do Panorama público

- “Cobertura e limitações dos dados”;
- contadores de dimensões completas, pendentes ou indisponíveis;
- selo “Reconciliado”;
- “SIOPE × RREO — sexto bimestre” como cabeçalho;
- detalhes por fonte na interface principal;
- “Nota metodológica” sobre diferenças contábeis;
- “Consultar fontes e metodologia” como chamada técnica;
- nomenclatura de contratos, gates ou versões.

---

## 10. Alterações necessárias nas telas atuais

## 10.1 Diagnóstico municipal

| Elemento atual | Ação | Resultado esperado |
|---|---|---|
| “Metas e pontos de atenção” | Reescrever | “Metas do PNE e recursos para a educação” |
| Contadores “Ação municipal”, “Pactuação”, “Investigação”, “Acompanhamento” | Substituir | “Precisa avançar”, “Depende de parceria”, “Bom resultado”, “Acompanhar” |
| Contador de investigação | Remover | Não expor limitações técnicas |
| “Triagem por evidência” | Remover ou renomear | “Metas que merecem atenção” |
| Selos “Evidência alta/média” | Remover | A qualidade permanece interna |
| “Governabilidade” | Reescrever | “Quem pode agir” |
| “Pactuação com outras redes” | Reescrever | “Depende de parceria com outras redes” |
| “Consultar grupos de limitações” | Remover | Não criar área pública de limitações |
| “Caminhos de financiamento relacionados” | Reescrever e reorganizar | “Recursos relacionados às prioridades” |
| Programas misturados | Separar | Influência no recurso, apoio à melhoria e fontes gerais |
| “Situação por tema” com contadores técnicos | Simplificar | Temas com resultados públicos apenas |
| “Resultados a preservar e acompanhar” | Manter com linguagem simples | “Bons resultados para manter” e “Resultados para acompanhar” |
| Fontes em linha técnica | Reorganizar | Seção final “Fontes das informações” |

## 10.2 Panorama financeiro

| Elemento atual | Ação | Resultado esperado |
|---|---|---|
| “Panorama financeiro da educação” | Simplificar | “Recursos da educação” |
| “Financiamento e evidências municipais” | Remover | Não expor “evidências” |
| Aviso inicial sobre somas e estágios | Remover do destaque | Diferenciar os valores por rótulos claros |
| “QSE distribuída” | Reescrever | “Salário-Educação distribuído ao município” |
| “Aplicação constitucional da educação” | Reescrever | “Quanto o município aplicou em educação” |
| “Aplicado em MDE” | Reescrever | “Valor aplicado em educação” |
| “Reconciliação das fontes” | Ocultar | Gate interno |
| Selo “Reconciliado” | Ocultar | O valor é mostrado sem explicar o processo técnico |
| “SIOPE + RREO” | Mover | Nomes completos apenas nas fontes |
| “Receita Fundeb declarada” | Reescrever | “Valor do Fundeb informado pelo município” |
| “Execução da função Educação” | Reescrever | “Gastos em Educação” |
| “Função 12” e “DCA” | Ocultar da visão principal | Informação contábil interna ou fonte |
| Empenhado/liquidado/pago | Traduzir | Comprometido, reconhecido após entrega e pago |
| “Cobertura e limitações dos dados” | Remover | Não expor qualidade técnica |
| “Relação com pontos de atenção” | Reescrever | “Recursos ligados às metas” |
| “Referências oficiais” | Reescrever | “Fontes das informações” |

---

## 11. Arquitetura técnica recomendada para o realinhamento

### 11.1 Preservar os contratos canônicos

Os contratos `municipal-diagnostic-v2` e `municipal-finance-v1` continuam sendo a base técnica.

O realinhamento não deve alterar fórmulas, resultados, validade, categorias internas ou valores financeiros apenas para facilitar a interface.

### 11.2 Criar uma camada pública de apresentação controlada

A implementação deve centralizar:

- textos públicos;
- nomes das seções;
- traduções de estados internos;
- política de omissão;
- referências às fontes;
- formatação de períodos;
- mensagens de comparação;
- mensagens de relação financeira.

Essa camada pode ser implementada com seletores e catálogos de texto no frontend **somente quando estiver lendo decisões já prontas no contrato**.

Se o React precisar reconstruir validade, governabilidade, confiança, elegibilidade ou publicação, o pipeline deve fornecer um campo aditivo de apresentação ou publicação. O React não deve reproduzir essas regras.

### 11.3 Responsabilidade sugerida por camada

#### Pipeline

- `value`;
- referência;
- comparação;
- direção;
- trajetória;
- categoria interna;
- relação de financiamento;
- estado de publicação;
- fonte;
- ano;
- eventuais valores canônicos.

#### Camada de apresentação

- texto “acima do RS”;
- texto “depende de parceria”;
- título público do recurso;
- agrupamento público das seções;
- omissão de estados não publicáveis;
- marcadores que apontam para as fontes.

#### Componentes React

- renderização;
- navegação;
- acessibilidade;
- responsividade;
- formatação visual.

### 11.4 Catálogo central de linguagem

Evitar textos públicos espalhados em múltiplos componentes.

Criar ou consolidar um módulo único, com nome compatível com a organização real do repositório, para conter:

- títulos das páginas;
- títulos das seções;
- rótulos de comparação;
- rótulos financeiros;
- mensagens de trajetória;
- mensagens de responsabilidade;
- mensagens de financiamento;
- termos proibidos para testes.

O Codex deve localizar a estrutura real antes de escolher o arquivo. Não inventar um caminho sem inspecionar o projeto.

### 11.5 Fontes por referência

Cada informação pública deve carregar internamente uma ou mais referências de fonte.

A interface pode usar um marcador discreto próximo ao conteúdo e apresentar os detalhes apenas na seção final.

Formato conceitual:

```ts
interface PublicSourceReference {
  id: string
  institution: string
  title: string
  period: string
  officialUrl?: string
}
```

O tipo acima é orientador. O Codex deve reutilizar a tipagem real ou criar uma estrutura aditiva mínima, sem duplicar dados existentes.

### 11.6 Modelo conceitual de um item público

```ts
interface PublicEducationResult {
  id: string
  title: string
  explanation: string
  municipalityValue?: string
  referenceText?: string
  rsComparisonText?: string
  similarMunicipalitiesText?: string
  trendText?: string
  responsibilityText?: string
  financingLinks?: PublicFinancingLink[]
  sourceRefs: string[]
}
```

Este modelo é uma referência de produto, não uma obrigação de schema. Os campos numéricos continuam no contrato e só são formatados para apresentação.

---

## 12. Plano de execução para o Codex

As fases abaixo devem ser executadas em prompts separados. Não juntar duas fases grandes em uma única implementação. A Fase D0 é obrigatória antes de qualquer fase de interface e deve ser atualizada sempre que uma nova fonte, indicador ou programa entrar no roadmap.


## Fase D0 — Auditoria de viabilidade e aquisição municipal

### Objetivo

Comprovar, antes de qualquer nova implementação pública, quais informações realmente podem ser obtidas, atualizadas e apresentadas para cada município do RS.

Esta fase é obrigatória e precede R0. Ela não altera a interface.

### Escopo obrigatório

Auditar separadamente:

1. as metas legais do PNE usadas pela plataforma;
2. os 49 indicadores do contrato municipal;
3. as comparações com o RS;
4. as comparações com municípios de oferta semelhante;
5. as séries históricas e trajetórias;
6. os recortes de desigualdade;
7. cada programa ou fonte de financiamento;
8. cada situação municipal de programa;
9. cada valor financeiro pretendido;
10. cada afirmação sobre influência, ganho ou perda de recurso.

### Ações

1. Criar um registro único por indicador, componente, programa ou valor financeiro.
2. Identificar a pergunta pública que o item pretende responder.
3. Registrar a fonte oficial e a página institucional.
4. Registrar o caminho exato de obtenção:
   - URL de arquivo;
   - padrão de URL por exercício;
   - endpoint e parâmetros de API;
   - diretório FTP;
   - consulta com opção de exportação;
   - PDF nominal;
   - procedimento manual, quando não houver alternativa.
5. Registrar formato, compactação, codificação e tamanho aproximado.
6. Registrar o grão real:
   - município;
   - rede;
   - escola;
   - unidade executora;
   - estado;
   - Brasil.
7. Registrar a chave de conciliação:
   - código IBGE de sete dígitos;
   - código municipal de seis dígitos;
   - código da escola;
   - CNPJ da entidade executora;
   - outra chave oficial.
8. Provar o crosswalk quando a chave não for o código IBGE.
9. Registrar anos disponíveis, último período, periodicidade e calendário provável de atualização.
10. Baixar uma amostra e uma execução integral do RS.
11. Repetir o download em outra execução para testar estabilidade.
12. Validar:
    - cabeçalho;
    - tipos;
    - unidade;
    - unicidade;
    - período;
    - abrangência;
    - linhas estaduais misturadas;
    - duplicidades;
    - retificações;
    - cobertura dos 497 municípios.
13. Para indicadores calculados, registrar numerador, denominador, universo, ano e fórmula.
14. Para comparações com o RS, confirmar que os componentes estaduais podem ser agregados com a mesma fórmula.
15. Para programas, separar:
    - regra e finalidade;
    - lista nominal;
    - valor previsto;
    - valor transferido;
    - saldo;
    - condição ou indicador que influencia o recurso.
16. Classificar o item com um dos estados da seção 1.7.
17. Definir exatamente quais leituras podem ser publicadas:
    - valor municipal;
    - referência do PNE;
    - comparação com o RS;
    - posição entre municípios;
    - evolução;
    - relação programática;
    - situação nominal;
    - valor financeiro;
    - efeito financeiro.
18. Definir o texto público simples e as fontes que aparecerão no final da página.
19. Definir o comportamento de omissão para os estados não publicáveis.
20. Registrar o script, adaptador ou procedimento responsável pela ingestão.

### Registro mínimo por item

O inventário deve conter, no mínimo:

| Campo | Conteúdo |
|---|---|
| `itemId` | Identificador estável |
| `itemType` | Indicador, componente, programa, situação municipal, valor ou regra financeira |
| `userQuestion` | Pergunta pública respondida |
| `pneGoalRefs` | Metas relacionadas |
| `officialInstitution` | Instituição responsável |
| `datasetOrReport` | Base, relatório ou programa |
| `landingUrl` | Página institucional |
| `downloadUrlOrPattern` | URL, padrão, endpoint ou procedimento exato |
| `acquisitionMethod` | API, CSV, XLSX, ODS, FTP, PDF ou manual |
| `geographicGrain` | Município, escola, executor, UF ou Brasil |
| `municipalKey` | Chave municipal real |
| `crosswalk` | Regra de conversão para IBGE, quando necessária |
| `availablePeriods` | Períodos disponíveis |
| `latestVerifiedPeriod` | Último período verificado |
| `updateFrequency` | Periodicidade |
| `coverageRs` | Quantidade e percentual entre os 497 municípios |
| `formula` | Fórmula e componentes, quando aplicável |
| `revisionPolicy` | Como detectar e tratar retificações |
| `reproducibilityEvidence` | Resultado das execuções de teste |
| `viabilityStatus` | Estado da seção 1.7 |
| `publishableReadings` | Leituras autorizadas |
| `publicText` | Texto simples autorizado |
| `sourceRefs` | Fontes públicas finais |
| `ingestionOwner` | Script, adaptador ou procedimento |

### Entregáveis obrigatórios

1. `docs/APP_PNE_MATRIZ_VIABILIDADE_DADOS_MUNICIPAIS.md`
2. `data/APP_PNE_FONTES_MUNICIPAIS.csv`
3. `data/APP_PNE_COBERTURA_INDICADORES_MUNICIPAIS.csv`
4. `data/APP_PNE_FINANCIAMENTO_MUNICIPAL.csv`
5. relatório de provas de download e cobertura;
6. lista de itens `ready` que podem alimentar as fases R0–R8;
7. lista de itens que exigem pipeline, mapeamento, fonte alternativa ou decisão de produto.

### Gates de publicação

Um item só pode entrar em um prompt de implementação pública quando passar pelos gates aplicáveis:

- **G1 — Fonte oficial:** instituição, base e período identificados.
- **G2 — Grão municipal:** município ou crosswalk municipal inequívoco.
- **G3 — Obtenção reproduzível:** download ou consulta repetível.
- **G4 — Cobertura:** cobertura aferida nos 497 municípios do RS.
- **G5 — Compatibilidade:** fórmula, universo, ano e unidade compatíveis com a leitura.
- **G6 — Atualidade:** período adequado à afirmação pública.
- **G7 — Retificação:** mudanças de arquivo detectáveis e controladas.
- **G8 — Financiamento:** nível 1, 2, 3 ou 4 da seção 1.4 explicitamente autorizado.
- **G9 — Texto público:** linguagem simples e sem promessa indevida.
- **G10 — Fonte final:** referência oficial pronta para aparecer no rodapé.

### Regras de cobertura

- Um indicador usado no resumo estadual da plataforma deve ter cobertura conhecida e suficiente para a conclusão pretendida.
- Para um indicador central da experiência dos 497 municípios, priorizar cobertura `497/497` ou uma política explícita de publicação por município.
- Uma linha ausente de uma lista de beneficiários não significa “não beneficiário” sem prova de que a lista é completa e exaustiva.
- Um programa em grão escola ou unidade executora não pode ser agregado ao município sem crosswalk e deduplicação homologados.
- Um valor disponível para um exercício não autoriza sua reutilização em outro.
- Uma consulta manual pode permanecer no catálogo, mas não deve sustentar um valor atualizado em lote sem procedimento operacional definido.

### Não fazer

- não alterar a interface;
- não assumir que todos os 49 indicadores possuem todas as leituras;
- não assumir que as 73 metas possuem indicador municipal;
- não criar estimativas apenas para preencher a matriz;
- não usar uma fonte estadual ou nacional como se fosse municipal;
- não tratar painel navegável como API;
- não tratar ausência de linha como zero ou não beneficiário;
- não inferir valor recebido a partir de previsão;
- não iniciar R0, R1, R2, R3, R4, R5 ou R6 para um item sem status autorizado.

### Critério de conclusão

A Fase D0 termina quando cada informação pretendida pela experiência ideal possui uma resposta objetiva para:

- existe no nível municipal?
- onde e como é obtida?
- para quais anos?
- cobre quais municípios?
- é reproduzível?
- o que exatamente permite afirmar?
- como será atualizada?
- qual texto e fonte aparecerão ao usuário?

O resultado esperado não é declarar que tudo existe. É impedir que a plataforma prometa ou implemente algo cuja obtenção municipal ainda não esteja comprovada.

---

## Fase R0 — Congelamento de expansão e inventário público

### Objetivo

Entender tudo que o usuário vê hoje antes de reescrever a interface.

### Ações

1. Pausar novas integrações públicas de MSC, P5-C3, P5-D e P6.
2. Localizar todas as rotas e componentes públicos do Diagnóstico e do Panorama financeiro.
3. Inventariar:
   - títulos;
   - subtítulos;
   - cards;
   - badges;
   - tooltips;
   - disclosures;
   - avisos;
   - estados vazios;
   - textos de erro;
   - textos acessíveis;
   - fontes;
   - links cruzados.
4. Classificar cada texto como:
   - **MANTER**;
   - **REESCREVER**;
   - **OCULTAR**;
   - **SOMENTE FONTES**.
5. Mapear cada texto aos campos reais do contrato usados para renderizá-lo.
6. Identificar qualquer cálculo ou decisão de validade duplicada no React.

### Entregável

`docs/APP_PNE_INVENTARIO_CONTEUDO_PUBLICO.md`

O inventário deve conter:

- rota;
- componente;
- texto atual;
- campo de origem;
- classificação;
- texto público proposto;
- observação sobre risco metodológico.

### Não fazer

- não alterar layout;
- não alterar contratos;
- não alterar o pipeline;
- não reescrever componentes nesta fase;
- não adicionar dados.

### Critério de conclusão

Todos os textos públicos das duas páginas e dos detalhes estão catalogados, inclusive textos em disclosures e estados condicionais.

---

## Fase R1 — Base de linguagem pública e política de visibilidade

### Objetivo

Criar uma base única para os textos públicos e impedir que termos técnicos retornem à interface.

### Ações

1. Criar ou consolidar o catálogo central de linguagem.
2. Implementar mapeamentos de estados internos para textos públicos.
3. Implementar a política de omissão:
   - `null` não vira zero;
   - item não publicável não renderiza;
   - seção vazia não renderiza;
   - item omitido não aparece em contador.
4. Verificar se o contrato já fornece estado suficiente para publicação.
5. Quando a alternativa seria recalcular validade no React, adicionar no pipeline apenas o campo aditivo mínimo necessário.
6. Criar teste de termos proibidos no conteúdo renderizado.
7. Criar teste para impedir `null`, `undefined` e `NaN` visíveis.

### Entregáveis

- catálogo de linguagem pública;
- utilitários de apresentação;
- testes de conteúdo;
- documentação dos mapeamentos.

### Não fazer

- não mudar resultados;
- não mudar a classificação interna;
- não criar texto automático por inteligência generativa em tempo de execução;
- não usar regras legais escritas diretamente nos componentes.

### Critério de conclusão

Existe uma fonte única de linguagem pública e os testes falham quando um termo técnico proibido entra na interface.

---

## Fase R2 — Realinhamento da página principal do Diagnóstico

### Objetivo

Fazer a primeira tela responder às perguntas centrais do gestor.

### Ações

1. Reescrever título e subtítulo.
2. Substituir as categorias visíveis por:
   - metas que precisam avançar;
   - resultados que dependem de parceria;
   - bons resultados para manter;
   - resultados para acompanhar.
3. Remover da interface pública:
   - investigação;
   - evidência;
   - cobertura;
   - limitações;
   - governabilidade como termo;
   - contadores técnicos.
4. Manter as classificações internas e o comportamento de financiamento.
5. Garantir que itens internos de investigação não apareçam em destaques nem gerem financiamento.
6. Manter a comparação com o RS com textos simples.
7. Manter a navegação por tema com contadores apenas dos itens apresentados.
8. Preservar shell, identidade e largura.

### Não fazer

- não redesenhar todo o layout;
- não alterar a lógica de seleção do `decisionSummary`;
- não criar ranking;
- não aumentar o número de destaques apenas para preencher a tela.

### Critério de conclusão

Um usuário não técnico identifica rapidamente onde o município precisa avançar, onde depende de parceria e quais resultados são favoráveis, sem encontrar termos de qualidade dos dados.

---

## Fase R3 — Comparações, trajetória e detalhe dos resultados

### Objetivo

Traduzir as análises já existentes em respostas simples.

### Ações

1. Reescrever a comparação com o RS.
2. Converter percentis em posição compreensível, quando seguro.
3. Usar “municípios com oferta educacional de tamanho semelhante”.
4. Reescrever trajetória e ritmo.
5. Exibir ano em cada valor e comparação.
6. Aplicar a nota simples para valores acima de 100% apenas quando necessária.
7. Reorganizar o detalhe do indicador na ordem definida na seção 9.2.
8. Remover fórmulas, nomes de universos, unidades técnicas e justificativas metodológicas da visão pública.
9. Manter os recortes de desigualdade somente onde já homologados.

### Não fazer

- não calcular percentil no React;
- não chamar pares de socioeconomicamente semelhantes;
- não apresentar ano estimado como garantia;
- não publicar comparação bloqueada internamente.

### Critério de conclusão

Cada item público explica o que mede, o resultado, a comparação, a evolução e quem pode agir, sem exigir conhecimento de estatística ou legislação.

---

## Fase R4 — Relação entre metas e financiamento

### Objetivo

Transformar a matriz indicador × financiamento em uma explicação útil e segura sobre recursos da educação.

### Ações

1. Auditar os tipos reais de relação existentes no contrato e no catálogo.
2. Mapear cada relação para uma das mensagens públicas da seção 8.
3. Separar:
   - recursos influenciados por resultados ou condições;
   - recursos que podem apoiar melhorias;
   - recursos gerais da educação.
4. Mostrar a meta relacionada em cada cartão.
5. Mostrar fonte e período da regra no rodapé.
6. Garantir que itens internos de investigação não gerem cartões.
7. Não repetir o mesmo programa em múltiplas frentes da mesma página.
8. Criar links consistentes entre Diagnóstico e Panorama financeiro.
9. Validar que SIOPE, SICONFI e outros sistemas declaratórios não sejam apresentados como fontes de recurso.
10. Validar que Fundeb e Salário-Educação não sejam descritos como recursos causados diretamente por qualquer indicador sem regra específica.

### Não fazer

- não inferir elegibilidade;
- não simular ganho ou perda;
- não mostrar programa sem vínculo comprovado;
- não dizer que uma chamada está aberta sem dado oficial e atual;
- não transformar previsão em recebimento.

### Critério de conclusão

O usuário diferencia claramente o que pode influenciar um recurso do que apenas pode financiar uma ação de melhoria.

---

## Fase R5 — Simplificação do Panorama financeiro

### Objetivo

Manter apenas informações financeiras que ajudem a compreender os recursos da educação do município.

### Ações

1. Reescrever título e subtítulo.
2. Substituir QSE por Salário-Educação.
3. Simplificar a seção P5-C2 conforme a seção 9.3.
4. Ocultar reconciliação, cobertura, fontes divergentes, gates e detalhes técnicos.
5. Reescrever os estágios da despesa em linguagem simples.
6. Preservar a separação entre previsto, distribuído, declarado e pago.
7. Preservar a separação de anos.
8. Preservar Fundeb total e complementações sem dupla soma.
9. Dar maior destaque à ligação entre recursos e metas educacionais.
10. Remover a seção pública de “Cobertura e limitações dos dados”.
11. Manter as fontes oficiais no final.

### Não fazer

- não integrar MSC nesta fase;
- não adicionar novos indicadores financeiros;
- não comparar diretamente aplicação em educação com gastos da função Educação;
- não criar capacidade financeira;
- não criar saldo;
- não criar avaliação de gestão.

### Critério de conclusão

A página responde quanto foi previsto, distribuído, informado, aplicado ou pago em educação, sem parecer uma demonstração contábil ou uma auditoria de dados.

---

## Fase R6 — Fontes das informações

### Objetivo

Dar transparência sem transferir a complexidade técnica ao usuário.

### Ações

1. Criar um componente final padronizado “Fontes das informações”.
2. Agrupar as fontes por:
   - resultados educacionais;
   - população e comparação;
   - recursos e aplicação em educação;
   - regras de programas.
3. Mostrar nome completo da instituição na primeira ocorrência.
4. Mostrar base, relatório ou programa.
5. Mostrar ano ou período.
6. Usar links oficiais.
7. Exibir somente fontes utilizadas na página atual.
8. Permitir marcadores discretos nos conteúdos que apontem para o rodapé.
9. Deduplicar fontes repetidas.

### Não fazer

- não mostrar metadados de coleta;
- não mostrar hash;
- não mostrar versão de parser;
- não mostrar nomes de arquivos internos;
- não mostrar contratos ou schemas.

### Critério de conclusão

O usuário identifica de onde veio cada grupo de informação e consegue acessar a fonte oficial sem enfrentar documentação técnica.

---

## Fase R7 — Verificação completa do produto

### Objetivo

Garantir que o realinhamento funcione em todos os municípios e estados dos contratos.

### Validações automatizadas

1. Lint dos arquivos alterados.
2. Typecheck dos arquivos ou projeto, registrando erros preexistentes separadamente.
3. Build de produção.
4. Teste de termos proibidos.
5. Teste de ausência de `null`, `undefined` e `NaN` visíveis.
6. Teste de seções vazias não renderizadas.
7. Teste de contadores coerentes com itens visíveis.
8. Teste de fontes deduplicadas.
9. Teste de cartões de financiamento com tipo e fonte.
10. Teste de ausência de dupla soma do Fundeb.
11. Teste de preservação de valores acima de 100%.
12. Teste de que itens internos de investigação não geram financiamento.

### Municípios representativos para inspeção

Selecionar casos que cubram:

- município sem ação direta destacada;
- município com muitos itens internos não publicáveis;
- município com resultado de atendimento acima de 100%;
- município com resultados favoráveis e desfavoráveis em relação ao RS;
- município com complementação do Fundeb prevista;
- município sem previsão de determinada complementação;
- município com relações financeiras diretas e programáticas;
- município sem relação financeira publicável;
- município pequeno e município grande;
- nomes municipais longos;
- desktop e mobile.

### Teste de compreensão humana

Uma pessoa que não participou do desenvolvimento deve, em até três minutos, conseguir responder:

1. quais metas precisam avançar;
2. como o município está em relação ao RS;
3. quais resultados são bons;
4. quais recursos podem ser influenciados;
5. quais recursos podem apoiar melhorias;
6. onde estão as fontes.

### Critério de conclusão

Nenhuma tela pública exibe termos técnicos proibidos, estados de ausência ou promessas financeiras não comprovadas.

---

## Fase R8 — Consolidação, documentação e liberação

### Objetivo

Fechar o realinhamento e tornar esta diretriz parte permanente do fluxo do projeto.

### Ações

1. Atualizar `docs/PLANO_MIGRACAO_UI.md` com as fases concluídas.
2. Registrar arquivos alterados e decisões de linguagem.
3. Registrar testes executados.
4. Registrar débitos técnicos que não afetem a experiência pública.
5. Confirmar que esta diretriz está no repositório.
6. Incluir referência a esta diretriz nos futuros prompts do Codex.
7. Fazer inspeção final das duas rotas principais.
8. Liberar o realinhamento sem iniciar uma nova expansão de dados no mesmo lote.

### Critério de conclusão

O projeto possui uma experiência pública coerente e uma regra documentada que impede o retorno de jargão técnico ou expansão fora da educação.

---

## 13. Nova ordem de prioridades depois do realinhamento

A ordem anterior de expansão financeira deve ser revista.

### Prioridade 1 — Completar a relação PNE × financiamento

Antes de adicionar mais contabilidade, aprofundar:

- quais indicadores podem influenciar recursos;
- quais indicadores ajudam a cumprir condições;
- quais programas podem financiar ações de melhoria;
- qual é a fonte oficial da relação;
- qual é o período da regra;
- qual texto simples explica a relação.

Essa prioridade responde diretamente ao objetivo original da plataforma.

### Prioridade 2 — Melhorar comparação e evolução educacional

Aprimorar, quando houver base segura:

- comparação com o RS;
- comparação com municípios de oferta semelhante;
- evolução histórica;
- ritmo necessário;
- ano possível de alcance;
- leitura por tema;
- desigualdades educacionais homologadas.

### Prioridade 3 — Recursos efetivamente ligados à educação

Integrar novas fontes somente quando responderem, com segurança:

- quanto foi recebido;
- qual programa transferiu;
- qual finalidade educacional;
- qual período;
- qual relação com a meta.

Não integrar apenas porque a fonte existe.

### Prioridade 4 — Composição do gasto educacional, se houver valor claro para o usuário

A MSC e a antiga P5-C3 podem voltar ao roadmap apenas para responder:

> “Como os recursos da educação foram utilizados?”

A apresentação deve ser restrita à educação e traduzida para:

- profissionais da educação;
- manutenção das atividades;
- investimentos;
- outras despesas educacionais.

Não transformar a plataforma em painel PCASP, fiscal ou contábil.

### Prioridade 5 — Custos, projetos e prontidão somente educacionais

A antiga P5-D só pode avançar se cada item estiver ligado a:

- uma meta;
- uma ação educacional;
- um projeto educacional;
- um recurso da educação;
- uma fonte oficial.

Não criar “prontidão municipal” genérica.

### Prioridade 6 — Scores e rankings permanecem suspensos

P6-A, P6-B e P6-C não devem ser retomadas sem nova decisão explícita.

A plataforma já pode informar, por indicador, onde o município precisa avançar e como se compara. Um número único pode reduzir transparência e desviar do objetivo de compreensão.

---

## 14. Critérios de aceite do realinhamento completo

O realinhamento só está concluído quando todos os critérios abaixo forem atendidos.

### Produto

- [ ] A página principal começa pelas metas do PNE.
- [ ] O usuário identifica onde o município precisa avançar.
- [ ] O usuário identifica bons resultados.
- [ ] A comparação com o RS é compreensível sem conhecimento estatístico.
- [ ] A comparação com municípios semelhantes explica que o critério é o porte da oferta.
- [ ] A evolução é descrita com linguagem simples.
- [ ] A responsabilidade municipal ou compartilhada é compreensível.
- [ ] O financiamento aparece ligado às metas, e não como tema isolado.
- [ ] Recursos influenciados e recursos que apoiam melhorias estão separados.
- [ ] O Panorama financeiro permanece restrito à educação.
- [ ] As fontes aparecem no final de cada página.

### Linguagem

- [ ] Não há “Investigação” como categoria pública.
- [ ] Não há níveis de evidência.
- [ ] Não há cobertura ou limitações técnicas.
- [ ] Não há mensagens de dado indisponível ou coleta futura.
- [ ] Não há jargão de pipeline, contratos ou arquivos.
- [ ] Siglas menos conhecidas foram traduzidas.
- [ ] Cada número informa o ano e sua natureza.
- [ ] Nenhum texto promete recebimento garantido.

### Dados

- [ ] Ausência não virou zero.
- [ ] Resultados acima de 100% foram preservados.
- [ ] A referência do RS continua sendo razão de somas.
- [ ] Nenhuma comparação incompatível foi publicada.
- [ ] Nenhuma reconciliação foi refeita no React.
- [ ] Previsão, distribuição, declaração e pagamento continuam separados.
- [ ] Fundeb e complementações não foram somados em duplicidade.
- [ ] Itens internos de investigação não geram financiamento.
- [ ] Fontes públicas correspondem às informações exibidas.

### Técnica

- [ ] React continua sendo camada de apresentação.
- [ ] Regras de negócio permanecem no pipeline ou nos contratos.
- [ ] Textos públicos estão centralizados.
- [ ] Há teste de termos proibidos.
- [ ] Há teste de valores inválidos visíveis.
- [ ] Lint e build passam nos arquivos afetados.
- [ ] Erros preexistentes são registrados separadamente.
- [ ] Shell, largura e identidade SESI-RS foram preservados.

---

## 15. Checklist obrigatório antes de criar um prompt para o Codex

Todo novo prompt deve responder, por escrito:

1. **Qual pergunta do usuário esta tarefa ajuda a responder?**
2. **Por que a informação pertence à educação municipal?**
3. **Qual item da matriz D0 autoriza a implementação?**
4. **Qual é o estado de viabilidade: `ready` ou `ready_with_mapping` homologado?**
5. **Qual é a instituição e a fonte oficial exata?**
6. **Qual é a URL, endpoint, padrão de arquivo ou procedimento de obtenção?**
7. **Qual é o formato de download ou consulta?**
8. **Qual é o grão real da fonte?**
9. **Qual é a chave municipal e o crosswalk utilizado?**
10. **Qual é o ano, período e periodicidade?**
11. **Qual é a cobertura comprovada entre os 497 municípios do RS?**
12. **A obtenção foi repetida e validada de forma reproduzível?**
13. **Qual script, adaptador ou procedimento atualiza o dado?**
14. **O contrato já fornece o resultado ou será necessário alterar o pipeline?**
15. **Quais leituras estão autorizadas: valor, comparação, evolução, situação ou financiamento?**
16. **Qual texto público simples será usado?**
17. **Qual comportamento será aplicado quando o item não for publicável?**
18. **A tarefa cria ou altera uma afirmação sobre influência, ganho ou perda de recurso?**
19. **Qual nível de financiamento da seção 1.4 está envolvido?**
20. **A lista nominal é completa o suficiente para interpretar ausência de linha?**
21. **Quais fontes aparecerão no final da página?**
22. **A tarefa pode ser concluída sem score, ranking ou avaliação geral?**

Se uma dessas respostas não estiver clara, ou se o item não tiver passado pelos gates aplicáveis da Fase D0, o prompt ainda não está pronto.

---

## 16. Prompt mestre para todas as próximas tarefas do Codex

Copiar o bloco abaixo no início de cada prompt de implementação e completar os campos da etapa.

```text
Leia integralmente e obedeça:

docs/PLANO_DIRETRIZ_PRODUTO_APP_PNE.md

Esta tarefa pertence à fase: [D0/R0/R1/R2/R3/R4/R5/R6/R7/R8].

Pergunta do usuário que a tarefa deve responder:
[preencher]

Relação direta com a educação municipal:
[preencher]

Fonte oficial e período da informação:
[preencher]

Item e status na matriz D0:
[preencher]

Forma exata de obtenção:
[URL, endpoint, padrão de arquivo, formato e procedimento]

Grão, chave municipal e crosswalk:
[preencher]

Cobertura comprovada entre os 497 municípios:
[preencher]

Script, adaptador ou procedimento de atualização:
[preencher]

Objetivo da tarefa:
[preencher]

Escopo permitido:
[preencher]

Fora de escopo:
[preencher]

Antes de alterar código:
1. leia a linha correspondente na matriz D0;
2. confirme que a fonte, o período, o grão e a cobertura foram comprovados;
3. inspecione os arquivos, componentes, tipos e contratos reais;
4. identifique os campos reais usados pela interface;
5. não invente nomes de propriedades, dados, relações ou endpoints;
6. confirme se a decisão já vem do pipeline;
7. aponte qualquer conflito com a diretriz antes de implementar;
8. interrompa a tarefa se o item não tiver passado pelos gates aplicáveis.

Regras obrigatórias:
- a plataforma pública trata somente da educação do município;
- não presumir que a informação existe no nível municipal;
- implementar apenas itens autorizados pela matriz D0;
- usar linguagem simples;
- não mostrar termos técnicos de construção, metodologia ou qualidade dos dados;
- não mostrar mensagens de informação ausente, indisponível ou a ser coletada;
- omitir itens não publicáveis sem convertê-los em zero;
- manter as fontes no final da página;
- não recalcular regras no React;
- não inferir elegibilidade, ganho, perda, recebimento ou saldo;
- não criar score ou ranking;
- preservar shell, largura e identidade SESI-RS;
- executar somente esta fase.

Critérios de aceite específicos:
[preencher]

Validações proporcionais:
- lint dos arquivos alterados;
- typecheck aplicável;
- build, quando necessário;
- testes de conteúdo e estados afetados;
- não executar publicação nem commit.

Ao finalizar, informe:
- arquivos alterados;
- campos reais utilizados;
- textos públicos criados ou removidos;
- comportamentos de omissão;
- relações financeiras alteradas, se houver;
- fontes exibidas;
- forma de obtenção e cobertura municipal comprovadas;
- validações executadas;
- limitações encontradas;
- confirmação de que nenhuma regra metodológica ou cálculo foi alterado sem autorização.
```

---

## 17. Formato obrigatório do relatório final do Codex

Cada etapa deve terminar com este formato:

```text
Etapa concluída: [código e nome]

1. Resultado para o usuário
- ...

2. Arquivos alterados
- ...

3. Campos reais do contrato utilizados
- ...

4. Textos públicos removidos
- ...

5. Textos públicos adicionados
- ...

6. Política de omissão aplicada
- ...

7. Relações com financiamento
- ...

8. Fontes públicas
- ...

9. Validações
- ...

10. Regras preservadas
- pipeline como fonte das regras;
- ausência não virou zero;
- nenhuma elegibilidade foi inferida;
- nenhuma previsão foi tratada como recebimento;
- nenhum score ou ranking foi criado.

11. Pendências
- apenas pendências desta etapa, sem iniciar trabalho fora do escopo.
```

---

## 18. Exemplos de conteúdo público esperado

### 18.1 Cabeçalho do Diagnóstico

> **Dois Irmãos: metas do PNE e recursos para a educação**  
> Veja onde o município avançou, onde precisa melhorar, como se compara ao RS e quais recursos estão relacionados.

### 18.2 Card de meta que precisa avançar

> **Matrículas da EJA articuladas à educação profissional**  
> Mostra a participação das matrículas que combinam as duas modalidades.  
> **Resultado do município:** 0% em 2025  
> **Resultado do RS:** 1,3% em 2025  
> O resultado está 1,3 ponto percentual abaixo do RS.  
> **Quem pode agir:** a melhoria depende de ações do município e de outras redes.

O exemplo acima é apenas de linguagem. Os números e a conclusão devem vir do contrato real.

### 18.3 Card favorável

> **Participação pública na expansão da educação profissional**  
> **Resultado do município:** 100% em 2025  
> O resultado está acima do observado no RS.  
> **Bom resultado para manter.**

### 18.4 Relação direta ou condicionada com recurso

> **Complementação do Fundeb ligada a resultados e condições de gestão**  
> Melhorar este resultado pode ajudar o município a cumprir uma das condições consideradas para o recurso.  
> Fonte da regra no final da página.

### 18.5 Programa que pode apoiar uma melhoria

> **Programa de ampliação da jornada escolar**  
> Pode financiar ações para ampliar o tempo integral.  
> O programa apoia a melhoria, mas o indicador não determina sozinho o recebimento.

### 18.6 Panorama financeiro

> **Quanto o município aplicou em educação — 2024**  
> **31,68%** das receitas consideradas pela legislação foram aplicadas em educação.  
> **R$ 42,11 milhões** aplicados no ano.  
> **93,19% do Fundeb** foram destinados à remuneração dos profissionais da educação.

### 18.7 Fontes

> **Fontes das informações**
>
> 1. Instituto Nacional de Estudos e Pesquisas Educacionais — Censo Escolar, 2025.  
> 2. Instituto Brasileiro de Geografia e Estatística — estimativas populacionais usadas no indicador, período correspondente.  
> 3. Fundo Nacional de Desenvolvimento da Educação — informações do Fundeb e do Salário-Educação, exercício correspondente.  
> 4. Sistema de Informações sobre Orçamentos Públicos em Educação — aplicação em educação, 2024.  
> 5. Relatório Resumido da Execução Orçamentária — informações de educação, 2024.

Os nomes, anos e links devem ser montados a partir das fontes realmente utilizadas na página.

---

## 19. Documentos e arquivos técnicos que devem ser consultados

Antes de cada fase, o Codex deve localizar e ler os arquivos reais pertinentes.

### Diagnóstico

- `docs/DIAGNOSTICO_MUNICIPAL_IMPLEMENTACAO.md`
- `docs/DIAGNOSTICO_MUNICIPAL_SCHEMA_V2.md`
- `docs/DIAGNOSTICO_MUNICIPAL_SINTESE_DECISAO.md`
- `docs/DIAGNOSTICO_MUNICIPAL_VALIDACAO_P3C.md`
- `docs/DIAGNOSTICO_MUNICIPAL_PILOTO_DESIGUALDADE_P4B.md`
- `src/features/diagnostic/diagnosticTypes.ts`
- componentes reais da rota de Diagnóstico municipal;
- `public/data/municipios/<slug>/diagnostico.json`.

### Financiamento

- catálogo de programas financeiros;
- matriz indicador × financiamento;
- arquivos que constroem `educationLinks` e os grupos de financiamento;
- documentos de fontes e regras dos programas;
- componentes reais de financiamento do Diagnóstico.

### Panorama financeiro

- `docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_METODOLOGIA.md`
- `docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_FONTES.md`
- `docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_SCHEMA_V1.md`
- `docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_IMPLEMENTACAO_P5B1.md`
- `docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_INTERFACE_P5C1.md`
- `docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_AUDITORIA_P5B2.md`
- `docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_RECONCILIACAO.md`
- `docs/DIAGNOSTICO_FINANCEIRO_MUNICIPAL_IMPLEMENTACAO_P5B2B1.md`
- `src/features/diagnostic/municipalFinanceTypes.ts`
- `src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx`
- `src/features/municipal-finance/municipalFinancePresentation.ts`
- `public/data/municipios/<slug>/financeiro.json`.

O Codex deve confirmar os caminhos reais, pois o repositório pode ter evoluído.

---

## 20. Decisões permanentes registradas nesta versão

1. A plataforma é sobre a educação do município.
2. O Diagnóstico das metas do PNE é o centro do produto.
3. A comparação com o RS e com municípios de oferta semelhante é parte central.
4. O financiamento deve estar ligado às metas e ações educacionais.
5. Linguagem técnica não deve aparecer ao usuário.
6. Estados de ausência, bloqueio, revisão e cobertura não devem aparecer publicamente.
7. A ausência continua preservada internamente e nunca vira zero.
8. As fontes devem aparecer no final das páginas.
9. O Panorama financeiro é complementar ao diagnóstico.
10. A MSC e novas camadas contábeis ficam pausadas até o realinhamento.
11. Custos, projetos e prontidão só podem ser educacionais.
12. Score e ranking permanecem suspensos.
13. React não recalcula regras do pipeline.
14. Simplicidade pública não pode produzir afirmação financeira incorreta.
15. Qualquer mudança dessas decisões exige atualização explícita deste documento.

---

## 21. Definição final de sucesso

O APP PNE estará novamente na rota ideal quando um gestor puder abrir a página do município e entender, sem ajuda técnica:

- como está a educação nas metas apresentadas;
- em que precisa avançar;
- em que apresenta bom resultado;
- como se compara ao RS;
- como se compara a municípios com oferta semelhante;
- o que a prefeitura pode fazer;
- onde depende de parceria;
- quais recursos podem ser influenciados;
- quais recursos podem apoiar melhorias;
- quanto foi previsto, distribuído, informado, aplicado ou pago para a educação;
- de onde vieram as informações.

A plataforma deve ser tecnicamente rigorosa por dentro e simples por fora.

> **Meta → resultado → comparação → ação → recurso → fonte.**

Essa é a rota obrigatória do produto.
