# DGF1 — Auditoria funcional e plano de expansão da área de Financiamento

**Data da auditoria:** 21/07/2026  
**Escopo:** rotas públicas de Financiamento, contratos materializados, catálogos, produtores, fontes, fórmulas e documentação existente.  
**Natureza deste documento:** diagnóstico e plano; nenhuma mudança funcional ou visual foi feita.

## 1. Resumo executivo

A área atual é ampla e tecnicamente rica, mas mistura três camadas que precisam ser separadas antes da próxima expansão:

1. **leitura analítica municipal**, que é o que deve permanecer na interface pública;
2. **estado operacional do pipeline**, hoje exposto sobretudo no Panorama e que deve sair da interface;
3. **proveniência e reconciliação**, úteis, mas restritas a “Fontes e metodologia”.

Foram inventariados **102 itens distintos de dados ou status**: 95 indicadores/status de domínio e 7 dimensões de cobertura. A contagem não infla o total quando o mesmo campo aparece em resumo, catálogo e detalhe. Textos, notas, estados, fontes, glossário e controles também foram auditados, mas são descritos como estrutura de apresentação, não como novos indicadores.

| Módulo | Itens distintos | Composição |
|---|---:|---|
| Visão geral | 0 | conteúdo introdutório e navegação; não há métrica municipal |
| Panorama financeiro | 34 | 23 valores numéricos, 4 status de programas e 7 dimensões técnicas de cobertura |
| Financiamento e Execução | 14 | indicadores SIOPE |
| Fundeb | 13 | indicadores SIOPE/Fundeb |
| VAAR | 31 | valores, proporções, coeficientes e estados de habilitação/recebimento |
| PNATE | 10 | repasses, estudantes, valores per capita e ajustes |
| **Total** | **102** | **95 itens de domínio + 7 dimensões técnicas de cobertura** |

Principais conclusões:

- A cobertura municipal materializada é forte: há contrato para **497/497 municípios** nos módulos Panorama, Fundeb, VAAR e PNATE; isso não significa que todo campo tenha valor.
- SIOPE e Fundeb chegam a 497 municípios nos anos fechados, com queda para 487 em 2025. PNATE tem 497 registros em 2024–2026. VAAR possui cobertura muito desigual por indicador e metodologia.
- O Panorama exibe estados de ingestão, cobertura, mapeamento, revisão e bloqueio que não respondem a uma pergunta pública sobre financiamento.
- Há duplicação funcional em Fundeb e PNATE: o detalhe novo convive com um bloco legado de série/tabela sempre selecionado.
- Campos nulos ainda geram cartões e mensagens técnicas; o padrão futuro deve ser omitir o cartão ou a seção quando não houver dado analítico publicável.
- A expansão mais madura combina: QSE mensal/anual, composição da despesa pela MSC, histórico de execução DCA/Siconfi, PNAE com validação de cobertura e Fundeb redistributivo com reconciliação entre previsão, declaração municipal e transferência efetiva.

## 2. Método, universo e critérios

### 2.1 Arquivos e camadas inspecionados

- Rotas e composição: `src/pages/FinancialPage.jsx`, `src/data/financialModules.js`, `src/data/financialPageKeys.ts`, `src/app/appRoutes.ts` e `src/app/AppPageRouter.tsx`.
- Catálogos e metadados: `src/data/siopeIndicators.js`, `src/data/fundebIndicators.js`, `src/data/pnateIndicators.js`, `src/data/financialIndicatorMetadata.js` e `src/features/municipal-finance/municipalFinancePresentation.ts`.
- Componentes: painéis SIOPE, Fundeb, VAAR e PNATE, primitivos compartilhados, metadados e notas de fonte.
- Panorama e contratos: `src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx`, `src/data/municipalFinance.ts`, tipos do diagnóstico e `public/data/financeiro/`.
- Produtores: exportadores e consultas de Fundeb/PNATE em `data_pipeline/src/views/` e `data_pipeline/src/queries/`.
- Testes existentes inspecionados: `data_pipeline/tests/test_municipal_finance.py`, `data_pipeline/tests/test_municipal_finance_p5b2.py` e `data_pipeline/tests/test_municipal_finance_p5b2b1.py`, especialmente as garantias de N/Z, separação entre previsão e realizado, reconciliação, tolerância e não inclusão da receita Fundeb declarada entre transferências confirmadas.
- Documentação: auditorias, implementação e metodologia do diagnóstico financeiro municipal já existentes em `docs/`.

### 2.2 Cobertura real

A cobertura foi calculada sobre os **497 IDs municipais canônicos** presentes nos contratos materializados. “Válido” significa valor diferente de `null`/ausente; zero foi preservado como valor válido. A cobertura de uma série é apresentada por ano, e a cobertura “alguma vez” indica municípios com ao menos um valor no período.

### 2.3 Regra de contagem

- Cada campo de dado/status conta uma vez, mesmo repetido em resumo, cartão, gráfico e tabela.
- Os sete campos de cobertura do Panorama contam porque são exibidos como informação pública, embora a recomendação seja removê-los da interface analítica.
- Títulos, descrições, controles, notas e estados vazios foram inventariados por módulo, mas não entram na contagem de 102.
- Relações contextuais e grupos de fontes do Panorama são variáveis e foram auditados como templates, não como indicadores fixos.

## 3. Árvore funcional atual

```text
Financiamento
├── Visão geral (#financeiros)
│   ├── Como a educação municipal é financiada
│   ├── 3 mecanismos de financiamento
│   ├── 4 cartões de acesso a módulos
│   ├── 6 conceitos em acordeão
│   └── 6 links de fontes oficiais
├── Panorama financeiro (#financeiros-panorama)
│   ├── Resumo
│   ├── Aplicação constitucional
│   ├── Execução orçamentária
│   ├── Salário-educação/QSE
│   ├── Fundeb 2026
│   ├── Cobertura e qualidade
│   ├── Relações com contexto educacional
│   └── Fontes e metodologia
├── Financiamento e Execução (#financeiros-aplicacao-recursos)
│   └── 14 indicadores SIOPE em catálogo e detalhe
├── Fundeb (#financeiros-fundeb)
│   └── 13 indicadores em três grupos
├── VAAR (#financeiros-vaar)
│   └── 31 campos atuais e históricos
└── PNATE (#financeiros-pnate)
    └── 10 indicadores em três grupos
```

## 4. Inventário completo do que o usuário vê

### 4.1 Visão geral

**Título e descrição:** “Como a educação municipal é financiada”, com texto introdutório sobre origem, redistribuição e aplicação dos recursos.

**Seções e conteúdo:**

- Três cartões de mecanismo: recursos vinculados; redistribuição pelo Fundeb; programas e complementações.
- Quatro cartões de entrada: Financiamento e Execução, Fundeb, VAAR e PNATE. O Panorama existe na navegação, mas não possui cartão equivalente na grade.
- Seis conceitos em acordeão, com explicações de MDE, Fundeb, complementações, SIOPE, execução e programas.
- Seis links de fontes oficiais no rodapé da área.
- Navegação com seis itens: Visão geral, Panorama financeiro, Financiamento e Execução, Fundeb, VAAR e PNATE.

**Filtros, estados e condicionais:** não há seleção municipal própria, KPI, gráfico ou tabela nesta rota; o conteúdo é estático e introdutório.

### 4.2 Panorama financeiro

**Título e seleção:** contexto municipal, seletor de município e estados de seleção, carregamento, erro, contrato ausente e versão incompatível.

**Resumo:** quatro cartões: QSE distribuída em 2024, Fundeb previsto em 2026, despesa DCA paga em 2024 e status/previsão VAAR.

**Aplicação constitucional:**

- aplicação em MDE (%);
- despesa computada em MDE (R$);
- aplicação do Fundeb na remuneração de profissionais (%);
- receita do Fundeb declarada pelo município (R$);
- fontes SIOPE/RREO, resultado canônico, status de reconciliação, método, tolerância e observações.

**Execução orçamentária DCA 2024:** empenhado, liquidado, pago, restos a pagar não processados e processados; taxas liquidado/empenhado, pago/empenhado, pago/liquidado e restos a pagar/empenhado.

**Salário-educação/QSE:** distribuído 2024, estimado 2026, matrículas, coeficientes 2024/2026 e valor distribuído por matrícula.

**Fundeb 2026:** previsão total, VAAF, VAAT e VAAR; status de participação; proveniência, composição, inclusão no total e risco de dupla contagem.

