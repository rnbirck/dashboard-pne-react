# Visão geral de Financiamento — DGF5-E

## Estrutura anterior

A página iniciava com hero alto e texto conceitual extenso. Os três mecanismos apareciam antes dos acessos e os quatro módulos tinham o mesmo peso visual, com contagens de indicadores, período e numeração editorial. Conceitos e referências técnicas ocupavam grande parte da leitura.

## Estrutura final

1. Cabeçalho financeiro compacto.
2. Panorama financeiro como acesso recomendado.
3. Quatro caminhos de aprofundamento.
4. Como o financiamento se organiza.
5. Conceitos essenciais recolhidos.
6. Fontes oficiais.

## Hierarquia do Panorama

O Panorama financeiro recebeu uma superfície destacada, ícone, identificação “Entrada recomendada” e a ação explícita “Abrir Panorama financeiro”. Nenhum valor municipal foi introduzido nesta página.

## Cards secundários

Os cards de Aplicação e execução, Fundeb, Complementação VAAR e PNATE reutilizam `NavigationEntryCard`, apresentam ícones e a ação “Abrir página”. Foram removidos deles os indicadores de quantidade, o período como selo e a numeração editorial.

## Mecanismos mantidos

Recursos vinculados, Redistribuição pelo Fundeb e Programas e complementações permanecem em três colunas no desktop e uma no celular. Cada texto foi reduzido a, no máximo, duas frases.

## Conceitos reorganizados

Os seis conceitos existentes foram preservados dentro de um disclosure único, fechado inicialmente, no final da página. A lista interna continua a reutilizar `EditorialExpandableGrid`.

## Conteúdos removidos

- Hero e espaços introdutórios excessivos.
- Explicação conceitual anterior aos acessos municipais.
- Contagens de indicadores, período “2023–2026” e numeração “01” dos acessos.
- Descrições de filtros, séries e estrutura interna dos módulos.
- Referências a contratos, schema, pipeline, parser, cobertura técnica e campos internos.

## Componentes e estilos

Foram reutilizados `FinancialSectionHeader`, `NavigationEntryCard`, `EditorialExpandableGrid`, `FinancialCompactModuleSelector`, ícones SVG locais e `financial-pages.css`. A variante visual `financial-overview-panorama` torna o acesso principal destacável sem alterar a gramática das páginas financeiras.

## Responsividade

- 1366×768: Panorama destacado, quatro acessos em uma linha e mecanismos em três colunas.
- 1024×768: acessos em 2×2, com o Panorama preservado acima.
- 390×844: Panorama antes dos demais acessos, cards e mecanismos em uma coluna; conceitos permanecem fechados; sem overflow horizontal.

## Capturas e validações

Foram inspecionadas no navegador integrado as composições de 1366×768, 1024×768 e 390×844. Em 1024 px, os quatro cards renderizaram duas linhas; em 390 px, quatro linhas e o Panorama terminou em 752 px de um viewport de 844 px. Não houve overflow horizontal e o pseudo-elemento de numeração dos cards foi neutralizado no contexto financeiro.

Passaram o ESLint dos arquivos alterados, o teste dirigido `financial-overview-dgf5e.test.mjs`, os testes de roteamento e a verificação de whitespace/diff. Não foram executadas suítes globais, E2E completo ou regressão visual completa.

## Limitações e preservação

Nenhuma rota, sidebar, seletor municipal, página de destino, dado, fórmula, contrato, registro canônico ou conteúdo interno de indicador foi alterado.
