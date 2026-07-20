# Panorama financeiro municipal — interface P5-C1/P5-C1.1

## Resultado

A rota pública `#financeiros-panorama` apresenta o contrato
`municipal-finance-v1` do município selecionado sem incorporá-lo ao
`index.json`. A página pertence à navegação existente de Financiamento, é
importada como chunk lazy e solicita `financeiro.json` somente quando essa rota
é aberta.

A interface publica apenas QSE, previsão anual do Fundeb e complementações,
execução DCA/SICONFI da função 12, cobertura, RREO pendente, reconciliação e
relações educacionais existentes no contrato. Não calcula score, ranking,
capacidade financeira, recurso disponível, lacuna financeira ou recomendação.

## Rota e navegação

Rota canônica:

```text
#financeiros-panorama?municipio=<slug-ou-codigo-ibge>&indicatorId=<ids>&programId=<ids>&tema=<tema>
```

- `municipio` aceita o slug ou o código IBGE publicado no índice municipal;
- `indicatorId`, `programId` e `tema` são preservados quando a origem é
  “Caminhos de financiamento relacionados”;
- o link “Voltar ao Diagnóstico municipal” devolve os mesmos parâmetros;
- a sidebar e o seletor compacto de módulos compartilham a navegação financeira
  existente; não foi criada navegação paralela;
- URLs antigas dos demais módulos financeiros permanecem inalteradas.

## Componentes

- `MunicipalFinancePanoramaPage`: coordena o loader, catálogo, estados e seções;
- `municipalFinancePresentation`: adapta rótulos e formatação, mantendo objetos
  financeiros e taxas recebidos do contrato;
- `FinancialCompactModuleSelector`: seletor compartilhado pelos módulos em
  notebook, tablet e celular;
- primitivas reutilizadas: `ContentState`, `StatusBadge`, shell, cards e tokens
  canônicos da plataforma.

## Estrutura da página

1. cabeçalho compacto com município, subtítulo, retorno e nota de não soma;
2. quatro cards: QSE distribuída, Fundeb previsto, despesa paga e VAAR 2026;
3. grade superior com duas pilhas independentes no desktop: Execução seguida de
   QSE à esquerda e Fundeb à direita;
4. execução 2024 com Empenhado → Liquidado → Pago e grade compacta de restos e
   taxas do contrato;
5. Fundeb total, VAAF, VAAT e VAAR em quatro linhas, com metadados completos em
   disclosure;
6. QSE em três grupos: distribuição de 2024, estimativa de 2026 e base do
   cálculo;
7. resumo e três destaques de cobertura, com as sete dimensões preservadas em
   disclosure, além de RREO e reconciliação;
8. relações documentadas com os pontos de atenção;
9. linha compacta de fontes e catálogo completo em disclosure.

Até 1024 px, a grade superior é linearizada na ordem Execução, Fundeb e QSE.
Cobertura, relações e fontes permanecem depois desse conjunto, em largura total.
Não foi usado masonry, tabela, rolagem interna ou nova largura de shell.

## Refinamento de densidade P5-C1.1

- os quatro cards superiores tiveram somente padding, espaçamento e altura
  mínima reduzidos; valores, textos e fontes permanecem iguais;
- QSE passa a ocupar o espaço imediatamente abaixo da Execução na mesma pilha,
  eliminando o vazio anteriormente imposto pela altura do Fundeb;
- Fundeb deixou quatro cards internos altos e passou a uma lista estrutural de
  quatro linhas; natureza, estágio, composição, dupla contagem e fonte seguem
  acessíveis em “Ver metadados do Fundeb”;
- a cobertura inicial informa quantidades completas, pendentes e indisponíveis,
  mostra execução, aplicação constitucional e reconciliação e mantém as sete
  dimensões em “Ver cobertura detalhada”;
- fontes exibem somente a linha institucional no fluxo principal; documentos,
  descrições, links, exercício e natureza ficam em “Consultar fontes e
  metodologia”;
- todos os disclosures são `details` nativos, fechados por padrão e operáveis
  por teclado.

## Estados

O loader mantém `idle`, `loading`, `ready`, `absent`,
`incompatible_version` e `error`. A interface publica:

- loading com hero estável, quatro skeletons de resumo e duas superfícies de
  conteúdo;
- ausência: “Panorama financeiro ainda não disponível para este município.”;
- versão incompatível: “Os dados financeiros precisam ser atualizados antes da
  apresentação.”;
- erro: “Não foi possível carregar os dados financeiros.” e nova tentativa.

Nenhum estado procura dados no contrato educacional.

## Textos e conceitos financeiros

