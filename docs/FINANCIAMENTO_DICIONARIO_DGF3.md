# DGF3 — Dicionário canônico e arquitetura dos indicadores financeiros

## 1. Resultado da consolidação

A DGF3 consolida **90 IDs canônicos** para os indicadores e condições analíticas hoje publicáveis. O inventário DGF1 possuía 95 itens de domínio; a diferença decorre da consolidação semântica de cinco ocorrências redundantes entre Panorama, SIOPE e Fundeb. O campo DCA pago, repetido no resumo e no detalhe do próprio Panorama, continua contado uma única vez no inventário de domínio, embora os dois pontos de apresentação estejam registrados no mapa de migração.

Esta etapa cria metadados e arquitetura. Não altera valores municipais, fórmulas financeiras, contratos, rotas, textos visíveis, componentes ou arquivos materializados. As definições foram sustentadas por:

- `docs/FINANCIAMENTO_AUDITORIA_DGF1.md`;
- `docs/FINANCIAMENTO_INTERFACE_DGF2.md`;
- `src/data/financialIndicatorMetadata.js`;
- `src/data/siopeIndicators.js` e catálogo SIOPE materializado;
- `src/data/fundebIndicators.js`;
- `src/data/pnateIndicators.js`;
- `src/data/financialModules.js`;
- `src/features/municipal-finance/municipalFinancePresentation.ts`;
- `src/features/diagnostic/municipalFinanceTypes.ts`;
- `src/components/VaarPanel.jsx`;
- produtores e consultas atuais de Fundeb e PNATE.

A fonte estruturada é `src/data/financialIndicatorRegistry.ts`. Ela contém somente metadados e oferece um adaptador de campos legados. Os catálogos atuais permanecem como compatibilidade e continuam sendo os consumidores da interface até uma migração futura controlada.

## 2. Contrato da ficha canônica

Cada linha das fichas da seção 5 referencia uma entrada integral do registro. Os 29 requisitos pedidos estão materializados assim:

| Requisito | Campo canônico |
|---|---|
| ID estável | `id` |
| nome público principal | `publicName` |
| nome curto | `shortName` |
| pergunta pública | `question` |
| importância | `importance` |
| definição completa | `definition` |
| unidade | `unit` |
| fonte oficial | `source` |
| campos de origem | `originFields` |
| fórmula | `formula` |
| arredondamento | `roundingRule` |
| regra de nulo | `nullRule` |
| significado de zero | `zeroMeaning` |
| período e competência | `periodType` |
| estágio financeiro | `stage` |
| natureza | `nature` |
| comparabilidade anual | `yearComparability` |
| agregação | `aggregationRule` |
| cálculo por matrícula | `perStudentRule` |
| comparação municipal | `municipalComparisonRule` |
| uso em resumo | papel `summary` |
| uso em histórico | papel `history` |
| uso em composição | papel `composition` |
| reconciliação | `requiresReconciliation` |
| dupla contagem | `doubleCountingRisk` |
| limitações | `methodologyNote` |
| rota/contexto | `recommendedContext`, `domain` e `secondaryDomains` |
| aliases | `aliases` |
| equivalências/sobreposições | `equivalentOrOverlappingFields` e mapa legado |

Nenhuma entrada contém valor, série, município, código IBGE ou documento materializado.

## 3. Convenções das fichas

### 3.1 Papéis

`S` = `summary`; `C` = `catalog`; `D` = `detail`; `H` = `history`; `O` = `composition`; `X` = `comparison`; `M` = `methodology`. Nenhum indicador desta consolidação possui papel `internal`, pois estados técnicos já foram retirados da camada pública na DGF2.

### 3.2 Decisões de uso

`A` = permitido; `C` = condicional; `N` = não permitido. Nas fichas, a sequência `Ag/Pm/Cm` significa agregação no tempo ou entre componentes, cálculo por matrícula e comparação municipal.

### 3.3 Fórmulas

| Código | Fórmula sustentada |
|---|---|
| `F0` | Valor recebido pronto da fonte; fórmula não reproduzida no pipeline atual. |
| `F1` | despesa MDE ÷ receita vinculada × 100; Panorama usa média dentro de 0,005 p.p. |
| `F2` | remuneração elegível ÷ recursos Fundeb considerados × 100; Panorama usa média dentro de 0,005 p.p. |
| `F3` | recursos Fundeb não aplicados ÷ recursos sujeitos à regra × 100 |
| `F4` | soma das despesas MDE; Panorama usa média das fontes quando a diferença é de até R$ 0,01 |
| `F5` | despesa Fundeb da etapa ÷ base financeira do indicador × 100 |
| `F6` | despesa educação ÷ despesa municipal total considerada × 100 |
| `F7` | despesa do recorte ÷ estudantes usados como denominador |
| `F8` | receitas de impostos ÷ receitas totais consideradas × 100 |
| `F9` | disponibilidade anterior + ingressos − pagamentos |
| `F10` | liquidado ÷ empenhado × 100 |
| `F11` | pago ÷ empenhado × 100 |
| `F12` | pago ÷ liquidado × 100 |
| `F13` | (RAP não processado + RAP processado) ÷ empenhado × 100 |
| `F14` | matrículas da rede ÷ matrículas públicas consideradas pelo FNDE |
| `F15` | QSE distribuída ÷ matrículas QSE da mesma competência |
| `F16` | repasse total PNATE − descontos e ajustes aplicáveis, conforme metadado atual |

Quando a ficha usa `F0`, nenhuma fórmula deve ser inferida a partir do nome do campo.

### 3.4 Arredondamento, nulo e zero

| Código | Regra |
|---|---|
| `R$2` | reais com duas casas; abreviação visual não altera o valor de origem |
| `%1` | percentual com uma casa; valor de origem preservado |
| `%2` | percentual com até duas casas; valor de origem preservado |
| `I0` | inteiro sem casas |
| `K6–8` | coeficiente com seis a oito casas |
| `I4` | índice com até quatro casas |
| `B` | condição categórica, sem arredondamento |

Regra geral de nulo: ausente, não finito, bloqueado ou não aplicável não é zero e não gera cartão, linha ou ponto. No VAAR, nulos podem ser estruturais por metodologia ou elegibilidade. Em previsões de complementação, nulo de não beneficiário não deve virar zero.

Regra geral de zero: zero numérico oficial permanece publicável. No VAAR, `false` também é resultado válido. Exceção de cálculo: uma taxa derivada fica nula quando o denominador é zero; o zero do componente de origem continua preservado.

### 3.5 Períodos

| Código | Competência |
|---|---|
| `PS` | SIOPE anual, 6º bimestre, série 2021–2025; 2025 pode estar incompleto |
| `PF` | Fundeb anual, série 2017–2025; subetapas úteis desde 2021 |
| `PD` | DCA função 12, exercício fechado de 2024 no contrato atual |
| `PQ` | QSE distribuída/base de 2024 |
| `PE` | estimativa/previsão oficial de 2026, com data de corte do contrato |
| `PV` | exercício Fundeb; método anterior 2023–2024 e atual 2025–2026 |
| `PP` | PNATE anual 2024–2026, condicionado ao leiaute de cada exercício |

## 4. Regras financeiras transversais

- Fluxos só podem ser somados quando fonte, estágio e competências forem iguais, completas e não sobrepostas.
- Estoques e saldos não podem ser somados entre períodos nem a receitas ou despesas.
- Percentuais, taxas, parâmetros e coeficientes não podem ser somados.
- Parâmetros per capita não representam necessariamente valor recebido por estudante.
- Componentes só formam composição quando forem mutuamente exclusivos, tiverem mesma base, competência e estágio e estiverem reconciliados.
- Empenhado, liquidado e pago são fases do mesmo fluxo e nunca formam composição aditiva.
- Previsão, estimativa, autorização, transferência, recebimento declarado e realização são estágios diferentes.
- Condição de beneficiário, habilitação e recebimento por componente não são valores financeiros.
- Valores nominais históricos exigem cautela com inflação, mudanças de leiaute e exercícios incompletos.

## 5. Fichas canônicas e matriz de arquitetura

As tabelas abaixo combinam a ficha resumida com a matriz de arquitetura. A coluna “Arquitetura” usa `domínio principal; secundário; rota atual → rota futura; mudança`. Os textos integrais, inclusive todas as regras de comparação e risco, estão no registro estruturado.

### 5.1 SIOPE — 14 IDs