**Cobertura e qualidade:** sete dimensões; badge de qualidade; resumo completo/pendente/indisponível; abertura detalhada.

**Relações contextuais:** templates relacionando valores financeiros com atributos educacionais disponíveis no contrato.

**Fontes e metodologia:** quatro grupos de fontes, campos de origem, status integrado/manual/indisponível, notas e disclosure técnico.

**Estados e mensagens condicionais:** “Não disponível”, motivo catalogado, “Valor não publicado”, “Valor bloqueado”, fonte em revisão, reconciliação parcial, fonte/mapeamento pendente, versão incompatível e contrato ausente.

### 4.3 Financiamento e Execução

**Cabeçalho:** título do módulo, descrição e nota “Base de dados e metodologia”, com fonte SIOPE/FNDE e método do sexto bimestre.

**Resumo:** quatro indicadores marcados para resumo no catálogo.

**Catálogo:** busca textual, abas/filtros por grupo e 14 cartões. Dos oito grupos configurados, seis possuem indicador atual e renderizam: cumprimento legal, distribuição das despesas, gasto por aluno, composição da receita, resultado/saldos e MDE em valores.

**Detalhe:** valor inicial e atual, variação, ano de referência, gráfico 2021–2025, leitura rápida, conceito, cálculo, fonte, regra/legal e método. Há nota quando faltam anos e texto de registro da série.

**Badges e estados:** com dados/sem dados, alta/queda/estável, cumpriu mínimo/abaixo do mínimo, dentro/acima do limite, série disponível e leitura recente indisponível.

**Ausências:** indicador sem série, ano indisponível, dado municipal indisponível e resultado de busca vazio.

### 4.4 Fundeb

**Introdução:** três cartões de leitura: receitas/recursos, despesas/remuneração e saldos.

**Resumo e catálogo:** quatro cartões de resumo; busca; filtro Todos + três grupos; 13 indicadores em receitas e movimentação, despesas e remuneração, e disponibilidades/saldos.

**Detalhe novo:** cartão, métricas, série e tabela 2017–2025, leitura rápida e metadados. Creche e pré-escola são exibidas na série apenas a partir de 2021.

**Detalhe legado redundante:** fora da visualização de detalhe, um indicador continua selecionado e reaparece abaixo do catálogo com gráfico/tabela próprios. Essa segunda leitura deve ser removida em etapa posterior.

**Badges, notas e vazios:** com/sem dados, alta/queda/estável, ano/série indisponível, sem resultado de busca, nota metodológica e fonte SIOPE/FNDE.

### 4.5 VAAR

**Introdução:** “O que é VAAR” e três pontos explicativos.

**Resultado executivo:** quatro cartões e narrativa sobre habilitação, recebimento por aprendizagem e atendimento.

**Componentes:** aprendizagem e atendimento, com seus indicadores, variações e coeficientes; até cinco/seis métricas por bloco conforme disponibilidade.

**Pontos de atenção:** até cinco insights condicionais.

**Histórico:** cartões 2023–2026; detalhes atuais e históricos de aprendizagem/atendimento; aviso de mudança metodológica.

**Acordeões e glossário:** detalhes técnicos atuais, metodologia anterior e nove termos de glossário.

**Fonte, badges e vazios:** Sim/Não, recebeu/não recebeu, sem dado disponível, indicador não disponível na fonte e nota de que ausência em anos anteriores não equivale a não recebimento.

### 4.6 PNATE

**Introdução:** três cartões de leitura; resumo com cinco cartões.

**Catálogo:** busca e dez indicadores em três grupos: repasses/valores, estudantes e ajustes.

**Detalhe novo:** valor, variação, série 2024–2026, tabela, leitura rápida e metadados.

**Detalhe legado redundante:** como em Fundeb, uma série/tabela selecionada permanece abaixo do catálogo fora do detalhe.

**Notas e estados:** aviso de que arquivos alternam previsão/plano e atendimento anual; alerta de repasse não autorizado; com/sem dados; alta/queda/estável; ano/série indisponível e busca vazia. Um segundo aviso existente no dado — nulo não é zero — não é renderizado pelo componente.

## 5. Registro dos indicadores numéricos e status de domínio

### 5.1 Convenções

- **Cobertura:** `ano: municípios válidos/497`; `%` arredondada a duas casas neste documento.
- **N/Z:** tratamento de nulo e zero.
- **Fórmula “fonte”:** o contrato recebe o valor pronto; não há fórmula reproduzível no produtor inspecionado. Isso é uma limitação, não licença para inferir a regra.
- **Utilidade:** `manter`, `reformular`, `baixo valor` ou `ocultar`.

### 5.2 Panorama financeiro — 23 valores numéricos

Cobertura comum: todos os contratos existem. QSE, DCA principal, taxas principais e aplicação constitucional têm 497/497 valores. Restos a pagar possuem cobertura parcial. VAAF 2026 é nulo em 497/497 contratos porque nenhum município gaúcho consta como beneficiário no material atual; VAAT tem 14/497 e VAAR 274/497 valores.

| ID | Seção / nome público | Definição, unidade e período | Fonte / campo | Fórmula completa | Exibição e N/Z | Cobertura | Utilidade |
|---|---|---|---|---|---|---|---|
| PA01 | Resumo/QSE distribuída | Distribuição anual, R$, 2024 | FNDE/QSE `amounts.qseDistributedClosedYear` | valor da fonte | cartão; nulo vira “Não disponível”; zero válido | 497 (100%) | manter |
| PA02 | Resumo/Fundeb previsto | Previsão total anual, R$, 2026 | FNDE/Fundeb `amounts.fundebTotalAnnualForecast` | valor da fonte | cartão; nulo não deve gerar cartão | 497 | reformular proveniência |
| PA03 | Resumo/Despesa paga | Despesa educação paga, R$, 2024 | Siconfi/DCA `execution.dcaEducation.paid` | valor da fonte | cartão; zero válido | 497 | manter |
| PA04 | Aplicação em MDE | Percentual constitucional, %, 2024 | SIOPE/RREO `constitutionalApplication.mdeAppliedRate.canonical` | média aritmética, arredondada a 2 casas, quando a diferença ≤0,005 p.p.; caso contrário bloqueia | 1 casa; nulo hoje gera cartão | 497 | manter |
| PA05 | Despesa em MDE | Valor computado, R$, 2024 | SIOPE/RREO `constitutionalApplication.mdeAppliedAmount.canonical` | média aritmética, arredondada a centavos, quando diferença ≤R$ 0,01; caso contrário bloqueia | moeda; nulo hoje gera cartão | 497 | manter |
| PA06 | Fundeb em remuneração | Aplicação na remuneração, %, 2024 | SIOPE/RREO `constitutionalApplication.fundebProfessionalRemunerationRate.canonical` | média aritmética, arredondada a 2 casas, dentro de 0,005 p.p. | 1 casa | 497 | manter |
| PA07 | Receita Fundeb declarada | Receita municipal declarada, R$, 2024 | SIOPE/RREO `constitutionalApplication.fundebRevenueReceivedDeclared` | valor declarado preservado fora do agregado de transferências confirmadas; não é média conciliada | moeda | 497 | manter com “declarada” |
| PA08 | Empenhado | Despesa empenhada em educação, R$, 2024 | Siconfi/DCA `execution.dcaEducation.committed` | valor da fonte | moeda; zero válido | 497 | manter |
| PA09 | Liquidado | Despesa liquidada, R$, 2024 | Siconfi/DCA `execution.dcaEducation.liquidated` | valor da fonte | moeda | 497 | manter |
| PA10 | Pago | Despesa paga, R$, 2024 | Siconfi/DCA `execution.dcaEducation.paid` | valor da fonte | moeda | 497 | manter |
| PA11 | RAP não processados | Saldo, R$, 2024 | Siconfi/DCA `execution.dcaEducation.outstandingNonProcessed` | valor da fonte | moeda; omitir se nulo | 357 (71,83%) | manter condicional |
| PA12 | RAP processados | Saldo, R$, 2024 | Siconfi/DCA `execution.dcaEducation.outstandingProcessed` | valor da fonte | moeda; omitir se nulo | 400 (80,48%) | manter condicional |
| PA13 | Liquidado/empenhado | Taxa de execução, %, 2024 | `execution.dcaEducation.derivedRates.liquidatedToCommittedRate` | `liquidado / empenhado × 100` | 1 casa; nulo se denominador zero | 497 | manter |
| PA14 | Pago/empenhado | Taxa, %, 2024 | `execution.dcaEducation.derivedRates.paidToCommittedRate` | `pago / empenhado × 100` | 1 casa; nulo se denominador zero | 497 | manter |
| PA15 | Pago/liquidado | Taxa, %, 2024 | `execution.dcaEducation.derivedRates.paidToLiquidatedRate` | `pago / liquidado × 100` | 1 casa; nulo se denominador zero | 497 | manter |
| PA16 | RAP/empenhado | Pressão de restos, %, 2024 | `execution.dcaEducation.derivedRates.outstandingToCommittedRate` | `(RAP não processado + RAP processado) / empenhado × 100` | 1 casa; nulo se componente/denominador ausente | 336 (67,61%) | manter condicional |
| PA17 | QSE estimada | Estimativa anual, R$, 2026 | FNDE/QSE `amounts.qseOfficialEstimateCurrentYear` | valor da fonte | moeda; distinguir estimativa | 497 | manter |
| PA18 | Matrículas QSE | Base de matrículas, estudantes, 2024 | FNDE/QSE `qse.enrollmentsClosedYear` | valor da fonte | inteiro | 497 | manter |
| PA19 | Coeficiente QSE 2024 | Participação da rede, coeficiente | FNDE/QSE `qse.distributionCoefficientClosedYear` | matrículas da rede / matrículas públicas da educação básica usadas pelo FNDE | até 8 casas | 497 | manter em metodologia |
| PA20 | Coeficiente QSE 2026 | Participação projetada, coeficiente | FNDE/QSE `qse.distributionCoefficientCurrentYear` | regra oficial do FNDE para o exercício | até 8 casas | 497 | manter em metodologia |
| PA21 | QSE por matrícula | Distribuição por estudante, R$/aluno, 2024 | `perStudent.qseDistributedPerEnrollment` | `QSE distribuída 2024 / matrículas QSE 2024` | moeda; nulo se matrículas zero | 497 | manter |
| PA22 | VAAF previsto | Complementação prevista, R$, 2026 | FNDE/Fundeb `amounts.fundebVaafAnnualForecast` | valor da fonte | só beneficiário; nulo não é zero | 0 (0%) | ocultar cartão |
| PA23 | VAAT previsto | Complementação prevista, R$, 2026 | FNDE/Fundeb `amounts.fundebVaatAnnualForecast` | valor da fonte | só beneficiário; nulo não é zero | 14 (2,82%) | manter condicional |
| PA24 | VAAR previsto | Complementação prevista, R$, 2026 | FNDE/Fundeb `amounts.fundebVaarAnnualForecast` | valor da fonte | só beneficiário; nulo não é zero | 274 (55,13%) | manter condicional |

