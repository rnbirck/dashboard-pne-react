SELECT
    t1.ano,
    t2.municipio,
    SUM(t1.mat_basico_6_10) + SUM(t1.mat_basico_11_14) AS mat_basico_6_14
FROM censo t1
JOIN municipios t2 ON t1.id_municipio = t2.id_municipio
GROUP BY t1.ano, t2.municipio;
