# Regras de `src`

Leia `docs/architecture/frontend.md` para fronteiras e `docs/ui/GUIDE.md` antes de mudar interface.

- Rotas, aliases e hashes ficam em `app/appRoutes.ts` e `app/appHash.ts`; não interprete `window.location` fora da navegação.
- Páginas grandes são lazy em `app/AppPageRouter.tsx`. Home permanece eager.
- Trabalho novo de domínio prefere `features/<domain>/`; mova um arquivo compartilhado somente quando não houver consumidores externos.
- `pages/` compõe telas; `components/` contém UI compartilhada; `data/` carrega e adapta JSON; `context/` mantém estado global; cálculos pertencem a `data_pipeline/`.
- Preserve as fronteiras TypeScript existentes. Não migre páginas analíticas ou componentes em uma tarefa não relacionada.
- Nunca edite `public/data` manualmente nem implemente fórmula de indicador no frontend.
- UI reutiliza `styles/design-tokens.css`, `styles/platform-ui.css`, `styles/chart-system.css` e componentes existentes. `App.css` é legado.
- Mudança estrutural não pode alterar DOM, classes, textos ou aparência sem escopo visual explícito.

Valide o menor conjunto relevante. Para mudança estrutural de UI, execute `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:ui-architecture` e `git diff --check`. Use a matriz de `docs/ui/TESTING.md` para escolher catálogo, roteamento, E2E e regressão visual.