> Nota de contagem: PA02 também é o total Fundeb exibido na seção Fundeb; PA01 e PA03 também reaparecem no resumo. Eles contam uma vez. O registro possui 24 linhas porque a lista detalha os quatro valores do resumo, mas PA02/PA01/PA03 são repetições; portanto há **23 campos numéricos distintos**.

**Quatro status de programas:** VAAF, VAAT, VAAR e cálculo/habilitação VAAT. Cada um está presente em 497/497 contratos. Beneficiário/não beneficiário é estado analítico; “habilitado” no cálculo não deve ser apresentado como recebimento efetivo.

**Sete dimensões técnicas de cobertura:** transferências confirmadas, previsões oficiais, status de programas, execução orçamentária, aplicação constitucional, métricas por estudante e reconciliação. Devem sair da interface analítica e permanecer em monitoramento interno.

### 5.3 Financiamento e Execução — 14 indicadores SIOPE

**Fonte geral:** SIOPE/FNDE, sexto bimestre. **Período:** 2021–2025. **Arredondamento público:** percentuais geralmente 1 casa; moedas compactas no cartão e até 2 casas no detalhe; variação em ponto percentual para percentuais e percentual relativo para moeda. **N/Z:** nulo é ausência; zero é valor válido. O cartão deve ser omitido se toda a série for nula.

| ID | Grupo / nome público | Definição e unidade | Campo / fórmula | Cobertura por ano | Exibição / utilidade |
|---|---|---|---|---|---|
| SI01 | Cumprimento legal / Aplicação em MDE | parcela da receita de impostos aplicada em MDE, % | `aplicacao_mde_percentual`; despesa MDE / receita de impostos e transferências vinculada ×100 | 497, 497, 497, 497, 487 | manter; leitura legal |
| SI02 | Cumprimento legal / Fundeb em profissionais | parcela Fundeb em remuneração, % | `fundeb_remuneracao_profissionais_percentual`; remuneração elegível / recursos Fundeb considerados ×100 | 497, 497, 497, 497, 487 | manter |
| SI03 | Cumprimento legal / Fundeb não aplicado | parcela não aplicada no exercício, % | `fundeb_nao_aplicado_percentual`; recursos não aplicados / recursos sujeitos à regra ×100 | 497, 497, 495, 489, 442 | manter com cobertura explícita |
| SI04 | MDE em valores / Despesa em MDE | valor computado, R$ | `valor_aplicado_mde_reais`; soma das despesas classificadas como MDE no leiaute SIOPE | 497, 497, 497, 497, 487 | manter; sobrepõe PA05 |
| SI05 | Distribuição / Fundeb educação infantil | parcela Fundeb associada à educação infantil, % | `fundeb_educacao_infantil_percentual`; percentual de despesas atribuído à etapa / base financeira do indicador, conforme leiaute | 497, 497, 497, 496, 485 | manter |
| SI06 | Distribuição / Fundeb ensino fundamental | parcela Fundeb associada ao fundamental, % | `fundeb_ensino_fundamental_percentual`; percentual de despesas atribuído à etapa / base financeira do indicador, conforme leiaute | 497, 497, 497, 497, 487 | manter |
| SI07 | Distribuição / Educação na despesa total | peso da educação na despesa municipal, % | `despesas_educacao_total_percentual`; despesa em educação / despesa total considerada ×100 | 496, 496, 497, 497, 487 | manter |
| SI08 | Gasto/aluno / Educação básica | despesa por matrícula, R$/aluno | `investimento_aluno_basica_reais`; despesa considerada / estudantes da educação básica usados pelo SIOPE | 497, 497, 497, 497, 487 | manter |
| SI09 | Gasto/aluno / Educação infantil | despesa por matrícula da etapa, R$/aluno | `investimento_aluno_infantil_reais`; despesa da etapa / estudantes da etapa usados pelo SIOPE | 497, 497, 497, 497, 487 | manter |
| SI10 | Gasto/aluno / Ensino fundamental | despesa por matrícula da etapa, R$/aluno | `investimento_aluno_fundamental_reais`; despesa da etapa / estudantes da etapa usados pelo SIOPE | 497, 497, 497, 497, 487 | manter |
| SI11 | Gasto/aluno / Professores | despesa por matrícula, R$/aluno | `despesa_professores_aluno_basica_reais`; despesa com professores / estudantes da educação básica | 497, 497, 497, 497, 487 | manter |
| SI12 | Composição da receita / Impostos | peso dos impostos nas receitas, % | `receitas_impostos_total_percentual`; receitas de impostos consideradas / receitas totais consideradas ×100 | 496, 496, 493, 433, 116 | baixo valor atual; cobertura recente fraca |
| SI13 | Resultado/saldos / Resultado financeiro | resultado financeiro declarado, R$ | `resultado_financeiro_exercicio_reais`; resultado conforme receitas, despesas e regras contábeis declaradas ao SIOPE | 497, 496, 496, 485, 431 | manter com cautela conceitual |
| SI14 | Resultado/saldos / Saldo Fundeb | saldo financeiro, R$ | `saldo_financeiro_fundeb_reais`; disponibilidade, ingressos, pagamentos e conciliação declarados | 497, 494, 497, 497, 480 | manter; evitar somar a fluxo |

Cobertura agregada de linhas municipais: 497/497 em 2021–2024 e 487/497 em 2025. Municípios sem linha 2025: Alegrete, Barra do Quaraí, Cacequi, Cerro Branco, Eldorado do Sul, General Câmara, Pinto Bandeira, Pirapó, Ponte Preta e Tunas.

### 5.4 Fundeb — 13 indicadores

**Fonte geral:** demonstrativo municipal SIOPE/FNDE. **Período público:** 2017–2025; creche e pré-escola são filtradas na interface a partir de 2021. **Arredondamento:** percentual em 0 casas no cartão e variação em 1 p.p.; moeda compacta em 1 casa no cartão e até 2 no detalhe. **N/Z:** nulo é ausência, zero é válido.

