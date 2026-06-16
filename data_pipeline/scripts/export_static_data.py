from __future__ import annotations

import argparse
import json
import math
import os
import sys
import traceback
from collections.abc import Mapping, Sequence
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
EXPORT_DIR = BASE_DIR / "export" / "data"

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))


def _generated_at() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def _is_nullish(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, float):
        return math.isnan(value) or math.isinf(value)
    try:
        result = pd.isna(value)
    except (TypeError, ValueError):
        return False
    return isinstance(result, bool) and result


def _json_safe(value: Any) -> Any:
    if _is_nullish(value):
        return None

    if isinstance(value, (str, bool, int)):
        return value

    if isinstance(value, float):
        return value if math.isfinite(value) else None

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if hasattr(value, "item") and not isinstance(value, (str, bytes, bytearray)):
        try:
            return _json_safe(value.item())
        except (TypeError, ValueError):
            pass

    if isinstance(value, Mapping):
        return {
            str(key): _json_safe(child)
            for key, child in value.items()
            if not callable(child)
        }

    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return [_json_safe(child) for child in value]

    if callable(value):
        return None

    return str(value)


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(_json_safe(payload), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"  arquivo gerado: {path.relative_to(BASE_DIR)}")


def _build_item_lookup(cycle_module: Any) -> dict[str, dict[str, Any]]:
    return {
        item["key"]: item
        for category_key in cycle_module.CATEGORY_ORDER
        for item in cycle_module.INDICADORES[category_key]["items"]
    }


def _serialize_item(item: Mapping[str, Any]) -> dict[str, Any]:
    return {
        str(key): _json_safe(value)
        for key, value in item.items()
        if key != "compute" and not callable(value)
    }


def _serialize_categories(cycle_module: Any) -> list[dict[str, Any]]:
    categories = []
    for category_key in cycle_module.CATEGORY_ORDER:
        category = cycle_module.INDICADORES[category_key]
        category_payload = {
            str(key): _json_safe(value)
            for key, value in category.items()
            if key != "items" and not callable(value)
        }
        category_payload["key"] = category_key
        category_payload["items"] = [
            _serialize_item(item) for item in category.get("items", [])
        ]
        categories.append(category_payload)
    return categories


def _safe_display(
    *,
    item: Mapping[str, Any],
    result: Mapping[str, Any],
    shared: Any,
    municipio: str,
    cycle_key: str,
    indicator_key: str,
    errors: list[dict[str, Any]],
) -> dict[str, Any]:
    display: dict[str, Any] = {}

    def assign(field: str, fn: Any) -> None:
        try:
            display[field] = fn()
        except Exception as exc:  # noqa: BLE001 - export should continue per item.
            errors.append(
                {
                    "cycle": cycle_key,
                    "municipio": municipio,
                    "indicator": indicator_key,
                    "stage": f"display.{field}",
                    "error": str(exc),
                }
            )
            display[field] = None

    assign(
        "start_value",
        lambda: shared._format_metric_value(item, result.get("start_value")),
    )
    assign("end_value", lambda: shared._format_metric_value(item, result.get("end_value")))
    assign("variation", lambda: shared._variation_text(result, item))
    assign(
        "distance",
        lambda: shared._format_metric_distance(item, result.get("distance")),
    )
    assign("status", lambda: shared._status_theme(result).get("text"))
    assign("interpretation", lambda: shared._interpretation(item, result))

    return display


def _serialize_result(
    *,
    result: Mapping[str, Any],
    item: Mapping[str, Any] | None,
    shared: Any,
    municipio: str,
    cycle_key: str,
    indicator_key: str,
    errors: list[dict[str, Any]],
) -> dict[str, Any]:
    fields = (
        "available",
        "start_year",
        "end_year",
        "start_value",
        "end_value",
        "raw_delta",
        "progress_delta",
        "meta",
        "meta_label",
        "direction",
        "distance",
        "atingida",
        "tracks_goal",
        "series",
    )
    payload = {field: result.get(field) for field in fields if field in result}

    if item is not None:
        payload["display"] = _safe_display(
            item=item,
            result=result,
            shared=shared,
            municipio=municipio,
            cycle_key=cycle_key,
            indicator_key=indicator_key,
            errors=errors,
        )

    return _json_safe(payload)


