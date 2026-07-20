from __future__ import annotations

import argparse
import csv
import ftplib
import hashlib
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any

from pypdf import PdfReader


DATA_PIPELINE_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = DATA_PIPELINE_DIR.parent
sys.path.insert(0, str(DATA_PIPELINE_DIR))

from src.municipal_finance_p5b2 import (  # noqa: E402
    ADAPTER_VERSION,
    adapt_msc_rows,
    adapt_rreo_text,
    adapt_siope_rows,
    canonical_json,
    coverage_summary,
    sha256_bytes,
    siope_code_from_ibge,
    validate_poc_records,
)


ARTIFACT_DIR = PROJECT_DIR / "artifacts" / "municipal-finance-p5b2-a"
MUNICIPALITY_INDEX = PROJECT_DIR / "public" / "data" / "municipios_index.json"
SIOPE_CACHE = (
    DATA_PIPELINE_DIR
    / "cache"
    / "siope_indicadores_financeiros_educacionais"
    / "odata_json"
)
SIOPE_BASE = (
    "https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_SIOPE/versao/v1/odata/"
    "Indicadores_Siope(Ano_Consulta=@Ano_Consulta,Num_Peri=@Num_Peri,Sig_UF=@Sig_UF)"
)
RREO_FTP_DIR = "ftp://ftp.fnde.gov.br/web/siope/RREO/"
SICONFI_BASE = "https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt"
USER_AGENT = "DASHBOARD-PNE-REACT-P5B2-A/1.0"
ACCESSED_AT = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

