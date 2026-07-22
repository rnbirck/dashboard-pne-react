"""Materializa os snapshots VGM-3 a partir da view homologada de Educação."""

from __future__ import annotations

import argparse
import csv
import json
import os
import shutil
import statistics
import sys
import tempfile
import uuid
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable, Mapping


REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_PIPELINE_DIR = REPO_ROOT / "data_pipeline"
if str(DATA_PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(DATA_PIPELINE_DIR))

from src.data.repository import get_local_postgres_engine  # noqa: E402
from src.municipal_education_overview import (  # noqa: E402
    EXPECTED_MUNICIPALITIES,
    REFERENCE_YEAR,
    SCHEMA_VERSION,
    VIEW_NAME,
    audit_fully_null_rows,
    build_2025_completeness_evidence,
    materialize_municipal_education_overview,
)


PUBLIC_DATA_DIR = REPO_ROOT / "public" / "data"
REGISTRY_PATH = PUBLIC_DATA_DIR / "municipios_index.json"
DEFAULT_OUTPUT_DIR = PUBLIC_DATA_DIR / "educacao" / "visao-geral-municipal"
EXPECTED_PUBLICATION_STATES = {
    "published": 426,
    "partial": 71,
    "unavailable": 0,
    "invalid": 0,
}
EXPECTED_RECONCILIATIONS = {
    "reconciled": 11_494,
    "divergent": 0,
    "not_evaluated": 1_428,
}
OFFICIAL_CENSUS_FIELDS = {
    "QT_MAT_BAS": "mat_basico_oficial",
    "QT_MAT_MED": "mat_medio",
    "QT_MAT_EJA": "mat_eja",
    "QT_MAT_EJA_FUND": "mat_eja_fundamental",
    "QT_MAT_EJA_MED": "mat_eja_medio",
    "QT_MAT_MED_IFTP_CT": "mat_medio_tecnico_integrado",
    "QT_MAT_PROF_TEC_CONC": "mat_profissional_tecnico_concomitante",
    "QT_MAT_PROF_TEC_SUBS": "mat_profissional_tecnico_subsequente",
    "QT_MAT_PROF_TEC_IFTP_CT": "mat_profissional_tecnico_iftp_exclusivo",
    "QT_MAT_PROF_IFTP_QP": "mat_profissional_iftp_qualificacao",
    "QT_MAT_PROF_FIC_CONC": "mat_profissional_fic_concomitante",
    "QT_MAT_ESP": "mat_educacao_especial",
    "QT_MAT_ESP_CC": "mat_educacao_especial_classes_comuns",
    "QT_MAT_ESP_CE": "mat_educacao_especial_classes_exclusivas",
}
CORE_TOTAL_PATHS = (
    ("basicEducation", "total"),
    ("earlyChildhood", "total", "total"),
    ("earlyChildhood", "creche", "total"),
    ("earlyChildhood", "preSchool", "total"),
    ("elementary", "total", "total"),
    ("elementary", "initialYears", "total"),
    ("elementary", "finalYears", "total"),
    ("highSchool", "total", "total"),
)
STAGE_PATHS = (
    ("earlyChildhood", "total"),
    ("earlyChildhood", "creche"),
    ("earlyChildhood", "preSchool"),
    ("elementary", "total"),
    ("elementary", "initialYears"),
    ("elementary", "finalYears"),
    ("highSchool", "total"),
)
FORBIDDEN_CONTRACT_FIELDS = {
    "historical",
    "history",
    "annualComparison",
    "yearComparison",
    "annualFallback",
    "fallbackYear",
    "trend",
    "variation",
    "projection",
    "comparability",
}


def _reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    output: dict[str, Any] = {}
    for key, value in pairs:
        if key in output:
            raise ValueError(f"Propriedade JSON duplicada: {key}")
        output[key] = value
    return output


