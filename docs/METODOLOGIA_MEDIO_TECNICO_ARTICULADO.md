# Ensino médio articulado à educação profissional técnica

## Conceito e limite de interpretação

`medio_tecnico_articulado_percentual` acompanha a Meta 12.a por meio da relação
entre matrículas em cursos técnicos integrados e o total de matrículas do ensino
médio. A série disponível trata de matrículas, por isso o selo de indicador
aproximado pode ser mantido como ressalva metodológica sem alterar o tratamento
comparável do indicador na interface.

## Fórmula

```text
indicador_principal = 100 * mat_integrado_total / mat_medio

dado_complementar:
mat_articulado_total = mat_integrado_total + mat_concomitante_total
percentual_articulado_total = 100 * mat_articulado_total / mat_medio
```

No indicador principal entra apenas o total de Curso Técnico Integrado — Ensino
Médio Integrado. Curso Técnico — Concomitante permanece disponível no
aprofundamento e compõe somente o total articulado complementar.

Normal/Magistério, subsequente, integrado à EJA, FIC e o total geral da EPT
ficam fora do numerador principal.

O denominador é o total de matrículas do ensino médio no mesmo município e
ano. A associação usa ano e código IBGE, com uma linha por município e ano.

## Dados, período e qualidade

Os campos de EPT vêm da Sinopse Estatística da Educação Básica: layout 1.30
até 2024 e layout 1.42 em 2025. Federal, estadual, municipal e privada são
mantidos para reconciliação e auditoria, mas não são somados novamente para
formar o total.

Zero é valor válido quando está presente na fonte. Ausência permanece ausente;
denominador zero não produz percentual. Qualquer contagem negativa, código
IBGE inválido, duplicidade ano + município ou divergência entre total e
dependências rejeita o registro/carga. Percentuais acima de 100% são
preservados e sinalizados para auditoria. O total articulado complementar pode
superar 100% por reunir matrículas integradas e concomitantes, mas isso não
altera o card nem a barra da meta.

A série bruta pode preservar 2014. No ciclo PNE 2026–2036, a apresentação usa
somente 2015–2025 e não cria anos posteriores nem preenche anos ausentes.

## Meta

A Meta PNE é **50% em 2036**. O card, a distância, a barra de acompanhamento e
o histórico usam essa meta no mesmo padrão dos demais indicadores comparáveis.

Fonte: **INEP — Sinopse Estatística da Educação Básica.**

Nota metodológica: **Indicador calculado pela relação entre as matrículas em
cursos técnicos integrados ao ensino médio e o total de matrículas do ensino
médio. As matrículas concomitantes permanecem apresentadas no aprofundamento
como informação complementar.**

`medio_tecnico_participacao_publica` é uma métrica separada, de participação
pública na expansão da EPT, e não recebe numerador nem denominador deste
proxy. `medio_tecnico` legado permanece preservado no ciclo PNE 2014–2024.
