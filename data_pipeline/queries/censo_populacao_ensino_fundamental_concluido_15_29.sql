WITH pop_15_29 AS (
    SELECT
        ano,
        id_municipio::bigint AS id_municipio,
        SUM(pop_estimada) FILTER (WHERE idade BETWEEN 15 AND 29) AS populacao_15_29_total
    FROM populacao_idade_rs
    WHERE ano IN (2010, 2022)
    GROUP BY ano, id_municipio
),
fundamental_15_29 AS (
    SELECT
        COALESCE(t15.ano, t18.ano) AS ano,
        COALESCE(t15.id_municipio, t18.id_municipio) AS id_municipio,
        COALESCE(t15.municipio, t18.municipio) AS municipio,
        COALESCE(t15.populacao_15_17_ensino_medio_ou_basica_completa, 0)
            + COALESCE(t18.populacao_18_29_ensino_fundamental_concluido, 0)
            AS populacao_15_29_ensino_fundamental_concluido
    FROM censo_populacao_ensino_medio_15_17 t15
    FULL OUTER JOIN censo_populacao_ensino_fundamental_concluido_18_29 t18
        ON t18.ano = t15.ano
       AND t18.id_municipio = t15.id_municipio
    WHERE COALESCE(t15.ano, t18.ano) IN (2010, 2022)
)
SELECT
    t1.ano,
    t1.id_municipio,
    t1.municipio,
    t1.populacao_15_29_ensino_fundamental_concluido,
    t2.populacao_15_29_total,
    100.0 * t1.populacao_15_29_ensino_fundamental_concluido / NULLIF(t2.populacao_15_29_total, 0) AS percentual_15_29_ensino_fundamental_concluido
FROM fundamental_15_29 t1
LEFT JOIN pop_15_29 t2
    ON t2.ano = t1.ano
   AND t2.id_municipio = t1.id_municipio
WHERE t1.ano IN (2010, 2022);
