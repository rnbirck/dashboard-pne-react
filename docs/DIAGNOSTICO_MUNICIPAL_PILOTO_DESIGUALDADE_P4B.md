# Diagnóstico municipal — piloto de desigualdade P4-B

**Versão:** `municipal-inequality-p4b-v1`  
**Escopo:** `basico_integral × urban_rural`

## Decisão de escopo

O primeiro piloto publica somente a localização urbana/rural do indicador
`basico_integral`. Esse recorte já possui numerador e denominador compatíveis na
fonte municipal e permite validar contrato, proteção de células pequenas,
carregamento sob demanda e linguagem não causal antes de ampliar P4. Sexo,
raça/cor, deficiência, NSE e território intraurbano continuam fora do escopo.

## Método

O cálculo usa somente a rede pública, no último ano comum disponível entre os
dois recortes. Para cada localização, o numerador é o total de matrículas da
educação básica pública em jornada integral e o denominador é o total de
matrículas públicas elegíveis do mesmo universo. O percentual é
`100 × numerador / denominador`, sem imputação ou substituição de ausência por
zero.

O contrato registra, em cada grupo, `numerator`, `denominator`, `percentage`,
`year`, `coverage`, `status` e `publicationStatus`. Fórmula e universo são
identificados pelos códigos compartilhados
`integral_enrollments_over_eligible_enrollments` e
`public_basic_education_enrollments`; textos de apresentação permanecem no
frontend e não são repetidos nos 497 artefatos.

Os estados permitidos são `available`, `suppressed_small_cell`, `missing`,
`not_applicable` e `methodology_incompatible`. Ausência permanece nula.
Denominador zero é inaplicável. Registros com universo, rede, ano ou contagens
incompatíveis não são publicados como resultado.

## Supressão

Um grupo é suprimido quando o denominador é menor que 10, quando numerador entre
1 e 9 expõe célula pequena ou quando o complemento `denominador - numerador`
fica entre 1 e 9. Numerador, denominador e percentual tornam-se nulos.

Se apenas um dos dois grupos exigir supressão, o outro recebe supressão
complementar. Assim, o valor protegido não pode ser deduzido por subtração a
partir de um total ou do outro recorte. Nenhum valor suprimido vira zero e a
diferença em pontos percentuais só é publicada quando ambos os grupos estão
`available`.

## Publicação e interface

`inequalityPilot` é um bloco separado do contrato aprofundado
`diagnostico.json` e não integra `index.json`. Ele é carregado somente quando o
usuário abre o detalhe `basico_integral` no ciclo PNE 2026–2036; a página
principal do Diagnóstico não o apresenta.

A seção “Oferta em tempo integral por localização” usa dois blocos compactos,
“Resultado urbano” e “Resultado rural”. A diferença é descritiva e só aparece
quando publicável. O texto explicita que o recorte não demonstra, sozinho,
causa, qualidade ou igualdade de acesso dos estudantes residentes.

## Cobertura publicada

Nos 497 municípios, 472 pilotos têm ao menos um resultado publicável e 25 têm
status geral `suppressed_small_cell`. Entre os 994 grupos, há 842 resultados
`available`, 102 `missing` e 50 `suppressed_small_cell`: 25 supressões primárias
e 25 complementares. Não houve denominador zero nos registros reais desta
geração.

A validação dirigida cobre Agudo, Nova Santa Rita, Amaral Ferrador como caso
predominantemente rural, Alto Feliz sem resultado rural publicado, Antônio
Prado com célula rural pequena, Porto Alegre e André da Rocha.

## Payload e determinismo

As medidas abaixo consideram JSON bruto, sem compressão de transporte:

- aumento médio do contrato aprofundado: 1.231,49 bytes por município;
- maior aumento individual: 1.317 bytes;
- aumento total dos 497 contratos oficiais: 612.051 bytes;
- transferência média ao abrir o detalhe: 533.671,65 bytes;
- maior payload aprofundado: 542.434 bytes, em São Vicente do Sul (`4319802`);
- volume total dos 497 artefatos aprofundados: 265.234.812 bytes.

A geração ordena municípios e grupos de forma estável e serializa o mesmo
conteúdo byte a byte para a mesma entrada. O script de atualização também
protege uma fotografia de `decisionSummary`, indicadores e recomendação
financeira antes de escrever o piloto.

O fluxo canônico `data_pipeline/scripts/update_static_data.py` executa
`refresh_municipal_inequality_pilot.py` depois de exportar, particionar e
sincronizar os dados. Isso mantém monólito, partição e aliases públicos
coerentes sem incluir o bloco no `index.json`.

## Limitações e condições para ampliar P4

Este piloto descreve oferta escolar localizada; não mede residência dos
estudantes, qualidade, acesso individual, causalidade ou desigualdade
intraurbana. Ele não altera `evidenceLevel`, `decisionReading`,
`decisionSummary`, financiamento, posição, ranking ou `priorityScore`, que
permanece nulo.

Antes de ampliar P4, cada novo recorte precisa de fonte e período versionados,
universo e fórmula reconciliados, avaliação de cobertura, regra de supressão e
supressão complementar, testes contra inferência, revisão de linguagem e
avaliação do impacto de payload. Relações entre indicadores continuam sendo
hipóteses documentadas; não autorizam conclusões causais nem escore de
desigualdade.
