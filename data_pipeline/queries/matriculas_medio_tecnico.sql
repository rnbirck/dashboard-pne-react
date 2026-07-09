WITH censo_por_municipio AS (
    SELECT
        ano,
        id_municipio::text AS id_municipio,
        SUM(mat_medio) AS mat_medio
    FROM censo
    GROUP BY ano, id_municipio
)
SELECT
    c.ano,
    m.municipio,
    c.mat_medio,
    e.mat_integrado_total AS mat_profissional_tecnico
FROM censo_por_municipio c
JOIN municipios m ON c.id_municipio = m.id_municipio::text
LEFT JOIN ept_nivel_medio e
    ON e.ano = c.ano
    AND e.id_municipio::text = c.id_municipio;
