import math
import time
from functools import lru_cache
import dash
import dash_bootstrap_components as dbc
import pandas as pd
from dash import Input, Output, State, callback, ctx, dcc, html

from src.data_loader import (
    load_adequacao_docente_data,
    load_atendimento_educacional_especializado_data,
    load_basico_15_17_data,
    load_basico_6_17_data,
    load_basico_integral_data,
    load_censo_populacao_alfabetizacao_data,
    load_censo_populacao_ensino_fundamental_6_14_data,
    load_censo_populacao_ensino_medio_15_17_data,
    load_censo_populacao_escolaridade_media_18_29_data,
    load_censo_populacao_escolaridade_media_18_29_racial_data,
    load_docentes_pos_graduacao_data,
    load_rendimento_professores_data,
    load_docentes_temporarios_data,
    load_eja_integrada_educacao_profissional_data,
    load_ept_nivel_medio_data,
    load_escolas_integral_data,
    get_data_cache_ttl_seconds,
    load_pne_2014_2024_metricas_data,
    load_pne_data,
    load_pre_escola_data,
    load_saeb_ideb_data,
    load_saeb_proficiencia_data,
    load_taxa_alfabetizacao_data,
    load_distorcao_idade_serie_data,
)
from src.views.pne_shared import (
    GOAL_AT_LEAST,
    GOAL_AT_MOST,
    _build_ratio_result,
    _build_result,
    _build_value_result,
    _empty_result,
    _format_metric_distance,
    _format_metric_value,
    _goal_achieved,
    _has_time_comparison,
    _interpretation,
    _prepare_yearly_series,
    _ranking_card,
    _safe_load,
    _select_reference_rows,
    _status_theme,
    _timeline_visual,
    _tracks_goal,
    _value_mode,
    _variation_text,
)
from src.views.pne_shared_components import (
    build_category_card,
    build_detail_card,
    build_detail_explanation_box,
    build_detail_header,
    build_detail_metrics_grid,
    build_detail_unavailable_panel,
    build_detail_value_band,
    build_detail_value_node,
    build_sidebar_item,
    build_stat_cell as _stat_cell,
)
from src.views.pne_2014_ept import build_pne2014_ept_detail_panel, is_pne2014_ept_item


dash.register_page(__name__, path="/pne-2014-2024", name="PNE 2014-2024")

TARGET_START_YEAR = 2014
TARGET_END_YEAR = 2024

META_CRECHE = 50.0
META_PRE_ESCOLA = 100.0
META_BASICO_6_17 = 100.0
META_BASICO_15_17 = 85.0
META_BASICO_INTEGRAL = 25.0
META_ESCOLAS_PUBLICAS_INTEGRAL = 50.0
META_EJA_INTEGRADA_EPT = 25.0
META_EPT_PARTICIPACAO_PUBLICA = 50.0
META_AEE = 80.0
META_ALFABETIZACAO = 100.0
META_ALFABETIZACAO_POPULACAO = 100.0
META_ENSINO_MEDIO_OU_BASICA_COMPLETA_POPULACAO = 85.0
META_ENSINO_FUNDAMENTAL_OU_COMPLETO_POPULACAO = 100.0
META_ESCOLARIDADE_MEDIA_18_29 = 12.0
META_RAZAO_ESCOLARIDADE_RACIAL_18_29 = 100.0
META_IDEB = {
    "anos_iniciais": 6.0,
    "anos_finais": 5.5,
    "ensino_medio": 5.2,
}
META_SAEB = {
    "anos_iniciais": 70.0,
    "anos_finais": 60.0,
    "ensino_medio": 50.0,
}
META_IDADE_REGULAR = {
    "quinto_ano": 100.0,
    "nono_ano": 95.0,
    "ensino_medio": 90.0,
}
META_ADEQUACAO = 100.0
META_POS_GRADUACAO = 50.0
META_TEMPORARIOS = 30.0
META_RENDIMENTO_MAGISTERIO = 100.0

IDEB_RESULT_GROUPS = {
    "ideb_anos_iniciais": ("anos_iniciais", META_IDEB["anos_iniciais"]),
    "ideb_anos_finais": ("anos_finais", META_IDEB["anos_finais"]),
    "ideb_ensino_medio": ("ensino_medio", META_IDEB["ensino_medio"]),
}

ADEQUACAO_RESULT_GROUPS = {
    "adequacao_ai": ("anos_iniciais", META_ADEQUACAO),
    "adequacao_af": ("anos_finais", META_ADEQUACAO),
    "adequacao_em": ("ensino_medio", META_ADEQUACAO),
}

BATCHED_RESULT_KEYS = set(IDEB_RESULT_GROUPS) | set(ADEQUACAO_RESULT_GROUPS)

SAEB_ETAPA_CODIGO = {
    "anos_iniciais": 5,
    "anos_finais": 9,
    "ensino_medio": 12,
}
IDADE_REGULAR_CATEGORIA = {
    "quinto_ano": "taxa_distorcao_fundamental_anos_iniciais",
    "nono_ano": "taxa_distorcao_fundamental_anos_finais",
    "ensino_medio": "taxa_distorcao_medio",
}


