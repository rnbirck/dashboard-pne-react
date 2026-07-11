# Auditoria visual do dashboard PNE — etapa 02

Data da auditoria: 10 de julho de 2026  
Escopo: inspeção visual e de navegação da aplicação local, sem alteração de interface, dados ou regras de negócio.

## Resumo executivo

A identidade visual, a estrutura dos módulos e a hierarquia principal de valor, meta e distância estão preservadas e funcionam bem em desktop. Os estados ativos do menu e dos filtros são reconhecíveis; títulos longos quebram adequadamente nas telas verificadas; os cards mantêm alturas uniformes; e os detalhes dos indicadores apresentam boa leitura das métricas em telas largas.

Os dois problemas de maior impacto são localizados: a página de ciclo excede a largura da tela em celular, enquanto o cabeçalho completo consome grande parte da primeira dobra em tablet e celular. Também há uma camada recorrente de textos auxiliares abaixo de 12 px e com contraste insuficiente, especialmente fontes, rótulos e resumos em caixa alta.

Esta auditoria recomenda correções graduais. Nenhuma proposta exige novo design, troca de identidade, mudança de dados ou alteração dos textos de status.

## Método e cobertura

A aplicação local foi navegada com Browser e Playwright. Foram inspecionados o estado renderizado, dimensões computadas, overflow, fontes, contraste, foco por teclado e regras CSS associadas aos componentes. As capturas foram examinadas durante a sessão e não foram gravadas no repositório, para respeitar a exigência de criar somente este documento.

Telas percorridas:

- Home;
- PNE 2014–2024;
- PNE 2026–2036;
- diagnóstico municipal;
- metas legais;
- detalhes dos indicadores;
- gráficos históricos e dados complementares;
- busca e filtros temáticos/de etapa;
- menu lateral e barra de contexto.

Viewports verificados:

| Evidência | Tela e condição | Resultado visual relevante |
|---|---|---|
| EV-01 | 1920 × 1080, 100%, Home | Estrutura equilibrada e sem overflow. Textos de fonte e alguns rótulos ficaram entre 10,08 e 11,84 px. |
| EV-02 | 1920 × 1080, 100%, PNE 2014–2024 | Cards uniformes e métricas claras. Referência do PNE aparece em uma única linha truncada; 63 nós textuais visíveis no conteúdo ficaram abaixo de 12 px. |
| EV-03 | 1920 × 1080 e 1366 × 768, 100%, PNE 2026–2036 | Sem overflow horizontal. Em 1366 px, rótulos agregados em caixa alta quebram em até três linhas e aumentam a densidade do topo. |
| EV-04 | 1920 × 1080, 100%, detalhe de indicador | Valor inicial, valor recente, variação, meta e distância têm boa hierarquia. O gráfico histórico é legível em desktop. |
| EV-05 | 1920 × 1080 e 390 × 844, 100%, diagnóstico | Sem overflow no celular; ações e filtros passam para uma coluna. O cabeçalho continua dominando a primeira dobra. |
| EV-06 | 1920 × 1080 e 390 × 844, 100%, metas legais | Título longo quebra sem truncar; cards de resumo usam a largura disponível. Sem overflow no celular. |
| EV-07 | 768 × 1024, 100%, página de ciclo | Documento sem overflow, mas o cabeçalho mede cerca de 379 px; o conteúdo principal começa por volta de 449 px. Filtros horizontais deixam o próximo item parcialmente visível. |
| EV-08 | 390 × 844, 100%, página de ciclo | Overflow severo: viewport de 390 px, documento com 683 px; grupo de resumos com cerca de 453 px. Cabeçalho com cerca de 482 px e conteúdo iniciando por volta de 552 px. |
| EV-09 | 390 × 844, 100%, detalhe e gráfico histórico | O detalhe cabe na tela. No gráfico, a área visível mede 280 px para um conteúdo rolável de 756 px: somente 37% aparece de cada vez e faltam pistas explícitas de rolagem. |
| EV-10 | 390 × 844, 100%, Home/diagnóstico/metas legais | Largura do documento de 382 px, portanto o overflow de EV-08 é específico da composição da página de ciclo. |
| EV-11 | Equivalência de layout a 125% | Em desktop 1366 × 768, foi usado viewport CSS equivalente de 1093 × 614; não houve overflow. Em celular 390 × 844, o equivalente de 312 × 675 manteve documento de 683 px, gerando 371 px de overflow, e cabeçalho de aproximadamente 510 px. |

