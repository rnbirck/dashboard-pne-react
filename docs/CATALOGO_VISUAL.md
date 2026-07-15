# Catálogo visual de desenvolvimento

## Finalidade

O catálogo visual é uma aplicação Vite interna para ajustar e inspecionar componentes reais do Dashboard PNE em cenários controlados. Ele funciona sem seleção de município, sem navegação pelas rotas públicas, sem APIs externas e sem leitura dos JSONs de `public/data`.

O catálogo não é uma página pública, uma biblioteca visual paralela nem um substituto dos testes E2E e de regressão visual. Sua função é reduzir o tempo entre uma mudança de UI e a inspeção de cards, controles, tabelas, gráficos, textos extremos e estados do sistema.

## Como executar

```powershell
npm run dev:ui
```

O servidor usa a configuração `vite.dev-ui.config.ts` e abre somente a raiz `dev-ui`. A aplicação pública continua sendo iniciada por `npm run dev`.

Validação automatizada:

```powershell
npm run test:dev-ui
```

Regressão visual isolada e seletiva:

```powershell
npm run test:dev-ui:visual
npm run test:dev-ui:visual -- --scenario cards-explorable-states --viewport notebook
npm run test:dev-ui:visual -- --category education
```

Baselines só são gravados por `npm run test:dev-ui:visual:update`. Consulte [REGRESSAO_VISUAL_DEV_UI.md](REGRESSAO_VISUAL_DEV_UI.md) para filtros, matriz, estabilização, diagnóstico e atualização.

## Estrutura

```text
dev-ui/
  index.html
  main.tsx                 # bootstrap mínimo exigido pelo root isolado do Vite

src/dev-ui/
  AGENTS.md
  main.tsx                 # entrada React do catálogo
  ComponentCatalog.tsx     # shell, navegação e largura do preview
  catalog.css              # somente estilos da ferramenta
  types.ts
  components/
  fixtures/
  scenarios/

vite.dev-ui.config.ts
tsconfig.dev-ui.json
scripts/checks/dev-ui-test.mjs
```

## Isolamento técnico

O catálogo usa `root: "dev-ui"` e `publicDir: false` em uma configuração Vite exclusiva. Por isso:

- `npm run dev:ui` serve a entrada `dev-ui/index.html`;
- `npm run dev` continua usando `index.html` e `src/main.jsx`;
- `npm run build` continua usando `vite.config.js` e não conhece a entrada do catálogo;
- nenhum arquivo de `public`, inclusive `public/data`, é copiado para o build isolado;
- o catálogo não aparece em rota ou hash da aplicação pública;
- os imports do catálogo são unidirecionais: `src/dev-ui` reutiliza código público, mas o código público nunca importa `src/dev-ui`.

O teste `test:dev-ui` compila o catálogo em `artifacts/dev-ui-build`, renderiza a página com Playwright, confirma as categorias registradas e a ausência de requisições a `/data/`. Depois executa um build público temporário e falha se encontrar nomes, caminhos ou conteúdo do catálogo no resultado. Os diretórios temporários são removidos ao final.

O harness visual inicia somente `vite.dev-ui.config.ts` na porta 4175. Ele abre cada cenário por `?scenario=<id>&viewport=<id>&visual=1`, captura `[data-testid="catalog-preview"]`, aguarda `[data-catalog-ready="true"]` e falha se observar requisições `*/data/*.json`.

Para uma confirmação manual adicional:

```powershell
npm run build
Get-ChildItem dist -Recurse | Select-String -Pattern "dev-ui|Catálogo visual"
```

O comando não deve encontrar ocorrências.

## Como criar uma fixture

1. Defina ou reutilize uma interface em `src/dev-ui/fixtures`.
2. Crie um objeto pequeno com identificador e descrição explícitos.
3. Use somente valores literais e funções puras determinísticas.
4. Modele zero como `0`; modele ausência como `null`, série vazia ou propriedade de disponibilidade, conforme o contrato real.
5. Inclua somente as propriedades exigidas pelo componente, selector ou view model reutilizado.
6. Nunca importe um loader municipal para produzir a fixture.

