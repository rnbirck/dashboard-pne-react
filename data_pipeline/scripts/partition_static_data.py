from __future__ import annotations

import argparse
import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
SOURCE_DIR = BASE_DIR / "export" / "data"
OUTPUT_DIR = BASE_DIR / "export" / "data_partitioned"

CYCLES = ("pne_2014_2024", "pne_2026_2036")
EXPECTED_MUNICIPALITIES = 497


def slugify(value: str, fallback: str = "municipio") -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value.lower()).strip("-")
    slug = re.sub(r"-+", "-", slug)
    return slug or fallback


def unique_slugs(names: list[str]) -> dict[str, str]:
    used: dict[str, int] = {}
    result: dict[str, str] = {}

    for name in names:
        base_slug = slugify(name)
        count = used.get(base_slug, 0) + 1
        used[base_slug] = count
        result[name] = base_slug if count == 1 else f"{base_slug}-{count}"

    return result


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_optional_json(path: Path, fallback: dict | None = None) -> dict:
    if path.exists():
        return load_json(path)
    return fallback or {}


def render_json(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"


def record_write(path: Path, expected_paths: set[Path]) -> None:
    expected_paths.add(path.resolve())


def write_text_if_changed(path: Path, content: str, stats: dict[str, int]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists():
        current = path.read_text(encoding="utf-8")
        if current == content:
            stats["preserved"] += 1
            return
        action = "updated"
    else:
        action = "created"

    path.write_text(content, encoding="utf-8")
    stats[action] += 1


def write_json(
    path: Path,
    payload: dict,
    stats: dict[str, int],
    expected_paths: set[Path],
) -> None:
    record_write(path, expected_paths)
    write_text_if_changed(path, render_json(payload), stats)


def copy_file_if_changed(
    source: Path,
    destination: Path,
    stats: dict[str, int],
    expected_paths: set[Path],
) -> None:
    record_write(destination, expected_paths)
    destination.parent.mkdir(parents=True, exist_ok=True)
    content = source.read_bytes()

    if destination.exists():
        if destination.read_bytes() == content:
            stats["preserved"] += 1
            return
        action = "updated"
    else:
        action = "created"

    destination.write_bytes(content)
    stats[action] += 1


def safe_prepare_output_dir() -> None:
    resolved_output = OUTPUT_DIR.resolve()
    expected_parent = (BASE_DIR / "export").resolve()

    if resolved_output.parent != expected_parent:
        raise RuntimeError(f"Diretório de saída inesperado: {resolved_output}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def remove_orphan_json_files(
    output_dir: Path,
    expected_paths: set[Path],
    stats: dict[str, int],
) -> None:
    expected = {path.resolve() for path in expected_paths}

    for path in output_dir.rglob("*.json"):
        if path.resolve() in expected:
            continue
        path.unlink()
        stats["removed"] += 1

    directories = [path for path in output_dir.rglob("*") if path.is_dir()]
    for directory in sorted(directories, key=lambda path: len(path.parts), reverse=True):
        if directory == output_dir:
            continue
        try:
            directory.rmdir()
        except OSError:
            pass


def load_aggregate_payloads() -> dict[str, dict]:
    payloads = {
        "municipios": load_json(SOURCE_DIR / "municipios.json"),
        "indicadores": load_json(SOURCE_DIR / "indicadores.json"),
    }

    for cycle in CYCLES:
        payloads[f"{cycle}_indicadores"] = load_json(
            SOURCE_DIR / cycle / "indicadores_por_municipio.json"
        )
        payloads[f"{cycle}_rankings"] = load_optional_json(
            SOURCE_DIR / cycle / "rankings_por_municipio.json"
        )

    payloads["diagnostico"] = load_optional_json(
        SOURCE_DIR / "pne_2026_2036" / "diagnostico_por_municipio.json"
    )
    payloads["indicator_details"] = load_json(
        SOURCE_DIR / "indicator_details_por_municipio.json"
    )
    payloads["fundeb"] = load_optional_json(
        SOURCE_DIR / "fundeb_por_municipio.json"
    )
    payloads["pnate"] = load_optional_json(
        SOURCE_DIR / "pnate_por_municipio.json"
    )
    for cycle in CYCLES:
        payloads[f"{cycle}_state_reference"] = load_optional_json(
            SOURCE_DIR / cycle / "referencia_estadual.json"
        )
    payloads["projecoes"] = load_optional_json(
        SOURCE_DIR / "pne_2026_2036" / "projecoes_por_municipio.json"
    )
    payloads["planning_scenarios"] = load_json(
        SOURCE_DIR
        / "pne_2026_2036"
        / "cenarios_planejamento_por_municipio.json"
    )
    payloads["education_attendance"] = load_json(
        SOURCE_DIR
        / "pne_2026_2036"
        / "atendimento_cenarios_por_municipio.json"
    )
    return payloads


def validate_fundeb_payload(payloads: dict[str, dict], municipios: list[str]) -> None:
    fundeb_payload = payloads.get("fundeb") or {}
    fundeb_municipios = fundeb_payload.get("municipios")
    if not isinstance(fundeb_municipios, dict):
        raise RuntimeError(
            "[partition] FUNDEB invalido: arquivo fundeb_por_municipio.json ausente "
            "ou sem objeto 'municipios'. Rode export_static_data.py completo antes do particionamento."
        )

    total_expected = EXPECTED_MUNICIPALITIES
    total_base = len(municipios)
    total_file = int(fundeb_payload.get("total_municipios") or len(fundeb_municipios))
    total_entries = len(fundeb_municipios)
    total_with_data = sum(
        1
        for municipio in municipios
        if isinstance(fundeb_municipios.get(municipio, {}).get("fundeb"), dict)
        and fundeb_municipios[municipio]["fundeb"].get("historico")
    )

    print("[partition] Validacao FUNDEB")
    print(f"[partition]   total esperado: {total_expected}")
    print(f"[partition]   total da base municipal: {total_base}")
    print(f"[partition]   total declarado no FUNDEB: {total_file}")
    print(f"[partition]   total de entradas no FUNDEB: {total_entries}")
    print(f"[partition]   total com dados FUNDEB: {total_with_data}")

    problems = []
    if total_base != total_expected:
        problems.append(f"base municipal tem {total_base}, esperado {total_expected}")
    if total_file != total_expected:
        problems.append(f"fundeb_por_municipio.json declara {total_file}, esperado {total_expected}")
    if total_entries != total_expected:
        problems.append(f"fundeb_por_municipio.json contem {total_entries} entradas, esperado {total_expected}")
    if total_with_data != total_expected:
        problems.append(f"FUNDEB com dados em {total_with_data} municipios, esperado {total_expected}")

    if problems:
        raise RuntimeError(
            "[partition] Fonte FUNDEB incompleta/parcial; particionamento interrompido para "
            "nao sobrescrever a base final. " + "; ".join(problems)
        )


def validate_pnate_payload(payloads: dict[str, dict], municipios: list[str]) -> None:
    pnate_payload = payloads.get("pnate") or {}
    pnate_municipios = pnate_payload.get("municipios")
    if not isinstance(pnate_municipios, dict):
        raise RuntimeError(
            "[partition] PNATE invalido: arquivo pnate_por_municipio.json ausente "
            "ou sem objeto 'municipios'. Rode export_static_data.py completo antes do particionamento."
        )

    total_expected = EXPECTED_MUNICIPALITIES
    total_base = len(municipios)
    total_file = int(pnate_payload.get("total_municipios") or len(pnate_municipios))
    total_entries = len(pnate_municipios)
    total_with_data = sum(
        1
        for municipio in municipios
        if isinstance(pnate_municipios.get(municipio, {}).get("pnate"), dict)
        and pnate_municipios[municipio]["pnate"].get("historico")
    )

    print("[partition] Validacao PNATE")
    print(f"[partition]   total esperado: {total_expected}")
    print(f"[partition]   total da base municipal: {total_base}")
    print(f"[partition]   total declarado no PNATE: {total_file}")
    print(f"[partition]   total de entradas no PNATE: {total_entries}")
    print(f"[partition]   total com dados PNATE: {total_with_data}")

    problems = []
    if total_base != total_expected:
        problems.append(f"base municipal tem {total_base}, esperado {total_expected}")
    if total_file != total_expected:
        problems.append(f"pnate_por_municipio.json declara {total_file}, esperado {total_expected}")
    if total_entries != total_expected:
        problems.append(f"pnate_por_municipio.json contem {total_entries} entradas, esperado {total_expected}")
    if total_with_data != total_expected:
        problems.append(f"PNATE com dados em {total_with_data} municipios, esperado {total_expected}")

    if problems:
        raise RuntimeError(
            "[partition] Fonte PNATE incompleta/parcial; particionamento interrompido para "
            "nao sobrescrever a base final. " + "; ".join(problems)
        )


def validate_planning_scenarios_payload(
    payloads: dict[str, dict], municipios: list[str]
) -> None:
    payload = payloads.get("planning_scenarios") or {}
    scenarios = payload.get("municipios")
    expected_keys = {
        "basico_integral",
        "escolas_integral",
        "pos_graduacao",
        "temporarios",
    }
    problems = []
    if payload.get("publicationStatus") != "published":
        problems.append("status de publicação inválido")
    if payload.get("scenarioType") != "maintenance":
        problems.append("tipo de cenário inválido")
    if not isinstance(scenarios, dict) or len(scenarios) != EXPECTED_MUNICIPALITIES:
        problems.append("cobertura municipal incompleta")
    else:
        for municipio in municipios:
            contracts = scenarios.get(municipio)
            if not isinstance(contracts, dict) or set(contracts) != expected_keys:
                problems.append(f"contratos incompletos para {municipio}")
                break
            if any(
                contract.get("targetValidationStatus") != "configured_unvalidated"
                for contract in contracts.values()
            ):
                problems.append(f"situação jurídica inválida para {municipio}")
                break
    if problems:
        raise RuntimeError(
            "[partition] Cenários de planejamento inválidos: " + "; ".join(problems)
        )


def extract_results(payload: dict, municipio: str) -> dict:
    return payload.get("municipios", {}).get(municipio, {}).get("results", {})


def extract_rankings(payload: dict, municipio: str) -> dict:
    return payload.get("municipios", {}).get(municipio, {}).get("categories", {})


def extract_diagnostico(payload: dict, municipio: str) -> dict:
    municipal = payload.get("municipios", {}).get(municipio, {})
    return municipal.get("diagnostico", municipal)


def extract_diagnostico_v2(payload: dict, municipio: str) -> dict:
    return payload.get("municipios", {}).get(municipio, {}).get("diagnostico_v2", {})


def validate_diagnostic_payload(payloads: dict[str, dict], municipios: list[str]) -> None:
    diagnostic_payload = payloads["diagnostico"]
    municipal_contracts = diagnostic_payload.get("municipios", {})
    problems: list[str] = []
    if len(municipios) != EXPECTED_MUNICIPALITIES:
        problems.append(
            f"esperados {EXPECTED_MUNICIPALITIES} municípios; encontrados {len(municipios)}"
        )
    if len(municipal_contracts) != len(municipios):
        problems.append(
            f"diagnóstico contém {len(municipal_contracts)} contratos para {len(municipios)} municípios"
        )

    for municipio in municipios:
        contract = extract_diagnostico_v2(diagnostic_payload, municipio)
        indicators = contract.get("indicators", [])
        indicator_ids = [item.get("indicatorId") for item in indicators]
        indicator_lookup = {item.get("indicatorId"): item for item in indicators}
        if contract.get("schemaVersion") != "municipal-diagnostic-v2":
            problems.append(f"schema incompatível em {municipio}")
            break
        if len(indicators) != 49 or len(set(indicator_ids)) != 49:
            problems.append(f"contrato sem 49 indicadores únicos em {municipio}")
            break
        for indicator in indicators:
            null_reasons = indicator.get("nullReasons", {})
            for field, value in indicator.items():
                if value is None and field not in null_reasons:
                    problems.append(
                        f"null sem razão em {municipio}/{indicator.get('indicatorId')}/{field}"
                    )
                    break
            configured_reference = indicator.get("configuredReference", {})
            for field, value in configured_reference.items():
                path = f"configuredReference.{field}"
                if value is None and path not in null_reasons:
                    problems.append(
                        f"null sem razão em {municipio}/{indicator.get('indicatorId')}/{path}"
                    )
                    break
            benchmarks = indicator.get("benchmarks", {})
            for benchmark_name in ("state", "municipalDistribution"):
                benchmark = benchmarks.get(benchmark_name)
                if not isinstance(benchmark, dict):
                    problems.append(
                        f"benchmark ausente em {municipio}/{indicator.get('indicatorId')}/{benchmark_name}"
                    )
                    break
                null_reason = benchmark.get("reason") or benchmark.get("directionReason")
                if any(value is None for key, value in benchmark.items() if key not in {"reason", "directionReason"}) and not null_reason:
                    problems.append(
                        f"null de benchmark sem razão em {municipio}/{indicator.get('indicatorId')}/{benchmark_name}"
                    )
                    break
            if indicator.get("priorityScore") is not None:
                problems.append(
                    f"priorityScore publicado em {municipio}/{indicator.get('indicatorId')}"
                )
                break
            if (
                indicator.get("targetComparisonStatus")
                == "methodologically_incompatible"
                and indicator.get("goalAttained") is not None
            ):
                problems.append(
                    f"incompatível com cumprimento definido em {municipio}/{indicator.get('indicatorId')}"
                )
                break
            if problems:
                break
        if problems:
            break

        for attention_item in contract.get("attentionItems", []):
            indicator = indicator_lookup.get(attention_item.get("indicatorId"))
            if not indicator:
                problems.append(f"referência de atenção quebrada em {municipio}")
                break
            if (
                indicator.get("legalCorrespondence") in {"proxy", "informational"}
                or indicator.get("targetComparisonStatus") != "eligible"
                or indicator.get("valueDomainStatus") != "within_domain"
            ):
                problems.append(
                    f"indicador inelegível na atenção em {municipio}/{indicator.get('indicatorId')}"
                )
                break
        if problems:
            break

        for collection_name in ("preservedItems", "excludedItems"):
            for reference in contract.get(collection_name, []):
                if reference.get("indicatorId") not in indicator_lookup:
                    problems.append(
                        f"referência quebrada em {municipio}/{collection_name}"
                    )
                    break
        if problems:
            break

        attention_ids = [
            reference.get("indicatorId")
            for reference in contract.get("attentionItems", [])
        ]
        if len(attention_ids) != len(set(attention_ids)):
            problems.append(f"atenção contém referências duplicadas em {municipio}")
            break

        decision_summary = contract.get("decisionSummary", {})
        decision_collections = {
            "municipalActionItems": decision_summary.get("municipalActionItems", []),
            "coordinationItems": decision_summary.get("coordinationItems", []),
            "investigationItems": decision_summary.get("investigationItems", []),
            "monitoringItems": decision_summary.get("monitoringItems", []),
            "preservationItems": decision_summary.get("preservationItems", []),
        }
        if decision_summary.get("selectionMethodologyVersion") != "municipal-decision-summary-p3c-v2":
            problems.append(f"síntese decisória ausente em {municipio}")
            break
        if len(decision_collections["municipalActionItems"]) > 3:
            problems.append(f"mais de três ações municipais em {municipio}")
            break
        if len(decision_collections["coordinationItems"]) > 2:
            problems.append(f"mais de duas pactuações em {municipio}")
            break
        selected_ids = [
            reference.get("indicatorId")
            for references in decision_collections.values()
            for reference in references
        ]
        if len(selected_ids) != len(set(selected_ids)):
            problems.append(f"síntese decisória duplicada em {municipio}")
            break
        for reference in decision_collections["investigationItems"]:
            if "selectionPosition" in reference:
                problems.append(f"investigação ordinal em {municipio}")
                break
        for reference in decision_collections["municipalActionItems"]:
            indicator = indicator_lookup.get(reference.get("indicatorId"), {})
            if (
                indicator.get("evidenceLevel") not in {"high", "medium"}
                or indicator.get("governance", {}).get("classification")
                in {"state_led", "federal_led", "territorial", "informational"}
            ):
                problems.append(
                    f"ação municipal inelegível em {municipio}/{reference.get('indicatorId')}"
                )
                break
        if problems:
            break

        state_summary = contract.get("stateBenchmarkSummary", {})
        if state_summary.get("analyzedCount") != contract.get("summary", {}).get("validLegalComparisons"):
            problems.append(f"resumo estadual fora do universo analisado em {municipio}")
            break
        primary_total = sum(
            int(state_summary.get(key, 0))
            for key in ("betterCount", "worseCount", "equivalentCount", "unavailableCount")
        )
        if primary_total != int(state_summary.get("analyzedCount", -1)):
            problems.append(f"totais estaduais inconsistentes em {municipio}")
            break
        if any(
            not isinstance(indicator.get(field), dict)
            for indicator in indicators
            for field in (
                "trajectory",
                "governance",
                "municipalExposure",
                "similarMunicipalities",
                "evidence",
                "decisionReading",
            )
        ):
            problems.append(f"extensÃ£o aprofundada ausente em {municipio}")
            break

    if problems:
        raise RuntimeError(
            "[partition] Contratos diagnostico_v2 inválidos: " + "; ".join(problems)
        )


def extract_indicator_details(payload: dict, municipio: str) -> dict:
    return payload.get("municipios", {}).get(municipio, {}).get("indicator_details", {})


def extract_projections(payload: dict, municipio: str) -> dict:
    return payload.get("municipios", {}).get(municipio, {})


def extract_planning_scenarios(payload: dict, municipio: str) -> dict:
    return payload.get("municipios", {}).get(municipio, {})


def extract_education_attendance(payload: dict, municipio: str) -> dict:
    return payload.get("municipios", {}).get(municipio, {})


def extract_fundeb(payload: dict, municipio: str) -> dict | None:
    return payload.get("municipios", {}).get(municipio, {}).get("fundeb")


def extract_pnate(payload: dict, municipio: str) -> dict | None:
    return payload.get("municipios", {}).get(municipio, {}).get("pnate")


def extract_fundeb_id(payload: dict, municipio: str) -> str | None:
    fundeb_data = extract_fundeb(payload, municipio)
    if not fundeb_data:
        return None

    resumo_id = fundeb_data.get("resumo_ultimo_ano", {}).get("id_municipio")
    if resumo_id:
        return str(resumo_id)

    for row in fundeb_data.get("historico", []):
        row_id = row.get("id_municipio")
        if row_id:
            return str(row_id)

    return None


def build_municipio_payload(
    payloads: dict[str, dict],
    municipio: str,
    slug: str,
    id_municipio: str | None = None,
) -> dict:
    fundeb_data = extract_fundeb(payloads["fundeb"], municipio)
    pnate_data = extract_pnate(payloads["pnate"], municipio)
    projection_data = extract_projections(payloads["projecoes"], municipio)
    planning_scenarios = extract_planning_scenarios(
        payloads["planning_scenarios"], municipio
    )
    education_attendance = extract_education_attendance(
        payloads["education_attendance"], municipio
    )
    diagnostico_v2 = build_partitioned_diagnostic_contract(
        payloads, municipio, id_municipio
    )
    payload = {
        "id_municipio": id_municipio,
        "municipio": municipio,
        "slug": slug,
        "pne_2014_2024": {
            "indicadores": extract_results(payloads["pne_2014_2024_indicadores"], municipio),
            "rankings": extract_rankings(payloads["pne_2014_2024_rankings"], municipio),
        },
        "pne_2026_2036": {
            "indicadores": extract_results(payloads["pne_2026_2036_indicadores"], municipio),
            "rankings": extract_rankings(payloads["pne_2026_2036_rankings"], municipio),
            "diagnostico_ref": {
                "status": "available" if diagnostico_v2 else "unavailable",
                "schemaVersion": diagnostico_v2.get("schemaVersion") if diagnostico_v2 else None,
                "methodologyVersion": diagnostico_v2.get("methodologyVersion") if diagnostico_v2 else None,
                "generatedAt": diagnostico_v2.get("generatedAt") if diagnostico_v2 else None,
                "path": f"/data/municipios/{slug}/diagnostico.json",
                "legacyCompatibility": "aggregate_only",
            },
            "projecoes": projection_data,
            "cenarios_planejamento": planning_scenarios,
        },
        "educacao": {
            "atendimento_cenarios": education_attendance,
        },
    }
    if fundeb_data is not None:
        payload.setdefault("blocos", {})["fundeb"] = fundeb_data
    if pnate_data is not None:
        payload.setdefault("blocos", {})["pnate"] = pnate_data
    return payload


def build_partitioned_diagnostic_contract(
    payloads: dict[str, dict],
    municipio: str,
    id_municipio: str | None,
) -> dict:
    diagnostico_v2 = extract_diagnostico_v2(payloads["diagnostico"], municipio)
    if not diagnostico_v2:
        return {}
    contract = dict(diagnostico_v2)
    metadata = dict(contract.get("generationMetadata") or {})
    contract["municipalityId"] = str(id_municipio or contract.get("municipalityId"))
    metadata["municipalityIdentityStatus"] = (
        "official_id" if id_municipio else "name_fallback_pending_partition"
    )
    metadata["deliveryMode"] = "route_lazy_static_json"
    metadata["legacyCompatibility"] = "aggregate_export_only"
    contract["generationMetadata"] = metadata
    if "trajectoryScenarioInventory" not in contract:
        projection_data = extract_projections(payloads["projecoes"], municipio)
        scenario_data = extract_planning_scenarios(
            payloads["planning_scenarios"], municipio
        )
        contract["trajectoryScenarioInventory"] = {
            "attendance": [
                {
                    "indicatorId": indicator_id,
                    "scenarioType": "trend_projection",
                    "status": (
                        "available"
                        if scenario.get("available") is True
                        else "not_available"
                    ),
                }
                for indicator_id, scenario in projection_data.items()
            ],
            "maintenance": [
                {
                    "indicatorId": indicator_id,
                    "scenarioType": "component_maintenance",
                    "status": str(scenario.get("status") or "not_available"),
                }
                for indicator_id, scenario in scenario_data.items()
            ],
        }
    return contract


def format_size(bytes_count: int) -> str:
    units = ("B", "KB", "MB", "GB")
    size = float(bytes_count)
    for unit in units:
        if size < 1024 or unit == units[-1]:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{bytes_count} B"


def resolve_generated_at(payloads: dict[str, dict]) -> str:
    generated_at = payloads.get("municipios", {}).get("generated_at")
    if generated_at:
        return str(generated_at)
    return datetime.now(timezone.utc).isoformat()


def main() -> int:
    global SOURCE_DIR, OUTPUT_DIR

    parser = argparse.ArgumentParser(
        description="Particiona os JSONs exportados do Dashboard PNE por município."
    )
    parser.add_argument(
        "--source-dir",
        default=str(SOURCE_DIR),
        help="Diretório com os JSONs agregados gerados por export_static_data.py.",
    )
    parser.add_argument(
        "--output-dir",
        default=str(OUTPUT_DIR),
        help="Diretório onde os JSONs particionados serão gerados.",
    )
    args = parser.parse_args()

    SOURCE_DIR = Path(args.source_dir).resolve()
    OUTPUT_DIR = Path(args.output_dir).resolve()

    print("[partition] Iniciando particionamento dos dados estáticos.")
    print(f"[partition] Origem: {SOURCE_DIR}")
    print(f"[partition] Saída: {OUTPUT_DIR}")

    payloads = load_aggregate_payloads()
    municipios = payloads["municipios"].get("municipios", [])
    validate_fundeb_payload(payloads, municipios)
    validate_pnate_payload(payloads, municipios)
    validate_planning_scenarios_payload(payloads, municipios)
    validate_diagnostic_payload(payloads, municipios)
    slug_map = unique_slugs(municipios)
    id_map = {
        municipio: extract_fundeb_id(payloads["fundeb"], municipio)
        for municipio in municipios
    }
    stats = {"created": 0, "updated": 0, "preserved": 0, "removed": 0}
    expected_paths: set[Path] = set()

    safe_prepare_output_dir()

    copy_file_if_changed(
        SOURCE_DIR / "municipios.json",
        OUTPUT_DIR / "municipios.json",
        stats,
        expected_paths,
    )
    copy_file_if_changed(
        SOURCE_DIR / "indicadores.json",
        OUTPUT_DIR / "indicadores.json",
        stats,
        expected_paths,
    )
    for cycle in CYCLES:
        state_reference_path = SOURCE_DIR / cycle / "referencia_estadual.json"
        if state_reference_path.exists():
            copy_file_if_changed(
                state_reference_path,
                OUTPUT_DIR / cycle / "referencia_estadual.json",
                stats,
                expected_paths,
            )

    generated_at = resolve_generated_at(payloads)
    index_items = [
        {
            "nome": municipio,
            "id_municipio": id_map.get(municipio),
            "slug": slug_map[municipio],
            "path": f"/data/municipios/{slug_map[municipio]}/index.json",
            "id_path": (
                f"/data/municipios/{id_map[municipio]}/index.json"
                if id_map.get(municipio)
                else None
            ),
        }
        for municipio in municipios
    ]
    write_json(
        OUTPUT_DIR / "municipios_index.json",
        {
            "generated_at": generated_at,
            "total_municipios": len(index_items),
            "municipios": index_items,
        },
        stats,
        expected_paths,
    )

    errors: list[dict[str, str]] = []
    for position, municipio in enumerate(municipios, start=1):
        slug = slug_map[municipio]
        id_municipio = id_map.get(municipio)
        print(f"[partition] {position}/{len(municipios)} {municipio} -> {slug}")
        try:
            municipio_payload = build_municipio_payload(
                payloads,
                municipio,
                slug,
                id_municipio,
            )
            diagnostic_contract = build_partitioned_diagnostic_contract(
                payloads, municipio, id_municipio
            )
            write_json(
                OUTPUT_DIR / "municipios" / slug / "index.json",
                municipio_payload,
                stats,
                expected_paths,
            )
            write_json(
                OUTPUT_DIR / "municipios" / slug / "diagnostico.json",
                diagnostic_contract,
                stats,
                expected_paths,
            )
            write_json(
                OUTPUT_DIR / "municipios" / slug / "details.json",
                extract_indicator_details(payloads["indicator_details"], municipio),
                stats,
                expected_paths,
            )
            if id_municipio and id_municipio != slug:
                write_json(
                    OUTPUT_DIR / "municipios" / id_municipio / "index.json",
                    municipio_payload,
                    stats,
                    expected_paths,
                )
                write_json(
                    OUTPUT_DIR / "municipios" / id_municipio / "diagnostico.json",
                    diagnostic_contract,
                    stats,
                    expected_paths,
                )
                write_json(
                    OUTPUT_DIR / "municipios" / id_municipio / "details.json",
                    extract_indicator_details(payloads["indicator_details"], municipio),
                    stats,
                    expected_paths,
                )
        except Exception as exc:  # noqa: BLE001 - keep processing other municipalities.
            errors.append({"municipio": municipio, "slug": slug, "erro": str(exc)})
            print(f"[partition] ERRO em {municipio}: {exc}")

    if errors:
        write_json(
            OUTPUT_DIR / "partition_errors.json",
            {"generated_at": generated_at, "total_erros": len(errors), "errors": errors},
            stats,
            expected_paths,
        )

    remove_orphan_json_files(OUTPUT_DIR, expected_paths, stats)

    files = list(OUTPUT_DIR.rglob("*.json"))
    municipio_files = list((OUTPUT_DIR / "municipios").rglob("index.json"))
    total_size = sum(path.stat().st_size for path in files)
    largest = max(files, key=lambda path: path.stat().st_size)

    print("[partition] Concluído.")
    print(f"[partition] Municípios particionados: {len(municipio_files)}")
    print(f"[partition] Arquivos criados: {stats['created']}")
    print(f"[partition] Arquivos atualizados: {stats['updated']}")
    print(f"[partition] Arquivos preservados: {stats['preserved']}")
    print(f"[partition] Arquivos removidos: {stats['removed']}")
    print(f"[partition] Erros: {len(errors)}")
    print(f"[partition] Arquivos JSON: {len(files)}")
    print(f"[partition] Tamanho total: {format_size(total_size)}")
    print(f"[partition] Maior arquivo: {largest.relative_to(OUTPUT_DIR)} ({format_size(largest.stat().st_size)})")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
