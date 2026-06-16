SELECT
    t1.ano,
    t1.id_municipio,
    t1.municipio,
    t1.populacao_6_14_ensino_fundamental_ou_completo,
    t1.populacao_6_14_total,
    t1.percentual_6_14_ensino_fundamental_ou_completo
FROM censo_populacao_ensino_fundamental_6_14 t1
WHERE t1.ano IN (2010, 2022);
