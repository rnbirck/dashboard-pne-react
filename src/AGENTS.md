# Guia operacional de `src`

## Domain features

New domain work should prefer `features/<domain>/`. Shared components stay in
`components/`, and shared loaders stay in `data/`; do not move a file into a
feature while it has consumers outside that domain.

## Lazy pages

Large pages should be imported lazily from `app/AppPageRouter.tsx`. Do not add
static page imports to the shell, and do not duplicate shared components just
to influence chunk boundaries.

| Mudança | Local principal |
| --- | --- |
| Rota, alias ou hash | `app/appRoutes.ts` e `app/appHash.ts` |
| Página | `pages/` e `app/AppPageRouter.tsx` |
| Shell ou navegação global | `app/`, `hooks/useAppHashNavigation.ts`, `components/Layout.jsx` |
| Componente reutilizável | `components/` |
| Carregador JSON | `data/` |
| Apresentação de indicador | `pages/`, `components/` e catálogos em `data/` |
| Cálculo de indicador | `data_pipeline/` |
| Estado global | `context/` |
| Estilos e tokens | `styles/` e `styles/design-tokens.css` |
| Dados gerados | `data_pipeline/` — nunca `public/data/` manualmente |

- `app/` compõe a aplicação e a navegação global; `hooks/` abriga infraestrutura reutilizável. As fronteiras centrais usam TypeScript; páginas e componentes analíticos continuam em JavaScript nesta etapa.
- `pages/` compõe telas; `components/` contém elementos compartilhados; `data/` carrega, cataloga e transforma dados para apresentação.
- Não adicione lógica de rota em `App.jsx` nem interprete `window.location` fora da camada de navegação.
- Não implemente cálculos de indicador no frontend e não edite `public/data`.
- Reutilize componentes e tokens existentes. `App.css` é legado e não cria padrões novos.
- Alterações estruturais não podem mudar DOM, classes, textos ou aparência. Migração de CSS exige tarefa própria.
- Durante o trabalho, siga a política de execução do `AGENTS.md` da raiz. Não
  execute testes ou outras validações sem pedido explícito, mesmo em mudanças
  estruturais ou compartilhadas.

## Sistema visual estabilizado

- Consulte `docs/GUIA_DE_DESIGN.md` e `docs/DESIGN_SYSTEM.md` antes de alterar interface.
- Valores pertencem a `styles/design-tokens.css`; gramática compartilhada a `styles/platform-ui.css`; anatomia de gráficos a `styles/chart-system.css`.
- CSS de domínio contém apenas layout, composição ou diferença funcional justificada. Não copie para ele controles, cards, tabelas, estados ou gráficos compartilhados.
- Preserve a ordem de imports registrada em `docs/DESIGN_SYSTEM.md`; ela é protegida por `npm run test:ui-architecture`.
- Não adicione tooltip ou legenda canônica de gráfico fora de `chart-system.css` e não faça `App.css` ultrapassar o teto de proteção sem uma migração documentada.

Matriz de validação disponível quando o usuário ativar explicitamente a
validação rápida ou completa:

- componente isolado: catálogo e regressão isolada;
- navegação/interação: catálogo, roteamento e E2E;
- página/composição: catálogo, E2E e regressão pública;
- cálculo/indicador: `verify:indicator` e testes de domínio.

Para mudança estrutural de UI, `npm run typecheck`, `npm run lint`,
`npm run build`, `npm run test:ui-architecture` e verificações de Git só podem ser
executados no modo de validação explicitamente solicitado. No modo rápido, apenas
implemente e informe o risco compartilhado conforme o `AGENTS.md` da raiz.
