"""Validation and calculation helpers for secondary-level technical EPT.

The monitored indicator uses integrated technical enrolments as its numerator.
Concomitant enrolments and their sum with integrated enrolments remain available
as supporting data and never alter the principal percentage.
"""

from __future__ import annotations

from typing import Iterable

import pandas as pd


REQUIRED_COLUMNS = (
    "ano",
    "id_municipio",
    "mat_integrado_total",
    "mat_medio",
)
DEPENDENCY_COLUMNS = {
    "integrado": {
        "total": "mat_integrado_total",
        "federal": "mat_integrado_federal",
        "estadual": "mat_integrado_estadual",
        "municipal": "mat_integrado_municipal",
        "privada": "mat_integrado_privada",
    },
    "concomitante": {
        "total": "mat_concomitante_total",
        "federal": "mat_concomitante_federal",
        "estadual": "mat_concomitante_estadual",
        "municipal": "mat_concomitante_municipal",
        "privada": "mat_concomitante_privada",
    },
}
NUMERIC_COLUMNS = tuple(
    dict.fromkeys(
        [*REQUIRED_COLUMNS[2:], *[column for mode in DEPENDENCY_COLUMNS.values() for column in mode.values()]]
    )
)


class MedioTecnicoArticuladoValidationError(ValueError):
    """Raised when the curated indicator contract is violated."""


def _coerce_numeric(frame: pd.DataFrame, columns: Iterable[str]) -> pd.DataFrame:
    result = frame.copy()
    for column in columns:
        if column not in result.columns:
            continue
        original = result[column]
        converted = pd.to_numeric(original, errors="coerce")
        unexpected = original.notna() & converted.isna()
        if unexpected.any():
            sample = original.loc[unexpected].iloc[0]
            raise MedioTecnicoArticuladoValidationError(
                f"Valor não numérico em {column}: {sample!r}."
            )
        result[column] = converted
    return result


def validate_dependency_reconciliation(frame: pd.DataFrame) -> None:
    """Validate total = federal + estadual + municipal + privada when present."""

    if frame.empty:
        return

    for mode, columns in DEPENDENCY_COLUMNS.items():
        required = tuple(columns.values())
        if not all(column in frame.columns for column in required):
            continue
        values = frame[list(required)].apply(pd.to_numeric, errors="coerce")
        values = values.rename(columns={column: name for name, column in columns.items()})
        complete = values.notna().all(axis=1)
        if not complete.any():
            continue
        dependency_sum = values.loc[complete, ["federal", "estadual", "municipal", "privada"]].sum(axis=1)
        mismatch = dependency_sum != values.loc[complete, "total"]
        if mismatch.any():
            sample_index = mismatch.index[mismatch][0]
            raise MedioTecnicoArticuladoValidationError(
                f"Reconciliação inconsistente para {mode} na linha {sample_index}."
            )


def calculate_medio_tecnico_articulado_series(frame: pd.DataFrame) -> pd.DataFrame:
    """Return one validated observed row per municipality and year.

    ``mat_medio == 0`` is a valid source observation but has no calculable
    percentage. The resulting ``percentual_calculado`` remains null. A zero
    integrated numerator with a positive denominator remains a valid 0% result.

    ``mat_articulado_total`` and ``percentual_articulado_total`` are supporting
    fields. They are only calculated when the concomitant component is present.
    """

    if not isinstance(frame, pd.DataFrame):
        raise MedioTecnicoArticuladoValidationError("A fonte precisa ser um DataFrame.")

    missing = [column for column in REQUIRED_COLUMNS if column not in frame.columns]
    if missing:
        raise MedioTecnicoArticuladoValidationError(
            f"Colunas obrigatórias ausentes: {', '.join(missing)}."
        )

    result = _coerce_numeric(frame, NUMERIC_COLUMNS)
    result["ano"] = pd.to_numeric(result["ano"], errors="coerce")
    if result["ano"].isna().any():
        raise MedioTecnicoArticuladoValidationError("Ano ausente ou inválido.")
    result["ano"] = result["ano"].astype(int)
    result["id_municipio"] = result["id_municipio"].astype("string").str.strip()
    if result["id_municipio"].isna().any() or (result["id_municipio"] == "").any():
        raise MedioTecnicoArticuladoValidationError("Código IBGE ausente.")

    if result.duplicated(subset=["ano", "id_municipio"]).any():
        raise MedioTecnicoArticuladoValidationError(
            "Há mais de uma linha para o mesmo ano e código IBGE."
        )

    for column in NUMERIC_COLUMNS:
        if column not in result.columns:
            continue
        negative = result[column].notna() & (result[column] < 0)
        if negative.any():
            raise MedioTecnicoArticuladoValidationError(
                f"Valor negativo em {column}; a carga foi rejeitada."
            )

    validate_dependency_reconciliation(result)

    result["mat_articulado_total"] = result[
        ["mat_integrado_total", "mat_concomitante_total"]
    ].sum(axis=1, min_count=2)
    valid_denominator = result["mat_medio"] > 0
    valid_ratio = valid_denominator & result["mat_integrado_total"].notna()
    result["percentual_calculado"] = pd.NA
    result.loc[valid_ratio, "percentual_calculado"] = (
        100.0
        * result.loc[valid_ratio, "mat_integrado_total"]
        / result.loc[valid_ratio, "mat_medio"]
    )
    result["percentual_calculado"] = pd.to_numeric(
        result["percentual_calculado"], errors="coerce"
    )
    valid_articulated_ratio = valid_denominator & result["mat_articulado_total"].notna()
    result["percentual_articulado_total"] = pd.NA
    result.loc[valid_articulated_ratio, "percentual_articulado_total"] = (
        100.0
        * result.loc[valid_articulated_ratio, "mat_articulado_total"]
        / result.loc[valid_articulated_ratio, "mat_medio"]
    )
    result["percentual_articulado_total"] = pd.to_numeric(
        result["percentual_articulado_total"], errors="coerce"
    )
    result["acima_de_100"] = result["percentual_calculado"] > 100.0
    result["articulado_acima_de_100"] = result["percentual_articulado_total"] > 100.0
    return result.sort_values(["id_municipio", "ano"]).reset_index(drop=True)


__all__ = [
    "DEPENDENCY_COLUMNS",
    "MedioTecnicoArticuladoValidationError",
    "calculate_medio_tecnico_articulado_series",
    "validate_dependency_reconciliation",
]
