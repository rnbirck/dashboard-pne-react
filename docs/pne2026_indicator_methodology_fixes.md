# Higienizacao metodologica dos indicadores PNE 2026-2036

Data da revisao: 2026-07-09.

## Resumo executivo

Esta etapa corrigiu ou neutralizou leituras metodologicamente inseguras nos indicadores atuais do ciclo PNE 2026-2036, sem criar nova pagina de metas legais e sem alterar o layout geral. A principal correcao de formula foi em `medio_tecnico`. Os indicadores sem denominador seguro ou que funcionam apenas como proxy/contexto deixaram de exportar `distance` e `display.distance`, com excecao operacional explicita para `salas_climatizadas` e `salas_acessiveis`.

## Correcoes implementadas

### `medio_tecnico`

- Formula anterior: `mat_integrado_total / mat_ept_nivel_medio_total`.
- Problema: media a composicao interna da EPT de nivel medio, nao a participacao da educacao profissional tecnica no total do ensino medio.
- Formula adotada: `mat_profissional_tecnico / mat_medio * 100`.
- Fonte usada: base `ept_nivel_medio`, carregada da Sinopse Estatistica do Inep e exposta por `matriculas_medio_tecnico.sql`, via `load_medio_tecnico_data()`.
- Numerador: matriculas do ensino medio na forma integrada a educacao profissional tecnica (`mat_integrado_total`). A tabela `Educacao Profissional 1.30` e usada ate 2024; em 2025, o coletor usa a tabela `Educacao Profissional 1.42`.
- Denominador: total de matriculas do ensino medio (`mat_medio`).
- Nulos: um numerador ausente deixa o ano indisponivel; ele nao e convertido em 0%.
- Meta legal: o indicador integrado e contexto, sem distancia para a Meta 12.a, porque a meta tambem inclui a forma concomitante. A soma bruta de matriculas integradas e concomitantes nao e usada como percentual municipal de estudantes, pois a forma concomitante possui matriculas distintas.
- Coleta: `scripts/sync_ept_nivel_medio_from_sinopse.py` valida codigo IBGE, cobertura dos 497 municipios, unicidade e totais da UF antes de substituir um ano da tabela.
- Tratamento de denominador zero: nao houve mudanca global em `_build_ratio_result`; o tratamento foi local em `medio_tecnico`, removendo anos sem denominador valido da serie.
- Impacto medido: 12 registros municipio-ano de `medio_tecnico` tinham denominador zero, todos em Sao Pedro da Serra. O indicador ficou indisponivel para esse municipio no ciclo 2026-2036, em vez de publicar 0% artificial.

### `aee`

- Formula atual investigada: razao entre `quantidade_aee` e `total_turmas_educacao_especial`.
- Problema: a base aberta atual nao oferece denominador municipal seguro para medir diretamente todo o publico-alvo do AEE na meta 10.b.
- Decisao: rebaixado para contexto/proxy.
- Mudanca: `aee` passou a exportar `tracks_goal: false`, `meta: null`, sem `distance` e sem `display.distance`.

### Indicadores rebaixados para contexto/proxy

Os seguintes indicadores foram tratados como contexto/proxy, sem distancia de meta legal:

- `aee`
- `eja_integrada_educacao_profissional`
- `internet`
- `internet_alunos`
- `internet_aprendizagem`
- `internet_comunidade`
- `acesso_internet_computador`
- `acesso_internet_disp_pessoais`
- `rede_local`
- `rede_wireless`
- `banda_larga`
- `proposta_pedagogica`
- `desktop_aluno`
- `comp_portatil_aluno`
- `tablet_aluno`

### Indicadores mantidos com meta/distancia por decisao operacional

`salas_climatizadas` e `salas_acessiveis` foram verificados separadamente antes da decisao. A varredura dos JSONs/pipeline encontrou:

| Indicador | Valor maximo observado | Registros acima de 100% |
|---|---:|---:|
| `salas_climatizadas` | 100,0% | 0 |
| `salas_acessiveis` | 100,0% | 0 |

