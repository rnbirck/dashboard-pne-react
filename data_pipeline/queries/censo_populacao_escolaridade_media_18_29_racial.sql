SELECT
    t1.ano,
    t1.id_municipio,
    t1.municipio,
    t1.escolaridade_media_negros_18_29,
    t1.escolaridade_media_nao_negros_18_29,
    t1.razao_percentual_escolaridade_negros_nao_negros_18_29
FROM censo_populacao_escolaridade_media_18_29_racial t1
WHERE t1.ano = 2022;
