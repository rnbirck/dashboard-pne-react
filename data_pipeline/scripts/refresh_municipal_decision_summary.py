from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_PIPELINE_DIR = REPO_ROOT / "data_pipeline"
if str(DATA_PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(DATA_PIPELINE_DIR))

from src.municipal_diagnostic import (  # noqa: E402
    CATEGORY_ORDER,
    _build_decision_reading,
    _build_decision_summary,
    _theme_summary,
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


def _refresh_contract(contract: dict[str, Any]) -> None:
    indicators = contract.get("indicators") or []
    if len(indicators) != 49:
        raise RuntimeError(
            f"Contrato {contract.get('municipalityId')} tem {len(indicators)} indicadores."
        )
    for indicator in indicators:
        indicator["decisionReading"] = _build_decision_reading(
            comparison_status=str(indicator.get("targetComparisonStatus") or ""),
            goal_attained=indicator.get("goalAttained"),
            trajectory=indicator.get("trajectory") or {},
            governance=indicator.get("governance") or {},
            exposure=indicator.get("municipalExposure") or {},
            evidence=indicator.get("evidence") or {},
        )
    contract["decisionSummary"] = _build_decision_summary(indicators)
    attention_items = contract.get("attentionItems") or []
    contract["summary"]["themes"] = [
        _theme_summary(theme, indicators, attention_items) for theme in CATEGORY_ORDER
    ]


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _refresh_partitioned_contracts() -> tuple[int, int]:
    refreshed = 0
    official_ids: set[str] = set()
    for root in CONTRACT_ROOTS:
        paths = sorted(root.glob("*/diagnostico.json"))
        if not paths:
            raise RuntimeError(f"Nenhum contrato localizado em {root}.")
        for path in paths:
            contract = json.loads(path.read_text(encoding="utf-8"))
            _refresh_contract(contract)
            _write_json(path, contract)
            refreshed += 1
            municipality_id = str(contract.get("municipalityId") or "")
            if municipality_id.isdigit():
                official_ids.add(municipality_id)
    if len(official_ids) != 497:
        raise RuntimeError(
            f"Esperados 497 IDs municipais; encontrados {len(official_ids)}."
        )
    return refreshed, len(official_ids)


def _refresh_monolith() -> int:
    payload = json.loads(MONOLITH_PATH.read_text(encoding="utf-8"))
    municipalities = payload.get("municipios") or {}
    if len(municipalities) != 497:
        raise RuntimeError(
            f"Monolito tem {len(municipalities)} municípios; esperados 497."
        )
    for municipal_payload in municipalities.values():
        contract = municipal_payload.get("diagnostico_v2") or {}
        _refresh_contract(contract)
    _write_json(MONOLITH_PATH, payload)
    return len(municipalities)


def main() -> int:
    refreshed_files, official_count = _refresh_partitioned_contracts()
    monolith_count = _refresh_monolith()
    print(
        "[refresh-decision-summary] "
        f"{refreshed_files} arquivos, {official_count} IDs oficiais e "
        f"{monolith_count} contratos no monólito atualizados."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