Como nao ha valores acima de 100%, ambos foram mantidos com `tracks_goal: true`, meta de referencia, `distance`, `display.distance` e status de atingimento. A matriz legal os classifica como cobertura parcial/proxy metodologico, nao como medicao integral da meta legal.

### Indicadores `at_most`

`temporarios` manteve a logica de meta como limite maximo, mas os textos e leitura visual foram ajustados para evitar frases como "faltam -x p.p.". A leitura agora explicita que menor e melhor e que valores acima da referencia exigem reducao.

## Notas metodologicas adicionadas

- `creche`, `pre_escola`, `basico_6_17` e `basico_15_17`: nota de cobertura estimada, registrando que valores acima de 100% podem ocorrer por estimativas populacionais, mobilidade escolar e oferta localizada no municipio.
- Indicadores de Censo Demografico: nota de que sao linhas censitarias, nao series anuais municipais.
- Indicadores SAEB/IDEB: nota de que nao sao indicadores anuais e de que resultados por disciplina/etapa sao leitura parcial da meta legal.
- Proxies de conectividade/AEE/EJA/equipamentos: notas de que sao contexto/proxy e nao geram distancia de meta legal.
- `salas_climatizadas` e `salas_acessiveis`: notas discretas de proxy parcial, preservando a distancia operacional.
- `pos_graduacao`: ressalva de que o dado bruto foi preservado e ha pontos historicos acima de 100% que exigem revisao humana.

## `pos_graduacao`

Foram confirmados 6 municipios com pontos historicos acima de 100%, totalizando 13 pontos na serie:

| Municipio | Anos acima de 100% | Maximo observado |
|---|---:|---:|
| Camargo | 2016 | 102,7% |
| Cerro Grande | 2023 | 101,8% |
| Ipiranga do Sul | 2023 | 104,0% |
| Quinze de Novembro | 2019 | 102,4% |
| Sertao | 2020, 2021, 2022, 2023, 2024 | 133,7% |
| Sao Vicente do Sul | 2021, 2022, 2023, 2024 | 135,0% |

Nao houve truncamento nem correcao artificial. A recomendacao e revisar a fonte/denominador em etapa posterior.

## Avaliacao de `_build_ratio_result`

Nao foi feita alteracao global. A medicao pontual encontrou:

- `medio_tecnico`: 12 registros municipio-ano com denominador zero, todos em Sao Pedro da Serra.
- `aee`: 4 registros municipio-ano com denominador zero, em Cruzaltense e Vespasiano Correa.
- `escolas_integral`: nenhum denominador zero na base avaliada.

Como a mudanca global poderia alterar varios indicadores historicos, a decisao conservadora foi tratar apenas `medio_tecnico` localmente e rebaixar `aee` para contexto/proxy.

## Impacto nos JSONs municipais

- Os JSONs de `public/data` foram regenerados a partir do pipeline.
- O ciclo PNE 2026-2036 manteve 49 indicadores por municipio.
- A varredura dos 497 municipios confirmou zero ocorrencias de `distance` ou `display.distance` nos indicadores rebaixados para contexto/proxy.
- `salas_climatizadas` e `salas_acessiveis` permanecem com meta/distancia/status; nao foram encontrados valores acima de 100% nesses indicadores.
- `medio_tecnico` passou a usar a formula corrigida; Sao Pedro da Serra ficou sem dado comparavel por nao possuir denominador valido na serie.

## Alertas remanescentes

- `pos_graduacao` ainda precisa de auditoria de fonte/denominador para os 6 municipios com valores acima de 100%.
- `aee` depende de base com denominador municipal mais adequado para voltar a ser indicador de acompanhamento direto.
- Proxies de conectividade e equipamentos devem permanecer como contexto ate haver definicao metodologica e fonte oficial suficientes para medir diretamente as metas legais.
- `salas_climatizadas` e `salas_acessiveis` sao uteis operacionalmente, mas continuam sendo proxies parciais e nao medem todo o padrao fisico/acessibilidade escolar.
