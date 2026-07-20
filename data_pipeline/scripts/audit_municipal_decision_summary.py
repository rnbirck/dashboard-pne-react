from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable, Mapping


REPO_ROOT = Path(__file__).resolve().parents[2]
PUBLIC_MUNICIPALITIES = REPO_ROOT / "public" / "data" / "municipios"
DEFAULT_SUMMARY_OUTPUT = (
    REPO_ROOT / "docs" / "data" / "diagnostico_municipal_classificacoes_497.csv"
)
DEFAULT_SAMPLE_OUTPUT = (
    REPO_ROOT / "docs" / "data" / "diagnostico_municipal_auditoria_amostra.csv"
)
NOVA_SANTA_RITA_OUTPUT = (
    REPO_ROOT / "docs" / "data" / "nova_santa_rita_diagnostico_exemplo.json"
)

DECISION_CLASSES = (
    "municipal_direct_action",
    "municipal_action_with_coordination",
    "intergovernmental_coordination",
    "investigate_data_or_supply",
    "preserve_result",
    "monitor",
    "insufficient_evidence",
)

SAMPLE_MUNICIPALITIES = (
    "Aceguá",
    "Agudo",
    "André da Rocha",
    "Bagé",
    "Caxias do Sul",
    "Erechim",
    "Nova Santa Rita",
    "Osório",
    "Passo Fundo",
    "Pelotas",
    "Porto Alegre",
    "Santa Maria",
    "Santa Rosa",
    "São Borja",
    "Uruguaiana",
)


def _contracts() -> Iterable[dict[str, Any]]:
    paths = sorted(
        path
        for path in PUBLIC_MUNICIPALITIES.glob("*/diagnostico.json")
        if re.fullmatch(r"\d{7}", path.parent.name)
    )
    if len(paths) != 497:
        raise RuntimeError(f"Esperados 497 contratos oficiais; encontrados {len(paths)}.")
    for path in paths:
        yield json.loads(path.read_text(encoding="utf-8"))


def _text(value: Any) -> str:
    return "" if value is None else str(value)


def _decision_reference_lookup(contract: Mapping[str, Any]) -> dict[str, dict[str, Any]]:
    lookup: dict[str, dict[str, Any]] = {}
    for collection_name in (
        "municipalActionItems",
        "coordinationItems",
        "investigationItems",
        "monitoringItems",
        "preservationItems",
    ):
        for reference in (contract.get("decisionSummary") or {}).get(collection_name, []):
            lookup[str(reference["indicatorId"])] = dict(reference)
    return lookup


def _expected_decision_classification(indicator: Mapping[str, Any]) -> str:
    evidence_level = indicator.get("evidenceLevel")
    comparison_status = indicator.get("targetComparisonStatus")
    goal_attained = indicator.get("goalAttained")
    governance = (indicator.get("governance") or {}).get("classification")
    if evidence_level == "insufficient":
        return "insufficient_evidence"
    if evidence_level == "low":
        return "investigate_data_or_supply"
    if goal_attained is True:
        return "preserve_result" if evidence_level == "high" else "monitor"
    if comparison_status != "eligible" or goal_attained is not False:
        return "monitor"
    if governance == "direct":
        return "municipal_direct_action"
    if governance in {"state_led", "federal_led", "territorial"}:
        return "intergovernmental_coordination"
    if governance == "shared":
        return "municipal_action_with_coordination"
    return "investigate_data_or_supply"


def write_classification_summary(
    contracts: list[dict[str, Any]], output_path: Path
) -> None:
    decision_counts: dict[str, Counter[str]] = defaultdict(Counter)
    evidence_counts: dict[str, Counter[str]] = defaultdict(Counter)
    governance_counts: dict[str, Counter[str]] = defaultdict(Counter)
    exposure_counts: dict[str, Counter[str]] = defaultdict(Counter)
    attention_presence: Counter[str] = Counter()
    titles: dict[str, str] = {}

    for contract in contracts:
        attention_ids = {
            str(item["indicatorId"]) for item in contract.get("attentionItems", [])
        }
        for indicator in contract.get("indicators", []):
            indicator_id = str(indicator["indicatorId"])
            titles[indicator_id] = str(indicator.get("title") or indicator_id)
            decision_counts[indicator_id][
                str((indicator.get("decisionReading") or {}).get("classification"))
            ] += 1
            evidence_counts[indicator_id][
                str(indicator.get("evidenceLevel") or "not_available")
            ] += 1
            governance_counts[indicator_id][
                str((indicator.get("governance") or {}).get("classification"))
            ] += 1
            exposure_counts[indicator_id][
                str((indicator.get("municipalExposure") or {}).get("status"))
            ] += 1
            if indicator_id in attention_ids:
                attention_presence[indicator_id] += 1

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "indicador_id",
        "indicador",
        *DECISION_CLASSES,
        "evidencia_high",
        "evidencia_medium",
        "evidencia_low",
        "evidencia_insufficient",
        "governabilidade_direct",
        "governabilidade_shared",
        "governabilidade_state_led",
        "governabilidade_federal_led",
        "governabilidade_territorial",
        "governabilidade_informational",
        "exposicao_disponivel",
        "presenca_attention_items_legado",
    ]
    with output_path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fieldnames)
        writer.writeheader()
        for indicator_id in sorted(titles):
            row: dict[str, Any] = {
                "indicador_id": indicator_id,
                "indicador": titles[indicator_id],
                "exposicao_disponivel": exposure_counts[indicator_id]["available"],
                "presenca_attention_items_legado": attention_presence[indicator_id],
            }
            row.update(
                {classification: decision_counts[indicator_id][classification] for classification in DECISION_CLASSES}
            )
            row.update(
                {
                    f"evidencia_{level}": evidence_counts[indicator_id][level]
                    for level in ("high", "medium", "low", "insufficient")
                }
            )
            row.update(
                {
                    f"governabilidade_{classification}": governance_counts[indicator_id][classification]
                    for classification in (
                        "direct",
                        "shared",
                        "state_led",
                        "federal_led",
                        "territorial",
                        "informational",
                    )
                }
            )
            writer.writerow(row)


