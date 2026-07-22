# DGF5-A — Panorama financeiro municipal

## Escopo

O redesenho altera somente a apresentação do Panorama financeiro. Contrato
`municipal-finance-v1`, IDs canônicos, produtores, fórmulas, valores, estágios,
rotas, shell, sidebar e carregamento municipal da QSE foram preservados.

## Inspeção inicial

A página anterior foi inspecionada antes da alteração em Agudo, Nova Pádua,
Nova Araçá e Dois Irmãos, nos viewports 1366×768, 1024×768 e 390×844.

Problemas observados:

- o cabeçalho repetia contexto e ressalvas, levando o primeiro card a cerca de
  414 px no desktop e 593–622 px no notebook/celular;
- o card de VAAR ocupava espaço mesmo para não beneficiários;
- Fundeb aparecia antes da série anual da QSE e a página mantinha uma seção de
  relações fora da sequência desejada;
- execução reunia fluxo, restos e quatro taxas com a mesma hierarquia;
- os cards e painéis eram corretos, mas a densidade e a ordem ainda diferiam do
  padrão editorial recente de Educação;
- não foi identificado overflow global nos três viewports.

## Estrutura anterior e final

Estrutura anterior: cabeçalho alto, quatro cards, aplicação constitucional,
colunas paralelas de execução e Fundeb, QSE, relações com o Diagnóstico e
fontes.

Estrutura final:

1. síntese financeira do município;
2. aplicação constitucional;
3. execução orçamentária;
4. Quota do Salário-Educação;
5. Fundeb e complementações;
6. fontes e metodologia.

O cabeçalho agora usa título curto, descrição única e retorno, sem repetir o
município já identificado no seletor global. A síntese contém até cinco valores
e omite qualquer valor nulo.

## Componentes e padrões reutilizáveis

`FinancialPanoramaComponents.tsx` reúne:

- `FinancialCompactHeader`;
- `FinancialMetricCard`, com variantes observado e previsão;
- `FinancialAnalysisLayout`, para composição 70/30 com leitura rápida;
- `FinancialStageBlock`, para etapas financeiras sucessivas;
- `FinancialDisclosure`, para dados usados no cálculo e metodologia.

As primitivas usam os tokens e as superfícies existentes em
`financial-pages.css`; não foi criada regra em `App.css`.

## Indicadores e tratamento por seção

O resumo mantém despesa paga em educação, aplicação em MDE, Fundeb destinado à
remuneração, previsão total do Fundeb e VAAR previsto apenas quando aplicável.
Realizados de 2024 e previsões de 2026 recebem rótulos e superfícies distintos.

Aplicação constitucional destaca os dois percentuais, a despesa computada em
MDE, a receita Fundeb declarada e a regra de 25%. Valores por fonte, competência
e critérios de conciliação permanecem recolhidos em metodologia.

Execução apresenta empenhado, liquidado e pago como etapas sucessivas, com
barras progressivas e três taxas de passagem na leitura rápida. Restos a pagar
aparecem em faixa secundária somente quando publicados.

QSE preserva 2020–2025, valor de 2025, variação, diferença absoluta, valor por
matrícula, análise 65/35 e estimativa de 2026 separada. Matrículas, coeficiente,
competência e cálculo por matrícula permanecem em “Dados usados no cálculo”.

Fundeb mostra o total previsto e apenas VAAF, VAAT ou VAAR aplicáveis. A ausência
de complementação vira uma frase curta, sem card de R$ 0. Metadados ficam em
“Dados usados no cálculo”, e o detalhamento completo continua acessível pela
rota do Fundeb.

## Responsividade e acessibilidade

O resumo usa até cinco colunas sem deixar trilha vazia e progride para 3→2→1. Análises usam gráfico/fluxo e leitura
rápida lado a lado no desktop e empilham com o conteúdo principal primeiro em
telas estreitas. Valores usam números tabulares, não há scroll horizontal e os
disclosures nativos preservam teclado e foco. Gráficos mantêm rótulo textual,
seis marcas focáveis e resumo lateral.

## Validações e evidências

- TypeScript dirigido aos três componentes alterados: passou;
- ESLint dos quatro arquivos TypeScript/TSX alterados: passou;
- testes DGF5-A das primitivas e apresentação: 4/4 passaram;
- testes do histórico QSE: 8/8 passaram;
- teste do registro canônico: 5/5 passaram, com 90 IDs estáveis;
- inspeção no navegador: 15 combinações (cinco municípios × três viewports),
  sem overflow, card vazio ou texto técnico; todas mantiveram seis barras QSE;
- whitespace/diff: executado ao final.

Capturas finais:

- `artifacts/municipal-finance-dgf5a-2026-07-21/agudo-1366x768.png`;
- `artifacts/municipal-finance-dgf5a-2026-07-21/nova-padua-1024x768.png`;
- `artifacts/municipal-finance-dgf5a-2026-07-21/nova-araca-390x844.png`;
- `artifacts/municipal-finance-dgf5a-2026-07-21/dois-irmaos-1366x768.png`.

## Limitações

O Panorama não incorpora novos dados nem reproduz catálogos completos. Fundeb,
VAAR, PNATE e SIOPE não foram migrados para estas primitivas nesta etapa. A
leitura pública continua limitada aos exercícios e estágios já disponíveis no
contrato.

## Refinamento final DGF5-A.1

O cabeçalho interno deixou de repetir o município e o retorno passou a apontar
explicitamente para a visão geral de financiamento, preservando o parâmetro do
município. A descrição foi consolidada em uma frase única.

A síntese passou a limitar o desktop a quatro colunas, produzindo composição
4+1 quando há cinco indicadores, com progressão para três, duas e uma coluna.
Valores monetários e suas unidades permanecem na mesma linha. Uma legenda
discreta distingue realizados de 2024 e previsões de 2026, sem separar os
indicadores em blocos maiores.

No celular, seletor do módulo, cabeçalho e espaçamentos foram compactados para
antecipar o primeiro indicador. A inspeção dirigida em Agudo, Dois Irmãos, Nova
Pádua e Nova Araçá confirmou retorno, grade, valores, seções posteriores e
ausência de overflow. Evidências:
`artifacts/municipal-finance-dgf5a1-2026-07-21/`.
