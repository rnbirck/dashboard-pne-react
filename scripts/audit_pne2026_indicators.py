#!/usr/bin/env python3
"""Read-only audit helpers for PNE 2026-2036 municipal indicators.

The script inspects the static JSON exports already present in public/data.
It does not connect to the database and does not write or overwrite files.
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


CYCLE = "pne_2026_2036"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DATA = PROJECT_ROOT / "public" / "data"
INDICADORES_PATH = PUBLIC_DATA / "indicadores.json"
MUNICIPIOS_INDEX_PATH = PUBLIC_DATA / "municipios_index.json"
MUNICIPIOS_DIR = PUBLIC_DATA / "municipios"
PIPELINE_PARTITIONED_DIR = (
    PROJECT_ROOT / "data_pipeline" / "export" / "data_partitioned" / "municipios"
)

EXPECTED_PROJECTION_KEYS = {
    "creche",
    "pre_escola",
    "basico_6_17",
    "basico_15_17",
}

COUNT_OR_NON_BOUNDED_KEYS = {
    "eja_integrada_educacao_profissional",
    "rendimento_magisterio",
    "subsequente_expansao",
}

DETAIL_PERCENT_EXCEPTIONS = {
    # The detail panel stores the current public share of EPT, not the
    # accumulated positive public expansion used as the dashboard indicator.
    "medio_tecnico_participacao_publica",
}

DEFAULT_SAMPLE_SLUGS = [
    "acegua",
    "alegrete",
    "caxias-do-sul",
    "porto-alegre",
    "xangri-la",
]

PERCENT_TOLERANCE = 0.05
DISTANCE_TOLERANCE = 1e-6
DETAIL_TOLERANCE = 0.2


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def finite_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and math.isfinite(float(value))


def as_number(value: Any) -> float | None:
    if finite_number(value):
        return float(value)
    return None


def build_catalog() -> dict[str, dict[str, Any]]:
    payload = load_json(INDICADORES_PATH)
    categories = payload["cycles"][CYCLE]["categories"]
    catalog: dict[str, dict[str, Any]] = {}
    for category in categories:
        for item in category.get("items", []):
            key = item["key"]
            catalog[key] = {
                "key": key,
                "label": item.get("label", ""),
                "category": category.get("key", ""),
                "category_label": category.get("label", ""),
                "tracks_goal_catalog": item.get("tracks_goal", True),
                "meta_label_catalog": item.get("meta_label", ""),
                "value_mode_catalog": item.get("value_mode", "percent"),
            }
    return catalog


def load_municipality_entries() -> list[dict[str, Any]]:
    index = load_json(MUNICIPIOS_INDEX_PATH)
    return list(index.get("municipios", []))


def load_unique_indexes() -> list[tuple[dict[str, Any], Path, dict[str, Any]]]:
    entries = load_municipality_entries()
    loaded: list[tuple[dict[str, Any], Path, dict[str, Any]]] = []
    seen: set[str] = set()
    for entry in entries:
        mid = str(entry.get("id_municipio") or "")
        if not mid or mid in seen:
            continue
        seen.add(mid)
        slug = entry.get("slug")
        path = MUNICIPIOS_DIR / str(slug) / "index.json"
        if not path.exists() and entry.get("id_municipio"):
            path = MUNICIPIOS_DIR / str(entry["id_municipio"]) / "index.json"
        if not path.exists():
            continue
        loaded.append((entry, path, load_json(path)))
    return loaded


def series_values(result: dict[str, Any]) -> list[float]:
    values: list[float] = []
    for point in result.get("series") or []:
        value = as_number(point.get("valor"))
        if value is not None:
            values.append(value)
    end_value = as_number(result.get("end_value"))
    if end_value is not None:
        values.append(end_value)
    return values


def result_years(result: dict[str, Any]) -> list[int]:
    years: list[int] = []
    for point in result.get("series") or []:
        year = point.get("ano")
        if isinstance(year, int):
            years.append(year)
    return years


def is_percent_like(key: str, catalog_item: dict[str, Any], result: dict[str, Any]) -> bool:
    if key in COUNT_OR_NON_BOUNDED_KEYS:
        return False
    if catalog_item.get("value_mode_catalog") == "count":
        return False
    if result.get("value_mode") == "count" or result.get("display_value_mode") == "count":
        return False
    return True


def check_indicator_results(
    catalog: dict[str, dict[str, Any]],
    loaded_indexes: list[tuple[dict[str, Any], Path, dict[str, Any]]],
) -> tuple[dict[str, dict[str, Any]], list[dict[str, Any]]]:
    summary: dict[str, dict[str, Any]] = {
        key: {
            "category": item["category"],
            "label": item["label"],
            "count": 0,
            "available": 0,
            "end_years": Counter(),
            "meta_values": Counter(),
            "directions": Counter(),
            "tracks_goal": Counter(),
            "min_value": None,
            "max_value": None,
            "issues": Counter(),
            "examples": defaultdict(list),
        }
        for key, item in catalog.items()
    }
    issues: list[dict[str, Any]] = []

    for entry, path, payload in loaded_indexes:
        municipio = payload.get("municipio") or entry.get("nome")
        indicators = payload.get(CYCLE, {}).get("indicadores", {})
        for key, item in catalog.items():
            result = indicators.get(key)
            if not isinstance(result, dict):
                summary[key]["issues"]["missing_result"] += 1
                issues.append(
                    {
                        "indicator": key,
                        "municipio": municipio,
                        "issue": "missing_result",
                        "path": str(path),
                    }
                )
                continue

            info = summary[key]
            info["count"] += 1
            info["tracks_goal"][str(result.get("tracks_goal"))] += 1
            if result.get("direction") is not None:
                info["directions"][str(result.get("direction"))] += 1
            if result.get("meta") is not None:
                info["meta_values"][str(result.get("meta"))] += 1

            if not result.get("available"):
                continue

            info["available"] += 1
            info["end_years"][result.get("end_year")] += 1
            values = series_values(result)
            if values:
                current_min = min(values)
                current_max = max(values)
                info["min_value"] = (
                    current_min
                    if info["min_value"] is None
                    else min(info["min_value"], current_min)
                )
                info["max_value"] = (
                    current_max
                    if info["max_value"] is None
                    else max(info["max_value"], current_max)
                )
                if is_percent_like(key, item, result):
                    bad_values = [
                        value
                        for value in values
                        if value < -PERCENT_TOLERANCE
                        or value > 100.0 + PERCENT_TOLERANCE
                    ]
                    if bad_values:
                        info["issues"]["percent_outside_0_100"] += 1
                        add_example(
                            info,
                            "percent_outside_0_100",
                            municipio,
                            round(min(bad_values), 3),
                            round(max(bad_values), 3),
                        )

            years = result_years(result)
            if years != sorted(years):
                info["issues"]["series_unsorted"] += 1
                add_example(info, "series_unsorted", municipio)
            if years and result.get("end_year") != max(years):
                info["issues"]["latest_year_mismatch"] += 1
                add_example(
                    info,
                    "latest_year_mismatch",
                    municipio,
                    result.get("end_year"),
                    max(years),
                )

            meta = as_number(result.get("meta"))
            end_value = as_number(result.get("end_value"))
            distance = as_number(result.get("distance"))
            direction = result.get("direction")
            tracks_goal = result.get("tracks_goal")
            if tracks_goal is False or result.get("meta") is None:
                if distance is not None:
                    info["issues"]["distance_on_non_comparable"] += 1
                    add_example(
                        info,
                        "distance_on_non_comparable",
                        municipio,
                        round(distance, 3),
                    )
                display_distance = (result.get("display") or {}).get("distance")
                if display_distance not in (None, "", "-"):
                    info["issues"]["display_distance_on_non_comparable"] += 1
                    add_example(
                        info,
                        "display_distance_on_non_comparable",
                        municipio,
                        display_distance,
                    )

            if meta is not None and end_value is not None and distance is not None:
                expected = (
                    meta - end_value if direction == "at_most" else end_value - meta
                )
                if abs(expected - distance) > DISTANCE_TOLERANCE:
                    info["issues"]["distance_formula_mismatch"] += 1
                    add_example(
                        info,
                        "distance_formula_mismatch",
                        municipio,
                        round(distance, 6),
                        round(expected, 6),
                    )
                expected_status = round(distance, 1) >= 0
                if bool(result.get("atingida")) != expected_status:
                    info["issues"]["status_mismatch"] += 1
                    add_example(
                        info,
                        "status_mismatch",
                        municipio,
                        result.get("atingida"),
                        expected_status,
                    )

    return summary, issues


def add_example(
    info: dict[str, Any],
    issue_key: str,
    municipio: str,
    *values: Any,
    limit: int = 3,
) -> None:
    examples = info["examples"][issue_key]
    if len(examples) < limit:
        examples.append((municipio, *values))


def check_projections(
    loaded_indexes: list[tuple[dict[str, Any], Path, dict[str, Any]]],
) -> dict[str, Any]:
    unexpected: Counter[str] = Counter()
    available: Counter[str] = Counter()
    present: Counter[str] = Counter()
    missing_expected: Counter[str] = Counter()

    for _entry, _path, payload in loaded_indexes:
        projections = payload.get(CYCLE, {}).get("projecoes") or {}
        for key in projections:
            present[key] += 1
            if key not in EXPECTED_PROJECTION_KEYS:
                unexpected[key] += 1
            if isinstance(projections.get(key), dict) and projections[key].get("available"):
                available[key] += 1
        for expected_key in EXPECTED_PROJECTION_KEYS:
            if expected_key not in projections:
                missing_expected[expected_key] += 1

    return {
        "present": dict(sorted(present.items())),
        "available": dict(sorted(available.items())),
        "unexpected": dict(sorted(unexpected.items())),
        "missing_expected": dict(sorted(missing_expected.items())),
    }


def choose_sample(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_slug = {entry.get("slug"): entry for entry in entries}
    sample = [by_slug[slug] for slug in DEFAULT_SAMPLE_SLUGS if slug in by_slug]
    if len(sample) >= 5:
        return sample[:5]
    for entry in entries:
        if entry not in sample:
            sample.append(entry)
        if len(sample) >= 5:
            break
    return sample


def detail_rows_for_indicator(key: str, detail: dict[str, Any]) -> list[dict[str, Any]]:
    by_cycle = detail.get("series_components_by_cycle")
    if isinstance(by_cycle, dict) and isinstance(by_cycle.get(CYCLE), list):
        return by_cycle[CYCLE]
    if key not in DETAIL_PERCENT_EXCEPTIONS and isinstance(
        detail.get("series_components"), list
    ):
        return detail["series_components"]
    return []


def latest_row(rows: list[dict[str, Any]], end_year: int | None) -> dict[str, Any] | None:
    if not rows:
        return None
    if isinstance(end_year, int):
        exact = [row for row in rows if row.get("ano") == end_year]
        if exact:
            return exact[-1]
        before = [row for row in rows if isinstance(row.get("ano"), int) and row["ano"] <= end_year]
        if before:
            return sorted(before, key=lambda row: row["ano"])[-1]
    dated = [row for row in rows if isinstance(row.get("ano"), int)]
    return sorted(dated, key=lambda row: row["ano"])[-1] if dated else rows[-1]


def compare_sample_details(
    catalog: dict[str, dict[str, Any]],
    sample_entries: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    comparisons: list[dict[str, Any]] = []
    for entry in sample_entries:
        slug = entry.get("slug")
        index_path = MUNICIPIOS_DIR / str(slug) / "index.json"
        details_path = MUNICIPIOS_DIR / str(slug) / "details.json"
        pipeline_index_path = PIPELINE_PARTITIONED_DIR / str(slug) / "index.json"
        if not index_path.exists() or not details_path.exists():
            comparisons.append(
                {
                    "municipio": entry.get("nome"),
                    "slug": slug,
                    "status": "missing_file",
                    "checked": 0,
                    "mismatches": [],
                    "not_checked": [],
                }
            )
            continue

        index_payload = load_json(index_path)
        details_payload = load_json(details_path)
        results = index_payload.get(CYCLE, {}).get("indicadores", {})
        mismatches: list[dict[str, Any]] = []
        export_mismatches: list[dict[str, Any]] = []
        not_checked: list[str] = []
        checked = 0

        if pipeline_index_path.exists():
            pipeline_payload = load_json(pipeline_index_path)
            pipeline_results = pipeline_payload.get(CYCLE, {}).get("indicadores", {})
            fields = [
                "available",
                "start_year",
                "end_year",
                "start_value",
                "end_value",
                "meta",
                "distance",
                "direction",
                "atingida",
                "tracks_goal",
            ]
            for key in catalog:
                public_result = results.get(key) or {}
                pipeline_result = pipeline_results.get(key) or {}
                for field in fields:
                    if public_result.get(field) != pipeline_result.get(field):
                        export_mismatches.append(
                            {
                                "indicator": key,
                                "field": field,
                                "public": public_result.get(field),
                                "pipeline_export": pipeline_result.get(field),
                            }
                        )
                        break

        for key in catalog:
            result = results.get(key)
            detail = details_payload.get(key)
            if not isinstance(result, dict) or not result.get("available"):
                not_checked.append(key)
                continue
            if not isinstance(detail, dict):
                not_checked.append(key)
                continue

            compared = False
            end_year = result.get("end_year")
            rows = detail_rows_for_indicator(key, detail)
            row = latest_row(rows, end_year if isinstance(end_year, int) else None)
            if row and as_number(row.get("percentual")) is not None:
                detail_value = float(row["percentual"])
                result_value = as_number(result.get("end_value"))
                if result_value is not None:
                    checked += 1
                    compared = True
                    if abs(round(result_value, 1) - detail_value) > DETAIL_TOLERANCE:
                        mismatches.append(
                            {
                                "indicator": key,
                                "end_year": end_year,
                                "result_end_value": round(result_value, 3),
                                "detail_percentual": detail_value,
                            }
                        )

            if not compared and (
                result.get("value_mode") == "count"
                or result.get("display_value_mode") == "count"
            ):
                total_rows = detail.get("series_total")
                if isinstance(total_rows, list):
                    row = latest_row(total_rows, end_year if isinstance(end_year, int) else None)
                    if row and as_number(row.get("valor")) is not None:
                        result_count = as_number(
                            result.get("display_end_value", result.get("end_value"))
                        )
                        if result_count is not None:
                            checked += 1
                            compared = True
                            if abs(result_count - float(row["valor"])) > DETAIL_TOLERANCE:
                                mismatches.append(
                                    {
                                        "indicator": key,
                                        "end_year": end_year,
                                        "result_count": round(result_count, 3),
                                        "detail_total": row["valor"],
                                    }
                                )

            if not compared:
                not_checked.append(key)

        comparisons.append(
            {
                "municipio": index_payload.get("municipio") or entry.get("nome"),
                "slug": slug,
                "id_municipio": index_payload.get("id_municipio"),
                "status": "ok" if not mismatches else "mismatch",
                "checked": checked,
                "mismatches": mismatches[:10],
                "pipeline_export_checked": pipeline_index_path.exists(),
                "pipeline_export_mismatches": export_mismatches[:10],
                "not_checked_count": len(not_checked),
            }
        )
    return comparisons


def make_json_safe(value: Any) -> Any:
    if isinstance(value, Counter):
        return dict(value)
    if isinstance(value, defaultdict):
        return {key: make_json_safe(val) for key, val in value.items()}
    if isinstance(value, dict):
        return {key: make_json_safe(val) for key, val in value.items()}
    if isinstance(value, list):
        return [make_json_safe(item) for item in value]
    if isinstance(value, tuple):
        return [make_json_safe(item) for item in value]
    return value


def print_text_report(report: dict[str, Any]) -> None:
    print("Auditoria PNE 2026-2036 - checks automáticos")
    print("=" * 52)
    print(f"Municípios únicos: {report['municipalities']}")
    print(f"Indicadores no catálogo: {report['indicator_count']}")
    print(f"Amostra de comparação: {', '.join(item['municipio'] for item in report['sample_comparisons'])}")
    print()
    print("Indicadores com achados automáticos:")
    for key, info in report["summary"].items():
        issue_total = sum(info["issues"].values())
        if issue_total == 0:
            continue
        min_value = info["min_value"]
        max_value = info["max_value"]
        value_range = (
            "-"
            if min_value is None or max_value is None
            else f"{min_value:.3f}..{max_value:.3f}"
        )
        print(
            f"- {key}: disponíveis {info['available']}/{info['count']}; "
            f"anos finais {dict(info['end_years'])}; faixa {value_range}; "
            f"achados {dict(info['issues'])}"
        )
        for issue_key, examples in info["examples"].items():
            print(f"  exemplos {issue_key}: {examples}")
    print()
    print("Projeções:")
    print(json.dumps(report["projections"], ensure_ascii=False, indent=2))
    print()
    print("Comparação index.json x details.json na amostra:")
    for item in report["sample_comparisons"]:
        print(
            f"- {item['municipio']} ({item['id_municipio']}): "
            f"{item['checked']} comparações, status={item['status']}, "
            f"não comparáveis automaticamente={item.get('not_checked_count', 0)}, "
            f"export público=particionado: "
            f"{'sim' if item.get('pipeline_export_checked') and not item.get('pipeline_export_mismatches') else 'não'}"
        )
        if item["mismatches"]:
            print(f"  divergências: {item['mismatches']}")
        if item.get("pipeline_export_mismatches"):
            print(f"  divergências public/export: {item['pipeline_export_mismatches']}")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(
        description="Audita os JSONs estáticos dos indicadores municipais PNE 2026-2036."
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Imprime o resultado em JSON em vez do resumo textual.",
    )
    args = parser.parse_args()

    catalog = build_catalog()
    entries = load_municipality_entries()
    loaded_indexes = load_unique_indexes()
    summary, issues = check_indicator_results(catalog, loaded_indexes)
    projections = check_projections(loaded_indexes)
    sample = choose_sample(entries)
    sample_comparisons = compare_sample_details(catalog, sample)

    report = {
        "cycle": CYCLE,
        "municipalities": len(loaded_indexes),
        "indicator_count": len(catalog),
        "summary": summary,
        "issue_count": len(issues),
        "projections": projections,
        "sample_comparisons": sample_comparisons,
    }

    safe_report = make_json_safe(report)
    if args.json:
        print(json.dumps(safe_report, ensure_ascii=False, indent=2))
    else:
        print_text_report(safe_report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