Observação sobre o zoom: o conector do navegador não expôs mudança confiável do zoom nativo. Por isso, o teste de 125% foi reproduzido pela redução da viewport CSS para 80% da dimensão física, que provoca o mesmo reflow esperado para a análise de layout. Os resultados de zoom são registrados como equivalência, não como medição do controle nativo do navegador.

## Aspectos que já funcionam bem

- A Home, o diagnóstico e as metas legais não apresentam overflow horizontal em 390 px.
- O menu ativo tem fundo, marcador lateral e contraste suficientes; o foco programático no item Home exibiu contorno sólido de 2 px.
- Os filtros ativos diferenciam-se dos inativos sem depender apenas de texto.
- Os títulos longos observados em metas legais e detalhes quebram em múltiplas linhas sem truncamento.
- Os cards mantêm alturas consistentes nas grades de desktop.
- Valor atual, meta e distância têm hierarquia clara nos cards e no detalhe.
- O gráfico histórico é legível em desktop e possui descrição acessível no SVG.
- Não foi observado flash de fonte, texto borrado ou atraso perceptível; `document.fonts.status` retornou `loaded` no ambiente auditado.

## Recomendações prioritárias

Ordem sugerida por impacto, privilegiando correções pequenas:

| Ordem | Categoria | Recomendação | Prioridade | Esforço | Risco transversal |
|---:|---|---|---|---|---|
| 1 | D | Corrigir o overflow da página de ciclo no celular | Alta | Pequeno | Baixo a médio |
| 2 | A, E | Elevar o contraste de fontes e textos auxiliares | Alta | Pequeno | Médio |
| 3 | A, B | Estabelecer piso de 12 px e reduzir caixa alta em rótulos densos | Alta | Pequeno | Médio |
| 4 | D, E | Tornar a rolagem horizontal dos filtros evidente | Média | Pequeno | Baixo |
| 5 | B, C | Exibir a referência do PNE nos cards de 2014 sem corte abrupto | Média | Pequeno | Baixo |
| 6 | C, D, E | Melhorar a orientação no gráfico histórico rolável em celular | Média | Médio | Médio |
| 7 | C | Dar contexto temporal mínimo às sparklines dos cards | Média | Pequeno | Baixo |
| 8 | A, E | Estabilizar o carregamento das fontes e os pesos utilizados | Média | Médio | Médio |
| 9 | B, E | Recuperar contexto de localização na barra existente | Baixa | Pequeno | Médio |
| 10 | F | Compactar a navegação de tablet/celular em etapa futura | Alta | Grande | Alto |

### 1. Corrigir o overflow da página de ciclo no celular

1. **Página e componente:** PNE 2014–2024 e PNE 2026–2036; `CyclePage`, especialmente `.cycle-hero` e `.cycle-hero-meta-group`.
2. **Evidência visual:** EV-08 e EV-11. Em 390 px, o documento mede 683 px; a 125% equivalente, o excesso chega a 371 px. Home, diagnóstico e metas legais não reproduzem o problema.
3. **Problema observado:** o resumo do ciclo força a página além da viewport, corta textos, cards e filtros e cria rolagem horizontal no documento inteiro.
4. **Impacto para o gestor municipal:** parte das informações fica aparentemente ausente e a navegação vertical passa a deslocar também o eixo horizontal, aumentando o risco de leitura incompleta.
5. **Causa provável:** `.cycle-hero` continua em `display: flex` horizontal e `.cycle-hero-meta-group` usa `grid-template-columns: repeat(4, minmax(112px, 1fr))`; não há substituição dessa grade no breakpoint móvel.
6. **Recomendação mínima:** em breakpoint já existente, empilhar o conteúdo do hero, aplicar `min-width: 0` e `width: 100%` aos filhos e trocar o grupo de resumo para uma coluna ou grade automática que nunca ultrapasse 100%. Manter cards, cores e conteúdo atuais.
7. **Prioridade:** alta.
8. **Esforço:** pequeno.
9. **Risco de modificar outros componentes:** baixo a médio se a regra permanecer escopada em `.cycle-page`; validar os dois ciclos e o detalhe.

