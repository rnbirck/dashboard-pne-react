---
status: reference
scope: "Índice da documentação vigente do repositório"
last_validated: 2026-07-17
read_when: "Antes de procurar regras, arquitetura, testes ou metodologia"
supersedes: []
---

# Documentação

Comece por `AGENTS.md` para processo e escopo e por `PRODUCT.md` para público, propósito e princípios. Depois leia somente o documento relacionado à mudança.

| Documento | Status | Escopo | Fonte de verdade para | `read_when` | Substitui | Não leia quando |
| --- | --- | --- | --- | --- | --- | --- |
| [`../PRODUCT.md`](../PRODUCT.md) | normativo | Produto | Público, propósito e princípios | A decisão afeta prioridade, linguagem ou acessibilidade | — | A tarefa é puramente operacional |
| [`architecture/frontend.md`](architecture/frontend.md) | referência | Frontend | Fronteiras, rotas e carregamento | A mudança é estrutural em `src/` | Arquitetura anterior | A tarefa é só fórmula do pipeline |
| [`ui/GUIDE.md`](ui/GUIDE.md) | normativo | UI | Decisões visuais | A mudança cria ou altera interface | Guia, design system e decisões do plano | A tarefa não altera UI |
| [`ui/TESTING.md`](ui/TESTING.md) | referência | Testes de UI | Catálogo, harness e regressão | É preciso escolher ou operar cobertura visual | Catálogo e regressão anteriores | A tarefa não toca UI |
| [`ui/BACKLOG.md`](ui/BACKLOG.md) | backlog | UI | Pendências abertas | A mudança toca dívida visual existente | Itens abertos do plano | Para conhecer regras aprovadas |
| [`methodology/README.md`](methodology/README.md) | referência | Dados | Roteamento metodológico | A tarefa altera indicador, tendência ou estado | Auditorias metodológicas | A tarefa é só apresentação |
| [`methodology/data-gaps.md`](methodology/data-gaps.md) | backlog | Dados | Lacunas e validações | Falta insumo ou há divergência | Pendências e auditorias antigas | O método já está comprovado |
| [`../data_pipeline/AGENTS.md`](../data_pipeline/AGENTS.md) | instrução | Pipeline | Restrições locais | A tarefa toca exportação, fórmula ou JSON | — | A tarefa fica fora do pipeline |

`README.md` permanece como manual de execução. Documentos históricos e evidências datadas não fazem parte da árvore ativa; o histórico Git é a fonte de recuperação.
