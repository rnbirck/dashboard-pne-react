# Guia de Design e Experiência — Dashboard PNE

> **Status: normativo.** Este documento reúne somente decisões visuais aprovadas e permanentes.
>
> Pendências, inventário e evidências de migração ficam em [PLANO_MIGRACAO_UI.md](PLANO_MIGRACAO_UI.md). Auditorias e propostas anteriores ficam em [historico-ui/](historico-ui/).

## 1. Propósito e identidade

O Dashboard PNE transforma dados educacionais públicos em leitura municipal confiável, orientada à decisão e compreensível para gestão, controle social e comunicação pública.

A identidade da plataforma é institucional, analítica e sóbria:

- verde profundo como âncora institucional, sem dominar a área de leitura;
- superfícies claras e neutras para uso prolongado;
- linguagem responsável, sem ranking, nota ou julgamento do município;
- valor, unidade, período, fonte e limitação próximos da evidência;
- separação clara entre dado observado, interpretação técnica e decisão da gestão.

A interface deve preservar a continuidade entre PNE, Educação, Diagnóstico e Financeiro. Diferenças de composição são válidas quando comunicam uma função específica do módulo, não quando recriam a gramática visual básica.

## 2. Hierarquia de fontes de verdade

1. `AGENTS.md` define o processo obrigatório.
2. Este guia define regras visuais aprovadas.
3. `src/styles/design-tokens.css` define valores canônicos.
4. `src/styles/platform-ui.css` e componentes compartilhados definem a implementação de referência.
5. Estilos específicos documentam apenas exceções justificadas.
6. `src/App.css` é legado ativo e não deve orientar novos padrões.
7. `docs/PLANO_MIGRACAO_UI.md` acompanha a migração sem criar regras novas.
8. `docs/historico-ui/` preserva evidências e propostas sem força normativa.

Quando a implementação divergir deste guia, a divergência deve entrar no plano de migração com evidência e critério de aceite.

## 3. Fundações visuais

### 3.1 Tipografia

Usar apenas as famílias carregadas pela aplicação:

- `--font-serif` (Source Serif 4): `h1` e títulos institucionais explicitamente definidos;
- `--font-sans` (Public Sans): `h2`–`h6`, corpo, componentes, controles, navegação, dados, gráficos e tabelas.

Valores numéricos usam sempre Public Sans e `font-variant-numeric: tabular-nums`.

Pesos aprovados: 400, 500, 600 e 700. Hierarquia deve vir primeiro de tamanho, espaço e contexto; peso 700 não é padrão para todo texto.

| Papel | Família | Tamanho de referência | Peso |
|---|---|---:|---:|
| Título de página (`h1`) | Source Serif 4 | 32 px | 600 |
| Seção principal (`h2`) | Public Sans | 24 px | 700 |
| Título operacional (`h3`) | Public Sans | 20 px | 700 |
| Título de componente | Public Sans | 18 px | 600–700 |
| Corpo | Public Sans | 14–16 px | 400–500 |
| Texto auxiliar necessário | Public Sans | mínimo 12 px | 500–600 |
| Dado | Public Sans | 20–32 px | 600–700 |

Regras:

- prosa longa deve respeitar `--content-reading-max`;
- headings usam `text-wrap: balance`; prosa longa pode usar `text-wrap: pretty`;
- caixa alta fica restrita a siglas e códigos oficiais;
- não usar fonte menor para acomodar conteúdo essencial;
- títulos e valores grandes devem permanecer legíveis com zoom de 200%.

### 3.2 Cor, superfícies e estados

Usar tokens semânticos antes de valores locais.

