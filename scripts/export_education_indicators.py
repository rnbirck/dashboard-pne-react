#!/usr/bin/env python3
"""
Exportador JSON para Indicadores da Educacao.

Le as views SQL do banco senai e gera JSONs estaticos em
public/data/educacao/ para consumo do dashboard React.

Estrutura de saida:
  public/data/educacao/index.json              (metadados leves)
  public/data/educacao/municipios/{id}.json    (1 por municipio RS)
  public/data/educacao/regioes/{slug}.json     (1 por regiao SENAI)
"""

import json
import math
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import pandas as pd

# ── Caminhos ─────────────────────────────────────────────────────────────

PROJETO = Path(__file__).resolve().parent.parent
SENAI_DB = Path(r"C:\Users\rnbirck\PROJETOS\SENAI\DB")
SAIDA = PROJETO / "public" / "data" / "educacao"
SAIDA_MUN = SAIDA / "municipios"
SAIDA_REG = SAIDA / "regioes"

sys.path.insert(0, str(SENAI_DB))
from utils_educacao import get_engine  # noqa: E402

engine = get_engine("senai")
DATA_EXPORTACAO = datetime.now().strftime("%Y-%m-%d")

# ── Helpers ───────────────────────────────────────────────────────────────


def limpar_null(valor):
    """Converte NaN/inf/None para None (null no JSON)."""
    if valor is None:
        return None
    if isinstance(valor, float) and (math.isnan(valor) or math.isinf(valor)):
        return None
    return valor


def r1(valor):
    """Arredonda para 1 casa decimal, preservando null."""
    v = limpar_null(valor)
    if v is None:
        return None
    return round(float(v), 1)


def ri(valor):
    """Converte para inteiro, preservando null."""
    v = limpar_null(valor)
    if v is None:
        return None
    return int(round(float(v)))


def slugify(texto):
    """Gera slug a partir de texto."""
    s = re.sub(r"[^\w\s-]", "", str(texto).lower().strip())
    s = re.sub(r"[\s_-]+", "-", s)
    s = re.sub(r"^-+|-+$", "", s)
    return s


def serie_anual(df, coluna_valor, coluna_extra=None):
    """Constroi serie [{ano, valor, ...}] ordenada por ano.
    Filtra linhas onde valor e null."""
    pontos = []
    for _, row in df.iterrows():
        valor = limpar_null(row.get(coluna_valor))
        if valor is None:
            continue
        ponto = {"ano": int(row["ano"]), "valor": valor}
        if coluna_extra and coluna_extra in row:
            extra = limpar_null(row.get(coluna_extra))
            if extra is not None:
                ponto[coluna_extra] = extra
        pontos.append(ponto)
    return pontos


def detalhamento_matriculas(df, dimensoes, filtros=None):
    """Constroi linhas longas de matriculas por ano e dimensoes.

    Mantem null como null, zero como zero e recalcula percentual_integral a
    partir dos totais agregados quando matriculas_integral estiver disponivel.
    """
    filtros = filtros or {}
    sub = df.copy()
    for coluna, valores in filtros.items():
        if valores is None:
            continue
        if not isinstance(valores, (list, tuple, set)):
            valores = [valores]
        sub = sub[sub[coluna].isin(valores)]

    if sub.empty:
        return []

    group_cols = ["ano", *dimensoes]
    agregados = (
        sub.groupby(group_cols, dropna=False)[["matriculas", "matriculas_integral"]]
        .sum(min_count=1)
        .reset_index()
        .sort_values(group_cols)
    )

    linhas = []
    for _, r in agregados.iterrows():
        matriculas = limpar_null(r["matriculas"])
        if matriculas is None:
            continue
        integral = limpar_null(r["matriculas_integral"])
        linha = {
            "ano": int(r["ano"]),
            "valor": ri(matriculas),
            "matriculas": ri(matriculas),
        }
        for dimensao in dimensoes:
            linha[dimensao] = r[dimensao]
        if integral is not None:
            linha["matriculas_integral"] = ri(integral)
            linha["percentual_integral"] = r1(integral / matriculas * 100) if matriculas > 0 else None
        linhas.append(linha)

    return linhas


def detalhamento_faixa_etaria(df, dimensoes, filtros=None):
    """Constroi recortes de matriculas por faixa etaria.

    As linhas ja chegam segmentadas por etapa e faixa etaria na Sinopse.
    Agregacoes sao apenas somas de matriculas, mantendo null como null.
    """
    filtros = filtros or {}
    sub = df.copy()
    for coluna, valores in filtros.items():
        if valores is None:
            continue
        if not isinstance(valores, (list, tuple, set)):
            valores = [valores]
        sub = sub[sub[coluna].isin(valores)]

    if sub.empty:
        return []

    group_cols = ["ano", *dimensoes]
    agregados = (
        sub.groupby(group_cols, dropna=False)["matriculas"]
        .sum(min_count=1)
        .reset_index()
        .sort_values(group_cols)
    )

    linhas = []
    for _, r in agregados.iterrows():
        matriculas = limpar_null(r["matriculas"])
        if matriculas is None:
            continue
        linha = {
            "ano": int(r["ano"]),
            "valor": ri(matriculas),
            "matriculas": ri(matriculas),
        }
        for dimensao in dimensoes:
            linha[dimensao] = r[dimensao]
        linhas.append(linha)

    return linhas


def detalhamento_tempo_integral(df, dimensoes, filtros=None):
    """Constroi recortes de matriculas em tempo integral.

    Usa matriculas_integral como valor principal e recalcula o percentual a
    partir de somas agregadas: soma(integral) / soma(matriculas) * 100.
    """
    filtros = filtros or {}
    sub = df.copy()
    for coluna, valores in filtros.items():
        if valores is None:
            continue
        if not isinstance(valores, (list, tuple, set)):
            valores = [valores]
        sub = sub[sub[coluna].isin(valores)]

    if sub.empty:
        return []

    group_cols = ["ano", *dimensoes]
    agregados = (
        sub.groupby(group_cols, dropna=False)[["matriculas", "matriculas_integral"]]
        .sum(min_count=1)
        .reset_index()
        .sort_values(group_cols)
    )

    linhas = []
    for _, r in agregados.iterrows():
        integral = limpar_null(r["matriculas_integral"])
        if integral is None:
            continue
        matriculas = limpar_null(r["matriculas"])
        linha = {
            "ano": int(r["ano"]),
            "valor": ri(integral),
            "matriculas_integral": ri(integral),
            "matriculas_total": ri(matriculas),
            "percentual_integral": r1(integral / matriculas * 100) if matriculas and matriculas > 0 else None,
        }
        for dimensao in dimensoes:
            linha[dimensao] = r[dimensao]
        linhas.append(linha)

    return linhas


def detalhamento_rede_escolar(df, dimensoes, filtros=None):
    filtros = filtros or {}
    sub = df.copy()
    for coluna, valores in filtros.items():
        if not isinstance(valores, (list, tuple, set)):
            valores = [valores]
        sub = sub[sub[coluna].isin(valores)]
    if sub.empty:
        return []

    linhas = []
    for _, r in sub.sort_values(["ano", *dimensoes]).iterrows():
        escolas = limpar_null(r.get("escolas"))
        if escolas is None:
            continue
        linha = {
            "ano": int(r["ano"]),
            "valor": ri(escolas),
            "escolas": ri(escolas),
            "perc_internet": r1(limpar_null(r.get("perc_internet"))),
            "perc_banda_larga": r1(limpar_null(r.get("perc_banda_larga"))),
        }
        for dimensao in dimensoes:
            linha[dimensao] = r[dimensao]
        linhas.append(linha)
    return linhas


def detalhamento_escolas_etapa(df, dimensoes, filtros=None):
    """Detalhamento de escolas por etapa sem campos de infraestrutura."""
    filtros = filtros or {}
    sub = df.copy()
    for coluna, valores in filtros.items():
        if not isinstance(valores, (list, tuple, set)):
            valores = [valores]
        sub = sub[sub[coluna].isin(valores)]
    if sub.empty:
        return []
    linhas = []
    for _, r in sub.sort_values(["ano", *dimensoes]).iterrows():
        escolas = limpar_null(r.get("escolas"))
        if escolas is None:
            continue
        linha = {"ano": int(r["ano"]), "valor": ri(escolas), "escolas": ri(escolas)}
        for dimensao in dimensoes:
            linha[dimensao] = r[dimensao]
        linhas.append(linha)
    return linhas


def detalhamento_turmas(df, dimensoes, filtros=None):
    filtros = filtros or {}
    sub = df.copy()
    for coluna, valores in filtros.items():
        if not isinstance(valores, (list, tuple, set)):
            valores = [valores]
        sub = sub[sub[coluna].isin(valores)]
    if sub.empty:
        return []

    group_cols = ["ano", *dimensoes]
    agregados = (
        sub.groupby(group_cols, dropna=False)[["turmas", "docentes", "matriculas"]]
        .sum(min_count=1)
        .reset_index()
        .sort_values(group_cols)
    )
    linhas = []
    for _, r in agregados.iterrows():
        turmas = limpar_null(r.get("turmas"))
        docentes = limpar_null(r.get("docentes"))
        matriculas = limpar_null(r.get("matriculas"))
        if turmas is None and docentes is None and matriculas is None:
            continue
        linha = {
            "ano": int(r["ano"]),
            "valor": ri(turmas) if turmas is not None else None,
            "turmas": ri(turmas),
            "docentes": ri(docentes),
            "matriculas": ri(matriculas),
            "alunos_por_turma": r1(matriculas / turmas) if matriculas is not None and turmas and turmas > 0 else None,
            "alunos_por_docente": r1(matriculas / docentes) if matriculas is not None and docentes and docentes > 0 else None,
        }
        for dimensao in dimensoes:
            linha[dimensao] = r[dimensao]
        linhas.append(linha)
    return linhas


