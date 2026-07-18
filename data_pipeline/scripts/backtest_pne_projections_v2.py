"""Run the reproducible projection-engine-v2 shadow experiment.

Outputs are intentionally restricted to ``artifacts/projections-v2`` (or an
explicit directory outside ``public/data``).  Nothing in the public export
pipeline imports this script or the experimental engine.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from statistics import median
from typing import Any, Iterable

import pandas as pd


PIPELINE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PIPELINE_ROOT.parent
if str(PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_ROOT))

from src.data_loader import (  # noqa: E402
    load_basico_15_17_data,
    load_basico_6_17_data,
    load_basico_integral_data,
    load_docentes_pos_graduacao_data,
    load_docentes_temporarios_data,
    load_escolas_integral_data,
    load_pne_data,
    load_pre_escola_data,
)
from src.projections_v2 import (  # noqa: E402
    COMPONENT_MODELS,
    MODEL_LAST_COMPONENTS,
    MODEL_LAST_PERCENTAGE,
    MODEL_THEIL_SEN_COMPONENTS_FULL,
    MODEL_THEIL_SEN_COMPONENTS_LAST5,
    MODEL_THEIL_SEN_PERCENTAGE,
    MODELS,
    BacktestResult,
    RatioObservation,
    RatioOfCountsProjectionStrategy,
    build_diagnostics,
    build_projection_contract,
    coerce_observations,
    summarize_backtest,
    temporal_backtest,
)
from src.views.pne_2026_projections import (  # noqa: E402
    build_rs_population_by_age_group,
    load_rs_population_projection,
)


EXPERIMENT_VERSION = "projection-engine-v2-shadow-1"
ORIGINS = tuple(range(2019, 2025))
HORIZONS = (1, 3, 5)
SOURCE_START_YEAR = 2015
SOURCE_END_YEAR = 2025
PROJECTION_YEARS = tuple(range(2026, 2037))


@dataclass(frozen=True)
class IndicatorSpec:
    key: str
    loader: Any
    numerator: str
    denominator: str
    direction: str
    targets: tuple[dict[str, float | int], ...]
    filters: tuple[tuple[str, str], ...] = ()
    denominator_aggregation: str = "sum"
    candidate: bool = False
    age_group: str | None = None
    ages: tuple[int, ...] = ()
    slope_damping: float = 0.35
    annual_pp_limit: float = 2.0
    plausible_cap: float = 100.0


SPECS = (
    IndicatorSpec(
        "creche", load_pne_data, "mat_basico_0_3", "pop_0_3", "at_least",
        ({"year": 2036, "value": 60.0},), denominator_aggregation="max",
        age_group="0-3", ages=(0, 1, 2, 3), slope_damping=0.30,
        annual_pp_limit=3.0, plausible_cap=85.0,
    ),
    IndicatorSpec(
        "pre_escola", load_pre_escola_data, "mat_infantil_pre", "pop_4_5", "at_least",
        ({"year": 2036, "value": 100.0},), denominator_aggregation="max",
        age_group="4-5", ages=(4, 5),
    ),
    IndicatorSpec(
        "basico_6_17", load_basico_6_17_data, "mat_basico_6_17", "pop_6_17", "at_least",
        ({"year": 2036, "value": 100.0},), denominator_aggregation="max",
        age_group="6-17", ages=tuple(range(6, 18)),
    ),
    IndicatorSpec(
        "basico_15_17", load_basico_15_17_data, "mat_basico_15_17", "pop_15_17", "at_least",
        ({"year": 2036, "value": 85.0},), denominator_aggregation="max",
        age_group="15-17", ages=(15, 16, 17),
    ),
    IndicatorSpec(
        "basico_integral", load_basico_integral_data, "mat_basico_integral", "mat_basico",
        "at_least", ({"year": 2031, "value": 35.0}, {"year": 2036, "value": 50.0}),
        candidate=True,
    ),
    IndicatorSpec(
        "escolas_integral", load_escolas_integral_data, "escolas_publicas_com_integral",
        "escolas_publicas_total", "at_least",
        ({"year": 2031, "value": 50.0}, {"year": 2036, "value": 65.0}), candidate=True,
    ),
    IndicatorSpec(
        "pos_graduacao", load_docentes_pos_graduacao_data, "docentes_pos_graduacao",
        "total_docentes", "at_least", ({"year": 2036, "value": 70.0},),
        filters=(("dependencia", "total"),), candidate=True,
    ),
    IndicatorSpec(
        "temporarios", load_docentes_temporarios_data, "docentes_temporarios", "total_docentes",
        "at_most", ({"year": 2031, "value": 30.0},),
        filters=(("dependencia", "publica"),), candidate=True,
    ),
)


def _safe_output_root(path: Path) -> Path:
    resolved = path.resolve()
    public_data = (REPO_ROOT / "public" / "data").resolve()
    if resolved == public_data or public_data in resolved.parents:
        raise ValueError("Experimental artifacts cannot be written under public/data")
    return resolved


def _json_dump(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
        encoding="utf-8",
    )


def _load_series(spec: IndicatorSpec) -> dict[str, list[RatioObservation]]:
    frame = spec.loader().copy()
    for column, value in spec.filters:
        frame = frame[frame[column].astype(str).str.strip().str.lower() == value]
    required = {"ano", "municipio", spec.numerator, spec.denominator}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"{spec.key}: missing columns {sorted(missing)}")
    frame["ano"] = pd.to_numeric(frame["ano"], errors="coerce")
    frame[spec.numerator] = pd.to_numeric(frame[spec.numerator], errors="coerce")
    frame[spec.denominator] = pd.to_numeric(frame[spec.denominator], errors="coerce")
    frame = frame[(frame["ano"] >= SOURCE_START_YEAR) & (frame["ano"] <= SOURCE_END_YEAR)]
    aggregations = {spec.numerator: "sum", spec.denominator: spec.denominator_aggregation}
    yearly = (
        frame.groupby(["municipio", "ano"], as_index=False, dropna=False)
        .agg(aggregations)
        .sort_values(["municipio", "ano"])
    )
    result: dict[str, list[RatioObservation]] = {}
    for municipality, group in yearly.groupby("municipio", sort=True):
        rows = (
            {"year": row.ano, "numerator": getattr(row, spec.numerator), "denominator": getattr(row, spec.denominator)}
            for row in group.itertuples(index=False)
        )
        observations, _, _ = coerce_observations(rows, expected_latest_year=SOURCE_END_YEAR)
        result[str(municipality)] = observations
    return result


def _grouped_summaries(results: list[BacktestResult]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str, str], list[BacktestResult]] = defaultdict(list)
    for item in results:
        grouped[(item.indicator_key, item.model, str(item.horizon))].append(item)
        grouped[(item.indicator_key, item.model, "all")].append(item)
    return [
        {
            "indicatorKey": indicator,
            "model": model,
            "horizon": horizon,
            **summarize_backtest(items),
        }
        for (indicator, model, horizon), items in sorted(grouped.items())
    ]


def _rank_models(summaries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in summaries:
        grouped[(row["indicatorKey"], str(row["horizon"]))].append(row)
    ranking: list[dict[str, Any]] = []
    for (indicator, horizon), rows in sorted(grouped.items()):
        eligible = [row for row in rows if row["maePpMacro"] is not None]
        for metric, reverse in (
            ("maePpMacro", False), ("p90AePp", False), ("absoluteBias", False),
            ("invalidPredictionCount", False), ("municipalityCoverage", True),
        ):
            for row in eligible:
                row["absoluteBias"] = abs(row["biasPp"] or 0.0)
            ordered = sorted(eligible, key=lambda row: row[metric], reverse=reverse)
            for position, row in enumerate(ordered, 1):
                row.setdefault("_ranks", []).append(position)
        baseline = next((row for row in eligible if row["model"] == MODEL_LAST_COMPONENTS), None)
        for row in eligible:
            score = sum(row.pop("_ranks")) / 5
            baseline_mae = baseline["maePpMacro"] if baseline else None
            ranking.append(
                {
                    "indicatorKey": indicator,
                    "horizon": horizon,
                    "rank": 0,
                    "model": row["model"],
                    "compositeRankScore": round(score, 4),
                    "maePpMacro": row["maePpMacro"],
                    "medianAePp": row["medianAePp"],
                    "p90AePp": row["p90AePp"],
                    "biasPp": row["biasPp"],
                    "municipalityCoverage": row["municipalityCoverage"],
                    "invalidPredictionCount": row["invalidPredictionCount"],
                    "above100Proportion": row["above100Proportion"],
                    "negativeCountProportion": max(
                        row["negativeNumeratorRawProportion"] or 0,
                        row["negativeDenominatorRawProportion"] or 0,
                    ),
                    "maeDifferenceVsLastComponents": round(row["maePpMacro"] - baseline_mae, 6)
                    if baseline_mae is not None else None,
                }
            )
        horizon_rows = [row for row in ranking if row["indicatorKey"] == indicator and row["horizon"] == horizon]
        horizon_rows.sort(key=lambda row: (row["compositeRankScore"], row["maePpMacro"], row["model"]))
        for position, row in enumerate(horizon_rows, 1):
            row["rank"] = position
    return ranking


def _selected_shadow_models(ranking: list[dict[str, Any]]) -> dict[str, str]:
    selected = {}
    for spec in SPECS:
        if not spec.candidate:
            continue
        rows = [
            row for row in ranking
            if row["indicatorKey"] == spec.key and row["horizon"] == "all" and row["model"] in COMPONENT_MODELS
        ]
        selected[spec.key] = min(rows, key=lambda row: (row["rank"], row["model"]))["model"]
    return selected


def _quantile(values: Iterable[float], q: float) -> float:
    series = pd.Series(list(values), dtype=float)
    return float(series.quantile(q))


def _quality_evidence(
    spec: IndicatorSpec,
    series_by_municipality: dict[str, list[RatioObservation]],
    results: list[BacktestResult],
    selected_model: str,
) -> tuple[dict[str, dict[str, Any]], dict[str, Any]]:
    errors: dict[str, list[float]] = defaultdict(list)
    biases: dict[str, list[float]] = defaultdict(list)
    model_predictions: dict[tuple[str, int, int], list[float]] = defaultdict(list)
    for item in results:
        if item.indicator_key != spec.key or item.error_pp is None:
            continue
        model_predictions[(item.municipality, item.origin_year, item.target_year)].append(item.predicted_value)
        if item.model == selected_model:
            errors[item.municipality].append(abs(item.error_pp))
            biases[item.municipality].append(item.error_pp)
    diagnostic_rows = {}
    for municipality, observations in series_by_municipality.items():
        diag = build_diagnostics(observations, expected_latest_year=SOURCE_END_YEAR)
        model_spreads = [
            max(values) - min(values)
            for (name, _, _), values in model_predictions.items()
            if name == municipality and len(values) >= 2 and all(value is not None for value in values)
        ]
        diagnostic_rows[municipality] = {
            "validPointCount": diag.valid_point_count,
            "consecutiveYearCount": diag.consecutive_year_count,
            "missingYearCount": diag.missing_year_count,
            "latestDataGap": diag.latest_data_gap,
            "longestGap": diag.longest_gap,
            "minimumDenominator": diag.minimum_denominator,
            "medianDenominator": diag.median_denominator,
            "numeratorVolatility": diag.numerator_volatility,
            "denominatorVolatility": diag.denominator_volatility,
            "percentageVolatility": diag.percentage_volatility,
            "relevantJumpCount": diag.relevant_jump_count,
            "domainViolationCount": sum(item.numerator > item.denominator for item in observations),
            "constantSeries": diag.is_constant_series,
            "backtestMaePp": sum(errors[municipality]) / len(errors[municipality]) if errors[municipality] else None,
            "backtestBiasPp": sum(biases[municipality]) / len(biases[municipality]) if biases[municipality] else None,
            "medianModelSpreadPp": median(model_spreads) if model_spreads else None,
        }
    evaluable = [row for row in diagnostic_rows.values() if row["backtestMaePp"] is not None]
    thresholds = {
        "maeP50": _quantile((row["backtestMaePp"] for row in evaluable), 0.50),
        "maeP75": _quantile((row["backtestMaePp"] for row in evaluable), 0.75),
        "denominatorP25": _quantile((row["medianDenominator"] for row in evaluable), 0.25),
        "volatilityP75": _quantile((row["percentageVolatility"] for row in evaluable), 0.75),
        "modelSpreadP75": _quantile((row["medianModelSpreadPp"] for row in evaluable), 0.75),
    }
    evidence: dict[str, dict[str, Any]] = {}
    distribution = Counter()
    for municipality, row in diagnostic_rows.items():
        reasons = []
        if row["validPointCount"] < 5 or row["backtestMaePp"] is None:
            level = "insuficiente"
            reasons.append("menos de cinco pontos válidos ou sem origem avaliável")
        else:
            if row["latestDataGap"] > 0:
                reasons.append("último ano esperado ausente")
            if row["missingYearCount"] > 0:
                reasons.append("série contém lacuna")
            if row["medianDenominator"] < thresholds["denominatorP25"]:
                reasons.append("denominador abaixo do primeiro quartil observado")
            if row["percentageVolatility"] > thresholds["volatilityP75"]:
                reasons.append("volatilidade acima do terceiro quartil observado")
            if row["medianModelSpreadPp"] > thresholds["modelSpreadP75"]:
                reasons.append("divergência entre modelos acima do terceiro quartil")
            if row["relevantJumpCount"] > 0:
                reasons.append("salto relevante detectado pela regra robusta de 3 MAD")
            if row["domainViolationCount"] > 0:
                reasons.append("numerador histórico acima do denominador")
            if row["backtestMaePp"] <= thresholds["maeP50"] and not reasons:
                level = "alta"
            elif row["backtestMaePp"] <= thresholds["maeP75"] and len(reasons) <= 2:
                level = "media"
            else:
                level = "baixa"
            reasons.insert(0, f"MAE municipal {row['backtestMaePp']:.2f} p.p.")
        distribution[level] += 1
        evidence[municipality] = {
            "provisionalLevel": level,
            "reasons": reasons,
            "selectedShadowModel": selected_model,
            **row,
        }
    return evidence, {
        "indicatorKey": spec.key,
        "selectedShadowModel": selected_model,
        "thresholdsDerivedFromMunicipalDistribution": {key: round(value, 6) for key, value in thresholds.items()},
        "rules": {
            "alta": "MAE até P50, sem lacuna/recência/porte/volatilidade/divergência adversos",
            "media": "MAE até P75 e no máximo dois sinais adversos",
            "baixa": "demais séries avaliáveis",
            "insuficiente": "menos de cinco pontos válidos ou sem erro retroativo avaliável",
        },
        "distribution": dict(sorted(distribution.items())),
    }


def _denominator_size_metrics(results: list[BacktestResult]) -> list[dict[str, Any]]:
    """Summarize errors by empirical denominator-size bands per indicator."""
    thresholds = {}
    for indicator in sorted({item.indicator_key for item in results}):
        values = [item.observed_denominator for item in results if item.indicator_key == indicator]
        thresholds[indicator] = (_quantile(values, 0.25), _quantile(values, 0.75))
    grouped: dict[tuple[str, str, str], list[BacktestResult]] = defaultdict(list)
    for item in results:
        q25, q75 = thresholds[item.indicator_key]
        band = "small_le_p25" if item.observed_denominator <= q25 else "large_gt_p75" if item.observed_denominator > q75 else "middle"
        grouped[(item.indicator_key, item.model, band)].append(item)
    rows = []
    for (indicator, model, band), items in sorted(grouped.items()):
        q25, q75 = thresholds[indicator]
        rows.append(
            {
                "indicatorKey": indicator,
                "model": model,
                "denominatorBand": band,
                "indicatorDenominatorP25": round(q25, 6),
                "indicatorDenominatorP75": round(q75, 6),
                **summarize_backtest(items),
            }
        )
    return rows


def _theil_sen_slope(points: list[tuple[int, float]]) -> float:
    slopes = [
        (right_value - left_value) / (right_year - left_year)
        for index, (left_year, left_value) in enumerate(points)
        for right_year, right_value in points[index + 1 :]
        if right_year != left_year
    ]
    return float(median(slopes)) if slopes else 0.0


def _current_engine_prediction(
    observations: list[RatioObservation],
    origin: int,
    target: int,
    spec: IndicatorSpec,
    rs_series: pd.Series,
    *,
    apply_limits: bool,
) -> tuple[float | None, int, float]:
    training = [item for item in observations if item.year <= origin]
    if len(training) < 5:
        return None, 0, 0.0
    points = [(item.year, item.numerator) for item in training]
    long_slope = _theil_sen_slope(points)
    recent_slope = _theil_sen_slope(points[-5:])
    if long_slope > 0 and recent_slope > long_slope * 1.5:
        slope = min(long_slope, recent_slope)
    elif recent_slope < 0 < long_slope:
        slope = long_slope
    else:
        slope = recent_slope if abs(recent_slope) < abs(long_slope) else long_slope
    slope *= spec.slope_damping
    numerator = float(median([item.numerator for item in training[-3:]]))
    base_denominator = training[-1].denominator
    base_rs = float(rs_series.get(training[-1].year, math.nan))
    previous = min(100.0, max(0.0, training[-1].value))
    activations = 0
    final_raw = None
    final_value = None
    for year in range(origin + 1, target + 1):
        raw_numerator = max(0.0, numerator + slope)
        if apply_limits and numerator > 0:
            variation = (raw_numerator - numerator) / numerator
            bounded_variation = max(-0.08, min(0.08, variation))
            if abs(variation - bounded_variation) > 1e-12:
                activations += 1
            numerator *= 1 + bounded_variation
        else:
            numerator = raw_numerator
        target_rs = float(rs_series.get(year, math.nan))
        if not math.isfinite(base_rs) or base_rs <= 0 or not math.isfinite(target_rs):
            denominator = base_denominator
        else:
            denominator = base_denominator * target_rs / base_rs
        raw_percent = 100.0 * numerator / denominator if denominator > 0 else None
        if raw_percent is None:
            return None, activations, 0.0
        final_raw = raw_percent
        if apply_limits:
            bounded = max(0.0, min(100.0, raw_percent))
            difference = bounded - previous
            if abs(difference) > spec.annual_pp_limit:
                activations += 1
                bounded = previous + math.copysign(spec.annual_pp_limit, difference)
            final_value = max(0.0, min(spec.plausible_cap, bounded))
            if abs(final_value - bounded) > 1e-12:
                activations += 1
            previous = bounded
        else:
            final_value = raw_percent
    return final_value, activations, abs((final_value or 0) - (final_raw or 0))


def _current_engine_backtest(
    all_series: dict[str, dict[str, list[RatioObservation]]]
) -> tuple[list[BacktestResult], dict[str, Any]]:
    population_path = Path("C:/Users/rnbirck/PROJETOS/SENAI/DB/data/projecao_populacao/projecao_pop.xlsx")
    if not population_path.exists():
        return [], {"available": False, "reason": f"missing {population_path}"}
    population = load_rs_population_projection(population_path)
    specs = [spec for spec in SPECS if not spec.candidate]
    rs_by_group = build_rs_population_by_age_group(population, {spec.age_group: spec.ages for spec in specs})
    results: list[BacktestResult] = []
    diagnostics: dict[str, dict[str, float | int]] = defaultdict(
        lambda: {
            "evaluatedPredictions": 0,
            "predictionsWithLimitActivation": 0,
            "limitActivations": 0,
            "absoluteLimitEffectPp": 0.0,
        }
    )
    for spec in specs:
        for municipality, observations in all_series[spec.key].items():
            actual_by_year = {item.year: item for item in observations}
            for origin in ORIGINS:
                if len([item for item in observations if item.year <= origin]) < 5:
                    continue
                for horizon in HORIZONS:
                    actual = actual_by_year.get(origin + horizon)
                    if actual is None:
                        continue
                    limited, activations, effect = _current_engine_prediction(
                        observations, origin, origin + horizon, spec, rs_by_group[spec.age_group], apply_limits=True
                    )
                    raw, _, _ = _current_engine_prediction(
                        observations, origin, origin + horizon, spec, rs_by_group[spec.age_group], apply_limits=False
                    )
                    diagnostics[spec.key]["limitActivations"] += activations
                    diagnostics[spec.key]["absoluteLimitEffectPp"] += effect
                    diagnostics[spec.key]["evaluatedPredictions"] += 1
                    diagnostics[spec.key]["predictionsWithLimitActivation"] += activations > 0
                    for model, predicted in (("current_engine_limited", limited), ("current_engine_raw", raw)):
                        results.append(
                            BacktestResult(
                                spec.key, municipality, model, origin, origin + horizon, horizon,
                                actual.value, predicted, actual.numerator, actual.denominator,
                                None, None, predicted is None,
                                predicted is not None and predicted > 100,
                                predicted is not None and predicted < 0, False, False,
                            )
                        )
    for values in diagnostics.values():
        values["absoluteLimitEffectPp"] = round(float(values["absoluteLimitEffectPp"]), 6)
        values["meanAbsoluteLimitEffectPp"] = round(
            float(values["absoluteLimitEffectPp"]) / int(values["evaluatedPredictions"]), 6
        )
    return results, {"available": True, "byIndicator": dict(diagnostics)}


def _public_contract_audit() -> dict[str, Any]:
    expected = {"creche", "pre_escola", "basico_6_17", "basico_15_17"}
    digest = hashlib.sha256()
    key_mismatches = []
    quality = Counter()
    capped_historical = invalid_denominator_as_zero = raw_display_differences = limit_warning_count = 0
    files = sorted(
        path
        for path in (REPO_ROOT / "public" / "data" / "municipios").glob("*/index.json")
        if path.parent.name.isdigit()
    )
    for path in files:
        payload = json.loads(path.read_text(encoding="utf-8"))
        projections = payload.get("pne_2026_2036", {}).get("projecoes", {})
        keys = set(projections)
        if keys != expected:
            key_mismatches.append({"file": path.relative_to(REPO_ROOT).as_posix(), "keys": sorted(keys)})
        digest.update(json.dumps(projections, sort_keys=True, ensure_ascii=False).encode("utf-8"))
        for projection in projections.values():
            quality[projection.get("quality", "missing")] += 1
            raw = projection.get("historical_percent_raw", [])
            shown = projection.get("historical_percent", [])
            capped_historical += sum(value > 100 for value in raw if isinstance(value, (int, float)))
            raw_display_differences += sum(a != b for a, b in zip(raw, shown))
            denominators = projection.get("historical_population", [])
            invalid_denominator_as_zero += sum(
                denominator <= 0 and shown_value == 0
                for denominator, shown_value in zip(denominators, shown)
                if isinstance(denominator, (int, float))
            )
            limit_warning_count += sum("limitada" in warning.lower() for warning in projection.get("warnings", []))
    return {
        "municipalityFileCount": len(files),
        "expectedProjectionKeys": sorted(expected),
        "keyMismatchCount": len(key_mismatches),
        "keyMismatchSamples": key_mismatches[:5],
        "projectionPayloadSha256": digest.hexdigest(),
        "historicalValuesAbove100Truncated": capped_historical,
        "historicalRawDisplayDifferences": raw_display_differences,
        "invalidDenominatorsDisplayedAsZero": invalid_denominator_as_zero,
        "limitWarningCount": limit_warning_count,
        "currentQualityDistribution": dict(sorted(quality.items())),
    }


def _state_domain_audit(
    candidate_series: dict[str, dict[str, list[RatioObservation]]],
    selected_models: dict[str, str],
) -> dict[str, Any]:
    state_path = REPO_ROOT / "public" / "data" / "pne_2026_2036" / "referencia_estadual.json"
    current = json.loads(state_path.read_text(encoding="utf-8"))
    violations = []
    for indicator, projection in current.get("projections", {}).items():
        invalid = [point for point in projection.get("series", []) if point.get("value") is not None and (point["value"] > 100 or point["value"] < 0)]
        if invalid:
            first = invalid[0]
            violations.append(
                {
                    "indicatorKey": indicator,
                    "affectedYearCount": len(invalid),
                    "firstViolationYear": first.get("year"),
                    "firstRawValue": first.get("value"),
                    "firstNumerator": first.get("numerator"),
                    "firstDenominator": first.get("denominator"),
                    "maximumRawValue": max(point["value"] for point in invalid),
                }
            )
    strategy = RatioOfCountsProjectionStrategy()
    shadow = {}
    for spec in (item for item in SPECS if item.candidate):
        municipality_series = candidate_series[spec.key]
        aggregate_by_year: dict[int, list[float]] = defaultdict(lambda: [0.0, 0.0])
        for observations in municipality_series.values():
            for item in observations:
                aggregate_by_year[item.year][0] += item.numerator
                aggregate_by_year[item.year][1] += item.denominator
        state_observations = [RatioObservation(year, values[0], values[1]) for year, values in sorted(aggregate_by_year.items()) if values[1] > 0]
        model = selected_models[spec.key]
        comparisons = []
        for year in PROJECTION_YEARS:
            components = strategy.project(state_observations, year, model)
            direct = strategy.project(state_observations, year, MODEL_THEIL_SEN_PERCENTAGE)
            municipal_num = municipal_den = 0.0
            invalid_municipal = 0
            for observations in municipality_series.values():
                point = strategy.project(observations, year, model)
                if point["numerator"] is None or point["denominator"] is None or point["denominator"] <= 0:
                    invalid_municipal += 1
                    continue
                municipal_num += point["numerator"]
                municipal_den += point["denominator"]
            municipal_value = 100.0 * municipal_num / municipal_den if municipal_den > 0 else None
            comparisons.append(
                {
                    "year": year,
                    "aggregateComponentsValue": components["rawValue"],
                    "directAggregatePercentageValue": direct["rawValue"],
                    "aggregateMunicipalProjectionsValue": round(municipal_value, 6) if municipal_value is not None else None,
                    "aggregateNumerator": components["rawNumerator"],
                    "aggregateDenominator": components["rawDenominator"],
                    "invalidMunicipalityProjectionCount": invalid_municipal,
                    "directMinusComponentsPp": round(direct["rawValue"] - components["rawValue"], 6)
                    if direct["rawValue"] is not None and components["rawValue"] is not None else None,
                    "municipalMinusComponentsPp": round(municipal_value - components["rawValue"], 6)
                    if municipal_value is not None and components["rawValue"] is not None else None,
                }
            )
        shadow[spec.key] = {"selectedShadowModel": model, "series": comparisons}
    return {
        "currentStateProjectionAudit": {
            "source": state_path.relative_to(REPO_ROOT).as_posix(),
            "indicatorCount": len(current.get("projections", {})),
            "indicatorsWithDomainViolation": len(violations),
            "violations": violations,
        },
        "candidateStateShadowScenarios": shadow,
        "note": "Raw values are retained; no 0–100 display bound is applied.",
    }


def _sample_contracts(
    contracts: dict[str, list[dict[str, Any]]],
    quality: dict[str, dict[str, dict[str, Any]]],
) -> dict[str, dict[str, Any]]:
    flattened = [contract for values in contracts.values() for contract in values]
    def evidence(contract: dict[str, Any]) -> dict[str, Any]:
        return quality[contract["indicatorKey"]][contract["municipality"]]
    samples = {
        "small-denominator": min(flattened, key=lambda item: evidence(item)["medianDenominator"] or float("inf")),
        "volatile-series": max(flattened, key=lambda item: evidence(item)["percentageVolatility"] or 0),
        "agudo": max(flattened, key=lambda item: evidence(item)["backtestMaePp"] or 0),
    }
    constant = [item for item in flattened if evidence(item)["constantSeries"]]
    samples["constant-series"] = constant[0] if constant else min(flattened, key=lambda item: evidence(item)["percentageVolatility"] or 0)
    violation = [item for item in flattened if item["diagnostics"]["domainViolations"]]
    samples["domain-violation"] = violation[0] if violation else max(flattened, key=lambda item: item["summary"]["projected2036"] or 0)
    return samples


def run(output_root: Path) -> dict[str, Any]:
    output_root = _safe_output_root(output_root)
    public_before = _public_contract_audit()
    all_series = {spec.key: _load_series(spec) for spec in SPECS}
    results: list[BacktestResult] = []
    for spec in SPECS:
        for municipality, observations in all_series[spec.key].items():
            results.extend(
                temporal_backtest(
                    indicator_key=spec.key,
                    municipality=municipality,
                    observations=observations,
                    origins=ORIGINS,
                    horizons=HORIZONS,
                )
            )
    current_results, current_diagnostics = _current_engine_backtest(all_series)
    experimental_summaries = _grouped_summaries(results)
    current_summaries = _grouped_summaries(current_results)
    ranking = _rank_models(experimental_summaries)
    selected = _selected_shadow_models(ranking)

    candidate_results = [item for item in results if next(spec for spec in SPECS if spec.key == item.indicator_key).candidate]
    quality_by_indicator: dict[str, dict[str, dict[str, Any]]] = {}
    quality_distributions = []
    contracts: dict[str, list[dict[str, Any]]] = {}
    for spec in (item for item in SPECS if item.candidate):
        evidence, distribution = _quality_evidence(spec, all_series[spec.key], candidate_results, selected[spec.key])
        quality_by_indicator[spec.key] = evidence
        quality_distributions.append(distribution)
        summary = next(
            row for row in experimental_summaries
            if row["indicatorKey"] == spec.key and row["model"] == selected[spec.key] and row["horizon"] == "all"
        )
        contracts[spec.key] = []
        for municipality, observations in sorted(all_series[spec.key].items()):
            rows = [
                {"year": item.year, "numerator": item.numerator, "denominator": item.denominator}
                for item in observations
            ]
            contract = build_projection_contract(
                indicator_key=spec.key,
                municipality=municipality,
                rows=rows,
                targets=spec.targets,
                direction=spec.direction,
                model=selected[spec.key],
                backtest={
                    "model": selected[spec.key],
                    "maePp": summary["maePpMacro"],
                    "medianAePp": summary["medianAePp"],
                    "p90AePp": summary["p90AePp"],
                    "biasPp": summary["biasPp"],
                },
                quality_evidence=evidence[municipality],
            )
            contracts[spec.key].append(contract)
        _json_dump(
            output_root / "shadow-projections" / f"{spec.key}.json",
            {
                "experimentVersion": EXPERIMENT_VERSION,
                "mode": "shadow",
                "productionDecision": False,
                "indicatorKey": spec.key,
                "selectedShadowModel": selected[spec.key],
                "municipalityCount": len(contracts[spec.key]),
                "projections": contracts[spec.key],
            },
        )

    samples = _sample_contracts(contracts, quality_by_indicator)
    for name, contract in samples.items():
        _json_dump(output_root / "samples" / f"{name}.json", contract)

    public_after = _public_contract_audit()
    catalog_source = (REPO_ROOT / "src" / "data" / "educationIndicatorCatalog.js").read_text(encoding="utf-8")
    catalog_block = catalog_source.split("EDUCATION_DEMAND_INDICATOR_CATALOG", 1)[1].split("])", 1)[0]
    frontend_keys = sorted(set(re.findall(r"key:\s*'([^']+)'", catalog_block)))
    expected_frontend_keys = sorted({"creche", "pre_escola", "basico_6_17", "basico_15_17"})
    regression = {
        "publicProjectionPayloadUnchangedDuringRun": public_before["projectionPayloadSha256"] == public_after["projectionPayloadSha256"],
        "publicProjectionKeysRemainCurrentFour": public_after["keyMismatchCount"] == 0,
        "frontendProjectionCatalogRemainsCurrentFour": frontend_keys == expected_frontend_keys,
        "experimentalOutputOutsidePublicData": (REPO_ROOT / "public" / "data").resolve() not in output_root.parents,
    }
    generated_at = datetime.now(timezone.utc).isoformat()
    summary_payload = {
        "experimentVersion": EXPERIMENT_VERSION,
        "generatedAt": generated_at,
        "mode": "shadow",
        "sourcePeriod": {"startYear": SOURCE_START_YEAR, "endYear": SOURCE_END_YEAR},
        "origins": list(ORIGINS),
        "horizons": list(HORIZONS),
        "minimumTrainingPoints": 5,
        "models": list(MODELS),
        "indicatorCoverage": [
            {
                "indicatorKey": spec.key,
                "candidate": spec.candidate,
                "municipalityCount": len(all_series[spec.key]),
                "municipalitiesWithAtLeastFivePoints": sum(len(values) >= 5 for values in all_series[spec.key].values()),
                "backtestEvaluationCount": sum(item.indicator_key == spec.key for item in results),
            }
            for spec in SPECS
        ],
        "experimentalMetrics": experimental_summaries,
        "denominatorSizeMetrics": _denominator_size_metrics(results),
        "currentEngineMetrics": current_summaries,
        "currentEngineDiagnostics": current_diagnostics,
        "publicCurrentEngineAudit": public_after,
        "frontendProjectionCatalogKeys": frontend_keys,
        "regression": regression,
    }
    _json_dump(output_root / "backtest-summary.json", summary_payload)
    _json_dump(
        output_root / "model-ranking.json",
        {
            "experimentVersion": EXPERIMENT_VERSION,
            "productionDecision": False,
            "selectionPolicy": "Composite diagnostic ranking; component models only for shadow projection. Human approval remains required.",
            "selectedShadowModels": selected,
            "ranking": ranking,
        },
    )
    _json_dump(
        output_root / "quality-distribution.json",
        {
            "experimentVersion": EXPERIMENT_VERSION,
            "provisionalOnly": True,
            "method": "Indicator-specific empirical quartiles from 497 municipal histories and origin-based backtests.",
            "indicators": quality_distributions,
        },
    )
    _json_dump(output_root / "state-domain-audit.json", _state_domain_audit(all_series, selected))
    _json_dump(
        output_root / "run-manifest.json",
        {
            "experimentVersion": EXPERIMENT_VERSION,
            "generatedAt": generated_at,
            "outputRoot": output_root.as_posix(),
            "inputs": {
                "candidateSourceTables": [spec.loader.__name__ for spec in SPECS if spec.candidate],
                "publicProjectionHashBefore": public_before["projectionPayloadSha256"],
                "publicProjectionHashAfter": public_after["projectionPayloadSha256"],
            },
            "regression": regression,
        },
    )
    if not all(regression.values()):
        raise RuntimeError(f"Shadow regression guard failed: {regression}")
    return summary_payload


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output-root",
        type=Path,
        default=REPO_ROOT / "artifacts" / "projections-v2",
        help="Experimental output directory; public/data is rejected.",
    )
    args = parser.parse_args()
    payload = run(args.output_root)
    print(
        json.dumps(
            {
                "outputRoot": str(_safe_output_root(args.output_root)),
                "indicatorCount": len(payload["indicatorCoverage"]),
                "publicDataUnchanged": payload["regression"]["publicProjectionPayloadUnchangedDuringRun"],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
