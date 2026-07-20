# Diagnóstico financeiro municipal — metodologia P5-A

## Objetivo e separação arquitetural

O contrato `municipal-finance-v1` descreve evidência financeira municipal sem alterar o contrato educacional existente. Ele não participa do `needScore`, `actionabilityScore`, `confidenceScore`, `priorityScore`, da síntese P3-C ou da ordenação de atenção. A relação entre indicador e financiamento é contextual e explicável, nunca causal por padrão.

## Recortes temporais

- `primaryFiscalYear`: 2024, exercício fechado usado para valores realizados e execução anual.
- `currentPartialYear`: 2026, usado para previsões e status com corte em 22 de junho.
- Um total nunca mistura anos ou estágios. O campo `mixesPeriodsInTotals` é sempre `false`.
- Série parcial deve exibir o corte e não pode ser comparada como se fosse fechamento anual.

## Conceitos financeiros obrigatórios

`financialStage` distingue: `forecast`, `authorized`, `committed`, `transferred`, `received`, `budgeted`, `empenhado`, `liquidado`, `paid`, `balance` e `not_applicable`.

`amountNature` distingue: `official_estimate`, `confirmed`, `municipal_declared`, `panel_displayed` e `local_calculation`.

Regras de uso:

1. Previsão oficial não vira valor confirmado.
2. Transferência publicada pelo concedente não vira saldo disponível.
3. Recebimento exige evidência nominal de ingresso no ente.
4. Execução declarada ao SICONFI/SIOPE não vira recurso novo.
5. `local_calculation` exige fórmula, numerador, denominador, anos e fontes explícitas.

## Prioridade de evidência

1. Arquivo oficial nominal com código IBGE e período.
2. Arquivo oficial nominal por nome, reconciliado com IBGE.
3. API oficial declaratória, preservando a natureza `municipal_declared`.
4. Painel oficial, marcado `panel_displayed` e com data de acesso.
5. Documento municipal ou local, com origem e responsabilidade explícitas.

Fonte agregada, requisito legal ou desempenho educacional não comprovam status municipal de programa.

## Status de programa

O vocabulário é fechado: `confirmed_beneficiary`, `confirmed_non_beneficiary`, `eligible`, `not_eligible`, `under_analysis`, `selected`, `agreement_signed`, `transferred`, `balance_available` e `not_verified`.

Status favorável requer fonte oficial nominal. `eligible` só pode ser usado quando a própria fonte declarar elegibilidade. Habilitação técnica, aderência aparente ou presença de necessidade educacional não bastam. Na dúvida, usa-se `not_verified` com motivo.

## Nulos estruturados

Todo valor financeiro ausente é um objeto com `value: null` e `nullReason` contendo código, categoria, mensagem e fontes consultadas. Zero só é aceito quando publicado como zero ou derivado por regra inequívoca de uma fonte nominal. Ausência de linha nunca é convertida em zero.

Os motivos previstos cobrem ausência de publicação, não aplicabilidade, fonte não automatizável, diferença de grão ou período, denominador não integrado, reconciliação pendente, proibição de estimativa e isolamento dos escores.

## Execução e reconciliação

A execução anual utiliza a função `12 - Educação` do SICONFI DCA Anexo I-E. Empenhado, liquidado, pago e restos a pagar são preservados como colunas distintas. Dotação orçamentária, despesa corrente e despesa de capital permanecem nulas até existir mapeamento validado que combine função, natureza, órgão, fonte e período, preferencialmente por MSC.

Conciliação SIOPE × SICONFI segue esta ordem:

1. Igualar exercício, município, esfera, periodicidade e estágio.
2. Comparar definições e exclusões de MDE/Fundeb.
3. Comparar valores absolutos sem substituir uma fonte pela outra.
4. Registrar diferença, explicação e fonte preferida por campo.
5. Marcar `reconciled` somente quando a diferença estiver explicada; caso contrário, `reconciliation_required`.

