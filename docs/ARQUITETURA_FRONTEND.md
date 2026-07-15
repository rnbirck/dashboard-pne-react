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

`src/app/appHash.js` contém as funções puras de normalização, parse, prioridade
hash → query e construção de hash. `appRoutes.js` resolve aliases e página
ativa. `hashNavigation.js` é apenas o adaptador compatível do navegador para
`getHashContext` e `setHashContext`. O hook observa `hashchange` e entrega o
contexto já analisado às páginas; Educação resolve seção e tema pelo catálogo,
sem acessar `window.location` diretamente.

Para adicionar uma rota ou alias, edite `app/appRoutes.js` e amplie
`scripts/checks/app-routing-test.mjs`. Para criar uma página, registre sua
composição em `AppPageRouter`. Para um carregador, use `data/`; para um
componente compartilhado, `components/`. Mudanças na apresentação de um
indicador pertencem à página/componente e ao catálogo; cálculos pertencem ao
pipeline Python em `data_pipeline/`.

React somente consome os JSONs publicados. O pipeline Python calcula e gera os
dados; `public/data` não é fonte de edição manual.

## Decisões adiadas

- TypeScript;
- React Router;
- migração completa para `features`;
- CSS Modules;
- lazy loading;
- remoção ampla de `App.css`.
