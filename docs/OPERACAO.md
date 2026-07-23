# Pipeline e operação

## Preparação

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r data_pipeline\requirements.txt
Copy-Item data_pipeline\.env.example data_pipeline\.env
```

Preencha apenas `data_pipeline/.env`, que é ignorado pelo Git. O repositório suporta acesso PostgreSQL/Supabase conforme `data_pipeline/src/data/repository.py`.

## Atualização principal

```powershell
npm run update:data
```

O orquestrador executa, em ordem:

1. `data_pipeline/scripts/export_static_data.py --include-derived`;
2. `data_pipeline/scripts/partition_static_data.py`;
3. sincronização para `public/data`, preservando o conjunto educacional especializado;
4. `refresh_municipal_inequality_pilot.py`;
5. `validate_static_details.py`;
6. `npm run build`.

O comando bloqueia a atualização quando existem alterações fora de `public/data`. Use `--dry-run`, `--validate-only`, `--skip-export`, `--skip-partition`, `--skip-build` e `--profile` conforme a ajuda do script.

## Fluxos especializados

- `npm run update:education-data`: regenera `public/data/educacao`; exige o módulo externo `utils_educacao` sob `SENAI_DB_DIR`.
- `generate_municipal_finance.py`: atualiza contratos financeiros e, com `--sync-public`, publica a saída.
- `generate_qse_annual.py`: atualiza as séries anuais da QSE.
- `materialize_municipal_education_overview.py`: materializa a visão geral educacional municipal.
- `materialize_pne2026_public_diagnostic_v2.py`: materializa o diagnóstico público atual.
- `refresh_municipal_decision_summary.py`: atualiza a síntese decisória.
- `sync_eja_integrada_from_sinopse.py` e `sync_ept_nivel_medio_from_sinopse.py`: importam edições oficiais da Sinopse quando solicitadas.
- `npm run generate:diagnostic-catalog`: recompõe o catálogo do diagnóstico a partir dos indicadores publicados e do mapa legal.

Use `--help` em cada script antes de executar. Downloads intermediários devem ficar em `data_pipeline/cache`, e saídas intermediárias em `data_pipeline/export`; ambos são ignorados.

## Validação e publicação

Execute antes de publicar:

```powershell
npm ci
npm run typecheck
npm run lint
npm run build
npm run test:unit
npm run test:education
npm run test:app-routing
npm run test:data-sources
npm run test:ui-architecture
npm run test:python
npm run validate:details
```

Com o servidor local ativo, execute também os três comandos E2E descritos no README. Publique somente `dist` após todas as validações aplicáveis.

## Política de arquivos

Versione código, configurações, testes permanentes, documentação canônica, `public/data` e fontes não regeneráveis de `data_pipeline/data`. Não versione caches, logs, screenshots, relatórios de auditoria, planilhas geradas, resultados Playwright ou diretórios de build.
