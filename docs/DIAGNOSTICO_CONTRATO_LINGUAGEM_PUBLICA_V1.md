# Diagnóstico municipal — contrato público de linguagem, visibilidade e omissão (DF3-A)

**Versão:** 1.1  
**Status:** homologado para implementação DF3-B  
**Data do diagnóstico:** 2026-07-20  
**Escopo:** rota pública `#diagnostico`, seus estados, a apresentação derivada de `diagnostico.json` e a integração DF2 já homologada  
**Natureza desta entrega:** documentação e auditoria somente leitura; nenhuma regra aqui foi implementada nesta etapa  
**Revisão DF3-A.1:** homologação editorial que elimina mensagens públicas de ausência, substitui linguagem de articulação por parceria e explicita a preservação dos resultados educacionais descritivos.

## 1. Promessa pública da página

O Diagnóstico municipal deve responder, em linguagem direta, a quatro perguntas:

1. como está a educação do município;
2. como os resultados se comparam ao Rio Grande do Sul;
3. onde o município pode agir e onde a melhoria depende de parceria;
4. quais resultados devem ser mantidos ou acompanhados e quais programas podem apoiar as melhorias.

A página não promete um ranking, uma avaliação definitiva da gestão, uma previsão certa nem uma recomendação financeira individualizada. A complexidade metodológica continua decidindo o que pode ser publicado, mas não deve ser transformada em vocabulário operacional para o público. Quando a informação não for segura para orientar uma ação, ela é omitida da narrativa principal e permanece disponível para auditoria interna.

Formulação pública recomendada para o cabeçalho:

> **Diagnóstico educacional de {município}**  
> Veja como está a educação do município, como os resultados se comparam ao Rio Grande do Sul e onde a gestão pode agir ou trabalhar em parceria.

Na primeira ocorrência pública do ciclo, usar **Plano Nacional de Educação (PNE)**. Depois disso, a sigla PNE pode aparecer isoladamente. A promessa não afirma que a plataforma cobre integralmente todas as metas legais.

## 2. Princípios de linguagem

1. **Começar pela resposta.** Título, síntese e primeiro bloco devem dizer o que o município precisa saber, não como o sistema classificou os dados.
2. **Usar sujeito e ação.** Preferir “o município pode ampliar”, “a melhoria depende de parceria” e “o resultado deve ser acompanhado”.
3. **Distinguir resultado, comparação e decisão.** Um valor descreve uma situação; a comparação dá contexto; a ação depende também de responsabilidade e segurança da informação.
4. **Nomear o comparador.** Usar “Rio Grande do Sul”, “municípios com oferta semelhante” ou “meta do PNE”; nunca “referência” sem complemento quando houver risco de ambiguidade.
5. **Não atribuir culpa.** Resultados territoriais ou de responsabilidade compartilhada não devem ser apresentados como falha exclusiva da prefeitura.
6. **Não converter incerteza em alarme.** Informação insuficiente é omitida da narrativa decisória; não vira card de problema.
7. **Não converter ausência em zero nem em mensagem.** Valor, comparação, trajetória, fonte, item, grupo ou seção sem requisitos públicos são omitidos; falha operacional da página é tratada separadamente.
8. **Explicar percentuais acima de 100% junto ao caso.** A explicação deve mencionar a diferença entre matrículas localizadas e população residente, sem sugerir erro automático.
9. **Evitar siglas sem expansão.** A primeira ocorrência pública deve expandir AEE, EJA, EPT e ETI; nomes oficiais de programas homologados na DF2 são preservados.
10. **Exigir fonte oficial.** Todo resultado público precisa de órgão, base ou relatório, período e link oficial identificados. Sem isso, o resultado não é publicado.
11. **Omitir sem explicar.** Não publicar mensagens de ausência, placeholders, traços ou contadores zerados.
12. **Preservar a leitura linear.** A página é um relatório consolidado; não deve recuperar a navegação interna removida nem criar uma taxonomia técnica paralela.

## 3. Estrutura pública final

Ordem contratada para a futura DF3-B:

1. **Cabeçalho:** `Plano Nacional de Educação (PNE)`, município, promessa pública e ações de copiar/imprimir.
2. **Resumo do diagnóstico:** frase executiva sem “investigação”, “evidência”, “governabilidade”, “pipeline” ou “contrato”.
3. **Resultados em destaque:** resultado do município, meta ou resultado esperado e quanto falta/quanto supera, quando a comparação for válida.
4. **Comparação com o Rio Grande do Sul:** somente no mesmo ano e com método comparável.
5. **Comparação com municípios de oferta semelhante:** somente quando disponível, com explicação literal do recorte; sem “coorte” ou percentil isolado.
6. **Evolução recente:** histórico, ritmo e cenário apenas quando sustentados pelos dados, sempre como projeção condicionada.
7. **Responsabilidade:** duas áreas públicas — “Resultados em que o município pode agir” e “Resultados que dependem de parceria”.
8. **Continuidade:** duas áreas públicas — “Resultados a manter” e “Resultados para acompanhar”, omitidas individualmente quando vazias.
9. **Situação por tema:** síntese temática com contagens públicas; sem contagem de investigação.
10. **Programas que podem apoiar as melhorias:** bloco DF2 congelado, com sua atual regra de omissão total quando não houver itens.
11. **Fontes das informações:** subseções “Resultados educacionais” e, somente quando a DF2 estiver presente, “Programas que podem apoiar as melhorias”.

Não haverá uma seção pública “Investigação”. A página pode ter menos blocos em um município sem compensar a ausência com wrappers, contadores zerados ou mensagens técnicas.

## 4. Mapeamento dos cinco grupos internos

| Grupo interno do contrato | Função interna | Saída pública | Regra de visibilidade | Rótulo público contratado |
|---|---|---|---|---|
| `municipalActionItems` | seleção de ação com atuação municipal | bloco decisório principal | mostrar quando houver item; omitir quando vazio | **Resultados em que o município pode agir** |
| `coordinationItems` | seleção que depende de outra rede ou esfera | bloco decisório complementar | mostrar quando houver item; omitir quando vazio | **Resultados que dependem de parceria** |
| `investigationItems` | retenção por dado, método ou oferta ainda insuficiente | nenhuma coleção pública | omitir itens, contador, títulos, exemplos, motivos e disclosure; conservar no contrato e na auditoria | **sem rótulo público** |
| `monitoringItems` | resultado atingido que ainda requer observação | grupo de continuidade | mostrar quando houver item; omitir quando vazio | **Resultados para acompanhar** |
| `preservationItems` | resultado atingido com base mais segura | grupo de continuidade | mostrar quando houver item; omitir quando vazio | **Resultados a manter** |

O mapeamento é de apresentação, não de cálculo. A DF3-B deve consumir as coleções na ordem recebida e não reclassificar, reordenar, somar ou recalcular indicadores no React.

## 5. Política de investigação

“Investigação” é uma condição interna de publicação. Não é uma prioridade pública, um diagnóstico sobre o município nem uma ação que a gestão deva receber sem contexto especializado.

Regras obrigatórias:

- não mostrar a palavra “investigação” na página, na síntese copiada, em contadores, chips, cards, filtros ou estados vazios;
- não mostrar os quatro agrupamentos internos de limitações, seus exemplos nem níveis de evidência;
- não deslocar esses itens para ação, parceria, acompanhamento ou manutenção;
- não mostrar um bloco substituto do tipo “dados insuficientes” no fluxo normal;
- manter os itens e seus motivos no contrato, nos testes de integridade, nas auditorias e em ferramentas internas;
- se **todas** as coleções públicas estiverem vazias, manter os resultados descritivos que forem publicáveis e omitir a camada decisória; não usar a coleção de investigação para preencher a página;
- se a página inteira não puder ser montada, usar o erro operacional do §14, sem revelar a causa técnica.

**A omissão de `investigationItems` não remove automaticamente o indicador da visão geral da educação municipal.**

### 5.1 Classificação interna

`investigationItems` controla a ausência de posição decisória, ação municipal, grupo de parceria, financiamento, recomendação, comparação não validada e projeção não validada. Essa classificação nunca aparece para o usuário e não altera IDs, fórmulas, valores ou contratos.

### 5.2 Resultado educacional descritivo

Um indicador presente em `investigationItems` pode continuar na visão geral ou na situação por tema quando o contrato atual já trouxer, simultaneamente:

- valor municipal publicável;
- unidade compreensível;
- ano identificado;
- nome público;
- fonte oficial identificada.

Nesse caso, mostrar somente nome, valor, unidade, ano e a fonte no final da página. Não mostrar classificação interna, nível de evidência, razão de retenção, comparação bloqueada, diferença incompatível, meta não validada, posição ordinal, programa de financiamento ou explicação sobre pendência metodológica.

### 5.3 Ausência dos requisitos públicos

Sem valor, unidade, ano ou fonte oficial identificada, o indicador é omitido da camada pública correspondente. Não mostrar zero, traço, placeholder, fallback ou explicação. Os 49 indicadores e todos os seus dados permanecem intactos na camada técnica.

A auditoria do §17 reforça a necessidade desta regra: os 497 municípios possuem `investigationItems`, e 28 dos 49 indicadores aparecem exclusivamente nessa coleção entre as seleções compactas atuais.

## 6. Dicionário técnico → público

| Termo técnico atual | Formulação pública | Observação de uso |
|---|---|---|
| ação municipal / governabilidade municipal | resultados em que o município pode agir | não explicar a classificação de governança |
| pactuação / coordenação intergovernamental | resultados que dependem de parceria | no corpo, nomear “Estado”, “União” ou “outras redes” quando conhecido |
| investigação | — | omissão pública obrigatória |
| evidência alta/média/baixa/insuficiente | — | condição interna; não publicar nível |
| triagem | resumo / leitura | “triagem” fica interna |
| indicador elegível | resultado que pode orientar ação | não publicar “elegibilidade” |
| excluído / fora da ordem | — | omitir; não criar lista de exclusões |
| referência estadual | resultado do Rio Grande do Sul | incluir ano comparável |
| benchmark estadual | comparação com o Rio Grande do Sul | nunca publicar “benchmark” |
| coorte comparável | municípios com oferta educacional de tamanho semelhante | não afirmar semelhança socioeconômica |
| percentil favorável | leitura qualitativa validada | publicar posição percentual somente após equivalência matemática confirmada e testada |
| distância favorável / remaining gap | quanto falta / quanto o resultado supera a meta | escolher a frase conforme direção e sinal |
| meta configurada | referência de planejamento | “meta” só quando houver meta oficial válida |
| cenário de manutenção | — | permanece interno na v1.1 |
| projeção de tendência | se a evolução recente continuar, o município pode alcançar a meta em {ano} | usar somente com os requisitos do §11 |
| trajetória necessária | — | permanece interna na v1.1 |
| ritmo suficiente/insuficiente | usar as duas frases condicionais homologadas no §11 | somente com série, cenário, ano e meta válidos |
| proxy | — | classificação interna; o resultado descritivo segue o §5.2 |
| metodologia incompatível | — | omitir a comparação sem explicar o motivo |
| valor fora do domínio | — | omitir a leitura que depende do valor |
| dado não verificável | — | omitir o resultado correspondente |
| exposição municipal | participação da rede municipal no resultado | usar somente se a medida for compreensível e necessária; na v1 fica interna |
| pipeline | processamento dos dados | nunca publicar |
| contrato / schema / versão | estrutura interna dos dados | nunca publicar |
| coleção | grupo interno | nunca publicar |
| referência atingida | resultados a manter | escolher conforme natureza real da referência |
| lacuna comparável | faltam {valor} para a meta | usar somente com meta oficial e comparação válidas |
| visão estrutural | — | retirar; não comunica conteúdo |

## 7. Termos proibidos na camada pública

São proibidos em títulos, rótulos, textos, badges, tooltips, estados, texto copiado, impressão e nomes acessíveis: `investigação`, `evidência`, `governabilidade`, `pactuação`, `pactuar`, `articulação`, `articular`, `coordenação federativa`, `coorte`, `benchmark`, `percentil direcional`, `quartil`, `proxy`, `contrato`, `schema`, `pipeline`, `gate`, `parser`, `hash`, `null`, `score`, `ranking`, `prioridade calculada`, `comparação incompatível`, `dado indisponível`, `informação indisponível`, `fonte não informada`, `informação pendente`, `aguardando validação`, `não localizado`, `ainda não disponível`, `não calculável`, `sem cenário` e `histórico insuficiente`.

Também são proibidas as seguintes construções sem tradução:

