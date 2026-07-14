# Tendência municipal — PNE 2026–2036

## Versões auditáveis

- Método: `theil_sen_v1`.
- Limite para percentuais: `percent_tau_mad_v1`.
- Limite para contagens: `absolute_tau_mad_v1`.
- Janela: cinco anos-calendário, encerrada no `end_year` do valor municipal
  exibido no card.

O objeto `trend` é calculado no pipeline e publicado junto de cada indicador
municipal do ciclo PNE 2026–2036. O React apenas apresenta o status já
classificado.

## Elegibilidade

São usadas as observações válidas dentro de `[end_year - 4, end_year]`.
Valores nulos, vazios, `NaN` e infinitos são descartados; zero numérico é uma
observação válida. Não há interpolação, preenchimento de lacunas ou conversão
de nulo para zero. O histórico precisa conter o ano do valor exibido no card.

Quatro ou cinco observações são preferidas. Três só são aceitas quando os três
anos são consecutivos. Séries bienais, censitárias ou com quebra metodológica
na janela tornam a tendência indisponível quando não atendem a essas regras.

## Cálculo e classificação

`slope` é a mediana das inclinações entre todos os pares de observações
Theil–Sen. As variações anuais usam a distância real entre os anos. Para
percentuais:

```text
tau = max(0,5 p.p./ano, 0,5 × MAD das variações anualizadas)
```

Para contagens, a mesma forma é usada na unidade do indicador, com base de
`0,5` unidade/ano. `consistency` é a fração das variações anuais que seguem a
direção da inclinação. Quando a inclinação está dentro do limite, uma série
com variações positivas e negativas é marcada como `inconclusive`, para não
apresentar uma oscilação como estável.

| Status | Regra |
| --- | --- |
| `up` | `slope > tau` e consistência `≥ 2/3` |
| `down` | `slope < -tau` e consistência `≥ 2/3` |
| `stable` | `|slope| ≤ tau`, sem oscilação na janela |
| `inconclusive` | inclinação direcional sem consistência suficiente ou série oscilante |
| `unavailable` | falha de histórico, elegibilidade ou quebra metodológica |

As setas sempre representam a direção bruta do indicador. Portanto, um
indicador `at_most` que aumenta recebe `up`; a meta não inverte a leitura da
tendência.

`start_year`, `end_year`, `observations`, `slope`, `threshold` e `consistency`
permanecem no artefato somente para auditoria. `unavailable_reason` registra a
causa técnica quando o status é `unavailable`.
