import pandas as pd

from src.data_loader import load_basico_15_17_data
from src.data_loader import load_basico_15_17_por_dependencia_data
from src.data_loader import load_basico_6_17_data
from src.data_loader import load_basico_6_17_por_dependencia_data
from src.data_loader import load_atendimento_educacional_especializado_data
from src.data_loader import load_basico_integral_por_dependencia_data
from src.data_loader import load_creche_por_dependencia_data
from src.data_loader import load_ept_nivel_medio_data
from src.data_loader import load_escolas_integral_data
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

    return {
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

    return {
        "title": "Número absoluto de matrículas em EPT de nível médio",
        "subtitle": "Total de matrículas da Educação Profissional e Tecnológica de nível médio no município.",
        "unit": "matrículas",
        "series_total": series_total,
    }


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

    return {
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

    return {
        "title": "Expansão acumulada das matrículas em cursos técnicos subsequentes",
        "subtitle": "Número absoluto de matrículas em cursos técnicos subsequentes da Educação Profissional e Tecnológica de nível médio no município.",
        "unit": "matrículas",
        "series_total": series_total,
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
