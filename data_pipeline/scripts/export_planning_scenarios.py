"""Export approved planning scenarios into the canonical aggregate data flow."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


PIPELINE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PIPELINE_ROOT.parent
if str(PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_ROOT))

from src.planning_scenarios import load_approved_planning_scenarios  # noqa: E402


DEFAULT_ARTIFACT_ROOT = REPO_ROOT / "artifacts" / "projections-v2"
DEFAULT_MUNICIPALITY_SOURCE = PIPELINE_ROOT / "export" / "data" / "municipios.json"
DEFAULT_OUTPUT_PATH = (
    PIPELINE_ROOT
    / "export"
    / "data"
    / "pne_2026_2036"
    / "cenarios_planejamento_por_municipio.json"
)


def export_planning_scenarios(
    *,
    artifact_root: Path = DEFAULT_ARTIFACT_ROOT,
    municipality_source: Path = DEFAULT_MUNICIPALITY_SOURCE,
    output_path: Path = DEFAULT_OUTPUT_PATH,
) -> dict[str, Any]:
    municipality_payload = _load_json(municipality_source)
    municipalities = municipality_payload.get("municipios", [])
    payload = load_approved_planning_scenarios(artifact_root.resolve(), municipalities)
    _write_json_if_changed(output_path.resolve(), payload)
    return payload


def _load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _write_json_if_changed(path: Path, payload: dict[str, Any]) -> str:
    content = json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return "preserved"
    action = "updated" if path.exists() else "created"
    path.write_text(content, encoding="utf-8")
    return action


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifact-root", type=Path, default=DEFAULT_ARTIFACT_ROOT)
    parser.add_argument("--municipality-source", type=Path, default=DEFAULT_MUNICIPALITY_SOURCE)
    parser.add_argument("--output-path", type=Path, default=DEFAULT_OUTPUT_PATH)
    args = parser.parse_args()
    payload = export_planning_scenarios(
        artifact_root=args.artifact_root,
        municipality_source=args.municipality_source,
        output_path=args.output_path,
    )
    print(
        json.dumps(
            {
                "contractVersion": payload["contractVersion"],
                "publicationStatus": payload["publicationStatus"],
                "municipalityCount": payload["municipalityCount"],
                "indicatorKeys": payload["indicatorKeys"],
                "output": str(args.output_path),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
