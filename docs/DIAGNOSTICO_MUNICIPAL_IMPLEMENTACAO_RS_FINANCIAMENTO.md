# Diagnóstico municipal — referência RS e relações potenciais de financiamento

**Etapas:** P3-A e P5-A  
**Contrato:** `municipal-diagnostic-v2`  
**Metodologia:** `municipal-diagnostic-p3a-p5a-v1`  
**Status:** implementado e estabilizado em 19/07/2026.

## Escopo

Esta etapa acrescenta contexto estadual e mecanismos potencialmente relacionados
aos pontos de atenção. Ela não publica escore final, não altera a ordem de
`attentionItems`, não infere elegibilidade municipal e não cria valores
financeiros. P3 e P5 completos continuam dependentes de pares, governabilidade,
fontes nominais, custos, saldos e regras de acesso confirmadas.

## Estabilização da integração

A auditoria de Agudo identificou que o payload publicado já continha benchmarks
associados pelo `indicatorId` e um resumo estadual não nulo. Os quatro zeros eram
um estado de apresentação: quando `stateBenchmarkSummary` estava ausente ou
desatualizado, o adaptador React convertia os campos faltantes em zero e a seção
era renderizada mesmo sem comparação útil. Não foi encontrada colisão de alias
nem associação por nome legado.

A interface agora só renderiza a faixa estadual quando
`eligibleAnalyzedCount > 0`. Na ausência real, preserva o motivo estruturado no
contrato e mostra apenas a nota metodológica discreta. A regeneração também
passou a publicar os campos aditivos do último ano comum, mantendo o valor
municipal principal intacto.

## Referência estadual

Para indicadores de razão, o valor do RS continua sendo calculado no pipeline
estadual por:

```text
Referência RS = 100 × Σ numeradores municipais válidos / Σ denominadores municipais válidos
```

Não há média simples dos percentuais municipais. Pares ausentes não viram zero,
denominador zero não produz razão e o valor não é arredondado antes da
apresentação. `creche`, `pre_escola`, `basico_6_17` e `basico_15_17` preservam
valores brutos acima de 100% na referência e na distribuição quando fórmula,
ano, unidade, faixa, universo, metodologia e base territorial são compatíveis.

O registro estadual declara uma assinatura de compatibilidade. O diagnóstico só
usa o ponto quando há:

- o mesmo `indicatorId`;
- unidade percentual compatível;
- fórmula e universo marcados como equivalentes pelo registro curado;
- o mesmo ano municipal e estadual no ponto efetivamente comparado;
- quando o ponto mais recente não é comparável, o último ano comum não posterior
  ao valor municipal principal, desde que toda a assinatura seja idêntica;
- filtros de dependência administrativa do registro;
- a mesma versão metodológica e base territorial compatível;
- cobertura estadual mínima de 80%.

Fórmula, unidade, faixa, etapa, universo, base territorial e regra de agregação
precisam ser equivalentes. Anos diferentes nunca são comparados diretamente.
Falhas são mantidas como `methodology_pending`, `year_mismatch`, `unavailable`
ou `insufficient_coverage`. Nesses estados, valor e diferença permanecem nulos e
o objeto carrega uma razão estruturada.

## Diferença favorável e distribuição

O sinal sempre representa desempenho favorável:

```text
at_least: favorableDifference = municipalityValue - stateValue
at_most:  favorableDifference = stateValue - municipalityValue
```

Resultado positivo é mais favorável que o RS; negativo é menos favorável. Uma
diferença absoluta de até 0,1 p.p. é tratada como equivalente. Indicadores sem
direção declarada podem manter o valor agregado e a distribuição, mas não
recebem diferença favorável nem percentil de desempenho.

A distribuição usa somente valores municipais do mesmo indicador e ano que
respeitam o domínio do catálogo. Q1, mediana e Q3 usam interpolação linear pela
posição `(n - 1) × p`. O percentil usa posto médio para empates e é direcional:

- `at_least`: valores maiores recebem percentil maior;
- `at_most`: valores menores recebem percentil maior.

A distribuição exige ao menos 20 municípios e 80% de cobertura. Os payloads
municipais recebem apenas estatísticas compactas; a lista de valores dos demais
municípios não é serializada.

## Resumo estadual e destaques

`stateBenchmarkSummary` considera somente indicadores com resultado municipal
na síntese atual. Ele informa analisados, comparáveis, mais favoráveis, menos
favoráveis, equivalentes e indisponíveis. O pipeline seleciona, por magnitude
absoluta da diferença favorável e desempate na ordem do catálogo:

- até três maiores diferenças desfavoráveis;
- até dois destaques favoráveis.

