# Catálogo visual de desenvolvimento

Estas regras se aplicam a todo arquivo em `src/dev-ui`.

## Escopo

- O catálogo é uma aplicação interna e isolada. Nunca o importe a partir de `src/main.jsx`, `src/App.tsx`, páginas, rotas ou componentes da aplicação pública.
- Preserve `vite.config.js`, `index.html`, hashes, aliases, dados, cálculos e comportamento público.
- Reutilize componentes, formatters, view models, selectors, tipos, tokens e CSS reais. Um wrapper local pode adaptar uma fixture, mas não deve copiar o JSX do componente de produção.
- Não importe loaders municipais nem funções que executem `fetch`. Fixtures não podem ler `public/data`, APIs, caches ou estado global.
- Estilos exclusivos pertencem a `catalog.css` e devem permanecer sob `.dev-ui-*` ou sob seletores iniciados por `[data-preview-width]` dentro do catálogo.
- Não edite `src/App.css` para acomodar o catálogo. Ele é importado somente porque ainda contém estilos usados pelos componentes reais.

## Fixtures e cenários

- Toda fixture deve ser pequena, explícita, determinística e tipada. Não use aleatoriedade, data atual ou rede.
- Preserve a diferença entre zero, `null`, ausência de denominador e série vazia.
- Registre cenários em `src/dev-ui/scenarios/index.ts` e mantenha pelo menos um cenário em cada categoria de `CATALOG_CATEGORIES`.
- IDs de cenário e de categoria são contratos de navegação e baseline. Não os altere sem migrar referências intencionalmente; testes nunca devem localizar cenário pelo título visível.
- Habilite regressão visual somente pelos metadados opcionais `visual` do próprio cenário. Não mantenha uma segunda lista no harness e não cadastre o modo Fluido como baseline.
- Cenários interativos podem manter estado local. Não use providers globais salvo quando um componente real realmente exigir um provider seguro e previsível.
- Novos arquivos usam TypeScript e evitam tipos inseguros.

## Validação

- Execute primeiro o cenário afetado com `npm run test:dev-ui:visual -- --scenario <id>`; atualize somente a combinação revisada com `test:dev-ui:visual:update`, nunca pelo comando normal.
- Execute `npm run typecheck`, `npm run test:dev-ui`, `npm run test:dev-ui:visual`, `npm run test:ui-architecture`, `npm run lint` e `npm run build`.
- Confirme que o catálogo funciona sem município e que nenhuma requisição a `/data/` ocorre.
- Confirme que `dist` não contém `dev-ui`, `src/dev-ui` nem o título do catálogo.
- Preserve `[data-testid="catalog-preview"]`, `data-scenario-id` e `data-catalog-ready`; o harness depende desses contratos para captura e estabilização.
- Resultados e diffs são temporários; somente `tests/dev-ui-visual/baselines` é versionado. Diferenças de dimensão são falhas e não devem ser mascaradas por tolerância.
- O seletor interno de largura é uma inspeção rápida. Continue validando breakpoints reais em E2E e regressão visual pública.
- A matriz estabilizada possui 17 cenários e 31 combinações visuais. Adicione outra combinação somente quando houver risco responsivo não coberto; não busque simetria artificial entre categorias ou viewports.
