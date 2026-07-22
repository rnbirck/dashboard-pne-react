# Etapa concluída: DGP4 — Validação final do Diagnóstico municipal

**Data:** 21 de julho de 2026  
**Objetivo:** validar de ponta a ponta a página final do Diagnóstico municipal do PNE 2026–2036, corrigindo somente defeitos reais reproduzidos e preservando dados, contratos, regras homologadas e áreas fora do escopo.

## 1. Decisão

- DGP4 aprovada.
- A página está finalizada, sem bloqueio funcional relacionado ao Diagnóstico.
- Dois defeitos reais foram reproduzidos e corrigidos: oferta de filtro global sem resultados e sobreposição das fontes no relatório A4.

## 2. Estado inicial

- O worktree estava limpo no início da DGP4, sem diffs preexistentes.
- A auditoria começou sem pressupor alteração de produção; mudanças foram feitas somente após a reprodução dos dois defeitos.
- `docs/DESIGN_SYSTEM.md`, citado historicamente no plano, não existe neste checkout. A validação visual seguiu `docs/GUIA_DE_DESIGN.md`, os tokens e a implementação compartilhada vigente.
- Um documento financeiro não rastreado apareceu no worktree durante a execução paralela de outra atividade. Ele foi preservado e excluído do escopo e das alterações DGP4.

## 3. Auditoria dos 497 municípios

- Índice: 497 slugs declarados, 497 slugs canônicos únicos e 497 códigos IBGE únicos.
- Materialização: 497 diretórios canônicos e 497 aliases; `index.json`, `details.json` e `diagnostico.json` dos aliases são idênticos aos canônicos, sem divergência.
- Camada pública: presente nos 497 contratos, todos na versão `pne2026-public-diagnostic-v1`; zero versão incorreta.
- Resultados públicos: 9.119, sendo 7.759 `advance` e 1.360 `maintain`.
- Direções: 8.622 `at_least` e 497 `at_most`; zero direção ou classificação inválida.
- Faixa municipal: mínimo de 15 e máximo de 20 resultados.
- Ordem e resumos: zero divergência na ordem canônica de metas/resultados e zero divergência nas cinco contagens públicas do resumo.
- Integridade: zero meta vazia, meta duplicada, resultado duplicado dentro da meta, vínculo Meta × Indicador não autorizado, item fora das allowlists ou fonte ausente.
- Conteúdo: zero item financeiro, zero zero artificial, zero número inválido e zero `null`, `undefined` ou `NaN` renderizável.
- Recursos opcionais materializados: 6.148 comparações estaduais, 5.964 posições estaduais, 6.086 comparações com municípios semelhantes, 1.982 trajetórias e 583 anos estimados.
- Nenhum valor público acima de 100% foi encontrado; o caso solicitado não se aplica ao conjunto materializado atual.

## 4. Casos representativos

- **Restinga Seca:** 15 resultados, 14 para avançar e 1 a manter; desktop 1366×768 e impressão A4 completa/filtrada.
- **Bento Gonçalves:** 20 resultados, 19 para avançar e 1 a manter; notebook 1024×768.
- **Novo Xingu:** 18 resultados, 9 para avançar e 9 a manter; tablet 768×1024 e filtro `maintain`.
- **Aceguá:** 18 resultados, todos para avançar; celular 390×844; direção `at_most`; resultado parcial e direto; metas com um e vários resultados; comparações estaduais, municípios semelhantes, trajetória, ausência dos opcionais e maior rótulo de fonte. Também reproduziu o filtro vazio corrigido.
- **Agudo:** 19 resultados, 17 para avançar e 2 a manter; leitura de alcance projetado e disclosure com histórico.
- A seleção automática dos testes confirmou os mesmos casos para mínimo, máximo, maior presença de `maintain`, ausência de `maintain` e recursos opcionais.

## 5. Interface e conteúdo

- A página usa a ordem aprovada: cabeçalho, resumo, filtros, metas/resultados e fontes.
- Há um único `h1`; metas e resultados seguem a hierarquia semântica e cada resultado aparece uma vez.
- O resumo permanece derivado exclusivamente das cinco contagens públicas materializadas e não muda com filtros.
- Resultados `direct` e `partial_component` preservam a semântica pública; componentes parciais não afirmam alcance integral da meta.
- Campos opcionais ausentes são omitidos, sem seção vazia, zero artificial ou fallback antigo.
- A inspeção estática e do texto renderizado não encontrou financiamento, linguagem decisória/técnica proibida, IDs, versões, scores, rankings ou termos internos.