Exemplo:

```tsx
const fixture: Fixture<YearValue[]> = {
  id: 'serie-parcial',
  description: 'Dois anos sem observação.',
  value: [
    { ano: 2022, valor: 81.4 },
    { ano: 2023, valor: null },
    { ano: 2024, valor: 84.2 },
  ],
}
```

Não use `Math.random()`, relógio do sistema, rede ou arquivos de dados reais.

## Como adicionar um cenário

1. Escolha o arquivo de domínio em `src/dev-ui/scenarios`.
2. Crie um `CatalogScenario` com `id`, categoria, título, descrição, objetivo, estados e função `render`.
3. Use `ScenarioGrid` e `ScenarioItem` apenas como moldura do catálogo.
4. Renderize o componente real dentro da moldura e forneça uma fixture tipada.
5. Adicione o conjunto de cenários ao registro em `scenarios/index.ts` se criar um novo arquivo.
6. Se o cenário agregar cobertura visual, configure `visual.enabled` e somente os viewports relevantes.
7. Execute `npm run test:dev-ui` e o cenário isolado com `npm run test:dev-ui:visual -- --scenario <id>`.

Wrappers locais são adequados para estado interativo, providers mínimos ou adaptação de props. Não copie o JSX original para simular o componente.

## Componentes e cenários cobertos

- Fundamentos: tokens semânticos, tipografia, prosa longa, números e unidades.
- Cards: `MetricCard`, `EducationSummaryCard`, `StatCard`, `EducationIndicatorCard` e `FinancialIndicatorCard`.
- Educação: busca, agrupamento, detalhe, série completa, parcial e ausente, metodologia, demanda e projeções.
- PNE: `MetaCard` para 2014–2024 e 2026–2036.
- Financiamento: cards de FUNDEB, VAAR, SIOPE e PNATE, faixa de métricas, seleção e desabilitação.
- Filtros e navegação: `SearchField`, `CategoryTabs`, `SegmentedControl` e `SidebarAccordionGroup`.
- Tabelas: `EducationTable`, overflow, valores extremos, vazio e loading.
- Gráficos: `EducationLineChart`, `EducationBarChart`, `EducationStackedBarChart`, legenda, escala, ausência, loading e erro.
- Estados: `ContentState`, `LoadingState`, `ErrorState`, `StatusBadge` e expansão progressiva.

## Larguras de preview

O catálogo oferece Desktop (1366 px), Notebook (1024 px), Mobile (390 px) e Fluido. A largura é aplicada a um canvas delimitado e rolável. Adaptações de grade estritamente locais ajudam a leitura rápida no canvas móvel.

Media queries continuam respondendo ao viewport real do navegador, não ao tamanho de um elemento interno. Portanto, o seletor não substitui a validação nas viewports reais de 1366×768, 1280×720, 1024×768, 768×1024, 390×844 e 320×568.

## O que validar no catálogo

A regressão isolada abre o modo sem shell em viewports reais. Ela complementa, mas não substitui, a validação da composição pública em E2E e `test:visual`.

Use o catálogo para alterações em tokens, tipografia, cards, badges, valores grandes, textos longos, controles, foco, tabelas, gráficos, loading, erro, vazio, ausência, seleção, desabilitação e expansão.

Continue usando E2E e regressão visual para shell completo, seleção de município, rotas e hashes, restauração de foco entre páginas, carregamento real, integração entre domínios, viewport real, overflow do documento, impressão, fontes, diferenças pixel a pixel e contratos de dados.

## Orientação para futuros agentes do Codex

Leia primeiro `AGENTS.md`, `docs/GUIA_DE_DESIGN.md`, `docs/PLANO_MIGRACAO_UI.md`, `src/dev-ui/AGENTS.md` e `docs/REGRESSAO_VISUAL_DEV_UI.md`. Procure um componente ou cenário equivalente antes de criar outro. Preserve a direção de dependência e confirme o isolamento com `npm run test:dev-ui`, `npm run test:dev-ui:visual` e `npm run build` antes de concluir qualquer mudança visual.
