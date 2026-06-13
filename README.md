# Dashboard PNE React/Vite

Primeira base navegável do Dashboard PNE em React/Vite, usando apenas dados JSON
estáticos exportados pelo projeto legado Python/Dash.

## Rodar localmente

```powershell
cd C:\Users\rnbirck\PROJETOS\DASHBOARD-PNE-REACT
npm install
npm run dev
```

O Vite abre a aplicação em `http://127.0.0.1:5173/` ou na próxima porta livre.

## Atualizar os dados

Os dados públicos do React ficam em `public/data`. Eles são gerados a partir do
projeto Python/Dash e particionados por município.

```powershell
cd C:\Users\rnbirck\PROJETOS\DASHBOARD-PNE-REACT
.\scripts\update_react_data.ps1
```

Esse script:

- executa `scripts/export_static_data.py --include-derived` no projeto Python;
- executa `scripts/partition_static_data.py`;
- limpa e recopia `public/data` no projeto React;
- roda `npm run build`.

## Estrutura dos dados

- `public/data/municipios.json`: lista global de municípios.
- `public/data/indicadores.json`: categorias e metadados dos indicadores.
- `public/data/municipios_index.json`: mapa de município para slug e arquivo.
- `public/data/municipios/{slug}/index.json`: indicadores, rankings e diagnóstico
  do município selecionado.

Os arquivos grandes agregados por ciclo não são necessários no React. A aplicação
carrega apenas os dados globais pequenos na abertura e, depois, o JSON do município
selecionado sob demanda.

## Build e hospedagem estática

```powershell
npm run build
```

O build gera a pasta `dist`, pronta para hospedagem estática. A hospedagem precisa
servir os arquivos de `dist` e os JSONs copiados de `public/data`.

## Segurança

`public/data` é público no navegador. Não coloque `.env`, senhas, strings de
conexão, tokens, dumps privados ou qualquer segredo nessa pasta.
