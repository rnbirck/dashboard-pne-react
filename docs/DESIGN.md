# Design

## Direção

A interface é institucional, analítica e orientada à leitura. Hierarquia, texto e espaçamento explicam a informação antes da cor. Comparações entre municípios não devem sugerir ranking ou competição.

## Fundamentos

- Public Sans é a fonte funcional. Source Serif 4 aparece somente nas ênfases editoriais já previstas pelos estilos.
- Cores, espaços, raios, sombras, tipografia e estados semânticos vêm de `src/styles/design-tokens.css`.
- Variação positiva ou negativa não significa automaticamente situação boa ou ruim; rótulo e texto explicam o sentido do indicador.
- Superfícies comuns são discretas: borda e espaçamento organizam a leitura; sombra não substitui hierarquia.

## Composição e componentes

- Cartões resumem contexto, valor, unidade, período e ação ou leitura seguinte quando houver.
- Detalhes priorizam a evidência principal e mantêm série, referência, fonte e metodologia acessíveis.
- Controles têm rótulo ou nome acessível, seleção perceptível e foco visível.
- Valores e comparações mostram unidade e período sempre que forem necessários para interpretação.
- Tooltips complementam gráficos; valores essenciais também aparecem em rótulos, legendas, tabelas ou texto.
- Use componentes e anatomias compartilhadas antes de criar uma variante de domínio.

## Estados e acessibilidade

Carregamento, vazio, indisponibilidade, erro, zero e não aplicabilidade são estados distintos. Preserve contraste, nomes acessíveis, navegação por teclado, foco visível e redução de movimento. Hover nunca é a única indicação de estado ou a única forma de acessar informação.

## Responsividade

A mesma hierarquia de leitura deve funcionar em celular, notebook e desktop. Componentes podem reorganizar, empilhar ou oferecer rolagem interna; a página não deve exigir rolagem horizontal. Textos longos, valores grandes e tabelas devem permanecer legíveis sem ocultar conteúdo analítico.

## Implementação

- base e gramática compartilhada: `src/index.css`, `src/styles/platform-ui.css` e componentes de `src/components`;
- navegação: `src/styles/navigation-shell.css`;
- gráficos: `src/styles/chart-system.css`;
- ciclos PNE: `src/styles/pne-cycle-experience.css` e estilos específicos do detalhe;
- Educação e Financeiro: `src/styles/education-pages.css` e `src/styles/financial-pages.css`;
- composição institucional e Diagnóstico: `src/styles/institutional-refresh.css`;
- compatibilidade ainda ativa: `src/App.css`.

Novas regras pertencem à menor camada com consumidores claros. Não duplique em CSS de domínio a gramática que já existe em `platform-ui.css`, nem use `App.css` como origem de um padrão novo.
