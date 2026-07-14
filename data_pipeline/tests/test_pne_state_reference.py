import sys
import unittest
from pathlib import Path

import pandas as pd


DATA_PIPELINE_DIR = Path(__file__).resolve().parents[1]
if str(DATA_PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(DATA_PIPELINE_DIR))

from src.pne_state_reference import (  # noqa: E402
    COMPARABLE,
    _build_census_records,
    _build_escolas_integral_records,
    aggregate_ratio_of_sums,
    build_state_projections,
)


class StateReferenceTests(unittest.TestCase):
    def test_uses_ratio_of_sums_instead_of_mean_municipal_percentages(self):
        frame = pd.DataFrame(
            [
                {"ano": 2025, "municipio": "A", "numerador": 1, "denominador": 2},
                {"ano": 2025, "municipio": "B", "numerador": 9, "denominador": 100},
            ]
        )

        record = aggregate_ratio_of_sums(
            frame,
            "numerador",
            "denominador",
            indicator_id="teste",
            municipalities_expected=2,
        )[0]

        self.assertAlmostEqual(record["value"], 100 * 10 / 102)
        self.assertNotAlmostEqual(record["value"], (50 + 9) / 2)
        self.assertEqual(record["numerator"], 10)
        self.assertEqual(record["denominator"], 102)

    def test_excludes_missing_pairs_and_keeps_zero_denominator_null(self):
        frame = pd.DataFrame(
            [
                {"ano": 2025, "municipio": "A", "numerador": 1, "denominador": 0},
                {"ano": 2025, "municipio": "B", "numerador": None, "denominador": 2},
                {"ano": 2025, "municipio": "C", "numerador": 3, "denominador": 3},
            ]
        )

        record = aggregate_ratio_of_sums(
            frame,
            "numerador",
            "denominador",
            indicator_id="teste",
            municipalities_expected=3,
        )[0]

        self.assertEqual(record["numerator"], 4)
        self.assertEqual(record["denominator"], 3)
        self.assertEqual(record["municipalities_valid"], 2)
        self.assertAlmostEqual(record["value"], 100 * 4 / 3)

        zero_frame = pd.DataFrame(
            [{"ano": 2025, "municipio": "A", "numerador": 0, "denominador": 0}]
        )
        zero_record = aggregate_ratio_of_sums(
            zero_frame,
            "numerador",
            "denominador",
            indicator_id="teste",
            municipalities_expected=1,
        )[0]
        self.assertIsNone(zero_record["value"])

    def test_denominator_coverage_is_not_municipality_coverage(self):
        frame = pd.DataFrame(
            [
                {
                    "ano": 2025,
                    "municipio": "A",
                    "numerador": 1,
                    "denominador": 2,
                    "universo_denominador": 10,
                },
                {
                    "ano": 2025,
                    "municipio": "B",
                    "numerador": 1,
                    "denominador": 2,
                    "universo_denominador": 20,
                },
            ]
        )

        record = aggregate_ratio_of_sums(
            frame,
            "numerador",
            "denominador",
            indicator_id="teste",
            denominator_universe_column="universo_denominador",
            municipalities_expected=497,
        )[0]

        self.assertEqual(record["municipal_coverage_percent"], 200 / 497)
        self.assertAlmostEqual(record["denominator_coverage_percent"], 100 * 4 / 30)

    def test_state_value_is_not_rounded_before_presentation(self):
        frame = pd.DataFrame(
            [{"ano": 2025, "municipio": "A", "numerador": 1, "denominador": 3}]
        )
        record = aggregate_ratio_of_sums(
            frame,
            "numerador",
            "denominador",
            indicator_id="teste",
            municipalities_expected=1,
        )[0]
        self.assertAlmostEqual(record["value"], 100 / 3)
        self.assertNotEqual(record["value"], round(100 / 3))

    def test_integral_school_threshold_is_classified_before_state_sum(self):
        frame = pd.DataFrame(
            [
                {
                    "ano": 2025,
                    "municipio": "A",
                    "dependencia": "municipal",
                    "mat_basico": 100,
                    "mat_basico_integral": 25,
                },
                {
                    "ano": 2025,
                    "municipio": "B",
                    "dependencia": "estadual",
                    "mat_basico": 100,
                    "mat_basico_integral": 0,
                },
            ]
        )
        record = _build_escolas_integral_records(
            frame, municipalities_expected=2
        )[0]
        self.assertEqual(record["numerator"], 1)
        self.assertEqual(record["denominator"], 2)
        self.assertEqual(record["value"], 50)

    def test_census_keeps_only_2010_and_2022(self):
        frame = pd.DataFrame(
            [
                {"ano": 2010, "municipio": "A", "num": 8, "den": 10},
                {"ano": 2021, "municipio": "A", "num": 9, "den": 10},
                {"ano": 2022, "municipio": "A", "num": 9, "den": 10},
            ]
        )
        records = _build_census_records(
            frame,
            indicator_id="teste_censo",
            config={"numerator_column": "num", "denominator_column": "den"},
            municipalities_expected=1,
        )
        self.assertEqual([record["year"] for record in records], [2010, 2022])

    def test_state_projection_declares_aggregate_series_source(self):
        projections = build_state_projections(
            {
                "teste": {
                    "series": [
                        {"year": 2024, "numerator": 10, "denominator": 100, "value": 10},
                        {"year": 2025, "numerator": 20, "denominator": 100, "value": 20},
                    ]
                }
            },
            start_year=2026,
            end_year=2026,
        )
        projection = projections["teste"]
        self.assertEqual(projection["method"], "aggregate_state_series_forecast")
        self.assertIn("sem média municipal", projection["source"])
        self.assertEqual(projection["series"][0]["year"], 2026)
        self.assertEqual(projection["series"][0]["numerator"], 30)

    def test_percentages_with_valid_count_pairs_are_bounded(self):
        frame = pd.DataFrame(
            [
                {"ano": 2025, "municipio": "A", "numerador": 7, "denominador": 10},
                {"ano": 2025, "municipio": "B", "numerador": 8, "denominador": 10},
            ]
        )
        record = aggregate_ratio_of_sums(
            frame,
            "numerador",
            "denominador",
            indicator_id="teste",
            municipalities_expected=2,
        )[0]
        self.assertGreaterEqual(record["value"], 0)
        self.assertLessEqual(record["value"], 100)
        self.assertLessEqual(record["numerator"], record["denominator"])
        self.assertEqual(record["comparison_status"], COMPARABLE)


if __name__ == "__main__":
    unittest.main()
