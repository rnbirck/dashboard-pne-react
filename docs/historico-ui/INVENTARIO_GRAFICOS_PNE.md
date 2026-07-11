# Inventário de gráficos do Dashboard PNE

> **Status: histórico.** Preservado como inventário anterior à consolidação atual; não define regras ou pendências ativas. Consulte `../GUIA_DE_DESIGN.md` e `../PLANO_MIGRACAO_UI.md`.

Baseline registrado antes da rodada de padronização visual de gráficos e tooltips.

Todos os gráficos atuais são implementados com SVG próprio; não há biblioteca externa de visualização de dados. Os domínios, escalas, séries e cálculos permanecem sob responsabilidade dos componentes existentes e não fazem parte desta rodada.

| Família / componente | Tipo e páginas | Cores e altura atuais | Tooltip e teclado | Legenda, fonte e vazio | Referência e responsividade |
|---|---|---|---|---|---|
| `IndicatorHistoryChart` | Linha histórica. Detalhes dos ciclos PNE, FUNDEB, SIOPE/Aplicação dos Recursos e PNATE. | Verde local, área translúcida; 280, 300 ou 330 px, com override de 340 px nos módulos financeiros. | Tooltip próprio por ponteiro e foco; todos os pontos são focáveis e possuem `<title>`. | Sem legenda por ser série única; fonte fica no painel externo; retorna `null` para série insuficiente. | Meta tracejada quando aplicável. SVG fluido, mas alguns contêineres mantêm largura mínima/rolagem. |
| `IndicatorProjectionPanel` | Linha observada + projeção tendencial. Detalhes do PNE 2026–2036. | Observado sólido, projetado tracejado; 260 px. | Tooltip próprio por ponteiro e foco; pontos focáveis e com `<title>`. | Método e aviso de não previsão oficial no painel; ausência usa texto local com estilo inline. | Meta tracejada; transição observada/projetada já preservada. SVG fluido dentro do painel. |
| `EducationLineChart` | Linha histórica. Detalhes e recortes de Indicadores de Educação. | Cor recebida por propriedade, frequentemente hex local; 300 px. | Tooltip somente por ponteiro; pontos não focáveis e sem nome acessível próprio. | Série única sem legenda; fonte vem depois do gráfico; vazio local “dados insuficientes”. | Sem linha de referência. SVG fluido, com contêineres que podem rolar. |
| `EducationBarChart` | Barras horizontais e colunas. Recortes de Educação. | Cor recebida por propriedade; altura dinâmica nas barras e 420 px nas colunas. | Tooltip somente por ponteiro; barras não focáveis. | Série única sem legenda; fonte externa; vazio local. | Sem referência. Barras têm `min-width` para rolagem explícita em recortes densos. |
| `EducationStackedBarChart` | Barras empilhadas por ano. Recortes de Educação. | Paleta definida nos dados da página; 340 px. | Tooltip somente por ponteiro; segmentos não focáveis. | Legenda própria; fonte externa; vazio local. | Sem referência. Mantém ordem recebida das categorias e rolagem em recortes densos. |
| `AgeRangeComparisonChart` | Barras agrupadas comparativas. Faixa etária e modalidade em Educação. | Paleta local com até oito cores; 430 px. | Não possui tooltip, foco ou interação por marca. | Legenda própria; valores ficam sobre as barras; fonte externa; vazio local. | Sem referência. Usa largura mínima de 860 px com rolagem no contêiner. |
| `ComplementaryEnrollmentChart` | Linha histórica complementar. Dados de apoio dos detalhes PNE. | Azul local, área translúcida; 260 px. | Tooltip por ponteiro e foco; pontos focáveis com `aria-label`. | Série única sem legenda; título opcional; ausência retorna `null`. | Sem referência. SVG fluido e rótulos de ano reduzidos de forma determinística. |
| `AdministrativeDependencyChart` | Linhas múltiplas percentuais ou barras empilhadas absolutas. Dados complementares PNE. | Tons de verde e dourado locais; 260 px. | Tooltip por ponteiro e foco; pontos/segmentos focáveis com `aria-label`. | Legenda própria; ausência retorna `null`. | Sem referência. SVG fluido e anos reduzidos de forma determinística. |
| Sparklines PNE (`MetaCard`) | Linha compacta em cards de metas. | Cor semântica do status; 48 px de SVG + período, 52 px de bloco. | Sem tooltip complexo; card contém o contexto acessível. | Período inicial–final visível; ausência usa traço visual. | Sem eixo, legenda ou meta. Fluida dentro do card. |
| Sparklines Educação (`EducationIndicatorCard`) | Linha compacta em cards de Educação. | Cor semântica do status; 42 px. | Decorativa e oculta de tecnologia assistiva; card contém o contexto. | Não exibe período; ausência usa mensagem local. | Sem eixo, legenda ou meta. Fluida dentro do card. |
| Sparklines Financeiro (`FinancialIndicatorCard`) | Linha compacta em cards de SIOPE, FUNDEB e PNATE. | Cor semântica do status; 42 px. | Decorativa e oculta de tecnologia assistiva; card contém o contexto. | Não exibe período; ausência usa mensagem local. | Sem eixo, legenda ou meta. Fluida dentro do card. |
| `FinancialChartFrame` + FUNDEB/SIOPE/PNATE | Moldura financeira que reutiliza `IndicatorHistoryChart`. | Herda o gráfico histórico; título e fonte próprios do módulo. | Herda tooltip e foco do histórico. | Fonte fornecida por `DataSourceNote`; estados vazios próprios por painel. | Herda meta/referência quando aplicável e mantém tabelas/recortes externos. |

## Drift identificado

- Existem três implementações visuais de tooltip: histórico/projeção, Educação e gráficos complementares.
- Educação em linha, barras e empilhado oferece detalhe somente por ponteiro.
- O comparativo por faixa etária/modalidade não oferece tooltip nem foco por marca.
- Eixos, grades e séries misturam tokens com hexadecimais locais.
- Legendas empilhadas e complementares repetem a mesma anatomia com classes diferentes.
- Estados vazios usam mensagens e molduras diferentes.
- As sparklines têm alturas, períodos e mensagens de ausência diferentes entre PNE, Educação e Financeiro.
- FUNDEB, SIOPE e PNATE já compartilham o mesmo gráfico histórico; a diferença deliberada está no título, unidade, fonte e dados de apoio de cada módulo.
