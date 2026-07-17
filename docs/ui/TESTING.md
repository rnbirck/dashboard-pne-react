---
status: reference
scope: "Catálogo isolado, testes funcionais e regressão visual da interface"
last_validated: 2026-07-17
read_when: "Ao criar cenário, escolher cobertura ou revisar mudança visual"
supersedes: "Documentos anteriores do catálogo e da regressão visual"
---

# Testes de interface

## Escolha da camada

| Camada | Use para | Não substitui |
| --- | --- | --- |
| Catálogo + `test:dev-ui:visual` | Componente, estado ou variante isolada com fixture determinística | Fluxo e composição pública |
| `test:e2e` | Navegação, teclado, foco, estado e comportamento integrado | Comparação pixel a pixel |
| `test:visual` | Páginas completas e composição integrada | Diagnóstico rápido de componente |

Regra prática: componente isolado → catálogo e regressão isolada; navegação/interação → catálogo, roteamento e E2E; página/composição → catálogo, E2E e regressão pública; cálculo/indicador → `verify:indicator` e testes do domínio.

## Catálogo isolado

```powershell
npm run dev:ui
npm run test:dev-ui
npm run test:dev-ui:visual
npm run test:dev-ui:visual -- --scenario <id> --viewport notebook
npm run test:dev-ui:visual -- --category education
```

`vite.dev-ui.config.ts` usa `root: "dev-ui"` e `publicDir: false`. O catálogo não é rota pública, não lê `public/data`, não usa seleção municipal e não pode ser importado por `src/main.jsx`, `src/App.tsx`, páginas ou componentes públicos. O build isolado é temporário; o teste falha se houver requisição `*/data/*.json` ou conteúdo do catálogo no build público.

O registro em `src/dev-ui/scenarios/index.ts` é a única lista de cenários. Fixtures são pequenas, tipadas, literais e determinísticas; preservam zero, `null`, denominador ausente e série vazia. Wrappers podem fornecer estado local ou provider mínimo, mas nunca copiar JSX de produção. IDs de cenário e categoria são contratos de navegação e baseline; testes localizam por ID, não por título.

O seletor interno oferece Desktop, Notebook, Mobile e Fluido para inspeção. Como media queries respondem ao viewport do navegador, valide também 1366×768, 1280×720, 1024×768, 768×1024, 390×844 e 320×568 nos testes apropriados. Fluido não é baseline.

## Harness visual

O harness inicia uma vez `vite.dev-ui.config.ts` na porta 4175 e abre:

```text
http://127.0.0.1:4175/?scenario=<id>&viewport=<id>&visual=1
```

Contratos estáveis:

```text
[data-testid="catalog-preview"]
[data-testid="catalog-component"]
[data-scenario-id="<id>"]
[data-catalog-ready="true"]
```

`visual=1` remove o shell e renderiza somente o canvas. O alvo padrão é `catalog-preview`; `captureTarget: "component"` captura o wrapper interno. Habilite a suíte no metadado opcional `scenario.visual`, definindo somente os viewports que acrescentem risco responsivo real. `maxDiffRatio` só muda com evidência reproduzível.

Antes da captura, o harness aguarda React, `document.fonts.ready`, imagens concluídas, três frames com dimensões estáveis, `data-catalog-ready="true"` e mais dois frames. Playwright usa movimento reduzido e desabilita animações na captura. Não use timeout artificial, relógio, aleatoriedade, rede ou aumento de tolerância para esconder instabilidade.

A comparação usa tolerância de 20 por canal e limite padrão de 0,2% de pixels divergentes. Diferença de dimensão sempre falha. O comando normal nunca grava baseline:

```powershell
npm run test:dev-ui:visual:update -- --scenario <id> --viewport <id>
```

Atualize somente a combinação intencionalmente alterada e revise o PNG. Baselines isolados ficam em `tests/dev-ui-visual/baselines`; `results` e `diffs` são temporários. A regressão pública usa `scripts/checks/visual-baselines`. Fonte ausente, loading involuntário, foco, cursor, animação ou dimensão instável são defeitos, não novas referências.

## Verificação proporcional

- Mudança de fixture/cenário: cenário afetado, `npm run test:dev-ui` e regressão isolada selecionada.
- Componente compartilhado: testes acima, `npm run typecheck`, `npm run lint`, `npm run test:ui-architecture` e `npm run build`.
- Navegação/interação: acrescente `npm run test:app-routing` e `npm run test:e2e`.
- Página/composição: acrescente `npm run test:visual` e revise overflow nas viewports reais.

Sempre confirme foco, Escape, restauração de foco, ARIA, textos extremos, valores grandes, loading, erro, vazio, ausência e zero. O catálogo deve funcionar sem município, registrar `municipalRequests=0` e permanecer ausente de `dist`.