| ID | Nome; pergunta; importância | Definição; unidade; origem; fórmula | Período; estágio; natureza; arred. | Papéis; Ag/Pm/Cm | Arquitetura e limitação principal |
|---|---|---|---|---|---|
| `mde.application_rate` | Aplicação em MDE; qual parcela da receita vinculada foi aplicada? Acompanha o mínimo, não a qualidade. | percentual da base constitucional; `%`; SIOPE + canônico Panorama; `F1` | `PS`; indicador percentual; percentual; `%1` | S,C,D,H,X; N/N/C | aplicação; Panorama; SIOPE/Panorama → Aplicação; reutilizar um indicador e reconciliar SIOPE/RREO |
| `fundeb.professional_remuneration_rate` | Fundeb em remuneração; qual parcela foi destinada aos profissionais? Acompanha a regra mínima, não suficiência salarial. | remuneração elegível sobre recursos considerados; `%`; SIOPE/Fundeb/Panorama; `F2` | `PS/PF`; indicador percentual; percentual; `%1` | S,C,D,H,X; N/N/C | aplicação; Panorama; três rotas atuais → Aplicação/Fundeb; um componente canônico, respeitando 60%/70% |
| `fundeb.unapplied_rate` | Fundeb não aplicado; qual parcela não foi aplicada no ano? Contextualiza execução, não prova irregularidade. | recursos não aplicados sobre base sujeita; `%`; SIOPE; `F3` | `PS`; indicador percentual; percentual; `%1` | S,C,D,H,X; N/N/C | aplicação; execução; SIOPE → Aplicação/Fundeb; manter cobertura explícita |
| `mde.applied_amount` | Despesa em MDE; quanto foi computado? Dimensiona esforço absoluto, não toda a despesa educacional. | valor MDE nominal; R$; SIOPE + canônico Panorama; `F4` | `PS`; empenhado; fluxo; `R$2` | C,D,H,X; C/C/C | aplicação; Panorama; SIOPE/Panorama → Aplicação; reconciliar e evitar duplicação |
| `fundeb.early_childhood_share` | Fundeb na educação infantil; qual parcela foi associada à etapa? Mostra distribuição, não prioridade ideal. | participação da etapa; `%`; SIOPE; `F5` | `PS`; indicador percentual; percentual; `%1` | C,D,H,O,X; N/N/C | aplicação; —; SIOPE → Aplicação por etapa; composição só com categorias exclusivas |
| `fundeb.elementary_share` | Fundeb no fundamental; qual parcela foi associada à etapa? Contextualiza a oferta sem julgamento automático. | participação da etapa; `%`; SIOPE; `F5` | `PS`; indicador percentual; percentual; `%1` | C,D,H,O,X; N/N/C | aplicação; —; SIOPE → Aplicação por etapa; composição só com categorias exclusivas |
| `education.total_expenditure_share` | Educação nas despesas totais; qual o peso relativo? Mostra prioridade orçamentária, não qualidade. | despesa educação sobre despesa total; `%`; SIOPE; `F6` | `PS`; indicador percentual; percentual; `%1` | C,D,H,X; N/N/C | aplicação; execução; SIOPE → Aplicação; base total precisa ser equivalente |
| `education.basic.per_student_spending` | Gasto por estudante; quanto foi atribuído em média? Apoia comparação contextual, não mede eficiência. | despesa básica por estudante; R$/estudante; SIOPE; `F7` | `PS`; não aplicável; taxa; `R$2` | S,C,D,H,X; N/N/C | aplicação; —; SIOPE → Aplicação; considerar porte, ruralidade e inflação |
| `education.early_childhood.per_student_spending` | Gasto por estudante infantil; qual esforço médio da etapa? Não mede cobertura ou qualidade. | despesa infantil por estudante; R$/estudante; SIOPE; `F7` | `PS`; não aplicável; taxa; `R$2` | C,D,H,X; N/N/C | aplicação; —; SIOPE → Aplicação por etapa; comparar ofertas equivalentes |
| `education.elementary.per_student_spending` | Gasto por estudante fundamental; qual esforço médio da etapa? Não mede resultado educacional. | despesa fundamental por estudante; R$/estudante; SIOPE; `F7` | `PS`; não aplicável; taxa; `R$2` | C,D,H,X; N/N/C | aplicação; —; SIOPE → Aplicação por etapa; considerar estrutura e inflação |
| `education.teachers.per_student_spending` | Professores por estudante; qual despesa média docente? Não indica valorização adequada ou eficiência. | despesa com professores por estudante; R$/estudante; SIOPE; `F7` | `PS`; não aplicável; taxa; `R$2` | C,D,H,X; N/N/C | aplicação; —; SIOPE → Aplicação/pessoal; sobrepõe parte do gasto por estudante |
| `municipal_revenue.tax_share` | Impostos na receita; qual participação na receita total? Explica composição, não recursos educacionais disponíveis. | impostos sobre receitas totais; `%`; SIOPE; `F8` | `PS`; indicador percentual; percentual; `%1` | C,D,H; N/N/N | origem; metodologia; SIOPE → Origem; não comparar/rankear com cobertura recente fraca |
| `education.financial_result` | Resultado financeiro; qual saldo foi declarado? Contextualiza equilíbrio, não avalia a política. | resultado contábil declarado; R$; SIOPE; `F0` | `PS`; saldo; estoque; `R$2` | C,D,H; N/N/N | execução; —; SIOPE → Execução/saldos; fórmula não reproduzida e reconciliação necessária |
| `fundeb.financial_balance` | Saldo Fundeb; qual saldo foi declarado? Mostra disponibilidade, não irregularidade. | saldo agregado conforme fonte; R$; SIOPE; `F0` | `PS`; saldo; estoque; `R$2` | C,D,H; N/N/N | execução; origem; SIOPE → Execução/Fundeb; não somar a ingressos, pagamentos ou outros saldos |

### 5.2 Fundeb — 12 IDs próprios mais 1 compartilhado

O campo `percentual_minimo_remuneracao_profissionais` usa o ID compartilhado `fundeb.professional_remuneration_rate`, já descrito acima.

| ID | Nome; pergunta; importância | Definição; unidade; origem; fórmula | Período; estágio; natureza; arred. | Papéis; Ag/Pm/Cm | Arquitetura e limitação principal |
|---|---|---|---|---|---|
| `fundeb.declared_revenue` | Receita Fundeb declarada; quanto foi declarado? Dimensiona a receita, não confirma transferência. | receita anual municipal; R$; Fundeb + Panorama; `F0` | `PF`; recebimento declarado; fluxo; `R$2` | S,C,D,H,X; C/C/C | origem; Panorama; Fundeb/Panorama → Origem/Fundeb; reconciliar com transferência e ingressos |
| `fundeb.professional_remuneration_amount` | Remuneração dos profissionais; quanto foi registrado? Mostra volume, não adequação salarial. | remuneração total do fundo; R$; Fundeb; `F0` | `PF`; não aplicável; fluxo; `R$2` | S,C,D,H,X; C/C/C | aplicação; —; Fundeb → Aplicação/Fundeb; fase não normalizada e total hierárquico |
| `fundeb.professional_remuneration.elementary_amount` | Remuneração no fundamental; quanto foi associado à etapa? Explica distribuição, não custo adequado. | recorte fundamental; R$; Fundeb; `F0` | `PF`; não aplicável; fluxo; `R$2` | C,D,H,O,X; C/C/C | aplicação; —; Fundeb → Aplicação por etapa; subconjunto do total |
| `fundeb.professional_remuneration.early_childhood_amount` | Remuneração na infantil; quanto foi associado à etapa? Explica distribuição, não cobertura. | recorte educação infantil; R$; Fundeb; `F0` | `PF`; não aplicável; fluxo; `R$2` | C,D,H,O,X; C/C/C | aplicação; —; Fundeb → Aplicação por etapa; inclui creche e pré-escola |
| `fundeb.professional_remuneration.daycare_amount` | Remuneração em creche; quanto foi associado? Detalha subetapa sem provar suficiência. | recorte creche; R$; Fundeb; `F0` | `PF` desde 2021; não aplicável; fluxo; `R$2` | C,D,H,O,X; C/C/C | aplicação; —; Fundeb → Aplicação por subetapa; nulos históricos estruturais |
| `fundeb.professional_remuneration.preschool_amount` | Remuneração na pré-escola; quanto foi associado? Detalha subetapa sem provar suficiência. | recorte pré-escola; R$; Fundeb; `F0` | `PF` desde 2021; não aplicável; fluxo; `R$2` | C,D,H,O,X; C/C/C | aplicação; —; Fundeb → Aplicação por subetapa; nulos históricos estruturais |
| `fundeb.total_expense` | Despesa total Fundeb; quanto foi registrado? Mostra escala, não toda a despesa educacional. | total anual do fundo; R$; Fundeb; `F0` | `PF`; não aplicável; fluxo; `R$2` | S,C,D,H,X; C/C/C | aplicação; execução; Fundeb → Aplicação/Fundeb; fase não normalizada, não somar componentes |
| `fundeb.previous_year_availability` | Saldo do ano anterior; qual estoque inicial? Contextualiza, não é nova receita. | disponibilidade trazida; R$; Fundeb; `F0` | `PF`; saldo; estoque; `R$2` | C,D,H; N/N/N | execução; —; Fundeb → Execução/saldos; não somar a fluxos ou saldo final |
| `fundeb.declared_inflows` | Ingressos declarados; quanto ingressou até o período? Acompanha fluxo, não confirma banco. | ingressos acumulados; R$; Fundeb; `F0` | `PF`; recebimento declarado; fluxo; `R$2` | C,D,H,X; C/C/C | origem; execução; Fundeb → Origem/Fundeb; sobrepõe receita declarada e exige competência igual |
| `fundeb.payments` | Pagamentos Fundeb; quanto foi pago? Mostra saída financeira, não empenho ou liquidação. | pagamentos acumulados; R$; Fundeb; `F0` | `PF`; pago; fluxo; `R$2` | C,D,H,X; C/C/C | execução; aplicação; Fundeb → Execução/Fundeb; não somar a outras fases |
| `fundeb.ending_availability` | Disponibilidade final; quanto restou? Contextualiza estoque, não recurso novo. | disponibilidade após movimentos; R$; Fundeb; `F9` | `PF`; saldo; estoque; `R$2` | S,C,D,H; N/N/N | execução; —; Fundeb → Execução/saldos; não somar a saldo anterior, fluxos ou conciliado |
| `fundeb.reconciled_balance` | Saldo conciliado; qual saldo após conciliação? Apoia conferência, não é fluxo. | saldo conciliado; R$; Fundeb; `F0` | `PF`; saldo; estoque; `R$2` | C,D,H,M; N/N/N | execução; metodologia; Fundeb → Execução/Fontes; fórmula de conciliação não reproduzida |

### 5.3 Panorama — 23 IDs próprios

