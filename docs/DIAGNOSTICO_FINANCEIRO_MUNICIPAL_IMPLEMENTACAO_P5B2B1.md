# P5-B2-B1 — aplicação constitucional da educação

## Resultado

A etapa integrou ao `municipal-finance-v1` os campos constitucionais de 2024/P6 para os 497 municípios do Rio Grande do Sul. Foram usadas somente as rotas oficiais do FNDE/SIOPE: o conjunto `Indicadores_Siope` do OData e os PDFs municipais do RREO Anexo 8. MSC, transferência efetiva do Fundeb e campos adicionais do demonstrativo não foram promovidos.

Todos os 497 municípios têm as duas fontes e os três conceitos comparáveis foram reconciliados. Não há município parcial, com fonte ausente ou divergente no snapshot publicado.

## Campos integrados

| Campo | SIOPE OData | RREO Anexo 8 | Natureza e estágio |
| --- | --- | --- | --- |
| valor aplicado em MDE | indicador nominal | linha 29, coluna `aa` | `municipal_declared`; `empenhado` |
| percentual aplicado em MDE | indicador nominal | linha 29, coluna `ab` | `municipal_declared`; `calculated_indicator` |
| percentual do Fundeb na remuneração dos profissionais | indicador nominal | linha 15, coluna `m` | `municipal_declared`; `calculated_indicator` |
| receita do Fundeb recebida declarada | não promovida | linha 6, coluna `b` | `municipal_declared`; `received` |

O parser valida município, exercício, sexto bimestre, título do demonstrativo, Anexo 8, unidade `R$ 1,00`, linhas, colunas, nota 5, versão de layout e versão do parser. A nota 5 determina a base `empenhado` no último bimestre; nos anteriores seria `liquidado`, mas nenhum outro período integra esta etapa.

## Crosswalk municipal

O arquivo `data_pipeline/data/municipal_finance/siope_ibge_crosswalk_v1.json` contém 497 relações únicas entre o código SIOPE/RREO de seis dígitos e o código IBGE de sete dígitos. A chave primária é o código de seis dígitos; nomes não participam da reconciliação. O cadastro canônico completo tem hash registrado, e a ingestão falha diante de código ausente, inesperado ou duplicado.

`Sant'Ana do Livramento` no cadastro e `SANTANA DO LIVRAMENTO` no PDF exigem apenas normalização secundária de pontuação e acentos depois que o código 431710→4317103 já foi resolvido; não há aproximação textual.

## Reconciliação e valor canônico

Cada métrica preserva `siope`, `rreo`, `canonical` e `reconciliation`. O canônico usa a média aritmética das duas declarações, arredondada à precisão publicada, somente quando município, ano, período, conceito, unidade, estágio e natureza são equivalentes e a diferença respeita:

- valor monetário: diferença absoluta de até R$ 0,01;
- percentual: precisão publicada de duas casas, tolerância de 0,005 ponto percentual.

Quando falta fonte, o status é `source_missing`; quando a diferença excede a tolerância, é `divergent_unexplained` e o canônico permanece nulo. Todo valor nulo carrega `nullReasonCode`. Nenhuma fonte é escolhida silenciosamente como preferencial.

## Retificações

Para cada PDF, o snapshot registra URL, município, exercício, período, `Last-Modified`, tamanho, SHA-256, data de coleta, parser e layout. Uma nova coleta compara o hash com a evidência publicada. Quando há mudança, preserva o registro anterior, cria `source_revision_detected`, registra as diferenças no histórico e bloqueia a nova publicação até validação.

Nesta coleta inicial não houve retificação detectada. O relatório `docs/data/diagnostico_financeiro_retificacoes.csv` contém apenas o cabeçalho.

## DCA e Fundeb declarado

A DCA função 12 permanece em `execution.dcaEducation` e em `summary.dcaEducationCommitted`. Ela não é reconciliada com MDE, pois os universos legais são distintos. Em Agudo, a DCA empenhada é R$ 25.722.214,85, enquanto o valor aplicado em MDE reconciliado é R$ 19.159.995,28; a diferença não é classificada como erro.

`fundebRevenueReceivedDeclared` representa a receita recebida declarada pelo município no RREO. Ela não integra `confirmedTransfersCoveredBySources`, saldo disponível, capacidade financeira nem valor confirmado pelo concedente. A transferência efetiva do Fundeb continua bloqueada.

## Cobertura e amostra

- SIOPE OData 2024/P6: 497/497;
- RREO Anexo 8 2024/P6: 497/497;
- reconciliados: 497;
- parciais: 0;
- fonte ausente: 0;
- divergentes: 0;
- indisponíveis: 0.

Agudo preserva R$ 19.159.995,28 em MDE, 28,51% de aplicação, 73,65% de remuneração dos profissionais e R$ 17.699.379,08 de receita Fundeb recebida declarada. Barra do Quaraí usa somente 2024/P6: R$ 8.526.669,05 em MDE, 28,13%, 80,33% e R$ 5.846.413,83, sem transformar a ausência de 2025 em zero.

## Publicação e impacto

O schema permanece `municipal-finance-v1`; `dataVersion` passou a `p5b2b1-2024-p6-2026-07-20` e `methodologyVersion` a `municipal-finance-p5b2b1-v1`.

Os 497 contratos lógicos passaram de 8.334.459 para 10.688.318 bytes: aumento de 2.353.859 bytes (28,24%), com média de 21.506 bytes e maior arquivo de 21.748 bytes. Com aliases, o volume é 21.376.636 bytes. O hash lógico publicado é `252cefa52f2f6528e9037dbb77d26d8854e8841bb0eae14da6b6f8e316fea21c`.

O financeiro continua fora de `index.json`. Contratos educacionais, scores e ranking não foram alterados. A P5-C1 mantém um gate de visibilidade: os novos campos e a nova cobertura contratual não são mostrados antes da P5-C2.

## Continuidade P5-C2

A P5-C2 poderá decidir a apresentação dos três indicadores reconciliados, da receita Fundeb declarada e dos estados de divergência. Esta etapa não cria cards, interpreta desempenho, altera a cobertura visível nem publica recomendação automática.