## 6. Filtros

- Foram validados `Todos`, `Pontos para avançar` e `Resultados a manter`, combinados com `Todos` e com temas presentes no contrato, na ordem recebida.
- Mouse, Enter e Espaço acionam os filtros; o foco permanece no botão, sem salto ao topo.
- Metas vazias são omitidas, resultados não duplicam e a ordem original é preservada.
- O resumo principal permanece imutável durante os ciclos de filtro.
- A impressão respeita o filtro visual ativo.
- Defeito corrigido: quando não há tema selecionado, a disponibilidade de situação agora usa as contagens globais do resumo. Assim, Aceguá não oferece `Resultados a manter` com contagem zero nem cria estado vazio artificial.

## 7. Cópia

- A síntese copiada identifica município e ciclo, inclui resumo, metas, resultados, leituras públicas disponíveis e fontes oficiais.
- A cópia é completa e independente dos filtros visuais; o conteúdo permaneceu idêntico antes e depois da filtragem.
- Clipboard disponível, indisponível e com falha foram cobertos; a falha não expõe detalhe técnico e permite nova tentativa.
- Sucesso e falha usam feedback acessível em região viva.
- O foco retorna e permanece no botão de cópia após a operação.

## 8. Impressão

- Foram gerados PDFs reais em A4 retrato para Restinga Seca sem filtro (15 páginas) e com `Pontos para avançar` ativo (14 páginas e 14 resultados).
- Primeira, página intermediária e última página dos dois relatórios foram renderizadas e inspecionadas.
- Incluídos: cabeçalho, resumo, metas, resultados visíveis, comparações/evolução públicas e fontes oficiais.
- Omitidos: sidebar, barra móvel, backdrop, ações e filtros operacionais.
- A paginação preserva largura integral, títulos junto ao conteúdo e cards sem quebra interna quando suportado. Não há página vazia, corte horizontal, sobreposição, perda de conteúdo final ou área vazia causada por altura fixa.
- As fontes ficam em uma página final própria, com links identificáveis; badges, bordas e textos permanecem legíveis.
- Defeito corrigido: grades de resultados fragmentavam incorretamente na impressão e faziam as fontes sobrepor os últimos cards. A mídia `print` agora lineariza as grades e inicia as fontes em nova página.
- PDFs e PNGs intermediários foram mantidos somente no diretório temporário durante a inspeção e removidos ao final; nenhum baseline foi atualizado.

## 9. Acessibilidade

- Títulos: um `h1` e hierarquia coerente de `h2` a `h5`.
- Filtros: grupos nomeados, botões `type="button"`, `aria-pressed` e nomes acessíveis não ambíguos.
- Fontes: links com nomes acessíveis distintos; SVGs decorativos permanecem ocultos da árvore acessível.
- Estados: loading anunciado por status; erro por alerta; retry operável por teclado.
- Disclosures nativos abrem/fecham por teclado e apresentam foco visível.
- Zero ID duplicado, controle focável oculto ou armadilha de foco nos casos inspecionados.
- Alvos de interação do Diagnóstico permaneceram com pelo menos 44 px nos quatro viewports; tipografia auxiliar mínima observada de 12 px.

## 10. Responsividade

- Viewports reais: 1366×768, 1024×768, 768×1024 e 390×844.
- Zero overflow horizontal e zero sobreposição nos quatro casos.
- Cards, medidas, títulos, filtros e fontes refluem sem perda de conteúdo.
- Títulos longos e o maior rótulo de fonte permaneceram legíveis; a barra móvel não interferiu na página.

## 11. Arquivos criados

- `docs/DIAGNOSTICO_MUNICIPAL_INTERFACE_DGP4.md` — relatório final desta validação.

## 12. Arquivos alterados

- `src/components/DiagnosticPanel.jsx` — omissão de filtros globais cuja contagem pública é zero.
- `src/styles/institutional-refresh.css` — paginação linear e separação segura das fontes exclusivamente na mídia `print`.
- `scripts/checks/diagnostic-e2e-test.cjs` — regressão que confirma a ausência do filtro `maintain` em Aceguá.
- `docs/PLANO_MIGRACAO_UI.md` — registro curto e factual da DGP4.

## 13. Arquivos removidos

- Nenhum arquivo do repositório.
- Artefatos temporários da inspeção PDF foram removidos fora do repositório.

## 14. Validações

