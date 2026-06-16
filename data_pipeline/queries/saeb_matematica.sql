SELECT
    sp.ano,
    m.municipio,
    sp.dependencia,
    sp.localizacao,
    sp.etapa_ensino,
    sp.etapa_codigo,
    SUM(
        CASE
            WHEN sp.nivel >= 5 THEN sp.valor
            ELSE 0
        END
    ) AS taxa_aprendizado_adequado
FROM saeb_proficiencia sp
JOIN municipios m
    ON sp.id_municipio::text = m.id_municipio
WHERE sp.materia = 'matematica'
  AND sp.tipo_indicador = 'nivel'
GROUP BY
    sp.ano,
    m.municipio,
    sp.dependencia,
    sp.localizacao,
    sp.etapa_ensino,
    sp.etapa_codigo;