def _results_cache_bucket():
    ttl_seconds = get_data_cache_ttl_seconds()
    if ttl_seconds <= 0:
        return None
    return int(time.time() // ttl_seconds)


@lru_cache(maxsize=4)
def _load_precomputed_metric_frame(cache_bucket):
    return _safe_load(load_pne_2014_2024_metricas_data)


def _precomputed_metric_frame():
    cache_bucket = _results_cache_bucket()
    if cache_bucket is None:
        return _safe_load(load_pne_2014_2024_metricas_data)
    return _load_precomputed_metric_frame(cache_bucket)


def _build_precomputed_result(
    municipio,
    indicador,
    *,
    meta,
    meta_label="Meta de referência",
    direction=GOAL_AT_LEAST,
    target_start_year=TARGET_START_YEAR,
    target_end_year=TARGET_END_YEAR,
    tracks_goal=True,
):
    df = _precomputed_metric_frame()
    if df.empty or "municipio" not in df.columns or "indicador" not in df.columns:
        return None

    if "ano" not in df.columns or "valor" not in df.columns:
        return None

    dff = df[(df["municipio"] == municipio) & (df["indicador"] == indicador)].copy()
    if dff.empty:
        return None

    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["valor"] = pd.to_numeric(dff["valor"], errors="coerce")
    dff = dff.dropna(subset=["ano", "valor"])
    if dff.empty:
        return None

    return _build_result(
        dff[["ano", "valor"]],
        meta,
        direction=direction,
        meta_label=meta_label,
        target_start_year=target_start_year,
        target_end_year=target_end_year,
        tracks_goal=tracks_goal,
    )


def _build_grouped_precomputed_fallback_results(
    loader,
    municipio,
    *,
    result_groups,
    precomputed_meta_label,
    fallback_meta_label,
    group_column,
    value_column,
    filters=None,
    target_start_year,
    target_end_year,
    direction=GOAL_AT_LEAST,
):
    results = {}
    pending_groups = {}

    for result_key, (group_value, meta) in result_groups.items():
        precomputed = _build_precomputed_result(
            municipio,
            result_key,
            meta=meta,
            meta_label=precomputed_meta_label,
            direction=direction,
            target_start_year=target_start_year,
            target_end_year=target_end_year,
        )
        if precomputed is not None:
            results[result_key] = precomputed
            continue

        results[result_key] = _empty_result(
            meta,
            direction=direction,
            meta_label=fallback_meta_label,
        )
        pending_groups[result_key] = (group_value, meta)

    if not pending_groups:
        return results

    df = _safe_load(loader)
    if (
        df.empty
        or "municipio" not in df.columns
        or "ano" not in df.columns
        or group_column not in df.columns
        or value_column not in df.columns
    ):
        return results

    dff = df[df["municipio"] == municipio].copy()
    if filters:
        for column, value in filters.items():
            if column not in dff.columns:
                return results
            dff = dff[dff[column] == value]
    if dff.empty:
        return results

    dff = dff.loc[:, ["ano", group_column, value_column]].copy()
    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff[value_column] = pd.to_numeric(dff[value_column], errors="coerce")
    dff = dff.dropna(subset=["ano", value_column]).copy()
    if dff.empty:
        return results

    dff["ano"] = dff["ano"].astype(int)
    yearly = (
        dff.groupby([group_column, "ano"], as_index=False)[value_column]
        .mean()
        .rename(columns={value_column: "valor"})
    )

    for result_key, (group_value, meta) in pending_groups.items():
        yearly_slice = yearly[yearly[group_column] == group_value][["ano", "valor"]]
        if yearly_slice.empty:
            continue
        results[result_key] = _build_result(
            yearly_slice,
            meta,
            direction=direction,
            meta_label=fallback_meta_label,
            target_start_year=target_start_year,
            target_end_year=target_end_year,
        )

    return results


def _calculate_ideb_results(municipio):
    return _build_grouped_precomputed_fallback_results(
        load_saeb_ideb_data,
        municipio,
        result_groups=IDEB_RESULT_GROUPS,
        precomputed_meta_label="Meta PNE 2024",
        fallback_meta_label="Meta PNE 2024",
        group_column="categoria",
        value_column="ideb",
        filters={"dependencia": "publica"},
        target_start_year=2013,
        target_end_year=2023,
    )


def _calculate_adequacao_results(municipio):
    return _build_grouped_precomputed_fallback_results(
        load_adequacao_docente_data,
        municipio,
        result_groups=ADEQUACAO_RESULT_GROUPS,
        precomputed_meta_label="Meta PNE 2024",
        fallback_meta_label="Meta PNE 2024",
        group_column="etapa",
        value_column="percentual_adequacao",
        filters={"dependencia": "total"},
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_creche(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "creche",
        meta=META_CRECHE,
        meta_label="Meta PNE 2024",
    )
    if precomputed is not None:
        return precomputed

    return _build_ratio_result(
        load_pne_data,
        municipio,
        numerator="mat_infantil_creche",
        denominator="pop_0_3",
        meta=META_CRECHE,
        meta_label="Meta PNE 2024",
        den_agg="max",
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_pre_escola(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "pre_escola",
        meta=META_PRE_ESCOLA,
        meta_label="Meta PNE 2024",
    )
    if precomputed is not None:
        return precomputed

    return _build_ratio_result(
        load_pre_escola_data,
        municipio,
        numerator="mat_infantil_pre",
        denominator="pop_4_5",
        meta=META_PRE_ESCOLA,
        meta_label="Meta PNE 2024",
        den_agg="max",
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_basico_6_17(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "basico_6_17",
        meta=META_BASICO_6_17,
        meta_label="Meta PNE 2024",
    )
    if precomputed is not None:
        return precomputed

    return _build_ratio_result(
        load_basico_6_17_data,
        municipio,
        numerator="mat_basico_6_17",
        denominator="pop_6_17",
        meta=META_BASICO_6_17,
        meta_label="Meta PNE 2024",
        den_agg="max",
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_basico_15_17(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "basico_15_17",
        meta=META_BASICO_15_17,
        meta_label="Meta PNE 2024",
    )
    if precomputed is not None:
        return precomputed

    return _build_ratio_result(
        load_basico_15_17_data,
        municipio,
        numerator="mat_basico_15_17",
        denominator="pop_15_17",
        meta=META_BASICO_15_17,
        meta_label="Meta PNE 2024",
        den_agg="max",
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_basico_integral(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "basico_integral",
        meta=META_BASICO_INTEGRAL,
        meta_label="Meta PNE 2024",
    )
    if precomputed is not None:
        return precomputed

    return _build_ratio_result(
        load_basico_integral_data,
        municipio,
        numerator="mat_basico_integral",
        denominator="mat_basico",
        meta=META_BASICO_INTEGRAL,
        meta_label="Meta PNE 2024",
        filters={"dependencia": "publica"},
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_escolas_integral(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "escolas_integral",
        meta=META_ESCOLAS_PUBLICAS_INTEGRAL,
        meta_label="Meta PNE 2024",
    )
    if precomputed is not None:
        return precomputed

    return _build_ratio_result(
        load_escolas_integral_data,
        municipio,
        numerator="escolas_publicas_com_integral",
        denominator="escolas_publicas_total",
        meta=META_ESCOLAS_PUBLICAS_INTEGRAL,
        meta_label="Meta PNE 2024",
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_eja_integrada_educacao_profissional(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "eja_integrada_educacao_profissional",
        meta=META_EJA_INTEGRADA_EPT,
        meta_label="Meta PNE 2024",
        target_start_year=2014,
        target_end_year=2024,
    )
    if precomputed is not None:
        return precomputed

    return _build_value_result(
        load_eja_integrada_educacao_profissional_data,
        municipio,
        value_column="percentual_eja_integrada_educacao_profissional",
        meta=META_EJA_INTEGRADA_EPT,
        meta_label="Meta PNE 2024",
        target_start_year=2014,
        target_end_year=2024,
    )


def _calc_medio_tecnico(municipio):
    result = _build_series_change_result(
        load_ept_nivel_medio_data,
        municipio,
        value_column="mat_ept_nivel_medio_publica",
        meta_label="Visualização informativa",
        target_start_year=2013,
        target_end_year=2024,
    )
    if result.get("available"):
        result["base_year"] = result["start_year"]
    result["tracks_goal"] = False
    result["meta"] = None
    return result


def _calc_medio_tecnico_total(municipio):
    return _ept_total_result(municipio)


def _calc_medio_tecnico_participacao_publica(municipio):
    df = _safe_load(load_ept_nivel_medio_data)
    if (
        df.empty
        or "municipio" not in df.columns
        or "mat_ept_nivel_medio_total" not in df.columns
        or "mat_ept_nivel_medio_publica" not in df.columns
    ):
        return _empty_result(
            META_EPT_PARTICIPACAO_PUBLICA,
            meta_label="Meta PNE 2024",
        )

    dff = df[df["municipio"] == municipio].copy()
    if dff.empty:
        return _empty_result(
            META_EPT_PARTICIPACAO_PUBLICA,
            meta_label="Meta PNE 2024",
        )

    yearly = (
        dff.groupby("ano", as_index=False)[
            ["mat_ept_nivel_medio_total", "mat_ept_nivel_medio_publica"]
        ]
        .sum()
        .copy()
    )
    yearly["mat_ept_nivel_medio_total"] = pd.to_numeric(
        yearly["mat_ept_nivel_medio_total"], errors="coerce"
    )
    yearly["mat_ept_nivel_medio_publica"] = pd.to_numeric(
        yearly["mat_ept_nivel_medio_publica"], errors="coerce"
    )
    yearly = (
        yearly.dropna(
            subset=["mat_ept_nivel_medio_total", "mat_ept_nivel_medio_publica"]
        )
        .sort_values("ano")
        .reset_index(drop=True)
    )
    if yearly.empty:
        return _empty_result(
            META_EPT_PARTICIPACAO_PUBLICA,
            meta_label="Meta PNE 2024",
        )

    base_rows = yearly[
        (yearly["ano"] >= 2013) & (yearly["mat_ept_nivel_medio_publica"] > 0)
    ]
    if base_rows.empty:
        base_rows = yearly[yearly["mat_ept_nivel_medio_publica"] > 0]
    if base_rows.empty:
        return _empty_result(
            META_EPT_PARTICIPACAO_PUBLICA,
            meta_label="Meta PNE 2024",
        )

    base_row = base_rows.head(1).iloc[0]
    base_total = float(base_row["mat_ept_nivel_medio_total"])
    base_publica = float(base_row["mat_ept_nivel_medio_publica"])
    if base_total <= 0:
        return _empty_result(
            META_EPT_PARTICIPACAO_PUBLICA,
            meta_label="Meta PNE 2024",
        )

    base_year = int(base_row["ano"])
    yearly = yearly[yearly["ano"] >= base_year].copy().sort_values("ano")
    yearly["mat_ept_nivel_medio_privada"] = (
        yearly["mat_ept_nivel_medio_total"] - yearly["mat_ept_nivel_medio_publica"]
    )
    yearly["exp_publica"] = yearly["mat_ept_nivel_medio_publica"].diff().fillna(0.0)
    yearly["exp_privada"] = yearly["mat_ept_nivel_medio_privada"].diff().fillna(0.0)
    yearly["exp_publica_positiva"] = yearly["exp_publica"].clip(lower=0.0)
    yearly["exp_privada_positiva"] = yearly["exp_privada"].clip(lower=0.0)
    yearly["exp_publica_acumulada"] = yearly["exp_publica_positiva"].cumsum()
    yearly["exp_privada_acumulada"] = yearly["exp_privada_positiva"].cumsum()
    yearly["exp_total_acumulada"] = (
        yearly["exp_publica_acumulada"] + yearly["exp_privada_acumulada"]
    )
    yearly["valor"] = 0.0
    expansion_mask = yearly["exp_total_acumulada"] > 0
    yearly.loc[expansion_mask, "valor"] = (
        yearly.loc[expansion_mask, "exp_publica_acumulada"]
        .div(yearly.loc[expansion_mask, "exp_total_acumulada"])
        .mul(100.0)
    )
    yearly = yearly[yearly["ano"] > base_year].copy()
    yearly = yearly.replace([math.inf, -math.inf], pd.NA).dropna(subset=["valor"])
    if yearly.empty:
        return _empty_result(
            META_EPT_PARTICIPACAO_PUBLICA,
            meta_label="Meta PNE 2024",
        )

    result = _build_result(
        yearly[["ano", "valor"]],
        META_EPT_PARTICIPACAO_PUBLICA,
        meta_label="Meta PNE 2024",
        target_start_year=base_year + 1,
        target_end_year=2024,
    )
    result["base_year"] = base_year
    result["base_total"] = base_total
    result["base_publica"] = base_publica
    return result


def _calc_aee(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "aee",
        meta=META_AEE,
        meta_label="Meta definida 2026-2036",
    )
    if precomputed is not None:
        return precomputed

    return _build_ratio_result(
        load_atendimento_educacional_especializado_data,
        municipio,
        numerator="quantidade_aee",
        denominator="total_turmas_educacao_especial",
        meta=META_AEE,
        meta_label="Meta definida 2026-2036",
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_alfabetizacao(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "alfabetizacao",
        meta=META_ALFABETIZACAO,
        meta_label="Meta PNE 2024",
    )
    if precomputed is not None:
        return precomputed

    return _build_value_result(
        load_taxa_alfabetizacao_data,
        municipio,
        value_column="taxa_alfabetizacao",
        meta=META_ALFABETIZACAO,
        meta_label="Meta PNE 2024",
        filters={"dependencia": "publica"},
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_alfabetizacao_pop_15_mais(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "alfabetizacao_pop_15_mais",
        meta=META_ALFABETIZACAO_POPULACAO,
        meta_label="Meta PNE 2024",
        target_start_year=2010,
        target_end_year=2022,
    )
    if precomputed is not None:
        return precomputed

    return _build_value_result(
        load_censo_populacao_alfabetizacao_data,
        municipio,
        value_column="taxa_alfabetizacao_15_mais",
        meta=META_ALFABETIZACAO_POPULACAO,
        meta_label="Meta PNE 2024",
        target_start_year=2010,
        target_end_year=2022,
    )


def _calc_escolaridade_media_18_29(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "escolaridade_media_18_29",
        meta=META_ESCOLARIDADE_MEDIA_18_29,
        meta_label="Meta PNE 2024",
        target_start_year=2022,
        target_end_year=2022,
    )
    if precomputed is not None:
        return precomputed

    return _build_value_result(
        load_censo_populacao_escolaridade_media_18_29_data,
        municipio,
        value_column="escolaridade_media_18_29",
        meta=META_ESCOLARIDADE_MEDIA_18_29,
        meta_label="Meta PNE 2024",
        target_start_year=2022,
        target_end_year=2022,
    )


def _calc_razao_escolaridade_racial_18_29(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "razao_escolaridade_racial_18_29",
        meta=META_RAZAO_ESCOLARIDADE_RACIAL_18_29,
        meta_label="Meta PNE 2024",
        target_start_year=2022,
        target_end_year=2022,
    )
    if precomputed is not None:
        return precomputed

    return _build_value_result(
        load_censo_populacao_escolaridade_media_18_29_racial_data,
        municipio,
        value_column="razao_percentual_escolaridade_negros_nao_negros_18_29",
        meta=META_RAZAO_ESCOLARIDADE_RACIAL_18_29,
        meta_label="Meta PNE 2024",
        target_start_year=2022,
        target_end_year=2022,
    )


def _calc_ensino_medio_ou_basica_completa_pop_15_17(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "ensino_medio_ou_basica_completa_pop_15_17",
        meta=META_ENSINO_MEDIO_OU_BASICA_COMPLETA_POPULACAO,
        meta_label="Meta PNE 2024",
        target_start_year=2010,
        target_end_year=2022,
    )
    if precomputed is not None:
        return precomputed

    return _build_value_result(
        load_censo_populacao_ensino_medio_15_17_data,
        municipio,
        value_column="percentual_15_17_ensino_medio_ou_basica_completa",
        meta=META_ENSINO_MEDIO_OU_BASICA_COMPLETA_POPULACAO,
        meta_label="Meta PNE 2024",
        target_start_year=2010,
        target_end_year=2022,
    )


def _calc_ensino_fundamental_ou_completo_pop_6_14(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "ensino_fundamental_ou_completo_pop_6_14",
        meta=META_ENSINO_FUNDAMENTAL_OU_COMPLETO_POPULACAO,
        meta_label="Meta PNE 2024",
        target_start_year=2010,
        target_end_year=2022,
    )
    if precomputed is not None:
        return precomputed

    result = _build_value_result(
        load_censo_populacao_ensino_fundamental_6_14_data,
        municipio,
        value_column="percentual_6_14_ensino_fundamental_ou_completo",
        meta=META_ENSINO_FUNDAMENTAL_OU_COMPLETO_POPULACAO,
        meta_label="Meta PNE 2024",
        target_start_year=2010,
        target_end_year=2022,
    )
    return result


def _calc_ideb(municipio, etapa_key):
    precomputed = _build_precomputed_result(
        municipio,
        f"ideb_{etapa_key}",
        meta=META_IDEB[etapa_key],
        meta_label="Meta PNE 2024",
        target_start_year=2013,
        target_end_year=2023,
    )
    if precomputed is not None:
        return precomputed

    return _build_value_result(
        load_saeb_ideb_data,
        municipio,
        value_column="ideb",
        meta=META_IDEB[etapa_key],
        meta_label="Meta PNE 2024",
        filters={
            "categoria": etapa_key,
            "dependencia": "publica",
        },
        target_start_year=2013,
        target_end_year=2023,
    )


def _calc_saeb(municipio, etapa_key):
    precomputed = _build_precomputed_result(
        municipio,
        f"saeb_{etapa_key}",
        meta=META_SAEB[etapa_key],
        meta_label="Meta definida 2026-2036",
    )
    if precomputed is not None:
        return precomputed

    return _build_value_result(
        load_saeb_proficiencia_data,
        municipio,
        value_column="taxa_adequado_ou_superior",
        meta=META_SAEB[etapa_key],
        meta_label="Meta definida 2026-2036",
        filters={
            "etapa_codigo": SAEB_ETAPA_CODIGO[etapa_key],
            "materia": "matematica",
            "dependencia": "total",
            "localizacao": "total",
        },
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_idade_regular(municipio, etapa_key):
    precomputed_key = {
        "quinto_ano": "idade_regular_quinto",
        "nono_ano": "idade_regular_nono",
        "ensino_medio": "idade_regular_medio",
    }[etapa_key]
    precomputed = _build_precomputed_result(
        municipio,
        precomputed_key,
        meta=META_IDADE_REGULAR[etapa_key],
        meta_label="Meta definida 2026-2036",
    )
    if precomputed is not None:
        return precomputed

    df = _safe_load(load_distorcao_idade_serie_data)
    if (
        df.empty
        or "municipio" not in df.columns
        or "taxa_idade_regular" not in df.columns
    ):
        return _empty_result(
            META_IDADE_REGULAR[etapa_key],
            meta_label="Meta definida 2026-2036",
        )

    dff = df[df["municipio"] == municipio].copy()
    if "etapa_proxy" in dff.columns:
        dff = dff[dff["etapa_proxy"] == etapa_key]
    elif "categoria" in dff.columns:
        dff = dff[dff["categoria"] == IDADE_REGULAR_CATEGORIA[etapa_key]]
    dff = (
        dff[dff.get("dependencia", "total") == "total"]
        if "dependencia" in dff.columns
        else dff
    )

    if dff.empty:
        return _empty_result(
            META_IDADE_REGULAR[etapa_key],
            meta_label="Meta definida 2026-2036",
        )

    yearly = (
        dff.groupby("ano", as_index=False)["taxa_idade_regular"]
        .mean()
        .rename(columns={"taxa_idade_regular": "valor"})
    )
    return _build_result(
        yearly,
        META_IDADE_REGULAR[etapa_key],
        meta_label="Meta definida 2026-2036",
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_adequacao(municipio, etapa_key):
    precomputed_key = {
        "anos_iniciais": "adequacao_ai",
        "anos_finais": "adequacao_af",
        "ensino_medio": "adequacao_em",
    }[etapa_key]
    precomputed = _build_precomputed_result(
        municipio,
        precomputed_key,
        meta=META_ADEQUACAO,
        meta_label="Meta PNE 2024",
    )
    if precomputed is not None:
        return precomputed

    return _build_value_result(
        load_adequacao_docente_data,
        municipio,
        value_column="percentual_adequacao",
        meta=META_ADEQUACAO,
        meta_label="Meta PNE 2024",
        filters={"etapa": etapa_key, "dependencia": "total"},
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_pos_graduacao(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "pos_graduacao",
        meta=META_POS_GRADUACAO,
        meta_label="Meta PNE 2024",
    )
    if precomputed is not None:
        return precomputed

    return _build_value_result(
        load_docentes_pos_graduacao_data,
        municipio,
        value_column="percentual_pos_graduacao",
        meta=META_POS_GRADUACAO,
        meta_label="Meta PNE 2024",
        filters={"dependencia": "total"},
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_temporarios(municipio):
    precomputed = _build_precomputed_result(
        municipio,
        "temporarios",
        meta=META_TEMPORARIOS,
        meta_label="Meta PNE 2024",
        direction=GOAL_AT_MOST,
    )
    if precomputed is not None:
        return precomputed

    return _build_value_result(
        load_docentes_temporarios_data,
        municipio,
        value_column="percentual_temporarios",
        meta=META_TEMPORARIOS,
        meta_label="Meta PNE 2024",
        direction=GOAL_AT_MOST,
        filters={"dependencia": "publica"},
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


def _calc_rendimento_magisterio(municipio):
    return _build_value_result(
        load_rendimento_professores_data,
        municipio,
        value_column="razao_percentual_remuneracao_media",
        meta=META_RENDIMENTO_MAGISTERIO,
        meta_label="Meta PNE 2024",
        target_start_year=TARGET_START_YEAR,
        target_end_year=TARGET_END_YEAR,
    )


INDICADORES = {
    "atendimento": {
        "label": "Atendimento Escolar",
        "icon": "🎓",
        "accent": "#4f46e5",
        "items": [
            {
                "key": "creche",
                "label": "População de 0 a 3 anos que frequenta a escola/creche",
                "sub": "",
                "desc": "Percentual da população de 0 a 3 anos que frequenta a escola ou creche.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_creche,
            },
            {
                "key": "pre_escola",
                "label": "População de 4 a 5 anos que frequenta a escola/creche",
                "sub": "",
                "desc": "Percentual da população de 4 a 5 anos que frequenta a escola ou creche.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_pre_escola,
            },
            {
                "key": "basico_6_17",
                "label": "População de 6 a 17 anos que frequenta a educação básica",
                "sub": "",
                "desc": "Percentual da população de 6 a 17 anos que frequenta a educação básica.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_basico_6_17,
            },
            {
                "key": "basico_15_17",
                "label": "População de 15 a 17 anos que frequenta a escola ou já concluiu a educação básica",
                "sub": "",
                "desc": "Percentual da população de 15 a 17 anos que frequenta a escola ou já concluiu a educação básica.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_basico_15_17,
            },
            {
                "key": "basico_integral",
                "label": "Alunos do público-alvo da ETI em jornada integral na rede pública",
                "sub": "",
                "desc": "Percentual de alunos da educação básica pública que pertencem ao público-alvo da Educação em Tempo Integral (ETI) e estão em jornada de tempo integral.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_basico_integral,
            },
            {
                "key": "escolas_integral",
                "label": "Escolas públicas com alunos em jornada de tempo integral",
                "sub": "",
                "desc": "Percentual de escolas públicas da educação básica que possuem, pelo menos, 25% dos alunos da educação básica em jornada integral.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_escolas_integral,
            },
            {
                "key": "eja_integrada_educacao_profissional",
                "label": "Matrículas do EJA integradas à educação profissional",
                "sub": "",
                "desc": "Percentual de matrículas do EJA na forma integrada à educação profissional no município.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_eja_integrada_educacao_profissional,
            },
            {
                "key": "medio_tecnico_total",
                "label": "Número absoluto de matrículas em EPT de nível médio",
                "sub": "",
                "desc": "Evolução do número absoluto de matrículas da Educação Profissional e Tecnológica de nível médio no município, entre 2014 e 2024.",
                "meta_label": "Visualização informativa",
                "compute": _calc_medio_tecnico_total,
                "tracks_goal": False,
            },
            {
                "key": "medio_tecnico_participacao_publica",
                "label": "Participação acumulada do segmento público na expansão da EPT de nível médio",
                "sub": "",
                "desc": "Participação acumulada do segmento público nas expansões anuais positivas da Educação Profissional e Tecnológica de nível médio no município, com base na evolução observada até 2024.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_medio_tecnico_participacao_publica,
            },
            {
                "key": "medio_tecnico",
                "label": "Expansão acumulada da EPT de médio público",
                "sub": "",
                "desc": "Número de matrículas acumuladas da Educação Profissional e Tecnológica de médio público, a partir de 2013.",
                "meta_label": "Visualização informativa",
                "compute": _calc_medio_tecnico,
                "tracks_goal": False,
                "value_mode": "count",
            },
            {
                "key": "aee",
                "label": "Oferta de AEE na educação especial",
                "sub": "",
                "desc": "Participação das turmas ou salas de AEE em relação ao total da educação especial no município.",
                "meta_label": "Meta definida 2026-2036",
                "compute": _calc_aee,
            },
        ],
    },
    "rendimento": {
        "label": "Rendimento Escolar",
        "icon": "📈",
        "accent": "#10b981",
        "items": [
            {
                "key": "alfabetizacao",
                "label": "Estudantes alfabetizados na rede pública",
                "sub": "",
                "desc": "Percentual de estudantes alfabetizados na rede pública do município.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_alfabetizacao,
            },
            {
                "key": "ideb_anos_iniciais",
                "label": "IDEB da rede pública nos anos iniciais do ensino fundamental",
                "sub": "",
                "desc": "Resultado do IDEB da rede pública nos anos iniciais do ensino fundamental.",
                "meta_label": "Meta PNE 2024",
                "value_mode": "index",
                "compute": lambda municipio: _calc_ideb(municipio, "anos_iniciais"),
            },
            {
                "key": "ideb_anos_finais",
                "label": "IDEB da rede pública nos anos finais do ensino fundamental",
                "sub": "",
                "desc": "Resultado do IDEB da rede pública nos anos finais do ensino fundamental.",
                "meta_label": "Meta PNE 2024",
                "value_mode": "index",
                "compute": lambda municipio: _calc_ideb(municipio, "anos_finais"),
            },
            {
                "key": "ideb_ensino_medio",
                "label": "IDEB da rede pública no ensino médio",
                "sub": "",
                "desc": "Resultado do IDEB da rede pública no ensino médio.",
                "meta_label": "Meta PNE 2024",
                "value_mode": "index",
                "compute": lambda municipio: _calc_ideb(municipio, "ensino_medio"),
            },
        ],
    },
    "corpo_docente": {
        "label": "Corpo Docente",
        "icon": "👩‍🏫",
        "accent": "#f59e0b",
        "items": [
            {
                "key": "adequacao_ai",
                "label": "Docentes com formação adequada nos anos iniciais",
                "sub": "",
                "desc": "Percentual de docentes com formação adequada nos anos iniciais do ensino fundamental.",
                "meta_label": "Meta PNE 2024",
                "compute": lambda municipio: _calc_adequacao(
                    municipio, "anos_iniciais"
                ),
            },
            {
                "key": "adequacao_af",
                "label": "Docentes com formação adequada nos anos finais",
                "sub": "",
                "desc": "Percentual de docentes com formação adequada nos anos finais do ensino fundamental.",
                "meta_label": "Meta PNE 2024",
                "compute": lambda municipio: _calc_adequacao(municipio, "anos_finais"),
            },
            {
                "key": "adequacao_em",
                "label": "Docentes com formação adequada no ensino médio",
                "sub": "",
                "desc": "Percentual de docentes com formação adequada no ensino médio.",
                "meta_label": "Meta PNE 2024",
                "compute": lambda municipio: _calc_adequacao(municipio, "ensino_medio"),
            },
            {
                "key": "pos_graduacao",
                "label": "Docentes da educação básica com pós-graduação",
                "sub": "",
                "desc": "Percentual de docentes da educação básica com especialização, mestrado ou doutorado.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_pos_graduacao,
            },
            {
                "key": "rendimento_magisterio",
                "label": "Rendimento do magistério em relação a outros profissionais com nível superior",
                "sub": "",
                "desc": "Relação percentual entre o rendimento bruto médio mensal dos profissionais do magistério da educação básica, com nível superior completo, e o rendimento bruto médio mensal dos demais profissionais assalariados, com nível superior completo.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_rendimento_magisterio,
            },
        ],
    },
    "escolaridade_populacao": {
        "label": "Escolaridade da População",
        "icon": "👥",
        "accent": "#2563eb",
        "items": [
            {
                "key": "alfabetizacao_pop_15_mais",
                "label": "População de 15 anos ou mais alfabetizada",
                "sub": "",
                "desc": "Percentual da população de 15 anos ou mais de idade alfabetizada no município, com base nos Censos Demográficos.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_alfabetizacao_pop_15_mais,
            },
            {
                "key": "ensino_medio_ou_basica_completa_pop_15_17",
                "label": "População de 15 a 17 anos que frequenta o ensino médio ou concluiu a educação básica",
                "sub": "",
                "desc": "Percentual da população de 15 a 17 anos que frequenta o ensino médio ou possui educação básica completa, com base nos Censos Demográficos.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_ensino_medio_ou_basica_completa_pop_15_17,
            },
            {
                "key": "ensino_fundamental_ou_completo_pop_6_14",
                "label": "População de 6 a 14 anos que frequenta ou concluiu o ensino fundamental",
                "sub": "",
                "desc": "Percentual de pessoas de 6 a 14 anos que frequentam ou que já concluíram o ensino fundamental, com base nos Censos Demográficos.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_ensino_fundamental_ou_completo_pop_6_14,
            },
            {
                "key": "escolaridade_media_18_29",
                "label": "Escolaridade média da população de 18 a 29 anos",
                "sub": "",
                "desc": "Escolaridade média, em anos de estudo, da população de 18 a 29 anos de idade no município.",
                "meta_label": "Meta PNE 2024",
                "value_mode": "years",
                "compute": _calc_escolaridade_media_18_29,
            },
            {
                "key": "razao_escolaridade_racial_18_29",
                "label": "Razão entre escolaridade média de negros e não negros de 18 a 29 anos",
                "sub": "",
                "desc": "Razão percentual entre a escolaridade média de negros e não negros na faixa etária de 18 a 29 anos no município.",
                "meta_label": "Meta PNE 2024",
                "compute": _calc_razao_escolaridade_racial_18_29,
            },
        ],
    },
}

INDICADORES["atendimento"]["items"] = [
    item
    for item in INDICADORES["atendimento"]["items"]
    if item["key"]
    in {
        "creche",
        "pre_escola",
        "basico_6_17",
        "basico_15_17",
        "basico_integral",
        "escolas_integral",
        "eja_integrada_educacao_profissional",
        "medio_tecnico_total",
        "medio_tecnico_participacao_publica",
        "medio_tecnico",
    }
]

CATEGORY_ORDER = list(INDICADORES.keys())
ITEM_TO_CATEGORY = {
    item["key"]: category_key
    for category_key, category in INDICADORES.items()
    for item in category["items"]
}
DEFAULT_CATEGORY = CATEGORY_ORDER[0]
DEFAULT_INDICATOR = INDICADORES[DEFAULT_CATEGORY]["items"][0]["key"]


def _detail_delta_color(result):
    progress = result.get("progress_delta")
    if progress is None:
        return "#94a3b8"
    return "#10b981" if progress >= 0 else "#f43f5e"


def _distance_color(result):
    distance = result.get("distance")
    if distance is None:
        return "#94a3b8"
    return "#10b981" if _goal_achieved(distance) else "#f43f5e"


def _detail_title(item):
    if item["sub"] and item["sub"].casefold() not in item["label"].casefold():
        return f"{item['label']} ({item['sub']})"
    return item["label"]


def _build_series_change_result(
    loader,
    municipio,
    *,
    value_column,
    filters=None,
    value_agg="sum",
    meta_label=None,
    target_start_year=TARGET_START_YEAR,
    target_end_year=TARGET_END_YEAR,
):
    df = _safe_load(loader)
    if df.empty or "municipio" not in df.columns or value_column not in df.columns:
        return {"available": False, "tracks_goal": False}

    dff = df[df["municipio"] == municipio].copy()
    if filters:
        for column, value in filters.items():
            if column not in dff.columns:
                return {"available": False, "tracks_goal": False}
            if isinstance(value, (list, tuple, set, frozenset)):
                dff = dff[dff[column].isin(value)]
            else:
                dff = dff[dff[column] == value]

    if dff.empty:
        return {"available": False, "tracks_goal": False}

    yearly = dff.groupby("ano", as_index=False).agg({value_column: value_agg}).copy()
    yearly[value_column] = pd.to_numeric(yearly[value_column], errors="coerce")
    yearly = yearly.dropna(subset=[value_column]).rename(
        columns={value_column: "valor"}
    )
    series = _prepare_yearly_series(yearly[["ano", "valor"]])
    start_row, end_row = _select_reference_rows(
        series,
        target_start_year=target_start_year,
        target_end_year=target_end_year,
    )
    if start_row is None or end_row is None:
        return {"available": False, "tracks_goal": False}

    start_value = float(start_row["valor"])
    end_value = float(end_row["valor"])
    raw_delta = end_value - start_value
    percent_change = (
        None if start_value == 0 else ((end_value / start_value) - 1.0) * 100.0
    )

    series_window = (
        series[
            (series["ano"] >= int(start_row["ano"]))
            & (series["ano"] <= int(end_row["ano"]))
        ]
        .copy()
        .reset_index(drop=True)
    )
    series_points = [
        {"ano": int(row["ano"]), "valor": float(row["valor"])}
        for _, row in series_window.iterrows()
    ]

    return {
        "available": True,
        "start_year": int(start_row["ano"]),
        "end_year": int(end_row["ano"]),
        "start_value": start_value,
        "end_value": end_value,
        "raw_delta": raw_delta,
        "percent_change": percent_change,
        "series": series_points,
        "meta": None,
        "meta_label": meta_label,
        "tracks_goal": False,
    }


def _ept_total_result(municipio):
    return _build_series_change_result(
        load_ept_nivel_medio_data,
        municipio,
        value_column="mat_ept_nivel_medio_total",
        target_start_year=2014,
        target_end_year=2024,
    )


def _detail_panel(category, item, result, order_index, total, municipio):
    if not result.get("available"):
        return build_detail_unavailable_panel(
            category["accent"],
            item["label"],
            item["desc"],
            order_index,
            total,
        )

    status = _status_theme(result)
    accent = category["accent"]

    if is_pne2014_ept_item(item["key"]):
        return build_pne2014_ept_detail_panel(
            item,
            result,
            accent=accent,
            status=status,
            order_index=order_index,
            total=total,
            title=_detail_title(item),
            detail_delta_color_fn=_detail_delta_color,
            detail_distance_color_fn=_distance_color,
        )

    delta_color = _detail_delta_color(result)
    distance_color = _distance_color(result)
    detail_title = _detail_title(item)
    is_single_snapshot = (
        result.get("start_year") is not None
        and result.get("end_year") is not None
        and int(result["start_year"]) == int(result["end_year"])
    )

    return build_detail_card(
        [
            build_detail_header(
                accent,
                detail_title,
                item["desc"],
                order_index,
                total,
                status,
            ),
            build_detail_value_band(
                start_node=(
                    build_detail_value_node(
                        result["start_year"],
                        _format_metric_value(item, result["start_value"]),
                        "2.05rem",
                        color="#0f172a",
                    )
                    if not is_single_snapshot
                    else None
                ),
                timeline_node=(
                    _timeline_visual(result, accent) if not is_single_snapshot else None
                ),
                end_node=build_detail_value_node(
                    result["end_year"],
                    _format_metric_value(item, result["end_value"]),
                    "2.45rem" if is_single_snapshot else "2.2rem",
                    color=accent,
                    center=is_single_snapshot,
                ),
                columns=4,
                center_single=is_single_snapshot,
            ),
            build_detail_metrics_grid(
                [
                    _stat_cell("Variação", _variation_text(result, item), delta_color),
                    _stat_cell(
                        result.get("meta_label", "Meta de referência"),
                        _format_metric_value(item, result["meta"]),
                        "#475569",
                    ),
                    _stat_cell("Situação da meta", status["text"], status["fg"]),
                    _stat_cell(
                        "Distância da meta",
                        _format_metric_distance(item, result["distance"]),
                        distance_color,
                    ),
                ],
                4,
                margin_bottom="12px",
            ),
            build_detail_explanation_box(_interpretation(item, result)),
        ]
    )


@lru_cache(maxsize=128)
def _calculate_results_cached(municipio, cache_bucket):
    results = {}
    for category in INDICADORES.values():
        for item in category["items"]:
            if item["key"] in BATCHED_RESULT_KEYS:
                continue
            try:
                results[item["key"]] = item["compute"](municipio)
            except Exception as exc:
                print(f"Erro ao calcular indicador {item['key']}: {exc}")
                results[item["key"]] = _empty_result(
                    meta=0,
                    meta_label=item.get("meta_label", "Meta de referência"),
                    tracks_goal=item.get("tracks_goal", True),
                )

    for label, calculator, groups in (
        ("ideb", _calculate_ideb_results, IDEB_RESULT_GROUPS),
        ("adequacao", _calculate_adequacao_results, ADEQUACAO_RESULT_GROUPS),
    ):
        try:
            results.update(calculator(municipio))
        except Exception as exc:
            print(f"Erro ao calcular grupo {label}: {exc}")
            for result_key, (_, meta) in groups.items():
                results[result_key] = _empty_result(
                    meta=meta,
                    meta_label="Meta PNE 2024",
                )

    return results


def _calculate_results(municipio):
    cache_bucket = _results_cache_bucket()
    if cache_bucket is None:
        return _calculate_results_cached.__wrapped__(municipio, None)

    cached = _calculate_results_cached(municipio, cache_bucket)
    return {key: value.copy() for key, value in cached.items()}


layout = html.Div(
    [
        dcc.Store(id="pne2014-active-cat", data=DEFAULT_CATEGORY),
        dcc.Store(id="pne2014-active-indicator", data=DEFAULT_INDICATOR),
        html.Div(
            [
                html.H2(
                    "Painel de Resultados do PNE 2014-2024",
                    style={
                        "fontWeight": "800",
                        "fontSize": "1.45rem",
                        "color": "#0f172a",
                        "margin": "0 0 4px 0",
                    },
                ),
                html.Div(
                    "Acompanhe os resultados dos principais indicadores do Plano Nacional de Educação do ciclo anterior para o município.",
                    style={
                        "fontSize": "0.84rem",
                        "color": "#64748b",
                    },
                ),
            ],
            style={"marginBottom": "16px"},
        ),
        dbc.Alert(
            "Selecione um município no filtro acima para visualizar os indicadores do PNE 2014-2024.",
            id="alert-municipio-pne2014",
            color="warning",
            class_name="mb-3",
            style={
                "border": "none",
                "borderRadius": "12px",
                "fontSize": "0.95rem",
                "fontWeight": "600",
                "display": "none",
            },
        ),
        dcc.Loading(
            [
                dcc.Store(id="pne2014-results-store"),
                html.Div(
                    [
                        html.Div(
                            id="pne2014-category-cards",
                            style={
                                "display": "flex",
                                "gap": "10px",
                                "marginBottom": "16px",
                                "flexWrap": "wrap",
                            },
                        ),
                        dbc.Row(
                            [
                                dbc.Col(
                                    html.Div(
                                        [
                                            html.Div(
                                                [
                                                    html.Div(
                                                        id="pne2014-sidebar-icon",
                                                        style={
                                                            "width": "38px",
                                                            "height": "38px",
                                                            "borderRadius": "12px",
                                                            "display": "flex",
                                                            "alignItems": "center",
                                                            "justifyContent": "center",
                                                            "fontSize": "1.02rem",
                                                            "color": "#ffffff",
                                                        },
                                                    ),
                                                    html.Div(
                                                        [
                                                            html.Div(
                                                                id="pne2014-sidebar-title",
                                                                style={
                                                                    "fontSize": "0.9rem",
                                                                    "fontWeight": "800",
                                                                    "color": "#0f172a",
                                                                },
                                                            ),
                                                            html.Div(
                                                                id="pne2014-sidebar-count",
                                                                style={
                                                                    "fontSize": "0.68rem",
                                                                    "fontWeight": "600",
                                                                    "color": "#64748b",
                                                                    "marginTop": "1px",
                                                                },
                                                            ),
                                                        ],
                                                        style={"flex": "1"},
                                                    ),
                                                ],
                                                style={
                                                    "display": "flex",
                                                    "alignItems": "center",
                                                    "gap": "8px",
                                                    "marginBottom": "8px",
                                                },
                                            ),
                                            html.Div(
                                                id="pne2014-sidebar-list",
                                                className="pne-dashboard-sidebar-list-grid",
                                            ),
                                        ],
                                        className="pne-dashboard-sidebar-panel",
                                        style={
                                            "background": "#ffffff",
                                            "borderRadius": "18px",
                                            "border": "1px solid #e4e9f1",
                                            "padding": "10px",
                                            "boxShadow": "0 12px 28px rgba(15, 23, 42, 0.05)",
                                            "height": "100%",
                                        },
                                    ),
                                    md=5,
                                    xl=5,
                                    className="mb-3",
                                ),
                                dbc.Col(
                                    html.Div(
                                        id="pne2014-detail-panel",
                                        style={"height": "100%"},
                                    ),
                                    md=7,
                                    xl=7,
                                    className="mb-3",
                                ),
                            ]
                        ),
                        dbc.Row(
                            [
                                dbc.Col(
                                    html.Div(id="pne2014-top-avancos"),
                                    md=6,
                                    className="mb-3",
                                ),
                                dbc.Col(
                                    html.Div(id="pne2014-top-atencao"),
                                    md=6,
                                    className="mb-3",
                                ),
                            ]
                        ),
                    ],
                    id="pne2014-main-content",
                    style={"display": "none"},
                ),
            ],
            target_components={"pne2014-results-store": "data"},
            type="circle",
        ),
    ],
    className="page-section pne-dashboard-page",
)


@callback(
    Output("alert-municipio-pne2014", "style"),
    Output("pne2014-results-store", "data"),
    Input("filter-municipio", "value"),
)
def update_pne2014_data_state(municipio):
    base_alert_style = {
        "border": "none",
        "borderRadius": "12px",
        "fontSize": "0.95rem",
        "fontWeight": "600",
    }

    if not municipio:
        return {**base_alert_style, "display": "block"}, {}

    return (
        {**base_alert_style, "display": "none"},
        {"municipio": municipio},
    )


@callback(
    Output("pne2014-main-content", "style"),
    Output("pne2014-category-cards", "children"),
    Output("pne2014-sidebar-icon", "children"),
    Output("pne2014-sidebar-icon", "style"),
    Output("pne2014-sidebar-title", "children"),
    Output("pne2014-sidebar-count", "children"),
    Output("pne2014-sidebar-list", "style"),
    Output("pne2014-sidebar-list", "children"),
    Output("pne2014-detail-panel", "children"),
    Output("pne2014-top-avancos", "children"),
    Output("pne2014-top-atencao", "children"),
    Input("pne2014-results-store", "data"),
    Input("pne2014-active-cat", "data"),
    Input("pne2014-active-indicator", "data"),
    State("filter-municipio", "value"),
)
def update_pne2014_page(results_state, active_category, active_indicator, municipio):
    if not municipio or not results_state:
        return (
            {"display": "none"},
            [],
            "",
            {
                "width": "46px",
                "height": "46px",
                "borderRadius": "16px",
                "display": "flex",
                "alignItems": "center",
                "justifyContent": "center",
                "fontSize": "1.3rem",
                "color": "#ffffff",
            },
            "",
            "",
            {},
            [],
            "",
            "",
            "",
        )

    results = _calculate_results(municipio)
    if not results:
        return (
            {"display": "none"},
            [],
            "",
            {
                "width": "46px",
                "height": "46px",
                "borderRadius": "16px",
                "display": "flex",
                "alignItems": "center",
                "justifyContent": "center",
                "fontSize": "1.3rem",
                "color": "#ffffff",
            },
            "",
            "",
            {},
            [],
            "",
            "",
            "",
        )

    active_category = (
        active_category if active_category in INDICADORES else DEFAULT_CATEGORY
    )
    active_item_keys = [item["key"] for item in INDICADORES[active_category]["items"]]
    if active_indicator not in active_item_keys:
        active_indicator = active_item_keys[0]

    category_cards = [
        build_category_card(
            category_key,
            INDICADORES[category_key],
            results,
            category_key == active_category,
            card_id_type="pne2014-category-card",
        )
        for category_key in CATEGORY_ORDER
    ]

    active_category_cfg = INDICADORES[active_category]
    sidebar_items = []
    total_sidebar_items = len(active_category_cfg["items"])
    sidebar_rows = max(1, math.ceil(total_sidebar_items / 2))
    sidebar_cols = max(1, math.ceil(total_sidebar_items / sidebar_rows))
    sidebar_list_style = {
        "--pne2014-sidebar-rows": str(sidebar_rows),
        "--pne2014-sidebar-cols": str(sidebar_cols),
    }
    for idx, item in enumerate(active_category_cfg["items"]):
        sidebar_items.append(
            build_sidebar_item(
                idx,
                item,
                results.get(
                    item["key"],
                    _empty_result(0, tracks_goal=item.get("tracks_goal", True)),
                ),
                active_category_cfg["accent"],
                item_id_type="pne2014-sidebar-item",
                is_active=item["key"] == active_indicator,
            )
        )

    active_item = next(
        item for item in active_category_cfg["items"] if item["key"] == active_indicator
    )
    active_result = results.get(
        active_indicator,
        _empty_result(0, tracks_goal=active_item.get("tracks_goal", True)),
    )
    detail = _detail_panel(
        active_category_cfg,
        active_item,
        active_result,
        active_item_keys.index(active_indicator) + 1,
        len(active_item_keys),
        municipio,
    )

    ranking_rows = []
    for item in active_category_cfg["items"]:
        result = results.get(item["key"], {})
        if (
            not result.get("available")
            or not _tracks_goal(item, result)
            or not _has_time_comparison(result)
        ):
            continue
        ranking_rows.append(
            {
                "label": item["label"],
                "sub": item["sub"],
                "progress_delta": result["progress_delta"],
                "distance": result["distance"],
                "atingida": result["atingida"],
                "value_mode": _value_mode(item),
            }
        )

    top_avancos = sorted(
        ranking_rows,
        key=lambda row: row["progress_delta"],
        reverse=True,
    )[:3]
    top_atencao = sorted(
        [row for row in ranking_rows if not row["atingida"]],
        key=lambda row: row["distance"],
    )[:3]

    sidebar_icon_style = {
        "width": "46px",
        "height": "46px",
        "borderRadius": "16px",
        "display": "flex",
        "alignItems": "center",
        "justifyContent": "center",
        "fontSize": "1.3rem",
        "color": "#ffffff",
        "background": f"linear-gradient(135deg, {active_category_cfg['accent']}, color-mix(in srgb, {active_category_cfg['accent']} 60%, #ffffff))",
        "boxShadow": f"0 10px 24px color-mix(in srgb, {active_category_cfg['accent']} 18%, transparent)",
    }

    return (
        {"display": "block"},
        category_cards,
        active_category_cfg["icon"],
        sidebar_icon_style,
        active_category_cfg["label"],
        f"{len(active_category_cfg['items'])} indicadores",
        sidebar_list_style,
        sidebar_items,
        detail,
        _ranking_card(
            "Indicadores com maior avanço", "#10b981", top_avancos, "progress_delta"
        ),
        _ranking_card(
            "Indicadores que exigem atenção", "#f59e0b", top_atencao, "distance"
        ),
    )


@callback(
    Output("pne2014-active-cat", "data"),
    Output("pne2014-active-indicator", "data"),
    Input({"type": "pne2014-category-card", "index": dash.ALL}, "n_clicks"),
    Input({"type": "pne2014-sidebar-item", "index": dash.ALL}, "n_clicks"),
    State("pne2014-active-cat", "data"),
    prevent_initial_call=True,
)
def select_pne2014_item(_category_clicks, _item_clicks, active_category):
    triggered = ctx.triggered_id
    if not triggered:
        return dash.no_update, dash.no_update

    if triggered["type"] == "pne2014-category-card":
        category_key = triggered["index"]
        first_item = INDICADORES[category_key]["items"][0]["key"]
        return category_key, first_item

    indicator_key = triggered["index"]
    return ITEM_TO_CATEGORY.get(indicator_key, active_category), indicator_key