- `npm run test:diagnostic` — aprovado: 11/11 testes.
- `python -m unittest data_pipeline.tests.test_pne_2026_public_diagnostic` — aprovado: 16/16 testes.
- `npm run test:e2e:diagnostic` — aprovado em 1366×768, 1024×768, 768×1024, 390×844 e impressão A4.
- `npm run test:app-routing` — aprovado: 8/8 testes.
- `npx eslint src/components/DiagnosticPanel.jsx scripts/checks/diagnostic-e2e-test.cjs src/pages/Diagnostico.jsx src/features/diagnostic/diagnosticPresentation.js` — aprovado: zero erro.
- `npx tsc --noEmit --pretty false` — retornou somente quatro erros globais preexistentes, sem erro no Diagnóstico:
  1. `src/dev-ui/scenarios/cardScenarios.tsx:22` — TS2741, propriedade `icon` ausente;
  2. `src/dev-ui/scenarios/cardScenarios.tsx:23` — TS2741, propriedade `icon` ausente;
  3. `src/features/education/components/EducationMethodologySection.tsx:277` — TS2345, `availability: unknown`;
  4. `src/features/education/EducationPage.tsx:290` — TS2322, `icon: string`.
- `npm run build` — aprovado: 162 módulos transformados.
- `git diff --check` — aprovado: zero erro de whitespace.
- Auditoria estática integral — 497/497 contratos e aliases aprovados; busca de consumidores/fallbacks e termos renderizados aprovada.

## 15. Regras preservadas

- Consumo exclusivo de `pne2026PublicDiagnostic` na interface.
- Ausência ou versão incompatível tratada como erro operacional, sem fallback.
- Nenhuma regra do pipeline recalculada no React e nenhuma ausência convertida em zero.
- Nenhum score, ranking, benchmark ou conteúdo financeiro introduzido.
- Panorama financeiro intacto.
- `public/data/`, `data_pipeline/`, contratos materializados, aliases e JSONs municipais intactos.
- Allowlists, vínculos, valores, anos, unidades, classificações, direções, comparações, trajetórias e fontes intactos.
- Shell, identidade SESI-RS, rotas, loaders e baselines visuais intactos.

## 16. Pendências

- Nenhuma pendência funcional do Diagnóstico.
- Os quatro erros globais preexistentes do typecheck permanecem fora do escopo, conforme solicitado.

## 17. Encerramento

DGP4 aprovada. O Diagnóstico municipal do PNE 2026–2036 está finalizado.

## 18. Ajuste editorial pós-DGP4 — ordenação numérica das metas (2026-07-21)

Sem alterar a aprovação da DGP4, a apresentação de `pne2026PublicDiagnostic.goals`
passou a usar, no pipeline, o número inteiro da meta e a letra como desempate. A
ordem completa anterior era `6.a`, `12.a`, `12.b`, `4.b`, `4.c`, `4.d`, `17.a`,
`17.f`, `17.d`, `8.c`, `18.b`, `8.b`, `19.c`, `11.a`, `11.b`, `11.c`; a nova é
`4.b`, `4.c`, `4.d`, `6.a`, `8.b`, `8.c`, `11.a`, `11.b`, `11.c`, `12.a`,
`12.b`, `17.a`, `17.d`, `17.f`, `18.b`, `19.c`.

Foram rematerializados exclusivamente 497 contratos canônicos e 497 aliases de
`diagnostico.json`. Os 994 arquivos foram atualizados; os 497 pares ficaram
idênticos byte a byte. A comparação neutralizando a ordem das metas encontrou
zero divergência semântica e zero alteração na ordem interna dos resultados. As
contagens permaneceram em 9.119 resultados, 7.759 `advance`, 1.360 `maintain`,
com mínimo de 15, máximo de 20, zero duplicação, meta vazia, fonte ausente ou
item financeiro. Contratos financeiros e demais áreas não foram gravados.

O React, a apresentação, a cópia e a impressão continuam sem ordenação local e
percorrem o contrato recebido. Os testes de contrato (11/11), pipeline (17/17),
ESLint direcionado e build passaram. O E2E confirmou a ordem nos quatro
viewports, filtros, cópia e mídia de impressão, mas o comando encerrou com
timeout posterior no cenário preexistente que aguarda o texto transitório de
loading; nenhuma asserção de ordenação falhou. A inspeção adicional em navegador
real confirmou Restinga Seca, Bento Gonçalves e Aceguá.
