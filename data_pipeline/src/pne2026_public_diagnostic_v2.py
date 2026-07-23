from __future__ import annotations

import json
import math
import statistics
from collections import Counter
from copy import deepcopy
from functools import lru_cache
from pathlib import Path
from typing import Any, Iterable, Mapping, MutableMapping

from .municipal_diagnostic import (
    _public_number,
    _public_similar_municipalities,
    _public_state_comparison,
    _public_statewide_position,
    _public_trajectory,
)


CATALOG_PATH = (
    Path(__file__).resolve().parent
    / "data"
    / "pne2026_diagnostic_presentation_v2.json"
)
CATALOG_VERSION = "pne2026-diagnostic-presentation-v2"
PUBLIC_VERSION = "pne2026-public-diagnostic-v2"
PUBLIC_SCHEMA_VERSION = "municipal-diagnostic-v2"
EXPECTED_RELATIONSHIP_TYPES = {"direct", "partial_component", "contextual_proxy"}
EXPECTED_ESSENTIALS = [
    "creche",
    "pre_escola",
    "basico_6_17",
    "basico_integral",
    "idade_regular_nono",
    "saeb_matematica_anos_finais",
    "medio_concluido_18_29",
    "adequacao_af",
    "salas_acessiveis",
]


def _goal_sort_key(goal_id: str) -> tuple[int, str]:
    number, _, letter = str(goal_id).partition(".")
    return (int(number), letter)


def _finite_number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    return numeric if math.isfinite(numeric) else None


def _integer(value: Any) -> int | None:
    numeric = _finite_number(value)
    if numeric is None or not numeric.is_integer():
        return None
    return int(numeric)


def _merge_usage(catalog: Mapping[str, Any], result: Mapping[str, Any]) -> dict[str, bool]:
    usage = dict(catalog["defaultUsage"])
    usage.update(result.get("usage") or {})
    return {key: bool(value) for key, value in usage.items()}


def _validate_catalog(catalog: Mapping[str, Any]) -> None:
    if catalog.get("catalogVersion") != CATALOG_VERSION:
        raise ValueError("Versão inesperada do catálogo canônico de apresentação.")
    if catalog.get("schemaVersion") != PUBLIC_SCHEMA_VERSION:
        raise ValueError("Schema público inesperado no catálogo canônico de apresentação.")

    results = list(catalog.get("results") or [])
    if len(results) != 34:
        raise ValueError("O catálogo canônico deve autorizar exatamente 34 resultados.")

    pairs = [(item.get("goalId"), item.get("indicatorId")) for item in results]
    if len(set(pairs)) != 34 or len({indicator_id for _, indicator_id in pairs}) != 34:
        raise ValueError("Os 34 pares e indicatorIds do catálogo devem ser únicos.")

    if [item.get("resultOrder") for item in results] != list(range(1, 35)):
        raise ValueError("resultOrder deve ser contínuo de 1 a 34.")
    sorted_pairs = sorted(pairs, key=lambda pair: (_goal_sort_key(pair[0]), results[pairs.index(pair)]["resultOrder"]))
    if pairs != sorted_pairs:
        raise ValueError("Os resultados devem seguir a ordem numérica canônica das metas.")

    essentials = sorted(
        (item for item in results if item.get("tier") == "essential"),
        key=lambda item: item["priorityOrder"],
    )
    if [item["indicatorId"] for item in essentials] != EXPECTED_ESSENTIALS:
        raise ValueError("A seleção e a ordem dos nove essenciais não são canônicas.")
    if sum(item.get("tier") == "complementary" for item in results) != 25:
        raise ValueError("O catálogo deve conter 25 resultados complementares.")

    themes = list(catalog.get("themes") or [])
    theme_ids = {theme.get("id") for theme in themes}
    if len(themes) != 8 or len(theme_ids) != 8:
        raise ValueError("O catálogo deve conter oito temas públicos estáveis.")
    if {item.get("themeId") for item in results} != theme_ids:
        raise ValueError("Todo tema e todo resultado devem estar ligados entre si.")

    relationship_types = {item.get("relationshipType") for item in results}
    if relationship_types != EXPECTED_RELATIONSHIP_TYPES:
        raise ValueError("Os três tipos canônicos de vínculo devem estar presentes.")
    if set(catalog.get("relationshipReadings") or {}) != EXPECTED_RELATIONSHIP_TYPES:
        raise ValueError("Todo tipo de vínculo precisa de leitura pública.")

    contextual_pairs = {
        (item["goalId"], item["indicatorId"])
        for item in results
        if item["relationshipType"] == "contextual_proxy"
    }
    if contextual_pairs != {
        ("4.a", "basico_15_17"),
        ("11.b", "fundamental_concluido_18_mais"),
    }:
        raise ValueError("Os dois proxies contextuais não correspondem à homologação.")

    source_ids = {source["id"] for source in catalog.get("sources") or []}
    referenced_source_ids = {
        source_id for item in results for source_id in item.get("sourceIds") or []
    }
    if not referenced_source_ids.issubset(source_ids):
        raise ValueError("Um resultado referencia fonte ausente do registro canônico.")

    blocker_ids = {
        indicator_id
        for issue in catalog.get("blockingIssues") or []
        for indicator_id in issue.get("indicatorIds") or []
    }
    missing_source_ids = {
        item["indicatorId"] for item in results if not item.get("sourceIds")
    }
    if missing_source_ids != blocker_ids:
        raise ValueError("Todo resultado sem fonte deve possuir bloqueio metodológico explícito.")

    policy_ids = set(catalog.get("valuePolicies") or {})
    classification_ids = set(catalog.get("classificationPolicies") or {})
    for item in results:
        if item.get("valuePolicy") not in policy_ids:
            raise ValueError(f"Política de valor ausente: {item.get('indicatorId')}")
        if item.get("classificationPolicy") not in classification_ids:
            raise ValueError(f"Política de classificação ausente: {item.get('indicatorId')}")


