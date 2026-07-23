# Design

## Direção

A interface é institucional, analítica e orientada à leitura. Hierarquia, texto e espaçamento devem explicar a informação antes de recorrer a cor. Comparações não devem parecer rankings nem avaliações competitivas entre municípios.

## Fontes canônicas no código

- tokens e base visual: `src/styles/design-tokens.css` e `src/index.css`;
- navegação: `src/styles/navigation-shell.css`;
- gráficos: `src/styles/chart-system.css`;
- ciclos PNE: `src/styles/pne-cycle-experience.css`;
- Educação e Financiamento: `src/styles/education-pages.css` e `src/styles/financial-pages.css`;
- compatibilidade de estilos anteriores: `src/App.css`;
- assinatura institucional: `src/styles/institutional-refresh.css`.

Novos padrões devem entrar na camada temática correspondente. Evite ampliar `App.css` com regras duplicadas.

## Componentes e estados

- cartões resumem uma pergunta, valor, período e próximo passo;
- detalhes apresentam série, referência, fonte e metodologia;
- controles preservam rótulo visível, foco e estado selecionado;
- carregamento, ausência, indisponibilidade, erro, zero e não aplicabilidade são estados diferentes;
- valores e comparações sempre exibem unidade e período quando relevantes;
- tooltips complementam o gráfico, mas não são a única forma de acesso ao dado.

## Cor e tipografia

Public Sans é a fonte funcional; Source Serif 4 é reservada a ênfases editoriais previstas pelos estilos. Cores semânticas devem vir dos tokens. Variação positiva ou negativa não equivale automaticamente a situação boa ou ruim; o texto deve explicar o sentido do indicador.

## Responsividade e acessibilidade

A experiência deve funcionar em mobile, notebook e desktop sem depender de baselines de screenshot. Valide reflow, zoom, teclado, foco, nomes acessíveis, contraste e redução de movimento. Alvos interativos devem ter área confortável e o conteúdo não pode exigir rolagem horizontal da página.

## Critério de mudança

Uma mudança visual permanente deve passar por typecheck, lint, build, testes de domínio afetados e E2E relevante. Evidências locais de revisão visual são temporárias e não devem ser versionadas.
