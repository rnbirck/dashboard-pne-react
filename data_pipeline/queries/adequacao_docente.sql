SELECT
    ad.ano,
    m.municipio,
    'total' AS dependencia,
    ad.etapa,
    ad.percentual_adequacao
FROM adequacao_docente ad
JOIN municipios m
    ON ad.id_municipio::text = m.id_municipio
WHERE LOWER(TRIM(ad.dependencia)) = 'total'
ORDER BY
    ad.ano,
    m.municipio,
    ad.etapa;
