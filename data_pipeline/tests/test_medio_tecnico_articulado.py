import sys
import unittest
from pathlib import Path

import pandas as pd


DATA_PIPELINE_DIR = Path(__file__).resolve().parents[1]
if str(DATA_PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(DATA_PIPELINE_DIR))

from src.medio_tecnico_articulado import (  # noqa: E402
    MedioTecnicoArticuladoValidationError,
    calculate_medio_tecnico_articulado_series,
)
from src.views.pne_shared import _build_result, _select_reference_rows  # noqa: E402


def row(**overrides):
    values = {
        "ano": 2025,
        "id_municipio": "4300001",
        "mat_integrado_total": 10,
        "mat_concomitante_total": 0,
        "mat_medio": 100,
    }
    values.update(overrides)
    return values


class MedioTecnicoArticuladoTests(unittest.TestCase):
    def test_zero_component_is_valid_and_missing_is_not_zero(self):
        frame = pd.DataFrame(
            [
                row(id_municipio="4300001", mat_integrado_total=0, mat_concomitante_total=0),
                row(id_municipio="4300002", mat_integrado_total=None),
                row(id_municipio="4300003", mat_medio=0),
            ]
        )

        result = calculate_medio_tecnico_articulado_series(frame)

        zero = result[result["id_municipio"] == "4300001"].iloc[0]
        missing = result[result["id_municipio"] == "4300002"].iloc[0]
        zero_denominator = result[result["id_municipio"] == "4300003"].iloc[0]
        self.assertEqual(zero["mat_articulado_total"], 0)
        self.assertEqual(zero["percentual_calculado"], 0)
        self.assertFalse(zero["acima_de_100"])
        self.assertTrue(pd.isna(missing["mat_articulado_total"]))
        self.assertTrue(pd.isna(missing["percentual_calculado"]))
        self.assertTrue(pd.isna(zero_denominator["percentual_calculado"]))

    def test_principal_percentage_uses_only_integrated_enrolments(self):
        result = calculate_medio_tecnico_articulado_series(
            pd.DataFrame(
                [row(mat_integrado_total=20, mat_concomitante_total=30, mat_medio=100)]
            )
        )

        point = result.iloc[0]
        self.assertEqual(point["mat_articulado_total"], 50)
        self.assertAlmostEqual(point["percentual_calculado"], 20.0)
        self.assertAlmostEqual(point["percentual_articulado_total"], 50.0)

    def test_above_one_hundred_is_preserved(self):
        result = calculate_medio_tecnico_articulado_series(
            pd.DataFrame([row(mat_integrado_total=110, mat_concomitante_total=10, mat_medio=100)])
        )
        point = result.iloc[0]
        self.assertAlmostEqual(point["percentual_calculado"], 110.0)
        self.assertAlmostEqual(point["percentual_articulado_total"], 120.0)
        self.assertTrue(point["acima_de_100"])

    def test_missing_concomitant_does_not_hide_principal_percentage(self):
        result = calculate_medio_tecnico_articulado_series(
            pd.DataFrame([row(mat_integrado_total=25, mat_concomitante_total=None, mat_medio=100)])
        )

        point = result.iloc[0]
        self.assertAlmostEqual(point["percentual_calculado"], 25.0)
        self.assertTrue(pd.isna(point["mat_articulado_total"]))
        self.assertTrue(pd.isna(point["percentual_articulado_total"]))

    def test_negative_and_duplicate_rows_are_rejected(self):
        with self.assertRaises(MedioTecnicoArticuladoValidationError):
            calculate_medio_tecnico_articulado_series(
                pd.DataFrame([row(mat_concomitante_total=-1)])
            )

        with self.assertRaises(MedioTecnicoArticuladoValidationError):
            calculate_medio_tecnico_articulado_series(
                pd.DataFrame([row(), row()])
            )

    def test_dependency_totals_reconcile_without_being_resummed(self):
        result = calculate_medio_tecnico_articulado_series(
            pd.DataFrame(
                [
                    row(
                        mat_integrado_total=10,
                        mat_concomitante_total=20,
                        mat_integrado_federal=1,
                        mat_integrado_estadual=2,
                        mat_integrado_municipal=3,
                        mat_integrado_privada=4,
                        mat_concomitante_federal=5,
                        mat_concomitante_estadual=5,
                        mat_concomitante_municipal=5,
                        mat_concomitante_privada=5,
                    )
                ]
            )
        )
        self.assertEqual(result.iloc[0]["mat_articulado_total"], 30)

    def test_closed_cycle_reference_never_falls_forward_to_2025(self):
        series = pd.DataFrame(
            [
                {"ano": 2014, "valor": 10},
                {"ano": 2025, "valor": 20},
            ]
        )
        start, end = _select_reference_rows(series, 2014, 2024)
        self.assertEqual(int(start["ano"]), 2014)
        self.assertEqual(int(end["ano"]), 2014)

        result = _build_result(
            series,
            50,
            target_start_year=2014,
            target_end_year=2024,
        )
        self.assertEqual(result["end_year"], 2014)
        self.assertNotEqual(result["end_year"], 2025)


if __name__ == "__main__":
    unittest.main()
