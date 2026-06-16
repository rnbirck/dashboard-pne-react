SELECT
    t1.ano,
    t2.municipio,
    SUM(t1.mat_medio) AS mat_medio,
    SUM(t1.mat_medio_ct) AS mat_profissional_tecnico
FROM censo t1
JOIN municipios t2 ON t1.id_municipio = t2.id_municipio
GROUP BY t1.ano, t2.municipio;
