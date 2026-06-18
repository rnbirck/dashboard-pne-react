import pandas as pd

from src.data_loader import load_basico_15_17_por_dependencia_data
from src.data_loader import load_basico_6_17_por_dependencia_data
from src.data_loader import load_basico_integral_por_dependencia_data
from src.data_loader import load_creche_por_dependencia_data
from src.data_loader import load_pre_escola_data
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

    payload = {
        "title": "Matrículas na pré-escola",
        "subtitle": "Total de matrículas de 4 a 5 anos na pré-escola e distribuição por dependência administrativa.",
        "unit": "matrículas",
        "series_total": series_total,
        "series_dependencia": series_dependencia,
    }

    pop_df = _safe_load(load_pre_escola_data)
    if not pop_df.empty and {"ano", "municipio", "pop_4_5"}.issubset(pop_df.columns):
        pop_dff = pop_df[pop_df["municipio"] == municipio].copy()
        if not pop_dff.empty:
            pop_dff["ano"] = pd.to_numeric(pop_dff["ano"], errors="coerce")
            pop_dff["pop_4_5"] = pd.to_numeric(pop_dff["pop_4_5"], errors="coerce")
            pop_by_year = (
                pop_dff.dropna(subset=["ano", "pop_4_5"])
                .groupby("ano", as_index=False)["pop_4_5"]
                .max()
                .sort_values("ano")
            )
            total_by_year_map = {
                int(row["ano"]): int(row["valor"])
                for _, row in total_by_year.iterrows()
                if pd.notna(row["ano"]) and pd.notna(row["valor"]) and row["valor"] > 0
            }
            series_components = []
            for _, row in pop_by_year.iterrows():
                ano = int(row["ano"])
                numerador = total_by_year_map.get(ano)
                denominador = row["pop_4_5"]
                if numerador is None or pd.isna(denominador) or denominador <= 0:
                    continue
                denominador = int(denominador)
                series_components.append(
                    {
                        "ano": ano,
                        "numerador": numerador,
                        "denominador": denominador,
                        "percentual": round((numerador / denominador) * 100, 1),
                    }
                )

            if series_components:
                payload["calculation"] = {
                    "numerator_label": "Matrículas na pré-escola",
                    "denominator_label": "População de 4 a 5 anos",
                }
                payload["series_components"] = series_components

    return payload


def _build_matriculas_basico_details(
    municipio,
    *,
    loader,
    value_column,
    title,
    subtitle,
):
    df = _safe_load(loader)
    if df.empty or "municipio" not in df.columns:
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff[value_column] = pd.to_numeric(dff[value_column], errors="coerce")
    dff["dependencia"] = dff["dependencia"].apply(_normalizar_dependencia)
    dff = dff.dropna(subset=["ano", value_column, "dependencia"]).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff[value_column] = dff[value_column].clip(lower=0)

    grouped = (
        dff.groupby(["ano", "dependencia"], as_index=False)[value_column]
        .sum()
        .sort_values(["ano", "dependencia"])
    )

    total_by_year = (
        grouped.groupby("ano", as_index=False)[value_column]
        .sum()
        .rename(columns={value_column: "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    pivot = grouped.pivot(
        index="ano", columns="dependencia", values=value_column
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
        "title": title,
        "subtitle": subtitle,
        "unit": "matrículas",
        "series_total": series_total,
        "series_dependencia": series_dependencia,
    }


def build_basico_6_17_details(municipio):
    return _build_matriculas_basico_details(
        municipio,
        loader=load_basico_6_17_por_dependencia_data,
        value_column="matriculas_basico_6_17",
        title="Matrículas na educação básica — 6 a 17 anos",
        subtitle="Total de matrículas de 6 a 17 anos na educação básica e distribuição por dependência administrativa.",
    )


def build_basico_15_17_details(municipio):
    return _build_matriculas_basico_details(
        municipio,
        loader=load_basico_15_17_por_dependencia_data,
        value_column="matriculas_basico_15_17",
        title="Matrículas na educação básica — 15 a 17 anos",
        subtitle="Total de matrículas de 15 a 17 anos na educação básica e distribuição por dependência administrativa. Este complemento mostra as matrículas escolares disponíveis no Censo Escolar.",
    )


def build_basico_integral_details(municipio):
    df = _safe_load(load_basico_integral_por_dependencia_data)
    required_columns = {
        "ano",
        "municipio",
        "dependencia",
        "mat_basico",
        "mat_basico_integral",
    }
    if df.empty or not required_columns.issubset(df.columns):
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["mat_basico"] = pd.to_numeric(dff["mat_basico"], errors="coerce")
    dff["mat_basico_integral"] = pd.to_numeric(
        dff["mat_basico_integral"], errors="coerce"
    )
    dff["dependencia"] = dff["dependencia"].apply(_normalizar_dependencia)
    dff = dff.dropna(
        subset=["ano", "mat_basico", "mat_basico_integral", "dependencia"]
    ).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff["mat_basico"] = dff["mat_basico"].clip(lower=0)
    dff["mat_basico_integral"] = dff["mat_basico_integral"].clip(lower=0)

    grouped = (
        dff.groupby(["ano", "dependencia"], as_index=False)
        .agg({"mat_basico_integral": "sum", "mat_basico": "sum"})
        .sort_values(["ano", "dependencia"])
    )

    total_by_year = (
        grouped.groupby("ano", as_index=False)
        .agg({"mat_basico_integral": "sum", "mat_basico": "sum"})
        .rename(columns={"mat_basico_integral": "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    total_by_year["mat_basico"] = total_by_year["mat_basico"].astype(int)

    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    series_components = []
    for _, row in total_by_year.iterrows():
        numerador = int(row["valor"])
        denominador = int(row["mat_basico"])
        if numerador <= 0 or denominador <= 0:
            continue
        series_components.append(
            {
                "ano": int(row["ano"]),
                "numerador": numerador,
                "denominador": denominador,
                "percentual": round((numerador / denominador) * 100, 1),
            }
        )

    pivot = grouped.pivot(
        index="ano", columns="dependencia", values="mat_basico_integral"
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

    if not series_total or not series_dependencia or not series_components:
        return None

    return {
        "title": "Matrículas em tempo integral na educação básica pública",
        "subtitle": "Total de matrículas em tempo integral na educação básica pública, total de matrículas da educação básica pública e distribuição por dependência administrativa.",
        "unit": "matrículas",
        "calculation": {
            "numerator_label": "Matrículas em tempo integral",
            "denominator_label": "Total de matrículas da educação básica pública",
        },
        "series_total": series_total,
        "series_dependencia": series_dependencia,
        "series_components": series_components,
    }


DETAIL_BUILDERS = {
    "creche": build_creche_details,
    "pre_escola": build_pre_escola_details,
    "basico_6_17": build_basico_6_17_details,
    "basico_15_17": build_basico_15_17_details,
    "basico_integral": build_basico_integral_details,
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
