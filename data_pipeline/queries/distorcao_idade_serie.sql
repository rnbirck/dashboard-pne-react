WITH distorcao_base AS (
    SELECT
        CAST(ano AS INTEGER) AS ano,
        id_municipio,
        municipio,
        CASE TRIM(LOWER(dependencia))
            WHEN 'total' THEN 'total'
            WHEN 'pública' THEN 'publica'
            WHEN 'municipal' THEN 'municipal'
            WHEN 'estadual' THEN 'estadual'
            WHEN 'federal' THEN 'federal'
            WHEN 'privada' THEN 'privada'
            ELSE LOWER(TRIM(dependencia))
        END AS dependencia,
        CASE categoria
            WHEN 'taxa_distorcao_fundamental_anos_iniciais' THEN 'quinto_ano'
            WHEN 'taxa_distorcao_fundamental_anos_finais' THEN 'nono_ano'
            WHEN 'taxa_distorcao_medio' THEN 'ensino_medio'
            ELSE NULL
        END AS etapa_proxy,
        CAST(valor AS DOUBLE PRECISION) AS taxa_distorcao
    FROM distorcao_idade_serie
    WHERE categoria IN (
        'taxa_distorcao_fundamental_anos_iniciais',
        'taxa_distorcao_fundamental_anos_finais',
        'taxa_distorcao_medio'
    )
),
censo_total AS (
    SELECT
        CAST(ano AS INTEGER) AS ano,
        id_municipio,
        SUM(COALESCE(mat_fundamental_anos_iniciais, 0)) AS mat_fundamental_anos_iniciais,
        SUM(COALESCE(mat_fundamental_anos_finais, 0)) AS mat_fundamental_anos_finais,
        SUM(COALESCE(mat_medio, 0)) AS mat_medio
    FROM censo
    GROUP BY 1, 2
)
SELECT
    db.ano,
    db.municipio,
    db.dependencia,
    db.etapa_proxy,
    CASE
        WHEN (
            CASE db.etapa_proxy
                WHEN 'quinto_ano' THEN COALESCE(ct.mat_fundamental_anos_iniciais, 0)
                WHEN 'nono_ano' THEN COALESCE(ct.mat_fundamental_anos_finais, 0)
                WHEN 'ensino_medio' THEN COALESCE(ct.mat_medio, 0)
                ELSE 0
            END
        ) <= 0 THEN NULL
        ELSE GREATEST(0.0, LEAST(100.0, 100.0 - db.taxa_distorcao))
    END AS taxa_idade_regular
FROM distorcao_base db
LEFT JOIN censo_total ct
    ON ct.ano = db.ano
   AND ct.id_municipio = db.id_municipio
WHERE db.dependencia = 'total';