### 2. Elevar o contraste de fontes e textos auxiliares

1. **Página e componente:** Home, ciclos, cards, gráficos e notas de fonte; `.source-line`, `.data-source-note`, `.municipio-selector__label`, `.eyebrow` e rótulos equivalentes.
2. **Evidência visual:** EV-01 a EV-06. Medições representativas: texto de fonte `#a6a296` sobre `#f5f3ec` com contraste aproximado de 2,30:1; rótulo do município com 3,45:1; eyebrow sobre branco com 3,54:1.
3. **Problema observado:** textos pequenos e claros perdem nitidez, sobretudo em notebooks, zoom e telas com brilho elevado.
4. **Impacto para o gestor municipal:** período, fonte e contexto podem ser ignorados, embora sejam necessários para interpretar corretamente o indicador.
5. **Causa provável:** combinação de `--text-faint`/`--text-muted` com tamanhos entre 10 e 11,52 px sobre superfícies muito claras.
6. **Recomendação mínima:** substituir, primeiro nos seletores de fonte e contexto, o tom `--text-faint` por um token já existente de maior contraste, como `--text-soft`, e confirmar contraste mínimo de 4,5:1 para texto normal. Não alterar cores de status.
7. **Prioridade:** alta.
8. **Esforço:** pequeno.
9. **Risco de modificar outros componentes:** médio se o token global for alterado; baixo se a correção for aplicada aos seletores específicos.

### 3. Estabelecer piso de 12 px e reduzir caixa alta em rótulos densos

1. **Página e componente:** resumo dos ciclos, MetaCard, notas, chips e cabeçalho municipal.
2. **Evidência visual:** EV-02 e EV-03. Foram encontrados 63 textos visíveis abaixo de 12 px no ciclo 2014 em 1920 px e 44 no conteúdo da tela equivalente a 1366 px/125%. Rótulos agregados medem aproximadamente 10,24–10,56 px e quebram em até três linhas.
3. **Problema observado:** a combinação de corpo muito pequeno, caixa alta, peso forte e espaçamento entre letras torna os resumos mais cansativos do que os próprios valores.
4. **Impacto para o gestor municipal:** dificulta varredura rápida e comparação entre total, referência atingida e referência ainda não atingida.
5. **Causa provável:** regras com `font-size` entre `0.63rem` e `0.74rem`, `text-transform: uppercase` e `letter-spacing` elevado, sem um piso tipográfico específico para dados gerenciais.
6. **Recomendação mínima:** adotar `--font-size-xs` (12 px) como piso para texto informativo; manter tamanhos menores apenas em elementos realmente decorativos. Retirar `text-transform: uppercase` dos rótulos que formam frases, preservando o conteúdo textual atual.
7. **Prioridade:** alta.
8. **Esforço:** pequeno.
9. **Risco de modificar outros componentes:** médio, pois alguns seletores agrupam rótulos de módulos distintos; aplicar por componente antes de considerar um ajuste global.

### 4. Tornar a rolagem horizontal dos filtros evidente

1. **Página e componente:** ciclos; abas temáticas e filtro de etapa em `CyclePage`.
2. **Evidência visual:** EV-07. Em 768 px, os filtros usam uma faixa horizontal e o próximo item fica parcialmente cortado; a barra de rolagem é discreta.
3. **Problema observado:** não há indicação persistente de que existem opções além da borda visível.
4. **Impacto para o gestor municipal:** temas ou etapas podem parecer indisponíveis e a pessoa pode interpretar o conjunto filtrado como completo.
5. **Causa provável:** no breakpoint de 820 px, `.category-tabs` e `.basic-education-filter` recebem `flex-wrap: nowrap` e `overflow-x: auto`, sem affordance adicional.
6. **Recomendação mínima:** manter o componente, adicionar um fade de borda ou pista visual de continuidade e levar automaticamente o chip ativo para a área visível. Garantir foco visível durante a rolagem por teclado.
7. **Prioridade:** média.
8. **Esforço:** pequeno.
9. **Risco de modificar outros componentes:** baixo se as regras permanecerem dentro de `.cycle-filter-panel`.

### 5. Exibir a referência do PNE nos cards de 2014 sem corte abrupto