- “evidência alta/média/baixa/insuficiente”;
- “indicador informativo” como etiqueta de decisão;
- qualquer mensagem que explique ausência de valor, comparação, fonte, trajetória, programa, item, grupo ou seção;
- “percentil favorável” sem frase explicativa;
- “distância” sem direção clara;
- “meta” para referência configurada, legado, comparação estadual ou cenário;
- “sem razão adicional registrada”, “fonte não declarada no recorte carregado” e mensagens que revelem a implementação;
- caminhos de arquivo, códigos de erro, status HTTP, IDs de indicadores, códigos de motivo ou versões metodológicas.

Os termos podem continuar na coluna “Texto atual”, em explicações internas, na auditoria, em critérios que documentam a proibição, no código, em contratos, logs e testes. Nomes oficiais congelados na DF2 permanecem; “Articuladas” é permitido no nome oficial “Plano de Ações Articuladas”.

## 8. Inventário completo dos textos públicos atuais

### 8.1 Regra de contagem e abrangência

O inventário completo é formado pelas linhas `T001–T121` abaixo, `T200–T253` no §13 e `T300–T357` no §16. Cada linha representa uma **família textual decisória única**; variantes enumeradas na mesma célula pertencem à mesma origem e recebem a mesma decisão. A contagem final usa essas linhas, não as ocorrências repetidas nos 497 municípios.

Origens auditadas: `Diagnostico.jsx`, `DiagnosticPanel.jsx`, `diagnosticPresentation.js`, estados compartilhados efetivamente alcançáveis, `DiagnosticFinancingSection.jsx`, catálogo DF2, catálogo de 49 indicadores e campos exibidos dos contratos. Textos apenas técnicos, mas atualmente alcançáveis por um disclosure, estado ou ação de cópia, também entram no inventário.

Decisões possíveis: **manter**, **reescrever**, **ocultar**, **mover para fontes** e **somente interno**.

### 8.2 Rota, síntese, comparações e decisões

