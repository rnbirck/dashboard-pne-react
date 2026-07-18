import json
import math
import sys
import unittest
from pathlib import Path


PIPELINE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PIPELINE_ROOT.parent
if str(PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_ROOT))

from scripts.backtest_pne_projections_v2 import _safe_output_root
from src.projections_v2 import (
    ABSOLUTE_COUNT_MODELS,
    ABSOLUTE_MODEL_LAST_VALUE,
    ABSOLUTE_MODEL_LINEAR_FULL,
    ABSOLUTE_MODEL_THEIL_SEN_LAST5,
    AbsoluteCountObservation,
    AbsoluteCountProjectionStrategy,
    MODEL_LAST_COMPONENTS,
    MODEL_LAST_PERCENTAGE,
    MODEL_THEIL_SEN_COMPONENTS_FULL,
    MODEL_THEIL_SEN_COMPONENTS_LAST5,
    RatioObservation,
    RatioOfCountsProjectionStrategy,
    build_projection_contract,
    coerce_observations,
    temporal_backtest,
)


def rows(count=6, start=2015, numerator=20, denominator=100):
    return [
        {"year": start + index, "numerator": numerator + index, "denominator": denominator + index}
        for index in range(count)
    ]


class RatioOfCountsValidationTests(unittest.TestCase):
    def test_zero_denominator_is_unavailable_not_zero_percent(self):
        valid, violations, _ = coerce_observations(
            [{"year": 2025, "numerator": 0, "denominator": 0}]
        )
        self.assertEqual(valid, [])
        self.assertEqual(violations[0]["type"], "nonpositive_observed_denominator")

    def test_negative_denominator_is_unavailable(self):
        valid, violations, _ = coerce_observations(
            [{"year": 2025, "numerator": 2, "denominator": -1}]
        )
        self.assertFalse(valid)
        self.assertEqual(violations[0]["denominator"], -1)

    def test_null_components_are_missing_not_zero(self):
        for row in (
            {"year": 2025, "numerator": None, "denominator": 10},
            {"year": 2025, "numerator": 1, "denominator": None},
        ):
            valid, _, warnings = coerce_observations([row])
            self.assertFalse(valid)
            self.assertIn("missing_component:2025", warnings)

    def test_nonfinite_components_are_missing(self):
        valid, _, warnings = coerce_observations(
            [{"year": 2025, "numerator": math.nan, "denominator": 10}]
        )
        self.assertFalse(valid)
        self.assertIn("missing_component:2025", warnings)

    def test_numerator_above_denominator_is_preserved_and_flagged(self):
        valid, violations, _ = coerce_observations(
            [{"year": 2025, "numerator": 12, "denominator": 10}]
        )
        self.assertEqual(valid[0].value, 120)
        self.assertEqual(violations[0]["rawValue"], 120)

    def test_negative_model_count_is_preserved_then_explicitly_bounded(self):
        observations = [RatioObservation(year, 10 - 4 * index, 100) for index, year in enumerate(range(2019, 2024))]
        point = RatioOfCountsProjectionStrategy().project(
            observations, 2030, MODEL_THEIL_SEN_COMPONENTS_FULL
        )
        self.assertLess(point["rawNumerator"], 0)
        self.assertEqual(point["numerator"], 0)
        self.assertEqual(point["limitsApplied"][0]["rule"], "nonnegative_count")

    def test_percentage_above_100_is_not_truncated(self):
        observations = [RatioObservation(2025, 120, 100)]
        point = RatioOfCountsProjectionStrategy().project(
            observations, 2026, MODEL_LAST_COMPONENTS
        )
        self.assertEqual(point["rawValue"], 120)
        self.assertEqual(point["displayValue"], 120)
        self.assertEqual(point["status"], "available_with_warning")


