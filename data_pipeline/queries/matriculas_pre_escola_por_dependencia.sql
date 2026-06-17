SELECT
    t1.ano,
    t2.municipio,
    LOWER(TRIM(t1.dependencia)) AS dependencia,
    SUM(t1.mat_infantil_pre) AS mat_infantil_pre
FROM censo t1
JOIN municipios t2 ON t1.id_municipio = t2.id_municipio
GROUP BY t1.ano, t2.municipio, t1.dependencia;