| Nº | Texto atual | Arquivo | Componente/função | Contexto da página | Origem | Decisão | Texto proposto | Condição de exibição | Comportamento sem dado/vazio | Nota metodológica interna | Fase futura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T001 | `Carregando diagnóstico de {município}...` | `src/pages/Diagnostico.jsx` | `Diagnostico` | página inteira | literal | reescrever | `Carregando o diagnóstico de {município}…` | enquanto a requisição estiver pendente | manter anúncio polido; não mostrar skeleton vazio se a estrutura ainda não foi montada | nenhum dado deve ser inferido | B1 |
| T002 | `Erro ao carregar o diagnóstico` | `src/pages/Diagnostico.jsx` | `Diagnostico`/`ErrorState` | erro de página | literal | reescrever | `Não foi possível abrir o diagnóstico agora. Tente novamente.` | qualquer falha operacional que impeça montar a página | oferecer `Tentar novamente` quando tecnicamente possível | registrar causa técnica fora da UI | B4 |
| T003 | mensagem bruta do erro, inclusive caminho/status | `src/pages/Diagnostico.jsx`, `src/data/staticData.ts` | `ErrorState`/`loadJson` | corpo do erro | helper | somente interno | — | nunca na camada pública | usar somente a mensagem operacional de T002 | caminho, status HTTP e exceção ficam em log | B4 |
| T004 | `O contrato do diagnóstico de {município} usa uma versão incompatível.` | `src/components/DiagnosticPanel.jsx` | `DiagnosticPanel` | estado de versão | literal | reescrever | `Não foi possível abrir o diagnóstico agora. Tente novamente.` | falha integral que impeça montar a página | não criar seções parciais; oferecer nova tentativa quando possível | conservar `incompatible_version` somente para controle técnico | B4 |
| T005 | `O diagnóstico canônico de {município} ainda não está disponível no ciclo vigente.` | `src/components/DiagnosticPanel.jsx` | `DiagnosticPanel` | ausência integral | literal | reescrever | `Não foi possível abrir o diagnóstico agora. Tente novamente.` | arquivo integral não carregado | não criar seções parciais; oferecer nova tentativa quando possível | motivo permanece interno | B4 |
| T006 | `PNE 2026–2036 · ciclo vigente · acompanhamento atual` | `src/components/DiagnosticPanel.jsx` | `DiagnosticPanel` | contexto do cabeçalho | literal | reescrever | `Plano Nacional de Educação (PNE) 2026–2036` | primeira ocorrência pública do PNE na página pronta | omitir junto com a página | depois desta ocorrência, usar apenas PNE | B1 |
| T007 | `{município}: metas e pontos de atenção` | `src/components/DiagnosticPanel.jsx` | `DiagnosticPanel` | `h1` | helper | reescrever | `Diagnóstico educacional de {município}` | contrato carregado | estado de T005 conserva o município | não transforma ausência em diagnóstico | B1 |
| T008 | `Leitura dos indicadores municipais com dados e referências comparáveis.` | `src/components/DiagnosticPanel.jsx` | `DiagnosticPanel` | introdução | literal | reescrever | `Veja como está a educação do município, como os resultados se comparam ao Rio Grande do Sul e onde a gestão pode agir ou trabalhar em parceria.` | página pronta | omitir no erro integral | não promete cobertura de todas as metas legais | B1 |
| T009 | `Ações do diagnóstico` | `src/components/DiagnosticPanel.jsx` | grupo de ações | nome acessível | literal | manter | `Ações do diagnóstico` | botões presentes | sem grupo vazio | rótulo ARIA, não texto editorial | B1 |
| T010 | `Copiar síntese` | `src/components/DiagnosticPanel.jsx` | botão | ação | literal | manter | `Copiar síntese` | Clipboard disponível ou tentativa possível | erro é anunciado por T014 | conteúdo copiado segue T111–T119 | B1 |
| T011 | `Síntese copiada` | `src/components/DiagnosticPanel.jsx` | botão | retorno curto | literal | manter | `Síntese copiada` | após sucesso | retornar ao rótulo padrão posteriormente | estado temporário | B1 |
| T012 | `Imprimir relatório` | `src/components/DiagnosticPanel.jsx` | botão | ação | literal | manter | `Imprimir relatório` | página pronta | não renderizar em estado integral sem relatório | impressão segue a mesma linguagem pública | B1 |
| T013 | `Síntese copiada para a área de transferência.` | `src/components/DiagnosticPanel.jsx` | região viva | sucesso acessível | literal | manter | mesmo texto | após sucesso | região vazia fora do evento | anúncio polido | B1 |
| T014 | `Não foi possível copiar a síntese.` | `src/components/DiagnosticPanel.jsx` | região viva | erro acessível | literal | reescrever | `Não foi possível copiar. Tente novamente.` | falha da ação | não alterar o restante da página | erro técnico fica interno | B4 |
| T015 | `Leitura principal` | `src/components/DiagnosticPanel.jsx` | síntese executiva | kicker | literal | reescrever | `Resumo do diagnóstico` | contrato carregado | manter bloco só se houver ao menos uma frase pública | síntese exclui investigação | B1 |
| T016 | `{A} indicadores com possibilidade de ação municipal, {C} dependem de pactuação, {I} precisam de investigação e {M} estão em acompanhamento.` | `src/features/diagnostic/diagnosticPresentation.js` | `buildExecutiveSummary` | frase principal | helper | reescrever | `{A} resultados em que o município pode agir; {C} resultados que dependem de parceria; {M} resultados para acompanhar; {P} resultados a manter.` | incluir somente cláusulas com contagem maior que zero; nunca incluir I | se todas as cláusulas forem vazias, omitir a frase e manter resultados descritivos publicáveis | não somar nem reclassificar as coleções | B1 |
| T017 | `Principal oportunidade de ação municipal` | `src/components/DiagnosticPanel.jsx` | foco principal | destaque | literal | reescrever | `Resultado em destaque` | item fornecido pelo contrato para o destaque | omitir o destaque quando vazio | a posição recebida não significa prioridade, importância, melhor ou pior resultado | B2 |
| T018 | `Distância {valor}` | `src/components/DiagnosticPanel.jsx` | foco principal | medida | helper | reescrever | `Faltam {valor} para a meta` ou `Resultado {valor} acima da meta` | resultado com fonte oficial, meta oficial válida e diferença calculável | omitir a linha | direção vem do contrato | B2 |
| T019 | `Resumo das metas analisadas` | `src/components/DiagnosticPanel.jsx` | placar | nome acessível | literal | reescrever | `Resumo dos resultados` | placar público presente | não manter `dl` vazio | nem toda referência é meta | B1 |
| T020 | `Ação municipal` | `src/components/DiagnosticPanel.jsx` | métrica | placar | literal | reescrever | `Município pode agir` | contagem maior que zero | omitir métrica zerada | mapeia `municipalActionItems` | B2 |
| T021 | `Evidência alta ou média e governabilidade municipal` | `src/components/DiagnosticPanel.jsx` | métrica | ajuda | literal | somente interno | — | nunca | sem texto substituto | critérios ficam no contrato | B2 |
| T022 | `Pactuação` | `src/components/DiagnosticPanel.jsx` | métrica | placar | literal | reescrever | `Depende de parceria` | contagem maior que zero | omitir métrica zerada | mapeia `coordinationItems` | B2 |
| T023 | `Responsabilidade compartilhada, estadual ou federal` | `src/components/DiagnosticPanel.jsx` | métrica | ajuda | literal | reescrever | `Parte da melhoria depende de ações conjuntas com o Estado, a União ou outras redes de ensino.` | métrica T022 visível | omitir com a métrica | detalhar o responsável no item quando conhecido | B2 |
| T024 | `Investigação` | `src/components/DiagnosticPanel.jsx` | métrica | placar | literal | ocultar | — | nunca | sem DOM, contador, seção, disclosure, estado vazio, fonte específica ou texto copiado | coleção preservada internamente | B2 |
| T025 | `Dados ou metodologia ainda não orientam intervenção` | `src/components/DiagnosticPanel.jsx` | métrica | ajuda | literal | somente interno | — | nunca | sem mensagem ou estado substituto | motivo interno de retenção | B2 |
| T026 | `Acompanhamento` | `src/components/DiagnosticPanel.jsx` | métrica | placar | literal | reescrever | `Acompanhar` | contagem maior que zero | omitir métrica zerada | mapeia `monitoringItems` | B2 |
| T027 | `Referência atingida com ressalvas que exigem acompanhamento` | `src/components/DiagnosticPanel.jsx` | métrica | ajuda | literal | reescrever | `Resultado que deve continuar sendo acompanhado.` | T026 visível | omitir com a métrica | não publicar nível de evidência | B2 |
| T028 | `Triagem descritiva por evidência; não constitui ranking final.` | `src/components/DiagnosticPanel.jsx` | rodapé da síntese | nota | literal | ocultar | — | nunca | sem espaço residual | cautela permanece documentada e testada | B2 |
| T029 | `As cinco coleções classificam {n} indicadores do contrato; o filtro abaixo conta {n} resultados municipais disponíveis.` | `src/components/DiagnosticPanel.jsx` | rodapé da síntese | nota técnica | helper | somente interno | — | nunca | sem substituto | útil apenas para auditoria das coleções | B2 |
| T030 | `Indicador estimado... Por mobilidade escolar e oferta regional, o resultado pode superar 100%.` | contrato/`DiagnosticPanel.jsx` | aviso misto | nota superior | contrato | reescrever | `Este percentual pode superar 100% porque compara matrículas localizadas no município com a população residente.` | junto a valor acima de 100% ou em “Dados e fontes” do indicador afetado | omitir se a condição não ocorrer | preservar valor bruto; não tratar como erro automático | B3 |
| T031 | `Filtrar itens de atenção e referências atingidas por tema` | `src/components/DiagnosticPanel.jsx` | filtro | nome acessível | literal | reescrever | `Filtrar os resultados por tema` | filtro presente | omitir filtro se houver um único tema útil | seleção não altera cálculos | B2 |
| T032 | `Resultados municipais disponíveis` | `src/components/DiagnosticPanel.jsx` | filtro | rótulo | literal | manter | mesmo texto | filtro presente | não mostrar contador vazio | conta `availableResults` | B2 |
| T033 | `Todos os temas` | `src/components/DiagnosticPanel.jsx` | filtro | seleção atual | helper | manter | mesmo texto | filtro `all` | — | — | B2 |
| T034 | `Tema selecionado` | `src/components/DiagnosticPanel.jsx` | filtro | fallback | literal | ocultar | — | nunca | seleção inválida volta automaticamente para `Todos os temas` | ausência do rótulo é falha interna | B4 |
| T035 | `{n} analisados` | `src/components/DiagnosticPanel.jsx` | filtro | contador | helper | reescrever | `{n} resultados` | filtro presente e contagem maior que zero | sem resultados publicáveis, redefinir para `Todos os temas` e omitir o filtro se continuar vazio | não confundir com comparabilidade | B2 |
| T036 | `Todas` | `src/components/DiagnosticPanel.jsx` | filtro | botão | literal | manter | mesmo texto | mais de um tema útil | — | nome acessível completo pode ser “Todos os temas” | B2 |
| T037 | `Contexto estadual` | `src/components/DiagnosticPanel.jsx` | comparação RS | kicker | literal | reescrever | `Comparação estadual` | comparação útil | omitir seção inteira sem comparação | método comparável obrigatório | B3 |
| T038 | `Como o município se compara ao RS` | `src/components/DiagnosticPanel.jsx` | comparação RS | `h2` | literal | reescrever | `Comparação com o Rio Grande do Sul` | comparação útil | omitir seção inteira | usar mesmo ano comparável | B3 |
| T039 | `{w} indicadores em situação menos favorável..., {b} mais favoráveis, {e} próximos e {u} sem comparação disponível.` | `src/components/DiagnosticPanel.jsx` | comparação RS | resumo | helper | reescrever | `{w} resultados estão abaixo do Rio Grande do Sul; {b} estão acima; {e} estão próximos.` | ao menos uma comparação válida | omitir cláusulas zeradas e qualquer menção à ausência de comparação | “acima/abaixo” descreve a medida, sem converter a ordem em prioridade | B3 |
| T040 | `Maiores diferenças desfavoráveis` | `src/components/DiagnosticPanel.jsx` | grupo RS | título | literal | reescrever | `Resultados abaixo do Rio Grande do Sul` | grupo não vazio | omitir grupo | ordem recebida não significa prioridade | B3 |
| T041 | `Nenhuma diferença desfavorável comparável.` | `src/components/DiagnosticPanel.jsx` | grupo RS | vazio | literal | ocultar | — | nunca | omitir grupo vazio sem mensagem nem espaço reservado | — | B3 |
| T042 | `Destaques favoráveis` | `src/components/DiagnosticPanel.jsx` | grupo RS | título | literal | reescrever | `Resultados acima ou próximos do Rio Grande do Sul` | grupo não vazio | omitir grupo | separar “próximo” quando necessário | B3 |
| T043 | `Nenhum destaque favorável comparável.` | `src/components/DiagnosticPanel.jsx` | grupo RS | vazio | literal | ocultar | — | nunca | omitir grupo vazio sem mensagem nem espaço reservado | — | B3 |
| T044 | `Município {valor} · {ano}` / `ano não informado` | `src/components/DiagnosticPanel.jsx` | item RS | valor local | helper | reescrever | `{município}: {valor} em {ano}` | valor e ano válidos | sem ano, não publicar a comparação | ano é requisito de comparabilidade | B3 |
| T045 | `Referência RS {valor} · {ano}` | `src/components/DiagnosticPanel.jsx` | item RS | valor estadual | helper | reescrever | `Rio Grande do Sul: {valor} em {ano}` | mesma base e ano válidos | omitir item inválido | não chamar de meta | B3 |
| T046 | `resultado próximo da Referência RS`; `{valor} acima/abaixo da Referência RS`; `Sem referência estadual comparável` | `src/features/diagnostic/diagnosticPresentation.js` | `formatStateComparisonLabel` | leitura comparativa | helper | reescrever | `O resultado do município está {valor} pontos percentuais acima do resultado do Rio Grande do Sul.`; `O resultado do município está {valor} pontos percentuais abaixo do resultado do Rio Grande do Sul.`; `O resultado do município está próximo do resultado do Rio Grande do Sul.` | comparação válida, mesma unidade percentual e mesmo ano | a variante sem comparação não é exibida | usar outra unidade por extenso quando a medida não for percentual | B3 |
| T047 | `Triagem por evidência · {tema}` | `src/components/DiagnosticPanel.jsx` | síntese decisória | kicker | helper | reescrever | `Como a gestão pode atuar · {tema}` | ao menos um grupo público não vazio | omitir junto com a seção vazia | sem alegar recomendação definitiva | B2 |
| T048 | `Síntese para decisão` | `src/components/DiagnosticPanel.jsx` | síntese decisória | `h2` | literal | reescrever | `Como a gestão pode atuar` | ao menos um dos grupos A ou C não vazio | omitir seção se ambos vazios | — | B2 |
| T049 | `Indicadores selecionados conforme evidência, trajetória e possibilidade de ação municipal.` | `src/components/DiagnosticPanel.jsx` | síntese decisória | introdução | literal | reescrever | `Os resultados abaixo mostram onde o município pode agir e onde a melhoria depende de parceria com outras redes.` | seção visível | omitir com a seção | critérios continuam internos | B2 |
| T050 | `Ação municipal` | `src/components/DiagnosticPanel.jsx` | grupo decisório | título | literal | reescrever | `Resultados em que o município pode agir` | grupo não vazio | omitir grupo | consumir `municipalActionItems` | B2 |
| T051 | `Nenhum indicador elegível para ação municipal neste recorte.` | `src/components/DiagnosticPanel.jsx` | grupo decisório | vazio | literal | ocultar | — | nunca | omitir grupo vazio sem mensagem nem espaço reservado | — | B2 |
| T052 | `Pactuação com outras redes` | `src/components/DiagnosticPanel.jsx` | grupo decisório | título | literal | reescrever | `Resultados que dependem de parceria` | grupo não vazio | omitir grupo | nomear esfera no item quando conhecido | B2 |
| T053 | `Nenhum indicador selecionado para pactuação neste recorte.` | `src/components/DiagnosticPanel.jsx` | grupo decisório | vazio | literal | ocultar | — | nunca | omitir grupo vazio sem mensagem nem espaço reservado | — | B2 |
| T054 | `RS: {comparação}` | `src/components/DiagnosticPanel.jsx` | item decisório | linha contextual | helper | reescrever | `Em relação ao Rio Grande do Sul: {comparação}` | comparação válida | omitir a linha | mesmo ano comparável | B3 |
| T055 | `Ritmo: {status}` | `src/components/DiagnosticPanel.jsx` | item decisório | evolução | helper | reescrever | `Evolução recente: {leitura}` | histórico suficiente | omitir sem histórico | regras do §11 | B3 |
| T056 | `Cenário: {tipo} ({valor})` | `src/components/DiagnosticPanel.jsx` | item decisório | cenário | helper | reescrever | `Se a evolução recente continuar, o município pode alcançar a meta em {ano}.` ou `No ritmo recente, o resultado não alcançaria a meta até {ano}.` | cenário, ano, valor ou leitura e meta válidos | omitir sem cenário validado | cenário não é previsão certa | B3 |
| T057 | `Municípios com oferta de porte semelhante: {percentil favorável}` | `src/components/DiagnosticPanel.jsx` | item decisório | pares | helper | reescrever | `Municípios com oferta educacional de tamanho semelhante: {posição percentual validada}.` | equivalência matemática do percentual confirmada e testada | usar leitura qualitativa validada ou omitir a comparação | pareamento atual usa o tamanho da oferta | B3 |
| T058 | `Coorte comparável: {percentil favorável}` | `src/components/DiagnosticPanel.jsx` | item decisório | pares | helper | reescrever | `Municípios com oferta educacional de tamanho semelhante: {leitura qualitativa validada}.` | método e leitura pública validados | omitir comparação | não alegar semelhança por atributos não usados | B3 |
| T059 | `Exposição municipal: {percentual}` | `src/components/DiagnosticPanel.jsx` | item decisório | participação municipal | helper | somente interno | — | não publicar na v1 | sem substituto | conceito ainda não possui explicação pública homologada | B3 |
| T060 | `Cabe ao município planejar e executar a oferta sob sua responsabilidade.` | `src/features/diagnostic/diagnosticPresentation.js` | responsabilidade `direct` | item decisório | catálogo | reescrever | `O município pode planejar e executar ações na rede sob sua responsabilidade.` | classificação direta | omitir com o item | não inferir ação específica | B2 |
| T061 | `Cabe ao município atuar na própria rede e pactuar metas, oferta e fluxos com as demais redes.` | mesmo | responsabilidade `shared` | item decisório | catálogo | reescrever | `Parte da melhoria depende de ações conjuntas com o Estado, a União ou outras redes de ensino.` | responsabilidade compartilhada | omitir com o item | — | B2 |
| T062 | `Cabe ao Estado liderar a oferta; o município pode pactuar acesso, demanda e articulação local.` | mesmo | responsabilidade `state_led` | item decisório | catálogo | reescrever | `Este resultado também depende de ações do Estado.` | liderança estadual | omitir com o item | — | B2 |
| T063 | `Cabe à União liderar a política; o município pode aderir e articular a execução local.` | mesmo | responsabilidade `federal_led` | item decisório | catálogo | reescrever | `Este resultado também depende de ações da União.` | liderança federal | omitir com o item | — | B2 |
| T064 | `O resultado é territorial e não representa falha exclusiva da prefeitura; cabe pactuação intersetorial.` | mesmo | responsabilidade `territorial` | item decisório | catálogo | reescrever | `Este resultado depende do trabalho conjunto entre diferentes redes.` | responsabilidade territorial | omitir com o item | preservar não atribuição de culpa | B2 |
| T065 | `A leitura é informativa e precisa de validação antes de orientar uma ação.` | mesmo | responsabilidade `informational` | item decisório | catálogo | somente interno | — | item não entra nos grupos públicos | sem mensagem substituta | direcionar para investigação interna | B2 |
| T066 | `Ação municipal direta`; `Responsabilidade compartilhada`; `Liderança estadual`; `Liderança federal`; `Coordenação territorial`; `Leitura informativa` | `src/features/diagnostic/diagnosticPresentation.js` | `GOVERNANCE_LABELS` | linha do item | catálogo | ocultar | — | nunca como etiqueta ou nome acessível | responsabilidade é explicada por frase pública quando necessária | classificação preservada internamente | B2 |
| T067 | `Ação municipal direta`; `Ação municipal com coordenação`; `Coordenação intergovernamental`; `Investigar dado ou oferta`; `Preservar resultado`; `Monitorar`; `Evidência insuficiente` | mesmo | `DECISION_LABELS` | linha do item/investigação | catálogo | ocultar | — | nunca como segunda etiqueta | o título do grupo já comunica a decisão pública | coleção preservada internamente | B2 |
| T068 | `{tema do indicador}` | `DiagnosticPanel.jsx`/contrato | chip de área | item decisório | contrato | manter | nomes públicos do §13 | mostrar quando mais de um tema estiver no mesmo grupo | omitir chip redundante | taxonomia não altera seleção | B2 |
| T069 | `Evidência {alta, média, baixa ou insuficiente}` | `src/components/DiagnosticPanel.jsx` | chip | item decisório | helper | ocultar | — | nunca | sem chip substituto | nível fica interno | B2 |
| T070 | `Atual {valor}` | `src/components/DiagnosticPanel.jsx` | trio de valores | item decisório | helper | reescrever | `Resultado do município: {valor} em {ano}` | valor, unidade, ano, nome público e fonte oficial presentes | omitir silenciosamente o item sem resultado publicável | exibir unidade compreensível | B2 |
| T071 | `Referência {valor}` | `src/components/DiagnosticPanel.jsx` | trio de valores | item decisório | helper | reescrever | `Meta do PNE {valor}` ou `{tipo de referência}: {valor}` | natureza e valor válidos | omitir se só houver referência interna | regras do §12 | B2 |
| T072 | `Distância {valor}` | `src/components/DiagnosticPanel.jsx` | trio de valores | item decisório | helper | reescrever | `Faltam {valor}` / `Supera em {valor}` | comparação válida | omitir se não calculável | respeitar direção | B2 |
| T073 | `Ver evidências e limitações` | `src/components/DiagnosticPanel.jsx` | disclosure | item decisório | literal | reescrever | `Ver dados e fontes` | houver conteúdo público adicional | omitir disclosure vazio | não esconder informação essencial apenas no disclosure | B4 |
| T074 | 15 razões de evidência e fallback `limitação metodológica registrada` / `sem razão adicional registrada` | `src/features/diagnostic/diagnosticPresentation.js` | `EVIDENCE_REASON_LABELS` | disclosure | catálogo | somente interno | — | nunca | sem frase substituta | códigos e rótulos permanecem auditáveis | B2 |
| T075 | `Comparação formada atualmente pelo porte da oferta do indicador. Outros atributos municipais ainda não integram o pareamento.` | `src/components/DiagnosticPanel.jsx` | disclosure | pares | literal | reescrever | `Municípios com oferta educacional de tamanho semelhante.` | comparação de pares exibida e validada | omitir sem pares | registrar método e relaxamentos internamente | B3 |
| T076 | `Referência RS {valor} em {ano}.` | `src/components/DiagnosticPanel.jsx` | disclosure | fonte comparativa | helper | reescrever | `Rio Grande do Sul: {valor} em {ano}.` | comparação válida | omitir | método vai a fontes | B3 |
| T077 | seis rótulos de fonte do contrato | contrato/`DiagnosticPanel.jsx` | `sourceNote` | disclosure e cópia | contrato | mover para fontes | ver §15 | somente fontes efetivamente usadas | registrar fonte ausente sem expor código | periodicidade e proveniência ficam associadas | B4 |
| T078 | `Fonte não declarada no recorte carregado.` | `src/components/DiagnosticPanel.jsx` | disclosure | fallback de fonte | literal | somente interno | — | nunca | resultado sem fonte oficial é omitido silenciosamente | tratar como pendência de qualidade | B4 |
| T079 | `Nota metodológica: {primeira flag}` — 16 variantes hoje alcançáveis em ação/articulação | contrato/`DiagnosticPanel.jsx` | `MethodNote` | disclosure | contrato | somente interno | — | nunca na v1.1 | sem mensagem substituta | preservar as 16 flags no contrato | B4 |
| T080 | `{n} indicadores precisam de investigação antes de orientar uma ação.` | `src/components/DiagnosticPanel.jsx` | `InvestigationBand` | faixa de investigação | helper | ocultar | — | nunca | não renderizar faixa, contagem ou espaço | contagem permanece no contrato | B2 |
| T081 | `Consultar grupos de limitações` | mesmo | disclosure | investigação | literal | ocultar | — | nunca | não renderizar disclosure | controle permanece interno | B2 |
| T082 | `Metodologia ou referência ainda incompatível`; `Dado municipal indisponível`; `Indicador informativo ou proxy`; `Oferta ou componentes que exigem validação local` | `src/features/diagnostic/diagnosticPresentation.js` | `INVESTIGATION_GROUPS` | títulos | catálogo | somente interno | — | nunca | sem título ou grupo público | agrupamentos seguem úteis para auditoria | B2 |
| T083 | quatro descrições dos grupos de investigação | mesmo | `INVESTIGATION_GROUPS` | descrições | catálogo | somente interno | — | nunca | sem descrição pública | preservar integralmente no módulo interno | B2 |
| T084 | `Exemplos: {indicadores}.` | `src/components/DiagnosticPanel.jsx` | investigação | exemplos | helper | ocultar | — | nunca | sem exemplos públicos | indicadores descritivos seguem a regra do §5.2 | B2 |
| T085 | `Nenhum indicador neste grupo.` | mesmo | investigação | vazio | literal | ocultar | — | nunca | não renderizar grupo nem mensagem | — | B2 |
| T086 | `Consultar evidências e limitações` | mesmo | investigação | disclosure | literal | ocultar | — | nunca | não renderizar disclosure | — | B2 |
| T087 | `{decisão} · evidência {nível}` | mesmo | investigação | item | helper | somente interno | — | nunca | sem item ou nome acessível derivado da classificação | classificação interna | B2 |
| T088 | `Nenhuma evidência adicional neste grupo.` | mesmo | investigação | vazio | literal | ocultar | — | nunca | sem estado vazio público | — | B2 |
| T089 | `alta`; `média`; `baixa`; `insuficiente` | mesmo | `evidenceLevelLabel` | chips/frases | catálogo | somente interno | — | nunca | sem chip, frase ou nome acessível | níveis internos | B2 |
| T090 | `Resultados a preservar e acompanhar` | `src/components/DiagnosticPanel.jsx` | resultados | `h3` | literal | reescrever | `Resultados a manter e acompanhar` | ao menos um dos grupos não vazio | omitir seção inteira se ambos vazios | — | B2 |
| T091 | `Resultados com referência atingida, separados pelo nível de evidência recebido do pipeline.` | mesmo | resultados | descrição | literal | reescrever | `Resultados que devem ser mantidos ou acompanhados pela gestão.` | seção visível | omitir com a seção | grupos vêm de coleções distintas | B2 |
| T092 | `Preservar` | mesmo | resultados | grupo | literal | reescrever | `Resultados a manter` | grupo não vazio | omitir grupo | mapeia `preservationItems` | B2 |
| T093 | `Nenhum resultado com evidência alta neste recorte.` | mesmo | resultados | vazio | literal | ocultar | — | nunca | omitir grupo sem mensagem nem espaço reservado | — | B2 |
| T094 | `Acompanhar` | mesmo | resultados | grupo | literal | reescrever | `Resultados para acompanhar` | grupo não vazio | omitir grupo | mapeia `monitoringItems` | B2 |
| T095 | `Nenhum resultado em acompanhamento neste recorte.` | mesmo | resultados | vazio | literal | ocultar | — | nunca | omitir grupo sem mensagem nem espaço reservado | — | B2 |
| T096 | `Resultado {valor}; referência quantitativa atingida {diferença}` / `Resultado {valor}; {status}` | `src/features/diagnostic/diagnosticPresentation.js` | `formatPreservedNote` | item preservado | helper | reescrever | `Resultado do município: {valor} em {ano}. Resultado a manter.` | valor, unidade, ano, nome público e fonte oficial presentes | omitir complemento não calculável ou o item sem requisitos públicos | não publicar status técnico | B2 |
| T097 | `Situação por tema` | `src/components/DiagnosticPanel.jsx` | temas | título | literal | manter | mesmo texto | ao menos um tema com resultado | omitir seção vazia | — | B2 |
| T098 | `Resultados, ação municipal, pactuação e investigação recebidos do pipeline.` | mesmo | temas | descrição | literal | reescrever | `Resumo dos resultados e das possibilidades de atuação em cada tema.` | seção visível | omitir com a seção | não expor investigação | B2 |
| T099 | `Visão estrutural` | mesmo | temas | kicker | literal | ocultar | — | nunca | sem substituto | não acrescenta significado | B2 |
| T100 | status temáticos `Sem dados`; `Sem comparação válida`; `Situação comparável mista`; `Lacunas comparáveis`; `Referências atingidas` e suas cinco leituras | `src/features/diagnostic/diagnosticPresentation.js` | `THEME_STATUS` | card temático | catálogo | reescrever | `Resultados variados`; `Resultados para acompanhar`; `Resultados a manter` | somente estado público não vazio | omitir card ou leitura ausente, sem rótulo substituto | manter todos os códigos e motivos internos | B2 |
| T101 | `Indicadores analisados` | `src/components/DiagnosticPanel.jsx` | card temático | métrica | literal | reescrever | `Resultados` | card visível e contagem maior que zero | omitir métrica zerada | valor atual é `available` | B2 |
| T102 | `Referências atingidas` | mesmo | card temático | métrica | literal | reescrever | `Metas ou resultados esperados alcançados` | contagem maior que zero | omitir métrica zerada | separar meta/referência na evolução futura | B2 |
| T103 | `Ação municipal` | mesmo | card temático | métrica | literal | reescrever | `Município pode agir` | contagem maior que zero | omitir métrica zerada | coleção interna | B2 |
| T104 | `Pactuação` | mesmo | card temático | métrica | literal | reescrever | `Depende de parceria` | contagem maior que zero | omitir métrica zerada | coleção interna | B2 |
| T105 | `Investigação` | mesmo | card temático | métrica | literal | ocultar | — | nunca | sem contador, nome acessível, zero ou espaço | contagem permanece interna | B2 |
| T106 | `Não há referência estadual metodologicamente comparável para os indicadores apresentados.` | `src/components/DiagnosticPanel.jsx` | `MethodNote` | após resultados | literal | ocultar | — | nunca na camada pública | omitir a seção estadual sem mensagem | motivo técnico fica somente na auditoria interna | B3 |
| T107 | `Dado ausente`; `Indicador informativo`; `Indicador proxy`; `Comparação pendente`; `Comparação incompatível`; `Valor fora do domínio`; `Dado não verificável`; `Referência atingida`; `Lacuna comparável`; fallback `Estado metodológico não informado` | `src/features/diagnostic/diagnosticPresentation.js` | `PRESENTATION_STATUS_LABELS` | investigação/resultado | catálogo | somente interno | — | nunca como status público | resultado descritivo segue o §5.2 independentemente do grupo; sem requisitos, omitir o item | códigos permanecem no contrato | B2 |
| T108 | `Referência já atingida`; `Ritmo suficiente`; `Ritmo insuficiente`; `Movimento desfavorável`; `Ritmo estável`; `Histórico insuficiente`; `Ritmo não aplicável` | mesmo | `PACE_STATUS_LABELS` | evolução | catálogo | reescrever | `O resultado melhorou nos últimos anos.`; `O resultado permaneceu próximo do mesmo nível.`; `O resultado piorou nos últimos anos.` | histórico suficiente e leitura validada | omitir estados insuficiente ou não aplicável | não inferir causalidade | B3 |
| T109 | `Projeção de tendência`; `Cenário de manutenção`; `Trajetória necessária`; `Tendência histórica`; `Sem cenário` | mesmo | `SCENARIO_LABELS` | evolução | catálogo | reescrever | `Se a evolução recente continuar, o município pode alcançar a meta em {ano}.`; `No ritmo recente, o resultado não alcançaria a meta até {ano}.` | cenário, ano, valor ou leitura e meta válidos | omitir qualquer cenário sem validação | incerteza não estimada deve impedir certeza verbal | B3 |
| T110 | `não calculável`; `não disponível`; `—` | mesmo | formatadores | valores | helper | ocultar | — | nunca como conteúdo público | omitir medida, item ou seção, inclusive nos nomes acessíveis; nunca converter em zero | distinguir motivo internamente | B4 |
| T111 | `DIAGNÓSTICO MUNICIPAL — {município}` | `src/features/diagnostic/diagnosticPresentation.js` | `buildAccountabilityText` | síntese copiada | helper | reescrever | `DIAGNÓSTICO EDUCACIONAL — {município}` | cópia acionada | — | mesma linguagem da tela | B1 |
| T112 | `PNE 2026–2036` | mesmo | síntese copiada | contexto | literal | reescrever | `Plano Nacional de Educação (PNE) 2026–2036` | cópia acionada | — | primeira ocorrência da sigla também é expandida no conteúdo copiado | B1 |
| T113 | `Síntese para decisão` | mesmo | síntese copiada | título | literal | reescrever | `Resumo do diagnóstico` | cópia acionada | — | — | B1 |
| T114 | `Ação municipal — {indicador}: atual..., referência..., distância...` | mesmo | síntese copiada | linha | helper | reescrever | `Resultados em que o município pode agir — {indicador}: resultado..., meta ou resultado esperado..., faltam ou supera...` | item público de ação | omitir linha ausente | mesmas regras da tela | B2 |
| T115 | `Pactuação — {indicador}: {responsabilidade}` | mesmo | síntese copiada | linha | helper | reescrever | `Resultados que dependem de parceria — {indicador}: {responsabilidade em linguagem pública}.` | item público de coordenação | omitir linha ausente | — | B2 |
| T116 | `Nenhuma ação municipal elegível nesta síntese.` | mesmo | síntese copiada | vazio | literal | ocultar | — | nunca | não incluir linha substituta na cópia ou impressão | — | B2 |
| T117 | `Fontes: {lista}.` | mesmo | síntese copiada | fontes | helper | manter | mesmo padrão com nomes públicos normalizados | todos os resultados copiados têm fonte oficial | resultado sem fonte é omitido, sem fallback | lista deduplicada | B4 |
| T118 | `Fontes: não declaradas no contrato.` | mesmo | síntese copiada | fallback | literal | somente interno | — | nunca | resultado sem fonte oficial é omitido silenciosamente | pendência de qualidade | B4 |
| T119 | `Nota: triagem descritiva por evidência; não constitui ranking final.` | mesmo | síntese copiada | nota | literal | ocultar | — | nunca | sem nota substituta na cópia ou impressão | ordem recebida não implica prioridade | B2 |
| T120 | `Carregando dados...` | `src/components/LoadingState.jsx` | fallback compartilhado | fallback não usado pela rota hoje | literal | manter | mesmo texto no componente genérico; a rota usa T001 | somente em consumidores sem mensagem contextual | — | fora da mudança específica | B4 |
| T121 | `Não foi possível carregar os dados.` | `src/components/ErrorState.jsx` | fallback compartilhado | fallback não usado pela rota hoje | literal | manter | mesmo texto no componente genérico; a rota usa T002 | somente em consumidores sem título contextual | — | fora da mudança específica | B4 |