Os quatro valores constitucionais do Panorama usam os IDs compartilhados `mde.application_rate`, `mde.applied_amount`, `fundeb.professional_remuneration_rate` e `fundeb.declared_revenue`.

| ID | Nome; pergunta; importância | Definição; unidade; origem; fórmula | Período; estágio; natureza; arred. | Papéis; Ag/Pm/Cm | Arquitetura e limitação principal |
|---|---|---|---|---|---|
| `qse.distributed_amount` | QSE distribuída; quanto foi distribuído? Mostra transferência, não toda receita educacional. | distribuição anual; R$; `qseDistributedClosedYear`; `F0` | `PQ`; transferência; fluxo; `R$2` | S,D,H,X; C/A/C | origem; Panorama; resumo/detalhe → Origem/QSE; reutilizar componente e não somar à estimativa |
| `fundeb.annual_forecast` | Fundeb previsto; qual previsão anual? Apoia planejamento, não prova recebimento. | total previsto; R$; `fundebTotalAnnualForecast`; `F0` | `PE`; previsão; fluxo; `R$2` | S,D,X; N/C/C | origem; Panorama; Panorama → Origem/Fundeb; complementos podem estar incluídos |
| `budget.education.committed` | Empenhado; quanto foi comprometido? Mostra compromisso, não liquidação/pagamento. | DCA função 12; R$; `committed`; `F0` | `PD`; empenhado; fluxo; `R$2` | S,D,H,X; C/C/C | execução; Panorama; Panorama → Execução; não somar fases |
| `budget.education.liquidated` | Liquidado; quanto chegou à liquidação? Não significa pagamento. | DCA função 12; R$; `liquidated`; `F0` | `PD`; liquidado; fluxo; `R$2` | D,H,X; C/C/C | execução; Panorama; Panorama → Execução; não somar fases |
| `budget.education.paid` | Pago; quanto chegou ao pagamento? Mostra saída, não soma das fases. | DCA função 12; R$; `paid`; `F0` | `PD`; pago; fluxo; `R$2` | S,D,H,X; C/C/C | execução; Panorama; resumo/detalhe → Execução; um campo reutilizado |
| `budget.education.payables.non_processed` | RAP não processados; qual estoque ainda não liquidado? Contextualiza obrigação, não fluxo novo. | saldo DCA; R$; `outstandingNonProcessed`; `F0` | `PD`; restos a pagar; estoque; `R$2` | D,H; N/N/N | execução; —; Panorama → Execução/RAP; cobertura parcial |
| `budget.education.payables.processed` | RAP processados; qual estoque liquidado e não pago? Contextualiza obrigação. | saldo DCA; R$; `outstandingProcessed`; `F0` | `PD`; restos a pagar; estoque; `R$2` | D,H; N/N/N | execução; —; Panorama → Execução/RAP; cobertura parcial |
| `budget.education.liquidated_to_committed_rate` | Liquidado/empenhado; quanto do empenhado liquidou? Mostra passagem, não eficiência. | taxa derivada; `%`; `liquidatedToCommittedRate`; `F10` | `PD`; indicador percentual; taxa; `%2` | D,H,X; N/N/C | execução; Panorama; Panorama → Execução; nulo se denominador zero |
| `budget.education.paid_to_committed_rate` | Pago/empenhado; quanto do empenhado foi pago? Mostra passagem, não atraso causal. | taxa derivada; `%`; `paidToCommittedRate`; `F11` | `PD`; indicador percentual; taxa; `%2` | D,H,X; N/N/C | execução; Panorama; Panorama → Execução; nulo se denominador zero |
| `budget.education.paid_to_liquidated_rate` | Pago/liquidado; quanto do liquidado foi pago? Mostra passagem, não causa da diferença. | taxa derivada; `%`; `paidToLiquidatedRate`; `F12` | `PD`; indicador percentual; taxa; `%2` | D,H,X; N/N/C | execução; Panorama; Panorama → Execução; nulo se denominador zero |
| `budget.education.payables_to_committed_rate` | RAP/empenhado; qual pressão dos restos? Dimensiona, não prova irregularidade. | taxa derivada; `%`; `outstandingToCommittedRate`; `F13` | `PD`; indicador percentual; taxa; `%2` | D,H; N/N/N | execução; Panorama; Panorama → Execução; componentes/cobertura precisam existir |
| `qse.official_estimate` | QSE estimada; qual estimativa oficial? Apoia planejamento, não é transferência. | estimativa anual; R$; `qseOfficialEstimateCurrentYear`; `F0` | `PE`; estimativa; fluxo; `R$2` | D,X; N/C/C | origem; Panorama; Panorama → Origem/QSE; não somar à distribuição |
| `qse.enrollment_basis` | Matrículas QSE; qual denominador foi usado? Explica cálculo, não estudantes únicos. | base física; contagem; `enrollmentsClosedYear`; `F0` | `PQ`; não aplicável; quantidade física; `I0` | D,M; C/N/C | metodologia; origem; Panorama → Fontes/QSE; conceito de matrícula deve ser equivalente |
| `qse.distribution_coefficient.closed_basis` | Coeficiente QSE fechado; qual participação determinou distribuição? Não é valor recebido. | coeficiente; `distributionCoefficientClosedYear`; `F14` | `PQ`; coeficiente; coeficiente; `K6–8` | M; N/N/N | metodologia; origem; Panorama → Fontes/QSE; restrito à metodologia |
| `qse.distribution_coefficient.current_estimate` | Coeficiente QSE estimado; qual participação orienta a estimativa? Não é transferência. | coeficiente; `distributionCoefficientCurrentYear`; `F0` | `PE`; coeficiente; coeficiente; `K6–8` | M; N/N/N | metodologia; origem; Panorama → Fontes/QSE; restrito à metodologia |
| `qse.distributed_per_enrollment` | QSE por matrícula; qual valor médio distribuído? Não é benefício individual. | QSE/matrícula; R$/matrícula; derivado; `F15` | `PQ`; não aplicável; taxa; `R$2` | D,H,X; N/N/C | origem; metodologia; Panorama → Origem/QSE; denominador compatível obrigatório |
| `fundeb.vaaf.annual_forecast` | VAAF previsto; qual previsão para beneficiário? Não prova transferência. | previsão anual; R$; `fundebVaafAnnualForecast`; `F0` | `PE`; previsão; fluxo; `R$2` | D; N/C/N | origem; programas; Panorama → Origem/Fundeb; nulo de não beneficiário não é zero |
| `fundeb.vaat.annual_forecast` | VAAT previsto; qual previsão para beneficiário? Habilitação não confirma benefício. | previsão anual; R$; `fundebVaatAnnualForecast`; `F0` | `PE`; previsão; fluxo; `R$2` | D; N/C/N | origem; programas; Panorama → Origem/Fundeb; pode integrar total previsto |
| `fundeb.vaar.annual_forecast` | VAAR previsto; qual previsão para beneficiário? Não prova recebimento/aplicação. | previsão anual; R$; `fundebVaarAnnualForecast`; `F0` | `PE`; previsão; fluxo; `R$2` | S,D; N/C/N | origem; programas/Panorama; Panorama → Programas/VAAR; separar de condições analíticas |
| `fundeb.vaaf.beneficiary_status` | Condição VAAF; é beneficiário? Separa condição de valor financeiro. | condição nominal; booleano; `fundebVaaf.status`; `F0` | `PE`; status analítico; condição; `B` | D; N/N/N | programas; origem; Panorama → Programas/Fundeb; não prova transferência |
| `fundeb.vaat.beneficiary_status` | Condição VAAT; é beneficiário? Separa benefício de habilitação ao cálculo. | condição nominal; booleano; `fundebVaat.status`; `F0` | `PE`; status analítico; condição; `B` | D; N/N/N | programas; origem; Panorama → Programas/Fundeb; não confundir com cálculo |
| `fundeb.vaat.calculation_eligibility` | Habilitação ao cálculo VAAT; pode participar do cálculo? Não confirma benefício. | condição de cálculo; booleano; `calculationStatus`; `F0` | `PE`; status analítico; condição; `B` | D,M; N/N/N | programas; metodologia; Panorama → Fontes/VAAT; condição técnica, não recebimento |
| `fundeb.vaar.beneficiary_status` | Condição VAAR; é beneficiário nominal? Não equivale aos componentes ou valor. | condição nominal; booleano; `fundebVaar.status`; `F0` | `PE`; status analítico; condição; `B` | S,D; N/N/N | programas; Panorama/origem; Panorama → Programas/VAAR; separar de aprendizagem/atendimento |

### 5.4 VAAR — 31 IDs

Todos têm domínio principal Programas e complementações, domínio secundário Fontes e metodologia e rota futura Programas/VAAR. Comparação municipal, ranking, agregação e cálculo por matrícula são proibidos. A mudança de rota é apenas organizacional futura; a rota atual VAAR permanece inalterada.

