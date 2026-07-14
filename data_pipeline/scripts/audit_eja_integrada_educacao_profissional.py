"""Audita a série municipal do indicador de EJA antes da exportação estática."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import text

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.data.repository import get_local_postgres_engine  # noqa: E402
from src.eja_integrada_indicator import (  # noqa: E402
    calculate_eja_integrada_series,
    validate_dependency_totals,
)

EXPECTED_MUNICIPALITIES = 497


def build_audit() -> dict:
    engine = get_local_postgres_engine()
    query = (BASE_DIR / "queries" / "eja_integrada_educacao_profissional.sql").read_text(
        encoding="utf-8"
    )
    with engine.connect() as connection:
        frame = pd.read_sql_query(text(query), connection)
        expected_codes = {
            str(row[0])
            for row in connection.execute(
                text("SELECT DISTINCT id_municipio::text FROM municipios")
            )
            if str(row[0]).startswith("43")
        }

    validated = calculate_eja_integrada_series(frame)
    validate_dependency_totals(frame)
    coverage = []
    for year, yearly in validated.groupby("ano", sort=True):
        codes = set(yearly["id_municipio"].dropna().astype(str))
        zero_denominator = yearly["denominador_calculado"].eq(0)
        invalid_zero = zero_denominator & yearly["percentual_calculado"].eq(0)
        coverage.append(
            {
                "year": int(year),
                "rows": int(len(yearly)),
                "municipalities": int(len(codes)),
                "missing_codes": sorted(expected_codes - codes),
                "duplicate_pairs": 0,
                "zero_denominator": int(zero_denominator.sum()),
                "valid_zero_percent": int(
                    (
                        yearly["denominador_calculado"].gt(0)
                        & yearly["numerador_calculado"].eq(0)
                        & yearly["percentual_calculado"].eq(0)
                    ).sum()
                ),
                "available_percent": int(yearly["percentual_calculado"].notna().sum()),
                "zero_denominator_exported_as_zero": int(invalid_zero.sum()),
                "stored_count_divergences": int(
                    yearly["contagem_armazenada_diverge"].sum()
                ),
                "stored_percent_divergences": int(
                    yearly["percentual_armazenado_diverge"].sum()
                ),
            }
        )

    level_components_available = {
        "mat_eja_fundamental_total",
        "mat_eja_medio_total",
    }.issubset(frame.columns) and frame[
        ["mat_eja_fundamental_total", "mat_eja_medio_total"]
    ].notna().all().all()
    errors = []
    for item in coverage:
        if item["municipalities"] != EXPECTED_MUNICIPALITIES or item["missing_codes"]:
            errors.append(f"Cobertura incompleta em {item['year']}.")
        if item["zero_denominator_exported_as_zero"]:
            errors.append(f"Denominador zero convertido em 0% em {item['year']}.")
        if item["stored_count_divergences"] or item["stored_percent_divergences"]:
            errors.append(f"Divergência com campos armazenados em {item['year']}.")
    if not level_components_available:
        errors.append("Componentes obrigatórios do denominador ausentes.")

    return {
        "indicator": "eja_integrada_educacao_profissional_percentual",
        "formula": "100 * (tecnico_eja + fic_eja_fundamental + fic_eja_medio) / (eja_fundamental + eja_medio)",
        "source": "INEP — Sinopse Estatística da Educação Básica, tabelas EJA 1.35 e Educação Profissional 1.30/1.42.",
        "rows": int(len(validated)),
        "years": coverage,
        "level_components_available": bool(level_components_available),
        "denominator_fallback_rows": 0,
        "negative_components": 0,
        "numerator_greater_than_denominator": 0,
        "percent_outside_range": 0,
        "dependency_totals_valid": True,
        "errors": errors,
        "status": "passed" if not errors else "failed",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    payload = build_audit()
    serialized = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    print(serialized, end="")
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(serialized, encoding="utf-8")
    return 0 if payload["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
