SELECT
    si.ano,
    m.municipio,
    si.id_municipio::text AS id_municipio,
    'publica' AS dependencia,
    si.categoria,
    si.valor AS ideb
FROM saeb_ideb si
JOIN municipios m
    ON si.id_municipio::text = m.id_municipio
WHERE si.indicador = 'ideb'
  AND si.rede = 'Pública'
ORDER BY
    si.ano,
    m.municipio,
    si.categoria;
