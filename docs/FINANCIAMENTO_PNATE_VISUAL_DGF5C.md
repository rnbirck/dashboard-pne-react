# PNATE — reformulação editorial e visual DGF5-C

## Estrutura anterior

A página usava uma introdução institucional, um resumo com até cinco cartões e
um catálogo pesquisável que apresentava os dez indicadores em cards de mesma
hierarquia.

## Estrutura final

A leitura pública passou a seguir esta sequência:

1. cabeçalho financeiro compacto;
2. resumo principal;
3. valor do programa;
4. estudantes considerados;
5. ajustes do programa;
6. dados usados no cálculo, em disclosure;
7. fonte e metodologia.

O detalhe de cada indicador permanece acessível pelos botões dos blocos e pela
tabela recolhida.

## Indicadores do resumo

O resumo exibe, no máximo, quatro itens: valor informado pelo PNATE, valor
autorizado após desconto quando difere do informado, estudantes considerados e
parâmetro per capita. Cada item informa seu período. Valores ausentes são
omitidos e zero oficial permanece publicável.

## Deduplicações e valores por rede

Quando valor informado, autorizado e associado à rede municipal coincidem, o
valor informado fica em destaque e os demais aparecem como linhas secundárias,
com a explicação de que seus campos possuem funções distintas. Os valores não
são somados. O valor da rede estadual é identificado como contexto territorial,
nunca como receita municipal.

## Estudantes e ajustes

O total de estudantes lidera o bloco de cálculo e as redes municipal e estadual
aparecem como recortes secundários, sem nova soma do total. A nota pública
explicita que o recorte estadual não representa automaticamente despesa do
município.

Desconto e saldo desconsiderado deixam de ser KPIs. Quando ambos são zero, a
página mostra uma única mensagem compacta; quando algum é diferente de zero,
mostra valor, período, efeito público curto e acesso ao detalhe. Os zeros
continuam na tabela de dados usados no cálculo.

## Detalhe e variações

O detalhe preserva até quatro KPIs e a composição de gráfico e Leitura rápida
em 70/30. A série anual de 2024 a 2026 é apresentada em barras, sem interpolar
anos ou projetar valores. As variações usam somente frases objetivas de aumento,
redução ou proximidade do valor inicial. Conceito, cálculo, fonte e base legal
ficam em disclosure fechado por padrão.

## Componentes reutilizados

Foram reutilizados `EducationCompactHeader`, `FinancialSection`,
`FinancialMetricStrip`, `EducationSummaryCard`, `FinancialDetailHeader`,
`FinancialMetricGrid`, `FinancialChartFrame`, `FinancialQuickReading`,
`FinancialDetailNavigation` e `FinancialIndicatorMetadata`. O gráfico histórico
recebeu a variante reutilizável de barras para séries anuais.

## Responsividade

O resumo usa até quatro colunas no desktop, duas no notebook e uma no celular.
Os blocos de valor e estudantes passam de duas colunas para uma abaixo de
1024 px; no celular, as linhas, estudantes e disclosures não introduzem overflow
horizontal fora da tabela técnica, que preserva rolagem interna.

## Fonte e limitações

A fonte pública apresentada é FNDE/PNATE. O valor anual pode representar
previsão, plano de atendimento ou registro anual; autorização e estudantes
considerados não comprovam isoladamente recebimento ou execução municipal.

## Capturas e validações

Capturas dirigidas:

- `artifacts/municipal-finance-dgf5c-2026-07-22/nova-santa-rita-1366x768.png`;
- `artifacts/municipal-finance-dgf5c-2026-07-22/nova-santa-rita-1024x768.png`;
- `artifacts/municipal-finance-dgf5c-2026-07-22/nova-santa-rita-390x844.png`;
- `artifacts/municipal-finance-dgf5c-2026-07-22/novo-hamburgo-detail-1366x768.png`.

A inspeção confirmou a ausência de cards repetidos, a hierarquia do valor
principal e dos estudantes, o estado compacto para ajustes iguais a zero, a
preservação do zero oficial e a ausência de overflow horizontal nos viewports
de 1024 px e 390 px. Novo Hamburgo confirmou também o detalhe em barras e a
Leitura rápida em 70/30. Não há, no conjunto PNATE publicado, registro com
`valor_total_estadual`, `desconto` ou `saldo_desconsiderado` diferente de zero
para inspeção do estado alternativo.

Foram executados: ESLint dos arquivos JSX alterados, teste do registro canônico
de indicadores financeiros, teste dirigido de rotas financeiras e verificação
de whitespace/diff. Não houve arquivo TypeScript alterado; não existe teste
automatizado isolado para o painel PNATE ou para estes componentes reutilizados.