## Indicadores por aluno

Um valor por aluno só pode ser calculado quando numerador e denominador têm:

- o mesmo município e a mesma rede pertinente;
- o mesmo exercício ou uma regra oficial de defasagem explicitada;
- fonte e unidade conhecidas;
- ausência de dupla contagem.

O protótipo não calcula QSE por matrícula porque o denominador nominal ainda não foi integrado ao artefato. É proibido preencher com matrículas de outro ano.

## Relação entre educação e financiamento

Cada vínculo registra `indicatorId`, `programId`, tipo de relação, status municipal, estágio, natureza do valor, evidência, valor confirmado e valor potencial. São aceitos quatro tipos:

- `general_mde`: recurso geral, sem destinação comprovada ao indicador.
- `direct_cost_driver`: indicador que afeta uma regra de cálculo explicitamente documentada.
- `conditional_support`: programa que pode apoiar a ação mediante status nominal.
- `accounting_context`: dado contábil usado apenas para leitura de capacidade ou execução.

O campo `affectsEducationalScores` é sempre `false`. Valor potencial só pode existir quando for previsão oficial; não se estima edital, elegibilidade ou chance de seleção.

## Qualidade e cobertura

`coverageRate` mede campos prioritários encontrados na auditoria, não desempenho financeiro. A leitura conjunta usa:

- presença de valor nominal e chave municipal;
- distinção de estágio e natureza;
- cobertura do exercício fechado e do recorte parcial;
- possibilidade de reconciliação;
- estabilidade e automatização da fonte.

Os níveis são `high`, `medium`, `low` e `insufficient`. Uma fonte oficial pode continuar com baixa utilidade operacional se o grão for incompatível ou a consulta não for reproduzível.

## Agregações permitidas

- Somar somente valores do mesmo município, exercício, moeda, estágio e natureza, sem sobreposição de programa.
- Manter previsões fora de totais confirmados.
- Não somar saldo a transferência nem empenhado a pago.
- Não agregar PDDE ao município antes de reconciliar escola/executor.
- Mostrar cobertura, fontes incluídas e nulos junto de qualquer subtotal.

## Atualização e procedência

Cada evidência registra URL, órgão, data de acesso, ano de referência, chave municipal e status. A P5-B deve persistir hash do arquivo bruto, versão do adaptador, cabeçalho validado, data de publicação e log de rejeições. Alteração de esquema deve interromper a ingestão, não produzir valores silenciosamente.

## Industrialização P5-B1

O contrato publicado substitui o `coverageRate` geral por cobertura de sete dimensões e usa os nomes `confirmedTransfersCoveredBySources`, `officialAnnualForecastsCurrentYear` e `dcaEducationCommitted`. Os exemplos P5-A continuam disponíveis como fixtures legadas, mas não são consumidos pelo loader.

O nível de qualidade é derivado das dimensões. Ausência de estágio esperado da DCA combinada à reconciliação pendente produz `insufficient`; cobertura central completa com RREO e reconciliação pendentes produz `medium`. Essa classificação descreve confiabilidade e completude da evidência, nunca desempenho municipal.

As taxas `liquidatedToCommittedRate`, `paidToCommittedRate`, `paidToLiquidatedRate` e `outstandingToCommittedRate` usam apenas valores da DCA, função 12 e exercício 2024. Cada taxa preserva memória de cálculo; componente ausente ou denominador zero produz nulo estruturado.

O total anual do Fundeb nunca é somado às complementações. VAAF, VAAT e VAAR registram composição e risco de dupla contagem. QSE distribuída de 2024 não é somada à estimativa de 2026.

## Auditoria de fontes P5-B2-A

Uma fonte só pode avançar como `ready` se cumprir todos os gates de oficialidade, automação, chave, período, estágio, natureza, esquema, cobertura mínima de 95%, duplicidades, procedência, teste de contrato e estabilidade em duas execuções. `ready_with_mapping` autoriza somente POC e mapeamento posterior; não autoriza escrita nos contratos.