@lru_cache(maxsize=1)
def _cached_catalog() -> dict[str, Any]:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    _validate_catalog(catalog)
    return catalog


def load_pne2026_diagnostic_presentation_catalog() -> dict[str, Any]:
    """Return a defensive copy of the canonical presentation catalog."""

    return deepcopy(_cached_catalog())


def _public_result_definition(
    catalog: Mapping[str, Any], definition: Mapping[str, Any]
) -> dict[str, Any]:
    payload = {
        key: deepcopy(definition[key])
        for key in (
            "resultOrder",
            "goalId",
            "goalTitle",
            "indicatorId",
            "publicName",
            "themeId",
            "tier",
            "priorityOrder",
            "relationshipType",
            "classificationPolicy",
            "valuePolicy",
            "direction",
            "indicatorReference",
            "finalReference",
            "legalGoal",
            "sourceIds",
        )
        if key in definition
    }
    payload["relationshipReading"] = catalog["relationshipReadings"][
        definition["relationshipType"]
    ]
    payload["usage"] = _merge_usage(catalog, definition)
    methodology = (catalog.get("methodologyOverrides") or {}).get(
        definition["indicatorId"]
    )
    if methodology:
        payload["methodology"] = deepcopy(methodology)
    return payload


def apply_pne2026_diagnostic_presentation(
    categories: MutableMapping[str, MutableMapping[str, Any]],
) -> None:
    """Attach canonical goal/presentation metadata to the real PNE category catalog."""

    catalog = _cached_catalog()
    definitions = {item["indicatorId"]: item for item in catalog["results"]}
    for category in categories.values():
        for item in category.get("items") or []:
            definition = definitions.get(item.get("key"))
            if definition is None:
                continue
            item["goalId"] = definition["goalId"]
            item["diagnosticPresentation"] = _public_result_definition(
                catalog, definition
            )


def _technical_indicator_index(
    diagnostic_contract: Mapping[str, Any],
) -> dict[str, Mapping[str, Any]]:
    return {
        item["indicatorId"]: item
        for item in diagnostic_contract.get("indicators") or []
        if item.get("indicatorId")
    }


def _pne_indicator_index(pne_cycle_payload: Mapping[str, Any]) -> Mapping[str, Any]:
    if isinstance(pne_cycle_payload.get("indicadores"), Mapping):
        return pne_cycle_payload["indicadores"]
    return pne_cycle_payload


def _classification_from_pne(
    observed: Mapping[str, Any], allowed: set[str]
) -> str | None:
    """Translate the PNE public attained flag without recomputing the result."""

    attained = observed.get("atingida")
    if attained is True and "maintain" in allowed:
        return "maintain"
    if attained is False and "advance" in allowed:
        return "advance"
    return None