def detalhamento_fluxo(df, dimensoes, filtros=None, incluir_distorcao=True):
    filtros = filtros or {}
    sub = df.copy()
    for coluna, valores in filtros.items():
        if not isinstance(valores, (list, tuple, set)):
            valores = [valores]
        sub = sub[sub[coluna].isin(valores)]
    if sub.empty:
        return []

    linhas = []
    for _, r in sub.sort_values(["ano", *dimensoes]).iterrows():
        linha = {"ano": int(r["ano"])}
        for dimensao in dimensoes:
            linha[dimensao] = r[dimensao]
        for col in ["taxa_aprovacao", "taxa_reprovacao", "taxa_abandono"]:
            linha[col] = r1(limpar_null(r.get(col)))
        linha["valor"] = linha["taxa_aprovacao"]
        if incluir_distorcao:
            linha["taxa_distorcao"] = r1(limpar_null(r.get("taxa_distorcao")))
        if any(not limpar_null(linha.get(col)) is None for col in ["taxa_aprovacao", "taxa_reprovacao", "taxa_abandono", "taxa_distorcao"]):
            linhas.append(linha)
    return linhas


def detalhamento_aprendizagem(df, dimensoes, filtros=None):
    filtros = filtros or {}
    sub = df.copy()
    for coluna, valores in filtros.items():
        if not isinstance(valores, (list, tuple, set)):
            valores = [valores]
        sub = sub[sub[coluna].isin(valores)]
    if sub.empty:
        return []

    linhas = []
    for _, r in sub.sort_values(["ano", *dimensoes]).iterrows():
        linha = {"ano": int(r["ano"])}
        for dimensao in dimensoes:
            linha[dimensao] = r[dimensao]
        for col in ["ideb", "saeb_lp", "saeb_mt", "taxa_alfabetizacao", "media_inse"]:
            linha[col] = r1(limpar_null(r.get(col)))
        linha["qtd_alunos_inse"] = ri(limpar_null(r.get("qtd_alunos_inse")))
        if any(not limpar_null(linha.get(col)) is None for col in ["ideb", "saeb_lp", "saeb_mt", "taxa_alfabetizacao", "media_inse"]):
            linhas.append(linha)
    return linhas


def detalhamento_oferta(df, dimensoes, filtros=None):
    filtros = filtros or {}
    sub = df.copy()
    for coluna, valores in filtros.items():
        if not isinstance(valores, (list, tuple, set)):
            valores = [valores]
        sub = sub[sub[coluna].isin(valores)]
    if sub.empty:
        return []

    linhas = []
    for _, r in sub.sort_values(["ano", *dimensoes]).iterrows():
        matriculas = limpar_null(r.get("matriculas"))
        if matriculas is None:
            continue
        linha = {
            "ano": int(r["ano"]),
            "valor": ri(matriculas),
            "matriculas": ri(matriculas),
            "perc_modalidade": r1(limpar_null(r.get("perc_modalidade"))),
        }
        for dimensao in dimensoes:
            linha[dimensao] = r[dimensao]
        linhas.append(linha)
    return linhas


