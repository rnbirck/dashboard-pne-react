# Regressão visual isolada do catálogo

## Finalidade e limites

`test:dev-ui:visual` compara componentes e cenários do catálogo sem iniciar a aplicação pública, navegar por municípios ou disponibilizar `public/data`. A suíte usa um único servidor Vite controlado, um navegador reutilizado e fixtures determinísticas do registro de `src/dev-ui/scenarios`.

| Camada | Responsabilidade | Não substitui |
|---|---|---|
| `test:dev-ui:visual` | Componente ou cenário isolado; ciclo rápido; baselines direcionados | Fluxos e composição da página pública |
| `test:e2e` | Navegação, interação, teclado, foco, estado e comportamento funcional | Comparação pixel a pixel |
| `test:visual` | Páginas completas e composição integrada nos 23 casos públicos | Diagnóstico rápido de componente |

A suíte isolada não altera nem atualiza baselines de `scripts/checks/visual-baselines`.

## Comandos e filtros

```powershell
npm run test:dev-ui:visual
npm run test:dev-ui:visual -- --scenario cards-explorable-states
npm run test:dev-ui:visual -- --category education
npm run test:dev-ui:visual -- --viewport mobile
npm run test:dev-ui:visual -- --scenario cards-explorable-states --viewport notebook
```

Os filtros podem ser combinados e operam somente sobre combinações cadastradas em `visual.viewports`. Um ID inexistente falha, lista os valores válidos e não seleciona outro cenário silenciosamente.

IDs estáveis de categoria: `foundations`, `cards`, `education`, `pne`, `finance`, `navigation`, `tables`, `charts` e `states`. Títulos visíveis não são localizadores.

Atualização explícita:

```powershell
npm run test:dev-ui:visual:update
npm run test:dev-ui:visual:update -- --scenario cards-explorable-states --viewport mobile
```

O comando normal nunca grava baselines. Quando falta uma referência, ele falha e informa o comando de criação para a combinação exata.

## Abertura direta e área de captura

O catálogo interpreta query strings próprias, sem compartilhar `src/app/appHash`, hashes ou rotas públicas:

```text
http://localhost:5174/?scenario=cards-explorable-states&viewport=notebook
http://127.0.0.1:4175/?scenario=cards-explorable-states&viewport=notebook&visual=1
```

`visual=1` é exclusivo do harness: remove o shell do catálogo, preserva o viewport real do navegador e renderiza somente o canvas capturável. IDs ou viewports inválidos produzem erro explícito com as opções válidas.

Seletores estáveis:

```text
[data-testid="catalog-preview"]
[data-testid="catalog-component"]
[data-scenario-id="cards-explorable-states"]
[data-catalog-ready="true"]
```

O alvo padrão é `catalog-preview`. `captureTarget: "component"` pode selecionar o wrapper interno sem o padding do canvas. Fundo, padding e largura são definidos pelo catálogo; shell, ruler, cursor e foco acidental ficam fora da imagem.

## Metadados e novos cenários

O registro do catálogo é a única lista de cenários. Para participar da suíte, acrescente a configuração opcional ao `CatalogScenario`:

```ts
{
  id: 'education-detail',
  category: 'Educação',
  title: 'Detalhe e séries históricas',
  visual: {
    enabled: true,
    viewports: ['notebook'],
    captureTarget: 'preview',
    maxDiffRatio: 0.002,
  },
}
```

`captureTarget` e `maxDiffRatio` são opcionais. A tolerância padrão deve ser mantida salvo evidência reproduzível. O modo Fluido continua somente para inspeção manual.

Primeiro baseline:

1. Confirme que o ID é exclusivo e independe do título visível.
2. Use fixture pequena, literal, tipada, sem data atual, aleatoriedade, rede ou loader municipal.
3. Cadastre somente os viewports que acrescentam cobertura responsiva real.
4. Execute o comando normal e confirme a falha por baseline ausente.
5. Execute `test:dev-ui:visual:update` com `--scenario` e `--viewport`.
6. Revise o PNG em `tests/dev-ui-visual/baselines`: conteúdo, recorte, overflow, fontes e estados.
7. Execute novamente o comando normal.