## 9. Inventário dos elementos públicos

| Família de elemento | Implementação atual | Contrato futuro | Classificação | Regra de vazio/ausência |
|---|---|---|---|---|
| título de página (`h1`) | município + “metas e pontos de atenção” | título editorial “Diagnóstico educacional de {município}” | texto muda | estado integral usa título próprio, sem montar o relatório |
| subtítulos e introduções | descrevem indicadores, pipeline e triagem | promessa pública e explicações orientadas à gestão | texto muda | omitir junto com a seção correspondente |
| contadores de síntese | quatro cards, incluindo investigação | até quatro contadores: `Município pode agir`, `Depende de parceria`, `Acompanhar` e `Manter` | texto muda; investigação desaparece | exibir somente contadores maiores que zero |
| badges/chips | tema, evidência e status técnico | tema somente quando necessário; nenhum nível de evidência | parte permanece; parte desaparece | não renderizar chip vazio ou redundante |
| cards de decisão | ação, coordenação e faixa de investigação | `Resultados em que o município pode agir` e `Resultados que dependem de parceria` | texto e composição mudam; investigação desaparece | grupo vazio é omitido |
| cards de resultado | preservar, acompanhar e situação por tema | `Resultados a manter` e `Resultados para acompanhar` | permanece; texto muda | grupo/card sem resultado publicável é omitido |
| disclosures | evidências/limitações e quatro grupos de investigação | opcional “Ver dados e fontes” por resultado | parte desaparece; parte muda | disclosure sem conteúdo público não existe |
| tabelas | não há tabela HTML na rota atual | nenhuma tabela exigida por este contrato | permanece ausente | não criar tabela vazia |
| notas | rodapé técnico, aviso territorial, notas metodológicas | apenas explicação pública indispensável junto ao resultado | desaparece ou muda | omitir nota sem conteúdo |
| tooltips | `title` nativo em títulos longos e botões de tema | texto principal deve quebrar; nome acessível completo permanece | permanece apenas como apoio acessível | nunca ser a única fonte do texto |
| barras de progresso | não existem na composição DF2 atual | não criar barra para representar distância ou classificação | permanece ausente | — |
| gráficos e legendas | não existem na rota atual | evolução pode ser textual na primeira implementação; gráfico exige etapa específica | permanece ausente nesta contratação | não criar legenda sem visualização |
| links | fontes oficiais da DF2 | links oficiais em fontes; foco visível e nome descritivo | permanece | lista inteira omitida quando não houver fonte/programa DF2 |
| fontes | no disclosure dos itens, na cópia e no encerramento DF2 | `Fontes das informações`, com `Resultados educacionais` e, quando a DF2 existir, `Programas que podem apoiar as melhorias` | move/consolida | resultado sem fonte oficial é omitido silenciosamente; nunca inventar fonte |
| estados vazios locais | frases para quase todos os grupos | omissão silenciosa de valor, item, grupo, seção, comparação, trajetória, fonte dependente e programa | desaparece | sem mensagem, zero, travessão ou espaço reservado |
| loading | estado compartilhado com mensagem municipal | frase contextual e anúncio polido | texto muda | não simular dados |
| erro | título + mensagem técnica bruta | `Não foi possível abrir o diagnóstico agora. Tente novamente.` e, quando possível, botão `Tentar novamente` | texto muda; detalhe técnico fica interno | mantém `role="alert"` |
| ausência integral | revela contrato canônico/versão | mesmo estado operacional de erro | texto muda | não montar seções parciais |
| navegação interna | foi removida; não existe hoje | continua ausente | permanece ausente | ordem linear é a navegação |
| ações copiar/imprimir | dois botões no cabeçalho | permanecem | permanece; síntese copiada muda | impressão/cópia seguem exatamente o vocabulário público |
| região viva | sucesso/erro de cópia | permanece com mensagem curta | permanece; erro muda | vazia fora do evento |
| ícones decorativos | SVGs com `aria-hidden` | permanecem auxiliares | permanece | não substituem texto |

