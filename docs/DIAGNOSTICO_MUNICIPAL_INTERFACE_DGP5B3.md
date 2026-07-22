# DGP5-B3 — Interface do Diagnóstico municipal v2

Data: 2026-07-21.

## 1. Decisão

A DGP5-B3 não foi implementada nem aprovada. A auditoria obrigatória do contrato
v2 encontrou um bloqueio no resumo público: `summary` não materializa as
contagens separadas necessárias para apresentar “Acima ou próximos do RS” e
“Abaixo do RS”.

A especificação desta etapa proíbe calcular essas contagens no React e determina
o encerramento da DGP5-B3 quando os campos públicos necessários ao resumo não
existirem. Por isso, a rota continua no contrato v1 e não está autorizada para a
validação final do v2.

## 2. Estado inicial do worktree

O worktree já possuía 1.539 entradas no `git status --porcelain=v1`: 1.015
alterações rastreadas e 524 arquivos não rastreados. Entre elas estavam as
alterações preexistentes do pipeline e os 994 contratos municipais/aliases
materializados. Todos esses diffs foram preservados e não são atribuídos à
DGP5-B3.

## 3. Propriedade e versão auditadas

- propriedade prevista para consumo: `pne2026PublicDiagnosticV2`;
- versão encontrada: `pne2026-public-diagnostic-v2` em 497 de 497 contratos
  canônicos;
- fallback para o v1: não foi criado;
- consumidor atual: permanece inalterado e ainda usa o v1, pois a migração foi
  interrompida antes da implementação.

## 4. Bloqueio contratual do resumo

A auditoria somente leitura dos 497 contratos encontrou:

| Campo público necessário | Contratos com o campo |
|---|---:|
| `advanceCount` | 497 |
| `maintainCount` | 497 |
| `unclassifiedCount` | 497 |
| contagem separada para “Acima ou próximos do RS” | 0 |
| contagem separada para “Abaixo do RS” | 0 |

O contrato possui `stateComparisonCount` e `statewidePositionCount`, mas esses
totais não distinguem as duas categorias editoriais exigidas. Derivar a
separação a partir de `goals[].results[].statewidePosition` seria recálculo de
resumo no frontend e foi expressamente proibido.

## 5. Estrutura visual, resultados e filtros

Não foram implementados cabeçalho, resumo v2, seletor Essenciais/Todos, filtros,
grade essencial, agrupamento completo por metas, novos estados neutros,
disclosures ou fontes v2. A gramática visual vigente foi somente inspecionada;
nenhum CSS, componente compartilhado, token, shell ou conteúdo analítico foi
alterado.

## 6. Casos especiais

Valores negativos, valores acima de 100%, SAEB, a regra `maintain_only`, proxies
contextuais e ausência de `rendimento_magisterio` não chegaram à etapa de
renderização. Nenhum valor, classificação, ordem, vínculo, comparação,
trajetória ou fonte foi transformado.

## 7. Cópia, impressão, fontes e acessibilidade

Não foram alteradas a cópia, a impressão, as fontes, a hierarquia de títulos, os
controles, o foco, os estados de loading/erro ou a responsividade. Não foram
geradas capturas nem artefatos, pois não existe interface v2 válida para avaliar.

## 8. Viewports e municípios

Os viewports 1366×768, 1024×768, 768×1024, 390×844 e A4 não foram executados.
Restinga Seca, Bento Gonçalves, Aceguá, Novo Xingu, Agudo e os casos automáticos
não foram inspecionados visualmente. A auditoria contratual cobriu os 497
municípios canônicos apenas para confirmar versão e presença dos campos de
resumo.

## 9. Arquivos criados

- `docs/DIAGNOSTICO_MUNICIPAL_INTERFACE_DGP5B3.md`.

## 10. Arquivos alterados

Nenhum.

## 11. Arquivos removidos

Nenhum.

## 12. Testes e verificações

Executada somente uma auditoria Node.js de leitura dos 497 contratos canônicos,
que confirmou a versão v2 em todos eles e a ausência das duas contagens públicas
separadas em todos eles.

Não foram executados testes direcionados, testes de apresentação, roteamento,
ESLint, typecheck, build, E2E, impressão, screenshots ou `git diff --check`. A
própria especificação determina encerrar a etapa antes de criar cálculo React
quando o resumo público necessário estiver incompleto.

## 13. Caminhos protegidos

Não foram alterados `public/data/municipios/**`, aliases, catálogo/builder v2,
materializador, v1, página PNE, contratos financeiros, `financeiro.json`,
Panorama financeiro, rotas, shell, baselines ou documentos DGP2–DGP5-B2.

## 14. Pendência bloqueadora

O contrato v2 precisa materializar, no seu `summary`, contagens públicas
separadas e semanticamente aprovadas para:

- resultados acima ou próximos do Rio Grande do Sul;
- resultados abaixo do Rio Grande do Sul.

Depois dessa correção contratual e de sua materialização nos contratos
canônicos/aliases, a DGP5-B3 poderá ser retomada sem cálculo de resumo no React.

## 15. Decisão final

**DGP5-B3 não aprovada; a interface permanece bloqueada pela ausência das
contagens públicas separadas de comparação estadual no resumo do contrato v2.**