1. **Página e componente:** PNE 2014–2024; `MetaCard` e `.meta-card__pne-reference`.
2. **Evidência visual:** EV-02. A referência ocupa uma linha de aproximadamente 17 px e termina em reticências, mesmo quando é decisiva para distinguir indicadores semelhantes.
3. **Problema observado:** o card mostra valor, meta e distância, mas oculta parte do vínculo legal do indicador.
4. **Impacto para o gestor municipal:** aumenta a necessidade de abrir vários detalhes para confirmar qual recorte da meta está sendo avaliado.
5. **Causa provável:** `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis` e linha fixa na grade do card. O ciclo 2026 já possui uma variante de referência completa.
6. **Recomendação mínima:** permitir até duas linhas no ciclo 2014, com `line-clamp`, e reservar a mesma altura em todos os cards. Reaproveitar o padrão existente da variante completa sem copiar toda a densidade do card de 2026.
7. **Prioridade:** média.
8. **Esforço:** pequeno.
9. **Risco de modificar outros componentes:** baixo com classe/variante específica do ciclo; médio se a regra base de MetaCard for alterada.

### 6. Melhorar a orientação no gráfico histórico rolável em celular

1. **Página e componente:** detalhe do indicador; `HistoryChart` dentro de `.indicator-chart-card`.
2. **Evidência visual:** EV-09. A viewport interna mede 280 px, enquanto a área rolável mede 756 px e o SVG mantém 720 px de largura; 476 px exigem deslocamento horizontal.
3. **Problema observado:** o gráfico preserva legibilidade dos pontos, mas não comunica claramente que deve ser arrastado, nem quantos anos permanecem fora da área visível.
4. **Impacto para o gestor municipal:** a pessoa pode ler somente os anos iniciais ou finais e perder a evolução completa.
5. **Causa provável:** largura mínima deliberada do SVG e `overflow-x` no canvas, sem indicador de continuidade ou controle de navegação.
6. **Recomendação mínima:** preservar a rolagem e o desenho atuais, mas incluir pista visual discreta, foco de teclado no canvas e acesso simples ao início/fim da série. Manter o resumo de valor atual e meta fora do gráfico, como já ocorre.
7. **Prioridade:** média.
8. **Esforço:** médio.
9. **Risco de modificar outros componentes:** médio, pois o gráfico é compartilhado; escopar a melhoria à instância da página de ciclo e validar dados complementares.

### 7. Dar contexto temporal mínimo às sparklines dos cards

1. **Página e componente:** cards de indicadores dos dois ciclos; `.meta-card__sparkline`.
2. **Evidência visual:** EV-02 e EV-03. A linha de 48 px mostra forma e ponto final, mas não apresenta ano inicial/final ou indicação textual de período.
3. **Problema observado:** a forma pode ser interpretada como tendência recente sem que a janela temporal esteja explícita.
4. **Impacto para o gestor municipal:** favorece uma leitura de direção sem saber se a série cobre dois anos ou todo o ciclo.
5. **Causa provável:** a sparkline foi tratada como elemento compacto/decorativo e os rótulos temporais ficaram apenas no gráfico de detalhe.
6. **Recomendação mínima:** incluir anos inicial e final em uma linha curta ou em nome acessível, usando dados já disponíveis e sem produzir conclusão de tendência. Não ampliar significativamente a altura do card.
7. **Prioridade:** média.
8. **Esforço:** pequeno.
9. **Risco de modificar outros componentes:** baixo; validar apenas cards sem série e títulos longos.

### 8. Estabilizar o carregamento das fontes e os pesos utilizados

1. **Página e componente:** tipografia global; `design-tokens.css`, `index.css` e todos os componentes.
2. **Evidência visual:** no ambiente auditado, `document.fonts.status` estava `loaded` e não houve perda visível de nitidez. Entretanto, o repositório declara Public Sans e Source Serif 4 somente na pilha de `font-family`, sem `@font-face`, e utiliza pesos como 520, 550, 580, 650, 720, 750, 760, 850 e 900 com `font-synthesis: none`.
3. **Problema observado:** não é uma falha visual imediata, mas a aparência depende das fontes instaladas na máquina e da forma como o navegador mapeia pesos não padronizados.
4. **Impacto para o gestor municipal:** em outra estação, o painel pode trocar para fontes de sistema, alterar quebras de linha e enfraquecer a hierarquia de peso.
5. **Causa provável:** ausência de ativos de fonte declarados no projeto e divergência entre os pesos dos tokens (400, 500, 600, 700 e 800) e os pesos locais usados no CSS.
6. **Recomendação mínima:** manter as famílias atuais, disponibilizar seus arquivos de forma controlada ou documentar o fallback esperado e migrar gradualmente os pesos para os tokens existentes. Validar novamente quebras de títulos antes de qualquer troca.
7. **Prioridade:** média.
8. **Esforço:** médio.
9. **Risco de modificar outros componentes:** médio, pois métricas tipográficas afetam toda a aplicação; executar como lote isolado.

