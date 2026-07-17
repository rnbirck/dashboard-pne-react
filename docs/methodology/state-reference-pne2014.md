---
status: normative
scope: "Referência estadual do Rio Grande do Sul para o PNE 2014–2024"
last_validated: 2026-07-17
read_when: "Ao alterar agregação, comparabilidade ou artefato estadual do ciclo encerrado"
supersedes: "Documento metodológico anterior da referência estadual do ciclo encerrado"
---

# Referência estadual — PNE 2014–2024

## Artefato e chaves

O artefato é `public/data/pne_2014_2024/referencia_estadual.json`, gerado pelo pipeline e independente do município selecionado. Chaves atualmente comparáveis:

`creche`, `pre_escola`, `basico_6_17`, `basico_15_17`, `basico_integral`, `escolas_integral`, `eja_integrada_educacao_profissional_percentual`, `medio_tecnico_participacao_publica`, `pos_graduacao` e `alfabetizacao_pop_15_mais`.

As chaves `ensino_medio_ou_basica_completa_pop_15_17` e `ensino_fundamental_ou_completo_pop_6_14` estão registradas como `unavailable`. As demais entradas bloqueadas aparecem em `data-gaps.md` e não recebem valor substituto.

## Fórmulas e granularidade

Para taxas agregáveis:

```text
Referência RS (ano) = 100 × Σ numeradores municipais válidos / Σ denominadores municipais válidos
```

Não há média de percentuais municipais. `escolas_integral` classifica cada escola pública elegível pelo corte de 25% antes da razão estadual. `medio_tecnico_participacao_publica` agrega totais estaduais público e privado e calcula participação sobre expansões anuais positivas acumuladas desde 2013. `alfabetizacao_pop_15_mais` usa contagens brutas dos snapshots censitários de 2010 e 2022.

A granularidade de entrada varia entre município/ano, escola/ano e snapshot censitário; o artefato final é indicador/ano. A janela geral é 2014–2024, preservadas as bases especiais acima.

## Nulos, comparação e fontes

Pares incompletos são excluídos; nulo não vira zero; denominador estadual zero produz `null`; arredondamento ocorre somente na UI. Cada ponto registra numerador, denominador, cobertura municipal, cobertura do denominador, fonte, filtros e versão.

Município e RS só são comparados com mesma chave, ano final, fonte, filtro, unidade e universo. Snapshots permanecem em 2010/2022. Fontes combinam Censo Escolar e Sinopse do INEP, estimativas populacionais oficiais e Censo Demográfico/contagens oficiais conforme o registro executável em `data_pipeline/src/pne_2014_state_reference.py`.

## Fluxo, consumidores e testes

- Registro e construção: `data_pipeline/src/pne_2014_state_reference.py` e `src/pne_state_reference.py`.
- Exportação: `scripts/export_static_data.py` e `partition_static_data.py`.
- UI: `src/data/staticData.js`, `src/utils/stateReference.js`, `src/pages/CyclePage.jsx` e `src/components/MetaCard.jsx`.
- Testes: `data_pipeline/tests/test_pne_2014_state_reference.py`, `npm run check:state-reference`, `npm run check:state-json:closed` e `npm run check:state-json`.

Limitação: `methodology_pending` e `unavailable` são estados reais do registro; não podem ser contornados por média municipal, taxa pronta de universo diferente ou zero.