SAMPLE_NAMES = (
    "Agudo",
    "Nova Santa Rita",
    "Porto Alegre",
    "André da Rocha",
    "Amaral Ferrador",
    "Santa Cruz do Sul",
    "Araricá",
    "Barra do Quaraí",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Auditoria P5-B2-A das fontes financeiras municipais")
    parser.add_argument(
        "--full-network-audit",
        action="store_true",
        help="Coleta cobertura MSC 2024 e DCA 2025 para os 497 municípios (respeita 1,05 s por chamada).",
    )
    parser.add_argument(
        "--coverage-only",
        action="store_true",
        help="Retoma somente a cobertura SICONFI, sem repetir as amostras e a listagem FTP.",
    )
    parser.add_argument(
        "--msc-sample-only",
        action="store_true",
        help="Regenera somente a amostra MSC.",
    )
    parser.add_argument("--delay", type=float, default=1.05)
    return parser.parse_args()


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def registry() -> list[dict[str, str]]:
    payload = json.loads(MUNICIPALITY_INDEX.read_text(encoding="utf-8"))
    rows = [
        {"name": item["nome"], "ibgeCode": item["id_municipio"], "slug": item["slug"]}
        for item in payload["municipios"]
    ]
    if len(rows) != 497 or len({row["ibgeCode"] for row in rows}) != 497:
        raise RuntimeError("Cadastro municipal não contém 497 chaves IBGE únicas")
    return sorted(rows, key=lambda row: row["ibgeCode"])


def sample_registry(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    by_name = {row["name"]: row for row in rows}
    missing = [name for name in SAMPLE_NAMES if name not in by_name]
    if missing:
        raise RuntimeError(f"Municípios da amostra ausentes: {missing}")
    return [by_name[name] for name in SAMPLE_NAMES]


def siope_cache(year: int) -> tuple[dict[str, Any], list[dict[str, Any]], bytes]:
    path = SIOPE_CACHE / f"siope_indicadores_RS_{year}_p6.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = [item for page in payload["pages"] for item in page["response"]["value"]]
    normalized = canonical_json(sorted(rows, key=lambda row: (str(row.get("COD_MUNI")), str(row["COD_EXIB"]))))
    return payload, rows, normalized


def build_siope_artifacts(rows: list[dict[str, str]], sample: list[dict[str, str]]) -> dict[str, Any]:
    snapshots = {}
    for year in (2024, 2025):
        metadata, source_rows, normalized = siope_cache(year)
        snapshots[year] = {
            "metadata": metadata,
            "rows": source_rows,
            "hash": sha256_bytes(normalized),
        }
    by_siope = {siope_code_from_ibge(row["ibgeCode"]): row for row in rows}
    selected_codes = {siope_code_from_ibge(row["ibgeCode"]) for row in sample}
    sample_records = adapt_siope_rows(
        [row for row in snapshots[2024]["rows"] if str(row.get("COD_MUNI")) in selected_codes],
        by_siope,
        source_url=f"{SIOPE_BASE}?@Ano_Consulta=2024&@Num_Peri=6&@Sig_UF='RS'",
        source_hash=snapshots[2024]["hash"],
        accessed_at=ACCESSED_AT,
        published_at=None,
    )
    missing_name = "Barra do Quaraí"
    missing = next(row for row in sample if row["name"] == missing_name)
    for concept, unit in (
        ("mde_applied_value", "BRL"),
        ("mde_application_rate", "percent"),
        ("fundeb_professionals_remuneration_rate", "percent"),
        ("fundeb_financial_balance", "BRL"),
    ):
        sample_records.append(
            {
                "municipality": missing["name"],
                "ibgeCode": missing["ibgeCode"],
                "referenceYear": 2025,
                "period": "bimestre_6",
                "concept": concept,
                "financialStage": "calculated_indicator",
                "amountNature": "municipal_declared",
                "value": None,
                "sourceId": "fnde_siope_indicators_odata",
                "sourceUrl": f"{SIOPE_BASE}?@Ano_Consulta=2025&@Num_Peri=6&@Sig_UF='RS'",
                "sourceHash": snapshots[2025]["hash"],
                "publishedAt": None,
                "accessedAt": ACCESSED_AT,
                "adapterVersion": ADAPTER_VERSION,
                "notes": f"Indicador {unit} ausente para o município no recorte oficial 2025/P6; ausência preservada como null.",
            }
        )
    sample_records.sort(key=lambda row: (row["ibgeCode"], row["referenceYear"], row["concept"]))
    validate_poc_records(sample_records)
    write_json(ARTIFACT_DIR / "fnde-siope-indicators-odata-sample.json", sample_records)

    counts: dict[int, dict[str, int]] = {}
    for year, snapshot in snapshots.items():
        count: dict[str, int] = {}
        for item in snapshot["rows"]:
            if item.get("COD_MUNI") is not None:
                code = str(item["COD_MUNI"])
                count[code] = count.get(code, 0) + 1
        counts[year] = count
    coverage_rows = [
        {
            "source_id": "fnde_siope_indicators_odata",
            "ibge_code": row["ibgeCode"],
            "municipality": row["name"],
            "records_2024_p6": counts[2024].get(siope_code_from_ibge(row["ibgeCode"]), 0),
            "status_2024_p6": "covered" if siope_code_from_ibge(row["ibgeCode"]) in counts[2024] else "missing",
            "records_2025_p6": counts[2025].get(siope_code_from_ibge(row["ibgeCode"]), 0),
            "status_2025_p6": "covered" if siope_code_from_ibge(row["ibgeCode"]) in counts[2025] else "missing",
            "accessed_at": ACCESSED_AT,
        }
        for row in rows
    ]
    write_csv(
        ARTIFACT_DIR / "fnde-siope-indicators-odata-coverage.csv",
        list(coverage_rows[0]),
        coverage_rows,
    )
    return {
        str(year): {
            **coverage_summary(
                [by_siope[code]["ibgeCode"] for code in counts[year] if code in by_siope],
                [row["ibgeCode"] for row in rows],
            ),
            "normalizedHash": snapshots[year]["hash"],
            "generatedAt": snapshots[year]["metadata"]["generated_at"],
        }
        for year in (2024, 2025)
    }


def ftp_names() -> list[str]:
    ftp = ftplib.FTP("ftp.fnde.gov.br", timeout=180)
    ftp.login()
    ftp.cwd("/web/siope/RREO")
    names = ftp.nlst()
    ftp.quit()
    return sorted(names)


def read_url(url: str, timeout: int = 180) -> tuple[bytes, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json,*/*"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read(), response.headers


def header_date(headers: Any) -> str | None:
    value = headers.get("Last-Modified") or headers.get("Date")
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    except (TypeError, ValueError):
        return str(value)


def build_rreo_artifacts(rows: list[dict[str, str]], sample: list[dict[str, str]]) -> dict[str, Any]:
    first_names = ftp_names()
    time.sleep(1.0)
    second_names = ftp_names()
    first_hash = sha256_bytes("\n".join(first_names).encode("utf-8"))
    second_hash = sha256_bytes("\n".join(second_names).encode("utf-8"))
    if first_hash != second_hash:
        raise RuntimeError("Listagem RREO mudou entre as duas execuções")
    available: dict[int, set[str]] = {}
    for year in (2024, 2025):
        pattern = re.compile(rf"RREO_Municipal_(43\d{{4}})_6_{year}\.pdf$")
        available[year] = {match.group(1) for name in first_names if (match := pattern.fullmatch(name))}

    records: list[dict[str, Any]] = []
    for municipality in sample:
        if municipality["name"] == "Barra do Quaraí":
            continue
        code6 = siope_code_from_ibge(municipality["ibgeCode"])
        url = f"{RREO_FTP_DIR}RREO_Municipal_{code6}_6_2024.pdf"
        content, headers = read_url(url)
        temporary = ARTIFACT_DIR / f".rreo-{code6}.pdf"
        temporary.parent.mkdir(parents=True, exist_ok=True)
        temporary.write_bytes(content)
        try:
            text = "\n".join(page.extract_text() or "" for page in PdfReader(str(temporary)).pages)
        finally:
            temporary.unlink(missing_ok=True)
        records.extend(
            adapt_rreo_text(
                text,
                municipality=municipality["name"],
                ibge_code=municipality["ibgeCode"],
                reference_year=2024,
                bimester=6,
                source_url=url,
                source_hash=sha256_bytes(content),
                accessed_at=ACCESSED_AT,
                published_at=header_date(headers),
            )
        )
        time.sleep(0.25)
    missing = next(row for row in sample if row["name"] == "Barra do Quaraí")
    for concept, stage in (
        ("fundeb_total_received", "received"),
        ("fundeb_professionals_remuneration_rate", "calculated_indicator"),
        ("mde_application_rate", "calculated_indicator"),
    ):
        records.append(
            {
                "municipality": missing["name"],
                "ibgeCode": missing["ibgeCode"],
                "referenceYear": 2025,
                "period": "bimestre_6",
                "concept": concept,
                "financialStage": stage,
                "amountNature": "municipal_declared",
                "value": None,
                "sourceId": "fnde_siope_rreo_annex8_pdf",
                "sourceUrl": RREO_FTP_DIR,
                "sourceHash": first_hash,
                "publishedAt": None,
                "accessedAt": ACCESSED_AT,
                "adapterVersion": ADAPTER_VERSION,
                "notes": "PDF 2025/P6 ausente na listagem oficial; ausência preservada como null.",
            }
        )
    records.sort(key=lambda row: (row["ibgeCode"], row["referenceYear"], row["concept"]))
    validate_poc_records(records)
    write_json(ARTIFACT_DIR / "fnde-siope-rreo-annex8-pdf-sample.json", records)

    coverage_rows = [
        {
            "source_id": "fnde_siope_rreo_annex8_pdf",
            "ibge_code": row["ibgeCode"],
            "municipality": row["name"],
            "status_2024_p6": "covered" if siope_code_from_ibge(row["ibgeCode"]) in available[2024] else "missing",
            "status_2025_p6": "covered" if siope_code_from_ibge(row["ibgeCode"]) in available[2025] else "missing",
            "directory_hash": first_hash,
            "accessed_at": ACCESSED_AT,
        }
        for row in rows
    ]
    write_csv(
        ARTIFACT_DIR / "fnde-siope-rreo-annex8-pdf-coverage.csv",
        list(coverage_rows[0]),
        coverage_rows,
    )
    return {
        "listingRuns": [first_hash, second_hash],
        "2024": coverage_summary(
            [row["ibgeCode"] for row in rows if siope_code_from_ibge(row["ibgeCode"]) in available[2024]],
            [row["ibgeCode"] for row in rows],
        ),
        "2025": coverage_summary(
            [row["ibgeCode"] for row in rows if siope_code_from_ibge(row["ibgeCode"]) in available[2025]],
            [row["ibgeCode"] for row in rows],
        ),
    }


def siconfi_json(endpoint: str, params: dict[str, Any]) -> tuple[dict[str, Any], bytes, str]:
    url = f"{SICONFI_BASE}/{endpoint}?{urllib.parse.urlencode(params)}"
    content, _ = read_url(url)
    return json.loads(content), content, url


def msc_publication(items: list[dict[str, Any]]) -> str | None:
    dates = [
        item["data_status"]
        for item in items
        if item.get("entregavel") == "MSC Agregada" and item.get("periodo") == 12 and item.get("data_status")
    ]
    return max(dates) if dates else None


def plain_text(value: Any) -> str:
    normalized = unicodedata.normalize("NFKD", str(value or ""))
    return " ".join(
        "".join(char for char in normalized if not unicodedata.combining(char))
        .lower()
        .split()
    )


def build_msc_sample(sample: list[dict[str, str]], delay: float) -> None:
    records: list[dict[str, Any]] = []
    for position, municipality in enumerate(sample, start=1):
        delivery, _, _ = siconfi_json(
            "extrato_entregas",
            {"id_ente": municipality["ibgeCode"], "an_referencia": 2024},
        )
        time.sleep(delay)
        params = {
            "id_ente": municipality["ibgeCode"],
            "an_referencia": 2024,
            "me_referencia": 12,
            "co_tipo_matriz": "MSCE",
            "classe_conta": 6,
            "id_tv": "period_change",
        }
        payload, content, url = siconfi_json("msc_orcamentaria", params)
        adapted = adapt_msc_rows(
            payload.get("items") or [],
            municipality["name"],
            source_url=url,
            source_hash=sha256_bytes(content),
            accessed_at=ACCESSED_AT,
            published_at=msc_publication(delivery.get("items") or []),
        )
        if not adapted:
            adapted.append(
                {
                    "municipality": municipality["name"],
                    "ibgeCode": municipality["ibgeCode"],
                    "referenceYear": 2024,
                    "period": "mes_12",
                    "concept": "education_paid_by_nature",
                    "financialStage": "paid",
                    "amountNature": "municipal_declared",
                    "value": None,
                    "sourceId": "siconfi_msc_orcamentaria",
                    "sourceUrl": url,
                    "sourceHash": sha256_bytes(content),
                    "publishedAt": msc_publication(delivery.get("items") or []),
                    "accessedAt": ACCESSED_AT,
                    "adapterVersion": ADAPTER_VERSION,
                    "notes": "Conta paga 6.2.2.1.3.05.00 ausente no recorte MSCE; ausência preservada como null.",
                    "dimensions": {
                        "function": "12",
                        "account": "622130500",
                        "managementUnit": None,
                    },
                }
            )
        records.extend(adapted)
        print(f"[P5-B2-A] amostra MSC {position}/{len(sample)}", flush=True)
        time.sleep(delay)
    validate_poc_records(records)
    write_json(ARTIFACT_DIR / "siconfi-msc-orcamentaria-sample.json", records)


def collect_full_coverage(rows: list[dict[str, str]], delay: float) -> dict[str, Any]:
    coverage_path = ARTIFACT_DIR / "siconfi-msc-orcamentaria-coverage.csv"
    existing: dict[str, dict[str, Any]] = {}
    if coverage_path.exists():
        with coverage_path.open(encoding="utf-8", newline="") as handle:
            existing = {row["ibge_code"]: row for row in csv.DictReader(handle)}
    dca_2025_covered: list[str] = []
    dca_2025_errors: list[str] = []
    coverage_rows: list[dict[str, Any]] = []
    for position, municipality in enumerate(rows, start=1):
        code = municipality["ibgeCode"]
        previous = existing.get(code)
        if (
            previous
            and previous.get("audit_complete") == "true"
            and previous.get("msc_2024_december_status") != "error"
            and previous.get("dca_2025_status") != "error"
        ):
            row = previous
            if row.get("dca_2025_status") == "covered":
                dca_2025_covered.append(code)
            elif row.get("dca_2025_status") == "error":
                dca_2025_errors.append(code)
            coverage_rows.append(row)
            continue
        try:
            delivery, delivery_content, delivery_url = siconfi_json(
                "extrato_entregas", {"id_ente": code, "an_referencia": 2024}
            )
            delivery_items = delivery.get("items") or []
            msc_rows = [
                item
                for item in delivery_items
                if item.get("entregavel") == "MSC Agregada" and item.get("periodo") == 12
            ]
            msc_status = "covered" if msc_rows else "missing"
            msc_error = ""
        except Exception as error:  # pragma: no cover - rede externa
            delivery_content = b""
            delivery_url = ""
            msc_rows = []
            msc_status = "error"
            msc_error = f"{type(error).__name__}: {error}"
        time.sleep(delay)
        try:
            dca, dca_content, dca_url = siconfi_json(
                "dca",
                {
                    "an_exercicio": 2025,
                    "no_anexo": "DCA-Anexo I-E",
                    "co_esfera": "M",
                    "id_ente": code,
                },
            )
            education_rows = [
                item for item in dca.get("items") or [] if plain_text(item.get("conta")) == "12 - educacao"
            ]
            dca_status = "covered" if education_rows else "missing"
            dca_error = ""
        except Exception as error:  # pragma: no cover - rede externa
            dca_content = b""
            dca_url = ""
            education_rows = []
            dca_status = "error"
            dca_error = f"{type(error).__name__}: {error}"
        time.sleep(delay)
        if dca_status == "covered":
            dca_2025_covered.append(code)
        elif dca_status == "error":
            dca_2025_errors.append(code)
        coverage_rows.append(
            {
                "source_id": "siconfi_msc_orcamentaria",
                "ibge_code": code,
                "municipality": municipality["name"],
                "msc_2024_december_status": msc_status,
                "msc_2024_december_deliveries": len(msc_rows),
                "msc_delivery_url": delivery_url,
                "msc_delivery_hash": sha256_bytes(delivery_content) if delivery_content else "",
                "msc_error": msc_error,
                "dca_2025_status": dca_status,
                "dca_2025_education_rows": len(education_rows),
                "dca_2025_url": dca_url,
                "dca_2025_hash": sha256_bytes(dca_content) if dca_content else "",
                "dca_2025_error": dca_error,
                "audit_complete": "true" if msc_status != "error" and dca_status != "error" else "false",
                "accessed_at": ACCESSED_AT,
            }
        )
        if position % 10 == 0 or position == len(rows):
            coverage_rows.sort(key=lambda item: item["ibge_code"])
            write_csv(coverage_path, list(coverage_rows[0]), coverage_rows)
            print(f"[P5-B2-A] cobertura SICONFI {position}/{len(rows)}", flush=True)
    coverage_rows.sort(key=lambda item: item["ibge_code"])
    write_csv(coverage_path, list(coverage_rows[0]), coverage_rows)
    msc_covered = [row["ibge_code"] for row in coverage_rows if row["msc_2024_december_status"] == "covered"]
    return {
        "msc2024": coverage_summary(msc_covered, [row["ibgeCode"] for row in rows]),
        "dca2025": coverage_summary(dca_2025_covered, [row["ibgeCode"] for row in rows]),
        "dca2025RequestErrors": sorted(dca_2025_errors),
    }


def main() -> None:
    args = parse_args()
    rows = registry()
    sample = sample_registry(rows)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    results_path = ARTIFACT_DIR / "audit-results.json"
    if args.msc_sample_only:
        build_msc_sample(sample, args.delay)
        results = json.loads(results_path.read_text(encoding="utf-8")) if results_path.exists() else {
            "adapterVersion": ADAPTER_VERSION,
            "accessedAt": ACCESSED_AT,
        }
    elif args.coverage_only:
        results = json.loads(results_path.read_text(encoding="utf-8")) if results_path.exists() else {
            "adapterVersion": ADAPTER_VERSION,
            "accessedAt": ACCESSED_AT,
        }
        results["siconfi"] = collect_full_coverage(rows, args.delay)
    else:
        results = {
            "adapterVersion": ADAPTER_VERSION,
            "accessedAt": ACCESSED_AT,
            "siope": build_siope_artifacts(rows, sample),
            "rreo": build_rreo_artifacts(rows, sample),
        }
        build_msc_sample(sample, args.delay)
    if args.full_network_audit and not args.coverage_only:
        results["siconfi"] = collect_full_coverage(rows, args.delay)
    write_json(results_path, results)
    print(json.dumps(results, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    main()
