# DGP2 — Interface final do Diagnóstico municipal do PNE 2026–2036

**Data:** 21 de julho de 2026  
**Versão pública consumida:** `pne2026-public-diagnostic-v1`

## 1. Objetivo

Reconstruir a rota pública do Diagnóstico municipal para apresentar somente os
resultados autorizados das metas do PNE 2026–2036, sem conteúdo financeiro e sem
recalcular seleção, classificação, distância, comparações ou trajetória no React.

## 2. Arquivos criados

- `docs/DIAGNOSTICO_MUNICIPAL_INTERFACE_DGP2.md`;
- `artifacts/diagnostico-dgp2-2026-07-21/restinga-seca-1366x768.png`;
- `artifacts/diagnostico-dgp2-2026-07-21/bento-gonçalves-1024x768.png`;
- `artifacts/diagnostico-dgp2-2026-07-21/aceguá-390x844.png`.

## 3. Arquivos alterados

- `src/components/DiagnosticPanel.jsx`;
- `src/pages/Diagnostico.jsx`;
- `src/features/diagnostic/diagnosticPresentation.js`;
- `src/features/diagnostic/diagnosticTypes.ts`;
- `src/styles/institutional-refresh.css`;
- `scripts/checks/diagnostic-contract.test.mjs`;
- `scripts/checks/diagnostic-e2e-test.cjs`;
- `docs/PLANO_MIGRACAO_UI.md`.

## 4. Arquivos removidos

- `src/features/diagnostic/DiagnosticFinancingSection.jsx`;
- `src/features/diagnostic/diagnosticFinancingPresentation.ts`;
- `src/data/diagnostic/publicFinancingCatalog.json`;
- `scripts/checks/diagnostic-financing-interface.test.mjs`;
- `scripts/checks/diagnostic-financing-presentation.test.mjs`.

## 5. Arquitetura anterior removida

A rota deixou de consumir `analysis.indicators`, `decisionSummary`, as cinco
coleções decisórias, o placar, os grupos de investigação, as listas estaduais
separadas, a situação antiga por tema, os grupos de preservação/acompanhamento e
a integração DF2. Helpers, constantes, imports e JSX exclusivos dessas estruturas
foram retirados do fluxo de produção.

## 6. Consumo de `pne2026PublicDiagnostic`

`DiagnosticPanel` acessa somente `data.pne2026PublicDiagnostic` para conteúdo,
ordem, temas, contadores, metas, resultados, leituras, comparações, trajetórias e
fontes. A versão é validada antes da renderização. Ausência ou incompatibilidade
gera somente a mensagem operacional aprovada, sem fallback para a camada antiga.

## 7. Estrutura final

A ordem final é: cabeçalho, resumo, filtros, metas e resultados, fontes. Não há
navegação interna longa, tabela, gráfico ou seção financeira.

## 8. Resumo

A frase e até quatro cards compactos usam exclusivamente os cinco campos de
`summary`. Cláusulas e cards com contagem zero são omitidos. As contagens são
sempre chamadas de resultados, nunca de metas alcançadas.

## 9. Filtros

Situação oferece Todos, Pontos para avançar e Resultados a manter. Tema preserva
título e ordem de `themes`. Opções incompatíveis com a combinação corrente são
removidas; a alteração que invalidaria o outro filtro o devolve a Todos. Nenhum
estado vazio é produzido e os contadores do resumo permanecem imutáveis.

## 10. Metas e resultados

`goals` e `goals[].results` são percorridos na ordem recebida. Metas sem resultado
após os filtros são omitidas. Cada meta e cada resultado aparecem uma vez; metas
com vários resultados não recebem soma, média, seleção ou status agregado.

## 11. Tratamento de `direct`

Resultados diretos apresentam nome, classificação, resultado municipal, ano,
valor previsto, prazo, leitura de distância e leitura pública, sem etiqueta
técnica adicional.

## 12. Tratamento de `partial_component`

O texto exibido é “Este é um dos resultados acompanhados nesta meta.”. A interface
não afirma alcance ou não alcance integral da meta.

## 13. Comparação com o RS

Quando existe, `stateComparison.reading` é exibido com os valores e o ano já
materializados. A diferença não é recalculada. Ausência omite o bloco.

## 14. Posição estadual

Somente `statewidePosition.reading` é exibido. Percentil, colocação, faixa bruta e
posição ordinal não são apresentados.

## 15. Oferta semelhante

O título e a leitura vêm diretamente de `similarMunicipalities`, preservando
“Municípios com oferta educacional de tamanho semelhante”. Ausência omite o bloco.

## 16. Trajetória

Somente `historicalReading` e `achievementReading` são apresentados. Nenhum
modelo, cenário, qualidade ou nova projeção é criado no frontend.

## 17. Fontes

A seção final usa exclusivamente `sources`, mostrando organização, título público,
período e link oficial com `target="_blank"`, `rel="noreferrer"`, texto acessível e
foco visível. Não há reconstrução por indicador técnico.