O contrato não autoriza criação de nova família visual. A futura DF3-B deve reutilizar os componentes, tokens, foco, estados e superfícies já aprovados; esta etapa define conteúdo e visibilidade.

## 10. Comparações com RS e municípios semelhantes

### 10.1 Rio Grande do Sul

Uma comparação estadual só pode ser publicada quando o contrato já indicar comparabilidade, valor municipal, valor estadual, unidade e mesmo ano. O React não escolhe ano, não harmoniza série e não calcula direção.

Formato:

- título: **Comparação com o Rio Grande do Sul**;
- valores: **{Município}: {valor} em {ano}** e **Rio Grande do Sul: {valor} em {ano}**;
- leitura percentual acima: **O resultado do município está 4,2 pontos percentuais acima do resultado do Rio Grande do Sul.**;
- leitura percentual abaixo: **O resultado do município está 4,2 pontos percentuais abaixo do resultado do Rio Grande do Sul.**;
- leitura próxima: **O resultado do município está próximo do resultado do Rio Grande do Sul.**;
- quando a unidade não for percentual, substituir “pontos percentuais” pela unidade pública correta;
- sem comparação válida, omitir a comparação integralmente, sem texto substituto.

### 10.2 Municípios de oferta semelhante

Na metodologia atual, o caso publicável usa somente `offering_size` quando `usesOfferingSizeOnly` é verdadeiro. A formulação homologada é:

> Municípios com oferta educacional de tamanho semelhante.

Uma posição percentual só pode ser apresentada quando sua equivalência matemática tiver sido confirmada e testada. Até essa confirmação, usar uma leitura qualitativa validada ou omitir a comparação. Não publicar ordinal, ranking, “primeiro”, “principal”, “melhor”, “pior” nem atributos de semelhança que o método não utilize.

`cohortSize`, `featuresUsed`, `relaxationCodes`, cobertura, relaxamentos e códigos de indisponibilidade permanecem internos.

### 10.3 Regra de não ranqueamento

A composição pode apresentar resultado, meta ou resultado esperado, comparação estadual, comparação com municípios de oferta semelhante e evolução recente. Essa sequência organiza a leitura; não atribui prioridade, importância ou posição. Nenhuma comparação altera a ordem recebida nas coleções.

## 11. Evolução, ritmo e trajetória

| Estado interno | Saída pública | Condição | Omissão |
|---|---|---|---|
| `target_already_met` | — | — | omitir a frase de trajetória; o resultado pode aparecer em `Resultados a manter` |
| `sufficient` | `Se a evolução recente continuar, o município pode alcançar a meta em {ano}.` | série, meta, ano e projeção válidos | omitir se faltar qualquer requisito |
| `insufficient` | `No ritmo recente, o resultado não alcançaria a meta até {ano}.` | série e projeção válidas | omitir se a incerteza impedir a conclusão |
| `moving_away` | `O resultado piorou nos últimos anos.` | direção validada e histórico suficiente | omitir com histórico curto |
| `stable` | `O resultado permaneceu próximo do mesmo nível.` | estabilidade definida pelo pipeline | omitir se não houver período público |
| `insufficient_history` | — | — | omissão pública |
| `not_applicable` | — | — | omissão pública |
| `trend_projection` | usar uma das duas frases condicionais acima | cenário, meta e ano válidos | omitir cenário não validado |
| `component_maintenance` | — | — | omissão pública na v1.1 |
| `required_trajectory` | — | — | omissão pública na v1.1 |
| `historical_trend_only` | `O resultado melhorou nos últimos anos.`; `O resultado permaneceu próximo do mesmo nível.`; ou `O resultado piorou nos últimos anos.` | série e direção suficientes | omitir se a leitura não for validada |
| `not_available` | — | — | omissão pública |

Regras adicionais:

- projeções usam somente as duas formulações condicionais homologadas na tabela;
- não publicar `uncertainty: not_estimated`, modelo, qualidade, códigos de alerta ou versão de regra;
- ano base, ano-alvo e período observado devem estar disponíveis em “Dados e fontes” quando a evolução for mostrada;
- trajetória necessária permanece interna nesta versão;
- não usar cor, seta ou “favorável/desfavorável” sem a frase textual correspondente.

## 12. Meta, referência e resultado esperado

| Conceito | Quando usar | Rótulo público | Não usar como |
|---|---|---|---|
| meta oficial do PNE | alvo quantitativo com validação legal e comparação elegível | `Meta do PNE: {valor} até {ano}` | referência estadual, configuração legada ou cenário |
| marco intermediário oficial | alvo oficial anterior ao final do ciclo | `Marco do PNE: {valor} até {ano}` | meta final |
| referência de planejamento | valor configurado que não é meta oficial validada | `Referência de planejamento: {valor} em {ano}` | `Meta` |
| resultado esperado | direção ou patamar compreensível sem alegação legal | `Resultado esperado: {descrição}` | substituto numérico inventado |
| resultado estadual | contexto comparativo válido | `Rio Grande do Sul: {valor} em {ano}` | meta do município |
| municípios semelhantes | contexto relativo | `Municípios com oferta educacional de tamanho semelhante: {leitura}` | ranking ou meta |
| resultado municipal | observação publicada | `Resultado do município: {valor} em {ano}` | desempenho da prefeitura sem qualificação |
| quanto falta/supera | diferença já validada | `Faltam {valor}` / `Supera a meta em {valor}` | “distância favorável” ou diferença sem direção |

Se a correspondência legal for parcial, proxy, incompatível ou pendente, a interface não deve promover a referência configurada a “meta”. A informação pode permanecer descritiva sem trio Atual–Referência–Distância ou ser omitida da decisão, conforme as coleções recebidas.

## 13. Indicadores e nomes públicos

As linhas desta seção continuam o inventário do §8. Os cinco temas são derivados do contrato e os 49 indicadores vêm do catálogo canônico. A simplificação do nome não altera ID, fórmula, unidade, universo, fonte ou correspondência legal.

Em todas as linhas T205–T253, “item publicável” e “item descritivo publicável” exigem cumulativamente valor, unidade compreensível, ano, nome público e fonte oficial. A presença do indicador em `investigationItems` não impede sua exibição descritiva na visão geral quando esses cinco requisitos estão presentes; impede apenas que a classificação interna gere decisão, ação, parceria, recomendação, comparação não validada ou projeção. Se qualquer requisito faltar, o resultado é omitido silenciosamente.

