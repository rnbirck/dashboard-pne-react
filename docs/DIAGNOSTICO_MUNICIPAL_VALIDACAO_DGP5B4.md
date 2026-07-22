# Etapa concluída: DGP5-B4 — Validação final do Diagnóstico municipal v2

Data: 2026-07-21.

## 1. Decisão

- DGP5-B4 aprovada.
- Dois defeitos de interface foram reproduzidos e corrigidos de forma mínima: o cabeçalho prometia comparação com os demais municípios apesar da omissão intencional dessas leituras; e o componente React duplicava o identificador contratual de versão que deve permanecer centralizado na apresentação.
- Após as correções, o Diagnóstico municipal v2 está finalizado.

## 2. Estado inicial

- O worktree iniciou com 1.549 entradas: 1.017 alterações rastreadas e 532 arquivos não rastreados.
- Já estavam modificados antes da B4 o pipeline, os contratos municipais e aliases, frontend financeiro, QSE, documentos e os arquivos da B3R. Havia 1.491 entradas preexistentes sob `public/data/municipios/`.
- As alterações preexistentes foram preservadas. A B4 é atribuída somente aos quatro arquivos registrados nas seções 17 e 18.
- Catálogo, builder, materializador, contratos, aliases, v1, PNE, finanças, Panorama, shell e baselines foram tratados como caminhos protegidos.
- O estado final possui 1.550 entradas: as mesmas 1.017 alterações rastreadas e 533 arquivos não rastreados, diferença explicada exclusivamente pela criação deste relatório.

## 3. Auditoria dos 497 municípios

- 497 contratos canônicos, 497 aliases e 994 arquivos físicos foram confirmados; pares canônico–alias permaneceram determinísticos.
- Foram reproduzidos 15.896 resultados e 1.002 ausências reais entre 16.898 possibilidades.
- Mínimo 26, máximo 34, média 31,9839 e mediana 32. Distribuição: 26: 1; 27: 3; 28: 6; 29: 15; 30: 34; 31: 134; 32: 150; 33: 24; 34: 130.
- Classificações: 11.972 `advance`, 2.447 `maintain` e 1.477 sem classificação.
- Vínculos: 6.789 `direct`, 8.113 `partial_component` e 994 `contextual_proxy`.
- Catálogo: 34 pares únicos, 34 indicadores, 24 metas, nove essenciais, 25 complementares e oito temas na ordem recebida.
- Metadata dos nove essenciais e `priorityOrder` de 1 a 9 presentes; zero complementar promovido e ausência de essencial preservada.
- Valores especiais: 127 negativos de `subsequente_expansao`; 494 acima de 100%; 33 municípios sem `rendimento_magisterio`.
- `medio_tecnico_articulado_percentual`: 13 `maintain`, 483 sem classificação e zero `advance`.
- Zero duplicação, zero resultado fora dos 34 pares, zero meta fora das 24 metas, zero ausência convertida em zero e zero divergência de valor, ano, unidade, classificação ou fonte.
- O resumo de cada contrato coincide com os resultados: `advanceCount + maintainCount + unclassifiedCount` é igual ao total municipal.

## 4. Consumo do contrato

- Propriedade exclusiva: `data.pne2026PublicDiagnosticV2`.
- Versão aceita: `pne2026-public-diagnostic-v2`; schema técnico aceito: `municipal-diagnostic-v2`.
- A rota não consulta `pne2026PublicDiagnostic`, `analysis.indicators`, mapa frontend Meta × Indicador, catálogo React do PNE, coleções antigas, DF2 ou estruturas financeiras.
- A constante de versão pública foi centralizada em `diagnosticPresentation.js`; o componente apenas a consome.
- Loading validado com “Carregando o diagnóstico de {município}…”. Ausência da propriedade, versão incompatível e erro de rede exibem somente “Não foi possível abrir o diagnóstico agora. Tente novamente.”.
- Retry por teclado foi exercitado até o carregamento bem-sucedido; conteúdo do município anterior não permaneceu visível.

## 5. Resumo

- Usa exclusivamente `advanceCount`, `maintainCount` e `unclassifiedCount`.
- Rótulos confirmados: Pontos para avançar; Resultados a manter; Resultados para acompanhamento.
- Contagens zero são omitidas.
- O resumo usa o conjunto completo e permaneceu imutável ao trocar modo, situação, tema e combinações de filtros.
- Não há cards estaduais antigos, `stateComparisonCount`, `statewidePositionCount` nem reconstrução de contagens no React.

## 6. Resultados essenciais

- Estado inicial confirmado em Resultados essenciais.
- Somente `tier: essential`, em ordem materializada de `priorityOrder`, no máximo nove, sem card vazio, substituição ou promoção.
- Menor disponibilidade: oito essenciais; primeiro caso automático, André da Rocha. Todos os nove: primeiro caso automático, Aceguá.
- Distribuição: oito essenciais em sete municípios e nove essenciais em 490 municípios.
- Grade confirmada em 3 → 2 → 1 colunas; `tier` e `priorityOrder` não aparecem publicamente.