## 18. Cópia

“Copiar síntese” usa apenas a camada pública: título municipal, ciclo, resumo,
grupos manter/avançar, meta, nome, valores, leituras complementares e fontes. A
saída não contém DF2 nem coleções antigas.

## 19. Impressão

A impressão reutiliza a própria página. Filtros e ações são ocultados; metas,
resultados atualmente exibidos e fontes permanecem. Cabeçalhos e cards evitam
quebra interna sempre que o motor de impressão permite.

## 20. Loading e erro

O loading usa “Carregando o diagnóstico de {município}…”. Erros de carregamento,
ausência da camada ou versão incompatível usam “Não foi possível abrir o
diagnóstico agora. Tente novamente.”. O erro de carregamento oferece nova tentativa
e nenhum detalhe bruto é exibido.

## 21. Acessibilidade

A página possui um único `h1`, hierarquia `h2`–`h5`, filtros em `fieldset` com
`aria-pressed`, região viva para cópia, `role="alert"` no erro, SVGs decorativos,
disclosures nativos por teclado, foco visível e alvos de 44 px. Textos de estado
acompanham as cores.

## 22. Limpeza da DF2

A busca de consumidores confirmou que componente, apresentação, catálogo e dois
testes DF2 eram exclusivos do Diagnóstico. Os cinco arquivos foram removidos e os
seletores financeiros exclusivos foram retirados de `institutional-refresh.css`.
`resolveJsonModule` foi preservado porque a página Panorama financeiro continua
importando outros catálogos JSON. O Panorama financeiro não foi alterado.

## 23. Auditoria dos 497 contratos

Auditoria somente leitura reproduzida em `npm run test:diagnostic`:

| Medida | Obtido |
|---|---:|
| contratos com versão correta | 497 |
| resultados | 9.119 |
| mínimo / máximo por município | 15 / 20 |
| `maintain` / `advance` | 1.360 / 7.759 |
| comparações com RS | 6.148 |
| posições estaduais | 5.964 |
| oferta semelhante | 6.086 |
| trajetórias | 1.982 |
| anos estimados | 583 |
| duplicados, metas vazias, indicadores externos, fontes ausentes | 0 |
| itens financeiros na camada pública | 0 |

## 24. Municípios usados na inspeção

Seleção automática da auditoria:

- 15 resultados: `restinga-seca`;
- 20 resultados: `bento-goncalves`;
- maior número de resultados a manter: `novo-xingu`;
- sem resultado a manter: `acegua`;
- `at_most`: `acegua`;
- meta com vários resultados: `acegua`;
- com e sem RS: `acegua`;
- com e sem trajetória: `acegua`.

Inspeção funcional executada: Restinga Seca em 1366×768, Bento Gonçalves em
1024×768 e Aceguá em 390×844.

## 25. Testes e validações

- `npm run test:diagnostic`: 11 testes aprovados, incluindo auditoria DGP2;
- `python -m unittest data_pipeline.tests.test_pne_2026_public_diagnostic`: 16 aprovados;
- ESLint direcionado aos arquivos DGP2: aprovado;
- `npx tsc --noEmit --pretty false`: quatro erros preexistentes em Educação e
  cenários de cards; nenhum erro nos arquivos DGP2;
- `npm run build`: aprovado;
- `npm run test:e2e:diagnostic`: aprovado nos três viewports;
- `npm run test:app-routing`: 8 testes aprovados;
- inspeção das três capturas: ordem, clareza, filtros, cards, fontes e contenção
  responsiva confirmadas;
- `git diff --check`: aprovado (somente avisos de normalização LF/CRLF nos
  arquivos preexistentes da DGP1.1);
- busca final: zero consumidor ou seletor financeiro da DF2 e zero termo técnico
  removido na saída pública.

A busca de linguagem não encontrou referências técnicas proibidas. O nome público
autorizado “Docentes da rede pública com contrato temporário” preserva a acepção
trabalhista recebida da camada DGP1 e não é uma referência ao contrato de dados.

## 26. Itens fora do escopo

Não foram alterados pipeline, configuração DGP1, contratos municipais, JSONs
públicos, allowlist, valores, fórmulas, séries, comparações, percentis, trajetória,
rotas, loaders, PNE 2026–2036, indicadores gerais, contratos financeiros,
`financeiro.json`, shell ou Panorama financeiro. Não houve regeneração, download,
publicação, deploy, commit ou push.

## 27. Pendências reais para DGP3

Não há correção bloqueadora identificada na DGP2. A dívida CSS histórica de
`src/App.css` permanece fora da nova gramática; a DGP2 não adicionou regra nova
nesse arquivo. O typecheck global continua bloqueado pelas quatro falhas
preexistentes fora do Diagnóstico.

## 28. Decisão sobre iniciar DGP3

**DGP3 pode começar.** O consumo exclusivo, a remoção da DF2, a interface, a
cópia, a impressão, a acessibilidade, a auditoria, o build e a inspeção funcional
atingiram os critérios da DGP2.