- QSE 2024 é “valor distribuído pelo FNDE”, nunca saldo;
- Fundeb 2026 é “previsão oficial anual”, nunca recebimento;
- DCA é execução declarada, nunca receita ou fonte de recurso;
- status nominal VAAR não comprova transferência ou aplicação;
- habilitação para cálculo VAAT não confirma benefício;
- `summationAllowed = false` exibe “Já incluído no total ou composição não
  reconciliada.”;
- o nível geral e as dimensões de cobertura descrevem evidência, não desempenho.

## Formatação monetária

A leitura principal usa moeda abreviada em português, como `R$ 1,05 mi`,
`R$ 52,32 mi` e `R$ 1,12 bi`. O valor integral permanece no `title` e em texto
exclusivo para tecnologia assistiva. Ano, natureza e estágio continuam próximos
do dado. QSE distribuída de 2024 e estimada de 2026 nunca formam subtotal.

## Regras de não cálculo

O frontend não soma componentes do Fundeb, não soma QSE distribuída e estimada,
não combina anos ou estágios e não recalcula taxas da DCA. Barras de execução
consomem `liquidatedToCommittedRate` e `paidToCommittedRate`; as quatro leituras
percentuais consomem diretamente `derivedRates`.

Ausências permanecem nulas com a mensagem de `reasonMessages`. Uma taxa
dependente de componente ausente não é exibida. RREO e aplicação constitucional
permanecem “Mapeamento pendente”, sem zero ou inferência de descumprimento.

## Cobertura e limitações

As dimensões publicadas são transferências confirmadas cobertas, previsões
oficiais, status dos programas, execução orçamentária, aplicação constitucional,
indicadores por matrícula e reconciliação. `insufficient` usa aparência neutra.

Enquanto SIOPE permanecer pendente, a página informa que os valores da DCA não
foram reconciliados para o mesmo exercício, sem bloquear a DCA válida. Recebido
do Fundeb, PNAE, PNATE, PEATE, PDDE, PAR, PAC, Tempo Integral e RREO não mapeado
continuam fora desta interface.

## Relação com o diagnóstico educacional

A seção usa somente `educationLinks`, `financingPrograms.json` e
`indicatorCatalog.json`. O contexto recebido pode restringir os vínculos
apresentados, mas não cria relação substituta quando não houver correspondência.
O contrato financeiro mantém `changesDecisionSummary: false`,
`changesAttentionOrder: false` e todos os escores nulos.

## Impacto no bundle

O shell importa somente uma referência lazy da página. O loader, os catálogos de
relação, a apresentação e os componentes do panorama ficam fora do chunk inicial.
Os 497 contratos e seus aliases continuam arquivos estáticos sob demanda; nenhum
JSON municipal foi incorporado ao JavaScript.

Após o refinamento P5-C1.1, o chunk lazy do panorama possui `110,23 kB`
(`14,51 kB` gzip). O acréscimo corresponde à hierarquia de apresentação e aos
detalhes progressivos; o chunk inicial e os contratos continuam separados.

## Testes e validação

- `npm run test:municipal-finance`: 51 testes aprovados;
- `npm run test:diagnostic`: 15 testes aprovados;
- `npm run test:e2e:municipal-finance`: aprovado nos viewports 1366×768,
  1280×720, 1024×768, 768×1024 e 390×844;
- `npm run lint`, `npm run build` e `git diff --check`: aprovados;
- contratos e dados públicos antes e depois do refinamento: 997 arquivos, hash
  agregado SHA-256
  `b2107061ca3036786c237618a21fd57f8f4b201b277240a8053584e6f0d4627d`;
- capturas: `artifacts/municipal-finance-p5c1-1-2026-07-20/agudo-1366x768.png`
  e `artifacts/municipal-finance-p5c1-1-2026-07-20/agudo-390x844.png`;
- regressão visual global, baselines e typecheck não foram executados nesta
  rodada, conforme o escopo explícito da P5-C1.1.

Arquivos do refinamento: `MunicipalFinancePanoramaPage.tsx`,
`municipalFinancePresentation.ts`, `financial-pages.css`, testes financeiros e
E2E, este documento, `DIAGNOSTICO_MUNICIPAL_IMPLEMENTACAO.md` e
`PLANO_MIGRACAO_UI.md`.

## Itens ainda bloqueados para P5-C2

- transferências efetivamente recebidas do Fundeb com trilha nominal;
- SIOPE corrente reproduzível e reconciliação campo a campo;
- mapeamento validado do RREO/MDE;
- demais programas atualmente manuais, bloqueados ou com grão incompatível;
- qualquer leitura de disponibilidade, capacidade, custo, lacuna, priorização ou
  recomendação automática.
