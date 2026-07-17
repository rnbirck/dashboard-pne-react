---
status: normative
scope: "Referência estadual do Rio Grande do Sul para o PNE 2026–2036"
last_validated: 2026-07-17
read_when: "Ao alterar agregação, infraestrutura, expansão, projeção ou comparação estadual do ciclo vigente"
supersedes: "Documento metodológico anterior da referência estadual do ciclo vigente"
---

# Referência estadual — PNE 2026–2036

## Artefato e chaves

`public/data/pne_2026_2036/referencia_estadual.json` é gerado sobre o universo fixo de 497 municípios e contém `registry`, `indicators`, `projections` e `totals_audit`. O registro executável fica em `data_pipeline/src/pne_state_reference.py`.

Chaves comparáveis atuais:

- atendimento/EPT: `creche`, `pre_escola`, `basico_6_17`, `basico_15_17`, `basico_integral`, `escolas_integral`, `eja_integrada_educacao_profissional_percentual`, `medio_tecnico_articulado_percentual`, `medio_tecnico_participacao_publica` e `subsequente_expansao`;
- docentes: `pos_graduacao` e `temporarios`;
- infraestrutura: `internet`, `internet_alunos`, `internet_aprendizagem`, `internet_comunidade`, `acesso_internet_computador`, `acesso_internet_disp_pessoais`, `rede_local`, `rede_wireless`, `banda_larga`, `educacao_ambiental`, `desktop_aluno`, `comp_portatil_aluno`, `tablet_aluno`, `conselho_escolar`, `proposta_pedagogica`, `salas_climatizadas` e `salas_acessiveis`;
- população: `alfabetizacao_pop_15_mais`, `fundamental_concluido_18_mais`, `fundamental_concluido_15_29`, `medio_concluido_18_mais` e `medio_concluido_18_29`.

## Fórmulas, fontes e granularidade

Taxas agregáveis usam razão de somas:

```text
Referência RS (ano) = 100 × Σ numeradores válidos / Σ denominadores válidos
```

Não se calcula média municipal. A entrada é município/ano para atendimento, EJA, EPT e docentes; escola/ano para infraestrutura; snapshot censitário em 2010 e 2022 para escolaridade da população. Fontes: Censo Escolar e Sinopse do INEP, população oficial por idade e Censo Demográfico, conforme metadados do registro.

Regras especiais:

- `escolas_integral` classifica escola a escola pelo corte de 25%; depois agrega.
- Infraestrutura preserva o universo e filtros do indicador municipal; cobertura do denominador usa escolas ou salas elegíveis, não municípios.
- `medio_tecnico_participacao_publica` agrega totais estaduais, acumula somente expansões anuais positivas e usa base histórica 2015.
- `subsequente_expansao` calcula `(total do ano / total de 2015 - 1) × 100`, com base exata.
- Projeções usam numerador e denominador da série estadual agregada, nunca média de projeções municipais; snapshots censitários e `medio_tecnico_articulado_percentual` não são projetados.

A série observada atual termina em 2025 para fontes anuais. A apresentação municipal do ciclo usa 2025 como ponto de partida, mas a metodologia estadual de expansão retém 2015 como base histórica; a interpretação conjunta depende da validação registrada em `data-gaps.md`.

## Nulos e comparabilidade

Nulo não é zero; par incompleto é excluído; denominador zero gera `null`; arredondamento é só apresentação. Cada ponto registra cobertura municipal e do denominador. A UI só mostra Município vs RS quando chave, ano final, fonte, filtros, unidade e universo são comparáveis.

Entradas `methodology_pending` permanecem sem série estadual: `aee`, `alfabetizacao`, `eja_integrada_educacao_profissional` absoluta, `rendimento_magisterio`, três indicadores de idade regular, três de adequação e seis de SAEB. A chave percentual de EJA é comparável; não confundi-la com a absoluta.

## Fluxo, consumidores e testes

- Registro/agregação: `data_pipeline/src/pne_state_reference.py`.
- Fonte por escola: `queries/infraestrutura_escolar_referencia.sql`, `src/data/repository.py` e `src/data_loader.py`.
- Exportação: `scripts/export_static_data.py` e `partition_static_data.py`.
- UI: `src/data/staticData.js`, `src/utils/stateReference.js`, `src/pages/CyclePage.jsx` e `src/components/MetaCard.jsx`.
- Testes: `data_pipeline/tests/test_pne_state_reference.py`, `npm run check:state-reference`, `npm run check:state-json` e checks integrados de build/UI.

`totals_audit` registra divergências sem forçar igualdade. As duas pendências atuais desse bloco — docentes e ausência de comparador populacional — estão em `data-gaps.md`.