| ID | Grupo / nome público | Definição e unidade | Campo / fórmula | Cobertura | Utilidade |
|---|---|---|---|---|---|
| FU01 | Receitas / Recursos recebidos | receita Fundeb declarada, R$ | `receitas`; valor da fonte | 497 em 2017–24; 487 em 2025 | manter, renomear “receita declarada” |
| FU02 | Despesas / Remuneração profissionais | despesa, R$ | `despesa_remuneracao_profissionais`; valor da fonte | 497; 487 em 2025 | manter |
| FU03 | Despesas / Fundamental | despesa da etapa, R$ | `despesa_remuneracao_profissionais_ensino_fundamental`; valor da fonte | 497; 487 em 2025 | manter |
| FU04 | Despesas / Infantil | despesa da etapa, R$ | `despesa_remuneracao_profissionais_ensino_infantil`; valor da fonte | 497; 487 em 2025 | manter |
| FU05 | Despesas / Creche | despesa da subetapa, R$ | `despesa_remuneracao_profissionais_creche`; valor da fonte | 497 em 2018 e 2021–24; 487 em 2025; nulo em 2017/19/20 | manter só desde 2021 |
| FU06 | Despesas / Pré-escola | despesa da subetapa, R$ | `despesa_remuneracao_profissionais_pre_escola`; valor da fonte | igual FU05 | manter só desde 2021 |
| FU07 | Despesas / Despesa total Fundeb | despesa total, R$ | `despesa_total_fundeb`; valor da fonte | 497; 487 em 2025 | manter |
| FU08 | Despesas / Mínimo remuneração | aplicação em remuneração, % | `percentual_minimo_remuneracao_profissionais`; remuneração / recursos Fundeb ×100 | 497; 487 em 2025 | manter; sobrepõe SI02/PA06 |
| FU09 | Saldos / Disponibilidade anterior | saldo trazido, R$ | `disponibilidade_financeira_ano_anterior`; valor da fonte | 497; 487 em 2025 | manter |
| FU10 | Saldos / Ingressos até bimestre | ingressos acumulados, R$ | `ingresso_recursos_ate_bimestre`; valor da fonte | 497; 487 em 2025 | manter; fluxo |
| FU11 | Saldos / Pagamentos até bimestre | pagamentos acumulados, R$ | `pagamentos_efetuados_ate_bimestre`; valor da fonte | 497; 487 em 2025 | manter; fluxo |
| FU12 | Saldos / Disponibilidade até bimestre | disponibilidade bruta, R$ | `disponibilidade_financeira_ate_bimestre`; valor da fonte | 497; 487 em 2025 | manter |
| FU13 | Saldos / Saldo conciliado | saldo financeiro conciliado, R$ | `saldo_financeiro_conciliado`; valor da fonte | 497; 487 em 2025 | manter; não somar aos fluxos |

O produtor apenas exporta a tabela `siope_fundeb_municipio_dashboard`; as fórmulas públicas dos agregados não são reexecutadas no front-end. A origem é declaração/demonstrativo municipal, não comprovação bancária de transferência pelo concedente.

### 5.5 VAAR — 31 campos

**Período:** metodologia anterior em 2023–2024 e atual em 2025–2026. **Comparabilidade:** não tratar como uma única série homogênea. **Arredondamento:** proporções armazenadas entre 0 e 1 são exibidas em %, 1 casa; decimais e deltas, 3–4 casas; inteiros, 0; booleanos, Sim/Não. **N/Z:** `—` para nulo; zero é valor válido. **Fórmula:** exceto transformações de apresentação, os valores vêm prontos da fonte e as fórmulas oficiais completas não estão reproduzidas no contrato/produtor inspecionado.

| ID | Bloco / campo público | Unidade / fórmula disponível | Cobertura real | Exibição / utilidade |
|---|---|---|---|---|
| VA01 | Resultado / Habilitado nas condicionalidades | booleano; fonte | 497 em 2025/26 | manter como estado analítico |
| VA02 | Resultado / Recebe por aprendizagem | booleano; fonte | 121/2023; 138/24; 497/25–26 | manter; anos antigos não comparáveis |
| VA03 | Resultado / Recebe por atendimento | booleano; fonte | 162/2023; 181/24; 497/25–26 | manter |
| VA04 | Aprendizagem / Indicador | índice; fonte | 441/2025; 448/26 | manter condicional |
| VA05 | Aprendizagem / Delta | pontos do índice; fonte | 440/25; 447/26 | manter condicional |
| VA06 | Aprendizagem / Delta ajustado | pontos; fonte | 35/497, apenas 2026 | baixo valor público; metodologia |
| VA07 | Aprendizagem / IAD | índice; fonte | 447/25 e 447/26 | manter condicional |
| VA08 | Aprendizagem / IAD ajustado | índice; fonte | 21/25 e 21/26 | baixo valor público; metodologia |
| VA09 | Aprendizagem / Adequação Saeb 2019 | proporção ×100 | 454/25–26 | manter no detalhe |
| VA10 | Aprendizagem / Adequação Saeb 2023 | proporção ×100 | 473/25–26 | manter no detalhe |
| VA11 | Aprendizagem / Aprovação penalizada 2019 | proporção ×100 | 494/25–26 | metodologia/detalhe |
| VA12 | Aprendizagem / Aprovação penalizada 2023 | proporção ×100 | 496/25–26 | metodologia/detalhe |
| VA13 | Aprendizagem / Equidade 2023 | proporção ×100 | 469/25; 496/26 | manter no detalhe |
| VA14 | Atendimento / Indicador anterior | índice; fonte | 497/25–26 | manter |
| VA15 | Atendimento / Indicador atual | índice; fonte | 497/25–26 | manter |
| VA16 | Atendimento / Delta | pontos; fonte | 497/25–26 | manter |
| VA17 | Atendimento / Delta ajustado | pontos; fonte | 497 apenas 2026 | metodologia |
| VA18 | Atendimento / Estudantes prioritários anterior | estudantes | 497/25–26 | manter no detalhe |
| VA19 | Atendimento / Estudantes prioritários atual | estudantes | 497/25–26 | manter no detalhe |
| VA20 | Atendimento / Abandono anterior | proporção ×100 | 497/25–26 | manter no detalhe |
| VA21 | Atendimento / Abandono atual | proporção ×100 | 497/25–26 | manter no detalhe |
| VA22 | Atendimento / Sem informação anterior | proporção ×100 | 497/25–26 | metodologia/detalhe |
| VA23 | Atendimento / Sem informação atual | proporção ×100 | 497/25–26 | metodologia/detalhe |
| VA24 | Método anterior / Indicador atendimento | índice; fonte | 227/2023; 255/24; 298 alguma vez | histórico condicional |
| VA25 | Método anterior / Evolução atendimento | índice; fonte | 227/23; 255/24; 298 alguma vez | histórico condicional |
| VA26 | Método anterior / Coeficiente atendimento | coeficiente; fonte | 162/23; 181/24; 213 alguma vez | histórico condicional |
| VA27 | Método anterior / Indicador aprendizagem | índice; fonte | 227/23; 255/24; 298 alguma vez | histórico condicional |
| VA28 | Método anterior / Evolução aprendizagem | índice; fonte | 174/23; 215/24; 241 alguma vez | histórico condicional |
| VA29 | Método anterior / Coeficiente aprendizagem | coeficiente; fonte | 121/23; 138/24; 159 alguma vez | histórico condicional |
| VA30 | Método anterior / Coeficiente total | coeficiente; fonte | 227/23; 255/24; 298 alguma vez | histórico condicional |
| VA31 | Método anterior / Evoluiu nos dois indicadores | booleano; fonte | 174/23; 255/24; 281 alguma vez | histórico condicional |

As fórmulas completas de coeficientes, ajustes e indicadores VAAR **não estão codificadas nos produtores/contratos auditados**. A interface pode explicar o conceito, mas uma expansão metodológica deve incorporar referência oficial versionada, sem reconstrução por inferência.

### 5.6 PNATE — 10 indicadores

**Fonte geral:** FNDE/PNATE, campos exportados da tabela `fnde_pnate_municipio_dashboard`. **Período:** 2024–2026. **Arredondamento:** moeda até 2 casas, contagem inteira, variação 1%. **N/Z:** nulo é ausência e zero é válido. O produtor não recalcula o total ou o per capita.

