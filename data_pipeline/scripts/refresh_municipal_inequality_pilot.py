from __future__ import annotations

import json
import statistics
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Mapping


REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_PIPELINE_DIR = REPO_ROOT / "data_pipeline"
if str(DATA_PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(DATA_PIPELINE_DIR))

from src.municipal_diagnostic import (  # noqa: E402
    build_urban_rural_integral_pilot,
)


MONOLITH_PATH = (
    DATA_PIPELINE_DIR
    / "export"
    / "data"
    / "pne_2026_2036"
    / "diagnostico_por_municipio.json"
)
CONTRACT_ROOTS = (
    DATA_PIPELINE_DIR / "export" / "data_partitioned" / "municipios",
    REPO_ROOT / "public" / "data" / "municipios",
)
PUBLIC_CONTRACT_ROOT = REPO_ROOT / "public" / "data" / "municipios"
EDUCATION_ROOT = REPO_ROOT / "public" / "data" / "educacao" / "municipios"


def _serialized(contract: Mapping[str, Any]) -> str:
    return json.dumps(contract, ensure_ascii=False, indent=2) + "\n"


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, payload: Mapping[str, Any]) -> None:
    path.write_text(_serialized(payload), encoding="utf-8")


def _protected_snapshot(contract: Mapping[str, Any]) -> str:
    protected = {
        "decisionSummary": contract.get("decisionSummary"),
        "indicators": [
            {
                "indicatorId": indicator.get("indicatorId"),
                "decisionReading": indicator.get("decisionReading"),
                "evidenceLevel": indicator.get("evidenceLevel"),
                "priorityScore": indicator.get("priorityScore"),
            }
            for indicator in (contract.get("indicators") or [])
        ],
        "financialRecommendationPublished": (
            contract.get("generationMetadata") or {}
        ).get("financialRecommendationPublished"),
    }
    return json.dumps(protected, ensure_ascii=False, sort_keys=True)


def _education_rows(municipality_id: str) -> list[dict[str, Any]]:
    payload = _read_json(EDUCATION_ROOT / f"{municipality_id}.json")
    return list(
        (((payload.get("blocos") or {}).get("matriculas") or {})
        .get("detalhamentos", {})
        .get("por_rede_localizacao", []))
    )


def _apply_pilot(contract: dict[str, Any], rows: list[dict[str, Any]]) -> None:
    protected_before = _protected_snapshot(contract)
    contract["inequalityPilot"] = build_urban_rural_integral_pilot(rows)
    metadata = contract.setdefault("generationMetadata", {})
    metadata["inequalityPilotPublished"] = True
    metadata["inequalityPilotAffectsDecisionSummary"] = False
    implemented = list(metadata.get("implementedSubstages") or [])
    for stage in ("P4-A", "P4-B-pilot"):
        if stage not in implemented:
            implemented.append(stage)
    metadata["implementedSubstages"] = implemented
    deferred = [
        "P4-remaining" if stage == "P4" else stage
        for stage in (metadata.get("deferredStages") or [])
    ]
    metadata["deferredStages"] = list(dict.fromkeys(deferred))
    if _protected_snapshot(contract) != protected_before:
        raise RuntimeError(
            f"Campos protegidos mudaram em {contract.get('municipalityName')}"
        )


def _official_contract_paths() -> list[Path]:
    return sorted(
        path
        for path in PUBLIC_CONTRACT_ROOT.glob("*/diagnostico.json")
        if path.parent.name.isdigit()
    )


def _municipality_identity() -> tuple[dict[str, str], dict[str, list[dict[str, Any]]]]:
    name_to_id: dict[str, str] = {}
    rows_by_id: dict[str, list[dict[str, Any]]] = {}
    for path in _official_contract_paths():
        contract = _read_json(path)
        municipality_id = path.parent.name
        name_to_id[str(contract.get("municipalityName"))] = municipality_id
        rows_by_id[municipality_id] = _education_rows(municipality_id)
    if len(name_to_id) != 497 or len(rows_by_id) != 497:
        raise RuntimeError(
            f"Esperados 497 municípios; nomes={len(name_to_id)}, fontes={len(rows_by_id)}."
        )
    return name_to_id, rows_by_id


