# Diagnóstico financeiro municipal — auditoria P5-A

## Resultado

A camada financeira é tecnicamente viável como contrato independente, mas ainda não está pronta para publicação integral na interface. Fundeb, quota municipal do salário-educação e execução por função no SICONFI têm fontes oficiais nominais com chave IBGE e podem sustentar a primeira automação. Recebimentos efetivos do Fundeb e os programas PNAE, PNATE, PEATE/RS, PDDE, PAR/Novo PAR, Novo PAC, Escola em Tempo Integral e Caminho da Escola ainda dependem de consultas manuais, fontes de grão diferente ou conectores a endurecer.

O protótipo não altera o diagnóstico educacional, os escores, a ordenação da atenção, a síntese P3-C ou o piloto P4-B. Nenhum arquivo em `public/data` foi criado ou regenerado.

## Escopo e unidade de análise

- Unidade: município, identificado prioritariamente pelo código IBGE de sete dígitos.
- Exercício principal: 2024, último ano fechado com QSE realizada e DCA anual comparável na data da auditoria.
- Período corrente: 2026 até 22 de junho, mantido como parcial e usado apenas para previsões e status nominais.
- Amostra: Agudo, Nova Santa Rita, Porto Alegre, André da Rocha, Amaral Ferrador e Santa Cruz do Sul.
- Fora do escopo: inferência de elegibilidade, estimativas locais de potencial, alteração de ranking, pontuação ou publicação de interface.

## Achados prioritários

| Severidade | Achado | Efeito | Tratamento P5-A |
| --- | --- | --- | --- |
| alta | Previsão, transferência, recebimento, execução e saldo aparecem em fontes diferentes. | Somá-los produz dupla contagem e falsa disponibilidade. | `financialStage` e `amountNature` são obrigatórios; totais de 2024 e previsões de 2026 ficam separados. |
| alta | SIOPE e SICONFI são sistemas declaratórios e não fontes de recurso. | Uma despesa declarada pode ser confundida com repasse. | Registros desses sistemas entram somente em `execution`, `reconciliation` ou contexto. |
| alta | Status favorável de programa nem sempre é público em formato nominal estável. | Um requisito educacional pode virar falsa elegibilidade. | Somente lista oficial nominal permite `confirmed_beneficiary`, `eligible`, `selected` ou equivalente. |
| média | PDDE usa escola ou executor como grão. | Agregação direta por nome municipal omite ou duplica unidades. | Agregação bloqueada até mapear escolas, UEx, EEx e EM ao município. |
| média | SICONFI DCA por função não oferece, sozinho, corrente versus capital. | Classificação econômica pode ser inventada. | Campos permanecem nulos até uma junção MSC validada. |
| média | URLs e esquemas do FNDE variam entre exercícios. | Coletor rígido pode ler coluna errada sem falhar. | P5-B deve versionar adaptadores e validar cabeçalho, ano, município e totais. |

## Evidência auditada

### Fundeb

A [página oficial do Fundeb 2026](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/2026) publica arquivos CSV, XLSX e PDF de receita total prevista, VAAF, VAAT, VAAR e listas nominais. Os arquivos têm código IBGE e permitem automação sem autenticação. A habilitação para cálculo do VAAT não foi tratada como benefício; a lista nominal VAAR foi usada para confirmar beneficiários e não beneficiários.

Os valores de 2026 permanecem como `official_estimate` em estágio `forecast`. A [consulta de transferências do Fundeb](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb/consultas) redireciona a fluxos externos para o realizado; esse recebimento não foi automatizado nem confundido com a previsão.

### Salário-educação

A [consulta oficial do salário-educação](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/salario-educacao/consultas) publica estimativas, distribuições mensais e consolidações anuais. O protótipo usa a [distribuição total de 2024](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/salario-educacao/defeso-eleitoral/2024/distribuiototalmatrculasecoeficienteqse2024.pdf), com município e código IBGE. O estágio adotado é `transferred`, pois o documento comprova distribuição pelo FNDE, não saldo bancário municipal.

### Execução educacional

