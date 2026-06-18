SELECT
    t1.ano,
    t1.id_municipio,
    m.municipio,
    t1.mat_eja_total,
    t1.mat_eja_curso_tecnico_integrada,
    t1.mat_eja_curso_tecnico_integrada_federal,
    t1.mat_eja_curso_tecnico_integrada_estadual,
    t1.mat_eja_curso_tecnico_integrada_municipal,
    t1.mat_eja_curso_tecnico_integrada_publica,
    t1.mat_eja_curso_tecnico_integrada_privada,
    t1.mat_eja_fic_integrado_fundamental,
    t1.mat_eja_fic_integrado_fundamental_federal,
    t1.mat_eja_fic_integrado_fundamental_estadual,
    t1.mat_eja_fic_integrado_fundamental_municipal,
    t1.mat_eja_fic_integrado_fundamental_publica,
    t1.mat_eja_fic_integrado_fundamental_privada,
    t1.mat_eja_fic_integrado_medio,
    t1.mat_eja_fic_integrado_medio_federal,
    t1.mat_eja_fic_integrado_medio_estadual,
    t1.mat_eja_fic_integrado_medio_municipal,
    t1.mat_eja_fic_integrado_medio_publica,
    t1.mat_eja_fic_integrado_medio_privada,
    t1.mat_eja_integrada_educacao_profissional,
    t1.mat_eja_integrada_educacao_profissional_federal,
    t1.mat_eja_integrada_educacao_profissional_estadual,
    t1.mat_eja_integrada_educacao_profissional_municipal,
    t1.mat_eja_integrada_educacao_profissional_publica,
    t1.mat_eja_integrada_educacao_profissional_privada,
    COALESCE(t1.mat_eja_curso_tecnico_integrada, 0)
      + COALESCE(t1.mat_eja_fic_integrado_fundamental, 0)
      + COALESCE(t1.mat_eja_fic_integrado_medio, 0)
      AS mat_eja_integrada_educacao_profissional_calculada,
    t1.percentual_eja_integrada_educacao_profissional
FROM eja_integrada_educacao_profissional t1
JOIN municipios m
  ON m.id_municipio::text = t1.id_municipio::text
WHERE t1.ano BETWEEN 2014 AND 2025;