def safe_json_dump(data, path):
    """Escreve JSON garantindo que nao haja NaN/Infinity."""
    def clean(obj):
        if obj is None:
            return None
        if isinstance(obj, float):
            if math.isnan(obj) or math.isinf(obj):
                return None
            return obj
        if isinstance(obj, dict):
            return {k: clean(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [clean(v) for v in obj]
        if isinstance(obj, (pd.Timestamp, datetime)):
            return obj.strftime("%Y-%m-%d")
        if hasattr(obj, "item"):
            return clean(obj.item())
        return obj

    data = clean(data)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, allow_nan=False, separators=(",", ":"))


# ── Mapeamento de métricas de infraestrutura ────────────────────────────
# Cada tupla: (key_export, coluna_count_sql, coluna_percentual_export)
# Usa os mesmos campos do censo escolar usados no PNE 2026-2036.
INFRA_METRICAS = [
    ("internet", "escolas_com_internet", "perc_internet"),
    ("internet_alunos", "escolas_com_internet_alunos", "perc_internet_alunos"),
    ("internet_aprendizagem", "escolas_com_internet_aprendizagem", "perc_internet_aprendizagem"),
    ("internet_comunidade", "escolas_com_internet_comunidade", "perc_internet_comunidade"),
    ("acesso_internet_computador", "escolas_com_acesso_internet_computador", "perc_acesso_internet_computador"),
    ("acesso_internet_disp_pessoais", "escolas_com_acesso_internet_disp_pessoais", "perc_acesso_internet_disp_pessoais"),
    ("banda_larga", "escolas_com_banda_larga", "perc_banda_larga"),
    ("rede_local", "escolas_com_rede_local", "perc_rede_local"),
    ("rede_wireless", None, "perc_rede_wireless"),
    ("desktop_aluno", "escolas_com_desktop_aluno", "perc_desktop_aluno"),
    ("comp_portatil_aluno", "escolas_com_comp_portatil_aluno", "perc_comp_portatil_aluno"),
    ("tablet_aluno", "escolas_com_tablet_aluno", "perc_tablet_aluno"),
    ("salas_climatizadas", "qt_salas_utiliza_climatizadas", "perc_salas_climatizadas"),
    ("salas_acessiveis", "qt_salas_utilizadas_acessiveis", "perc_salas_acessiveis"),
]

# ── Fontes e avisos globais ──────────────────────────────────────────────

FONTES = [
    {"nome": "INEP - Censo Escolar", "tabelas": ["censo", "censo_escolas"]},
    {"nome": "INEP - Sinopse Estatistica do Censo Escolar", "tabelas": [
        "matriculas_faixa_etaria", "docentes_pos_graduacao",
        "ept_nivel_medio", "eja_integrada_educacao_profissional"
    ]},
    {"nome": "INEP - Taxas de Rendimento Escolar", "tabelas": ["rendimento_escolar"]},
    {"nome": "INEP - Distorcao Idade-Serie", "tabelas": ["distorcao_idade_serie"]},
    {"nome": "INEP - SAEB/IDEB", "tabelas": ["saeb_ideb", "saeb_proficiencia"]},
    {"nome": "INEP - INSE", "tabelas": ["inse"]},
    {"nome": "INEP - Alfabetizacao", "tabelas": ["alfabetizacao"]},
]

AVISOS_GLOBAIS = [
    "null significa dado ausente, nao zero.",
    "Cobertura varia por indicador: Censo 2014-2025, Rendimento 2018-2024, "
    "Distorcao 2019-2025, IDEB bienal 2011-2023, INSE 2019/2021/2023.",
]

AVISOS_FLUXO = [
    "taxa_distorcao nao tem dimensoes de localizacao na fonte original. "
    "O valor exibido para urbana/rural e o mesmo do total municipal.",
    "Prefira usar localizacao=total para analises de distorcao.",
]

AVISOS_TURMAS = [
    "alunos_por_docente pode apresentar valores altos em EJA e Educacao Infantil "
    "devido a poucos docentes reportados para muitas matriculas.",
]

AVISOS_APRENDIZAGEM = [
    "IDEB e avaliado bienalmente (2011-2023). Anos sem avalicao tem null.",
    "Alfabetizacao disponivel apenas para 2023-2025.",
    "INSE disponivel para 2019, 2021 e 2023.",
]

AVISOS_OFERTA = [
    "perc_modalidade tem alta taxa de null (municipios sem oferta em determinada modalidade).",
]


# ── Carregamento de dados ────────────────────────────────────────────────


def carregar_municipios_rs():
    """Carrega mapeamento de municipios RS com regiao SENAI."""
    df = pd.read_sql_query(
        "SELECT id_municipio, municipio, regiao_senai "
        "FROM municipios WHERE sigla_uf = 'RS' ORDER BY municipio",
        engine,
    )
    df["id_municipio"] = df["id_municipio"].astype(str)
    return df


def carregar_view(view, rs_ids=None):
    """Carrega uma view filtrada para RS."""
    if rs_ids is not None:
        placeholders = ",".join([f"'{i}'" for i in rs_ids])
        sql = f"SELECT * FROM {view} WHERE id_municipio IN ({placeholders})"
    else:
        sql = f"SELECT * FROM {view}"
    df = pd.read_sql_query(sql, engine)
    if "id_municipio" in df.columns:
        df["id_municipio"] = df["id_municipio"].astype(str)
    return df


# ── Bloco: Matriculas ────────────────────────────────────────────────────


def montar_bloco_matriculas(df, id_mun, df_faixa_etaria=None):
    """Constroi o bloco de matriculas para um municipio."""
    d = df[df["id_municipio"] == id_mun].copy()
    if d.empty:
        return _bloco_vazio("matriculas", ["etapa_ensino", "dependencia", "localizacao"])

    # Serie total (dependencia=total, localizacao=total, todas as etapas somadas)
    total = (
        d[(d["dependencia"] == "total") & (d["localizacao"] == "total")]
        .groupby("ano")["matriculas"]
        .sum(min_count=1)
        .reset_index()
    )
    serie_total = [
        {"ano": int(r["ano"]), "valor": ri(r["matriculas"])}
        for _, r in total.iterrows() if limpar_null(r["matriculas"]) is not None
    ]

    # Serie por etapa (total dep, total loc)
    por_etapa = {}
    for etapa in sorted(d["etapa_ensino"].unique()):
        sub = d[
            (d["etapa_ensino"] == etapa)
            & (d["dependencia"] == "total")
            & (d["localizacao"] == "total")
        ].sort_values("ano")
        serie = [
            {"ano": int(r["ano"]), "valor": ri(r["matriculas"])}
            for _, r in sub.iterrows() if limpar_null(r["matriculas"]) is not None
        ]
        if serie:
            por_etapa[etapa] = serie

    # Serie por dependencia (total loc, todas as etapas)
    por_dep = {}
    for dep in ["publica", "privada", "estadual", "municipal", "federal"]:
        sub = (
            d[(d["dependencia"] == dep) & (d["localizacao"] == "total")]
            .groupby("ano")["matriculas"]
            .sum(min_count=1)
            .reset_index()
        )
        serie = [
            {"ano": int(r["ano"]), "valor": ri(r["matriculas"])}
            for _, r in sub.iterrows() if limpar_null(r["matriculas"]) is not None
        ]
        if serie:
            por_dep[dep] = serie

    # Serie por localizacao (total dep)
    por_loc = {}
    for loc in ["urbana", "rural"]:
        sub = (
            d[(d["dependencia"] == "total") & (d["localizacao"] == loc)]
            .groupby("ano")["matriculas"]
            .sum(min_count=1)
            .reset_index()
        )
        serie = [
            {"ano": int(r["ano"]), "valor": ri(r["matriculas"])}
            for _, r in sub.iterrows() if limpar_null(r["matriculas"]) is not None
        ]
        if serie:
            por_loc[loc] = serie

    # Integral
    integral = (
        d[(d["dependencia"] == "total") & (d["localizacao"] == "total")]
        .groupby("ano")
        .agg(matriculas=("matriculas", "sum"), integral=("matriculas_integral", "sum"))
        .reset_index()
    )
    serie_integral = []
    for _, r in integral.iterrows():
        mat = limpar_null(r["matriculas"])
        inte = limpar_null(r["integral"])
        if inte is None:
            continue
        perc = r1(inte / mat * 100) if mat and mat > 0 else None
        serie_integral.append({"ano": int(r["ano"]), "valor": ri(inte), "percentual": perc})

    deps_rede = ["publica", "privada", "estadual", "municipal", "federal"]
    locs = ["urbana", "rural"]
    detalhamentos = {
        "por_etapa": detalhamento_matriculas(
            d,
            ["etapa_ensino"],
            {"dependencia": "total", "localizacao": "total"},
        ),
        "por_rede": detalhamento_matriculas(
            d,
            ["dependencia"],
            {"dependencia": deps_rede, "localizacao": "total"},
        ),
        "por_localizacao": detalhamento_matriculas(
            d,
            ["localizacao"],
            {"dependencia": "total", "localizacao": locs},
        ),
        "por_etapa_rede": detalhamento_matriculas(
            d,
            ["etapa_ensino", "dependencia"],
            {"dependencia": deps_rede, "localizacao": "total"},
        ),
        "por_etapa_localizacao": detalhamento_matriculas(
            d,
            ["etapa_ensino", "localizacao"],
            {"dependencia": "total", "localizacao": locs},
        ),
        "por_rede_localizacao": detalhamento_matriculas(
            d,
            ["dependencia", "localizacao"],
            {"dependencia": deps_rede, "localizacao": locs},
        ),
        "tempo_integral_por_etapa": detalhamento_tempo_integral(
            d,
            ["etapa_ensino"],
            {"dependencia": "total", "localizacao": "total"},
        ),
        "tempo_integral_por_rede": detalhamento_tempo_integral(
            d,
            ["dependencia"],
            {"dependencia": deps_rede, "localizacao": "total"},
        ),
        "tempo_integral_por_localizacao": detalhamento_tempo_integral(
            d,
            ["localizacao"],
            {"dependencia": "total", "localizacao": locs},
        ),
        "tempo_integral_por_etapa_rede": detalhamento_tempo_integral(
            d,
            ["etapa_ensino", "dependencia"],
            {"dependencia": deps_rede, "localizacao": "total"},
        ),
        "tempo_integral_por_etapa_localizacao": detalhamento_tempo_integral(
            d,
            ["etapa_ensino", "localizacao"],
            {"dependencia": "total", "localizacao": locs},
        ),
    }

    if df_faixa_etaria is not None:
        f = df_faixa_etaria[df_faixa_etaria["id_municipio"] == id_mun].copy()
        if not f.empty:
            detalhamentos["por_faixa_etaria"] = detalhamento_faixa_etaria(
                f,
                ["faixa_etaria"],
            )
            detalhamentos["por_etapa_faixa_etaria"] = detalhamento_faixa_etaria(
                f,
                ["etapa_ensino", "faixa_etaria"],
            )
            if "secao_sinopse" in f.columns:
                detalhamentos["por_etapa_secao_faixa_etaria"] = detalhamento_faixa_etaria(
                    f,
                    ["etapa_ensino", "secao_sinopse", "faixa_etaria"],
                )

    # Ultimo ano
    ultimo_ano = int(total["ano"].max()) if not total.empty else None
    resumo = _resumo_matriculas(d, ultimo_ano)

    return {
        "series": {
            "total": serie_total,
            "por_etapa": por_etapa,
            "por_dependencia": por_dep,
            "por_localizacao": por_loc,
            "integral": serie_integral,
        },
        "detalhamentos": detalhamentos,
        "ultimo_ano": ultimo_ano,
        "resumo_ultimo_ano": resumo,
        "dimensoes_disponiveis": [
            "etapa_ensino", "dependencia", "localizacao", "faixa_etaria"
        ],
        "campos_indisponiveis": _campos_indisponiveis_matriculas(d, ultimo_ano),
    }


def _resumo_matriculas(d, ano):
    if ano is None:
        return {}
    d_ano = d[d["ano"] == ano]
    total = d_ano[
        (d_ano["dependencia"] == "total") & (d_ano["localizacao"] == "total")
    ]["matriculas"].sum()

    por_etapa = {}
    for etapa in d_ano["etapa_ensino"].unique():
        val = d_ano[
            (d_ano["etapa_ensino"] == etapa)
            & (d_ano["dependencia"] == "total")
            & (d_ano["localizacao"] == "total")
        ]["matriculas"].sum()
        v = limpar_null(val)
        if v is not None:
            por_etapa[etapa] = ri(v)

    publica = d_ano[(d_ano["dependencia"] == "publica") & (d_ano["localizacao"] == "total")][
        "matriculas"
    ].sum()
    privada = d_ano[(d_ano["dependencia"] == "privada") & (d_ano["localizacao"] == "total")][
        "matriculas"
    ].sum()
    urbana = d_ano[(d_ano["dependencia"] == "total") & (d_ano["localizacao"] == "urbana")][
        "matriculas"
    ].sum()
    rural = d_ano[(d_ano["dependencia"] == "total") & (d_ano["localizacao"] == "rural")][
        "matriculas"
    ].sum()

    inte = d_ano[
        (d_ano["dependencia"] == "total") & (d_ano["localizacao"] == "total")
    ]["matriculas_integral"].sum()
    perc_integral = r1(inte / total * 100) if limpar_null(total) and total > 0 and limpar_null(inte) else None

    return {
        "total_matriculas": ri(limpar_null(total)),
        "por_etapa": por_etapa,
        "matriculas_publica": ri(limpar_null(publica)),
        "matriculas_privada": ri(limpar_null(privada)),
        "matriculas_urbana": ri(limpar_null(urbana)),
        "matriculas_rural": ri(limpar_null(rural)),
        "percentual_integral": perc_integral,
    }


def _campos_indisponiveis_matriculas(d, ano):
    if ano is None:
        return ["matriculas", "matriculas_integral"]
    d_ano = d[d["ano"] == ano]
    indisponiveis = []
    if d_ano["matriculas_integral"].isna().all():
        indisponiveis.append("matriculas_integral")
    return indisponiveis


# ── Bloco: Rede Escolar ──────────────────────────────────────────────────


def montar_bloco_rede(df, id_mun, df_etapa=None):
    d = df[df["id_municipio"] == id_mun].copy()
    if d.empty:
        return _bloco_vazio("rede_escolar", ["dependencia", "localizacao"])

    total = (
        d[(d["dependencia"] == "total") & (d["localizacao"] == "total")]
        .sort_values("ano")
    )
    serie_total = [
        {"ano": int(r["ano"]), "valor": ri(r["escolas"])}
        for _, r in total.iterrows() if limpar_null(r["escolas"]) is not None
    ]

    por_dep = {}
    for dep in ["publica", "privada", "estadual", "municipal", "federal"]:
        sub = d[(d["dependencia"] == dep) & (d["localizacao"] == "total")].sort_values("ano")
        serie = [
            {"ano": int(r["ano"]), "valor": ri(r["escolas"])}
            for _, r in sub.iterrows() if limpar_null(r["escolas"]) is not None
        ]
        if serie:
            por_dep[dep] = serie

    por_loc = {}
    for loc in ["urbana", "rural"]:
        sub = d[(d["dependencia"] == "total") & (d["localizacao"] == loc)].sort_values("ano")
        serie = [
            {"ano": int(r["ano"]), "valor": ri(r["escolas"])}
            for _, r in sub.iterrows() if limpar_null(r["escolas"]) is not None
        ]
        if serie:
            por_loc[loc] = serie

    deps_rede = ["publica", "privada", "estadual", "municipal", "federal"]
    locs = ["urbana", "rural"]
    detalhamentos = {
        "por_rede": detalhamento_rede_escolar(d, ["dependencia"], {"dependencia": deps_rede, "localizacao": "total"}),
        "por_localizacao": detalhamento_rede_escolar(d, ["localizacao"], {"dependencia": "total", "localizacao": locs}),
        "por_rede_localizacao": detalhamento_rede_escolar(d, ["dependencia", "localizacao"], {"dependencia": deps_rede, "localizacao": locs}),
        "infraestrutura_por_rede": detalhamento_rede_escolar(d, ["dependencia"], {"dependencia": deps_rede, "localizacao": "total"}),
        "infraestrutura_por_localizacao": detalhamento_rede_escolar(d, ["localizacao"], {"dependencia": "total", "localizacao": locs}),
    }

    # Internet
    serie_internet = [
        {
            "ano": int(r["ano"]),
            "perc_internet": r1(r["perc_internet"]),
            "perc_banda_larga": r1(r["perc_banda_larga"]),
        }
        for _, r in total.iterrows()
        if limpar_null(r["perc_internet"]) is not None
    ]

    ultimo_ano = int(total["ano"].max()) if not total.empty else None
    resumo = _resumo_rede(d, ultimo_ano)

    # ── Escolas por etapa de ensino ──
    por_etapa_series = {}
    por_etapa_resumo = {}
    detalhamentos_etapa = {}

    if df_etapa is not None:
        de = df_etapa[df_etapa["id_municipio"] == id_mun].copy()
        if not de.empty:
            for etapa in sorted(de["etapa_ensino"].unique()):
                sub = de[
                    (de["etapa_ensino"] == etapa)
                    & (de["dependencia"] == "total")
                    & (de["localizacao"] == "total")
                ].sort_values("ano")
                serie = [
                    {"ano": int(r["ano"]), "valor": ri(r["escolas"])}
                    for _, r in sub.iterrows() if limpar_null(r["escolas"]) is not None
                ]
                if serie:
                    por_etapa_series[etapa] = serie
                    por_etapa_resumo[etapa] = serie[-1]["valor"]

            detalhamentos_etapa = {
                "por_etapa": detalhamento_escolas_etapa(
                    de, ["etapa_ensino"],
                    {"dependencia": "total", "localizacao": "total"},
                ),
                "por_etapa_rede": detalhamento_escolas_etapa(
                    de, ["etapa_ensino", "dependencia"],
                    {"dependencia": deps_rede, "localizacao": "total"},
                ),
                "por_etapa_localizacao": detalhamento_escolas_etapa(
                    de, ["etapa_ensino", "localizacao"],
                    {"dependencia": "total", "localizacao": locs},
                ),
            }

    bloco = {
        "series": {
            "total": serie_total,
            "por_dependencia": por_dep,
            "por_localizacao": por_loc,
            "internet": serie_internet,
        },
        "detalhamentos": detalhamentos,
        "ultimo_ano": ultimo_ano,
        "resumo_ultimo_ano": resumo,
        "dimensoes_disponiveis": ["dependencia", "localizacao"],
        "campos_indisponiveis": [],
    }

    infra = montar_bloco_infraestrutura(df, id_mun)
    if infra is not None:
        bloco["infraestrutura"] = infra

    if por_etapa_series:
        bloco["series"]["por_etapa"] = por_etapa_series
        bloco["resumo_ultimo_ano"]["por_etapa"] = por_etapa_resumo
        bloco["detalhamentos"].update(detalhamentos_etapa)
        bloco["dimensoes_disponiveis"].append("etapa_ensino")

    return bloco


def _resumo_rede(d, ano):
    if ano is None:
        return {}
    d_ano = d[d["ano"] == ano]
    total = d_ano[(d_ano["dependencia"] == "total") & (d_ano["localizacao"] == "total")]
    if total.empty:
        return {}
    row = total.iloc[0]
    urbana = d_ano[(d_ano["dependencia"] == "total") & (d_ano["localizacao"] == "urbana")]["escolas"]
    rural = d_ano[(d_ano["dependencia"] == "total") & (d_ano["localizacao"] == "rural")]["escolas"]
    publica = d_ano[(d_ano["dependencia"] == "publica") & (d_ano["localizacao"] == "total")]["escolas"]
    privada = d_ano[(d_ano["dependencia"] == "privada") & (d_ano["localizacao"] == "total")]["escolas"]
    return {
        "total_escolas": ri(limpar_null(row["escolas"])),
        "escolas_urbana": ri(limpar_null(urbana.iloc[0] if len(urbana) else None)),
        "escolas_rural": ri(limpar_null(rural.iloc[0] if len(rural) else None)),
        "escolas_publica": ri(limpar_null(publica.iloc[0] if len(publica) else None)),
        "escolas_privada": ri(limpar_null(privada.iloc[0] if len(privada) else None)),
        "perc_internet": r1(limpar_null(row["perc_internet"])),
        "perc_banda_larga": r1(limpar_null(row["perc_banda_larga"])),
    }


# ── Bloco: Infraestrutura Escolar ────────────────────────────────────────


def _extrair_infra_por_linha(row):
    """Extrai todas as métricas de infraestrutura de uma linha do DataFrame."""
    escolas = limpar_null(row.get("escolas"))
    if escolas is None or escolas <= 0:
        return {}
    dados = {"escolas": int(escolas)}
    for key, count_col, perc_col in INFRA_METRICAS:
        if key == "rede_wireless":
            c1 = limpar_null(row.get("escolas_com_rede_local_wireless"))
            c2 = limpar_null(row.get("escolas_com_rede_local_cabo_wireless"))
            count = (c1 or 0) + (c2 or 0)
            dados[perc_col] = r1(count / escolas * 100) if count > 0 else 0.0
        else:
            count = limpar_null(row.get(count_col))
            if count is not None:
                dados[perc_col] = r1(count / escolas * 100) if count > 0 else 0.0
    return dados


def _serie_infra_metricas(total_df):
    """Constrói séries temporais para cada métrica de infraestrutura."""
    metricas = {}
    for key, _, perc_col in INFRA_METRICAS:
        serie = []
        for _, r in total_df.iterrows():
            extraido = _extrair_infra_por_linha(r)
            if perc_col in extraido:
                serie.append({"ano": int(r["ano"]), "valor": extraido[perc_col]})
        if serie:
            metricas[key] = serie
    return metricas


def _resumo_infra(d_ano):
    """Extrai o resumo do último ano para todas as métricas de infraestrutura."""
    if d_ano.empty:
        return {}
    row = d_ano.iloc[0]
    resumo = {}
    extraido = _extrair_infra_por_linha(row)
    for key, _, perc_col in INFRA_METRICAS:
        if perc_col in extraido:
            resumo[key] = extraido[perc_col]
    return resumo


def detalhamento_infraestrutura(df, dimensoes, filtros=None):
    """Detalhamento de infraestrutura por dimensão (rede/localização)."""
    filtros = filtros or {}
    sub = df.copy()
    for coluna, valores in filtros.items():
        if not isinstance(valores, (list, tuple, set)):
            valores = [valores]
        sub = sub[sub[coluna].isin(valores)]
    if sub.empty:
        return []

    linhas = []
    for _, r in sub.sort_values(["ano", *dimensoes]).iterrows():
        escolas = limpar_null(r.get("escolas"))
        if escolas is None:
            continue
        linha = {"ano": int(r["ano"]), "escolas": ri(escolas)}
        extraido = _extrair_infra_por_linha(r)
        linha.update(extraido)
        for dimensao in dimensoes:
            linha[dimensao] = r[dimensao]
        if len(linha) > 2 + len(dimensoes):
            linhas.append(linha)
    return linhas


def montar_bloco_infraestrutura(df, id_mun):
    """Constroi o bloco de infraestrutura para um municipio."""
    d = df[df["id_municipio"] == id_mun].copy()
    if d.empty:
        return None

    total = d[(d["dependencia"] == "total") & (d["localizacao"] == "total")].sort_values("ano")
    if total.empty:
        return None

    series = _serie_infra_metricas(total)

    deps_rede = ["publica", "privada", "estadual", "municipal", "federal"]
    locs = ["urbana", "rural"]

    por_rede = detalhamento_infraestrutura(
        d, ["dependencia"], {"dependencia": deps_rede, "localizacao": "total"}
    )
    por_localizacao = detalhamento_infraestrutura(
        d, ["localizacao"], {"dependencia": "total", "localizacao": locs}
    )

    ultimo_ano = int(total["ano"].max()) if not total.empty else None
    d_ano = total[total["ano"] == ultimo_ano] if ultimo_ano else pd.DataFrame()
    resumo = _resumo_infra(d_ano)

    if not series and not resumo:
        return None

    return {
        "series": series,
        "ultimo_ano": ultimo_ano,
        "resumo_ultimo_ano": resumo,
        "por_rede": por_rede,
        "por_localizacao": por_localizacao,
    }


# ── Bloco: Turmas e Docentes ─────────────────────────────────────────────


def montar_bloco_turmas(df, id_mun):
    d = df[df["id_municipio"] == id_mun].copy()
    if d.empty:
        return _bloco_vazio(
            "turmas_docentes", ["etapa_ensino", "dependencia", "localizacao"], AVISOS_TURMAS
        )

    total = (
        d[(d["dependencia"] == "total") & (d["localizacao"] == "total")]
        .groupby("ano")
        .agg(turmas=("turmas", "sum"), docentes=("docentes", "sum"), matriculas=("matriculas", "sum"))
        .reset_index()
        .sort_values("ano")
    )
    serie_total = []
    for _, r in total.iterrows():
        t = limpar_null(r["turmas"])
        if t is None:
            continue
        apt = r1(r["matriculas"] / r["turmas"]) if limpar_null(r["turmas"]) and r["turmas"] > 0 else None
        apd = r1(r["matriculas"] / r["docentes"]) if limpar_null(r["docentes"]) and r["docentes"] > 0 else None
        serie_total.append({
            "ano": int(r["ano"]),
            "turmas": ri(t),
            "docentes": ri(limpar_null(r["docentes"])),
            "alunos_por_turma": apt,
            "alunos_por_docente": apd,
        })

    por_etapa = {}
    for etapa in sorted(d["etapa_ensino"].unique()):
        sub = (
            d[(d["etapa_ensino"] == etapa) & (d["dependencia"] == "total") & (d["localizacao"] == "total")]
            .sort_values("ano")
        )
        serie = []
        for _, r in sub.iterrows():
            t = limpar_null(r["turmas"])
            if t is None:
                continue
            apt = r1(r["matriculas"] / r["turmas"]) if limpar_null(r["turmas"]) and r["turmas"] > 0 else None
            serie.append({
                "ano": int(r["ano"]),
                "turmas": ri(t),
                "docentes": ri(limpar_null(r["docentes"])),
                "alunos_por_turma": apt,
            })
        if serie:
            por_etapa[etapa] = serie

    deps_rede = ["publica", "privada", "estadual", "municipal", "federal"]
    locs = ["urbana", "rural"]
    detalhamentos = {
        "por_etapa": detalhamento_turmas(d, ["etapa_ensino"], {"dependencia": "total", "localizacao": "total"}),
        "por_rede": detalhamento_turmas(d, ["dependencia"], {"dependencia": deps_rede, "localizacao": "total"}),
        "por_localizacao": detalhamento_turmas(d, ["localizacao"], {"dependencia": "total", "localizacao": locs}),
        "por_etapa_rede": detalhamento_turmas(d, ["etapa_ensino", "dependencia"], {"dependencia": deps_rede, "localizacao": "total"}),
        "por_etapa_localizacao": detalhamento_turmas(d, ["etapa_ensino", "localizacao"], {"dependencia": "total", "localizacao": locs}),
        "por_rede_localizacao": detalhamento_turmas(d, ["dependencia", "localizacao"], {"dependencia": deps_rede, "localizacao": locs}),
    }

    ultimo_ano = int(total["ano"].max()) if not total.empty else None
    resumo = _resumo_turmas(total, ultimo_ano)

    return {
        "series": {
            "total": serie_total,
            "por_etapa": por_etapa,
        },
        "detalhamentos": detalhamentos,
        "ultimo_ano": ultimo_ano,
        "resumo_ultimo_ano": resumo,
        "dimensoes_disponiveis": ["etapa_ensino", "dependencia", "localizacao"],
        "campos_indisponiveis": [],
        "avisos": AVISOS_TURMAS,
    }


def _resumo_turmas(total, ano):
    if ano is None or total.empty:
        return {}
    row = total[total["ano"] == ano]
    if row.empty:
        return {}
    r = row.iloc[0]
    apt = r1(r["matriculas"] / r["turmas"]) if limpar_null(r["turmas"]) and r["turmas"] > 0 else None
    apd = r1(r["matriculas"] / r["docentes"]) if limpar_null(r["docentes"]) and r["docentes"] > 0 else None
    return {
        "turmas": ri(limpar_null(r["turmas"])),
        "docentes": ri(limpar_null(r["docentes"])),
        "alunos_por_turma": apt,
        "alunos_por_docente": apd,
    }


# ── Bloco: Fluxo ─────────────────────────────────────────────────────────


def montar_bloco_fluxo(df, id_mun):
    d = df[df["id_municipio"] == id_mun].copy()
    if d.empty:
        return _bloco_vazio("fluxo", ["etapa_ensino", "dependencia", "localizacao"], AVISOS_FLUXO)

    # Para distorcao, usar apenas localizacao=total
    d_dist = d[d["localizacao"] == "total"].copy()

    # Serie por etapa (dependencia=total, localizacao=total)
    por_etapa = {}
    for etapa in sorted(d["etapa_ensino"].unique()):
        sub = d[
            (d["etapa_ensino"] == etapa)
            & (d["dependencia"] == "total")
            & (d["localizacao"] == "total")
        ].sort_values("ano")
        serie = []
        for _, r in sub.iterrows():
            ponto = {"ano": int(r["ano"])}
            for col in ["taxa_aprovacao", "taxa_reprovacao", "taxa_abandono", "taxa_distorcao"]:
                v = limpar_null(r.get(col))
                if v is not None:
                    ponto[col] = r1(v)
            if len(ponto) > 1:
                serie.append(ponto)
        if serie:
            por_etapa[etapa] = serie

    # Serie por dependencia (etapa=fundamental, localizacao=total)
    por_dep = {}
    for dep in ["publica", "privada", "estadual", "municipal"]:
        sub = d[
            (d["etapa_ensino"] == "fundamental")
            & (d["dependencia"] == dep)
            & (d["localizacao"] == "total")
        ].sort_values("ano")
        serie = []
        for _, r in sub.iterrows():
            ponto = {"ano": int(r["ano"])}
            for col in ["taxa_aprovacao", "taxa_reprovacao", "taxa_abandono", "taxa_distorcao"]:
                v = limpar_null(r.get(col))
                if v is not None:
                    ponto[col] = r1(v)
            if len(ponto) > 1:
                serie.append(ponto)
        if serie:
            por_dep[dep] = serie

    deps_rede = ["publica", "privada", "estadual", "municipal", "federal"]
    locs = ["urbana", "rural"]
    detalhamentos = {
        "por_etapa": detalhamento_fluxo(d, ["etapa_ensino"], {"dependencia": "total", "localizacao": "total"}),
        "por_rede": detalhamento_fluxo(d, ["dependencia"], {"etapa_ensino": "fundamental", "dependencia": deps_rede, "localizacao": "total"}),
        "por_localizacao": detalhamento_fluxo(d, ["localizacao"], {"etapa_ensino": "fundamental", "dependencia": "total", "localizacao": locs}, incluir_distorcao=False),
        "por_etapa_rede": detalhamento_fluxo(d, ["etapa_ensino", "dependencia"], {"dependencia": deps_rede, "localizacao": "total"}),
        "por_etapa_localizacao": detalhamento_fluxo(d, ["etapa_ensino", "localizacao"], {"dependencia": "total", "localizacao": locs}, incluir_distorcao=False),
    }

    ultimo_ano = int(d["ano"].max())
    resumo = _resumo_fluxo(d, ultimo_ano)

    return {
        "series": {
            "por_etapa": por_etapa,
            "por_dependencia": por_dep,
        },
        "detalhamentos": detalhamentos,
        "ultimo_ano": ultimo_ano,
        "resumo_ultimo_ano": resumo,
        "dimensoes_disponiveis": ["etapa_ensino", "dependencia", "localizacao"],
        "campos_indisponiveis": _campos_indisponiveis_fluxo(d, ultimo_ano),
        "avisos": AVISOS_FLUXO,
    }


def _resumo_fluxo(d, ano):
    if ano is None:
        return {}
    d_ano = d[
        (d["ano"] == ano)
        & (d["etapa_ensino"] == "fundamental")
        & (d["dependencia"] == "total")
        & (d["localizacao"] == "total")
    ]
    if d_ano.empty:
        return {}
    r = d_ano.iloc[0]
    return {
        "taxa_aprovacao": r1(limpar_null(r["taxa_aprovacao"])),
        "taxa_reprovacao": r1(limpar_null(r["taxa_reprovacao"])),
        "taxa_abandono": r1(limpar_null(r["taxa_abandono"])),
        "taxa_distorcao": r1(limpar_null(r["taxa_distorcao"])),
    }


def _campos_indisponiveis_fluxo(d, ano):
    if ano is None:
        return ["taxa_aprovacao", "taxa_reprovacao", "taxa_abandono", "taxa_distorcao"]
    d_ano = d[
        (d["ano"] == ano)
        & (d["etapa_ensino"] == "fundamental")
        & (d["dependencia"] == "total")
        & (d["localizacao"] == "total")
    ]
    if d_ano.empty:
        return ["taxa_aprovacao", "taxa_reprovacao", "taxa_abandono", "taxa_distorcao"]
    r = d_ano.iloc[0]
    indisponiveis = []
    for col in ["taxa_aprovacao", "taxa_reprovacao", "taxa_abandono", "taxa_distorcao"]:
        if limpar_null(r.get(col)) is None:
            indisponiveis.append(col)
    return indisponiveis


# ── Bloco: Aprendizagem ──────────────────────────────────────────────────


def montar_bloco_aprendizagem(df, id_mun):
    d = df[df["id_municipio"] == id_mun].copy()
    if d.empty:
        return _bloco_vazio("aprendizagem", ["etapa_ensino", "dependencia"], AVISOS_APRENDIZAGEM)

    # IDEB por etapa
    ideb = {}
    for etapa in sorted(d["etapa_ensino"].dropna().unique()):
        sub = d[
            (d["etapa_ensino"] == etapa)
            & (d["dependencia"].isin(["total", "publica"]))
        ].sort_values("ano")
        serie = []
        for _, r in sub.iterrows():
            v = limpar_null(r.get("ideb"))
            if v is not None:
                serie.append({
                    "ano": int(r["ano"]),
                    "ideb": r1(v),
                    "saeb_lp": r1(limpar_null(r.get("saeb_lp"))),
                    "saeb_mt": r1(limpar_null(r.get("saeb_mt"))),
                })
        if serie:
            ideb[etapa] = serie

    # Alfabetizacao
    alf = d[d["taxa_alfabetizacao"].notna()].sort_values("ano")
    serie_alf = [
        {"ano": int(r["ano"]), "taxa_alfabetizacao": r1(r["taxa_alfabetizacao"])}
        for _, r in alf.iterrows() if limpar_null(r["taxa_alfabetizacao"]) is not None
    ]

    # INSE
    inse = d[d["media_inse"].notna()].sort_values("ano")
    serie_inse = [
        {
            "ano": int(r["ano"]),
            "media_inse": r1(r["media_inse"]),
            "qtd_alunos_inse": ri(limpar_null(r.get("qtd_alunos_inse"))),
        }
        for _, r in inse.iterrows() if limpar_null(r["media_inse"]) is not None
    ]

    ultimo_ideb = max((int(s[-1]["ano"]) for s in ideb.values() if s), default=None)
    ultimo_alf = serie_alf[-1]["ano"] if serie_alf else None
    ultimo_inse = serie_inse[-1]["ano"] if serie_inse else None

    resumo = _resumo_aprendizagem(ideb, serie_alf, serie_inse)
    deps_rede = ["total", "publica", "privada", "estadual", "municipal", "federal"]
    detalhamentos = {
        "por_etapa": detalhamento_aprendizagem(d, ["etapa_ensino"], {"dependencia": ["total", "publica"]}),
        "por_rede": detalhamento_aprendizagem(d, ["dependencia"], {"dependencia": deps_rede}),
        "por_etapa_rede": detalhamento_aprendizagem(d, ["etapa_ensino", "dependencia"], {"dependencia": deps_rede}),
    }

    return {
        "series": {
            "ideb": ideb,
            "alfabetizacao": serie_alf,
            "inse": serie_inse,
        },
        "detalhamentos": detalhamentos,
        "ultimo_ano": {
            "ideb": ultimo_ideb,
            "alfabetizacao": ultimo_alf,
            "inse": ultimo_inse,
        },
        "resumo_ultimo_ano": resumo,
        "dimensoes_disponiveis": ["etapa_ensino", "dependencia"],
        "campos_indisponiveis": _campos_indisponiveis_aprendizagem(d),
        "avisos": AVISOS_APRENDIZAGEM,
    }


def _resumo_aprendizagem(ideb, serie_alf, serie_inse):
    resumo = {}
    # Ultimo IDEB por etapa
    for etapa, serie in ideb.items():
        if serie:
            last = serie[-1]
            resumo[f"ideb_{etapa}"] = last["ideb"]
            resumo[f"saeb_lp_{etapa}"] = last.get("saeb_lp")
            resumo[f"saeb_mt_{etapa}"] = last.get("saeb_mt")
            resumo[f"ano_ideb_{etapa}"] = last["ano"]
    if serie_alf:
        resumo["taxa_alfabetizacao"] = serie_alf[-1]["taxa_alfabetizacao"]
        resumo["ano_alfabetizacao"] = serie_alf[-1]["ano"]
    if serie_inse:
        resumo["media_inse"] = serie_inse[-1]["media_inse"]
        resumo["qtd_alunos_inse"] = serie_inse[-1]["qtd_alunos_inse"]
        resumo["ano_inse"] = serie_inse[-1]["ano"]
    return resumo


def _campos_indisponiveis_aprendizagem(d):
    indisponiveis = []
    if d["ideb"].isna().all():
        indisponiveis.append("ideb")
    if d["taxa_alfabetizacao"].isna().all():
        indisponiveis.append("taxa_alfabetizacao")
    if d["media_inse"].isna().all():
        indisponiveis.append("media_inse")
    return indisponiveis


# ── Bloco: Oferta Tecnica ────────────────────────────────────────────────


def montar_bloco_oferta(df, id_mun, df_faixa_etaria=None):
    d = df[df["id_municipio"] == id_mun].copy()
    if d.empty:
        return _bloco_vazio("oferta_tecnica", ["modalidade", "dependencia", "faixa_etaria"], AVISOS_OFERTA)

    total = d[d["dependencia"] == "total"].copy()
    por_modalidade = {}
    for mod in sorted(total["modalidade"].unique()):
        sub = total[total["modalidade"] == mod].sort_values("ano")
        serie = [
            {"ano": int(r["ano"]), "valor": ri(r["matriculas"])}
            for _, r in sub.iterrows() if limpar_null(r["matriculas"]) is not None
        ]
        if serie:
            por_modalidade[mod] = serie

    serie_total = (
        total.groupby("ano")["matriculas"].sum(min_count=1).reset_index().sort_values("ano")
    )
    serie_total_list = [
        {"ano": int(r["ano"]), "valor": ri(r["matriculas"])}
        for _, r in serie_total.iterrows() if limpar_null(r["matriculas"]) is not None
    ]

    ultimo_ano = int(total["ano"].max()) if not total.empty else None
    resumo = _resumo_oferta(total, ultimo_ano)
    deps_rede = ["total", "publica", "privada", "estadual", "municipal", "federal"]
    detalhamentos = {
        "por_modalidade": detalhamento_oferta(total, ["modalidade"]),
        "por_rede": detalhamento_oferta(d, ["dependencia"], {"dependencia": deps_rede}),
        "por_modalidade_rede": detalhamento_oferta(d, ["modalidade", "dependencia"], {"dependencia": deps_rede}),
    }
    if df_faixa_etaria is not None and not df_faixa_etaria.empty:
        faixa = df_faixa_etaria[
            (df_faixa_etaria["id_municipio"] == id_mun)
            & (df_faixa_etaria["etapa_ensino"] == "profissional")
        ].copy()
        if not faixa.empty:
            detalhamentos["por_faixa_etaria"] = detalhamento_faixa_etaria(faixa, ["faixa_etaria"])
            if "secao_sinopse" in faixa.columns:
                detalhamentos["por_secao_faixa_etaria"] = detalhamento_faixa_etaria(
                    faixa,
                    ["secao_sinopse", "faixa_etaria"],
                )

    return {
        "series": {
            "total": serie_total_list,
            "por_modalidade": por_modalidade,
        },
        "detalhamentos": detalhamentos,
        "ultimo_ano": ultimo_ano,
        "resumo_ultimo_ano": resumo,
        "dimensoes_disponiveis": ["modalidade", "dependencia", "faixa_etaria"],
        "campos_indisponiveis": [],
        "avisos": AVISOS_OFERTA,
    }


def _resumo_oferta(total, ano):
    if ano is None or total.empty:
        return {}
    d_ano = total[total["ano"] == ano]
    total_mat = d_ano["matriculas"].sum()
    por_mod = {}
    for mod in d_ano["modalidade"].unique():
        val = d_ano[d_ano["modalidade"] == mod]["matriculas"].iloc[0]
        v = limpar_null(val)
        if v is not None:
            por_mod[mod] = ri(v)
    return {
        "total_matriculas_tecnicas": ri(limpar_null(total_mat)),
        "por_modalidade": por_mod,
    }


# ── Helpers de bloco vazio ──────────────────────────────────────────────


def _bloco_vazio(nome, dimensoes, avisos=None):
    return {
        "series": {},
        "ultimo_ano": None,
        "resumo_ultimo_ano": {},
        "dimensoes_disponiveis": dimensoes,
        "campos_indisponiveis": ["sem_dados"],
        "avisos": avisos or [],
    }


# ── Exportacao municipal ─────────────────────────────────────────────────


def exportar_municipios(mun_rs, dfs_views):
    """Gera um JSON por municipio RS."""
    print(f"\nExportando {len(mun_rs)} municipios...")
    gerados = 0
    tamanhos = []

    for _, mun in mun_rs.iterrows():
        id_mun = mun["id_municipio"]
        nome = mun["municipio"]

        blocos = {
            "matriculas": montar_bloco_matriculas(
                dfs_views["matriculas"],
                id_mun,
                dfs_views.get("matriculas_faixa_etaria"),
            ),
            "rede_escolar": montar_bloco_rede(
                dfs_views["rede_escolar"], id_mun,
                dfs_views.get("rede_escolar_etapa"),
            ),
            "turmas_docentes": montar_bloco_turmas(dfs_views["turmas"], id_mun),
            "fluxo": montar_bloco_fluxo(dfs_views["fluxo"], id_mun),
            "aprendizagem": montar_bloco_aprendizagem(dfs_views["aprendizagem"], id_mun),
            "oferta_tecnica": montar_bloco_oferta(
                dfs_views["oferta"],
                id_mun,
                dfs_views.get("matriculas_faixa_etaria"),
            ),
        }

        dados = {
            "id_municipio": id_mun,
            "municipio": nome,
            "updated_at": DATA_EXPORTACAO,
            "fontes": FONTES,
            "avisos": AVISOS_GLOBAIS,
            "blocos": blocos,
        }

        path = SAIDA_MUN / f"{id_mun}.json"
        safe_json_dump(dados, path)
        gerados += 1
        tamanho = path.stat().st_size
        tamanhos.append((id_mun, nome, tamanho))

    # Top 5 maiores
    tamanhos.sort(key=lambda x: x[2], reverse=True)
    print(f"  {gerados} arquivos gerados.")
    print(f"  5 maiores arquivos:")
    for id_mun, nome, tam in tamanhos[:5]:
        print(f"    {id_mun} {nome:<25} {tam / 1024:.1f} KB")
    print(f"  Tamanho medio: {sum(t[2] for t in tamanhos) / len(tamanhos) / 1024:.1f} KB")

    return gerados, tamanhos


# ── Exportacao regional ──────────────────────────────────────────────────
# Nota: a pagina de educacao do dashboard usa apenas dados municipais.
# A exportacao regional fica disponivel no script mas nao e chamada por
# padrao. Para reativar, chame exportar_regioes() manualmente.


def exportar_regioes(mun_rs, dfs_views):
    """Gera um JSON por regiao SENAI com dados agregados."""
    regioes = mun_rs.groupby("regiao_senai")
    print(f"\nExportando {len(regioes)} regioes...")
    gerados = 0

    for regiao, grupo in regioes:
        ids_regiao = grupo["id_municipio"].tolist()
        slug = slugify(regiao)

        # Agregar matriculas
        mat_regional = _agregar_matriculas_regional(dfs_views["matriculas"], ids_regiao)
        rede_regional = _agregar_rede_regional(dfs_views["rede_escolar"], ids_regiao)
        turmas_regional = _agregar_turmas_regional(dfs_views["turmas"], ids_regiao)
        fluxo_regional = _agregar_fluxo_regional(dfs_views["fluxo"], ids_regiao)
        aprend_regional = _agregar_aprendizagem_regional(dfs_views["aprendizagem"], ids_regiao)
        oferta_regional = _agregar_oferta_regional(dfs_views["oferta"], ids_regiao)

        dados = {
            "regiao": regiao,
            "slug": slug,
            "municipios_incluidos": ids_regiao,
            "total_municipios": len(ids_regiao),
            "updated_at": DATA_EXPORTACAO,
            "fontes": FONTES,
            "avisos": AVISOS_GLOBAIS + [
                "Dados regionais sao agregacoes de municipios. "
                "Percentuais foram recalculados a partir dos totais somados.",
                "IDEB/SAEB regional usa media simples dos municipios com dado.",
                "INSE regional usa media ponderada por qtd_alunos_inse.",
            ],
            "blocos": {
                "matriculas": mat_regional,
                "rede_escolar": rede_regional,
                "turmas_docentes": turmas_regional,
                "fluxo": fluxo_regional,
                "aprendizagem": aprend_regional,
                "oferta_tecnica": oferta_regional,
            },
        }

        path = SAIDA_REG / f"{slug}.json"
        safe_json_dump(dados, path)
        gerados += 1
        print(f"  {slug:<25} {len(ids_regiao)} municipios  {path.stat().st_size / 1024:.1f} KB")

    return gerados


def _agregar_matriculas_regional(df, ids):
    """Agrega matriculas somando municipios da regiao."""
    d = df[df["id_municipio"].isin(ids)].copy()
    if d.empty:
        return _bloco_vazio("matriculas", ["etapa_ensino", "dependencia", "localizacao"])

    agg = (
        d.groupby(["ano", "dependencia", "localizacao", "etapa_ensino"])
        .agg(matriculas=("matriculas", "sum"), matriculas_integral=("matriculas_integral", "sum"))
        .reset_index()
    )
    # Reaproveita a funcao municipal com id_municipio dummy
    agg["id_municipio"] = "REGIONAL"
    return montar_bloco_matriculas(agg, "REGIONAL")


def _agregar_rede_regional(df, ids):
    d = df[df["id_municipio"].isin(ids)].copy()
    if d.empty:
        return _bloco_vazio("rede_escolar", ["dependencia", "localizacao"])

    agg = (
        d.groupby(["ano", "dependencia", "localizacao"])
        .agg(
            escolas=("escolas", "sum"),
            escolas_com_internet=("escolas_com_internet", "sum"),
            escolas_com_banda_larga=("escolas_com_banda_larga", "sum"),
        )
        .reset_index()
    )
    # Recalcular percentuais
    agg["perc_internet"] = agg.apply(
        lambda r: r1(r["escolas_com_internet"] / r["escolas"] * 100)
        if limpar_null(r["escolas"]) and r["escolas"] > 0 else None,
        axis=1,
    )
    agg["perc_banda_larga"] = agg.apply(
        lambda r: r1(r["escolas_com_banda_larga"] / r["escolas"] * 100)
        if limpar_null(r["escolas"]) and r["escolas"] > 0 else None,
        axis=1,
    )
    agg["id_municipio"] = "REGIONAL"
    return montar_bloco_rede(agg, "REGIONAL")


def _agregar_turmas_regional(df, ids):
    d = df[df["id_municipio"].isin(ids)].copy()
    if d.empty:
        return _bloco_vazio("turmas_docentes", ["etapa_ensino", "dependencia", "localizacao"], AVISOS_TURMAS)

    agg = (
        d.groupby(["ano", "dependencia", "localizacao", "etapa_ensino"])
        .agg(turmas=("turmas", "sum"), docentes=("docentes", "sum"), matriculas=("matriculas", "sum"))
        .reset_index()
    )
    agg["id_municipio"] = "REGIONAL"
    return montar_bloco_turmas(agg, "REGIONAL")


def _agregar_fluxo_regional(df, ids):
    d = df[df["id_municipio"].isin(ids)].copy()
    if d.empty:
        return _bloco_vazio("fluxo", ["etapa_ensino", "dependencia", "localizacao"], AVISOS_FLUXO)

    # Rendimento: media ponderada pelas matriculas seria ideal, mas usamos media simples
    # Distorcao: media simples
    cols_taxa = ["taxa_aprovacao", "taxa_reprovacao", "taxa_abandono", "taxa_distorcao"]
    agg = (
        d.groupby(["ano", "dependencia", "localizacao", "etapa_ensino"])[cols_taxa]
        .mean()
        .reset_index()
    )
    agg["id_municipio"] = "REGIONAL"
    return montar_bloco_fluxo(agg, "REGIONAL")


def _agregar_aprendizagem_regional(df, ids):
    d = df[df["id_municipio"].isin(ids)].copy()
    if d.empty:
        return _bloco_vazio("aprendizagem", ["etapa_ensino", "dependencia"], AVISOS_APRENDIZAGEM)

    # IDEB/SAEB: media simples
    cols_aprend = ["ideb", "saeb_lp", "saeb_mt", "taxa_alfabetizacao"]
    agg_ideb = (
        d.groupby(["ano", "dependencia", "etapa_ensino"])[cols_aprend]
        .mean()
        .reset_index()
    )

    # INSE: media ponderada por qtd_alunos_inse
    inse_rows = d[d["media_inse"].notna()].copy()
    if not inse_rows.empty:
        inse_rows["peso"] = inse_rows["qtd_alunos_inse"].fillna(0)
        for ano in inse_rows["ano"].unique():
            sub = inse_rows[inse_rows["ano"] == ano]
            for rede in sub["dependencia"].unique():
                sub_r = sub[sub["dependencia"] == rede]
                peso_total = sub_r["peso"].sum()
                if peso_total > 0:
                    media_pond = (sub_r["media_inse"] * sub_r["peso"]).sum() / peso_total
                    agg_ideb = pd.concat([
                        agg_ideb,
                        pd.DataFrame([{
                            "ano": ano,
                            "dependencia": rede,
                            "etapa_ensino": None,
                            "ideb": None,
                            "saeb_lp": None,
                            "saeb_mt": None,
                            "taxa_alfabetizacao": None,
                            "media_inse": media_pond,
                            "qtd_alunos_inse": ri(peso_total),
                        }])
                    ], ignore_index=True)
    else:
        agg_ideb["media_inse"] = None
        agg_ideb["qtd_alunos_inse"] = None

    agg_ideb["id_municipio"] = "REGIONAL"
    return montar_bloco_aprendizagem(agg_ideb, "REGIONAL")


def _agregar_oferta_regional(df, ids):
    d = df[df["id_municipio"].isin(ids)].copy()
    if d.empty:
        return _bloco_vazio("oferta_tecnica", ["modalidade", "dependencia"], AVISOS_OFERTA)

    agg = (
        d.groupby(["ano", "dependencia", "modalidade"])["matriculas"]
        .sum(min_count=1)
        .reset_index()
    )
    agg["id_municipio"] = "REGIONAL"
    return montar_bloco_oferta(agg, "REGIONAL")


# ── Municipios index ─────────────────────────────────────────────────────


def gerar_municipios_index(mun_rs):
    """Gera municipios_index.json com mapeamento nome -> id_municipio."""
    municipios = []
    for _, row in mun_rs.iterrows():
        municipios.append({
            "id_municipio": row["id_municipio"],
            "municipio": row["municipio"],
            "slug": slugify(row["municipio"]),
            "caminho": f"educacao/municipios/{row['id_municipio']}.json",
        })
    dados = {"municipios": municipios}
    path = SAIDA / "municipios_index.json"
    safe_json_dump(dados, path)
    print(f"municipios_index.json gerado: {len(municipios)} municipios, "
          f"{path.stat().st_size / 1024:.1f} KB")
    return path


# ── Index.json ───────────────────────────────────────────────────────────


def gerar_index(mun_rs, anos_por_bloco, gerados_mun):
    """Gera o index.json leve com metadados."""

    dados = {
        "updated_at": DATA_EXPORTACAO,
        "anos_disponiveis": anos_por_bloco,
        "total_municipios": len(mun_rs),
        "fontes": FONTES,
        "avisos_metodologicos": AVISOS_GLOBAIS + [
            "Distorcao idade-serie nao tem dimensao de localizacao na fonte.",
            "IDEB e bienal; anos sem avaliacao tem null.",
            "alunos_por_docente pode ser alto em EJA/Infantil.",
        ],
        "blocos_disponiveis": [
            "matriculas", "rede_escolar", "turmas_docentes",
            "fluxo", "aprendizagem", "oferta_tecnica",
        ],
        "campos_indisponiveis": [],
        "caminhos": {
            "municipios_index": "educacao/municipios_index.json",
            "municipios": "educacao/municipios/{id_municipio}.json",
        },
        "arquivos_gerados": {
            "municipios": gerados_mun,
        },
    }

    path = SAIDA / "index.json"
    safe_json_dump(dados, path)
    tamanho = path.stat().st_size
    print(f"\nindex.json gerado: {tamanho / 1024:.1f} KB")
    return path


# ── Validacao ────────────────────────────────────────────────────────────


def validar_jsons(gerados_mun):
    """Executa validacoes nos JSONs gerados."""
    print("\n" + "=" * 60)
    print("VALIDACAO DOS JSONs GERADOS")
    print("=" * 60)

    # 1. JSON valido
    arquivos = list(SAIDA_MUN.glob("*.json")) + [SAIDA / "index.json", SAIDA / "municipios_index.json"]
    print(f"\n1. Total de arquivos: {len(arquivos)}")
    invalidos = 0
    for f in arquivos:
        try:
            with open(f, encoding="utf-8") as fh:
                json.load(fh)
        except Exception as e:
            print(f"  INVALIDO: {f.name} - {e}")
            invalidos += 1
    print(f"  Validos: {len(arquivos) - invalidos}  Invalidos: {invalidos}")

    # 2. NaN/Infinity
    print("\n2. Checagem NaN/Infinity:")
    nan_encontrado = False
    for f in arquivos:
        with open(f, encoding="utf-8") as fh:
            conteudo = fh.read()
        for padrao in ["NaN", "Infinity", "-Infinity"]:
            if padrao in conteudo:
                print(f"  ENCONTRADO '{padrao}' em {f.name}")
                nan_encontrado = True
    if not nan_encontrado:
        print("  OK - nenhum NaN/Infinity encontrado.")

    # 3. Nulls preservados
    print("\n3. Checagem de nulls preservados:")
    amostra = list(SAIDA_MUN.glob("*.json"))[:5]
    for f in amostra:
        with open(f, encoding="utf-8") as fh:
            dados = json.load(fh)
        blocos = dados.get("blocos", {})
        nulls = 0
        for bloco_nome, bloco in blocos.items():
            if isinstance(bloco, dict) and bloco.get("campos_indisponiveis"):
                nulls += len(bloco["campos_indisponiveis"])
        # Verificar se null aparece no JSON
        conteudo = f.read_text(encoding="utf-8")
        if ":null" in conteudo or ": null" in conteudo:
            pass  # null preservado
        print(f"  {f.stem}: nulls preservados={'Sim' if ':null' in conteudo or ': null' in conteudo else 'Nao'}")

    # 4. Tamanhos
    print("\n4. Tamanhos:")
    for f in sorted(arquivos, key=lambda x: x.stat().st_size, reverse=True)[:10]:
        print(f"  {f.relative_to(SAIDA)}: {f.stat().st_size / 1024:.1f} KB")

    # 5. index.json leve
    idx_path = SAIDA / "index.json"
    idx_size = idx_path.stat().st_size
    print(f"\n5. index.json: {idx_size / 1024:.1f} KB ({'LEVE' if idx_size < 50000 else 'PESADO'})")

    # 6. Cobertura por bloco
    print("\n6. Cobertura por bloco (5 municipios amostra):")
    amostra = [f for f in SAIDA_MUN.glob("*.json")][:5]
    for f in amostra:
        with open(f, encoding="utf-8") as fh:
            dados = json.load(fh)
        cobertura = {}
        for bloco, conteudo in dados.get("blocos", {}).items():
            tem_dados = bool(conteudo.get("series"))
            indisponiveis = conteudo.get("campos_indisponiveis", [])
            cobertura[bloco] = "OK" if tem_dados and "sem_dados" not in indisponiveis else "SEM_DADOS"
        print(f"  {f.stem}: {cobertura}")

    # 7. Exemplos
    print("\n7. Exemplos de 3 municipios (resumo):")
    for f in amostra[:3]:
        with open(f, encoding="utf-8") as fh:
            dados = json.load(fh)
        print(f"  {dados['id_municipio']} {dados['municipio']}:")
        for bloco, conteudo in dados.get("blocos", {}).items():
            resumo = conteudo.get("resumo_ultimo_ano", {})
            ultimo = conteudo.get("ultimo_ano")
            if isinstance(ultimo, dict):
                ultimo_str = str(ultimo)
            else:
                ultimo_str = str(ultimo)
            print(f"    {bloco}: ultimo_ano={ultimo_str}, resumo={str(resumo)[:80]}")

    # 8. Reconciliacao da oferta tecnica
    print("\n8. Reconciliacao Oferta tecnica (redes = total):")
    divergencias = []
    redes_detalhadas = {"federal", "estadual", "municipal", "privada"}
    for f in SAIDA_MUN.glob("*.json"):
        with open(f, encoding="utf-8") as fh:
            dados = json.load(fh)
        oferta = dados.get("blocos", {}).get("oferta_tecnica", {})
        total_por_ano = {
            int(p["ano"]): limpar_null(p.get("valor"))
            for p in oferta.get("series", {}).get("total", [])
        }
        rede_por_ano = defaultdict(int)
        for row in oferta.get("detalhamentos", {}).get("por_rede", []):
            if row.get("dependencia") not in redes_detalhadas:
                continue
            valor = limpar_null(row.get("matriculas", row.get("valor")))
            if valor is not None:
                rede_por_ano[int(row["ano"])] += valor
        for ano, total in total_por_ano.items():
            if total is None:
                continue
            soma_redes = rede_por_ano.get(ano, 0)
            if ri(total) != ri(soma_redes):
                divergencias.append(
                    (dados["id_municipio"], dados["municipio"], ano, ri(total), ri(soma_redes))
                )
                if len(divergencias) >= 10:
                    break
        if len(divergencias) >= 10:
            break
    if divergencias:
        print("  DIVERGENCIAS encontradas (primeiras 10):")
        for id_mun, nome, ano, total, soma_redes in divergencias:
            print(f"    {id_mun} {nome} {ano}: total={total}, redes={soma_redes}")
        raise ValueError("Oferta tecnica por rede nao reconcilia com a serie principal.")
    print("  OK - soma das redes detalhadas fecha com a serie principal.")


# ── Main ─────────────────────────────────────────────────────────────────


def main():
    print("Exportador de Indicadores da Educacao")
    print(f"Data: {DATA_EXPORTACAO}")
    print(f"Saida: {SAIDA}")
    print()

    # 1. Carregar municipios RS
    mun_rs = carregar_municipios_rs()
    rs_ids = mun_rs["id_municipio"].tolist()
    print(f"Municipios RS: {len(rs_ids)}")

    # 2. Carregar views
    print("\nCarregando views...")
    dfs = {}
    print("  vw_educacao_matriculas...", end=" ")
    dfs["matriculas"] = carregar_view("vw_educacao_matriculas", rs_ids)
    print(f"{len(dfs['matriculas'])} rows")

    print("  vw_educacao_matriculas_faixa_etaria...", end=" ")
    dfs["matriculas_faixa_etaria"] = carregar_view(
        "vw_educacao_matriculas_faixa_etaria",
        rs_ids,
    )
    print(f"{len(dfs['matriculas_faixa_etaria'])} rows")

    print("  vw_educacao_rede_escolar...", end=" ")
    dfs["rede_escolar"] = carregar_view("vw_educacao_rede_escolar", rs_ids)
    print(f"{len(dfs['rede_escolar'])} rows")

    print("  vw_educacao_rede_escolar_etapa...", end=" ")
    dfs["rede_escolar_etapa"] = carregar_view("vw_educacao_rede_escolar_etapa", rs_ids)
    print(f"{len(dfs['rede_escolar_etapa'])} rows")

    print("  vw_educacao_turmas_docentes...", end=" ")
    dfs["turmas"] = carregar_view("vw_educacao_turmas_docentes", rs_ids)
    print(f"{len(dfs['turmas'])} rows")

    print("  vw_educacao_fluxo...", end=" ")
    dfs["fluxo"] = carregar_view("vw_educacao_fluxo", rs_ids)
    print(f"{len(dfs['fluxo'])} rows")

    print("  vw_educacao_aprendizagem (filtrar RS)...", end=" ")
    dfs["aprendizagem"] = carregar_view("vw_educacao_aprendizagem", rs_ids)
    print(f"{len(dfs['aprendizagem'])} rows")

    print("  vw_educacao_oferta_tecnica...", end=" ")
    dfs["oferta"] = carregar_view("vw_educacao_oferta_tecnica", rs_ids)
    print(f"{len(dfs['oferta'])} rows")

    # 3. Anos por bloco
    anos_por_bloco = {}
    for nome, df in dfs.items():
        if not df.empty and "ano" in df.columns:
            anos_por_bloco[nome] = sorted(df["ano"].unique().tolist())

    # 4. Exportar municipios
    gerados_mun, tamanhos = exportar_municipios(mun_rs, dfs)

    # 5. Gerar municipios_index.json
    gerar_municipios_index(mun_rs)

    # 6. Gerar index
    gerar_index(mun_rs, anos_por_bloco, gerados_mun)

    # 7. Validar
    validar_jsons(gerados_mun)

    print(f"\nConcluido! {gerados_mun} municipios + municipios_index.json + index.json")


if __name__ == "__main__":
    main()
