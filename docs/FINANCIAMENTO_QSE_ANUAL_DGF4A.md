# DGF4-A / DGF4-A.1 — Histórico anual da Quota Municipal do Salário-Educação

## Resultado

A série anual municipal da Quota do Salário-Educação (QSE) foi integrada para
2020–2025. Todos os seis anos fechados atingiram 497/497 municípios do
Rio Grande do Sul, sem duplicidades, nulos, zeros oficiais, valores negativos ou
registros não mapeados. A série contém somente valores realizados; a estimativa
oficial de 2026 permanece no contrato e no quadro visual já existente, separada
do histórico.

## Fonte oficial e significado

A fonte é a página [Consultas do Salário-Educação do
FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/salario-educacao/consultas),
que identifica os arquivos como distribuições das quotas estadual e municipal.
Foram usadas as seguintes publicações anuais:

| Exercício | Publicação oficial | Campo monetário | Identificação |
|---:|---|---|---|
| 2020 | `Distribuição por ente federado 2020` | `Valor (R$)` | UF + nome oficial do ente |
| 2021 | `Distribuição por ente federado 2021` | `Valor (R$)` | UF + nome oficial do ente |
| 2022 | `Distribuição realizada — matrículas, coeficientes e recursos distribuídos 2022` | `Recursos distribuídos (R$)` | código IBGE |
| 2023 | `Distribuição realizada — matrículas, coeficientes e recursos distribuídos 2023` | `Recursos distribuídos (R$)` | código IBGE |
| 2024 | `Distribuição realizada — matrículas, coeficientes e recursos distribuídos 2024` | `Recursos distribuídos (R$)` | código IBGE |
| 2025 | `Distribuição mensal por ente federado — janeiro a dezembro de 2025` | `Total` | código IBGE |

Os valores significam recursos anuais efetivamente distribuídos da quota do
Salário-Educação. Não são estimativas, arrecadação bruta, saldo em conta ou
execução da despesa municipal. As linhas `GOVERNO ESTADUAL` são identificadas e
excluídas; somente entes municipais do RS são materializados.

Em 2025, o período significa recursos distribuídos entre janeiro e dezembro do
ano-calendário. A publicação pública usa “QSE distribuída em 2025” e “valor
distribuído no ano”; não atribui o total a uma competência estimada nem o trata
como quota referente exclusivamente ao ciclo de 2025. Os 12 meses são usados
somente para auditar a coluna `Total` e não entram no contrato público.

O snapshot realizado de 2025 foi coletado em 21/07/2026, após a atualização da
página de consultas em 03/07/2026 às 08h41, e possui:

- arquivo: `fnde-qse-distribuicao-mensal-ente-2025.pdf`;
- tamanho: 2.239.536 bytes;
- SHA-256: `a7c01d0645a3f582d4c2c6c531d05f80b829d07f836915fc347a25031d4e7841`;
- parser: `parse_qse_monthly_lines`;
- colunas confirmadas: UF, Ente Federado, Código IBGE, janeiro a dezembro e Total;
- identificação: demonstrativo da distribuição mensal das quotas estadual e
  municipal do Salário-Educação, janeiro a dezembro de 2025.

Os arquivos oficiais podem ser substituídos ou revistos no mesmo endereço. A
versão efetivamente integrada é fixada pelo SHA-256 em
`public/data/financeiro/qse-anual-manifest.json`. Uma atualização futura deve
repetir cobertura e reconciliação antes de publicar. O arquivo de 2024 tem SHA
`e709e2fbfddc0db6e6927226ed2dc83a092d4d503546c2fdcbc1cd6f6210ee19`,
idêntico ao snapshot usado pelo contrato financeiro em 20/07/2026.

## Extração reproduzível

O comando abaixo aceita os snapshots locais, incluindo o realizado de 2025, o
mensal de 2024 e a base de matrículas/coeficientes de 2025; se um arquivo anual
estiver ausente, baixa-o do endereço oficial configurado:

```powershell
python data_pipeline/scripts/generate_qse_annual.py --source-dir data_pipeline/data/qse_annual/sources
```

O parser usa extração de texto com `pypdf`, limita os registros à UF `RS`,
separa o Governo Estadual e analisa os formatos oficiais próprios de 2020–2021,
2022–2024 e mensal de 2025. A execução mede cobertura, duplicidades, não
mapeados, nulos, zeros, negativos, meses ausentes, conciliação mensal e total
estadual antes de gravar qualquer contrato público. Em 2025, qualquer cobertura
diferente de 497/497, mês ausente ou diferença entre a soma mensal e `Total`
bloqueia a publicação.

