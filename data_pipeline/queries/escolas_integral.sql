SELECT
    t1.ano,
    t2.municipio,
    COUNT(DISTINCT CASE WHEN t1.mat_basico >= 1 THEN t1.cod_escola END) AS escolas_publicas_total,
    COUNT(
        DISTINCT CASE
            WHEN t1.mat_basico >= 1
             AND 100.0 * COALESCE(t1.mat_basico_integral, 0) / NULLIF(t1.mat_basico, 0) >= 25.0
            THEN t1.cod_escola
        END
    ) AS escolas_publicas_com_integral
FROM censo_escolas t1
JOIN municipios t2 ON t1.id_municipio = t2.id_municipio
WHERE t1.dependencia IN ('federal', 'estadual', 'municipal')
GROUP BY t1.ano, t2.municipio;