| Nº | Texto atual | Arquivo | Componente/função | Contexto da página | Origem | Decisão | Texto proposto | Condição de exibição | Comportamento sem dado/vazio | Nota metodológica interna | Fase futura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T200 | `Atendimento escolar` | contrato | tema | filtro/card/chip | contrato | manter | mesmo texto | tema com resultado público | omitir tema vazio | ID `atendimento` | B1 |
| T201 | `Aprendizagem e desempenho` | contrato | tema | filtro/card/chip | contrato | reescrever | `Aprendizagem` | tema com resultado público | omitir tema vazio | ID `rendimento` é interno | B1 |
| T202 | `Corpo docente` | contrato | tema | filtro/card/chip | contrato | reescrever | `Profissionais da educação` | tema com resultado público | omitir tema vazio | ID `corpo_docente` | B1 |
| T203 | `Infraestrutura escolar` | contrato | tema | filtro/card/chip | contrato | manter | mesmo texto | tema com resultado público | omitir tema vazio | — | B1 |
| T204 | `Escolaridade da população` | contrato | tema | filtro/card/chip | contrato | manter | mesmo texto | tema com resultado público | omitir tema vazio | — | B1 |
| T205 | `População de 0 a 3 anos que frequenta a escola/creche` | catálogo/contrato | título de indicador | resultados | catálogo | reescrever | `Crianças de 0 a 3 anos que frequentam creche ou escola` | item publicável | omitir item sem resultado | matrícula localizada × população residente | B1 |
| T206 | `População de 4 a 5 anos que frequenta a escola/creche` | mesmo | título | resultados | catálogo | reescrever | `Crianças de 4 e 5 anos que frequentam pré-escola` | item publicável | omitir item sem resultado | mesma base territorial mista | B1 |
| T207 | `População de 6 a 17 anos que frequenta a educação básica` | mesmo | título | resultados | catálogo | reescrever | `Crianças e adolescentes de 6 a 17 anos que frequentam a educação básica` | item publicável | omitir item sem resultado | — | B1 |
| T208 | `Matrículas da educação básica de estudantes de 15 a 17 anos em relação à população da faixa` | mesmo | título | resultados | catálogo | reescrever | `Estudantes de 15 a 17 anos matriculados na educação básica` | item publicável | omitir item sem resultado | referência legada não é meta oficial | B1 |
| T209 | `Alunos do público-alvo da ETI em jornada integral na rede pública` | mesmo | título | resultados | catálogo | reescrever | `Estudantes da educação básica pública em jornada integral` | item publicável | omitir item sem resultado | expandir ETI | B1 |
| T210 | `Escolas públicas com alunos em jornada de tempo integral` | mesmo | título | resultados | catálogo | manter | mesmo texto | item publicável | omitir item sem resultado | — | B1 |
| T211 | `Oferta de AEE e salas de recursos na educação especial` | mesmo | título | resultados | catálogo | reescrever | `Oferta de atendimento educacional especializado e salas de recursos` | item descritivo publicável | não usar na decisão quando investigação | medida aproximada, denominador não mede o público-alvo | B1 |
| T212 | `Percentual das matrículas da EJA articuladas à educação profissional` | mesmo | título | resultados | catálogo | reescrever | `Matrículas da educação de jovens e adultos integradas à educação profissional` | item publicável | omitir item sem resultado | expandir EJA na primeira ocorrência | B1 |
| T213 | `Ensino médio articulado à educação profissional técnica` | mesmo | título | resultados | catálogo | reescrever | `Matrículas do ensino médio integradas à educação profissional técnica` | item publicável | omitir item sem resultado | integradas são o numerador principal | B1 |
| T214 | `Participação acumulada do segmento público na expansão da EPT de nível médio` | mesmo | título | resultados | catálogo | reescrever | `Participação da rede pública no crescimento da educação profissional técnica de nível médio` | item publicável | omitir item sem resultado | expandir EPT; contexto pré-ciclo quando aplicável | B1 |
| T215 | `Expansão acumulada das matrículas em cursos técnicos subsequentes` | mesmo | título | resultados | catálogo | reescrever | `Crescimento das matrículas em cursos técnicos subsequentes` | item publicável | omitir item sem resultado | meta absoluta e linha de base | B1 |
| T216 | `Estudantes alfabetizados na rede pública` | mesmo | título | resultados | catálogo | manter | mesmo texto | item publicável somente após confirmação da fonte oficial | omitir item enquanto a proveniência estiver pendente | proveniência pendente não pode ir à camada pública | B1 |
| T217 | `Desempenho em Matemática - anos iniciais` | mesmo | título | resultados | catálogo | reescrever | `Aprendizagem em Matemática nos anos iniciais` | item descritivo publicável | omitir item sem resultado | Saeb não mede sozinho toda a meta | B1 |
| T218 | `Desempenho em Matemática - anos finais` | mesmo | título | resultados | catálogo | reescrever | `Aprendizagem em Matemática nos anos finais` | item descritivo publicável | omitir item sem resultado | mesma ressalva | B1 |
| T219 | `Desempenho em Matemática - ensino médio` | mesmo | título | resultados | catálogo | reescrever | `Aprendizagem em Matemática no ensino médio` | item descritivo publicável | omitir item sem resultado | mesma ressalva | B1 |
| T220 | `Desempenho em Português - anos iniciais` | mesmo | título | resultados | catálogo | reescrever | `Aprendizagem em Língua Portuguesa nos anos iniciais` | item descritivo publicável | omitir item sem resultado | mesma ressalva | B1 |
| T221 | `Desempenho em Português - anos finais` | mesmo | título | resultados | catálogo | reescrever | `Aprendizagem em Língua Portuguesa nos anos finais` | item descritivo publicável | omitir item sem resultado | mesma ressalva | B1 |
| T222 | `Desempenho em Português - ensino médio` | mesmo | título | resultados | catálogo | reescrever | `Aprendizagem em Língua Portuguesa no ensino médio` | item descritivo publicável | omitir item sem resultado | mesma ressalva | B1 |
| T223 | `Estudantes que concluem os anos iniciais na idade regular` | mesmo | título | resultados | catálogo | manter | mesmo texto | item publicável | omitir item sem resultado | — | B1 |
| T224 | `Estudantes que concluem os anos finais na idade regular` | mesmo | título | resultados | catálogo | manter | mesmo texto | item publicável | omitir item sem resultado | — | B1 |
| T225 | `Estudantes que concluem o ensino médio na idade regular` | mesmo | título | resultados | catálogo | manter | mesmo texto | item publicável | omitir item sem resultado | — | B1 |
| T226 | `Docentes com formação adequada nos anos iniciais` | mesmo | título | resultados | catálogo | reescrever | `Professores com formação adequada nos anos iniciais` | item publicável | omitir item sem resultado | recorte parcial da meta | B1 |
| T227 | `Docentes com formação adequada nos anos finais` | mesmo | título | resultados | catálogo | reescrever | `Professores com formação adequada nos anos finais` | item publicável | omitir item sem resultado | recorte parcial da meta | B1 |
| T228 | `Docentes com formação adequada no ensino médio` | mesmo | título | resultados | catálogo | reescrever | `Professores com formação adequada no ensino médio` | item publicável | omitir item sem resultado | recorte parcial da meta | B1 |
| T229 | `Docentes da educação básica com pós-graduação` | mesmo | título | resultados | catálogo | reescrever | `Professores da educação básica com pós-graduação` | item publicável | omitir item sem resultado | valores acima de 100% exigem revisão | B1 |
| T230 | `Rendimento do magistério em relação a outros profissionais com nível superior` | mesmo | título | resultados | catálogo | reescrever | `Rendimento médio dos professores em comparação com outros profissionais de nível superior` | item publicável somente após confirmação da fonte oficial | omitir item enquanto a proveniência estiver pendente | proveniência pendente bloqueia toda exibição pública | B1 |
| T231 | `Docentes da rede pública com contrato temporário` | mesmo | título | resultados | catálogo | reescrever | `Professores temporários na rede pública` | item publicável | omitir item sem resultado | menor percentual é melhor | B1 |
| T232 | `Escolas da educação básica com acesso à internet` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | não mede qualidade/velocidade | B1 |
| T233 | `Escolas com internet disponível para os alunos` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | — | B1 |
| T234 | `Escolas com internet usada na aprendizagem` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | — | B1 |
| T235 | `Escolas com internet aberta à comunidade` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | — | B1 |
| T236 | `Escolas com acesso dos alunos à internet por computador` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | — | B1 |
| T237 | `Escolas com acesso dos alunos à internet por dispositivos pessoais` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | não mede oferta pública universal | B1 |
| T238 | `Escolas com rede local de computadores` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | — | B1 |
| T239 | `Escolas com rede local sem fio` | mesmo | título | resultados | catálogo | reescrever | `Escolas com rede sem fio (Wi-Fi)` | item descritivo publicável | omitir item sem resultado | medida não avalia qualidade/cobertura | B1 |
| T240 | `Escolas com internet banda larga` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | não mede velocidade efetiva | B1 |
| T241 | `Escolas que promovem educação ambiental` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | resposta declaratória | B1 |
| T242 | `Escolas públicas com conselho escolar instituído e em funcionamento` | mesmo | título | resultados | catálogo | manter | mesmo texto | item publicável | omitir item sem resultado | resposta declaratória | B1 |
| T243 | `Escolas públicas com projeto político pedagógico` | mesmo | título | resultados | catálogo | reescrever | `Escolas públicas com projeto político-pedagógico` | item descritivo publicável | omitir item sem resultado | existência não mede qualidade do processo | B1 |
| T244 | `Salas de aula climatizadas` | mesmo | título | resultados | catálogo | manter | mesmo texto | item publicável | omitir item sem resultado | medida parcial de conforto térmico | B1 |
| T245 | `Salas de aula com acessibilidade` | mesmo | título | resultados | catálogo | reescrever | `Salas de aula acessíveis` | item publicável | omitir item sem resultado | não mede toda a acessibilidade escolar | B1 |
| T246 | `Escolas com computadores de mesa para alunos` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | não mede suficiência por estudante | B1 |
| T247 | `Escolas com computadores portáteis para alunos` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | mesma ressalva | B1 |
| T248 | `Escolas com tablets para alunos` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | mesma ressalva | B1 |
| T249 | `Taxa de alfabetização da população de 15 anos ou mais` | mesmo | título | resultados | catálogo | manter | mesmo texto | item publicável | omitir item sem resultado | Censos 2010/2022, não série anual | B1 |
| T250 | `População de 18 anos ou mais com ensino fundamental concluído` | mesmo | título | resultados | catálogo | manter | mesmo texto | item descritivo publicável | omitir item sem resultado | universo difere da referência legal de 15+ | B1 |
| T251 | `População de 15 a 29 anos com ensino fundamental concluído` | mesmo | título | resultados | catálogo | manter | mesmo texto | item publicável | omitir item sem resultado | — | B1 |
| T252 | `População de 18 anos ou mais com ensino médio concluído` | mesmo | título | resultados | catálogo | manter | mesmo texto | item publicável | omitir item sem resultado | — | B1 |
| T253 | `População de 18 a 29 anos com ensino médio concluído` | mesmo | título | resultados | catálogo | manter | mesmo texto | item publicável | omitir item sem resultado | — | B1 |

## 14. Omissão e estados vazios

| Situação | Comportamento público | Texto, quando necessário |
|---|---|---|
| `municipalActionItems` vazio | omitir o grupo | nenhum |
| `coordinationItems` vazio | omitir o grupo | nenhum |
| `investigationItems` com ou sem itens | sempre omitir | nenhum |
| `monitoringItems` vazio | omitir o grupo | nenhum |
| `preservationItems` vazio | omitir o grupo | nenhum |
| ambos os grupos decisórios vazios | omitir “Como a gestão pode atuar” | nenhum |
| ambos os grupos de resultado vazios | omitir “Resultados a manter e acompanhar” | nenhum |
| tema sem resultado publicável | omitir card e opção do filtro | nenhum |
| filtro selecionado deixa de ser válido após mudança de município/dados | redefinir automaticamente para `Todos os temas` | nenhum |
| sem comparação RS válida | omitir toda a seção estadual | nenhum |
| sem pares válidos | omitir a comparação de municípios semelhantes | nenhum |
| sem histórico/cenário suficiente | omitir evolução/ritmo/cenário | nenhum |
| valor, unidade, ano ou nome público ausente | omitir valor, item e qualquer estrutura que ficar vazia | nenhum |
| fonte oficial de um resultado ausente | omitir silenciosamente o resultado e seu conteúdo dependente | nenhum |
| DF2 sem programas | omitir bloco, fontes e espaço | nenhum; regra congelada |
| carregamento | manter estado de página e anúncio polido | `Carregando o diagnóstico de {município}…` |
| erro operacional recuperável | alerta simples e ação opcional | `Não foi possível abrir o diagnóstico agora. Tente novamente.` + botão `Tentar novamente`, quando tecnicamente possível |
| contrato ausente | mesmo estado operacional integral | `Não foi possível abrir o diagnóstico agora. Tente novamente.` |
| versão incompatível | mesmo estado operacional integral | `Não foi possível abrir o diagnóstico agora. Tente novamente.` |

A omissão não apaga dados: ela restringe a camada pública. Contrato, motivos, contagens e IDs permanecem disponíveis para auditoria e para correção de qualidade.

## 15. Fontes das informações

### 15.1 Estrutura pública

O encerramento usa exatamente esta hierarquia:

1. **Fontes das informações** — título da seção final;
2. **Resultados educacionais** — subseção obrigatória quando houver ao menos um resultado público;
3. **Programas que podem apoiar as melhorias** — subseção exibida somente quando o bloco DF2 estiver presente.

Cada resultado público exige fonte oficial. A fonte exibe somente órgão responsável, base, pesquisa ou relatório, ano ou período e link oficial. Não publicar fórmula, universo, denominador, código, flag, justificativa de ausência ou texto de proveniência pendente nessa seção.

As seis fontes atualmente presentes nos 497 contratos são:

| Rótulo atual | Decisão pública | Formulação/ação |
|---|---|---|
| `INEP — Censo Escolar` | manter | mostrar órgão, nome oficial da base, ano ou período e link oficial |
| `INEP — Saeb` | manter | mostrar órgão, nome oficial da pesquisa, ano ou período e link oficial |
| `IBGE — Censos Demográficos 2010 e 2022` | manter | mostrar órgão, nome oficial da pesquisa, período e link oficial |
| `Base municipal de população por idade` | reescrever antes de publicar | confirmar órgão responsável, título oficial, período e link oficial; até lá, omitir os resultados que dependem dela |
| `Fonte do indicador de alfabetização — proveniência pendente no pipeline` | somente interno | omitir o resultado até identificar a fonte oficial |
| `Fonte do rendimento docente — proveniência pendente no pipeline` | somente interno | omitir o resultado até identificar a fonte oficial |

### 15.2 Regras