| ID | Nome; pergunta; importância | Definição; unidade; origem; fórmula | Período; estágio; natureza; arred. | Papéis | Limitação principal |
|---|---|---|---|---|---|
| `vaar.eligibility.conditions` | Habilitação VAAR; cumpriu condicionalidades? Mostra condição inicial, não recebimento. | resultado de habilitação; booleano; `habilitado_condicionalidades`; `F0` | `PV`; status analítico; condição; `B` | S,D,H | não confirma componentes nem valor financeiro |
| `vaar.learning.receipt_status` | Recebe por aprendizagem; recebeu o componente? Identifica resultado, não montante ou causalidade. | condição de recebimento; booleano; `recebe_aprendizagem`; `F0` | `PV`; status analítico; condição; `B` | S,D,H | ausência histórica não equivale a “não recebeu”; métodos não são contínuos |
| `vaar.attendance.receipt_status` | Recebe por atendimento; recebeu o componente? Identifica resultado, não montante ou efeito. | condição de recebimento; booleano; `recebe_atendimento`; `F0` | `PV`; status analítico; condição; `B` | S,D,H | ausência histórica não equivale a “não recebeu”; métodos não são contínuos |
| `vaar.learning.index` | Indicador de aprendizagem; qual índice foi publicado? Explica a dimensão, não é nota geral. | índice composto atual; `index`; `indicador_aprendizagem`; `F0` | `PV` atual; parâmetro; parâmetro; `I4` | D,H | comparar somente 2025–2026; fórmula composta não reproduzida |
| `vaar.learning.delta` | Variação da aprendizagem; quanto mudou? Mostra mudança, não causalidade VAAR. | diferença publicada; `index`; `delta_aprendizagem`; `F0` | `PV` atual; parâmetro; parâmetro; `I4` | D,H | ciclos e metodologia precisam ser equivalentes |
| `vaar.learning.adjusted_delta` | Variação ajustada; qual ajuste resultou? Explica regra, não desempenho amplo. | parâmetro ajustado; `index`; `delta_aprendizagem_ajustado`; `F0` | `PV` atual; parâmetro; parâmetro; `I4` | M | cobertura muito baixa; restrito à metodologia |
| `vaar.learning.iad` | IAD; qual avanço do Saeb foi considerado? Decompõe o cálculo, não substitui o índice. | indicador de avanço; `index`; `iad`; `F0` | `PV` atual; parâmetro; parâmetro; `I4` | D,M | depende das edições e regra oficial |
| `vaar.learning.adjusted_iad` | IAD ajustado; qual valor após tratamento? Explica ajuste, não sustenta comparação. | parâmetro ajustado; `index`; `iad_ajustado`; `F0` | `PV` atual; parâmetro; parâmetro; `I4` | M | cobertura muito baixa; restrito à metodologia |
| `vaar.learning.saeb_adequacy.baseline` | Adequação Saeb anterior; qual base foi usada? Contextualiza, não é série anual. | proporção adequada 2019; `%`; `proporcao_adequada_saeb_2019`; `F0` | `PV` atual; indicador percentual; percentual; `%1` | D,M | valor de origem é proporção; referência metodológica fixa |
| `vaar.learning.saeb_adequacy.current` | Adequação Saeb atual; qual base foi usada? Contextualiza, não é nota geral. | proporção adequada 2023; `%`; `proporcao_adequada_saeb_2023`; `F0` | `PV` atual; indicador percentual; percentual; `%1` | D,M | valor de origem é proporção; comparar só pela regra oficial |
| `vaar.learning.penalized_approval.baseline` | Aprovação penalizada anterior; qual taxa ajustada foi usada? Explica regra, não taxa geral. | taxa ajustada 2019; `%`; `taxa_aprovacao_penalizada_2019`; `F0` | `PV` atual; indicador percentual; percentual; `%1` | D,M | não substituir pela taxa pública sem penalização |
| `vaar.learning.penalized_approval.current` | Aprovação penalizada atual; qual taxa ajustada foi usada? Explica regra, não taxa geral. | taxa ajustada 2023; `%`; `taxa_aprovacao_penalizada_2023`; `F0` | `PV` atual; indicador percentual; percentual; `%1` | D,M | não substituir pela taxa pública sem penalização |
| `vaar.learning.equity` | Equidade; qual medida foi usada? Mostra dimensão da regra, não toda a equidade da rede. | índice de equidade; `index`; `equidade_2023`; `F0` | `PV` atual; parâmetro; parâmetro; `I4` | D,M | depende de base, grupos e ponderadores oficiais |
| `vaar.attendance.index.baseline` | Atendimento anterior; qual índice-base? Fornece referência, não quantidade atendida. | índice anterior; `index`; `indicador_atendimento_anterior`; `F0` | `PV` atual; parâmetro; parâmetro; `I4` | D | comparar apenas ao atual do mesmo registro |
| `vaar.attendance.index.current` | Atendimento atual; qual índice foi publicado? Explica permanência, não cobertura escolar geral. | índice atual; `index`; `indicador_atendimento_atual`; `F0` | `PV` atual; parâmetro; parâmetro; `I4` | D,H | não comparar ao indicador da metodologia anterior |
| `vaar.attendance.delta` | Variação do atendimento; quanto mudou? Mostra mudança, não causalidade. | diferença publicada; `index`; `delta_atendimento`; `F0` | `PV` atual; parâmetro; parâmetro; `I4` | D,H | fórmula completa não reproduzida |
| `vaar.attendance.adjusted_delta` | Variação ajustada; qual ajuste resultou? Explica regra, não gestão. | parâmetro ajustado; `index`; `delta_atendimento_ajustado`; `F0` | `PV` atual; parâmetro; parâmetro; `I4` | M | restrito à metodologia |
| `vaar.attendance.priority_students.baseline` | Estudantes prioritários anteriores; quantos compuseram a base? Explica denominador, não atendidos únicos. | contagem anterior; estudantes; `estudantes_areas_prioritarias_anterior`; `F0` | `PV` atual; não aplicável; quantidade física; `I0` | D,M | não é matrícula total nem valor financeiro |
| `vaar.attendance.priority_students.current` | Estudantes prioritários atuais; quantos compuseram a base? Explica denominador, não atendidos únicos. | contagem atual; estudantes; `estudantes_areas_prioritarias_atual`; `F0` | `PV` atual; não aplicável; quantidade física; `I0` | D,M | não é matrícula total nem valor financeiro |
| `vaar.attendance.dropout_rate.baseline` | Abandono anterior; qual proporção foi usada? Contextualiza permanência, não causa. | proporção anterior; `%`; `proporcao_abandono_anterior`; `F0` | `PV` atual; indicador percentual; percentual; `%1` | D,M | origem é proporção; base precisa ser equivalente |
| `vaar.attendance.dropout_rate.current` | Abandono atual; qual proporção foi usada? Contextualiza permanência, não causa. | proporção atual; `%`; `proporcao_abandono_atual`; `F0` | `PV` atual; indicador percentual; percentual; `%1` | D,M | origem é proporção; base precisa ser equivalente |
| `vaar.attendance.missing_information_rate.baseline` | Sem informação anterior; qual parcela estava incompleta? Expõe limitação, não abandono. | proporção sem informação; `%`; `proporcao_sem_informacao_anterior`; `F0` | `PV` atual; indicador percentual; percentual; `%1` | D,M | indicador de completude, não de desempenho |
| `vaar.attendance.missing_information_rate.current` | Sem informação atual; qual parcela está incompleta? Expõe limitação, não abandono. | proporção sem informação; `%`; `proporcao_sem_informacao_atual`; `F0` | `PV` atual; indicador percentual; percentual; `%1` | D,M | indicador de completude, não de desempenho |
| `vaar.legacy.attendance.index` | Atendimento histórico; qual índice anterior? Preserva consulta sem série falsa. | índice do método anterior; `index`; `indicador_atendimento_metodologia_anterior`; `F0` | `PV` 2023–24; parâmetro; parâmetro; `I4` | D,H,M | não comparar a 2025–2026 |
| `vaar.legacy.attendance.evolution` | Evolução histórica do atendimento; qual mudança anterior? Preserva resultado sem misturar métodos. | evolução anterior; `index`; `evolucao_atendimento_metodologia_anterior`; `F0` | `PV` 2023–24; parâmetro; parâmetro; `I4` | D,H,M | não comparar ao delta atual |
| `vaar.legacy.attendance.coefficient` | Coeficiente histórico de atendimento; qual parâmetro de distribuição? Explica, não é valor. | coeficiente anterior; `coefficient`; `coeficiente_atendimento`; `F0` | `PV` 2023–24; coeficiente; coeficiente; `I4` | H,M | não comparar ao método atual nem somar |
| `vaar.legacy.learning.index` | Aprendizagem histórica; qual índice anterior? Preserva consulta sem continuidade artificial. | índice do método anterior; `index`; `indicador_aprendizagem_metodologia_anterior`; `F0` | `PV` 2023–24; parâmetro; parâmetro; `I4` | D,H,M | não comparar a 2025–2026 |
| `vaar.legacy.learning.evolution` | Evolução histórica da aprendizagem; qual mudança anterior? Preserva resultado sem misturar métodos. | evolução anterior; `index`; `evolucao_aprendizagem_metodologia_anterior`; `F0` | `PV` 2023–24; parâmetro; parâmetro; `I4` | D,H,M | não comparar ao delta atual |
| `vaar.legacy.learning.coefficient` | Coeficiente histórico de aprendizagem; qual parâmetro de distribuição? Explica, não é valor. | coeficiente anterior; `coefficient`; `coeficiente_aprendizagem`; `F0` | `PV` 2023–24; coeficiente; coeficiente; `I4` | H,M | não comparar ao método atual nem somar |
| `vaar.legacy.total_coefficient` | Coeficiente total histórico; qual parâmetro total? Relaciona componentes, não informa valor. | coeficiente total; `coefficient`; `coeficiente_total`; `F0` | `PV` 2023–24; coeficiente; coeficiente; `I4` | H,M | fórmula não reproduzida; não somar coeficientes |
| `vaar.legacy.dual_evolution_status` | Evolução nos dois indicadores; houve evolução simultânea? Resume condição, não benefício. | condição histórica; booleano; `apresentou_evolucao_nos_dois_indicadores`; `F0` | `PV` 2023–24; status analítico; condição; `B` | H,M | não equivale a habilitação ou recebimento atual |