def _indicator_reference_from_pne(
    definition: Mapping[str, Any],
    observed: Mapping[str, Any],
    technical: Mapping[str, Any] | None,
) -> dict[str, Any]:
    reference = deepcopy(definition["indicatorReference"])
    configured = (technical or {}).get("configuredReference") or {}
    value = _finite_number(configured.get("value"))
    if value is None:
        value = _finite_number(observed.get("meta"))
    year = _integer(configured.get("year"))
    direction = configured.get("direction") or observed.get("direction")
    if value is not None:
        reference["value"] = value
    if year is not None:
        reference["year"] = year
    if direction:
        reference["direction"] = direction
    for key in ("label", "kind", "validationStatus"):
        if configured.get(key) is not None:
            reference[key] = deepcopy(configured[key])
    return reference


def _source_from_pne(technical: Mapping[str, Any] | None) -> dict[str, Any]:
    source = (technical or {}).get("source") or {}
    return {
        key: deepcopy(source[key])
        for key in ("sourceIds", "labels", "periodicity", "latestYear")
        if source.get(key) is not None
    }


def _public_display_value(value: float, unit: str) -> str:
    formatted = _public_number(value)
    if unit == "percent":
        return f"{formatted}%"
    if unit == "years":
        return f"{formatted} anos"
    return formatted


def _public_trajectory_v2(
    technical: Mapping[str, Any],
) -> dict[str, Any] | None:
    inherited = _public_trajectory(technical)
    if inherited is not None:
        return {
            key: deepcopy(inherited[key])
            for key in (
                "historicalReading",
                "estimatedAchievementYear",
                "achievementReading",
            )
            if inherited.get(key) is not None
        }

    trajectory = technical.get("trajectory") or {}
    pace = _finite_number(trajectory.get("observedFavorableAnnualPace"))
    history_point_count = _integer(trajectory.get("historyPointCount")) or 0
    payload: dict[str, Any] = {}
    if trajectory.get("status") == "available" and pace is not None and history_point_count >= 2:
        if pace > 1e-9:
            payload["historicalReading"] = "O resultado melhorou nos últimos anos."
        elif pace < -1e-9:
            payload["historicalReading"] = "O resultado recuou no período recente."
        else:
            payload["historicalReading"] = (
                "O resultado permaneceu próximo do mesmo nível."
            )

    estimated_year = _integer(trajectory.get("estimatedAchievementYear"))
    base_year = _integer(trajectory.get("baseYear"))
    if (
        trajectory.get("status") == "available"
        and estimated_year is not None
        and (base_year is None or estimated_year >= base_year)
    ):
        payload["estimatedAchievementYear"] = estimated_year
        payload["achievementReading"] = (
            "Se a evolução recente continuar, o município pode alcançar o valor "
            f"previsto em {estimated_year}."
        )
    return payload or None


def _optional_evidence(
    definition: Mapping[str, Any], technical: Mapping[str, Any] | None
) -> dict[str, Any]:
    if technical is None:
        return {}
    usage = definition["usage"]
    payload: dict[str, Any] = {}

    if usage["stateComparison"]:
        state_comparison = _public_state_comparison(technical)
        if state_comparison is not None:
            state = state_comparison["state"]
            municipality_value = state_comparison["municipalityValue"]
            state_value = state_comparison["stateValue"]
            unit = str(technical.get("unit") or "")
            reading = {
                "above": (
                    "O resultado do município está acima do observado no Rio "
                    "Grande do Sul."
                ),
                "near": (
                    "O resultado do município está próximo ao observado no Rio "
                    "Grande do Sul."
                ),
                "below": (
                    "O resultado do município está abaixo do observado no Rio "
                    "Grande do Sul."
                ),
            }[state]
            payload["stateComparison"] = {
                "state": state,
                "municipalityValue": municipality_value,
                "stateValue": state_value,
                "year": state_comparison["year"],
                "unit": unit,
                "difference": state_comparison["favorableDifference"],
                "favorableDifference": state_comparison["favorableDifference"],
                "reading": reading,
                "valueReading": (
                    "O município apresenta "
                    f"{_public_display_value(municipality_value, unit)}, enquanto o "
                    "Rio Grande do Sul apresenta "
                    f"{_public_display_value(state_value, unit)}."
                ),
            }

    if usage["statewidePosition"]:
        statewide_position = _public_statewide_position(technical)
        if statewide_position is not None:
            payload["statewidePosition"] = {
                "reading": statewide_position["reading"]
            }

    if usage["similarMunicipalities"]:
        similar = _public_similar_municipalities(technical)
        if similar is not None:
            payload["similarMunicipalities"] = {
                "title": similar["title"],
                "year": _integer(
                    (technical.get("similarMunicipalities") or {}).get("year")
                ),
                "median": similar["median"],
                "unit": str(technical.get("unit") or ""),
                "reading": similar["reading"],
            }

    if usage["trajectory"]:
        trajectory = _public_trajectory_v2(technical)
        if trajectory is not None:
            payload["trajectory"] = trajectory
    return payload


