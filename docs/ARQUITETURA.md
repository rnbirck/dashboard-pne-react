# Arquitetura

## Visão geral

O produto é uma aplicação React entregue como site estático. `src/main.jsx` monta `App.tsx`; a navegação usa hash e parâmetros preservados pelos módulos em `src/app` e `src/hooks`. O Vite gera `dist`, incluindo os ativos de `public`.

```text
navegador
  -> React/Vite
  -> rotas por hash
  -> loaders em src/data e src/hooks
  -> JSONs públicos em /data
```

Não há backend de aplicação em produção. Toda informação disponível no navegador deve ser tratada como pública.

## Camadas do frontend

- `src/app`: resolução de rota, limites de carregamento e composição de páginas.
- `src/pages`: páginas de alto nível.
- `src/features`: fluxos coesos de Educação, Diagnóstico e Financiamento.
- `src/components`: componentes compartilhados usados pela aplicação atual.
- `src/data`: catálogos, metadados e loaders dos contratos estáticos.
- `src/utils` e `src/hooks`: regras de apresentação, navegação e carregamento.
- `src/styles` e `src/App.css`: tokens, camadas temáticas e compatibilidade dos estilos existentes.

As rotas públicas são resolvidas em `src/app/appRoutes.ts`. O município selecionado é mantido pelo `MunicipalityContext` e sincronizado com a URL quando necessário.

## Contratos de dados

Os arquivos globais pequenos (`municipios.json`, `municipios_index.json` e `indicadores.json`) são carregados no início. Os payloads municipais são carregados sob demanda por slug ou código. Módulos especializados usam caminhos próprios, como `public/data/educacao`, `public/data/municipal_finance` e `public/data/qse_annual`.

`public/data` é saída publicada e versionada. Snapshots que não podem ser baixados ou reconstruídos durante um build comum ficam em `data_pipeline/data`. Os contratos aprovados de cenários de planejamento ficam em `data_pipeline/data/planning_scenarios` e alimentam o export principal.

## Pipeline

O pipeline Python consulta fontes, calcula indicadores e produz os JSONs estáticos. O export principal ainda importa módulos históricos de visualização Dash porque parte das regras de cálculo permanece nesses módulos; `data_pipeline/app.py` cria o contexto exigido por `dash.register_page`. Essa dependência pertence somente ao pipeline local e não é enviada no bundle React.

O fluxo e os comandos de manutenção estão em [OPERACAO.md](OPERACAO.md).

## Publicação e segurança

O artefato publicável é `dist`. A hospedagem deve servir arquivos estáticos e usar `index.html` como fallback. Credenciais, dumps privados e dados pessoais não podem entrar em `public`, `dist` ou arquivos versionados.
