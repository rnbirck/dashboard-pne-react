# Painel PNE

Aplicação web estática para leitura municipal de indicadores educacionais, metas dos ciclos do PNE, diagnóstico e financiamento da educação. O frontend usa React, TypeScript e Vite; os JSONs servidos em produção ficam em `public/data` e são mantidos pelo pipeline Python do repositório.

## Ambiente local

Requisitos: Node.js compatível com Vite 8, npm e Python 3.11 ou superior.

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r data_pipeline\requirements.txt
npm run dev
```

O servidor local usa `http://127.0.0.1:5173` por padrão. O frontend não precisa de credenciais para consumir os dados já versionados.

## Comandos principais

```powershell
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

Os testes E2E esperam uma aplicação ativa. Em um terminal:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Em outro:

```powershell
npm run test:e2e
```

Defina `BASE_URL` para testar outro endereço.

## Dados estáticos

`public/data` é parte do produto e deve continuar versionado. O fluxo principal de atualização é:

```powershell
npm run update:data
```

Ele exporta os dados agregados, particiona por município, sincroniza os JSONs para `public/data`, atualiza o piloto de desigualdades, valida os detalhes e executa o build. Para omitir apenas o build final:

```powershell
npm run update:data:skip-build
```

Para validar um indicador sem publicar dados:

```powershell
npm run verify:indicator -- --cycle pne_2026_2036 --indicator creche --municipio "São Leopoldo"
```

O conjunto educacional complementar em `public/data/educacao` tem fluxo próprio. Defina `SENAI_DB_DIR` para o projeto que fornece `utils_educacao` e execute:

```powershell
npm run update:education-data
```

Credenciais do pipeline ficam em `data_pipeline/.env`, criado a partir de `data_pipeline/.env.example`. Nunca inclua segredos em `public/data`.

## Estrutura

- `src`: aplicação React, rotas, componentes, features, modelos e estilos.
- `public/data`: dados públicos servidos diretamente ao navegador.
- `data_pipeline/src`: cálculo, acesso às fontes e contratos de dados.
- `data_pipeline/scripts`: atualização, materialização e validação permanentes.
- `data_pipeline/data`: snapshots e contratos-fonte necessários para regeneração.
- `data_pipeline/tests`: testes de domínio e do pipeline.
- `scripts/checks`: testes e verificações permanentes do frontend.

Saídas de build, caches, relatórios de execução, screenshots e auditorias locais não são versionados.

## Documentação canônica

- [Produto](PRODUCT.md)
- [Arquitetura](docs/ARQUITETURA.md)
- [Design](docs/DESIGN.md)
- [Pipeline e operação](docs/OPERACAO.md)
- [Metodologia](docs/METODOLOGIA.md)

## Publicação

```powershell
npm run build
```

Publique o conteúdo de `dist` em hospedagem estática com fallback para `index.html`. A aplicação usa navegação por hash e carrega os JSONs por caminhos absolutos sob `/data`.