def build_pne2026_public_diagnostic_v2(
    diagnostic_contract: Mapping[str, Any],
    pne_cycle_payload: Mapping[str, Any],
) -> dict[str, Any]:
    """Project the existing municipal PNE output into the non-materialized v2."""

    catalog = _cached_catalog()
    definitions = [
        _public_result_definition(catalog, item) for item in catalog["results"]
    ]
    policies = catalog["valuePolicies"]
    classification_policies = catalog["classificationPolicies"]
    pne_indicators = _pne_indicator_index(pne_cycle_payload)
    technical_indicators = _technical_indicator_index(diagnostic_contract)

    results: list[dict[str, Any]] = []
    for definition in definitions:
        observed = pne_indicators.get(definition["indicatorId"]) or {}
        value = _finite_number(observed.get("end_value"))
        year = _integer(observed.get("end_year"))
        if observed.get("available") is not True or value is None or year is None:
            continue
        technical = technical_indicators.get(definition["indicatorId"])
        source = _source_from_pne(technical)
        source_ids = list(source.get("sourceIds") or definition["sourceIds"])
        indicator_reference = _indicator_reference_from_pne(
            definition, observed, technical
        )
        allowed = set(
            classification_policies[definition["classificationPolicy"]]["allowed"]
        )
        classification = _classification_from_pne(observed, allowed)
        display_value = _finite_number((technical or {}).get("displayValue"))
        remaining_gap = _finite_number((technical or {}).get("remainingGap"))
        favorable_difference = _finite_number(
            (technical or {}).get("favorableDistance")
        )
        display = observed.get("display") or {}
        direction = observed.get("direction") or (technical or {}).get(
            "direction"
        ) or definition["direction"]
        unit = (technical or {}).get("unit") or "percent"
        result = {
            "resultOrder": definition["resultOrder"],
            "goalId": definition["goalId"],
            "indicatorId": definition["indicatorId"],
            "themeId": definition["themeId"],
            "tier": definition["tier"],
            "priorityOrder": definition["priorityOrder"],
            "publicName": (technical or {}).get("title")
            or definition["publicName"],
            "publicDescription": definition["relationshipReading"],
            "relationshipType": definition["relationshipType"],
            "relationshipReading": definition["relationshipReading"],
            "direction": direction,
            "current": {
                "value": value,
                "displayValue": display_value if display_value is not None else value,
                "year": year,
                "unit": unit,
            },
            "indicatorReference": indicator_reference,
            "legalGoal": deepcopy(definition["legalGoal"]),
            "classification": classification,
            "remainingGap": remaining_gap,
            "favorableDifference": favorable_difference,
            "distance": _finite_number(observed.get("distance")),
            "publicReading": display.get("interpretation"),
            "status": display.get("status"),
            "valuePolicy": {
                "id": definition["valuePolicy"],
                "publicExplanation": policies[definition["valuePolicy"]][
                    "publicExplanation"
                ],
            },
            "sourceIds": source_ids,
        }
        if display.get("end_value") is not None:
            result["current"]["displayText"] = display["end_value"]
        if source:
            result["source"] = source
        if "finalReference" in definition:
            result["finalReference"] = deepcopy(definition["finalReference"])
        if "methodology" in definition:
            result["methodology"] = deepcopy(definition["methodology"])
        result.update(
            _optional_evidence(
                definition, technical
            )
        )
        results.append(result)

    grouped_goals: list[dict[str, Any]] = []
    definitions_by_goal = {
        definition["goalId"]: definition for definition in definitions
    }
    for goal_id in sorted({result["goalId"] for result in results}, key=_goal_sort_key):
        goal_results = [result for result in results if result["goalId"] == goal_id]
        grouped_goals.append(
            {
                "goalId": goal_id,
                "title": definitions_by_goal[goal_id]["goalTitle"],
                "order": len(grouped_goals) + 1,
                "results": goal_results,
            }
        )

    used_source_ids = {source_id for result in results for source_id in result["sourceIds"]}
    source_registry = {
        source["id"]: deepcopy(source) for source in catalog["sources"]
    }
    for source in (diagnostic_contract.get("pne2026PublicDiagnostic") or {}).get(
        "sources"
    ) or []:
        if source.get("id"):
            source_registry.setdefault(source["id"], deepcopy(source))
    for result in results:
        inherited = result.get("source") or {}
        labels = inherited.get("labels") or []
        for index, source_id in enumerate(inherited.get("sourceIds") or []):
            if source_id in source_registry:
                continue
            source_registry[source_id] = {
                "id": source_id,
                "publicTitle": labels[index] if index < len(labels) else source_id,
            }
    sources = [source_registry[source_id] for source_id in sorted(used_source_ids)]
    relationship_counts = Counter(result["relationshipType"] for result in results)
    classification_counts = Counter(result["classification"] for result in results)
    summary = {
        "authorizedResultCount": len(definitions),
        "availableResultCount": len(results),
        "unavailableResultCount": len(definitions) - len(results),
        "essentialAvailableCount": sum(
            result["tier"] == "essential" for result in results
        ),
        "complementaryAvailableCount": sum(
            result["tier"] == "complementary" for result in results
        ),
        "advanceCount": classification_counts["advance"],
        "maintainCount": classification_counts["maintain"],
        "unclassifiedCount": classification_counts[None],
        "relationshipCounts": {
            relationship_type: relationship_counts[relationship_type]
            for relationship_type in sorted(EXPECTED_RELATIONSHIP_TYPES)
        },
        "stateComparisonCount": sum("stateComparison" in result for result in results),
        "statewidePositionCount": sum("statewidePosition" in result for result in results),
        "similarMunicipalitiesCount": sum(
            "similarMunicipalities" in result for result in results
        ),
        "trajectoryCount": sum("trajectory" in result for result in results),
        "estimatedAchievementYearCount": sum(
            (result.get("trajectory") or {}).get("estimatedAchievementYear") is not None
            for result in results
        ),
        "stateAboveOrNearCount": sum(
            (result.get("stateComparison") or {}).get("state") in {"above", "near"}
            for result in results
        ),
        "stateBelowCount": sum(
            (result.get("stateComparison") or {}).get("state") == "below"
            for result in results
        ),
    }

    return {
        "version": PUBLIC_VERSION,
        "schemaVersion": PUBLIC_SCHEMA_VERSION,
        "cycleId": catalog["cycleId"],
        "presentationCatalogVersion": catalog["catalogVersion"],
        "publicationReady": True,
        "municipalityId": diagnostic_contract.get("municipalityId"),
        "municipalityName": diagnostic_contract.get("municipalityName"),
        "scope": {
            "resultPairs": [
                {
                    "goalId": definition["goalId"],
                    "indicatorId": definition["indicatorId"],
                }
                for definition in definitions
            ],
            "goalIds": list(
                dict.fromkeys(definition["goalId"] for definition in definitions)
            ),
            "indicatorIds": [
                definition["indicatorId"] for definition in definitions
            ],
            "essentialIndicatorIds": [
                definition["indicatorId"]
                for definition in sorted(
                    (
                        definition
                        for definition in definitions
                        if definition["tier"] == "essential"
                    ),
                    key=lambda item: item["priorityOrder"],
                )
            ],
            "complementaryIndicatorIds": [
                definition["indicatorId"]
                for definition in definitions
                if definition["tier"] == "complementary"
            ],
            "relationshipTypes": sorted(EXPECTED_RELATIONSHIP_TYPES),
        },
        "presentation": {
            "themes": deepcopy(catalog["themes"]),
            "resultDefinitions": definitions,
        },
        "summary": summary,
        "goals": grouped_goals,
        "sources": sources,
    }


