# Guia operacional de `src`

## Domain features

New domain work should prefer `features/<domain>/`. Shared components stay in
`components/`, and shared loaders stay in `data/`; do not move a file into a
feature while it has consumers outside that domain.

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
- Durante o trabalho, execute o menor conjunto de testes relevante; antes de concluir, valide a alteração afetada.