## 7. Todos os resultados

- Todos os resultados disponíveis são apresentados uma vez, agrupados pelas metas recebidas, com ordem de metas e ordem interna preservadas.
- No estado sem filtro, a quantidade renderizada coincide com o total do contrato.
- Metas vazias após filtro são omitidas; não há situação agregada por meta.
- Essenciais recebem apenas a identificação discreta “Resultado essencial”.
- O harness SSR alimentou a apresentação com os 497 contratos sem exceção, card vazio, meta vazia, duplicação, valor inválido ou texto técnico visível.

## 8. Filtros

- Situações: Todos, Pontos para avançar, Resultados a manter e Resultados para acompanhamento.
- Temas: apenas os oito temas recebidos, na ordem contratual e sem opção vazia.
- Foram exercitados, nos dois modos, Todos + Todos, cada situação, cada tema, combinações compatíveis, indisponibilidade de combinações incompatíveis, troca de modo com filtros ativos, retorno automático e manual a Todos e troca de município.
- Enter e Espaço, `aria-pressed`, foco, ordem e unicidade foram preservados; nenhum estado vazio artificial foi produzido.
- Essenciais nunca foram substituídos por complementares.

## 9. Resultados sem classificação

- `contextual_proxy` usa “Resultado de contexto” e “Este resultado ajuda a contextualizar a meta, mas não mede sozinho o seu cumprimento.”.
- Os demais sem classificação usam “Resultado para acompanhamento” e aparência neutra.
- O filtro de acompanhamento inclui os dois grupos, sem `advance` ou `maintain` artificial e sem estado técnico público.
- Cópia e impressão preservam as mesmas formulações públicas.

## 10. Componentes parciais e casos especiais

- `partial_component` preserva “Este é um dos resultados acompanhados nesta meta.”.
- Os seis resultados SAEB permanecem separados, sem média por disciplina, etapa ou meta.
- `medio_tecnico_articulado_percentual` respeita a regra maintain-only.
- Os 33 `rendimento_magisterio` ausentes são omitidos sem placeholder.
- Ajuricaba preservou `subsequente_expansao` de -100,0%; Aceguá preservou pré-escola de 122,2%. Sinal, unidade e valor completo permaneceram na tela, cópia e A4, sem truncamento ou overflow.

## 11. Comparações e evolução

- 12.042 resultados possuem pelo menos um objeto técnico opcional; contagens por objeto: 8.473 comparações estaduais, 8.420 posições estaduais, 7.616 similares e 12.042 trajetórias, com 1.731 anos estimados.
- Leituras textuais públicas disponíveis: zero. Leituras efetivamente renderizadas: zero.
- A omissão é intencional e não bloqueadora. Não há disclosure vazio, reserva de espaço, código `better`, `worse`, `equivalent` ou `similar`, nem inferência no React.
- O defeito do cabeçalho foi corrigido para “Veja os resultados do município em relação às metas do PNE 2026–2036.”, deixando de prometer comparações omitidas.

## 12. Cópia

- Validada nos modos Essenciais e Todos, após filtros, repetidamente, com clipboard indisponível e com rejeição simulada.
- A saída permaneceu completa e independente do estado visual: município/ciclo, resumo, essenciais, demais resultados e fontes.
- Todos os resultados aparecem uma vez; proxies, componentes parciais, negativos e valores acima de 100% foram preservados.
- Campos ausentes e códigos internos foram omitidos. Não há financiamento, `null`, `undefined`, `NaN` ou leitura técnica opcional.
- Foco permaneceu no botão após sucesso e falha.

## 13. Impressão

- A4 retrato validado em cinco cenários temporários: Essenciais sem filtro; Todos sem filtro; Todos com filtro; Ajuricaba com 34 resultados e valor negativo; Aceguá com valor acima de 100%.
- Quantidades: 6, 17, 14, 20 e 19 páginas, respectivamente; zero página vazia e dimensões A4 de 595,9 × 842,9 pontos.
- Primeira, intermediária e última página de cada cenário foram renderizadas e inspecionadas. As páginas específicas com -100,0% e 122,2% também foram inspecionadas.
- Sidebar, drawer, backdrop, barra móvel, ações, visualização, filtros e controles de disclosure ficaram ocultos.
- Cabeçalho, resumo, recorte visível, notas, valores especiais e fontes foram preservados, sem corte horizontal, título de meta isolado, duplicação ou conteúdo financeiro.
- Os PDFs e PNGs intermediários foram removidos ao final; nenhuma evidência B3R foi duplicada em diretório B4.

## 14. Fontes

- A interface usa exclusivamente as fontes completas do v2: três registros oficiais renderizáveis.
- Organização, título, período e URL oficial foram confirmados.
- Links usam `target="_blank"`, `rel="noreferrer"`, foco visível e nomes distintos no formato “Acessar fonte oficial: {organização} — {título público}”.
- Não há fonte financeira, código interno ou duplicação visual.

## 15. Acessibilidade

