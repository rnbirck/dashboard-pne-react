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
- Cenários interativos podem manter estado local. Não use providers globais salvo quando um componente real realmente exigir um provider seguro e previsível.
- Novos arquivos usam TypeScript e evitam tipos inseguros.

## Validação

- Execute `npm run typecheck`, `npm run test:dev-ui`, `npm run lint` e `npm run build`.
- Confirme que o catálogo funciona sem município e que nenhuma requisição a `/data/` ocorre.
- Confirme que `dist` não contém `dev-ui`, `src/dev-ui` nem o título do catálogo.
- O seletor interno de largura é uma inspeção rápida. Continue validando breakpoints reais em E2E e regressão visual.