A [API de dados abertos do SICONFI](https://apidatalake.tesouro.gov.br/docs/siconfi/) expõe DCA, RREO e MSC sem autenticação. A amostra usa a DCA Anexo I-E de 2024, função `12 - Educação`, com empenhado, liquidado, pago e restos a pagar. Os valores são `municipal_declared`: foram declarados pelo ente e publicados pelo Tesouro, mas não auditados como transferência.

Os [relatórios municipais do SIOPE](https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope/relatorios-municipais) são relevantes para receitas, despesas, MDE e Fundeb, porém a consulta corrente não ofereceu uma extração pública estável e reproduzível. Os [arquivos analíticos](https://www.gov.br/fnde/pt-br/assuntos/sistemas/siope/arquivos-dados-analiticos) são automatizáveis, mas a própria página informa atualização histórica até março de 2020. Por isso, a comparação SIOPE × SICONFI ficou marcada como `reconciliation_required`.

### Programas com cobertura manual ou instável

- [PNAE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae) e [PNATE](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnate): regras oficiais disponíveis; valor municipal corrente depende de consulta externa/painel.
- [PDDE Info](https://www.gov.br/fnde/pt-br/assuntos/sistemas/pddeinfo): consulta pública, mas grão escola/executor e sem API pública estável documentada.
- [PAR](https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/par/publicacao-dos-extratos-de-termos-de-compromisso), Novo PAR e Caminho da Escola: termos e seleções documentais; parte da tramitação ocorre no SIMEC.
- [Novo PAC Seleções](https://www.gov.br/casacivil/pt-br/novopac/selecoes2025/resultados-das-selecoes/resultados-das-selecoes-2025) e [Escola em Tempo Integral](https://www.gov.br/mec/pt-br/escola-em-tempo-integral): evidência nominal precisa ser coletada por ciclo; não foi validado feed municipal estável.
- [PEATE/RS](https://www.educacao.rs.gov.br/programa-estadual-de-apoio-ao-transporte-escolar-peate): regra e dez parcelas anuais são públicas; valores correntes por município não apareceram como série aberta estruturada.
- [Programas de formação da CAPES](https://www.gov.br/capes/pt-br/acesso-a-informacao/acoes-e-programas/educacao-basica): o grão costuma ser pessoa, curso ou instituição; não são tratados como receita municipal.

## Reconciliação e divergências

1. A DCA por função e o SIOPE não são substitutos. Diferenças podem decorrer de classificação, estágio, órgão, período de transmissão ou retificação.
2. O valor `empenhado` não representa caixa; `liquidado` não representa pagamento; `paid` não representa saldo disponível.
3. Um arquivo de previsão anual não pode ser somado a uma transferência efetiva do mesmo programa.
4. O status nominal VAAR pode confirmar benefício, mas o valor previsto não confirma recebimento.
5. Ausência de linha não é zero. O caso de restos não processados de André da Rocha permanece nulo com motivo `not_published`.

## Completude da amostra

A taxa do protótipo mede presença das evidências prioritárias auditadas, não qualidade fiscal do município. Ela cobre QSE realizada, Fundeb previsto, status VAAR, três estágios de execução, restos a pagar e possibilidade de reconciliação. A cobertura ficou entre 0,42 e 0,67. André da Rocha é o caso explicitamente insuficiente por não haver reconciliação SIOPE nem cobertura nominal corrente dos principais repasses discricionários.

## Prontidão para P5-B

- Pronto para automação: arquivos estruturados do Fundeb, distribuição/estimativa QSE e DCA do SICONFI.
- Pronto após mapeamento: RREO e MSC do SICONFI.
- Manual no primeiro incremento: SIOPE corrente, realizado do Fundeb, PNAE, PNATE, PEATE/RS, PDDE, PAR/Novo PAR, Novo PAC, Escola em Tempo Integral e Caminho da Escola.
- Bloqueador de produção: falta de uma trilha nominal reproduzível para recebimentos efetivos e de reconciliação SIOPE × SICONFI.

O inventário completo e classificável por máquina está em [diagnostico_financeiro_disponibilidade.csv](data/diagnostico_financeiro_disponibilidade.csv).

## Atualização P5-B1

A industrialização foi concluída para as fontes prontas: Fundeb total/VAAT/VAAR, QSE e DCA. Fundeb total, status VAAR, QSE e estágios centrais da DCA cobrem 497/497 municípios; VAAR previsto contém 274 linhas nominais e os 223 não beneficiários permanecem nulos. Não houve duplicidade ou chave municipal incompatível após excluir corretamente as linhas estaduais de grão distinto.

O RREO não foi integrado. A especificação oficial não expõe o Anexo 08 no endpoint e a consulta do demonstrativo simplificado de Agudo tampouco contém esse anexo. O status passou a `mapping_pending`. SIOPE permanece `pending_source`; a DCA é publicada como declaração municipal não reconciliada.

A cobertura detalhada está em [diagnostico_financeiro_cobertura_497.csv](data/diagnostico_financeiro_cobertura_497.csv) e a reconciliação da amostra em [diagnostico_financeiro_reconciliacao_amostra.csv](data/diagnostico_financeiro_reconciliacao_amostra.csv).