### 5.5 PNATE — 10 IDs

Todos têm domínio principal Programas e complementações, com Origem dos recursos e Fontes/metodologia como domínios secundários. A rota atual PNATE permanece; a rota futura recomendada é Programas/PNATE.

| ID | Nome; pergunta; importância | Definição; unidade; origem; fórmula | Período; estágio; natureza; arred. | Papéis; Ag/Pm/Cm | Limitação principal |
|---|---|---|---|---|---|
| `pnate.reported_amount` | Valor informado; qual montante anual aparece? Dimensiona apoio, não comprova pagamento/custo total. | valor anual do leiaute; R$; `repasse_total`; `F0` | `PP`; não aplicável; fluxo; `R$2` | S,C,D,H; N/C/N | estágio alterna por exercício; sobrepõe autorizado e recortes por rede |
| `pnate.authorized_amount_after_discount` | Repasse autorizado; qual valor após ajustes? Distingue autorização de transferência. | valor autorizado; R$; `repasse_autorizado_apos_desconto`; `F16` | `PP`; autorização; fluxo; `R$2` | S,C,D,H,X; N/C/C | autorização não comprova transferência; não somar aos ajustes |
| `pnate.per_capita_parameter` | Parâmetro per capita; qual valor unitário foi usado? Explica cálculo, não recebido/estudante. | parâmetro da fonte; R$/estudante; `resultado_per_capita`; `F0` | `PP`; parâmetro; parâmetro; `R$2` | S,C,D,H,M; N/N/N | não dividir novamente nem usar como efetivo por estudante |
| `pnate.students.total` | Estudantes considerados; quantos entraram no cálculo? Mostra base, não atendidos únicos. | total da base; estudantes; `total_alunos`; `F0` | `PP`; não aplicável; quantidade física; `I0` | S,C,D,H,X; C/N/C | total hierárquico; não somar novamente às redes |
| `pnate.students.municipal_network` | Estudantes municipais; quantos da rede municipal? Detalha base, não valor. | recorte municipal; estudantes; `total_alunos_rede_municipal`; `F0` | `PP`; não aplicável; quantidade física; `I0` | C,D,H,O,X; C/N/C | compõe só com redes exclusivas e cobertura completa |
| `pnate.students.state_network` | Estudantes estaduais; quantos no território? Detalha base, não despesa municipal. | recorte estadual; estudantes; `total_alunos_rede_estadual`; `F0` | `PP`; não aplicável; quantidade física; `I0` | C,D,H,O,X; C/N/C | presença estadual não implica execução municipal |
| `pnate.discount_amount` | Desconto; quanto foi retirado do cálculo? Explica diferença, não economia ou fluxo positivo. | ajuste anual; R$; `desconto`; `F0` | `PP`; autorização; fluxo; `R$2` | C,D,H,M; N/N/N | não somar ao valor autorizado; regra varia por exercício |
| `pnate.disregarded_balance` | Saldo desconsiderado; qual estoque não entrou no cálculo? Explica ajuste, não repasse novo. | saldo de ajuste; R$; `saldo_desconsiderado`; `F0` | `PP`; saldo; estoque; `R$2` | C,D,H,M; N/N/N | saldo não se soma a fluxos |
| `pnate.municipal_network_amount` | Valor da rede municipal; qual montante foi associado? Detalha rede, não comprova transferência. | valor por rede; R$; `valor_total_municipal`; `F0` | `PP`; não aplicável; fluxo; `R$2` | C,D,H,O; C/C/N | pode repetir total/autorizado; compor só após reconciliação |
| `pnate.state_network_amount` | Valor da rede estadual; qual montante foi associado? Contextualiza território, não receita municipal. | valor por rede; R$; `valor_total_estadual`; `F0` | `PP`; não aplicável; fluxo; `R$2` | C,D,H,O; C/C/N | não atribuir ao caixa municipal; compor só após reconciliação |

## 6. Classificação por estágio financeiro

Cada ID possui exatamente um estágio principal. Os nomes do código abaixo correspondem, respectivamente, às categorias públicas em português.

| Estágio canônico | Qtd. | Indicadores |
|---|---:|---|
| condição ou status analítico (`analytical_status`) | 8 | `fundeb.vaaf.beneficiary_status`, `fundeb.vaat.beneficiary_status`, `fundeb.vaat.calculation_eligibility`, `fundeb.vaar.beneficiary_status`, `vaar.eligibility.conditions`, `vaar.learning.receipt_status`, `vaar.attendance.receipt_status`, `vaar.legacy.dual_evolution_status` |
| autorização (`authorization`) | 2 | `pnate.authorized_amount_after_discount`, `pnate.discount_amount` |
| saldo ou disponibilidade (`balance`) | 6 | `education.financial_result`, `fundeb.financial_balance`, `fundeb.previous_year_availability`, `fundeb.ending_availability`, `fundeb.reconciled_balance`, `pnate.disregarded_balance` |
| parâmetro de cálculo (`calculation_parameter`) | 15 | `vaar.learning.index`, `vaar.learning.delta`, `vaar.learning.adjusted_delta`, `vaar.learning.iad`, `vaar.learning.adjusted_iad`, `vaar.learning.equity`, `vaar.attendance.index.baseline`, `vaar.attendance.index.current`, `vaar.attendance.delta`, `vaar.attendance.adjusted_delta`, `vaar.legacy.attendance.index`, `vaar.legacy.attendance.evolution`, `vaar.legacy.learning.index`, `vaar.legacy.learning.evolution`, `pnate.per_capita_parameter` |
| coeficiente (`coefficient`) | 5 | `qse.distribution_coefficient.closed_basis`, `qse.distribution_coefficient.current_estimate`, `vaar.legacy.attendance.coefficient`, `vaar.legacy.learning.coefficient`, `vaar.legacy.total_coefficient` |
| empenhado (`committed`) | 2 | `mde.applied_amount`, `budget.education.committed` |
| recebimento declarado (`declared_receipt`) | 2 | `fundeb.declared_revenue`, `fundeb.declared_inflows` |
| estimativa (`estimate`) | 1 | `qse.official_estimate` |
| previsão (`forecast`) | 4 | `fundeb.annual_forecast`, `fundeb.vaaf.annual_forecast`, `fundeb.vaat.annual_forecast`, `fundeb.vaar.annual_forecast` |
| liquidado (`liquidated`) | 1 | `budget.education.liquidated` |
| não aplicável (`not_applicable`) | 20 | quatro gastos por estudante SIOPE; seis despesas Fundeb sem fase normalizada; `qse.enrollment_basis`; `qse.distributed_per_enrollment`; duas contagens prioritárias VAAR; `pnate.reported_amount`; três contagens PNATE; dois valores PNATE por rede |
| pago (`paid`) | 2 | `fundeb.payments`, `budget.education.paid` |
| restos a pagar (`payables`) | 2 | `budget.education.payables.non_processed`, `budget.education.payables.processed` |
| indicador percentual (`percentage_indicator`) | 19 | sete percentuais SIOPE; quatro taxas DCA; oito proporções/taxas detalhadas do VAAR |
| transferência (`transfer`) | 1 | `qse.distributed_amount` |
| dotação/orçamento | 0 | nenhum indicador público atual com valor publicável |
| receita realizada | 0 | nenhum campo atual é normalizado com esse estágio; receita do Fundeb permanece “declarada” |

“Não aplicável” não transforma estágio desconhecido em estágio presumido. Nos campos de despesa Fundeb e valores PNATE por rede, essa escolha registra explicitamente a lacuna do leiaute atual.

## 7. Classificação por natureza

| Natureza | Qtd. | Regra |
|---|---:|---|
| fluxo | 24 | somar somente competências não sobrepostas, estágio e fonte equivalentes |
| estoque | 8 | nunca somar entre períodos nem a fluxos |
| percentual | 15 | nunca somar; comparar apenas bases equivalentes |
| taxa | 9 | nunca somar; denominador e competência devem ser conhecidos |
| parâmetro | 15 | não representa execução ou recebimento; usar na metodologia ou detalhe permitido |
| coeficiente | 5 | não é valor financeiro nem percentual executado |
| quantidade física | 6 | não somar a valores financeiros; validar conceito de estudante/matrícula |
| condição analítica | 8 | não é valor financeiro, previsão ou transferência |
| composição | 0 | nenhum indicador atual é, sozinho, uma composição pronta; dez componentes possuem papel condicional `composition` |

## 8. Sobreposições e consolidação semântica