### 9. Recuperar contexto de localização na barra existente

1. **Página e componente:** barra de contexto; `ContextBar`.
2. **Evidência visual:** EV-01 a EV-11. A barra mostra o município, mas o breadcrumb e o metadado existentes no componente não aparecem em nenhuma largura.
3. **Problema observado:** ao rolar uma página longa, o gestor perde a indicação persistente do módulo/ciclo e depende do menu ou de headings que ficaram acima.
4. **Impacto para o gestor municipal:** aumenta o custo de orientação ao alternar entre metas legais, ciclos, diagnóstico e detalhes.
5. **Causa provável:** bloco global que aplica `display: none` a `.context-bar__crumb` e `.context-bar__meta`.
6. **Recomendação mínima:** reexibir somente o breadcrumb já existente em uma linha curta, com truncamento seguro em celular; manter o seletor de município como elemento principal e não criar nova faixa visual.
7. **Prioridade:** baixa.
8. **Esforço:** pequeno.
9. **Risco de modificar outros componentes:** médio, pois `ContextBar` é compartilhado por todos os módulos; conferir títulos longos e largura do seletor.

### 10. Compactar a navegação de tablet/celular em etapa futura

1. **Página e componente:** todas as páginas; `Header` e menu principal.
2. **Evidência visual:** EV-07, EV-08, EV-10 e EV-11. O cabeçalho mede aproximadamente 379 px em tablet, 482 px em celular e 510 px na equivalência móvel a 125%; o conteúdo começa entre 449 e 595 px.
3. **Problema observado:** todos os grupos e subitens ficam expandidos antes do município e do conteúdo, ocupando de 37% a cerca de 75% da primeira dobra conforme a condição.
4. **Impacto para o gestor municipal:** cada troca de página exige grande deslocamento antes de chegar aos dados; a percepção inicial é de navegação, não de diagnóstico.
5. **Causa provável:** em até 1080 px o menu deixa de ser lateral, e em até 620 px `.top-nav` vira uma coluna única sem mecanismo de recolhimento.
6. **Recomendação mínima:** reservar para etapa futura uma versão recolhível do mesmo menu, preservando itens, ordem, ícones e estado ativo. Como transição conservadora, avaliar recolher apenas grupos inativos e manter visíveis Home e o destino atual.
7. **Prioridade:** alta, mas fora do lote de correções pequenas.
8. **Esforço:** grande.
9. **Risco de modificar outros componentes:** alto, por envolver comportamento, foco, teclado e navegação de todos os módulos.

## Classificação por categoria

- **A. Correções de legibilidade:** recomendações 2, 3 e 8.
- **B. Ajustes de hierarquia:** recomendações 3, 5 e 9.
- **C. Polimento de cards e gráficos:** recomendações 5, 6 e 7.
- **D. Responsividade:** recomendações 1, 4 e 6.
- **E. Acessibilidade:** recomendações 2, 4, 6, 8 e 9.
- **F. Mudanças estruturais para etapa futura:** recomendação 10.

## Sequência conservadora sugerida

1. Corrigir o overflow do hero do ciclo.
2. Ajustar contraste e piso tipográfico apenas nos seletores identificados.
3. Melhorar filtros e referência legal dos cards.
4. Adicionar orientação aos gráficos compactos e históricos.
5. Tratar fontes e barra de contexto em lotes isolados.
6. Manter a compactação estrutural do menu para uma etapa futura, com validação específica de teclado e responsividade.

Nenhuma recomendação pressupõe alteração de dados, cálculos, status, metas, projeções, regras de negócio, pipeline Python ou identidade visual.
