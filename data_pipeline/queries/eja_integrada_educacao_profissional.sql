SELECT
    t1.ano,
    t1.id_municipio,
    m.municipio,
    t1.mat_eja_total,
    t1.mat_eja_curso_tecnico_integrada,
    t1.mat_eja_fic_integrado_fundamental,
    t1.mat_eja_fic_integrado_medio,
    t1.mat_eja_integrada_educacao_profissional,
    COALESCE(t1.mat_eja_curso_tecnico_integrada, 0)
      + COALESCE(t1.mat_eja_fic_integrado_fundamental, 0)
      + COALESCE(t1.mat_eja_fic_integrado_medio, 0)
      AS mat_eja_integrada_educacao_profissional_calculada,
    t1.percentual_eja_integrada_educacao_profissional
FROM eja_integrada_educacao_profissional t1
JOIN municipios m
  ON m.id_municipio::text = t1.id_municipio::text
WHERE t1.ano BETWEEN 2014 AND 2025;
