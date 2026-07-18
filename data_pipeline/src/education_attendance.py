"""Canonical contract for the Education > Attendance and scenarios page."""

from __future__ import annotations

from math import isfinite
from statistics import quantiles
from typing import Any, Iterable


CONTRACT_VERSION = "education-attendance-v2"
AGE_INDICATORS = {
    "creche": {
        "title": "Atendimento em creche",
        "ageRange": "0 a 3 anos",
        "numeratorField": "mat_basico_0_3",
        "denominatorField": "pop_0_3",
        "reference": 60.0,
        "ages": (0, 3),
    },
    "pre_escola": {
        "title": "Atendimento na pré-escola",
        "ageRange": "4 a 5 anos",
        "numeratorField": "mat_infantil_pre",
        "denominatorField": "pop_4_5",
        "reference": 100.0,
        "ages": (4, 5),
    },
    "basico_6_17": {
        "title": "Atendimento na educação básica",
        "ageRange": "6 a 17 anos",
        "numeratorField": "mat_basico_6_17",
        "denominatorField": "pop_6_17",
        "reference": 100.0,
        "ages": (6, 17),
    },
    "basico_15_17": {
        "title": "Atendimento de adolescentes",
        "ageRange": "15 a 17 anos",
        "numeratorField": "mat_basico_15_17",
        "denominatorField": "pop_15_17",
        "reference": 85.0,
        "ages": (15, 17),
    },
    "infantil_0_5": {
        "title": "Atendimento da educação infantil",
        "ageRange": "0 a 5 anos",
        "numeratorField": "mat_basico_0_5",
        "denominatorField": "pop_0_5",
        "reference": None,
        "ages": (0, 5),
    },
    "obrigatoria_4_17": {
        "title": "Atendimento na escolaridade obrigatória",
        "ageRange": "4 a 17 anos",
        "numeratorField": "mat_basico_4_17",
        "denominatorField": "pop_4_17",
        "reference": None,
        "ages": (4, 17),
    },
    "escolar_6_14": {
        "title": "Atendimento escolar",
        "ageRange": "6 a 14 anos",
        "numeratorField": "mat_basico_6_14",
        "denominatorField": "pop_6_14",
        "reference": None,
        "ages": (6, 14),
    },
}

def build_education_attendance_payload(
    projections_payload: dict[str, Any],
    planning_payload: dict[str, Any],
    municipalities: Iterable[str],
) -> dict[str, Any]:
    """Build one fully interpreted, frontend-ready public contract."""
    municipality_names = tuple(str(name) for name in municipalities)
    projections = projections_payload.get("municipios", {})
    planning = planning_payload.get("municipios", {})
    thresholds = {
        key: _denominator_threshold(
            projections.get(name, {}).get(key, {}) for name in municipality_names
        )
        for key in AGE_INDICATORS
    }
    overall_threshold = _planning_denominator_threshold(
        planning.get(name, {}).get("basico_integral", {})
        for name in municipality_names
    )

    municipality_payloads = {}
    for municipality in municipality_names:
        age_contracts = {
            key: _age_contract(
                key,
                projections.get(municipality, {}).get(key, {}),
                thresholds[key],
            )
            for key in AGE_INDICATORS
        }
        overall = _overall_integral_contract(
            planning.get(municipality, {}).get("basico_integral", {}),
            overall_threshold,
        )
        municipality_payloads[municipality] = {
            "contractVersion": CONTRACT_VERSION,
            "municipality": municipality,
            "ageCoverage": age_contracts,
            "integral": {
                "overall": overall,
            },
        }

    return {
        "contractVersion": CONTRACT_VERSION,
        "municipalityCount": len(municipality_names),
        "smallDenominatorRule": {
            "method": "latest_valid_denominator_p25_by_indicator",
            "comparison": "strictly_below_threshold",
            "thresholds": {**thresholds, "basico_integral": overall_threshold},
        },
        "sources": {
            "enrolment": "Censo Escolar da Educação Básica (INEP), por município da escola.",
            "historicalPopulation": "Base populacional municipal por idade simples utilizada pelo painel.",
            "populationModel": (
                "População municipal do último ano disponível aplicada à variação da faixa etária "
                "na projeção do Rio Grande do Sul, revisão 2024."
            ),
        },
        "municipios": municipality_payloads,
    }


