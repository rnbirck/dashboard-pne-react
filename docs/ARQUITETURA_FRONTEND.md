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

## Education domain

`src/features/education/` é o ponto principal para mudanças em Educação.
`EducationPage.tsx` é o orquestrador: carrega o payload municipal, consome
`hooks/useEducationPageState.ts`, resolve a seção/detalhe ativo e entrega view
models nomeados aos componentes. O hook concentra seção, tema, busca, detalhe e
sincronização com a rota; filtros e regras de seleção ficam em
`educationSelectors.ts`.

As composições ficam em `components/`: `EducationOverviewSection` mantém a
síntese e os acessos; `EducationIndicatorsSection` mantém busca, grupos, cards e
navegação; `EducationDemandSection` apresenta os cenários; e
`EducationMethodologySection` apresenta fontes e limitações.
`EducationIndicatorDetailView` concentra a composição específica dos detalhes
sem duplicar `useDetailViewNavigation` ou os componentes globais de gráfico,
tabela e navegação.

Cards, resumos, projeções e adaptações do JSON para apresentação são alterados
em `educationViewModels.ts`; rótulos e metadados exclusivamente educacionais
ficam em `educationFormatters.ts`; contratos locais ficam em
`educationTypes.ts`. Cálculos de indicadores e geração dos JSONs continuam no
pipeline Python em `data_pipeline/`, nunca nesses módulos de apresentação.

`data/educationIndicatorCatalog.js` remains in `data/` because Header and hash
resolution also consume it. `data/educationData.js` remains shared with
Financial. Educational cards, charts, table, and summary remain in
`components/` because other modules consume them. CSS remains in `styles/`.

## Lazy page loading

`AppPageRouter` is the code-splitting boundary. Home remains eager because it
is the small default route; PNE overview, legal goals, the shared PNE cycle,
Education, Diagnosis, and Financial load on demand under a local `Suspense`
boundary. The fallback uses the existing loading state, and a local error
boundary presents a manual retry for a failed page chunk.

PNE 2014 and 2026 share the `CyclePage` chunk. Financial remains one lazy
boundary containing its internal FUNDEB, PNATE, SIOPE, and VAAR panels; that
internal division is intentionally deferred.

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
- remoção ampla de `App.css`.
