# DGP5-B3R — Interface do Diagnóstico municipal v2

Data: 2026-07-21.

## 1. Decisão

A decisão de produto simplificou o resumo e removeu o bloqueio registrado na
DGP5-B3/DGP5-B2.1. A rota foi migrada para
`pne2026PublicDiagnosticV2`, versão `pne2026-public-diagnostic-v2`, sem fallback
para o v1 e sem alteração no pipeline ou nos contratos.

A DGP5-B3R foi aprovada na validação dirigida. A próxima etapa pode realizar a
validação final do Diagnóstico municipal v2.

## 2. Estado inicial

O worktree já continha mais de 1.500 entradas modificadas ou não rastreadas,
incluindo os 994 contratos municipais/aliases, pipeline, frontend financeiro,
QSE e documentos das etapas anteriores. Todas as alterações preexistentes foram
preservadas. A DGP5-B3R é atribuída somente aos arquivos listados neste relatório.

## 3. Consumo exclusivo do v2

`DiagnosticPanel` acessa somente `data.pne2026PublicDiagnosticV2` e a seleção do
contrato exige a versão pública v2. Ausência, contrato técnico incompatível ou
versão pública incompatível produzem apenas “Não foi possível abrir o
diagnóstico agora. Tente novamente.”, sem consulta ao v1, coleções antigas,
mapas React, DF2 ou estruturas financeiras.

O v1 permanece materializado e intacto, mas deixou de ser consumidor da rota.

## 4. Resumo simplificado

O resumo usa diretamente, sem soma ou recálculo:

- `advanceCount` — Pontos para avançar;
- `maintainCount` — Resultados a manter;
- `unclassifiedCount` — Resultados para acompanhamento.

Contagens iguais a zero são omitidas. O resumo considera o contrato completo e
permanece invariável durante modos e filtros. Não são mostrados agregados de
comparação ou posição estadual.

## 5. Estrutura e modos de visualização

A ordem final é: cabeçalho, resumo, visualização, filtros, resultados e fontes.
O cabeçalho e as ações de cópia/impressão foram preservados.

O controle segmentado compartilhado oferece “Resultados essenciais” e “Todos
os resultados”, com `aria-pressed` e estado inicial nos essenciais. Trocas de
modo preservam o foco e devolvem filtros incompatíveis para Todos.

## 6. Resultados essenciais

O modo inicial percorre somente `tier: essential`, ordenado pelo
`priorityOrder` materializado. Ausências são omitidas sem card, substituição ou
promoção de complementar. A grade usa três, duas e uma coluna conforme a largura.
`tier` e `priorityOrder` não são expostos.

## 7. Todos os resultados e filtros

O modo completo percorre `goals` e `goals[].results` na ordem recebida, sem
agregação da meta ou duplicação. Metas vazias após filtro são omitidas. Essenciais
recebem somente a indicação editorial discreta “Resultado essencial”.

Os filtros oferecem situação e os oito temas recebidos. Sem classificação é
tratado como acompanhamento. A disponibilidade é calculada apenas sobre o
recorte visual ativo para impedir estados vazios artificiais, sem alterar a
ordem dos resultados ou o resumo público.

## 8. Resultados sem classificação e componentes

Proxies contextuais usam o badge “Resultado de contexto” e a ressalva pública
aprovada. Os demais resultados sem classificação usam “Resultado para
acompanhamento”. Componentes parciais preservam “Este é um dos resultados
acompanhados nesta meta.”. Nenhum `advance` ou `maintain` foi inferido.

Os seis resultados SAEB permanecem separados. A regra `maintain_only` de
`medio_tecnico_articulado_percentual` é somente consumida, sem reconstrução.

## 9. Comparações e evolução

O disclosure “Comparações e evolução” só é criado por leituras textuais públicas
materializadas. A auditoria dos 15.896 resultados encontrou zero leitura textual
válida nos objetos opcionais v2 atuais. Assim:

- os 8.473 objetos numéricos `stateComparison` não são reinterpretados;
- códigos de `statewidePosition` não são convertidos em texto;
- similares e trajetórias técnicos não geram leitura local;
- nenhum disclosure vazio é exibido.

Essa limitação opcional não bloqueia a migração. Quando o contrato fornecer uma
leitura pública válida, a apresentação já aceita o texto e os valores
materializados sem recalcular diferenças.

## 10. Valores especiais

