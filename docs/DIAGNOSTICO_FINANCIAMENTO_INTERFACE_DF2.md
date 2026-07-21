# Diagnóstico municipal — integração pública de programas (DF2)

## 1. Objetivo da integração

A DF2 integra à página de Diagnóstico municipal a camada pública homologada na
DF1. A página usa o diagnóstico já carregado para apresentar somente programas
que podem apoiar ações relacionadas aos resultados educacionais selecionados,
sem inferir condição financeira, elegibilidade, recebimento ou valor.

## 2. Arquivos criados

- `src/features/diagnostic/DiagnosticFinancingSection.jsx`: componente público
  de programas e fontes.
- `scripts/checks/diagnostic-financing-interface.test.mjs`: testes de
  renderização estática, integração e auditoria.
- `docs/DIAGNOSTICO_FINANCIAMENTO_INTERFACE_DF2.md`: registro desta etapa.

As evidências visuais dirigidas do Diagnóstico estão em
`artifacts/diagnostico-df2-2026-07-20/` para 1366×768 e 390×844.

## 3. Arquivos alterados

- `src/components/DiagnosticPanel.jsx`;
- `src/features/diagnostic/diagnosticPresentation.js`;
- `src/pages/Diagnostico.jsx`;
- `src/styles/institutional-refresh.css`;
- `scripts/checks/diagnostic-contract.test.mjs`;
- `scripts/checks/diagnostic-e2e-test.cjs`;
- `docs/PLANO_MIGRACAO_UI.md`.

## 4. Seção antiga substituída

O bloco “Caminhos de financiamento relacionados”, suas frentes temáticas e os
links derivados da matriz ampla foram removidos do Diagnóstico. O helper
`buildFinancingViewModel`, que ficou sem consumidor, também foi removido. Os
catálogos amplos foram preservados e continuam disponíveis para seus outros
fluxos; a interface pública do Diagnóstico não os importa.

## 5. Localização da nova seção

“Programas que podem apoiar as melhorias” aparece uma única vez, após os cards
com resultados e comparações educacionais. Quando há programas, “Fontes dos
programas” encerra a página. A seção não é inserida nos cards de indicador.

## 6. Fluxo entre diagnóstico, seletor e componente

1. `Diagnostico.jsx` mantém o carregamento existente de `diagnostico.json`.
2. `DiagnosticPanel.jsx` chama `buildPublicFinancingItems(data)`.
3. O mesmo componente chama `collectPublicFinancingSources(items)` somente com
   os itens selecionados.
4. `DiagnosticFinancingSection.jsx` recebe itens, fontes e nomes públicos já
   resolvidos e apenas os apresenta.

Não foi adicionada requisição, estado global, rota ou carregamento de
`financeiro.json`. A decisão pública continua centralizada em
`diagnosticFinancingPresentation.ts` e em `publicFinancingCatalog.json`.

## 7. Título e textos públicos usados

- apoio de navegação: “Apoio às ações educacionais”;
- título: “Programas que podem apoiar as melhorias”;
- introdução: “Com base nos resultados destacados no diagnóstico, estes
  programas podem apoiar ações na educação do município.”;
- vínculo por ação: “Relacionado a:”;
- subseção final: “Fontes dos programas”.

Não foram adicionados textos de condição financeira, situação municipal ou
disponibilidade de recursos.

## 8. Municípios com itens

Cada programa retornado aparece uma vez, na ordem pública definida pela DF1.
Sua descrição curta é exibida quando existente. Ações iguais são consolidadas
com todos os resultados relacionados; ações diferentes do mesmo programa são
mantidas separadas.

## 9. Municípios sem itens

Quando o seletor retorna `[]`, o componente retorna `null`. Não há título,
introdução, card, mensagem de ausência, fontes ou wrapper que reserve espaço.
Os 11 municípios desse grupo permanecem sem lista pública de identificação.

## 10. Resolução dos nomes dos indicadores

