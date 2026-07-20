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

Detalhes de cards do PNE, Educação e Financiamento preservam a largura canônica
do shell, a navegação local com voltar, posição, contexto e anterior/próximo, o
título operacional curto e os KPIs prioritários em uma única faixa. No PNE
2026–2036, esse contexto identifica o tema do indicador; os demais domínios
podem manter o status quando ele for a orientação mais útil para a sequência.
Nos dois ciclos do PNE, detalhes longos repetem ao final os atalhos de voltar,
anterior e próximo, preservando a mesma sequência e os mesmos estados do topo.

Nos ciclos PNE 2014–2024 e PNE 2026–2036, o detalhe organiza o acompanhamento em largura total e, logo
abaixo, o gráfico principal em aproximadamente 70% da linha, com altura útil
de 320 px no desktop, ao lado da leitura rápida. O bloco “Dados de apoio da meta”
organiza histórico e dependência administrativa na primeira linha; a rede privada
ocupa uma faixa horizontal própria na segunda linha; quando houver projeção, ela
divide a terceira linha com a tabela. O título de cada série auxiliar deve identificar a métrica
efetivamente exibida — matrículas, escolas, turmas, salas, pessoas ou o próprio
indicador percentual — e não reutilizar “Histórico de matrículas” como rótulo
genérico. Quando o gráfico principal já apresenta um percentual e a memória de
cálculo possui séries anuais de numerador e denominador, os dados de apoio podem
priorizar essas duas quantidades para evitar duplicação da leitura percentual.
Quando uma quantidade nominal for derivada de uma taxa e de um total de outra
série oficial, o título deve identificá-la como estimativa e a descrição deve
explicitar a base usada e qualquer limitação de recorte.
Os gráficos auxiliares
usam 270 px de altura e a projeção, exclusiva do ciclo PNE 2026–2036, mantém
cards de síntese antes do gráfico, com 320 px de altura. Abaixo de
aproximadamente 900 px, os gráficos são empilhados; no celular, usam 280 px de
altura e reduzem a quantidade de anos exibidos no eixo X, sem rolagem interna,
compressão tipográfica ou overflow global. A referência do PNE aparece no topo
da leitura rápida, enquanto a nota metodológica e a fonte consolidada encerram
o detalhe. Nenhum gráfico, tabela, fonte ou nota existente deve ser ocultado por
abas nesses ciclos.
Nos detalhes de Educação, o gráfico principal e a leitura rápida compartilham a
mesma linha em proporção aproximada de 70/30 no desktop. O gráfico usa 300 px de
altura, e a leitura separa evolução observada, definição da medida e recorte
exibido. Em notebook e tablet, os blocos são empilhados; no celular, os gráficos
usam 280 px, mantêm texto final de pelo menos 12 px e reduzem a quantidade de
anos do eixo X. Infraestrutura pode preservar seu panorama em largura total por
ser uma composição multivariada sem série principal equivalente. Em Educação,
os dados de apoio seguem o padrão visível do PNE: cabeçalho contextual e cards
em grid para cada recorte disponível, sem ocultar gráficos, tabelas, fontes ou
notas em abas ou disclosures. Financiamento e os demais domínios podem manter o
aprofundamento progressivo quando a densidade ou a tarefa justificar, sem
remover acesso por teclado ou alternativa textual.

Nos detalhes de Financiamento, a abertura usa navegação local, título curto com
descrição e badges de fonte/unidade, seguida de uma faixa única com valor
inicial, valor atual, variação no período e ano de referência. O gráfico de
evolução e a leitura rápida compartilham a linha em proporção aproximada de
70/30 no desktop; a leitura separa evolução observada, definição da medida,
e recorte exibido, com a mesma cor, tipografia, espaçamento, superfície interna
e divisores usados em Educação e PNE. Não há seletor de período nessa
composição. A referência técnica aparece aberta logo abaixo da análise e reúne
conceito, cálculo, fonte, regra, base legal e nota metodológica, sem repetir um
bloco de apoio à interpretação e sem menu adicional de série histórica. A
navegação local é repetida ao final. Em notebook e tablet, gráfico e leitura são
empilhados; no celular, os KPIs usam duas colunas e o gráfico preserva 280 px de
altura.

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

