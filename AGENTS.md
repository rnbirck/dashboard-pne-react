# Regras do repositório

## Política de execução e validação pelo Codex

Esta política controla o desenvolvimento iterativo local pelo Codex e prevalece
sobre matrizes de QA, checklists e fluxos de validação descritos em documentos
subordinados. Os scripts continuam disponíveis sob demanda, e verificações que
ocorram automaticamente em PRs ou publicação não devem ser removidas ou
enfraquecidas.

### 1. Modo rápido — padrão

Solicitações comuns de implementação, incluindo “ajuste”, “altere”, “aplique”,
“corrija” e “modifique”, usam o modo rápido, salvo pedido explícito de validação.

No modo rápido:

- implemente somente a alteração solicitada;
- não execute `lint`, `typecheck`, `build`, testes unitários ou de integração;
- não execute E2E, Playwright, regressão visual ou geração de screenshots;
- não execute suítes completas, `git diff --check` ou outras verificações
  repetitivas de Git;
- não crie commit nem faça push;
- não revise novamente áreas não relacionadas;
- não corrija problemas preexistentes ou fora do escopo.

O Codex pode inspecionar o diff e os arquivos diretamente relacionados somente
quando isso for necessário para preservar o escopo. Ao terminar, informe
exatamente: “Validações não executadas, conforme o modo rápido padrão do
projeto.”

### 2. Validação rápida — somente mediante pedido explícito

Ative este modo apenas com expressões como “valide rapidamente”, “faça uma
verificação rápida”, “teste apenas esta alteração” ou “verifique visualmente esta
página”. Execute somente a menor validação diretamente relacionada: um
componente ou página, um teste específico, um único viewport quando vários não
forem pedidos, ou uma única captura. Não amplie para outros módulos.

### 3. Validação completa — somente mediante pedido explícito

Ative este modo apenas com expressões como “faça a validação completa”, “rode
todos os testes”, “prepare para commit”, “prepare para PR”, “prepare para
publicação” ou “feche este lote de alterações”. Execute a suíte completa uma
única vez ao final do lote, sem repeti-la entre correções. Preparar para commit ou
PR não autoriza criar commit, fazer push ou abrir PR sem pedido explícito para a
respectiva ação.

### 4. Alterações compartilhadas ou de maior risco

Mesmo quando a alteração afetar componente compartilhado, arquitetura,
cálculos, pipeline ou regras de negócio, não execute validações automaticamente.
Implemente o solicitado e informe: “Esta alteração afeta uma área compartilhada;
recomenda-se validação completa ao encerrar o lote.” A execução ainda depende de
pedido explícito.

### 5. Preservação da infraestrutura

- não apague testes existentes;
- não remova scripts de validação;
- não desative nem enfraqueça workflows de CI, PR ou publicação;
- mantenha os comandos disponíveis para validação sob demanda;
- aplique esta política somente à execução local pelo Codex durante o
  desenvolvimento iterativo.

## Governança do sistema visual

Para toda decisão, implementação ou revisão visual, a hierarquia abaixo é obrigatória:

1. `AGENTS.md`: regras de processo e de escopo.
2. `docs/GUIA_DE_DESIGN.md`: decisões visuais aprovadas e permanentes.
3. `src/styles/design-tokens.css`: valores visuais canônicos.
4. `src/styles/platform-ui.css` e componentes compartilhados: implementação de referência da gramática comum.
5. Estilos específicos de módulo: exceções justificadas por composição ou conteúdo.
6. `src/App.css`: legado ativo; não é referência para novos padrões.
7. `docs/PLANO_MIGRACAO_UI.md`: inventário, pendências e acompanhamento; não cria regra visual nova.
8. `docs/historico-ui/`: auditorias e propostas preservadas como contexto, sem força normativa.

Quando houver divergência, o guia define a intenção aprovada e a implementação define o comportamento atual. A diferença deve ser registrada no plano de migração, nunca resolvida silenciosamente por uma auditoria histórica.

## Alterações visuais e de experiência

Toda criação ou alteração de interface deve, antes da implementação:

1. Consultar `docs/GUIA_DE_DESIGN.md` e verificar pendências relacionadas em `docs/PLANO_MIGRACAO_UI.md`.
2. Reutilizar os tokens de `src/styles/design-tokens.css`, a gramática de `src/styles/platform-ui.css` e os componentes compartilhados existentes.
3. Verificar se já existe componente, variante ou padrão equivalente antes de criar outro.
4. Evitar estilos inline, valores visuais locais e seletores CSS duplicados quando um token ou componente puder resolver o caso.
5. Tratar estilos específicos como exceções justificadas; não reproduzir neles a gramática base de controles, cards, tipografia ou estados.
6. Não usar `src/App.css` como ponto de partida para novos padrões. Toda alteração inevitável nele deve ser associada a uma pendência do plano de migração.
7. Atualizar o guia somente quando houver nova decisão visual reutilizável e aprovada; atualizar o plano quando houver mudança de estado, evidência ou consumidor de uma pendência.
8. Não alterar dados, JSONs, cálculos, filtros, regras de negócio ou conteúdo analítico durante tarefas exclusivamente visuais.

Ao implementar uma alteração visual, considere no escopo e no código afetado:

- desktop e notebook como prioridades, além de tablet e celular;
- navegação por teclado e foco visível;
- contraste e legibilidade;
- carregamento, ausência de dados, erro, textos longos e valores grandes.

A execução de viewports, testes, lint, build, E2E, regressão visual ou capturas
segue exclusivamente os modos de validação acima e depende de pedido explícito.