def _export_cycle_results(
    *,
    cycle_key: str,
    cycle_module: Any,
    municipios: list[str],
    shared: Any,
    errors: list[dict[str, Any]],
) -> dict[str, Any]:
    item_lookup = _build_item_lookup(cycle_module)
    exported = 0
    municipio_payloads: dict[str, Any] = {}

    print(f"\nProcessando ciclo {cycle_key}...")
    for index, municipio in enumerate(municipios, start=1):
        print(f"  [{index}/{len(municipios)}] {municipio}")
        try:
            results = cycle_module._calculate_results(municipio)
        except Exception as exc:  # noqa: BLE001 - export should continue per city.
            errors.append(
                {
                    "cycle": cycle_key,
                    "municipio": municipio,
                    "stage": "calculate_results",
                    "error": str(exc),
                    "traceback": traceback.format_exc(limit=4),
                }
            )
            municipio_payloads[municipio] = {"results": {}, "error": str(exc)}
            continue

        serialized_results = {}
        for indicator_key, result in results.items():
            try:
                serialized_results[indicator_key] = _serialize_result(
                    result=result,
                    item=item_lookup.get(indicator_key),
                    shared=shared,
                    municipio=municipio,
                    cycle_key=cycle_key,
                    indicator_key=indicator_key,
                    errors=errors,
                )
            except Exception as exc:  # noqa: BLE001 - export should continue per item.
                errors.append(
                    {
                        "cycle": cycle_key,
                        "municipio": municipio,
                        "indicator": indicator_key,
                        "stage": "serialize_result",
                        "error": str(exc),
                        "traceback": traceback.format_exc(limit=4),
                    }
                )
                serialized_results[indicator_key] = {"error": str(exc)}

        municipio_payloads[municipio] = {"results": serialized_results}
        exported += 1

    return {
        "generated_at": _generated_at(),
        "cycle": cycle_key,
        "total_municipios": len(municipios),
        "municipios_exportados": exported,
        "municipios": municipio_payloads,
    }


def _ranking_display(
    *,
    item: Mapping[str, Any],
    result: Mapping[str, Any],
    shared: Any,
    municipio: str,
    cycle_key: str,
    indicator_key: str,
    errors: list[dict[str, Any]],
) -> dict[str, Any]:
    return _safe_display(
        item=item,
        result=result,
        shared=shared,
        municipio=municipio,
        cycle_key=cycle_key,
        indicator_key=indicator_key,
        errors=errors,
    )


def _ranking_row(
    *,
    category_key: str,
    item: Mapping[str, Any],
    result: Mapping[str, Any],
    shared: Any,
    municipio: str,
    cycle_key: str,
    errors: list[dict[str, Any]],
) -> dict[str, Any]:
    indicator_key = item["key"]
    return {
        "indicator_key": indicator_key,
        "label": item.get("label"),
        "sub": item.get("sub"),
        "category": category_key,
        "progress_delta": result.get("progress_delta"),
        "distance": result.get("distance"),
        "atingida": result.get("atingida"),
        "available": result.get("available"),
        "value_mode": shared._value_mode(item),
        "start_year": result.get("start_year"),
        "end_year": result.get("end_year"),
        "start_value": result.get("start_value"),
        "end_value": result.get("end_value"),
        "display": _ranking_display(
            item=item,
            result=result,
            shared=shared,
            municipio=municipio,
            cycle_key=cycle_key,
            indicator_key=indicator_key,
            errors=errors,
        ),
    }