def _age_contract(key: str, projection: dict[str, Any], threshold: float | None) -> dict[str, Any]:
    metadata = AGE_INDICATORS[key]
    historical = []
    years = projection.get("historical_years", [])
    numerators = projection.get("historical_numerator", [])
    denominators = projection.get("historical_population", [])
    raw_values = projection.get("historical_percent_raw", [])
    for index, year in enumerate(years):
        denominator = _number_at(denominators, index)
        historical.append(
            {
                "year": int(year),
                "numerator": _number_at(numerators, index),
                "denominator": denominator,
                "rawValue": _number_at(raw_values, index) if denominator and denominator > 0 else None,
            }
        )
    observed = historical[-1] if historical else None
    projected = [
        {
            "year": int(year),
            "numerator": _number_at(projection.get("projected_numerator", []), index),
            "denominator": _number_at(projection.get("projected_population", []), index),
            "rawValue": _number_at(projection.get("projected_percent_raw", []), index),
        }
        for index, year in enumerate(projection.get("years", []))
    ]
    population_model = _population_model(projection)
    diagnostics = _diagnostics(observed, threshold, projection.get("warnings", []))
    return {
        "contractVersion": CONTRACT_VERSION,
        "indicatorKey": key,
        "indicatorType": "mandatory_age_summary" if metadata["reference"] is None else "age_coverage_proxy",
        "kind": "age_coverage",
        "title": metadata["title"],
        "ageRange": metadata["ageRange"],
        "ageRangeDetails": {
            "start": metadata["ages"][0],
            "end": metadata["ages"][1],
            "label": metadata["ageRange"],
        },
        "territorialBasis": {
            "numerator": "município da escola",
            "denominator": "população residente municipal",
            "numeratorCode": "municipality_of_school",
            "denominatorCode": "municipal_population_reference",
        },
        "fields": {
            "numerator": metadata["numeratorField"],
            "denominator": metadata["denominatorField"],
        },
        "observed": observed,
        "historical": historical,
        "reference": (
            {
                "value": metadata["reference"],
                "unit": "percent",
                "validationStatus": "configured_unvalidated",
                "year": 2036,
                "direction": "at_least",
            }
            if metadata["reference"] is not None
            else None
        ),
        "populationModel": population_model,
        "scenario": {
            "type": "trend_scenario",
            "kind": "existing_projection",
            "method": projection.get("method"),
            "projected": projected,
            "status": "available" if projected else "unavailable",
            "historicalEndYear": observed.get("year") if observed else None,
            "horizonYear": 2036,
            "quality": _quality(projection.get("quality"), diagnostics),
        },
        "historicalChangePercentagePoints": _historical_change(historical),
        "diagnostics": diagnostics,
        "presentation": _age_presentation(metadata, observed, diagnostics, population_model),
    }


def _overall_integral_contract(contract: dict[str, Any], threshold: float | None) -> dict[str, Any]:
    historical = [
        {
            "year": int(point["year"]),
            "numerator": _number(point.get("numerator")),
            "denominator": _number(point.get("denominator")),
            "rawValue": _valid_ratio_value(point),
        }
        for point in contract.get("historical", [])
    ]
    observed = historical[-1] if historical else None
    diagnostics = _diagnostics(observed, threshold, contract.get("diagnostics", {}).get("warnings", []))
    reference_trajectory = [
        {
            "year": int(point["year"]),
            "numerator": None,
            "denominator": None,
            "rawValue": _number(point.get("value")),
            "displayValue": _number(point.get("value")),
        }
        for point in contract.get("referenceTrajectory", [])
        if observed is not None and int(point.get("year", 0)) > int(observed["year"])
    ]
    status = "available" if reference_trajectory else "unavailable"
    return {
        "contractVersion": CONTRACT_VERSION,
        "indicatorKey": "basico_integral",
        "indicatorType": "integral_enrollment_share",
        "kind": "integral_coverage",
        "title": "Participação da educação básica em tempo integral",
        "territorialBasis": {
            "numerator": "município da escola",
            "denominator": "município da escola",
            "numeratorCode": "municipality_of_school",
            "denominatorCode": "public_enrollments",
        },
        "fields": {"numerator": "mat_basico_integral", "denominator": "mat_basico"},
        "observed": observed,
        "historical": historical,
        "reference": {
            "targets": contract.get("targets", []),
            "validationStatus": contract.get("targetValidationStatus", "configured_unvalidated"),
        },
        "scenario": {
            "type": "pne_reference_trajectory",
            "method": "configured_pne_reference_trajectory",
            "status": status,
            "projected": reference_trajectory,
            "historicalEndYear": observed.get("year") if observed else None,
            "horizonYear": reference_trajectory[-1]["year"] if reference_trajectory else None,
        },
        "diagnostics": diagnostics,
        "presentation": {
            "headline": _headline(observed),
            "statusLabel": _status_label(diagnostics),
            "interpretationStatus": _interpretation_status(diagnostics),
            "insightLines": [
                "O percentual compara matrículas públicas em tempo integral com o total de matrículas públicas.",
                "A trajetória futura representa as referências normativas do PNE e não uma previsão observacional.",
            ],
        },
    }


def _population_model(projection: dict[str, Any]) -> dict[str, Any] | None:
    populations = projection.get("projected_population", [])
    years = projection.get("years", [])
    if not populations or not years:
        return None
    base_value = _last_valid(projection.get("historical_population", []))
    modeled_value = _number(populations[-1])
    change = modeled_value - base_value if modeled_value is not None and base_value is not None else None
    change_pct = change / base_value * 100 if change is not None and base_value and base_value > 0 else None
    return {
        "status": "modeled",
        "modelStatus": "modeled_estimate",
        "baseYear": projection.get("base_year"),
        "horizonYear": int(years[-1]),
        "baseValue": base_value,
        "modeledValue": modeled_value,
        "changeAbsolute": round(change, 1) if change is not None else None,
        "changePercent": round(change_pct, 2) if change_pct is not None else None,
        "absoluteChange": round(change, 1) if change is not None else None,
        "percentageChange": round(change_pct, 2) if change_pct is not None else None,
        "method": "municipal_base_scaled_by_rs_age_group_change",
        "methodCode": "municipal_base_times_rs_age_factor",
        "label": "População modelada para 2036",
    }


