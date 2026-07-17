---
status: backlog
scope: "Pendências de UI comprovadamente abertas"
last_validated: 2026-07-17
read_when: "Quando uma mudança toca dívida visual existente"
supersedes: "Itens abertos do plano de migração de UI encerrado"
---

# Backlog de UI

Este arquivo contém somente trabalho ainda aberto. Decisões permanentes pertencem a `GUIDE.md`; entregas encerradas permanecem no histórico Git.

| ID | Problema | Estado atual | Resultado esperado | Critério de aceite | Dependências | Status |
| --- | --- | --- | --- | --- | --- | --- |
| UI-LEGACY-001 | `src/App.css` ainda concentra legado ativo. | Há consumidores públicos e compatibilidade deliberada do catálogo; não existe evidência segura para remoção ampla. | Regras migradas por bloco para a camada canônica adequada, sem duplicação nova. | Consumidores mapeados; somente regras com destino comprovado são movidas; arquitetura, catálogo, E2E e visual passam sem mudança de DOM ou aparência fora do escopo. | Tarefa visual própria e revisão dos consumidores. | aberto |

Não há outra pendência visual comprovada no antigo plano de migração. Adicione item apenas com consumidor atual, risco observável e aceite verificável.
