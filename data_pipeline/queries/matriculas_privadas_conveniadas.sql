SELECT
    ano,
    id_municipio,
    municipio,
    secao_sinopse,
    categoria_escola_privada,
    matriculas_conveniadas_total,
    matriculas_resp_municipio,
    matriculas_resp_estado,
    matriculas_resp_estado_municipio,
    matriculas_resp_municipal_total,
    fonte
FROM matriculas_privadas_conveniadas_poder_publico
ORDER BY ano, id_municipio, secao_sinopse, categoria_escola_privada
