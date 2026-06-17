# Manual migrations

These scripts are manual maintenance utilities. They mutate
`public/data/indicadores.json` and must not be executed automatically by the app,
the data update pipeline, CI, or npm lifecycle hooks.

Run them only after reviewing the intended data change and keeping a backup or
git diff of `public/data/indicadores.json`.
