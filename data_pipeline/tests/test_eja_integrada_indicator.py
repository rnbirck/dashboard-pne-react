import unittest
import sys
from pathlib import Path

import pandas as pd


DATA_PIPELINE_DIR = Path(__file__).resolve().parents[1]
if str(DATA_PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(DATA_PIPELINE_DIR))

from src.eja_integrada_indicator import (
    EjaIndicatorValidationError,
    calculate_eja_integrada_series,
    validate_dependency_totals,
)
from src.pne.common import _build_eja_integrada_percentual_result


def row(**overrides):
    base = {
        "ano": 2025,
        "id_municipio": "4300000",
        "mat_eja_fundamental_total": 40,
        "mat_eja_medio_total": 60,
        "mat_eja_total": 100,
        "mat_eja_curso_tecnico_integrada": 0,
        "mat_eja_fic_integrado_fundamental": 0,
        "mat_eja_fic_integrado_medio": 0,
        "mat_eja_integrada_educacao_profissional": 0,
        "percentual_eja_integrada_educacao_profissional": 0,
    }
    base.update(overrides)
    return base


class EjaIntegradaIndicatorTest(unittest.TestCase):
    def test_municipality_without_eja_is_unavailable_not_zero(self):
        result = calculate_eja_integrada_series(
            pd.DataFrame(
                [
                    row(
                        mat_eja_fundamental_total=0,
                        mat_eja_medio_total=0,
                        mat_eja_total=0,
                    )
                ]
            )
        )
        self.assertTrue(pd.isna(result.iloc[0]["percentual_calculado"]))

    def test_eja_without_integration_is_valid_zero(self):
        result = calculate_eja_integrada_series(pd.DataFrame([row()]))
        self.assertEqual(result.iloc[0]["percentual_calculado"], 0.0)

    def test_eja_with_integration_is_recalculated_from_components(self):
        result = calculate_eja_integrada_series(
            pd.DataFrame(
                [
                    row(
                        mat_eja_curso_tecnico_integrada=5,
                        mat_eja_fic_integrado_fundamental=10,
                        mat_eja_fic_integrado_medio=5,
                        mat_eja_integrada_educacao_profissional=999,
                        percentual_eja_integrada_educacao_profissional=999,
                    )
                ]
            )
        )
        self.assertEqual(result.iloc[0]["numerador_calculado"], 20)
        self.assertEqual(result.iloc[0]["percentual_calculado"], 20.0)
        self.assertTrue(result.iloc[0]["contagem_armazenada_diverge"])
        self.assertTrue(result.iloc[0]["percentual_armazenado_diverge"])

    def test_missing_component_is_unavailable_not_zero(self):
        result = calculate_eja_integrada_series(
            pd.DataFrame([row(mat_eja_fic_integrado_medio=None)])
        )
        self.assertTrue(pd.isna(result.iloc[0]["percentual_calculado"]))

    def test_total_eja_must_reconcile_with_stage_totals(self):
        with self.assertRaises(EjaIndicatorValidationError):
            calculate_eja_integrada_series(pd.DataFrame([row(mat_eja_total=99)]))

    def test_stage_total_must_reconcile_with_dependencies(self):
        record = row()
        for prefix, values in {
            "mat_eja_fundamental": (0, 10, 20, 10),
            "mat_eja_medio": (0, 20, 20, 20),
            "mat_eja_curso_tecnico_integrada": (0, 0, 0, 0),
            "mat_eja_fic_integrado_fundamental": (0, 0, 0, 0),
            "mat_eja_fic_integrado_medio": (0, 0, 0, 0),
        }.items():
            for dependency, value in zip(
                ("federal", "estadual", "municipal", "privada"), values
            ):
                record[f"{prefix}_{dependency}"] = value
        record["mat_eja_fundamental_municipal"] = 19
        with self.assertRaises(EjaIndicatorValidationError):
            validate_dependency_totals(pd.DataFrame([record]))

    def test_numerator_greater_than_denominator_blocks_export(self):
        with self.assertRaises(EjaIndicatorValidationError):
            calculate_eja_integrada_series(
                pd.DataFrame([row(mat_eja_curso_tecnico_integrada=101)])
            )

    def test_duplicate_year_and_ibge_code_blocks_export(self):
        with self.assertRaises(EjaIndicatorValidationError):
            calculate_eja_integrada_series(pd.DataFrame([row(), row()]))

    def test_closed_cycle_does_not_fall_forward_to_2025(self):
        source = pd.DataFrame([row(municipio="Município teste")])
        result = _build_eja_integrada_percentual_result(
            lambda: source,
            "Município teste",
            meta=25.0,
            meta_label="Meta PNE 2024",
            target_start_year=2014,
            target_end_year=2024,
        )
        self.assertFalse(result["available"])


if __name__ == "__main__":
    unittest.main()
