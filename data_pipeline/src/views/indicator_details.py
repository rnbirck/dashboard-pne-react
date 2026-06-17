import pandas as pd

from src.data_loader import load_creche_por_dependencia_data
from src.data_loader import load_pre_escola_por_dependencia_data


_DEPENDENCIA_ORDER = ["municipal", "estadual", "privada", "federal"]


def _safe_load(loader):
    try:
        return loader()
    except Exception as exc:
        print(f"Erro ao carregar dados complementares: {exc}")
        return pd.DataFrame()


def _normalizar_dependencia(value):
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    normalized = (
        str(value)
        .lower()
        .strip()
        .replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .replace("ã", "a")
        .replace("õ", "o")
        .replace("ç", "c")
    )
    if normalized in {"publica", "pública"}:
        return None
    return normalized if normalized in _DEPENDENCIA_ORDER else None


def build_creche_details(municipio):
    df = _safe_load(load_creche_por_dependencia_data)
    if df.empty or "municipio" not in df.columns:
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["mat_infantil_creche"] = pd.to_numeric(
        dff["mat_infantil_creche"], errors="coerce"
    )
    dff["dependencia"] = dff["dependencia"].apply(_normalizar_dependencia)
    dff = dff.dropna(subset=["ano", "mat_infantil_creche", "dependencia"]).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff["mat_infantil_creche"] = dff["mat_infantil_creche"].clip(lower=0)

    grouped = (
        dff.groupby(["ano", "dependencia"], as_index=False)["mat_infantil_creche"]
        .sum()
        .sort_values(["ano", "dependencia"])
    )

    total_by_year = (
        grouped.groupby("ano", as_index=False)["mat_infantil_creche"]
        .sum()
        .rename(columns={"mat_infantil_creche": "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    pivot = grouped.pivot(
        index="ano", columns="dependencia", values="mat_infantil_creche"
    ).fillna(0)
    for dep in _DEPENDENCIA_ORDER:
        if dep not in pivot.columns:
            pivot[dep] = 0
    pivot = pivot[_DEPENDENCIA_ORDER].reset_index().sort_values("ano")

    series_dependencia = [
        {
            "ano": int(row["ano"]),
            "municipal": int(row["municipal"]),
            "estadual": int(row["estadual"]),
            "privada": int(row["privada"]),
            "federal": int(row["federal"]),
        }
        for _, row in pivot.iterrows()
    ]

    if not series_total or not series_dependencia:
        return None

    return {
        "title": "Matrículas em creche",
        "subtitle": "Total de matrículas de 0 a 3 anos em creche e distribuição por dependência administrativa.",
        "unit": "matrículas",
        "series_total": series_total,
        "series_dependencia": series_dependencia,
    }


def build_pre_escola_details(municipio):
    df = _safe_load(load_pre_escola_por_dependencia_data)
    if df.empty or "municipio" not in df.columns:
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["mat_infantil_pre"] = pd.to_numeric(
        dff["mat_infantil_pre"], errors="coerce"
    )
    dff["dependencia"] = dff["dependencia"].apply(_normalizar_dependencia)
    dff = dff.dropna(subset=["ano", "mat_infantil_pre", "dependencia"]).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff["mat_infantil_pre"] = dff["mat_infantil_pre"].clip(lower=0)

    grouped = (
        dff.groupby(["ano", "dependencia"], as_index=False)["mat_infantil_pre"]
        .sum()
        .sort_values(["ano", "dependencia"])
    )

    total_by_year = (
        grouped.groupby("ano", as_index=False)["mat_infantil_pre"]
        .sum()
        .rename(columns={"mat_infantil_pre": "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    pivot = grouped.pivot(
        index="ano", columns="dependencia", values="mat_infantil_pre"
    ).fillna(0)
    for dep in _DEPENDENCIA_ORDER:
        if dep not in pivot.columns:
            pivot[dep] = 0
    pivot = pivot[_DEPENDENCIA_ORDER].reset_index().sort_values("ano")

    series_dependencia = [
        {
            "ano": int(row["ano"]),
            "municipal": int(row["municipal"]),
            "estadual": int(row["estadual"]),
            "privada": int(row["privada"]),
            "federal": int(row["federal"]),
        }
        for _, row in pivot.iterrows()
    ]

    if not series_total or not series_dependencia:
        return None

    return {
        "title": "Matrículas na pré-escola",
        "subtitle": "Total de matrículas de 4 a 5 anos na pré-escola e distribuição por dependência administrativa.",
        "unit": "matrículas",
        "series_total": series_total,
        "series_dependencia": series_dependencia,
    }


DETAIL_BUILDERS = {
    "creche": build_creche_details,
    "pre_escola": build_pre_escola_details,
}


def build_indicator_details(municipio):
    details = {}
    for indicator_key, builder in DETAIL_BUILDERS.items():
        try:
            data = builder(municipio)
            if data is not None and isinstance(data, dict) and data:
                details[indicator_key] = data
        except Exception as exc:
            print(
                f"Aviso: erro ao construir dados complementares para "
                f"'{indicator_key}' ({municipio}): {exc}"
            )
            continue
    return details