### SIOPE e RREO

O código SIOPE/RREO de seis dígitos deve ser reconciliado exclusivamente por crosswalk com o código IBGE de sete dígitos. Indicadores OData são `municipal_declared`; percentuais são `calculated_indicator`. O saldo financeiro do Fundeb não pode ser somado à receita recebida.

No RREO Anexo 8, a nota 5 define o estágio do limite: nos cinco primeiros bimestres acompanha-se a despesa liquidada; no sexto, a despesa empenhada. Linha 29 comprova aplicação em MDE; linha 15, remuneração dos profissionais; linha 6, receita do Fundeb recebida. A DCA função 12 não pode substituir esses conceitos.

O FTP publica o estado corrente de cada PDF, não um histórico de retificações. Toda futura coleta deve conservar URL, `Last-Modified`, tamanho, SHA-256 e snapshot anterior. Mudança de hash reabre a reconciliação.

### MSC

Natureza da despesa só pode ser agregada mantendo município, exercício, mês, função, subfunção, natureza, conta/estágio, fonte, órgão e `entrada_msc`. Categoria econômica 3 é corrente e 4 é capital; GND 1, 3, 4 e 5 representam pessoal, outras correntes, investimentos e inversões. O campo `poder_orgao` não é unidade gestora; a ausência de UG permanece explícita.

O POC reconhece `paid` apenas na conta PCASP homologada `6.2.2.1.3.05.00`. Outras contas não são promovidas silenciosamente a empenhado ou liquidado. Linha ausente é `null`, nunca zero.

### Reconciliação e exercício principal

Os estados P5-B2-A são `reconciled`, `divergent_explained`, `divergent_unexplained`, `mapping_pending`, `source_missing` e `not_comparable`. A equivalência é `equivalent`, `partially_equivalent`, `not_equivalent` ou `mapping_pending`. Uma fonte preferencial só pode ser definida por decisão posterior explícita; a auditoria não substitui valores.

O exercício principal continua 2024. DCA 2025 alcança 497/497, mas SIOPE 2025/P6 alcança 487/497, RREO 2025/P6 alcança 490/497 e QSE realizada 2025 equivalente ainda não foi homologada. Nenhum contrato teve o exercício alterado.

## Homologação constitucional P5-B2-B1

A integração constitucional usa exclusivamente SIOPE OData e RREO Anexo 8 do FNDE/SIOPE em 2024/P6. O crosswalk versionado resolve o código de seis dígitos pelo cadastro completo de 497 códigos IBGE; nome é apenas validação secundária exata após normalizar acentos e pontuação.

O RREO promove somente linha 6/coluna `b`, linha 15/coluna `m` e linha 29/colunas `aa` e `ab`. O parser valida título, município, exercício, bimestre, unidade, linhas, colunas, layout e nota 5. No sexto bimestre, MDE usa estágio `empenhado`; percentuais usam `calculated_indicator`.

SIOPE e RREO permanecem separados. O canônico só é publicado se os dois valores tiverem o mesmo município, exercício, período, conceito, unidade, estágio e natureza e respeitarem R$ 0,01 ou 0,005 ponto percentual, conforme a precisão publicada. Ele é calculado pela média aritmética arredondada a duas casas, sem escolher fonte preferencial. Ausência produz `source_missing`; divergência acima da tolerância produz `divergent_unexplained`; ambos mantêm canônico nulo com razão.

O PDF é evidência versionada por URL, `Last-Modified`, tamanho, SHA-256, data de coleta, parser e layout. Mudança de hash conserva a versão publicada, registra `source_revision_detected`, produz diferença e bloqueia o candidato até validação.

A DCA função 12 não é comparada a MDE. A receita Fundeb recebida declarada no RREO não é transferência confirmada pelo concedente e não pode alimentar soma, saldo ou capacidade financeira. Qualidade continua medindo evidência; o valor do percentual não altera o nível.
