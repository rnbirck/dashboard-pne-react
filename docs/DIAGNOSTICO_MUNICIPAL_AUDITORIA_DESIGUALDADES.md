# Diagnóstico municipal — auditoria de desigualdades (P4-A)

## Conclusão executiva

O repositório contém recortes municipais aproveitáveis sobretudo no Censo
Escolar: dependência administrativa, localização urbano/rural, etapa, modalidade,
faixa etária e raça/cor das matrículas. A cobertura publicada é ampla, mas isso
não significa que cada recorte seja compatível com a fórmula dos 49 indicadores
do diagnóstico. Sexo, deficiência e território intraurbano não estão
materializados nas bases públicas atuais. O INSE existe como média contextual,
mas não como resultado educacional separado por grupos socioeconômicos.

O inventário detalhado tem 67 combinações indicador × recorte em
`docs/data/diagnostico_desigualdades_cobertura.csv`. Dessas, 49 têm algum
artefato publicado para os 497 municípios; 13 dependem de consulta às tabelas
locais e não tiveram cobertura aferida porque o PostgreSQL local estava
indisponível; quatro exposições de atendimento estão explicitamente
indisponíveis nos 497 contratos e uma, `escolas_integral × dependência`, está
reconciliada em 484 municípios.

## Bases localizadas

| Base existente | Recortes localizados | Período publicado | Limite principal |
| --- | --- | --- | --- |
| Painel educacional municipal, derivado do Censo Escolar e Sinopse | dependência, urbano/rural, etapa, modalidade, faixa etária, raça/cor | em geral 2014–2025; oferta técnica 2013–2025 | nem todo recorte contém numerador e denominador da fórmula principal |
| `censo` e `censo_escolas`, com consultas em `data_pipeline/queries` | dependência e campos de localização/etapa | anual | o PostgreSQL não estava ativo para medir consultas ainda não materializadas |
| `saeb_proficiencia` | dependência, localização, etapa, disciplina e nível | ano presente na tabela | a consulta canônica atual força `dependencia=total` e `localizacao=total`; regras oficiais de divulgação ainda precisam ser validadas |
| `inse` | média municipal, etapa e dependência nos detalhamentos publicados | 2019, 2021 e 2023 | média de contexto não equivale a um recorte de resultados por NSE |
| Censo Demográfico, tabela racial de escolaridade média 18–29 | negros e não negros | 2022 | mede anos médios, não conclusão do ensino médio; não pode substituir o indicador principal |
| `ept_nivel_medio` e `eja_integrada_educacao_profissional` | modalidade e dependência | 2013/2014–2025 | o denominador publicado por composição da oferta difere de parte das fórmulas legais |

O artefato educacional declara que `null` significa ausência, não zero. A
auditoria preserva essa semântica. Zeros já presentes nas séries foram
registrados como valores explícitos da fonte; nenhum grupo ausente foi criado ou
preenchido com zero.

## Cobertura por recorte solicitado

| Recorte | Situação encontrada | Decisão P4-A |
| --- | --- | --- |
| sexo | não localizado em consultas, contratos ou JSONs públicos atuais | não implementar; localizar fonte oficial com numerador e denominador |
| raça/cor | matrículas por raça/cor e uma tabela censitária de escolaridade média de negros/não negros | uso apenas contextual: faltam denominadores compatíveis para taxas de atendimento e a métrica censitária não mede conclusão |
| deficiência | não localizado como recorte; AEE agregado não identifica população elegível por deficiência | não implementar e não usar AEE como proxy |
| urbano/rural | matrículas, escolas e infraestrutura; fórmula completa para `basico_integral` após filtro da rede pública | único candidato recomendado para piloto estreito |
| nível socioeconômico | média INSE e quantidade de alunos, sem resultados separados por grupos de NSE | usar apenas como contexto; não apresentar “desigualdade por NSE” |
| dependência administrativa | amplo no Censo Escolar; completo para tempo integral e parte da infraestrutura; apenas contribuição do numerador em atendimento populacional | elegível caso a caso, nunca dividir população residente por “rede” como se fosse cobertura própria |
| etapa | completo para tempo integral; já embutido nos indicadores SAEB e de adequação docente | candidato futuro com limiar de célula; evitar duplicar indicadores já definidos por etapa |
| modalidade | oferta técnica e EJA/EPT têm componentes | composição apenas; reconstruir o denominador legal antes de qualquer comparação |
| território intraurbano | bairro, distrito, setor censitário ou área de ponderação não localizados | não implementar |
| outros grupos legais | faixa etária publicada; categorias indígena, quilombola, campo e outros grupos específicos não estão materializadas como recortes dos indicadores | manter ausência explícita; não inferir por escola, território ou modalidade |

## Integridade metodológica

- Uma combinação só é compatível quando ano, unidade, universo, base
  territorial, numerador, denominador e filtro de rede coincidem com o indicador
  principal.
- Percentuais arredondados do JSON não devem ser agregados. Benchmarks do RS e
  pares exigem soma das contagens brutas antes da divisão.
- Localização da escola não substitui localização de residência. Por isso os
  recortes urbano/rural de creche e pré-escola são contexto de oferta, não taxa
  de atendimento.
- Matrículas por raça/cor sem população da mesma idade e raça/cor são composição
  do numerador, não cobertura.
- Média INSE municipal não define grupos de NSE. Usá-la como corte criaria uma
  proxy não documentada.
- Células de tamanho 0 ou 1 existem nos dados publicados. Qualquer etapa futura
  precisa definir supressão, mínimo de grupo e aviso de instabilidade antes de
  exibir comparação.
- Não foram combinados anos distintos, não foram misturados universos e não foi
  produzido preenchimento artificial de ausências.

## Recomendação para P4-B

Recomenda-se apenas um piloto estreito:
`basico_integral × urbano/rural`, calculado para a rede pública com
`matriculas_integral / matriculas` no mesmo ano. O artefato possui os dois
componentes entre 2014 e 2025 nos 497 municípios; benchmark estadual e pares são
recalculáveis por soma de componentes e a leitura tem utilidade territorial
direta.

A recomendação é condicionada a um limiar mínimo pré-definido — sugestão de 10
matrículas por célula —, supressão de células abaixo do limiar, separação clara
entre ausência e zero, e nenhuma alteração de score, ranking, P3-C ou
elegibilidade financeira. Os outros três casos marcados como
`eligible_after_cell_threshold` no CSV devem permanecer fora do piloto inicial.

## Limitações da auditoria

O serviço PostgreSQL em `localhost:5432` não estava disponível. Assim, cobertura
de consultas não materializadas — especialmente SAEB por dependência/localização
e a tabela censitária racial — permanece “não aferida”, nunca presumida como
zero ou cobertura completa. A auditoria usou apenas arquivos públicos já
exportados, consultas versionadas e contratos canônicos existentes.