def _flatten_results(contract: Mapping[str, Any]) -> list[Mapping[str, Any]]:
    return [result for goal in contract.get("goals") or [] for result in goal["results"]]


def audit_pne2026_public_diagnostic_v2(
    municipality_payloads: Iterable[
        tuple[Mapping[str, Any], Mapping[str, Any]]
    ],
) -> dict[str, Any]:
    """Audit every municipality in memory without writing public contracts."""

    catalog = _cached_catalog()
    definition_ids = [item["indicatorId"] for item in catalog["results"]]
    definition_id_set = set(definition_ids)
    historical_source_blocker_ids = {
        item["indicatorId"] for item in catalog["results"] if not item["sourceIds"]
    }
    allowed_classifications = {
        item["indicatorId"]: set(
            catalog["classificationPolicies"][item["classificationPolicy"]]["allowed"]
        )
        for item in catalog["results"]
    }
    available_per_municipality: list[int] = []
    v2_occurrences = Counter()
    pne_occurrences = Counter()
    classifications = Counter()
    directions = Counter()
    relationships = Counter()
    pne_values_above_100 = Counter()
    v2_values_above_100 = Counter()
    pne_negative_values = Counter()
    v2_negative_values = Counter()
    missing_in_v2 = Counter()
    unexpected_in_v2 = Counter()
    value_differences = Counter()
    year_differences = Counter()
    unit_differences = Counter()
    classification_differences = Counter()
    source_differences = Counter()
    optional_counts = Counter()
    subsequente_v1 = 0
    duplicate_result_count = 0
    out_of_catalog_result_count = 0
    municipality_count = 0

    for diagnostic_contract, pne_cycle_payload in municipality_payloads:
        municipality_count += 1
        public_v2 = build_pne2026_public_diagnostic_v2(
            diagnostic_contract, pne_cycle_payload
        )
        v2_results = _flatten_results(public_v2)
        v2_by_id = {result["indicatorId"]: result for result in v2_results}
        duplicate_result_count += len(v2_results) - len(v2_by_id)
        out_of_catalog_result_count += sum(
            result["indicatorId"] not in definition_id_set for result in v2_results
        )
        available_per_municipality.append(len(v2_results))
        pne_indicators = _pne_indicator_index(pne_cycle_payload)
        technical_indicators = _technical_indicator_index(diagnostic_contract)
        pne_available: dict[str, tuple[float, int]] = {}
        for indicator_id in definition_ids:
            observed = pne_indicators.get(indicator_id) or {}
            value = _finite_number(observed.get("end_value"))
            year = _integer(observed.get("end_year"))
            if observed.get("available") is True and value is not None and year is not None:
                pne_available[indicator_id] = (value, year)
                pne_occurrences[indicator_id] += 1
                if value > 100:
                    pne_values_above_100[indicator_id] += 1
                if value < 0:
                    pne_negative_values[indicator_id] += 1

        for indicator_id, result in v2_by_id.items():
            v2_occurrences[indicator_id] += 1
            classifications[result.get("classification")] += 1
            directions[result["indicatorReference"].get("direction", result.get("direction")) or result.get("direction")] += 1
            relationships[result["relationshipType"]] += 1
            value = result["current"]["value"]
            if value > 100:
                v2_values_above_100[indicator_id] += 1
            if value < 0:
                v2_negative_values[indicator_id] += 1
            if indicator_id not in pne_available:
                unexpected_in_v2[indicator_id] += 1
            else:
                pne_value, pne_year = pne_available[indicator_id]
                if abs(value - pne_value) > 1e-9:
                    value_differences[indicator_id] += 1
                if result["current"].get("year") != pne_year:
                    year_differences[indicator_id] += 1

                technical = technical_indicators.get(indicator_id) or {}
                expected_unit = technical.get("unit") or "percent"
                if result["current"].get("unit") != expected_unit:
                    unit_differences[indicator_id] += 1
                expected_classification = _classification_from_pne(
                    pne_indicators[indicator_id],
                    allowed_classifications[indicator_id],
                )
                if result.get("classification") != expected_classification:
                    classification_differences[indicator_id] += 1
                expected_source = _source_from_pne(technical)
                expected_source_ids = list(
                    expected_source.get("sourceIds")
                    or next(
                        item["sourceIds"]
                        for item in catalog["results"]
                        if item["indicatorId"] == indicator_id
                    )
                )
                if result.get("sourceIds") != expected_source_ids or (
                    expected_source and result.get("source") != expected_source
                ):
                    source_differences[indicator_id] += 1
            for field in (
                "stateComparison",
                "statewidePosition",
                "similarMunicipalities",
                "trajectory",
            ):
                optional_counts[field] += field in result
            optional_counts["estimatedAchievementYear"] += (
                (result.get("trajectory") or {}).get("estimatedAchievementYear")
                is not None
            )

        for indicator_id in set(pne_available) - set(v2_by_id):
            missing_in_v2[indicator_id] += 1

        current_v1 = diagnostic_contract.get("pne2026PublicDiagnostic") or {}
        if any(
            result.get("indicatorId") == "subsequente_expansao"
            for result in _flatten_results(current_v1)
        ):
            subsequente_v1 += 1

    sorted_distribution = Counter(available_per_municipality)
    divergence_counters = (
        missing_in_v2,
        unexpected_in_v2,
        value_differences,
        year_differences,
        unit_differences,
        classification_differences,
        source_differences,
    )
    publication_ready = (
        not any(divergence_counters)
        and duplicate_result_count == 0
        and out_of_catalog_result_count == 0
    )
    pne_available_total = sum(pne_occurrences.values())
    return {
        "catalogVersion": catalog["catalogVersion"],
        "publicationReady": publication_ready,
        "municipalityCount": municipality_count,
        "authorizedPairCount": len(catalog["results"]),
        "goalCount": len({item["goalId"] for item in catalog["results"]}),
        "indicatorCount": len(definition_ids),
        "essentialCount": sum(item["tier"] == "essential" for item in catalog["results"]),
        "complementaryCount": sum(item["tier"] == "complementary" for item in catalog["results"]),
        "sourceBlockedIndicatorIds": [],
        "historicalSourceBlockerIndicatorIds": sorted(
            historical_source_blocker_ids
        ),
        "pneAvailableOccurrences": pne_available_total,
        "v2AvailableOccurrences": sum(v2_occurrences.values()),
        "pneAbsentOccurrences": municipality_count * len(definition_ids)
        - pne_available_total,
        "duplicateResultCount": duplicate_result_count,
        "outOfCatalogResultCount": out_of_catalog_result_count,
        "availablePerMunicipality": {
            "minimum": min(available_per_municipality, default=0),
            "maximum": max(available_per_municipality, default=0),
            "mean": statistics.fmean(available_per_municipality)
            if available_per_municipality
            else 0,
            "median": statistics.median(available_per_municipality)
            if available_per_municipality
            else 0,
            "distribution": {
                str(count): sorted_distribution[count]
                for count in sorted(sorted_distribution)
            },
        },
        "occurrencesByIndicator": dict(sorted(v2_occurrences.items())),
        "classificationCounts": {
            "advance": classifications["advance"],
            "maintain": classifications["maintain"],
            "unclassified": classifications[None],
        },
        "directionCounts": dict(sorted(directions.items())),
        "relationshipCounts": {
            relationship_type: relationships[relationship_type]
            for relationship_type in sorted(EXPECTED_RELATIONSHIP_TYPES)
        },
        "optionalEvidenceCounts": dict(optional_counts),
        "pneValuesAbove100ByIndicator": dict(sorted(pne_values_above_100.items())),
        "v2ValuesAbove100ByIndicator": dict(sorted(v2_values_above_100.items())),
        "pneNegativeValuesByIndicator": dict(sorted(pne_negative_values.items())),
        "v2NegativeValuesByIndicator": dict(sorted(v2_negative_values.items())),
        "pneV2Divergences": {
            "missingInV2ByIndicator": dict(sorted(missing_in_v2.items())),
            "unexpectedInV2ByIndicator": dict(sorted(unexpected_in_v2.items())),
            "valueDifferencesByIndicator": dict(sorted(value_differences.items())),
            "yearDifferencesByIndicator": dict(sorted(year_differences.items())),
            "unitDifferencesByIndicator": dict(sorted(unit_differences.items())),
            "classificationDifferencesByIndicator": dict(
                sorted(classification_differences.items())
            ),
            "sourceDifferencesByIndicator": dict(sorted(source_differences.items())),
        },
        "subsequenteExpansao": {
            "pneAvailable": pne_occurrences["subsequente_expansao"],
            "currentV1Available": subsequente_v1,
            "v2Available": v2_occurrences["subsequente_expansao"],
            "pneAbove100": pne_values_above_100["subsequente_expansao"],
            "v2Above100": v2_values_above_100["subsequente_expansao"],
        },
    }


__all__ = [
    "CATALOG_PATH",
    "CATALOG_VERSION",
    "PUBLIC_SCHEMA_VERSION",
    "PUBLIC_VERSION",
    "apply_pne2026_diagnostic_presentation",
    "audit_pne2026_public_diagnostic_v2",
    "build_pne2026_public_diagnostic_v2",
    "load_pne2026_diagnostic_presentation_catalog",
]
