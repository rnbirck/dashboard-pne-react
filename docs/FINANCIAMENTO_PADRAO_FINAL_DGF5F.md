# DGF5-F — padrão final visual e editorial de Financiamento

## Escopo e inconsistências encontradas

Esta consolidação preserva dados, valores, fórmulas, contratos, rotas e o
seletor municipal global. Foram corrigidas somente inconsistências de leitura:

- cabeçalhos alternavam entre o padrão compacto, hero próprio e contexto interno
  do município;
- Aplicação e execução e Fundeb ainda usavam o retorno genérico para indicadores;
- Panorama poderia expor cinco KPIs, enquanto os demais resumos já trabalhavam
  com até quatro;
- Fundeb e PNATE não verificavam o exercício ao deduplicar valores iguais;
- detalhes repetiam navegação no rodapé e mantinham referência técnica aberta;
- QSE ainda usava linha para uma leitura anual discreta.

## Cabeçalho final e retornos

Panorama, Aplicação e execução, Fundeb, VAAR e PNATE usam
`EducationCompactHeader`: identificação “Financiamento da educação”, título,
descrição curta e “Voltar à visão geral de financiamento”. Não há card, chip ou
nome do município dentro do cabeçalho. O retorno preserva `municipio` e demais
parâmetros compatíveis da URL; “Voltar aos indicadores” permanece apenas nos
detalhes, onde retorna à página proprietária.

## Regra dos resumos

Todo resumo principal publica no máximo quatro indicadores, omite nulos e
preserva zero oficial. Cada cartão ou linha mantém o período visível. A grade é
4 → 2 → 1; valores monetários permanecem em uma linha, com números tabulares.
No Panorama, a remuneração deixou a síntese para que um VAAR aplicável não gere
um quinto KPI; continua disponível na seção apropriada.

## Deduplicações condicionais

- **PNATE:** valor informado e valor autorizado só são deduplicados quando o
  valor numérico e o exercício coincidem. O informado fica no resumo; o
  autorizado continua como linha secundária em “Valor do programa”, com nota
  pública de coincidência. Quando diferem, os dois integram o resumo.
- **Fundeb:** receita declarada e ingressos só são tratados como coincidentes
  quando o valor e o exercício são iguais. Nesse caso, a receita permanece no
  resumo e os ingressos ficam como linha de apoio. Quando diferem, ambos entram
  no resumo, preservando o limite de quatro itens. Disponibilidade final e saldo
  conciliado seguem a mesma regra: coincidência move o saldo para “Dados usados
  no cálculo”; diferença mantém a linha secundária de saldo.

## Regra de gráficos

QSE anual e PNATE usam barras. Fundeb e SIOPE usam barras somente para valores
monetários com dois ou três exercícios; séries com quatro ou mais exercícios e
percentuais usam linha. Execução continua em etapas empenhado → liquidado →
pago, e VAAR preserva blocos anuais separados. Nenhum gráfico interpola anos,
preenche ausências, projeta valores ou mistura realizado e previsto. Os pontos
permanecem focáveis, com tooltip e Leitura rápida textual.

## Template dos detalhes

Aplicação/SIOPE, Fundeb e PNATE seguem: retorno e título; até quatro KPIs;
gráfico com Leitura rápida em 70/30 no desktop; dados usados no cálculo; e
conceito/fontes. Em telas estreitas, gráfico aparece antes da leitura. A
navegação anterior/próximo existe apenas no topo.

## Disclosures e fontes

`FinancialIndicatorDisclosures` concentra três disclosures fechados:

1. Dados usados no cálculo: tabela anual, unidade, valores publicados e regra de
   variação;
2. Conceito e interpretação: medida, importância e limite de leitura;
3. Fontes e metodologia: fonte oficial, competência, fórmula, regra legal e
   limitações.

`FinancialSourcesFooter` uniformiza o encerramento de SIOPE, Fundeb, PNATE e
VAAR. Visão geral e Panorama também terminam em “Fontes e metodologia”, com
detalhes recolhidos quando aplicáveis. Termos internos de contrato, schema,
parser, pipeline, reason code ou cobertura técnica não são exibidos.

## Componentes consolidados

- `EducationCompactHeader` para o cabeçalho das rotas financeiras;
- `FinancialMetricGrid`, `FinancialChartFrame`, `FinancialQuickReading` e
  `FinancialPrimaryAnalysis` no detalhe compartilhado;
- `FinancialIndicatorDisclosures` e `FinancialSourcesFooter` criados para a
  leitura progressiva e fontes;
- `FinancialDetailNavigation` reutilizado apenas na posição superior;
- `IndicatorHistoryChart` reutilizado com seleção explícita de barra ou linha.

## Responsividade

Em 1366×768, 1024×768 e 390×844, as seis rotas financeiras não apresentaram
overflow horizontal. O resumo de Aplicação confirmou quatro cartões em uma linha
no desktop e 2×2 no notebook; no celular, PNATE confirmou uma coluna, valores
inteiros e o primeiro conteúdo visível sem área vazia. Gráfico e Leitura rápida
empilham na ordem correta no detalhe móvel; disclosures ocupam toda a largura.

## Capturas e cenários inspecionados

As capturas dirigidas no navegador mostraram Visão geral de Ivoti em 1366×768 e
PNATE de Aceguá em 390×844. A inspeção estrutural também cobriu:

- Panorama com município na URL;
- Aplicação e execução de Aceguá, inclusive resumo 4→2;
- Fundeb com Agudo (receita/ingressos e disponibilidade/saldo iguais) e Antônio
  Prado (disponibilidade e saldo distintos);
- VAAR com Ajuricaba (dois componentes), Agudo (nenhum recebido) e Aceguá
  (apenas um recebido);
- PNATE com Aceguá (valor informado/autorizado iguais) e Agudo (diferentes);
- detalhes de SIOPE percentual, Fundeb monetário e PNATE de três anos.

## Validações

- TypeScript dirigido aos quatro arquivos TS/TSX alterados: passou;
- ESLint dos arquivos alterados: passou;
- testes dirigidos DGF5-F, DGF5-E, Panorama e registro canônico: 17/17;
- testes de rotas: 10/10;
- inspeção visual dirigida nos três viewports: passou;
- `git diff --check`: executado ao final.

## Limitações remanescentes

No conjunto publicado, não há município cujo registro mais recente apresente
receita declarada e ingressos do Fundeb diferentes; a regra para esse caso foi
implementada e coberta por teste dirigido, mas não teve captura de dado real.
As capturas desta rodada foram verificadas no navegador e não foram adicionadas
como novos artefatos versionados.
