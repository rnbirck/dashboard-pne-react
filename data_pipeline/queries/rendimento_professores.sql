SELECT
    rp.ano,
    m.municipio,
    rp.id_municipio,
    rp.razao_percentual_remuneracao_media
FROM rendimento_professores_razao_percentual rp
JOIN municipios m
    ON rp.id_municipio::text = m.id_municipio
ORDER BY
    rp.ano,
    m.municipio;