| Papel | Tokens principais | Uso |
|---|---|---|
| Marca e navegação | `--green-brand-dark` | shell e identidade institucional |
| Ação e seleção | `--green-primary`, `--green-deep`, `--green-soft` | ação primária, foco e estado selecionado |
| Texto | `--text-strong`, `--text`, `--text-secondary`, `--text-subtle` | títulos, corpo e metadados legíveis |
| Superfícies | `--surface-card`, `--surface-soft`, `--surface-muted` | conteúdo, agrupamento e apoio |
| Estado | `--status-ok-*`, `--status-warn-*`, `--status-far-*`, `--status-muted-*` | condição semântica explicitada por texto |
| Gráficos | `--chart-series-*`, `--chart-grid`, `--chart-axis-text` | séries, grade e rótulos |

Cor não é suficiente para explicar estado. Verde institucional não significa automaticamente sucesso; em gráficos, séries usam tokens de série, não cores de status.

Cards e painéis usam raio de 8 a 16 px. Painéis estáticos preferem borda; sombra discreta é reservada a elevação, menu, tooltip ou interação explorável. Não usar faixa lateral colorida como decoração de estado, cards aninhados, texto em gradiente ou glassmorphism decorativo.

### 3.3 Espaçamento, dimensões e camadas

- usar a escala `--space-*`, com base de 4 px e ritmo principal de 8 px;
- shell desktop: `--sidebar-width`; conteúdo: `--shell-max`;
- controles principais, busca, seleção, botão e navegação local: mínimo de 44 px;
- controles segmentados internos podem usar 36 px quando estiverem em um grupo claramente rotulado, forem operáveis por teclado e não forem a única ação crítica;
- cartões irmãos: 16 px; blocos internos: 24 px; seções principais: 32–48 px;
- usar a escala `--z-*`; não introduzir valores arbitrários de `z-index`.

## 4. Estrutura e navegação

Ordem de leitura preferencial:

1. shell e navegação global;
2. contexto municipal;
3. cabeçalho da página com `h1`, descrição e ações quando necessárias;
4. síntese das informações prioritárias;
5. filtros e busca;
6. evidência principal;
7. aprofundamento progressivo;
8. fonte, método e data disponíveis.

O município permanece visível no contexto global. Breadcrumb é opcional: usar quando acrescentar orientação real em uma navegação profunda; ocultá-lo quando repetir um contexto já claro na página ou na navegação global.

Trocas de página devem restaurar o topo e transferir foco para o `h1`. Retornos explícitos de detalhe para lista devem restaurar o contexto de leitura e o foco do item de origem.

Desktop e notebook são as prioridades de composição. Acima de 1080 px, a sidebar pode ser persistente; em larguras menores, a navegação deve reduzir seu impacto vertical e preservar o acesso ao município e ao conteúdo prioritário.

## 5. Regras de componentes

### 5.1 Busca, seleção, filtros, segmentos e abas

As famílias de controle da plataforma são implementadas por `platform-ui.css`:

- busca e seleção: superfície clara, borda neutra, foco comum e altura de 44 px;
- filtros: opções que podem combinar e usam `aria-pressed`;
- segmentos: escolha exclusiva entre poucos recortes, em grupo rotulado;
- abas: troca de painéis irmãos com `tablist`, `tab`, `aria-selected` e painel associado;
- navegação local: voltar, anterior e próximo com a mesma gramática visual e estados.

Busca deve ter label acessível, placeholder apenas complementar e ação de limpar quando houver texto. O município deve ser pesquisável antes de uma lista extensa e precisa manter relações ARIA únicas.

### 5.2 Cards e indicadores

Card é adequado quando agrupa uma unidade de informação, uma ação clara, itens comparáveis ou estado persistente. Não usar card apenas para criar espaçamento.

Um card de indicador pode conter tema, status textual, título, valor, unidade, ano, referência, variação e sparkline quando estes elementos ajudarem a decisão. Altura fixa não pode truncar título ou valor relevante.

Cards exploráveis devem expor affordance por estrutura, foco e estado, não apenas por hover. Cards informativos não recebem cursor, chevron ou elevação que sugira ação.

### 5.3 Gráficos e tabelas

Todo gráfico informa medida, unidade, período, leitura principal, referência quando existir e fonte. Deve oferecer tooltip por ponteiro e foco, marcas focáveis quando o valor individual é interativo e alternativa textual ou tabular adequada.