def _sort_number(value: Any, default: float = 0.0) -> float:
    if _is_nullish(value):
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _build_rankings_payload_for_municipio(
    *,
    cycle_key: str,
    cycle_module: Any,
    municipio: str,
    results: Mapping[str, Mapping[str, Any]],
    shared: Any,
    errors: list[dict[str, Any]],
) -> dict[str, Any]:
    categories_payload: dict[str, Any] = {}

    for category_key in cycle_module.CATEGORY_ORDER:
        category = cycle_module.INDICADORES[category_key]

        if cycle_key == "pne_2026_2036":
            progress_rows = []
            attention_rows = []
            for item in category["items"]:
                result = results.get(item["key"], {})
                if not result.get("available") or not shared._tracks_goal(item, result):
                    continue
                row = _ranking_row(
                    category_key=category_key,
                    item=item,
                    result=result,
                    shared=shared,
                    municipio=municipio,
                    cycle_key=cycle_key,
                    errors=errors,
                )
                if item["key"] == "subsequente_expansao":
                    row["distance"] = -cycle_module._subsequente_distance_value(result)
                    row["value_mode"] = "growth_percent"
                if shared._has_time_comparison(result):
                    progress_rows.append(row)
                if result.get("distance") is not None:
                    attention_rows.append(row)

            top_avancos = sorted(
                progress_rows,
                key=lambda row: _sort_number(row.get("progress_delta")),
                reverse=True,
            )[:3]
            top_atencao = sorted(
                [row for row in attention_rows if not row.get("atingida")],
                key=lambda row: _sort_number(row.get("distance")),
            )[:3]
        else:
            ranking_rows = []
            for item in category["items"]:
                result = results.get(item["key"], {})
                if (
                    not result.get("available")
                    or not shared._tracks_goal(item, result)
                    or not shared._has_time_comparison(result)
                ):
                    continue
                ranking_rows.append(
                    _ranking_row(
                        category_key=category_key,
                        item=item,
                        result=result,
                        shared=shared,
                        municipio=municipio,
                        cycle_key=cycle_key,
                        errors=errors,
                    )
                )

            top_avancos = sorted(
                ranking_rows,
                key=lambda row: _sort_number(row.get("progress_delta")),
                reverse=True,
            )[:3]
            top_atencao = sorted(
                [row for row in ranking_rows if not row.get("atingida")],
                key=lambda row: _sort_number(row.get("distance")),
            )[:3]

        categories_payload[category_key] = {
            "label": category.get("label"),
            "accent": category.get("accent"),
            "top_avancos": top_avancos,
            "top_atencao": top_atencao,
        }

    return {"categories": categories_payload}


def _export_cycle_rankings(
    *,
    cycle_key: str,
    cycle_module: Any,
    municipios: list[str],
    shared: Any,
    errors: list[dict[str, Any]],
) -> dict[str, Any]:
    exported = 0
    municipio_payloads: dict[str, Any] = {}

    print(f"\nProcessando rankings {cycle_key}...")
    for index, municipio in enumerate(municipios, start=1):
        print(f"  [{index}/{len(municipios)}] {municipio}")
        try:
            results = cycle_module._calculate_results(municipio)
            municipio_payloads[municipio] = _build_rankings_payload_for_municipio(
                cycle_key=cycle_key,
                cycle_module=cycle_module,
                municipio=municipio,
                results=results,
                shared=shared,
                errors=errors,
            )
            exported += 1
        except Exception as exc:  # noqa: BLE001 - export should continue per city.
            errors.append(
                {
                    "cycle": cycle_key,
                    "municipio": municipio,
                    "stage": "rankings",
                    "error": str(exc),
                    "traceback": traceback.format_exc(limit=4),
                }
            )
            municipio_payloads[municipio] = {"categories": {}, "error": str(exc)}

    return {
        "generated_at": _generated_at(),
        "cycle": cycle_key,
        "total_municipios": len(municipios),
        "municipios_exportados": exported,
        "municipios": municipio_payloads,
    }


def _serialize_diagnostic_indicator(
    *,
    record: Mapping[str, Any],
    shared: Any,
    municipio: str,
    errors: list[dict[str, Any]],
) -> dict[str, Any]:
    item = record.get("item", {})
    result = record.get("result", {})
    indicator_key = record.get("key") or item.get("key")
    return {
        "key": indicator_key,
        "label": record.get("label"),
        "desc": record.get("desc"),
        "tracks_goal": record.get("tracks_goal"),
        "achieved": record.get("achieved"),
        "result": _serialize_result(
            result=result,
            item=item,
            shared=shared,
            municipio=municipio,
            cycle_key="pne_2026_2036",
            indicator_key=indicator_key,
            errors=errors,
        ),
    }


def _serialize_diagnostic_category(
    *,
    category: Mapping[str, Any],
    diagnostico: Any,
    shared: Any,
    municipio: str,
    errors: list[dict[str, Any]],
) -> dict[str, Any]:
    indicators = [
        _serialize_diagnostic_indicator(
            record=record,
            shared=shared,
            municipio=municipio,
            errors=errors,
        )
        for record in category.get("indicators", [])
    ]
    return {
        "key": category.get("key"),
        "label": category.get("label"),
        "subtitle": category.get("subtitle"),
        "icon": category.get("icon"),
        "accent": category.get("accent"),
        "observed": category.get("observed"),
        "reading": category.get("reading"),
        "total": category.get("total"),
        "goal_total": category.get("goal_total"),
        "informative_total": category.get("informative_total"),
        "achieved": category.get("achieved"),
        "attention_count": len(category.get("attention", [])),
        "counter_text": diagnostico._category_counter_text(category),
        "evidence_lines": diagnostico._evidence_lines(category),
        "attention_indicators": [
            record.get("key") for record in category.get("attention", [])
        ],
        "positive_indicators": [
            record.get("key") for record in category.get("positive", [])
        ],
        "informative_indicators": [
            record.get("key") for record in category.get("informative", [])
        ],
        "indicators": indicators,
    }


