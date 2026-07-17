---
status: normative
scope: "Percentual municipal e estadual de matrículas da EJA articuladas à educação profissional"
last_validated: 2026-07-17
read_when: "Ao alterar a chave de EJA articulada, suas fontes, metas, detalhes ou referência estadual"
supersedes: "Metodologia e plano de execução anteriores da EJA articulada"
---

# EJA articulada à educação profissional

## Chave e definição

A chave percentual vigente nos dois ciclos é `eja_integrada_educacao_profissional_percentual`. Ela mede a parcela das matrículas da EJA articuladas a curso técnico ou FIC integrado. A chave `eja_integrada_educacao_profissional` permanece como contagem absoluta complementar em Educação; não troque sua unidade nem a use para acompanhamento percentual.

## Fórmula

Para cada par único de ano e código IBGE:

```text
numerador =
  mat_eja_curso_tecnico_integrada
  + mat_eja_fic_integrado_fundamental
  + mat_eja_fic_integrado_medio

denominador = mat_eja_fundamental_total + mat_eja_medio_total
percentual = 100 × numerador / denominador
```

Dependências federal, estadual, municipal e privada servem à reconciliação dos totais e não são somadas novamente. `mat_eja_total` também é conferência: precisa coincidir com fundamental + médio, mas não substitui os componentes no cálculo.

## Fonte, período e granularidade

Fonte exclusiva: INEP, Sinopse Estatística da Educação Básica. O sincronizador `data_pipeline/scripts/sync_eja_integrada_from_sinopse.py` identifica o quadro municipal por cabeçalhos normalizados, não por letra ou posição fixa. Nas edições atualmente conhecidas, o quadro EJA aparece como 1.34 em 2014–2022, 1.35 em 2023–2024 e 1.49 em 2025; a EPT usa 1.30 até 2024 e 1.42 em 2025.

A base tem uma linha por município e ano. A série fonte cobre 2014–2025; o ciclo encerrado publica observações até 2024, e o vigente usa o resultado disponível dentro de sua janela até 2025. Não há preenchimento de anos futuros.

## Nulos e validação

- Componente ausente mantém numerador ou denominador ausente; não use `COALESCE` para criar zero.
- Denominador zero produz percentual indisponível.
- Numerador zero com denominador positivo produz 0% válido.
- Negativos, duplicidade ano + município, numerador maior que denominador e reconciliação inconsistente rejeitam a carga.
- Percentual calculado precisa ficar entre 0% e 100%. Campos armazenados são apenas conferência; o valor publicado é recalculado.

## Semântica dos ciclos

- PNE 2014–2024, Meta 10: referência de 25%, último resultado até 2024.
- PNE 2026–2036, Meta 12.c: referência intermediária de 25% em 2031 e meta final de 50% em 2036, sem trajetória anual inferida.
- A referência RS usa razão das somas dos componentes brutos, nunca média de percentuais municipais.

## Implementação, consumidores e testes

- Cálculo e validação: `data_pipeline/src/eja_integrada_indicator.py`.
- Query e carga: `data_pipeline/queries/eja_integrada_educacao_profissional.sql`, `src/data/repository.py` e `src/data_loader.py`.
- Ciclos e detalhes: `src/views/pne_2014_2024.py`, `src/views/pne_2026_2036.py`, `src/views/pne_shared.py` e `src/views/indicator_details.py`.
- Referências estaduais: `src/pne_2014_state_reference.py` e `src/pne_state_reference.py`.
- Frontend: catálogos de indicadores, metas legais, `IndicatorDetail` e `IndicatorComplementaryData`.
- Testes: `data_pipeline/tests/test_eja_integrada_indicator.py`, testes das referências estaduais e `scripts/checks/pne-accumulative-cycle.test.mjs`.

Limitação atual: o texto de fonte incorporado em alguns payloads ainda resume o quadro EJA como “1.35”, apesar da variação anual detectada semanticamente. A validação editorial dessa atribuição está registrada em `data-gaps.md`.