Eixos usam `--chart-axis-text` e texto final mínimo de 12 px. Legendas não dependem somente de cor. Tooltip nunca é a única forma de obter valor.

Tabelas devem ter `caption`, cabeçalhos associados, números tabulares e alinhamento numérico consistente. Em largura reduzida, a rolagem horizontal deve ser explícita; não ocultar colunas silenciosamente.

### 5.4 Estados do sistema

Loading, erro, ausência, ausência de resultados e indisponibilidade devem explicar o contexto e oferecer recuperação quando ela existir.

- loading: anúncio não intrusivo e skeleton quando a estrutura for previsível;
- erro: `role="alert"`, linguagem simples e nova tentativa quando possível;
- sem dados: diferenciar ausência, série insuficiente, não aplicável e zero observado;
- sem resultados: repetir filtros ativos e oferecer limpeza;
- sem município: explicar a dependência da seleção sem duplicar relações ARIA.

## 6. Exceções justificadas por módulo

- **PNE:** meta, distância, ciclo, status e projeção exigem referência legal e diferenciação entre observado e projetado.
- **Educação:** exploração por tema, etapa e indicador pode privilegiar leitura descritiva sem converter toda medida em status.
- **Diagnóstico:** síntese decisória linear, impressão e ações de cópia são próprios da leitura consolidada.
- **Financeiro:** moeda, mínimos legais, séries anuais e tabelas extensas exigem contexto e densidade próprios.

Essas exceções reutilizam a mesma tipografia, tokens, estados, foco, cards e controles de base.

## 7. Acessibilidade, responsividade e conteúdo

Requisitos de aceite:

- contraste mínimo WCAG 2.2 AA;
- foco visível e ordem de foco coerente;
- teclado opera menu, seleção, filtros, segmentos, abas, acordeões, gráficos e tabelas;
- estado nunca depende somente de cor;
- textos e valores longos não são escondidos por overflow;
- zoom de 200% preserva conteúdo e função;
- `prefers-reduced-motion` elimina movimento não essencial;
- fonte, unidade, período e limitação permanecem próximos do dado.

O tom é claro, profissional e responsável. Preferir “exige atenção”, “lacuna”, “avanço” e “referência”; evitar classificação automática do município como bom, ruim, aprovado ou reprovado.

## 8. Checklist de revisão

- [ ] A página possui um `h1` e a navegação posiciona foco e rolagem corretamente.
- [ ] Tipografia, cores, espaços, raios, sombras e camadas usam tokens ou gramática existente.
- [ ] Foi reutilizado componente ou variante equivalente antes de criar novo padrão.
- [ ] Estados default, hover, foco, ativo, desabilitado, loading, erro e vazio foram considerados conforme o componente.
- [ ] Valor informa unidade e período; zero não é apresentado como ausência.
- [ ] Gráficos e tabelas permanecem acessíveis, legíveis e contextuais.
- [ ] Desktop e notebook foram priorizados; tablet, celular, zoom e textos longos foram validados.
- [ ] Nenhuma mudança visual alterou dados, cálculos, filtros, regras de negócio ou conteúdo analítico.

## 9. Direção editorial SESI-RS

A plataforma adota uma composição de caderno institucional de acompanhamento:
verde profundo como âncora, papel quente para leitura prolongada, Source Serif 4
em títulos de entrada, Public Sans em operação e dados, e linhas/índices para
organizar a leitura. A nova anatomia é registrada integralmente em
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) e implementada por tokens e pela camada
compartilhada `src/styles/institutional-refresh.css`.

Heróis podem usar bloco de contexto lateral; grades de acesso e resumos podem
usar superfícies contínuas com divisores; fonte e metodologia permanecem
neutras e próximas da evidência. Ocre e terracota são sinais editoriais, não
classificações de desempenho. A direção preserva todos os requisitos deste
guia para foco, teclado, contraste, zoom, movimento reduzido e responsividade.
