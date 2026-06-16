SELECT
    dp.ano,
    m.municipio,
    'total' AS dependencia,
    dp.percentual_pos_graduacao
FROM docentes_pos_graduacao dp
JOIN municipios m
    ON dp.id_municipio::text = m.id_municipio
ORDER BY
    dp.ano,
    m.municipio;
