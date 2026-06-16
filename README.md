# Dashboard PNE React/Vite

Base navegavel do Dashboard PNE em React/Vite, usando dados JSON estaticos
exportados pelo pipeline local em `data_pipeline`.

## Rodar localmente

```powershell
cd C:\Users\rnbirck\PROJETOS\DASHBOARD-PNE-REACT
npm install
npm run dev
```

O Vite abre a aplicacao em `http://127.0.0.1:5173/` ou na proxima porta livre.

## Atualizar os dados

Os dados publicos do React ficam em `public/data`. Eles sao gerados a partir do
pipeline local em `data_pipeline` e particionados por municipio.

Antes de atualizar os dados pela primeira vez, crie `data_pipeline/.env` a partir
de `data_pipeline/.env.example` com as credenciais do banco local. Se quiser usar
um Python especifico, defina `PNE_PYTHON`; se as planilhas da Sinopse estiverem em
outro lugar, defina `SINOPSE_CENSO_DIR`.

```powershell
cd C:\Users\rnbirck\PROJETOS\DASHBOARD-PNE-REACT
.\scripts\update_react_data.ps1
```

Esse script:

- executa `data_pipeline/scripts/export_static_data.py --include-derived`;
- executa `data_pipeline/scripts/partition_static_data.py`;
- limpa e recopia `public/data` no projeto React;
- recalcula os indicadores de creche e pre-escola com as planilhas da Sinopse
  Estatistica do Censo Escolar;
- roda `npm run build`.

## Estrutura dos dados

- `data_pipeline/queries`: queries SQL usadas para captar dados do banco.
- `data_pipeline/src`: modulos Python usados para calcular indicadores, rankings
  e diagnostico.
- `public/data/municipios.json`: lista global de municipios.
- `public/data/indicadores.json`: categorias e metadados dos indicadores.
- `public/data/municipios_index.json`: mapa de municipio para slug e arquivo.
- `public/data/municipios/{slug}/index.json`: indicadores, rankings e diagnostico
  do municipio selecionado.

Os arquivos grandes agregados por ciclo nao sao necessarios no React. A aplicacao
carrega apenas os dados globais pequenos na abertura e, depois, o JSON do municipio
selecionado sob demanda.

## Build e hospedagem estatica

```powershell
npm run build
```

O build gera a pasta `dist`, pronta para hospedagem estatica. A hospedagem precisa
servir os arquivos de `dist` e os JSONs copiados de `public/data`.

## Seguranca

`public/data` e publico no navegador. Nao coloque `.env`, senhas, strings de
conexao, tokens, dumps privados ou qualquer segredo nessa pasta.
