# Etapa concluída: DGP3 — Acabamento funcional do Diagnóstico municipal

**Data:** 21 de julho de 2026  
**Objetivo:** auditar a implementação DGP2 e corrigir somente defeitos funcionais reproduzidos em fontes, impressão, acessibilidade e contrato de tipos, sem alterar dados ou regras homologadas.

## 1. Resultado da auditoria inicial

- Itens corretos: consumo exclusivo da camada pública pelo painel, ordem de metas e resultados, cópia independente dos filtros, combinações de filtros, ressalva de componentes parciais, clipboard indisponível, foco após copiar e filtrar, teclado, hierarquia `h1`–`h5`, IDs, alvos de 44 px, ausência de overflow e linguagem pública.
- Defeitos reproduzidos:
  - INEP e IBGE expunham o mesmo nome acessível, “Acessar fonte oficial”, contrariando os critérios 4.1 e 4.4 da DGP3;
  - a mídia impressa mantinha a coluna vazia do shell, perdia bordas, badges e a gramática dos cards porque o bloco DGP2 era exclusivo de `screen`, e ainda mostrava a barra móvel no formato A4, contrariando o critério 4.3;
  - `MunicipalDiagnosticContractV2` marcava a camada pública como obrigatória, embora o runtime homologado trate sua ausência com erro operacional e o teste de materialização preserve a propriedade opcional e versionada.
- Decisão: aplicar somente as três correções mínimas reproduzidas.
- `docs/DESIGN_SYSTEM.md` não existe no checkout; a auditoria usou o guia normativo, tokens, gramática compartilhada e estilos reais, conforme a ordem de governança.
- O Git já continha diffs extensos de DGP1/DGP2 em `public/data/`, `data_pipeline/`, componentes, apresentação e documentação. Eles foram preservados e não foram atribuídos à DGP3.

## 2. Resultado para o usuário

- Links de fonte agora têm nomes acessíveis distintos, com organização e título público.
- O relatório impresso usa toda a largura A4, omite o shell operacional e preserva superfícies, bordas, badges, links, metas, resultados filtrados e fontes.
- A tipagem voltou a representar corretamente a ausência possível da camada pública, sem mudar o comportamento ou os dados.

## 3. Arquivos criados

- `docs/DIAGNOSTICO_MUNICIPAL_INTERFACE_DGP3.md` — relatório desta auditoria;
- `artifacts/diagnostico-dgp3-2026-07-21/restinga-seca-print-a4-retrato.png` — evidência estritamente necessária da correção de impressão.

## 4. Arquivos alterados

- `src/components/DiagnosticPanel.jsx` — nome acessível específico para cada link oficial;
- `src/features/diagnostic/diagnosticTypes.ts` — propriedade pública opcional, alinhada ao comportamento de ausência já homologado;
- `src/styles/institutional-refresh.css` — gramática DGP2 também em impressão, shell linear, barra móvel oculta e regras de legibilidade/paginação;
- `scripts/checks/diagnostic-contract.test.mjs` — nome acessível das fontes e seleção automática dos casos DGP3;
- `scripts/checks/diagnostic-e2e-test.cjs` — quatro viewports, teclado, foco, clipboard, loading, erro, retry, filtros combinados e impressão A4;
- `docs/PLANO_MIGRACAO_UI.md` — registro curto e factual da DGP3.

Os diffs já existentes em `src/pages/Diagnostico.jsx` e `src/features/diagnostic/diagnosticPresentation.js` foram auditados, mas não receberam alteração da DGP3.

## 5. Arquivos removidos

- nenhum.

## 6. Fontes

- A seção usa exclusivamente `pne2026PublicDiagnostic.sources`.
- Foram verificados organização, título público, período, URL oficial, `target="_blank"`, `rel="noreferrer"`, foco visível e ausência de placeholders.
- INEP e IBGE permanecem as duas fontes educacionais oficiais, sem duplicação visual.
- Os nomes acessíveis agora seguem “Acessar fonte oficial: organização — título público”.
- Não há fonte financeira, de programa ou metadado interno.

## 7. Cópia

- A síntese identifica município e ciclo, usa “resultados”, separa “Pontos para avançar” e “Resultados a manter” e inclui somente campos e fontes públicas presentes.
- Não contém seções vazias, IDs, códigos, DF2, financiamento, coleções antigas, `null`, `undefined` ou `NaN`.
- Componentes parciais continuam descritos como resultados da meta, sem afirmar alcance integral da meta.
- Sucesso e falha são anunciados em região viva; a falha não expõe erro técnico; a operação pode ser repetida e preserva o foco mesmo sem API de clipboard.
- Regra DGP2 preservada: a cópia usa a síntese pública completa e não muda com os filtros visuais.

## 8. Impressão