def _refresh_physical_contracts(
    name_to_id: Mapping[str, str],
    rows_by_id: Mapping[str, list[dict[str, Any]]],
) -> int:
    refreshed = 0
    for root in CONTRACT_ROOTS:
        paths = sorted(root.glob("*/diagnostico.json"))
        if not paths:
            raise RuntimeError(f"Nenhum contrato localizado em {root}.")
        for path in paths:
            contract = _read_json(path)
            municipality_id = str(contract.get("municipalityId") or "")
            if not municipality_id.isdigit():
                municipality_id = name_to_id[str(contract.get("municipalityName"))]
            _apply_pilot(contract, rows_by_id[municipality_id])
            _write_json(path, contract)
            refreshed += 1
    return refreshed


def _refresh_monolith(
    name_to_id: Mapping[str, str],
    rows_by_id: Mapping[str, list[dict[str, Any]]],
) -> int:
    payload = _read_json(MONOLITH_PATH)
    municipalities = payload.get("municipios") or {}
    if len(municipalities) != 497:
        raise RuntimeError(
            f"Monólito tem {len(municipalities)} municípios; esperados 497."
        )
    for municipality_name, municipal_payload in municipalities.items():
        contract = municipal_payload.get("diagnostico_v2") or {}
        municipality_id = name_to_id[str(municipality_name)]
        _apply_pilot(contract, rows_by_id[municipality_id])
    _write_json(MONOLITH_PATH, payload)
    return len(municipalities)


def _payload_metrics(before_sizes: Mapping[str, int]) -> dict[str, Any]:
    after_sizes: dict[str, int] = {}
    status_counts: Counter[str] = Counter()
    group_status_counts: Counter[str] = Counter()
    for path in _official_contract_paths():
        contract = _read_json(path)
        municipality_id = path.parent.name
        after_sizes[municipality_id] = path.stat().st_size
        pilot = contract.get("inequalityPilot") or {}
        status_counts[str(pilot.get("status"))] += 1
        for group in pilot.get("groups") or []:
            group_status_counts[str(group.get("status"))] += 1
    increases = [
        after_sizes[municipality_id] - before_sizes[municipality_id]
        for municipality_id in sorted(after_sizes)
    ]
    largest_id = max(after_sizes, key=after_sizes.get)
    return {
        "municipalityCount": len(after_sizes),
        "averageIncreaseBytes": round(statistics.mean(increases), 2),
        "maximumIncreaseBytes": max(increases),
        "totalIncreaseBytes": sum(increases),
        "averageDetailTransferBytes": round(statistics.mean(after_sizes.values()), 2),
        "largestDetailTransfer": {
            "municipalityId": largest_id,
            "bytes": after_sizes[largest_id],
        },
        "totalOfficialPayloadBytes": sum(after_sizes.values()),
        "pilotStatuses": dict(sorted(status_counts.items())),
        "groupStatuses": dict(sorted(group_status_counts.items())),
    }


def main() -> int:
    official_paths = _official_contract_paths()
    before_sizes = {path.parent.name: path.stat().st_size for path in official_paths}
    if len(before_sizes) != 497:
        raise RuntimeError(
            f"Esperados 497 contratos oficiais; encontrados {len(before_sizes)}."
        )
    name_to_id, rows_by_id = _municipality_identity()
    refreshed_files = _refresh_physical_contracts(name_to_id, rows_by_id)
    monolith_count = _refresh_monolith(name_to_id, rows_by_id)
    metrics = _payload_metrics(before_sizes)
    print(
        "[refresh-inequality-pilot] "
        f"{refreshed_files} arquivos físicos e {monolith_count} contratos do monólito atualizados."
    )
    print(json.dumps(metrics, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