- mostrar apenas fontes oficiais efetivamente usadas nos resultados públicos daquele município;
- incluir órgão responsável, base, pesquisa ou relatório, período/ano e link oficial;
- associar a explicação de percentuais acima de 100% aos indicadores de atendimento correspondentes;
- manter fórmulas, universos, denominadores, correspondência legal parcial, limitações e flags na camada interna;
- nunca usar SIOPE, SICONFI/FINBRA, VAAF, VAAT, VAAR, Salário-Educação ou QSE como fonte dos programas DF2; a exclusão homologada permanece;
- fonte ausente não é substituída por fonte presumida ou alternativa; o resultado é omitido silenciosamente;
- a síntese copiada usa os mesmos nomes públicos e a mesma lista deduplicada da tela.

## 16. Congelamento da DF2

A integração pública de programas homologada na DF2 é uma dependência congelada deste contrato. A DF3-A.1 não muda os 10 programas, as 26 relações, as 18 fontes, os textos de ação, os recortes, os vínculos, a ordem, os critérios de seleção, a consolidação nem a regra de omissão dos 11 municípios sem itens. A futura DF3-B pode adaptar somente o encaixe editorial das fontes ao §15, sem alterar a semântica do bloco.

Regras preservadas:

- a seção aparece depois dos resultados educacionais;
- cada programa aparece uma vez, com ações consolidadas e indicadores relacionados;
- somente `municipalActionItems` e `coordinationItems` alimentam o seletor homologado;
- os 11 municípios sem itens não recebem título, introdução, mensagem, fonte nem wrapper vazio;
- nenhum recurso geral, VAAR, valor financeiro ou fonte financeira excluída na DF1/DF2 é acrescentado;
- as fontes dos programas encerram o bloco e incluem somente referências efetivamente usadas.

O título principal **Programas que podem apoiar as melhorias** permanece semanticamente inalterado. A única mudança editorial futura autorizada é usar esse mesmo título como subtítulo da família de fontes correspondente.

As linhas abaixo completam o inventário iniciado no §8.

