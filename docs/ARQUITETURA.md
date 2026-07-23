# Arquitetura

## Visão geral

O produto é uma aplicação React entregue como site estático. `src/main.jsx` monta `App.tsx`; a navegação usa hash e parâmetros preservados por `src/app` e `src/hooks`. O Vite gera `dist`, incluindo os ativos de `public`.

```text
navegador
  -> React/Vite
  -> rotas por hash
  -> loaders em src/data e src/hooks
  -> JSONs públicos em /data
```

Não há backend de aplicação em produção. Toda informação disponível no navegador deve ser tratada como pública.

## Camadas

- `src/app`: resolução de rota, limites de carregamento e composição de páginas.
- `src/pages`: páginas de alto nível.
- `src/features`: fluxos de Educação, Diagnóstico e Financiamento.
- `src/components`: componentes compartilhados.
- `src/data`: catálogos, metadados e loaders dos contratos estáticos.
- `src/utils` e `src/hooks`: apresentação, navegação e carregamento.
- `src/styles` e `src/App.css`: tokens e camadas temáticas atuais.

As rotas são resolvidas em `src/app/appRoutes.ts`. O município selecionado é mantido pelo `MunicipalityContext` e sincronizado com a URL quando necessário.

## Contratos de dados

Os arquivos globais pequenos (`municipios.json`, `municipios_index.json` e `indicadores.json`) são carregados no início. O slug continua sendo o identificador legível da rota, mas os arquivos municipais são canônicos somente pelo código IBGE: `/data/municipios/<ibge>/...`.

`public/data` é saída publicada e versionada. Snapshots que não podem ser reconstruídos durante um build comum ficam em `data_pipeline/data`. Os cenários aprovados em `data_pipeline/data/planning_scenarios` alimentam o export principal.

## Pipeline

As regras dos ciclos ficam em `data_pipeline/src/pne`, os detalhes em `pne/indicator_details.py` e os exportadores especializados em módulos Python puros. O pipeline não inicializa aplicação web, páginas, layouts ou callbacks. O fluxo operacional está em [OPERACAO.md](OPERACAO.md).

## Armazenamento versionado

A auditoria estrutural de julho de 2026 calculou tamanho e SHA-256 de cada um dos 5.999 arquivos então existentes em `public/data` e `data_pipeline/data`.

- `public/data`: 5.988 arquivos e 1.706.721.417 bytes antes da deduplicação;
- `data_pipeline/data`: 11 snapshots/fontes e 23.153.309 bytes, sem duplicata exata com `public/data`;
- aliases municipais por slug: 1.988 arquivos idênticos aos caminhos IBGE, 579.374.688 bytes;
- aliases da visão geral educacional: 497 arquivos idênticos aos arquivos IBGE, 23.214.113 bytes;
- repetição textual interna mantida: ganho bruto teórico de até 135.304.596 bytes, dos quais cerca de 21.769.710 bytes estão em títulos, unidades, fontes e textos metodológicos.

Os 602.588.801 bytes de aliases regeneráveis foram removidos após comparação byte a byte. A repetição interna foi preservada porque transformá-la em catálogos compartilhados mudaria contratos, granularidade de cache e carregamento. Os 11 arquivos de `data_pipeline/data` foram preservados por serem snapshots ou fontes de regeneração.

## Publicação e segurança

O artefato publicável é `dist`. A hospedagem deve servir arquivos estáticos e usar `index.html` como fallback. Credenciais, dumps privados e dados pessoais não podem entrar em `public`, `dist` ou arquivos versionados.