def _export_diagnostics(
    *,
    municipios: list[str],
    diagnostico: Any,
    shared: Any,
    errors: list[dict[str, Any]],
) -> dict[str, Any]:
    exported = 0
    municipio_payloads: dict[str, Any] = {}

    print("\nProcessando diagnóstico pne_2026_2036...")
    for index, municipio in enumerate(municipios, start=1):
        print(f"  [{index}/{len(municipios)}] {municipio}")
        try:
            categories = diagnostico._load_diagnostic(municipio)
            active_category = diagnostico._default_active_category(categories)
            summary = diagnostico._summary_values(categories)
            municipio_payloads[municipio] = {
                "active_category": active_category,
                "summary": {
                    "indicadores_analisados": summary.get("tracked"),
                    "metas_atingidas": summary.get("achieved"),
                    "pontos_de_atencao": summary.get("attention"),
                },
                "principais_desafios": diagnostico._challenge_rows(categories),
                "pontos_positivos": diagnostico._positive_rows(categories),
                "categories": [
                    _serialize_diagnostic_category(
                        category=category,
                        diagnostico=diagnostico,
                        shared=shared,
                        municipio=municipio,
                        errors=errors,
                    )
                    for category in categories
                ],
            }
            exported += 1
        except Exception as exc:  # noqa: BLE001 - export should continue per city.
            errors.append(
                {
                    "cycle": "pne_2026_2036",
                    "municipio": municipio,
                    "stage": "diagnostico",
                    "error": str(exc),
                    "traceback": traceback.format_exc(limit=4),
                }
            )
            municipio_payloads[municipio] = {"categories": [], "error": str(exc)}

    return {
        "generated_at": _generated_at(),
        "cycle": "pne_2026_2036",
        "total_municipios": len(municipios),
        "municipios_exportados": exported,
        "municipios": municipio_payloads,
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Exporta dados finais do dashboard Dash para JSON estático."
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limita a quantidade de municípios exportados, útil para validação.",
    )
    parser.add_argument(
        "--municipio",
        action="append",
        default=None,
        help="Exporta apenas o município informado. Pode ser usado mais de uma vez.",
    )
    parser.add_argument(
        "--check-connection",
        action="store_true",
        help="Testa backend, variáveis de ambiente e load_municipios sem exportar.",
    )
    parser.add_argument(
        "--include-derived",
        action="store_true",
        help="Exporta também rankings por município e diagnóstico.",
    )
    return parser.parse_args()


def _check_connection(load_municipios: Any) -> int:
    from src.data import repository

    repository.load_environment()
    backend = repository.get_data_backend()
    env_path = BASE_DIR / ".env"

    print("\nDiagnóstico de conexão")
    print(f"  .env da raiz encontrado: {'sim' if env_path.exists() else 'não'}")
    print(f"  backend usado: {backend}")

    if backend == "supabase":
        print(f"  SUPABASE_URL configurado: {'sim' if os.getenv('SUPABASE_URL') else 'não'}")
        print(
            "  chave Supabase configurada: "
            f"{'sim' if (os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY')) else 'não'}"
        )
    else:
        print(f"  DB_HOST: {os.getenv('DB_HOST') or '(não definido)'}")
        print(f"  DB_PORT: {os.getenv('DB_PORT') or '5432'}")
        print(f"  DB_BANCO: {os.getenv('DB_BANCO') or '(não definido)'}")
        print(f"  DB_USUARIO: {os.getenv('DB_USUARIO') or '(não definido)'}")
        print("  DB_SENHA: (oculta)")

    try:
        municipios = load_municipios()
    except Exception as exc:  # noqa: BLE001 - diagnostic command should explain.
        print("\nResultado: falha ao carregar municípios.")
        print(f"  erro: {exc}")
        return 1

    print("\nResultado: conexão OK.")
    print(f"  municípios encontrados: {len(municipios)}")
    if municipios:
        print(f"  primeiro município: {municipios[0]}")
    return 0