O React respeita essas listas e não recalcula diferença, comparabilidade,
direção, totais ou destaques. O benchmark não participa de
`legacyRelativeGapScore`, `priorityScore` ou da ordenação de `attentionItems`.

## Interface

A página inclui, quando há benchmark útil:

1. a faixa compacta “Como o município se compara ao RS”, depois do filtro de
   indicadores analisados e antes dos pontos de atenção;
2. a linha secundária de Referência RS nos itens de atenção com benchmark válido;
3. “Caminhos de financiamento relacionados”, depois dos pontos de atenção e
   antes da situação por tema.

A meta do PNE, o valor atual e a distância continuam na hierarquia principal.
Percentis e quartis não aparecem na faixa principal. Estados sem comparação não
inventam zero nem traço numérico e não reservam uma faixa vazia.

## Relação indicador × financiamento

As únicas fontes de relação são:

- `src/data/diagnostic/financingPrograms.json`;
- `src/data/diagnostic/indicatorFinancingMatrix.json`.

O frontend resolve identificadores, títulos e evidências já registradas na
matriz. Não existe busca textual no nome do indicador. Somente os cinco pontos
de atenção visíveis alimentam até três frentes determinísticas: atendimento,
jornada e permanência; formação e valorização dos profissionais; infraestrutura
e condições de oferta. A ordem dos mecanismos é `direct`, `conditioned` e
`programmatic`; cada frente mostra no máximo três mecanismos específicos e um
programa não se repete entre frentes. `general_mde` fica agregado e relações
`no_proven_direct_link` não são apresentadas como financiamento.

Todos os mecanismos exibidos permanecem com
`municipalEligibilityStatus = not_verified`. A ressalva é apresentada uma única
vez no topo, não em cada programa. A presença de relação direta não significa
recurso disponível, seleção, valor, chamada aberta, repasse futuro ou impacto
garantido. Fundeb e Quota do Salário-Educação são representados somente pela
nota única de fontes gerais de MDE. SIOPE e SICONFI/FINBRA continuam sistemas de
informação e não são mostrados como fonte de recurso.

## Navegação financeira

Cada frente possui um único link e a seção possui o link global “Abrir panorama
financeiro do município”. Desde a P5-C1, ambos usam a rota própria da seção
existente de Financiamento, `#financeiros-panorama`, e preservam na query do hash
o slug municipal, `indicatorId`, `programId` e `tema` quando aplicável. O
panorama usa esses parâmetros apenas para contextualizar e restringir os
`educationLinks` existentes; não cria relação ausente. Nenhuma navegação
paralela, modal ou expansão dos 21 cards foi criada.

## Impacto de dados

Antes da regeneração, os 497 payloads canônicos somavam 352.730.537 bytes,
média de 709.719 bytes por município; Canoas era o maior, com 728.904 bytes.
Como a saída mantém também aliases por código, havia 994 arquivos físicos de
`index.json`, somando 705.461.074 bytes.

A estimativa prévia foi de aproximadamente 36.000 bytes adicionais por
município: 17.892.000 bytes lógicos e 35.784.000 bytes físicos com os aliases.

Na regeneração efetiva, os 497 payloads canônicos passaram a somar
375.205.627 bytes, com média de 754.941 bytes por município. O acréscimo
lógico foi de 22.475.090 bytes, ou 6,37%; com os 497 aliases idênticos por
código, o acréscimo físico foi de 44.950.180 bytes. Canoas continuou sendo o
maior payload, com 774.026 bytes. A estimativa prévia ficou 4.583.090 bytes
abaixo do resultado lógico observado.

O particionamento atualizou 999 JSONs e preservou 994 sem alteração. Os 497
pares slug/código foram comparados byte a byte e permaneceram idênticos. A
determinística do contrato é coberta pelo teste de igualdade para a mesma
entrada; `generatedAt` continua sendo metadado temporal da execução.

O artefato estadual publicado contém 50 registros: 34 `comparable` e 16
`methodology_pending`, contados a partir do próprio artefato. Em Nova Santa
Rita, por exemplo, creche ficou em 35,10% contra 42,69% no RS (-7,59 p.p.),
pós-graduação docente em 49,35% contra 56,82% (-7,47 p.p.) e temporários em
13,17% contra 35,82% (+22,65 p.p. favoráveis, pois a direção é `at_most`).
O AEE permaneceu `methodology_pending`, sem diferença numérica inventada.

Na estabilização subsequente, os campos aditivos do último ano comum elevaram os
497 payloads canônicos para 378.147.289 bytes, média de 760.860 bytes e máximo
de 780.091 bytes em Canoas. O acréscimo sobre a etapa anterior foi de 2.941.662
bytes (0,78%). Os 497 pares slug/código continuam idênticos byte a byte.