def _load_json(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(
            path.read_text(encoding="utf-8"), object_pairs_hook=_reject_duplicate_keys
        )
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        raise RuntimeError(f"JSON inválido em {path}: {exc}") from exc
    if not isinstance(payload, dict):
        raise RuntimeError(f"O JSON em {path} precisa ser um objeto.")
    return payload


def _serialize(payload: Mapping[str, Any]) -> bytes:
    return (
        json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    ).encode("utf-8")


def _registry_entries(registry_path: Path = REGISTRY_PATH) -> list[dict[str, str]]:
    payload = _load_json(registry_path)
    entries = list(payload.get("municipios") or [])
    if (
        payload.get("total_municipios") != EXPECTED_MUNICIPALITIES
        or len(entries) != EXPECTED_MUNICIPALITIES
    ):
        raise RuntimeError("O registro municipal precisa conter exatamente 497 municípios.")

    normalized = [
        {
            "idMunicipality": str(entry.get("id_municipio") or ""),
            "name": str(entry.get("nome") or ""),
            "slug": str(entry.get("slug") or ""),
        }
        for entry in entries
    ]
    ids = [entry["idMunicipality"] for entry in normalized]
    slugs = [entry["slug"] for entry in normalized]
    if (
        any(not identifier.isdigit() for identifier in ids)
        or any(not entry["name"] for entry in normalized)
        or any(not slug for slug in slugs)
        or len(set(ids)) != EXPECTED_MUNICIPALITIES
        or len(set(slugs)) != EXPECTED_MUNICIPALITIES
    ):
        raise RuntimeError("O registro municipal possui códigos, nomes ou slugs inválidos.")
    return sorted(normalized, key=lambda entry: entry["slug"])


def load_view_rows(engine: Any) -> list[dict[str, Any]]:
    """Lê exclusivamente a view VGM-1 e falha se a estrutura for incompatível."""
    from sqlalchemy import text

    columns = (
        "v.ano, v.id_municipio, v.dependencia, v.localizacao, "
        "v.mat_basico, v.mat_infantil, v.mat_infantil_creche, v.mat_infantil_pre, "
        "v.mat_fundamental, v.mat_fundamental_anos_iniciais, v.mat_fundamental_anos_finais, "
        "c.mat_medio"
    )
    query = text(
        f"""
        SELECT {columns}
        FROM {VIEW_NAME} AS v
        INNER JOIN censo AS c
          ON c.ano = v.ano
         AND c.id_municipio = v.id_municipio
         AND c.dependencia = v.dependencia
         AND c.localizacao = v.localizacao
        WHERE v.ano = :reference_year
        ORDER BY v.id_municipio, v.dependencia, v.localizacao
        """
    )
    try:
        with engine.connect() as connection:
            rows = [
                dict(row)
                for row in connection.execute(
                    query, {"reference_year": REFERENCE_YEAR}
                ).mappings()
            ]
    except Exception as exc:  # noqa: BLE001 - no fallback source is allowed.
        raise RuntimeError(
            f"Não foi possível ler a view obrigatória {VIEW_NAME}: {exc}"
        ) from exc

    required = {
        "ano",
        "id_municipio",
        "dependencia",
        "localizacao",
        "mat_basico",
        "mat_infantil",
        "mat_infantil_creche",
        "mat_infantil_pre",
        "mat_fundamental",
        "mat_fundamental_anos_iniciais",
        "mat_fundamental_anos_finais",
        "mat_medio",
    }
    if not rows:
        raise RuntimeError(
            f"A view obrigatória {VIEW_NAME} não retornou dados de {REFERENCE_YEAR}."
        )
    missing = required - set(rows[0])
    if missing:
        raise RuntimeError(
            f"A view obrigatória {VIEW_NAME} não retornou a estrutura esperada: {sorted(missing)}."
        )
    if any(int(row["ano"]) != REFERENCE_YEAR for row in rows):
        raise RuntimeError("A leitura da view retornou ano diferente de 2025.")
    return rows


def load_official_census_totals(path: Path) -> dict[str, dict[str, int]]:
    """Agrega somente os campos homologados do microdado oficial de 2025."""
    if not path.is_file():
        raise RuntimeError(f"Microdado oficial do Censo Escolar 2025 não encontrado: {path}")
    totals: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    with path.open("r", encoding="latin-1", newline="") as source:
        reader = csv.DictReader(source, delimiter=";")
        missing = {"SG_UF", "CO_MUNICIPIO", *OFFICIAL_CENSUS_FIELDS} - set(reader.fieldnames or [])
        if missing:
            raise RuntimeError(f"Microdado sem campos obrigatórios: {sorted(missing)}")
        for row in reader:
            if row.get("SG_UF") != "RS":
                continue
            municipality_id = str(row["CO_MUNICIPIO"])
            for source_field, contract_field in OFFICIAL_CENSUS_FIELDS.items():
                raw = str(row.get(source_field) or "").strip().replace(",", ".")
                if raw:
                    totals[municipality_id][contract_field] += int(float(raw))
    normalized = {identifier: dict(values) for identifier, values in totals.items()}
    if len(normalized) != EXPECTED_MUNICIPALITIES:
        raise RuntimeError(
            f"Microdado oficial cobre {len(normalized)} municípios do RS; esperados 497."
        )
    return normalized


def load_performance_rows(engine: Any) -> dict[str, list[dict[str, Any]]]:
    """Lê as taxas municipais oficiais total/total de 2025, sem recalcular médias."""
    from sqlalchemy import text

    query = text(
        """
        SELECT ano, id_municipio, etapa_ensino,
               taxa_aprovacao, taxa_reprovacao, taxa_abandono
        FROM rendimento_escolar
        WHERE ano = :reference_year
          AND dependencia = 'total'
          AND localizacao = 'total'
          AND etapa_ensino IN (
            'fundamental', 'fundamental_anos_iniciais',
            'fundamental_anos_finais', 'medio'
          )
        ORDER BY id_municipio, etapa_ensino
        """
    )
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    with engine.connect() as connection:
        for row in connection.execute(query, {"reference_year": REFERENCE_YEAR}).mappings():
            grouped[str(row["id_municipio"])].append(dict(row))
    if len(grouped) != EXPECTED_MUNICIPALITIES:
        raise RuntimeError(f"Rendimento 2025 cobre {len(grouped)} municípios; esperados 497.")
    return dict(grouped)


def _value_at(payload: Mapping[str, Any], path: tuple[str, ...]) -> Any:
    value: Any = payload
    for key in path:
        value = value[key]
    return value


def _walk_values(value: Any) -> Iterable[Mapping[str, Any]]:
    if isinstance(value, Mapping):
        yield value
        for nested in value.values():
            yield from _walk_values(nested)
    elif isinstance(value, list):
        for nested in value:
            yield from _walk_values(nested)


def _validate_snapshot_value_states(
    contract: Mapping[str, Any], municipality_id: str
) -> Counter[str]:
    states: Counter[str] = Counter()
    for value in _walk_values(contract):
        if "state" not in value or "value" not in value:
            continue
        state = value["state"]
        if state not in {"observed", "derived_zero", "unavailable", "not_applicable"}:
            raise RuntimeError(f"{municipality_id}: estado de dado inválido: {state}.")
        states[str(state)] += 1
        if state == "observed" and not isinstance(value["value"], (int, float)):
            raise RuntimeError(f"{municipality_id}: observed sem valor numérico.")
        if state == "derived_zero" and value["value"] != 0:
            raise RuntimeError(f"{municipality_id}: derived_zero precisa ser 0.")
        if state in {"unavailable", "not_applicable"} and value["value"] is not None:
            raise RuntimeError(f"{municipality_id}: {state} precisa ter valor nulo.")
    return states


def _validate_contract(
    contract: Mapping[str, Any], expected: Mapping[str, str], generated_at: str
) -> Counter[str]:
    municipality_id = expected["idMunicipality"]
    if contract.get("schemaVersion") != SCHEMA_VERSION:
        raise RuntimeError(f"{municipality_id}: schemaVersion incompatível.")
    if contract.get("municipality") != dict(expected):
        raise RuntimeError(f"{municipality_id}: identificação municipal incompatível.")
    reference = contract.get("reference") or {}
    if reference.get("year") != REFERENCE_YEAR or reference.get("generatedAt") != generated_at:
        raise RuntimeError(f"{municipality_id}: referência do snapshot incompatível.")
    if any(
        key in FORBIDDEN_CONTRACT_FIELDS
        for value in _walk_values(contract)
        for key in value
    ):
        raise RuntimeError(f"{municipality_id}: contrato inclui campo temporal proibido.")
    if any(
        key == "year" and value != REFERENCE_YEAR
        for mapping in _walk_values(contract)
        for key, value in mapping.items()
    ):
        raise RuntimeError(f"{municipality_id}: contrato inclui ano diferente de 2025.")
    for path in CORE_TOTAL_PATHS:
        value = _value_at(contract, path)
        if not isinstance(value, Mapping) or "state" not in value:
            raise RuntimeError(
                f"{municipality_id}: total central ausente em {'.'.join(path)}."
            )
    for stage_path in STAGE_PATHS:
        stage = _value_at(contract, stage_path)
        if set(stage.get("byNetwork") or {}) != {
            "publicSubtotal",
            "municipal",
            "state",
            "federal",
            "private",
        }:
            raise RuntimeError(f"{municipality_id}: redes incompletas em {'.'.join(stage_path)}.")
        if set(stage.get("bySchoolLocation") or {}) != {"urban", "rural"}:
            raise RuntimeError(
                f"{municipality_id}: localizações incompletas em {'.'.join(stage_path)}."
            )
    if not contract.get("sources") or any(
        source.get("referenceYear") != REFERENCE_YEAR
        for source in contract["sources"]
    ):
        raise RuntimeError(f"{municipality_id}: fontes incompatíveis.")
    return _validate_snapshot_value_states(contract, municipality_id)


def validate_contract_directory(
    directory: Path,
    entries: Iterable[Mapping[str, str]],
    generated_at: str,
    *,
    require_expected_distribution: bool,
) -> dict[str, Any]:
    entries_list = list(entries)
    expected_by_slug = {entry["slug"]: entry for entry in entries_list}
    expected_by_id = {entry["idMunicipality"]: entry for entry in entries_list}
    paths = sorted(directory.glob("*.json"))
    expected_names = set(expected_by_slug) | set(expected_by_id)
    actual_names = {path.stem for path in paths}
    if actual_names != expected_names or len(paths) != len(expected_names):
        missing = sorted(expected_names - actual_names)
        unexpected = sorted(actual_names - expected_names)
        raise RuntimeError(
            f"Diretório VGM-3 incompleto: {len(paths)} arquivos; "
            f"ausentes={missing[:5]}; inesperados={unexpected[:5]}."
        )

    publication_states: Counter[str] = Counter()
    data_states: Counter[str] = Counter()
    reconciliation_states: Counter[str] = Counter()
    null_core_municipalities: set[str] = set()
    sizes: list[int] = []
    canonical_contracts: dict[str, bytes] = {}
    composition_reconciled = 0
    performance_coverage: Counter[str] = Counter()
    performance_states: Counter[str] = Counter()

    for slug, entry in expected_by_slug.items():
        canonical_path = directory / f"{slug}.json"
        alias_path = directory / f"{entry['idMunicipality']}.json"
        canonical_content = canonical_path.read_bytes()
        alias_content = alias_path.read_bytes()
        if canonical_content != alias_content:
            raise RuntimeError(
                f"{entry['idMunicipality']}: alias IBGE difere do arquivo canônico."
            )
        contract = json.loads(
            canonical_content.decode("utf-8"), object_pairs_hook=_reject_duplicate_keys
        )
        data_states.update(_validate_contract(contract, entry, generated_at))
        composition = contract.get("basicEducationComposition") or {}
        if (composition.get("reconciliation") or {}).get("status") == "reconciled":
            composition_reconciled += 1
        if not contract.get("specialEducation") or not contract.get("schoolPerformance"):
            raise RuntimeError(f"{entry['idMunicipality']}: ampliação final incompleta.")
        for stage, rates in contract["schoolPerformance"]["stages"].items():
            states = [value.get("state") for value in rates.values()]
            performance_states.update(states)
            if all(state == "observed" for state in states):
                performance_coverage[stage] += 1
        publication_states[str(contract.get("publicationState"))] += 1
        reconciliations = list(
            (contract.get("quality") or {}).get("reconciliations") or []
        )
        if len(reconciliations) != 26:
            raise RuntimeError(f"{entry['idMunicipality']}: esperadas 26 reconciliações.")
        reconciliation_states.update(str(item.get("status")) for item in reconciliations)
        if any(item.get("status") == "divergent" for item in reconciliations):
            raise RuntimeError(f"{entry['idMunicipality']}: reconciliação divergente.")
        if (contract.get("quality") or {}).get("nullCoreRows"):
            null_core_municipalities.add(entry["idMunicipality"])
        sizes.append(len(canonical_content))
        canonical_contracts[entry["idMunicipality"]] = canonical_content

    if set(publication_states) - set(EXPECTED_PUBLICATION_STATES):
        raise RuntimeError(f"Estados de publicação desconhecidos: {dict(publication_states)}.")
    publication_distribution = {
        state: publication_states[state] for state in EXPECTED_PUBLICATION_STATES
    }
    reconciliation_distribution = {
        state: reconciliation_states[state] for state in EXPECTED_RECONCILIATIONS
    }
    if (
        require_expected_distribution
        and publication_distribution != EXPECTED_PUBLICATION_STATES
    ):
        raise RuntimeError(
            f"Distribuição de publicação divergente: {publication_distribution}."
        )
    if (
        require_expected_distribution
        and reconciliation_distribution != EXPECTED_RECONCILIATIONS
    ):
        raise RuntimeError(
            f"Distribuição de reconciliações divergente: {reconciliation_distribution}."
        )
    if require_expected_distribution and len(null_core_municipalities) != 71:
        raise RuntimeError(
            "Esperados 71 municípios com nullCoreRows; "
            f"encontrados {len(null_core_municipalities)}."
        )
    if composition_reconciled != EXPECTED_MUNICIPALITIES:
        raise RuntimeError(
            f"Composição da Educação Básica reconciliada em {composition_reconciled}/497 municípios."
        )
    expected_performance_coverage = {
        "elementary": 497,
        "initialYears": 497,
        "finalYears": 497,
        "highSchool": 496,
    }
    if dict(performance_coverage) != expected_performance_coverage:
        raise RuntimeError(
            f"Cobertura de rendimento divergente: {dict(performance_coverage)}."
        )

    sapucaia = json.loads(canonical_contracts["4320008"].decode("utf-8"))
    if (
        sapucaia["municipality"]["slug"] != "sapucaia-do-sul"
        or sapucaia["reference"]["year"] != REFERENCE_YEAR
        or sapucaia["basicEducation"]["total"]["value"] != 25_826
        or sapucaia["publicationState"] != "published"
        or sapucaia["quality"]["nullCoreRows"]
        or any(
            item["status"] != "reconciled"
            for item in sapucaia["quality"]["reconciliations"]
        )
    ):
        raise RuntimeError("Piloto Sapucaia do Sul incompatível.")
    for stage_path in STAGE_PATHS:
        federal = _value_at(sapucaia, stage_path)["byNetwork"]["federal"]["enrollments"]
        expected_state = "observed" if stage_path == ("highSchool", "total") else "derived_zero"
        expected_value = 817 if stage_path == ("highSchool", "total") else 0
        if federal["state"] != expected_state or federal["value"] != expected_value:
            raise RuntimeError("Piloto Sapucaia do Sul: rede federal incompatível.")
    sao_pedro = json.loads(canonical_contracts["4319356"].decode("utf-8"))
    if any(
        value["state"] != "not_applicable" or value["value"] is not None
        for value in sao_pedro["schoolPerformance"]["stages"]["highSchool"].values()
    ):
        raise RuntimeError("São Pedro da Serra: Ensino Médio precisa ser not_applicable.")

    return {
        "canonicalCount": len(expected_by_slug),
        "aliasCount": len(expected_by_id),
        "publicationStates": publication_distribution,
        "dataStates": dict(sorted(data_states.items())),
        "reconciliations": reconciliation_distribution,
        "nullCoreMunicipalities": len(null_core_municipalities),
        "basicEducationCompositionReconciled": composition_reconciled,
        "schoolPerformanceCoverage": dict(performance_coverage),
        "schoolPerformanceStates": dict(sorted(performance_states.items())),
        "sizeBytes": {
            "total": sum(sizes),
            "mean": statistics.fmean(sizes),
            "minimum": min(sizes),
            "maximum": max(sizes),
        },
    }


def _write_contracts(
    directory: Path,
    contracts: Mapping[str, Mapping[str, Any]],
    entries: Iterable[Mapping[str, str]],
) -> None:
    entries_by_id = {entry["idMunicipality"]: entry for entry in entries}
    if set(contracts) != set(entries_by_id):
        raise RuntimeError("Contratos e registro municipal não possuem a mesma cobertura.")
    directory.mkdir(parents=True, exist_ok=False)
    for municipality_id, entry in entries_by_id.items():
        content = _serialize(contracts[municipality_id])
        (directory / f"{entry['slug']}.json").write_bytes(content)
        (directory / f"{municipality_id}.json").write_bytes(content)


def replace_directory_transactionally(
    temporary_directory: Path, output_directory: Path
) -> None:
    """Promove o lote validado e restaura o diretório anterior se a troca falhar."""
    if not temporary_directory.is_dir():
        raise RuntimeError("Diretório temporário VGM-3 ausente.")
    output_directory.parent.mkdir(parents=True, exist_ok=True)
    backup_directory = (
        output_directory.parent / f".{output_directory.name}.backup-{uuid.uuid4().hex}"
    )
    moved_previous = False
    try:
        if output_directory.exists():
            os.replace(output_directory, backup_directory)
            moved_previous = True
        os.replace(temporary_directory, output_directory)
    except Exception:
        if moved_previous and not output_directory.exists() and backup_directory.exists():
            os.replace(backup_directory, output_directory)
        raise
    finally:
        if temporary_directory.exists():
            shutil.rmtree(temporary_directory, ignore_errors=True)
    if backup_directory.exists():
        shutil.rmtree(backup_directory)


def materialize_contracts(
    rows: Iterable[Mapping[str, Any]],
    entries: Iterable[Mapping[str, str]],
    generated_at: str,
    supplemental_by_municipality: Mapping[str, Mapping[str, Any]] | None = None,
    performance_by_municipality: Mapping[str, Iterable[Mapping[str, Any]]] | None = None,
) -> dict[str, dict[str, Any]]:
    rows_list = [dict(row) for row in rows]
    entries_list = [dict(entry) for entry in entries]
    rows_by_municipality: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows_list:
        rows_by_municipality[str(row["id_municipio"])].append(row)
    expected_ids = {entry["idMunicipality"] for entry in entries_list}
    actual_ids = set(rows_by_municipality)
    if actual_ids != expected_ids:
        raise RuntimeError(
            "A view não corresponde ao registro municipal: "
            f"ausentes={sorted(expected_ids - actual_ids)[:5]}; "
            f"extras={sorted(actual_ids - expected_ids)[:5]}."
        )
    completeness = build_2025_completeness_evidence(rows_list)
    if not completeness["isCompleteForDerivedZero"]:
        raise RuntimeError(
            f"A carga 2025 não é completa para zeros derivados: {completeness}."
        )
    global_null_audit = audit_fully_null_rows(rows_list)
    if global_null_audit["affectedMunicipalityYears"] != 71:
        raise RuntimeError(
            "A auditoria de nullCoreRows divergiu do baseline VGM-2.1: "
            f"{global_null_audit['affectedMunicipalityYears']} encontrados."
        )
    supplemental = supplemental_by_municipality or {}
    performance = performance_by_municipality or {}
    contracts = {}
    for entry in entries_list:
        municipality_id = entry["idMunicipality"]
        official = dict(supplemental.get(municipality_id) or {})
        view_basic = sum(
            int(row["mat_basico"])
            for row in rows_by_municipality[municipality_id]
            if row.get("mat_basico") is not None
        )
        if official and official.get("mat_basico_oficial") != view_basic:
            raise RuntimeError(
                f"{municipality_id}: QT_MAT_BAS do microdado diverge da view homologada."
            )
        view_high_school = sum(
            int(row["mat_medio"])
            for row in rows_by_municipality[municipality_id]
            if row.get("mat_medio") is not None
        )
        if official and official.get("mat_medio") != view_high_school:
            raise RuntimeError(
                f"{municipality_id}: QT_MAT_MED do microdado diverge da consulta municipal."
            )
        contracts[municipality_id] = materialize_municipal_education_overview(
            rows_by_municipality[municipality_id],
            entry,
            generated_at,
            completeness=completeness,
            supplemental=official,
            performance_rows=performance.get(municipality_id, []),
        )
    return contracts


def _generated_at(value: str | None) -> str:
    if value:
        try:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("--generated-at precisa usar ISO 8601.") from exc
        return value
    return datetime.now().astimezone().isoformat(timespec="seconds")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Materializa contratos municipais VGM-3.")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--registry", default=str(REGISTRY_PATH))
    parser.add_argument(
        "--generated-at", help="ISO 8601 compartilhado pelos 497 contratos."
    )
    parser.add_argument(
        "--censo-2025-csv",
        required=True,
        help="Caminho para o microdado oficial do Censo Escolar 2025.",
    )
    args = parser.parse_args(argv)

    output_directory = Path(args.output_dir).resolve()
    entries = _registry_entries(Path(args.registry).resolve())
    generated_at = _generated_at(args.generated_at)
    engine = get_local_postgres_engine()
    rows = load_view_rows(engine)
    supplemental = load_official_census_totals(Path(args.censo_2025_csv).resolve())
    performance = load_performance_rows(engine)
    contracts = materialize_contracts(
        rows,
        entries,
        generated_at,
        supplemental_by_municipality=supplemental,
        performance_by_municipality=performance,
    )

    temporary_parent = output_directory.parent
    temporary_parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(
        prefix=f".{output_directory.name}.tmp-", dir=temporary_parent
    ) as temporary_path:
        temporary_directory = Path(temporary_path) / output_directory.name
        _write_contracts(temporary_directory, contracts, entries)
        report = validate_contract_directory(
            temporary_directory,
            entries,
            generated_at,
            require_expected_distribution=True,
        )
        replace_directory_transactionally(temporary_directory, output_directory)

    print(
        json.dumps(
            {
                "outputDirectory": str(output_directory),
                "generatedAt": generated_at,
                **report,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
