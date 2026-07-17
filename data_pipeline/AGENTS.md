# Regras do pipeline de dados

Leia `docs/methodology/README.md` para métodos vigentes e `docs/methodology/data-gaps.md` para limitações conhecidas.

- Catálogo, metadados e fórmulas dos ciclos ficam em `src/views/pne_2014_2024.py` e `src/views/pne_2026_2036.py`; detalhes compartilhados ficam em `src/views/pne_shared.py` e `src/views/indicator_details.py`.
- `src/data/`, `src/data_loader.py` e `queries/` definem as fontes. Não altere query ou fonte em tarefa de cálculo isolada sem necessidade demonstrada.
- `scripts/export_static_data.py` exporta; `partition_static_data.py` particiona; `update_static_data.py` sincroniza, valida e constrói.
- `export/data` e `export/data_partitioned` são gerados; `export/debug` é validação local. Nunca edite `public/data` manualmente.
- Mantenha ausência diferente de zero e não invente numerador, denominador, série, ano ou comparação.
- Não altere React ou estilos em tarefa exclusiva de indicador.

Validação focada:

```powershell
npm run verify:indicator -- --cycle <ciclo> --indicator <chave> --municipio "São Leopoldo" --profile
```

Depois execute os testes Python relacionados. Use `npm run update:data:skip-build -- --profile` apenas para integração e `npm run update:data -- --profile` uma vez na validação final. O caminho rápido ainda pode carregar consultas compartilhadas e a lista global de municípios.
