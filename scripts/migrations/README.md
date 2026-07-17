---
status: reference
scope: "Uso seguro das migrações manuais de dados"
last_validated: 2026-07-17
read_when: "Antes de executar qualquer script em scripts/migrations"
supersedes: []
---

# Manual migrations

These scripts are manual maintenance utilities. They mutate
`public/data/indicadores.json` and must not be executed automatically by the app,
the data update pipeline, CI, or npm lifecycle hooks.

Run them only after reviewing the intended data change and keeping a backup or
git diff of `public/data/indicadores.json`.
