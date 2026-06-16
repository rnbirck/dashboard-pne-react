SELECT
    e.ano,
    m.municipio,
    e.mat_ept_nivel_medio_total,
    e.mat_ept_nivel_medio_publica,
    e.mat_ept_nivel_medio_federal,
    e.mat_ept_nivel_medio_estadual,
    e.mat_ept_nivel_medio_municipal,
    e.mat_integrado_total,
    e.mat_integrado_publica,
    e.mat_magisterio_total,
    e.mat_magisterio_publica,
    e.mat_concomitante_total,
    e.mat_concomitante_publica,
    e.mat_subsequente_total,
    e.mat_subsequente_total AS mat_profissional_tecnico_subsequente,
    e.mat_subsequente_publica,
    e.mat_integrada_eja_total,
    e.mat_integrada_eja_publica
FROM ept_nivel_medio e
JOIN municipios m ON e.id_municipio::text = m.id_municipio::text;