| Sobreposição obrigatória | ID canônico e campos | Diferença legítima | Contexto principal; secundários | Componente e nomenclatura |
|---|---|---|---|---|
| aplicação em MDE | `mde.application_rate`; `aplicacao_mde_percentual` e `mdeAppliedRate.canonical` | Panorama reconcilia SIOPE/RREO; série SIOPE usa 6º bimestre | Aplicação; Panorama e catálogo SIOPE | um componente conceitual reutilizável; “Aplicação em MDE” |
| despesa computada em MDE | `mde.applied_amount`; `valor_aplicado_mde_reais` e `mdeAppliedAmount.canonical` | Panorama bloqueia divergência acima de R$ 0,01; SIOPE oferece série | Aplicação; Panorama e SIOPE | um componente conceitual; “Despesa computada em MDE” prevalece |
| Fundeb em remuneração | `fundeb.professional_remuneration_rate`; campos Panorama, SIOPE e Fundeb | arredondamento visual e período podem divergir; regra legal muda em 2021 | Aplicação/Fundeb; Panorama, SIOPE e Fundeb | um componente conceitual; “Percentual do Fundeb aplicado na remuneração dos profissionais” |
| receita Fundeb declarada | `fundeb.declared_revenue`; `receitas` e `fundebRevenueReceivedDeclared` | série Fundeb e fotografia reconciliada podem ter competências distintas | Origem/Fundeb; Panorama | um componente conceitual; sempre manter “declarada” |
| ingressos, receita, pagamentos, disponibilidade e saldo Fundeb | cinco IDs distintos: `fundeb.declared_inflows`, `fundeb.declared_revenue`, `fundeb.payments`, `fundeb.ending_availability`, `fundeb.reconciled_balance`, além de `fundeb.financial_balance` | podem divergir legitimamente por competência, fase, conciliação e fonte | Origem para receita/ingressos; Execução para pagamentos/saldos | não consolidar em um número e nunca somar; usar blocos de fluxo e estoque separados |
| QSE no resumo e detalhe | `qse.distributed_amount`; mesmo campo `qseDistributedClosedYear` | nenhuma; é repetição de apresentação | Origem/QSE; Panorama | reutilizar um componente; “QSE distribuída” |
| QSE distribuída e estimada | `qse.distributed_amount` e `qse.official_estimate` | divergência é esperada: exercícios e estágios diferentes | Origem/QSE | componentes distintos; nunca somar nem calcular variação direta |
| PNATE resumo e catálogo | os dez IDs PNATE; mesmos campos do resumo/catálogo | nenhuma quando campo e ano são iguais | Programas/PNATE | reutilizar o mesmo metadado canônico; não criar IDs por componente visual |
| PNATE total, autorizado e valores por rede | `pnate.reported_amount`, `pnate.authorized_amount_after_discount`, `pnate.municipal_network_amount`, `pnate.state_network_amount` | valores podem divergir por desconto, rede e estágio não normalizado | Programas/PNATE | manter separados; composição somente após reconciliação de estágio e exclusividade |
| estudantes PNATE no resumo e catálogo | `pnate.students.total`, `.municipal_network`, `.state_network` | nenhuma quando campo/ano iguais; recortes por rede são subconjuntos | Programas/PNATE | total não deve ser somado novamente aos recortes |
| status VAAR em resumo, resultado e histórico | `vaar.eligibility.conditions`, `vaar.learning.receipt_status`, `vaar.attendance.receipt_status` | valores mudam por exercício; 2023–24 e 2025–26 têm metodologias distintas | Programas/VAAR | um componente por condição e exercício; histórico separado por metodologia |
| condição VAAR, previsão e recebimento por componente | `fundeb.vaar.beneficiary_status`, `fundeb.vaar.annual_forecast` e dois status de recebimento VAAR | podem divergir legitimamente porque respondem perguntas distintas | Programas/VAAR; Origem para a previsão | nunca fundir; “beneficiário”, “previsão” e “recebeu componente” devem permanecer explícitos |

## 9. Papéis de apresentação e restrições

| Papel | Qtd. | Regra |
|---|---:|---|
| `summary` | 21 | elegíveis semanticamente; a página Panorama deve selecionar apenas os centrais e não repetir catálogos completos |
| `catalog` | 36 | catálogos atuais SIOPE, Fundeb e PNATE permanecem compatíveis |
| `detail` | 81 | detalhes condicionados a valor publicável e competência clara |
| `history` | 62 | série somente com definição e metodologia comparáveis; VAAR fica separado por método |
| `composition` | 10 | apenas etapas/subetapas Fundeb e recortes PNATE, sempre com exclusividade e reconciliação |
| `comparison` | 34 | indica possibilidade semântica; nenhum ranking é autorizado nesta etapa |
| `methodology` | 31 | parâmetros, bases, ajustes, coeficientes e conciliação |

Justificativas para exclusão:

- **Resumo:** saldos detalhados, taxas intermediárias, coeficientes, parâmetros técnicos, ajustes e subcomponentes não respondem uma pergunta central sem contexto. Os 69 IDs sem `summary` permanecem em catálogo, detalhe ou metodologia.
- **Ranking:** nenhum ID possui papel específico de ranking. Mesmo os 34 comparáveis exigem limiar de cobertura, mesma competência, metodologia estável, ajuste por porte quando cabível e aprovação posterior de produto.
- **Composição:** 80 IDs não têm papel `composition`. Isso inclui todos os saldos, fases DCA, percentuais não exclusivos, taxas, coeficientes, previsões, estados analíticos e totais hierárquicos.
- **Histórico:** as 28 entradas sem `history` são previsões/estimativas sem série atual, status ou parâmetros de uma única referência, bases fixas do VAAR e campos restritos à metodologia. O histórico DCA futuro não está integrado aqui.
- **Comparação municipal:** 55 IDs têm comparação proibida e 35 condicionada; nenhum é irrestrito. Saldos, coeficientes, parâmetros VAAR, previsões de beneficiário e valores PNATE de estágio incerto não devem ser comparados.

Indicadores restritos exclusivamente à metodologia: `qse.distribution_coefficient.closed_basis`, `qse.distribution_coefficient.current_estimate`, `vaar.learning.adjusted_delta`, `vaar.learning.adjusted_iad` e `vaar.attendance.adjusted_delta`.

## 10. Arquitetura futura por domínio

| Domínio futuro | IDs principais | Qtd. | Uso arquitetural |
|---|---|---:|---|
| A. Panorama municipal | nenhum proprietário primário; consome papéis `summary` de outros domínios | 0 | síntese municipal com poucos valores centrais, sem duplicar catálogos |
| B. Origem dos recursos | receita/impostos, Fundeb declarado e previsto, QSE, ingressos e complementações previstas | 10 | fluxos de origem separados por estágio; composição só reconciliada |
| C. Aplicação dos recursos | MDE, remuneração Fundeb, distribuição por etapa e gasto por estudante | 17 | mínimos, remuneração e aplicação por etapa/finalidade |
| D. Execução orçamentária | DCA, pagamentos Fundeb, restos, disponibilidades e saldos | 15 | fases de despesa e taxas; saldos em bloco próprio |
| E. Programas e complementações | VAAR e PNATE, além de condições VAAF/VAAT/VAAR | 45 | programas com metodologia e aplicabilidade próprias |
| F. Fontes e metodologia | base e coeficientes QSE | 3 | parâmetros canônicos; outros 28 IDs acessam o domínio como secundário |

Não há alteração de rota nesta etapa. A matriz combinada da seção 5 registra, para cada ID, domínio principal, secundários, rota atual, rota futura e necessidade de reorganização.

## 11. Tabela de migração dos campos atuais

O alias é mantido para rastreabilidade, não como ID futuro. Risco baixo significa troca direta de identificador; médio exige preservar competência/metodologia; alto exige também reconciliação ou prevenção explícita de sobreposição.

### 11.1 Panorama

| Campo atual | Catálogo | ID canônico | Alias | Risco |
|---|---|---|---|---|
| `amounts.qseDistributedClosedYear` | Panorama | `qse.distributed_amount` | PA01 | baixo |
| `amounts.fundebTotalAnnualForecast` | Panorama | `fundeb.annual_forecast` | PA02 | médio |
| `execution.dcaEducation.paid` (resumo) | Panorama | `budget.education.paid` | PA03 | baixo |
| `constitutionalApplication.mdeAppliedRate.canonical` | Panorama | `mde.application_rate` | PA04 | médio |
| `constitutionalApplication.mdeAppliedAmount.canonical` | Panorama | `mde.applied_amount` | PA05 | médio |
| `constitutionalApplication.fundebProfessionalRemunerationRate.canonical` | Panorama | `fundeb.professional_remuneration_rate` | PA06 | alto |
| `constitutionalApplication.fundebRevenueReceivedDeclared` | Panorama | `fundeb.declared_revenue` | PA07 | alto |
| `execution.dcaEducation.committed` | Panorama | `budget.education.committed` | PA08 | baixo |
| `execution.dcaEducation.liquidated` | Panorama | `budget.education.liquidated` | PA09 | baixo |
| `execution.dcaEducation.paid` (execução) | Panorama | `budget.education.paid` | PA10 | baixo |
| `execution.dcaEducation.outstandingNonProcessed` | Panorama | `budget.education.payables.non_processed` | PA11 | médio |
| `execution.dcaEducation.outstandingProcessed` | Panorama | `budget.education.payables.processed` | PA12 | médio |
| `execution.dcaEducation.derivedRates.liquidatedToCommittedRate` | Panorama | `budget.education.liquidated_to_committed_rate` | PA13 | baixo |
| `execution.dcaEducation.derivedRates.paidToCommittedRate` | Panorama | `budget.education.paid_to_committed_rate` | PA14 | baixo |
| `execution.dcaEducation.derivedRates.paidToLiquidatedRate` | Panorama | `budget.education.paid_to_liquidated_rate` | PA15 | baixo |
| `execution.dcaEducation.derivedRates.outstandingToCommittedRate` | Panorama | `budget.education.payables_to_committed_rate` | PA16 | médio |
| `amounts.qseOfficialEstimateCurrentYear` | Panorama | `qse.official_estimate` | PA17 | médio |
| `qse.enrollmentsClosedYear` | Panorama | `qse.enrollment_basis` | PA18 | baixo |
| `qse.distributionCoefficientClosedYear` | Panorama | `qse.distribution_coefficient.closed_basis` | PA19 | baixo |
| `qse.distributionCoefficientCurrentYear` | Panorama | `qse.distribution_coefficient.current_estimate` | PA20 | médio |
| `perStudent.qseDistributedPerEnrollment` | Panorama | `qse.distributed_per_enrollment` | PA21 | baixo |
| `amounts.fundebVaafAnnualForecast` | Panorama | `fundeb.vaaf.annual_forecast` | PA22 | alto |
| `amounts.fundebVaatAnnualForecast` | Panorama | `fundeb.vaat.annual_forecast` | PA23 | alto |
| `amounts.fundebVaarAnnualForecast` | Panorama | `fundeb.vaar.annual_forecast` | PA24 | alto |
| `programStatuses.fundebVaaf.status` | Panorama | `fundeb.vaaf.beneficiary_status` | PAS01 | baixo |
| `programStatuses.fundebVaat.status` | Panorama | `fundeb.vaat.beneficiary_status` | PAS02 | médio |
| `programStatuses.fundebVaat.calculationStatus` | Panorama | `fundeb.vaat.calculation_eligibility` | PAS03 | médio |
| `programStatuses.fundebVaar.status` | Panorama | `fundeb.vaar.beneficiary_status` | PAS04 | médio |

