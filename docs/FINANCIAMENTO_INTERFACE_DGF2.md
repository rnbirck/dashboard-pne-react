# DGF2 — Limpeza e consolidação da interface pública de Financiamento

## Escopo executado

A etapa DGF2 alterou somente a camada de apresentação das páginas Visão geral, Panorama financeiro, Financiamento e Execução, Fundeb, Complementação VAAR e PNATE. Contratos, produtores, fórmulas, fontes e arquivos municipais materializados não fazem parte destas alterações.

Componentes e camadas revisados:

- apresentação e página do Panorama financeiro;
- cabeçalhos das páginas financeiras, com proveniência retirada da leitura principal;
- primitivas compartilhadas de cartões, métricas, catálogo e metadados financeiros;
- painéis SIOPE, Fundeb, PNATE e VAAR;
- catálogos e metadados de nomenclatura de Fundeb e PNATE;
- utilitário central de publicabilidade financeira.

Arquivos de implementação alterados:

- `src/pages/FinancialPage.jsx`;
- `src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx`;
- `src/features/municipal-finance/municipalFinancePresentation.ts`;
- `src/components/FinancialIndicatorPrimitives.jsx`;
- `src/components/FinancialIndicatorMetadata.jsx`;
- `src/components/SiopeIndicatorsPanel.jsx`;
- `src/components/FundebPanel.jsx`;
- `src/components/PnatePanel.jsx`;
- `src/components/VaarPanel.jsx`;
- `src/utils/financialPresentation.ts`;
- `src/data/financialIndicatorMetadata.js`;
- `src/data/fundebIndicators.js`;
- `src/data/pnateIndicators.js`.

## Status públicos mantidos

Permanecem os estados analíticos associados a uma competência e com significado público:

- cumprimento ou descumprimento de mínimo legal;
- alta, queda ou estabilidade, somente com ao menos dois períodos comparáveis;
- beneficiário ou não beneficiário;
- habilitado ou não habilitado;
- em análise, selecionado ou termo assinado;
- recebeu ou não recebeu;
- transferência ou disponibilidade registrada quando sustentada pela fonte oficial.

## Status técnicos ocultados

Foram retirados da renderização pública badges, mensagens e detalhes sobre disponibilidade técnica, completude, cobertura, integração, consulta manual, fonte pendente ou ausente, revisão, bloqueio de publicação, versão ou contrato, reason codes, catálogo e demais estados de coleta, materialização ou QA.

A seção pública de cobertura e qualidade do Panorama foi removida integralmente. As informações continuam preservadas nos contratos e mecanismos internos.

## Regras de nulo e zero

O utilitário `src/utils/financialPresentation.ts` centraliza as decisões de apresentação:

- somente números finitos são valores financeiros publicáveis;
- `null`, `undefined`, campo ausente e valor bloqueado não geram cartão, métrica, linha ou gráfico;
- zero é número finito e permanece publicável;
- séries são publicáveis quando possuem ao menos um ponto numérico válido;
- tendências e gráficos exigem ao menos dois pontos válidos;
- taxas derivadas no Panorama exigem resultado, numerador e denominador válidos, além de denominador diferente de zero;
- fonte e competência são omitidas quando não existe conteúdo publicável associado;
- se uma seção complementar fica sem conteúdo, ela é omitida; estados vazios essenciais usam uma única mensagem neutra.

## Seções e duplicações removidas

- Panorama: removida a seção pública de cobertura técnica.
- Panorama: removidos badges e explicações operacionais de reconciliação da leitura principal.
- Fundeb: removido o bloco legado de gráfico e tabela que duplicava o catálogo e o detalhe novos.
- PNATE: removido o bloco legado de série e tabela que duplicava o catálogo e o detalhe novos.
- SIOPE, Fundeb e PNATE: gráficos vazios e pontos nulos deixaram de ser renderizados.
- VAAR: o histórico foi separado em blocos independentes para as metodologias 2023–2024 e 2025–2026, sem série contínua entre elas.

## Nomenclaturas ajustadas

- “Recursos recebidos do Fundeb” passou a “Receita do Fundeb declarada”.
- Ingressos do Fundeb foram descritos como declarados, sem equivalência automática com transferência confirmada.
- O valor anual do PNATE passou a “Valor informado pelo PNATE no exercício” quando o estágio financeiro não é comprovado.
- “Resultado per capita” do PNATE passou a “Parâmetro per capita”.
- O Panorama diferencia distribuição realizada da QSE em 2024 e estimativa oficial de 2026.
- A aplicação constitucional identifica separadamente percentual aplicado e despesa computada em MDE.

## Proveniência e metodologia

Informações públicas de classe C foram mantidas somente em detalhes apropriados:

- valores constitucionais por fonte, competência, base da despesa, média e tolerância de conciliação;
- omissão da leitura canônica quando há divergência acima da tolerância;
- natureza, estágio, composição e risco de dupla contagem do Fundeb;
- coeficientes da QSE em detalhe metodológico;
- limitações do estágio financeiro do PNATE;
- glossário, métricas detalhadas e mudança metodológica do VAAR.

## Limitações remanescentes

- A indicação discreta sobre 2025 no SIOPE permanece porque o exercício pode estar incompleto.
- O estágio do valor anual do PNATE continua dependente do metadado existente; quando não comprovado, a interface usa denominação neutra.
- Campos detalhados do VAAR continuam condicionados à presença de valor municipal e à metodologia do respectivo período.
- Não foram produzidas capturas nem executada inspeção visual em navegador; a verificação desta etapa foi dirigida ao código das rotas financeiras alteradas.

## Verificações dirigidas

- ESLint executado somente nos arquivos de implementação alterados: sem erros.
- Busca textual executada nos componentes e na apresentação financeira: nenhuma mensagem pública de classe B identificada.
- Revisão estática confirmou a ausência dos blocos legados de Fundeb e PNATE e da seção de cobertura do Panorama.
- Não foram executados build global, E2E completo, regressão visual ou suíte completa do projeto.
