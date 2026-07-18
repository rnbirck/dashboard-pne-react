"""Experimental projection engine v2.

This module is deliberately disconnected from the public export pipeline.  It
implements the ``ratio_of_counts`` strategy used by the shadow backtest and
keeps raw model outputs whenever an explicit count-domain rule is required.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from math import isfinite
from statistics import median
from typing import Any, Iterable, Mapping, Sequence


MODEL_LAST_COMPONENTS = "last_components"
MODEL_LAST_PERCENTAGE = "last_percentage"
MODEL_THEIL_SEN_COMPONENTS_FULL = "theil_sen_components_full"
MODEL_THEIL_SEN_COMPONENTS_LAST5 = "theil_sen_components_last5"
MODEL_THEIL_SEN_PERCENTAGE = "theil_sen_percentage"

ABSOLUTE_MODEL_LAST_VALUE = "last_value"
ABSOLUTE_MODEL_THEIL_SEN_FULL = "theil_sen_full"
ABSOLUTE_MODEL_THEIL_SEN_LAST5 = "theil_sen_last5"
ABSOLUTE_MODEL_LINEAR_FULL = "linear_full"
ABSOLUTE_MODEL_LINEAR_LAST5 = "linear_last5"

ABSOLUTE_COUNT_MODELS = (
    ABSOLUTE_MODEL_LAST_VALUE,
    ABSOLUTE_MODEL_THEIL_SEN_FULL,
    ABSOLUTE_MODEL_THEIL_SEN_LAST5,
    ABSOLUTE_MODEL_LINEAR_FULL,
    ABSOLUTE_MODEL_LINEAR_LAST5,
)

MODELS = (
    MODEL_LAST_COMPONENTS,
    MODEL_LAST_PERCENTAGE,
    MODEL_THEIL_SEN_COMPONENTS_FULL,
    MODEL_THEIL_SEN_COMPONENTS_LAST5,
    MODEL_THEIL_SEN_PERCENTAGE,
)
COMPONENT_MODELS = {
    MODEL_LAST_COMPONENTS,
    MODEL_THEIL_SEN_COMPONENTS_FULL,
    MODEL_THEIL_SEN_COMPONENTS_LAST5,
}
VALID_DIRECTIONS = {"at_least", "at_most"}
VALID_STATUSES = {
    "available",
    "available_with_warning",
    "insufficient_data",
    "invalid_components",
    "invalid_domain",
}


@dataclass(frozen=True)
class RatioObservation:
    year: int
    numerator: float
    denominator: float

    @property
    def value(self) -> float:
        return 100.0 * self.numerator / self.denominator


@dataclass(frozen=True)
class AbsoluteCountObservation:
    year: int
    value: float


@dataclass(frozen=True)
class ProjectionDiagnostics:
    valid_point_count: int
    missing_year_count: int
    latest_data_gap: int
    longest_gap: int
    consecutive_year_count: int
    minimum_denominator: float | None
    median_denominator: float | None
    numerator_volatility: float | None
    denominator_volatility: float | None
    percentage_volatility: float | None
    relevant_jump_count: int
    is_constant_series: bool
    domain_violations: tuple[dict[str, Any], ...]
    limits_applied: tuple[dict[str, Any], ...]
    warnings: tuple[str, ...]

    def as_contract(self) -> dict[str, Any]:
        return {
            "validPointCount": self.valid_point_count,
            "missingYearCount": self.missing_year_count,
            "latestDataGap": self.latest_data_gap,
            "longestGap": self.longest_gap,
            "consecutiveYearCount": self.consecutive_year_count,
            "minimumDenominator": _rounded(self.minimum_denominator),
            "medianDenominator": _rounded(self.median_denominator),
            "numeratorVolatility": _rounded(self.numerator_volatility),
            "denominatorVolatility": _rounded(self.denominator_volatility),
            "percentageVolatility": _rounded(self.percentage_volatility),
            "relevantJumpCount": self.relevant_jump_count,
            "constantSeries": self.is_constant_series,
            "domainViolations": list(self.domain_violations),
            "limitsApplied": list(self.limits_applied),
            "warnings": list(self.warnings),
        }


@dataclass(frozen=True)
class BacktestResult:
    indicator_key: str
    municipality: str
    model: str
    origin_year: int
    target_year: int
    horizon: int
    observed_value: float
    predicted_value: float | None
    observed_numerator: float
    observed_denominator: float
    predicted_numerator_raw: float | None
    predicted_denominator_raw: float | None
    invalid: bool
    above_100: bool
    below_0: bool
    negative_numerator_raw: bool
    negative_denominator_raw: bool

    @property
    def error_pp(self) -> float | None:
        if self.predicted_value is None:
            return None
        return self.predicted_value - self.observed_value


class ProjectionStrategy(ABC):
    """Small interface for concrete projection strategies."""

    key: str

    @abstractmethod
    def project(
        self,
        observations: Sequence[RatioObservation],
        target_year: int,
        model: str,
    ) -> dict[str, Any]:
        raise NotImplementedError


class RatioOfCountsProjectionStrategy(ProjectionStrategy):
    key = "ratio_of_counts"

    def project(
        self,
        observations: Sequence[RatioObservation],
        target_year: int,
        model: str,
    ) -> dict[str, Any]:
        if model not in MODELS:
            raise ValueError(f"Unknown model: {model}")
        if not observations:
            return _invalid_projection(target_year, "insufficient_data")

        ordered = sorted(observations, key=lambda item: item.year)
        if model == MODEL_LAST_PERCENTAGE:
            value = ordered[-1].value
            return _direct_projection(target_year, value)
        if model == MODEL_THEIL_SEN_PERCENTAGE:
            value = _theil_sen_predict(
                [(item.year, item.value) for item in ordered], target_year
            )
            return _direct_projection(target_year, value)

        selected = ordered[-5:] if model == MODEL_THEIL_SEN_COMPONENTS_LAST5 else ordered
        if model == MODEL_LAST_COMPONENTS:
            raw_numerator = selected[-1].numerator
            raw_denominator = selected[-1].denominator
        else:
            raw_numerator = _theil_sen_predict(
                [(item.year, item.numerator) for item in selected], target_year
            )
            raw_denominator = _theil_sen_predict(
                [(item.year, item.denominator) for item in selected], target_year
            )

        violations: list[dict[str, Any]] = []
        limits: list[dict[str, Any]] = []
        numerator = raw_numerator
        denominator = raw_denominator
        if raw_numerator < 0:
            violations.append(
                _violation(target_year, "negative_projected_numerator", raw_numerator, raw_denominator)
            )
            numerator = 0.0
            limits.append(
                _limit(target_year, "nonnegative_count", "numerator", raw_numerator, numerator)
            )
        if raw_denominator < 0:
            violations.append(
                _violation(target_year, "negative_projected_denominator", raw_numerator, raw_denominator)
            )
            denominator = 0.0
            limits.append(
                _limit(target_year, "nonnegative_count", "denominator", raw_denominator, denominator)
            )
        if denominator <= 0:
            return {
                **_invalid_projection(target_year, "invalid_domain"),
                "rawNumerator": _rounded(raw_numerator),
                "rawDenominator": _rounded(raw_denominator),
                "numerator": _rounded(numerator),
                "denominator": _rounded(denominator),
                "domainViolations": violations,
                "limitsApplied": limits,
            }

        raw_value = 100.0 * raw_numerator / raw_denominator if raw_denominator != 0 else None
        bounded_value = 100.0 * numerator / denominator
        if numerator > denominator:
            violations.append(
                _violation(target_year, "numerator_above_denominator", numerator, denominator)
            )
        return {
            "year": target_year,
            "rawNumerator": _rounded(raw_numerator),
            "rawDenominator": _rounded(raw_denominator),
            "numerator": _rounded(numerator),
            "denominator": _rounded(denominator),
            "rawValue": _rounded(raw_value),
            "boundedValue": _rounded(bounded_value) if limits else None,
            "displayValue": _rounded(bounded_value),
            "status": "available_with_warning" if violations else "available",
            "domainViolations": violations,
            "limitsApplied": limits,
        }


class AbsoluteCountProjectionStrategy(ProjectionStrategy):
    """Project non-negative counts while retaining each raw model result."""

    key = "absolute_count_scenario"

    def project(
        self,
        observations: Sequence[AbsoluteCountObservation],
        target_year: int,
        model: str,
    ) -> dict[str, Any]:
        if model not in ABSOLUTE_COUNT_MODELS:
            raise ValueError(f"Unknown absolute-count model: {model}")
        if not observations:
            return _invalid_absolute_projection(target_year, "insufficient_data")

        ordered = sorted(observations, key=lambda item: item.year)
        selected = ordered[-5:] if model.endswith("last5") else ordered
        points = [(item.year, item.value) for item in selected]
        if model == ABSOLUTE_MODEL_LAST_VALUE:
            raw_value = ordered[-1].value
        elif model.startswith("theil_sen"):
            raw_value = _theil_sen_predict(points, target_year)
        else:
            raw_value = _linear_predict(points, target_year)

        limits: list[dict[str, Any]] = []
        value = raw_value
        if raw_value < 0:
            value = 0.0
            limits.append(
                {
                    "year": target_year,
                    "rule": "nonnegative_count",
                    "rawValue": _rounded(raw_value),
                    "appliedValue": 0.0,
                }
            )
        return {
            "year": target_year,
            "rawValue": _rounded(raw_value),
            "value": _rounded(value),
            "status": "available_with_limit" if limits else "available",
            "limitsApplied": limits,
        }


def coerce_absolute_count_observations(
    rows: Iterable[Mapping[str, Any]],
) -> tuple[list[AbsoluteCountObservation], list[str]]:
    """Keep valid zeroes, preserve missing values as missing, and reject negatives."""
    observations: list[AbsoluteCountObservation] = []
    warnings: list[str] = []
    for row in rows:
        year = _finite_number(row.get("year"))
        value = _finite_number(row.get("value"))
        if year is None or int(year) != year:
            warnings.append("invalid_year")
            continue
        if value is None:
            warnings.append(f"missing_value:{int(year)}")
            continue
        if value < 0:
            warnings.append(f"negative_observed_count:{int(year)}")
            continue
        observations.append(AbsoluteCountObservation(int(year), value))
    by_year = {item.year: item for item in sorted(observations, key=lambda item: item.year)}
    return list(by_year.values()), sorted(set(warnings))


def coerce_observations(
    rows: Iterable[Mapping[str, Any]],
    *,
    expected_latest_year: int | None = None,
) -> tuple[list[RatioObservation], list[dict[str, Any]], list[str]]:
    """Validate rows without converting missing/invalid denominators to zero."""
    valid: list[RatioObservation] = []
    violations: list[dict[str, Any]] = []
    warnings: list[str] = []
    for row in rows:
        year = _finite_number(row.get("year"))
        numerator = _finite_number(row.get("numerator"))
        denominator = _finite_number(row.get("denominator"))
        if year is None or int(year) != year:
            warnings.append("invalid_year")
            continue
        year_int = int(year)
        if numerator is None or denominator is None:
            warnings.append(f"missing_component:{year_int}")
            continue
        if denominator <= 0:
            violations.append(
                _violation(year_int, "nonpositive_observed_denominator", numerator, denominator)
            )
            continue
        if numerator < 0:
            violations.append(_violation(year_int, "negative_observed_numerator", numerator, denominator))
            continue
        if numerator > denominator:
            violations.append(_violation(year_int, "numerator_above_denominator", numerator, denominator))
        valid.append(RatioObservation(year_int, numerator, denominator))

    by_year = {item.year: item for item in sorted(valid, key=lambda item: item.year)}
    valid = list(by_year.values())
    if expected_latest_year is not None and (not valid or valid[-1].year < expected_latest_year):
        warnings.append("latest_year_missing")
    return valid, violations, sorted(set(warnings))


def build_diagnostics(
    observations: Sequence[RatioObservation],
    *,
    expected_latest_year: int,
    domain_violations: Sequence[dict[str, Any]] = (),
    limits_applied: Sequence[dict[str, Any]] = (),
    warnings: Sequence[str] = (),
) -> ProjectionDiagnostics:
    ordered = sorted(observations, key=lambda item: item.year)
    if not ordered:
        return ProjectionDiagnostics(
            valid_point_count=0,
            missing_year_count=0,
            latest_data_gap=0,
            longest_gap=0,
            consecutive_year_count=0,
            minimum_denominator=None,
            median_denominator=None,
            numerator_volatility=None,
            denominator_volatility=None,
            percentage_volatility=None,
            relevant_jump_count=0,
            is_constant_series=False,
            domain_violations=tuple(domain_violations),
            limits_applied=tuple(limits_applied),
            warnings=tuple(warnings),
        )
    years = [item.year for item in ordered]
    gaps = [right - left - 1 for left, right in zip(years, years[1:])]
    consecutive = 1
    for left, right in zip(reversed(years[:-1]), reversed(years[1:])):
        if right - left != 1:
            break
        consecutive += 1
    numerators = [item.numerator for item in ordered]
    denominators = [item.denominator for item in ordered]
    percentages = [item.value for item in ordered]
    percentage_changes = [right - left for left, right in zip(percentages, percentages[1:])]
    return ProjectionDiagnostics(
        valid_point_count=len(ordered),
        missing_year_count=sum(gaps),
        latest_data_gap=max(0, expected_latest_year - years[-1]),
        longest_gap=max(gaps, default=0),
        consecutive_year_count=consecutive,
        minimum_denominator=min(denominators),
        median_denominator=median(denominators),
        numerator_volatility=_robust_change_volatility(numerators),
        denominator_volatility=_robust_change_volatility(denominators),
        percentage_volatility=_robust_change_volatility(percentages),
        relevant_jump_count=_relevant_jump_count(percentage_changes),
        is_constant_series=max(percentages) - min(percentages) <= 1e-12,
        domain_violations=tuple(domain_violations),
        limits_applied=tuple(limits_applied),
        warnings=tuple(warnings),
    )


def build_projection_contract(
    *,
    indicator_key: str,
    municipality: str,
    rows: Iterable[Mapping[str, Any]],
    targets: Sequence[Mapping[str, Any]],
    direction: str,
    model: str,
    projection_start_year: int = 2026,
    projection_end_year: int = 2036,
    backtest: Mapping[str, Any] | None = None,
    quality_evidence: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    if direction not in VALID_DIRECTIONS:
        raise ValueError(f"Invalid direction: {direction}")
    if projection_end_year < projection_start_year:
        raise ValueError("Projection period must be ordered")
    observations, observed_violations, warnings = coerce_observations(
        rows, expected_latest_year=projection_start_year - 1
    )
    strategy = RatioOfCountsProjectionStrategy()
    projected = [
        strategy.project(observations, year, model)
        for year in range(projection_start_year, projection_end_year + 1)
    ]
    all_violations = observed_violations + [
        violation for point in projected for violation in point["domainViolations"]
    ]
    all_limits = [limit for point in projected for limit in point["limitsApplied"]]
    diagnostics = build_diagnostics(
        observations,
        expected_latest_year=projection_start_year - 1,
        domain_violations=all_violations,
        limits_applied=all_limits,
        warnings=warnings,
    )
    observed_violation_types = {item["type"] for item in observed_violations}
    if "negative_observed_numerator" in observed_violation_types:
        status = "invalid_components"
    elif not observations and "nonpositive_observed_denominator" in observed_violation_types:
        status = "invalid_domain"
    elif len(observations) < 5:
        status = "insufficient_data"
    elif any(point["status"] == "invalid_domain" for point in projected):
        status = "invalid_domain"
    elif observed_violations or all_limits or warnings:
        status = "available_with_warning"
    else:
        status = "available"
    latest = observations[-1] if observations else None
    final = projected[-1] if projected else None
    return {
        "indicatorKey": indicator_key,
        "municipality": municipality,
        "strategy": strategy.key,
        "model": model,
        "status": status,
        "direction": direction,
        "targetValidationStatus": "configured_unvalidated",
        "sourcePeriod": {
            "startYear": observations[0].year if observations else None,
            "endYear": observations[-1].year if observations else None,
        },
        "projectionPeriod": {"startYear": projection_start_year, "endYear": projection_end_year},
        "targets": [
            {"year": int(target["year"]), "value": float(target["value"]), "type": "configured_reference"}
            for target in targets
        ],
        "historical": [
            {
                "year": item.year,
                "numerator": _rounded(item.numerator),
                "denominator": _rounded(item.denominator),
                "value": _rounded(item.value),
            }
            for item in observations
        ],
        "projected": projected,
        "summary": {
            "latestObservedYear": latest.year if latest else None,
            "latestObservedValue": _rounded(latest.value) if latest else None,
            "projected2036": final["displayValue"] if final and final["year"] == 2036 else None,
            "differenceTo2036": _rounded(final["displayValue"] - latest.value)
            if latest and final and final["displayValue"] is not None and final["year"] == 2036
            else None,
        },
        "diagnostics": diagnostics.as_contract(),
        "backtest": dict(backtest or {}),
        "qualityEvidence": dict(quality_evidence or {"provisionalLevel": None, "reasons": []}),
    }


def temporal_backtest(
    *,
    indicator_key: str,
    municipality: str,
    observations: Sequence[RatioObservation],
    models: Sequence[str] = MODELS,
    origins: Iterable[int] = range(2019, 2025),
    horizons: Sequence[int] = (1, 3, 5),
    minimum_training_points: int = 5,
) -> list[BacktestResult]:
    """Origin-based backtest; training never includes rows after the origin."""
    by_year = {item.year: item for item in observations}
    strategy = RatioOfCountsProjectionStrategy()
    results: list[BacktestResult] = []
    for origin in origins:
        training = sorted((item for item in observations if item.year <= origin), key=lambda item: item.year)
        if len(training) < minimum_training_points:
            continue
        for horizon in horizons:
            target_year = origin + horizon
            actual = by_year.get(target_year)
            if actual is None:
                continue
            for model in models:
                point = strategy.project(training, target_year, model)
                predicted = point["displayValue"]
                raw_predicted = point["rawValue"]
                raw_num = point["rawNumerator"]
                raw_den = point["rawDenominator"]
                results.append(
                    BacktestResult(
                        indicator_key=indicator_key,
                        municipality=municipality,
                        model=model,
                        origin_year=origin,
                        target_year=target_year,
                        horizon=horizon,
                        observed_value=actual.value,
                        predicted_value=predicted,
                        observed_numerator=actual.numerator,
                        observed_denominator=actual.denominator,
                        predicted_numerator_raw=raw_num,
                        predicted_denominator_raw=raw_den,
                        invalid=predicted is None,
                        above_100=raw_predicted is not None and raw_predicted > 100,
                        below_0=raw_predicted is not None and raw_predicted < 0,
                        negative_numerator_raw=raw_num is not None and raw_num < 0,
                        negative_denominator_raw=raw_den is not None and raw_den < 0,
                    )
                )
    return results


def summarize_backtest(results: Sequence[BacktestResult]) -> dict[str, Any]:
    valid = [item for item in results if item.error_pp is not None]
    errors = [item.error_pp for item in valid if item.error_pp is not None]
    absolute = [abs(value) for value in errors]
    weights = [item.observed_denominator for item in valid]
    total_weight = sum(weights)
    numerator_errors = [
        item.predicted_numerator_raw - item.observed_numerator
        for item in valid
        if item.predicted_numerator_raw is not None
    ]
    denominator_errors = [
        item.predicted_denominator_raw - item.observed_denominator
        for item in valid
        if item.predicted_denominator_raw is not None
    ]
    municipalities = {item.municipality for item in results}
    evaluated = {item.municipality for item in valid}
    return {
        "evaluationCount": len(valid),
        "invalidPredictionCount": len(results) - len(valid),
        "municipalityCoverage": _rounded(len(evaluated) / len(municipalities)) if municipalities else None,
        "maePpMacro": _rounded(sum(absolute) / len(absolute)) if absolute else None,
        "medianAePp": _rounded(median(absolute)) if absolute else None,
        "p90AePp": _rounded(_percentile(absolute, 0.9)) if absolute else None,
        "biasPp": _rounded(sum(errors) / len(errors)) if errors else None,
        "maePpDenominatorWeighted": _rounded(
            sum(abs(error) * weight for error, weight in zip(errors, weights)) / total_weight
        ) if errors and total_weight > 0 else None,
        "above100Proportion": _rounded(sum(item.above_100 for item in valid) / len(valid)) if valid else None,
        "below0Proportion": _rounded(sum(item.below_0 for item in valid) / len(valid)) if valid else None,
        "negativeNumeratorRawProportion": _rounded(
            sum(item.negative_numerator_raw for item in results) / len(results)
        ) if results else None,
        "negativeDenominatorRawProportion": _rounded(
            sum(item.negative_denominator_raw for item in results) / len(results)
        ) if results else None,
        "numeratorMae": _rounded(sum(abs(value) for value in numerator_errors) / len(numerator_errors))
        if numerator_errors else None,
        "numeratorWape": _rounded(
            sum(abs(value) for value in numerator_errors)
            / sum(item.observed_numerator for item in valid if item.predicted_numerator_raw is not None)
        ) if numerator_errors and sum(item.observed_numerator for item in valid if item.predicted_numerator_raw is not None) > 0 else None,
        "numeratorBias": _rounded(sum(numerator_errors) / len(numerator_errors)) if numerator_errors else None,
        "denominatorMae": _rounded(sum(abs(value) for value in denominator_errors) / len(denominator_errors))
        if denominator_errors else None,
        "denominatorWape": _rounded(
            sum(abs(value) for value in denominator_errors)
            / sum(item.observed_denominator for item in valid if item.predicted_denominator_raw is not None)
        ) if denominator_errors and sum(item.observed_denominator for item in valid if item.predicted_denominator_raw is not None) > 0 else None,
        "denominatorBias": _rounded(sum(denominator_errors) / len(denominator_errors)) if denominator_errors else None,
    }


def _theil_sen_predict(points: Sequence[tuple[int, float]], target_year: int) -> float:
    if not points:
        raise ValueError("Theil-Sen needs at least one point")
    if len(points) == 1:
        return float(points[0][1])
    slopes = [
        (right_value - left_value) / (right_year - left_year)
        for index, (left_year, left_value) in enumerate(points)
        for right_year, right_value in points[index + 1 :]
        if right_year != left_year
    ]
    slope = median(slopes) if slopes else 0.0
    intercept = median([value - slope * year for year, value in points])
    return float(intercept + slope * target_year)


def _linear_predict(points: Sequence[tuple[int, float]], target_year: int) -> float:
    if not points:
        raise ValueError("Linear regression needs at least one point")
    if len(points) == 1:
        return float(points[0][1])
    mean_year = sum(year for year, _value in points) / len(points)
    mean_value = sum(value for _year, value in points) / len(points)
    denominator = sum((year - mean_year) ** 2 for year, _value in points)
    slope = (
        sum((year - mean_year) * (value - mean_value) for year, value in points)
        / denominator
        if denominator > 0
        else 0.0
    )
    intercept = mean_value - slope * mean_year
    return float(intercept + slope * target_year)


def _direct_projection(year: int, value: float) -> dict[str, Any]:
    violations = []
    if value > 100:
        violations.append(_violation(year, "percentage_above_100", None, None, value))
    if value < 0:
        violations.append(_violation(year, "percentage_below_0", None, None, value))
    return {
        "year": year,
        "rawNumerator": None,
        "rawDenominator": None,
        "numerator": None,
        "denominator": None,
        "rawValue": _rounded(value),
        "boundedValue": None,
        "displayValue": _rounded(value),
        "status": "available_with_warning" if violations else "available",
        "domainViolations": violations,
        "limitsApplied": [],
    }


def _invalid_projection(year: int, status: str) -> dict[str, Any]:
    return {
        "year": year,
        "rawNumerator": None,
        "rawDenominator": None,
        "numerator": None,
        "denominator": None,
        "rawValue": None,
        "boundedValue": None,
        "displayValue": None,
        "status": status,
        "domainViolations": [],
        "limitsApplied": [],
    }


def _invalid_absolute_projection(year: int, status: str) -> dict[str, Any]:
    return {
        "year": year,
        "rawValue": None,
        "value": None,
        "status": status,
        "limitsApplied": [],
    }


def _violation(
    year: int,
    kind: str,
    numerator: float | None,
    denominator: float | None,
    raw_value: float | None = None,
) -> dict[str, Any]:
    value = raw_value
    if value is None and numerator is not None and denominator not in (None, 0):
        value = 100.0 * numerator / denominator
    return {
        "year": year,
        "type": kind,
        "numerator": _rounded(numerator),
        "denominator": _rounded(denominator),
        "rawValue": _rounded(value),
    }


def _limit(year: int, rule: str, component: str, raw: float, applied: float) -> dict[str, Any]:
    return {
        "year": year,
        "rule": rule,
        "component": component,
        "rawValue": _rounded(raw),
        "appliedValue": _rounded(applied),
    }


def _finite_number(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if isfinite(number) else None


def _robust_change_volatility(values: Sequence[float]) -> float | None:
    if len(values) < 2:
        return None
    changes = [right - left for left, right in zip(values, values[1:])]
    center = median(changes)
    return median([abs(value - center) for value in changes])


def _relevant_jump_count(changes: Sequence[float]) -> int:
    if len(changes) < 2:
        return 0
    center = median(changes)
    mad = median([abs(value - center) for value in changes])
    if mad <= 1e-12:
        return sum(abs(value - center) > 1e-12 for value in changes)
    return sum(abs(value - center) > 3 * mad for value in changes)


def _percentile(values: Sequence[float], quantile: float) -> float:
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    position = (len(ordered) - 1) * quantile
    lower = int(position)
    upper = min(lower + 1, len(ordered) - 1)
    fraction = position - lower
    return ordered[lower] + fraction * (ordered[upper] - ordered[lower])


def _rounded(value: float | None, digits: int = 6) -> float | None:
    return None if value is None else round(float(value), digits)
