SELECT
    sp.ano,
    m.municipio,
    'total' AS dependencia,
    'total' AS localizacao,
    CASE
        WHEN sp.materia = 'lingua_portuguesa' THEN 'portugues'
        ELSE sp.materia
    END AS materia,
    sp.etapa_codigo,
    SUM(
        CASE
            WHEN (
                (sp.etapa_codigo = 5 AND sp.materia = 'lingua_portuguesa' AND sp.nivel >= 2)
                OR (sp.etapa_codigo = 5 AND sp.materia = 'matematica' AND sp.nivel >= 3)
                OR (sp.etapa_codigo = 9 AND sp.materia = 'lingua_portuguesa' AND sp.nivel >= 1)
                OR (sp.etapa_codigo = 9 AND sp.materia = 'matematica' AND sp.nivel >= 2)
                OR (sp.etapa_codigo = 12 AND sp.materia = 'lingua_portuguesa' AND sp.nivel >= 2)
                OR (sp.etapa_codigo = 12 AND sp.materia = 'matematica' AND sp.nivel >= 3)
            ) THEN sp.valor
            ELSE 0
        END
    ) AS taxa_basico_ou_superior,
    SUM(
        CASE
            WHEN (
                (sp.etapa_codigo = 5 AND sp.materia = 'lingua_portuguesa' AND sp.nivel >= 4)
                OR (sp.etapa_codigo = 5 AND sp.materia = 'matematica' AND sp.nivel >= 5)
                OR (sp.etapa_codigo = 9 AND sp.materia = 'lingua_portuguesa' AND sp.nivel >= 4)
                OR (sp.etapa_codigo = 9 AND sp.materia = 'matematica' AND sp.nivel >= 5)
                OR (sp.etapa_codigo = 12 AND sp.materia = 'lingua_portuguesa' AND sp.nivel >= 4)
                OR (sp.etapa_codigo = 12 AND sp.materia = 'matematica' AND sp.nivel >= 6)
            ) THEN sp.valor
            ELSE 0
        END
    ) AS taxa_adequado_ou_superior
FROM saeb_proficiencia sp
JOIN municipios m
    ON sp.id_municipio::text = m.id_municipio
WHERE sp.tipo_indicador = 'nivel'
  AND sp.etapa_codigo IN (5, 9, 12)
  AND sp.materia IN ('lingua_portuguesa', 'matematica')
  AND LOWER(TRIM(sp.dependencia)) = 'total'
  AND LOWER(TRIM(sp.localizacao)) = 'total'
GROUP BY
    sp.ano,
    m.municipio,
    CASE
        WHEN sp.materia = 'lingua_portuguesa' THEN 'portugues'
        ELSE sp.materia
    END,
    sp.etapa_codigo;