O valor municipal prioriza `current.displayText` e preserva sinal, unidade, ano,
negativos e valores acima de 100%. A distância usa o número recebido e somente
formatação de apresentação. Ausência de `rendimento_magisterio` não produz card,
mensagem, espaço ou substituição.

A auditoria confirmou 127 valores negativos, 494 acima de 100%, 994 proxies sem
classificação e zero duplicação.

## 11. Cópia e impressão

A cópia usa exclusivamente o v2 completo, independentemente de modo, filtro e
disclosures. Ela apresenta município/ciclo, as três contagens, essenciais em
ordem editorial, demais resultados sem duplicação e fontes oficiais completas.
Não inclui códigos internos, nomes de propriedades, versão, financiamento ou
valores nulos.

A impressão respeita modo, filtros e ordem visíveis. Ações, visualização,
filtros, sidebar, drawer, backdrop e barra móvel são ocultados. Cabeçalho,
resumo, resultados, notas e fontes permanecem. A evidência A4 confirmou cards
sem corte e ausência de overflow horizontal.

## 12. Fontes

A seção usa exclusivamente `sources` do v2 e mostra apenas registros completos
com organização, título, período e link oficial. Três fontes completas são
exibidas. Dois registros herdados sem organização/período/link são omitidos, sem
inventar metadados ou URL. Links possuem nomes acessíveis distintos.

## 13. Acessibilidade e responsividade

Foram confirmados: um `h1`, hierarquia coerente, grupos nomeados, `aria-pressed`,
botões com tipo, região viva de cópia, loading/status, erro/alerta, retry por
teclado, foco visível e preservado, fontes com nomes distintos e zero overflow.

Viewports validados: 1366×768, 1024×768, 768×1024 e 390×844, além de impressão
A4 em 794×1123. Restinga Seca, Bento Gonçalves, Novo Xingu, Aceguá e a troca para
Agudo foram exercitados no navegador. A auditoria automática selecionou também
São Pedro da Serra (26 resultados), Ajuricaba (34), Aceguá (maior presença de
essenciais e sem classificação) e Alto Feliz (sem rendimento do magistério).

## 14. Arquivos criados

- `docs/DIAGNOSTICO_MUNICIPAL_INTERFACE_DGP5B3R.md`;
- `artifacts/diagnostico-dgp5b3r-2026-07-21/restinga-seca-print-a4.png`.

## 15. Arquivos alterados

- `src/components/DiagnosticPanel.jsx`;
- `src/features/diagnostic/diagnosticPresentation.js`;
- `src/features/diagnostic/diagnosticTypes.ts`;
- `src/styles/institutional-refresh.css`;
- `scripts/checks/diagnostic-contract.test.mjs`;
- `scripts/checks/diagnostic-e2e-test.cjs`.

## 16. Arquivos removidos

Nenhum.

## 17. Testes

- `npm run test:diagnostic` — 11/11 aprovados; a primeira execução revelou duas
  expectativas de teste incompatíveis com ausência sem promoção, corrigidas
  antes da execução aprovada;
- `npm run test:app-routing` — 8/8 aprovados;
- ESLint dirigido aos arquivos DGP5-B3R — aprovado, zero erro e zero aviso;
- `npx tsc --noEmit --pretty false` — seis erros preexistentes fora do
  Diagnóstico e nenhum erro DGP5-B3R;
- `npm run build` — aprovado, 166 módulos transformados;
- `npm run test:e2e:diagnostic` — aprovado nos quatro viewports e impressão A4;
- inspeção da evidência A4 — aprovada;
- `git diff --check` — aprovado.

Erros preexistentes do typecheck: um em `src/data/qseAnnual.ts`, dois em
`src/dev-ui/scenarios/cardScenarios.tsx`, dois em Educação e um em
`MunicipalFinancePanoramaPage.tsx`.

## 18. Caminhos protegidos

Não foram alterados `public/data/municipios/**`, aliases, builder/catálogo v2,
materializador, v1, página PNE, contratos financeiros, Panorama financeiro,
shell, rotas alheias, baselines ou documentos históricos DGP2–DGP5-B2.1.

## 19. Pendências

Não há correção bloqueadora da interface. Permanece como limitação opcional do
contrato a ausência de leituras textuais públicas em comparação estadual,
posição, similares e trajetória; esses blocos são corretamente omitidos.

## 20. Decisão final

**DGP5-B3R aprovada; a próxima etapa pode realizar a validação final do
Diagnóstico municipal v2.**
