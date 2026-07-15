# Arquitetura do frontend

```text
main.jsx
  ↓
App.jsx
  ├─ useAppHashNavigation
  ├─ useInitialAppData
  ├─ MunicipalityProvider
  ├─ Layout
  └─ AppContent
       └─ AppPageRouter
            └─ páginas
```

`useInitialAppData` carrega em paralelo `municipios.json`, `indicadores.json` e
`municipios_index.json`. `MunicipalityProvider` mantém a seleção em
`localStorage`; `useMunicipioData` resolve nome → slug pelo índice e carrega o
JSON municipal. `loadJson` mantém cache e deduplica requisições em andamento.
Páginas podem carregar complementos próprios, como bases educacionais e
referências estaduais, somente quando seu contexto exige.

## Navegação

`src/app/appHash.ts` contém as funções puras de normalização, parse, prioridade
hash → query e construção de hash. `appRoutes.ts` resolve aliases e página
ativa. `hashNavigation.ts` é apenas o adaptador compatível do navegador para
`getHashContext` e `setHashContext`. O hook observa `hashchange` e entrega o
contexto já analisado às páginas; Educação resolve seção e tema pelo catálogo,
sem acessar `window.location` diretamente.

Para adicionar uma rota ou alias, edite `app/appRoutes.ts` e amplie
`scripts/checks/app-routing-test.mjs`. Para criar uma página, registre sua
composição em `AppPageRouter`. Para um carregador, use `data/`; para um
componente compartilhado, `components/`. Mudanças na apresentação de um
indicador pertencem à página/componente e ao catálogo; cálculos pertencem ao
pipeline Python em `data_pipeline/`.

React somente consome os JSONs publicados. O pipeline Python calcula e gera os
dados; `public/data` não é fonte de edição manual.

## TypeScript incremental

`src/types/` declara os contratos de rota, navegação, carregamento inicial,
município e estado assíncrono. A raiz da aplicação, roteamento, hooks de
infraestrutura, contexto municipal e carregadores JSON usam TypeScript com
`strict` ativo. Páginas analíticas, componentes visuais e catálogos extensos
permanecem em JavaScript nesta etapa.

## Decisões adiadas

- React Router;
- migração completa para `features`;
- CSS Modules;
- lazy loading;
- remoção ampla de `App.css`.
