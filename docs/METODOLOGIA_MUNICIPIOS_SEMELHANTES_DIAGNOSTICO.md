# Metodologia de municípios semelhantes no Diagnóstico

**Versão:** `municipal-peer-cohort-rs-v1`

## Unidade comparável

O coorte é calculado separadamente para cada indicador e ano. Candidatos só
entram quando pertencem ao Rio Grande do Sul e possuem o mesmo identificador de
indicador, ano, fórmula, unidade, base territorial e base de oferta compatível.
O valor do indicador não participa da distância; ele é usado apenas depois da
seleção para estatísticas e percentil direcional.

## Distância e tamanho

A variável coberta hoje é o denominador observado do indicador, interpretado
como porte da oferta comparável. A distância é:

```text
abs(log1p(porte_candidato) - log1p(porte_municipio))
```

Os 20 menores valores formam o coorte, com desempate pelo nome municipal. O
limite metodológico aceito é de 20 a 50; a versão atual usa o mínimo de 20 para
conter payload. Abaixo de 20 candidatos compatíveis, `status` é `unavailable` e
nenhum membro ou estatística é publicado.

## Contrato

O objeto registra ano, versão, tamanho do coorte, membros, distâncias, valor e
porte de cada membro, cobertura candidata, mediana, Q1, Q3 e percentil
direcional. Percentil alto sempre significa situação mais favorável, respeitando
`at_least` e `at_most`.

`featuresUsed` informa o que realmente entrou no cálculo.
`unavailableFeatureCodes` registra população, ruralidade, NSE, capacidade fiscal
e COREDE ainda ausentes. `relaxationCodes` explicita o uso apenas do porte da
oferta. O conjunto completo do RS usado na distribuição estadual não é chamado
de municípios semelhantes.

Enquanto `featuresUsed` contiver somente `offering_size`, o rótulo público é
“Municípios com oferta de porte semelhante”. A nota metodológica correspondente
é: “Comparação formada atualmente pelo porte da oferta do indicador. Outros
atributos municipais ainda não integram o pareamento.” Não se usam, nesse caso,
“municípios semelhantes”, “municípios com perfil semelhante” ou “pares
socioeconômicos”. Esta precisão editorial não altera percentis, membros,
distâncias ou qualquer regra do coorte.
