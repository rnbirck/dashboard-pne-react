SELECT
    t1.ano,
    t2.municipio,
    'publica' AS dependencia,
    AVG(t1.taxa_alfabetizacao) AS taxa_alfabetizacao
FROM alfabetizacao t1
JOIN municipios t2 ON t1.id_municipio = t2.id_municipio
WHERE LOWER(TRIM(t1.dependencia)) IN ('publica', 'pública')
GROUP BY t1.ano, t2.municipio;
