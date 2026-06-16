SELECT
    aee.ano,
    m.municipio,
    aee.total_turmas_educacao_especial,
    aee.quantidade_aee
FROM atendimento_educacional_especializado aee
JOIN municipios m
    ON aee.id_municipio::text = m.id_municipio
ORDER BY
    aee.ano,
    m.municipio;