class AbsoluteCountScenarioTests(unittest.TestCase):
    def test_supports_all_required_benchmark_models(self):
        self.assertEqual(
            set(ABSOLUTE_COUNT_MODELS),
            {
                "last_value",
                "theil_sen_full",
                "theil_sen_last5",
                "linear_full",
                "linear_last5",
            },
        )

    def test_preserves_raw_negative_and_applies_nonnegative_limit(self):
        observations = [
            AbsoluteCountObservation(year, 20 - index * 5)
            for index, year in enumerate(range(2019, 2024))
        ]
        point = AbsoluteCountProjectionStrategy().project(
            observations, 2030, ABSOLUTE_MODEL_LINEAR_FULL
        )
        self.assertLess(point["rawValue"], 0)
        self.assertEqual(point["value"], 0)
        self.assertEqual(point["limitsApplied"][0]["rule"], "nonnegative_count")

    def test_constant_and_zero_series_remain_valid(self):
        strategy = AbsoluteCountProjectionStrategy()
        zeroes = [AbsoluteCountObservation(year, 0) for year in range(2019, 2024)]
        constant = [AbsoluteCountObservation(year, 12) for year in range(2019, 2024)]
        self.assertEqual(
            strategy.project(zeroes, 2036, ABSOLUTE_MODEL_LAST_VALUE)["value"], 0
        )
        self.assertEqual(
            strategy.project(constant, 2036, ABSOLUTE_MODEL_THEIL_SEN_LAST5)["value"], 12
        )


class RatioOfCountsContractTests(unittest.TestCase):
    def build(self, **overrides):
        options = {
            "indicator_key": "basico_integral",
            "municipality": "Município Teste",
            "rows": rows(),
            "targets": ({"year": 2031, "value": 35}, {"year": 2036, "value": 50}),
            "direction": "at_least",
            "model": MODEL_LAST_COMPONENTS,
        }
        options.update(overrides)
        return build_projection_contract(**options)

    def test_exactly_five_points_are_sufficient(self):
        contract = self.build(rows=rows(5))
        self.assertNotEqual(contract["status"], "insufficient_data")

    def test_more_than_five_points_are_recorded(self):
        contract = self.build(rows=rows(8))
        self.assertEqual(contract["diagnostics"]["validPointCount"], 8)

    def test_constant_series_is_recognized_without_claiming_trend(self):
        contract = self.build(
            rows=[{"year": year, "numerator": 20, "denominator": 100} for year in range(2020, 2026)]
        )
        self.assertTrue(contract["diagnostics"]["constantSeries"])
        self.assertEqual({point["rawValue"] for point in contract["projected"]}, {20})

    def test_intermediate_gap_is_not_interpolated(self):
        data = rows(6)
        del data[2]
        contract = self.build(rows=data)
        self.assertEqual(contract["diagnostics"]["missingYearCount"], 1)
        self.assertEqual(contract["diagnostics"]["longestGap"], 1)
        self.assertEqual(len(contract["historical"]), 5)

    def test_missing_latest_year_is_reported(self):
        contract = self.build(rows=rows(5, start=2020))
        self.assertEqual(contract["diagnostics"]["latestDataGap"], 1)
        self.assertIn("latest_year_missing", contract["diagnostics"]["warnings"])

    def test_both_directions_are_contract_configuration_only(self):
        increasing = self.build(direction="at_least")
        decreasing = self.build(direction="at_most", indicator_key="temporarios")
        self.assertEqual(increasing["projected"], decreasing["projected"])
        self.assertEqual(decreasing["direction"], "at_most")

    def test_multiple_and_single_reference_years(self):
        multiple = self.build()
        only_2031 = self.build(targets=({"year": 2031, "value": 30},))
        only_2036 = self.build(targets=({"year": 2036, "value": 70},))
        self.assertEqual(len(multiple["targets"]), 2)
        self.assertEqual(only_2031["targets"][0]["year"], 2031)
        self.assertEqual(only_2036["targets"][0]["year"], 2036)
        self.assertTrue(all(item["type"] == "configured_reference" for item in multiple["targets"]))
        self.assertEqual(multiple["targetValidationStatus"], "configured_unvalidated")

    def test_municipality_without_data_is_insufficient(self):
        contract = self.build(rows=[])
        self.assertEqual(contract["status"], "insufficient_data")
        self.assertIsNone(contract["summary"]["latestObservedValue"])

    def test_baseline_and_theil_sen_components(self):
        observations = [RatioObservation(**{"year": item["year"], "numerator": item["numerator"], "denominator": item["denominator"]}) for item in rows()]
        strategy = RatioOfCountsProjectionStrategy()
        baseline = strategy.project(observations, 2026, MODEL_LAST_COMPONENTS)
        full = strategy.project(observations, 2026, MODEL_THEIL_SEN_COMPONENTS_FULL)
        last_five = strategy.project(observations, 2026, MODEL_THEIL_SEN_COMPONENTS_LAST5)
        self.assertEqual(baseline["numerator"], observations[-1].numerator)
        self.assertGreater(full["numerator"], baseline["numerator"])
        self.assertIsNotNone(last_five["denominator"])

    def test_serialization_and_determinism(self):
        first = self.build()
        second = self.build()
        self.assertEqual(first, second)
        encoded = json.dumps(first, ensure_ascii=False, allow_nan=False)
        self.assertEqual(json.loads(encoded)["strategy"], "ratio_of_counts")


