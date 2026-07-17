---
status: reference
scope: "Execução local, comandos e fluxo de dados estáticos"
last_validated: 2026-07-17
read_when: "Ao instalar, executar, validar ou atualizar dados do projeto"
supersedes: []
---

# Dashboard PNE React/Vite

Base navegavel do Dashboard PNE em React/Vite, usando dados JSON estaticos
exportados pelo pipeline local em `data_pipeline`.

## Rodar localmente

```powershell
npm install
npm run dev
```

O Vite abre a aplicacao em `http://127.0.0.1:5173/` ou na proxima porta livre.

## Documentação

- [`PRODUCT.md`](PRODUCT.md): público, propósito e princípios do produto.
- [`docs/README.md`](docs/README.md): índice de arquitetura, UI, testes e metodologia.
- [`AGENTS.md`](AGENTS.md): regras operacionais e roteamento por área.

## Comandos disponiveis

```powershell
npm run dev
npm run build
npm run lint
npm run check:units
npm run list:indicators
npm run update:data
npm run update:data:skip-build
npm run verify:indicator -- --cycle pne_2026_2036 --indicator <chave> --municipio "São Leopoldo"
npm run validate:details
npm run test:e2e
```

- `npm run dev`: inicia o Vite para desenvolvimento local.
- `npm run build`: gera o build estatico em `dist`.
- `npm run lint`: valida o codigo com ESLint.
- `npm run check:units`: verifica coerencia dos `value_mode` em `public/data/indicadores.json`.
- `npm run list:indicators`: lista indicadores e modos de valor para revisao manual.
- `npm run update:data`: roda export, partition, sync para `public/data`, validacao e build.
- `npm run update:data:skip-build`: roda a atualizacao dos dados sem executar o build final.
- `npm run verify:indicator -- --cycle <ciclo> --indicator <chave> --municipio <nome>`: exporta e valida somente o indicador solicitado em `data_pipeline/export/debug`; não altera `public/data`, não particiona, não sincroniza e não executa build. Repita `--indicator` para validar mais de uma chave.
- `npm run validate:details`: valida o contrato basico dos JSONs em `public/data/municipios/*/details/*.json`.
- `npm run test:e2e`: roda o teste Playwright contra uma instancia local ja ativa.

Para o teste e2e, mantenha o Vite rodando em `localhost:5173`:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
npm run test:e2e
```

Se precisar testar outro endereco, defina `BASE_URL` antes de rodar `test:e2e`.

## Atualizacao dos dados estaticos

Os dados publicos do React ficam em `public/data`. Eles sao gerados a partir do
pipeline local em `data_pipeline` e particionados por municipio.

O comando principal e:

```powershell
npm run update:data
```

Esse comando orquestra:

- `python data_pipeline/scripts/export_static_data.py --include-derived`;
- `python data_pipeline/scripts/partition_static_data.py`;
- sincronizacao de `data_pipeline/export/data_partitioned` para `public/data`;
- `npm run validate:details`;
- `npm run build`.

Use `npm run update:data:skip-build` quando quiser atualizar e validar os dados
sem gerar o build estatico no final. Use
`python data_pipeline/scripts/update_static_data.py --validate-only` quando
quiser rodar apenas a validacao dos detalhes, sem export, partition, sync ou
build.

## Desenvolvimento rápido de indicadores

Antes do fluxo completo, valide uma alteração de cálculo com um município e a
chave do indicador. O resultado parcial preserva o contrato do resultado do
indicador e fica somente em `data_pipeline/export/debug`, que é ignorado pelo
Git.

```powershell
npm run verify:indicator -- --cycle pne_2026_2036 --indicator creche --municipio "São Leopoldo" --profile
```

Para uma amostra limitada, use `--limit` (em conjunto com ou sem `--municipio`):

```powershell
npm run verify:indicator -- --cycle pne_2026_2036 --indicator creche --indicator pre_escola --limit 2
```

O comando falha com código diferente de zero para ciclo, indicador ou município
inexistente. O carregamento da lista de municípios continua global para validar
o nome informado. Indicadores que compartilham uma consulta por grupo podem
carregar esse grupo, mas o cálculo e a saída são filtrados para as chaves pedidas.

Quando a alteração estiver pronta, mantenha estes fluxos separados:

```powershell
# Intermediário: exporta, particiona, sincroniza e valida; sem build.
npm run update:data:skip-build -- --profile

# Completo: execute uma vez ao final.
npm run update:data -- --profile
```

`--profile` mostra os tempos de carregamento, cálculos por ciclo, saídas
complementares, serialização e, no fluxo completo, export, particionamento,
sincronização, validação e build em ordem de duração.

O orquestrador para no primeiro erro, mostra `git status --short` no final e nao
faz commit nem push. Antes de etapas que podem alterar dados, ele bloqueia a
execucao se houver alteracoes fora de `public/data`.

`public/data` continua versionado porque e a fonte servida pelo React.
`data_pipeline/export` e intermediario do pipeline local e nao deve ser
commitado.

Antes de atualizar os dados pela primeira vez, crie `data_pipeline/.env` a partir
de `data_pipeline/.env.example` com as credenciais do banco local.

O fluxo legado `scripts/update_react_data.ps1` tambem recalcula indicadores de
creche e pre-escola a partir das planilhas da Sinopse Estatistica do Censo
Escolar. Para esse script, `SINOPSE_CENSO_DIR` deve apontar para a pasta com as
planilhas e `PNE_PYTHON` continua opcional, caso queira usar um Python
especifico.

Exemplo no PowerShell para o fluxo legado:

```powershell
$env:SINOPSE_CENSO_DIR = "C:\caminho\para\sinopse_estatistica_censo"
$env:PNE_PYTHON = "C:\caminho\para\python.exe" # opcional
```

```powershell
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