## Identificação municipal

Em 2022–2025 o código IBGE oficial é a chave direta. Em 2020–2021, cujos PDFs
não publicam código, o nome oficial normalizado é comparado por igualdade ao
índice canônico do projeto. Não há fuzzy matching. Foi necessário um único
crosswalk explícito:

| Nome no FNDE | Município canônico | Código IBGE |
|---|---|---:|
| `SANTANA DO LIVRAMENTO` | Sant'Ana do Livramento | 4317103 |

Sem esse crosswalk, 2020 e 2021 teriam 496/497 municípios identificados. O
mapeamento explícito eleva ambos para 497/497 sem aproximação silenciosa.

## Nulo, zero, duplicidades e ajustes

- ausência de linha permanece ausência e o exercício não entra na série;
- valor monetário oficial igual a zero permanece `0`;
- valor nulo não é convertido em zero;
- valor negativo é registrado na auditoria e bloqueia a publicação até ter
  significado oficialmente esclarecido;
- duplicidade de município/exercício bloqueia a publicação;
- nenhum ano é interpolado, preenchido, repetido ou estimado;
- o valor por matrícula só existe quando o mesmo ano publica matrículas
  positivas (2022–2025 nesta série);
- o coeficiente, a matrícula, o valor realizado, o valor por matrícula e a
  estimativa continuam campos separados.

Não foram encontrados nulos, zeros oficiais, negativos, duplicidades ou ajustes
nos seis anos integrados. Em 2025, os 497 municípios possuem os 12 meses e todas
as somas conciliam em centavos com a coluna `Total`.

## Reconciliação de 2024

O parser comparou os 497 valores anuais de 2024 ao campo existente
`amounts.qseDistributedClosedYear`:

- municípios comparados: 497;
- divergências: 0;
- maior diferença absoluta: R$ 0,00;
- total da nova extração: R$ 536.131.761,16;
- total do contrato atual: R$ 536.131.761,16;
- SHA-256 da publicação: idêntico ao snapshot vigente.

Logo, não houve substituição silenciosa nem mudança do valor canônico. A nova
série referencia a mesma publicação oficial já usada em 2024.

A DGF4-A.1 acrescentou uma segunda validação com o demonstrativo mensal fechado
de 2024. A soma de janeiro a dezembro e a coluna `Total` reproduziram os 497
valores da série anual e de `amounts.qseDistributedClosedYear`, sem divergências
e com o mesmo total municipal de R$ 536.131.761,16. Isso comprova a continuidade
metodológica usada para acrescentar o `Total` de 2025.

## Conciliação e auditoria de 2025

- linhas municipais processadas: 497;
- linha `GOVERNO ESTADUAL` separada: 1;
- registros totais RS processados: 498;
- linhas de outros entes, cabeçalhos e controles descartadas: 5.099;
- municípios com 12 meses conciliados ao `Total`: 497;
- divergências mensais: 0;
- maior diferença absoluta: R$ 0,00;
- total oficial dos municípios do RS: R$ 589.175.647,10;
- total oficial da linha Governo Estadual: R$ 398.306.716,57.

O `Total` oficial permanece como valor publicado. Os meses não são persistidos
nos 497 JSONs públicos; permanecem somente nos PDFs versionados de entrada e nos
resultados de qualidade do manifest.

## Matrículas e coeficiente de 2025

O anexo oficial de matrículas e coeficientes de 2025 foi versionado com SHA-256
`8cbea9c5751ffc3be88e22cbb16dc4f8301a6873d1ad9eeb9e3e6e0898a8bb31`. Ele
identificou 497/497 municípios por código IBGE, sem duplicidades, ausências,
matrículas nulas ou não positivas e sem coeficientes nulos. Assim,
`distributedPerEnrollment` de 2025 é calculado por:

`Total distribuído no ano-calendário de 2025 ÷ matrículas oficiais de 2025`.

A estimativa monetária presente no anexo não integra a série realizada.

## Contrato, pipeline e ID canônico

O grão público é município × exercício. O contrato
`qse-annual-v1`, materializado em
`public/data/municipios/{codigo_ibge}/qse-anual.json`, contém:

- `year`;
- `distributedAmount`;
- `enrollmentBasis` quando publicada;
- `distributionCoefficient` quando publicado;
- `distributedPerEnrollment` quando calculável;
- `sourceId`, referência e SHA-256 do arquivo oficial;
- `cutoffDate`.

O contrato referencia somente `qse.distributed_amount` como indicador central.
Não replica definição, estágio, natureza, domínio, regra de nulo ou significado
de zero do registro canônico. `financialIndicatorRegistry.ts` recebeu apenas a
indicação de que esse ID possui histórico anual 2020–2025 sob demanda. O estágio
`transfer`, a natureza `flow`, o domínio Origem dos recursos e os papéis de
resumo, detalhe, histórico e comparação condicionada foram preservados.
`qse.official_estimate` não foi alterado nem incluído na série.

## Estratégia de carregamento

O histórico não foi incorporado a `financeiro.json`, aos índices municipais ou
ao registro canônico. Depois que o Panorama conhece o código IBGE do município
selecionado, `qseAnnualLoader` busca somente
`/data/municipios/{codigo_ibge}/qse-anual.json` e mantém cache por município.
Não há download externo durante o uso da aplicação e o carregamento inicial dos
demais módulos não é ampliado.

## Interface

Na rota financeira existente, o bloco da QSE agora apresenta:

1. QSE distribuída em 2025;
2. variação nominal de 2025 em relação a 2024 e diferença absoluta;
3. valor por matrícula em 2025, com competência explícita;
4. barras anuais realizadas de 2020 a 2025, ordenadas, com tooltip e destaque
   discreto de 2025;
5. leitura rápida limitada à variação, diferença absoluta e posição de 2025;
6. estimativa oficial de 2026 em quadro separado, descrita como planejamento e
   não como recurso distribuído;
7. disclosure `Dados usados no cálculo` com matrículas, coeficiente, competência,
   regra do valor por matrícula e fonte.

O gráfico não contém estimativa, projeção, ranking, comparação municipal ou ano
preenchido. A gramática visual, tokens, foco visível e composição responsiva das
páginas financeiras foram preservados.

## Limitações

- 2020–2021 não publicam matrículas, coeficiente nem código IBGE no arquivo
  anual; por isso não há valor por matrícula nesses dois exercícios e a chave é
  o nome oficial com o único crosswalk explícito descrito acima;
- valores são nominais e não foram corrigidos pela inflação;
- a série mensal não foi integrada ao contrato nem à interface; os meses de
  2024 e 2025 são evidência de auditoria dos totais anuais;
- a fonte pode revisar arquivos no mesmo URL; o SHA-256 é a referência de versão;
- a estimativa oficial de 2026 não é comparada como ponto realizado.

## Validações

Os testes direcionados cobrem parser mensal de 2025, exclusão estadual, código
IBGE, 12 meses, conciliação com `Total`, duplicidades, nulo, zero, continuidade
de 2024, contrato 2020–2025, loader, seis barras, separação da estimativa e ID
canônico. A inspeção visual dirigida cobre Agudo, Nova Pádua, um município com
redução em 2025, desktop e celular. Não existe caso real de zero oficial ou ano
ausente nos arquivos integrados; esses estados permanecem cobertos por fixtures.
Os resultados finais estão registrados na resposta de entrega.

| Exercício | Municípios | Cobertura | Ausentes | Zeros | Total RS | Fonte | Conclusão de publicação |
|---:|---:|---:|---:|---:|---:|---|---|
| 2020 | 497 | 100% | 0 | 0 | R$ 376.075.209,97 | FNDE — distribuição por ente | Publicável |
| 2021 | 497 | 100% | 0 | 0 | R$ 447.653.699,45 | FNDE — distribuição por ente | Publicável |
| 2022 | 497 | 100% | 0 | 0 | R$ 528.114.327,14 | FNDE — distribuição realizada | Publicável |
| 2023 | 497 | 100% | 0 | 0 | R$ 584.354.570,22 | FNDE — distribuição realizada | Publicável |
| 2024 | 497 | 100% | 0 | 0 | R$ 536.131.761,16 | FNDE — distribuição realizada e mensal | Publicável e reconciliado |
| 2025 | 497 | 100% | 0 | 0 | R$ 589.175.647,10 | FNDE — distribuição mensal por ente, `Total` | Publicável e conciliado |
