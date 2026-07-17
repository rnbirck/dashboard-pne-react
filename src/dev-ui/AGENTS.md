# Regras do catálogo visual

O catálogo é uma aplicação interna isolada. Leia `docs/ui/TESTING.md`.

- O código público nunca importa `src/dev-ui`; não altere rotas, hashes, dados, cálculos ou comportamento público para acomodar o catálogo.
- Reutilize componentes, tipos, formatadores, view models, tokens e CSS reais. Wrappers podem adaptar props, mas não copiar JSX de produção.
- Fixtures são pequenas, tipadas, literais e determinísticas. Não usam rede, relógio, aleatoriedade, loaders municipais, `public/data` ou estado global.
- Preserve zero, `null`, denominador ausente e série vazia como estados distintos.
- Registre cenários em `scenarios/index.ts`. IDs de cenário e categoria são contratos; migre baselines deliberadamente se precisar alterá-los.
- Habilite cobertura visual apenas em `scenario.visual`; não mantenha uma segunda lista no harness.
- Estilos exclusivos ficam em `catalog.css`, sob `.dev-ui-*` ou `[data-preview-width]`. Não edite `App.css` para o catálogo.

Comece pelo cenário afetado: `npm run test:dev-ui:visual -- --scenario <id>`. Atualize somente a combinação revisada com `test:dev-ui:visual:update`. Para concluir, execute os checks proporcionais descritos no guia e confirme ausência de requisições a `/data/` e de conteúdo `dev-ui` no build público.
