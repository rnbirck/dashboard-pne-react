import pandas as pd

from src.data_loader import load_basico_15_17_data
from src.data_loader import load_basico_15_17_por_dependencia_data
from src.data_loader import load_basico_6_17_data
from src.data_loader import load_basico_6_17_por_dependencia_data
from src.data_loader import load_atendimento_educacional_especializado_data
from src.data_loader import load_basico_integral_por_dependencia_data
from src.data_loader import load_censo_populacao_alfabetizacao_data
from src.data_loader import load_censo_populacao_ensino_fundamental_6_14_data
from src.data_loader import load_censo_populacao_ensino_fundamental_concluido_15_29_data
from src.data_loader import load_censo_populacao_ensino_fundamental_concluido_18_mais_data
from src.data_loader import load_censo_populacao_ensino_medio_15_17_data
from src.data_loader import load_censo_populacao_ensino_medio_concluido_18_29_data
from src.data_loader import load_censo_populacao_ensino_medio_concluido_18_mais_data
from src.data_loader import load_censo_populacao_escolaridade_media_18_29_data
from src.data_loader import load_censo_populacao_escolaridade_media_18_29_racial_data
from src.data_loader import load_creche_por_dependencia_data
from src.data_loader import load_eja_integrada_educacao_profissional_data
from src.data_loader import load_ept_nivel_medio_data
from src.data_loader import load_escolas_integral_data
from src.data_loader import load_infraestrutura_escolar_data
from src.data_loader import load_infraestrutura_escolar_por_dependencia_data
from src.data_loader import load_pne_data
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


def _build_column_based_dependency_series(df, municipio, column_map):
    if df.empty or "ano" not in df.columns:
        return []

    if "municipio" in df.columns:
        dff = df[df["municipio"] == municipio].copy()
    else:
        dff = df.copy()

    if dff.empty:
        return []

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    for dep_key, col_name in column_map.items():
        if col_name in dff.columns:
            dff[col_name] = pd.to_numeric(dff[col_name], errors="coerce")

    available_columns = [col for col in column_map.values() if col in dff.columns]
    if not available_columns:
        return []

    dff = dff.dropna(subset=["ano"] + available_columns).copy()
    if dff.empty:
        return []

    dff["ano"] = dff["ano"].astype(int)
    for col in available_columns:
        dff[col] = dff[col].clip(lower=0)

    agg_dict = {col: "sum" for col in available_columns}
    grouped = (
        dff.groupby("ano", as_index=False)
        .agg(agg_dict)
        .sort_values("ano")
    )

    series_dependencia = []
    for _, row in grouped.iterrows():
        entry = {"ano": int(row["ano"])}
        for dep_key, col_name in column_map.items():
            if col_name in grouped.columns:
                entry[dep_key] = int(row[col_name])
        series_dependencia.append(entry)

    return series_dependencia


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

    payload = {
        "title": "Matrículas em creche",
        "subtitle": "Total de matrículas em creche e distribuição por dependência administrativa com dados do Censo Escolar. Os números usados no cálculo percentual seguem a base consolidada do indicador em cada ciclo.",
        "unit": "matrículas",
        "calculation": {
            "numerator_label": "Matrículas em creche",
            "denominator_label": "População de 0 a 3 anos",
        },
        "series_total": series_total,
        "series_dependencia": series_dependencia,
    }

    calculation_df = _safe_load(load_pne_data)
    required_columns = {"ano", "municipio", "mat_infantil_creche", "mat_basico_0_3", "pop_0_3"}
    if not calculation_df.empty and required_columns.issubset(calculation_df.columns):
        calculation_dff = calculation_df[calculation_df["municipio"] == municipio].copy()
        if not calculation_dff.empty:
            calculation_dff["ano"] = pd.to_numeric(calculation_dff["ano"], errors="coerce")
            calculation_dff["mat_infantil_creche"] = pd.to_numeric(
                calculation_dff["mat_infantil_creche"], errors="coerce"
            )
            calculation_dff["mat_basico_0_3"] = pd.to_numeric(
                calculation_dff["mat_basico_0_3"], errors="coerce"
            )
            calculation_dff["pop_0_3"] = pd.to_numeric(
                calculation_dff["pop_0_3"], errors="coerce"
            )
            calculation_dff = calculation_dff.dropna(subset=["ano", "pop_0_3"]).copy()

            components_by_cycle = {}
            cycle_numerators = {
                "pne_2014_2024": "mat_infantil_creche",
                "pne_2026_2036": "mat_basico_0_3",
            }
            for cycle, numerator_column in cycle_numerators.items():
                if numerator_column not in calculation_dff.columns:
                    continue
                yearly = (
                    calculation_dff.dropna(subset=[numerator_column])
                    .groupby("ano", as_index=False)
                    .agg({numerator_column: "sum", "pop_0_3": "max"})
                    .sort_values("ano")
                )
                components = []
                for _, row in yearly.iterrows():
                    numerador = row[numerator_column]
                    denominador = row["pop_0_3"]
                    if pd.isna(numerador) or pd.isna(denominador) or denominador <= 0:
                        continue
                    numerador = int(numerador)
                    denominador = int(denominador)
                    components.append(
                        {
                            "ano": int(row["ano"]),
                            "numerador": numerador,
                            "denominador": denominador,
                            "percentual": round((numerador / denominador) * 100, 1),
                        }
                    )

                if components:
                    components_by_cycle[cycle] = components

            if components_by_cycle:
                payload["series_components_by_cycle"] = components_by_cycle

    return payload


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
    component_loader=None,
    component_numerator_column=None,
    component_denominator_column=None,
    calculation=None,
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

    payload = {
        "title": title,
        "subtitle": subtitle,
        "unit": "matrículas",
        "series_total": series_total,
        "series_dependencia": series_dependencia,
    }

    if (
        component_loader is not None
        and component_numerator_column
        and component_denominator_column
        and calculation
    ):
        component_df = _safe_load(component_loader)
        required_columns = {
            "ano",
            "municipio",
            component_numerator_column,
            component_denominator_column,
        }
        if not component_df.empty and required_columns.issubset(component_df.columns):
            component_dff = component_df[component_df["municipio"] == municipio].copy()
            if not component_dff.empty:
                component_dff["ano"] = pd.to_numeric(
                    component_dff["ano"], errors="coerce"
                )
                component_dff[component_numerator_column] = pd.to_numeric(
                    component_dff[component_numerator_column], errors="coerce"
                )
                component_dff[component_denominator_column] = pd.to_numeric(
                    component_dff[component_denominator_column], errors="coerce"
                )
                component_dff = component_dff.dropna(
                    subset=[
                        "ano",
                        component_numerator_column,
                        component_denominator_column,
                    ]
                ).copy()

                yearly = (
                    component_dff.groupby("ano", as_index=False)
                    .agg(
                        {
                            component_numerator_column: "sum",
                            component_denominator_column: "max",
                        }
                    )
                    .sort_values("ano")
                )

                series_components = []
                for _, row in yearly.iterrows():
                    numerador = row[component_numerator_column]
                    denominador = row[component_denominator_column]
                    if pd.isna(numerador) or pd.isna(denominador) or denominador <= 0:
                        continue
                    numerador = int(numerador)
                    denominador = int(denominador)
                    series_components.append(
                        {
                            "ano": int(row["ano"]),
                            "numerador": numerador,
                            "denominador": denominador,
                            "percentual": round((numerador / denominador) * 100, 1),
                        }
                    )

                if series_components:
                    payload["calculation"] = calculation
                    payload["series_components"] = series_components

    return payload