- DOM real: um `h1`; hierarquia coerente de `h2` a `h5`; grupos nomeados; `aria-pressed` correto; botões `type="button"`; SVGs decorativos ocultos; região viva da cópia; loading anunciado; erro `role="alert"`; retry acessível.
- Zero ID duplicado, zero foco oculto dentro do Diagnóstico, zero armadilha de foco e ordem de Tab coerente.
- Foco permaneceu após modo, filtros, cópia e retry. Enter e Espaço funcionaram.
- Alvos usam a altura canônica de controle de 44 px; foco visível foi preservado.

## 16. Responsividade

- 1366×768: zero overflow horizontal e três colunas essenciais.
- 1024×768: zero overflow horizontal e duas colunas essenciais.
- 768×1024: zero overflow horizontal e duas colunas essenciais.
- 390×844: zero overflow horizontal e uma coluna essencial.
- Títulos, badges, valores especiais, filtros e fontes permaneceram contidos; console sem erro inesperado.
- No celular, drawer, backdrop, Escape e retorno de foco ao botão Menu foram confirmados, além de filtros, modo, cópia, fontes, loading e erro.

## 17. Arquivos criados

- `docs/DIAGNOSTICO_MUNICIPAL_VALIDACAO_DGP5B4.md`.

## 18. Arquivos alterados

- `src/components/DiagnosticPanel.jsx`: descrição pública corrigida e versão consumida da apresentação.
- `src/features/diagnostic/diagnosticPresentation.js`: constante pública de versão exportada.
- `scripts/checks/diagnostic-contract.test.mjs`: asserção dirigida para impedir promessa pública de comparações omitidas.

Esses três arquivos já possuíam alterações preexistentes da B3R; somente os hunks acima são atribuídos à B4.

## 19. Arquivos removidos

- Nenhum arquivo do repositório.
- Intermediários temporários de A4 em `tmp/pdfs/` foram removidos após a inspeção.

## 20. Validações

- `python -m unittest data_pipeline.tests.test_pne2026_public_diagnostic_v2 data_pipeline.tests.test_materialize_pne2026_public_diagnostic_v2 data_pipeline.tests.test_pne_2026_public_diagnostic`: 47 testes aprovados na execução final. Uma passagem anterior encontrou a duplicação da versão no React e motivou a correção mínima.
- `python data_pipeline/scripts/audit_pne2026_public_diagnostic_v2.py`: aprovado; 497 municípios, 15.896 resultados, 1.002 ausências e zero divergência.
- `npm run test:diagnostic`: 11/11 aprovados, incluindo auditoria de leitura dos 497 contratos e casos representativos.
- Harness SSR temporário dos 497 contratos: 497/497 renderizados sem exceção.
- `npm run test:app-routing`: 8/8 aprovados.
- ESLint dirigido aos arquivos alterados e consumidores diretos: aprovado, zero erro e zero aviso.
- `npx tsc --noEmit --pretty false`: manteve exatamente os seis erros preexistentes, sem erro no Diagnóstico e sem aumento do conjunto.
- `npm run build`: aprovado; 166 módulos transformados.
- `npm run test:e2e:diagnostic`: aprovado em 1366×768, 1024×768, 768×1024, 390×844 e mídia A4.
- Auditorias funcionais temporárias: filtros, cópia repetida/falha, reload, Back/Forward, contrato ausente, versão incompatível, retry e drawer móvel aprovados.
- `git diff --check`: aprovado; somente avisos ambientais de futura conversão LF/CRLF.

Erros TypeScript preexistentes preservados:

1. `src/data/qseAnnual.ts(68,14)` — TS2802.
2. `src/dev-ui/scenarios/cardScenarios.tsx(22,43)` — TS2741.
3. `src/dev-ui/scenarios/cardScenarios.tsx(23,45)` — TS2741.
4. `src/features/education/components/EducationMethodologySection.tsx(277,54)` — TS2345.
5. `src/features/education/EducationPage.tsx(290,35)` — TS2322.
6. `src/features/municipal-finance/MunicipalFinancePanoramaPage.tsx(178,29)` — TS2322.

## 21. Caminhos protegidos

- Não foram alterados pela B4: `public/data/municipios/**`, aliases, catálogo, builder, materializador, v1, página PNE, Indicadores de Educação, contratos financeiros, `financeiro.json`, Panorama financeiro, shell, rotas alheias e baselines.
- Contratos e JSONs não foram regenerados; dados não foram baixados nem recalculados.
- Nenhum commit, push, deploy ou baseline visual foi criado/atualizado.

## 22. Pendências

- Bloqueadores reais: nenhum.
- Limitação não bloqueadora: os 12.042 resultados com objetos técnicos opcionais não possuem leitura textual pública materializada; por decisão aprovada, comparações e evolução permanecem omitidas.
- Os seis erros TypeScript preexistentes permanecem fora do Diagnóstico e fora do escopo desta etapa.

## 23. Declaração final

**DGP5-B4 aprovada; o Diagnóstico municipal v2 está finalizado.**
