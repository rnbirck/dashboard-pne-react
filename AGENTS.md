# Regras do repositório

Execute a solicitação diretamente e mantenha o escopo sob controle.

- Faça o menor conjunto coerente de mudanças que entregue o resultado pedido.
- Preserve arquitetura, interfaces, comportamento e alterações locais não relacionadas.
- Não transforme uma tarefa focada em redesign, refatoração, auditoria ampla ou nova documentação.
- Não altere dados, fórmulas, filtros, JSONs gerados ou regras de negócio fora do escopo explícito.
- Pergunte somente quando faltar uma decisão indispensável ou houver risco material de perda de dados.
- Use validação proporcional ao risco e pare quando o resultado solicitado estiver implementado.

Ao formular uma tarefa, use:

```text
Task: resultado a alterar
Scope: tela, módulo, arquivo ou comportamento relevante
Success: resultado observável que encerra o trabalho
```

## Roteamento

- Setup, execução e fluxo geral: `README.md`.
- Produto, público e princípios: `PRODUCT.md`.
- Índice e leitura recomendada: `docs/README.md`.
- Mudança visual: `PRODUCT.md` e `docs/ui/GUIDE.md`; pendências abertas: `docs/ui/BACKLOG.md`.
- Catálogo e regressão: `src/dev-ui/AGENTS.md` e `docs/ui/TESTING.md`.
- Frontend estrutural: `src/AGENTS.md` e `docs/architecture/frontend.md`.
- Pipeline: `data_pipeline/AGENTS.md` e a metodologia em `docs/methodology/README.md`; lacunas: `docs/methodology/data-gaps.md`.
- Migrações manuais: `scripts/migrations/README.md`.

Histórico é recuperado pelo Git e nunca faz parte da leitura padrão.

Para UI, reutilize tokens, CSS canônico e componentes existentes; `src/App.css` é legado, não referência. Para dados, edite a fonte do pipeline e nunca `public/data` manualmente. Antes da entrega, execute os checks relevantes e `git diff --check`.
