# Guia operacional de `src`

| Mudança | Local principal |
| --- | --- |
| Rota, alias ou hash | `app/appRoutes.js` e `app/appHash.js` |
| Página | `pages/` e `app/AppPageRouter.jsx` |
| Shell ou navegação global | `app/`, `hooks/useAppHashNavigation.js`, `components/Layout.jsx` |
| Componente reutilizável | `components/` |
| Carregador JSON | `data/` |
| Apresentação de indicador | `pages/`, `components/` e catálogos em `data/` |
| Cálculo de indicador | `data_pipeline/` |
| Estado global | `context/` |
| Estilos e tokens | `styles/` e `styles/design-tokens.css` |
| Dados gerados | `data_pipeline/` — nunca `public/data/` manualmente |

- `app/` compõe a aplicação e a navegação global; `hooks/` abriga infraestrutura reutilizável.
- `pages/` compõe telas; `components/` contém elementos compartilhados; `data/` carrega, cataloga e transforma dados para apresentação.
- Não adicione lógica de rota em `App.jsx` nem interprete `window.location` fora da camada de navegação.
- Não implemente cálculos de indicador no frontend e não edite `public/data`.
- Reutilize componentes e tokens existentes. `App.css` é legado e não cria padrões novos.
- Alterações estruturais não podem mudar DOM, classes, textos ou aparência. Migração de CSS exige tarefa própria.
- Durante o trabalho, execute o menor conjunto de testes relevante; antes de concluir, valide a alteração afetada.