| ID | Grupo / nome público | Definição e unidade | Campo / fórmula | Cobertura | Utilidade |
|---|---|---|---|---|---|
| PN01 | Repasses / Repasse total | valor previsto/registrado, R$ | `repasse_total`; valor da fonte | 497 em 2024–26 | reformular por estágio |
| PN02 | Repasses / Valor per capita | parâmetro por estudante, R$/aluno | `resultado_per_capita`; valor da fonte | 497 em 2024–26 | manter, não chamar de recebido/aluno |
| PN03 | Repasses / Parcela federal | componente federal, R$ | `valor_total_federal`; valor da fonte | 497 em 2024–26 | manter se estágio provado |
| PN04 | Repasses / Parcela municipal | componente municipal, R$ | `valor_total_municipal`; valor da fonte | zero em 497/2024; valor em 497/25–26 | manter; zero é dado |
| PN05 | Repasses / Parcela estadual | componente estadual, R$ | `valor_total_estadual`; valor da fonte | zero em 497/2024; valor em 497/25–26 | manter; zero é dado |
| PN06 | Estudantes / Total atendido | estudantes | `total_alunos`; valor da fonte | 497 em 2024–26 | manter |
| PN07 | Estudantes / Rede municipal | estudantes | `alunos_municipais`; valor da fonte | 497 em 2024–26 | manter |
| PN08 | Estudantes / Rede estadual | estudantes | `alunos_estaduais`; valor da fonte | 497 em 2024–26 | manter |
| PN09 | Ajustes / Valor retido | retenções/ajustes, R$ | `valor_retido`; valor da fonte | 497 em 2024–26 | manter no detalhe |
| PN10 | Ajustes / Valor complementar | complementação/ajuste, R$ | `valor_complementar`; valor da fonte | 497 em 2024–26 | manter no detalhe |

O principal risco é semântico: a descrição atual admite alternância entre previsão/plano e atendimento anual. Portanto, a série não pode ser apresentada como histórico homogêneo de “repasses recebidos” antes de provar o estágio de cada exercício.

### 5.7 Matriz de rastreabilidade e regras transversais

Esta matriz completa, para todos os IDs acima, as dimensões que são comuns ao módulo e evita repetir a mesma informação em cada linha de registro.

| Módulo / IDs | Arquivo, contrato e produtor | Série e condição de exibição atual | Texto/badge quando falta | Duplicação |
|---|---|---|---|---|
| Panorama / PA01–PA24 | UI `src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx`; contrato `MunicipalFinanceDocumentV1` em `src/features/diagnostic/municipalFinanceTypes.ts`; loader `src/data/municipalFinance.ts`; documentos em `public/data/financeiro/municipios/*.json`; produtor `data_pipeline/src/municipal_finance.py` | fotografias 2024 e previsões 2026, não série temporal; componentes renderizam estrutura mesmo quando `value` é nulo | “Não disponível”, motivo catalogado, “Valor não publicado” ou “Valor bloqueado”; badges de fonte/reconciliação | PA01, PA02 e PA03 reaparecem no resumo; aplicação MDE/Fundeb sobrepõe SIOPE/Fundeb |
| SIOPE / SI01–SI14 | catálogo `src/data/siopeIndicators.js`; metadados `src/data/financialIndicatorMetadata.js`; UI `src/components/SiopeIndicatorsPanel.jsx`; contrato largo e catálogo em `public/data/educacao/siope/` | série 2021–2025; quatro campos `usar_no_resumo`; cartão e detalhe dependem de município/indicador selecionado | “Sem dados”, “Leitura recente indisponível”, ano “Indisponível”, “Série disponível”, dado municipal/série ausente | mesmos indicadores em resumo, catálogo e detalhe; SI01/SI02/SI04 sobrepõem Panorama/Fundeb |
| Fundeb / FU01–FU13 | catálogo `src/data/fundebIndicators.js`; metadados `src/data/financialIndicatorMetadata.js`; UI `src/components/FundebPanel.jsx`; produtor `data_pipeline/src/views/fundeb_export.py` e consulta `data_pipeline/src/queries/fundeb.sql`; campo de origem em `siope_fundeb_municipio_dashboard` | série 2017–2025; creche/pré-escola filtradas desde 2021; quatro cartões de resumo | “Sem dados”, ano/histórico indisponível, busca vazia | resumo + detalhe novo + bloco legado; FU08/SI02/PA06 e FU01/PA07 sobrepostos |
| VAAR / VA01–VA31 | UI `src/components/VaarPanel.jsx`; tipos/metadados em `src/data/financialModules.js` e `src/data/financialIndicatorMetadata.js`; documentos municipais materializados | blocos condicionais por exercício; metodologia anterior 2023–24 e atual 2025–26; alguns campos só aparecem quando relacionados | `—`, “Sem dado disponível”, “Indicador não disponível na fonte”; nota de ausência histórica | campos atuais e antigos têm nomes próximos, mas não são duplicatas comparáveis |
| PNATE / PN01–PN10 | catálogo `src/data/pnateIndicators.js`; UI `src/components/PnatePanel.jsx`; produtor `data_pipeline/src/views/pnate_export.py`; consulta `data_pipeline/src/queries/pnate.sql`; origem `fnde_pnate_municipio_dashboard` | série 2024–2026; cinco campos no resumo; alerta condicional quando `repasse_autorizado=false` | “Sem dados”, ano/histórico indisponível, busca vazia; aviso N/Z existe no dado mas não renderiza | resumo + detalhe novo + bloco legado |

Os catálogos definem os nomes, unidades, descrições e seleção para resumo; `src/data/financialIndicatorMetadata.js` concentra conceito, cálculo, relevância, regra de referência, base legal e método para SIOPE/Fundeb/PNATE e parte do VAAR. Quando o produtor somente repassa um campo pronto, este documento registra “valor da fonte”; não foi criada fórmula inexistente.

## 6. Status técnicos hoje expostos

### 6.1 Classificação adotada

- **A — status analítico:** descreve a situação do município e responde à pergunta pública. Pode permanecer.
- **B — status de pipeline:** descreve ingestão, contrato, cobertura, mapeamento, versão, revisão ou indisponibilidade operacional. Deve sair da interface pública.
- **C — proveniência/reconciliação:** explica como o valor foi formado, conciliado ou estimado. Pode existir apenas em “Fontes e metodologia”, em linguagem pública.

### 6.2 Inventário e destino

| Classe | Textos/famílias encontrados | Onde aparecem | Destino recomendado |
|---|---|---|---|
| A | Cumpriu o mínimo; abaixo do mínimo; dentro do limite; acima do limite | SIOPE | manter junto ao valor e à regra legal |
| A | Alta/aumentou; queda/reduziu; estável | SIOPE, Fundeb e PNATE | manter somente com dois pontos comparáveis |
| A | Beneficiário; não beneficiário; habilitado; não habilitado | Panorama/Fundeb/VAAR | manter, distinguindo habilitação de transferência |
| A | Em análise; selecionado; termo assinado; transferência identificada; disponibilidade registrada; previsão disponível | Panorama | manter apenas se o estágio tiver fonte oficial e definição pública |
| A | Recebeu; não recebeu; Sim; Não | VAAR | manter com ano/metodologia |
| A | Repasse não autorizado | PNATE | manter como impedimento analítico, se o campo oficial sustentar a afirmação |
| B | Com dados; sem dados; série disponível; leitura recente indisponível; histórico não disponível; ano indisponível; dado municipal indisponível; sem série | cartões compartilhados, SIOPE, Fundeb e PNATE | não usar badge; omitir item sem valor e oferecer estado vazio apenas para a seção inteira |
| B | Cobertura alta/média/baixa; evidência insuficiente; completo/parcial/pendente/indisponível | Panorama | remover da página pública; manter em observabilidade interna |
| B | Integrado; consulta manual; fonte indisponível; fonte pendente; mapeamento pendente; fonte ausente | Panorama/Fontes | remover o estado operacional; conservar apenas nome da fonte e competência publicável |
| B | Contrato ausente; contrato incompatível; precisa ser atualizado antes da apresentação; versão incompatível | Panorama | substituir por estado público neutro de indisponibilidade, com registro técnico fora da UI |
| B | Catálogo indisponível; campo obrigatório DCA ausente; cobertura automatizada parcial | Panorama | retirar da UI e registrar em logs/QA |
| B | Fonte em revisão; publicação bloqueada; revisão detectada; valor bloqueado | Panorama | retirar da página; bloquear silenciosamente o cartão e sinalizar internamente |
| C | Reconciliado; divergente; reconciliação parcial; tolerância; média das fontes | Aplicação constitucional | manter somente na metodologia; na leitura principal mostrar o valor canônico ou nada |
| C | Declarado; estimado; previsto; cálculo local; valor de painel; incluído/não incluído no total; risco de dupla contagem | Panorama | manter rótulo de estágio junto ao valor; detalhe técnico apenas na metodologia |
| C | Metodologia atual/anterior; mudança metodológica | VAAR | manter aviso público curto; parâmetros e coeficientes no glossário/metodologia |

