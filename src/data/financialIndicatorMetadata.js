const SIOPE_LEGAL_BASIS = 'Constituição Federal, art. 212 e art. 212-A; Lei de Diretrizes e Bases da Educação, arts. 68 a 72; documentação do SIOPE/FNDE.'
const SIOPE_SOURCE = 'Receitas, despesas e transferências educacionais declaradas pelo município ao SIOPE/FNDE.'
const SIOPE_METHOD = 'Série anual declarada no SIOPE; para cada ano, o painel considera o dado declarado no 6º bimestre.'
const FUNDEB_LEGAL_BASIS = 'Constituição Federal, art. 212-A; Lei nº 14.113/2020 e regulamentação do FUNDEB.'
const FUNDEB_SOURCE = 'Receitas e despesas do FUNDEB registradas no demonstrativo financeiro do município e publicadas pelo FNDE.'
const FUNDEB_METHOD = 'A série preserva o período histórico e a estrutura do FUNDEB informados pela fonte; indicadores de remuneração em creche e pré-escola são exibidos a partir de 2021.'
const PNATE_LEGAL_BASIS = 'Lei nº 10.880/2004 e resoluções do FNDE que disciplinam o Programa Nacional de Apoio ao Transporte do Escolar.'
const PNATE_SOURCE = 'Registros de repasse e atendimento do PNATE/FNDE, com informações declaradas ou consideradas para o município.'
const PNATE_METHOD = 'Os arquivos do PNATE podem alternar entre previsão/plano de atendimento e atendimento anual conforme o exercício.'
const VAAR_LEGAL_BASIS = 'Constituição Federal, art. 212-A; Lei nº 14.113/2020 e regulamentação anual do FNDE e do MEC.'
const VAAR_SOURCE = 'Registros do VAAR/FUNDEB, FNDE e bases educacionais relacionadas.'
const VAAR_METHOD = 'Exercícios e componentes podem seguir regras e metodologias diferentes; a interpretação deve respeitar o ano e a cobertura do registro.'

function indicatorMetadata(fields) {
  return Object.freeze({
    definition: fields.definition,
    measures: fields.measures,
    calculation: fields.calculation,
    financingSource: fields.financingSource,
    relevance: fields.relevance,
    referenceRule: fields.referenceRule,
    legalBasis: fields.legalBasis,
    methodNote: fields.methodNote,
  })
}

const SIOPE_COMMON = {
  financingSource: SIOPE_SOURCE,
  legalBasis: SIOPE_LEGAL_BASIS,
  methodNote: SIOPE_METHOD,
}

const FUNDEB_COMMON = {
  financingSource: FUNDEB_SOURCE,
  legalBasis: FUNDEB_LEGAL_BASIS,
  methodNote: FUNDEB_METHOD,
}

const PNATE_COMMON = {
  financingSource: PNATE_SOURCE,
  legalBasis: PNATE_LEGAL_BASIS,
  methodNote: PNATE_METHOD,
}

const VAAR_COMMON = {
  financingSource: VAAR_SOURCE,
  legalBasis: VAAR_LEGAL_BASIS,
  methodNote: VAAR_METHOD,
}

