# Regras do repositório

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

Antes de concluir uma alteração visual, validar no mínimo:

- desktop e notebook como prioridades, além de tablet e celular;
- navegação por teclado e foco visível;
- contraste e legibilidade;
- carregamento, ausência de dados, erro, textos longos e valores grandes;
- lint, build e testes relevantes.