- Incluídos: cabeçalho do diagnóstico, resumo, metas, resultados atualmente filtrados, comparações/evolução públicas e fontes.
- Omitidos: navegação lateral, barra móvel, backdrop, barra de contexto, ações e filtros.
- Verificados mídia `print`, A4 retrato em 794×1123 px e os quatro viewports funcionais.
- O shell passou a ser linear e a página ocupa 100% da largura disponível; títulos de meta evitam separação do conteúdo e cards evitam quebra interna.
- Bordas, badges, superfícies e links permaneceram identificáveis; não houve overflow horizontal.
- Evidência visual revisada em `artifacts/diagnostico-dgp3-2026-07-21/restinga-seca-print-a4-retrato.png`.

## 9. Acessibilidade, foco e teclado

- Um único `h1`; sequência coerente de `h2`, `h3`, `h4` e `h5`.
- Filtros em `fieldset` nomeados, com `aria-pressed`, botões `type="button"` e nomes não ambíguos.
- Links de fonte distinguíveis fora do contexto visual.
- SVGs decorativos com `aria-hidden="true"`; `details`/`summary` nativos e operáveis por Enter.
- Enter e Espaço acionam filtros; o foco permanece no botão acionado e não salta para o topo.
- Região viva de cópia, loading com status, erro com `role="alert"` e retry por Enter foram verificados.
- Zero ID duplicado, zero armadilha de foco e zero controle do Diagnóstico abaixo de 44 px nos casos auditados.

## 10. Filtros e responsividade

- Situações preservadas: Todos, Pontos para avançar e Resultados a manter.
- Temas vêm somente de `themes`, na ordem recebida; opções incompatíveis são omitidas e não produzem estado vazio artificial.
- Resumo municipal permaneceu idêntico durante os filtros.
- Metas vazias após filtro são omitidas; cada meta e resultado aparece no máximo uma vez e mantém a ordem do contrato.
- A impressão manteve exatamente a quantidade de resultados do recorte ativo.
- Municípios: `restinga-seca` (15), `bento-goncalves` (20), `novo-xingu` (9 resultados a manter), `acegua` (zero a manter, `at_most`, múltiplos resultados, com/sem RS e trajetória) e `agudo` (leitura de alcance estimado).
- Casos automáticos: `partial_component`, direto, `achievementReading`, ausência de trajetória e maior rótulo de fonte encontrados; nenhum valor acima de 100% existe na camada pública atual.
- Viewports: 1366×768, 1024×768, 768×1024 e 390×844, todos sem overflow horizontal, corte de título ou controle vazio.

## 11. Validações

| Comando | Resultado | Quantidade |
|---|---|---:|
| `npm run test:diagnostic` | aprovado | 11/11 |
| `python -m unittest data_pipeline.tests.test_pne_2026_public_diagnostic` | aprovado após alinhar a opcionalidade do tipo | 16/16 |
| `npm run test:e2e:diagnostic` | aprovado | 4 viewports + loading/erro/retry + clipboard + A4 |
| `npm run test:app-routing` | aprovado | 8/8 |
| ESLint dirigido aos arquivos DGP3 e consumidores | aprovado | 0 erros |
| `npx tsc --noEmit --pretty false` | quatro erros preexistentes; nenhum no Diagnóstico | 4 preexistentes |
| `npm run build` | aprovado | 162 módulos |
| `git diff --check` | aprovado | 0 erro |

Erros preexistentes do typecheck, não alterados:

- dois `TS2741` em `src/dev-ui/scenarios/cardScenarios.tsx` por `icon` ausente;
- um `TS2345` em `EducationMethodologySection.tsx` por `availability: unknown`;
- um `TS2322` em `EducationPage.tsx` por `icon: string` incompatível.

Buscas dirigidas confirmaram zero consumidor de DF2 em produção, zero fallback para coleções antigas e zero termo proibido nos textos públicos do painel/apresentação. A única ocorrência de nomes DF2 em `scripts` é a asserção que protege sua ausência.

## 12. Regras preservadas

- `DiagnosticPanel` continua consumindo somente `data.pne2026PublicDiagnostic`.
- Ausência não virou zero.
- Nenhuma classificação, direção ou distância foi recalculada.
- Nenhuma comparação estadual ou com oferta semelhante foi recalculada.
- Nenhuma trajetória ou ano estimado foi recalculado.
- Nenhum score ou ranking foi criado.
- Nenhum conteúdo financeiro retornou.
- O Panorama financeiro permaneceu intacto e sem diff em `MunicipalFinancePanoramaPage.tsx`.
- A DGP3 não tocou `public/data/`, `data_pipeline/`, contratos municipais materializados ou JSONs; os diffs preexistentes desses diretórios foram preservados desde o estado inicial.
- Nenhum baseline visual foi atualizado.

## 13. Pendências para DGP4

- Não há pendência funcional bloqueadora identificada pela DGP3.
- A ausência preexistente de `docs/DESIGN_SYSTEM.md`, embora referenciada pelo guia e pelo plano histórico, permanece uma inconsistência documental não bloqueadora.
- A DGP4 não foi iniciada nesta execução.

## 14. Decisão

**DGP3 aprovada; DGP4 pode começar.**
