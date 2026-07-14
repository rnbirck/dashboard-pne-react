# Pipeline de dados

## Mapa operacional

- `src/views/pne_2014_2024.py` e `src/views/pne_2026_2036.py`: catálogo, metadados e fórmulas dos indicadores por ciclo.
- `src/views/pne_shared.py`: apresentação e dados complementares compartilhados; `src/views/diagnostico.py` produz o diagnóstico.
- `src/data/` e `src/data_loader.py`: acesso às fontes; `queries/`: SQL das fontes. Não altere queries ou fontes em uma tarefa de cálculo isolada.
- `scripts/export_static_data.py`: exportação agregada, filtro rápido, serialização e perfil.
- `scripts/partition_static_data.py`: converte a exportação agregada em arquivos por município.
- `scripts/update_static_data.py`: fluxo completo de export, partition, sincronização, validação e build.
- `export/data` e `export/data_partitioned` são gerados; `export/debug` contém apenas saídas locais de validação. `public/data` é gerado e nunca pode ser editado manualmente.

## Localizar e alterar um indicador

Procure a chave em `src/views/pne_2014_2024.py` ou `src/views/pne_2026_2036.py` com `rg '"<chave>"' data_pipeline/src/views`. A fórmula está no `compute` do item ou no cálculo em lote correspondente; os metadados ficam no mesmo catálogo. Não altere UI, componentes React ou estilos em tarefas de indicador.

## Fluxos de validação

Rápido — um município e um ou mais indicadores; grava somente em `export/debug` e não particiona, sincroniza nem faz build:

```powershell
npm run verify:indicator -- --cycle pne_2026_2036 --indicator <chave> --municipio "São Leopoldo" --profile
```

Intermediário — atualiza todos os dados e valida sem build:

```powershell
npm run update:data:skip-build -- --profile
```

Completo — execute apenas ao final, depois das verificações focadas:

```powershell
npm run update:data -- --profile
```

Para mudanças de cálculo, no mínimo execute o comando rápido, os testes Python relacionados em `data_pipeline/tests`, a comparação semântica do indicador selecionado e `npm run lint`. A atualização completa e o build ficam para a validação final; não os repita durante as tentativas.

## Limites conhecidos do caminho rápido

O filtro evita cálculos de indicadores não selecionados. Os grupos que compartilham consultas (por exemplo, IDEB, SAEB, adequação, idade regular ou infraestrutura) continuam carregando o grupo necessário e filtram as chaves antes da saída. O carregamento inicial da lista de municípios também continua global para validar o município solicitado.
