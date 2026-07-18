"""Promote approved projection-v2 contracts to public planning scenarios."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable


PUBLIC_CONTRACT_VERSION = "planning-scenarios-v1"
APPROVED_MODEL = "last_components"
INDICATOR_KEYS = (
    "basico_integral",
    "escolas_integral",
    "pos_graduacao",
    "temporarios",
)


def load_approved_planning_scenarios(
    artifact_root: Path,
    municipalities: Iterable[str],
) -> dict[str, Any]:
    """Build the canonical aggregate payload from the approved shadow run."""
    expected_municipalities = tuple(str(name) for name in municipalities)
    if len(expected_municipalities) != 497:
        raise ValueError(
            f"Expected 497 municipalities, found {len(expected_municipalities)}"
        )

    contracts_by_indicator: dict[str, dict[str, dict[str, Any]]] = {}
    experiment_version: str | None = None
    for indicator_key in INDICATOR_KEYS:
        artifact = _load_json(
            artifact_root / "shadow-projections" / f"{indicator_key}.json"
        )
        _validate_artifact_envelope(artifact, indicator_key)
        artifact_version = str(artifact.get("experimentVersion") or "")
        if experiment_version is None:
            experiment_version = artifact_version
        elif experiment_version != artifact_version:
            raise ValueError("Approved artifacts use different experiment versions")

        by_municipality: dict[str, dict[str, Any]] = {}
        for contract in artifact.get("projections", []):
            municipality = str(contract.get("municipality") or "")
            _validate_contract(contract, indicator_key, municipality)
            by_municipality[municipality] = _to_public_contract(contract)
        contracts_by_indicator[indicator_key] = by_municipality

    municipality_set = set(expected_municipalities)
    for indicator_key, contracts in contracts_by_indicator.items():
        missing = sorted(municipality_set - set(contracts))
        unexpected = sorted(set(contracts) - municipality_set)
        if missing or unexpected:
            raise ValueError(
                f"{indicator_key}: municipality mismatch; "
                f"missing={missing[:5]}, unexpected={unexpected[:5]}"
            )

    return {
        "contractVersion": PUBLIC_CONTRACT_VERSION,
        "sourceExperimentVersion": experiment_version,
        "publicationStatus": "published",
        "scenarioType": "maintenance",
        "municipalityCount": len(expected_municipalities),
        "indicatorKeys": list(INDICATOR_KEYS),
        "municipios": {
            municipality: {
                indicator_key: contracts_by_indicator[indicator_key][municipality]
                for indicator_key in INDICATOR_KEYS
            }
            for municipality in expected_municipalities
        },
    }


def build_reference_trajectory(
    contract: dict[str, Any],
) -> list[dict[str, float | int]]:
    historical = [
        point
        for point in contract.get("historical", [])
        if _is_number(point.get("year")) and _is_number(point.get("value"))
    ]
    targets = sorted(
        (target for target in contract.get("targets", []) if _is_number(target.get("year")) and _is_number(target.get("value"))),
        key=lambda point: point["year"],
    )
    if not historical or not targets:
        return []

    latest = max(historical, key=lambda point: point["year"])
    latest_year = int(latest["year"])
    required_value = float(latest["value"])
    waypoints = [{"year": latest_year, "value": required_value}]
    for target in targets:
        target_year = int(target["year"])
        if target_year <= latest_year:
            continue
        target_value = float(target["value"])
        required_value = (
            min(required_value, target_value)
            if contract.get("direction") == "at_most"
            else max(required_value, target_value)
        )
        waypoints.append({"year": target_year, "value": required_value})

    projection_end = max(2036, max(int(target["year"]) for target in targets))
    if waypoints[-1]["year"] != projection_end:
        waypoints.append({"year": projection_end, "value": required_value})

    trajectory = []
    for year in range(latest_year, projection_end + 1):
        right_index = next(
            index for index, point in enumerate(waypoints) if point["year"] >= year
        )
        right = waypoints[right_index]
        left = waypoints[max(0, right_index - 1)]
        span = right["year"] - left["year"]
        progress = (year - left["year"]) / span if span > 0 else 0
        value = left["value"] + (right["value"] - left["value"]) * progress
        trajectory.append({"year": year, "value": round(value, 6)})
    return trajectory


def build_reference_targets(
    contract: dict[str, Any],
    trajectory: list[dict[str, float | int]],
) -> list[dict[str, Any]]:
    historical = [
        point
        for point in contract.get("historical", [])
        if _is_number(point.get("year")) and _is_number(point.get("value"))
    ]
    if not historical or not trajectory:
        return []

    latest = max(historical, key=lambda point: point["year"])
    previous_year = int(latest["year"])
    previous_value = float(latest["value"])
    trajectory_by_year = {int(point["year"]): float(point["value"]) for point in trajectory}
    targets = []
    for target in sorted(contract.get("targets", []), key=lambda point: point.get("year", 0)):
        target_year = int(target["year"])
        if target_year <= previous_year or target_year not in trajectory_by_year:
            continue
        required_value = trajectory_by_year[target_year]
        annual_pace = (required_value - previous_value) / (target_year - previous_year)
        targets.append(
            {
                "year": target_year,
                "value": float(target["value"]),
                "type": "configured_reference",
                "requiredAnnualPacePp": round(annual_pace, 6),
            }
        )
        previous_year = target_year
        previous_value = required_value
    return targets


def _to_public_contract(contract: dict[str, Any]) -> dict[str, Any]:
    trajectory = build_reference_trajectory(contract)
    targets = build_reference_targets(contract, trajectory)
    return {
        "contractVersion": PUBLIC_CONTRACT_VERSION,
        "indicatorKey": contract["indicatorKey"],
        "strategy": contract["strategy"],
        "scenarioType": "maintenance",
        "status": contract["status"],
        "direction": contract["direction"],
        "targetValidationStatus": "configured_unvalidated",
        "sourcePeriod": contract.get("sourcePeriod"),
        "projectionPeriod": contract.get("projectionPeriod"),
        "targets": targets,
        "historical": contract.get("historical", []),
        "projected": contract.get("projected", []),
        "referenceTrajectory": trajectory,
        "summary": contract.get("summary", {}),
        "diagnostics": contract.get("diagnostics", {}),
        "qualityEvidence": contract.get("qualityEvidence", {}),
        "model": APPROVED_MODEL,
    }


def _validate_artifact_envelope(artifact: dict[str, Any], indicator_key: str) -> None:
    if artifact.get("mode") != "shadow" or artifact.get("productionDecision") is not False:
        raise ValueError(f"{indicator_key}: source is not an approved shadow artifact")
    if artifact.get("selectedShadowModel") != APPROVED_MODEL:
        raise ValueError(f"{indicator_key}: approved model must be {APPROVED_MODEL}")


def _validate_contract(
    contract: dict[str, Any], indicator_key: str, municipality: str
) -> None:
    if not municipality:
        raise ValueError(f"{indicator_key}: contract without municipality")
    if contract.get("indicatorKey") != indicator_key:
        raise ValueError(f"{indicator_key}: mismatched contract key")
    if contract.get("model") != APPROVED_MODEL:
        raise ValueError(f"{indicator_key}/{municipality}: invalid approved model")
    if contract.get("targetValidationStatus") != "configured_unvalidated":
        raise ValueError(
            f"{indicator_key}/{municipality}: invalid target validation status"
        )
    if contract.get("strategy") != "ratio_of_counts":
        raise ValueError(f"{indicator_key}/{municipality}: invalid strategy")


def _load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)
