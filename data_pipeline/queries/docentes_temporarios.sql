SELECT
    dt.ano,
    m.municipio,
    'publica' AS dependencia,
    dt.percentual_temporarios
FROM docentes_temporarios dt
JOIN municipios m
    ON dt.id_municipio::text = m.id_municipio
WHERE LOWER(TRIM(dt.dependencia)) IN ('publica', 'pública')
ORDER BY
    dt.ano,
    m.municipio;