class ProjectionBacktestTests(unittest.TestCase):
    def test_temporal_backtest_has_no_future_leakage(self):
        base = [RatioObservation(year, 10 + year - 2015, 100) for year in range(2015, 2021)]
        with_future_outlier = base + [RatioObservation(2025, 10000, 100)]
        kwargs = {
            "indicator_key": "test",
            "municipality": "A",
            "models": (MODEL_THEIL_SEN_COMPONENTS_FULL,),
            "origins": (2019,),
            "horizons": (1,),
        }
        first = temporal_backtest(observations=base, **kwargs)
        second = temporal_backtest(observations=with_future_outlier, **kwargs)
        self.assertEqual(first, second)
        self.assertEqual(first[0].target_year, 2020)

    def test_last_percentage_is_benchmark_only_and_deterministic(self):
        observations = [RatioObservation(year, 10 + index, 100) for index, year in enumerate(range(2015, 2021))]
        result = temporal_backtest(
            indicator_key="test", municipality="A", observations=observations,
            models=(MODEL_LAST_PERCENTAGE,), origins=(2019,), horizons=(1,),
        )
        self.assertEqual(result[0].predicted_value, observations[-2].value)


class ShadowModeRegressionTests(unittest.TestCase):
    def test_public_data_output_is_rejected(self):
        with self.assertRaises(ValueError):
            _safe_output_root(REPO_ROOT / "public" / "data" / "experimental")

    def test_frontend_catalog_still_contains_only_current_four(self):
        source = (REPO_ROOT / "src" / "data" / "educationIndicatorCatalog.js").read_text(encoding="utf-8")
        catalog = source.split("EDUCATION_DEMAND_INDICATOR_CATALOG", 1)[1].split("])", 1)[0]
        keys = {key for key in ("creche", "pre_escola", "basico_6_17", "basico_15_17") if f"key: '{key}'" in catalog}
        self.assertEqual(keys, {"creche", "pre_escola", "basico_6_17", "basico_15_17"})
        for candidate in ("basico_integral", "escolas_integral", "pos_graduacao", "temporarios"):
            self.assertNotIn(f"key: '{candidate}'", catalog)

    def test_public_municipal_projection_payload_contains_age_contract_inputs(self):
        sample = next((REPO_ROOT / "public" / "data" / "municipios").glob("*/index.json"))
        payload = json.loads(sample.read_text(encoding="utf-8"))
        self.assertEqual(
            set(payload["pne_2026_2036"]["projecoes"]),
            {
                "creche",
                "pre_escola",
                "basico_6_17",
                "basico_15_17",
                "infantil_0_5",
                "obrigatoria_4_17",
                "escolar_6_14",
            },
        )

    def test_generated_manifest_proves_public_payload_unchanged(self):
        manifest = REPO_ROOT / "artifacts" / "projections-v2" / "run-manifest.json"
        if not manifest.exists():
            self.skipTest("shadow artifacts have not been generated yet")
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        self.assertEqual(
            payload["inputs"]["publicProjectionHashBefore"],
            payload["inputs"]["publicProjectionHashAfter"],
        )
        self.assertTrue(payload["regression"]["publicProjectionKeysRemainCurrentFour"])


if __name__ == "__main__":
    unittest.main()
