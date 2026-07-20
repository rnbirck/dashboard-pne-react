# Metodologia — EJA articulada à educação profissional

## Objetivo e escopo

Reconstruir e reintroduzir no acompanhamento municipal dos ciclos PNE 2014–2024 e PNE 2026–2036 o indicador **Percentual das matrículas da EJA articuladas à educação profissional**, preservando a contagem absoluta já consumida pela área de Indicadores educacionais.

A fonte exclusiva é a Sinopse Estatística da Educação Básica do Inep. O denominador vem da planilha **EJA 1.35**. O numerador vem da planilha **Educação Profissional 1.30** até 2024 e da planilha **Educação Profissional 1.42** em 2025.

## Auditoria curta da implementação anterior

- A tabela `eja_integrada_educacao_profissional` já cobre 2014–2025, com 497 códigos IBGE distintos por ano e sem duplicidades.
- A estrutura anterior já continha `ano`, `id_municipio`, `mat_eja_total`, os três componentes do numerador, os respectivos recortes por dependência, a contagem total armazenada e um percentual armazenado. A correção acrescenta os totais oficiais `mat_eja_fundamental_total` e `mat_eja_medio_total` e suas dependências à mesma tabela, sem duplicá-la.
- A consulta `data_pipeline/queries/eja_integrada_educacao_profissional.sql` já recalcula a contagem integrada pela soma dos três componentes, mas usa `COALESCE`, o que pode converter componente ausente em zero.
- O ciclo 2014–2024 usa o percentual previamente armazenado e permite atalho por métrica pré-computada. O ciclo 2026–2036 usa a mesma chave interna para uma contagem absoluta informativa, sem acompanhamento de meta.
- A chave existente também é consumida como número absoluto pelo catálogo de Indicadores educacionais. Alterar sua unidade silenciosamente quebraria esse consumidor.
- Os grupos temáticos e os mapas legais já conhecem a EJA articulada, mas o mapa da Meta 12.c a classifica como aproximação e a regra de contexto/proxy oculta a distância de meta.
- O detalhe existente prioriza contagem absoluta e só expõe componentes percentuais no ciclo encerrado.
- O sincronizador existente da Sinopse cobre EPT de nível médio, porém depende de posições fixas de colunas. Esta reconstrução exige resolução semântica dos cabeçalhos.
- Na base auditada, a contagem integrada armazenada coincide com a soma dos três componentes e o percentual armazenado coincide com o recálculo. Há muitos denominadores zero; eles não podem ser exportados como 0%. Há também municípios com denominador positivo e numerador zero, que constituem 0% válido.

## Fórmula canônica

Para cada par único de `ano` e `id_municipio`:

```text
numerador =
  mat_eja_curso_tecnico_integrada
  + mat_eja_fic_integrado_fundamental
  + mat_eja_fic_integrado_medio

denominador = mat_eja_fundamental_total
  + mat_eja_medio_total

indicador = 100 × numerador / denominador
```

O quadro municipal da Sinopse abre o Total da EJA em **Ensino Fundamental — Total** e **Ensino Médio — Total**, além das dependências Federal, Estadual, Municipal e Privada de cada etapa. O sincronizador localiza todos esses campos pelos textos normalizados dos cabeçalhos; não usa letras nem posições fixas. O denominador usa exclusivamente as duas colunas de Total. `mat_eja_total` permanece armazenado apenas para a reconciliação obrigatória `mat_eja_total = mat_eja_fundamental_total + mat_eja_medio_total`.

Nas edições oficiais auditadas, esse quadro semântico muda de numeração: EJA 1.34 em 2014–2022, EJA 1.35 em 2023–2024 e EJA 1.49 em 2025. Por isso, a seleção da aba é feita pelo título (“matrículas”, “Educação de Jovens e Adultos”, “etapa de ensino” e “dependência administrativa”), e não pelo número da planilha. A referência pública do indicador permanece conforme a convenção aprovada do produto. As dependências administrativas são usadas somente para validar cada total de etapa e nunca são somadas novamente ao denominador.

## Regras de disponibilidade e validação

1. Campo ou município ausente produz indicador indisponível, nunca zero.
2. Denominador igual a zero produz indicador indisponível.
3. Denominador positivo e numerador igual a zero produz 0% válido.
4. Valores negativos, numerador maior que denominador, total incompatível com os componentes quando disponíveis ou total incompatível com dependências são erros de validação.
5. A comparação com contagem e percentual armazenados é apenas uma conferência; os valores exibidos são sempre recalculados.
6. A série é ordenada por ano, sem duplicidades, e limitada a 2024 no ciclo encerrado e ao dado municipal mais recente no ciclo vigente.
7. Os JSONs finais são gerados exclusivamente pelo pipeline.

## Estratégia de chaves e consumidores

- `eja_integrada_educacao_profissional`: preservada como contagem absoluta complementar em Indicadores educacionais.
- `eja_integrada_educacao_profissional_percentual`: nova chave canônica do acompanhamento do PNE.
- `eja_integrada_educacao_profissional_total`: alias explícito aceito pelo pipeline para evolução futura, sem remoção imediata da chave legada absoluta.

Somente a chave percentual terá `tracks_goal: true`, direção `at_least`, meta, distância e status. Somente ela será retirada das regras de contexto/proxy.

## Semântica dos ciclos

### PNE 2014–2024 — Meta 10

- referência: 25%;
- último resultado disponível até 2024;
- status: `Meta atingida` ou `Meta não atingida`.

### PNE 2026–2036 — Meta 12.c

- referência intermediária: 25% em 2031;
- meta final: 50% em 2036;
- sem trajetória linear e sem metas anuais inferidas;
- valor municipal mais recente disponível, atualmente 2025;
- status: `Atinge a meta no momento` ou `Ainda não atinge a meta`;
- o detalhe apresenta as duas referências legais.

## Plano de execução

1. Ajustar o sincronizador específico para descobrir semanticamente o quadro municipal por etapa, extrair os totais de EJA fundamental e médio e suas dependências e reutilizar a tabela existente.
2. Endurecer a consulta SQL para preservar ausências e expor numerador, denominador e percentual recalculados.
3. Implementar uma função compartilhada de cálculo/validação e testes para ausência, denominador zero, zero válido, integração positiva e numerador inválido.
4. Substituir o consumidor percentual do ciclo 2014 e o consumidor absoluto do ciclo 2026 pela chave percentual, preservando o catálogo absoluto de Educação.
5. Atualizar grupo temático, mapas legais, fonte/metodologia, detalhes, busca, navegação e estatísticas dos ciclos.
6. Quando a validação completa for explicitamente solicitada, regenerar os JSONs
   pelo pipeline e executar uma vez a auditoria anual dos 497 municípios,
   comparação com campos armazenados, testes, lint, build e E2E. No modo rápido
   do `AGENTS.md`, nenhuma dessas validações é executada automaticamente.

## Critérios de aceite

- Uma linha por ano e código IBGE, com relatório de cobertura e ausências.
- Numerador e denominador não negativos; razão no intervalo de 0% a 100%.
- Nenhum denominador zero exportado como 0%.
- Totais de EJA e do numerador reconciliados com componentes e dependências.
- Percentual recalculado comparado ao campo legado.
- Indicador percentual presente no grupo “EJA e Educação Profissional” dos dois ciclos e associado às metas 10 e 12.c.
- Contagem absoluta preservada como informação complementar, sem mudança silenciosa de unidade.
- Fonte exibida: “INEP — Sinopse Estatística da Educação Básica, tabelas EJA 1.35 e Educação Profissional 1.30/1.42.”