Não renomeie IDs depois da criação de baselines sem migração intencional dos PNGs.

## Estabilização e determinismo

Antes da captura, catálogo e harness aguardam:

- React montar o cenário;
- `document.fonts.ready`;
- imagens internas concluírem carga ou erro;
- três frames consecutivos com dimensões estáveis;
- `data-catalog-ready="true"`;
- dois frames adicionais antes da medição final.

O Playwright usa `reducedMotion: "reduce"`; `visual=1` desabilita animações, transições, caret, cursor e scroll suave somente no catálogo. A captura também usa `animations: "disabled"`. O timeout é limite de falha, não o mecanismo de sincronização.

Não introduza `setTimeout` para esconder instabilidade, não aumente tolerância para fazer uma diferença passar e não altere componentes públicos apenas para coincidir com uma imagem.

## Comparação, artefatos e atualização legítima

A comparação reutiliza os critérios da suíte pública: tolerância de 20 por canal e limite padrão de 0,2% de pixels divergentes. Diferença de largura ou altura sempre falha.

```text
tests/dev-ui-visual/
  baselines/  # versionado
  results/    # ignorado; captura atual
  diffs/      # ignorado; atual, esperado e diff em falhas
```

O diagnóstico informa cenário, viewport, dimensões obtidas e esperadas, pixels divergentes, percentual, limite, caminhos e comando de atualização da combinação exata.

Uma atualização é legítima somente quando a mudança visual foi intencional, está no escopo aprovado e o PNG foi revisado. Fonte ausente, loading involuntário, animação, cursor, foco, relógio, rede, fixture aleatória ou ambiente instável devem ser corrigidos, não aceitos.

## Isolamento e segurança contra fragilidade

O harness inicia `vite.dev-ui.config.ts` uma vez na porta 4175, reutiliza navegador e página sequencialmente e reinicia estado por URL direta. Ele falha diante de requisição `*/data/*.json`; o resumo deve registrar `municipalRequests=0`.

```powershell
npm run test:dev-ui
npm run build
Get-ChildItem dist -Recurse | Select-String -Pattern "dev-ui|Catálogo visual"
```

O último comando não deve encontrar conteúdo. Nenhum artefato da suíte pode ser gravado em `public` ou `dist`.

Para evitar fragilidade: localize por ID e `data-testid`; mantenha fixtures determinísticas; aguarde marcadores reais; use poucos viewports de alto valor; preserve diferenças de dimensão; não paralelize capturas sem evidência; atualize somente a seleção revisada.

## Matriz inicial

A matriz inicial contém 17 cenários e 26 baselines. Ela cobre fundamentos e tipografia; zero, ausência, texto longo e valores grandes; cards de Educação, PNE e Financiamento; busca, grupos, detalhe, demanda e projeção; filtros, abas e submenu; tabelas, ausência e overflow; gráficos completos, parciais, nulos e sem dados; loading, erro e vazio.

Viewports: Desktop 1366 px, Notebook 1024 px e Mobile 390 px. `finance-summary-states` e `states-interaction` continuam no catálogo manual, sem baseline por sobreporem estados já cobertos.

## Fluxo recomendado

1. Execute o cenário isolado.
2. Altere o componente.
3. Execute o cenário novamente.
4. Revise o diff.
5. Atualize o baseline somente se a mudança for intencional.
6. Execute o E2E relevante.
7. Execute a regressão visual completa antes do commit.

Futuros agentes do Codex devem ler `AGENTS.md`, `docs/GUIA_DE_DESIGN.md`, `docs/PLANO_MIGRACAO_UI.md`, `src/dev-ui/AGENTS.md` e este documento antes de mudar catálogo, metadados ou baselines.
