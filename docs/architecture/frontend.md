---
status: reference
scope: "Arquitetura e fronteiras do frontend React"
last_validated: 2026-07-17
read_when: "Ao alterar rotas, carregamento, páginas, domínios ou fronteiras TypeScript"
supersedes: "Documento anterior de arquitetura do frontend"
---

# Arquitetura do frontend

```text
main.jsx
  → App.jsx
    ├─ useAppHashNavigation
    ├─ useInitialAppData
    ├─ MunicipalityProvider
    ├─ Layout
    └─ AppContent → AppPageRouter → páginas
```

`useInitialAppData` carrega em paralelo `municipios.json`, `indicadores.json` e `municipios_index.json`. `MunicipalityProvider` persiste a seleção; `useMunicipioData` resolve nome → slug e carrega o JSON municipal. `loadJson` mantém cache e deduplica requisições em andamento. Complementos de domínio são carregados somente quando necessários.

## Navegação e composição

`src/app/appHash.ts` normaliza, interpreta e constrói hashes. `appRoutes.ts` resolve aliases e página ativa; `hashNavigation.ts` adapta o navegador. `useAppHashNavigation` observa `hashchange` e entrega contexto analisado. Não leia `window.location` em páginas.

Para adicionar rota ou alias, altere `appRoutes.ts` e `scripts/checks/app-routing-test.mjs`. Registre páginas em `AppPageRouter`; carregadores ficam em `data/`, UI compartilhada em `components/` e cálculo no pipeline Python. React apenas consome JSON publicado; `public/data` não é fonte manual.

## Domínios

`src/features/education/` concentra Educação. `EducationPage.tsx` orquestra o payload, `useEducationPageState.ts`, a seção e o detalhe. Seletores ficam em `educationSelectors.ts`; composições em `components/`; view models em `educationViewModels.ts`; rótulos em `educationFormatters.ts`; contratos em `educationTypes.ts`.

`data/educationIndicatorCatalog.js` permanece compartilhado porque Header e resolução de hash o consomem. `data/educationData.js` também atende Financeiro. Cards, gráficos, tabelas, resumos e CSS permanecem compartilhados enquanto tiverem consumidores externos ao domínio.

## Carregamento e TypeScript

`AppPageRouter` é a fronteira de code splitting. Home é eager; PNE, metas legais, ciclo compartilhado, Educação, Diagnóstico e Financeiro são lazy sob fallback e error boundary locais. PNE 2014 e 2026 compartilham `CyclePage`; a divisão interna de Financeiro continua adiada.

`src/types/`, raiz, roteamento, hooks de infraestrutura, contexto municipal e carregadores JSON usam TypeScript `strict`. Páginas analíticas, componentes visuais e catálogos extensos permanecem em JavaScript até haver tarefa própria.

## Decisões adiadas

- React Router;
- migração completa para `features`;
- CSS Modules;
- remoção ampla de `App.css`.