def main() -> int:
    args = _parse_args()
    print("Iniciando exportação estática do Dashboard PNE...")
    print(f"Projeto Python: {BASE_DIR}")
    print(f"Destino JSON: {EXPORT_DIR}")
    stale_error_file = EXPORT_DIR / "export_errors.json"
    if stale_error_file.exists():
        stale_error_file.unlink()

    # Import app first so Dash pages are registered in the same way as runtime.
    import app as _dash_app  # noqa: F401
    from src.data_loader import load_municipios
    from src.views import diagnostico, pne_2014_2024, pne_2026_2036, pne_shared

    if args.check_connection:
        return _check_connection(load_municipios)

    errors: list[dict[str, Any]] = []
    generated_at = _generated_at()
    try:
        municipios = load_municipios()
    except Exception as exc:  # noqa: BLE001 - report a clean export failure.
        EXPORT_DIR.mkdir(parents=True, exist_ok=True)
        errors.append(
            {
                "stage": "load_municipios",
                "error": str(exc),
                "traceback": traceback.format_exc(limit=6),
            }
        )
        _write_json(
            EXPORT_DIR / "export_errors.json",
            {
                "generated_at": _generated_at(),
                "total_errors": len(errors),
                "errors": errors,
            },
        )
        print("\nResumo da exportação")
        print("  municípios exportados: 0")
        print(f"  erros registrados: {len(errors)}")
        print(f"  falha ao carregar municípios; veja {EXPORT_DIR / 'export_errors.json'}")
        return 1

    if args.municipio:
        requested = set(args.municipio)
        municipios = [municipio for municipio in municipios if municipio in requested]
        missing = sorted(requested - set(municipios))
        for municipio in missing:
            errors.append(
                {
                    "stage": "filter_municipio",
                    "municipio": municipio,
                    "error": "Município não encontrado na lista carregada.",
                }
            )

    if args.limit is not None:
        municipios = municipios[: max(args.limit, 0)]

    print(f"Municípios carregados para exportação: {len(municipios)}")
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    municipios_payload = {
        "generated_at": generated_at,
        "total_municipios": len(municipios),
        "municipios": municipios,
    }
    _write_json(EXPORT_DIR / "municipios.json", municipios_payload)

    indicadores_payload = {
        "generated_at": generated_at,
        "cycles": {
            "pne_2014_2024": {
                "label": "PNE 2014-2024",
                "categories": _serialize_categories(pne_2014_2024),
            },
            "pne_2026_2036": {
                "label": "PNE 2026-2036",
                "categories": _serialize_categories(pne_2026_2036),
            },
        },
    }
    _write_json(EXPORT_DIR / "indicadores.json", indicadores_payload)

    cycle_modules = {
        "pne_2014_2024": pne_2014_2024,
        "pne_2026_2036": pne_2026_2036,
    }
    generated_files = [
        EXPORT_DIR / "municipios.json",
        EXPORT_DIR / "indicadores.json",
    ]

    for cycle_key, cycle_module in cycle_modules.items():
        cycle_payload = _export_cycle_results(
            cycle_key=cycle_key,
            cycle_module=cycle_module,
            municipios=municipios,
            shared=pne_shared,
            errors=errors,
        )
        output_path = EXPORT_DIR / cycle_key / "indicadores_por_municipio.json"
        _write_json(output_path, cycle_payload)
        generated_files.append(output_path)

    if args.include_derived:
        for cycle_key, cycle_module in cycle_modules.items():
            rankings_payload = _export_cycle_rankings(
                cycle_key=cycle_key,
                cycle_module=cycle_module,
                municipios=municipios,
                shared=pne_shared,
                errors=errors,
            )
            rankings_path = EXPORT_DIR / cycle_key / "rankings_por_municipio.json"
            _write_json(rankings_path, rankings_payload)
            generated_files.append(rankings_path)

        diagnostic_payload = _export_diagnostics(
            municipios=municipios,
            diagnostico=diagnostico,
            shared=pne_shared,
            errors=errors,
        )
        diagnostic_path = (
            EXPORT_DIR / "pne_2026_2036" / "diagnostico_por_municipio.json"
        )
        _write_json(diagnostic_path, diagnostic_payload)
        generated_files.append(diagnostic_path)

    if errors:
        _write_json(
            EXPORT_DIR / "export_errors.json",
            {
                "generated_at": _generated_at(),
                "total_errors": len(errors),
                "errors": errors,
            },
        )
        generated_files.append(EXPORT_DIR / "export_errors.json")

    print("\nResumo da exportação")
    print(f"  municípios exportados: {len(municipios)}")
    print(f"  erros registrados: {len(errors)}")
    print("  arquivos gerados:")
    for path in generated_files:
        print(f"    - {path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
