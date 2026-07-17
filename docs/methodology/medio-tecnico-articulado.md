---
status: normative
scope: "Percentual de matrículas do ensino médio integradas à educação profissional técnica"
last_validated: 2026-07-17
read_when: "Ao alterar a Meta 12.a, o ensino médio técnico integrado ou seus dados complementares"
supersedes: "Metodologia anterior do ensino médio técnico articulado"
---

# Ensino médio técnico articulado

## Chave e definição

`medio_tecnico_articulado_percentual` é o indicador aproximado da Meta 12.a. Mede matrículas em cursos técnicos integrados ao ensino médio sobre o total de matrículas do ensino médio. Matrículas concomitantes são apoio, não numerador principal. `medio_tecnico` permanece como indicador legado do PNE 2014–2024, e `medio_tecnico_participacao_publica` é outra metodologia.

## Fórmula

```text
principal = 100 × mat_integrado_total / mat_medio

apoio:
mat_articulado_total = mat_integrado_total + mat_concomitante_total
percentual_articulado_total = 100 × mat_articulado_total / mat_medio
```

Normal/Magistério, subsequente, integrado à EJA, FIC e total geral da EPT não entram no numerador. A meta exibida é 50% em 2036.

## Fonte, período e granularidade

Fonte: INEP, Sinopse Estatística da Educação Básica, layout EPT 1.30 até 2024 e 1.42 em 2025. A associação é por ano e código IBGE, com uma linha por município. Dependências administrativas são preservadas para reconciliação. A fonte pode conter 2014; o ciclo vigente e a referência estadual usam 2015–2025, sem interpolação ou anos posteriores.

## Nulos e validação

- Zero presente é válido; ausência permanece ausente.
- `mat_medio = 0` mantém o percentual nulo; integrado zero com denominador positivo produz 0%.
- Negativos, código IBGE vazio, duplicidade e divergência entre total e dependências rejeitam a carga.
- Percentual principal acima de 100% é preservado e marcado para auditoria, pois os universos podem divergir; o apoio integrado + concomitante também pode superar 100%.
- A cobertura é `aproximada` e a referência estadual não projeta esse indicador.

## Implementação, consumidores e testes

- Cálculo: `data_pipeline/src/medio_tecnico_articulado.py`.
- Ciclo e detalhe: `data_pipeline/src/views/pne_2026_2036.py` e `src/views/indicator_details.py`.
- Estado: `data_pipeline/src/pne_state_reference.py`, por razão de somas.
- Frontend: catálogos do ciclo, metas legais, `CyclePage`, `IndicatorDetail` e `IndicatorComplementaryData`.
- Testes: `data_pipeline/tests/test_medio_tecnico_articulado.py`, `test_pne_state_reference.py`, `scripts/checks/verify-state-reference.cjs` e checks de unidade/detalhe.

Limitação: a medida usa matrículas, não estudantes únicos, e funciona como aproximação operacional da meta legal. Não converta concomitante em parte do numerador principal sem nova decisão metodológica.
