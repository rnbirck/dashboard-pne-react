SELECT
    t1.ano,
    t2.municipio,
    SUM(t1.pop_estimada) AS pop_6_14
FROM populacao_idade_rs t1
JOIN municipios t2 ON t1.id_municipio = t2.id_municipio
WHERE t1.idade BETWEEN 6 AND 14
GROUP BY t1.ano, t2.municipio;