### 11.2 SIOPE

| Campo atual | Catálogo | ID canônico | Alias | Risco |
|---|---|---|---|---|
| `aplicacao_mde_percentual` | SIOPE | `mde.application_rate` | SI01 | médio |
| `fundeb_remuneracao_profissionais_percentual` | SIOPE | `fundeb.professional_remuneration_rate` | SI02 | alto |
| `fundeb_nao_aplicado_percentual` | SIOPE | `fundeb.unapplied_rate` | SI03 | baixo |
| `valor_aplicado_mde_reais` | SIOPE | `mde.applied_amount` | SI04 | médio |
| `fundeb_educacao_infantil_percentual` | SIOPE | `fundeb.early_childhood_share` | SI05 | baixo |
| `fundeb_ensino_fundamental_percentual` | SIOPE | `fundeb.elementary_share` | SI06 | baixo |
| `despesas_educacao_total_percentual` | SIOPE | `education.total_expenditure_share` | SI07 | baixo |
| `investimento_aluno_basica_reais` | SIOPE | `education.basic.per_student_spending` | SI08 | baixo |
| `investimento_aluno_infantil_reais` | SIOPE | `education.early_childhood.per_student_spending` | SI09 | baixo |
| `investimento_aluno_fundamental_reais` | SIOPE | `education.elementary.per_student_spending` | SI10 | baixo |
| `despesa_professores_aluno_basica_reais` | SIOPE | `education.teachers.per_student_spending` | SI11 | médio |
| `receitas_impostos_total_percentual` | SIOPE | `municipal_revenue.tax_share` | SI12 | médio |
| `resultado_financeiro_exercicio_reais` | SIOPE | `education.financial_result` | SI13 | alto |
| `saldo_financeiro_fundeb_reais` | SIOPE | `fundeb.financial_balance` | SI14 | alto |

### 11.3 Fundeb

| Campo atual | Catálogo | ID canônico | Alias | Risco |
|---|---|---|---|---|
| `receitas` | Fundeb | `fundeb.declared_revenue` | FU01 | alto |
| `despesa_remuneracao_profissionais` | Fundeb | `fundeb.professional_remuneration_amount` | FU02 | alto |
| `despesa_remuneracao_profissionais_ensino_fundamental` | Fundeb | `fundeb.professional_remuneration.elementary_amount` | FU03 | médio |
| `despesa_remuneracao_profissionais_ensino_infantil` | Fundeb | `fundeb.professional_remuneration.early_childhood_amount` | FU04 | alto |
| `despesa_remuneracao_profissionais_creche` | Fundeb | `fundeb.professional_remuneration.daycare_amount` | FU05 | alto |
| `despesa_remuneracao_profissionais_pre_escola` | Fundeb | `fundeb.professional_remuneration.preschool_amount` | FU06 | alto |
| `despesa_total_fundeb` | Fundeb | `fundeb.total_expense` | FU07 | alto |
| `percentual_minimo_remuneracao_profissionais` | Fundeb | `fundeb.professional_remuneration_rate` | FU08 | alto |
| `disponibilidade_financeira_ano_anterior` | Fundeb | `fundeb.previous_year_availability` | FU09 | alto |
| `ingresso_recursos_ate_bimestre` | Fundeb | `fundeb.declared_inflows` | FU10 | alto |
| `pagamentos_efetuados_ate_bimestre` | Fundeb | `fundeb.payments` | FU11 | alto |
| `disponibilidade_financeira_ate_bimestre` | Fundeb | `fundeb.ending_availability` | FU12 | alto |
| `saldo_financeiro_conciliado` | Fundeb | `fundeb.reconciled_balance` | FU13 | alto |

### 11.4 VAAR

| Campo atual | Catálogo | ID canônico | Alias | Risco |
|---|---|---|---|---|
| `habilitado_condicionalidades` | VAAR | `vaar.eligibility.conditions` | VA01 | baixo |
| `recebe_aprendizagem` | VAAR | `vaar.learning.receipt_status` | VA02 | médio |
| `recebe_atendimento` | VAAR | `vaar.attendance.receipt_status` | VA03 | médio |
| `indicador_aprendizagem` | VAAR | `vaar.learning.index` | VA04 | médio |
| `delta_aprendizagem` | VAAR | `vaar.learning.delta` | VA05 | médio |
| `delta_aprendizagem_ajustado` | VAAR | `vaar.learning.adjusted_delta` | VA06 | alto |
| `iad` | VAAR | `vaar.learning.iad` | VA07 | médio |
| `iad_ajustado` | VAAR | `vaar.learning.adjusted_iad` | VA08 | alto |
| `proporcao_adequada_saeb_2019` | VAAR | `vaar.learning.saeb_adequacy.baseline` | VA09 | médio |
| `proporcao_adequada_saeb_2023` | VAAR | `vaar.learning.saeb_adequacy.current` | VA10 | médio |
| `taxa_aprovacao_penalizada_2019` | VAAR | `vaar.learning.penalized_approval.baseline` | VA11 | médio |
| `taxa_aprovacao_penalizada_2023` | VAAR | `vaar.learning.penalized_approval.current` | VA12 | médio |
| `equidade_2023` | VAAR | `vaar.learning.equity` | VA13 | médio |
| `indicador_atendimento_anterior` | VAAR | `vaar.attendance.index.baseline` | VA14 | médio |
| `indicador_atendimento_atual` | VAAR | `vaar.attendance.index.current` | VA15 | médio |
| `delta_atendimento` | VAAR | `vaar.attendance.delta` | VA16 | médio |
| `delta_atendimento_ajustado` | VAAR | `vaar.attendance.adjusted_delta` | VA17 | alto |
| `estudantes_areas_prioritarias_anterior` | VAAR | `vaar.attendance.priority_students.baseline` | VA18 | médio |
| `estudantes_areas_prioritarias_atual` | VAAR | `vaar.attendance.priority_students.current` | VA19 | médio |
| `proporcao_abandono_anterior` | VAAR | `vaar.attendance.dropout_rate.baseline` | VA20 | médio |
| `proporcao_abandono_atual` | VAAR | `vaar.attendance.dropout_rate.current` | VA21 | médio |
| `proporcao_sem_informacao_anterior` | VAAR | `vaar.attendance.missing_information_rate.baseline` | VA22 | médio |
| `proporcao_sem_informacao_atual` | VAAR | `vaar.attendance.missing_information_rate.current` | VA23 | médio |
| `indicador_atendimento_metodologia_anterior` | VAAR | `vaar.legacy.attendance.index` | VA24 | alto |
| `evolucao_atendimento_metodologia_anterior` | VAAR | `vaar.legacy.attendance.evolution` | VA25 | alto |
| `coeficiente_atendimento` | VAAR | `vaar.legacy.attendance.coefficient` | VA26 | alto |
| `indicador_aprendizagem_metodologia_anterior` | VAAR | `vaar.legacy.learning.index` | VA27 | alto |
| `evolucao_aprendizagem_metodologia_anterior` | VAAR | `vaar.legacy.learning.evolution` | VA28 | alto |
| `coeficiente_aprendizagem` | VAAR | `vaar.legacy.learning.coefficient` | VA29 | alto |
| `coeficiente_total` | VAAR | `vaar.legacy.total_coefficient` | VA30 | alto |
| `apresentou_evolucao_nos_dois_indicadores` | VAAR | `vaar.legacy.dual_evolution_status` | VA31 | alto |

### 11.5 PNATE

O inventário DGF1 registrava nomes de campos PNATE que não coincidem integralmente com o catálogo atual. A migração abaixo segue `src/data/pnateIndicators.js`, que é a implementação vigente. Esse desvio explica os riscos altos nos campos cujo estágio ou composição ainda não estão normalizados.

| Campo atual | Catálogo | ID canônico | Alias | Risco |
|---|---|---|---|---|
| `repasse_total` | PNATE | `pnate.reported_amount` | PN01 | alto |
| `repasse_autorizado_apos_desconto` | PNATE | `pnate.authorized_amount_after_discount` | PN02 | médio |
| `resultado_per_capita` | PNATE | `pnate.per_capita_parameter` | PN03 | alto |
| `total_alunos` | PNATE | `pnate.students.total` | PN04 | médio |
| `total_alunos_rede_municipal` | PNATE | `pnate.students.municipal_network` | PN05 | médio |
| `total_alunos_rede_estadual` | PNATE | `pnate.students.state_network` | PN06 | médio |
| `desconto` | PNATE | `pnate.discount_amount` | PN07 | médio |
| `saldo_desconsiderado` | PNATE | `pnate.disregarded_balance` | PN08 | alto |
| `valor_total_municipal` | PNATE | `pnate.municipal_network_amount` | PN09 | alto |
| `valor_total_estadual` | PNATE | `pnate.state_network_amount` | PN10 | alto |

