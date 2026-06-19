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

## Comandos disponiveis

```powershell
npm run dev
npm run build
npm run lint
npm run check:units
npm run list:indicators
npm run validate:details
npm run test:e2e
```

- `npm run dev`: inicia o Vite para desenvolvimento local.
- `npm run build`: gera o build estatico em `dist`.
- `npm run lint`: valida o codigo com ESLint.
- `npm run check:units`: verifica coerencia dos `value_mode` em `public/data/indicadores.json`.
- `npm run list:indicators`: lista indicadores e modos de valor para revisao manual.
- `npm run validate:details`: valida o contrato basico dos JSONs em `public/data/municipios/*/details/*.json`.
- `npm run test:e2e`: roda o teste Playwright contra uma instancia local ja ativa.

Para o teste e2e, mantenha o Vite rodando em `localhost:5173`:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
npm run test:e2e
```

Se precisar testar outro endereco, defina `BASE_URL` antes de rodar `test:e2e`.

## Atualizar os dados

Os dados publicos do React ficam em `public/data`. Eles sao gerados a partir do
pipeline local em `data_pipeline` e particionados por municipio.

Antes de atualizar os dados pela primeira vez, crie `data_pipeline/.env` a partir
de `data_pipeline/.env.example` com as credenciais do banco local.

`SINOPSE_CENSO_DIR` e obrigatorio para `scripts/update_react_data.ps1` e deve
apontar para a pasta com as planilhas da Sinopse Estatistica do Censo Escolar.
`PNE_PYTHON` continua opcional, caso queira usar um Python especifico.

Exemplo no PowerShell:

```powershell
$env:SINOPSE_CENSO_DIR = "C:\caminho\para\sinopse_estatistica_censo"
$env:PNE_PYTHON = "C:\caminho\para\python.exe" # opcional
```

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