export const FINANCIAL_INDICATOR_METADATA = Object.freeze({
  siope: Object.freeze({
    aplicacao_mde_percentual: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Percentual da receita de impostos e transferências aplicado em manutenção e desenvolvimento do ensino.',
      measures: 'A parcela da base constitucional de financiamento que foi registrada como despesa de MDE.',
      calculation: 'Despesas classificadas como MDE ÷ receita de impostos e transferências vinculada × 100.',
      relevance: 'Permite acompanhar o cumprimento do mínimo constitucional municipal ao longo da série.',
      referenceRule: 'Mínimo constitucional de 25% para municípios, conforme o período de referência.',
    }),
    fundeb_remuneracao_profissionais_percentual: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Percentual dos recursos do FUNDEB aplicado na remuneração dos profissionais da educação básica.',
      measures: 'O peso da remuneração profissional dentro dos recursos do FUNDEB submetidos à regra.',
      calculation: 'Despesa elegível de remuneração ÷ recursos do FUNDEB considerados pela fonte × 100.',
      relevance: 'Ajuda a verificar a aplicação do mínimo legal e a composição da execução do fundo.',
      referenceRule: 'Mínimo de 70% desde 2021; até 2020, a referência histórica era 60%.',
    }),
    fundeb_nao_aplicado_percentual: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Parcela dos recursos do FUNDEB que não foi aplicada no próprio exercício.',
      measures: 'A proporção de recursos do fundo que permaneceu não aplicada no período.',
      calculation: 'Recursos do FUNDEB não aplicados no exercício ÷ recursos do FUNDEB sujeitos à regra × 100.',
      relevance: 'Acompanha a execução financeira e a necessidade de contextualizar saldos e prazos de utilização.',
      referenceRule: 'Observe o limite e o prazo legal aplicáveis ao exercício e à composição do fundo.',
    }),
    valor_aplicado_mde_reais: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Volume financeiro aplicado em manutenção e desenvolvimento do ensino.',
      measures: 'O valor nominal das despesas de MDE declaradas no período.',
      calculation: 'Soma dos valores de despesas classificadas como MDE no leiaute do SIOPE.',
      relevance: 'Dimensiona o esforço financeiro absoluto da educação municipal.',
      referenceRule: 'Compare com a base de receita, o porte da rede, o número de estudantes e o ano; o valor não é uma medida de qualidade.',
    }),
    fundeb_educacao_infantil_percentual: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Percentual do indicador financeiro do FUNDEB associado à educação infantil.',
      measures: 'A parcela dos recursos do FUNDEB identificada pela fonte para creche e pré-escola.',
      calculation: 'Percentual de despesas do FUNDEB atribuído à educação infantil ÷ base financeira do indicador, conforme o leiaute do SIOPE.',
      relevance: 'Ajuda a observar o esforço financeiro direcionado a uma etapa com custos e oferta próprios.',
      referenceRule: 'Não há um alvo isolado neste painel; leia junto da matrícula, da oferta e da organização da rede.',
    }),
    fundeb_ensino_fundamental_percentual: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Percentual do indicador financeiro do FUNDEB associado ao ensino fundamental.',
      measures: 'A parcela dos recursos do FUNDEB identificada pela fonte para o ensino fundamental.',
      calculation: 'Percentual de despesas do FUNDEB atribuído ao ensino fundamental ÷ base financeira do indicador, conforme o leiaute do SIOPE.',
      relevance: 'Ajuda a entender como o fundo se distribui entre as etapas da educação básica.',
      referenceRule: 'Não há um alvo isolado neste painel; considere a matrícula, a responsabilidade municipal e a oferta observada.',
    }),
    despesas_educacao_total_percentual: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Peso da educação no conjunto das despesas municipais.',
      measures: 'A participação relativa das despesas educacionais no total informado para o município.',
      calculation: 'Despesa municipal em educação ÷ despesa municipal total considerada pela fonte × 100.',
      relevance: 'Ajuda a observar a prioridade orçamentária relativa da educação.',
      referenceRule: 'Percentual maior não significa automaticamente melhor gasto; leia junto dos mínimos, da rede e das necessidades locais.',
    }),
    investimento_aluno_basica_reais: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Valor médio aplicado por estudante da educação básica.',
      measures: 'O gasto financeiro médio associado ao conjunto de estudantes da educação básica usado pela fonte.',
      calculation: 'Despesa educacional considerada ÷ estudantes da educação básica utilizados como denominador pelo SIOPE.',
      relevance: 'Acompanha o esforço financeiro por estudante e permite comparações apenas com recortes equivalentes.',
      referenceRule: 'Redes menores, rurais ou dispersas podem ter custos unitários diferentes; o indicador não mede qualidade sozinho.',
    }),
    investimento_aluno_infantil_reais: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Gasto médio por estudante da educação infantil.',
      measures: 'O valor financeiro médio associado aos estudantes de creche e pré-escola considerados pela fonte.',
      calculation: 'Despesa da educação infantil considerada ÷ estudantes da educação infantil utilizados como denominador pelo SIOPE.',
      relevance: 'Ajuda a observar o esforço financeiro nessa etapa.',
      referenceRule: 'Considere jornada, infraestrutura, profissionais, demanda por creche e pré-escola e composição da oferta.',
    }),
    investimento_aluno_fundamental_reais: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Gasto médio por estudante do ensino fundamental.',
      measures: 'O valor financeiro médio associado aos estudantes do ensino fundamental considerados pela fonte.',
      calculation: 'Despesa do ensino fundamental considerada ÷ estudantes do ensino fundamental utilizados como denominador pelo SIOPE.',
      relevance: 'Acompanha a sustentação financeira da principal etapa da rede municipal.',
      referenceRule: 'Leia junto da matrícula, do transporte, do tempo integral, da estrutura e das características territoriais.',
    }),
    despesa_professores_aluno_basica_reais: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Parcela da despesa com professores associada a cada estudante da educação básica.',
      measures: 'O peso médio da despesa com professores na estrutura de gasto por estudante.',
      calculation: 'Despesa com professores considerada pela fonte ÷ estudantes da educação básica utilizados como denominador.',
      relevance: 'Ajuda a entender o peso da remuneração docente na despesa por aluno.',
      referenceRule: 'Não indica isoladamente valorização adequada, eficiência ou resultado de aprendizagem.',
    }),
    receitas_impostos_total_percentual: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Participação das receitas de impostos no total das receitas municipais.',
      measures: 'A composição da base de financiamento municipal e o peso relativo de impostos e transferências.',
      calculation: 'Receitas de impostos consideradas ÷ receitas totais consideradas pela fonte × 100.',
      relevance: 'Ajuda a entender a dependência relativa de transferências e a composição da receita disponível.',
      referenceRule: 'A leitura depende da cobertura e da disponibilidade da declaração em cada ano.',
    }),
    resultado_financeiro_exercicio_reais: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Resultado financeiro informado no exercício.',
      measures: 'A diferença registrada entre ingressos e saídas financeiras consideradas pela fonte.',
      calculation: 'Resultado financeiro do exercício conforme receitas, despesas e regras contábeis declaradas ao SIOPE.',
      relevance: 'Ajuda a observar o equilíbrio financeiro informado no período.',
      referenceRule: 'Não deve ser usado sozinho para avaliar a política educacional; considere contexto fiscal, contábil e orçamentário.',
    }),
    saldo_financeiro_fundeb_reais: indicatorMetadata({
      ...SIOPE_COMMON,
      definition: 'Saldo financeiro associado aos recursos do FUNDEB no exercício.',
      measures: 'Recursos disponíveis ou remanescentes do FUNDEB no recorte informado pela fonte.',
      calculation: 'Saldo financeiro do FUNDEB conforme disponibilidade, ingressos, pagamentos e conciliação declarados.',
      relevance: 'Acompanha a disponibilidade financeira do fundo e apoia a leitura da execução.',
      referenceRule: 'A existência de saldo não é necessariamente irregular; considere repasses, despesas empenhadas, restos a pagar e prazos legais.',
    }),
  }),
  fundeb: Object.freeze({
    receitas: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Total de recursos do FUNDEB registrados para o município no ano.',
      measures: 'As receitas do fundo atribuídas ao município no exercício.',
      calculation: 'Soma das receitas do FUNDEB registradas no demonstrativo anual.',
      relevance: 'Mostra a escala de recursos redistribuídos que sustenta a oferta da educação básica.',
      referenceRule: 'Compare anos, estrutura do fundo e matrículas; o valor não é o orçamento total da educação municipal.',
    }),
    despesa_remuneracao_profissionais: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Valor aplicado na remuneração dos profissionais da educação básica com recursos do FUNDEB.',
      measures: 'A despesa de remuneração profissional financiada pelo fundo.',
      calculation: 'Soma dos pagamentos ou despesas de remuneração registrados no demonstrativo do FUNDEB.',
      relevance: 'Ajuda a entender a execução do fundo e sua relação com a valorização dos profissionais.',
      referenceRule: 'Leia junto do percentual mínimo de remuneração e do período histórico.',
    }),
    despesa_remuneracao_profissionais_ensino_fundamental: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Parte da remuneração dos profissionais vinculada ao ensino fundamental.',
      measures: 'O valor registrado para profissionais associados ao ensino fundamental.',
      calculation: 'Despesa de remuneração do ensino fundamental informada no demonstrativo do FUNDEB.',
      relevance: 'Ajuda a observar como a despesa de pessoal se distribui entre etapas.',
      referenceRule: 'Não compare etapas sem considerar matrículas, jornada e estrutura da oferta.',
    }),
    despesa_remuneracao_profissionais_ensino_infantil: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Parte da remuneração dos profissionais vinculada à educação infantil.',
      measures: 'O valor registrado para profissionais associados à educação infantil.',
      calculation: 'Despesa de remuneração da educação infantil informada no demonstrativo do FUNDEB.',
      relevance: 'Ajuda a observar a distribuição da despesa de pessoal em creche e pré-escola.',
      referenceRule: 'Considere as características da oferta e as séries históricas disponíveis.',
    }),
    despesa_remuneracao_profissionais_creche: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Valor aplicado na remuneração dos profissionais que atuam em creche.',
      measures: 'A despesa de remuneração associada à etapa de creche.',
      calculation: 'Valor informado para remuneração de profissionais de creche no demonstrativo do FUNDEB.',
      relevance: 'Ajuda a acompanhar o esforço financeiro em uma etapa com custos e jornada próprios.',
      referenceRule: 'A série deve ser lida a partir de 2021, conforme a nota metodológica do painel.',
    }),
    despesa_remuneracao_profissionais_pre_escola: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Valor aplicado na remuneração dos profissionais que atuam na pré-escola.',
      measures: 'A despesa de remuneração associada à etapa de pré-escola.',
      calculation: 'Valor informado para remuneração de profissionais de pré-escola no demonstrativo do FUNDEB.',
      relevance: 'Ajuda a acompanhar a distribuição do gasto com profissionais na educação infantil.',
      referenceRule: 'A série deve ser lida a partir de 2021, conforme a nota metodológica do painel.',
    }),
    despesa_total_fundeb: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Total de despesas realizadas com recursos do FUNDEB no ano.',
      measures: 'A execução financeira total do fundo no exercício.',
      calculation: 'Soma das despesas do FUNDEB registradas no demonstrativo anual.',
      relevance: 'Relaciona o volume de recursos recebidos às despesas efetivamente registradas.',
      referenceRule: 'Não confunda despesa do FUNDEB com toda a despesa municipal em educação.',
    }),
    percentual_minimo_remuneracao_profissionais: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Percentual dos recursos do FUNDEB aplicado na remuneração dos profissionais da educação básica.',
      measures: 'O cumprimento da regra de destinação mínima para remuneração.',
      calculation: 'Despesa elegível de remuneração ÷ recursos do FUNDEB considerados pela regra × 100.',
      relevance: 'Permite acompanhar a regra central de destinação do fundo.',
      referenceRule: 'Mínimo de 60% até 2020 e de 70% desde 2021, conforme a estrutura histórica exibida.',
    }),
    disponibilidade_financeira_ano_anterior: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Saldo financeiro de recursos do FUNDEB vindo do exercício anterior.',
      measures: 'A disponibilidade remanescente que ingressa no novo período.',
      calculation: 'Saldo do FUNDEB do exercício anterior informado no demonstrativo financeiro.',
      relevance: 'Ajuda a contextualizar os recursos disponíveis antes dos ingressos do ano.',
      referenceRule: 'Leia com o calendário de repasses, despesas empenhadas e restos a pagar.',
    }),
    ingresso_recursos_ate_bimestre: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Total de recursos do FUNDEB recebidos pelo município ao longo do ano.',
      measures: 'Os ingressos financeiros acumulados até o bimestre informado.',
      calculation: 'Soma dos ingressos do FUNDEB registrados até o período de referência.',
      relevance: 'Acompanha o fluxo de recursos que sustenta a execução do fundo.',
      referenceRule: 'Compare apenas períodos equivalentes e considere se o ano está completo.',
    }),
    pagamentos_efetuados_ate_bimestre: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Total de pagamentos realizados com recursos do FUNDEB ao longo do ano.',
      measures: 'A execução financeira acumulada até o bimestre informado.',
      calculation: 'Soma dos pagamentos do FUNDEB registrados até o período de referência.',
      relevance: 'Ajuda a acompanhar o ritmo de execução do fundo.',
      referenceRule: 'Pagamento, empenho e despesa liquidada são conceitos contábeis diferentes; use a definição da fonte.',
    }),
    disponibilidade_financeira_ate_bimestre: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Valor financeiro disponível ao final do período analisado, após ingressos e pagamentos registrados.',
      measures: 'A disponibilidade financeira acumulada do FUNDEB no recorte temporal.',
      calculation: 'Disponibilidade anterior + ingressos − pagamentos, conforme os registros do demonstrativo.',
      relevance: 'Ajuda a contextualizar saldos e a execução ao longo do exercício.',
      referenceRule: 'A disponibilidade não é o resultado fiscal geral do município.',
    }),
    saldo_financeiro_conciliado: indicatorMetadata({
      ...FUNDEB_COMMON,
      definition: 'Saldo financeiro conciliado informado no demonstrativo do FUNDEB.',
      measures: 'O saldo após a conciliação financeira apresentada pela fonte.',
      calculation: 'Saldo conciliado conforme o demonstrativo financeiro do FUNDEB.',
      relevance: 'Apoia a conferência entre registros financeiros e execução declarada.',
      referenceRule: 'Considere a data de referência e a documentação contábil que fundamenta o demonstrativo.',
    }),
  }),
  pnate: Object.freeze({
    repasse_total: indicatorMetadata({
      ...PNATE_COMMON,
      definition: 'Valor total previsto ou registrado para o PNATE no município no exercício.',
      measures: 'O montante de repasse associado ao atendimento informado.',
      calculation: 'Valor de repasse calculado ou registrado pelo FNDE para o exercício.',
      relevance: 'Mostra o apoio federal suplementar disponível para o transporte escolar rural.',
      referenceRule: 'Não representa necessariamente o custo total do transporte municipal.',
    }),
    repasse_autorizado_apos_desconto: indicatorMetadata({
      ...PNATE_COMMON,
      definition: 'Valor do repasse após descontos e regras de autorização informadas pelo FNDE.',
      measures: 'O valor efetivamente autorizado depois dos ajustes registrados.',
      calculation: 'Repasse total − descontos e ajustes aplicáveis ao exercício.',
      relevance: 'Ajuda a distinguir o valor de referência do valor autorizado para transferência.',
      referenceRule: 'Leia os avisos do exercício antes de comparar com o repasse total.',
    }),
    resultado_per_capita: indicatorMetadata({
      ...PNATE_COMMON,
      definition: 'Valor per capita usado no cálculo do atendimento do PNATE.',
      measures: 'O valor unitário utilizado para relacionar estudantes e repasse.',
      calculation: 'Repasse calculado ÷ estudantes considerados, conforme a regra do programa.',
      relevance: 'Explica parte da variação do repasse entre exercícios e municípios.',
      referenceRule: 'O valor per capita é definido para o programa e pode variar conforme o exercício.',
    }),
    total_alunos: indicatorMetadata({
      ...PNATE_COMMON,
      definition: 'Total de estudantes considerados no cálculo do PNATE.',
      measures: 'O conjunto de estudantes informado para o atendimento do transporte escolar rural.',
      calculation: 'Quantidade de estudantes considerada pelo FNDE a partir dos registros do programa e do Censo Escolar.',
      relevance: 'Ajuda a conhecer o alcance do apoio federal.',
      referenceRule: 'Estudantes considerados não equivalem necessariamente a estudantes únicos transportados durante todo o ano.',
    }),
    total_alunos_rede_municipal: indicatorMetadata({
      ...PNATE_COMMON,
      definition: 'Total de estudantes da rede municipal considerados no PNATE.',
      measures: 'A parcela municipal do atendimento informado.',
      calculation: 'Quantidade de estudantes da rede municipal presente no registro do programa.',
      relevance: 'Ajuda a entender a distribuição do atendimento entre redes.',
      referenceRule: 'Compare anos e redes apenas quando a cobertura do registro for equivalente.',
    }),
    total_alunos_rede_estadual: indicatorMetadata({
      ...PNATE_COMMON,
      definition: 'Total de estudantes da rede estadual considerados no PNATE.',
      measures: 'A parcela estadual do atendimento informado.',
      calculation: 'Quantidade de estudantes da rede estadual presente no registro do programa.',
      relevance: 'Ajuda a entender a composição do atendimento apoiado no território municipal.',
      referenceRule: 'A presença de estudantes da rede estadual não transforma o repasse em despesa municipal total.',
    }),
    desconto: indicatorMetadata({
      ...PNATE_COMMON,
      definition: 'Valor descontado do repasse no exercício.',
      measures: 'A redução registrada pela fonte sobre o valor de referência.',
      calculation: 'Desconto informado no registro de repasse do PNATE.',
      relevance: 'Ajuda a explicar a diferença entre o repasse total e o valor autorizado.',
      referenceRule: 'Consulte o aviso e a regra do exercício antes de interpretar o desconto.',
    }),
    saldo_desconsiderado: indicatorMetadata({
      ...PNATE_COMMON,
      definition: 'Saldo informado pela fonte que foi desconsiderado no cálculo do repasse.',
      measures: 'O valor remanescente que não entrou na composição final do cálculo.',
      calculation: 'Saldo desconsiderado registrado pelo FNDE para o exercício.',
      relevance: 'Ajuda a compreender ajustes e diferenças entre valores brutos e autorizados.',
      referenceRule: 'Não trate o saldo desconsiderado como novo repasse ou como custo evitado.',
    }),
    valor_total_municipal: indicatorMetadata({
      ...PNATE_COMMON,
      definition: 'Valor direcionado à rede municipal quando disponível no leiaute da fonte.',
      measures: 'A parcela financeira associada à rede municipal.',
      calculation: 'Valor destinado à rede municipal conforme o registro de distribuição do PNATE.',
      relevance: 'Ajuda a relacionar atendimento e valores entre as redes.',
      referenceRule: 'A disponibilidade dessa abertura depende do leiaute e da cobertura do exercício.',
    }),
    valor_total_estadual: indicatorMetadata({
      ...PNATE_COMMON,
      definition: 'Valor direcionado à rede estadual/SEDUC quando disponível no leiaute da fonte.',
      measures: 'A parcela financeira associada à rede estadual.',
      calculation: 'Valor destinado à rede estadual conforme o registro de distribuição do PNATE.',
      relevance: 'Ajuda a contextualizar a composição territorial do apoio ao transporte.',
      referenceRule: 'A disponibilidade dessa abertura depende do leiaute e da cobertura do exercício.',
    }),
  }),
  vaar: Object.freeze({
    habilitado_condicionalidades: indicatorMetadata({
      ...VAAR_COMMON,
      definition: 'Situação de habilitação da rede nas condicionalidades exigidas para concorrer ao VAAR.',
      measures: 'Se o município atende às condições administrativas e de gestão do componente.',
      calculation: 'Resultado booleano ou categórico informado no registro de condicionalidades do exercício.',
      relevance: 'A habilitação é a condição inicial para que a rede possa receber os componentes do VAAR.',
      referenceRule: 'As condicionalidades são definidas para cada ciclo e devem ser lidas no exercício correspondente.',
    }),
    recebe_aprendizagem: indicatorMetadata({
      ...VAAR_COMMON,
      definition: 'Indicação de recebimento do componente VAAR associado à aprendizagem com equidade.',
      measures: 'Se a rede recebeu o componente de aprendizagem no exercício.',
      calculation: 'Resultado de recebimento informado após a aplicação das regras de habilitação e evolução do componente.',
      relevance: 'Relaciona a complementação a resultados de aprendizagem e redução de desigualdades.',
      referenceRule: 'A regra e a metodologia devem ser observadas por exercício e componente.',
    }),
    recebe_atendimento: indicatorMetadata({
      ...VAAR_COMMON,
      definition: 'Indicação de recebimento do componente VAAR associado ao atendimento.',
      measures: 'Se a rede recebeu o componente de atendimento no exercício.',
      calculation: 'Resultado de recebimento informado após a aplicação das regras do componente.',
      relevance: 'Relaciona a complementação à permanência e ao atendimento dos estudantes.',
      referenceRule: 'A regra e a metodologia devem ser observadas por exercício e componente.',
    }),
    indicador_aprendizagem: indicatorMetadata({
      ...VAAR_COMMON,
      definition: 'Indicador de evolução da aprendizagem com equidade usado na composição do VAAR.',
      measures: 'A evolução de aprendizagem considerada pelo componente para a rede.',
      calculation: 'Índice composto conforme metodologia oficial do VAAR para o exercício.',
      relevance: 'Ajuda a entender a dimensão educacional associada à complementação.',
      referenceRule: 'Não é uma nota geral da rede; depende da metodologia, da cobertura e do período oficial.',
    }),
    indicador_atendimento: indicatorMetadata({
      ...VAAR_COMMON,
      definition: 'Indicador de evolução do atendimento usado na composição do VAAR.',
      measures: 'A evolução do atendimento e da permanência considerada pelo componente.',
      calculation: 'Índice composto conforme metodologia oficial do VAAR para o exercício.',
      relevance: 'Ajuda a entender a dimensão de atendimento associada à complementação.',
      referenceRule: 'Considere abandono, completude dos registros e a cobertura informada pela fonte.',
    }),
    coeficiente_total: indicatorMetadata({
      ...VAAR_COMMON,
      definition: 'Coeficiente total de distribuição da complementação VAAR no exercício.',
      measures: 'A participação calculada para a distribuição do componente entre as redes habilitadas.',
      calculation: 'Coeficiente de distribuição conforme os indicadores e ponderadores oficiais do exercício.',
      relevance: 'Ajuda a relacionar habilitação, resultados e recebimento financeiro.',
      referenceRule: 'Compare apenas exercícios com metodologia e unidade equivalentes.',
    }),
    proporcao_abandono: indicatorMetadata({
      ...VAAR_COMMON,
      definition: 'Proporção de abandono observada no componente de atendimento.',
      measures: 'A parcela de estudantes registrada como abandono no recorte do VAAR.',
      calculation: 'Abandonos ÷ estudantes considerados no denominador do componente × 100.',
      relevance: 'Ajuda a interpretar permanência e evolução do atendimento.',
      referenceRule: 'Menor abandono é mais favorável, mas a leitura depende da série e da completude dos registros.',
    }),
    proporcao_sem_informacao: indicatorMetadata({
      ...VAAR_COMMON,
      definition: 'Proporção de registros sem informação no componente de atendimento.',
      measures: 'A parcela do conjunto analisado sem informação disponível para a regra.',
      calculation: 'Registros sem informação ÷ registros considerados no componente × 100.',
      relevance: 'Ajuda a avaliar a consistência da base que sustenta o resultado.',
      referenceRule: 'Uma proporção maior pode reduzir a comparabilidade e deve ser lida como limitação de registro.',
    }),
  }),
})

export function getFinancialIndicatorMetadata(moduleKey, indicatorKey) {
  return FINANCIAL_INDICATOR_METADATA[moduleKey]?.[indicatorKey] ?? null
}