Nos grids exploráveis de Educação, a anatomia editorial aprovada usa card retrato com contexto e status no cabeçalho; título e descrição integralmente visíveis; valor dominante à esquerda; coluna lateral com Ano e Variação desde o último ponto comparável; faixa interna em superfície musgo dedicada somente à Leitura; e rodapé com chip de etapa ou recorte e chevron simples. O período permanece disponível no detalhe e não é repetido no card. Subtítulos descrevem somente a medida ou o recorte e não incluem instruções como “use o filtro”, “selecione” ou equivalentes. A grade progride em 4→3→2→1 colunas e respeita o padding horizontal do grupo, sem compensação negativa nas bordas. Títulos, descrições, metadados e chips aceitam quebra de linha e fazem o card crescer, sem reticências ou limite fixo de linhas.

Cards comparáveis de PNE preservam sua composição compacta. Nos catálogos de Educação e Financiamento, a escala compacta parte de aproximadamente 330×368 px no desktop amplo, com 16 px de padding, valor principal em escala de até 48 px e coluna lateral separada por divisor. Valor e unidade são centralizados na coluna primária, com padding simétrico e contenção horizontal; conforme o comprimento, o valor reduz progressivamente sua escala para permanecer em uma única linha e nunca atravessar o divisor de Ano. Valores financeiros compactos usam até 32 px e valores densos até 24 px, preservando integralmente símbolo, número e unidade abreviada. A altura é mínima, nunca fixa por proporção: a faixa de valor e metadados cresce conforme o conteúdo e reserva espaço inferior para que unidades ou variações longas não invadam a Leitura. Em até 720 px, o valor reduz uma etapa e a composição permanece fluida, sem truncar valor, metadados ou ação. Alta usa verde-azulado suave, Queda usa terracota suave e Estável usa areia; a variação repete a cor semântica do badge. Sem série comparável, o badge e a variação são omitidos, sem converter ausência em zero. As grades de Educação, Financiamento e Execução, FUNDEB e PNATE progridem em 4→3→2→1 colunas; rótulos auxiliares podem usar abreviações inequívocas, mantendo a formulação completa no nome acessível.

Cards exploráveis devem expor affordance por estrutura, foco e estado, não apenas por hover. Cards informativos não recebem cursor, chevron ou elevação que sugira ação.

### 5.3 Gráficos e tabelas

Todo gráfico informa medida, unidade, período, leitura principal, referência quando existir e fonte. Deve oferecer tooltip por ponteiro e foco, marcas focáveis quando o valor individual é interativo e alternativa textual ou tabular adequada.

Nos detalhes do PNE, o progresso exibe o valor municipal atual em superfície neutra com contraste AA, preservando a cor semântica na linha do marcador. A linha de referência do gráfico usa o rótulo visual compacto `Meta {valor}`; o ciclo e o ano de vigência permanecem no contexto textual do detalhe, sem competir com a série.

Eixos usam `--chart-axis-text` e texto final mínimo de 12 px. Legendas não dependem somente de cor. Tooltip nunca é a única forma de obter valor.

Eixos temporais compartilham uma cadência de calendário previsível. No desktop e no notebook, as marcas priorizam intervalos regulares de 2, 3 ou 4 anos e preservam o primeiro e o último ano do período; em larguras reduzidas, a quantidade pode ser menor para evitar colisões, mantendo obrigatoriamente os extremos. Anos intermediários não devem ser escolhidos apenas pela posição do ponto na série.

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
- [ ] Desktop e notebook foram priorizados; tablet, celular, zoom e textos longos foram considerados. A validação executável depende do modo explicitamente solicitado conforme `AGENTS.md`.
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

Nas páginas de Indicadores de Educação, o início usa cabeçalho editorial
compacto integrado ao conteúdo: identificação superior, `h1` serifado,
subtítulo curto e chips horizontais de contexto com ícone, rótulo e valor. A
faixa clara de seção e seus filtros vêm imediatamente abaixo; não há hero alto,
card lateral de contexto nem card introdutório intermediário. Seções, detalhes,
cenários e metodologia reutilizam a mesma anatomia com apenas os contextos
necessários. Leituras rápidas usam título e texto sobre superfície neutra, sem
ponto decorativo de status competindo com o conteúdo.

## Indicadores de participação acumulada na expansão

Indicadores configurados com `presentationMode: 'expansion-share-baseline'` usam uma apresentação divergente própria. Antes de haver dados suficientes do ciclo iniciado em 2026, o recorte histórico deve ser identificado como contexto pré-ciclo, sem classificação de alcance da meta. A análise principal deve decompor as variações pública e total ao redor de zero e comparar o resultado com o patamar em uma escala que preserve valores negativos e superiores a 100%. Indicadores percentuais tradicionais permanecem no padrão de série temporal existente.