Em Agudo, `index.json` possui 764.707 bytes (746,8 KiB). Serializado de forma
compacta, `diagnostico_v2` ocupa 199.534 bytes; o adaptador legado `diagnostico`,
66.729 bytes; e os resultados de `pne_2026_2036.indicadores`, 53.172 bytes. Há,
portanto, duplicação semântica transitória entre fonte, contrato canônico e
adaptador legado. Em carregamento local frio, o corpo transferido do
`index.json` foi de 764.707 bytes, a resposta terminou em 3,15 ms e a página com
o diagnóstico ficou visível em 638 ms.

Como o payload já se aproxima de 750 KiB e inclui dados que não são necessários
na primeira dobra, uma etapa posterior deve separar o Diagnóstico para
carregamento sob demanda e retirar o adaptador legado somente após confirmar
consumidores externos. Essa refatoração não foi feita nesta estabilização.

## Auditoria dirigida

| Município | Analisados | Comparáveis | Favoráveis | Desfavoráveis | Próximos | Sem comparação |
|---|---:|---:|---:|---:|---:|---:|
| Agudo | 47 | 33 | 19 | 13 | 1 | 14 |
| Nova Santa Rita | 46 | 32 | 18 | 13 | 1 | 14 |
| Aceguá | 46 | 32 | 4 | 27 | 1 | 14 |
| Porto Alegre | 48 | 33 | 11 | 21 | 1 | 15 |
| André da Rocha | 41 | 31 | 13 | 17 | 1 | 10 |

A auditoria completa contém 245 linhas com indicador, valor/ano principal,
valor/ano efetivamente comparado, valor/ano do RS, status, motivo de exclusão e
presença no resumo. Ela está em
`artifacts/diagnostico-stabilization-2026-07-19/benchmark-audit.csv`.

## Arquivos da estabilização

- pipeline e tipos: `data_pipeline/src/municipal_diagnostic.py`,
  `data_pipeline/src/pne_state_reference.py` e
  `src/features/diagnostic/diagnosticTypes.ts`;
- apresentação: `src/features/diagnostic/diagnosticPresentation.js`,
  `src/components/DiagnosticPanel.jsx` e
  `src/styles/institutional-refresh.css`;
- testes e auditoria: testes Python do diagnóstico, verificadores estaduais,
  `scripts/checks/diagnostic-contract.test.mjs`,
  `scripts/checks/diagnostic-e2e-test.cjs` e
  `scripts/generate-diagnostic-benchmark-audit.mjs`, com o comando dirigido em
  `package.json`;
- documentação: este registro, o plano geral de implementação, o schema e o
  plano de migração visual;
- dados: referência estadual e os 994 aliases municipais em `public/data`,
  regenerados sem alterar catálogos, matriz ou fórmulas.

## Validação

- exportação e particionamento: 497 municípios, zero erros;
- diagnóstico: 21 testes Python aprovados;
- referência estadual: 10 testes Python aprovados;
- contrato React e catálogos financeiros: 10 testes aprovados;
- referência publicada: 50 registros, 34 comparáveis e 16 pendentes;
- detalhes estáticos: 40.122 arquivos, zero erros e 1.708 avisos já conhecidos
  sobre séries de dependência nulas ou mistas;
- lint, build, 7 testes de rotas e `git diff --check` aprovados;
- validação dirigida em 1366×768, 1280×720, 1024×768 e 390×844: sem
  overflow horizontal, console limpo, ordem visual preservada, foco visível e
  estados neutros confirmados;
- o E2E global manteve a falha preexistente de Educação na asserção
  “ressalva geral fica visível”, antes de alcançar o Diagnóstico;
- baselines visuais não foram atualizados.

As capturas estão em
`artifacts/diagnostico-stabilization-2026-07-19/`.

## Limites preservados

Permanecem fora desta etapa: municípios semelhantes, COREDE/CRE na interface,
governabilidade, desigualdades, trajetórias oficiais, escores de necessidade,
acionabilidade e confiança, ingestão nominal de SIOPE/SICONFI, elegibilidade
VAAR/VAAT, valores Fundeb/PDDE/PAR, chamadas abertas, custos, lacuna financeira e
recomendação causal.
# Impacto da P3-C

"Caminhos de financiamento relacionados" deixa de consumir `attentionItems` e
passa a consumir somente `decisionSummary.municipalActionItems` e
`decisionSummary.coordinationItems`. Itens de investigação não geram chamadas
financeiras. A ordem dos programas na matriz, os catálogos globais, a
elegibilidade não verificada e a ausência de valores, saldos e prioridade
financeira foram preservadas. A redação distingue ação municipal potencial de
adesão, colaboração ou articulação interfederativa.
