SELECT
    ad.ano,
    m.municipio,
    CASE
        WHEN LOWER(TRIM(ad.dependencia)) IN ('publica', 'pÃºblica', 'pública') THEN 'publica'
        ELSE LOWER(TRIM(ad.dependencia))
    END AS dependencia,
    LOWER(TRIM(ad.localizacao)) AS localizacao,
    ad.etapa,
    ad.percentual_adequacao
FROM adequacao_docente ad
JOIN municipios m
    ON ad.id_municipio::text = m.id_municipio
WHERE LOWER(TRIM(ad.localizacao)) = 'total'
  AND LOWER(TRIM(ad.dependencia)) IN (
      'total',
      'publica',
      'pÃºblica',
      'pública',
      'federal',
      'estadual',
      'municipal',
      'privada'
  )
ORDER BY
    ad.ano,
    m.municipio,
    dependencia,
    ad.etapa;
