# Regras do repositório

## Alterações visuais e de experiência

Toda criação ou alteração de interface deve, antes da implementação:

1. Consultar `docs/GUIA_DE_DESIGN.md`.
2. Reutilizar os tokens de `src/styles/design-tokens.css` e os componentes compartilhados existentes.
3. Verificar se já existe componente, variante ou padrão equivalente antes de criar outro.
4. Evitar estilos inline, valores visuais locais e seletores CSS duplicados quando um token ou componente puder resolver o caso.
5. Preservar a consistência de navegação, tipografia, espaçamento, cores, estados, gráficos, tabelas, responsividade e acessibilidade com o restante da plataforma.
6. Atualizar `docs/GUIA_DE_DESIGN.md` somente quando uma nova decisão visual reutilizável for realmente necessária; ajustes pontuais não justificam novo padrão.
7. Não alterar dados, JSONs, cálculos, filtros, regras de negócio ou conteúdo analítico durante tarefas exclusivamente visuais.

Antes de concluir uma alteração visual, validar no mínimo:

- desktop, tablet e celular;
- navegação por teclado e foco visível;
- contraste e legibilidade;
- carregamento, ausência de dados, erro, textos longos e valores grandes;
- lint, build e testes relevantes.