## 12. Compatibilidade e estratégia de migração

Permanecem como compatibilidade:

- `src/data/financialIndicatorMetadata.js`: metadados consumidos pelos detalhes atuais;
- `src/data/siopeIndicators.js` e o catálogo JSON SIOPE: seleção, leitura e grupos da rota SIOPE;
- `src/data/fundebIndicators.js`: catálogo e formatadores da rota Fundeb;
- `src/data/pnateIndicators.js`: catálogo e formatadores da rota PNATE;
- `src/data/financialModules.js`: navegação e descrição dos módulos;
- `src/features/municipal-finance/municipalFinancePresentation.ts`: adaptação do contrato do Panorama para a interface;
- `src/components/VaarPanel.jsx`: campos, agrupamentos e regras de apresentação VAAR.

Estratégia futura, sem execução nesta etapa:

1. consumidores passam a resolver o ID pelo `FINANCIAL_INDICATOR_LEGACY_MAP`;
2. nomes, perguntas, importância, estágio, natureza e papéis passam a vir do registro canônico;
3. formatadores e campos de série permanecem nos catálogos de origem;
4. divergências de competência ou fonte são reconciliadas antes de substituir o metadado legado;
5. catálogos antigos só podem ser removidos após todos os consumidores usarem o registro e uma validação completa do lote.

O adaptador não transforma valores, não move séries e não muda contratos. Dois campos iguais podem apontar para o mesmo ID; campos sobrepostos, mas não equivalentes, conservam IDs diferentes.

## 13. Contrato mínimo para futuros indicadores

Nenhum novo indicador financeiro deve entrar na interface sem:

1. ID canônico estável, sem ano ou componente visual;
2. pergunta pública e explicação de importância para o gestor;
3. definição, unidade, fonte oficial e campos de origem;
4. fórmula sustentada ou a frase canônica `F0`;
5. período, competência e data de corte quando parcial;
6. estágio financeiro principal e natureza;
7. regra explícita para nulo, zero e arredondamento;
8. cobertura medida no último exercício fechado e estabilidade histórica;
9. aplicabilidade, inclusive nulos estruturais de não beneficiários;
10. comparabilidade anual e municipal;
11. regras de agregação, composição e cálculo por matrícula;
12. papéis permitidos e justificativa dos papéis proibidos;
13. domínio principal, domínios secundários e proprietário canônico;
14. necessidade de reconciliação e risco de dupla contagem;
15. limitações metodológicas e aliases de migração.

Um campo não pode ser integrado como valor monetário se o estágio não for demonstrável. Um total não pode entrar em composição enquanto os componentes não forem exclusivos e reconciliados.

## 14. Limiares recomendados de cobertura

Estes limiares são propostas para decisão de produto e **não foram aplicados no código**.

| Uso | Limiar recomendado | Estabilidade e exceções | Justificativa |
|---|---:|---|---|
| KPI ou resumo | pelo menos 95% dos municípios aplicáveis no último exercício fechado | pelo menos 90% em cada um dos três exercícios anteriores; sem ruptura metodológica não tratada | ausência em destaque central pode distorcer a leitura geral |
| catálogo | pelo menos 80% dos municípios aplicáveis no último exercício fechado | cobertura e lacunas visíveis; ano parcial identificado | catálogo comporta exploração com cautela maior que o resumo |
| detalhe municipal | valor oficial disponível para o município e competência clara | cobertura global pode ser menor; não beneficiários saem do denominador | um dado nominal válido pode ser útil localmente sem sustentar comparação ampla |
| comparação municipal | pelo menos 95% dos aplicáveis e estabilidade mínima de três anos | mesma definição, estágio, competência e denominador; valores nominais contextualizados | reduz viés de seleção e comparação entre bases incompatíveis |
| ranking | pelo menos 98% dos aplicáveis e estabilidade mínima de três anos | metodologia idêntica, ausência de nulo estrutural mal classificado e revisão substantiva | ranking amplifica diferenças pequenas e lacunas; nenhum ranking está autorizado agora |
| somente metodologia | sem mínimo numérico | fonte, regra, cobertura e limitação documentadas | parâmetros raros podem explicar cálculo sem virar KPI ou comparação |

Para indicadores aplicáveis apenas a beneficiários, o denominador é o conjunto elegível oficial, não os 497 municípios. Mudança metodológica reinicia a janela de estabilidade. Nulo estrutural deve ser separado de falha de cobertura.

## 15. Lacunas de fórmula e riscos remanescentes

Há **70 indicadores com `F0`**:

- 2 SIOPE: resultado financeiro e saldo Fundeb;
- 11 Fundeb: todos os IDs próprios, exceto disponibilidade final;
- 17 Panorama: valores prontos de QSE/Fundeb/DCA, previsões e condições analíticas;
- 31 VAAR: o pipeline não reproduz as fórmulas oficiais compostas;
- 9 PNATE: todos, exceto o valor autorizado após desconto descrito pelo metadado atual.

Riscos ainda não resolvidos:

- transferência Fundeb efetiva ainda não está reconciliada com receita e ingressos declarados;
- composição do total previsto do Fundeb com VAAF, VAAT e VAAR permanece bloqueada por possível inclusão no total;
- fases contábeis das despesas detalhadas do Fundeb não estão normalizadas;
- saldos Fundeb possuem conceitos e competências próximos, mas não equivalentes;
- estágio do valor anual e dos valores por rede do PNATE varia por leiaute;
- composição PNATE por rede requer prova de exclusividade e reconciliação;
- cobertura recente do SIOPE é incompleta em campos específicos;
- RAP DCA possui cobertura parcial;
- VAAR tem mudança metodológica e nulos estruturais por campo;
- histórico mensal QSE, histórico DCA, MSC e PNAE não foram integrados.

## 16. Validações direcionadas executadas

| Verificação | Resultado |
|---|---|
| TypeScript somente de `src/data/financialIndicatorRegistry.ts` | aprovado, sem erros |
| ESLint somente do registro e do teste novo | aprovado, sem erros ou avisos |
| teste de IDs únicos e estáveis | 90 IDs, sem duplicação e sem ano no identificador |
| teste de aliases | nenhum alias aponta para IDs diferentes |
| teste do contrato mínimo | todas as 90 entradas possuem nome, pergunta, importância, unidade, estágio, natureza, papéis e demais campos obrigatórios |
| teste do mapa legado | 96 pontos de apresentação/catálogo apontam para IDs existentes: Panorama 28, SIOPE 14, Fundeb 13, VAAR 31 e PNATE 10 |
| teste de isolamento de metadados | nenhum valor, série, município ou código IBGE no registro |
| conferência registro × fichas da seção 5 | 90 IDs documentados; nenhum ausente |
| whitespace dos arquivos DGF3 | sem erro |

Não foram executados build global, suíte global, E2E, regressão visual ou regeneração de municípios.

## 17. Síntese final exigida

1. **Total de indicadores canônicos:** 90.
2. **Quantidade por domínio:** Origem dos recursos 10; Aplicação dos recursos 17; Execução orçamentária 15; Programas e complementações 45; Fontes e metodologia 3; Panorama 0 como proprietário primário e consumidor dos papéis `summary`.
3. **Quantidade por estágio financeiro:** status analítico 8; autorização 2; saldo 6; parâmetro de cálculo 15; coeficiente 5; empenhado 2; recebimento declarado 2; estimativa 1; previsão 4; liquidado 1; não aplicável 20; pago 2; restos a pagar 2; indicador percentual 19; transferência 1; dotação/orçamento 0; receita realizada 0.
4. **Indicadores sobrepostos:** `mde.application_rate`; `mde.applied_amount`; `fundeb.professional_remuneration_rate`; `fundeb.declared_revenue`; `budget.education.paid`; `qse.distributed_amount`; os dez IDs PNATE repetidos entre resumo/catálogo; os três status VAAR repetidos entre resultado/histórico. Saldos e movimentos Fundeb permanecem separados por não serem equivalentes.
5. **Indicadores não comparáveis:** 55 têm comparação municipal proibida; incluem saldos, coeficientes, parâmetros e condições VAAR, previsões de complementações para beneficiários, ajustes e valores PNATE de estágio incerto. Os outros 35 são condicionais; nenhum é irrestrito.
6. **Indicadores que não podem participar de composição:** 80. Somente dez componentes têm papel condicional: dois percentuais Fundeb por etapa, quatro valores de remuneração por etapa/subetapa e quatro recortes PNATE por rede. Totais hierárquicos, fases DCA, saldos, percentuais não exclusivos, taxas, previsões e status ficam fora.
7. **Indicadores restritos à metodologia:** `qse.distribution_coefficient.closed_basis`, `qse.distribution_coefficient.current_estimate`, `vaar.learning.adjusted_delta`, `vaar.learning.adjusted_iad` e `vaar.attendance.adjusted_delta`.
8. **Lacunas de fórmula:** 70 entradas usam `F0`; a fórmula não é reproduzida no pipeline atual e não deve ser inventada.
9. **Riscos ainda não resolvidos:** reconciliação Fundeb declarado/transferido; composição das previsões; fases Fundeb; saldos sobrepostos; estágio e composição PNATE; cobertura parcial SIOPE/RAP; mudança metodológica e nulos VAAR.
10. **Ordem recomendada para novas integrações:** (1) QSE mensal; (2) histórico DCA; (3) transferência/contribuição Fundeb com reconciliação; (4) normalização de estágio PNATE; (5) MSC com taxonomia contábil versionada e prevenção de dupla contagem; (6) PNAE após validação de cobertura e atualidade. Nenhuma dessas integrações foi executada na DGF3.
