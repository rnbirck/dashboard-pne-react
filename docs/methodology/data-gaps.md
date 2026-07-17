---
status: backlog
scope: "Lacunas de dados, divergências e validações humanas ainda necessárias"
last_validated: 2026-07-17
read_when: "Quando uma fonte, comparação ou relação legal não pode ser afirmada com segurança"
supersedes: "Pendências de dados, auditoria legal e estudo de viabilidade anteriores"
---

# Lacunas e validações pendentes

Este é um backlog metodológico, não autorização para preencher dados. `needs-validation` exige decisão humana ou conferência oficial; `blocked-source` exige novo insumo bruto seguro.

| ID | Estado | Evidência atual | Para encerrar |
| --- | --- | --- | --- |
| DATA-LEGAL-001 | `needs-validation` | `src/data/pne2026LegalGoalIndicatorMap.js` declara `validatedAgainstOfficialLaw: false`. Em 2026-07-17, o código contém 73 metas, 27 com alguma relação e 46 sem relação; há 42 relações: 16 diretas, 20 parciais e 6 aproximadas. | Revisão humana linha a linha contra a Lei nº 15.388/2026, com justificativa de cada relação e atualização do metadado. |
| DATA-EPT-BASE-001 | `needs-validation` | A referência estadual de `medio_tecnico_participacao_publica` agrega expansões positivas desde 2015 (`pne_state_reference.py`), enquanto a apresentação do ciclo usa 2025 como `BASELINE_YEAR` (`src/utils/pneAccumulativeCycle.js`). São escopos distintos, mas a leitura Município vs RS pode sugerir equivalência. | Validar semanticamente se a comparação deve manter base histórica estadual, alinhar períodos ou explicitar a diferença na UI. |
| DATA-EJA-SOURCE-001 | `needs-validation` | O sincronizador detecta quadros EJA 1.34/1.35/1.49 por edição, mas o texto de fonte publicado no pipeline resume “EJA 1.35”. | Conferir as edições oficiais e aprovar uma atribuição anual ou um rótulo genérico sem numeração fixa. |
| DATA-STATE-DOC-001 | `needs-validation` | `totals_audit` de 2025 registra 134.950 docentes na fonte de pós-graduação e 161.461 no registro por escola, divergência de -26.511. | Identificar universo, filtros e granularidade das duas fontes; não forçar igualdade. |
| DATA-STATE-POP-001 | `blocked-source` | O total populacional de 0–3 anos de 2025 não possui segunda publicação independente no pipeline para reconciliação. | Incorporar comparação oficial equivalente, com mesmo recorte e ano. |
| DATA-AGE-001 | `blocked-source` | `idade_regular_quinto`, `idade_regular_nono` e `idade_regular_medio` têm taxa derivada, mas não contagens brutas seguras. | Disponibilizar, por ano/município/etapa, alunos em idade regular, total elegível e taxa validada. |
| DATA-SAEB-001 | `blocked-source` | Há médias e percentuais de proficiência, mas não participantes por nível nem total avaliado para agregação estadual. | Disponibilizar contagens por ano, município, componente, etapa e dependência quando aplicável. |
| DATA-IDEB-001 | `blocked-source` | IDEB é índice; o pipeline não possui componentes brutos compatíveis para referência estadual. | Disponibilizar IDEB, aprendizado/proficiência, fluxo/aprovação e definição oficial de composição por recorte. |
| DATA-REND-001 | `blocked-source` | O indicador municipal `rendimento_magisterio` já usa `rendimento_professores_razao_percentual.razao_percentual_remuneracao_media`. A referência estadual continua `methodology_pending` porque não há rendimentos componentes agregáveis. | Disponibilizar remuneração média do magistério, grupo comparador, pesos/universos e fórmula estadual validada. |

## Bloqueios atuais das referências estaduais

No ciclo 2014–2024, permanecem `methodology_pending`: `alfabetizacao`, três IDEBs, três adequações, `rendimento_magisterio`, `escolaridade_media_18_29`, `razao_escolaridade_racial_18_29`, `medio_tecnico_total` e `medio_tecnico`. Duas chaves censitárias de escolaridade 6–14/15–17 estão `unavailable` no export atual.

No ciclo 2026–2036, além dos grupos acima aplicáveis, `aee`, a chave absoluta `eja_integrada_educacao_profissional` e seis indicadores SAEB permanecem `methodology_pending`. A chave `eja_integrada_educacao_profissional_percentual` já é comparável.

Regras permanentes: não inventar numerador ou denominador; não derivar privada como total − pública sem contrato; não tratar percentual como contagem; não usar média de médias ou de índices; não converter ausência em zero; dados complementares não alteram a fórmula principal.
