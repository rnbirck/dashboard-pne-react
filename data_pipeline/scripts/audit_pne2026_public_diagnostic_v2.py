from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Iterator


PIPELINE_DIR = Path(__file__).resolve().parents[1]
REPOSITORY_DIR = PIPELINE_DIR.parent
PUBLIC_DATA_DIR = REPOSITORY_DIR / "public" / "data"

if str(PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_DIR))

from src.pne2026_public_diagnostic_v2 import (  # noqa: E402
    audit_pne2026_public_diagnostic_v2,
)


def _municipality_payloads() -> Iterator[tuple[dict[str, Any], dict[str, Any]]]:
    registry = json.loads(
        (PUBLIC_DATA_DIR / "municipios_index.json").read_text(encoding="utf-8")
    )
    for municipality in registry["municipios"]:
        directory = PUBLIC_DATA_DIR / "municipios" / municipality["slug"]
        diagnostic = json.loads(
            (directory / "diagnostico.json").read_text(encoding="utf-8")
        )
        pne_payload = json.loads(
            (directory / "index.json").read_text(encoding="utf-8")
        )["pne_2026_2036"]
        yield diagnostic, pne_payload


def main() -> int:
    audit = audit_pne2026_public_diagnostic_v2(_municipality_payloads())
    print(json.dumps(audit, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
