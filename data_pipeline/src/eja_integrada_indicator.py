"""Cálculo e validação do percentual de EJA articulada à educação profissional."""

from __future__ import annotations

import pandas as pd


NUMERATOR_COLUMNS = (
    "mat_eja_curso_tecnico_integrada",
    "mat_eja_fic_integrado_fundamental",
    "mat_eja_fic_integrado_medio",
)
DENOMINATOR_COLUMNS = (
    "mat_eja_fundamental_total",
    "mat_eja_medio_total",
)
DEPENDENCIES = ("federal", "estadual", "municipal", "privada")


class EjaIndicatorValidationError(ValueError):
    """Impede a exportação de uma linha semanticamente inválida."""


def _numeric(frame: pd.DataFrame, columns: tuple[str, ...]) -> pd.DataFrame:
    result = frame.copy()
    for column in columns:
        if column not in result.columns:
            result[column] = pd.NA
        result[column] = pd.to_numeric(result[column], errors="coerce")
    return result


def calculate_eja_integrada_series(frame: pd.DataFrame) -> pd.DataFrame:
    """Retorna componentes e percentual sem transformar ausência em zero.

    A entrada deve conter uma linha por ano e município. Linhas com qualquer
    componente ausente ou denominador zero permanecem auditáveis, mas recebem
    ``percentual_calculado = NA``.
    """

    required_identity = {"ano", "id_municipio"}
    missing_identity = required_identity - set(frame.columns)
    if missing_identity:
        raise EjaIndicatorValidationError(
            f"Campos de identidade ausentes: {sorted(missing_identity)}."
        )

    result = _numeric(
        frame,
        NUMERATOR_COLUMNS
        + DENOMINATOR_COLUMNS
        + (
            "mat_eja_total",
            "mat_eja_integrada_educacao_profissional",
            "percentual_eja_integrada_educacao_profissional",
        ),
    )
    result["ano"] = pd.to_numeric(result["ano"], errors="coerce")
    result["id_municipio"] = result["id_municipio"].astype("string")

    duplicate_mask = result.duplicated(["ano", "id_municipio"], keep=False)
    if duplicate_mask.any():
        examples = result.loc[duplicate_mask, ["ano", "id_municipio"]].head(10)
        raise EjaIndicatorValidationError(
            f"Pares ano + código IBGE duplicados: {examples.to_dict('records')}."
        )

    component_columns = NUMERATOR_COLUMNS + DENOMINATOR_COLUMNS
    negative_mask = result[list(component_columns)].lt(0).any(axis=1)
    if negative_mask.any():
        raise EjaIndicatorValidationError("Há componentes negativos no indicador de EJA.")

    result["numerador_calculado"] = result[list(NUMERATOR_COLUMNS)].sum(
        axis=1, min_count=len(NUMERATOR_COLUMNS)
    )
    denominator_from_components = result[list(DENOMINATOR_COLUMNS)].sum(
        axis=1, min_count=len(DENOMINATOR_COLUMNS)
    )
    result["denominador_calculado"] = denominator_from_components
    result["fonte_denominador"] = (
        "mat_eja_fundamental_total + mat_eja_medio_total"
    )

    numerator_gt_denominator = (
        result["numerador_calculado"].notna()
        & result["denominador_calculado"].notna()
        & (result["numerador_calculado"] > result["denominador_calculado"])
    )
    if numerator_gt_denominator.any():
        examples = result.loc[
            numerator_gt_denominator,
            ["ano", "id_municipio", "numerador_calculado", "denominador_calculado"],
        ].head(10)
        raise EjaIndicatorValidationError(
            "Numerador maior que denominador: " f"{examples.to_dict('records')}."
        )

    total_mismatch = (
        result["mat_eja_total"].notna()
        & result[list(DENOMINATOR_COLUMNS)].notna().all(axis=1)
        & (result["mat_eja_total"] != denominator_from_components)
    )
    if total_mismatch.any():
        raise EjaIndicatorValidationError(
            "Total da EJA incompatível com EJA fundamental + EJA médio."
        )

    result["percentual_calculado"] = result["numerador_calculado"].div(
        result["denominador_calculado"].where(result["denominador_calculado"] > 0)
    ).mul(100.0)
    outside_range = result["percentual_calculado"].notna() & ~result[
        "percentual_calculado"
    ].between(0, 100, inclusive="both")
    if outside_range.any():
        raise EjaIndicatorValidationError("Percentual calculado fora de 0% a 100%.")

    result["contagem_armazenada_diverge"] = (
        result["mat_eja_integrada_educacao_profissional"].notna()
        & result["numerador_calculado"].notna()
        & (
            result["mat_eja_integrada_educacao_profissional"]
            != result["numerador_calculado"]
        )
    )
    result["percentual_armazenado_diverge"] = (
        result["percentual_eja_integrada_educacao_profissional"].notna()
        & result["percentual_calculado"].notna()
        & (
            (
                result["percentual_eja_integrada_educacao_profissional"]
                - result["percentual_calculado"]
            ).abs()
            > 0.051
        )
    )
    return result.sort_values(["ano", "id_municipio"]).reset_index(drop=True)


def validate_dependency_totals(frame: pd.DataFrame) -> None:
    """Confere os totais oficiais sem re-somá-los para o cálculo do indicador."""

    total_prefixes = NUMERATOR_COLUMNS + DENOMINATOR_COLUMNS
    for prefix in total_prefixes:
        dependency_prefix = (
            prefix.removesuffix("_total")
            if prefix in DENOMINATOR_COLUMNS
            else prefix
        )
        dependency_columns = tuple(
            f"{dependency_prefix}_{dependency}" for dependency in DEPENDENCIES
        )
        if not set(dependency_columns).issubset(frame.columns):
            raise EjaIndicatorValidationError(
                f"Dependências ausentes para validar {prefix}."
            )
        values = _numeric(frame, (prefix,) + dependency_columns)
        dependency_sum = values[list(dependency_columns)].sum(
            axis=1, min_count=len(dependency_columns)
        )
        mismatch = values[prefix].notna() & dependency_sum.notna() & (
            values[prefix] != dependency_sum
        )
        if mismatch.any():
            raise EjaIndicatorValidationError(
                f"Total incompatível com dependências administrativas em {prefix}."
            )