### 6.3 Motivos técnicos do catálogo materializado

Os seguintes códigos/mensagens podem chegar à interface pelo resolvedor de motivos. Eles não devem ser mostrados literalmente ao usuário:

| Código/família | Classe | Tratamento público |
|---|---|---|
| `source_record_not_found` | B | omitir o indicador; estado vazio da seção se nenhum indicador restar |
| `not_applicable_non_beneficiary` | A/C | “Município não beneficiário em [ano]”, sem cartão numérico vazio |
| `not_published` | C | “Valor ainda não publicado”, apenas se a informação temporal for útil; caso contrário omitir |
| `installments_not_integrated` | B | não expor; pendência interna |
| `budget_not_available_in_dca_function` | B | não expor |
| `economic_classification_not_mapped` | B | não expor |
| `missing_calculation_component` | B | não expor; impedir cálculo |
| `zero_denominator` | C | omitir taxa e documentar regra na metodologia |
| `constitutional_source_missing` | B/C | omitir valor; detalhe somente na metodologia/QA |
| `constitutional_divergent_unexplained` | C | bloquear valor e registrar divergência na metodologia, sem badge operacional |
| `constitutional_zero_denominator` | C | omitir taxa |
| `source_revision_detected` | B/C | bloquear publicação; observabilidade interna |
| `rreo_mapping_pending` | B | não expor |
| `reconciliation_pending_source` | B/C | não expor na leitura analítica |
| `scores_not_applicable_to_financial_contract` | B | não expor |
| `partial_automated_source_coverage` | B | não expor |
| `dca_required_field_missing` | B | não expor |

Os contratos, enums e reason codes internos **não devem ser removidos**. A mudança futura é apenas de apresentação e roteamento: A na leitura analítica; C na metodologia; B em logs, QA e monitoramento.

## 7. Cobertura por fonte e qualidade de evidência

| Fonte/conjunto | O que sustenta hoje | Cobertura real auditada | Limitação principal |
|---|---|---|---|
| SIOPE/FNDE — execução | 14 indicadores 2021–2025 | 497/497 em 2021–24; 487/497 em 2025; campos específicos têm lacunas maiores | exercício mais recente incompleto; `percentual_receitas_impostos_total` cai a 116/497 em 2025 |
| SIOPE/FNDE — Fundeb | 13 indicadores 2017–2025 | 497/497 nos anos fechados; 487/497 em 2025 | declaração municipal não prova transferência bancária; subetapas têm descontinuidade histórica |
| FNDE/PNATE materializado | 10 indicadores 2024–2026 | 497/497; município/estado são zero em 2024 e válidos em 2025–26 | mistura potencial entre plano/previsão e execução; estágio não normalizado |
| VAAR materializado | 31 campos | contrato 497/497, mas campos variam de 21 a 497; método anterior chega a 121–255 por ano | mudança metodológica e nulos estruturais por elegibilidade |
| Siconfi/DCA | execução 2024 | empenhado/liquidado/pago e três taxas: 497/497; RAP: 357/497 e 400/497; taxa RAP: 336/497 | apenas fotografia de 2024 no contrato; classificação econômica ainda não mapeada |
| FNDE/QSE | distribuição 2024 e estimativa 2026 | 497/497 nos campos atuais | granularidade mensal ainda não integrada ao contrato |
| FNDE/Fundeb 2026 | previsão total e complementações | total 497/497; VAAF 0; VAAT 14; VAAR 274 | previsão não é recebimento; transferência efetiva exige reconciliação |
| SIOPE/RREO constitucional | quatro valores canônicos | 497/497 | lógica de bloqueio por divergência precisa continuar fora da leitura principal |
| PNAE | nenhum campo atual | não mensurada para os 497 | página municipal encontrada chega a 2022; atualidade e endpoint reproduzível precisam validação |
| MSC/Siconfi | potencial para composição | entrega municipal existe; cobertura de contas/classificações não mensurada | exige mapeamento contábil versionado e prevenção de dupla contagem |

Fontes oficiais consultadas para o plano:

- [SIOPE — FNDE](https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope)
- [MAVS/SIOPE — FNDE](https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope/sobre-o-mavs)
- [API de dados abertos do Siconfi — Tesouro Nacional](https://apidatalake.tesouro.gov.br/docs/siconfi/)
- [Matriz de Saldos Contábeis — Siconfi](https://www.siconfi.tesouro.gov.br/siconfi/pages/public/conteudo/conteudo.jsf?id=12503)
- [Taxonomias da MSC — Siconfi](https://siconfi.tesouro.gov.br/siconfi/pages/public/conteudo/conteudo.jsf?id=46903)
- [Salário-educação — FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/salario-educacao)
- [Consultas da QSE — FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/salario-educacao/consultas)
- [Fundeb 2026 — FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026)
- [Consultas Fundeb — FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/consultas)
- [PNATE — FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnate)
- [PNAE — FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae)
- [Repasses PNAE por entidade executora — FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae/consultas/repasses-financeiros-por-entidade-executora)
- [PNAE e agricultura familiar — FNDE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae/consultas/pnae-dados-da-agricultura-familiar)

## 8. Regras obrigatórias para uma evolução posterior da interface

1. **Nulo nunca é zero.** Zero só pode aparecer quando for um valor publicado e semanticamente válido.
2. **Sem cartão vazio.** Se um indicador não tem valor publicável, o cartão não renderiza. Se uma seção inteira não tem informação analítica, usa-se um único estado vazio em linguagem pública.
3. **Sem status de construção.** Ingestão, mapeamento, cobertura, contrato, versão, revisão e bloqueio pertencem à observabilidade interna.
4. **Fonte e período acompanham valor.** Não exibir fonte, competência ou badge solto em um cartão sem valor.
5. **Estágios financeiros são explícitos.** Previsão, autorização, transferência, recebimento, declaração municipal, empenho, liquidação e pagamento não são intercambiáveis.
6. **Fluxo, estoque e parâmetro não se somam.** Saldo, repasse anual, despesa executada, coeficiente e valor per capita devem ter unidades e papéis distintos.
7. **Sem dupla contagem.** Complementações já incluídas no total Fundeb não podem ser somadas novamente; receita Fundeb e despesas financiadas pelo Fundeb não formam “composição de receita” aditiva.
8. **Detalhe técnico fica na metodologia.** Fórmula, tolerância de reconciliação, origem de cada campo e caveat de série ficam em disclosure próprio.
9. **Interpretação pública é objetiva.** Cada indicador deve responder “o que este valor diz sobre o município?”, sem diagnosticar causalidade não demonstrada.
10. **Comparação exige base homogênea.** Mudanças metodológicas, como VAAR 2023–24 versus 2025–26, quebram a série visual e recebem separação explícita.
11. **Cobertura condiciona o papel.** Indicador com baixa cobertura pode existir no detalhe, mas não deve ser KPI nem entrar em ranking/comparação sem limiar aprovado.
12. **Ausência estrutural é estado de domínio.** Para complemento não destinado ao município, mostrar “não beneficiário”, não “dado indisponível” e não R$ 0.

### Componentes a alterar em etapa futura, sem mudança nesta auditoria

| Arquivo/componente | Alteração futura necessária |
|---|---|
| `src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx` | omitir cartões nulos, retirar cobertura/pipeline da leitura pública, separar estágios e concentrar proveniência na metodologia |
| `src/features/municipal-finance/municipalFinancePresentation.ts` | mapear somente estados A para a leitura principal e textos C para metodologia |
| `src/components/FinancialIndicatorPrimitives.jsx` | impedir cartão “Sem dados” e centralizar regra de omissão por nulo |
| `src/components/FundebPanel.jsx` | remover bloco legado duplicado e revisar “recursos recebidos” para “receita declarada” |
| `src/components/PnatePanel.jsx` | remover bloco legado, renderizar todos os avisos relevantes e separar previsão/repasse |
| `src/components/VaarPanel.jsx` | omitir métricas nulas e separar visualmente metodologias antiga e atual |
| `src/components/FinancialIndicatorMetadata.jsx` | receber proveniência/fórmula pública sem códigos operacionais |
| `src/data/financialIndicatorMetadata.js` e catálogos | consolidar unidade, estágio, fórmula, regra N/Z e uso permitido por indicador |
| `src/data/municipalFinance.ts` | preservar reasons internos, mas impedir que códigos B vazem como copy pública |

## 9. Plano de expansão orientado por evidência oficial

### 9.1 Ficha dos candidatos

As duas tabelas abaixo formam uma única ficha por ID. “Cobertura real” nunca é presumida: quando não foi possível medi-la a partir do material versionado, consta como não medida.

| ID | Pergunta pública e importância | Fonte oficial e campos necessários | Fórmula e unidade | Período / atualização |
|---|---|---|---|---|
| C01 | **Quanto de QSE chegou ao município e quanto isso representa por matrícula?** Torna uma transferência vinculada concreta e comparável no tempo. | FNDE/QSE; distribuição por entidade e mês, matrícula usada no coeficiente, coeficiente e estimativa. Canônicos: `qse_distribuida_mes`, `qse_distribuida_ano`, `matriculas_qse`. | anual = soma das distribuições mensais; por matrícula = anual / matrículas; R$ e R$/aluno | mensal e anual; atualizar com cada planilha oficial |
| C02 | **Quanto foi executado em educação em cada ano e até que estágio?** Mostra a passagem de empenho a pagamento sem confundir etapas. | Tesouro/Siconfi DCA; empenhado, liquidado, pago, RAP processado e não processado, função/subfunção educação. | taxas PA13–PA16; R$ e % | série anual fechada; incorporar novo exercício após publicação/QA |
| C03 | **Em que natureza econômica a despesa educacional se concentra?** Distingue pessoal, custeio, investimento e outras naturezas. | MSC/Siconfi e taxonomias versionadas; conta contábil, natureza da despesa, função/subfunção, fase e valor. | categoria = soma de lançamentos válidos; participação = categoria / total da mesma fase ×100; R$ e % | mensal acumulado e anual fechado; taxonomia por exercício |
| C04 | **O município contribui mais ou recebe mais na redistribuição do Fundeb?** Explica o efeito redistributivo, não apenas o volume bruto. | RREO/SIOPE para contribuição/dedução e receita declarada; FNDE/Banco do Brasil para transferência efetiva. Canônicos propostos: `fundeb_contribuicao`, `fundeb_transferido`, `fundeb_declarado`. | líquido = transferido − contribuição; dependência = `max(líquido,0) / transferido ×100`; R$ e % | mensal/anual; reconciliação por competência e estágio |
| C05 | **Quanto o PNAE destinou ao município e quanto por estudante atendido?** Completa a leitura dos principais programas automáticos. | FNDE/PNAE; entidade executora, exercício, parcela, valor, matrículas por etapa/modalidade e parâmetros per capita. | estimativa oficial = estudantes × dias letivos financiados × valor per capita aplicável; realizado anual = soma das parcelas; R$/aluno = realizado / estudantes; R$, estudantes e R$/aluno | parcelas e anual; regra/per capita versionados por exercício |
| C06 | **De onde vêm os recursos municipais para educação?** Permite composição sem confundir transferência, receita própria e fundo redistributivo. | SIOPE/RREO, FNDE/QSE, Fundeb, PNAE, PNATE e outras transferências identificadas. | participação da fonte = componente não sobreposto / total reconciliado ×100; R$ e % | anual fechado | 
| C07 | **Quanto se gasta por etapa e finalidade educacional?** Relaciona financiamento a educação infantil, fundamental, transporte, alimentação e administração. | SIOPE e MSC/Siconfi; função, subfunção, etapa/modalidade e natureza, com tabela de mapeamento. | total da etapa/finalidade = soma de itens exclusivos; participação = total / despesa educacional comparável ×100; R$ e % | anual; eventual acumulado mensal na MSC |
| C08 | **Qual é o valor PNATE por estudante e qual estágio financeiro o total representa?** Corrige a semântica da série já existente. | FNDE/PNATE; `resultado_per_capita`, estudantes, plano/autorizado/transferido por exercício e parcela. | parâmetro per capita = fonte; efetivo por estudante = transferido / estudantes; R$/aluno | 2024–2026 atual e futuras parcelas |
| C09 | **Qual parcela das compras do PNAE veio da agricultura familiar?** Relevante para a política de alimentação e economia local. | FNDE/PNAE, planilhas de agricultura familiar; aquisição total e da agricultura familiar por entidade/exercício. | aquisição familiar / aquisição total ×100; R$ e % | anual; última publicação oficial encontrada chega a 2022 e é preliminar |
| C10 | **Quanto recurso chegou diretamente às escolas pelo PDDE?** Só faz sentido como recurso escolar complementar, não como receita municipal. | FNDE/PDDE; unidade executora/escola, programa/ação, parcela e valor efetivamente transferido. | soma por escola e município, sem agregar como receita da prefeitura; R$ e R$/matrícula escolar quando denominador compatível | parcela/anual, conforme publicação |
| C11 | **Quais programas discricionários complementaram o financiamento?** Dá contexto sem converter seleção pontual em fonte estrutural. | FNDE/Transferegov e painéis oficiais; instrumento, objeto, etapa, valor previsto, empenhado e transferido. | valores por estágio; sem total aditivo ao núcleo até reconciliação; R$ e contagem | por instrumento; atualização conforme fonte |

| ID | Cobertura real disponível | Riscos e sobreposição | Página e visual recomendado | Prioridade / situação |
|---|---|---|---|---|
| C01 | anual 2024, estimativa 2026 e denominadores: 497/497; série mensal ainda não medida | estimativa ≠ distribuição; mesma QSE já aparece no Panorama | Panorama/Origem dos recursos; linha mensal + KPI anual e R$/aluno | **alta; pronta no anual, integração mensal pendente** |
| C02 | 2024: valores principais 497/497; RAP 357–400/497; histórico não materializado | mudança de classificação; RAP parcial; não somar fases | Execução; linhas de empenhado/liquidado/pago e barras de taxas | **alta; reconciliação histórica** |
| C03 | entrega municipal disponível; cobertura de contas e categorias não medida | taxonomia por exercício, intraorçamentárias, estornos e dupla contagem | Aplicação; barras 100% + tabela de R$ | **alta; mapeamento/reconciliação** |
| C04 | declarado municipal 497/497; previsão total 497; VAAT 14; VAAR 274; transferência efetiva não medida | declaração ≠ banco; complemento pode já integrar total; competências diferentes | Origem/Fundeb; fluxo contribuição → redistribuição → complemento | **alta; reconciliação obrigatória** |
| C05 | nenhuma cobertura atual medida; consulta municipal oficial encontrada cobre 2010–2022 | atualidade, parâmetros por etapa, parcelas, entidade executora e denominação do estágio | Programas/PNAE; série anual + composição por etapa + R$/aluno | **alta, condicionada à validação de cobertura** |
| C06 | componentes isolados têm cobertura desigual; composição reconciliada: 0/497 | alto risco de somar Fundeb duas vezes e misturar receita declarada/transferida | Panorama; composição empilhada somente após fechamento de 100% | média; reconciliação obrigatória |
| C07 | percentuais SIOPE têm até 497/497; cobertura MSC por etapa/finalidade não medida | rateio e classificação não exclusivos; mudança de taxonomia | Aplicação; barras por etapa/finalidade e tabela | média; validar cobertura |
| C08 | 10 campos atuais: 497/497 em 2024–26 | estágio alterna entre plano/previsão e atendimento; total não prova pagamento | PNATE; série separada por estágio, KPI per capita | alta para correção semântica; expansão após reconciliação |
| C09 | publicação oficial localizada até 2022; cobertura 497 não medida | dado preliminar, defasado e sujeito a revisão; denominador precisa ser compatível | PNAE/detalhe; barra de participação e nota de competência | não usar no núcleo atual; reavaliar após fonte recente |
| C10 | não medida | recurso pode ir à unidade executora, não ao caixa municipal; cadastro de escolas e estorno | Programas complementares; lista/mapa de escolas, sem somar ao município | baixa; validar natureza e cobertura |
| C11 | não medida | seleção pontual, convênio, obra e transferência possuem estágios distintos | Programas complementares; tabela por instrumento/estágio | baixa; complementar, não KPI |

### 9.2 Cinco melhores candidatos de expansão

1. **QSE mensal/anual e por matrícula (C01).** Já possui base anual integral e fonte oficial de distribuição por entidade; entrega ganho analítico com baixo risco, desde que estimativa e realizado permaneçam separados.
2. **Histórico de execução DCA/Siconfi (C02).** Aproveita cobertura 497/497 já comprovada para os três estágios centrais e responde diretamente quanto do orçamento virou despesa paga.
3. **Composição da despesa pela MSC (C03).** É a melhor extensão para explicar “em que se gasta”, mas depende de mapeamento contábil versionado antes de qualquer gráfico.
4. **Redistribuição efetiva do Fundeb (C04).** Tem alto valor público e conecta contribuição, recebimento e complementações; só pode publicar líquido depois de conciliar declaração municipal com transferência oficial.
5. **PNAE anual e por estudante (C05).** É obrigatório para completar o conjunto de programas automáticos, mas permanece bloqueado até provar fonte atual, reproduzível e cobertura municipal real.

### 9.3 Separação por prontidão

**Prontos com a base atual:**

- QSE anual 2024, estimativa 2026 e QSE distribuída por matrícula, 497/497.
- Execução DCA 2024 para empenhado, liquidado, pago e três taxas, 497/497.
- Previsão total Fundeb 2026 e status VAAT/VAAR, desde que rotulados como previsão/status e exibidos só quando aplicáveis.
- PNATE per capita, estudantes e componentes, desde que o total deixe de ser chamado genericamente de recebido.

**Dependem de reconciliação ou mapeamento:**

- série histórica DCA;
- composição econômica da despesa pela MSC;
- contribuição, transferência efetiva e redistribuição líquida Fundeb;
- composição geral das fontes de financiamento;
- separação de estágio do PNATE;
- valores constitucionais quando SIOPE e RREO divergirem além da tolerância.

**Dependem de validação de cobertura:**

- PNAE atual, suas parcelas, estudantes e valor por aluno;
- despesa por etapa/finalidade via MSC;
- série mensal QSE;
- agricultura familiar no PNAE;
- PDDE por escola;
- programas discricionários e instrumentos.

**Descartar ou não incorporar ao núcleo neste momento:**

- cartão numérico VAAF 2026, pois a cobertura de valor é 0/497 e o estado “não beneficiário” já responde à questão;
- agricultura familiar como KPI atual, porque a publicação localizada termina em 2022 e é preliminar;
- PDDE como receita municipal; só pode aparecer como “recursos que chegam às escolas” após prova de natureza e cobertura;
- programas discricionários como fonte estrutural ou total aditivo;
- qualquer ranking ou comparação baseado em cobertura técnica, reasons internos ou campos VAAR de 21–35 municípios;
- soma de total Fundeb com VAAF/VAAT/VAAR sem flag explícita de inclusão.

## 10. Arquitetura futura recomendada

```text
Financiamento
├── Visão geral
│   └── conceitos e acesso aos módulos
├── Panorama municipal
│   ├── quanto há disponível/previsto
│   ├── quanto foi executado
│   └── três a cinco leituras objetivas, sem cobertura técnica
├── Origem dos recursos
│   ├── Fundeb: contribuição, redistribuição e complementações
│   ├── QSE
│   ├── PNAE
│   └── PNATE
├── Aplicação dos recursos
│   ├── mínimos constitucionais
│   ├── composição econômica
│   └── etapa/finalidade
├── Execução orçamentária
│   └── empenhado → liquidado → pago → restos a pagar, em série
├── Programas complementares
│   ├── PDDE por escola, se validado
│   └── instrumentos discricionários, sem soma ao núcleo
└── Fontes e metodologia
    ├── definição, fórmula, unidade e competência
    ├── proveniência e reconciliação
    └── limitações de cobertura e comparabilidade
```

A arquitetura não exige novas rotas imediatamente. Ela define responsabilidades: o Panorama resume; Origem explica entradas; Aplicação explica destino; Execução mostra estágios; Programas complementares ficam fora do total municipal; metodologia absorve o detalhe técnico.

## 11. Síntese final exigida

### 11.1 Quantidade total atual

- **102 itens distintos**: 95 indicadores/status de domínio e 7 dimensões de cobertura técnica.
- Por módulo: Visão geral 0; Panorama 34; Financiamento e Execução 14; Fundeb 13; VAAR 31; PNATE 10.
- A interface repete alguns campos em resumo e detalhe; a contagem acima deduplica essas apresentações.

### 11.2 Lista completa de status técnicos

- disponibilidade de dado/série/ano;
- cobertura alta, média, baixa ou insuficiente;
- contrato ausente, incompatível ou desatualizado;
- fonte integrada, manual, pendente, ausente, indisponível ou em revisão;
- mapeamento pendente;
- publicação/valor bloqueado;
- reconciliação completa, parcial, pendente ou divergente;
- componentes de cálculo ausentes ou denominador zero;
- catálogo ausente, cobertura automatizada parcial e campo obrigatório DCA ausente;
- os 17 reason codes discriminados na seção 6.3.

### 11.3 O que ocultar da interface pública

- sete dimensões de cobertura e seus badges;
- todos os status classe B;
- reason codes e mensagens operacionais literais;
- cartões nulos, incluindo VAAF 2026;
- coeficientes VAAR de baixa cobertura como destaque;
- blocos legados duplicados de Fundeb e PNATE;
- fonte/período desacompanhados de valor.

### 11.4 O que manter

- aplicação constitucional, execução DCA, QSE, Fundeb, VAAR e PNATE quando houver valor/estado analítico aplicável;
- fórmulas, unidade, fonte e competência em metodologia;
- estados legais e de benefício classe A;
- separação explícita entre previsão, declaração, transferência e execução;
- séries SIOPE/Fundeb com aviso de 2025 incompleto e VAAR com quebra metodológica.

### 11.5 Redundantes ou de baixa utilidade

- aplicação MDE, remuneração Fundeb e receita Fundeb aparecem no Panorama, SIOPE e/ou Fundeb; devem ter uma definição canônica e links entre contextos, não cartões conflitantes.
- Fundeb e PNATE mantêm detalhe novo e bloco legado simultaneamente.
- `receitas_impostos_total_percentual` tem baixa cobertura recente e pouca força como destaque.
- delta/IAD ajustado VAAR cobre 35/497 ou 21/497 e deve ficar fora do resumo.
- cobertura técnica e status de integração ocupam espaço sem explicar a situação financeira municipal.

### 11.6 Itens de alta prioridade

- QSE mensal/anual e por matrícula;
- histórico de execução DCA/Siconfi;
- composição da despesa via MSC;
- redistribuição efetiva do Fundeb;
- PNAE anual e por estudante após validação.

### 11.7 Itens descartados agora

- VAAF numérico sem valor;
- PNAE/agricultura familiar como dado atual;
- PDDE como receita municipal;
- programas discricionários no núcleo de financiamento;
- qualquer total que misture estágios ou duplique complementações.

### 11.8 Próximos passos concretos

1. Aplicar as regras de omissão e classificação A/B/C nos componentes listados, sem alterar contratos internos.
2. Remover as duplicações legadas de Fundeb e PNATE.
3. Versionar um dicionário canônico com definição, estágio, fórmula, unidade, N/Z e uso permitido por campo.
4. Materializar a série mensal QSE e o histórico DCA, medindo cobertura antes da UI.
5. Construir e auditar o mapeamento MSC para composição econômica.
6. Reconciliar contribuição, declaração e transferência Fundeb antes de calcular redistribuição líquida.
7. Obter fonte PNAE atual e reproduzível; só então medir 497 municípios e decidir publicação.

## 12. Riscos que permanecem

- O contrato materializado garante presença municipal, não completude de cada indicador.
- SIOPE/Fundeb 2025 está incompleto em dez municípios e alguns campos têm lacunas maiores.
- PNATE não normaliza o estágio financeiro entre exercícios.
- As fórmulas oficiais completas do VAAR não estão reproduzidas no repositório auditado.
- Transferência efetiva Fundeb ainda não tem endpoint municipal estável comprovado no pipeline atual.
- PNAE atual, MSC por classificação, PDDE e programas discricionários ainda não têm cobertura municipal mensurada.
- Sem reconciliação, uma composição de financiamento pode somar previsão, declaração e transferência ou contar complementações duas vezes.