def write_sample_audit(contracts: list[dict[str, Any]], output_path: Path) -> None:
    by_name = {str(contract["municipalityName"]): contract for contract in contracts}
    missing = [name for name in SAMPLE_MUNICIPALITIES if name not in by_name]
    if missing:
        raise RuntimeError(f"Municípios da amostra ausentes: {', '.join(missing)}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "municipio",
        "indicador",
        "valor",
        "meta",
        "evidencia",
        "motivo_evidencia",
        "trajetoria",
        "pares",
        "governabilidade",
        "exposicao",
        "classificacao",
        "colecao_selecionada",
        "presenca_cabecalho",
        "presenca_financiamento",
        "classificacao_esperada",
        "conformidade",
        "divergencia",
        "razoes",
        "posicao_anterior",
        "posicao_nova",
    ]
    with output_path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fieldnames)
        writer.writeheader()
        for municipality_name in SAMPLE_MUNICIPALITIES:
            contract = by_name[municipality_name]
            legacy_positions = {
                str(item["indicatorId"]): item.get("rank")
                for item in contract.get("attentionItems", [])
            }
            decision_references = _decision_reference_lookup(contract)
            municipal_action_ids = [
                str(item["indicatorId"])
                for item in (contract.get("decisionSummary") or {}).get(
                    "municipalActionItems", []
                )
            ]
            financing_ids = set(municipal_action_ids)
            financing_ids.update(
                str(item["indicatorId"])
                for item in (contract.get("decisionSummary") or {}).get(
                    "coordinationItems", []
                )
            )
            header_indicator_id = municipal_action_ids[0] if municipal_action_ids else None
            for indicator in contract.get("indicators", []):
                indicator_id = str(indicator["indicatorId"])
                peers = indicator.get("similarMunicipalities") or {}
                exposure = indicator.get("municipalExposure") or {}
                reference = decision_references.get(indicator_id, {})
                evidence = indicator.get("evidence") or {}
                actual_classification = (
                    (indicator.get("decisionReading") or {}).get("classification") or ""
                )
                expected_classification = _expected_decision_classification(indicator)
                conforms = actual_classification == expected_classification
                reasons = list(evidence.get("reasonCodes") or [])
                reasons.extend(reference.get("selectionReasonCodes") or [])
                writer.writerow(
                    {
                        "municipio": municipality_name,
                        "indicador": indicator.get("title") or indicator_id,
                        "valor": _text(indicator.get("rawValue")),
                        "meta": _text((indicator.get("configuredReference") or {}).get("value")),
                        "evidencia": indicator.get("evidenceLevel") or "not_available",
                        "motivo_evidencia": "|".join(
                            str(reason) for reason in evidence.get("reasonCodes") or []
                        ),
                        "trajetoria": (indicator.get("trajectory") or {}).get("paceStatus") or "",
                        "pares": (
                            _text(peers.get("performancePercentile"))
                            if peers.get("status") == "available"
                            else peers.get("reasonCode") or "unavailable"
                        ),
                        "governabilidade": (indicator.get("governance") or {}).get("classification") or "",
                        "exposicao": (
                            _text(exposure.get("municipalDenominatorShare"))
                            if exposure.get("status") == "available"
                            else exposure.get("reasonCode") or "unavailable"
                        ),
                        "classificacao": actual_classification,
                        "colecao_selecionada": reference.get("collection") or "",
                        "presenca_cabecalho": "sim" if indicator_id == header_indicator_id else "nao",
                        "presenca_financiamento": "sim" if indicator_id in financing_ids else "nao",
                        "classificacao_esperada": expected_classification,
                        "conformidade": "conforme" if conforms else "divergente",
                        "divergencia": "" if conforms else f"esperado={expected_classification};observado={actual_classification}",
                        "razoes": "|".join(dict.fromkeys(str(reason) for reason in reasons)),
                        "posicao_anterior": _text(legacy_positions.get(indicator_id)),
                        "posicao_nova": _text(reference.get("selectionPosition")),
                    }
                )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--classification-output", type=Path, default=DEFAULT_SUMMARY_OUTPUT)
    parser.add_argument("--sample-output", type=Path, default=DEFAULT_SAMPLE_OUTPUT)
    parser.add_argument("--skip-sample", action="store_true")
    args = parser.parse_args()

    contracts = list(_contracts())
    write_classification_summary(contracts, args.classification_output)
    if not args.skip_sample:
        write_sample_audit(contracts, args.sample_output)
        nova_santa_rita = next(
            contract
            for contract in contracts
            if contract.get("municipalityName") == "Nova Santa Rita"
        )
        NOVA_SANTA_RITA_OUTPUT.write_text(
            json.dumps(nova_santa_rita, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    print(f"[audit] {len(contracts)} contratos; resumo: {args.classification_output}")
    if not args.skip_sample:
        print(f"[audit] amostra: {args.sample_output}")
        print(f"[audit] exemplo: {NOVA_SANTA_RITA_OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
