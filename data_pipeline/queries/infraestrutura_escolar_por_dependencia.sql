SELECT
    c.ano,
    m.municipio,
    c.dependencia,
    SUM(COALESCE(c.qntd_escolas, 0)) AS qntd_escolas,
    SUM(COALESCE(c.escolas_com_internet, 0)) AS escolas_com_internet,
    SUM(COALESCE(c.escolas_com_internet_alunos, 0)) AS escolas_com_internet_alunos,
    SUM(COALESCE(c.escolas_com_internet_aprendizagem, 0)) AS escolas_com_internet_aprendizagem,
    SUM(COALESCE(c.escolas_com_internet_comunidade, 0)) AS escolas_com_internet_comunidade,
    SUM(COALESCE(c.escolas_com_acesso_internet_computador, 0)) AS escolas_com_acesso_internet_computador,
    SUM(COALESCE(c.escolas_com_acesso_internet_disp_pessoais, 0)) AS escolas_com_acesso_internet_disp_pessoais,
    SUM(COALESCE(c.escolas_com_rede_local, 0)) AS escolas_com_rede_local,
    SUM(COALESCE(c.escolas_com_rede_local_wireless, 0))
        + SUM(COALESCE(c.escolas_com_rede_local_cabo_wireless, 0)) AS escolas_com_rede_wireless,
    SUM(COALESCE(c.escolas_com_banda_larga, 0)) AS escolas_com_banda_larga,
    SUM(COALESCE(c.escolas_com_educacao_ambiental, 0)) AS escolas_com_educacao_ambiental,
    SUM(COALESCE(c.qt_salas_utiliza_climatizadas, 0)) AS qt_salas_utiliza_climatizadas,
    SUM(COALESCE(c.qt_salas_utilizadas, 0)) AS qt_salas_utilizadas,
    SUM(COALESCE(c.qt_salas_utilizadas_acessiveis, 0)) AS qt_salas_utilizadas_acessiveis,
    SUM(COALESCE(c.escolas_com_desktop_aluno, 0)) AS escolas_com_desktop_aluno,
    SUM(COALESCE(c.escolas_com_comp_portatil_aluno, 0)) AS escolas_com_comp_portatil_aluno,
    SUM(COALESCE(c.escolas_com_tablet_aluno, 0)) AS escolas_com_tablet_aluno
FROM censo c
JOIN municipios m
    ON c.id_municipio = m.id_municipio
GROUP BY
    c.ano,
    m.municipio,
    c.dependencia
ORDER BY
    c.ano,
    m.municipio,
    c.dependencia;
