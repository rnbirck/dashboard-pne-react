---
status: normative
scope: "Tendência municipal publicada nos indicadores do PNE 2026–2036"
last_validated: 2026-07-17
read_when: "Ao alterar janela, elegibilidade, inclinação, limiar ou status de tendência"
supersedes: "Documento metodológico anterior de tendência"
---

# Tendência municipal do PNE 2026–2036

## Campo, versões e fonte

O campo publicado é `trend`. O método é `theil_sen_v1`; os limiares são `percent_tau_mad_v1` para percentuais e `absolute_tau_mad_v1` para contagens. A fonte é a própria série municipal observada do indicador; o frontend apenas apresenta a classificação produzida por `data_pipeline/src/pne_trend.py`.

## Período e elegibilidade

A janela tem cinco anos-calendário e termina no `end_year` do valor exibido. Entram observações válidas em `[end_year - 4, end_year]`; zero é válido, mas nulo, vazio, `NaN` e infinito são descartados. Não há interpolação nem conversão de ausência em zero, e o histórico precisa conter o ano do card.

Quatro ou cinco observações são preferidas. Três só são aceitas se consecutivas. Série bienal, censitária ou com quebra metodológica fica indisponível quando não satisfaz essas regras.

## Cálculo e classificação

`slope` é a mediana das inclinações de todos os pares, usando a distância real entre anos. Para percentuais:

```text
tau = max(0,5 p.p./ano, 0,5 × MAD das variações anualizadas)
```

Para contagens, a fórmula usa base de 0,5 unidade/ano. `consistency` é a fração das variações que segue a direção da inclinação.

| Status | Regra |
| --- | --- |
| `up` | `slope > tau` e consistência ≥ 2/3 |
| `down` | `slope < -tau` e consistência ≥ 2/3 |
| `stable` | `|slope| ≤ tau`, sem oscilação |
| `inconclusive` | direção sem consistência ou série oscilante |
| `unavailable` | histórico, elegibilidade ou quebra metodológica inválida |

A seta representa direção bruta; indicador `at_most` crescente continua `up`. O artefato preserva `start_year`, `end_year`, `observations`, `slope`, `threshold`, `consistency` e `unavailable_reason` para auditoria.

Consumidores: construção dos resultados no pipeline e cards/detalhes do ciclo vigente. Testes: `data_pipeline/tests/test_pne_trend.py` e cobertura integrada em `scripts/checks/e2e-test.cjs`. Limitação: a classificação descreve direção recente, não causalidade, previsão ou probabilidade de atingir a meta.