def build_basico_6_17_details(municipio):
    return _build_matriculas_basico_details(
        municipio,
        loader=load_basico_6_17_por_dependencia_data,
        value_column="matriculas_basico_6_17",
        title="Matrículas na educação básica — 6 a 17 anos",
        subtitle="Total de matrículas de 6 a 17 anos na educação básica e distribuição por dependência administrativa. Os números usados no cálculo percentual seguem a base consolidada do indicador.",
        component_loader=load_basico_6_17_data,
        component_numerator_column="mat_basico_6_17",
        component_denominator_column="pop_6_17",
        calculation={
            "numerator_label": "Matrículas de 6 a 17 anos na educação básica",
            "denominator_label": "População de 6 a 17 anos",
        },
    )


def build_basico_15_17_details(municipio):
    return _build_matriculas_basico_details(
        municipio,
        loader=load_basico_15_17_por_dependencia_data,
        value_column="matriculas_basico_15_17",
        title="Matrículas na educação básica — 15 a 17 anos",
        subtitle="Total de matrículas de 15 a 17 anos na educação básica e distribuição por dependência administrativa. A distribuição por dependência vem do Censo Escolar e os componentes do cálculo vêm da base consolidada do indicador.",
        component_loader=load_basico_15_17_data,
        component_numerator_column="mat_basico_15_17",
        component_denominator_column="pop_15_17",
        calculation={
            "numerator_label": "Matrículas de 15 a 17 anos na educação básica",
            "denominator_label": "População de 15 a 17 anos",
        },
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


def build_escolas_integral_details(municipio):
    df = _safe_load(load_escolas_integral_data)
    required_columns = {
        "ano",
        "municipio",
        "escolas_publicas_com_integral",
        "escolas_publicas_total",
    }
    if df.empty or not required_columns.issubset(df.columns):
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["escolas_publicas_com_integral"] = pd.to_numeric(
        dff["escolas_publicas_com_integral"], errors="coerce"
    )
    dff["escolas_publicas_total"] = pd.to_numeric(
        dff["escolas_publicas_total"], errors="coerce"
    )
    dff = dff.dropna(
        subset=[
            "ano",
            "escolas_publicas_com_integral",
            "escolas_publicas_total",
        ]
    ).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff["escolas_publicas_com_integral"] = dff["escolas_publicas_com_integral"].clip(
        lower=0
    )
    dff["escolas_publicas_total"] = dff["escolas_publicas_total"].clip(lower=0)

    total_by_year = (
        dff.groupby("ano", as_index=False)["escolas_publicas_com_integral"]
        .sum()
        .rename(columns={"escolas_publicas_com_integral": "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    yearly = (
        dff.groupby("ano", as_index=False)
        .agg(
            {
                "escolas_publicas_com_integral": "sum",
                "escolas_publicas_total": "max",
            }
        )
        .sort_values("ano")
    )
    series_components = []
    for _, row in yearly.iterrows():
        numerador = row["escolas_publicas_com_integral"]
        denominador = row["escolas_publicas_total"]
        if pd.isna(numerador) or pd.isna(denominador) or denominador <= 0:
            continue
        numerador = int(numerador)
        denominador = int(denominador)
        series_components.append(
            {
                "ano": int(row["ano"]),
                "numerador": numerador,
                "denominador": denominador,
                "percentual": round((numerador / denominador) * 100, 1),
            }
        )

    if not series_total or not series_components:
        return None

    return {
        "title": "Escolas públicas com alunos em jornada de tempo integral",
        "subtitle": "Total de escolas públicas da educação básica que possuem, pelo menos, 25% dos alunos em jornada integral e o total de escolas públicas.",
        "unit": "escolas",
        "calculation": {
            "numerator_label": "Escolas públicas com jornada em tempo integral",
            "denominator_label": "Total de escolas públicas",
        },
        "series_total": series_total,
        "series_components": series_components,
    }


def build_aee_details(municipio):
    df = _safe_load(load_atendimento_educacional_especializado_data)
    required_columns = {
        "ano",
        "municipio",
        "quantidade_aee",
        "total_turmas_educacao_especial",
    }
    if df.empty or not required_columns.issubset(df.columns):
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["quantidade_aee"] = pd.to_numeric(
        dff["quantidade_aee"], errors="coerce"
    )
    dff["total_turmas_educacao_especial"] = pd.to_numeric(
        dff["total_turmas_educacao_especial"], errors="coerce"
    )
    dff = dff.dropna(
        subset=[
            "ano",
            "quantidade_aee",
            "total_turmas_educacao_especial",
        ]
    ).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff["quantidade_aee"] = dff["quantidade_aee"].clip(lower=0)
    dff["total_turmas_educacao_especial"] = dff[
        "total_turmas_educacao_especial"
    ].clip(lower=0)

    total_by_year = (
        dff.groupby("ano", as_index=False)["quantidade_aee"]
        .sum()
        .rename(columns={"quantidade_aee": "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    yearly = (
        dff.groupby("ano", as_index=False)
        .agg(
            {
                "quantidade_aee": "sum",
                "total_turmas_educacao_especial": "max",
            }
        )
        .sort_values("ano")
    )
    series_components = []
    for _, row in yearly.iterrows():
        numerador = row["quantidade_aee"]
        denominador = row["total_turmas_educacao_especial"]
        if pd.isna(numerador) or pd.isna(denominador) or denominador <= 0:
            continue
        numerador = int(numerador)
        denominador = int(denominador)
        series_components.append(
            {
                "ano": int(row["ano"]),
                "numerador": numerador,
                "denominador": denominador,
                "percentual": round((numerador / denominador) * 100, 1),
            }
        )

    if not series_total or not series_components:
        return None

    return {
        "title": "Oferta de AEE na educação especial",
        "subtitle": "Total de turmas de Atendimento Educacional Especializado e o total de turmas de educação especial no município.",
        "unit": "turmas",
        "calculation": {
            "numerator_label": "Turmas de Atendimento Educacional Especializado",
            "denominator_label": "Total de turmas de educação especial",
        },
        "series_total": series_total,
        "series_components": series_components,
    }


def build_medio_tecnico_details(municipio):
    df = _safe_load(load_ept_nivel_medio_data)
    required_columns = {
        "ano",
        "municipio",
        "mat_ept_nivel_medio_total",
        "mat_ept_nivel_medio_publica",
        "mat_integrado_total",
    }
    if df.empty or not required_columns.issubset(df.columns):
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["mat_ept_nivel_medio_total"] = pd.to_numeric(
        dff["mat_ept_nivel_medio_total"], errors="coerce"
    )
    dff["mat_ept_nivel_medio_publica"] = pd.to_numeric(
        dff["mat_ept_nivel_medio_publica"], errors="coerce"
    )
    dff["mat_integrado_total"] = pd.to_numeric(
        dff["mat_integrado_total"], errors="coerce"
    )
    dff = dff.dropna(
        subset=[
            "ano",
            "mat_ept_nivel_medio_total",
            "mat_ept_nivel_medio_publica",
            "mat_integrado_total",
        ]
    ).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff["mat_ept_nivel_medio_total"] = dff["mat_ept_nivel_medio_total"].clip(lower=0)
    dff["mat_ept_nivel_medio_publica"] = dff["mat_ept_nivel_medio_publica"].clip(lower=0)
    dff["mat_integrado_total"] = dff["mat_integrado_total"].clip(lower=0)

    total_by_year = (
        dff.groupby("ano", as_index=False)["mat_ept_nivel_medio_total"]
        .sum()
        .rename(columns={"mat_ept_nivel_medio_total": "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    yearly_2026 = (
        dff.groupby("ano", as_index=False)
        .agg(
            {
                "mat_integrado_total": "sum",
                "mat_ept_nivel_medio_total": "max",
            }
        )
        .sort_values("ano")
    )
    components_2026 = []
    for _, row in yearly_2026.iterrows():
        numerador = row["mat_integrado_total"]
        denominador = row["mat_ept_nivel_medio_total"]
        if pd.isna(numerador) or pd.isna(denominador) or denominador <= 0:
            continue
        numerador = int(numerador)
        denominador = int(denominador)
        components_2026.append(
            {
                "ano": int(row["ano"]),
                "numerador": numerador,
                "denominador": denominador,
                "percentual": round((numerador / denominador) * 100, 1),
            }
        )

    series_components_by_cycle = {}
    if components_2026:
        series_components_by_cycle["pne_2026_2036"] = components_2026

    if not series_total or not series_components_by_cycle:
        return None

    series_dependencia = _build_column_based_dependency_series(df, municipio, {
        "publica": "mat_ept_nivel_medio_publica",
        "federal": "mat_ept_nivel_medio_federal",
        "estadual": "mat_ept_nivel_medio_estadual",
        "municipal": "mat_ept_nivel_medio_municipal",
    })

    payload = {
        "title": "Matrículas em EPT de nível médio",
        "subtitle": "Total de matrículas da Educação Profissional e Tecnológica de nível médio e, no ciclo 2026‑2036, o percentual integrado à educação profissional técnica.",
        "unit": "matrículas",
        "calculation": {
            "numerator_label": "Matrículas integradas à educação profissional técnica",
            "denominator_label": "Total de matrículas do ensino médio",
        },
        "series_total": series_total,
        "series_components_by_cycle": series_components_by_cycle,
    }

    if series_dependencia:
        payload["series_dependencia"] = series_dependencia

    return payload


def build_medio_tecnico_total_details(municipio):
    df = _safe_load(load_ept_nivel_medio_data)
    required_columns = {
        "ano",
        "municipio",
        "mat_ept_nivel_medio_total",
    }
    if df.empty or not required_columns.issubset(df.columns):
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["mat_ept_nivel_medio_total"] = pd.to_numeric(
        dff["mat_ept_nivel_medio_total"], errors="coerce"
    )
    dff = dff.dropna(subset=["ano", "mat_ept_nivel_medio_total"]).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff["mat_ept_nivel_medio_total"] = dff["mat_ept_nivel_medio_total"].clip(lower=0)

    total_by_year = (
        dff.groupby("ano", as_index=False)["mat_ept_nivel_medio_total"]
        .sum()
        .rename(columns={"mat_ept_nivel_medio_total": "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    if not series_total:
        return None

    series_dependencia = _build_column_based_dependency_series(df, municipio, {
        "publica": "mat_ept_nivel_medio_publica",
        "federal": "mat_ept_nivel_medio_federal",
        "estadual": "mat_ept_nivel_medio_estadual",
        "municipal": "mat_ept_nivel_medio_municipal",
    })

    payload = {
        "title": "Número absoluto de matrículas em EPT de nível médio",
        "subtitle": "Total de matrículas da Educação Profissional e Tecnológica de nível médio no município.",
        "unit": "matrículas",
        "series_total": series_total,
    }

    if series_dependencia:
        payload["series_dependencia"] = series_dependencia

    return payload


def build_medio_tecnico_participacao_publica_details(municipio):
    df = _safe_load(load_ept_nivel_medio_data)
    required_columns = {
        "ano",
        "municipio",
        "mat_ept_nivel_medio_total",
        "mat_ept_nivel_medio_publica",
    }
    if df.empty or not required_columns.issubset(df.columns):
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["mat_ept_nivel_medio_total"] = pd.to_numeric(
        dff["mat_ept_nivel_medio_total"], errors="coerce"
    )
    dff["mat_ept_nivel_medio_publica"] = pd.to_numeric(
        dff["mat_ept_nivel_medio_publica"], errors="coerce"
    )
    dff = dff.dropna(
        subset=["ano", "mat_ept_nivel_medio_total", "mat_ept_nivel_medio_publica"]
    ).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff["mat_ept_nivel_medio_total"] = dff["mat_ept_nivel_medio_total"].clip(lower=0)
    dff["mat_ept_nivel_medio_publica"] = dff["mat_ept_nivel_medio_publica"].clip(lower=0)

    total_by_year = (
        dff.groupby("ano", as_index=False)["mat_ept_nivel_medio_total"]
        .sum()
        .rename(columns={"mat_ept_nivel_medio_total": "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    yearly = (
        dff.groupby("ano", as_index=False)
        .agg(
            {
                "mat_ept_nivel_medio_publica": "sum",
                "mat_ept_nivel_medio_total": "max",
            }
        )
        .sort_values("ano")
    )
    series_components = []
    for _, row in yearly.iterrows():
        numerador = row["mat_ept_nivel_medio_publica"]
        denominador = row["mat_ept_nivel_medio_total"]
        if pd.isna(numerador) or pd.isna(denominador) or denominador <= 0:
            continue
        numerador = int(numerador)
        denominador = int(denominador)
        series_components.append(
            {
                "ano": int(row["ano"]),
                "numerador": numerador,
                "denominador": denominador,
                "percentual": round((numerador / denominador) * 100, 1),
            }
        )

    if not series_total or not series_components:
        return None

    series_dependencia = _build_column_based_dependency_series(df, municipio, {
        "publica": "mat_ept_nivel_medio_publica",
        "federal": "mat_ept_nivel_medio_federal",
        "estadual": "mat_ept_nivel_medio_estadual",
        "municipal": "mat_ept_nivel_medio_municipal",
    })

    payload = {
        "title": "Participação acumulada do segmento público na expansão da EPT de nível médio",
        "subtitle": "Compara o número de matrículas públicas com o total de matrículas em EPT de nível médio a cada ano.",
        "unit": "matrículas",
        "calculation": {
            "numerator_label": "Matrículas em EPT de nível médio - público",
            "denominator_label": "Total de matrículas em EPT de nível médio",
        },
        "series_total": series_total,
        "series_components": series_components,
    }

    if series_dependencia:
        payload["series_dependencia"] = series_dependencia

    return payload


def build_subsequente_expansao_details(municipio):
    df = _safe_load(load_ept_nivel_medio_data)
    required_columns = {
        "ano",
        "municipio",
        "mat_subsequente_total",
    }
    if df.empty or not required_columns.issubset(df.columns):
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["mat_subsequente_total"] = pd.to_numeric(
        dff["mat_subsequente_total"], errors="coerce"
    )
    dff = dff.dropna(subset=["ano", "mat_subsequente_total"]).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff["mat_subsequente_total"] = dff["mat_subsequente_total"].clip(lower=0)

    total_by_year = (
        dff.groupby("ano", as_index=False)["mat_subsequente_total"]
        .sum()
        .rename(columns={"mat_subsequente_total": "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    if not series_total:
        return None

    series_dependencia = _build_column_based_dependency_series(df, municipio, {
        "publica": "mat_subsequente_publica",
    })

    payload = {
        "title": "Expansão acumulada das matrículas em cursos técnicos subsequentes",
        "subtitle": "Número absoluto de matrículas em cursos técnicos subsequentes da Educação Profissional e Tecnológica de nível médio no município.",
        "unit": "matrículas",
        "series_total": series_total,
    }

    if series_dependencia:
        payload["series_dependencia"] = series_dependencia

    return payload


def build_eja_integrada_educacao_profissional_details(municipio):
    df = _safe_load(load_eja_integrada_educacao_profissional_data)
    required_columns = {
        "ano",
        "municipio",
        "mat_eja_total",
        "mat_eja_integrada_educacao_profissional_calculada",
    }
    if df.empty or not required_columns.issubset(df.columns):
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["mat_eja_total"] = pd.to_numeric(
        dff["mat_eja_total"], errors="coerce"
    )
    dff["mat_eja_integrada_educacao_profissional_calculada"] = pd.to_numeric(
        dff["mat_eja_integrada_educacao_profissional_calculada"], errors="coerce"
    )
    dff = dff.dropna(
        subset=[
            "ano",
            "mat_eja_total",
            "mat_eja_integrada_educacao_profissional_calculada",
        ]
    ).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff["mat_eja_total"] = dff["mat_eja_total"].clip(lower=0)
    dff["mat_eja_integrada_educacao_profissional_calculada"] = dff[
        "mat_eja_integrada_educacao_profissional_calculada"
    ].clip(lower=0)

    total_by_year = (
        dff.groupby("ano", as_index=False)["mat_eja_integrada_educacao_profissional_calculada"]
        .sum()
        .rename(
            columns={
                "mat_eja_integrada_educacao_profissional_calculada": "valor"
            }
        )
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    yearly = (
        dff.groupby("ano", as_index=False)
        .agg(
            {
                "mat_eja_integrada_educacao_profissional_calculada": "sum",
                "mat_eja_total": "max",
            }
        )
        .sort_values("ano")
    )
    components_2014 = []
    for _, row in yearly.iterrows():
        numerador = row["mat_eja_integrada_educacao_profissional_calculada"]
        denominador = row["mat_eja_total"]
        if pd.isna(numerador) or pd.isna(denominador) or denominador <= 0:
            continue
        numerador = int(numerador)
        denominador = int(denominador)
        components_2014.append(
            {
                "ano": int(row["ano"]),
                "numerador": numerador,
                "denominador": denominador,
                "percentual": round((numerador / denominador) * 100, 1),
            }
        )

    series_components_by_cycle = {}
    if components_2014:
        series_components_by_cycle["pne_2014_2024"] = components_2014

    if not series_total:
        return None

    return {
        "title": "Matrículas do EJA integradas à educação profissional",
        "subtitle": "Número absoluto de matrículas do EJA integradas à educação profissional no município. No ciclo 2014‑2024 também é apresentado o percentual em relação ao total de matrículas do EJA.",
        "unit": "matrículas",
        "calculation": {
            "numerator_label": "Matrículas do EJA integradas à educação profissional",
            "denominator_label": "Total de matrículas do EJA",
        },
        "series_total": series_total,
        "series_components_by_cycle": series_components_by_cycle,
    }


def _build_infra_details(municipio, *, count_column, denominator_column, numerator_label, denominator_label, title, unit, include_public_dependency=False):
    df = _safe_load(load_infraestrutura_escolar_data)
    required_columns = {"ano", "municipio", count_column, denominator_column}
    if df.empty or not required_columns.issubset(df.columns):
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff[count_column] = pd.to_numeric(dff[count_column], errors="coerce")
    dff[denominator_column] = pd.to_numeric(dff[denominator_column], errors="coerce")
    dff = dff.dropna(subset=["ano", count_column, denominator_column]).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff[count_column] = dff[count_column].clip(lower=0)
    dff[denominator_column] = dff[denominator_column].clip(lower=0)

    total_by_year = (
        dff.groupby("ano", as_index=False)[count_column]
        .sum()
        .rename(columns={count_column: "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    yearly = (
        dff.groupby("ano", as_index=False)
        .agg({count_column: "sum", denominator_column: "max"})
        .sort_values("ano")
    )
    series_components = []
    for _, row in yearly.iterrows():
        numerador = row[count_column]
        denominador = row[denominator_column]
        if pd.isna(numerador) or pd.isna(denominador) or denominador <= 0:
            continue
        numerador = int(numerador)
        denominador = int(denominador)
        series_components.append(
            {
                "ano": int(row["ano"]),
                "numerador": numerador,
                "denominador": denominador,
                "percentual": round((numerador / denominador) * 100, 1),
            }
        )

    if not series_total or not series_components:
        return None

    payload = {
        "title": title,
        "subtitle": f"Total de {unit} com a característica e total de {unit} no município.",
        "unit": unit,
        "calculation": {
            "numerator_label": numerator_label,
            "denominator_label": denominator_label,
        },
        "series_total": series_total,
        "series_components": series_components,
    }

    if include_public_dependency and series_dependencia:
        payload["series_dependencia"] = series_dependencia

    return payload


def _build_infra_dependency_series(df, municipio, count_column):
    if df.empty or "ano" not in df.columns:
        return []

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return []

    dff = dff[dff["dependencia"].notna()].copy()
    dff["dependencia"] = dff["dependencia"].str.strip().str.lower()
    dff = dff[dff["dependencia"] != ""].copy()
    if dff.empty:
        return []

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff[count_column] = pd.to_numeric(dff[count_column], errors="coerce")
    dff = dff.dropna(subset=["ano", count_column]).copy()
    if dff.empty:
        return []

    dff["ano"] = dff["ano"].astype(int)
    dff[count_column] = dff[count_column].clip(lower=0)

    grouped = (
        dff.groupby(["ano", "dependencia"], as_index=False)[count_column]
        .sum()
        .sort_values(["ano", "dependencia"])
    )

    pivot = grouped.pivot(
        index="ano", columns="dependencia", values=count_column
    ).fillna(0)

    series_dependencia = []
    for index, row in pivot.iterrows():
        entry = {"ano": int(index)}
        for dep in pivot.columns:
            value = int(row[dep])
            entry[dep] = value
        series_dependencia.append(entry)

    return series_dependencia


def build_internet_details(municipio):
    payload = _build_infra_details(
        municipio,
        count_column="escolas_com_internet",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com internet",
        denominator_label="Total de escolas",
        title="Escolas da educação básica com acesso à internet",
        unit="escolas",
    )

    if payload is not None:
        dep_df = _safe_load(load_infraestrutura_escolar_por_dependencia_data)
        if not dep_df.empty:
            series_dependencia = _build_infra_dependency_series(
                dep_df, municipio, "escolas_com_internet"
            )
            if series_dependencia:
                payload["series_dependencia"] = series_dependencia

    return payload


def build_internet_alunos_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_com_internet_alunos",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com internet para alunos",
        denominator_label="Total de escolas",
        title="Escolas com internet disponível para os alunos",
        unit="escolas",
    )


def build_internet_aprendizagem_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_com_internet_aprendizagem",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com internet para aprendizagem",
        denominator_label="Total de escolas",
        title="Escolas com internet usada na aprendizagem",
        unit="escolas",
    )


def build_internet_comunidade_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_com_internet_comunidade",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com internet para comunidade",
        denominator_label="Total de escolas",
        title="Escolas com internet aberta à comunidade",
        unit="escolas",
    )


def build_acesso_internet_computador_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_com_acesso_internet_computador",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com acesso à internet por computador",
        denominator_label="Total de escolas",
        title="Escolas com acesso dos alunos à internet por computador",
        unit="escolas",
    )


def build_acesso_internet_disp_pessoais_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_com_acesso_internet_disp_pessoais",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com acesso à internet por dispositivos pessoais",
        denominator_label="Total de escolas",
        title="Escolas com acesso dos alunos à internet por dispositivos pessoais",
        unit="escolas",
    )


def build_rede_local_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_com_rede_local",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com rede local",
        denominator_label="Total de escolas",
        title="Escolas com rede local de computadores",
        unit="escolas",
    )


def build_rede_wireless_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_com_rede_wireless",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com rede sem fio",
        denominator_label="Total de escolas",
        title="Escolas com rede local sem fio",
        unit="escolas",
    )


def build_banda_larga_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_com_banda_larga",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com banda larga",
        denominator_label="Total de escolas",
        title="Escolas com internet banda larga",
        unit="escolas",
    )


def build_educacao_ambiental_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_com_educacao_ambiental",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com educação ambiental",
        denominator_label="Total de escolas",
        title="Escolas que promovem educação ambiental",
        unit="escolas",
    )


def build_conselho_escolar_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_publicas_com_orgao_conselho_escolar",
        denominator_column="escolas_publicas_total",
        numerator_label="Escolas públicas com conselho escolar",
        denominator_label="Total de escolas públicas",
        title="Escolas públicas com conselho escolar instituído e em funcionamento",
        unit="escolas públicas",
        include_public_dependency=True,
    )


def build_proposta_pedagogica_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_publicas_com_proposta_pedagogica",
        denominator_column="escolas_publicas_total",
        numerator_label="Escolas públicas com proposta pedagógica",
        denominator_label="Total de escolas públicas",
        title="Escolas públicas com projeto político pedagógico",
        unit="escolas públicas",
        include_public_dependency=True,
    )


def build_salas_climatizadas_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="qt_salas_utiliza_climatizadas",
        denominator_column="qt_salas_utilizadas",
        numerator_label="Salas climatizadas",
        denominator_label="Total de salas utilizadas",
        title="Salas de aula climatizadas",
        unit="salas",
    )


def build_salas_acessiveis_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="qt_salas_utilizadas_acessiveis",
        denominator_column="qt_salas_utilizadas",
        numerator_label="Salas acessíveis",
        denominator_label="Total de salas utilizadas",
        title="Salas de aula com acessibilidade",
        unit="salas",
    )


def build_desktop_aluno_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_com_desktop_aluno",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com desktop para aluno",
        denominator_label="Total de escolas",
        title="Escolas com computadores de mesa para alunos",
        unit="escolas",
    )


def build_comp_portatil_aluno_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_com_comp_portatil_aluno",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com computador portátil para aluno",
        denominator_label="Total de escolas",
        title="Escolas com computadores portáteis para alunos",
        unit="escolas",
    )


def build_tablet_aluno_details(municipio):
    return _build_infra_details(
        municipio,
        count_column="escolas_com_tablet_aluno",
        denominator_column="qntd_escolas",
        numerator_label="Escolas com tablet para aluno",
        denominator_label="Total de escolas",
        title="Escolas com tablets para alunos",
        unit="escolas",
    )


def _build_censo_percentual_details(
    municipio,
    *,
    loader,
    numerator_column,
    denominator_column,
    title,
    unit,
    numerator_label,
    denominator_label,
):
    df = _safe_load(loader)
    required_columns = {"ano", "municipio", numerator_column, denominator_column}
    if df.empty or not required_columns.issubset(df.columns):
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff[numerator_column] = pd.to_numeric(dff[numerator_column], errors="coerce")
    dff[denominator_column] = pd.to_numeric(dff[denominator_column], errors="coerce")
    dff = dff.dropna(subset=["ano", numerator_column, denominator_column]).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff[numerator_column] = dff[numerator_column].clip(lower=0)
    dff[denominator_column] = dff[denominator_column].clip(lower=0)

    total_by_year = (
        dff.groupby("ano", as_index=False)[numerator_column]
        .sum()
        .rename(columns={numerator_column: "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(int)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    yearly = (
        dff.groupby("ano", as_index=False)
        .agg({numerator_column: "sum", denominator_column: "max"})
        .sort_values("ano")
    )
    series_components = []
    for _, row in yearly.iterrows():
        numerador = row[numerator_column]
        denominador = row[denominator_column]
        if pd.isna(numerador) or pd.isna(denominador) or denominador <= 0:
            continue
        numerador = int(numerador)
        denominador = int(denominador)
        series_components.append(
            {
                "ano": int(row["ano"]),
                "numerador": numerador,
                "denominador": denominador,
                "percentual": round((numerador / denominador) * 100, 1),
            }
        )

    if not series_total or not series_components:
        return None

    return {
        "title": title,
        "subtitle": f"Total de pessoas na condição e total de {unit} no município.",
        "unit": unit,
        "calculation": {
            "numerator_label": numerator_label,
            "denominator_label": denominator_label,
        },
        "series_total": series_total,
        "series_components": series_components,
    }


def build_alfabetizacao_pop_15_mais_details(municipio):
    return _build_censo_percentual_details(
        municipio,
        loader=load_censo_populacao_alfabetizacao_data,
        numerator_column="alfabetizadas_15_mais",
        denominator_column="total_15_mais",
        title="Pessoas de 15 anos ou mais alfabetizadas",
        unit="pessoas",
        numerator_label="Pessoas de 15 anos ou mais alfabetizadas",
        denominator_label="População de 15 anos ou mais",
    )


def build_ensino_medio_ou_basica_completa_pop_15_17_details(municipio):
    return _build_censo_percentual_details(
        municipio,
        loader=load_censo_populacao_ensino_medio_15_17_data,
        numerator_column="populacao_15_17_ensino_medio_ou_basica_completa",
        denominator_column="populacao_15_17_total",
        title="População de 15 a 17 anos com ensino médio ou educação básica completa",
        unit="pessoas",
        numerator_label="População de 15 a 17 anos com ensino médio ou educação básica completa",
        denominator_label="População de 15 a 17 anos",
    )


def build_ensino_fundamental_ou_completo_pop_6_14_details(municipio):
    return _build_censo_percentual_details(
        municipio,
        loader=load_censo_populacao_ensino_fundamental_6_14_data,
        numerator_column="populacao_6_14_ensino_fundamental_ou_completo",
        denominator_column="populacao_6_14_total",
        title="População de 6 a 14 anos no ensino fundamental ou com fundamental completo",
        unit="pessoas",
        numerator_label="População de 6 a 14 anos no ensino fundamental ou com fundamental completo",
        denominator_label="População de 6 a 14 anos",
    )


def build_fundamental_concluido_18_mais_details(municipio):
    return _build_censo_percentual_details(
        municipio,
        loader=load_censo_populacao_ensino_fundamental_concluido_18_mais_data,
        numerator_column="populacao_18_mais_ensino_fundamental_concluido",
        denominator_column="populacao_18_mais_total",
        title="População de 18 anos ou mais com ensino fundamental concluído",
        unit="pessoas",
        numerator_label="População de 18 anos ou mais com ensino fundamental concluído",
        denominator_label="População de 18 anos ou mais",
    )


def build_fundamental_concluido_15_29_details(municipio):
    return _build_censo_percentual_details(
        municipio,
        loader=load_censo_populacao_ensino_fundamental_concluido_15_29_data,
        numerator_column="populacao_15_29_ensino_fundamental_concluido",
        denominator_column="populacao_15_29_total",
        title="População de 15 a 29 anos com ensino fundamental concluído",
        unit="pessoas",
        numerator_label="População de 15 a 29 anos com ensino fundamental concluído",
        denominator_label="População de 15 a 29 anos",
    )


def build_medio_concluido_18_mais_details(municipio):
    return _build_censo_percentual_details(
        municipio,
        loader=load_censo_populacao_ensino_medio_concluido_18_mais_data,
        numerator_column="populacao_18_mais_ensino_medio_concluido",
        denominator_column="populacao_18_mais_total",
        title="População de 18 anos ou mais com ensino médio concluído",
        unit="pessoas",
        numerator_label="População de 18 anos ou mais com ensino médio concluído",
        denominator_label="População de 18 anos ou mais",
    )


def build_medio_concluido_18_29_details(municipio):
    return _build_censo_percentual_details(
        municipio,
        loader=load_censo_populacao_ensino_medio_concluido_18_29_data,
        numerator_column="populacao_18_29_ensino_medio_concluido",
        denominator_column="populacao_18_29_total",
        title="População de 18 a 29 anos com ensino médio concluído",
        unit="pessoas",
        numerator_label="População de 18 a 29 anos com ensino médio concluído",
        denominator_label="População de 18 a 29 anos",
    )


def build_escolaridade_media_18_29_details(municipio):
    df = _safe_load(load_censo_populacao_escolaridade_media_18_29_data)
    required_columns = {"ano", "municipio", "escolaridade_media_18_29"}
    if df.empty or not required_columns.issubset(df.columns):
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["escolaridade_media_18_29"] = pd.to_numeric(
        dff["escolaridade_media_18_29"], errors="coerce"
    )
    dff = dff.dropna(subset=["ano", "escolaridade_media_18_29"]).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff["escolaridade_media_18_29"] = dff["escolaridade_media_18_29"].clip(lower=0)

    total_by_year = (
        dff.groupby("ano", as_index=False)["escolaridade_media_18_29"]
        .mean()
        .rename(columns={"escolaridade_media_18_29": "valor"})
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(float)
    series_total = [
        {"ano": int(row["ano"]), "valor": float(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] is not None
    ]

    if not series_total:
        return None

    return {
        "title": "Escolaridade média da população de 18 a 29 anos",
        "subtitle": "Média de anos de estudo da população de 18 a 29 anos no município.",
        "unit": "anos",
        "series_total": series_total,
    }


def build_razao_escolaridade_racial_18_29_details(municipio):
    df = _safe_load(load_censo_populacao_escolaridade_media_18_29_racial_data)
    required_columns = {
        "ano",
        "municipio",
        "escolaridade_media_negros_18_29",
        "escolaridade_media_nao_negros_18_29",
        "razao_percentual_escolaridade_negros_nao_negros_18_29",
    }
    if df.empty or not required_columns.issubset(df.columns):
        return None

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["escolaridade_media_negros_18_29"] = pd.to_numeric(
        dff["escolaridade_media_negros_18_29"], errors="coerce"
    )
    dff["escolaridade_media_nao_negros_18_29"] = pd.to_numeric(
        dff["escolaridade_media_nao_negros_18_29"], errors="coerce"
    )
    dff["razao_percentual_escolaridade_negros_nao_negros_18_29"] = pd.to_numeric(
        dff["razao_percentual_escolaridade_negros_nao_negros_18_29"],
        errors="coerce",
    )
    dff = dff.dropna(
        subset=[
            "ano",
            "escolaridade_media_negros_18_29",
            "escolaridade_media_nao_negros_18_29",
            "razao_percentual_escolaridade_negros_nao_negros_18_29",
        ]
    ).copy()
    if dff.empty:
        return None

    dff["ano"] = dff["ano"].astype(int)
    dff["escolaridade_media_negros_18_29"] = dff["escolaridade_media_negros_18_29"].clip(lower=0)
    dff["escolaridade_media_nao_negros_18_29"] = dff["escolaridade_media_nao_negros_18_29"].clip(lower=0)

    total_by_year = (
        dff.groupby("ano", as_index=False)["razao_percentual_escolaridade_negros_nao_negros_18_29"]
        .mean()
        .rename(
            columns={
                "razao_percentual_escolaridade_negros_nao_negros_18_29": "valor"
            }
        )
        .sort_values("ano")
    )
    total_by_year["valor"] = total_by_year["valor"].astype(float)
    series_total = [
        {"ano": int(row["ano"]), "valor": int(row["valor"])}
        for _, row in total_by_year.iterrows()
        if row["valor"] > 0
    ]

    series_dependencia = []
    if include_public_dependency:
        series_dependencia = [
            {
                "ano": int(row["ano"]),
                "publica": int(row["valor"]),
            }
            for _, row in total_by_year.iterrows()
            if row["valor"] > 0
        ]

    yearly = (
        dff.groupby("ano", as_index=False)
        .agg(
            {
                "escolaridade_media_negros_18_29": "mean",
                "escolaridade_media_nao_negros_18_29": "mean",
            }
        )
        .sort_values("ano")
    )
    series_components = []
    for _, row in yearly.iterrows():
        numerador = row["escolaridade_media_negros_18_29"]
        denominador = row["escolaridade_media_nao_negros_18_29"]
        if pd.isna(numerador) or pd.isna(denominador) or denominador <= 0:
            continue
        numerador = float(numerador)
        denominador = float(denominador)
        percentual = round((numerador / denominador) * 100, 1)
        series_components.append(
            {
                "ano": int(row["ano"]),
                "numerador": numerador,
                "denominador": denominador,
                "percentual": percentual,
            }
        )

    if not series_total or not series_components:
        return None

    return {
        "title": "Razão entre escolaridade média de negros e não negros de 18 a 29 anos",
        "subtitle": "Razão percentual entre a média de anos de estudo da população negra e da não negra de 18 a 29 anos no município.",
        "unit": "razão (%)",
        "calculation": {
            "numerator_label": "Média de anos de estudo da população negra de 18 a 29 anos",
            "denominator_label": "Média de anos de estudo da população não negra de 18 a 29 anos",
        },
        "series_total": series_total,
        "series_components": series_components,
    }


DETAIL_BUILDERS = {
    "creche": build_creche_details,
    "pre_escola": build_pre_escola_details,
    "basico_6_17": build_basico_6_17_details,
    "basico_15_17": build_basico_15_17_details,
    "basico_integral": build_basico_integral_details,
    "escolas_integral": build_escolas_integral_details,
    "aee": build_aee_details,
    "medio_tecnico": build_medio_tecnico_details,
    "medio_tecnico_total": build_medio_tecnico_total_details,
    "medio_tecnico_participacao_publica": build_medio_tecnico_participacao_publica_details,
    "subsequente_expansao": build_subsequente_expansao_details,
    "eja_integrada_educacao_profissional": build_eja_integrada_educacao_profissional_details,
    "internet": build_internet_details,
    "internet_alunos": build_internet_alunos_details,
    "internet_aprendizagem": build_internet_aprendizagem_details,
    "internet_comunidade": build_internet_comunidade_details,
    "acesso_internet_computador": build_acesso_internet_computador_details,
    "acesso_internet_disp_pessoais": build_acesso_internet_disp_pessoais_details,
    "rede_local": build_rede_local_details,
    "rede_wireless": build_rede_wireless_details,
    "banda_larga": build_banda_larga_details,
    "educacao_ambiental": build_educacao_ambiental_details,
    "conselho_escolar": build_conselho_escolar_details,
    "proposta_pedagogica": build_proposta_pedagogica_details,
    "salas_climatizadas": build_salas_climatizadas_details,
    "salas_acessiveis": build_salas_acessiveis_details,
    "desktop_aluno": build_desktop_aluno_details,
    "comp_portatil_aluno": build_comp_portatil_aluno_details,
    "tablet_aluno": build_tablet_aluno_details,
    "alfabetizacao_pop_15_mais": build_alfabetizacao_pop_15_mais_details,
    "ensino_medio_ou_basica_completa_pop_15_17": build_ensino_medio_ou_basica_completa_pop_15_17_details,
    "ensino_fundamental_ou_completo_pop_6_14": build_ensino_fundamental_ou_completo_pop_6_14_details,
    "fundamental_concluido_18_mais": build_fundamental_concluido_18_mais_details,
    "fundamental_concluido_15_29": build_fundamental_concluido_15_29_details,
    "medio_concluido_18_mais": build_medio_concluido_18_mais_details,
    "medio_concluido_18_29": build_medio_concluido_18_29_details,
    "escolaridade_media_18_29": build_escolaridade_media_18_29_details,
    "razao_escolaridade_racial_18_29": build_razao_escolaridade_racial_18_29_details,
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