`DiagnosticPanel.jsx` cria o mapa de nomes a partir de `analysis.indicators`, a
mesma estrutura de apresentação usada pelos resultados do Diagnóstico. O
componente nunca usa o ID como fallback. Um ID inesperado é omitido da
interface e gera aviso somente no ambiente de desenvolvimento; a auditoria não
encontrou esse caso.

## 11. Ações e recortes

Os textos de ação são usados diretamente dos itens retornados pelo seletor; não
há frases por programa no JSX. Cada ação possui sua própria lista de resultados
relacionados. Os `scopeText` são apresentados como frases auxiliares neutras e
deduplicados por normalização textual simples quando repetem a informação já
presente na ação.

## 12. Coleta e apresentação das fontes

As fontes vêm exclusivamente de `collectPublicFinancingSources(items)`, já
deduplicadas e restritas aos programas e relações mostrados. A lista final
apresenta organização, título público e ano ou período. O título é o link
oficial, com `target="_blank"` e `rel="noreferrer"`; a URL não aparece como
texto.

## 13. Recursos gerais excluídos

Fundeb, VAAF, VAAT, VAAR, Salário-Educação, QSE, SIOPE, SICONFI/FINBRA,
transferências, saldos, execução orçamentária e valores financeiros não foram
integrados. Eles permanecem no fluxo financeiro geral e não foram vinculados a
indicadores educacionais.

## 14. Auditoria dos 497 municípios

A leitura usou `buildPublicFinancingItems` sobre cada contrato existente e
confirmou:

- 497 contratos lidos;
- 486 municípios com ao menos um programa;
- 11 municípios com lista vazia;
- 1.254 associações município–indicador;
- 2.845 itens agrupados por programa;
- zero IDs desconhecidos;
- máximo observado de 8 programas em um município.

Nenhum contrato foi escrito ou regenerado durante a auditoria.

## 15. Municípios representativos

Os casos foram selecionados automaticamente a partir da auditoria:

- lista vazia: `ararica` (Araricá);
- apenas um programa: `benjamin-constant-do-sul` (Benjamin Constant do Sul);
- máximo de oito programas: `alecrim` (Alecrim);
- mesmo programa relacionado a mais de um indicador: `acegua` (Aceguá);
- relação proveniente de articulação com outra rede: `agudo` (Agudo).

A inspeção funcional de interface usou Agudo e Araricá.

## 16. Testes e validações

- DF1, contrato e integração: 31 testes aprovados, incluindo renderização
  estática e auditoria dos 497 contratos.
- Lint direcionado: aprovado sem ocorrências.
- Typecheck direcionado de `diagnosticFinancingPresentation.ts`: aprovado.
- Typecheck global: não concluiu devido a quatro erros preexistentes e fora da
  DF2 em `src/dev-ui/scenarios/cardScenarios.tsx`,
  `src/features/education/components/EducationMethodologySection.tsx` e
  `src/features/education/EducationPage.tsx`.
- Build de produção completo: aprovado com 165 módulos transformados.
- Inspeção funcional: aprovada no Diagnóstico em 1366×768, 1280×720,
  1024×768 e 390×844. A DF2 foi verificada especificamente com Agudo e Araricá
  em desktop e mobile, sem overflow horizontal ou erros no navegador.

## 17. Itens fora do escopo

Não foram alterados indicadores, valores, metas, séries, comparações,
`decisionSummary`, classificação, scores, contratos, schemas, pipeline, JSONs
municipais, loaders, rotas, arquivos gerados ou o Panorama financeiro. Não
houve download, regeneração, publicação, deploy, commit ou push.

## 18. Orientação para a próxima simplificação textual

Uma etapa futura e separada pode inventariar textos técnicos ainda existentes
nas demais partes do Diagnóstico e substituí-los por linguagem pública, sem
alterar cálculos, classificações ou a camada DF1. Essa revisão deve preservar os
textos desta seção, os nomes canônicos dos indicadores e os limites semânticos
registrados na validação DF1.