| Nº | Texto atual | Arquivo | Componente/função | Contexto da página | Origem | Decisão | Texto proposto | Condição de exibição | Comportamento sem dado/vazio | Nota metodológica interna | Fase futura |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T300 | `Apoio às ações educacionais` | `DiagnosticFinancingSection.jsx` | cabeçalho DF2 | kicker | literal | manter | mesmo texto | ao menos um programa | omitir bloco inteiro | DF2 congelada | B2 |
| T301 | `Programas que podem apoiar as melhorias` | mesmo | cabeçalho DF2 | `h2` | literal | manter | mesmo texto | ao menos um programa | omitir bloco inteiro | não promete elegibilidade financeira | B2 |
| T302 | `Com base nos resultados destacados no diagnóstico, estes programas podem apoiar ações na educação do município.` | mesmo | cabeçalho DF2 | introdução | literal | manter | mesmo texto | ao menos um programa | omitir bloco inteiro | relação sem recomendação individualizada | B2 |
| T303 | `Relacionado a:` | mesmo | ação de programa | vínculo | literal | manter | mesmo texto | ação com nome público relacionado | omitir vínculo sem nome resolvido | IDs nunca são exibidos | B2 |
| T304 | `Recortes de {programa}` | mesmo | lista de recortes | nome acessível | helper | manter | mesmo texto | recortes públicos não redundantes | omitir lista vazia | deduplicação textual preservada | B2 |
| T305 | `Referências oficiais` | mesmo | fontes DF2 | kicker | literal | ocultar | — | nunca na estrutura final de fontes | omitir sem espaço residual | ajuste exclusivamente editorial | B4 |
| T306 | `Fontes dos programas` | mesmo | fontes DF2 | `h2` | literal | reescrever | `Programas que podem apoiar as melhorias` | ao menos uma fonte usada e bloco DF2 presente | omitir subseção | conteúdo e fontes DF2 permanecem congelados | B4 |
| T307 | `PAR/Novo PAR` — `Apoia ações planejadas de infraestrutura e equipamentos educacionais.` | `publicFinancingCatalog.json` | programa | card DF2 | catálogo | manter | mesmo texto | programa selecionado | omitir card | fonte homologada | B2 |
| T308 | `Novo PAC Educação` — `Apoia obras de educação infantil e escolas destinadas ao tempo integral.` | mesmo | programa | card DF2 | catálogo | manter | mesmo texto | programa selecionado | omitir card | — | B2 |
| T309 | `PNATE` — `Apoia o transporte dos estudantes da educação pública que vivem na área rural.` | mesmo | programa | card DF2 | catálogo | manter | mesmo texto | programa selecionado | omitir card | sigla oficial preservada | B2 |
| T310 | `Caminho da Escola` — `Apoia a aquisição de veículos para o transporte escolar.` | mesmo | programa | card DF2 | catálogo | manter | mesmo texto | programa selecionado | omitir card | — | B2 |
| T311 | `PEATE/RS` — `Apoia o transporte de estudantes da rede estadual que vivem na área rural.` | mesmo | programa | card DF2 | catálogo | manter | mesmo texto | programa selecionado | omitir card | sigla oficial preservada | B2 |
| T312 | `Programa Escola em Tempo Integral` — `Apoia a criação, a manutenção e a qualificação de matrículas em jornada integral.` | mesmo | programa | card DF2 | catálogo | manter | mesmo texto | programa selecionado | omitir card | — | B2 |
| T313 | `PNAE` — `Apoia a alimentação dos estudantes da educação básica.` | mesmo | programa | card DF2 | catálogo | manter | mesmo texto | programa selecionado | omitir card | sigla oficial preservada | B2 |
| T314 | `PARFOR` — `Apoia a formação de professores da rede pública na área em que atuam.` | mesmo | programa | card DF2 | catálogo | manter | mesmo texto | programa selecionado | omitir card | sigla oficial preservada | B2 |
| T315 | `ProEB/CAPES` — `Apoia a pós-graduação de professores em exercício na rede pública.` | mesmo | programa | card DF2 | catálogo | manter | mesmo texto | programa selecionado | omitir card | nome oficial preservado | B2 |
| T316 | `PDDE` — `Apoia pequenos investimentos definidos pela escola ou por sua entidade executora.` | mesmo | programa | card DF2 | catálogo | manter | mesmo texto | programa selecionado | omitir card | sigla oficial preservada | B2 |
| T317 | `Pode apoiar obras e equipamentos para ampliar a oferta pública de creche.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | vínculo validado na DF1 | B2 |
| T318 | `Pode apoiar a construção de unidades de educação infantil para ampliar a oferta de creche.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T319 | `Pode apoiar o transporte de estudantes da rede pública que vivem na área rural.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T320 | `Pode apoiar a aquisição de veículos para o transporte escolar, principalmente em áreas rurais.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T321 | `Pode apoiar obras e equipamentos para ampliar a oferta pública de pré-escola.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T322 | `Pode apoiar a construção de unidades de educação infantil para ampliar a oferta de pré-escola.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T323 | `Pode apoiar obras e equipamentos para ampliar o acesso à educação básica pública.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T324 | `Pode apoiar o transporte de estudantes da rede estadual que vivem na área rural.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | articulação com outra rede | B2 |
| T325 | `Pode apoiar obras e melhorias em escolas com vagas de tempo integral.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T326 | `Pode apoiar a construção de escolas destinadas ao atendimento em tempo integral.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T327 | `Pode apoiar a criação e a manutenção de matrículas em jornada integral.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T328 | `Pode apoiar a alimentação dos estudantes que permanecem na escola em jornada integral.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T329 | `Pode apoiar a formação do professor na área em que atua.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T330 | `Pode apoiar cursos de pós-graduação para professores da rede pública.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T331 | `Pode apoiar a aquisição de equipamentos para climatizar salas de aula.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T332 | `Pode apoiar equipamentos e pequenas instalações para climatizar salas de aula.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T333 | `Pode apoiar adaptações e equipamentos para tornar os espaços escolares mais acessíveis.` | mesmo | relação | ação DF2 | catálogo | manter | mesmo texto | relação selecionada | omitir ação | — | B2 |
| T334 | `Para estudantes da rede pública que vivem na área rural.` | mesmo | relação | recorte DF2 | catálogo | manter | mesmo texto | recorte não repetido na ação | omitir lista vazia | — | B2 |
| T335 | `Prioriza o transporte de estudantes de áreas rurais ou ribeirinhas.` | mesmo | relação | recorte DF2 | catálogo | manter | mesmo texto | recorte não repetido na ação | omitir lista vazia | — | B2 |
| T336 | `Para estudantes da rede estadual que vivem na área rural.` | mesmo | relação | recorte DF2 | catálogo | manter | mesmo texto | recorte não repetido na ação | omitir lista vazia | — | B2 |
| T337 | `A participação ocorre por meio das ofertas destinadas aos professores da rede pública.` | mesmo | relação | recorte DF2 | catálogo | manter | mesmo texto | recorte não repetido na ação | omitir lista vazia | — | B2 |
| T338 | `O apoio é destinado ao professor participante do curso.` | mesmo | relação | recorte DF2 | catálogo | manter | mesmo texto | recorte não repetido na ação | omitir lista vazia | — | B2 |
| T339 | `O recurso é utilizado pela escola ou por sua entidade executora.` | mesmo | relação | recorte DF2 | catálogo | manter | mesmo texto | recorte não repetido na ação | omitir lista vazia | — | B2 |
| T340 | `FNDE — Plano de Ações Articuladas — Página vigente consultada em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | referência homologada | B4 |
| T341 | `FNDE — Solicitar ações de infraestrutura educacional — Serviço atualizado em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T342 | `FNDE — Proinfância — Página vigente consultada em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T343 | `Casa Civil — Manual Educação Novo PAC Seleções — 2025` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T344 | `Casa Civil — Escolas em Tempo Integral no Novo PAC — Seleções 2023–2025` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T345 | `FNDE — Programa Nacional de Apoio ao Transporte do Escolar — Página vigente consultada em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T346 | `FNDE — Programa Caminho da Escola — Página vigente consultada em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T347 | `Secretaria da Educação do Rio Grande do Sul — Programa Estadual de Apoio ao Transporte Escolar — Página vigente consultada em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T348 | `FNDE — Resolução CD/FNDE nº 25 — PAR-Portfólio — 2023` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T349 | `Presidência da República — Lei nº 14.640 — Programa Escola em Tempo Integral — 2023` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T350 | `FNDE — Programa Escola em Tempo Integral — Página atualizada em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T351 | `FNDE — Programa Nacional de Alimentação Escolar — Página vigente consultada em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T352 | `FNDE — Resolução CD/FNDE nº 4 — Alimentação escolar — 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T353 | `CAPES — Plano Nacional de Formação de Professores da Educação Básica — Página atualizada em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T354 | `CAPES — ProEB — pós-graduação de professores da rede pública — Página atualizada em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T355 | `FNDE — Uso dos recursos do PDDE — Regras consultadas em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T356 | `FNDE — Programa Dinheiro Direto na Escola — Página vigente consultada em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |
| T357 | `FNDE — Programa Escola Acessível — Página vigente consultada em 2026` | mesmo | fonte | fontes DF2 | catálogo | manter | mesmo texto e link | fonte usada | omitir fonte não usada | — | B4 |

## 17. Auditoria dos 497 contratos

### 17.1 Escopo e método

A auditoria leu os 497 caminhos públicos por `slug` listados em `public/data/municipios_index.json` e abriu `public/data/municipios/{slug}/diagnostico.json`. Não houve arquivo ausente. As contagens abaixo usam **o comprimento das cinco arrays `*Items`**, e não os campos totais `*Count`; portanto descrevem as coleções compactas atualmente entregues à apresentação.

Legenda: A = `municipalActionItems`; C = `coordinationItems`; I = `investigationItems`; M = `monitoringItems`; P = `preservationItems`.

### 17.2 Cobertura e tamanho

| Grupo | Municípios com ao menos um item | Municípios vazios | Total de itens nas 497 arrays | Mínimo | Máximo | Município representativo do máximo |
|---|---:|---:|---:|---:|---:|---|
| A — ação municipal | 405 | 92 | 709 | 0 | 3 | Alegrete (`alegrete`); 73 municípios empatam |
| C — coordenação | 497 | 0 | 994 | 2 | 2 | Aceguá (`acegua`); todos os 497 empatam |
| I — investigação | 497 | 0 | 15.344 | 28 | 35 | Vespasiano Correa (`vespasiano-correa`) |
| M — acompanhamento | 435 | 62 | 1.103 | 0 | 9 | Carlos Gomes (`carlos-gomes`) e Novo Xingu (`novo-xingu`) |
| P — preservação | 400 | 97 | 775 | 0 | 5 | Glorinha (`glorinha`) e Ibarama (`ibarama`) |

### 17.3 Combinações de grupos vazios e não vazios

| A | C | I | M | P | Municípios | Representante(s) |
|---|---|---|---|---|---:|---|
| com itens | com itens | com itens | com itens | com itens | 260 | Agudo (`agudo`), Ajuricaba (`ajuricaba`), Alecrim (`alecrim`) |
| vazio | com itens | com itens | com itens | com itens | 91 | Alto Alegre (`alto-alegre`), Alto Feliz (`alto-feliz`), Araricá (`ararica`) |
| com itens | com itens | com itens | com itens | vazio | 83 | Alegrete (`alegrete`), Arroio Grande (`arroio-grande`), Arroio do Meio (`arroio-do-meio`) |
| com itens | com itens | com itens | vazio | com itens | 49 | Aceguá (`acegua`), Amaral Ferrador (`amaral-ferrador`), Arambaré (`arambare`) |
| com itens | com itens | com itens | vazio | vazio | 13 | Bagé (`bage`), Barra do Ribeiro (`barra-do-ribeiro`), Candiota (`candiota`) |
| vazio | com itens | com itens | com itens | vazio | 1 | Nova Hartz (`nova-hartz`) |

As seis combinações somam 497. Não existe combinação com C ou I vazios na versão auditada.

### 17.4 Indicadores que aparecem apenas em investigação

Critério: o ID aparece em pelo menos uma array compacta e o conjunto de tipos em todos os municípios é exatamente `{I}`.

| Indicador | Nome atual |
|---|---|
| `acesso_internet_computador` | Escolas com acesso dos alunos à internet por computador |
| `acesso_internet_disp_pessoais` | Escolas com acesso dos alunos à internet por dispositivos pessoais |
| `adequacao_em` | Docentes com formação adequada no ensino médio |
| `aee` | Oferta de AEE e salas de recursos na educação especial |
| `alfabetizacao` | Estudantes alfabetizados na rede pública |
| `banda_larga` | Escolas com internet banda larga |
| `basico_15_17` | Matrículas da educação básica de estudantes de 15 a 17 anos em relação à população da faixa |
| `comp_portatil_aluno` | Escolas com computadores portáteis para alunos |
| `desktop_aluno` | Escolas com computadores de mesa para alunos |
| `fundamental_concluido_15_29` | População de 15 a 29 anos com ensino fundamental concluído |
| `fundamental_concluido_18_mais` | População de 18 anos ou mais com ensino fundamental concluído |
| `internet` | Escolas da educação básica com acesso à internet |
| `internet_alunos` | Escolas com internet disponível para os alunos |
| `internet_aprendizagem` | Escolas com internet usada na aprendizagem |
| `internet_comunidade` | Escolas com internet aberta à comunidade |
| `medio_concluido_18_29` | População de 18 a 29 anos com ensino médio concluído |
| `medio_concluido_18_mais` | População de 18 anos ou mais com ensino médio concluído |
| `medio_tecnico_articulado_percentual` | Ensino médio articulado à educação profissional técnica |
| `proposta_pedagogica` | Escolas públicas com projeto político pedagógico |
| `rede_local` | Escolas com rede local de computadores |
| `rede_wireless` | Escolas com rede local sem fio |
| `saeb_matematica_anos_finais` | Desempenho em Matemática - anos finais |
| `saeb_matematica_anos_iniciais` | Desempenho em Matemática - anos iniciais |
| `saeb_matematica_ensino_medio` | Desempenho em Matemática - ensino médio |
| `saeb_portugues_anos_finais` | Desempenho em Português - anos finais |
| `saeb_portugues_anos_iniciais` | Desempenho em Português - anos iniciais |
| `saeb_portugues_ensino_medio` | Desempenho em Português - ensino médio |
| `tablet_aluno` | Escolas com tablets para alunos |

Total: **28 indicadores**.

### 17.5 Indicadores que aparecem em mais de um tipo de grupo

| Indicador | Nome atual | Tipos observados |
|---|---|---|
| `adequacao_ai` | Docentes com formação adequada nos anos iniciais | C, I, M |
| `alfabetizacao_pop_15_mais` | Taxa de alfabetização da população de 15 anos ou mais | I, M |
| `basico_6_17` | População de 6 a 17 anos que frequenta a educação básica | C, P |
| `basico_integral` | Alunos do público-alvo da ETI em jornada integral na rede pública | C, M |
| `conselho_escolar` | Escolas públicas com conselho escolar instituído e em funcionamento | C, P |
| `creche` | População de 0 a 3 anos que frequenta a escola/creche | A, M |
| `educacao_ambiental` | Escolas que promovem educação ambiental | I, M |
| `eja_integrada_educacao_profissional_percentual` | Percentual das matrículas da EJA articuladas à educação profissional | C, I, P |
| `escolas_integral` | Escolas públicas com alunos em jornada de tempo integral | A, M |
| `idade_regular_medio` | Estudantes que concluem o ensino médio na idade regular | I, M |
| `idade_regular_nono` | Estudantes que concluem os anos finais na idade regular | C, I, M |
| `idade_regular_quinto` | Estudantes que concluem os anos iniciais na idade regular | C, I, M |
| `medio_tecnico_participacao_publica` | Participação acumulada do segmento público na expansão da EPT de nível médio | I, M |
| `pos_graduacao` | Docentes da educação básica com pós-graduação | C, M, P |
| `pre_escola` | População de 4 a 5 anos que frequenta a escola/creche | A, P |
| `rendimento_magisterio` | Rendimento do magistério em relação a outros profissionais com nível superior | C, I |
| `salas_acessiveis` | Salas de aula com acessibilidade | C, M |
| `salas_climatizadas` | Salas de aula climatizadas | C, M |
| `subsequente_expansao` | Expansão acumulada das matrículas em cursos técnicos subsequentes | I, M |
| `temporarios` | Docentes da rede pública com contrato temporário | C, M, P |

Total: **20 indicadores**. Os 49 indicadores aparecem em pelo menos uma das cinco arrays compactas; não há ID inteiramente ausente desse universo.

### 17.6 Implicações públicas

- C e I não discriminam municípios por presença: ambas existem nos 497; contadores brutos desses grupos não funcionam como resumo de singularidade municipal.
- A omissão de I retira de 28 a 35 itens técnicos por município do fluxo decisório, sem perda dos dados no contrato.
- Como 20 indicadores mudam de tipo entre municípios, o nome público pertence ao indicador, mas o verbo decisório pertence à coleção daquele município.
- A DF3-B não pode criar mapeamento fixo `indicatorId → grupo`.
- A DF2 continua usando apenas A e C conforme seu seletor homologado; omitir I não amplia sua entrada.

## 18. Critérios de aceite da futura DF3-B

1. Um único `h1`: `Diagnóstico educacional de {município}`.
2. `Plano Nacional de Educação (PNE)` expandido na primeira ocorrência.
3. Não há rótulo público de investigação.
4. Não há contador de investigação.
5. Não há mensagem pública de ausência de valor, comparação, fonte, trajetória, programa ou seção.
6. Nenhum traço ou zero substitui ausência.
7. Não há uso público de articulação ou pactuação.
8. O grupo público chama-se exatamente `Resultados que dependem de parceria`.
9. Um indicador em investigação pode permanecer descritivo somente quando valor, ano, unidade e fonte oficial forem publicáveis.
10. Um indicador em investigação não entra em ação, parceria, financiamento, posição ou recomendação.
11. Nenhuma fonte é presumida ou substituída por fonte semelhante.
12. Resultado sem fonte oficial é omitido silenciosamente.
13. Nenhuma prioridade implícita pela palavra “primeiro”.
14. Nenhuma reordenação no React.
15. A comparação com o Rio Grande do Sul é omitida quando não for publicável.
16. A trajetória é omitida quando não for publicável.
17. Tema vazio é removido do filtro.
18. Filtro inválido retorna automaticamente para `Todos os temas`.
19. Erro integral usa somente a mensagem operacional simples `Não foi possível abrir o diagnóstico agora. Tente novamente.`, com `Tentar novamente` quando tecnicamente possível.
20. Texto copiado, impressão e nomes acessíveis seguem as mesmas regras da tela.
21. A DF2 permanece semanticamente intacta.
22. Nenhum indicador, fórmula, contrato ou JSON é alterado.

## 19. Plano de implementação da DF3-B

### B1 — Vocabulário e nomes públicos

- centralizar rótulos públicos;
- atualizar título, promessa e temas;
- simplificar os nomes dos 49 indicadores sem alterar IDs;
- atualizar o texto copiado;
- não alterar a visibilidade estrutural ainda.

**Parada:** título, promessa, temas, nomes e cópia usam o contrato v1.1, sem mudança estrutural de visibilidade.

### B2 — Grupos e omissão

- aplicar os quatro grupos públicos A/C/M/P;
- remover todo DOM derivado de `investigationItems`;
- preservar resultados descritivos publicáveis independentemente do grupo;
- omitir grupos, métricas, temas e itens vazios;
- manter a DF2 intacta.

**Parada:** investigação não gera DOM e nenhum resultado descritivo válido é removido apenas por pertencer a `investigationItems`.

### B3 — Comparações e evolução

- simplificar a comparação com o Rio Grande do Sul;
- simplificar a comparação com municípios de oferta educacional de tamanho semelhante;
- simplificar a trajetória;
- omitir estados não publicáveis;
- preservar valores acima de 100%.

**Parada:** todas as comparações públicas declaram comparador, ano/período e condição; estados inválidos são omitidos.

### B4 — Fontes, estados e acessibilidade

- consolidar fontes;
- remover fallbacks públicos de fonte;
- alinhar erro, carregamento, cópia e impressão;
- garantir nomes acessíveis e foco visível;
- não expor erros técnicos.

**Parada:** tela, cópia, impressão e tecnologia assistiva recebem o mesmo contrato de linguagem.

### B5 — Validação do lote

Executar somente quando o usuário solicitar o modo de validação correspondente. O conjunto deve cobrir: testes textuais, auditoria dos 497 contratos, contratos representativos, ausência de termos proibidos, ausência de mensagens de falta, DF2 com e sem itens, desktop e mobile, cópia, impressão e build. Não regenerar contratos para validar uma mudança de apresentação.

## 20. Matriz de rastreabilidade e fechamento

### 20.1 Matriz

| Requisito/decisão | Evidência atual | Regra contratada | Fase DF3-B |
|---|---|---|---|
| promessa pública | diretriz de produto e cabeçalho atual | §1 e T006–T008 | B1 |
| linguagem simples, sem ranking | plano de produto, guia e textos técnicos atuais | §§2, 6 e 7 | B1–B2 |
| estrutura final | ordem linear atual + DF2 ao fim | §3 | B1–B4 |
| cinco grupos internos e quatro públicos | `decisionSummary` em 497 contratos | §4 | B2 |
| omitir investigação sem apagar resultado descritivo | I presente em 497; 28 IDs apenas em I | §5, §13 e §17 | B2 |
| inventário completo | componentes, helpers, catálogo e contratos | §§8, 13 e 16 | B1–B4 |
| elementos públicos | DOM de `DiagnosticPanel` e DF2 | §9 | B1–B4 |
| RS | `stateBenchmarkSummary` e itens comparáveis | §10.1 | B3 |
| municípios semelhantes | `similarMunicipalities` e `offering_size` | §10.2 | B3 |
| evolução/ritmo | `trajectory` e labels atuais | §11 | B3 |
| meta/referência/esperado | metas, referência configurada e comparação estadual | §12 | B1–B3 |
| 49 nomes | `indicatorCatalog.json` e contratos | §13 | B1 |
| omissão silenciosa e erro operacional único | estados e mensagens atuais | §14 | B2/B4 |
| fontes | seis rótulos dos contratos + 18 fontes DF2 | §15 | B4 |
| congelamento DF2 | DF1/DF2 e auditoria anterior | §16 | todas |
| auditoria 497 | leitura de todas as arrays por slug | §17 | B2/B5 |
| aceite | riscos de linguagem, dados e acessibilidade | §18 | B5 |
| implementação mínima | fronteiras de apresentação | §19 | B1–B5 |

### 20.2 Contagem das decisões do inventário

A unidade é a linha numerada `T` definida no §8.1. Contagem final:

| Decisão | Linhas |
|---|---:|
| manter | **96** |
| reescrever | **96** |
| ocultar | **25** |
| mover para fontes | **1** |
| somente interno | **15** |
| **Total** | **233** |

### 20.3 Limites desta entrega

Esta DF3-A.1 homologa editorialmente somente o contrato documental na versão 1.1. Não altera código, interface, testes, CSS, rotas, loaders, catálogos, contratos, schema, pipeline ou JSON. A implementação DF2 e o Panorama permanecem intactos. A auditoria do §17 foi somente leitura e não deixou script temporário no repositório.