def _diagnostics(observed: dict[str, Any] | None, threshold: float | None, warnings: Any) -> dict[str, Any]:
    denominator = _number(observed.get("denominator")) if observed else None
    value = _number(observed.get("rawValue")) if observed else None
    invalid = denominator is None or denominator <= 0
    small = not invalid and threshold is not None and denominator < threshold
    messages = [str(item) for item in (warnings or []) if item]
    if invalid:
        messages.insert(0, "Denominador ausente ou não positivo; percentual não calculável.")
    if small:
        messages.insert(0, "Denominador abaixo do primeiro quartil municipal do indicador; interprete oscilações com cautela.")
    if value is not None and value > 100:
        messages.insert(0, "O valor acima de 100% é preservado: matrículas por município da escola e população residente têm bases territoriais distintas.")
    return {
        "invalidDenominator": invalid,
        "smallDenominator": small,
        "smallDenominatorThreshold": threshold,
        "above100": value is not None and value > 100,
        "numeratorAboveDenominator": value is not None and value > 100,
        "warnings": messages,
    }


def _age_presentation(metadata: dict[str, Any], observed: dict[str, Any] | None, diagnostics: dict[str, Any], population_model: dict[str, Any] | None) -> dict[str, Any]:
    lines = [f"O indicador compara matrículas no município da escola com a população residente de {metadata['ageRange']}."]
    if population_model and population_model.get("changePercent") is not None:
        change = population_model["changePercent"]
        direction = "queda" if change < -0.05 else "alta" if change > 0.05 else "estabilidade"
        lines.append(f"A população da faixa é modelada em {direction} de {abs(change):.1f}% até 2036.")
    return {
        "headline": _headline(observed),
        "statusLabel": _status_label(diagnostics),
        "interpretationStatus": _interpretation_status(diagnostics),
        "insightLines": lines,
    }


def _denominator_threshold(projections: Iterable[dict[str, Any]]) -> float | None:
    return _p25(_last_valid(item.get("historical_population", [])) for item in projections)


def _planning_denominator_threshold(contracts: Iterable[dict[str, Any]]) -> float | None:
    return _p25(_number((item.get("historical") or [{}])[-1].get("denominator")) if item.get("historical") else None for item in contracts)


def _p25(values: Iterable[float | None]) -> float | None:
    valid = sorted(float(value) for value in values if value is not None and value > 0)
    if not valid:
        return None
    if len(valid) == 1:
        return valid[0]
    return round(float(quantiles(valid, n=4, method="inclusive")[0]), 2)


def _valid_ratio_value(point: dict[str, Any]) -> float | None:
    denominator = _number(point.get("denominator"))
    return _number(point.get("value")) if denominator is not None and denominator > 0 else None


def _headline(observed: dict[str, Any] | None) -> str:
    value = _number(observed.get("rawValue")) if observed else None
    return _format_percentage(value) if value is not None else "Não calculável"


def _format_percentage(value: float) -> str:
    return f"{value:.1f}".replace(".", ",") + "%"


def _status_label(diagnostics: dict[str, Any]) -> str:
    if diagnostics.get("invalidDenominator"):
        return "Dado não calculável"
    if diagnostics.get("above100"):
        return "Acima de 100% — bases territoriais distintas"
    if diagnostics.get("smallDenominator"):
        return "Base reduzida — interpretar com cautela"
    return "Dado disponível"


def _interpretation_status(diagnostics: dict[str, Any]) -> str:
    if diagnostics.get("invalidDenominator"):
        return "unavailable"
    if diagnostics.get("above100"):
        return "above_population_reference"
    if diagnostics.get("smallDenominator"):
        return "available_with_warning"
    return "available"


def _historical_change(points: list[dict[str, Any]]) -> float | None:
    values = [_number(point.get("rawValue")) for point in points]
    valid = [value for value in values if value is not None]
    return round(valid[-1] - valid[0], 2) if len(valid) >= 2 else None


def _quality(value: Any, diagnostics: dict[str, Any]) -> str:
    if diagnostics.get("invalidDenominator"):
        return "insuficiente"
    if diagnostics.get("smallDenominator"):
        return "baixa"
    normalised = str(value or "media").lower()
    return normalised if normalised in {"alta", "media", "baixa", "insuficiente"} else "media"


def _number(value: Any) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if isfinite(parsed) else None


def _number_at(values: list[Any], index: int) -> float | None:
    return _number(values[index]) if index < len(values) else None


def _last_valid(values: Iterable[Any]) -> float | None:
    valid = [_number(value) for value in values]
    return next((value for value in reversed(valid) if value is not None), None)
